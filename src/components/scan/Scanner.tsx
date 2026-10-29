"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BrowserQRCodeReader } from "@zxing/browser";

/**
 * The camera.
 *
 * It decodes ONLY what is inside the on-screen guide, never the whole frame.
 * That matters the moment more than one ticket is visible — a printed sheet,
 * two people holding phones side by side, a poster behind someone's head:
 *
 *   - the native BarcodeDetector returns every code it can see, and taking the
 *     first one means the scanner reads the same ticket no matter where it is
 *     pointed;
 *   - ZXing decodes a frame as a whole and simply fails when several codes are
 *     in it, so the scanner goes completely silent.
 *
 * Cropping to the guide fixes both, and makes the guide mean what it looks
 * like it means: aim at the one you want.
 *
 * Uses the platform BarcodeDetector where it exists (fast, native) and falls
 * back to ZXing everywhere else — iOS Safari in particular.
 */

/** Side of the decode window, as a fraction of the square preview. Must match
 *  the guide drawn below, or the scanner reads something the steward can't see. */
export const GUIDE_FRACTION = 0.62;

/** Cap on the canvas we hand the decoder; bigger buys nothing and costs CPU. */
const MAX_DECODE_PX = 640;

type Detector = {
  detect: (s: CanvasImageSource) => Promise<
    { rawValue: string; boundingBox?: { x: number; y: number; width: number; height: number } }[]
  >;
};

