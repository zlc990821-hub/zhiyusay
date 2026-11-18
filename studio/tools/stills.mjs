// 一次打包，渲染同一合成的多个关键帧，用于截帧检查
// 用法：node tools/stills.mjs 合成ID 输出目录 帧1,帧2,...
import { bundle } from "@remotion/bundler";
import { renderStill, selectComposition } from "@remotion/renderer";
import path from "node:path";
import fs from "node:fs";
const [id, outDir, frames] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const serveUrl = await bundle({ entryPoint: path.resolve("src/index.ts") });
const browserExecutable = "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell";
const chromiumOptions = { gl: "swangle" };
const composition = await selectComposition({ serveUrl, id, browserExecutable, chromiumOptions });
for (const f of frames.split(",").map(Number)) {
  await renderStill({ composition, serveUrl, frame: f, output: path.join(outDir, `${id}_${String(f).padStart(5, "0")}.jpg`), imageFormat: "jpeg", browserExecutable, chromiumOptions, scale: 0.5 });
  console.log("ok", f);
}
