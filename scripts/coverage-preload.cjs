/* Preload hook attaching sourceURL comments to transpiled src/ files for V8 coverage. */
const fs = require("node:fs");
const path = require("node:path");
const Module = require("node:module");
const { pathToFileURL } = require("node:url");

const root = path.resolve(__dirname, "..");
const srcDir = path.join(root, "src");
const contentToFile = new Map();

const origReadFileSync = fs.readFileSync;
fs.readFileSync = function (filePath, ...args) {
  const result = origReadFileSync.call(this, filePath, ...args);
  if (typeof filePath === "string" && typeof result === "string") {
    const abs = path.resolve(filePath);
    if (abs.startsWith(srcDir) && /\.tsx?$/.test(abs)) {
      contentToFile.set(result, abs);
    }
  }
  return result;
};

const origModuleLoad = Module._load;
Module._load = function (request) {
  const loaded = origModuleLoad.apply(this, arguments);
  if (request === "typescript" && loaded && typeof loaded.transpileModule === "function") {
    return new Proxy(loaded, {
      get(target, prop, receiver) {
        if (prop === "transpileModule") {
          return function (input, opts) {
            const out = target.transpileModule(input, opts);
            const abs = contentToFile.get(input);
            if (abs) {
              out.outputText = `${out.outputText}\n//# sourceURL=${pathToFileURL(abs).href}\n`;
            }
            return out;
          };
        }
        return Reflect.get(target, prop, receiver);
      },
    });
  }
  return loaded;
};
