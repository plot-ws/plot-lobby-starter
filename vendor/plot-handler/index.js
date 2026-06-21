// Vendored, self-contained @plot/handler for the demo (defineRoom is identity).
// Swap for `npm i @plot/handler` once the @plot/* packages are published.
export function defineRoom(def) { return def; }
export class HandlerReject extends Error {
  constructor(reason) { super(reason); this.name = 'HandlerReject'; }
}
export class PersistenceError extends Error {
  constructor(message) { super(message); this.name = 'PersistenceError'; }
}
