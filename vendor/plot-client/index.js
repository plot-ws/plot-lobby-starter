var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/transport.ts
function openTransport(wsUrl, roomCode, token) {
  const u = new URL(wsUrl);
  u.searchParams.set("roomCode", roomCode);
  u.searchParams.set("token", token);
  const ws = new WebSocket(u.toString());
  const messageHandlers = [];
  const closeHandlers = [];
  ws.addEventListener("message", (e) => {
    try {
      const env = JSON.parse(e.data);
      for (const h of messageHandlers) h(env);
    } catch {
    }
  });
  ws.addEventListener("close", () => {
    for (const h of closeHandlers) h();
  });
  return new Promise((resolve, reject) => {
    ws.addEventListener(
      "open",
      () => resolve({
        send(env) {
          ws.send(JSON.stringify(env));
        },
        close() {
          ws.close(1e3, "client closed");
        },
        onMessage(h) {
          messageHandlers.push(h);
        },
        onClose(h) {
          closeHandlers.push(h);
        }
      })
    );
    ws.addEventListener("error", () => reject(new Error("websocket error")));
  });
}

// ../../node_modules/.pnpm/fast-json-patch@3.1.1/node_modules/fast-json-patch/module/core.mjs
var core_exports = {};
__export(core_exports, {
  JsonPatchError: () => JsonPatchError,
  _areEquals: () => _areEquals,
  applyOperation: () => applyOperation,
  applyPatch: () => applyPatch,
  applyReducer: () => applyReducer,
  deepClone: () => deepClone,
  getValueByPointer: () => getValueByPointer,
  validate: () => validate,
  validator: () => validator
});

