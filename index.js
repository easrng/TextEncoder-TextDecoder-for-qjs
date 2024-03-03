import { pipe } from "os";
import { fdopen } from "std";
const utf8Names = new Set(["unicode-1-1-utf-8", "utf-8", "utf8"]);
function getBuffer(input) {
  let arrayBuffer;
  let byteOffset;
  let byteLength;

  if (input instanceof ArrayBuffer) {
    arrayBuffer = input;
    byteOffset = 0;
    byteLength = arrayBuffer.byteLength;
  } else if (ArrayBuffer.isView(input)) {
    arrayBuffer = input.buffer;
    byteOffset = input.byteOffset;
    byteLength = input.byteLength;
  } else {
    throw new Error("Expected an ArrayBuffer or ArrayBufferView.");
  }
  return [arrayBuffer, byteOffset, byteLength];
}
class TextDecoder {
  constructor(label = "utf-8", options) {
    if (!utf8Names.has(label)) {
      throw new RangeError(
        `TextDecoder: Encoding '${label}' was given, but only utf-8 is supported.`,
      );
    }
  }
  decode(input) {
    const [rFd, wFd] = pipe();
    const r = fdopen(rFd, "r");
    const w = fdopen(wFd, "w");
    w.write(...getBuffer(input));
    w.close();
    const str = r.readAsString();
    r.close();
    return str;
  }
  get encoding() {
    return "utf-8";
  }
}
class EncodeIntoResult {
  #len;
  #output;
  #writtenCache;
  #readCache;
  constructor(len, output) {
    this.#len = len;
    this.#output = output;
    this.#writtenCache = -1;
    this.#readCache = -1;
  }
  get read() {
    if (this.#readCache !== -1) return this.#readCache;
    this.#writtenCache = this.written;
    this.#readCache = 0;
    for (let i = 0, byte; i < this.#writtenCache; i++) {
      byte = this.#output[this.#writtenCache - (i + 1)];
      if ((byte & 0xc0) !== 0x80) {
        this.#readCache +=
          (byte & 0xe0) == 0xc0
            ? 1
            : (byte & 0xf0) == 0xe0
              ? 1
              : (byte & 0xf8) == 0xf0
                ? 2
                : 1;
      }
    }
    return this.#readCache;
  }
  get written() {
    if (this.#writtenCache !== -1) return this.#writtenCache;
    this.#writtenCache = this.#len;
    for (let i = 0, byte; i < this.#writtenCache; i++) {
      byte = this.#output[this.#writtenCache - (i + 1)];
      if ((byte & 0xc0) !== 0x80) {
        if (
          i !==
          ((byte & 0xe0) == 0xc0
            ? 1
            : (byte & 0xf0) == 0xe0
              ? 2
              : (byte & 0xf8) == 0xf0
                ? 3
                : 0)
        )
          this.#writtenCache -= i + 1;
        break;
      }
    }
    return this.#writtenCache;
  }
}
class TextEncoder {
  encode(input) {
    const output = new Uint8Array(input.length * 3);
    const len = this.#encodeInto(input, output);
    return output.slice(0, len);
  }
  encodeInto(input, output) {
    let len = this.#encodeInto(input, output);
    return new EncodeIntoResult(len, output);
  }
  #encodeInto(input, output) {
    if (!(output instanceof Uint8Array)) {
      throw new TypeError("Expected a Uint8Array.");
    }
    const [rFd, wFd] = pipe();
    const r = fdopen(rFd, "r");
    const w = fdopen(wFd, "w");
    w.puts(input);
    w.close();
    let len = r.read(output.buffer, output.byteOffset, output.byteLength);
    r.close();
    return len;
  }
  get encoding() {
    return "utf-8";
  }
}
export { TextEncoder, TextDecoder };
