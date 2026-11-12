import { Config } from "@remotion/cli/config";

// Episode folders hold their own audio/subtitles; serve them directly.
Config.setPublicDir("../episodes");
Config.setVideoImageFormat("jpeg");
Config.setJpegQuality(92);
// No GPU in the cloud container: software WebGL.
Config.setChromiumOpenGlRenderer("swangle");
