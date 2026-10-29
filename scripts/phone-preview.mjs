/**
 * Serves the demo scanner to a phone over HTTPS on the local network.
 *
 *   npm run demo:build && npm run demo:phone
 *
 * Why HTTPS: getUserMedia only works in a secure context. Over plain http on a
 * LAN address the page loads fine and the camera silently never starts, which
 * looks like a broken app. localhost is exempt, a phone is not.
 *
 * This starts `next start` on an internal port and proxies it through a
 * self-signed HTTPS listener. The certificate is generated once into
 * .cert/ (gitignored) and names this machine's LAN IP, so the phone's warning
 * is the ordinary "unknown issuer" one rather than a name mismatch.
 *
 * Production mode on purpose: that is where the service worker registers, so
 * the install-to-home-screen and open-with-no-signal behaviour is real.
 */
import { spawn, execFileSync } from "node:child_process";
import { createServer } from "node:https";
import { request } from "node:http";
import { request as requestSecure } from "node:https";
import { createConnection } from "node:net";
import { existsSync, mkdirSync, readFileSync } from "node:fs";
import { networkInterfaces } from "node:os";

const HTTPS_PORT = Number(process.env.PORT ?? 3002);
const INTERNAL_PORT = HTTPS_PORT + 1;
const CERT_DIR = ".cert";

function lanAddress() {
  for (const list of Object.values(networkInterfaces())) {
    for (const net of list ?? []) {
      if (net.family === "IPv4" && !net.internal) return net.address;
    }
  }
  return "127.0.0.1";
}

const ip = lanAddress();

/* --- don't collide with a copy that is already running -------------------- */

const portFree = (port, host = "127.0.0.1") =>
  new Promise((resolve) => {
    const socket = createConnection({ port, host });
    socket.setTimeout(700);
    socket.on("connect", () => {
      socket.destroy();
      resolve(false);
    });
    const free = () => {
      socket.destroy();
      resolve(true);
    };
    socket.on("error", free);
    socket.on("timeout", free);
  });

/** Is the thing on that port our own scanner, or something else entirely? */
const alreadyOurs = () =>
  new Promise((resolve) => {
    const req = requestSecure(
      {
        host: "127.0.0.1",
        port: HTTPS_PORT,
        path: "/scan",
        method: "GET",
        rejectUnauthorized: false,
        timeout: 2500,
      },
      (res) => {
        let body = "";
        res.on("data", (c) => (body += c));
        res.on("end", () => resolve(res.statusCode === 200 && body.includes("Gate scanner")));
      },
    );
    req.on("error", () => resolve(false));
    req.on("timeout", () => {
      req.destroy();
      resolve(false);
    });
    req.end();
  });

const banner = (url) => `
┌────────────────────────────────────────────────────────────┐
  GATE SCANNER — phone preview

  On your phone, same Wi-Fi as this Mac, open:

      ${url}

  1. You'll get a certificate warning — it's a self-signed cert
     on your own network. Tap through it (Safari: Show Details →
     visit this website. Chrome: Advanced → Proceed).
  2. Staff PIN:  1234
  3. Add to Home Screen to run it as an app.
  4. Tap "Tickets" in the yellow bar for QR codes to scan —
     easiest from a second screen.

  Stop with Ctrl-C, or: npm run demo:stop
└────────────────────────────────────────────────────────────┘
`;

if (!(await portFree(HTTPS_PORT))) {
  if (await alreadyOurs()) {
    console.log(`The phone preview is already running — nothing to do.`);
    console.log(banner(`https://${ip}:${HTTPS_PORT}/scan`));
  } else {
    console.error(
      `Port ${HTTPS_PORT} is taken by something else.\n` +
        `  See what:   lsof -nP -iTCP:${HTTPS_PORT} -sTCP:LISTEN\n` +
        `  Or move me: PORT=4002 npm run demo:phone`,
    );
    process.exitCode = 1;
  }
  process.exit();
}

if (!(await portFree(INTERNAL_PORT))) {
  console.error(
    `Port ${INTERNAL_PORT} (used internally) is taken.\n` +
      `  Stop the stray process:  npm run demo:stop\n` +
      `  Or move me:              PORT=4002 npm run demo:phone`,
  );
  process.exit(1);
}

/* --- certificate ---------------------------------------------------------- */
const keyPath = `${CERT_DIR}/key.pem`;
const certPath = `${CERT_DIR}/cert.pem`;

if (!existsSync(keyPath) || !existsSync(certPath)) {
  mkdirSync(CERT_DIR, { recursive: true });
  console.log(`Generating a self-signed certificate for ${ip}…`);
  execFileSync(
    "openssl",
    [
      "req", "-x509", "-newkey", "rsa:2048", "-nodes",
      "-keyout", keyPath,
      "-out", certPath,
      "-days", "90",
      "-subj", "/CN=REF 2.0 Gate Scanner",
      "-addext", `subjectAltName=IP:${ip},IP:127.0.0.1,DNS:localhost`,
    ],
    { stdio: "inherit" },
  );
}

/* --- the app ------------------------------------------------------------- */
const app = spawn(
  "npx",
  ["next", "start", "-p", String(INTERNAL_PORT), "-H", "127.0.0.1"],
  { env: { ...process.env, NEXT_PUBLIC_SCANNER_DEMO: "1" }, stdio: "inherit" },
);

const shutdown = () => {
  app.kill();
  process.exit(0);
};
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// If the app dies, the HTTPS front door is useless — go down with it rather
// than leaving a listener that answers every request with 502.
app.on("exit", (code) => {
  if (code !== 0) console.error(`\nThe app exited (code ${code}). Stopping.`);
  process.exit(code ?? 0);
});

/* --- the HTTPS front door ------------------------------------------------- */
const proxy = createServer(
  { key: readFileSync(keyPath), cert: readFileSync(certPath) },
  (req, res) => {
    const upstream = request(
      {
        host: "127.0.0.1",
        port: INTERNAL_PORT,
        path: req.url,
        method: req.method,
        headers: { ...req.headers, host: `127.0.0.1:${INTERNAL_PORT}` },
      },
      (up) => {
        res.writeHead(up.statusCode ?? 502, up.headers);
        up.pipe(res);
      },
    );
    upstream.on("error", () => {
      res.writeHead(502, { "Content-Type": "text/plain" });
      res.end("The app is still starting — refresh in a moment.");
    });
    req.pipe(upstream);
  },
);

// Wait for Next to be listening before we announce the URL.
const waitForApp = () =>
  new Promise((resolve) => {
    const tick = () => {
      const probe = request(
        { host: "127.0.0.1", port: INTERNAL_PORT, path: "/scan", method: "HEAD" },
        () => resolve(),
      );
      probe.on("error", () => setTimeout(tick, 400));
      probe.end();
    };
    tick();
  });

proxy.listen(HTTPS_PORT, "0.0.0.0", async () => {
  await waitForApp();
  console.log(banner(`https://${ip}:${HTTPS_PORT}/scan`));
});