export default function Scanner({
  onScan,
  paused,
  cooldownMs = 2200,
}: {
  onScan: (text: string) => void;
  paused: boolean;
  cooldownMs?: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const lastRef = useRef<{ text: string; at: number }>({ text: "", at: 0 });

  /* The camera must be opened exactly once. Anything the decode loop needs to
     read live goes through a ref — if the effect depended on `paused`, on
     `onScan`'s identity or on `cooldownMs`, every render would stop the camera
     stream and start a new one, which on a real phone shows as a flicker and
     a scanner that never settles long enough to read a code. */
  const pausedRef = useRef(paused);
  const onScanRef = useRef(onScan);
  const cooldownRef = useRef(cooldownMs);
  useEffect(() => {
    pausedRef.current = paused;
    onScanRef.current = onScan;
    cooldownRef.current = cooldownMs;
  }, [paused, onScan, cooldownMs]);

  const emit = useCallback((text: string) => {
    if (pausedRef.current) return;
    const now = Date.now();
    const last = lastRef.current;
    if (text === last.text && now - last.at < cooldownRef.current) return;
    lastRef.current = { text, at: now };
    onScanRef.current(text);
  }, []);

  useEffect(() => {
    let stopped = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;

    /* getUserMedia can hang indefinitely — an unanswered permission prompt, a
       camera held by another app, a locked-down work phone. Without this the
       steward stares at "Starting the camera…" and never learns there is a
       manual option. */
    const watchdog = setTimeout(() => {
      if (!stopped) {
        setError("The camera is taking too long to start. Use Enter code instead.");
      }
    }, 6000);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });

    /**
     * Copies the guide area out of the video.
     *
     * The preview is a square with object-cover, so what the steward sees is a
     * centred square crop of the camera frame; the guide is a centred square
     * inside that. Both reduce to one centred square of the shorter side.
     */
    function drawArea(video: HTMLVideoElement, fraction: number) {
      if (!ctx) return false;
      const vw = video.videoWidth;
      const vh = video.videoHeight;
      if (!vw || !vh) return false;

      const side = Math.min(vw, vh) * fraction;
      const sx = (vw - side) / 2;
      const sy = (vh - side) / 2;
      const out = Math.min(Math.round(side), MAX_DECODE_PX);

      if (canvas.width !== out) {
        canvas.width = out;
        canvas.height = out;
      }
      ctx.drawImage(video, sx, sy, side, side, 0, 0, out, out);
      return true;
    }

    /** With more than one code inside the guide, take the most centred. */
    function mostCentred(
      hits: { rawValue: string; boundingBox?: { x: number; y: number; width: number; height: number } }[],
    ) {
      if (hits.length === 1) return hits[0].rawValue;
      const mid = canvas.width / 2;
      let best = hits[0];
      let bestDist = Infinity;
      for (const hit of hits) {
        const box = hit.boundingBox;
        const cx = box ? box.x + box.width / 2 : mid;
        const cy = box ? box.y + box.height / 2 : mid;
        const dist = (cx - mid) ** 2 + (cy - mid) ** 2;
        if (dist < bestDist) {
          bestDist = dist;
          best = hit;
        }
      }
      return best.rawValue;
    }

    async function start() {
      const video = videoRef.current;
      if (!video) return;

      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
      } catch (err) {
        clearTimeout(watchdog);
        setError(
          err instanceof DOMException && err.name === "NotAllowedError"
            ? "Camera access was refused. Allow it in your browser settings, then reload."
            : "Couldn't open the camera. Use Enter code instead.",
        );
        return;
      }
      clearTimeout(watchdog);
      if (stopped) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      video.srcObject = stream;
      await video.play().catch(() => {});
      setReady(true);

      const Native = (window as unknown as { BarcodeDetector?: new (o: { formats: string[] }) => Detector })
        .BarcodeDetector;

      // Native decoding is cheap enough to run often; ZXing is not.
      const detector = Native ? new Native({ formats: ["qr_code"] }) : null;
      const zxing = Native ? null : new BrowserQRCodeReader();
      const interval = Native ? 120 : 200;

      /** Decodes whatever is currently on the canvas. Returns the text, or null.
       *  `requireSingle` refuses an ambiguous frame rather than guessing. */
      const decodeCanvas = async (requireSingle: boolean) => {
        try {
          if (detector) {
            const hits = await detector.detect(canvas);
            if (!hits.length) return null;
            if (requireSingle && hits.length > 1) return null;
            return mostCentred(hits);
          }
          if (zxing) {
            // ZXing fails outright on a frame holding several codes, so a
            // result here already implies one readable code.
            return zxing.decodeFromCanvas(canvas)?.getText() ?? null;
          }
        } catch {
          /* nothing readable this frame — by far the common case */
        }
        return null;
      };

      let wideTurn = false;

      const tick = async () => {
        if (stopped) return;

        // Nothing to decode while a verdict is up, but keep the loop alive.
        if (!pausedRef.current) {
          let text: string | null = null;

          // Preferred: only what's inside the guide, so aiming picks the
          // ticket when several are in shot.
          if (drawArea(video, GUIDE_FRACTION)) {
            text = await decodeCanvas(false);
          }

          // Nothing in the guide? Someone may be holding the code right up to
          // the lens, filling the frame and spilling past the box. Try the
          // whole view — but only accept it when there is exactly one code,
          // so this can never reintroduce the guess-the-ticket problem.
          if (!text && wideTurn && drawArea(video, 1)) {
            text = await decodeCanvas(true);
          }
          wideTurn = !wideTurn;

          if (text) emit(text);
        }

        if (!stopped) timer = setTimeout(tick, interval);
      };

      void tick();
    }

    void start();

    return () => {
      stopped = true;
      clearTimeout(watchdog);
      clearTimeout(timer);
      stream?.getTracks().forEach((t) => t.stop());
    };
  }, [emit]);

  const guidePct = `${GUIDE_FRACTION * 100}%`;

  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-black">
      <video
        ref={videoRef}
        playsInline
        muted
        className="h-full w-full object-cover"
        aria-label="Camera view — point the box at one ticket's QR code"
      />

      {ready && !error && (
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 grid place-items-center">
          {/* One element dims everything outside the decode window: a spread
              box-shadow fills the rest of the preview, with no seams. */}
          <div
            className="relative rounded-lg shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]"
            style={{ height: guidePct, width: guidePct }}
          >
            {(
              [
                "-left-1 -top-1 border-l-4 border-t-4 rounded-tl-xl",
                "-right-1 -top-1 border-r-4 border-t-4 rounded-tr-xl",
                "-left-1 -bottom-1 border-b-4 border-l-4 rounded-bl-xl",
                "-right-1 -bottom-1 border-b-4 border-r-4 rounded-br-xl",
              ] as const
            ).map((cls) => (
              <span key={cls} className={`absolute h-9 w-9 border-yellow-deep ${cls}`} />
            ))}
          </div>
          <p className="absolute inset-x-0 bottom-3 text-center text-[11px] font-bold uppercase tracking-widest text-white/80">
            One ticket in the box
          </p>
        </div>
      )}

      {paused && <div className="absolute inset-0 bg-black/55 backdrop-blur-[2px]" aria-hidden="true" />}

      {!ready && !error && (
        <p className="absolute inset-0 grid place-items-center px-6 text-center text-sm font-semibold text-white/80">
          Starting the camera…
        </p>
      )}

      {error && (
        <div className="absolute inset-0 grid place-items-center bg-ink px-6 text-center">
          <p className="text-sm font-semibold leading-relaxed text-cream">{error}</p>
        </div>
      )}
    </div>
  );
}
