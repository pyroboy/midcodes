import "./exports.js";
import { o as onMount } from "./ssr2.js";
function get(key, parse = JSON.parse) {
  try {
    return parse(sessionStorage[key]);
  } catch {
  }
}
const SNAPSHOT_KEY = "sveltekit:snapshot";
const SCROLL_KEY = "sveltekit:scroll";
const is_legacy = onMount.toString().includes("$$") || /function \w+\(\) \{\}/.test(onMount.toString());
if (is_legacy) {
  ({
    data: {},
    form: null,
    error: null,
    params: {},
    route: { id: null },
    state: {},
    status: -1,
    url: new URL("https://example.com")
  });
}
get(SCROLL_KEY) ?? {};
get(SNAPSHOT_KEY) ?? {};
let app;
function goto(url, opts = {}) {
  {
    throw new Error("Cannot call goto(...) on the server");
  }
}
function invalidate(resource) {
  {
    throw new Error("Cannot call invalidate(...) on the server");
  }
}
function invalidateAll() {
  {
    throw new Error("Cannot call invalidateAll() on the server");
  }
}
async function applyAction(result) {
  {
    throw new Error("Cannot call applyAction(...) on the server");
  }
}
export {
  app as a,
  invalidateAll as b,
  applyAction as c,
  goto as g,
  invalidate as i
};
