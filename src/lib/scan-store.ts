"use client";

/* ===========================================================================
 * THE SCANNER'S LOCAL STORE
 *
 * Everything a gate device needs to work with no signal:
 *   - the cached guest list (ticket -> name, already-in flag)
 *   - the queue of scans not yet pushed to the server
 *
 * IndexedDB rather than localStorage: a few thousand guests is more than
 * localStorage's ~5MB budget wants to hold, and writes here don't block the
 * main thread while the camera is running.
 * ========================================================================= */

const DB_NAME = "ref2-gate";
const DB_VERSION = 1;
const GUESTS = "guests";
const QUEUE = "queue";
const META = "meta";

export type Guest = {
  /** ticket */
  t: string;
  /** first name + last initial — see the manifest route for why it's trimmed */
  n: string;
  /** already checked in, according to the last sync */
  in: boolean;
};

export type QueuedScan = {
  id: string;
  ticket: string;
  scannedAt: string;
  localResult: ScanResult;
  /** set once the server has ruled on it */
  serverResult?: ScanResult;
};

export type ScanResult = "admitted" | "duplicate" | "unknown" | "bad_signature";

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(GUESTS)) db.createObjectStore(GUESTS, { keyPath: "t" });
      if (!db.objectStoreNames.contains(QUEUE)) db.createObjectStore(QUEUE, { keyPath: "id" });
      if (!db.objectStoreNames.contains(META)) db.createObjectStore(META);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  store: string,
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return open().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(store, mode);
        const req = fn(t.objectStore(store));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
      }),
  );
}

/* --- guest list ---------------------------------------------------------- */

export async function replaceGuests(guests: Guest[], syncedAt: string) {
  const db = await open();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction([GUESTS, META], "readwrite");
    const store = t.objectStore(GUESTS);
    store.clear();
    for (const g of guests) store.put(g);
    t.objectStore(META).put(syncedAt, "syncedAt");
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
  db.close();
}

export function getGuest(ticket: string) {
  return tx<Guest | undefined>(GUESTS, "readonly", (s) => s.get(ticket));
}

export async function markGuestIn(ticket: string) {
  const g = await getGuest(ticket);
  if (!g) return;
  await tx(GUESTS, "readwrite", (s) => s.put({ ...g, in: true }));
}

export function guestCount() {
  return tx<number>(GUESTS, "readonly", (s) => s.count());
}

export function lastSyncedAt() {
  return tx<string | undefined>(META, "readonly", (s) => s.get("syncedAt"));
}

/* --- the outbound queue --------------------------------------------------- */

export function enqueue(scan: QueuedScan) {
  return tx(QUEUE, "readwrite", (s) => s.put(scan));
}

export function allQueued() {
  return tx<QueuedScan[]>(QUEUE, "readonly", (s) => s.getAll());
}

export async function pendingQueue() {
  return (await allQueued()).filter((s) => !s.serverResult);
}

export function updateQueued(scan: QueuedScan) {
  return tx(QUEUE, "readwrite", (s) => s.put(scan));
}

/** Keeps the last `keep` settled scans for the review list, drops the rest. */
export async function pruneSettled(keep = 200) {
  const all = await allQueued();
  const settled = all
    .filter((s) => s.serverResult)
    .sort((a, b) => b.scannedAt.localeCompare(a.scannedAt));
  const drop = settled.slice(keep);
  if (!drop.length) return;
  const db = await open();
  const t = db.transaction(QUEUE, "readwrite");
  for (const s of drop) t.objectStore(QUEUE).delete(s.id);
  t.oncomplete = () => db.close();
}

export async function clearEverything() {
  const db = await open();
  const t = db.transaction([GUESTS, QUEUE, META], "readwrite");
  t.objectStore(GUESTS).clear();
  t.objectStore(QUEUE).clear();
  t.objectStore(META).clear();
  await new Promise((r) => (t.oncomplete = r));
  db.close();
}

/* ===========================================================================
 * THE STORE AS AN EXTERNAL SOURCE
 *
 * The gate UI reads this through useSyncExternalStore rather than copying it
 * into React state inside an effect — IndexedDB is an external system, and
 * treating it as one keeps every write (scan, sync, manifest pull) flowing to
 * every reader with no cascading renders.
 * ========================================================================= */

export type GateSnapshot = {
  guests: number;
  pending: number;
  syncedAt: string | null;
  syncing: boolean;
  history: QueuedScan[];
  loaded: boolean;
};

const EMPTY: GateSnapshot = {
  guests: 0,
  pending: 0,
  syncedAt: null,
  syncing: false,
  history: [],
  loaded: false,
};

let snapshot: GateSnapshot = EMPTY;
const listeners = new Set<() => void>();
let refreshing: Promise<void> | null = null;

function emit() {
  for (const l of listeners) l();
}

export function gateSnapshot() {
  return snapshot;
}

/** Stable object for SSR, so the server and first client render agree. */
export function gateServerSnapshot() {
  return EMPTY;
}

export function subscribeGate(listener: () => void) {
  listeners.add(listener);
  // First subscriber kicks off the initial read.
  if (!snapshot.loaded) void refreshGate();
  return () => {
    listeners.delete(listener);
  };
}

export function setSyncing(syncing: boolean) {
  if (snapshot.syncing === syncing) return;
  snapshot = { ...snapshot, syncing };
  emit();
}

/** Re-reads everything from IndexedDB and publishes a new snapshot. */
export async function refreshGate(): Promise<void> {
  if (refreshing) return refreshing;
  refreshing = (async () => {
    const [guests, all, syncedAt] = await Promise.all([
      guestCount(),
      allQueued(),
      lastSyncedAt(),
    ]);
    snapshot = {
      guests,
      pending: all.filter((s) => !s.serverResult).length,
      syncedAt: syncedAt ?? null,
      syncing: snapshot.syncing,
      history: all.sort((a, b) => b.scannedAt.localeCompare(a.scannedAt)).slice(0, 60),
      loaded: true,
    };
    emit();
  })().finally(() => {
    refreshing = null;
  });
  return refreshing;
}