// ../../node_modules/.pnpm/fast-json-patch@3.1.1/node_modules/fast-json-patch/module/helpers.mjs
var __extends = /* @__PURE__ */ (function() {
  var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2) if (b2.hasOwnProperty(p)) d2[p] = b2[p];
    };
    return extendStatics(d, b);
  };
  return function(d, b) {
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
})();
var _hasOwnProperty = Object.prototype.hasOwnProperty;
function hasOwnProperty(obj, key) {
  return _hasOwnProperty.call(obj, key);
}
function _objectKeys(obj) {
  if (Array.isArray(obj)) {
    var keys_1 = new Array(obj.length);
    for (var k = 0; k < keys_1.length; k++) {
      keys_1[k] = "" + k;
    }
    return keys_1;
  }
  if (Object.keys) {
    return Object.keys(obj);
  }
  var keys = [];
  for (var i in obj) {
    if (hasOwnProperty(obj, i)) {
      keys.push(i);
    }
  }
  return keys;
}
function _deepClone(obj) {
  switch (typeof obj) {
    case "object":
      return JSON.parse(JSON.stringify(obj));
    //Faster than ES5 clone - http://jsperf.com/deep-cloning-of-objects/5
    case "undefined":
      return null;
    //this is how JSON.stringify behaves for array items
    default:
      return obj;
  }
}
function isInteger(str) {
  var i = 0;
  var len = str.length;
  var charCode;
  while (i < len) {
    charCode = str.charCodeAt(i);
    if (charCode >= 48 && charCode <= 57) {
      i++;
      continue;
    }
    return false;
  }
  return true;
}
function escapePathComponent(path) {
  if (path.indexOf("/") === -1 && path.indexOf("~") === -1)
    return path;
  return path.replace(/~/g, "~0").replace(/\//g, "~1");
}
function unescapePathComponent(path) {
  return path.replace(/~1/g, "/").replace(/~0/g, "~");
}
function hasUndefined(obj) {
  if (obj === void 0) {
    return true;
  }
  if (obj) {
    if (Array.isArray(obj)) {
      for (var i_1 = 0, len = obj.length; i_1 < len; i_1++) {
        if (hasUndefined(obj[i_1])) {
          return true;
        }
      }
    } else if (typeof obj === "object") {
      var objKeys = _objectKeys(obj);
      var objKeysLength = objKeys.length;
      for (var i = 0; i < objKeysLength; i++) {
        if (hasUndefined(obj[objKeys[i]])) {
          return true;
        }
      }
    }
  }
  return false;
}
function patchErrorMessageFormatter(message, args) {
  var messageParts = [message];
  for (var key in args) {
    var value = typeof args[key] === "object" ? JSON.stringify(args[key], null, 2) : args[key];
    if (typeof value !== "undefined") {
      messageParts.push(key + ": " + value);
    }
  }
  return messageParts.join("\n");
}
var PatchError = (
  /** @class */
  (function(_super) {
    __extends(PatchError2, _super);
    function PatchError2(message, name, index, operation, tree) {
      var _newTarget = this.constructor;
      var _this = _super.call(this, patchErrorMessageFormatter(message, { name, index, operation, tree })) || this;
      _this.name = name;
      _this.index = index;
      _this.operation = operation;
      _this.tree = tree;
      Object.setPrototypeOf(_this, _newTarget.prototype);
      _this.message = patchErrorMessageFormatter(message, { name, index, operation, tree });
      return _this;
    }
    return PatchError2;
  })(Error)
);

// ../../node_modules/.pnpm/fast-json-patch@3.1.1/node_modules/fast-json-patch/module/core.mjs
var JsonPatchError = PatchError;
var deepClone = _deepClone;
var objOps = {
  add: function(obj, key, document) {
    obj[key] = this.value;
    return { newDocument: document };
  },
  remove: function(obj, key, document) {
    var removed = obj[key];
    delete obj[key];
    return { newDocument: document, removed };
  },
  replace: function(obj, key, document) {
    var removed = obj[key];
    obj[key] = this.value;
    return { newDocument: document, removed };
  },
  move: function(obj, key, document) {
    var removed = getValueByPointer(document, this.path);
    if (removed) {
      removed = _deepClone(removed);
    }
    var originalValue = applyOperation(document, { op: "remove", path: this.from }).removed;
    applyOperation(document, { op: "add", path: this.path, value: originalValue });
    return { newDocument: document, removed };
  },
  copy: function(obj, key, document) {
    var valueToCopy = getValueByPointer(document, this.from);
    applyOperation(document, { op: "add", path: this.path, value: _deepClone(valueToCopy) });
    return { newDocument: document };
  },
  test: function(obj, key, document) {
    return { newDocument: document, test: _areEquals(obj[key], this.value) };
  },
  _get: function(obj, key, document) {
    this.value = obj[key];
    return { newDocument: document };
  }
};
var arrOps = {
  add: function(arr, i, document) {
    if (isInteger(i)) {
      arr.splice(i, 0, this.value);
    } else {
      arr[i] = this.value;
    }
    return { newDocument: document, index: i };
  },
  remove: function(arr, i, document) {
    var removedList = arr.splice(i, 1);
    return { newDocument: document, removed: removedList[0] };
  },
  replace: function(arr, i, document) {
    var removed = arr[i];
    arr[i] = this.value;
    return { newDocument: document, removed };
  },
  move: objOps.move,
  copy: objOps.copy,
  test: objOps.test,
  _get: objOps._get
};
function getValueByPointer(document, pointer) {
  if (pointer == "") {
    return document;
  }
  var getOriginalDestination = { op: "_get", path: pointer };
  applyOperation(document, getOriginalDestination);
  return getOriginalDestination.value;
}
function applyOperation(document, operation, validateOperation, mutateDocument, banPrototypeModifications, index) {
  if (validateOperation === void 0) {
    validateOperation = false;
  }
  if (mutateDocument === void 0) {
    mutateDocument = true;
  }
  if (banPrototypeModifications === void 0) {
    banPrototypeModifications = true;
  }
  if (index === void 0) {
    index = 0;
  }
  if (validateOperation) {
    if (typeof validateOperation == "function") {
      validateOperation(operation, 0, document, operation.path);
    } else {
      validator(operation, 0);
    }
  }
  if (operation.path === "") {
    var returnValue = { newDocument: document };
    if (operation.op === "add") {
      returnValue.newDocument = operation.value;
      return returnValue;
    } else if (operation.op === "replace") {
      returnValue.newDocument = operation.value;
      returnValue.removed = document;
      return returnValue;
    } else if (operation.op === "move" || operation.op === "copy") {
      returnValue.newDocument = getValueByPointer(document, operation.from);
      if (operation.op === "move") {
        returnValue.removed = document;
      }
      return returnValue;
    } else if (operation.op === "test") {
      returnValue.test = _areEquals(document, operation.value);
      if (returnValue.test === false) {
        throw new JsonPatchError("Test operation failed", "TEST_OPERATION_FAILED", index, operation, document);
      }
      returnValue.newDocument = document;
      return returnValue;
    } else if (operation.op === "remove") {
      returnValue.removed = document;
      returnValue.newDocument = null;
      return returnValue;
    } else if (operation.op === "_get") {
      operation.value = document;
      return returnValue;
    } else {
      if (validateOperation) {
        throw new JsonPatchError("Operation `op` property is not one of operations defined in RFC-6902", "OPERATION_OP_INVALID", index, operation, document);
      } else {
        return returnValue;
      }
    }
  } else {
    if (!mutateDocument) {
      document = _deepClone(document);
    }
    var path = operation.path || "";
    var keys = path.split("/");
    var obj = document;
    var t = 1;
    var len = keys.length;
    var existingPathFragment = void 0;
    var key = void 0;
    var validateFunction = void 0;
    if (typeof validateOperation == "function") {
      validateFunction = validateOperation;
    } else {
      validateFunction = validator;
    }
    while (true) {
      key = keys[t];
      if (key && key.indexOf("~") != -1) {
        key = unescapePathComponent(key);
      }
      if (banPrototypeModifications && (key == "__proto__" || key == "prototype" && t > 0 && keys[t - 1] == "constructor")) {
        throw new TypeError("JSON-Patch: modifying `__proto__` or `constructor/prototype` prop is banned for security reasons, if this was on purpose, please set `banPrototypeModifications` flag false and pass it to this function. More info in fast-json-patch README");
      }
      if (validateOperation) {
        if (existingPathFragment === void 0) {
          if (obj[key] === void 0) {
            existingPathFragment = keys.slice(0, t).join("/");
          } else if (t == len - 1) {
            existingPathFragment = operation.path;
          }
          if (existingPathFragment !== void 0) {
            validateFunction(operation, 0, document, existingPathFragment);
          }
        }
      }
      t++;
      if (Array.isArray(obj)) {
        if (key === "-") {
          key = obj.length;
        } else {
          if (validateOperation && !isInteger(key)) {
            throw new JsonPatchError("Expected an unsigned base-10 integer value, making the new referenced value the array element with the zero-based index", "OPERATION_PATH_ILLEGAL_ARRAY_INDEX", index, operation, document);
          } else if (isInteger(key)) {
            key = ~~key;
          }
        }
        if (t >= len) {
          if (validateOperation && operation.op === "add" && key > obj.length) {
            throw new JsonPatchError("The specified index MUST NOT be greater than the number of elements in the array", "OPERATION_VALUE_OUT_OF_BOUNDS", index, operation, document);
          }
          var returnValue = arrOps[operation.op].call(operation, obj, key, document);
          if (returnValue.test === false) {
            throw new JsonPatchError("Test operation failed", "TEST_OPERATION_FAILED", index, operation, document);
          }
          return returnValue;
        }
      } else {
        if (t >= len) {
          var returnValue = objOps[operation.op].call(operation, obj, key, document);
          if (returnValue.test === false) {
            throw new JsonPatchError("Test operation failed", "TEST_OPERATION_FAILED", index, operation, document);
          }
          return returnValue;
        }
      }
      obj = obj[key];
      if (validateOperation && t < len && (!obj || typeof obj !== "object")) {
        throw new JsonPatchError("Cannot perform operation at the desired path", "OPERATION_PATH_UNRESOLVABLE", index, operation, document);
      }
    }
  }
}
function applyPatch(document, patch, validateOperation, mutateDocument, banPrototypeModifications) {
  if (mutateDocument === void 0) {
    mutateDocument = true;
  }
  if (banPrototypeModifications === void 0) {
    banPrototypeModifications = true;
  }
  if (validateOperation) {
    if (!Array.isArray(patch)) {
      throw new JsonPatchError("Patch sequence must be an array", "SEQUENCE_NOT_AN_ARRAY");
    }
  }
  if (!mutateDocument) {
    document = _deepClone(document);
  }
  var results = new Array(patch.length);
  for (var i = 0, length_1 = patch.length; i < length_1; i++) {
    results[i] = applyOperation(document, patch[i], validateOperation, true, banPrototypeModifications, i);
    document = results[i].newDocument;
  }
  results.newDocument = document;
  return results;
}
function applyReducer(document, operation, index) {
  var operationResult = applyOperation(document, operation);
  if (operationResult.test === false) {
    throw new JsonPatchError("Test operation failed", "TEST_OPERATION_FAILED", index, operation, document);
  }
  return operationResult.newDocument;
}
function validator(operation, index, document, existingPathFragment) {
  if (typeof operation !== "object" || operation === null || Array.isArray(operation)) {
    throw new JsonPatchError("Operation is not an object", "OPERATION_NOT_AN_OBJECT", index, operation, document);
  } else if (!objOps[operation.op]) {
    throw new JsonPatchError("Operation `op` property is not one of operations defined in RFC-6902", "OPERATION_OP_INVALID", index, operation, document);
  } else if (typeof operation.path !== "string") {
    throw new JsonPatchError("Operation `path` property is not a string", "OPERATION_PATH_INVALID", index, operation, document);
  } else if (operation.path.indexOf("/") !== 0 && operation.path.length > 0) {
    throw new JsonPatchError('Operation `path` property must start with "/"', "OPERATION_PATH_INVALID", index, operation, document);
  } else if ((operation.op === "move" || operation.op === "copy") && typeof operation.from !== "string") {
    throw new JsonPatchError("Operation `from` property is not present (applicable in `move` and `copy` operations)", "OPERATION_FROM_REQUIRED", index, operation, document);
  } else if ((operation.op === "add" || operation.op === "replace" || operation.op === "test") && operation.value === void 0) {
    throw new JsonPatchError("Operation `value` property is not present (applicable in `add`, `replace` and `test` operations)", "OPERATION_VALUE_REQUIRED", index, operation, document);
  } else if ((operation.op === "add" || operation.op === "replace" || operation.op === "test") && hasUndefined(operation.value)) {
    throw new JsonPatchError("Operation `value` property is not present (applicable in `add`, `replace` and `test` operations)", "OPERATION_VALUE_CANNOT_CONTAIN_UNDEFINED", index, operation, document);
  } else if (document) {
    if (operation.op == "add") {
      var pathLen = operation.path.split("/").length;
      var existingPathLen = existingPathFragment.split("/").length;
      if (pathLen !== existingPathLen + 1 && pathLen !== existingPathLen) {
        throw new JsonPatchError("Cannot perform an `add` operation at the desired path", "OPERATION_PATH_CANNOT_ADD", index, operation, document);
      }
    } else if (operation.op === "replace" || operation.op === "remove" || operation.op === "_get") {
      if (operation.path !== existingPathFragment) {
        throw new JsonPatchError("Cannot perform the operation at a path that does not exist", "OPERATION_PATH_UNRESOLVABLE", index, operation, document);
      }
    } else if (operation.op === "move" || operation.op === "copy") {
      var existingValue = { op: "_get", path: operation.from, value: void 0 };
      var error = validate([existingValue], document);
      if (error && error.name === "OPERATION_PATH_UNRESOLVABLE") {
        throw new JsonPatchError("Cannot perform the operation from a path that does not exist", "OPERATION_FROM_UNRESOLVABLE", index, operation, document);
      }
    }
  }
}
function validate(sequence, document, externalValidator) {
  try {
    if (!Array.isArray(sequence)) {
      throw new JsonPatchError("Patch sequence must be an array", "SEQUENCE_NOT_AN_ARRAY");
    }
    if (document) {
      applyPatch(_deepClone(document), _deepClone(sequence), externalValidator || true);
    } else {
      externalValidator = externalValidator || validator;
      for (var i = 0; i < sequence.length; i++) {
        externalValidator(sequence[i], i, document, void 0);
      }
    }
  } catch (e) {
    if (e instanceof JsonPatchError) {
      return e;
    } else {
      throw e;
    }
  }
}
function _areEquals(a, b) {
  if (a === b)
    return true;
  if (a && b && typeof a == "object" && typeof b == "object") {
    var arrA = Array.isArray(a), arrB = Array.isArray(b), i, length, key;
    if (arrA && arrB) {
      length = a.length;
      if (length != b.length)
        return false;
      for (i = length; i-- !== 0; )
        if (!_areEquals(a[i], b[i]))
          return false;
      return true;
    }
    if (arrA != arrB)
      return false;
    var keys = Object.keys(a);
    length = keys.length;
    if (length !== Object.keys(b).length)
      return false;
    for (i = length; i-- !== 0; )
      if (!b.hasOwnProperty(keys[i]))
        return false;
    for (i = length; i-- !== 0; ) {
      key = keys[i];
      if (!_areEquals(a[key], b[key]))
        return false;
    }
    return true;
  }
  return a !== a && b !== b;
}

// ../../node_modules/.pnpm/fast-json-patch@3.1.1/node_modules/fast-json-patch/module/duplex.mjs
var duplex_exports = {};
__export(duplex_exports, {
  compare: () => compare,
  generate: () => generate,
  observe: () => observe,
  unobserve: () => unobserve
});
var beforeDict = /* @__PURE__ */ new WeakMap();
var Mirror = (
  /** @class */
  /* @__PURE__ */ (function() {
    function Mirror2(obj) {
      this.observers = /* @__PURE__ */ new Map();
      this.obj = obj;
    }
    return Mirror2;
  })()
);
var ObserverInfo = (
  /** @class */
  /* @__PURE__ */ (function() {
    function ObserverInfo2(callback, observer) {
      this.callback = callback;
      this.observer = observer;
    }
    return ObserverInfo2;
  })()
);
function getMirror(obj) {
  return beforeDict.get(obj);
}
function getObserverFromMirror(mirror, callback) {
  return mirror.observers.get(callback);
}
function removeObserverFromMirror(mirror, observer) {
  mirror.observers.delete(observer.callback);
}
function unobserve(root, observer) {
  observer.unobserve();
}
function observe(obj, callback) {
  var patches = [];
  var observer;
  var mirror = getMirror(obj);
  if (!mirror) {
    mirror = new Mirror(obj);
    beforeDict.set(obj, mirror);
  } else {
    var observerInfo = getObserverFromMirror(mirror, callback);
    observer = observerInfo && observerInfo.observer;
  }
  if (observer) {
    return observer;
  }
  observer = {};
  mirror.value = _deepClone(obj);
  if (callback) {
    observer.callback = callback;
    observer.next = null;
    var dirtyCheck = function() {
      generate(observer);
    };
    var fastCheck = function() {
      clearTimeout(observer.next);
      observer.next = setTimeout(dirtyCheck);
    };
    if (typeof window !== "undefined") {
      window.addEventListener("mouseup", fastCheck);
      window.addEventListener("keyup", fastCheck);
      window.addEventListener("mousedown", fastCheck);
      window.addEventListener("keydown", fastCheck);
      window.addEventListener("change", fastCheck);
    }
  }
  observer.patches = patches;
  observer.object = obj;
  observer.unobserve = function() {
    generate(observer);
    clearTimeout(observer.next);
    removeObserverFromMirror(mirror, observer);
    if (typeof window !== "undefined") {
      window.removeEventListener("mouseup", fastCheck);
      window.removeEventListener("keyup", fastCheck);
      window.removeEventListener("mousedown", fastCheck);
      window.removeEventListener("keydown", fastCheck);
      window.removeEventListener("change", fastCheck);
    }
  };
  mirror.observers.set(callback, new ObserverInfo(callback, observer));
  return observer;
}
function generate(observer, invertible) {
  if (invertible === void 0) {
    invertible = false;
  }
  var mirror = beforeDict.get(observer.object);
  _generate(mirror.value, observer.object, observer.patches, "", invertible);
  if (observer.patches.length) {
    applyPatch(mirror.value, observer.patches);
  }
  var temp = observer.patches;
  if (temp.length > 0) {
    observer.patches = [];
    if (observer.callback) {
      observer.callback(temp);
    }
  }
  return temp;
}
function _generate(mirror, obj, patches, path, invertible) {
  if (obj === mirror) {
    return;
  }
  if (typeof obj.toJSON === "function") {
    obj = obj.toJSON();
  }
  var newKeys = _objectKeys(obj);
  var oldKeys = _objectKeys(mirror);
  var changed = false;
  var deleted = false;
  for (var t = oldKeys.length - 1; t >= 0; t--) {
    var key = oldKeys[t];
    var oldVal = mirror[key];
    if (hasOwnProperty(obj, key) && !(obj[key] === void 0 && oldVal !== void 0 && Array.isArray(obj) === false)) {
      var newVal = obj[key];
      if (typeof oldVal == "object" && oldVal != null && typeof newVal == "object" && newVal != null && Array.isArray(oldVal) === Array.isArray(newVal)) {
        _generate(oldVal, newVal, patches, path + "/" + escapePathComponent(key), invertible);
      } else {
        if (oldVal !== newVal) {
          changed = true;
          if (invertible) {
            patches.push({ op: "test", path: path + "/" + escapePathComponent(key), value: _deepClone(oldVal) });
          }
          patches.push({ op: "replace", path: path + "/" + escapePathComponent(key), value: _deepClone(newVal) });
        }
      }
    } else if (Array.isArray(mirror) === Array.isArray(obj)) {
      if (invertible) {
        patches.push({ op: "test", path: path + "/" + escapePathComponent(key), value: _deepClone(oldVal) });
      }
      patches.push({ op: "remove", path: path + "/" + escapePathComponent(key) });
      deleted = true;
    } else {
      if (invertible) {
        patches.push({ op: "test", path, value: mirror });
      }
      patches.push({ op: "replace", path, value: obj });
      changed = true;
    }
  }
  if (!deleted && newKeys.length == oldKeys.length) {
    return;
  }
  for (var t = 0; t < newKeys.length; t++) {
    var key = newKeys[t];
    if (!hasOwnProperty(mirror, key) && obj[key] !== void 0) {
      patches.push({ op: "add", path: path + "/" + escapePathComponent(key), value: _deepClone(obj[key]) });
    }
  }
}
function compare(tree1, tree2, invertible) {
  if (invertible === void 0) {
    invertible = false;
  }
  var patches = [];
  _generate(tree1, tree2, patches, "", invertible);
  return patches;
}

// ../../node_modules/.pnpm/fast-json-patch@3.1.1/node_modules/fast-json-patch/index.mjs
var fast_json_patch_default = Object.assign({}, core_exports, duplex_exports, {
  JsonPatchError: PatchError,
  deepClone: _deepClone,
  escapePathComponent,
  unescapePathComponent
});

// src/interpolation/snapshot-buffer.ts
var SnapshotBuffer = class {
  constructor(horizonMs) {
    this.horizonMs = horizonMs;
  }
  snapshots = [];
  push(ts, state) {
    if (!Number.isFinite(ts)) return;
    const last = this.snapshots[this.snapshots.length - 1];
    if (last && ts <= last.ts) return;
    this.snapshots.push({ ts, state });
    const cutoff = ts - this.horizonMs;
    while (this.snapshots.length > 1 && this.snapshots[1].ts < cutoff) {
      this.snapshots.shift();
    }
  }
  lookup(targetTs) {
    if (this.snapshots.length === 0) return null;
    if (this.snapshots.length === 1) return { a: this.snapshots[0], b: null };
    const first = this.snapshots[0];
    const last = this.snapshots[this.snapshots.length - 1];
    if (targetTs <= first.ts) return { a: first, b: null };
    if (targetTs >= last.ts) return { a: last, b: null };
    for (let i = 0; i < this.snapshots.length - 1; i++) {
      const a = this.snapshots[i];
      const b = this.snapshots[i + 1];
      if (a.ts <= targetTs && targetTs < b.ts) return { a, b };
    }
    return { a: last, b: null };
  }
  get size() {
    return this.snapshots.length;
  }
  get oldest() {
    return this.snapshots[0] ?? null;
  }
  get newest() {
    return this.snapshots[this.snapshots.length - 1] ?? null;
  }
};

// src/interpolation/server-clock.ts
var WINDOW = 8;
var ServerClock = class {
  samples = [];
  observe(s) {
    this.samples.push(s.clientNow - s.serverTs);
    if (this.samples.length > WINDOW) this.samples.shift();
  }
  get offset() {
    if (this.samples.length === 0) return 0;
    const sorted = [...this.samples].sort((a, b) => a - b);
    const mid = sorted.length >> 1;
    return sorted.length % 2 === 1 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }
  /**
   * Spread of the offset window — population standard deviation of the
   * recent (clientNow - serverTs) samples. A proxy for connection
   * jitter: steady links sit near 0; bursty/variable links climb.
   * Returns 0 with fewer than two samples.
   */
  get jitter() {
    const n = this.samples.length;
    if (n < 2) return 0;
    const mean = this.samples.reduce((a, b) => a + b, 0) / n;
    const variance = this.samples.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
    return Math.sqrt(variance);
  }
};

// src/interpolation/lerp/number.ts
function lerpNumber(a, b, t) {
  return a + (b - a) * t;
}

// src/interpolation/lerp/vec2.ts
function lerpVec2(a, b, t) {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

// src/interpolation/lerp/vec3.ts
function lerpVec3(a, b, t) {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    z: a.z + (b.z - a.z) * t
  };
}

// src/interpolation/lerp/quat.ts
var DOT_THRESHOLD = 0.9995;
function normalize(q) {
  const len = Math.sqrt(q.x ** 2 + q.y ** 2 + q.z ** 2 + q.w ** 2);
  if (len === 0) throw new Error("cannot normalize a zero quaternion");
  return { x: q.x / len, y: q.y / len, z: q.z / len, w: q.w / len };
}
function lerpQuat(a, b, t) {
  let dot = a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w;
  let bx = b.x, by = b.y, bz = b.z, bw = b.w;
  if (dot < 0) {
    dot = -dot;
    bx = -bx;
    by = -by;
    bz = -bz;
    bw = -bw;
  }
  if (t <= 0) return { x: a.x, y: a.y, z: a.z, w: a.w };
  if (t >= 1) return { x: bx, y: by, z: bz, w: bw };
  if (dot > DOT_THRESHOLD) {
    return normalize({
      x: a.x + (bx - a.x) * t,
      y: a.y + (by - a.y) * t,
      z: a.z + (bz - a.z) * t,
      w: a.w + (bw - a.w) * t
    });
  }
  const theta0 = Math.acos(dot);
  const sinTheta0 = Math.sin(theta0);
  const theta = theta0 * t;
  const sinTheta = Math.sin(theta);
  const s0 = Math.cos(theta) - dot * sinTheta / sinTheta0;
  const s1 = sinTheta / sinTheta0;
  return {
    x: s0 * a.x + s1 * bx,
    y: s0 * a.y + s1 * by,
    z: s0 * a.z + s1 * bz,
    w: s0 * a.w + s1 * bw
  };
}

// src/interpolation/path.ts
function walk(state, segments) {
  let cur = state;
  for (const seg of segments) {
    if (cur === null || cur === void 0 || typeof cur !== "object") return void 0;
    cur = cur[seg];
  }
  return cur;
}
function isObject(x) {
  return x !== null && typeof x === "object";
}
function resolvePath(pattern, a, b) {
  const segs = pattern.split(".");
  const wildcardCount = segs.filter((s) => s === "*").length;
  if (wildcardCount > 1) {
    throw new Error(`resolvePath: multi-wildcard patterns are not supported: ${pattern}`);
  }
  const star = segs.indexOf("*");
  if (star === -1) {
    return [{ path: pattern, valueA: walk(a, segs), valueB: walk(b, segs) }];
  }
  const head = segs.slice(0, star);
  const tail = segs.slice(star + 1);
  const aParent = walk(a, head);
  const bParent = walk(b, head);
  const keys = /* @__PURE__ */ new Set();
  if (isObject(aParent)) {
    for (const k of Object.keys(aParent)) keys.add(k);
  }
  if (isObject(bParent)) {
    for (const k of Object.keys(bParent)) keys.add(k);
  }
  const out = [];
  for (const k of keys) {
    const childPath = [...head, k, ...tail].join(".");
    const aChild = isObject(aParent) ? aParent[k] : void 0;
    const bChild = isObject(bParent) ? bParent[k] : void 0;
    out.push({
      path: childPath,
      valueA: walk(aChild, tail),
      valueB: walk(bChild, tail)
    });
  }
  out.sort((x, y) => x.path.localeCompare(y.path));
  return out;
}

// src/interpolation/interpolator.ts
var Interpolator = class {
  constructor(opts, buffer) {
    this.opts = opts;
    this.buffer = buffer;
  }
  get renderDelay() {
    return this.opts.renderDelay ?? 100;
  }
  get path() {
    return this.opts.path;
  }
  tick(targetTs) {
    const pair = this.buffer.lookup(targetTs);
    if (!pair) return {};
    const { a, b } = pair;
    const out = {};
    if (b === null) {
      for (const leaf of resolvePath(this.opts.path, a.state, a.state)) {
        if (leaf.valueA !== void 0) out[leaf.path] = leaf.valueA;
      }
      return out;
    }
    const t = (targetTs - a.ts) / (b.ts - a.ts);
    const tClamped = Math.max(0, Math.min(1, t));
    for (const leaf of resolvePath(this.opts.path, a.state, b.state)) {
      if (leaf.valueA === void 0 && leaf.valueB === void 0) continue;
      if (leaf.valueA === void 0) {
        out[leaf.path] = leaf.valueB;
        continue;
      }
      if (leaf.valueB === void 0) {
        out[leaf.path] = leaf.valueA;
        continue;
      }
      out[leaf.path] = lerpByType(this.opts.type, leaf.valueA, leaf.valueB, tClamped);
    }
    return out;
  }
};
function lerpByType(type, a, b, t) {
  switch (type) {
    case "number":
      return lerpNumber(a, b, t);
    case "vec2":
      return lerpVec2(a, b, t);
    case "vec3":
      return lerpVec3(a, b, t);
    case "quat":
      return lerpQuat(a, b, t);
  }
}

// src/interpolation/sampler.ts
function lerpByType2(type, a, b, t) {
  switch (type) {
    case "number":
      return lerpNumber(a, b, t);
    case "vec2":
      return lerpVec2(a, b, t);
    case "vec3":
      return lerpVec3(a, b, t);
    case "quat":
      return lerpQuat(a, b, t);
  }
}
function sampleAt(buffer, path, type, atServerTs) {
  const oldest = buffer.oldest;
  const newest = buffer.newest;
  if (oldest === null || newest === null) return null;
  if (atServerTs < oldest.ts || atServerTs > newest.ts) return null;
  const isWildcard = path.includes("*");
  const pair = buffer.lookup(atServerTs);
  if (pair === null) return isWildcard ? {} : null;
  const { a, b } = pair;
  if (b === null) {
    const out2 = {};
    for (const leaf of resolvePath(path, a.state, a.state)) {
      if (leaf.valueA !== void 0) out2[leaf.path] = leaf.valueA;
    }
    if (isWildcard) return out2;
    return path in out2 ? out2[path] : null;
  }
  const t = (atServerTs - a.ts) / (b.ts - a.ts);
  const tClamped = Math.max(0, Math.min(1, t));
  const out = {};
  for (const leaf of resolvePath(path, a.state, b.state)) {
    if (leaf.valueA === void 0 && leaf.valueB === void 0) continue;
    if (leaf.valueA === void 0) {
      out[leaf.path] = leaf.valueB;
      continue;
    }
    if (leaf.valueB === void 0) {
      out[leaf.path] = leaf.valueA;
      continue;
    }
    out[leaf.path] = lerpByType2(type, leaf.valueA, leaf.valueB, tClamped);
  }
  if (isWildcard) return out;
  return path in out ? out[path] : null;
}
var Sampler = class {
  constructor(buffer, atServerTs) {
    this.buffer = buffer;
    this.atServerTs = atServerTs;
  }
  sample(path, type) {
    return sampleAt(this.buffer, path, type, this.atServerTs);
  }
};

// ../handler-client/src/run-handler.ts
function makeCtx(input) {
  const state = structuredClone(input.state);
  const throwClient = (api) => () => {
    throw new Error(`handler-client: ${api} is not available during prediction`);
  };
  const ctx = {
    state,
    roomCode: input.roomCode ?? "unknown",
    appId: input.appId ?? "unknown",
    region: input.region ?? "unknown",
    players: input.players ?? [],
    get firstPlayer() {
      return ctx.players[0];
    },
    broadcast: () => void 0,
    sendTo: () => void 0,
    kick: () => void 0,
    log: () => void 0,
    warn: () => void 0,
    error: () => void 0,
    setTimeout: () => 0,
    clearTimeout: () => void 0,
    // Prediction runs only onMessage; timers fire server-side via DO
    // alarms and are not replayed client-side, so these are inert here.
    scheduleTimer: () => "",
    cancelTimer: () => void 0,
    profile: {
      get: throwClient("profile.get"),
      update: throwClient("profile.update")
    },
    leaderboard: () => ({
      submit: throwClient("leaderboard.submit"),
      top: throwClient("leaderboard.top"),
      around: throwClient("leaderboard.around")
    }),
    save: {
      get: throwClient("save.get"),
      put: throwClient("save.put"),
      delete: throwClient("save.delete"),
      list: throwClient("save.list")
    },
    replay: {
      enabled: () => false,
      append: () => void 0
    },
    rewindTo: () => throwClient("rewindTo")()
  };
  return ctx;
}
function runHandler(room, ctxInput, call) {
  const ctx = makeCtx(ctxInput);
  switch (call.method) {
    case "onJoin":
      room.onJoin?.(call.args.player, ctx);
      break;
    case "onMessage":
      room.onMessage?.(call.args.player, call.args.msg, ctx);
      break;
    case "onLeave":
      room.onLeave?.(call.args.player, ctx);
      break;
    case "onTick":
      room.onTick?.(ctx);
      break;
    case "onCreate":
      room.onCreate?.(ctx);
      break;
    case "noop":
      break;
  }
  return ctx.state;
}

// ../handler-client/src/input-queue.ts
var CAP = 200;
var InputQueue = class {
  entries = [];
  push(entry) {
    const last = this.entries[this.entries.length - 1];
    if (last && entry.seq <= last.seq) {
      throw new Error(`InputQueue: seq must be monotonically increasing (got ${entry.seq} after ${last.seq})`);
    }
    this.entries.push(entry);
    if (this.entries.length > CAP) {
      this.entries.shift();
      return true;
    }
    return false;
  }
  ackUpTo(seq) {
    while (this.entries.length > 0 && this.entries[0].seq <= seq) {
      this.entries.shift();
    }
  }
  pending() {
    return this.entries;
  }
  get size() {
    return this.entries.length;
  }
  clear() {
    this.entries.length = 0;
  }
};

// ../handler-client/src/correction-track.ts
function zero(type) {
  switch (type) {
    case "number":
      return 0;
    case "vec2":
      return { x: 0, y: 0 };
    case "vec3":
      return { x: 0, y: 0, z: 0 };
    case "quat":
      return { x: 0, y: 0, z: 0, w: 0 };
  }
}
function scale(type, v, k) {
  switch (type) {
    case "number":
      return v * k;
    case "vec2": {
      const a = v;
      return { x: a.x * k, y: a.y * k };
    }
    case "vec3": {
      const a = v;
      return { x: a.x * k, y: a.y * k, z: a.z * k };
    }
    case "quat": {
      const a = v;
      return { x: a.x * k, y: a.y * k, z: a.z * k, w: a.w * k };
    }
  }
}
var CorrectionTrack = class {
  constructor(opts) {
    this.opts = opts;
    this.value = zero(opts.type);
  }
  value;
  startedAt = 0;
  hasRecord = false;
  record(drift, now) {
    this.value = drift;
    this.startedAt = now;
    this.hasRecord = true;
  }
  read(now) {
    if (!this.hasRecord) return zero(this.opts.type);
    const elapsed = now - this.startedAt;
    if (elapsed >= 1e3) {
      this.hasRecord = false;
      return zero(this.opts.type);
    }
    if (elapsed >= this.opts.durationMs) return zero(this.opts.type);
    if (elapsed <= 0) return this.value;
    const k = 1 - elapsed / this.opts.durationMs;
    return scale(this.opts.type, this.value, k);
  }
};

// ../handler-client/src/predictor.ts
function jsonDiffMagnitude(a, b) {
  if (a === b) return 0;
  if (typeof a === "number" && typeof b === "number") return Math.abs(a - b);
  if (typeof a !== typeof b) return 1;
  if (a === null || b === null) return 1;
  if (typeof a !== "object") return a === b ? 0 : 1;
  let total = 0;
  const ao = a;
  const bo = b;
  const keys = /* @__PURE__ */ new Set([...Object.keys(ao), ...Object.keys(bo)]);
  for (const k of keys) total += jsonDiffMagnitude(ao[k], bo[k]);
  return total;
}
var Predictor = class {
  constructor(opts) {
    this.opts = opts;
  }
  _authoritative = {};
  _predicted = {};
  _queue = new InputQueue();
  _disabled = false;
  onReconcile = null;
  setAuthoritative(state) {
    this._authoritative = state;
    this._predicted = structuredClone(state);
  }
  get predictedState() {
    return this._predicted;
  }
  get queue() {
    return this._queue;
  }
  get disabled() {
    return this._disabled;
  }
  apply(entry) {
    if (this._disabled) return;
    let next;
    try {
      next = runHandler(this.opts.room, {
        state: this._predicted,
        roomCode: this.opts.roomCode,
        appId: this.opts.appId,
        players: [this.opts.localPlayer]
      }, {
        method: "onMessage",
        args: { player: this.opts.localPlayer, msg: entry.input }
      });
    } catch (err) {
      console.warn("[predictor] handler threw on apply; dropping input", err);
      return;
    }
    this._predicted = next;
    const overflowed = this._queue.push(entry);
    if (overflowed && this._queue.size >= 200) {
      console.warn("[predictor] input queue overflowed; disabling prediction");
      this._disabled = true;
      this._queue.clear();
      this._predicted = structuredClone(this._authoritative);
    }
  }
  reconcile(serverState, lastAckedSeq) {
    this._authoritative = serverState;
    this._queue.ackUpTo(lastAckedSeq);
    let replayed = structuredClone(serverState);
    try {
      for (const entry of this._queue.pending()) {
        replayed = runHandler(this.opts.room, {
          state: replayed,
          roomCode: this.opts.roomCode,
          appId: this.opts.appId,
          players: [this.opts.localPlayer]
        }, {
          method: "onMessage",
          args: { player: this.opts.localPlayer, msg: entry.input }
        });
      }
    } catch (err) {
      console.warn("[predictor] replay threw; clearing queue", err);
      this._queue.clear();
      replayed = structuredClone(serverState);
    }
    const drift = jsonDiffMagnitude(this._predicted, replayed);
    this._predicted = replayed;
    if (this.onReconcile) this.onReconcile({ drift });
  }
  disable() {
    this._disabled = true;
    this._queue.clear();
    this._predicted = structuredClone(this._authoritative);
  }
};

// src/room.ts
function readPath(state, path) {
  let cur = state;
  for (const seg of path.split(".")) {
    if (cur === null || cur === void 0 || typeof cur !== "object") return void 0;
    cur = cur[seg];
  }
  return cur;
}
function computeDrift(type, prev, next) {
  if (prev === void 0 || next === void 0) return null;
  switch (type) {
    case "number":
      return prev - next;
    case "vec2": {
      const a = prev;
      const b = next;
      return { x: a.x - b.x, y: a.y - b.y };
    }
    case "vec3": {
      const a = prev;
      const b = next;
      return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
    }
    case "quat": {
      const a = prev;
      const b = next;
      return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z, w: a.w - b.w };
    }
  }
}
function applyOffset(type, base, offset) {
  if (base === void 0) return void 0;
  switch (type) {
    case "number":
      return base + offset;
    case "vec2": {
      const a = base;
      const b = offset;
      return { x: a.x + b.x, y: a.y + b.y };
    }
    case "vec3": {
      const a = base;
      const b = offset;
      return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
    }
    case "quat": {
      const a = base;
      const b = offset;
      return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z, w: a.w + b.w };
    }
  }
}
var Room = class {
  constructor(_playerId, transport) {
    this._playerId = _playerId;
    this.transport = transport;
    this.transport.onMessage((env) => this.dispatch(env));
    this._onSnapshot((ts, state) => {
      this.clock.observe({ clientNow: Date.now(), serverTs: ts });
      this.buffer.push(ts, state);
      if (this.predictor !== null) {
        for (const t of this.predictedTracks) {
          t.previousValue = readPath(this.predictor.predictedState, t.opts.path);
        }
        this.predictor.reconcile(state, this.lastAckedSeq);
        const now = Date.now();
        for (const t of this.predictedTracks) {
          const newValue = readPath(this.predictor.predictedState, t.opts.path);
          const drift = computeDrift(t.opts.type, t.previousValue, newValue);
          if (drift !== null) t.track.record(drift, now);
        }
        for (const h of this.listeners.predicted) {
          h({ state: this.predictor.predictedState, ts, drift: this.lastDrift });
        }
      }
    });
  }
  listeners = {
    message: [],
    join: [],
    leave: [],
    frame: [],
    predicted: []
  };
  currentState = void 0;
  snapshotSink = null;
  buffer = new SnapshotBuffer(500);
  clock = new ServerClock();
  interpolators = [];
  frameTimer = null;
  adaptive = {
    enabled: false,
    gain: 1.5,
    maxExtraMs: 200
  };
  predictor = null;
  nextSeq = 0;
  lastAckedSeq = 0;
  lastDrift = 0;
  predictedTracks = [];
  correctedState = {};
  /** Internal: register a sink that receives every applied (ts, state). */
  _onSnapshot(sink) {
    this.snapshotSink = sink;
  }
  on(type, handler) {
    this.listeners[type].push(handler);
  }
  send(data, opts) {
    const env = {
      type: "message",
      channel: opts?.channel ?? "event",
      data,
      clientTs: opts?.clientTs ?? Date.now()
    };
    this.transport.send(env);
  }
  leave() {
    this.transport.close();
  }
  attachHandler(room) {
    if (this.predictor !== null) {
      throw new Error("Room.attachHandler: handler already attached");
    }
    const predictor = new Predictor({
      room,
      localPlayer: { id: this._playerId, joinedAt: Date.now() }
    });
    predictor.onReconcile = ({ drift }) => {
      this.lastDrift = drift;
    };
    const seed = this.currentState ?? room.initialState;
    predictor.setAuthoritative(seed);
    this.predictor = predictor;
  }
  get predictedState() {
    return this.predictor?.predictedState;
  }
  sendPredicted(input, opts) {
    const predictor = this.predictor;
    if (predictor === null) {
      throw new Error("Room.sendPredicted: attachHandler must be called first");
    }
    const seq = ++this.nextSeq;
    predictor.apply({ seq, input });
    for (const t of this.predictedTracks) {
      this.correctedState[t.opts.path] = readPath(predictor.predictedState, t.opts.path);
    }
    const channel = opts?.channel ?? "event";
    const env = {
      type: "message",
      channel,
      data: input,
      _seq: seq,
      clientTs: opts?.clientTs ?? Date.now()
    };
    this.transport.send(env);
    for (const h of this.listeners.predicted) {
      h({ state: predictor.predictedState, ts: Date.now(), drift: 0 });
    }
  }
  predict(opts) {
    if (this.predictor === null) {
      throw new Error("Room.predict: attachHandler must be called first");
    }
    for (const t of this.predictedTracks) {
      if (t.opts.path === opts.path) {
        throw new Error(`Room.predict: path already registered: ${opts.path}`);
      }
    }
    this.predictedTracks.push({
      opts,
      track: new CorrectionTrack({ type: opts.type, durationMs: opts.correctionMs ?? 100 }),
      previousValue: readPath(this.predictor.predictedState, opts.path)
    });
    this.correctedState[opts.path] = readPath(this.predictor.predictedState, opts.path);
  }
  interpolate(opts) {
    for (const existing of this.interpolators) {
      if (existing.path === opts.path) {
        throw new Error(`Room.interpolate: path already registered: ${opts.path}`);
      }
    }
    this.interpolators.push(new Interpolator(opts, this.buffer));
  }
  /**
   * Sample the interpolated value at a single path at an arbitrary past
   * server timestamp — the client-side analogue of the server's
   * `ctx.rewindTo`. Reuses the same SnapshotBuffer + lerp + wildcard path
   * resolver the live frame loop uses, but is a pure read: it does not touch
   * the frame loop or any prediction/correction state.
   *
   * `atServerTs` is in the server time domain (same as snapshot `ts`); convert
   * a client wall-clock time with `clientTs - serverClockOffset`. Returns the
   * interpolated leaf value for a plain path, a `Record<string, unknown>`
   * keyed by resolved path for a `*` wildcard, or `null` when `atServerTs`
   * falls outside the buffer's retained horizon.
   */
  sampleAt(path, type, atServerTs) {
    return sampleAt(this.buffer, path, type, atServerTs);
  }
  /**
   * Bind a {@link Sampler} to a fixed past server timestamp so callers can
   * read several paths at one frozen time ergonomically (e.g. hit detection
   * across multiple entities at a shot's server time). Thin wrapper over the
   * same buffer lookup + lerp as {@link sampleAt}.
   */
  rewindTo(atServerTs) {
    return new Sampler(this.buffer, atServerTs);
  }
  /** Current median client→server clock offset (clientNow − serverTs). */
  get serverClockOffset() {
    return this.clock.offset;
  }
  /**
   * Adaptive smoothing: when enabled, the interpolation render delay grows
   * with measured connection jitter so a bursty link buffers more (fewer
   * gaps) and a steady link stays responsive. Effective extra delay =
   * clamp(gain * ServerClock.jitter, 0, maxExtraMs), added on top of each
   * interpolator's base renderDelay. Defaults: gain 1.5, maxExtraMs 200.
   */
  setAdaptiveSmoothing(opts) {
    this.adaptive = {
      enabled: opts.enabled,
      gain: opts.gain ?? this.adaptive.gain,
      maxExtraMs: opts.maxExtraMs ?? this.adaptive.maxExtraMs
    };
  }
  /** Current adaptive extra delay (ms) given the live jitter estimate. */
  adaptiveExtraDelay() {
    if (!this.adaptive.enabled) return 0;
    const raw = this.adaptive.gain * this.clock.jitter;
    return Math.max(0, Math.min(this.adaptive.maxExtraMs, raw));
  }
  // `now` must be in the same clock domain as the server's `state-*.ts`
  // timestamps (Date.now() — wall clock). Do not pass `performance.now()`.
  tickFrame(now = Date.now()) {
    if (this.listeners.frame.length > 0 && this.interpolators.length > 0) {
      const offset = this.clock.offset;
      const minDelay = this.interpolators.reduce(
        (m, i) => Math.min(m, i.renderDelay),
        Infinity
      );
      const target = now - offset - minDelay - this.adaptiveExtraDelay();
      const interpolated = {};
      for (const i of this.interpolators) Object.assign(interpolated, i.tick(target));
      for (const h of this.listeners.frame) h({ interpolated, ts: target });
    }
    if (this.predictor !== null) {
      for (const t of this.predictedTracks) {
        const base = readPath(this.predictor.predictedState, t.opts.path);
        const offset = t.track.read(now);
        this.correctedState[t.opts.path] = applyOffset(t.opts.type, base, offset);
      }
    }
  }
  startFrameLoop(intervalMs = 16) {
    this.stopFrameLoop();
    this.frameTimer = setInterval(() => this.tickFrame(), intervalMs);
  }
  stopFrameLoop() {
    if (this.frameTimer !== null) {
      clearInterval(this.frameTimer);
      this.frameTimer = null;
    }
  }
  dispatch(env) {
    switch (env.type) {
      case "message":
        for (const h of this.listeners.message) h({ from: env.from, data: env.data });
        break;
      case "join":
        for (const h of this.listeners.join) h({ playerId: env.playerId, players: env.players });
        break;
      case "leave":
        for (const h of this.listeners.leave) h({ playerId: env.playerId, players: env.players });
        break;
      case "state-snapshot":
        if (env.lastAckedSeq !== void 0) this.lastAckedSeq = env.lastAckedSeq;
        this.currentState = env.state;
        this.snapshotSink?.(env.ts, this.currentState);
        break;
      case "state-patch": {
        if (env.lastAckedSeq !== void 0) this.lastAckedSeq = env.lastAckedSeq;
        const next = fast_json_patch_default.applyPatch(
          structuredClone(this.currentState ?? {}),
          env.patch
        ).newDocument;
        this.currentState = next;
        this.snapshotSink?.(env.ts, this.currentState);
        break;
      }
      case "error":
      case "reconnect-token":
        break;
    }
  }
};

