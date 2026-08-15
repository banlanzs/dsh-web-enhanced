window.__ModuleLoader__.load({
	id: "dsh-web-enhanced",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react_jsx_runtime = require("react/jsx-runtime");
		let react = require("react");
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/core.js
		var _a$1;
		function $constructor(name, initializer, params) {
			function init(inst, def) {
				if (!inst._zod) Object.defineProperty(inst, "_zod", {
					value: {
						def,
						constr: _,
						traits: /* @__PURE__ */ new Set()
					},
					enumerable: false
				});
				if (inst._zod.traits.has(name)) return;
				inst._zod.traits.add(name);
				initializer(inst, def);
				const proto = _.prototype;
				const keys = Object.keys(proto);
				for (let i = 0; i < keys.length; i++) {
					const k = keys[i];
					if (!(k in inst)) inst[k] = proto[k].bind(inst);
				}
			}
			const Parent = params?.Parent ?? Object;
			class Definition extends Parent {}
			Object.defineProperty(Definition, "name", { value: name });
			function _(def) {
				var _a;
				const inst = params?.Parent ? new Definition() : this;
				init(inst, def);
				(_a = inst._zod).deferred ?? (_a.deferred = []);
				for (const fn of inst._zod.deferred) fn();
				return inst;
			}
			Object.defineProperty(_, "init", { value: init });
			Object.defineProperty(_, Symbol.hasInstance, { value: (inst) => {
				if (params?.Parent && inst instanceof params.Parent) return true;
				return inst?._zod?.traits?.has(name);
			} });
			Object.defineProperty(_, "name", { value: name });
			return _;
		}
		var $ZodAsyncError = class extends Error {
			constructor() {
				super(`Encountered Promise during synchronous parse. Use .parseAsync() instead.`);
			}
		};
		var $ZodEncodeError = class extends Error {
			constructor(name) {
				super(`Encountered unidirectional transform during encode: ${name}`);
				this.name = "ZodEncodeError";
			}
		};
		(_a$1 = globalThis).__zod_globalConfig ?? (_a$1.__zod_globalConfig = {});
		const globalConfig = globalThis.__zod_globalConfig;
		function config(newConfig) {
			if (newConfig) Object.assign(globalConfig, newConfig);
			return globalConfig;
		}
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/util.js
		function getEnumValues(entries) {
			const numericValues = Object.values(entries).filter((v) => typeof v === "number");
			return Object.entries(entries).filter(([k, _]) => numericValues.indexOf(+k) === -1).map(([_, v]) => v);
		}
		function jsonStringifyReplacer(_, value) {
			if (typeof value === "bigint") return value.toString();
			return value;
		}
		function cached(getter) {
			return { get value() {
				{
					const value = getter();
					Object.defineProperty(this, "value", { value });
					return value;
				}
			} };
		}
		function nullish(input) {
			return input === null || input === void 0;
		}
		function cleanRegex(source) {
			const start = source.startsWith("^") ? 1 : 0;
			const end = source.endsWith("$") ? source.length - 1 : source.length;
			return source.slice(start, end);
		}
		function floatSafeRemainder(val, step) {
			const ratio = val / step;
			const roundedRatio = Math.round(ratio);
			const tolerance = Number.EPSILON * Math.max(Math.abs(ratio), 1);
			if (Math.abs(ratio - roundedRatio) < tolerance) return 0;
			return ratio - roundedRatio;
		}
		const EVALUATING = /* @__PURE__*/ Symbol("evaluating");
		function defineLazy(object, key, getter) {
			let value = void 0;
			Object.defineProperty(object, key, {
				get() {
					if (value === EVALUATING) return;
					if (value === void 0) {
						value = EVALUATING;
						value = getter();
					}
					return value;
				},
				set(v) {
					Object.defineProperty(object, key, { value: v });
				},
				configurable: true
			});
		}
		function assignProp(target, prop, value) {
			Object.defineProperty(target, prop, {
				value,
				writable: true,
				enumerable: true,
				configurable: true
			});
		}
		function mergeDefs(...defs) {
			const mergedDescriptors = {};
			for (const def of defs) {
				const descriptors = Object.getOwnPropertyDescriptors(def);
				Object.assign(mergedDescriptors, descriptors);
			}
			return Object.defineProperties({}, mergedDescriptors);
		}
		function esc(str) {
			return JSON.stringify(str);
		}
		function slugify(input) {
			return input.toLowerCase().trim().replace(/[^\w\s-]/g, "").replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "");
		}
		const captureStackTrace = "captureStackTrace" in Error ? Error.captureStackTrace : (..._args) => {};
		function isObject(data) {
			return typeof data === "object" && data !== null && !Array.isArray(data);
		}
		const allowsEval = /* @__PURE__*/ cached(() => {
			if (globalConfig.jitless) return false;
			if (typeof navigator !== "undefined" && navigator?.userAgent?.includes("Cloudflare")) return false;
			try {
				new Function("");
				return true;
			} catch (_) {
				return false;
			}
		});
		function isPlainObject(o) {
			if (isObject(o) === false) return false;
			const ctor = o.constructor;
			if (ctor === void 0) return true;
			if (typeof ctor !== "function") return true;
			const prot = ctor.prototype;
			if (isObject(prot) === false) return false;
			if (Object.prototype.hasOwnProperty.call(prot, "isPrototypeOf") === false) return false;
			return true;
		}
		function shallowClone(o) {
			if (isPlainObject(o)) return { ...o };
			if (Array.isArray(o)) return [...o];
			if (o instanceof Map) return new Map(o);
			if (o instanceof Set) return new Set(o);
			return o;
		}
		const propertyKeyTypes = /* @__PURE__*/ new Set([
			"string",
			"number",
			"symbol"
		]);
		function escapeRegex(str) {
			return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
		}
		function clone(inst, def, params) {
			const cl = new inst._zod.constr(def ?? inst._zod.def);
			if (!def || params?.parent) cl._zod.parent = inst;
			return cl;
		}
		function normalizeParams(_params) {
			const params = _params;
			if (!params) return {};
			if (typeof params === "string") return { error: () => params };
			if (params?.message !== void 0) {
				if (params?.error !== void 0) throw new Error("Cannot specify both `message` and `error` params");
				params.error = params.message;
			}
			delete params.message;
			if (typeof params.error === "string") return {
				...params,
				error: () => params.error
			};
			return params;
		}
		function optionalKeys(shape) {
			return Object.keys(shape).filter((k) => {
				return shape[k]._zod.optin === "optional" && shape[k]._zod.optout === "optional";
			});
		}
		const NUMBER_FORMAT_RANGES = {
			safeint: [Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER],
			int32: [-2147483648, 2147483647],
			uint32: [0, 4294967295],
			float32: [-34028234663852886e22, 34028234663852886e22],
			float64: [-Number.MAX_VALUE, Number.MAX_VALUE]
		};
		function pick(schema, mask) {
			const currDef = schema._zod.def;
			const checks = currDef.checks;
			if (checks && checks.length > 0) throw new Error(".pick() cannot be used on object schemas containing refinements");
			return clone(schema, mergeDefs(schema._zod.def, {
				get shape() {
					const newShape = {};
					for (const key in mask) {
						if (!(key in currDef.shape)) throw new Error(`Unrecognized key: "${key}"`);
						if (!mask[key]) continue;
						newShape[key] = currDef.shape[key];
					}
					assignProp(this, "shape", newShape);
					return newShape;
				},
				checks: []
			}));
		}
		function omit(schema, mask) {
			const currDef = schema._zod.def;
			const checks = currDef.checks;
			if (checks && checks.length > 0) throw new Error(".omit() cannot be used on object schemas containing refinements");
			return clone(schema, mergeDefs(schema._zod.def, {
				get shape() {
					const newShape = { ...schema._zod.def.shape };
					for (const key in mask) {
						if (!(key in currDef.shape)) throw new Error(`Unrecognized key: "${key}"`);
						if (!mask[key]) continue;
						delete newShape[key];
					}
					assignProp(this, "shape", newShape);
					return newShape;
				},
				checks: []
			}));
		}
		function extend(schema, shape) {
			if (!isPlainObject(shape)) throw new Error("Invalid input to extend: expected a plain object");
			const checks = schema._zod.def.checks;
			if (checks && checks.length > 0) {
				const existingShape = schema._zod.def.shape;
				for (const key in shape) if (Object.getOwnPropertyDescriptor(existingShape, key) !== void 0) throw new Error("Cannot overwrite keys on object schemas containing refinements. Use `.safeExtend()` instead.");
			}
			return clone(schema, mergeDefs(schema._zod.def, { get shape() {
				const _shape = {
					...schema._zod.def.shape,
					...shape
				};
				assignProp(this, "shape", _shape);
				return _shape;
			} }));
		}
		function safeExtend(schema, shape) {
			if (!isPlainObject(shape)) throw new Error("Invalid input to safeExtend: expected a plain object");
			return clone(schema, mergeDefs(schema._zod.def, { get shape() {
				const _shape = {
					...schema._zod.def.shape,
					...shape
				};
				assignProp(this, "shape", _shape);
				return _shape;
			} }));
		}
		function merge(a, b) {
			if (a._zod.def.checks?.length) throw new Error(".merge() cannot be used on object schemas containing refinements. Use .safeExtend() instead.");
			return clone(a, mergeDefs(a._zod.def, {
				get shape() {
					const _shape = {
						...a._zod.def.shape,
						...b._zod.def.shape
					};
					assignProp(this, "shape", _shape);
					return _shape;
				},
				get catchall() {
					return b._zod.def.catchall;
				},
				checks: b._zod.def.checks ?? []
			}));
		}
		function partial(Class, schema, mask) {
			const checks = schema._zod.def.checks;
			if (checks && checks.length > 0) throw new Error(".partial() cannot be used on object schemas containing refinements");
			return clone(schema, mergeDefs(schema._zod.def, {
				get shape() {
					const oldShape = schema._zod.def.shape;
					const shape = { ...oldShape };
					if (mask) for (const key in mask) {
						if (!(key in oldShape)) throw new Error(`Unrecognized key: "${key}"`);
						if (!mask[key]) continue;
						shape[key] = Class ? new Class({
							type: "optional",
							innerType: oldShape[key]
						}) : oldShape[key];
					}
					else for (const key in oldShape) shape[key] = Class ? new Class({
						type: "optional",
						innerType: oldShape[key]
					}) : oldShape[key];
					assignProp(this, "shape", shape);
					return shape;
				},
				checks: []
			}));
		}
		function required(Class, schema, mask) {
			return clone(schema, mergeDefs(schema._zod.def, { get shape() {
				const oldShape = schema._zod.def.shape;
				const shape = { ...oldShape };
				if (mask) for (const key in mask) {
					if (!(key in shape)) throw new Error(`Unrecognized key: "${key}"`);
					if (!mask[key]) continue;
					shape[key] = new Class({
						type: "nonoptional",
						innerType: oldShape[key]
					});
				}
				else for (const key in oldShape) shape[key] = new Class({
					type: "nonoptional",
					innerType: oldShape[key]
				});
				assignProp(this, "shape", shape);
				return shape;
			} }));
		}
		function aborted(x, startIndex = 0) {
			if (x.aborted === true) return true;
			for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue !== true) return true;
			return false;
		}
		function explicitlyAborted(x, startIndex = 0) {
			if (x.aborted === true) return true;
			for (let i = startIndex; i < x.issues.length; i++) if (x.issues[i]?.continue === false) return true;
			return false;
		}
		function prefixIssues(path, issues) {
			return issues.map((iss) => {
				var _a;
				(_a = iss).path ?? (_a.path = []);
				iss.path.unshift(path);
				return iss;
			});
		}
		function unwrapMessage(message) {
			return typeof message === "string" ? message : message?.message;
		}
		function finalizeIssue(iss, ctx, config) {
			const message = iss.message ? iss.message : unwrapMessage(iss.inst?._zod.def?.error?.(iss)) ?? unwrapMessage(ctx?.error?.(iss)) ?? unwrapMessage(config.customError?.(iss)) ?? unwrapMessage(config.localeError?.(iss)) ?? "Invalid input";
			const { inst: _inst, continue: _continue, input: _input, ...rest } = iss;
			rest.path ?? (rest.path = []);
			rest.message = message;
			if (ctx?.reportInput) rest.input = _input;
			return rest;
		}
		function getLengthableOrigin(input) {
			if (Array.isArray(input)) return "array";
			if (typeof input === "string") return "string";
			return "unknown";
		}
		function issue(...args) {
			const [iss, input, inst] = args;
			if (typeof iss === "string") return {
				message: iss,
				code: "custom",
				input,
				inst
			};
			return { ...iss };
		}
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/errors.js
		const initializer$1 = (inst, def) => {
			inst.name = "$ZodError";
			Object.defineProperty(inst, "_zod", {
				value: inst._zod,
				enumerable: false
			});
			Object.defineProperty(inst, "issues", {
				value: def,
				enumerable: false
			});
			inst.message = JSON.stringify(def, jsonStringifyReplacer, 2);
			Object.defineProperty(inst, "toString", {
				value: () => inst.message,
				enumerable: false
			});
		};
		const $ZodError = $constructor("$ZodError", initializer$1);
		const $ZodRealError = $constructor("$ZodError", initializer$1, { Parent: Error });
		function flattenError(error, mapper = (issue) => issue.message) {
			const fieldErrors = {};
			const formErrors = [];
			for (const sub of error.issues) if (sub.path.length > 0) {
				fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
				fieldErrors[sub.path[0]].push(mapper(sub));
			} else formErrors.push(mapper(sub));
			return {
				formErrors,
				fieldErrors
			};
		}
		function formatError(error, mapper = (issue) => issue.message) {
			const fieldErrors = { _errors: [] };
			const processError = (error, path = []) => {
				for (const issue of error.issues) if (issue.code === "invalid_union" && issue.errors.length) issue.errors.map((issues) => processError({ issues }, [...path, ...issue.path]));
				else if (issue.code === "invalid_key") processError({ issues: issue.issues }, [...path, ...issue.path]);
				else if (issue.code === "invalid_element") processError({ issues: issue.issues }, [...path, ...issue.path]);
				else {
					const fullpath = [...path, ...issue.path];
					if (fullpath.length === 0) fieldErrors._errors.push(mapper(issue));
					else {
						let curr = fieldErrors;
						let i = 0;
						while (i < fullpath.length) {
							const el = fullpath[i];
							if (!(i === fullpath.length - 1)) curr[el] = curr[el] || { _errors: [] };
							else {
								curr[el] = curr[el] || { _errors: [] };
								curr[el]._errors.push(mapper(issue));
							}
							curr = curr[el];
							i++;
						}
					}
				}
			};
			processError(error);
			return fieldErrors;
		}
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/parse.js
		const _parse = (_Err) => (schema, value, _ctx, _params) => {
			const ctx = _ctx ? {
				..._ctx,
				async: false
			} : { async: false };
			const result = schema._zod.run({
				value,
				issues: []
			}, ctx);
			if (result instanceof Promise) throw new $ZodAsyncError();
			if (result.issues.length) {
				const e = new ((_params?.Err) ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
				captureStackTrace(e, _params?.callee);
				throw e;
			}
			return result.value;
		};
		const _parseAsync = (_Err) => async (schema, value, _ctx, params) => {
			const ctx = _ctx ? {
				..._ctx,
				async: true
			} : { async: true };
			let result = schema._zod.run({
				value,
				issues: []
			}, ctx);
			if (result instanceof Promise) result = await result;
			if (result.issues.length) {
				const e = new ((params?.Err) ?? _Err)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())));
				captureStackTrace(e, params?.callee);
				throw e;
			}
			return result.value;
		};
		const _safeParse = (_Err) => (schema, value, _ctx) => {
			const ctx = _ctx ? {
				..._ctx,
				async: false
			} : { async: false };
			const result = schema._zod.run({
				value,
				issues: []
			}, ctx);
			if (result instanceof Promise) throw new $ZodAsyncError();
			return result.issues.length ? {
				success: false,
				error: new (_Err ?? $ZodError)(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
			} : {
				success: true,
				data: result.value
			};
		};
		const safeParse$1 = /* @__PURE__*/ _safeParse($ZodRealError);
		const _safeParseAsync = (_Err) => async (schema, value, _ctx) => {
			const ctx = _ctx ? {
				..._ctx,
				async: true
			} : { async: true };
			let result = schema._zod.run({
				value,
				issues: []
			}, ctx);
			if (result instanceof Promise) result = await result;
			return result.issues.length ? {
				success: false,
				error: new _Err(result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
			} : {
				success: true,
				data: result.value
			};
		};
		const safeParseAsync$1 = /* @__PURE__*/ _safeParseAsync($ZodRealError);
		const _encode = (_Err) => (schema, value, _ctx) => {
			const ctx = _ctx ? {
				..._ctx,
				direction: "backward"
			} : { direction: "backward" };
			return _parse(_Err)(schema, value, ctx);
		};
		const _decode = (_Err) => (schema, value, _ctx) => {
			return _parse(_Err)(schema, value, _ctx);
		};
		const _encodeAsync = (_Err) => async (schema, value, _ctx) => {
			const ctx = _ctx ? {
				..._ctx,
				direction: "backward"
			} : { direction: "backward" };
			return _parseAsync(_Err)(schema, value, ctx);
		};
		const _decodeAsync = (_Err) => async (schema, value, _ctx) => {
			return _parseAsync(_Err)(schema, value, _ctx);
		};
		const _safeEncode = (_Err) => (schema, value, _ctx) => {
			const ctx = _ctx ? {
				..._ctx,
				direction: "backward"
			} : { direction: "backward" };
			return _safeParse(_Err)(schema, value, ctx);
		};
		const _safeDecode = (_Err) => (schema, value, _ctx) => {
			return _safeParse(_Err)(schema, value, _ctx);
		};
		const _safeEncodeAsync = (_Err) => async (schema, value, _ctx) => {
			const ctx = _ctx ? {
				..._ctx,
				direction: "backward"
			} : { direction: "backward" };
			return _safeParseAsync(_Err)(schema, value, ctx);
		};
		const _safeDecodeAsync = (_Err) => async (schema, value, _ctx) => {
			return _safeParseAsync(_Err)(schema, value, _ctx);
		};
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/regexes.js
		/**
		* @deprecated CUID v1 is deprecated by its authors due to information leakage
		* (timestamps embedded in the id). Use {@link cuid2} instead.
		* See https://github.com/paralleldrive/cuid.
		*/
		const cuid = /^[cC][0-9a-z]{6,}$/;
		const cuid2 = /^[0-9a-z]+$/;
		const ulid = /^[0-9A-HJKMNP-TV-Za-hjkmnp-tv-z]{26}$/;
		const xid = /^[0-9a-vA-V]{20}$/;
		const ksuid = /^[A-Za-z0-9]{27}$/;
		const nanoid = /^[a-zA-Z0-9_-]{21}$/;
		/** ISO 8601-1 duration regex. Does not support the 8601-2 extensions like negative durations or fractional/negative components. */
		const duration$1 = /^P(?:(\d+W)|(?!.*W)(?=\d|T\d)(\d+Y)?(\d+M)?(\d+D)?(T(?=\d)(\d+H)?(\d+M)?(\d+([.,]\d+)?S)?)?)$/;
		/** A regex for any UUID-like identifier: 8-4-4-4-12 hex pattern */
		const guid = /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})$/;
		/** Returns a regex for validating an RFC 9562/4122 UUID.
		*
		* @param version Optionally specify a version 1-8. If no version is specified, all versions are supported. */
		const uuid = (version) => {
			if (!version) return /^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}|00000000-0000-0000-0000-000000000000|ffffffff-ffff-ffff-ffff-ffffffffffff)$/;
			return new RegExp(`^([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-${version}[0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12})$`);
		};
		/** Practical email validation */
		const email = /^(?!\.)(?!.*\.\.)([A-Za-z0-9_'+\-\.]*)[A-Za-z0-9_+-]@([A-Za-z0-9][A-Za-z0-9\-]*\.)+[A-Za-z]{2,}$/;
		const _emoji$1 = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
		function emoji() {
			return new RegExp(_emoji$1, "u");
		}
		const ipv4 = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
		const ipv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:))$/;
		const cidrv4 = /^((25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/([0-9]|[1-2][0-9]|3[0-2])$/;
		const cidrv6 = /^(([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|::|([0-9a-fA-F]{1,4})?::([0-9a-fA-F]{1,4}:?){0,6})\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
		const base64 = /^$|^(?:[0-9a-zA-Z+/]{4})*(?:(?:[0-9a-zA-Z+/]{2}==)|(?:[0-9a-zA-Z+/]{3}=))?$/;
		const base64url = /^[A-Za-z0-9_-]*$/;
		const httpProtocol = /^https?$/;
		const e164 = /^\+[1-9]\d{6,14}$/;
		const dateSource = `(?:(?:\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-(?:(?:0[13578]|1[02])-(?:0[1-9]|[12]\\d|3[01])|(?:0[469]|11)-(?:0[1-9]|[12]\\d|30)|(?:02)-(?:0[1-9]|1\\d|2[0-8])))`;
		const date$1 = /*@__PURE__*/ new RegExp(`^${dateSource}$`);
		function timeSource(args) {
			const hhmm = `(?:[01]\\d|2[0-3]):[0-5]\\d`;
			return typeof args.precision === "number" ? args.precision === -1 ? `${hhmm}` : args.precision === 0 ? `${hhmm}:[0-5]\\d` : `${hhmm}:[0-5]\\d\\.\\d{${args.precision}}` : `${hhmm}(?::[0-5]\\d(?:\\.\\d+)?)?`;
		}
		function time$1(args) {
			return new RegExp(`^${timeSource(args)}$`);
		}
		function datetime$1(args) {
			const time = timeSource({ precision: args.precision });
			const opts = ["Z"];
			if (args.local) opts.push("");
			if (args.offset) opts.push(`([+-](?:[01]\\d|2[0-3]):[0-5]\\d)`);
			const timeRegex = `${time}(?:${opts.join("|")})`;
			return new RegExp(`^${dateSource}T(?:${timeRegex})$`);
		}
		const string$1 = (params) => {
			const regex = params ? `[\\s\\S]{${params?.minimum ?? 0},${params?.maximum ?? ""}}` : `[\\s\\S]*`;
			return new RegExp(`^${regex}$`);
		};
		const integer = /^-?\d+$/;
		const number$1 = /^-?\d+(?:\.\d+)?$/;
		const boolean$1 = /^(?:true|false)$/i;
		const lowercase = /^[^A-Z]*$/;
		const uppercase = /^[^a-z]*$/;
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/checks.js
		const $ZodCheck = /*@__PURE__*/ $constructor("$ZodCheck", (inst, def) => {
			var _a;
			inst._zod ?? (inst._zod = {});
			inst._zod.def = def;
			(_a = inst._zod).onattach ?? (_a.onattach = []);
		});
		const numericOriginMap = {
			number: "number",
			bigint: "bigint",
			object: "date"
		};
		const $ZodCheckLessThan = /*@__PURE__*/ $constructor("$ZodCheckLessThan", (inst, def) => {
			$ZodCheck.init(inst, def);
			const origin = numericOriginMap[typeof def.value];
			inst._zod.onattach.push((inst) => {
				const bag = inst._zod.bag;
				const curr = (def.inclusive ? bag.maximum : bag.exclusiveMaximum) ?? Number.POSITIVE_INFINITY;
				if (def.value < curr) {
					if (def.inclusive) bag.maximum = def.value;
					else bag.exclusiveMaximum = def.value;
				}
			});
			inst._zod.check = (payload) => {
				if (def.inclusive ? payload.value <= def.value : payload.value < def.value) return;
				payload.issues.push({
					origin,
					code: "too_big",
					maximum: typeof def.value === "object" ? def.value.getTime() : def.value,
					input: payload.value,
					inclusive: def.inclusive,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckGreaterThan = /*@__PURE__*/ $constructor("$ZodCheckGreaterThan", (inst, def) => {
			$ZodCheck.init(inst, def);
			const origin = numericOriginMap[typeof def.value];
			inst._zod.onattach.push((inst) => {
				const bag = inst._zod.bag;
				const curr = (def.inclusive ? bag.minimum : bag.exclusiveMinimum) ?? Number.NEGATIVE_INFINITY;
				if (def.value > curr) {
					if (def.inclusive) bag.minimum = def.value;
					else bag.exclusiveMinimum = def.value;
				}
			});
			inst._zod.check = (payload) => {
				if (def.inclusive ? payload.value >= def.value : payload.value > def.value) return;
				payload.issues.push({
					origin,
					code: "too_small",
					minimum: typeof def.value === "object" ? def.value.getTime() : def.value,
					input: payload.value,
					inclusive: def.inclusive,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckMultipleOf = /*@__PURE__*/ $constructor("$ZodCheckMultipleOf", (inst, def) => {
			$ZodCheck.init(inst, def);
			inst._zod.onattach.push((inst) => {
				var _a;
				(_a = inst._zod.bag).multipleOf ?? (_a.multipleOf = def.value);
			});
			inst._zod.check = (payload) => {
				if (typeof payload.value !== typeof def.value) throw new Error("Cannot mix number and bigint in multiple_of check.");
				if (typeof payload.value === "bigint" ? payload.value % def.value === BigInt(0) : floatSafeRemainder(payload.value, def.value) === 0) return;
				payload.issues.push({
					origin: typeof payload.value,
					code: "not_multiple_of",
					divisor: def.value,
					input: payload.value,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckNumberFormat = /*@__PURE__*/ $constructor("$ZodCheckNumberFormat", (inst, def) => {
			$ZodCheck.init(inst, def);
			def.format = def.format || "float64";
			const isInt = def.format?.includes("int");
			const origin = isInt ? "int" : "number";
			const [minimum, maximum] = NUMBER_FORMAT_RANGES[def.format];
			inst._zod.onattach.push((inst) => {
				const bag = inst._zod.bag;
				bag.format = def.format;
				bag.minimum = minimum;
				bag.maximum = maximum;
				if (isInt) bag.pattern = integer;
			});
			inst._zod.check = (payload) => {
				const input = payload.value;
				if (isInt) {
					if (!Number.isInteger(input)) {
						payload.issues.push({
							expected: origin,
							format: def.format,
							code: "invalid_type",
							continue: false,
							input,
							inst
						});
						return;
					}
					if (!Number.isSafeInteger(input)) {
						if (input > 0) payload.issues.push({
							input,
							code: "too_big",
							maximum: Number.MAX_SAFE_INTEGER,
							note: "Integers must be within the safe integer range.",
							inst,
							origin,
							inclusive: true,
							continue: !def.abort
						});
						else payload.issues.push({
							input,
							code: "too_small",
							minimum: Number.MIN_SAFE_INTEGER,
							note: "Integers must be within the safe integer range.",
							inst,
							origin,
							inclusive: true,
							continue: !def.abort
						});
						return;
					}
				}
				if (input < minimum) payload.issues.push({
					origin: "number",
					input,
					code: "too_small",
					minimum,
					inclusive: true,
					inst,
					continue: !def.abort
				});
				if (input > maximum) payload.issues.push({
					origin: "number",
					input,
					code: "too_big",
					maximum,
					inclusive: true,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckMaxLength = /*@__PURE__*/ $constructor("$ZodCheckMaxLength", (inst, def) => {
			var _a;
			$ZodCheck.init(inst, def);
			(_a = inst._zod.def).when ?? (_a.when = (payload) => {
				const val = payload.value;
				return !nullish(val) && val.length !== void 0;
			});
			inst._zod.onattach.push((inst) => {
				const curr = inst._zod.bag.maximum ?? Number.POSITIVE_INFINITY;
				if (def.maximum < curr) inst._zod.bag.maximum = def.maximum;
			});
			inst._zod.check = (payload) => {
				const input = payload.value;
				if (input.length <= def.maximum) return;
				const origin = getLengthableOrigin(input);
				payload.issues.push({
					origin,
					code: "too_big",
					maximum: def.maximum,
					inclusive: true,
					input,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckMinLength = /*@__PURE__*/ $constructor("$ZodCheckMinLength", (inst, def) => {
			var _a;
			$ZodCheck.init(inst, def);
			(_a = inst._zod.def).when ?? (_a.when = (payload) => {
				const val = payload.value;
				return !nullish(val) && val.length !== void 0;
			});
			inst._zod.onattach.push((inst) => {
				const curr = inst._zod.bag.minimum ?? Number.NEGATIVE_INFINITY;
				if (def.minimum > curr) inst._zod.bag.minimum = def.minimum;
			});
			inst._zod.check = (payload) => {
				const input = payload.value;
				if (input.length >= def.minimum) return;
				const origin = getLengthableOrigin(input);
				payload.issues.push({
					origin,
					code: "too_small",
					minimum: def.minimum,
					inclusive: true,
					input,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckLengthEquals = /*@__PURE__*/ $constructor("$ZodCheckLengthEquals", (inst, def) => {
			var _a;
			$ZodCheck.init(inst, def);
			(_a = inst._zod.def).when ?? (_a.when = (payload) => {
				const val = payload.value;
				return !nullish(val) && val.length !== void 0;
			});
			inst._zod.onattach.push((inst) => {
				const bag = inst._zod.bag;
				bag.minimum = def.length;
				bag.maximum = def.length;
				bag.length = def.length;
			});
			inst._zod.check = (payload) => {
				const input = payload.value;
				const length = input.length;
				if (length === def.length) return;
				const origin = getLengthableOrigin(input);
				const tooBig = length > def.length;
				payload.issues.push({
					origin,
					...tooBig ? {
						code: "too_big",
						maximum: def.length
					} : {
						code: "too_small",
						minimum: def.length
					},
					inclusive: true,
					exact: true,
					input: payload.value,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckStringFormat = /*@__PURE__*/ $constructor("$ZodCheckStringFormat", (inst, def) => {
			var _a, _b;
			$ZodCheck.init(inst, def);
			inst._zod.onattach.push((inst) => {
				const bag = inst._zod.bag;
				bag.format = def.format;
				if (def.pattern) {
					bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
					bag.patterns.add(def.pattern);
				}
			});
			if (def.pattern) (_a = inst._zod).check ?? (_a.check = (payload) => {
				def.pattern.lastIndex = 0;
				if (def.pattern.test(payload.value)) return;
				payload.issues.push({
					origin: "string",
					code: "invalid_format",
					format: def.format,
					input: payload.value,
					...def.pattern ? { pattern: def.pattern.toString() } : {},
					inst,
					continue: !def.abort
				});
			});
			else (_b = inst._zod).check ?? (_b.check = () => {});
		});
		const $ZodCheckRegex = /*@__PURE__*/ $constructor("$ZodCheckRegex", (inst, def) => {
			$ZodCheckStringFormat.init(inst, def);
			inst._zod.check = (payload) => {
				def.pattern.lastIndex = 0;
				if (def.pattern.test(payload.value)) return;
				payload.issues.push({
					origin: "string",
					code: "invalid_format",
					format: "regex",
					input: payload.value,
					pattern: def.pattern.toString(),
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckLowerCase = /*@__PURE__*/ $constructor("$ZodCheckLowerCase", (inst, def) => {
			def.pattern ?? (def.pattern = lowercase);
			$ZodCheckStringFormat.init(inst, def);
		});
		const $ZodCheckUpperCase = /*@__PURE__*/ $constructor("$ZodCheckUpperCase", (inst, def) => {
			def.pattern ?? (def.pattern = uppercase);
			$ZodCheckStringFormat.init(inst, def);
		});
		const $ZodCheckIncludes = /*@__PURE__*/ $constructor("$ZodCheckIncludes", (inst, def) => {
			$ZodCheck.init(inst, def);
			const escapedRegex = escapeRegex(def.includes);
			const pattern = new RegExp(typeof def.position === "number" ? `^.{${def.position}}${escapedRegex}` : escapedRegex);
			def.pattern = pattern;
			inst._zod.onattach.push((inst) => {
				const bag = inst._zod.bag;
				bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
				bag.patterns.add(pattern);
			});
			inst._zod.check = (payload) => {
				if (payload.value.includes(def.includes, def.position)) return;
				payload.issues.push({
					origin: "string",
					code: "invalid_format",
					format: "includes",
					includes: def.includes,
					input: payload.value,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckStartsWith = /*@__PURE__*/ $constructor("$ZodCheckStartsWith", (inst, def) => {
			$ZodCheck.init(inst, def);
			const pattern = new RegExp(`^${escapeRegex(def.prefix)}.*`);
			def.pattern ?? (def.pattern = pattern);
			inst._zod.onattach.push((inst) => {
				const bag = inst._zod.bag;
				bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
				bag.patterns.add(pattern);
			});
			inst._zod.check = (payload) => {
				if (payload.value.startsWith(def.prefix)) return;
				payload.issues.push({
					origin: "string",
					code: "invalid_format",
					format: "starts_with",
					prefix: def.prefix,
					input: payload.value,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckEndsWith = /*@__PURE__*/ $constructor("$ZodCheckEndsWith", (inst, def) => {
			$ZodCheck.init(inst, def);
			const pattern = new RegExp(`.*${escapeRegex(def.suffix)}$`);
			def.pattern ?? (def.pattern = pattern);
			inst._zod.onattach.push((inst) => {
				const bag = inst._zod.bag;
				bag.patterns ?? (bag.patterns = /* @__PURE__ */ new Set());
				bag.patterns.add(pattern);
			});
			inst._zod.check = (payload) => {
				if (payload.value.endsWith(def.suffix)) return;
				payload.issues.push({
					origin: "string",
					code: "invalid_format",
					format: "ends_with",
					suffix: def.suffix,
					input: payload.value,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodCheckOverwrite = /*@__PURE__*/ $constructor("$ZodCheckOverwrite", (inst, def) => {
			$ZodCheck.init(inst, def);
			inst._zod.check = (payload) => {
				payload.value = def.tx(payload.value);
			};
		});
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/doc.js
		var Doc = class {
			constructor(args = []) {
				this.content = [];
				this.indent = 0;
				if (this) this.args = args;
			}
			indented(fn) {
				this.indent += 1;
				fn(this);
				this.indent -= 1;
			}
			write(arg) {
				if (typeof arg === "function") {
					arg(this, { execution: "sync" });
					arg(this, { execution: "async" });
					return;
				}
				const lines = arg.split("\n").filter((x) => x);
				const minIndent = Math.min(...lines.map((x) => x.length - x.trimStart().length));
				const dedented = lines.map((x) => x.slice(minIndent)).map((x) => " ".repeat(this.indent * 2) + x);
				for (const line of dedented) this.content.push(line);
			}
			compile() {
				const F = Function;
				const args = this?.args;
				const lines = [...(this?.content ?? [``]).map((x) => `  ${x}`)];
				return new F(...args, lines.join("\n"));
			}
		};
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/versions.js
		const version = {
			major: 4,
			minor: 4,
			patch: 3
		};
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/schemas.js
		const $ZodType = /*@__PURE__*/ $constructor("$ZodType", (inst, def) => {
			var _a;
			inst ?? (inst = {});
			inst._zod.def = def;
			inst._zod.bag = inst._zod.bag || {};
			inst._zod.version = version;
			const checks = [...inst._zod.def.checks ?? []];
			if (inst._zod.traits.has("$ZodCheck")) checks.unshift(inst);
			for (const ch of checks) for (const fn of ch._zod.onattach) fn(inst);
			if (checks.length === 0) {
				(_a = inst._zod).deferred ?? (_a.deferred = []);
				inst._zod.deferred?.push(() => {
					inst._zod.run = inst._zod.parse;
				});
			} else {
				const runChecks = (payload, checks, ctx) => {
					let isAborted = aborted(payload);
					let asyncResult;
					for (const ch of checks) {
						if (ch._zod.def.when) {
							if (explicitlyAborted(payload)) continue;
							if (!ch._zod.def.when(payload)) continue;
						} else if (isAborted) continue;
						const currLen = payload.issues.length;
						const _ = ch._zod.check(payload);
						if (_ instanceof Promise && ctx?.async === false) throw new $ZodAsyncError();
						if (asyncResult || _ instanceof Promise) asyncResult = (asyncResult ?? Promise.resolve()).then(async () => {
							await _;
							if (payload.issues.length === currLen) return;
							if (!isAborted) isAborted = aborted(payload, currLen);
						});
						else {
							if (payload.issues.length === currLen) continue;
							if (!isAborted) isAborted = aborted(payload, currLen);
						}
					}
					if (asyncResult) return asyncResult.then(() => {
						return payload;
					});
					return payload;
				};
				const handleCanaryResult = (canary, payload, ctx) => {
					if (aborted(canary)) {
						canary.aborted = true;
						return canary;
					}
					const checkResult = runChecks(payload, checks, ctx);
					if (checkResult instanceof Promise) {
						if (ctx.async === false) throw new $ZodAsyncError();
						return checkResult.then((checkResult) => inst._zod.parse(checkResult, ctx));
					}
					return inst._zod.parse(checkResult, ctx);
				};
				inst._zod.run = (payload, ctx) => {
					if (ctx.skipChecks) return inst._zod.parse(payload, ctx);
					if (ctx.direction === "backward") {
						const canary = inst._zod.parse({
							value: payload.value,
							issues: []
						}, {
							...ctx,
							skipChecks: true
						});
						if (canary instanceof Promise) return canary.then((canary) => {
							return handleCanaryResult(canary, payload, ctx);
						});
						return handleCanaryResult(canary, payload, ctx);
					}
					const result = inst._zod.parse(payload, ctx);
					if (result instanceof Promise) {
						if (ctx.async === false) throw new $ZodAsyncError();
						return result.then((result) => runChecks(result, checks, ctx));
					}
					return runChecks(result, checks, ctx);
				};
			}
			defineLazy(inst, "~standard", () => ({
				validate: (value) => {
					try {
						const r = safeParse$1(inst, value);
						return r.success ? { value: r.data } : { issues: r.error?.issues };
					} catch (_) {
						return safeParseAsync$1(inst, value).then((r) => r.success ? { value: r.data } : { issues: r.error?.issues });
					}
				},
				vendor: "zod",
				version: 1
			}));
		});
		const $ZodString = /*@__PURE__*/ $constructor("$ZodString", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.pattern = [...inst?._zod.bag?.patterns ?? []].pop() ?? string$1(inst._zod.bag);
			inst._zod.parse = (payload, _) => {
				if (def.coerce) try {
					payload.value = String(payload.value);
				} catch (_) {}
				if (typeof payload.value === "string") return payload;
				payload.issues.push({
					expected: "string",
					code: "invalid_type",
					input: payload.value,
					inst
				});
				return payload;
			};
		});
		const $ZodStringFormat = /*@__PURE__*/ $constructor("$ZodStringFormat", (inst, def) => {
			$ZodCheckStringFormat.init(inst, def);
			$ZodString.init(inst, def);
		});
		const $ZodGUID = /*@__PURE__*/ $constructor("$ZodGUID", (inst, def) => {
			def.pattern ?? (def.pattern = guid);
			$ZodStringFormat.init(inst, def);
		});
		const $ZodUUID = /*@__PURE__*/ $constructor("$ZodUUID", (inst, def) => {
			if (def.version) {
				const v = {
					v1: 1,
					v2: 2,
					v3: 3,
					v4: 4,
					v5: 5,
					v6: 6,
					v7: 7,
					v8: 8
				}[def.version];
				if (v === void 0) throw new Error(`Invalid UUID version: "${def.version}"`);
				def.pattern ?? (def.pattern = uuid(v));
			} else def.pattern ?? (def.pattern = uuid());
			$ZodStringFormat.init(inst, def);
		});
		const $ZodEmail = /*@__PURE__*/ $constructor("$ZodEmail", (inst, def) => {
			def.pattern ?? (def.pattern = email);
			$ZodStringFormat.init(inst, def);
		});
		const $ZodURL = /*@__PURE__*/ $constructor("$ZodURL", (inst, def) => {
			$ZodStringFormat.init(inst, def);
			inst._zod.check = (payload) => {
				try {
					const trimmed = payload.value.trim();
					if (!def.normalize && def.protocol?.source === httpProtocol.source) {
						if (!/^https?:\/\//i.test(trimmed)) {
							payload.issues.push({
								code: "invalid_format",
								format: "url",
								note: "Invalid URL format",
								input: payload.value,
								inst,
								continue: !def.abort
							});
							return;
						}
					}
					const url = new URL(trimmed);
					if (def.hostname) {
						def.hostname.lastIndex = 0;
						if (!def.hostname.test(url.hostname)) payload.issues.push({
							code: "invalid_format",
							format: "url",
							note: "Invalid hostname",
							pattern: def.hostname.source,
							input: payload.value,
							inst,
							continue: !def.abort
						});
					}
					if (def.protocol) {
						def.protocol.lastIndex = 0;
						if (!def.protocol.test(url.protocol.endsWith(":") ? url.protocol.slice(0, -1) : url.protocol)) payload.issues.push({
							code: "invalid_format",
							format: "url",
							note: "Invalid protocol",
							pattern: def.protocol.source,
							input: payload.value,
							inst,
							continue: !def.abort
						});
					}
					if (def.normalize) payload.value = url.href;
					else payload.value = trimmed;
					return;
				} catch (_) {
					payload.issues.push({
						code: "invalid_format",
						format: "url",
						input: payload.value,
						inst,
						continue: !def.abort
					});
				}
			};
		});
		const $ZodEmoji = /*@__PURE__*/ $constructor("$ZodEmoji", (inst, def) => {
			def.pattern ?? (def.pattern = emoji());
			$ZodStringFormat.init(inst, def);
		});
		const $ZodNanoID = /*@__PURE__*/ $constructor("$ZodNanoID", (inst, def) => {
			def.pattern ?? (def.pattern = nanoid);
			$ZodStringFormat.init(inst, def);
		});
		/**
		* @deprecated CUID v1 is deprecated by its authors due to information leakage
		* (timestamps embedded in the id). Use {@link $ZodCUID2} instead.
		* See https://github.com/paralleldrive/cuid.
		*/
		const $ZodCUID = /*@__PURE__*/ $constructor("$ZodCUID", (inst, def) => {
			def.pattern ?? (def.pattern = cuid);
			$ZodStringFormat.init(inst, def);
		});
		const $ZodCUID2 = /*@__PURE__*/ $constructor("$ZodCUID2", (inst, def) => {
			def.pattern ?? (def.pattern = cuid2);
			$ZodStringFormat.init(inst, def);
		});
		const $ZodULID = /*@__PURE__*/ $constructor("$ZodULID", (inst, def) => {
			def.pattern ?? (def.pattern = ulid);
			$ZodStringFormat.init(inst, def);
		});
		const $ZodXID = /*@__PURE__*/ $constructor("$ZodXID", (inst, def) => {
			def.pattern ?? (def.pattern = xid);
			$ZodStringFormat.init(inst, def);
		});
		const $ZodKSUID = /*@__PURE__*/ $constructor("$ZodKSUID", (inst, def) => {
			def.pattern ?? (def.pattern = ksuid);
			$ZodStringFormat.init(inst, def);
		});
		const $ZodISODateTime = /*@__PURE__*/ $constructor("$ZodISODateTime", (inst, def) => {
			def.pattern ?? (def.pattern = datetime$1(def));
			$ZodStringFormat.init(inst, def);
		});
		const $ZodISODate = /*@__PURE__*/ $constructor("$ZodISODate", (inst, def) => {
			def.pattern ?? (def.pattern = date$1);
			$ZodStringFormat.init(inst, def);
		});
		const $ZodISOTime = /*@__PURE__*/ $constructor("$ZodISOTime", (inst, def) => {
			def.pattern ?? (def.pattern = time$1(def));
			$ZodStringFormat.init(inst, def);
		});
		const $ZodISODuration = /*@__PURE__*/ $constructor("$ZodISODuration", (inst, def) => {
			def.pattern ?? (def.pattern = duration$1);
			$ZodStringFormat.init(inst, def);
		});
		const $ZodIPv4 = /*@__PURE__*/ $constructor("$ZodIPv4", (inst, def) => {
			def.pattern ?? (def.pattern = ipv4);
			$ZodStringFormat.init(inst, def);
			inst._zod.bag.format = `ipv4`;
		});
		const $ZodIPv6 = /*@__PURE__*/ $constructor("$ZodIPv6", (inst, def) => {
			def.pattern ?? (def.pattern = ipv6);
			$ZodStringFormat.init(inst, def);
			inst._zod.bag.format = `ipv6`;
			inst._zod.check = (payload) => {
				try {
					new URL(`http://[${payload.value}]`);
				} catch {
					payload.issues.push({
						code: "invalid_format",
						format: "ipv6",
						input: payload.value,
						inst,
						continue: !def.abort
					});
				}
			};
		});
		const $ZodCIDRv4 = /*@__PURE__*/ $constructor("$ZodCIDRv4", (inst, def) => {
			def.pattern ?? (def.pattern = cidrv4);
			$ZodStringFormat.init(inst, def);
		});
		const $ZodCIDRv6 = /*@__PURE__*/ $constructor("$ZodCIDRv6", (inst, def) => {
			def.pattern ?? (def.pattern = cidrv6);
			$ZodStringFormat.init(inst, def);
			inst._zod.check = (payload) => {
				const parts = payload.value.split("/");
				try {
					if (parts.length !== 2) throw new Error();
					const [address, prefix] = parts;
					if (!prefix) throw new Error();
					const prefixNum = Number(prefix);
					if (`${prefixNum}` !== prefix) throw new Error();
					if (prefixNum < 0 || prefixNum > 128) throw new Error();
					new URL(`http://[${address}]`);
				} catch {
					payload.issues.push({
						code: "invalid_format",
						format: "cidrv6",
						input: payload.value,
						inst,
						continue: !def.abort
					});
				}
			};
		});
		function isValidBase64(data) {
			if (data === "") return true;
			if (/\s/.test(data)) return false;
			if (data.length % 4 !== 0) return false;
			try {
				atob(data);
				return true;
			} catch {
				return false;
			}
		}
		const $ZodBase64 = /*@__PURE__*/ $constructor("$ZodBase64", (inst, def) => {
			def.pattern ?? (def.pattern = base64);
			$ZodStringFormat.init(inst, def);
			inst._zod.bag.contentEncoding = "base64";
			inst._zod.check = (payload) => {
				if (isValidBase64(payload.value)) return;
				payload.issues.push({
					code: "invalid_format",
					format: "base64",
					input: payload.value,
					inst,
					continue: !def.abort
				});
			};
		});
		function isValidBase64URL(data) {
			if (!base64url.test(data)) return false;
			const base64 = data.replace(/[-_]/g, (c) => c === "-" ? "+" : "/");
			return isValidBase64(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
		}
		const $ZodBase64URL = /*@__PURE__*/ $constructor("$ZodBase64URL", (inst, def) => {
			def.pattern ?? (def.pattern = base64url);
			$ZodStringFormat.init(inst, def);
			inst._zod.bag.contentEncoding = "base64url";
			inst._zod.check = (payload) => {
				if (isValidBase64URL(payload.value)) return;
				payload.issues.push({
					code: "invalid_format",
					format: "base64url",
					input: payload.value,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodE164 = /*@__PURE__*/ $constructor("$ZodE164", (inst, def) => {
			def.pattern ?? (def.pattern = e164);
			$ZodStringFormat.init(inst, def);
		});
		function isValidJWT(token, algorithm = null) {
			try {
				const tokensParts = token.split(".");
				if (tokensParts.length !== 3) return false;
				const [header] = tokensParts;
				if (!header) return false;
				const parsedHeader = JSON.parse(atob(header));
				if ("typ" in parsedHeader && parsedHeader?.typ !== "JWT") return false;
				if (!parsedHeader.alg) return false;
				if (algorithm && (!("alg" in parsedHeader) || parsedHeader.alg !== algorithm)) return false;
				return true;
			} catch {
				return false;
			}
		}
		const $ZodJWT = /*@__PURE__*/ $constructor("$ZodJWT", (inst, def) => {
			$ZodStringFormat.init(inst, def);
			inst._zod.check = (payload) => {
				if (isValidJWT(payload.value, def.alg)) return;
				payload.issues.push({
					code: "invalid_format",
					format: "jwt",
					input: payload.value,
					inst,
					continue: !def.abort
				});
			};
		});
		const $ZodNumber = /*@__PURE__*/ $constructor("$ZodNumber", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.pattern = inst._zod.bag.pattern ?? number$1;
			inst._zod.parse = (payload, _ctx) => {
				if (def.coerce) try {
					payload.value = Number(payload.value);
				} catch (_) {}
				const input = payload.value;
				if (typeof input === "number" && !Number.isNaN(input) && Number.isFinite(input)) return payload;
				const received = typeof input === "number" ? Number.isNaN(input) ? "NaN" : !Number.isFinite(input) ? "Infinity" : void 0 : void 0;
				payload.issues.push({
					expected: "number",
					code: "invalid_type",
					input,
					inst,
					...received ? { received } : {}
				});
				return payload;
			};
		});
		const $ZodNumberFormat = /*@__PURE__*/ $constructor("$ZodNumberFormat", (inst, def) => {
			$ZodCheckNumberFormat.init(inst, def);
			$ZodNumber.init(inst, def);
		});
		const $ZodBoolean = /*@__PURE__*/ $constructor("$ZodBoolean", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.pattern = boolean$1;
			inst._zod.parse = (payload, _ctx) => {
				if (def.coerce) try {
					payload.value = Boolean(payload.value);
				} catch (_) {}
				const input = payload.value;
				if (typeof input === "boolean") return payload;
				payload.issues.push({
					expected: "boolean",
					code: "invalid_type",
					input,
					inst
				});
				return payload;
			};
		});
		const $ZodAny = /*@__PURE__*/ $constructor("$ZodAny", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.parse = (payload) => payload;
		});
		const $ZodUnknown = /*@__PURE__*/ $constructor("$ZodUnknown", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.parse = (payload) => payload;
		});
		const $ZodNever = /*@__PURE__*/ $constructor("$ZodNever", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.parse = (payload, _ctx) => {
				payload.issues.push({
					expected: "never",
					code: "invalid_type",
					input: payload.value,
					inst
				});
				return payload;
			};
		});
		function handleArrayResult(result, final, index) {
			if (result.issues.length) final.issues.push(...prefixIssues(index, result.issues));
			final.value[index] = result.value;
		}
		const $ZodArray = /*@__PURE__*/ $constructor("$ZodArray", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.parse = (payload, ctx) => {
				const input = payload.value;
				if (!Array.isArray(input)) {
					payload.issues.push({
						expected: "array",
						code: "invalid_type",
						input,
						inst
					});
					return payload;
				}
				payload.value = Array(input.length);
				const proms = [];
				for (let i = 0; i < input.length; i++) {
					const item = input[i];
					const result = def.element._zod.run({
						value: item,
						issues: []
					}, ctx);
					if (result instanceof Promise) proms.push(result.then((result) => handleArrayResult(result, payload, i)));
					else handleArrayResult(result, payload, i);
				}
				if (proms.length) return Promise.all(proms).then(() => payload);
				return payload;
			};
		});
		function handlePropertyResult(result, final, key, input, isOptionalIn, isOptionalOut) {
			const isPresent = key in input;
			if (result.issues.length) {
				if (isOptionalIn && isOptionalOut && !isPresent) return;
				final.issues.push(...prefixIssues(key, result.issues));
			}
			if (!isPresent && !isOptionalIn) {
				if (!result.issues.length) final.issues.push({
					code: "invalid_type",
					expected: "nonoptional",
					input: void 0,
					path: [key]
				});
				return;
			}
			if (result.value === void 0) {
				if (isPresent) final.value[key] = void 0;
			} else final.value[key] = result.value;
		}
		function normalizeDef(def) {
			const keys = Object.keys(def.shape);
			for (const k of keys) if (!def.shape?.[k]?._zod?.traits?.has("$ZodType")) throw new Error(`Invalid element at key "${k}": expected a Zod schema`);
			const okeys = optionalKeys(def.shape);
			return {
				...def,
				keys,
				keySet: new Set(keys),
				numKeys: keys.length,
				optionalKeys: new Set(okeys)
			};
		}
		function handleCatchall(proms, input, payload, ctx, def, inst) {
			const unrecognized = [];
			const keySet = def.keySet;
			const _catchall = def.catchall._zod;
			const t = _catchall.def.type;
			const isOptionalIn = _catchall.optin === "optional";
			const isOptionalOut = _catchall.optout === "optional";
			for (const key in input) {
				if (key === "__proto__") continue;
				if (keySet.has(key)) continue;
				if (t === "never") {
					unrecognized.push(key);
					continue;
				}
				const r = _catchall.run({
					value: input[key],
					issues: []
				}, ctx);
				if (r instanceof Promise) proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut)));
				else handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut);
			}
			if (unrecognized.length) payload.issues.push({
				code: "unrecognized_keys",
				keys: unrecognized,
				input,
				inst
			});
			if (!proms.length) return payload;
			return Promise.all(proms).then(() => {
				return payload;
			});
		}
		const $ZodObject = /*@__PURE__*/ $constructor("$ZodObject", (inst, def) => {
			$ZodType.init(inst, def);
			if (!Object.getOwnPropertyDescriptor(def, "shape")?.get) {
				const sh = def.shape;
				Object.defineProperty(def, "shape", { get: () => {
					const newSh = { ...sh };
					Object.defineProperty(def, "shape", { value: newSh });
					return newSh;
				} });
			}
			const _normalized = cached(() => normalizeDef(def));
			defineLazy(inst._zod, "propValues", () => {
				const shape = def.shape;
				const propValues = {};
				for (const key in shape) {
					const field = shape[key]._zod;
					if (field.values) {
						propValues[key] ?? (propValues[key] = /* @__PURE__ */ new Set());
						for (const v of field.values) propValues[key].add(v);
					}
				}
				return propValues;
			});
			const isObject$1 = isObject;
			const catchall = def.catchall;
			let value;
			inst._zod.parse = (payload, ctx) => {
				value ?? (value = _normalized.value);
				const input = payload.value;
				if (!isObject$1(input)) {
					payload.issues.push({
						expected: "object",
						code: "invalid_type",
						input,
						inst
					});
					return payload;
				}
				payload.value = {};
				const proms = [];
				const shape = value.shape;
				for (const key of value.keys) {
					const el = shape[key];
					const isOptionalIn = el._zod.optin === "optional";
					const isOptionalOut = el._zod.optout === "optional";
					const r = el._zod.run({
						value: input[key],
						issues: []
					}, ctx);
					if (r instanceof Promise) proms.push(r.then((r) => handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut)));
					else handlePropertyResult(r, payload, key, input, isOptionalIn, isOptionalOut);
				}
				if (!catchall) return proms.length ? Promise.all(proms).then(() => payload) : payload;
				return handleCatchall(proms, input, payload, ctx, _normalized.value, inst);
			};
		});
		const $ZodObjectJIT = /*@__PURE__*/ $constructor("$ZodObjectJIT", (inst, def) => {
			$ZodObject.init(inst, def);
			const superParse = inst._zod.parse;
			const _normalized = cached(() => normalizeDef(def));
			const generateFastpass = (shape) => {
				const doc = new Doc([
					"shape",
					"payload",
					"ctx"
				]);
				const normalized = _normalized.value;
				const parseStr = (key) => {
					const k = esc(key);
					return `shape[${k}]._zod.run({ value: input[${k}], issues: [] }, ctx)`;
				};
				doc.write(`const input = payload.value;`);
				const ids = Object.create(null);
				let counter = 0;
				for (const key of normalized.keys) ids[key] = `key_${counter++}`;
				doc.write(`const newResult = {};`);
				for (const key of normalized.keys) {
					const id = ids[key];
					const k = esc(key);
					const schema = shape[key];
					const isOptionalIn = schema?._zod?.optin === "optional";
					const isOptionalOut = schema?._zod?.optout === "optional";
					doc.write(`const ${id} = ${parseStr(key)};`);
					if (isOptionalIn && isOptionalOut) doc.write(`
        if (${id}.issues.length) {
          if (${k} in input) {
            payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
              ...iss,
              path: iss.path ? [${k}, ...iss.path] : [${k}]
            })));
          }
        }
        
        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }
        
      `);
					else if (!isOptionalIn) doc.write(`
        const ${id}_present = ${k} in input;
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }
        if (!${id}_present && !${id}.issues.length) {
          payload.issues.push({
            code: "invalid_type",
            expected: "nonoptional",
            input: undefined,
            path: [${k}]
          });
        }

        if (${id}_present) {
          if (${id}.value === undefined) {
            newResult[${k}] = undefined;
          } else {
            newResult[${k}] = ${id}.value;
          }
        }

      `);
					else doc.write(`
        if (${id}.issues.length) {
          payload.issues = payload.issues.concat(${id}.issues.map(iss => ({
            ...iss,
            path: iss.path ? [${k}, ...iss.path] : [${k}]
          })));
        }
        
        if (${id}.value === undefined) {
          if (${k} in input) {
            newResult[${k}] = undefined;
          }
        } else {
          newResult[${k}] = ${id}.value;
        }
        
      `);
				}
				doc.write(`payload.value = newResult;`);
				doc.write(`return payload;`);
				const fn = doc.compile();
				return (payload, ctx) => fn(shape, payload, ctx);
			};
			let fastpass;
			const isObject$2 = isObject;
			const jit = !globalConfig.jitless;
			const fastEnabled = jit && allowsEval.value;
			const catchall = def.catchall;
			let value;
			inst._zod.parse = (payload, ctx) => {
				value ?? (value = _normalized.value);
				const input = payload.value;
				if (!isObject$2(input)) {
					payload.issues.push({
						expected: "object",
						code: "invalid_type",
						input,
						inst
					});
					return payload;
				}
				if (jit && fastEnabled && ctx?.async === false && ctx.jitless !== true) {
					if (!fastpass) fastpass = generateFastpass(def.shape);
					payload = fastpass(payload, ctx);
					if (!catchall) return payload;
					return handleCatchall([], input, payload, ctx, value, inst);
				}
				return superParse(payload, ctx);
			};
		});
		function handleUnionResults(results, final, inst, ctx) {
			for (const result of results) if (result.issues.length === 0) {
				final.value = result.value;
				return final;
			}
			const nonaborted = results.filter((r) => !aborted(r));
			if (nonaborted.length === 1) {
				final.value = nonaborted[0].value;
				return nonaborted[0];
			}
			final.issues.push({
				code: "invalid_union",
				input: final.value,
				inst,
				errors: results.map((result) => result.issues.map((iss) => finalizeIssue(iss, ctx, config())))
			});
			return final;
		}
		const $ZodUnion = /*@__PURE__*/ $constructor("$ZodUnion", (inst, def) => {
			$ZodType.init(inst, def);
			defineLazy(inst._zod, "optin", () => def.options.some((o) => o._zod.optin === "optional") ? "optional" : void 0);
			defineLazy(inst._zod, "optout", () => def.options.some((o) => o._zod.optout === "optional") ? "optional" : void 0);
			defineLazy(inst._zod, "values", () => {
				if (def.options.every((o) => o._zod.values)) return new Set(def.options.flatMap((option) => Array.from(option._zod.values)));
			});
			defineLazy(inst._zod, "pattern", () => {
				if (def.options.every((o) => o._zod.pattern)) {
					const patterns = def.options.map((o) => o._zod.pattern);
					return new RegExp(`^(${patterns.map((p) => cleanRegex(p.source)).join("|")})$`);
				}
			});
			const first = def.options.length === 1 ? def.options[0]._zod.run : null;
			inst._zod.parse = (payload, ctx) => {
				if (first) return first(payload, ctx);
				let async = false;
				const results = [];
				for (const option of def.options) {
					const result = option._zod.run({
						value: payload.value,
						issues: []
					}, ctx);
					if (result instanceof Promise) {
						results.push(result);
						async = true;
					} else {
						if (result.issues.length === 0) return result;
						results.push(result);
					}
				}
				if (!async) return handleUnionResults(results, payload, inst, ctx);
				return Promise.all(results).then((results) => {
					return handleUnionResults(results, payload, inst, ctx);
				});
			};
		});
		const $ZodIntersection = /*@__PURE__*/ $constructor("$ZodIntersection", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.parse = (payload, ctx) => {
				const input = payload.value;
				const left = def.left._zod.run({
					value: input,
					issues: []
				}, ctx);
				const right = def.right._zod.run({
					value: input,
					issues: []
				}, ctx);
				if (left instanceof Promise || right instanceof Promise) return Promise.all([left, right]).then(([left, right]) => {
					return handleIntersectionResults(payload, left, right);
				});
				return handleIntersectionResults(payload, left, right);
			};
		});
		function mergeValues(a, b) {
			if (a === b) return {
				valid: true,
				data: a
			};
			if (a instanceof Date && b instanceof Date && +a === +b) return {
				valid: true,
				data: a
			};
			if (isPlainObject(a) && isPlainObject(b)) {
				const bKeys = Object.keys(b);
				const sharedKeys = Object.keys(a).filter((key) => bKeys.indexOf(key) !== -1);
				const newObj = {
					...a,
					...b
				};
				for (const key of sharedKeys) {
					const sharedValue = mergeValues(a[key], b[key]);
					if (!sharedValue.valid) return {
						valid: false,
						mergeErrorPath: [key, ...sharedValue.mergeErrorPath]
					};
					newObj[key] = sharedValue.data;
				}
				return {
					valid: true,
					data: newObj
				};
			}
			if (Array.isArray(a) && Array.isArray(b)) {
				if (a.length !== b.length) return {
					valid: false,
					mergeErrorPath: []
				};
				const newArray = [];
				for (let index = 0; index < a.length; index++) {
					const itemA = a[index];
					const itemB = b[index];
					const sharedValue = mergeValues(itemA, itemB);
					if (!sharedValue.valid) return {
						valid: false,
						mergeErrorPath: [index, ...sharedValue.mergeErrorPath]
					};
					newArray.push(sharedValue.data);
				}
				return {
					valid: true,
					data: newArray
				};
			}
			return {
				valid: false,
				mergeErrorPath: []
			};
		}
		function handleIntersectionResults(result, left, right) {
			const unrecKeys = /* @__PURE__ */ new Map();
			let unrecIssue;
			for (const iss of left.issues) if (iss.code === "unrecognized_keys") {
				unrecIssue ?? (unrecIssue = iss);
				for (const k of iss.keys) {
					if (!unrecKeys.has(k)) unrecKeys.set(k, {});
					unrecKeys.get(k).l = true;
				}
			} else result.issues.push(iss);
			for (const iss of right.issues) if (iss.code === "unrecognized_keys") for (const k of iss.keys) {
				if (!unrecKeys.has(k)) unrecKeys.set(k, {});
				unrecKeys.get(k).r = true;
			}
			else result.issues.push(iss);
			const bothKeys = [...unrecKeys].filter(([, f]) => f.l && f.r).map(([k]) => k);
			if (bothKeys.length && unrecIssue) result.issues.push({
				...unrecIssue,
				keys: bothKeys
			});
			if (aborted(result)) return result;
			const merged = mergeValues(left.value, right.value);
			if (!merged.valid) throw new Error(`Unmergable intersection. Error path: ${JSON.stringify(merged.mergeErrorPath)}`);
			result.value = merged.data;
			return result;
		}
		const $ZodEnum = /*@__PURE__*/ $constructor("$ZodEnum", (inst, def) => {
			$ZodType.init(inst, def);
			const values = getEnumValues(def.entries);
			const valuesSet = new Set(values);
			inst._zod.values = valuesSet;
			inst._zod.pattern = new RegExp(`^(${values.filter((k) => propertyKeyTypes.has(typeof k)).map((o) => typeof o === "string" ? escapeRegex(o) : o.toString()).join("|")})$`);
			inst._zod.parse = (payload, _ctx) => {
				const input = payload.value;
				if (valuesSet.has(input)) return payload;
				payload.issues.push({
					code: "invalid_value",
					values,
					input,
					inst
				});
				return payload;
			};
		});
		const $ZodLiteral = /*@__PURE__*/ $constructor("$ZodLiteral", (inst, def) => {
			$ZodType.init(inst, def);
			if (def.values.length === 0) throw new Error("Cannot create literal schema with no valid values");
			const values = new Set(def.values);
			inst._zod.values = values;
			inst._zod.pattern = new RegExp(`^(${def.values.map((o) => typeof o === "string" ? escapeRegex(o) : o ? escapeRegex(o.toString()) : String(o)).join("|")})$`);
			inst._zod.parse = (payload, _ctx) => {
				const input = payload.value;
				if (values.has(input)) return payload;
				payload.issues.push({
					code: "invalid_value",
					values: def.values,
					input,
					inst
				});
				return payload;
			};
		});
		const $ZodTransform = /*@__PURE__*/ $constructor("$ZodTransform", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.optin = "optional";
			inst._zod.parse = (payload, ctx) => {
				if (ctx.direction === "backward") throw new $ZodEncodeError(inst.constructor.name);
				const _out = def.transform(payload.value, payload);
				if (ctx.async) return (_out instanceof Promise ? _out : Promise.resolve(_out)).then((output) => {
					payload.value = output;
					payload.fallback = true;
					return payload;
				});
				if (_out instanceof Promise) throw new $ZodAsyncError();
				payload.value = _out;
				payload.fallback = true;
				return payload;
			};
		});
		function handleOptionalResult(result, input) {
			if (input === void 0 && (result.issues.length || result.fallback)) return {
				issues: [],
				value: void 0
			};
			return result;
		}
		const $ZodOptional = /*@__PURE__*/ $constructor("$ZodOptional", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.optin = "optional";
			inst._zod.optout = "optional";
			defineLazy(inst._zod, "values", () => {
				return def.innerType._zod.values ? /* @__PURE__ */ new Set([...def.innerType._zod.values, void 0]) : void 0;
			});
			defineLazy(inst._zod, "pattern", () => {
				const pattern = def.innerType._zod.pattern;
				return pattern ? new RegExp(`^(${cleanRegex(pattern.source)})?$`) : void 0;
			});
			inst._zod.parse = (payload, ctx) => {
				if (def.innerType._zod.optin === "optional") {
					const input = payload.value;
					const result = def.innerType._zod.run(payload, ctx);
					if (result instanceof Promise) return result.then((r) => handleOptionalResult(r, input));
					return handleOptionalResult(result, input);
				}
				if (payload.value === void 0) return payload;
				return def.innerType._zod.run(payload, ctx);
			};
		});
		const $ZodExactOptional = /*@__PURE__*/ $constructor("$ZodExactOptional", (inst, def) => {
			$ZodOptional.init(inst, def);
			defineLazy(inst._zod, "values", () => def.innerType._zod.values);
			defineLazy(inst._zod, "pattern", () => def.innerType._zod.pattern);
			inst._zod.parse = (payload, ctx) => {
				return def.innerType._zod.run(payload, ctx);
			};
		});
		const $ZodNullable = /*@__PURE__*/ $constructor("$ZodNullable", (inst, def) => {
			$ZodType.init(inst, def);
			defineLazy(inst._zod, "optin", () => def.innerType._zod.optin);
			defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
			defineLazy(inst._zod, "pattern", () => {
				const pattern = def.innerType._zod.pattern;
				return pattern ? new RegExp(`^(${cleanRegex(pattern.source)}|null)$`) : void 0;
			});
			defineLazy(inst._zod, "values", () => {
				return def.innerType._zod.values ? /* @__PURE__ */ new Set([...def.innerType._zod.values, null]) : void 0;
			});
			inst._zod.parse = (payload, ctx) => {
				if (payload.value === null) return payload;
				return def.innerType._zod.run(payload, ctx);
			};
		});
		const $ZodDefault = /*@__PURE__*/ $constructor("$ZodDefault", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.optin = "optional";
			defineLazy(inst._zod, "values", () => def.innerType._zod.values);
			inst._zod.parse = (payload, ctx) => {
				if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
				if (payload.value === void 0) {
					payload.value = def.defaultValue;
					/**
					* $ZodDefault returns the default value immediately in forward direction.
					* It doesn't pass the default value into the validator ("prefault"). There's no reason to pass the default value through validation. The validity of the default is enforced by TypeScript statically. Otherwise, it's the responsibility of the user to ensure the default is valid. In the case of pipes with divergent in/out types, you can specify the default on the `in` schema of your ZodPipe to set a "prefault" for the pipe.   */
					return payload;
				}
				const result = def.innerType._zod.run(payload, ctx);
				if (result instanceof Promise) return result.then((result) => handleDefaultResult(result, def));
				return handleDefaultResult(result, def);
			};
		});
		function handleDefaultResult(payload, def) {
			if (payload.value === void 0) payload.value = def.defaultValue;
			return payload;
		}
		const $ZodPrefault = /*@__PURE__*/ $constructor("$ZodPrefault", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.optin = "optional";
			defineLazy(inst._zod, "values", () => def.innerType._zod.values);
			inst._zod.parse = (payload, ctx) => {
				if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
				if (payload.value === void 0) payload.value = def.defaultValue;
				return def.innerType._zod.run(payload, ctx);
			};
		});
		const $ZodNonOptional = /*@__PURE__*/ $constructor("$ZodNonOptional", (inst, def) => {
			$ZodType.init(inst, def);
			defineLazy(inst._zod, "values", () => {
				const v = def.innerType._zod.values;
				return v ? new Set([...v].filter((x) => x !== void 0)) : void 0;
			});
			inst._zod.parse = (payload, ctx) => {
				const result = def.innerType._zod.run(payload, ctx);
				if (result instanceof Promise) return result.then((result) => handleNonOptionalResult(result, inst));
				return handleNonOptionalResult(result, inst);
			};
		});
		function handleNonOptionalResult(payload, inst) {
			if (!payload.issues.length && payload.value === void 0) payload.issues.push({
				code: "invalid_type",
				expected: "nonoptional",
				input: payload.value,
				inst
			});
			return payload;
		}
		const $ZodCatch = /*@__PURE__*/ $constructor("$ZodCatch", (inst, def) => {
			$ZodType.init(inst, def);
			inst._zod.optin = "optional";
			defineLazy(inst._zod, "optout", () => def.innerType._zod.optout);
			defineLazy(inst._zod, "values", () => def.innerType._zod.values);
			inst._zod.parse = (payload, ctx) => {
				if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
				const result = def.innerType._zod.run(payload, ctx);
				if (result instanceof Promise) return result.then((result) => {
					payload.value = result.value;
					if (result.issues.length) {
						payload.value = def.catchValue({
							...payload,
							error: { issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config())) },
							input: payload.value
						});
						payload.issues = [];
						payload.fallback = true;
					}
					return payload;
				});
				payload.value = result.value;
				if (result.issues.length) {
					payload.value = def.catchValue({
						...payload,
						error: { issues: result.issues.map((iss) => finalizeIssue(iss, ctx, config())) },
						input: payload.value
					});
					payload.issues = [];
					payload.fallback = true;
				}
				return payload;
			};
		});
		const $ZodPipe = /*@__PURE__*/ $constructor("$ZodPipe", (inst, def) => {
			$ZodType.init(inst, def);
			defineLazy(inst._zod, "values", () => def.in._zod.values);
			defineLazy(inst._zod, "optin", () => def.in._zod.optin);
			defineLazy(inst._zod, "optout", () => def.out._zod.optout);
			defineLazy(inst._zod, "propValues", () => def.in._zod.propValues);
			inst._zod.parse = (payload, ctx) => {
				if (ctx.direction === "backward") {
					const right = def.out._zod.run(payload, ctx);
					if (right instanceof Promise) return right.then((right) => handlePipeResult(right, def.in, ctx));
					return handlePipeResult(right, def.in, ctx);
				}
				const left = def.in._zod.run(payload, ctx);
				if (left instanceof Promise) return left.then((left) => handlePipeResult(left, def.out, ctx));
				return handlePipeResult(left, def.out, ctx);
			};
		});
		function handlePipeResult(left, next, ctx) {
			if (left.issues.length) {
				left.aborted = true;
				return left;
			}
			return next._zod.run({
				value: left.value,
				issues: left.issues,
				fallback: left.fallback
			}, ctx);
		}
		const $ZodReadonly = /*@__PURE__*/ $constructor("$ZodReadonly", (inst, def) => {
			$ZodType.init(inst, def);
			defineLazy(inst._zod, "propValues", () => def.innerType._zod.propValues);
			defineLazy(inst._zod, "values", () => def.innerType._zod.values);
			defineLazy(inst._zod, "optin", () => def.innerType?._zod?.optin);
			defineLazy(inst._zod, "optout", () => def.innerType?._zod?.optout);
			inst._zod.parse = (payload, ctx) => {
				if (ctx.direction === "backward") return def.innerType._zod.run(payload, ctx);
				const result = def.innerType._zod.run(payload, ctx);
				if (result instanceof Promise) return result.then(handleReadonlyResult);
				return handleReadonlyResult(result);
			};
		});
		function handleReadonlyResult(payload) {
			payload.value = Object.freeze(payload.value);
			return payload;
		}
		const $ZodCustom = /*@__PURE__*/ $constructor("$ZodCustom", (inst, def) => {
			$ZodCheck.init(inst, def);
			$ZodType.init(inst, def);
			inst._zod.parse = (payload, _) => {
				return payload;
			};
			inst._zod.check = (payload) => {
				const input = payload.value;
				const r = def.fn(input);
				if (r instanceof Promise) return r.then((r) => handleRefineResult(r, payload, input, inst));
				handleRefineResult(r, payload, input, inst);
			};
		});
		function handleRefineResult(result, payload, input, inst) {
			if (!result) {
				const _iss = {
					code: "custom",
					input,
					inst,
					path: [...inst._zod.def.path ?? []],
					continue: !inst._zod.def.abort
				};
				if (inst._zod.def.params) _iss.params = inst._zod.def.params;
				payload.issues.push(issue(_iss));
			}
		}
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/registries.js
		var _a;
		var $ZodRegistry = class {
			constructor() {
				this._map = /* @__PURE__ */ new WeakMap();
				this._idmap = /* @__PURE__ */ new Map();
			}
			add(schema, ..._meta) {
				const meta = _meta[0];
				this._map.set(schema, meta);
				if (meta && typeof meta === "object" && "id" in meta) this._idmap.set(meta.id, schema);
				return this;
			}
			clear() {
				this._map = /* @__PURE__ */ new WeakMap();
				this._idmap = /* @__PURE__ */ new Map();
				return this;
			}
			remove(schema) {
				const meta = this._map.get(schema);
				if (meta && typeof meta === "object" && "id" in meta) this._idmap.delete(meta.id);
				this._map.delete(schema);
				return this;
			}
			get(schema) {
				const p = schema._zod.parent;
				if (p) {
					const pm = { ...this.get(p) ?? {} };
					delete pm.id;
					const f = {
						...pm,
						...this._map.get(schema)
					};
					return Object.keys(f).length ? f : void 0;
				}
				return this._map.get(schema);
			}
			has(schema) {
				return this._map.has(schema);
			}
		};
		function registry() {
			return new $ZodRegistry();
		}
		(_a = globalThis).__zod_globalRegistry ?? (_a.__zod_globalRegistry = registry());
		const globalRegistry = globalThis.__zod_globalRegistry;
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/api.js
		// @__NO_SIDE_EFFECTS__
		function _string(Class, params) {
			return new Class({
				type: "string",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _email(Class, params) {
			return new Class({
				type: "string",
				format: "email",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _guid(Class, params) {
			return new Class({
				type: "string",
				format: "guid",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _uuid(Class, params) {
			return new Class({
				type: "string",
				format: "uuid",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _uuidv4(Class, params) {
			return new Class({
				type: "string",
				format: "uuid",
				check: "string_format",
				abort: false,
				version: "v4",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _uuidv6(Class, params) {
			return new Class({
				type: "string",
				format: "uuid",
				check: "string_format",
				abort: false,
				version: "v6",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _uuidv7(Class, params) {
			return new Class({
				type: "string",
				format: "uuid",
				check: "string_format",
				abort: false,
				version: "v7",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _url(Class, params) {
			return new Class({
				type: "string",
				format: "url",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _emoji(Class, params) {
			return new Class({
				type: "string",
				format: "emoji",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _nanoid(Class, params) {
			return new Class({
				type: "string",
				format: "nanoid",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		/**
		* @deprecated CUID v1 is deprecated by its authors due to information leakage
		* (timestamps embedded in the id). Use {@link _cuid2} instead.
		* See https://github.com/paralleldrive/cuid.
		*/
		// @__NO_SIDE_EFFECTS__
		function _cuid(Class, params) {
			return new Class({
				type: "string",
				format: "cuid",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _cuid2(Class, params) {
			return new Class({
				type: "string",
				format: "cuid2",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _ulid(Class, params) {
			return new Class({
				type: "string",
				format: "ulid",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _xid(Class, params) {
			return new Class({
				type: "string",
				format: "xid",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _ksuid(Class, params) {
			return new Class({
				type: "string",
				format: "ksuid",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _ipv4(Class, params) {
			return new Class({
				type: "string",
				format: "ipv4",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _ipv6(Class, params) {
			return new Class({
				type: "string",
				format: "ipv6",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _cidrv4(Class, params) {
			return new Class({
				type: "string",
				format: "cidrv4",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _cidrv6(Class, params) {
			return new Class({
				type: "string",
				format: "cidrv6",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _base64(Class, params) {
			return new Class({
				type: "string",
				format: "base64",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _base64url(Class, params) {
			return new Class({
				type: "string",
				format: "base64url",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _e164(Class, params) {
			return new Class({
				type: "string",
				format: "e164",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _jwt(Class, params) {
			return new Class({
				type: "string",
				format: "jwt",
				check: "string_format",
				abort: false,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _isoDateTime(Class, params) {
			return new Class({
				type: "string",
				format: "datetime",
				check: "string_format",
				offset: false,
				local: false,
				precision: null,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _isoDate(Class, params) {
			return new Class({
				type: "string",
				format: "date",
				check: "string_format",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _isoTime(Class, params) {
			return new Class({
				type: "string",
				format: "time",
				check: "string_format",
				precision: null,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _isoDuration(Class, params) {
			return new Class({
				type: "string",
				format: "duration",
				check: "string_format",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _number(Class, params) {
			return new Class({
				type: "number",
				checks: [],
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _int(Class, params) {
			return new Class({
				type: "number",
				check: "number_format",
				abort: false,
				format: "safeint",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _boolean(Class, params) {
			return new Class({
				type: "boolean",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _any(Class) {
			return new Class({ type: "any" });
		}
		// @__NO_SIDE_EFFECTS__
		function _unknown(Class) {
			return new Class({ type: "unknown" });
		}
		// @__NO_SIDE_EFFECTS__
		function _never(Class, params) {
			return new Class({
				type: "never",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _lt(value, params) {
			return new $ZodCheckLessThan({
				check: "less_than",
				...normalizeParams(params),
				value,
				inclusive: false
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _lte(value, params) {
			return new $ZodCheckLessThan({
				check: "less_than",
				...normalizeParams(params),
				value,
				inclusive: true
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _gt(value, params) {
			return new $ZodCheckGreaterThan({
				check: "greater_than",
				...normalizeParams(params),
				value,
				inclusive: false
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _gte(value, params) {
			return new $ZodCheckGreaterThan({
				check: "greater_than",
				...normalizeParams(params),
				value,
				inclusive: true
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _multipleOf(value, params) {
			return new $ZodCheckMultipleOf({
				check: "multiple_of",
				...normalizeParams(params),
				value
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _maxLength(maximum, params) {
			return new $ZodCheckMaxLength({
				check: "max_length",
				...normalizeParams(params),
				maximum
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _minLength(minimum, params) {
			return new $ZodCheckMinLength({
				check: "min_length",
				...normalizeParams(params),
				minimum
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _length(length, params) {
			return new $ZodCheckLengthEquals({
				check: "length_equals",
				...normalizeParams(params),
				length
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _regex(pattern, params) {
			return new $ZodCheckRegex({
				check: "string_format",
				format: "regex",
				...normalizeParams(params),
				pattern
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _lowercase(params) {
			return new $ZodCheckLowerCase({
				check: "string_format",
				format: "lowercase",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _uppercase(params) {
			return new $ZodCheckUpperCase({
				check: "string_format",
				format: "uppercase",
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _includes(includes, params) {
			return new $ZodCheckIncludes({
				check: "string_format",
				format: "includes",
				...normalizeParams(params),
				includes
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _startsWith(prefix, params) {
			return new $ZodCheckStartsWith({
				check: "string_format",
				format: "starts_with",
				...normalizeParams(params),
				prefix
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _endsWith(suffix, params) {
			return new $ZodCheckEndsWith({
				check: "string_format",
				format: "ends_with",
				...normalizeParams(params),
				suffix
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _overwrite(tx) {
			return new $ZodCheckOverwrite({
				check: "overwrite",
				tx
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _normalize(form) {
			return /* @__PURE__ */ _overwrite((input) => input.normalize(form));
		}
		// @__NO_SIDE_EFFECTS__
		function _trim() {
			return /* @__PURE__ */ _overwrite((input) => input.trim());
		}
		// @__NO_SIDE_EFFECTS__
		function _toLowerCase() {
			return /* @__PURE__ */ _overwrite((input) => input.toLowerCase());
		}
		// @__NO_SIDE_EFFECTS__
		function _toUpperCase() {
			return /* @__PURE__ */ _overwrite((input) => input.toUpperCase());
		}
		// @__NO_SIDE_EFFECTS__
		function _slugify() {
			return /* @__PURE__ */ _overwrite((input) => slugify(input));
		}
		// @__NO_SIDE_EFFECTS__
		function _array(Class, element, params) {
			return new Class({
				type: "array",
				element,
				...normalizeParams(params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _refine(Class, fn, _params) {
			return new Class({
				type: "custom",
				check: "custom",
				fn,
				...normalizeParams(_params)
			});
		}
		// @__NO_SIDE_EFFECTS__
		function _superRefine(fn, params) {
			const ch = /* @__PURE__ */ _check((payload) => {
				payload.addIssue = (issue$2) => {
					if (typeof issue$2 === "string") payload.issues.push(issue(issue$2, payload.value, ch._zod.def));
					else {
						const _issue = issue$2;
						if (_issue.fatal) _issue.continue = false;
						_issue.code ?? (_issue.code = "custom");
						_issue.input ?? (_issue.input = payload.value);
						_issue.inst ?? (_issue.inst = ch);
						_issue.continue ?? (_issue.continue = !ch._zod.def.abort);
						payload.issues.push(issue(_issue));
					}
				};
				return fn(payload.value, payload);
			}, params);
			return ch;
		}
		// @__NO_SIDE_EFFECTS__
		function _check(fn, params) {
			const ch = new $ZodCheck({
				check: "custom",
				...normalizeParams(params)
			});
			ch._zod.check = fn;
			return ch;
		}
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/to-json-schema.js
		function initializeContext(params) {
			let target = params?.target ?? "draft-2020-12";
			if (target === "draft-4") target = "draft-04";
			if (target === "draft-7") target = "draft-07";
			return {
				processors: params.processors ?? {},
				metadataRegistry: params?.metadata ?? globalRegistry,
				target,
				unrepresentable: params?.unrepresentable ?? "throw",
				override: params?.override ?? (() => {}),
				io: params?.io ?? "output",
				counter: 0,
				seen: /* @__PURE__ */ new Map(),
				cycles: params?.cycles ?? "ref",
				reused: params?.reused ?? "inline",
				external: params?.external ?? void 0
			};
		}
		function process(schema, ctx, _params = {
			path: [],
			schemaPath: []
		}) {
			var _a;
			const def = schema._zod.def;
			const seen = ctx.seen.get(schema);
			if (seen) {
				seen.count++;
				if (_params.schemaPath.includes(schema)) seen.cycle = _params.path;
				return seen.schema;
			}
			const result = {
				schema: {},
				count: 1,
				cycle: void 0,
				path: _params.path
			};
			ctx.seen.set(schema, result);
			const overrideSchema = schema._zod.toJSONSchema?.();
			if (overrideSchema) result.schema = overrideSchema;
			else {
				const params = {
					..._params,
					schemaPath: [..._params.schemaPath, schema],
					path: _params.path
				};
				if (schema._zod.processJSONSchema) schema._zod.processJSONSchema(ctx, result.schema, params);
				else {
					const _json = result.schema;
					const processor = ctx.processors[def.type];
					if (!processor) throw new Error(`[toJSONSchema]: Non-representable type encountered: ${def.type}`);
					processor(schema, ctx, _json, params);
				}
				const parent = schema._zod.parent;
				if (parent) {
					if (!result.ref) result.ref = parent;
					process(parent, ctx, params);
					ctx.seen.get(parent).isParent = true;
				}
			}
			const meta = ctx.metadataRegistry.get(schema);
			if (meta) Object.assign(result.schema, meta);
			if (ctx.io === "input" && isTransforming(schema)) {
				delete result.schema.examples;
				delete result.schema.default;
			}
			if (ctx.io === "input" && "_prefault" in result.schema) (_a = result.schema).default ?? (_a.default = result.schema._prefault);
			delete result.schema._prefault;
			return ctx.seen.get(schema).schema;
		}
		function extractDefs(ctx, schema) {
			const root = ctx.seen.get(schema);
			if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
			const idToSchema = /* @__PURE__ */ new Map();
			for (const entry of ctx.seen.entries()) {
				const id = ctx.metadataRegistry.get(entry[0])?.id;
				if (id) {
					const existing = idToSchema.get(id);
					if (existing && existing !== entry[0]) throw new Error(`Duplicate schema id "${id}" detected during JSON Schema conversion. Two different schemas cannot share the same id when converted together.`);
					idToSchema.set(id, entry[0]);
				}
			}
			const makeURI = (entry) => {
				const defsSegment = ctx.target === "draft-2020-12" ? "$defs" : "definitions";
				if (ctx.external) {
					const externalId = ctx.external.registry.get(entry[0])?.id;
					const uriGenerator = ctx.external.uri ?? ((id) => id);
					if (externalId) return { ref: uriGenerator(externalId) };
					const id = entry[1].defId ?? entry[1].schema.id ?? `schema${ctx.counter++}`;
					entry[1].defId = id;
					return {
						defId: id,
						ref: `${uriGenerator("__shared")}#/${defsSegment}/${id}`
					};
				}
				if (entry[1] === root) return { ref: "#" };
				const defUriPrefix = `#/${defsSegment}/`;
				const defId = entry[1].schema.id ?? `__schema${ctx.counter++}`;
				return {
					defId,
					ref: defUriPrefix + defId
				};
			};
			const extractToDef = (entry) => {
				if (entry[1].schema.$ref) return;
				const seen = entry[1];
				const { ref, defId } = makeURI(entry);
				seen.def = { ...seen.schema };
				if (defId) seen.defId = defId;
				const schema = seen.schema;
				for (const key in schema) delete schema[key];
				schema.$ref = ref;
			};
			if (ctx.cycles === "throw") for (const entry of ctx.seen.entries()) {
				const seen = entry[1];
				if (seen.cycle) throw new Error(`Cycle detected: #/${seen.cycle?.join("/")}/<root>

Set the \`cycles\` parameter to \`"ref"\` to resolve cyclical schemas with defs.`);
			}
			for (const entry of ctx.seen.entries()) {
				const seen = entry[1];
				if (schema === entry[0]) {
					extractToDef(entry);
					continue;
				}
				if (ctx.external) {
					const ext = ctx.external.registry.get(entry[0])?.id;
					if (schema !== entry[0] && ext) {
						extractToDef(entry);
						continue;
					}
				}
				if (ctx.metadataRegistry.get(entry[0])?.id) {
					extractToDef(entry);
					continue;
				}
				if (seen.cycle) {
					extractToDef(entry);
					continue;
				}
				if (seen.count > 1) {
					if (ctx.reused === "ref") {
						extractToDef(entry);
						continue;
					}
				}
			}
		}
		function finalize(ctx, schema) {
			const root = ctx.seen.get(schema);
			if (!root) throw new Error("Unprocessed schema. This is a bug in Zod.");
			const flattenRef = (zodSchema) => {
				const seen = ctx.seen.get(zodSchema);
				if (seen.ref === null) return;
				const schema = seen.def ?? seen.schema;
				const _cached = { ...schema };
				const ref = seen.ref;
				seen.ref = null;
				if (ref) {
					flattenRef(ref);
					const refSeen = ctx.seen.get(ref);
					const refSchema = refSeen.schema;
					if (refSchema.$ref && (ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0")) {
						schema.allOf = schema.allOf ?? [];
						schema.allOf.push(refSchema);
					} else Object.assign(schema, refSchema);
					Object.assign(schema, _cached);
					if (zodSchema._zod.parent === ref) for (const key in schema) {
						if (key === "$ref" || key === "allOf") continue;
						if (!(key in _cached)) delete schema[key];
					}
					if (refSchema.$ref && refSeen.def) for (const key in schema) {
						if (key === "$ref" || key === "allOf") continue;
						if (key in refSeen.def && JSON.stringify(schema[key]) === JSON.stringify(refSeen.def[key])) delete schema[key];
					}
				}
				const parent = zodSchema._zod.parent;
				if (parent && parent !== ref) {
					flattenRef(parent);
					const parentSeen = ctx.seen.get(parent);
					if (parentSeen?.schema.$ref) {
						schema.$ref = parentSeen.schema.$ref;
						if (parentSeen.def) for (const key in schema) {
							if (key === "$ref" || key === "allOf") continue;
							if (key in parentSeen.def && JSON.stringify(schema[key]) === JSON.stringify(parentSeen.def[key])) delete schema[key];
						}
					}
				}
				ctx.override({
					zodSchema,
					jsonSchema: schema,
					path: seen.path ?? []
				});
			};
			for (const entry of [...ctx.seen.entries()].reverse()) flattenRef(entry[0]);
			const result = {};
			if (ctx.target === "draft-2020-12") result.$schema = "https://json-schema.org/draft/2020-12/schema";
			else if (ctx.target === "draft-07") result.$schema = "http://json-schema.org/draft-07/schema#";
			else if (ctx.target === "draft-04") result.$schema = "http://json-schema.org/draft-04/schema#";
			else if (ctx.target === "openapi-3.0") {}
			if (ctx.external?.uri) {
				const id = ctx.external.registry.get(schema)?.id;
				if (!id) throw new Error("Schema is missing an `id` property");
				result.$id = ctx.external.uri(id);
			}
			Object.assign(result, root.def ?? root.schema);
			const rootMetaId = ctx.metadataRegistry.get(schema)?.id;
			if (rootMetaId !== void 0 && result.id === rootMetaId) delete result.id;
			const defs = ctx.external?.defs ?? {};
			for (const entry of ctx.seen.entries()) {
				const seen = entry[1];
				if (seen.def && seen.defId) {
					if (seen.def.id === seen.defId) delete seen.def.id;
					defs[seen.defId] = seen.def;
				}
			}
			if (ctx.external) {} else if (Object.keys(defs).length > 0) {
				if (ctx.target === "draft-2020-12") result.$defs = defs;
				else result.definitions = defs;
			}
			try {
				const finalized = JSON.parse(JSON.stringify(result));
				Object.defineProperty(finalized, "~standard", {
					value: {
						...schema["~standard"],
						jsonSchema: {
							input: createStandardJSONSchemaMethod(schema, "input", ctx.processors),
							output: createStandardJSONSchemaMethod(schema, "output", ctx.processors)
						}
					},
					enumerable: false,
					writable: false
				});
				return finalized;
			} catch (_err) {
				throw new Error("Error converting schema to JSON.");
			}
		}
		function isTransforming(_schema, _ctx) {
			const ctx = _ctx ?? { seen: /* @__PURE__ */ new Set() };
			if (ctx.seen.has(_schema)) return false;
			ctx.seen.add(_schema);
			const def = _schema._zod.def;
			if (def.type === "transform") return true;
			if (def.type === "array") return isTransforming(def.element, ctx);
			if (def.type === "set") return isTransforming(def.valueType, ctx);
			if (def.type === "lazy") return isTransforming(def.getter(), ctx);
			if (def.type === "promise" || def.type === "optional" || def.type === "nonoptional" || def.type === "nullable" || def.type === "readonly" || def.type === "default" || def.type === "prefault") return isTransforming(def.innerType, ctx);
			if (def.type === "intersection") return isTransforming(def.left, ctx) || isTransforming(def.right, ctx);
			if (def.type === "record" || def.type === "map") return isTransforming(def.keyType, ctx) || isTransforming(def.valueType, ctx);
			if (def.type === "pipe") {
				if (_schema._zod.traits.has("$ZodCodec")) return true;
				return isTransforming(def.in, ctx) || isTransforming(def.out, ctx);
			}
			if (def.type === "object") {
				for (const key in def.shape) if (isTransforming(def.shape[key], ctx)) return true;
				return false;
			}
			if (def.type === "union") {
				for (const option of def.options) if (isTransforming(option, ctx)) return true;
				return false;
			}
			if (def.type === "tuple") {
				for (const item of def.items) if (isTransforming(item, ctx)) return true;
				if (def.rest && isTransforming(def.rest, ctx)) return true;
				return false;
			}
			return false;
		}
		/**
		* Creates a toJSONSchema method for a schema instance.
		* This encapsulates the logic of initializing context, processing, extracting defs, and finalizing.
		*/
		const createToJSONSchemaMethod = (schema, processors = {}) => (params) => {
			const ctx = initializeContext({
				...params,
				processors
			});
			process(schema, ctx);
			extractDefs(ctx, schema);
			return finalize(ctx, schema);
		};
		const createStandardJSONSchemaMethod = (schema, io, processors = {}) => (params) => {
			const { libraryOptions, target } = params ?? {};
			const ctx = initializeContext({
				...libraryOptions ?? {},
				target,
				io,
				processors
			});
			process(schema, ctx);
			extractDefs(ctx, schema);
			return finalize(ctx, schema);
		};
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/core/json-schema-processors.js
		const formatMap = {
			guid: "uuid",
			url: "uri",
			datetime: "date-time",
			json_string: "json-string",
			regex: ""
		};
		const stringProcessor = (schema, ctx, _json, _params) => {
			const json = _json;
			json.type = "string";
			const { minimum, maximum, format, patterns, contentEncoding } = schema._zod.bag;
			if (typeof minimum === "number") json.minLength = minimum;
			if (typeof maximum === "number") json.maxLength = maximum;
			if (format) {
				json.format = formatMap[format] ?? format;
				if (json.format === "") delete json.format;
				if (format === "time") delete json.format;
			}
			if (contentEncoding) json.contentEncoding = contentEncoding;
			if (patterns && patterns.size > 0) {
				const regexes = [...patterns];
				if (regexes.length === 1) json.pattern = regexes[0].source;
				else if (regexes.length > 1) json.allOf = [...regexes.map((regex) => ({
					...ctx.target === "draft-07" || ctx.target === "draft-04" || ctx.target === "openapi-3.0" ? { type: "string" } : {},
					pattern: regex.source
				}))];
			}
		};
		const numberProcessor = (schema, ctx, _json, _params) => {
			const json = _json;
			const { minimum, maximum, format, multipleOf, exclusiveMaximum, exclusiveMinimum } = schema._zod.bag;
			if (typeof format === "string" && format.includes("int")) json.type = "integer";
			else json.type = "number";
			const exMin = typeof exclusiveMinimum === "number" && exclusiveMinimum >= (minimum ?? Number.NEGATIVE_INFINITY);
			const exMax = typeof exclusiveMaximum === "number" && exclusiveMaximum <= (maximum ?? Number.POSITIVE_INFINITY);
			const legacy = ctx.target === "draft-04" || ctx.target === "openapi-3.0";
			if (exMin) {
				if (legacy) {
					json.minimum = exclusiveMinimum;
					json.exclusiveMinimum = true;
				} else json.exclusiveMinimum = exclusiveMinimum;
			} else if (typeof minimum === "number") json.minimum = minimum;
			if (exMax) {
				if (legacy) {
					json.maximum = exclusiveMaximum;
					json.exclusiveMaximum = true;
				} else json.exclusiveMaximum = exclusiveMaximum;
			} else if (typeof maximum === "number") json.maximum = maximum;
			if (typeof multipleOf === "number") json.multipleOf = multipleOf;
		};
		const booleanProcessor = (_schema, _ctx, json, _params) => {
			json.type = "boolean";
		};
		const neverProcessor = (_schema, _ctx, json, _params) => {
			json.not = {};
		};
		const enumProcessor = (schema, _ctx, json, _params) => {
			const def = schema._zod.def;
			const values = getEnumValues(def.entries);
			if (values.every((v) => typeof v === "number")) json.type = "number";
			if (values.every((v) => typeof v === "string")) json.type = "string";
			json.enum = values;
		};
		const literalProcessor = (schema, ctx, json, _params) => {
			const def = schema._zod.def;
			const vals = [];
			for (const val of def.values) if (val === void 0) {
				if (ctx.unrepresentable === "throw") throw new Error("Literal `undefined` cannot be represented in JSON Schema");
			} else if (typeof val === "bigint") {
				if (ctx.unrepresentable === "throw") throw new Error("BigInt literals cannot be represented in JSON Schema");
				else vals.push(Number(val));
			} else vals.push(val);
			if (vals.length === 0) {} else if (vals.length === 1) {
				const val = vals[0];
				json.type = val === null ? "null" : typeof val;
				if (ctx.target === "draft-04" || ctx.target === "openapi-3.0") json.enum = [val];
				else json.const = val;
			} else {
				if (vals.every((v) => typeof v === "number")) json.type = "number";
				if (vals.every((v) => typeof v === "string")) json.type = "string";
				if (vals.every((v) => typeof v === "boolean")) json.type = "boolean";
				if (vals.every((v) => v === null)) json.type = "null";
				json.enum = vals;
			}
		};
		const customProcessor = (_schema, ctx, _json, _params) => {
			if (ctx.unrepresentable === "throw") throw new Error("Custom types cannot be represented in JSON Schema");
		};
		const transformProcessor = (_schema, ctx, _json, _params) => {
			if (ctx.unrepresentable === "throw") throw new Error("Transforms cannot be represented in JSON Schema");
		};
		const arrayProcessor = (schema, ctx, _json, params) => {
			const json = _json;
			const def = schema._zod.def;
			const { minimum, maximum } = schema._zod.bag;
			if (typeof minimum === "number") json.minItems = minimum;
			if (typeof maximum === "number") json.maxItems = maximum;
			json.type = "array";
			json.items = process(def.element, ctx, {
				...params,
				path: [...params.path, "items"]
			});
		};
		const objectProcessor = (schema, ctx, _json, params) => {
			const json = _json;
			const def = schema._zod.def;
			json.type = "object";
			json.properties = {};
			const shape = def.shape;
			for (const key in shape) json.properties[key] = process(shape[key], ctx, {
				...params,
				path: [
					...params.path,
					"properties",
					key
				]
			});
			const allKeys = new Set(Object.keys(shape));
			const requiredKeys = new Set([...allKeys].filter((key) => {
				const v = def.shape[key]._zod;
				if (ctx.io === "input") return v.optin === void 0;
				else return v.optout === void 0;
			}));
			if (requiredKeys.size > 0) json.required = Array.from(requiredKeys);
			if (def.catchall?._zod.def.type === "never") json.additionalProperties = false;
			else if (!def.catchall) {
				if (ctx.io === "output") json.additionalProperties = false;
			} else if (def.catchall) json.additionalProperties = process(def.catchall, ctx, {
				...params,
				path: [...params.path, "additionalProperties"]
			});
		};
		const unionProcessor = (schema, ctx, json, params) => {
			const def = schema._zod.def;
			const isExclusive = def.inclusive === false;
			const options = def.options.map((x, i) => process(x, ctx, {
				...params,
				path: [
					...params.path,
					isExclusive ? "oneOf" : "anyOf",
					i
				]
			}));
			if (isExclusive) json.oneOf = options;
			else json.anyOf = options;
		};
		const intersectionProcessor = (schema, ctx, json, params) => {
			const def = schema._zod.def;
			const a = process(def.left, ctx, {
				...params,
				path: [
					...params.path,
					"allOf",
					0
				]
			});
			const b = process(def.right, ctx, {
				...params,
				path: [
					...params.path,
					"allOf",
					1
				]
			});
			const isSimpleIntersection = (val) => "allOf" in val && Object.keys(val).length === 1;
			json.allOf = [...isSimpleIntersection(a) ? a.allOf : [a], ...isSimpleIntersection(b) ? b.allOf : [b]];
		};
		const nullableProcessor = (schema, ctx, json, params) => {
			const def = schema._zod.def;
			const inner = process(def.innerType, ctx, params);
			const seen = ctx.seen.get(schema);
			if (ctx.target === "openapi-3.0") {
				seen.ref = def.innerType;
				json.nullable = true;
			} else json.anyOf = [inner, { type: "null" }];
		};
		const nonoptionalProcessor = (schema, ctx, _json, params) => {
			const def = schema._zod.def;
			process(def.innerType, ctx, params);
			const seen = ctx.seen.get(schema);
			seen.ref = def.innerType;
		};
		const defaultProcessor = (schema, ctx, json, params) => {
			const def = schema._zod.def;
			process(def.innerType, ctx, params);
			const seen = ctx.seen.get(schema);
			seen.ref = def.innerType;
			json.default = JSON.parse(JSON.stringify(def.defaultValue));
		};
		const prefaultProcessor = (schema, ctx, json, params) => {
			const def = schema._zod.def;
			process(def.innerType, ctx, params);
			const seen = ctx.seen.get(schema);
			seen.ref = def.innerType;
			if (ctx.io === "input") json._prefault = JSON.parse(JSON.stringify(def.defaultValue));
		};
		const catchProcessor = (schema, ctx, json, params) => {
			const def = schema._zod.def;
			process(def.innerType, ctx, params);
			const seen = ctx.seen.get(schema);
			seen.ref = def.innerType;
			let catchValue;
			try {
				catchValue = def.catchValue(void 0);
			} catch {
				throw new Error("Dynamic catch values are not supported in JSON Schema");
			}
			json.default = catchValue;
		};
		const pipeProcessor = (schema, ctx, _json, params) => {
			const def = schema._zod.def;
			const inIsTransform = def.in._zod.traits.has("$ZodTransform");
			const innerType = ctx.io === "input" ? inIsTransform ? def.out : def.in : def.out;
			process(innerType, ctx, params);
			const seen = ctx.seen.get(schema);
			seen.ref = innerType;
		};
		const readonlyProcessor = (schema, ctx, json, params) => {
			const def = schema._zod.def;
			process(def.innerType, ctx, params);
			const seen = ctx.seen.get(schema);
			seen.ref = def.innerType;
			json.readOnly = true;
		};
		const optionalProcessor = (schema, ctx, _json, params) => {
			const def = schema._zod.def;
			process(def.innerType, ctx, params);
			const seen = ctx.seen.get(schema);
			seen.ref = def.innerType;
		};
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/classic/iso.js
		const ZodISODateTime = /*@__PURE__*/ $constructor("ZodISODateTime", (inst, def) => {
			$ZodISODateTime.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		function datetime(params) {
			return /* @__PURE__ */ _isoDateTime(ZodISODateTime, params);
		}
		const ZodISODate = /*@__PURE__*/ $constructor("ZodISODate", (inst, def) => {
			$ZodISODate.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		function date(params) {
			return /* @__PURE__ */ _isoDate(ZodISODate, params);
		}
		const ZodISOTime = /*@__PURE__*/ $constructor("ZodISOTime", (inst, def) => {
			$ZodISOTime.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		function time(params) {
			return /* @__PURE__ */ _isoTime(ZodISOTime, params);
		}
		const ZodISODuration = /*@__PURE__*/ $constructor("ZodISODuration", (inst, def) => {
			$ZodISODuration.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		function duration(params) {
			return /* @__PURE__ */ _isoDuration(ZodISODuration, params);
		}
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/classic/errors.js
		const initializer = (inst, issues) => {
			$ZodError.init(inst, issues);
			inst.name = "ZodError";
			Object.defineProperties(inst, {
				format: { value: (mapper) => formatError(inst, mapper) },
				flatten: { value: (mapper) => flattenError(inst, mapper) },
				addIssue: { value: (issue) => {
					inst.issues.push(issue);
					inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
				} },
				addIssues: { value: (issues) => {
					inst.issues.push(...issues);
					inst.message = JSON.stringify(inst.issues, jsonStringifyReplacer, 2);
				} },
				isEmpty: { get() {
					return inst.issues.length === 0;
				} }
			});
		};
		const ZodRealError = /*@__PURE__*/ $constructor("ZodError", initializer, { Parent: Error });
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/classic/parse.js
		const parse = /* @__PURE__ */ _parse(ZodRealError);
		const parseAsync = /* @__PURE__ */ _parseAsync(ZodRealError);
		const safeParse = /* @__PURE__ */ _safeParse(ZodRealError);
		const safeParseAsync = /* @__PURE__ */ _safeParseAsync(ZodRealError);
		const encode = /* @__PURE__ */ _encode(ZodRealError);
		const decode = /* @__PURE__ */ _decode(ZodRealError);
		const encodeAsync = /* @__PURE__ */ _encodeAsync(ZodRealError);
		const decodeAsync = /* @__PURE__ */ _decodeAsync(ZodRealError);
		const safeEncode = /* @__PURE__ */ _safeEncode(ZodRealError);
		const safeDecode = /* @__PURE__ */ _safeDecode(ZodRealError);
		const safeEncodeAsync = /* @__PURE__ */ _safeEncodeAsync(ZodRealError);
		const safeDecodeAsync = /* @__PURE__ */ _safeDecodeAsync(ZodRealError);
		//#endregion
		//#region node_modules/.pnpm/zod@4.4.3/node_modules/zod/v4/classic/schemas.js
		const _installedGroups = /* @__PURE__ */ new WeakMap();
		function _installLazyMethods(inst, group, methods) {
			const proto = Object.getPrototypeOf(inst);
			let installed = _installedGroups.get(proto);
			if (!installed) {
				installed = /* @__PURE__ */ new Set();
				_installedGroups.set(proto, installed);
			}
			if (installed.has(group)) return;
			installed.add(group);
			for (const key in methods) {
				const fn = methods[key];
				Object.defineProperty(proto, key, {
					configurable: true,
					enumerable: false,
					get() {
						const bound = fn.bind(this);
						Object.defineProperty(this, key, {
							configurable: true,
							writable: true,
							enumerable: true,
							value: bound
						});
						return bound;
					},
					set(v) {
						Object.defineProperty(this, key, {
							configurable: true,
							writable: true,
							enumerable: true,
							value: v
						});
					}
				});
			}
		}
		const ZodType = /*@__PURE__*/ $constructor("ZodType", (inst, def) => {
			$ZodType.init(inst, def);
			Object.assign(inst["~standard"], { jsonSchema: {
				input: createStandardJSONSchemaMethod(inst, "input"),
				output: createStandardJSONSchemaMethod(inst, "output")
			} });
			inst.toJSONSchema = createToJSONSchemaMethod(inst, {});
			inst.def = def;
			inst.type = def.type;
			Object.defineProperty(inst, "_def", { value: def });
			inst.parse = (data, params) => parse(inst, data, params, { callee: inst.parse });
			inst.safeParse = (data, params) => safeParse(inst, data, params);
			inst.parseAsync = async (data, params) => parseAsync(inst, data, params, { callee: inst.parseAsync });
			inst.safeParseAsync = async (data, params) => safeParseAsync(inst, data, params);
			inst.spa = inst.safeParseAsync;
			inst.encode = (data, params) => encode(inst, data, params);
			inst.decode = (data, params) => decode(inst, data, params);
			inst.encodeAsync = async (data, params) => encodeAsync(inst, data, params);
			inst.decodeAsync = async (data, params) => decodeAsync(inst, data, params);
			inst.safeEncode = (data, params) => safeEncode(inst, data, params);
			inst.safeDecode = (data, params) => safeDecode(inst, data, params);
			inst.safeEncodeAsync = async (data, params) => safeEncodeAsync(inst, data, params);
			inst.safeDecodeAsync = async (data, params) => safeDecodeAsync(inst, data, params);
			_installLazyMethods(inst, "ZodType", {
				check(...chks) {
					const def = this.def;
					return this.clone(mergeDefs(def, { checks: [...def.checks ?? [], ...chks.map((ch) => typeof ch === "function" ? { _zod: {
						check: ch,
						def: { check: "custom" },
						onattach: []
					} } : ch)] }), { parent: true });
				},
				with(...chks) {
					return this.check(...chks);
				},
				clone(def, params) {
					return clone(this, def, params);
				},
				brand() {
					return this;
				},
				register(reg, meta) {
					reg.add(this, meta);
					return this;
				},
				refine(check, params) {
					return this.check(refine(check, params));
				},
				superRefine(refinement, params) {
					return this.check(superRefine(refinement, params));
				},
				overwrite(fn) {
					return this.check(/* @__PURE__ */ _overwrite(fn));
				},
				optional() {
					return optional(this);
				},
				exactOptional() {
					return exactOptional(this);
				},
				nullable() {
					return nullable(this);
				},
				nullish() {
					return optional(nullable(this));
				},
				nonoptional(params) {
					return nonoptional(this, params);
				},
				array() {
					return array(this);
				},
				or(arg) {
					return union([this, arg]);
				},
				and(arg) {
					return intersection(this, arg);
				},
				transform(tx) {
					return pipe(this, transform(tx));
				},
				default(d) {
					return _default(this, d);
				},
				prefault(d) {
					return prefault(this, d);
				},
				catch(params) {
					return _catch(this, params);
				},
				pipe(target) {
					return pipe(this, target);
				},
				readonly() {
					return readonly(this);
				},
				describe(description) {
					const cl = this.clone();
					globalRegistry.add(cl, { description });
					return cl;
				},
				meta(...args) {
					if (args.length === 0) return globalRegistry.get(this);
					const cl = this.clone();
					globalRegistry.add(cl, args[0]);
					return cl;
				},
				isOptional() {
					return this.safeParse(void 0).success;
				},
				isNullable() {
					return this.safeParse(null).success;
				},
				apply(fn) {
					return fn(this);
				}
			});
			Object.defineProperty(inst, "description", {
				get() {
					return globalRegistry.get(inst)?.description;
				},
				configurable: true
			});
			return inst;
		});
		/** @internal */
		const _ZodString = /*@__PURE__*/ $constructor("_ZodString", (inst, def) => {
			$ZodString.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => stringProcessor(inst, ctx, json, params);
			const bag = inst._zod.bag;
			inst.format = bag.format ?? null;
			inst.minLength = bag.minimum ?? null;
			inst.maxLength = bag.maximum ?? null;
			_installLazyMethods(inst, "_ZodString", {
				regex(...args) {
					return this.check(/* @__PURE__ */ _regex(...args));
				},
				includes(...args) {
					return this.check(/* @__PURE__ */ _includes(...args));
				},
				startsWith(...args) {
					return this.check(/* @__PURE__ */ _startsWith(...args));
				},
				endsWith(...args) {
					return this.check(/* @__PURE__ */ _endsWith(...args));
				},
				min(...args) {
					return this.check(/* @__PURE__ */ _minLength(...args));
				},
				max(...args) {
					return this.check(/* @__PURE__ */ _maxLength(...args));
				},
				length(...args) {
					return this.check(/* @__PURE__ */ _length(...args));
				},
				nonempty(...args) {
					return this.check(/* @__PURE__ */ _minLength(1, ...args));
				},
				lowercase(params) {
					return this.check(/* @__PURE__ */ _lowercase(params));
				},
				uppercase(params) {
					return this.check(/* @__PURE__ */ _uppercase(params));
				},
				trim() {
					return this.check(/* @__PURE__ */ _trim());
				},
				normalize(...args) {
					return this.check(/* @__PURE__ */ _normalize(...args));
				},
				toLowerCase() {
					return this.check(/* @__PURE__ */ _toLowerCase());
				},
				toUpperCase() {
					return this.check(/* @__PURE__ */ _toUpperCase());
				},
				slugify() {
					return this.check(/* @__PURE__ */ _slugify());
				}
			});
		});
		const ZodString = /*@__PURE__*/ $constructor("ZodString", (inst, def) => {
			$ZodString.init(inst, def);
			_ZodString.init(inst, def);
			inst.email = (params) => inst.check(/* @__PURE__ */ _email(ZodEmail, params));
			inst.url = (params) => inst.check(/* @__PURE__ */ _url(ZodURL, params));
			inst.jwt = (params) => inst.check(/* @__PURE__ */ _jwt(ZodJWT, params));
			inst.emoji = (params) => inst.check(/* @__PURE__ */ _emoji(ZodEmoji, params));
			inst.guid = (params) => inst.check(/* @__PURE__ */ _guid(ZodGUID, params));
			inst.uuid = (params) => inst.check(/* @__PURE__ */ _uuid(ZodUUID, params));
			inst.uuidv4 = (params) => inst.check(/* @__PURE__ */ _uuidv4(ZodUUID, params));
			inst.uuidv6 = (params) => inst.check(/* @__PURE__ */ _uuidv6(ZodUUID, params));
			inst.uuidv7 = (params) => inst.check(/* @__PURE__ */ _uuidv7(ZodUUID, params));
			inst.nanoid = (params) => inst.check(/* @__PURE__ */ _nanoid(ZodNanoID, params));
			inst.guid = (params) => inst.check(/* @__PURE__ */ _guid(ZodGUID, params));
			inst.cuid = (params) => inst.check(/* @__PURE__ */ _cuid(ZodCUID, params));
			inst.cuid2 = (params) => inst.check(/* @__PURE__ */ _cuid2(ZodCUID2, params));
			inst.ulid = (params) => inst.check(/* @__PURE__ */ _ulid(ZodULID, params));
			inst.base64 = (params) => inst.check(/* @__PURE__ */ _base64(ZodBase64, params));
			inst.base64url = (params) => inst.check(/* @__PURE__ */ _base64url(ZodBase64URL, params));
			inst.xid = (params) => inst.check(/* @__PURE__ */ _xid(ZodXID, params));
			inst.ksuid = (params) => inst.check(/* @__PURE__ */ _ksuid(ZodKSUID, params));
			inst.ipv4 = (params) => inst.check(/* @__PURE__ */ _ipv4(ZodIPv4, params));
			inst.ipv6 = (params) => inst.check(/* @__PURE__ */ _ipv6(ZodIPv6, params));
			inst.cidrv4 = (params) => inst.check(/* @__PURE__ */ _cidrv4(ZodCIDRv4, params));
			inst.cidrv6 = (params) => inst.check(/* @__PURE__ */ _cidrv6(ZodCIDRv6, params));
			inst.e164 = (params) => inst.check(/* @__PURE__ */ _e164(ZodE164, params));
			inst.datetime = (params) => inst.check(datetime(params));
			inst.date = (params) => inst.check(date(params));
			inst.time = (params) => inst.check(time(params));
			inst.duration = (params) => inst.check(duration(params));
		});
		function string(params) {
			return /* @__PURE__ */ _string(ZodString, params);
		}
		const ZodStringFormat = /*@__PURE__*/ $constructor("ZodStringFormat", (inst, def) => {
			$ZodStringFormat.init(inst, def);
			_ZodString.init(inst, def);
		});
		const ZodEmail = /*@__PURE__*/ $constructor("ZodEmail", (inst, def) => {
			$ZodEmail.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodGUID = /*@__PURE__*/ $constructor("ZodGUID", (inst, def) => {
			$ZodGUID.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodUUID = /*@__PURE__*/ $constructor("ZodUUID", (inst, def) => {
			$ZodUUID.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodURL = /*@__PURE__*/ $constructor("ZodURL", (inst, def) => {
			$ZodURL.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodEmoji = /*@__PURE__*/ $constructor("ZodEmoji", (inst, def) => {
			$ZodEmoji.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodNanoID = /*@__PURE__*/ $constructor("ZodNanoID", (inst, def) => {
			$ZodNanoID.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		/**
		* @deprecated CUID v1 is deprecated by its authors due to information leakage
		* (timestamps embedded in the id). Use {@link ZodCUID2} instead.
		* See https://github.com/paralleldrive/cuid.
		*/
		const ZodCUID = /*@__PURE__*/ $constructor("ZodCUID", (inst, def) => {
			$ZodCUID.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodCUID2 = /*@__PURE__*/ $constructor("ZodCUID2", (inst, def) => {
			$ZodCUID2.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodULID = /*@__PURE__*/ $constructor("ZodULID", (inst, def) => {
			$ZodULID.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodXID = /*@__PURE__*/ $constructor("ZodXID", (inst, def) => {
			$ZodXID.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodKSUID = /*@__PURE__*/ $constructor("ZodKSUID", (inst, def) => {
			$ZodKSUID.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodIPv4 = /*@__PURE__*/ $constructor("ZodIPv4", (inst, def) => {
			$ZodIPv4.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodIPv6 = /*@__PURE__*/ $constructor("ZodIPv6", (inst, def) => {
			$ZodIPv6.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodCIDRv4 = /*@__PURE__*/ $constructor("ZodCIDRv4", (inst, def) => {
			$ZodCIDRv4.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodCIDRv6 = /*@__PURE__*/ $constructor("ZodCIDRv6", (inst, def) => {
			$ZodCIDRv6.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodBase64 = /*@__PURE__*/ $constructor("ZodBase64", (inst, def) => {
			$ZodBase64.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodBase64URL = /*@__PURE__*/ $constructor("ZodBase64URL", (inst, def) => {
			$ZodBase64URL.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodE164 = /*@__PURE__*/ $constructor("ZodE164", (inst, def) => {
			$ZodE164.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodJWT = /*@__PURE__*/ $constructor("ZodJWT", (inst, def) => {
			$ZodJWT.init(inst, def);
			ZodStringFormat.init(inst, def);
		});
		const ZodNumber = /*@__PURE__*/ $constructor("ZodNumber", (inst, def) => {
			$ZodNumber.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => numberProcessor(inst, ctx, json, params);
			_installLazyMethods(inst, "ZodNumber", {
				gt(value, params) {
					return this.check(/* @__PURE__ */ _gt(value, params));
				},
				gte(value, params) {
					return this.check(/* @__PURE__ */ _gte(value, params));
				},
				min(value, params) {
					return this.check(/* @__PURE__ */ _gte(value, params));
				},
				lt(value, params) {
					return this.check(/* @__PURE__ */ _lt(value, params));
				},
				lte(value, params) {
					return this.check(/* @__PURE__ */ _lte(value, params));
				},
				max(value, params) {
					return this.check(/* @__PURE__ */ _lte(value, params));
				},
				int(params) {
					return this.check(int(params));
				},
				safe(params) {
					return this.check(int(params));
				},
				positive(params) {
					return this.check(/* @__PURE__ */ _gt(0, params));
				},
				nonnegative(params) {
					return this.check(/* @__PURE__ */ _gte(0, params));
				},
				negative(params) {
					return this.check(/* @__PURE__ */ _lt(0, params));
				},
				nonpositive(params) {
					return this.check(/* @__PURE__ */ _lte(0, params));
				},
				multipleOf(value, params) {
					return this.check(/* @__PURE__ */ _multipleOf(value, params));
				},
				step(value, params) {
					return this.check(/* @__PURE__ */ _multipleOf(value, params));
				},
				finite() {
					return this;
				}
			});
			const bag = inst._zod.bag;
			inst.minValue = Math.max(bag.minimum ?? Number.NEGATIVE_INFINITY, bag.exclusiveMinimum ?? Number.NEGATIVE_INFINITY) ?? null;
			inst.maxValue = Math.min(bag.maximum ?? Number.POSITIVE_INFINITY, bag.exclusiveMaximum ?? Number.POSITIVE_INFINITY) ?? null;
			inst.isInt = (bag.format ?? "").includes("int") || Number.isSafeInteger(bag.multipleOf ?? .5);
			inst.isFinite = true;
			inst.format = bag.format ?? null;
		});
		function number(params) {
			return /* @__PURE__ */ _number(ZodNumber, params);
		}
		const ZodNumberFormat = /*@__PURE__*/ $constructor("ZodNumberFormat", (inst, def) => {
			$ZodNumberFormat.init(inst, def);
			ZodNumber.init(inst, def);
		});
		function int(params) {
			return /* @__PURE__ */ _int(ZodNumberFormat, params);
		}
		const ZodBoolean = /*@__PURE__*/ $constructor("ZodBoolean", (inst, def) => {
			$ZodBoolean.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => booleanProcessor(inst, ctx, json, params);
		});
		function boolean(params) {
			return /* @__PURE__ */ _boolean(ZodBoolean, params);
		}
		const ZodAny = /*@__PURE__*/ $constructor("ZodAny", (inst, def) => {
			$ZodAny.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => void 0;
		});
		function any() {
			return /* @__PURE__ */ _any(ZodAny);
		}
		const ZodUnknown = /*@__PURE__*/ $constructor("ZodUnknown", (inst, def) => {
			$ZodUnknown.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => void 0;
		});
		function unknown() {
			return /* @__PURE__ */ _unknown(ZodUnknown);
		}
		const ZodNever = /*@__PURE__*/ $constructor("ZodNever", (inst, def) => {
			$ZodNever.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => neverProcessor(inst, ctx, json, params);
		});
		function never(params) {
			return /* @__PURE__ */ _never(ZodNever, params);
		}
		const ZodArray = /*@__PURE__*/ $constructor("ZodArray", (inst, def) => {
			$ZodArray.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => arrayProcessor(inst, ctx, json, params);
			inst.element = def.element;
			_installLazyMethods(inst, "ZodArray", {
				min(n, params) {
					return this.check(/* @__PURE__ */ _minLength(n, params));
				},
				nonempty(params) {
					return this.check(/* @__PURE__ */ _minLength(1, params));
				},
				max(n, params) {
					return this.check(/* @__PURE__ */ _maxLength(n, params));
				},
				length(n, params) {
					return this.check(/* @__PURE__ */ _length(n, params));
				},
				unwrap() {
					return this.element;
				}
			});
		});
		function array(element, params) {
			return /* @__PURE__ */ _array(ZodArray, element, params);
		}
		const ZodObject = /*@__PURE__*/ $constructor("ZodObject", (inst, def) => {
			$ZodObjectJIT.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => objectProcessor(inst, ctx, json, params);
			defineLazy(inst, "shape", () => {
				return def.shape;
			});
			_installLazyMethods(inst, "ZodObject", {
				keyof() {
					return _enum(Object.keys(this._zod.def.shape));
				},
				catchall(catchall) {
					return this.clone({
						...this._zod.def,
						catchall
					});
				},
				passthrough() {
					return this.clone({
						...this._zod.def,
						catchall: unknown()
					});
				},
				loose() {
					return this.clone({
						...this._zod.def,
						catchall: unknown()
					});
				},
				strict() {
					return this.clone({
						...this._zod.def,
						catchall: never()
					});
				},
				strip() {
					return this.clone({
						...this._zod.def,
						catchall: void 0
					});
				},
				extend(incoming) {
					return extend(this, incoming);
				},
				safeExtend(incoming) {
					return safeExtend(this, incoming);
				},
				merge(other) {
					return merge(this, other);
				},
				pick(mask) {
					return pick(this, mask);
				},
				omit(mask) {
					return omit(this, mask);
				},
				partial(...args) {
					return partial(ZodOptional, this, args[0]);
				},
				required(...args) {
					return required(ZodNonOptional, this, args[0]);
				}
			});
		});
		function object(shape, params) {
			const def = {
				type: "object",
				shape: shape ?? {},
				...normalizeParams(params)
			};
			return new ZodObject(def);
		}
		const ZodUnion = /*@__PURE__*/ $constructor("ZodUnion", (inst, def) => {
			$ZodUnion.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => unionProcessor(inst, ctx, json, params);
			inst.options = def.options;
		});
		function union(options, params) {
			return new ZodUnion({
				type: "union",
				options,
				...normalizeParams(params)
			});
		}
		const ZodIntersection = /*@__PURE__*/ $constructor("ZodIntersection", (inst, def) => {
			$ZodIntersection.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => intersectionProcessor(inst, ctx, json, params);
		});
		function intersection(left, right) {
			return new ZodIntersection({
				type: "intersection",
				left,
				right
			});
		}
		const ZodEnum = /*@__PURE__*/ $constructor("ZodEnum", (inst, def) => {
			$ZodEnum.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => enumProcessor(inst, ctx, json, params);
			inst.enum = def.entries;
			inst.options = Object.values(def.entries);
			const keys = new Set(Object.keys(def.entries));
			inst.extract = (values, params) => {
				const newEntries = {};
				for (const value of values) if (keys.has(value)) newEntries[value] = def.entries[value];
				else throw new Error(`Key ${value} not found in enum`);
				return new ZodEnum({
					...def,
					checks: [],
					...normalizeParams(params),
					entries: newEntries
				});
			};
			inst.exclude = (values, params) => {
				const newEntries = { ...def.entries };
				for (const value of values) if (keys.has(value)) delete newEntries[value];
				else throw new Error(`Key ${value} not found in enum`);
				return new ZodEnum({
					...def,
					checks: [],
					...normalizeParams(params),
					entries: newEntries
				});
			};
		});
		function _enum(values, params) {
			const entries = Array.isArray(values) ? Object.fromEntries(values.map((v) => [v, v])) : values;
			return new ZodEnum({
				type: "enum",
				entries,
				...normalizeParams(params)
			});
		}
		const ZodLiteral = /*@__PURE__*/ $constructor("ZodLiteral", (inst, def) => {
			$ZodLiteral.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => literalProcessor(inst, ctx, json, params);
			inst.values = new Set(def.values);
			Object.defineProperty(inst, "value", { get() {
				if (def.values.length > 1) throw new Error("This schema contains multiple valid literal values. Use `.values` instead.");
				return def.values[0];
			} });
		});
		function literal(value, params) {
			return new ZodLiteral({
				type: "literal",
				values: Array.isArray(value) ? value : [value],
				...normalizeParams(params)
			});
		}
		const ZodTransform = /*@__PURE__*/ $constructor("ZodTransform", (inst, def) => {
			$ZodTransform.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => transformProcessor(inst, ctx, json, params);
			inst._zod.parse = (payload, _ctx) => {
				if (_ctx.direction === "backward") throw new $ZodEncodeError(inst.constructor.name);
				payload.addIssue = (issue$1) => {
					if (typeof issue$1 === "string") payload.issues.push(issue(issue$1, payload.value, def));
					else {
						const _issue = issue$1;
						if (_issue.fatal) _issue.continue = false;
						_issue.code ?? (_issue.code = "custom");
						_issue.input ?? (_issue.input = payload.value);
						_issue.inst ?? (_issue.inst = inst);
						payload.issues.push(issue(_issue));
					}
				};
				const output = def.transform(payload.value, payload);
				if (output instanceof Promise) return output.then((output) => {
					payload.value = output;
					payload.fallback = true;
					return payload;
				});
				payload.value = output;
				payload.fallback = true;
				return payload;
			};
		});
		function transform(fn) {
			return new ZodTransform({
				type: "transform",
				transform: fn
			});
		}
		const ZodOptional = /*@__PURE__*/ $constructor("ZodOptional", (inst, def) => {
			$ZodOptional.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
			inst.unwrap = () => inst._zod.def.innerType;
		});
		function optional(innerType) {
			return new ZodOptional({
				type: "optional",
				innerType
			});
		}
		const ZodExactOptional = /*@__PURE__*/ $constructor("ZodExactOptional", (inst, def) => {
			$ZodExactOptional.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => optionalProcessor(inst, ctx, json, params);
			inst.unwrap = () => inst._zod.def.innerType;
		});
		function exactOptional(innerType) {
			return new ZodExactOptional({
				type: "optional",
				innerType
			});
		}
		const ZodNullable = /*@__PURE__*/ $constructor("ZodNullable", (inst, def) => {
			$ZodNullable.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => nullableProcessor(inst, ctx, json, params);
			inst.unwrap = () => inst._zod.def.innerType;
		});
		function nullable(innerType) {
			return new ZodNullable({
				type: "nullable",
				innerType
			});
		}
		const ZodDefault = /*@__PURE__*/ $constructor("ZodDefault", (inst, def) => {
			$ZodDefault.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => defaultProcessor(inst, ctx, json, params);
			inst.unwrap = () => inst._zod.def.innerType;
			inst.removeDefault = inst.unwrap;
		});
		function _default(innerType, defaultValue) {
			return new ZodDefault({
				type: "default",
				innerType,
				get defaultValue() {
					return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
				}
			});
		}
		const ZodPrefault = /*@__PURE__*/ $constructor("ZodPrefault", (inst, def) => {
			$ZodPrefault.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => prefaultProcessor(inst, ctx, json, params);
			inst.unwrap = () => inst._zod.def.innerType;
		});
		function prefault(innerType, defaultValue) {
			return new ZodPrefault({
				type: "prefault",
				innerType,
				get defaultValue() {
					return typeof defaultValue === "function" ? defaultValue() : shallowClone(defaultValue);
				}
			});
		}
		const ZodNonOptional = /*@__PURE__*/ $constructor("ZodNonOptional", (inst, def) => {
			$ZodNonOptional.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => nonoptionalProcessor(inst, ctx, json, params);
			inst.unwrap = () => inst._zod.def.innerType;
		});
		function nonoptional(innerType, params) {
			return new ZodNonOptional({
				type: "nonoptional",
				innerType,
				...normalizeParams(params)
			});
		}
		const ZodCatch = /*@__PURE__*/ $constructor("ZodCatch", (inst, def) => {
			$ZodCatch.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => catchProcessor(inst, ctx, json, params);
			inst.unwrap = () => inst._zod.def.innerType;
			inst.removeCatch = inst.unwrap;
		});
		function _catch(innerType, catchValue) {
			return new ZodCatch({
				type: "catch",
				innerType,
				catchValue: typeof catchValue === "function" ? catchValue : () => catchValue
			});
		}
		const ZodPipe = /*@__PURE__*/ $constructor("ZodPipe", (inst, def) => {
			$ZodPipe.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => pipeProcessor(inst, ctx, json, params);
			inst.in = def.in;
			inst.out = def.out;
		});
		function pipe(in_, out) {
			return new ZodPipe({
				type: "pipe",
				in: in_,
				out
			});
		}
		const ZodReadonly = /*@__PURE__*/ $constructor("ZodReadonly", (inst, def) => {
			$ZodReadonly.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => readonlyProcessor(inst, ctx, json, params);
			inst.unwrap = () => inst._zod.def.innerType;
		});
		function readonly(innerType) {
			return new ZodReadonly({
				type: "readonly",
				innerType
			});
		}
		const ZodCustom = /*@__PURE__*/ $constructor("ZodCustom", (inst, def) => {
			$ZodCustom.init(inst, def);
			ZodType.init(inst, def);
			inst._zod.processJSONSchema = (ctx, json, params) => customProcessor(inst, ctx, json, params);
		});
		function refine(fn, _params = {}) {
			return /* @__PURE__ */ _refine(ZodCustom, fn, _params);
		}
		function superRefine(fn, params) {
			return /* @__PURE__ */ _superRefine(fn, params);
		}
		//#endregion
		//#region lib/types/descriptors.js
		/**
		* The Typert invocation descriptors of this plugin — one authority shared by
		* both halves.
		*
		* The host half registers these through `ctx.typert.register()` and the client
		* half mounts the same list as its Remote contribution, so the two sides
		* cannot drift on parameter arity or result schemas.
		*
		* Registering explicitly is not optional here. The Gateway's other discovery
		* path (SRC mode) reads the `@Remote` markers out of dsh-typert-protocol's
		* PRIVATE MODULE STATE, which only works when the plugin and the host resolve
		* that package to the same file. A globally installed `dsh` CLI carries its
		* own copy under its own node_modules, while an installed plugin resolves to
		* the profile's copy — two instances, no shared markers, and the Gateway's
		* `claimsEndpoint` then refuses every endpoint, so each call falls through to
		* the SPA route and answers 404. Descriptors registered here live in the
		* `ctx.typert.local` registry instead: a Cordis service, reached through the
		* context, immune to how the module specifier resolved.
		*
		* Parameter arity is a wire contract: the Gateway maps `parameters`
		* positionally onto the host method (`Reflect.apply`) and both halves reject a
		* mismatched argument count, so a descriptor's parameter list IS the host
		* method's signature. Every method here declares exactly one `request`
		* parameter, matching the one request object each gateway method takes.
		* @module dsh-web-enhanced/src/descriptors
		*/
		/** Wire namespace and Cordis service key of the gateway. */
		const WEB_ENHANCED_NAMESPACE = "webEnhanced";
		/** Package identity carried by both contributions. */
		const WEB_ENHANCED_PACKAGE = "dsh-web-enhanced";
		/** Type symbol prefix of this plugin's payload module. */
		const TYPES = "dsh-web-enhanced/types#";
		/** Strict codec whose schema accepts any plain JSON value (parameters). */
		function jsonCodec(typeSymbol) {
			return {
				mode: "strict",
				typeSymbol,
				schema: any()
			};
		}
		const apiErrorSchema = object({
			code: string(),
			message: string()
		});
		/** Union of one success payload and the ApiError branch. */
		function okOrError(schema) {
			return union([schema, object({ error: apiErrorSchema })]);
		}
		const taskResultSchema = object({
			reasonKind: _enum([
				"completed",
				"error",
				"interrupted"
			]).optional(),
			summary: string().optional(),
			errorCode: string().optional(),
			errorMessage: string().optional()
		});
		const taskRecordSchema = object({
			id: string(),
			title: string(),
			prompt: string(),
			status: _enum([
				"planned",
				"todo",
				"running",
				"done",
				"failed"
			]),
			cron: string().nullable(),
			nextRunAt: number().nullable(),
			workspaceId: string().nullable(),
			sessionId: string().nullable(),
			result: taskResultSchema.nullable(),
			createdAt: number(),
			updatedAt: number(),
			lastRunAt: number().nullable()
		});
		const gitBranchViewSchema = object({
			name: string(),
			current: boolean()
		});
		const gitCommitViewSchema = object({
			hash: string(),
			parents: array(string()),
			refs: array(string()),
			author: string(),
			date: number(),
			subject: string()
		});
		const gitCommitDetailSchema = object({
			hash: string(),
			parents: array(string()),
			author: string(),
			email: string(),
			date: number(),
			subject: string(),
			body: string(),
			files: array(object({
				path: string(),
				added: number().nullable(),
				removed: number().nullable()
			}))
		});
		const gitStatusEntrySchema = object({
			path: string(),
			origPath: string().optional(),
			staged: string(),
			unstaged: string()
		});
		const gitOkSchema = object({
			ok: boolean(),
			message: string().optional()
		});
		const fsEntryViewSchema = object({
			name: string(),
			path: string(),
			kind: _enum(["file", "dir"]),
			size: number().optional()
		});
		const officeBlockSchema = union([object({
			type: _enum([
				"h1",
				"h2",
				"h3",
				"p",
				"li"
			]),
			text: string()
		}), object({
			type: literal("table"),
			rows: array(array(string()))
		})]);
		const officePreviewSchema = object({
			kind: _enum(["docx", "xlsx"]),
			blocks: array(officeBlockSchema),
			truncated: boolean()
		});
		const balanceInfoSchema = object({
			currency: string(),
			totalBalance: number(),
			grantedBalance: number(),
			toppedUpBalance: number()
		});
		const balanceViewSchema = object({
			applicable: boolean(),
			isAvailable: boolean(),
			infos: array(balanceInfoSchema),
			cachedAt: number(),
			error: apiErrorSchema.optional()
		});
		/**
		* Build one direct-method descriptor taking a single `request` object.
		* @param method - gateway method name (also the wire method).
		* @param requestTypeSymbol - type symbol of the request payload.
		* @param resultTypeSymbol - type symbol of the result payload.
		* @param resultSchema - strict result validation schema.
		* @returns the descriptor.
		*/
		function unary(method, requestTypeSymbol, resultTypeSymbol, resultSchema) {
			return {
				id: `${WEB_ENHANCED_PACKAGE}#${WEB_ENHANCED_NAMESPACE}/${method}`,
				service: WEB_ENHANCED_NAMESPACE,
				namespace: WEB_ENHANCED_NAMESPACE,
				method,
				invocation: { kind: "direct" },
				parameters: [{
					name: "request",
					wire: "request",
					source: "json",
					codec: jsonCodec(TYPES + requestTypeSymbol)
				}],
				result: {
					mode: "strict",
					typeSymbol: TYPES + resultTypeSymbol,
					schema: resultSchema
				}
			};
		}
		/**
		* Build one direct-method descriptor taking no parameters.
		* @param method - gateway method name (also the wire method).
		* @param resultTypeSymbol - type symbol of the result payload.
		* @param resultSchema - strict result validation schema.
		* @returns the descriptor.
		*/
		function nullary(method, resultTypeSymbol, resultSchema) {
			return {
				id: `${WEB_ENHANCED_PACKAGE}#${WEB_ENHANCED_NAMESPACE}/${method}`,
				service: WEB_ENHANCED_NAMESPACE,
				namespace: WEB_ENHANCED_NAMESPACE,
				method,
				invocation: { kind: "direct" },
				parameters: [],
				result: {
					mode: "strict",
					typeSymbol: TYPES + resultTypeSymbol,
					schema: resultSchema
				}
			};
		}
		//#endregion
		//#region lib/types/client/remote.js
		/**
		* The client half's Typert contribution: the shared descriptors mounted as
		* this page's Remote namespace, plus the namespace typing.
		*
		* The descriptors themselves live in `../descriptors.ts` because the host half
		* registers the same list — see that module for why registering explicitly is
		* required rather than relying on the `@Remote` markers.
		* @module dsh-web-enhanced/src/client/remote
		*/
		/** The contribution mounted by the client half. */
		const webEnhancedRemote = {
			package: WEB_ENHANCED_PACKAGE,
			descriptors: [...[
				nullary("taskList", "TaskListResult", okOrError(object({ tasks: array(taskRecordSchema) }))),
				unary("taskCreate", "TaskCreateRequest", "TaskCreateResult", okOrError(object({ task: taskRecordSchema }))),
				unary("taskUpdate", "TaskUpdateRequest", "TaskUpdateResult", okOrError(object({ task: taskRecordSchema }))),
				unary("taskRemove", "TaskRemoveRequest", "TaskRemoveResult", okOrError(object({ removed: boolean() }))),
				unary("taskRun", "TaskRunRequest", "TaskRunResult", okOrError(object({
					started: boolean(),
					sessionId: string().nullable()
				}))),
				unary("balanceGet", "BalanceGetRequest", "BalanceView", balanceViewSchema),
				unary("gitBranches", "GitBranchesRequest", "GitBranchesResult", okOrError(object({ branches: array(gitBranchViewSchema) }))),
				unary("gitLog", "GitLogRequest", "GitLogResult", okOrError(object({ commits: array(gitCommitViewSchema) }))),
				unary("gitCommit", "GitCommitRequest", "GitCommitResult", okOrError(object({ commit: gitCommitDetailSchema }))),
				unary("gitCheckout", "GitCheckoutRequest", "GitCheckoutResult", okOrError(gitOkSchema)),
				unary("gitStatus", "GitStatusRequest", "GitStatusResult", okOrError(object({ entries: array(gitStatusEntrySchema) }))),
				unary("gitDiff", "GitDiffRequest", "GitDiffResult", okOrError(object({ text: string() }))),
				unary("gitStage", "GitMutateRequest", "GitMutateResult", okOrError(gitOkSchema)),
				unary("gitUnstage", "GitMutateRequest", "GitMutateResult", okOrError(gitOkSchema)),
				unary("gitDiscard", "GitMutateRequest", "GitMutateResult", okOrError(gitOkSchema)),
				unary("fsList", "FsListRequest", "FsListResult", okOrError(object({ entries: array(fsEntryViewSchema) }))),
				unary("fsSearch", "FsSearchRequest", "FsSearchResult", okOrError(object({ entries: array(fsEntryViewSchema) }))),
				unary("fsRead", "FsReadRequest", "FsReadResult", union([object({
					kind: _enum(["text", "binary"]),
					content: string(),
					truncated: boolean(),
					size: number()
				}), object({ error: apiErrorSchema })])),
				unary("fsWrite", "FsWriteRequest", "FsWriteResult", okOrError(object({ ok: boolean() }))),
				unary("fsDelete", "FsDeleteRequest", "FsWriteResult", okOrError(object({ ok: boolean() }))),
				unary("fsOfficePreview", "FsOfficePreviewRequest", "FsOfficePreviewResult", okOrError(officePreviewSchema))
			]]
		};
		//#endregion
		//#region lib/types/client/locales.js
		/**
		* Dictionaries of the web-enhanced namespace. The Chinese copy is canonical:
		* `WebEnhancedKey` derives from it, so a key added here without an English
		* translation stops compiling.
		* @module dsh-web-enhanced/src/client/locales
		*/
		/** Chinese product copy (canonical key set). */
		const zh = {
			"board.entry": "任务看板",
			"board.title": "任务看板",
			"board.close": "关闭",
			"board.column.planned": "待规划",
			"board.column.todo": "待办",
			"board.column.running": "进行中",
			"board.column.done": "已完成",
			"board.column.failed": "已失败",
			"board.empty": "暂无任务",
			"board.create": "新建任务",
			"board.form.title": "标题",
			"board.form.titlePlaceholder": "任务名称",
			"board.form.prompt": "提示词",
			"board.form.promptPlaceholder": "例如：运行 pnpm run build 并汇报结果",
			"board.form.cron": "Cron 表达式",
			"board.form.cronPlaceholder": "0 23 * * *",
			"board.form.cronHint": "五段式，留空则仅手动执行。例：0 23 * * * 表示每天 23:00",
			"board.form.workspace": "项目",
			"board.form.workspaceNone": "不绑定项目",
			"board.form.submit": "创建",
			"board.form.cancel": "取消",
			"board.action.run": "执行",
			"board.action.open": "查看会话",
			"board.action.edit": "编辑",
			"board.action.remove": "删除",
			"board.action.save": "保存",
			"board.action.toTodo": "移到待办",
			"board.action.toPlanned": "移回待规划",
			"board.meta.nextRun": "下次执行 {time}",
			"board.meta.lastRun": "上次执行 {time}",
			"board.meta.noSession": "尚未执行",
			"board.meta.cron": "定时 {cron}",
			"board.result.summary": "结果",
			"board.result.error": "失败：{message}",
			"board.error": "操作失败：{message}",
			"board.loading": "加载中…",
			"graph.entry": "Git 图谱",
			"graph.title": "Git 图谱",
			"graph.close": "关闭",
			"graph.empty": "没有可显示的提交",
			"graph.loading": "加载中…",
			"graph.refresh": "刷新",
			"graph.noWorkspace": "当前会话未绑定项目",
			"graph.error": "读取失败：{message}",
			"graph.filter": "分支",
			"graph.allBranches": "全部分支",
			"graph.detail.hash": "提交",
			"graph.detail.parents": "父提交",
			"graph.detail.author": "作者",
			"graph.detail.date": "时间",
			"graph.detail.files": "变更文件（{count}）",
			"mention.file": "引用文件",
			"mention.fileDescription": "选择工作区文件，把路径插入输入框",
			"mention.folder": "引用文件夹",
			"mention.folderDescription": "选择工作区文件夹，把路径插入输入框",
			"mention.empty": "没有匹配的条目",
			"mention.error": "读取工作区失败：{message}",
			"branch.label": "分支",
			"branch.switch": "切换到 {branch}",
			"branch.loading": "读取分支…",
			"branch.error": "读取分支失败",
			"branch.none": "非 Git 仓库",
			"view.workspace": "工作区",
			"panel.tab.files": "文件",
			"panel.tab.preview": "预览",
			"panel.tab.scm": "变更",
			"panel.noWorkspace": "当前会话未绑定项目",
			"files.search": "按文件名搜索",
			"files.empty": "目录为空",
			"files.searchEmpty": "没有匹配的文件",
			"files.error": "读取目录失败：{message}",
			"preview.empty": "在文件树中选择文件以预览",
			"preview.mode.source": "源码",
			"preview.mode.split": "分屏",
			"preview.mode.view": "预览",
			"preview.save": "保存",
			"preview.close": "关闭标签页",
			"preview.truncated": "内容已截断",
			"preview.unsupported": "该格式不支持内联预览",
			"preview.error": "打开失败：{message}",
			"preview.dirty": "未保存",
			"scm.empty": "工作区干净",
			"scm.staged": "已暂存",
			"scm.changes": "更改",
			"scm.stage": "暂存",
			"scm.unstage": "取消暂存",
			"scm.discard": "放弃更改",
			"scm.refresh": "刷新",
			"scm.renamed": "{from} → {to}",
			"scm.error": "读取状态失败：{message}",
			"balance.title": "余额",
			"balance.refresh": "刷新",
			"balance.error": "余额不可用：{message}"
		};
		/** English copy; the key set is checked against {@link zh}. */
		const en = {
			"board.entry": "Task board",
			"board.title": "Task board",
			"board.close": "Close",
			"board.column.planned": "Planned",
			"board.column.todo": "To do",
			"board.column.running": "Running",
			"board.column.done": "Done",
			"board.column.failed": "Failed",
			"board.empty": "No tasks yet",
			"board.create": "New task",
			"board.form.title": "Title",
			"board.form.titlePlaceholder": "Task name",
			"board.form.prompt": "Prompt",
			"board.form.promptPlaceholder": "For example: run pnpm run build and report the result",
			"board.form.cron": "Cron expression",
			"board.form.cronPlaceholder": "0 23 * * *",
			"board.form.cronHint": "Five fields; leave empty to run manually only. Example: 0 23 * * * runs daily at 23:00",
			"board.form.workspace": "Project",
			"board.form.workspaceNone": "No project",
			"board.form.submit": "Create",
			"board.form.cancel": "Cancel",
			"board.action.run": "Run",
			"board.action.open": "Open session",
			"board.action.edit": "Edit",
			"board.action.remove": "Delete",
			"board.action.save": "Save",
			"board.action.toTodo": "Move to to-do",
			"board.action.toPlanned": "Move to planned",
			"board.meta.nextRun": "Next run {time}",
			"board.meta.lastRun": "Last run {time}",
			"board.meta.noSession": "Never run",
			"board.meta.cron": "Scheduled {cron}",
			"board.result.summary": "Result",
			"board.result.error": "Failed: {message}",
			"board.error": "Action failed: {message}",
			"board.loading": "Loading…",
			"graph.entry": "Git graph",
			"graph.title": "Git graph",
			"graph.close": "Close",
			"graph.empty": "No commits to show",
			"graph.loading": "Loading…",
			"graph.refresh": "Refresh",
			"graph.noWorkspace": "The current session has no project",
			"graph.error": "Read failed: {message}",
			"graph.filter": "Branch",
			"graph.allBranches": "All branches",
			"graph.detail.hash": "Commit",
			"graph.detail.parents": "Parents",
			"graph.detail.author": "Author",
			"graph.detail.date": "Date",
			"graph.detail.files": "Changed files ({count})",
			"mention.file": "Mention file",
			"mention.fileDescription": "Pick a workspace file and insert its path into the composer",
			"mention.folder": "Mention folder",
			"mention.folderDescription": "Pick a workspace folder and insert its path into the composer",
			"mention.empty": "No matching entries",
			"mention.error": "Could not read the workspace: {message}",
			"branch.label": "Branch",
			"branch.switch": "Switch to {branch}",
			"branch.loading": "Reading branches…",
			"branch.error": "Could not read branches",
			"branch.none": "Not a git repository",
			"view.workspace": "Workspace",
			"panel.tab.files": "Files",
			"panel.tab.preview": "Preview",
			"panel.tab.scm": "Changes",
			"panel.noWorkspace": "The current session has no project",
			"files.search": "Search by file name",
			"files.empty": "Empty directory",
			"files.searchEmpty": "No matching files",
			"files.error": "Could not read the directory: {message}",
			"preview.empty": "Pick a file in the tree to preview it",
			"preview.mode.source": "Source",
			"preview.mode.split": "Split",
			"preview.mode.view": "Preview",
			"preview.save": "Save",
			"preview.close": "Close tab",
			"preview.truncated": "Content was truncated",
			"preview.unsupported": "This format has no inline preview",
			"preview.error": "Could not open: {message}",
			"preview.dirty": "Unsaved",
			"scm.empty": "Working tree clean",
			"scm.staged": "Staged",
			"scm.changes": "Changes",
			"scm.stage": "Stage",
			"scm.unstage": "Unstage",
			"scm.discard": "Discard",
			"scm.refresh": "Refresh",
			"scm.renamed": "{from} → {to}",
			"scm.error": "Could not read status: {message}",
			"balance.title": "Balance",
			"balance.refresh": "Refresh",
			"balance.error": "Balance unavailable: {message}"
		};
		//#endregion
		//#region lib/types/client/facade.js
		/**
		* Remote envelope adapter.
		*
		* A mounted Typert namespace method does NOT resolve to the host's business
		* payload — it resolves to `RemoteResult<T>`, the `{ ok: true, value }` /
		* `{ ok: false, error }` envelope. The Remote face folds carrier failures
		* (offline, an unmounted host method, a rejected payload) into that error
		* branch rather than rejecting, so a component that reads the resolved value
		* as if it were the payload sees `undefined` fields instead of a failure.
		*
		* This adapter is the one place that opens the envelope. Every method comes
		* back as this plugin's own success-or-`{ error }` union, which is what the
		* components already narrow on, so a transport failure renders exactly like a
		* business failure instead of crashing the slot entry.
		* @module dsh-web-enhanced/src/client/facade
		*/
		/** Project a transport failure onto this plugin's error payload. */
		function apiErrorOf(failure) {
			return {
				code: failure.code,
				message: failure.message
			};
		}
		/**
		* Open one envelope, folding a transport failure into the `{ error }` branch
		* every gateway result already carries.
		* @param settled - the resolved envelope.
		* @returns the payload, or the error branch.
		*/
		function open(settled) {
			return settled.ok ? settled.value : { error: apiErrorOf(settled.error) };
		}
		/**
		* Wrap a mounted namespace into the facade components call.
		* @param raw - the mounted `remote.webEnhanced` namespace.
		* @param now - clock for the balance fallback's `cachedAt`.
		* @returns the envelope-free facade.
		*/
		function createRemoteFacade(raw, now = Date.now) {
			return {
				taskList: async () => open(await raw.taskList()),
				taskCreate: async (request) => open(await raw.taskCreate(request)),
				taskUpdate: async (request) => open(await raw.taskUpdate(request)),
				taskRemove: async (request) => open(await raw.taskRemove(request)),
				taskRun: async (request) => open(await raw.taskRun(request)),
				balanceGet: async (request) => {
					const settled = await raw.balanceGet(request);
					return settled.ok ? settled.value : {
						applicable: true,
						isAvailable: false,
						infos: [],
						cachedAt: now(),
						error: apiErrorOf(settled.error)
					};
				},
				gitBranches: async (request) => open(await raw.gitBranches(request)),
				gitLog: async (request) => open(await raw.gitLog(request)),
				gitCommit: async (request) => open(await raw.gitCommit(request)),
				gitCheckout: async (request) => open(await raw.gitCheckout(request)),
				gitStatus: async (request) => open(await raw.gitStatus(request)),
				gitDiff: async (request) => open(await raw.gitDiff(request)),
				gitStage: async (request) => open(await raw.gitStage(request)),
				gitUnstage: async (request) => open(await raw.gitUnstage(request)),
				gitDiscard: async (request) => open(await raw.gitDiscard(request)),
				fsList: async (request) => open(await raw.fsList(request)),
				fsSearch: async (request) => open(await raw.fsSearch(request)),
				fsRead: async (request) => open(await raw.fsRead(request)),
				fsWrite: async (request) => open(await raw.fsWrite(request)),
				fsDelete: async (request) => open(await raw.fsDelete(request)),
				fsOfficePreview: async (request) => open(await raw.fsOfficePreview(request))
			};
		}
		//#endregion
		//#region lib/types/client/model-route.js
		/**
		* The model-route read: which provider a session's current selection uses.
		*
		* Resolved from `ctx.modelDirectories`, the per-session directory the model
		* selector itself renders from — the same fact source, so switching models in
		* the composer moves this the moment it moves there. Read UNINJECTED: the
		* selector plugin is optional, and a deployment without it must still get a
		* working balance line rather than a client entry that never starts.
		* @module dsh-web-enhanced/src/client/model-route
		*/
		/**
		* Build the model-route face.
		* @param deps - the optional directory service lookup.
		* @returns the face injected into every registration.
		*/
		function createModelRoute(deps) {
			const storeOf = (sessionId) => {
				try {
					return deps.directories()?.directoryFor(sessionId).store;
				} catch {
					return;
				}
			};
			return {
				provider: (sessionId) => storeOf(sessionId)?.getSnapshot().current?.provider,
				subscribe: (sessionId, listener) => storeOf(sessionId)?.subscribe(listener) ?? (() => {})
			};
		}
		//#endregion
		//#region lib/types/client/mention.js
		/**
		* File and folder mention pickers in the composer's `+` menu.
		*
		* Registered as CLIENT command contributions (`ctx.commandUi.register`), which
		* is what puts a row in that menu without a host command behind it. Picking a
		* row appends `@<path>` to the draft: a plain-text reference the model reads
		* as a path it can hand to `read_file`, and one this plugin can produce
		* without owning an `@` trigger source or a reference codec.
		* @module dsh-web-enhanced/src/client/mention
		*/
		/** Quote a path only when it needs it, so the common case stays readable. */
		function mentionOf(path) {
			return /\s/u.test(path) ? `@"${path}" ` : `@${path} `;
		}
		/**
		* Build the option rows for one picker.
		*
		* The host search is bounded (`searchMaxEntries`), so this is a bounded
		* listing the shell then filters locally rather than a live query per
		* keystroke. A workspace larger than that cap is visible only up to it —
		* which the empty-search row set makes obvious rather than silently wrong.
		* @param deps - remote and workspace resolution.
		* @param kind - entries to keep.
		* @param sessionId - the session whose project is listed.
		* @returns the rows, deepest-path-last in host walk order.
		* @throws when the session has no project or the host refuses the listing.
		*/
		async function mentionOptions(deps, kind, sessionId) {
			const workspaceId = deps.workspaceOf(sessionId);
			if (workspaceId === void 0) throw new Error("this session belongs to no project");
			const result = await deps.remote.fsSearch({ workspaceId });
			if ("error" in result) throw new Error(result.error.message);
			return result.entries.filter((entry) => entry.kind === kind).map((entry) => ({
				id: entry.path,
				label: entry.path
			}));
		}
		/**
		* Apply one picked row: append its mention to the session's draft.
		* @param deps - draft access and the deferral seam.
		* @param sessionId - the session that opened the picker.
		* @param path - the picked entry's workspace-relative path.
		*/
		function applyMention(deps, sessionId, path) {
			(deps.defer ?? ((run) => {
				setTimeout(run, 0);
			}))(() => {
				deps.appendDraft(sessionId, mentionOf(path));
			});
		}
		//#endregion
		//#region lib/types/client/workspace.js
		/**
		* Session-to-workspace resolution shared by every surface that needs "the
		* current project". The right panel, the branch strip, and the git graph all
		* operate on a workspace root, while the framework hands components the
		* current SESSION — this is the one place that bridges the two.
		* @module dsh-web-enhanced/src/client/workspace
		*/
		/**
		* The workspace accounting for the current session.
		*
		* Absent when no session is current or when the current session belongs to no
		* workspace — an ungrouped session has no project root, so the surfaces that
		* need one render their empty state instead of guessing at a directory.
		* @param sessions - current-session slice.
		* @param workspaces - workspace list slice.
		* @returns the owning workspace, or undefined.
		*/
		function workspaceOfSession(sessions, workspaces) {
			const current = sessions.current;
			if (current === void 0) return void 0;
			return workspaceOfSessionId(current, workspaces);
		}
		/**
		* The workspace accounting for one exact session.
		*
		* Session-scoped surfaces use this rather than {@link workspaceOfSession}:
		* the framework hands them the session they render for, which stays correct
		* even when it is not the currently selected one.
		* @param sessionId - the session to account for.
		* @param workspaces - workspace list slice.
		* @returns the owning workspace, or undefined for an ungrouped session.
		*/
		function workspaceOfSessionId(sessionId, workspaces) {
			return workspaces.items.find((workspace) => workspace.sessionIds.includes(sessionId));
		}
		//#endregion
		//#region lib/types/client/stores.js
		/**
		* Shared client state of dsh-web-enhanced.
		*
		* These are plain observables (`getSnapshot`/`subscribe`), not slot stores.
		* A slot store handle is pinned to the scope of the slot it first mounts
		* under, and this plugin's surfaces span scopes: the sidebar entries and the
		* overlays are `root`, the branch strip and the balance line are `session`.
		* One shared handle across both would throw at registration ("one handle, one
		* scope"), so the state lives in `apply` and reaches components through each
		* registration's inject face, whose `hooks` compartment turns an observable
		* into a `use<Name>` selector hook.
		*
		* Geometry that must outlive a reload persists to localStorage, keyed per
		* workspace so "collapsed and 420px wide" is remembered per project.
		* @module dsh-web-enhanced/src/client/stores
		*/
		/**
		* Create one shared state cell, optionally mirrored to localStorage.
		*
		* Persistence is a durable boundary: stored text is parsed defensively and a
		* value that does not survive `revive` is discarded in favour of the initial
		* state, so a format change or hand-edited storage cannot wedge the panel.
		* @param initial - starting value when nothing valid was restored.
		* @param persist - localStorage key and reviver; omitted keeps the cell in memory.
		* @returns the cell.
		*/
		function createCell(initial, persist) {
			let value = initial;
			if (persist !== void 0 && typeof localStorage !== "undefined") {
				const stored = localStorage.getItem(persist.key);
				if (stored !== null) try {
					const revived = persist.revive(JSON.parse(stored));
					if (revived !== void 0) value = revived;
				} catch {}
			}
			const listeners = /* @__PURE__ */ new Set();
			return {
				getSnapshot: () => value,
				subscribe: (fn) => {
					listeners.add(fn);
					return () => {
						listeners.delete(fn);
					};
				},
				update: (next) => {
					const candidate = next(value);
					if (candidate === value) return;
					value = candidate;
					if (persist !== void 0 && typeof localStorage !== "undefined") try {
						localStorage.setItem(persist.key, JSON.stringify(value));
					} catch {}
					for (const fn of [...listeners]) fn();
				}
			};
		}
		/** Create the overlay cell and its bound actions. */
		function createOverlay() {
			const cell = createCell({ open: null });
			return {
				cell,
				actions: {
					openOverlay: (kind) => {
						cell.update((current) => current.open === kind ? current : { open: kind });
					},
					closeOverlay: () => {
						cell.update((current) => current.open === null ? current : { open: null });
					}
				}
			};
		}
		/** localStorage key of the persisted view state. */
		const PANEL_PERSIST_KEY = "dsh.webEnhanced.panel.v2";
		/** Restore persisted view state, dropping anything that is not the stored shape. */
		function revivePanel(raw) {
			if (typeof raw !== "object" || raw === null) return void 0;
			const record = raw;
			const tab = record["tab"];
			const expanded = {};
			if (typeof record["expanded"] === "object" && record["expanded"] !== null) {
				for (const [key, value] of Object.entries(record["expanded"])) if (Array.isArray(value)) expanded[key] = value.filter((item) => typeof item === "string");
			}
			return {
				tab: tab === "files" || tab === "preview" || tab === "scm" ? tab : "files",
				expanded,
				query: ""
			};
		}
		/** Create the view cell and its bound actions. */
		function createPanel() {
			const cell = createCell({
				tab: "files",
				expanded: {},
				query: ""
			}, {
				key: PANEL_PERSIST_KEY,
				revive: revivePanel
			});
			return {
				cell,
				actions: {
					selectTab: (tab) => {
						cell.update((current) => current.tab === tab ? current : {
							...current,
							tab
						});
					},
					toggleExpanded: (workspaceId, path) => {
						cell.update((current) => {
							const open = current.expanded[workspaceId] ?? [];
							const next = open.includes(path) ? open.filter((item) => item !== path) : [...open, path];
							return {
								...current,
								expanded: {
									...current.expanded,
									[workspaceId]: next
								}
							};
						});
					},
					setQuery: (query) => {
						cell.update((current) => current.query === query ? current : {
							...current,
							query
						});
					}
				}
			};
		}
		/** Create the preview cell and its bound actions. */
		function createPreview() {
			const cell = createCell({
				tabs: [],
				active: null
			});
			const replace = (path, edit) => {
				cell.update((current) => {
					const index = current.tabs.findIndex((tab) => tab.path === path);
					if (index === -1) return current;
					const edited = edit(current.tabs[index]);
					if (edited === current.tabs[index]) return current;
					const tabs = [...current.tabs];
					tabs[index] = edited;
					return {
						...current,
						tabs
					};
				});
			};
			return {
				cell,
				actions: {
					openTab: (tab) => {
						cell.update((current) => {
							const index = current.tabs.findIndex((open) => open.path === tab.path);
							if (index === -1) return {
								tabs: [...current.tabs, tab],
								active: tab.path
							};
							const tabs = [...current.tabs];
							tabs[index] = tab;
							return {
								tabs,
								active: tab.path
							};
						});
					},
					focusTab: (path) => {
						cell.update((current) => current.active === path || !current.tabs.some((tab) => tab.path === path) ? current : {
							...current,
							active: path
						});
					},
					closeTab: (path) => {
						cell.update((current) => {
							const index = current.tabs.findIndex((tab) => tab.path === path);
							if (index === -1) return current;
							const tabs = current.tabs.filter((tab) => tab.path !== path);
							if (current.active !== path) return {
								...current,
								tabs
							};
							return {
								tabs,
								active: tabs[Math.max(0, index - 1)]?.path ?? null
							};
						});
					},
					setMode: (path, mode) => {
						replace(path, (tab) => tab.mode === mode ? tab : {
							...tab,
							mode
						});
					},
					setDraft: (path, draft) => {
						replace(path, (tab) => tab.draft === draft ? tab : {
							...tab,
							draft
						});
					},
					commitDraft: (path) => {
						replace(path, (tab) => {
							if (tab.draft === void 0) return tab;
							const { draft, ...rest } = tab;
							return {
								...rest,
								content: draft
							};
						});
					},
					clearTabs: () => {
						cell.update((current) => current.tabs.length === 0 ? current : {
							tabs: [],
							active: null
						});
					}
				}
			};
		}
		/**
		* The active tab of a preview state.
		* @param state - preview state.
		* @returns the active tab, or undefined when none is open.
		*/
		function activeTabOf(state) {
			return state.active === null ? void 0 : state.tabs.find((tab) => tab.path === state.active);
		}
		//#endregion
		//#region \0dsh-css:D:\Documents\Dev-Repo\deepseek-harness\dsh-plugins\dsh-web-enhanced\src\client\board\SidebarEntry.module.css.mjs
		const css$10 = ".ZO-MhW_entry{width:100%;color:inherit;cursor:pointer;text-align:start;background:0 0;border:none;border-radius:5px;align-items:center;gap:8px;padding:5px 8px;font-size:12px;display:flex}.ZO-MhW_entry:hover{background:#8080a02e}.ZO-MhW_entry[data-active]{background:#8080a042}.ZO-MhW_glyph{opacity:.8;text-align:center;flex:none;width:14px}.ZO-MhW_label{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}";
		const tagId$10 = "dsh-web-enhanced/SidebarEntry.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$10) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId$10;
			tag.textContent = css$10;
			document.head.appendChild(tag);
		}
		var SidebarEntry_module_css_default = {
			"entry": "ZO-MhW_entry",
			"glyph": "ZO-MhW_glyph",
			"label": "ZO-MhW_label"
		};
		//#endregion
		//#region lib/types/client/board/SidebarEntry.js
		/** Task-board entry: toggles the board overlay. */
		function BoardSidebarEntry({ useOverlay, openOverlay, closeOverlay, t }) {
			const open = useOverlay((state) => state.open === "board");
			return (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: SidebarEntry_module_css_default.entry,
				"data-active": open || void 0,
				"aria-pressed": open,
				"data-testid": "web-enhanced-board-entry",
				onClick: () => {
					open ? closeOverlay() : openOverlay("board");
				},
				children: [(0, react_jsx_runtime.jsx)("span", {
					className: SidebarEntry_module_css_default.glyph,
					"aria-hidden": true,
					children: "▤"
				}), (0, react_jsx_runtime.jsx)("span", {
					className: SidebarEntry_module_css_default.label,
					children: t("board.entry")
				})]
			});
		}
		/** Git-graph entry: toggles the graph overlay. */
		function GraphSidebarEntry({ useOverlay, openOverlay, closeOverlay, t }) {
			const open = useOverlay((state) => state.open === "graph");
			return (0, react_jsx_runtime.jsxs)("button", {
				type: "button",
				className: SidebarEntry_module_css_default.entry,
				"data-active": open || void 0,
				"aria-pressed": open,
				"data-testid": "web-enhanced-graph-entry",
				onClick: () => {
					open ? closeOverlay() : openOverlay("graph");
				},
				children: [(0, react_jsx_runtime.jsx)("span", {
					className: SidebarEntry_module_css_default.glyph,
					"aria-hidden": true,
					children: "⎇"
				}), (0, react_jsx_runtime.jsx)("span", {
					className: SidebarEntry_module_css_default.label,
					children: t("graph.entry")
				})]
			});
		}
		//#endregion
		//#region lib/types/client/result.js
		/**
		* Result-branch helper for the fallible remote payloads.
		*
		* Every gateway method answers a discriminated union of one success shape and
		* `{ error }` — business failures are result fields, never thrown exceptions,
		* so the UI can render them in place. Components that only need "did this
		* fail, and why" go through here instead of re-narrowing each union.
		* @module dsh-web-enhanced/src/client/result
		*/
		/**
		* The failure message of a remote result, when it took the error branch.
		* @param result - any gateway result payload.
		* @returns the message, or undefined when the call succeeded.
		*/
		function errorMessageOf(result) {
			if (typeof result !== "object" || result === null || !("error" in result)) return void 0;
			const error = result.error;
			if (typeof error !== "object" || error === null || !("message" in error)) return void 0;
			const message = error.message;
			return typeof message === "string" ? message : void 0;
		}
		//#endregion
		//#region \0dsh-css:D:\Documents\Dev-Repo\deepseek-harness\dsh-plugins\dsh-web-enhanced\src\client\shell\OverlayShell.module.css.mjs
		const css$9 = "._3L05G_backdrop{pointer-events:auto;background:#00000073;justify-content:center;align-items:center;padding:32px;display:flex;position:fixed;inset:0}._3L05G_panel{background:var(--dsh-surface,Canvas);width:min(1180px,100%);height:min(760px,100%);color:var(--dsh-text,CanvasText);border:1px solid #8080804d;border-radius:10px;flex-direction:column;display:flex;overflow:hidden;box-shadow:0 18px 48px #00000059}._3L05G_panel:focus{outline:none}._3L05G_header{border-bottom:1px solid #8080803d;flex:none;align-items:center;gap:12px;padding:10px 14px;display:flex}._3L05G_title{margin:0;font-size:14px;font-weight:600}._3L05G_actions{flex:1;align-items:center;gap:8px;display:flex}._3L05G_close{color:inherit;cursor:pointer;opacity:.7;background:0 0;border:none;padding:4px 6px;font-size:14px;line-height:1}._3L05G_close:hover{opacity:1}._3L05G_body{flex:1;min-height:0;padding:14px;overflow:auto}";
		const tagId$9 = "dsh-web-enhanced/OverlayShell.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$9) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId$9;
			tag.textContent = css$9;
			document.head.appendChild(tag);
		}
		var OverlayShell_module_css_default = {
			"actions": "_3L05G_actions",
			"backdrop": "_3L05G_backdrop",
			"body": "_3L05G_body",
			"close": "_3L05G_close",
			"header": "_3L05G_header",
			"panel": "_3L05G_panel",
			"title": "_3L05G_title"
		};
		//#endregion
		//#region lib/types/client/shell/OverlayShell.js
		/**
		* Shared chrome of the two full-frame overlays (task board, git graph).
		*
		* `shell.overlay` is a click-through layer: entries opt into pointer events.
		* This shell is where that opt-in happens, together with the dismissal
		* contract — Escape anywhere, or a click on the backdrop but not inside the
		* panel. Keeping both in one component is what stops the two overlays from
		* drifting apart on keyboard behaviour.
		* @module dsh-web-enhanced/src/client/shell/OverlayShell
		*/
		/** Full-frame overlay chrome: backdrop, panel, title bar, dismissal. */
		function OverlayShell({ title, closeLabel, onClose, actions, testId, children }) {
			const panelRef = (0, react.useRef)(null);
			(0, react.useEffect)(() => {
				const onKeyDown = (event) => {
					if (event.key !== "Escape") return;
					event.stopPropagation();
					onClose();
				};
				document.addEventListener("keydown", onKeyDown, true);
				return () => {
					document.removeEventListener("keydown", onKeyDown, true);
				};
			}, [onClose]);
			(0, react.useEffect)(() => {
				panelRef.current?.focus();
			}, []);
			return (0, react_jsx_runtime.jsx)("div", {
				className: OverlayShell_module_css_default.backdrop,
				"data-testid": testId,
				onMouseDown: (event) => {
					if (event.target === event.currentTarget) onClose();
				},
				children: (0, react_jsx_runtime.jsxs)("div", {
					className: OverlayShell_module_css_default.panel,
					ref: panelRef,
					role: "dialog",
					"aria-modal": "true",
					"aria-label": title,
					tabIndex: -1,
					children: [(0, react_jsx_runtime.jsxs)("header", {
						className: OverlayShell_module_css_default.header,
						children: [
							(0, react_jsx_runtime.jsx)("h2", {
								className: OverlayShell_module_css_default.title,
								children: title
							}),
							(0, react_jsx_runtime.jsx)("div", {
								className: OverlayShell_module_css_default.actions,
								children: actions
							}),
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: OverlayShell_module_css_default.close,
								"aria-label": closeLabel,
								"data-testid": "overlay-close",
								onClick: onClose,
								children: "✕"
							})
						]
					}), (0, react_jsx_runtime.jsx)("div", {
						className: OverlayShell_module_css_default.body,
						children
					})]
				})
			});
		}
		//#endregion
		//#region \0dsh-css:D:\Documents\Dev-Repo\deepseek-harness\dsh-plugins\dsh-web-enhanced\src\client\board\TaskCard.module.css.mjs
		const css$8 = ".Nl19Xa_card{background:#8080a014;border:1px solid #80808042;border-radius:7px;flex-direction:column;gap:6px;padding:9px 10px;display:flex}.Nl19Xa_card[data-status=running]{border-color:#6a8fd899}.Nl19Xa_card[data-status=failed]{border-color:#d9534f8c}.Nl19Xa_title{margin:0;font-size:13px;font-weight:600}.Nl19Xa_prompt{opacity:.8;-webkit-line-clamp:3;-webkit-box-orient:vertical;margin:0;font-size:12px;line-height:1.45;display:-webkit-box;overflow:hidden}.Nl19Xa_meta{opacity:.65;flex-direction:column;gap:2px;margin:0;font-size:10px;display:flex}.Nl19Xa_metaRow{font-variant-numeric:tabular-nums}.Nl19Xa_result,.Nl19Xa_resultError{-webkit-line-clamp:4;background:#8080a029;border-radius:4px;-webkit-box-orient:vertical;margin:0;padding:4px 6px;font-size:11px;line-height:1.4;display:-webkit-box;overflow:hidden}.Nl19Xa_resultError{color:#d9534f;background:#d9534f2e}.Nl19Xa_actions{flex-wrap:wrap;gap:5px;display:flex}.Nl19Xa_primary,.Nl19Xa_action,.Nl19Xa_danger{color:inherit;cursor:pointer;background:0 0;border:1px solid #8080804d;border-radius:4px;padding:2px 8px;font-size:11px}.Nl19Xa_primary{background:#6a8fd838;border-color:#6a8fd8a6}.Nl19Xa_danger{color:#d9534f;border-color:#d9534f73}.Nl19Xa_field{flex-direction:column;gap:3px;display:flex}.Nl19Xa_fieldLabel{opacity:.7;font-size:10px}.Nl19Xa_input,.Nl19Xa_textarea{color:inherit;background:0 0;border:1px solid #80808052;border-radius:4px;padding:4px 6px;font-family:inherit;font-size:12px}.Nl19Xa_textarea{resize:vertical}.Nl19Xa_hint{opacity:.6;font-size:10px}";
		const tagId$8 = "dsh-web-enhanced/TaskCard.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$8) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId$8;
			tag.textContent = css$8;
			document.head.appendChild(tag);
		}
		var TaskCard_module_css_default = {
			"action": "Nl19Xa_action",
			"actions": "Nl19Xa_actions",
			"card": "Nl19Xa_card",
			"danger": "Nl19Xa_danger",
			"field": "Nl19Xa_field",
			"fieldLabel": "Nl19Xa_fieldLabel",
			"hint": "Nl19Xa_hint",
			"input": "Nl19Xa_input",
			"meta": "Nl19Xa_meta",
			"metaRow": "Nl19Xa_metaRow",
			"primary": "Nl19Xa_primary",
			"prompt": "Nl19Xa_prompt",
			"result": "Nl19Xa_result",
			"resultError": "Nl19Xa_resultError",
			"textarea": "Nl19Xa_textarea",
			"title": "Nl19Xa_title"
		};
		//#endregion
		//#region lib/types/client/board/TaskCard.js
		/**
		* One task card on the board. Owns its own edit form, so opening an editor on
		* one card cannot disturb the others, and reports every mutation upward — the
		* board owns the task list and the refresh cadence.
		* @module dsh-web-enhanced/src/client/board/TaskCard
		*/
		/** Local timestamp text, or an em dash when the instant is absent. */
		function timeOf(at) {
			return at === null ? "—" : new Date(at).toLocaleString();
		}
		/** One task card: summary, schedule, outcome, and the actions for its column. */
		function TaskCard({ task, workspaces, t, onRun, onOpen, onRemove, onUpdate }) {
			const [editing, setEditing] = (0, react.useState)(false);
			const [title, setTitle] = (0, react.useState)(task.title);
			const [prompt, setPrompt] = (0, react.useState)(task.prompt);
			const [cron, setCron] = (0, react.useState)(task.cron ?? "");
			const [workspaceId, setWorkspaceId] = (0, react.useState)(task.workspaceId ?? "");
			const running = task.status === "running";
			const submit = () => {
				onUpdate({
					id: task.id,
					title,
					prompt,
					cron: cron.trim() === "" ? null : cron.trim(),
					workspaceId: workspaceId === "" ? null : workspaceId
				});
				setEditing(false);
			};
			if (editing) return (0, react_jsx_runtime.jsxs)("li", {
				className: TaskCard_module_css_default.card,
				"data-testid": "task-card-editing",
				children: [
					(0, react_jsx_runtime.jsxs)("label", {
						className: TaskCard_module_css_default.field,
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: TaskCard_module_css_default.fieldLabel,
							children: t("board.form.title")
						}), (0, react_jsx_runtime.jsx)("input", {
							className: TaskCard_module_css_default.input,
							value: title,
							onChange: (event) => {
								setTitle(event.target.value);
							}
						})]
					}),
					(0, react_jsx_runtime.jsxs)("label", {
						className: TaskCard_module_css_default.field,
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: TaskCard_module_css_default.fieldLabel,
							children: t("board.form.prompt")
						}), (0, react_jsx_runtime.jsx)("textarea", {
							className: TaskCard_module_css_default.textarea,
							value: prompt,
							rows: 3,
							onChange: (event) => {
								setPrompt(event.target.value);
							}
						})]
					}),
					(0, react_jsx_runtime.jsxs)("label", {
						className: TaskCard_module_css_default.field,
						children: [
							(0, react_jsx_runtime.jsx)("span", {
								className: TaskCard_module_css_default.fieldLabel,
								children: t("board.form.cron")
							}),
							(0, react_jsx_runtime.jsx)("input", {
								className: TaskCard_module_css_default.input,
								value: cron,
								placeholder: t("board.form.cronPlaceholder"),
								onChange: (event) => {
									setCron(event.target.value);
								}
							}),
							(0, react_jsx_runtime.jsx)("span", {
								className: TaskCard_module_css_default.hint,
								children: t("board.form.cronHint")
							})
						]
					}),
					(0, react_jsx_runtime.jsxs)("label", {
						className: TaskCard_module_css_default.field,
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: TaskCard_module_css_default.fieldLabel,
							children: t("board.form.workspace")
						}), (0, react_jsx_runtime.jsxs)("select", {
							className: TaskCard_module_css_default.input,
							value: workspaceId,
							onChange: (event) => {
								setWorkspaceId(event.target.value);
							},
							children: [(0, react_jsx_runtime.jsx)("option", {
								value: "",
								children: t("board.form.workspaceNone")
							}), workspaces.map((workspace) => (0, react_jsx_runtime.jsx)("option", {
								value: workspace.workspaceId,
								children: workspace.title
							}, workspace.workspaceId))]
						})]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: TaskCard_module_css_default.actions,
						children: [(0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: TaskCard_module_css_default.primary,
							onClick: submit,
							children: t("board.action.save")
						}), (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: TaskCard_module_css_default.action,
							onClick: () => {
								setEditing(false);
							},
							children: t("board.form.cancel")
						})]
					})
				]
			});
			return (0, react_jsx_runtime.jsxs)("li", {
				className: TaskCard_module_css_default.card,
				"data-testid": "task-card",
				"data-status": task.status,
				children: [
					(0, react_jsx_runtime.jsx)("h4", {
						className: TaskCard_module_css_default.title,
						children: task.title
					}),
					(0, react_jsx_runtime.jsx)("p", {
						className: TaskCard_module_css_default.prompt,
						children: task.prompt
					}),
					(0, react_jsx_runtime.jsxs)("dl", {
						className: TaskCard_module_css_default.meta,
						children: [
							task.cron !== null && (0, react_jsx_runtime.jsx)("div", {
								className: TaskCard_module_css_default.metaRow,
								children: t("board.meta.cron", { cron: task.cron })
							}),
							task.nextRunAt !== null && (0, react_jsx_runtime.jsx)("div", {
								className: TaskCard_module_css_default.metaRow,
								children: t("board.meta.nextRun", { time: timeOf(task.nextRunAt) })
							}),
							(0, react_jsx_runtime.jsx)("div", {
								className: TaskCard_module_css_default.metaRow,
								children: task.lastRunAt === null ? t("board.meta.noSession") : t("board.meta.lastRun", { time: timeOf(task.lastRunAt) })
							})
						]
					}),
					task.result !== null && (0, react_jsx_runtime.jsx)("p", {
						className: task.result.errorMessage === void 0 ? TaskCard_module_css_default.result : TaskCard_module_css_default.resultError,
						children: task.result.errorMessage === void 0 ? `${t("board.result.summary")}: ${task.result.summary ?? "—"}` : t("board.result.error", { message: task.result.errorMessage })
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: TaskCard_module_css_default.actions,
						children: [
							!running && (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: TaskCard_module_css_default.primary,
								"data-testid": "task-run",
								onClick: () => {
									onRun(task);
								},
								children: t("board.action.run")
							}),
							task.sessionId !== null && (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: TaskCard_module_css_default.action,
								"data-testid": "task-open-session",
								onClick: () => {
									onOpen(task.sessionId);
								},
								children: t("board.action.open")
							}),
							!running && (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
								task.status === "planned" && (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: TaskCard_module_css_default.action,
									onClick: () => {
										onUpdate({
											id: task.id,
											status: "todo"
										});
									},
									children: t("board.action.toTodo")
								}),
								task.status === "todo" && (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: TaskCard_module_css_default.action,
									onClick: () => {
										onUpdate({
											id: task.id,
											status: "planned"
										});
									},
									children: t("board.action.toPlanned")
								}),
								(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: TaskCard_module_css_default.action,
									onClick: () => {
										setEditing(true);
									},
									children: t("board.action.edit")
								}),
								(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: TaskCard_module_css_default.danger,
									"data-testid": "task-remove",
									onClick: () => {
										onRemove(task);
									},
									children: t("board.action.remove")
								})
							] })
						]
					})
				]
			});
		}
		//#endregion
		//#region \0dsh-css:D:\Documents\Dev-Repo\deepseek-harness\dsh-plugins\dsh-web-enhanced\src\client\board\BoardOverlay.module.css.mjs
		const css$7 = ".tNcfJa_action,.tNcfJa_primary{color:inherit;cursor:pointer;background:0 0;border:1px solid #8080804d;border-radius:4px;padding:3px 10px;font-size:12px}.tNcfJa_primary{background:#6a8fd838;border-color:#6a8fd8a6}.tNcfJa_primary:disabled{cursor:default;opacity:.45}.tNcfJa_error{color:#d9534f;background:#d9534f29;border-radius:5px;margin:0 0 10px;padding:6px 9px;font-size:12px}.tNcfJa_form{border:1px solid #80808042;border-radius:7px;gap:8px;margin-bottom:12px;padding:10px 12px;display:grid}.tNcfJa_field{flex-direction:column;gap:3px;display:flex}.tNcfJa_fieldLabel{opacity:.72;font-size:11px}.tNcfJa_input,.tNcfJa_textarea{color:inherit;background:0 0;border:1px solid #80808052;border-radius:4px;padding:4px 7px;font-family:inherit;font-size:12px}.tNcfJa_textarea{resize:vertical}.tNcfJa_hint{opacity:.6;font-size:10px}.tNcfJa_formActions{gap:6px;display:flex}.tNcfJa_columns{grid-auto-columns:minmax(230px,1fr);grid-auto-flow:column;align-items:start;gap:10px;display:grid;overflow-x:auto}.tNcfJa_column{flex-direction:column;gap:8px;min-width:0;display:flex}.tNcfJa_columnTitle{opacity:.78;text-transform:uppercase;align-items:center;gap:6px;margin:0;font-size:11px;font-weight:600;display:flex}.tNcfJa_count{background:#8080a03d;border-radius:8px;padding:0 6px;font-size:10px}.tNcfJa_cards{flex-direction:column;gap:8px;margin:0;padding:0;list-style:none;display:flex}.tNcfJa_empty{opacity:.55;margin:0;font-size:11px}";
		const tagId$7 = "dsh-web-enhanced/BoardOverlay.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$7) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId$7;
			tag.textContent = css$7;
			document.head.appendChild(tag);
		}
		var BoardOverlay_module_css_default = {
			"action": "tNcfJa_action",
			"cards": "tNcfJa_cards",
			"column": "tNcfJa_column",
			"columnTitle": "tNcfJa_columnTitle",
			"columns": "tNcfJa_columns",
			"count": "tNcfJa_count",
			"empty": "tNcfJa_empty",
			"error": "tNcfJa_error",
			"field": "tNcfJa_field",
			"fieldLabel": "tNcfJa_fieldLabel",
			"form": "tNcfJa_form",
			"formActions": "tNcfJa_formActions",
			"hint": "tNcfJa_hint",
			"input": "tNcfJa_input",
			"primary": "tNcfJa_primary",
			"textarea": "tNcfJa_textarea"
		};
		//#endregion
		//#region lib/types/client/board/BoardOverlay.js
		/**
		* Task board overlay: the five status columns, the create form, and the
		* refresh cadence. Registered into `shell.overlay`; the sidebar entry only
		* flips the shared overlay state.
		*
		* A running task settles on the host (the agent session finishes and the
		* record is written back), so the board polls WHILE it shows a running task
		* and stops as soon as none is left — the status change has no push channel
		* to this plugin, and a permanent timer would poll an idle board forever.
		* @module dsh-web-enhanced/src/client/board/BoardOverlay
		*/
		/** Poll interval while at least one task is running, in milliseconds. */
		const RUNNING_POLL_MS = 2e3;
		/** The five columns, left to right, with their dictionary keys. */
		const COLUMNS = [
			{
				status: "planned",
				key: "board.column.planned"
			},
			{
				status: "todo",
				key: "board.column.todo"
			},
			{
				status: "running",
				key: "board.column.running"
			},
			{
				status: "done",
				key: "board.column.done"
			},
			{
				status: "failed",
				key: "board.column.failed"
			}
		];
		/** The task board overlay. */
		function BoardOverlay({ useOverlay, useWorkspaces, remote, openSession, closeOverlay, t }) {
			const open = useOverlay((state) => state.open === "board");
			const workspaces = useWorkspaces((state) => state.items);
			const [tasks, setTasks] = (0, react.useState)([]);
			const [error, setError] = (0, react.useState)(null);
			const [creating, setCreating] = (0, react.useState)(false);
			const live = (0, react.useRef)(true);
			(0, react.useEffect)(() => () => {
				live.current = false;
			}, []);
			const reload = (0, react.useCallback)(async () => {
				const result = await remote.taskList();
				if (!live.current) return;
				if ("error" in result) {
					setError(result.error.message);
					return;
				}
				setError(null);
				setTasks(result.tasks);
			}, [remote]);
			(0, react.useEffect)(() => {
				if (open) reload();
			}, [open, reload]);
			const anyRunning = tasks.some((task) => task.status === "running");
			(0, react.useEffect)(() => {
				if (!open || !anyRunning) return;
				const timer = setInterval(() => {
					reload();
				}, RUNNING_POLL_MS);
				return () => {
					clearInterval(timer);
				};
			}, [
				anyRunning,
				open,
				reload
			]);
			/** Run one host mutation and refresh; failures land in the banner. */
			const mutate = (0, react.useCallback)(async (call) => {
				const result = await call;
				if (!live.current) return;
				const message = errorMessageOf(result);
				if (message !== void 0) {
					setError(message);
					return;
				}
				await reload();
			}, [reload]);
			if (!open) return null;
			return (0, react_jsx_runtime.jsxs)(OverlayShell, {
				title: t("board.title"),
				closeLabel: t("board.close"),
				onClose: closeOverlay,
				testId: "board-overlay",
				actions: (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: BoardOverlay_module_css_default.action,
					"data-testid": "board-create-toggle",
					onClick: () => {
						setCreating((value) => !value);
					},
					children: t("board.create")
				}),
				children: [
					error !== null && (0, react_jsx_runtime.jsx)("p", {
						className: BoardOverlay_module_css_default.error,
						"data-testid": "board-error",
						children: t("board.error", { message: error })
					}),
					creating && (0, react_jsx_runtime.jsx)(CreateForm, {
						workspaces,
						t,
						onCancel: () => {
							setCreating(false);
						},
						onCreate: (request) => {
							setCreating(false);
							mutate(remote.taskCreate(request));
						}
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: BoardOverlay_module_css_default.columns,
						"data-testid": "board-columns",
						children: COLUMNS.map((column) => {
							const items = tasks.filter((task) => task.status === column.status);
							return (0, react_jsx_runtime.jsxs)("section", {
								className: BoardOverlay_module_css_default.column,
								"data-column": column.status,
								children: [(0, react_jsx_runtime.jsxs)("h3", {
									className: BoardOverlay_module_css_default.columnTitle,
									children: [t(column.key), (0, react_jsx_runtime.jsx)("span", {
										className: BoardOverlay_module_css_default.count,
										children: items.length
									})]
								}), items.length === 0 ? (0, react_jsx_runtime.jsx)("p", {
									className: BoardOverlay_module_css_default.empty,
									children: t("board.empty")
								}) : (0, react_jsx_runtime.jsx)("ul", {
									className: BoardOverlay_module_css_default.cards,
									children: items.map((task) => (0, react_jsx_runtime.jsx)(TaskCard, {
										task,
										workspaces,
										t,
										onRun: (target) => {
											mutate(remote.taskRun({ id: target.id }));
										},
										onOpen: openSession,
										onRemove: (target) => {
											mutate(remote.taskRemove({ id: target.id }));
										},
										onUpdate: (request) => {
											mutate(remote.taskUpdate(request));
										}
									}, task.id))
								})]
							}, column.status);
						})
					})
				]
			});
		}
		/** Inline create form: title, prompt, optional cron, optional project. */
		function CreateForm({ workspaces, t, onCancel, onCreate }) {
			const [title, setTitle] = (0, react.useState)("");
			const [prompt, setPrompt] = (0, react.useState)("");
			const [cron, setCron] = (0, react.useState)("");
			const [workspaceId, setWorkspaceId] = (0, react.useState)("");
			const ready = title.trim() !== "" && prompt.trim() !== "";
			return (0, react_jsx_runtime.jsxs)("form", {
				className: BoardOverlay_module_css_default.form,
				"data-testid": "board-create-form",
				onSubmit: (event) => {
					event.preventDefault();
					if (!ready) return;
					const trimmedCron = cron.trim();
					onCreate({
						title,
						prompt,
						...trimmedCron === "" ? {} : { cron: trimmedCron },
						...workspaceId === "" ? {} : { workspaceId }
					});
				},
				children: [
					(0, react_jsx_runtime.jsxs)("label", {
						className: BoardOverlay_module_css_default.field,
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: BoardOverlay_module_css_default.fieldLabel,
							children: t("board.form.title")
						}), (0, react_jsx_runtime.jsx)("input", {
							className: BoardOverlay_module_css_default.input,
							value: title,
							placeholder: t("board.form.titlePlaceholder"),
							"data-testid": "board-form-title",
							onChange: (event) => {
								setTitle(event.target.value);
							}
						})]
					}),
					(0, react_jsx_runtime.jsxs)("label", {
						className: BoardOverlay_module_css_default.field,
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: BoardOverlay_module_css_default.fieldLabel,
							children: t("board.form.prompt")
						}), (0, react_jsx_runtime.jsx)("textarea", {
							className: BoardOverlay_module_css_default.textarea,
							value: prompt,
							rows: 3,
							placeholder: t("board.form.promptPlaceholder"),
							"data-testid": "board-form-prompt",
							onChange: (event) => {
								setPrompt(event.target.value);
							}
						})]
					}),
					(0, react_jsx_runtime.jsxs)("label", {
						className: BoardOverlay_module_css_default.field,
						children: [
							(0, react_jsx_runtime.jsx)("span", {
								className: BoardOverlay_module_css_default.fieldLabel,
								children: t("board.form.cron")
							}),
							(0, react_jsx_runtime.jsx)("input", {
								className: BoardOverlay_module_css_default.input,
								value: cron,
								placeholder: t("board.form.cronPlaceholder"),
								"data-testid": "board-form-cron",
								onChange: (event) => {
									setCron(event.target.value);
								}
							}),
							(0, react_jsx_runtime.jsx)("span", {
								className: BoardOverlay_module_css_default.hint,
								children: t("board.form.cronHint")
							})
						]
					}),
					(0, react_jsx_runtime.jsxs)("label", {
						className: BoardOverlay_module_css_default.field,
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: BoardOverlay_module_css_default.fieldLabel,
							children: t("board.form.workspace")
						}), (0, react_jsx_runtime.jsxs)("select", {
							className: BoardOverlay_module_css_default.input,
							value: workspaceId,
							onChange: (event) => {
								setWorkspaceId(event.target.value);
							},
							children: [(0, react_jsx_runtime.jsx)("option", {
								value: "",
								children: t("board.form.workspaceNone")
							}), workspaces.map((workspace) => (0, react_jsx_runtime.jsx)("option", {
								value: workspace.workspaceId,
								children: workspace.title
							}, workspace.workspaceId))]
						})]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: BoardOverlay_module_css_default.formActions,
						children: [(0, react_jsx_runtime.jsx)("button", {
							type: "submit",
							className: BoardOverlay_module_css_default.primary,
							disabled: !ready,
							"data-testid": "board-form-submit",
							children: t("board.form.submit")
						}), (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: BoardOverlay_module_css_default.action,
							onClick: onCancel,
							children: t("board.form.cancel")
						})]
					})
				]
			});
		}
		//#endregion
		//#region \0dsh-css:D:\Documents\Dev-Repo\deepseek-harness\dsh-plugins\dsh-web-enhanced\src\client\git\BranchStrip.module.css.mjs
		const css$6 = "._8I-SYq_strip{box-sizing:border-box;width:calc(100% - var(--dsh-composer-side-clearance) * 2);max-width:var(--dsh-composer-card-max-width);color:var(--dsw-alias-label-secondary,inherit);flex:none;align-items:center;gap:8px;margin:0 auto;padding:2px 8px;font-size:11px;display:flex}._8I-SYq_label{opacity:.7;flex:none}._8I-SYq_select{border:1px solid var(--dsw-alias-border-l1,#80808052);color:inherit;background:0 0;border-radius:4px;max-width:220px;padding:1px 5px;font-size:11px}._8I-SYq_message{color:#d9534f;text-overflow:ellipsis;white-space:nowrap;overflow:hidden}";
		const tagId$6 = "dsh-web-enhanced/BranchStrip.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$6) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId$6;
			tag.textContent = css$6;
			document.head.appendChild(tag);
		}
		var BranchStrip_module_css_default = {
			"label": "_8I-SYq_label",
			"message": "_8I-SYq_message",
			"select": "_8I-SYq_select",
			"strip": "_8I-SYq_strip"
		};
		//#endregion
		//#region lib/types/client/git/BranchStrip.js
		/**
		* Branch strip above the composer: the current branch, a switcher over the
		* local branches, and the entry to the commit graph. Rendered only for a
		* session whose workspace is a git repository — an unrelated project should
		* not grow a dead control.
		* @module dsh-web-enhanced/src/client/git/BranchStrip
		*/
		/** The branch strip: current branch and the switcher. */
		function BranchStrip({ useSessions, useWorkspaces, remote, t }) {
			const workspaceId = workspaceOfSession(useSessions((state) => state), useWorkspaces((state) => state))?.workspaceId;
			const [branches, setBranches] = (0, react.useState)({ phase: "loading" });
			const [switching, setSwitching] = (0, react.useState)(false);
			const [message, setMessage] = (0, react.useState)(null);
			const live = (0, react.useRef)(true);
			(0, react.useEffect)(() => () => {
				live.current = false;
			}, []);
			const load = (0, react.useCallback)(async () => {
				if (workspaceId === void 0) return;
				const result = await remote.gitBranches({ workspaceId });
				if (!live.current) return;
				setBranches("error" in result ? { phase: "error" } : {
					phase: "ready",
					items: result.branches
				});
			}, [remote, workspaceId]);
			(0, react.useEffect)(() => {
				setBranches({ phase: "loading" });
				load();
			}, [load]);
			const switchTo = (0, react.useCallback)(async (branch) => {
				if (workspaceId === void 0) return;
				setSwitching(true);
				setMessage(null);
				try {
					const result = await remote.gitCheckout({
						workspaceId,
						branch
					});
					if (!live.current) return;
					if ("error" in result) {
						setMessage(result.error.message);
						return;
					}
					if (!result.ok) {
						setMessage(result.message ?? null);
						return;
					}
					await load();
				} finally {
					if (live.current) setSwitching(false);
				}
			}, [
				load,
				remote,
				workspaceId
			]);
			if (workspaceId === void 0) return null;
			if (branches.phase === "error") return null;
			if (branches.phase === "loading") return (0, react_jsx_runtime.jsx)("div", {
				className: BranchStrip_module_css_default.strip,
				"data-testid": "branch-strip-loading",
				children: t("branch.loading")
			});
			if (branches.items.length === 0) return null;
			const current = branches.items.find((branch) => branch.current)?.name ?? "";
			return (0, react_jsx_runtime.jsxs)("div", {
				className: BranchStrip_module_css_default.strip,
				"data-testid": "branch-strip",
				children: [
					(0, react_jsx_runtime.jsx)("span", {
						className: BranchStrip_module_css_default.label,
						children: t("branch.label")
					}),
					(0, react_jsx_runtime.jsx)("select", {
						className: BranchStrip_module_css_default.select,
						value: current,
						disabled: switching,
						"data-testid": "branch-select",
						"aria-label": t("branch.label"),
						onChange: (event) => {
							switchTo(event.target.value);
						},
						children: branches.items.map((branch) => (0, react_jsx_runtime.jsx)("option", {
							value: branch.name,
							children: branch.name
						}, branch.name))
					}),
					message !== null && (0, react_jsx_runtime.jsx)("span", {
						className: BranchStrip_module_css_default.message,
						"data-testid": "branch-message",
						children: message
					})
				]
			});
		}
		//#endregion
		//#region lib/types/client/git/lanes.js
		/**
		* Commit lane assignment for the git graph. Pure: commits in, rows with lane
		* indices and edges out — no DOM, no host calls, so the layout is testable on
		* its own.
		*
		* The algorithm is the usual one-pass railway walk over a newest-first commit
		* list. A lane is a column that currently EXPECTS a specific commit hash. For
		* each commit: take the leftmost lane expecting it (or open a fresh lane when
		* none does, which is how a tip enters); that lane then expects the commit's
		* first parent, and every additional parent opens or reuses another lane. A
		* lane whose expectation is satisfied by nothing further goes idle and is
		* reused by the next tip, which keeps the graph narrow instead of growing a
		* column per branch ever seen.
		* @module dsh-web-enhanced/src/client/git/lanes
		*/
		/**
		* Lay commits out on lanes.
		* @param commits - commits newest first, as `git log --date-order` returns them.
		* @returns rows in input order plus the column count.
		*/
		function layoutLanes(commits) {
			const lanes = [];
			const rows = [];
			let width = 0;
			/** Leftmost lane expecting `hash`, or -1. */
			const laneExpecting = (hash) => lanes.indexOf(hash);
			/** Leftmost idle lane, opening a new column when all are busy. */
			const takeIdleLane = () => {
				const idle = lanes.indexOf(void 0);
				if (idle !== -1) return idle;
				lanes.push(void 0);
				return lanes.length - 1;
			};
			for (const commit of commits) {
				let lane = laneExpecting(commit.hash);
				if (lane === -1) lane = takeIdleLane();
				for (let index = 0; index < lanes.length; index++) if (index !== lane && lanes[index] === commit.hash) lanes[index] = void 0;
				const parentLanes = [];
				const [first, ...rest] = commit.parents;
				if (first === void 0) lanes[lane] = void 0;
				else {
					const existing = laneExpecting(first);
					if (existing === -1 || existing === lane) {
						lanes[lane] = first;
						parentLanes.push(lane);
					} else {
						lanes[lane] = void 0;
						parentLanes.push(existing);
					}
				}
				for (const parent of rest) {
					const existing = laneExpecting(parent);
					if (existing !== -1) {
						parentLanes.push(existing);
						continue;
					}
					const fresh = takeIdleLane();
					lanes[fresh] = parent;
					parentLanes.push(fresh);
				}
				const through = [];
				for (let index = 0; index < lanes.length; index++) if (lanes[index] !== void 0) through.push(index);
				width = Math.max(width, lanes.length);
				rows.push({
					commit,
					lane,
					through,
					parentLanes
				});
			}
			return {
				rows,
				width: Math.max(width, rows.length === 0 ? 0 : 1)
			};
		}
		/** Stable colour index of a lane (the renderer maps it onto its palette). */
		function laneColor(lane, paletteSize) {
			return paletteSize <= 0 ? 0 : lane % paletteSize;
		}
		/**
		* Short display form of a commit hash.
		* @param hash - full hash.
		* @returns the first seven characters.
		*/
		function shortHash(hash) {
			return hash.slice(0, 7);
		}
		//#endregion
		//#region \0dsh-css:D:\Documents\Dev-Repo\deepseek-harness\dsh-plugins\dsh-web-enhanced\src\client\git\GraphOverlay.module.css.mjs
		const css$5 = ".H0OCzq_action{color:inherit;cursor:pointer;background:0 0;border:1px solid #8080804d;border-radius:4px;padding:3px 10px;font-size:12px}.H0OCzq_filter{align-items:center;gap:6px;font-size:12px;display:flex}.H0OCzq_filterLabel{opacity:.7}.H0OCzq_select{color:inherit;background:0 0;border:1px solid #8080804d;border-radius:4px;max-width:180px;padding:2px 6px;font-size:12px}.H0OCzq_rows{margin:0;padding:0;list-style:none}.H0OCzq_entry{border-bottom:1px solid #8080801f}.H0OCzq_row{width:100%;height:34px;color:inherit;cursor:pointer;font:inherit;text-align:start;background:0 0;border:0;align-items:center;gap:8px;padding:0;font-size:12px;display:flex}.H0OCzq_row:hover{background:#8080a01f}.H0OCzq_rail{flex:none}.H0OCzq_edge{stroke-width:1.6px;fill:none}.H0OCzq_dot{stroke:var(--dsh-surface,Canvas);stroke-width:1.5px}.H0OCzq_edge[data-lane=\"0\"]{stroke:#6a8fd8}.H0OCzq_edge[data-lane=\"1\"]{stroke:#4caf72}.H0OCzq_edge[data-lane=\"2\"]{stroke:#d9a441}.H0OCzq_edge[data-lane=\"3\"]{stroke:#b978d1}.H0OCzq_edge[data-lane=\"4\"]{stroke:#48b3c2}.H0OCzq_edge[data-lane=\"5\"]{stroke:#d9534f}.H0OCzq_dot[data-lane=\"0\"]{fill:#6a8fd8}.H0OCzq_dot[data-lane=\"1\"]{fill:#4caf72}.H0OCzq_dot[data-lane=\"2\"]{fill:#d9a441}.H0OCzq_dot[data-lane=\"3\"]{fill:#b978d1}.H0OCzq_dot[data-lane=\"4\"]{fill:#48b3c2}.H0OCzq_dot[data-lane=\"5\"]{fill:#d9534f}.H0OCzq_hash{opacity:.7;flex:none;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px}.H0OCzq_subject{text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;overflow:hidden}.H0OCzq_ref{background:#6a8fd840;border-radius:8px;flex:none;padding:1px 7px;font-size:10px}.H0OCzq_author,.H0OCzq_date{opacity:.6;flex:none;font-size:10px}.H0OCzq_empty,.H0OCzq_error{opacity:.7;margin:12px 0;font-size:12px}.H0OCzq_error{color:#d9534f;opacity:1}.H0OCzq_detail{border-inline-start:2px solid #6a8fd873;margin:0 0 8px 24px;padding:6px 0 6px 10px;font-size:12px}.H0OCzq_facts{grid-template-columns:max-content 1fr;gap:2px 10px;margin:0;display:grid}.H0OCzq_facts dt{opacity:.6}.H0OCzq_facts dd{overflow-wrap:anywhere;margin:0}.H0OCzq_mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px}.H0OCzq_body{white-space:pre-wrap;background:#8080a01f;border-radius:4px;margin:8px 0 0;padding:6px 8px;font-size:11px}.H0OCzq_filesTitle{opacity:.6;margin:8px 0 4px}.H0OCzq_files{margin:0;padding:0;list-style:none}.H0OCzq_file{align-items:center;gap:8px;display:flex}.H0OCzq_filePath{text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px;overflow:hidden}.H0OCzq_added,.H0OCzq_removed{text-align:end;flex:none;min-width:42px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px}.H0OCzq_added{color:#4caf72}.H0OCzq_removed{color:#d9534f}";
		const tagId$5 = "dsh-web-enhanced/GraphOverlay.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$5) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId$5;
			tag.textContent = css$5;
			document.head.appendChild(tag);
		}
		var GraphOverlay_module_css_default = {
			"action": "H0OCzq_action",
			"added": "H0OCzq_added",
			"author": "H0OCzq_author",
			"body": "H0OCzq_body",
			"date": "H0OCzq_date",
			"detail": "H0OCzq_detail",
			"dot": "H0OCzq_dot",
			"edge": "H0OCzq_edge",
			"empty": "H0OCzq_empty",
			"entry": "H0OCzq_entry",
			"error": "H0OCzq_error",
			"facts": "H0OCzq_facts",
			"file": "H0OCzq_file",
			"filePath": "H0OCzq_filePath",
			"files": "H0OCzq_files",
			"filesTitle": "H0OCzq_filesTitle",
			"filter": "H0OCzq_filter",
			"filterLabel": "H0OCzq_filterLabel",
			"hash": "H0OCzq_hash",
			"mono": "H0OCzq_mono",
			"rail": "H0OCzq_rail",
			"ref": "H0OCzq_ref",
			"removed": "H0OCzq_removed",
			"row": "H0OCzq_row",
			"rows": "H0OCzq_rows",
			"select": "H0OCzq_select",
			"subject": "H0OCzq_subject"
		};
		//#endregion
		//#region lib/types/client/git/GraphOverlay.js
		/**
		* Git graph overlay: branch lanes and commit history for the current
		* session's workspace. Registered into `shell.overlay` and rendered only
		* while the overlay state selects it, so an unopened graph costs one
		* subscription and nothing else.
		*
		* The branch selector here is the GRAPH's own filter: it decides which
		* history the lanes are drawn from and changes nothing in the repository.
		* The composer's branch strip is the other operation — it checks a branch
		* out. Two controls because they are two different questions.
		* @module dsh-web-enhanced/src/client/git/GraphOverlay
		*/
		/** Horizontal distance between lanes, in CSS pixels. */
		const LANE_STEP = 16;
		/** Row height, in CSS pixels; must match `.row` in the stylesheet. */
		const ROW_HEIGHT = 34;
		/** Number of lane colours the stylesheet defines. */
		const PALETTE_SIZE = 6;
		/** The filter value meaning "every ref", distinct from any branch name. */
		const ALL_BRANCHES = "";
		/** The git graph overlay. */
		function GraphOverlay({ useOverlay, useSessions, useWorkspaces, remote, closeOverlay, t }) {
			const open = useOverlay((state) => state.open === "graph");
			const workspaceId = workspaceOfSession(useSessions((state) => state), useWorkspaces((state) => state))?.workspaceId;
			const [commits, setCommits] = (0, react.useState)({ phase: "loading" });
			const [branches, setBranches] = (0, react.useState)([]);
			const [branch, setBranch] = (0, react.useState)(ALL_BRANCHES);
			const [expanded, setExpanded] = (0, react.useState)(null);
			const live = (0, react.useRef)(true);
			(0, react.useEffect)(() => () => {
				live.current = false;
			}, []);
			const load = (0, react.useCallback)(async () => {
				if (workspaceId === void 0) return;
				setCommits({ phase: "loading" });
				const result = await remote.gitLog({
					workspaceId,
					...branch === ALL_BRANCHES ? {} : { branch }
				});
				if (!live.current) return;
				setCommits("error" in result ? {
					phase: "error",
					message: result.error.message
				} : {
					phase: "ready",
					items: result.commits
				});
			}, [
				branch,
				remote,
				workspaceId
			]);
			(0, react.useEffect)(() => {
				if (!open || workspaceId === void 0) return;
				(async () => {
					const result = await remote.gitBranches({ workspaceId });
					if (live.current && !("error" in result)) setBranches(result.branches);
				})();
			}, [
				open,
				remote,
				workspaceId
			]);
			(0, react.useEffect)(() => {
				if (open) load();
			}, [load, open]);
			(0, react.useEffect)(() => {
				setExpanded(null);
			}, [branch]);
			if (!open) return null;
			return (0, react_jsx_runtime.jsx)(OverlayShell, {
				title: t("graph.title"),
				closeLabel: t("graph.close"),
				onClose: closeOverlay,
				testId: "graph-overlay",
				actions: workspaceId === void 0 ? null : (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsxs)("label", {
					className: GraphOverlay_module_css_default.filter,
					children: [(0, react_jsx_runtime.jsx)("span", {
						className: GraphOverlay_module_css_default.filterLabel,
						children: t("graph.filter")
					}), (0, react_jsx_runtime.jsxs)("select", {
						className: GraphOverlay_module_css_default.select,
						value: branch,
						"data-testid": "graph-branch-filter",
						onChange: (event) => {
							setBranch(event.target.value);
						},
						children: [(0, react_jsx_runtime.jsx)("option", {
							value: ALL_BRANCHES,
							children: t("graph.allBranches")
						}), branches.map((item) => (0, react_jsx_runtime.jsx)("option", {
							value: item.name,
							children: item.name
						}, item.name))]
					})]
				}), (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: GraphOverlay_module_css_default.action,
					onClick: () => {
						load();
					},
					children: t("graph.refresh")
				})] }),
				children: workspaceId === void 0 ? (0, react_jsx_runtime.jsx)("p", {
					className: GraphOverlay_module_css_default.empty,
					children: t("graph.noWorkspace")
				}) : commits.phase === "loading" ? (0, react_jsx_runtime.jsx)("p", {
					className: GraphOverlay_module_css_default.empty,
					children: t("graph.loading")
				}) : commits.phase === "error" ? (0, react_jsx_runtime.jsx)("p", {
					className: GraphOverlay_module_css_default.error,
					children: t("graph.error", { message: commits.message })
				}) : (0, react_jsx_runtime.jsx)(GraphBody, {
					commits: commits.items,
					empty: t("graph.empty"),
					expanded,
					workspaceId,
					remote,
					onToggle: (hash) => {
						setExpanded((current) => current === hash ? null : hash);
					},
					t
				})
			});
		}
		/** The laid-out commit list; the lane math itself lives in `./lanes.ts`. */
		function GraphBody({ commits, empty, expanded, workspaceId, remote, onToggle, t }) {
			if (commits.length === 0) return (0, react_jsx_runtime.jsx)("p", {
				className: GraphOverlay_module_css_default.empty,
				children: empty
			});
			const layout = layoutLanes(commits);
			const railWidth = (layout.width + 1) * LANE_STEP;
			return (0, react_jsx_runtime.jsx)("ol", {
				className: GraphOverlay_module_css_default.rows,
				"data-testid": "graph-rows",
				children: layout.rows.map((row) => (0, react_jsx_runtime.jsxs)("li", {
					className: GraphOverlay_module_css_default.entry,
					children: [(0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: GraphOverlay_module_css_default.row,
						"aria-expanded": expanded === row.commit.hash,
						"data-testid": "graph-row",
						onClick: () => {
							onToggle(row.commit.hash);
						},
						children: [
							(0, react_jsx_runtime.jsxs)("svg", {
								className: GraphOverlay_module_css_default.rail,
								width: railWidth,
								height: ROW_HEIGHT,
								"aria-hidden": true,
								children: [
									row.through.map((lane) => (0, react_jsx_runtime.jsx)("line", {
										className: GraphOverlay_module_css_default.edge,
										"data-lane": laneColor(lane, PALETTE_SIZE),
										x1: (lane + 1) * LANE_STEP,
										y1: 0,
										x2: (lane + 1) * LANE_STEP,
										y2: ROW_HEIGHT
									}, `through-${String(lane)}`)),
									row.parentLanes.map((lane) => (0, react_jsx_runtime.jsx)("line", {
										className: GraphOverlay_module_css_default.edge,
										"data-lane": laneColor(lane, PALETTE_SIZE),
										x1: (row.lane + 1) * LANE_STEP,
										y1: ROW_HEIGHT / 2,
										x2: (lane + 1) * LANE_STEP,
										y2: ROW_HEIGHT
									}, `parent-${String(lane)}`)),
									(0, react_jsx_runtime.jsx)("circle", {
										className: GraphOverlay_module_css_default.dot,
										"data-lane": laneColor(row.lane, PALETTE_SIZE),
										cx: (row.lane + 1) * LANE_STEP,
										cy: ROW_HEIGHT / 2,
										r: 4
									})
								]
							}),
							(0, react_jsx_runtime.jsx)("span", {
								className: GraphOverlay_module_css_default.hash,
								children: shortHash(row.commit.hash)
							}),
							(0, react_jsx_runtime.jsx)("span", {
								className: GraphOverlay_module_css_default.subject,
								title: row.commit.subject,
								children: row.commit.subject
							}),
							row.commit.refs.map((ref) => (0, react_jsx_runtime.jsx)("span", {
								className: GraphOverlay_module_css_default.ref,
								children: ref
							}, ref)),
							(0, react_jsx_runtime.jsx)("span", {
								className: GraphOverlay_module_css_default.author,
								children: row.commit.author
							}),
							(0, react_jsx_runtime.jsx)("time", {
								className: GraphOverlay_module_css_default.date,
								dateTime: (/* @__PURE__ */ new Date(row.commit.date * 1e3)).toISOString(),
								children: (/* @__PURE__ */ new Date(row.commit.date * 1e3)).toLocaleDateString()
							})
						]
					}), expanded === row.commit.hash && (0, react_jsx_runtime.jsx)(CommitDetail, {
						hash: row.commit.hash,
						workspaceId,
						remote,
						t
					})]
				}, row.commit.hash))
			});
		}
		/** One expanded commit: identity, message body, and the files it touched. */
		function CommitDetail({ hash, workspaceId, remote, t }) {
			const [detail, setDetail] = (0, react.useState)({ phase: "loading" });
			const live = (0, react.useRef)(true);
			(0, react.useEffect)(() => () => {
				live.current = false;
			}, []);
			(0, react.useEffect)(() => {
				setDetail({ phase: "loading" });
				(async () => {
					const result = await remote.gitCommit({
						workspaceId,
						hash
					});
					if (!live.current) return;
					setDetail("error" in result ? {
						phase: "error",
						message: result.error.message
					} : {
						phase: "ready",
						value: result.commit
					});
				})();
			}, [
				hash,
				remote,
				workspaceId
			]);
			if (detail.phase === "loading") return (0, react_jsx_runtime.jsx)("p", {
				className: GraphOverlay_module_css_default.empty,
				children: t("graph.loading")
			});
			if (detail.phase === "error") return (0, react_jsx_runtime.jsx)("p", {
				className: GraphOverlay_module_css_default.error,
				children: t("graph.error", { message: detail.message })
			});
			const commit = detail.value;
			return (0, react_jsx_runtime.jsxs)("div", {
				className: GraphOverlay_module_css_default.detail,
				"data-testid": "graph-detail",
				children: [
					(0, react_jsx_runtime.jsxs)("dl", {
						className: GraphOverlay_module_css_default.facts,
						children: [
							(0, react_jsx_runtime.jsx)("dt", { children: t("graph.detail.hash") }),
							(0, react_jsx_runtime.jsx)("dd", {
								className: GraphOverlay_module_css_default.mono,
								children: commit.hash
							}),
							(0, react_jsx_runtime.jsx)("dt", { children: t("graph.detail.parents") }),
							(0, react_jsx_runtime.jsx)("dd", {
								className: GraphOverlay_module_css_default.mono,
								children: commit.parents.length === 0 ? "—" : commit.parents.map(shortHash).join(" ")
							}),
							(0, react_jsx_runtime.jsx)("dt", { children: t("graph.detail.author") }),
							(0, react_jsx_runtime.jsx)("dd", { children: commit.email === "" ? commit.author : `${commit.author} <${commit.email}>` }),
							(0, react_jsx_runtime.jsx)("dt", { children: t("graph.detail.date") }),
							(0, react_jsx_runtime.jsx)("dd", { children: (/* @__PURE__ */ new Date(commit.date * 1e3)).toLocaleString() })
						]
					}),
					commit.body !== "" && (0, react_jsx_runtime.jsx)("pre", {
						className: GraphOverlay_module_css_default.body,
						children: commit.body
					}),
					(0, react_jsx_runtime.jsx)("p", {
						className: GraphOverlay_module_css_default.filesTitle,
						children: t("graph.detail.files", { count: String(commit.files.length) })
					}),
					commit.files.length > 0 && (0, react_jsx_runtime.jsx)("ul", {
						className: GraphOverlay_module_css_default.files,
						children: commit.files.map((file) => (0, react_jsx_runtime.jsxs)("li", {
							className: GraphOverlay_module_css_default.file,
							children: [
								(0, react_jsx_runtime.jsx)("span", {
									className: GraphOverlay_module_css_default.filePath,
									title: file.path,
									children: file.path
								}),
								(0, react_jsx_runtime.jsx)("span", {
									className: GraphOverlay_module_css_default.added,
									children: file.added === null ? "—" : `+${String(file.added)}`
								}),
								(0, react_jsx_runtime.jsx)("span", {
									className: GraphOverlay_module_css_default.removed,
									children: file.removed === null ? "—" : `-${String(file.removed)}`
								})
							]
						}, file.path))
					})
				]
			});
		}
		//#endregion
		//#region lib/types/client/preview.js
		/**
		* Preview loading: which rendered form a path maps to, and how one preview
		* tab is assembled from the host's file reads. Kind selection is a pure
		* function of the path so the panel can label a tab before its bytes arrive;
		* the loader is the only place that decides between the text, binary, and
		* Office read paths.
		* @module dsh-web-enhanced/src/client/preview
		*/
		/** Extensions rendered as Markdown. */
		const MARKDOWN = /* @__PURE__ */ new Set([
			"md",
			"markdown",
			"mdx"
		]);
		/** Extensions rendered as sanitized HTML. */
		const HTML = /* @__PURE__ */ new Set(["html", "htm"]);
		/** Extensions rendered as a unified diff. */
		const DIFF = /* @__PURE__ */ new Set(["diff", "patch"]);
		/** Extensions rendered as a table. */
		const CSV = /* @__PURE__ */ new Set(["csv", "tsv"]);
		/** Extensions rendered as an image. */
		const IMAGE = /* @__PURE__ */ new Set([
			"png",
			"jpg",
			"jpeg",
			"gif",
			"webp",
			"svg",
			"bmp",
			"ico",
			"avif"
		]);
		/** Extensions converted by the host's Office reader. */
		const OFFICE = /* @__PURE__ */ new Set(["docx", "xlsx"]);
		/** Extensions rendered with code affordances (syntax-shaped, monospace). */
		const CODE = /* @__PURE__ */ new Set([
			"ts",
			"tsx",
			"js",
			"jsx",
			"mjs",
			"cjs",
			"json",
			"jsonc",
			"yaml",
			"yml",
			"toml",
			"ini",
			"css",
			"scss",
			"less",
			"py",
			"rs",
			"go",
			"java",
			"kt",
			"c",
			"h",
			"cc",
			"cpp",
			"hpp",
			"cs",
			"rb",
			"php",
			"swift",
			"sh",
			"bash",
			"zsh",
			"fish",
			"ps1",
			"sql",
			"graphql",
			"vue",
			"svelte",
			"xml",
			"gradle",
			"dockerfile",
			"makefile"
		]);
		/**
		* Lowercase extension of a path, without the dot.
		* @param path - workspace-relative path.
		* @returns the extension, or '' when the basename carries none.
		*/
		function extensionOf(path) {
			const name = path.slice(path.lastIndexOf("/") + 1);
			const dot = name.lastIndexOf(".");
			if (dot <= 0) return "";
			return name.slice(dot + 1).toLowerCase();
		}
		/**
		* Basename of a workspace-relative path.
		* @param path - workspace-relative path.
		* @returns the last segment.
		*/
		function baseNameOf(path) {
			return path.slice(path.lastIndexOf("/") + 1);
		}
		/**
		* The rendered form a path maps to, decided from the path alone.
		* @param path - workspace-relative path.
		* @returns the preview kind; unknown extensions read as plain text.
		*/
		function previewKindOf(path) {
			const name = baseNameOf(path).toLowerCase();
			const ext = extensionOf(path);
			if (MARKDOWN.has(ext)) return "markdown";
			if (HTML.has(ext)) return "html";
			if (DIFF.has(ext)) return "diff";
			if (CSV.has(ext)) return "csv";
			if (IMAGE.has(ext)) return "image";
			if (OFFICE.has(ext)) return "office";
			if (ext === "pdf") return "pdf";
			if (CODE.has(ext)) return "code";
			if (ext === "" && (name === "dockerfile" || name === "makefile")) return "code";
			return "text";
		}
		/**
		* Whether a kind has a rendered form distinct from its source text. Kinds
		* without one stay on `source` and hide the mode switch.
		* @param kind - the preview kind.
		* @returns true when `view` and `split` are meaningful.
		*/
		function hasRenderedForm(kind) {
			return kind === "markdown" || kind === "html" || kind === "csv" || kind === "diff";
		}
		/**
		* Whether a kind's bytes are editable text the panel may save back.
		* @param kind - the preview kind.
		* @returns true for text-shaped kinds.
		*/
		function isEditable(kind) {
			return kind !== "image" && kind !== "pdf" && kind !== "office";
		}
		/** Initial render mode of a freshly opened tab. */
		function initialModeOf(kind) {
			return hasRenderedForm(kind) ? "view" : "source";
		}
		/** Base64 payload of a binary read, as a data URL for `img`/`object`. */
		function dataUrlOf(tab) {
			if (tab.binary === void 0 || tab.binary === "") return void 0;
			const ext = extensionOf(tab.path);
			return `data:${tab.kind === "pdf" ? "application/pdf" : ext === "svg" ? "image/svg+xml" : ext === "jpg" || ext === "jpeg" ? "image/jpeg" : `image/${ext === "" ? "png" : ext}`};base64,${tab.binary}`;
		}
		/**
		* Load one file into a preview tab. Host failures land in the tab's `error`
		* field so the panel renders them in place instead of losing the tab.
		* @param remote - the web-enhanced remote facade.
		* @param workspaceId - owning workspace.
		* @param path - workspace-relative path.
		* @returns the assembled tab.
		*/
		async function loadPreviewTab(remote, workspaceId, path) {
			const kind = previewKindOf(path);
			const base = {
				path,
				name: baseNameOf(path),
				kind,
				mode: initialModeOf(kind)
			};
			if (kind === "office") {
				const preview = await remote.fsOfficePreview({
					workspaceId,
					path
				});
				if ("error" in preview) return {
					...base,
					mode: "source",
					error: preview.error.message,
					truncated: false,
					size: 0
				};
				return {
					...base,
					mode: "view",
					office: {
						kind: preview.kind,
						blocks: preview.blocks,
						truncated: preview.truncated
					},
					truncated: preview.truncated,
					size: 0
				};
			}
			const read = await remote.fsRead({
				workspaceId,
				path
			});
			if ("error" in read) return {
				...base,
				mode: "source",
				error: read.error.message,
				truncated: false,
				size: 0
			};
			if (read.kind === "binary") return {
				...base,
				mode: "view",
				binary: read.content,
				truncated: read.truncated,
				size: read.size
			};
			return {
				...base,
				content: read.content,
				truncated: read.truncated,
				size: read.size
			};
		}
		//#endregion
		//#region \0dsh-css:D:\Documents\Dev-Repo\deepseek-harness\dsh-plugins\dsh-web-enhanced\src\client\panel\FileTree.module.css.mjs
		const css$4 = ".gtoRXG_tree{flex-direction:column;height:100%;display:flex}.gtoRXG_search{color:inherit;background:0 0;border:1px solid #80808052;border-radius:5px;flex:none;margin:8px;padding:5px 8px;font-size:12px}.gtoRXG_list{margin:0;padding:0;list-style:none}.gtoRXG_row{width:100%;color:inherit;cursor:pointer;text-align:start;background:0 0;border:none;align-items:center;gap:6px;padding:3px 8px;font-size:12px;display:flex}.gtoRXG_row:hover{background:#8080a02e}.gtoRXG_glyph{opacity:.6;flex:none;width:10px;font-size:10px}.gtoRXG_name{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.gtoRXG_row[data-kind=dir] .gtoRXG_name{font-weight:500}.gtoRXG_path{opacity:.5;text-overflow:ellipsis;white-space:nowrap;margin-inline-start:auto;font-size:10px;overflow:hidden}.gtoRXG_empty,.gtoRXG_error{opacity:.7;margin:8px;font-size:12px}.gtoRXG_error{color:#d9534f;opacity:1}";
		const tagId$4 = "dsh-web-enhanced/FileTree.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$4) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId$4;
			tag.textContent = css$4;
			document.head.appendChild(tag);
		}
		var FileTree_module_css_default = {
			"empty": "gtoRXG_empty",
			"error": "gtoRXG_error",
			"glyph": "gtoRXG_glyph",
			"list": "gtoRXG_list",
			"name": "gtoRXG_name",
			"path": "gtoRXG_path",
			"row": "gtoRXG_row",
			"search": "gtoRXG_search",
			"tree": "gtoRXG_tree"
		};
		//#endregion
		//#region lib/types/client/panel/FileTree.js
		/**
		* Workspace file tree: lazily expanded directories, whole-row click to
		* expand, and a file-name filter that switches the tree into a flat match
		* list. Clicking a file opens it in the preview tab.
		*
		* Directory contents are fetched on first expansion and cached for the life
		* of the mount: a tree that re-listed on every render would hammer the host
		* on each keystroke of the filter.
		* @module dsh-web-enhanced/src/client/panel/FileTree
		*/
		/** Debounce of the search query, in milliseconds. */
		const SEARCH_DEBOUNCE_MS = 200;
		/** The file tree. */
		function FileTree({ workspaceId, usePanel, remote, toggleExpanded, setQuery, selectTab, openTab, t }) {
			const expanded = usePanel((state) => state.expanded[workspaceId] ?? []);
			const query = usePanel((state) => state.query);
			const [listings, setListings] = (0, react.useState)(/* @__PURE__ */ new Map());
			const [matches, setMatches] = (0, react.useState)(null);
			const live = (0, react.useRef)(true);
			(0, react.useEffect)(() => () => {
				live.current = false;
			}, []);
			const list = (0, react.useCallback)(async (path) => {
				setListings((current) => new Map(current).set(path, { phase: "loading" }));
				const result = await remote.fsList({
					workspaceId,
					path
				});
				if (!live.current) return;
				setListings((current) => new Map(current).set(path, "error" in result ? {
					phase: "error",
					message: result.error.message
				} : {
					phase: "ready",
					entries: result.entries
				}));
			}, [remote, workspaceId]);
			(0, react.useEffect)(() => {
				setListings(/* @__PURE__ */ new Map());
				list("");
			}, [list]);
			(0, react.useEffect)(() => {
				const needle = query.trim();
				if (needle === "") {
					setMatches(null);
					return;
				}
				const timer = setTimeout(() => {
					(async () => {
						const result = await remote.fsSearch({
							workspaceId,
							query: needle
						});
						if (!live.current) return;
						setMatches("error" in result ? [] : result.entries);
					})();
				}, SEARCH_DEBOUNCE_MS);
				return () => {
					clearTimeout(timer);
				};
			}, [
				query,
				remote,
				workspaceId
			]);
			const open = (0, react.useCallback)(async (path) => {
				const tab = await loadPreviewTab(remote, workspaceId, path);
				if (!live.current) return;
				openTab(tab);
				selectTab("preview");
			}, [
				openTab,
				remote,
				selectTab,
				workspaceId
			]);
			const toggle = (0, react.useCallback)((path) => {
				if (!expanded.includes(path) && listings.get(path) === void 0) list(path);
				toggleExpanded(workspaceId, path);
			}, [
				expanded,
				list,
				listings,
				toggleExpanded,
				workspaceId
			]);
			return (0, react_jsx_runtime.jsxs)("div", {
				className: FileTree_module_css_default.tree,
				"data-testid": "file-tree",
				children: [(0, react_jsx_runtime.jsx)("input", {
					className: FileTree_module_css_default.search,
					value: query,
					placeholder: t("files.search"),
					"aria-label": t("files.search"),
					"data-testid": "file-tree-search",
					onChange: (event) => {
						setQuery(event.target.value);
					}
				}), matches !== null ? (0, react_jsx_runtime.jsx)("ul", {
					className: FileTree_module_css_default.list,
					"data-testid": "file-tree-matches",
					children: matches.length === 0 ? (0, react_jsx_runtime.jsx)("li", {
						className: FileTree_module_css_default.empty,
						children: t("files.searchEmpty")
					}) : matches.map((entry) => (0, react_jsx_runtime.jsx)("li", { children: (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: FileTree_module_css_default.row,
						"data-kind": entry.kind,
						onClick: () => {
							if (entry.kind === "file") open(entry.path);
						},
						children: [
							(0, react_jsx_runtime.jsx)("span", {
								className: FileTree_module_css_default.glyph,
								"aria-hidden": true,
								children: entry.kind === "dir" ? "▸" : "·"
							}),
							(0, react_jsx_runtime.jsx)("span", {
								className: FileTree_module_css_default.name,
								children: entry.name
							}),
							(0, react_jsx_runtime.jsx)("span", {
								className: FileTree_module_css_default.path,
								children: entry.path
							})
						]
					}) }, entry.path))
				}) : (0, react_jsx_runtime.jsx)(Directory, {
					path: "",
					depth: 0,
					listings,
					expanded,
					onToggle: toggle,
					onOpen: (path) => {
						open(path);
					},
					t
				})]
			});
		}
		/** One directory level, recursing into its expanded children. */
		function Directory({ path, depth, listings, expanded, onToggle, onOpen, t }) {
			const listing = listings.get(path);
			if (listing === void 0 || listing.phase === "loading") return (0, react_jsx_runtime.jsx)("p", {
				className: FileTree_module_css_default.empty,
				children: t("board.loading")
			});
			if (listing.phase === "error") return (0, react_jsx_runtime.jsx)("p", {
				className: FileTree_module_css_default.error,
				children: t("files.error", { message: listing.message })
			});
			if (listing.entries.length === 0) return (0, react_jsx_runtime.jsx)("p", {
				className: FileTree_module_css_default.empty,
				children: t("files.empty")
			});
			return (0, react_jsx_runtime.jsx)("ul", {
				className: FileTree_module_css_default.list,
				children: listing.entries.map((entry) => {
					const isOpen = entry.kind === "dir" && expanded.includes(entry.path);
					return (0, react_jsx_runtime.jsxs)("li", { children: [(0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: FileTree_module_css_default.row,
						style: { paddingInlineStart: `${String(depth * 12 + 8)}px` },
						"data-kind": entry.kind,
						"data-open": isOpen || void 0,
						"data-testid": `file-tree-row-${entry.path}`,
						onClick: () => {
							entry.kind === "dir" ? onToggle(entry.path) : onOpen(entry.path);
						},
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: FileTree_module_css_default.glyph,
							"aria-hidden": true,
							children: entry.kind === "dir" ? isOpen ? "▾" : "▸" : "·"
						}), (0, react_jsx_runtime.jsx)("span", {
							className: FileTree_module_css_default.name,
							children: entry.name
						})]
					}), isOpen && (0, react_jsx_runtime.jsx)(Directory, {
						path: entry.path,
						depth: depth + 1,
						listings,
						expanded,
						onToggle,
						onOpen,
						t
					})] }, entry.path);
				})
			});
		}
		//#endregion
		//#region lib/types/client/panel/markdown.js
		/**
		* Minimal Markdown and CSV parsing for the preview pane.
		*
		* Deliberately hand-rolled and small rather than a Markdown library: the
		* browser bundle is fetched eagerly per plugin, and the preview needs
		* headings, code, lists, quotes, and basic inline spans — not a CommonMark
		* implementation. Parsing to a block/span tree (never to an HTML string) is
		* also what keeps the renderer free of `dangerouslySetInnerHTML`, so
		* untrusted file content cannot inject markup.
		* @module dsh-web-enhanced/src/client/panel/markdown
		*/
		/**
		* Inline patterns, tried in order at each scan position.
		*
		* The emphasis patterns require the delimited run to start and end with a
		* non-space character, which is what keeps arithmetic like `2 * 3 * 4` from
		* reading as emphasis. Written without lookbehind so the bundle stays
		* portable across browser engines.
		*/
		const INLINE = [
			{
				type: "code",
				re: /^`([^`]+)`/u
			},
			{
				type: "strong",
				re: /^\*\*([^\s*](?:[^*]*[^\s*])?)\*\*/u
			},
			{
				type: "em",
				re: /^\*([^\s*](?:[^*]*[^\s*])?)\*/u
			},
			{
				type: "del",
				re: /^~~([^\s~](?:[^~]*[^\s~])?)~~/u
			}
		];
		/**
		* Inline HTML element names this preview can render, mapped to the span they
		* become.
		*
		* Documents mix HTML into Markdown constantly (`<br>`, `<kbd>`, `<img>`), and
		* printing the tag text verbatim is the wrong reading of the source. Rendering
		* arbitrary HTML is not on offer either: the whole preview is built as React
		* elements precisely so untrusted file content cannot inject markup. So a
		* known element becomes the matching span, and anything else has its tag
		* markup dropped while its content keeps rendering — the same shape a
		* sanitizer produces.
		*/
		const HTML_SPAN = {
			b: "strong",
			strong: "strong",
			i: "em",
			em: "em",
			var: "em",
			cite: "em",
			code: "code",
			kbd: "code",
			samp: "code",
			tt: "code",
			del: "del",
			s: "del",
			strike: "del"
		};
		/** Elements whose CONTENT is markup, not prose: dropped whole. */
		const HTML_VOIDED = /* @__PURE__ */ new Set(["script", "style"]);
		/** One opening/closing/self-closing HTML tag, or a comment. */
		const HTML_TAG = /^<(\/)?([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^>"'])*?)(\/)?>/u;
		const HTML_COMMENT = /^<!--[\s\S]*?-->/u;
		/** Read one attribute out of a raw tag attribute string. */
		function attributeOf(raw, name) {
			const found = new RegExp(`(?:^|\\s)${name}\\s*=\\s*("([^"]*)"|'([^']*)'|([^\\s>]+))`, "iu").exec(raw);
			if (found === null) return void 0;
			return found[2] ?? found[3] ?? found[4];
		}
		/** Link targets that may not be rendered as an anchor href. */
		function safeHref(href) {
			const trimmed = href.trim();
			if (/^(?:javascript|data|vbscript):/iu.test(trimmed)) return void 0;
			return trimmed;
		}
		/**
		* Image sources the preview may load. Unlike a link target, an inline `data:`
		* image is the ordinary way a self-contained document embeds a picture, so it
		* stays — the element renders a bitmap, never markup or script.
		*/
		function safeSrc(src) {
			const trimmed = src.trim();
			if (/^(?:javascript|vbscript):/iu.test(trimmed)) return void 0;
			if (/^data:/iu.test(trimmed) && !/^data:image\//iu.test(trimmed)) return void 0;
			return trimmed;
		}
		/** The five entities a Markdown document realistically writes by hand. */
		const ENTITY = {
			amp: "&",
			lt: "<",
			gt: ">",
			quot: "\"",
			apos: "'",
			nbsp: "\xA0"
		};
		/** Decode one `&name;` or `&#NN;` reference; undefined when it is not one. */
		function decodeEntity(source) {
			const named = /^&([a-zA-Z]+);/u.exec(source);
			if (named !== null) {
				const text = ENTITY[named[1].toLowerCase()];
				return text === void 0 ? void 0 : {
					text,
					length: named[0].length
				};
			}
			const numeric = /^&#(x[0-9a-fA-F]+|\d+);/u.exec(source);
			if (numeric === null) return void 0;
			const raw = numeric[1];
			const code = raw[0] === "x" || raw[0] === "X" ? Number.parseInt(raw.slice(1), 16) : Number.parseInt(raw, 10);
			if (!Number.isFinite(code) || code <= 0 || code > 1114111) return void 0;
			return {
				text: String.fromCodePoint(code),
				length: numeric[0].length
			};
		}
		/**
		* Parse inline Markdown into spans.
		* @param text - one block's raw text.
		* @returns the spans, with unmatched text preserved verbatim.
		*/
		function parseInline(text) {
			const spans = [];
			let plain = "";
			let rest = text;
			const pushText = (value) => {
				if (value === "") return;
				const last = spans[spans.length - 1];
				if (last?.type === "text") {
					spans[spans.length - 1] = {
						type: "text",
						text: last.text + value
					};
					return;
				}
				spans.push({
					type: "text",
					text: value
				});
			};
			const flush = () => {
				pushText(plain);
				plain = "";
			};
			while (rest !== "") {
				const image = /^!\[([^\]]*)\]\(([^)\s]+)\)/u.exec(rest);
				if (image !== null) {
					const src = safeSrc(image[2]);
					flush();
					if (src === void 0) pushText(image[0]);
					else spans.push({
						type: "image",
						text: image[1],
						href: src
					});
					rest = rest.slice(image[0].length);
					continue;
				}
				const link = /^\[([^\]]*)\]\(([^)\s]+)\)/u.exec(rest);
				if (link !== null) {
					const href = safeHref(link[2]);
					flush();
					if (href === void 0) pushText(link[0]);
					else spans.push({
						type: "link",
						text: link[1],
						href
					});
					rest = rest.slice(link[0].length);
					continue;
				}
				if (rest[0] === "<") {
					const consumed = consumeHtml(rest, spans, flush, pushText);
					if (consumed > 0) {
						rest = rest.slice(consumed);
						continue;
					}
				}
				if (rest[0] === "&") {
					const entity = decodeEntity(rest);
					if (entity !== void 0) {
						plain += entity.text;
						rest = rest.slice(entity.length);
						continue;
					}
				}
				let matched = false;
				for (const pattern of INLINE) {
					const found = pattern.re.exec(rest);
					if (found === null) continue;
					flush();
					spans.push({
						type: pattern.type,
						text: found[1]
					});
					rest = rest.slice(found[0].length);
					matched = true;
					break;
				}
				if (matched) continue;
				plain += rest[0];
				rest = rest.slice(1);
			}
			flush();
			return spans;
		}
		/**
		* Consume one inline HTML construct at the head of `rest`.
		*
		* A known element becomes its span (its text content read from the source up
		* to the closing tag); a comment and a voided element disappear with their
		* content; every other tag disappears while its content keeps rendering. A
		* lone `<` that opens nothing returns 0 so the caller keeps it as text.
		* @returns how many characters were consumed; 0 when this is not HTML.
		*/
		function consumeHtml(rest, spans, flush, pushText) {
			const comment = HTML_COMMENT.exec(rest);
			if (comment !== null) return comment[0].length;
			const tag = HTML_TAG.exec(rest);
			if (tag === null) return 0;
			const closing = tag[1] === "/";
			const name = tag[2].toLowerCase();
			const attributes = tag[3] ?? "";
			if (name === "br") {
				flush();
				spans.push({ type: "break" });
				return tag[0].length;
			}
			if (name === "img" && !closing) {
				const src = safeSrc(attributeOf(attributes, "src") ?? "");
				if (src !== void 0) {
					flush();
					spans.push({
						type: "image",
						text: attributeOf(attributes, "alt") ?? "",
						href: src
					});
				}
				return tag[0].length;
			}
			if (closing) return tag[0].length;
			const end = closingIndexOf(rest, name, tag[0].length);
			if (name === "a") {
				const href = safeHref(attributeOf(attributes, "href") ?? "");
				const inner = end === void 0 ? "" : rest.slice(tag[0].length, end.start);
				if (href === void 0) {
					pushText(stripTags(inner));
					return end === void 0 ? tag[0].length : end.after;
				}
				flush();
				spans.push({
					type: "link",
					text: stripTags(inner),
					href
				});
				return end === void 0 ? tag[0].length : end.after;
			}
			const mapped = HTML_SPAN[name];
			if (mapped !== void 0 && end !== void 0) {
				flush();
				const inner = stripTags(rest.slice(tag[0].length, end.start));
				spans.push(mapped === "code" ? {
					type: "code",
					text: inner
				} : mapped === "strong" ? {
					type: "strong",
					text: inner
				} : mapped === "del" ? {
					type: "del",
					text: inner
				} : {
					type: "em",
					text: inner
				});
				return end.after;
			}
			if (HTML_VOIDED.has(name)) return end === void 0 ? rest.length : end.after;
			return tag[0].length;
		}
		/** Locate one element's closing tag, honouring same-name nesting. */
		function closingIndexOf(source, name, from) {
			const pattern = new RegExp(`<(/)?${name}(?![a-zA-Z0-9-])((?:"[^"]*"|'[^']*'|[^>"'])*?)(/)?>`, "giu");
			pattern.lastIndex = from;
			let depth = 0;
			for (;;) {
				const found = pattern.exec(source);
				if (found === null) return void 0;
				if (found[1] === "/") {
					if (depth === 0) return {
						start: found.index,
						after: found.index + found[0].length
					};
					depth -= 1;
					continue;
				}
				if (found[3] !== "/") depth += 1;
			}
		}
		/** Flatten any residual markup inside an element's content to its text. */
		function stripTags(source) {
			let text = "";
			let rest = source;
			while (rest !== "") {
				if (rest[0] === "<") {
					const comment = HTML_COMMENT.exec(rest);
					if (comment !== null) {
						rest = rest.slice(comment[0].length);
						continue;
					}
					const tag = HTML_TAG.exec(rest);
					if (tag !== null) {
						rest = rest.slice(tag[0].length);
						continue;
					}
				}
				if (rest[0] === "&") {
					const entity = decodeEntity(rest);
					if (entity !== void 0) {
						text += entity.text;
						rest = rest.slice(entity.length);
						continue;
					}
				}
				text += rest[0];
				rest = rest.slice(1);
			}
			return text;
		}
		/** Split one pipe-table row into its cells, honouring `\|` escapes. */
		function tableCells(line) {
			const trimmed = line.trim().replace(/^\|/u, "").replace(/\|\s*$/u, "");
			const cells = [];
			let cell = "";
			for (let at = 0; at < trimmed.length; at += 1) {
				const char = trimmed[at];
				if (char === "\\" && trimmed[at + 1] === "|") {
					cell += "|";
					at += 1;
					continue;
				}
				if (char === "|") {
					cells.push(cell.trim());
					cell = "";
					continue;
				}
				cell += char;
			}
			cells.push(cell.trim());
			return cells;
		}
		/**
		* Read the alignment row of a GFM table (`---`, `:--`, `:-:`, `--:`).
		* @returns one entry per column, or undefined when the line is not one.
		*/
		function tableAlignment(line) {
			if (!line.includes("|")) return void 0;
			const cells = tableCells(line);
			const align = [];
			for (const cell of cells) {
				if (!/^:?-{1,}:?$/u.test(cell)) return void 0;
				const left = cell.startsWith(":");
				const right = cell.endsWith(":");
				align.push(left && right ? "center" : right ? "right" : left ? "left" : void 0);
			}
			return align.length === 0 ? void 0 : align;
		}
		/**
		* Parse Markdown into blocks.
		* @param source - the document text.
		* @returns the block list; an unterminated fence still yields its code block.
		*/
		function parseMarkdown(source) {
			const blocks = [];
			const lines = source.split(/\r?\n/u);
			let index = 0;
			/** Consume a run of list items sharing one marker style. */
			const takeList = (ordered) => {
				const items = [];
				const marker = ordered ? /^\s*\d+[.)]\s+(.*)$/u : /^\s*[-*+]\s+(.*)$/u;
				while (index < lines.length) {
					const found = marker.exec(lines[index]);
					if (found === null) break;
					items.push(parseInline(found[1]));
					index += 1;
				}
				return {
					type: "list",
					ordered,
					items
				};
			};
			/**
			* Consume a GFM pipe table starting at the header row, which the caller has
			* already paired with its alignment row. Body rows are padded or clipped to
			* the header width so a ragged row cannot shift the columns.
			*/
			const takeTable = (align) => {
				const header = tableCells(lines[index]).map((cell) => parseInline(cell));
				index += 2;
				const width = header.length;
				const rows = [];
				while (index < lines.length) {
					const line = lines[index];
					if (line.trim() === "" || !line.includes("|")) break;
					const cells = tableCells(line);
					rows.push(Array.from({ length: width }, (_unused, at) => parseInline(cells[at] ?? "")));
					index += 1;
				}
				return {
					type: "table",
					header,
					align: Array.from({ length: width }, (_unused, at) => align[at]),
					rows
				};
			};
			while (index < lines.length) {
				const line = lines[index];
				if (line.trim() === "") {
					index += 1;
					continue;
				}
				const fence = /^\s*```\s*(\S*)\s*$/u.exec(line);
				if (fence !== null) {
					index += 1;
					const body = [];
					while (index < lines.length && !/^\s*```\s*$/u.test(lines[index])) {
						body.push(lines[index]);
						index += 1;
					}
					if (index < lines.length) index += 1;
					blocks.push({
						type: "code",
						lang: fence[1] ?? "",
						code: body.join("\n")
					});
					continue;
				}
				const heading = /^(#{1,6})\s+(.*)$/u.exec(line);
				if (heading !== null) {
					blocks.push({
						type: "heading",
						level: heading[1].length,
						spans: parseInline(heading[2])
					});
					index += 1;
					continue;
				}
				if (/^\s*(?:[-*_]\s*){3,}$/u.test(line)) {
					blocks.push({ type: "rule" });
					index += 1;
					continue;
				}
				if (line.includes("|") && index + 1 < lines.length) {
					const align = tableAlignment(lines[index + 1]);
					if (align !== void 0 && align.length === tableCells(line).length) {
						blocks.push(takeTable(align));
						continue;
					}
				}
				const quote = /^\s*>\s?(.*)$/u.exec(line);
				if (quote !== null) {
					const body = [quote[1]];
					index += 1;
					while (index < lines.length) {
						const next = /^\s*>\s?(.*)$/u.exec(lines[index]);
						if (next === null) break;
						body.push(next[1]);
						index += 1;
					}
					blocks.push({
						type: "quote",
						spans: parseInline(body.join(" "))
					});
					continue;
				}
				if (/^\s*<table[\s>]/iu.test(line)) {
					const start = index;
					while (index < lines.length && !/<\/table\s*>/iu.test(lines[index])) index += 1;
					if (index < lines.length) index += 1;
					const table = parseHtmlTable(lines.slice(start, index).join("\n"));
					if (table !== void 0) {
						blocks.push(table);
						continue;
					}
					index = start;
				}
				if (/^\s*[-*+]\s+/u.test(line)) {
					blocks.push(takeList(false));
					continue;
				}
				if (/^\s*\d+[.)]\s+/u.test(line)) {
					blocks.push(takeList(true));
					continue;
				}
				const body = [];
				while (index < lines.length) {
					const current = lines[index];
					if (current.trim() === "") break;
					if (/^\s*(?:```|#{1,6}\s|>|[-*+]\s|\d+[.)]\s|<table[\s>])/iu.test(current)) break;
					if (body.length > 0 && current.includes("|") && index + 1 < lines.length && tableAlignment(lines[index + 1])?.length === tableCells(current).length) break;
					body.push(current.trim());
					index += 1;
				}
				blocks.push({
					type: "paragraph",
					spans: parseInline(body.join(" "))
				});
			}
			return blocks;
		}
		/**
		* Read one `<table>` element into a table block.
		*
		* Cells keep their inline content (so `<br>`, `<b>`, and Markdown inside a
		* cell still render); a `<th>` anywhere in the first row makes it the header,
		* and a table with no rows is not a table.
		* @param html - the element's source, opening tag through closing tag.
		* @returns the block, or undefined when nothing row-shaped was found.
		*/
		function parseHtmlTable(html) {
			const rows = [];
			const rowPattern = /<tr(?:\s(?:"[^"]*"|'[^']*'|[^>"'])*)?>([\s\S]*?)<\/tr\s*>/giu;
			for (;;) {
				const row = rowPattern.exec(html);
				if (row === null) break;
				const cells = [];
				let head = false;
				const cellPattern = /<(th|td)(?:\s(?:"[^"]*"|'[^']*'|[^>"'])*)?>([\s\S]*?)<\/\1\s*>/giu;
				for (;;) {
					const cell = cellPattern.exec(row[1]);
					if (cell === null) break;
					if (cell[1].toLowerCase() === "th") head = true;
					cells.push(parseInline(cell[2].trim()));
				}
				if (cells.length > 0) rows.push({
					head,
					cells
				});
			}
			if (rows.length === 0) return void 0;
			const first = rows[0];
			const body = first.head ? rows.slice(1) : rows;
			const width = Math.max(...rows.map((row) => row.cells.length));
			const pad = (cells) => Array.from({ length: width }, (_unused, at) => cells[at] ?? []);
			return {
				type: "table",
				header: first.head ? pad(first.cells) : [],
				align: Array.from({ length: width }, () => void 0),
				rows: body.map((row) => pad(row.cells))
			};
		}
		/**
		* Parse delimiter-separated text into rows, honouring quoted fields.
		*
		* Follows the usual CSV quoting rules: a field may be wrapped in double
		* quotes, a doubled quote inside one is a literal quote, and delimiters and
		* newlines lose their meaning inside quotes.
		* @param source - the file text.
		* @param delimiter - field separator; tab for `.tsv`.
		* @returns rows of fields; a trailing newline adds no empty row.
		*/
		function parseDelimited(source, delimiter) {
			const rows = [];
			let row = [];
			let field = "";
			let quoted = false;
			let index = 0;
			while (index < source.length) {
				const char = source[index];
				if (quoted) {
					if (char === "\"") {
						if (source[index + 1] === "\"") {
							field += "\"";
							index += 2;
							continue;
						}
						quoted = false;
						index += 1;
						continue;
					}
					field += char;
					index += 1;
					continue;
				}
				if (char === "\"") {
					quoted = true;
					index += 1;
					continue;
				}
				if (char === delimiter) {
					row.push(field);
					field = "";
					index += 1;
					continue;
				}
				if (char === "\n" || char === "\r") {
					row.push(field);
					rows.push(row);
					row = [];
					field = "";
					index += char === "\r" && source[index + 1] === "\n" ? 2 : 1;
					continue;
				}
				field += char;
				index += 1;
			}
			if (field !== "" || row.length > 0) {
				row.push(field);
				rows.push(row);
			}
			return rows;
		}
		/**
		* Classify one unified-diff line.
		* @param line - the raw line.
		* @returns its display class.
		*/
		function diffLineKind(line) {
			if (line.startsWith("+++") || line.startsWith("---")) return "meta";
			if (line.startsWith("@@")) return "hunk";
			if (line.startsWith("diff ") || line.startsWith("index ")) return "meta";
			if (line.startsWith("+")) return "added";
			if (line.startsWith("-")) return "removed";
			return "context";
		}
		//#endregion
		//#region \0dsh-css:D:\Documents\Dev-Repo\deepseek-harness\dsh-plugins\dsh-web-enhanced\src\client\panel\PreviewPane.module.css.mjs
		const css$3 = ".yPmR4G_pane{flex-direction:column;height:100%;display:flex}.yPmR4G_strip{border-bottom:1px solid #8080803d;flex:none;gap:2px;padding:4px 6px;display:flex;overflow-x:auto}.yPmR4G_stripItem{border-radius:5px;align-items:center;padding-inline-end:2px;display:flex}.yPmR4G_stripItem[data-active]{background:#8080a038}.yPmR4G_stripName{max-width:160px;color:inherit;cursor:pointer;text-overflow:ellipsis;white-space:nowrap;background:0 0;border:none;align-items:center;gap:4px;padding:3px 6px;font-size:11px;display:flex;overflow:hidden}.yPmR4G_dirty{color:#d9a441}.yPmR4G_stripClose{color:inherit;cursor:pointer;opacity:.6;background:0 0;border:none;padding:2px 4px;font-size:10px}.yPmR4G_stripClose:hover{opacity:1}.yPmR4G_toolbar{border-bottom:1px solid #8080802e;flex:none;align-items:center;gap:6px;padding:5px 8px;display:flex}.yPmR4G_mode,.yPmR4G_save{color:inherit;cursor:pointer;background:0 0;border:1px solid #8080804d;border-radius:4px;padding:2px 8px;font-size:11px}.yPmR4G_mode[data-active]{background:#8080a040}.yPmR4G_save{margin-inline-start:auto}.yPmR4G_save:disabled{cursor:default;opacity:.4}.yPmR4G_notice{opacity:.65;font-size:10px}.yPmR4G_error{color:#d9534f;margin:6px 8px;font-size:11px}.yPmR4G_body{flex:1;min-height:0;display:flex}.yPmR4G_body[data-mode=split]>*{flex:1;min-width:0}.yPmR4G_body[data-mode=split] .yPmR4G_view{border-inline-start:1px solid #80808033}.yPmR4G_editor{resize:none;min-width:0;color:inherit;background:0 0;border:none;flex:1;padding:8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:1.5}.yPmR4G_editor:focus{outline:none}.yPmR4G_source,.yPmR4G_diff{white-space:pre-wrap;word-break:break-word;flex:1;min-width:0;margin:0;padding:8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;line-height:1.5;overflow:auto}.yPmR4G_view{flex:1;min-width:0;padding:10px 12px;overflow:auto}.yPmR4G_empty{opacity:.7;margin:12px;font-size:12px}.yPmR4G_frame{background:#fff;border:none;width:100%;height:100%;min-height:320px}.yPmR4G_image{max-width:100%;height:auto}.yPmR4G_markdown{font-size:13px;line-height:1.65}.yPmR4G_markdown h1{font-size:20px}.yPmR4G_markdown h2{font-size:17px}.yPmR4G_markdown h3{font-size:15px}.yPmR4G_markdown blockquote{opacity:.85;border-inline-start:3px solid #8080a073;margin:8px 0;padding-inline-start:10px}.yPmR4G_inlineCode,.yPmR4G_codeBlock{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}.yPmR4G_inlineCode{background:#8080a033;border-radius:3px;padding:1px 4px}.yPmR4G_codeBlock{background:#8080a024;border-radius:5px;padding:8px 10px;overflow:auto}.yPmR4G_table{border-collapse:collapse;width:100%;font-size:12px}.yPmR4G_table th,.yPmR4G_table td{text-align:start;border:1px solid #80808047;padding:3px 7px}.yPmR4G_table th{background:#8080a029}.yPmR4G_inlineImage{vertical-align:middle;max-width:100%}.yPmR4G_diffLine{display:block}.yPmR4G_diffLine[data-kind=added]{background:#50b46433}.yPmR4G_diffLine[data-kind=removed]{background:#d75a5a33}.yPmR4G_diffLine[data-kind=hunk]{color:#6a8fd8}.yPmR4G_diffLine[data-kind=meta]{opacity:.65}";
		const tagId$3 = "dsh-web-enhanced/PreviewPane.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$3) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId$3;
			tag.textContent = css$3;
			document.head.appendChild(tag);
		}
		var PreviewPane_module_css_default = {
			"body": "yPmR4G_body",
			"codeBlock": "yPmR4G_codeBlock",
			"diff": "yPmR4G_diff",
			"diffLine": "yPmR4G_diffLine",
			"dirty": "yPmR4G_dirty",
			"editor": "yPmR4G_editor",
			"empty": "yPmR4G_empty",
			"error": "yPmR4G_error",
			"frame": "yPmR4G_frame",
			"image": "yPmR4G_image",
			"inlineCode": "yPmR4G_inlineCode",
			"inlineImage": "yPmR4G_inlineImage",
			"markdown": "yPmR4G_markdown",
			"mode": "yPmR4G_mode",
			"notice": "yPmR4G_notice",
			"pane": "yPmR4G_pane",
			"save": "yPmR4G_save",
			"source": "yPmR4G_source",
			"strip": "yPmR4G_strip",
			"stripClose": "yPmR4G_stripClose",
			"stripItem": "yPmR4G_stripItem",
			"stripName": "yPmR4G_stripName",
			"table": "yPmR4G_table",
			"toolbar": "yPmR4G_toolbar",
			"view": "yPmR4G_view"
		};
		//#endregion
		//#region lib/types/client/panel/PreviewPane.js
		/**
		* Preview pane: a tab strip over open files, a source/split/preview mode
		* switch, and inline editing with save-back for text-shaped formats.
		*
		* Rendered forms are built from parsed structures into React elements — never
		* `dangerouslySetInnerHTML` — so file content cannot inject markup. HTML is
		* the one format with no structural rendering, and it goes into a sandboxed
		* iframe with no scripts and no same-origin access.
		* @module dsh-web-enhanced/src/client/panel/PreviewPane
		*/
		/** Mode buttons in display order. */
		const MODES = [
			{
				mode: "source",
				key: "preview.mode.source"
			},
			{
				mode: "split",
				key: "preview.mode.split"
			},
			{
				mode: "view",
				key: "preview.mode.view"
			}
		];
		/** The preview pane. */
		function PreviewPane({ workspaceId, usePreview, remote, focusTab, closeTab, setMode, setDraft, commitDraft, t }) {
			const tabs = usePreview((state) => state.tabs);
			const active = usePreview((state) => activeTabOf(state));
			const [saveError, setSaveError] = (0, react.useState)(null);
			const live = (0, react.useRef)(true);
			const save = (0, react.useCallback)(async (tab) => {
				if (tab.draft === void 0) return;
				const result = await remote.fsWrite({
					workspaceId,
					path: tab.path,
					content: tab.draft
				});
				if (!live.current) return;
				if ("error" in result) {
					setSaveError(result.error.message);
					return;
				}
				setSaveError(null);
				commitDraft(tab.path);
			}, [
				commitDraft,
				remote,
				workspaceId
			]);
			if (tabs.length === 0 || active === void 0) return (0, react_jsx_runtime.jsx)("p", {
				className: PreviewPane_module_css_default.empty,
				"data-testid": "preview-empty",
				children: t("preview.empty")
			});
			const editable = isEditable(active.kind) && active.content !== void 0;
			const dirty = active.draft !== void 0 && active.draft !== active.content;
			const body = active.draft ?? active.content ?? "";
			return (0, react_jsx_runtime.jsxs)("div", {
				className: PreviewPane_module_css_default.pane,
				"data-testid": "preview-pane",
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						className: PreviewPane_module_css_default.strip,
						role: "tablist",
						children: tabs.map((tab) => (0, react_jsx_runtime.jsxs)("span", {
							className: PreviewPane_module_css_default.stripItem,
							"data-active": tab.path === active.path || void 0,
							children: [(0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								role: "tab",
								className: PreviewPane_module_css_default.stripName,
								"aria-selected": tab.path === active.path,
								title: tab.path,
								onClick: () => {
									focusTab(tab.path);
								},
								children: [tab.name, tab.draft !== void 0 && tab.draft !== tab.content && (0, react_jsx_runtime.jsx)("span", {
									className: PreviewPane_module_css_default.dirty,
									"aria-label": t("preview.dirty"),
									children: "•"
								})]
							}), (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: PreviewPane_module_css_default.stripClose,
								"aria-label": t("preview.close"),
								onClick: () => {
									closeTab(tab.path);
								},
								children: "✕"
							})]
						}, tab.path))
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: PreviewPane_module_css_default.toolbar,
						children: [
							hasRenderedForm(active.kind) && MODES.map((entry) => (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: PreviewPane_module_css_default.mode,
								"data-active": active.mode === entry.mode || void 0,
								"data-testid": `preview-mode-${entry.mode}`,
								onClick: () => {
									setMode(active.path, entry.mode);
								},
								children: t(entry.key)
							}, entry.mode)),
							editable && (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: PreviewPane_module_css_default.save,
								disabled: !dirty,
								"data-testid": "preview-save",
								onClick: () => {
									save(active);
								},
								children: t("preview.save")
							}),
							active.truncated && (0, react_jsx_runtime.jsx)("span", {
								className: PreviewPane_module_css_default.notice,
								children: t("preview.truncated")
							})
						]
					}),
					active.error !== void 0 && (0, react_jsx_runtime.jsx)("p", {
						className: PreviewPane_module_css_default.error,
						"data-testid": "preview-error",
						children: t("preview.error", { message: active.error })
					}),
					saveError !== null && (0, react_jsx_runtime.jsx)("p", {
						className: PreviewPane_module_css_default.error,
						children: t("preview.error", { message: saveError })
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: PreviewPane_module_css_default.body,
						"data-mode": active.mode,
						children: [
							(active.mode === "source" || active.mode === "split") && editable && (0, react_jsx_runtime.jsx)("textarea", {
								className: PreviewPane_module_css_default.editor,
								value: body,
								spellCheck: false,
								"data-testid": "preview-editor",
								onChange: (event) => {
									setDraft(active.path, event.target.value);
								}
							}),
							(active.mode === "source" || active.mode === "split") && !editable && (0, react_jsx_runtime.jsx)("pre", {
								className: PreviewPane_module_css_default.source,
								children: body
							}),
							(active.mode === "view" || active.mode === "split") && (0, react_jsx_runtime.jsx)("div", {
								className: PreviewPane_module_css_default.view,
								"data-testid": "preview-view",
								children: (0, react_jsx_runtime.jsx)(RenderedForm, {
									tab: active,
									text: body,
									unsupported: t("preview.unsupported")
								})
							})
						]
					})
				]
			});
		}
		/** The rendered (non-source) form of one tab. */
		function RenderedForm({ tab, text, unsupported }) {
			switch (tab.kind) {
				case "markdown": return (0, react_jsx_runtime.jsx)(MarkdownView, { source: text });
				case "csv": return (0, react_jsx_runtime.jsx)(TableView, { rows: parseDelimited(text, extensionOf(tab.path) === "tsv" ? "	" : ",") });
				case "diff": return (0, react_jsx_runtime.jsx)(DiffView, { source: text });
				case "html": return (0, react_jsx_runtime.jsx)("iframe", {
					className: PreviewPane_module_css_default.frame,
					sandbox: "",
					srcDoc: text,
					title: tab.name
				});
				case "image": {
					const src = dataUrlOf(tab);
					return src === void 0 ? (0, react_jsx_runtime.jsx)("p", {
						className: PreviewPane_module_css_default.empty,
						children: unsupported
					}) : (0, react_jsx_runtime.jsx)("img", {
						className: PreviewPane_module_css_default.image,
						src,
						alt: tab.name
					});
				}
				case "pdf": {
					const src = dataUrlOf(tab);
					return src === void 0 ? (0, react_jsx_runtime.jsx)("p", {
						className: PreviewPane_module_css_default.empty,
						children: unsupported
					}) : (0, react_jsx_runtime.jsx)("object", {
						className: PreviewPane_module_css_default.frame,
						data: src,
						type: "application/pdf",
						"aria-label": tab.name
					});
				}
				case "office": return tab.office === void 0 ? (0, react_jsx_runtime.jsx)("p", {
					className: PreviewPane_module_css_default.empty,
					children: unsupported
				}) : (0, react_jsx_runtime.jsx)(OfficeView, { blocks: tab.office.blocks });
				case "code":
				case "text": return (0, react_jsx_runtime.jsx)("pre", {
					className: PreviewPane_module_css_default.source,
					children: text
				});
			}
		}
		/** Inline spans as React elements. */
		function Spans({ spans }) {
			return spans.map((span, index) => {
				switch (span.type) {
					case "code": return (0, react_jsx_runtime.jsx)("code", {
						className: PreviewPane_module_css_default.inlineCode,
						children: span.text
					}, index);
					case "strong": return (0, react_jsx_runtime.jsx)("strong", { children: span.text }, index);
					case "em": return (0, react_jsx_runtime.jsx)("em", { children: span.text }, index);
					case "del": return (0, react_jsx_runtime.jsx)("del", { children: span.text }, index);
					case "break": return (0, react_jsx_runtime.jsx)("br", {}, index);
					case "image": return (0, react_jsx_runtime.jsx)("img", {
						className: PreviewPane_module_css_default.inlineImage,
						src: span.href,
						alt: span.text
					}, index);
					case "link": return (0, react_jsx_runtime.jsx)("a", {
						href: span.href,
						target: "_blank",
						rel: "noreferrer noopener",
						children: span.text
					}, index);
					case "text": return (0, react_jsx_runtime.jsx)("span", { children: span.text }, index);
				}
			});
		}
		/** A parsed Markdown or HTML table, with its per-column alignment. */
		function MarkdownTable({ block }) {
			return (0, react_jsx_runtime.jsxs)("table", {
				className: PreviewPane_module_css_default.table,
				children: [block.header.length > 0 && (0, react_jsx_runtime.jsx)("thead", { children: (0, react_jsx_runtime.jsx)("tr", { children: block.header.map((cell, index) => (0, react_jsx_runtime.jsx)("th", {
					style: block.align[index] === void 0 ? void 0 : { textAlign: block.align[index] },
					children: (0, react_jsx_runtime.jsx)(Spans, { spans: cell })
				}, index)) }) }), (0, react_jsx_runtime.jsx)("tbody", { children: block.rows.map((row, rowIndex) => (0, react_jsx_runtime.jsx)("tr", { children: row.map((cell, index) => (0, react_jsx_runtime.jsx)("td", {
					style: block.align[index] === void 0 ? void 0 : { textAlign: block.align[index] },
					children: (0, react_jsx_runtime.jsx)(Spans, { spans: cell })
				}, index)) }, rowIndex)) })]
			});
		}
		/** Structural Markdown rendering. */
		function MarkdownView({ source }) {
			return (0, react_jsx_runtime.jsx)("div", {
				className: PreviewPane_module_css_default.markdown,
				children: parseMarkdown(source).map((block, index) => {
					switch (block.type) {
						case "heading": {
							const Tag = `h${String(Math.min(block.level, 6))}`;
							return (0, react_jsx_runtime.jsx)(Tag, { children: (0, react_jsx_runtime.jsx)(Spans, { spans: block.spans }) }, index);
						}
						case "paragraph": return (0, react_jsx_runtime.jsx)("p", { children: (0, react_jsx_runtime.jsx)(Spans, { spans: block.spans }) }, index);
						case "code": return (0, react_jsx_runtime.jsx)("pre", {
							className: PreviewPane_module_css_default.codeBlock,
							"data-lang": block.lang,
							children: (0, react_jsx_runtime.jsx)("code", { children: block.code })
						}, index);
						case "quote": return (0, react_jsx_runtime.jsx)("blockquote", { children: (0, react_jsx_runtime.jsx)(Spans, { spans: block.spans }) }, index);
						case "rule": return (0, react_jsx_runtime.jsx)("hr", {}, index);
						case "table": return (0, react_jsx_runtime.jsx)(MarkdownTable, { block }, index);
						case "list": {
							const Tag = block.ordered ? "ol" : "ul";
							return (0, react_jsx_runtime.jsx)(Tag, { children: block.items.map((item, itemIndex) => (0, react_jsx_runtime.jsx)("li", { children: (0, react_jsx_runtime.jsx)(Spans, { spans: item }) }, itemIndex)) }, index);
						}
					}
				})
			});
		}
		/** Delimited rows as a table; the first row is the header. */
		function TableView({ rows }) {
			if (rows.length === 0) return null;
			const [header, ...body] = rows;
			return (0, react_jsx_runtime.jsxs)("table", {
				className: PreviewPane_module_css_default.table,
				children: [(0, react_jsx_runtime.jsx)("thead", { children: (0, react_jsx_runtime.jsx)("tr", { children: header.map((cell, index) => (0, react_jsx_runtime.jsx)("th", { children: cell }, index)) }) }), (0, react_jsx_runtime.jsx)("tbody", { children: body.map((row, rowIndex) => (0, react_jsx_runtime.jsx)("tr", { children: row.map((cell, index) => (0, react_jsx_runtime.jsx)("td", { children: cell }, index)) }, rowIndex)) })]
			});
		}
		/** Unified diff with per-line classes. */
		function DiffView({ source }) {
			return (0, react_jsx_runtime.jsx)("pre", {
				className: PreviewPane_module_css_default.diff,
				children: source.split(/\r?\n/u).map((line, index) => (0, react_jsx_runtime.jsx)("span", {
					className: PreviewPane_module_css_default.diffLine,
					"data-kind": diffLineKind(line),
					children: line === "" ? " " : line
				}, index))
			});
		}
		/** Office conversion blocks from the host. */
		function OfficeView({ blocks }) {
			return (0, react_jsx_runtime.jsx)("div", {
				className: PreviewPane_module_css_default.markdown,
				children: blocks.map((block, index) => {
					if (block.type === "table") return (0, react_jsx_runtime.jsx)(TableView, { rows: block.rows }, index);
					switch (block.type) {
						case "h1": return (0, react_jsx_runtime.jsx)("h1", { children: block.text }, index);
						case "h2": return (0, react_jsx_runtime.jsx)("h2", { children: block.text }, index);
						case "h3": return (0, react_jsx_runtime.jsx)("h3", { children: block.text }, index);
						case "li": return (0, react_jsx_runtime.jsx)("li", { children: block.text }, index);
						case "p": return (0, react_jsx_runtime.jsx)("p", { children: block.text }, index);
					}
				})
			});
		}
		//#endregion
		//#region \0dsh-css:D:\Documents\Dev-Repo\deepseek-harness\dsh-plugins\dsh-web-enhanced\src\client\panel\ScmPane.module.css.mjs
		const css$2 = ".AjjPzG_pane{flex-direction:column;display:flex}.AjjPzG_toolbar{justify-content:flex-end;padding:6px 8px;display:flex}.AjjPzG_group{padding-bottom:6px}.AjjPzG_groupTitle{opacity:.75;text-transform:uppercase;align-items:center;gap:6px;margin:0;padding:4px 10px;font-size:11px;font-weight:600;display:flex}.AjjPzG_count{background:#8080a03d;border-radius:8px;padding:0 6px;font-size:10px}.AjjPzG_list{margin:0;padding:0;list-style:none}.AjjPzG_row{align-items:center;gap:4px;padding:2px 8px;display:flex}.AjjPzG_row:hover{background:#8080a029}.AjjPzG_name{min-width:0;color:inherit;cursor:pointer;text-align:start;background:0 0;border:none;flex:1;align-items:center;gap:6px;padding:2px 0;font-size:12px;display:flex}.AjjPzG_code{text-align:center;opacity:.8;flex:none;width:12px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:11px}.AjjPzG_code[data-code=M]{color:#d9a441}.AjjPzG_code[data-code=A]{color:#4caf72}.AjjPzG_code[data-code=D]{color:#d9534f}.AjjPzG_code[data-code=R]{color:#6a8fd8}.AjjPzG_code[data-code=\\?]{color:#9a9a9a}.AjjPzG_label{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.AjjPzG_action,.AjjPzG_danger{color:inherit;cursor:pointer;opacity:.75;background:0 0;border:none;flex:none;padding:2px 5px;font-size:11px}.AjjPzG_action:hover{opacity:1}.AjjPzG_danger{color:#d9534f}.AjjPzG_danger:hover{opacity:1}.AjjPzG_empty,.AjjPzG_error{opacity:.7;margin:12px;font-size:12px}.AjjPzG_error{color:#d9534f;opacity:1}";
		const tagId$2 = "dsh-web-enhanced/ScmPane.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var ScmPane_module_css_default = {
			"action": "AjjPzG_action",
			"code": "AjjPzG_code",
			"count": "AjjPzG_count",
			"danger": "AjjPzG_danger",
			"empty": "AjjPzG_empty",
			"error": "AjjPzG_error",
			"group": "AjjPzG_group",
			"groupTitle": "AjjPzG_groupTitle",
			"label": "AjjPzG_label",
			"list": "AjjPzG_list",
			"name": "AjjPzG_name",
			"pane": "AjjPzG_pane",
			"row": "AjjPzG_row",
			"toolbar": "AjjPzG_toolbar"
		};
		//#endregion
		//#region lib/types/client/panel/ScmPane.js
		/**
		* SCM pane: the real git working-tree status, split into staged and unstaged
		* groups, with stage / unstage / discard per entry and a diff preview on
		* click. Discarding is irreversible, so it asks first.
		* @module dsh-web-enhanced/src/client/panel/ScmPane
		*/
		/** Whether an entry has staged content (its index column is meaningful). */
		function isStaged(entry) {
			return entry.staged !== " " && entry.staged !== "?";
		}
		/** Whether an entry has unstaged worktree content. */
		function isUnstaged(entry) {
			return entry.unstaged !== " " || entry.staged === "?";
		}
		/** The SCM pane. */
		function ScmPane({ workspaceId, remote, openTab, selectTab, t }) {
			const [status, setStatus] = (0, react.useState)({ phase: "loading" });
			const live = (0, react.useRef)(true);
			(0, react.useEffect)(() => () => {
				live.current = false;
			}, []);
			const reload = (0, react.useCallback)(async () => {
				const result = await remote.gitStatus({ workspaceId });
				if (!live.current) return;
				setStatus("error" in result ? {
					phase: "error",
					message: result.error.message
				} : {
					phase: "ready",
					entries: result.entries
				});
			}, [remote, workspaceId]);
			(0, react.useEffect)(() => {
				setStatus({ phase: "loading" });
				reload();
			}, [reload]);
			const mutate = (0, react.useCallback)(async (call) => {
				const result = await call;
				if (!live.current) return;
				const message = errorMessageOf(result);
				if (message !== void 0) {
					setStatus({
						phase: "error",
						message
					});
					return;
				}
				await reload();
			}, [reload]);
			/** Open one entry's diff as a preview tab. */
			const showDiff = (0, react.useCallback)(async (entry, staged) => {
				const result = await remote.gitDiff({
					workspaceId,
					path: entry.path,
					staged
				});
				if (!live.current) return;
				const text = "error" in result ? "" : result.text;
				const error = "error" in result ? result.error.message : void 0;
				openTab({
					path: `${entry.path}.diff`,
					name: `${baseNameOf(entry.path)} (diff)`,
					kind: "diff",
					mode: "view",
					content: text,
					truncated: false,
					size: text.length,
					...error === void 0 ? {} : { error }
				});
				selectTab("preview");
			}, [
				openTab,
				remote,
				selectTab,
				workspaceId
			]);
			if (status.phase === "loading") return (0, react_jsx_runtime.jsx)("p", {
				className: ScmPane_module_css_default.empty,
				children: t("board.loading")
			});
			if (status.phase === "error") return (0, react_jsx_runtime.jsx)("p", {
				className: ScmPane_module_css_default.error,
				children: t("scm.error", { message: status.message })
			});
			const staged = status.entries.filter(isStaged);
			const unstaged = status.entries.filter(isUnstaged);
			if (staged.length === 0 && unstaged.length === 0) return (0, react_jsx_runtime.jsx)("p", {
				className: ScmPane_module_css_default.empty,
				"data-testid": "scm-clean",
				children: t("scm.empty")
			});
			const row = (entry, group) => (0, react_jsx_runtime.jsxs)("li", {
				className: ScmPane_module_css_default.row,
				"data-testid": `scm-row-${entry.path}`,
				children: [(0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: ScmPane_module_css_default.name,
					title: entry.path,
					onClick: () => {
						showDiff(entry, group === "staged");
					},
					children: [(0, react_jsx_runtime.jsx)("span", {
						className: ScmPane_module_css_default.code,
						"data-code": group === "staged" ? entry.staged : entry.unstaged,
						children: group === "staged" ? entry.staged : entry.unstaged
					}), (0, react_jsx_runtime.jsx)("span", {
						className: ScmPane_module_css_default.label,
						children: entry.origPath === void 0 ? entry.path : t("scm.renamed", {
							from: entry.origPath,
							to: entry.path
						})
					})]
				}), group === "staged" ? (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: ScmPane_module_css_default.action,
					"data-testid": `scm-unstage-${entry.path}`,
					onClick: () => {
						mutate(remote.gitUnstage({
							workspaceId,
							paths: [entry.path]
						}));
					},
					children: t("scm.unstage")
				}) : (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: ScmPane_module_css_default.action,
					"data-testid": `scm-stage-${entry.path}`,
					onClick: () => {
						mutate(remote.gitStage({
							workspaceId,
							paths: [entry.path]
						}));
					},
					children: t("scm.stage")
				}), (0, react_jsx_runtime.jsx)("button", {
					type: "button",
					className: ScmPane_module_css_default.danger,
					"data-testid": `scm-discard-${entry.path}`,
					onClick: () => {
						mutate(remote.gitDiscard({
							workspaceId,
							paths: [entry.path]
						}));
					},
					children: t("scm.discard")
				})] })]
			}, `${group}-${entry.path}`);
			return (0, react_jsx_runtime.jsxs)("div", {
				className: ScmPane_module_css_default.pane,
				"data-testid": "scm-pane",
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						className: ScmPane_module_css_default.toolbar,
						children: (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: ScmPane_module_css_default.action,
							"data-testid": "scm-refresh",
							onClick: () => {
								reload();
							},
							children: t("scm.refresh")
						})
					}),
					staged.length > 0 && (0, react_jsx_runtime.jsxs)("section", {
						className: ScmPane_module_css_default.group,
						children: [(0, react_jsx_runtime.jsxs)("h4", {
							className: ScmPane_module_css_default.groupTitle,
							children: [t("scm.staged"), (0, react_jsx_runtime.jsx)("span", {
								className: ScmPane_module_css_default.count,
								children: staged.length
							})]
						}), (0, react_jsx_runtime.jsx)("ul", {
							className: ScmPane_module_css_default.list,
							children: staged.map((entry) => row(entry, "staged"))
						})]
					}),
					unstaged.length > 0 && (0, react_jsx_runtime.jsxs)("section", {
						className: ScmPane_module_css_default.group,
						children: [(0, react_jsx_runtime.jsxs)("h4", {
							className: ScmPane_module_css_default.groupTitle,
							children: [t("scm.changes"), (0, react_jsx_runtime.jsx)("span", {
								className: ScmPane_module_css_default.count,
								children: unstaged.length
							})]
						}), (0, react_jsx_runtime.jsx)("ul", {
							className: ScmPane_module_css_default.list,
							children: unstaged.map((entry) => row(entry, "unstaged"))
						})]
					})
				]
			});
		}
		//#endregion
		//#region \0dsh-css:D:\Documents\Dev-Repo\deepseek-harness\dsh-plugins\dsh-web-enhanced\src\client\panel\WorkspaceView.module.css.mjs
		const css$1 = ".ifAxLG_view{flex-direction:column;height:100%;min-height:0;display:flex}.ifAxLG_tabs{border-bottom:1px solid var(--dsw-alias-border-l1,#8080803d);flex:none;gap:4px;padding:6px 12px;display:flex}.ifAxLG_tab{color:inherit;cursor:pointer;opacity:.7;background:0 0;border:none;border-radius:5px;padding:4px 10px;font-size:12px}.ifAxLG_tab:hover{opacity:1}.ifAxLG_tab[data-active]{background:var(--dsw-alias-interactive-bg-hover,#8080a038);opacity:1}.ifAxLG_body{flex:1;min-height:0;overflow:auto}.ifAxLG_empty{opacity:.7;text-align:center;margin:24px auto;font-size:12px}";
		const tagId$1 = "dsh-web-enhanced/WorkspaceView.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var WorkspaceView_module_css_default = {
			"body": "ifAxLG_body",
			"empty": "ifAxLG_empty",
			"tab": "ifAxLG_tab",
			"tabs": "ifAxLG_tabs",
			"view": "ifAxLG_view"
		};
		//#endregion
		//#region lib/types/client/panel/WorkspaceView.js
		/**
		* Workspace view: file tree, preview, and SCM for the session's project,
		* registered as one tab in the conversation's view ring beside Chat and
		* Trajectory.
		*
		* It lives in `conversation.view` rather than floating over the frame. The
		* view ring renders one entry at a time at full column width, so this surface
		* owns no geometry — no docking, no drag-to-resize, no collapse. Those belong
		* to the frame, and a tab that tried to own them would fight it.
		* @module dsh-web-enhanced/src/client/panel/WorkspaceView
		*/
		/** Tabs in display order with their dictionary keys. */
		const TABS = [
			{
				tab: "files",
				key: "panel.tab.files"
			},
			{
				tab: "preview",
				key: "panel.tab.preview"
			},
			{
				tab: "scm",
				key: "panel.tab.scm"
			}
		];
		/** The workspace view. */
		function WorkspaceView(props) {
			const { sessionId, usePanel, useWorkspaces, selectTab, clearTabs, t } = props;
			const workspaceId = workspaceOfSessionId(sessionId, useWorkspaces((state) => state))?.workspaceId;
			const tab = usePanel((state) => state.tab);
			const lastWorkspace = (0, react.useRef)(workspaceId);
			(0, react.useEffect)(() => {
				if (lastWorkspace.current === workspaceId) return;
				lastWorkspace.current = workspaceId;
				clearTabs();
			}, [clearTabs, workspaceId]);
			if (workspaceId === void 0) return (0, react_jsx_runtime.jsx)("p", {
				className: WorkspaceView_module_css_default.empty,
				"data-testid": "workspace-view-no-project",
				children: t("panel.noWorkspace")
			});
			return (0, react_jsx_runtime.jsxs)("section", {
				className: WorkspaceView_module_css_default.view,
				"data-testid": "workspace-view",
				children: [(0, react_jsx_runtime.jsx)("nav", {
					className: WorkspaceView_module_css_default.tabs,
					role: "tablist",
					children: TABS.map((entry) => (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						role: "tab",
						className: WorkspaceView_module_css_default.tab,
						"data-active": tab === entry.tab || void 0,
						"aria-selected": tab === entry.tab,
						"data-testid": `workspace-view-tab-${entry.tab}`,
						onClick: () => {
							selectTab(entry.tab);
						},
						children: t(entry.key)
					}, entry.tab))
				}), (0, react_jsx_runtime.jsxs)("div", {
					className: WorkspaceView_module_css_default.body,
					role: "tabpanel",
					children: [
						tab === "files" && (0, react_jsx_runtime.jsx)(FileTree, {
							...props,
							workspaceId
						}),
						tab === "preview" && (0, react_jsx_runtime.jsx)(PreviewPane, {
							...props,
							workspaceId
						}),
						tab === "scm" && (0, react_jsx_runtime.jsx)(ScmPane, {
							...props,
							workspaceId
						})
					]
				})]
			});
		}
		//#endregion
		//#region \0dsh-css:D:\Documents\Dev-Repo\deepseek-harness\dsh-plugins\dsh-web-enhanced\src\client\balance\BalanceLine.module.css.mjs
		const css = ".cMdddW_line{opacity:.85;align-items:center;gap:8px;padding:2px 12px;font-size:11px;display:flex}.cMdddW_label{opacity:.7}.cMdddW_value{font-variant-numeric:tabular-nums}.cMdddW_error{color:#d9534f}.cMdddW_refresh{color:inherit;cursor:pointer;opacity:.8;background:0 0;border:none;padding:0;font-size:11px}.cMdddW_refresh:disabled{cursor:default;opacity:.4}.cMdddW_refresh:hover:not(:disabled){opacity:1}";
		const tagId = "dsh-web-enhanced/BalanceLine.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var BalanceLine_module_css_default = {
			"error": "cMdddW_error",
			"label": "cMdddW_label",
			"line": "cMdddW_line",
			"refresh": "cMdddW_refresh",
			"value": "cMdddW_value"
		};
		//#endregion
		//#region lib/types/client/balance/BalanceLine.js
		/**
		* Balance line under the composer: the DeepSeek account balance from the host
		* remote, with a refresh affordance and a muted error state. The host caches
		* the view, so mounting several sessions does not fan out to the endpoint.
		*
		* The line is tied to the session's model route. The endpoint serves ONE
		* account at one vendor, so a session switched to another channel gets no line
		* at all rather than a number about somebody else's account — the host makes
		* that call (it knows where each route points) and answers `applicable`.
		* @module dsh-web-enhanced/src/client/balance/BalanceLine
		*/
		/** Format one balance line as `CNY 12.34`. */
		function summaryOf(view) {
			return view.infos.map((info) => `${info.currency} ${info.totalBalance.toFixed(2)}`).join(" · ");
		}
		/** The session's live provider route, re-read whenever the selection moves. */
		function useProvider(modelRoute, sessionId) {
			const subscribe = (0, react.useMemo)(() => (listener) => modelRoute.subscribe(sessionId, listener), [modelRoute, sessionId]);
			const read = (0, react.useCallback)(() => modelRoute.provider(sessionId), [modelRoute, sessionId]);
			return (0, react.useSyncExternalStore)(subscribe, read, read);
		}
		/** The balance line: one muted row under the composer. */
		function BalanceLine({ remote, modelRoute, sessionId, t }) {
			const [view, setView] = (0, react.useState)(null);
			const [busy, setBusy] = (0, react.useState)(false);
			const provider = useProvider(modelRoute, String(sessionId));
			const live = (0, react.useRef)(true);
			(0, react.useEffect)(() => () => {
				live.current = false;
			}, []);
			const refresh = (0, react.useCallback)(async () => {
				setBusy(true);
				try {
					const next = await remote.balanceGet(provider === void 0 ? {} : { provider });
					if (live.current) setView(next);
				} finally {
					if (live.current) setBusy(false);
				}
			}, [provider, remote]);
			(0, react.useEffect)(() => {
				refresh();
			}, [refresh]);
			if (view === null || !view.applicable) return null;
			const summary = summaryOf(view);
			return (0, react_jsx_runtime.jsxs)("div", {
				className: BalanceLine_module_css_default.line,
				"data-testid": "balance-line",
				children: [
					(0, react_jsx_runtime.jsx)("span", {
						className: BalanceLine_module_css_default.label,
						children: t("balance.title")
					}),
					view.error === void 0 ? (0, react_jsx_runtime.jsx)("span", {
						className: BalanceLine_module_css_default.value,
						"data-testid": "balance-value",
						children: summary === "" ? "—" : summary
					}) : (0, react_jsx_runtime.jsx)("span", {
						className: BalanceLine_module_css_default.error,
						"data-testid": "balance-error",
						children: t("balance.error", { message: view.error.message })
					}),
					(0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: BalanceLine_module_css_default.refresh,
						disabled: busy,
						onClick: () => {
							refresh();
						},
						children: t("balance.refresh")
					})
				]
			});
		}
		//#endregion
		//#region lib/types/client/index.js
		/**
		* Web-enhanced client plugin: the slot assembly.
		*
		* Where each surface lands and why:
		* - `sidebar.footer.action` — the task-board and git-graph ENTRY buttons only.
		* - `shell.overlay` — the board, the graph, and the right panel themselves.
		*   It is the frame-wide floating layer: above every column, outside their
		*   scroll containers, additive (a list slot), and click-through until an
		*   entry opts into pointer events. The alternative, `details`, is a `single`
		*   slot already occupied by ui-conversation's DetailsPanel — registering
		*   there would REPLACE the tool-details column rather than add to it.
		* - `conversation.input.dock` — the branch strip (above the composer).
		* - `conversation.composer.dock` — the balance line (below the composer).
		*
		* Shared state lives in `apply` as plain observables and reaches components
		* through each registration's inject `hooks` compartment; a slot store handle
		* could not, because these surfaces span the `root` and `session` scopes.
		* @module dsh-web-enhanced/src/client
		*/
		/** Locale namespace owned by this plugin. */
		const NS = "webEnhanced";
		/**
		* Register the file and folder mention pickers into the composer's `+` menu.
		*
		* A no-op disposer when the deployment composes no command menu — the rest of
		* this plugin does not depend on one.
		* @param ctx - client root context.
		* @param remote - the envelope-free host facade.
		* @returns the disposer.
		*/
		function registerMentionCommands(ctx, remote) {
			const commandUi = ctx.get("commandUi");
			if (commandUi === void 0) return () => {};
			const t = ctx.locale.bind(NS);
			const deps = {
				remote,
				workspaceOf: (sessionId) => workspaceOfSessionId(sessionId, ctx.workspaces.list.getSnapshot())?.workspaceId,
				appendDraft: (sessionId, text) => {
					const conversation = ctx.get("conversation");
					const actx = ctx.sessions.scope(sessionId);
					if (conversation === void 0 || actx === void 0) return;
					const input = conversation.input.for(actx);
					const draft = input.state.getSnapshot().draft;
					input.setDraft(draft === "" || /\s$/u.test(draft) ? draft + text : `${draft} ${text}`);
				}
			};
			const picker = (kind, name, description) => commandUi.register({
				name,
				description,
				available: (session) => deps.workspaceOf(String(session.sessionId)) !== void 0,
				ui: {
					kind: "popupSelect",
					options: (session) => mentionOptions(deps, kind, String(session.sessionId)),
					onSelect: (option, session) => {
						applyMention(deps, String(session.sessionId), option.id);
					}
				}
			});
			const disposers = [picker("file", "mention-file", t("mention.fileDescription")), picker("dir", "mention-folder", t("mention.folderDescription"))];
			return () => {
				for (const dispose of disposers.reverse()) dispose();
			};
		}
		/**
		* Services this client plugin requires.
		*
		* Deliberately no `remote.webEnhanced`: that namespace is mounted by this
		* plugin's own apply through `ctx.remote.$mount`, so declaring it here would
		* deadlock the entry waiting for a service only its own apply can create.
		*/
		const inject = [
			"slots",
			"locale",
			"remote",
			"sessions",
			"workspaces"
		];
		/**
		* Mount the web-enhanced registrations.
		*
		* Registrations start only after the remote mount settles: the namespace
		* service lives on the api-gateway fiber, never on this plugin's inject
		* chain, so it is read through the untyped store accessor — a direct
		* `ctx.remote.webEnhanced` access would trip Cordis' inject check.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			ctx.effect(() => ctx.locale.register(NS, {
				zh,
				en
			}), "web-enhanced: dictionaries");
			const overlay = createOverlay();
			const panel = createPanel();
			const preview = createPreview();
			const modelRoute = createModelRoute({ directories: () => ctx.get("modelDirectories") });
			ctx.effect(() => {
				const disposers = [];
				ctx.remote.$mount(webEnhancedRemote).then((disposeMount) => {
					disposers.push(disposeMount);
					const mounted = ctx.get("remote.webEnhanced", false);
					if (mounted === void 0) {
						console.error("[web-enhanced] remote.webEnhanced unavailable after $mount");
						return;
					}
					const remote = createRemoteFacade(mounted);
					const face = () => ({
						remote,
						modelRoute,
						openSession: (sessionId) => {
							ctx.sessions.open(sessionId);
						},
						hooks: {
							overlay: overlay.cell,
							panel: panel.cell,
							preview: preview.cell
						},
						...overlay.actions,
						...panel.actions,
						...preview.actions
					});
					disposers.push(ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
						name: "sidebar.footer.action",
						id: "web-enhanced-board",
						order: 10,
						locale: NS,
						inject: face
					}, BoardSidebarEntry)), ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
						name: "sidebar.footer.action",
						id: "web-enhanced-graph",
						order: 20,
						locale: NS,
						inject: face
					}, GraphSidebarEntry)), ctx.slots.inject("shell.overlay", () => ctx.slots.register({
						name: "shell.overlay",
						id: "web-enhanced-board-overlay",
						order: 10,
						locale: NS,
						inject: face
					}, BoardOverlay)), ctx.slots.inject("shell.overlay", () => ctx.slots.register({
						name: "shell.overlay",
						id: "web-enhanced-graph-overlay",
						order: 20,
						locale: NS,
						inject: face
					}, GraphOverlay)), ctx.slots.inject("conversation.view", () => ctx.slots.register({
						name: "conversation.view",
						id: "web-enhanced-workspace",
						order: 30,
						locale: NS,
						label: () => ctx.locale.bind(NS)("view.workspace"),
						inject: face
					}, WorkspaceView)), ctx.slots.inject("conversation.input.dock", () => ctx.slots.register({
						name: "conversation.input.dock",
						id: "web-enhanced-branch",
						order: 10,
						locale: NS,
						inject: face
					}, BranchStrip)), ctx.slots.inject("conversation.composer.dock", () => ctx.slots.register({
						name: "conversation.composer.dock",
						id: "web-enhanced-balance",
						order: 10,
						locale: NS,
						inject: face
					}, BalanceLine)), registerMentionCommands(ctx, remote));
				}, (error) => {
					console.error("[web-enhanced] remote mount failed:", error);
				});
				return () => {
					for (const dispose of disposers.reverse()) dispose();
				};
			}, "web-enhanced: remote mount + registrations");
		}
		//#endregion
		exports.apply = apply;
		exports.createOverlay = createOverlay;
		exports.createPanel = createPanel;
		exports.createPreview = createPreview;
		exports.inject = inject;
		exports.workspaceOfSession = workspaceOfSession;
		return module.exports;
	}
});
