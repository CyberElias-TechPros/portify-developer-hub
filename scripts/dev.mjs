#!/usr/bin/env node
/**
 * Runs the Cloudflare Worker (API + D1/R2 simulation) and the Vite dev server
 * side by side. Vite proxies /api to the Worker, so the browser talks to a
 * single origin exactly like production.
 *
 *   npm run dev:all
 */
import { spawn } from "node:child_process";
import process from "node:process";

const API_PORT = process.env.API_PORT || "8787";
const WEB_PORT = process.env.WEB_PORT || "8080";
const children = [];

function run(name, command, args, colour) {
  const child = spawn(command, args, {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, FORCE_COLOR: "1" },
    shell: process.platform === "win32",
  });
  const prefix = `\x1b[${colour}m[${name}]\x1b[0m `;
  const pipe = (stream) => {
    let buffer = "";
    stream.on("data", (chunk) => {
      buffer += chunk.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) process.stdout.write(`${prefix}${line}\n`);
    });
  };
  pipe(child.stdout);
  pipe(child.stderr);
  child.on("exit", (code) => {
    process.stdout.write(`${prefix}exited with code ${code}\n`);
    shutdown();
  });
  children.push(child);
  return child;
}

let shuttingDown = false;
function shutdown() {
  if (shuttingDown) return;
  shuttingDown = true;
  for (const child of children) {
    try {
      child.kill("SIGTERM");
    } catch {
      /* ignore */
    }
  }
  setTimeout(() => process.exit(0), 200);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

console.log(`\n  Portify — worker on :${API_PORT}, app on :${WEB_PORT}\n`);
run("api", "npx", ["wrangler", "dev", "--ip", "0.0.0.0", "--port", API_PORT], "35");
run("web", "npx", ["vite", "--host", "--port", WEB_PORT], "36");