// src/matchmaker.ts
async function callMatchmake(apiUrl, token, req) {
  const res = await fetch(`${apiUrl}/v1/matchmake`, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${token}` },
    body: JSON.stringify(req)
  });
  if (!res.ok) throw new Error(`matchmake failed: ${res.status}`);
  return res.json();
}

// src/persistence/profiles.ts
var ProfileClient = class {
  constructor(apiUrl, tokenGetter) {
    this.apiUrl = apiUrl;
    this.tokenGetter = tokenGetter;
  }
  async me() {
    const res = await fetch(`${this.apiUrl}/v1/profiles/me`, {
      headers: { authorization: `Bearer ${this.tokenGetter()}` }
    });
    if (!res.ok) throw new Error(`profile.me failed: ${res.status}`);
    return res.json();
  }
};

// src/persistence/leaderboards.ts
var LeaderboardClient = class {
  constructor(apiUrl, name, tokenGetter) {
    this.apiUrl = apiUrl;
    this.name = name;
    this.tokenGetter = tokenGetter;
  }
  async top(n = 100, period = "alltime") {
    const res = await fetch(
      `${this.apiUrl}/v1/leaderboards/${encodeURIComponent(this.name)}/top?n=${n}&period=${encodeURIComponent(period)}`,
      { headers: { authorization: `Bearer ${this.tokenGetter()}` } }
    );
    if (!res.ok) throw new Error(`leaderboard.top failed: ${res.status}`);
    const body = await res.json();
    return body.entries;
  }
  async around(k = 5, period = "alltime") {
    const res = await fetch(
      `${this.apiUrl}/v1/leaderboards/${encodeURIComponent(this.name)}/around?k=${k}&period=${encodeURIComponent(period)}`,
      { headers: { authorization: `Bearer ${this.tokenGetter()}` } }
    );
    if (!res.ok) throw new Error(`leaderboard.around failed: ${res.status}`);
    const body = await res.json();
    return body.entries;
  }
};

// src/persistence/saves.ts
var SaveClient = class {
  constructor(apiUrl, tokenGetter) {
    this.apiUrl = apiUrl;
    this.tokenGetter = tokenGetter;
  }
  async slots() {
    const res = await fetch(`${this.apiUrl}/v1/saves`, {
      headers: { authorization: `Bearer ${this.tokenGetter()}` }
    });
    if (!res.ok) throw new Error(`save.slots failed: ${res.status}`);
    const body = await res.json();
    return body.slots;
  }
  async get(slot) {
    const res = await fetch(`${this.apiUrl}/v1/saves/${encodeURIComponent(slot)}`, {
      headers: { authorization: `Bearer ${this.tokenGetter()}` }
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error(`save.get failed: ${res.status}`);
    return res.json();
  }
};

// src/plot.ts
var DEFAULT_API_URL = "https://api.plot.ws";
var Plot = class {
  options;
  currentToken = null;
  profile;
  save;
  leaderboard;
  constructor(options) {
    this.options = options;
  }
  getToken() {
    if (!this.currentToken) throw new Error("not connected \u2014 call connect() or join() first");
    return this.currentToken;
  }
  wirePersistence(apiUrl) {
    const tg = () => this.getToken();
    this.profile = new ProfileClient(apiUrl, tg);
    this.save = new SaveClient(apiUrl, tg);
    this.leaderboard = (name) => new LeaderboardClient(apiUrl, name, tg);
  }
  async connect() {
    const apiUrl = this.options.apiUrl ?? DEFAULT_API_URL;
    const res = await fetch(`${apiUrl}/v1/connect`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ appKey: this.options.appKey, playerId: this.options.playerId })
    });
    if (!res.ok) throw new Error(`connect failed: ${res.status}`);
    const { token } = await res.json();
    this.currentToken = token;
    this.wirePersistence(apiUrl);
  }
  async join(opts) {
    const apiUrl = this.options.apiUrl ?? DEFAULT_API_URL;
    const body = {
      appKey: this.options.appKey,
      playerId: this.options.playerId
    };
    const cres = await fetch(`${apiUrl}/v1/connect`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    if (!cres.ok) throw new Error(`connect failed: ${cres.status}`);
    const { token, wsUrl } = await cres.json();
    this.currentToken = token;
    this.wirePersistence(apiUrl);
    let roomCode = opts.roomCode;
    if (opts.mode && opts.mode !== "code") {
      const mm = await callMatchmake(apiUrl, token, {
        mode: opts.mode,
        maxPlayers: opts.maxPlayers,
        attrs: opts.attrs,
        rank: opts.rank
      });
      roomCode = mm.roomCode;
    }
    if (!roomCode) throw new Error("roomCode required for code mode or matchmake failure");
    const transport = await openTransport(wsUrl, roomCode, token);
    return new Room(this.options.playerId, transport);
  }
};
export {
  Plot,
  Room
};
/*! Bundled license information:

fast-json-patch/module/helpers.mjs:
  (*!
   * https://github.com/Starcounter-Jack/JSON-Patch
   * (c) 2017-2022 Joachim Wester
   * MIT licensed
   *)

fast-json-patch/module/duplex.mjs:
  (*!
   * https://github.com/Starcounter-Jack/JSON-Patch
   * (c) 2017-2021 Joachim Wester
   * MIT license
   *)
*/
