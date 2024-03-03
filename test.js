import { TextEncoder, TextDecoder } from "./index.js";
const types = [
  ArrayBuffer,
  Int8Array,
  Uint8Array,
  Uint8ClampedArray,
  Int16Array,
  Uint16Array,
  Int32Array,
  Uint32Array,
  Float32Array,
  Float64Array,
  BigInt64Array,
  BigUint64Array,
  DataView,
];
const encoder = new TextEncoder();
const decoder = new TextDecoder();
const view = encoder.encode("あわ!!");
console.log("TextEncoder#encode: " + view);
let encodeTo;
const testEncodeTo = (str, size) => {
  encodeTo = new Uint8Array(size);
  const { read, written } = encoder.encodeInto(str, encodeTo);
  console.log(
    `TextEncoder#encodeInto: wrote ${written} bytes ${read} code units of '${str}' to Uint8Array(${size})`,
  );
};
testEncodeTo("a", 1);
testEncodeTo("🥺あわわ", 4);
testEncodeTo("aa", 1);
testEncodeTo("🥺あわわ", 8);
for (let i = 0xe000; i < 0x11000; i++) {
  testEncodeTo(String.fromCodePoint(i), 4);
}
types.forEach((type) => {
  const decodeFrom = type === ArrayBuffer ? view.buffer : new type(view.buffer);
  console.log(
    `TextDecoder#decode: ${type.name}(${decodeFrom}) = ${decoder.decode(
      decodeFrom,
    )}`,
  );
});
