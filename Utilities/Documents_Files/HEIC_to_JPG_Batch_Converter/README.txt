HEIC → JPG Batch Converter v5

Open index.html in a modern browser.

Key fix in v5:
libheif-js 1.23.2's browser WASM bundle exposes an Emscripten module factory. This build invokes that factory before trying to use HeifDecoder. Earlier builds treated the imported/global value as the decoder object itself, which caused the "no usable HeifDecoder" failures.

Decoder loading order:
1. jsDelivr ES-module WASM bundle
2. unpkg ES-module WASM bundle
3. jsDelivr classic WASM bundle
4. unpkg classic WASM bundle

Privacy:
- HEIC/HEIF photos are processed in the browser and are not uploaded.
- The decoder code itself is fetched from a public CDN when needed.
- JSZip is bundled locally.

Large batches:
Files are converted sequentially, one at a time, to reduce memory spikes from full-resolution iPhone photos.

Metadata:
Browser canvas export does not reliably preserve all HEIC EXIF metadata, so metadata preservation is not promised by this build.
