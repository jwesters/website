/* Same-origin classic worker for ffmpeg.wasm.
   This intentionally avoids module/blob workers, which can fail on static hosts. */
let core = null;

self.onmessage = async (event) => {
  const message = event.data || {};
  const { id, type, data } = message;
  try {
    let result;
    switch (type) {
      case "LOAD":
        result = await loadCore(data || {});
        break;
      case "EXEC":
        assertLoaded();
        core.setTimeout(Number(data?.timeout ?? -1));
        core.exec(...(data?.args || []));
        result = core.ret;
        core.reset();
        break;
      case "WRITE_FILE":
        assertLoaded();
        core.FS.writeFile(data.path, data.data);
        result = true;
        break;
      case "READ_FILE":
        assertLoaded();
        result = core.FS.readFile(data.path, data.encoding ? { encoding: data.encoding } : undefined);
        break;
      case "DELETE_FILE":
        assertLoaded();
        core.FS.unlink(data.path);
        result = true;
        break;
      default:
        throw new Error(`Unknown encoder message: ${type}`);
    }

    const transfer = result instanceof Uint8Array ? [result.buffer] : [];
    self.postMessage({ id, type, data: result }, transfer);
  } catch (error) {
    self.postMessage({ id, type: "ERROR", data: error?.message || String(error) });
  }
};

function assertLoaded() {
  if (!core) throw new Error("The audiobook encoder is not loaded.");
}

async function loadCore(config) {
  if (core) return true;
  const candidates = Array.isArray(config.candidates) ? config.candidates : [];
  if (!candidates.length) throw new Error("No audiobook encoder source was configured.");
  let lastError = null;

  for (const candidate of candidates) {
    try {
      self.createFFmpegCore = undefined;
      importScripts(candidate.coreURL);
      if (typeof self.createFFmpegCore !== "function") {
        throw new Error("The FFmpeg core script did not initialise.");
      }
      const workerURL = candidate.workerURL || candidate.coreURL.replace(/\.js(?:\?.*)?$/, ".worker.js");
      const payload = btoa(JSON.stringify({ wasmURL: candidate.wasmURL, workerURL }));
      core = await self.createFFmpegCore({
        mainScriptUrlOrBlob: `${candidate.coreURL}#${payload}`,
      });
      core.setLogger((entry) => self.postMessage({ type: "LOG", data: entry }));
      core.setProgress((entry) => self.postMessage({ type: "PROGRESS", data: entry }));
      return true;
    } catch (error) {
      core = null;
      lastError = error;
    }
  }
  throw new Error(`The audiobook encoder could not load. ${lastError?.message || "Check the internet connection."}`);
}
