import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

process.env.NODE_ENV ??= "development";

const here = path.dirname(fileURLToPath(import.meta.url));

const build = spawnSync(process.execPath, ["./build.mjs"], {
  cwd: here,
  stdio: "inherit",
  env: process.env,
});

if (build.status !== 0) {
  process.exit(build.status ?? 1);
}

const start = spawnSync(
  process.execPath,
  ["--enable-source-maps", "./dist/index.mjs"],
  {
    cwd: here,
    stdio: "inherit",
    env: process.env,
  },
);

process.exit(start.status ?? 0);
