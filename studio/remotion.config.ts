import { Config } from "@remotion/cli/config";

// 使用环境里预装的无头 Chromium，避免渲染时再去下载浏览器
Config.setBrowserExecutable(
  "/opt/pw-browsers/chromium_headless_shell-1243/chrome-headless-shell-linux64/chrome-headless-shell"
);
Config.setChromiumOpenGlRenderer("swangle"); // 服务器无显卡，用软件渲染提供 WebGL
Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
