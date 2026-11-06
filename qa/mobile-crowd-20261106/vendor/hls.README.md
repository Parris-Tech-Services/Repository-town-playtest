# hls.js 1.6.13 (light)

Source: https://registry.npmjs.org/hls.js/-/hls.js-1.6.13.tgz
Upstream: https://github.com/video-dev/hls.js/tree/v1.6.13
License: Apache-2.0, included in hls.LICENSE.

`package/dist/hls.light.mjs` minified as ESM with the project's existing esbuild
(minify true, legalComments inline). Vendored to keep playback independent of a
third-party script CDN. Dynamic import only when a selected radio feed is HLS
and the browser has no native HLS support. Required for BBC Radio 1 in Chromium;
plain MP3/AAC feeds and Safari's native HLS do not load it. No new npm dependency.
