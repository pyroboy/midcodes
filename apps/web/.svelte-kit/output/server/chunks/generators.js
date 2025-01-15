import { customAlphabet } from "nanoid";
async function generateQRCode() {
  const randomString = Math.random().toString(36).substring(7);
  return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(randomString)}`;
}
async function generateReferenceCode() {
  const date = /* @__PURE__ */ new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const nanoid2 = customAlphabet("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789", 5);
  const randomPart = nanoid2();
  return `EVNT-${year}${month}-${randomPart}`;
}
export {
  generateQRCode as a,
  generateReferenceCode as g
};
