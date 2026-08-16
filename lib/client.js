window.__ModuleLoader__.load({
	id: "dsh-web-enhanced",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let _deepseek_ai_dsh_client_web_react = require("@deepseek-ai/dsh-client-web-react");
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		let _deepseek_ai_dsh_client_schema_form = require("@deepseek-ai/dsh-client-schema-form");
		let _deepseek_ai_dsh_client_runtime_client = require("@deepseek-ai/dsh-client-runtime/client");
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
		const encode$1 = /* @__PURE__ */ _encode(ZodRealError);
		const decode$1 = /* @__PURE__ */ _decode(ZodRealError);
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
			inst.encode = (data, params) => encode$1(inst, data, params);
			inst.decode = (data, params) => decode$1(inst, data, params);
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
		const gitWorkingSchema = object({
			head: string(),
			files: array(object({
				path: string(),
				state: _enum([
					"staged",
					"unstaged",
					"untracked"
				]),
				added: number().nullable(),
				removed: number().nullable()
			})),
			staged: number(),
			unstaged: number(),
			untracked: number(),
			truncated: boolean()
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
		const pluginViewSchema = object({
			name: string(),
			spec: string(),
			version: string().nullable(),
			description: string().nullable(),
			bundle: boolean(),
			active: boolean(),
			self: boolean()
		});
		const pluginListSchema = object({
			profileDir: string(),
			profileName: string(),
			plugins: array(pluginViewSchema),
			templateBundles: array(string()),
			busy: boolean()
		});
		const pluginMutateSchema = object({
			ok: boolean(),
			added: array(string()),
			removed: array(string()),
			restartRequired: boolean(),
			output: string()
		});
		/** The live vision-integration status, shared by two endpoints. */
		const visionStatusSchema = object({
			mounted: boolean(),
			enabled: boolean(),
			patchAdmission: boolean(),
			admissionActive: boolean(),
			harnessModels: array(object({
				provider: string(),
				model: string()
			})),
			endpointConfigured: boolean(),
			endpointModel: string().nullable(),
			apiKeySource: _enum([
				"config",
				"env",
				"none-needed",
				"unset"
			]),
			ollamaDetected: boolean(),
			ollamaModel: string().nullable(),
			cacheSize: number(),
			lastError: string().nullable(),
			failures: array(object({
				time: number(),
				source: _enum([
					"dsh",
					"ollama",
					"endpoint"
				]),
				label: string(),
				message: string()
			}))
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
				unary("pricingGet", "PricingGetRequest", "PricingGetResult", okOrError(object({
					provider: string(),
					model: string(),
					pricing: object({
						input: number(),
						output: number(),
						cacheRead: number().nullable(),
						cacheWrite: number().nullable()
					})
				}))),
				nullary("visionStatus", "VisionStatusResult", okOrError(visionStatusSchema)),
				nullary("visionConfigGet", "VisionConfigGetResult", okOrError(object({
					managed: boolean(),
					writable: boolean(),
					revision: number().nullable(),
					enabled: boolean(),
					patchAdmission: boolean(),
					provider: string(),
					model: string(),
					harnessModels: array(object({
						provider: string(),
						model: string()
					})),
					prompt: string(),
					marker: string(),
					baseUrl: string(),
					apiKeySet: boolean(),
					apiKeyEnv: string(),
					endpointModel: string(),
					endpointModels: array(string()),
					anonymous: boolean(),
					timeoutMs: number(),
					maxTokens: number(),
					autoLocalOllama: boolean(),
					localOllamaModel: string(),
					localOllamaUrl: string(),
					fallbackCount: number(),
					cacheLimit: number(),
					cooldownMs: number(),
					providers: array(object({
						provider: string(),
						name: string(),
						models: array(object({
							id: string(),
							name: string(),
							supportsImage: boolean()
						}))
					})),
					status: visionStatusSchema
				}))),
				unary("visionConfigSet", "VisionConfigSaveRequest", "VisionConfigSetResult", okOrError(object({
					ok: literal(true),
					revision: number()
				}))),
				unary("visionEndpointModels", "VisionEndpointModelsRequest", "VisionEndpointModelsResult", okOrError(object({
					baseUrl: string(),
					models: array(object({
						id: string(),
						name: string()
					})),
					truncated: boolean()
				}))),
				nullary("modelRetryGet", "ModelRetryGetResult", okOrError(object({ config: object({
					provider: literal("deepseek-official"),
					managed: boolean(),
					writable: boolean(),
					revision: number().nullable(),
					mode: _enum(["normal", "always"]),
					maxRetries: number().nullable(),
					initialDelayMs: number(),
					maxDelayMs: number(),
					jitterRatio: number()
				}) }))),
				unary("modelRetrySet", "ModelRetrySetRequest", "ModelRetrySetResult", okOrError(object({
					ok: literal(true),
					revision: number()
				}))),
				unary("gitBranches", "GitBranchesRequest", "GitBranchesResult", okOrError(object({ branches: array(gitBranchViewSchema) }))),
				unary("gitLog", "GitLogRequest", "GitLogResult", okOrError(object({ commits: array(gitCommitViewSchema) }))),
				unary("gitCommit", "GitCommitRequest", "GitCommitResult", okOrError(object({ commit: gitCommitDetailSchema }))),
				unary("gitWorking", "GitWorkingRequest", "GitWorkingResult", okOrError(object({ working: gitWorkingSchema }))),
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
				unary("fsOfficePreview", "FsOfficePreviewRequest", "FsOfficePreviewResult", okOrError(officePreviewSchema)),
				unary("fsBrowse", "FsBrowseRequest", "FsBrowseResult", okOrError(object({
					path: string(),
					parent: string().nullable(),
					home: string(),
					roots: array(string()),
					entries: array(object({
						name: string(),
						path: string(),
						kind: _enum(["file", "dir"]),
						size: number().optional()
					})),
					truncated: boolean()
				}))),
				unary("pluginList", "PluginListRequest", "PluginListResult", okOrError(pluginListSchema)),
				unary("pluginRemove", "PluginMutateRequest", "PluginMutateResult", okOrError(pluginMutateSchema)),
				unary("pluginUpdate", "PluginMutateRequest", "PluginMutateResult", okOrError(pluginMutateSchema))
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
			"board.expand": "展开任务详情",
			"board.collapse": "折叠任务详情",
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
			"graph.working.title": "未提交的改动",
			"graph.working.counts": "暂存 {staged} · 未暂存 {unstaged} · 未跟踪 {untracked}",
			"graph.working.staged": "暂存",
			"graph.working.unstaged": "未暂存",
			"graph.working.untracked": "未跟踪",
			"graph.working.truncated": "文件过多，仅显示前 {count} 个",
			"graph.working.unknown": "行数未知（二进制或超过读取上限）",
			"mention.file": "引用文件",
			"mention.fileDescription": "选择文件，或进入文件夹浏览；选中的文件路径插入输入框",
			"mention.folder": "引用文件夹",
			"mention.folderDescription": "选择文件夹，把路径插入输入框",
			"mention.browse": "📁 打开文件浏览器…（点击文件夹进入）",
			"mention.empty": "没有匹配的条目",
			"mention.error": "读取工作区失败：{message}",
			"browse.titleFile": "选择文件",
			"browse.titleFolder": "选择文件夹",
			"browse.close": "关闭",
			"browse.filter": "按名称过滤",
			"browse.home": "主目录",
			"browse.parent": "上一级",
			"browse.crumbs": "路径",
			"browse.useCurrent": "选择当前文件夹",
			"browse.loading": "读取中…",
			"browse.empty": "此目录为空",
			"browse.truncated": "条目过多，已截断",
			"browse.error": "读取目录失败：{message}",
			"settings.nav": "Web 增强",
			"modelCapabilities.nav": "模型能力",
			"modelCapabilities.title": "模型能力",
			"modelCapabilities.intro": "编辑各渠道模型的输入能力（文本 / 图片）与推理强度。保存直接写入对应的 llm 设置命名空间并立即生效。",
			"modelCapabilities.loading": "读取中…",
			"modelCapabilities.loadFailed": "读取模型能力设置失败",
			"modelCapabilities.retry": "重试",
			"modelCapabilities.readOnly": "当前部署的设置文档为只读。",
			"modelCapabilities.noProviders": "没有可编辑的模型渠道。请先在“模型”页配置提供方。",
			"modelCapabilities.catalogError": "部分渠道的模型目录读取失败：{message}",
			"modelCapabilities.saved": "已保存。",
			"modelCapabilities.apply": "保存",
			"modelCapabilities.applying": "保存中…",
			"modelCapabilities.reset": "还原未保存的修改",
			"modelCapabilities.conflict": "这些设置在打开期间被其他位置改动。请还原后重新编辑。",
			"modelCapabilities.saveError": "保存失败：{message}",
			"modelCapabilities.deepseekHint": "DeepSeek 官方渠道的思考模式与推理强度是渠道级设置，对所有模型生效。",
			"modelCapabilities.thinking": "思考模式",
			"modelCapabilities.thinkingInherit": "使用适配器默认",
			"modelCapabilities.thinkingEnabled": "启用（enabled）",
			"modelCapabilities.thinkingDisabled": "禁用（disabled）",
			"modelCapabilities.reasoningEffort": "默认推理强度",
			"modelCapabilities.reasoningEffortInherit": "使用适配器默认（high）",
			"modelCapabilities.routeSection": "渠道级默认",
			"modelCapabilities.defaultInput": "默认输入能力",
			"modelCapabilities.defaultInputHint": "目录未声明输入能力的模型使用这里的默认值。",
			"modelCapabilities.defaultInputEmpty": "默认输入能力至少需要选择一种（text 或 image）。",
			"modelCapabilities.routeReasoning": "默认推理档位",
			"modelCapabilities.routeReasoningInherit": "使用适配器 / 目录默认",
			"modelCapabilities.modelSection": "模型输入与推理强度",
			"modelCapabilities.modelsListMode": "该渠道使用自定义 models 列表",
			"modelCapabilities.modelsListModeHint": "模型增删与 ID / 名称 / 容量请在“模型”页编辑；这里只编辑每个模型的 input 与 reasoningEfforts。",
			"modelCapabilities.overridesMode": "目录模型覆盖（modelOverrides）",
			"modelCapabilities.overridesModeHint": "只列出已覆盖的模型；从目录选择模型可新增覆盖，不影响其他目录模型。",
			"modelCapabilities.addOverride": "添加覆盖",
			"modelCapabilities.addOverridePlaceholder": "选择要覆盖的模型…",
			"modelCapabilities.noCandidates": "没有可添加的目录模型。",
			"modelCapabilities.removeOverride": "删除该模型的覆盖",
			"modelCapabilities.emptyOverrides": "尚未覆盖任何模型。",
			"modelCapabilities.modelInput": "输入能力",
			"modelCapabilities.inputInherit": "继承",
			"modelCapabilities.inputText": "文本 (text)",
			"modelCapabilities.inputImage": "图片 (image)",
			"modelCapabilities.reasoning": "推理强度",
			"modelCapabilities.reasoningInherit": "继承目录能力",
			"modelCapabilities.reasoningNone": "不支持推理（false）",
			"modelCapabilities.reasoningCustom": "自定义可提供的档位",
			"modelCapabilities.reasoningCustomHint": "勾选要提供的档位，并填写发送给端点的 wire 值；“off”留空表示不发参数。",
			"modelCapabilities.reasoningLevelOff": "off",
			"modelCapabilities.reasoningLevelMinimal": "minimal",
			"modelCapabilities.reasoningLevelLow": "low",
			"modelCapabilities.reasoningLevelMedium": "medium",
			"modelCapabilities.reasoningLevelHigh": "high",
			"modelCapabilities.reasoningLevelXHigh": "xhigh",
			"modelCapabilities.reasoningLevelMax": "max",
			"modelCapabilities.reasoningWire": "wire 值",
			"modelCapabilities.reasoningWireOffPlaceholder": "留空 = 不发送参数",
			"modelCapabilities.reasoningWirePlaceholder": "例如 low / medium / high",
			"modelCapabilities.reasoningNeedLevel": "自定义推理强度至少要勾选一个非 off 档位。",
			"modelCapabilities.reasoningWireRequired": "每个勾选的非 off 档位都需要非空 wire 值。",
			"modelCapabilities.modelInputInvalid": "input 只能是 text / image 列表。",
			"modelCapabilities.modelOverrideEmptyId": "模型覆盖的模型 ID 不能为空。",
			"modelCapabilities.thinkingInvalid": "thinking 只能是 enabled 或 disabled。",
			"modelCapabilities.reasoningEffortInvalid": "reasoningEffort 只能是 off / high / max。",
			"modelCapabilities.reasoningDisabledConflict": "thinking 为 disabled 时，reasoningEffort 只能为 off。",
			"settings.tab.plugins": "插件管理",
			"settings.tab.general": "通用设置",
			"settings.tab.vision": "识图",
			"settings.tab.about": "关于",
			"settings.tab.skins": "皮肤",
			"settings.general.title": "通用设置",
			"settings.general.hint": "不属于其他标签页的通用偏好。",
			"modelRetry.title": "模型请求重试",
			"modelRetry.provider": "渠道",
			"modelRetry.providerName": "DeepSeek 官方（deepseek-official）",
			"modelRetry.current": "当前失败后重试次数",
			"modelRetry.unlimited": "无限重试（always）",
			"modelRetry.maxLabel": "失败后重试次数",
			"modelRetry.placeholder": "例如 2",
			"modelRetry.hint": "只管理 deepseek-official 渠道。保存会写入 llm-deepseek 的 retryPolicy 设置，下一次请求立即生效，无需重启。",
			"modelRetry.invalid": "请输入不小于 0 的整数",
			"modelRetry.save": "保存",
			"modelRetry.saved": "已保存，下一次请求生效",
			"modelRetry.saveError": "保存失败：{message}",
			"modelRetry.loading": "读取中…",
			"modelRetry.error": "读取失败：{message}",
			"modelRetry.backoffTitle": "退避参数（只读）",
			"modelRetry.initialDelay": "初始延迟",
			"modelRetry.maxDelay": "最大延迟",
			"modelRetry.jitter": "抖动比例",
			"skins.title": "界面皮肤",
			"skins.hint": "皮肤通过主题服务的覆盖栈整体重着色 Web 界面（明暗两套色板成对定义，随“外观”的浅色/深色偏好自动切换）。选择保存在浏览器本地，立即生效，无需刷新。",
			"skins.unavailable": "当前部署未组合主题服务（dsh-client-ui-theme），皮肤不可用。",
			"skins.none.name": "原生",
			"skins.none.desc": "不叠加任何覆盖层，保持宿主内置配色。",
			"skins.ocean.name": "深海",
			"skins.ocean.desc": "深海军蓝与冷白蓝，商务蓝点缀。",
			"skins.amber.name": "暖沙",
			"skins.amber.desc": "奶油暖沙与柔和炭黑，琥珀色点缀。",
			"skins.forest.name": "森林",
			"skins.forest.desc": "苔绿与松木深色，自然绿色点缀。",
			"skins.violet.name": "紫晶",
			"skins.violet.desc": "薰衣草浅紫与梅子深紫，虹彩紫点缀。",
			"skins.bg.title": "自定义背景图片",
			"skins.bg.hint": "支持 PNG / JPG / WebP / GIF / AVIF / BMP / ICO / SVG，保存在浏览器本地。超过存储预算的图片会自动压缩后应用；所有自定义背景统一做淡化处理（高透明度蒙层 + 轻微模糊），与皮肤和明暗模式同时生效，不影响页面内容阅读。",
			"skins.bg.none": "未设置背景",
			"skins.bg.pick": "选择图片",
			"skins.bg.clear": "清除背景",
			"skins.bg.compressed": "图片超过存储预算，已自动压缩后应用。",
			"skins.bg.tooLarge": "图片压缩后仍超过存储预算，请换一张或降低分辨率。",
			"skins.bg.badType": "不支持的文件类型，请选择图片文件。",
			"vision.refresh": "刷新状态",
			"vision.loading": "读取中…",
			"vision.error": "读取识图状态失败：{message}",
			"vision.notMounted": "识图集成服务未挂载（此部署缺少宿主 llm/attachments 服务）。",
			"vision.enabled": "图片理解",
			"vision.on": "已启用",
			"vision.off": "已停用",
			"vision.admission": "发送放行补丁",
			"vision.patched": "已生效",
			"vision.notPatched": "未生效",
			"vision.harnessTitle": "DSH 多模态模型",
			"vision.harnessNone": "未发现（自动探测）",
			"vision.endpointTitle": "转译端点",
			"vision.endpointNone": "未配置（visionBaseUrl + visionEndpointModel）",
			"vision.keySource": "端点密钥来源",
			"vision.key.config": "插件配置 visionApiKey",
			"vision.key.env": "环境变量（VISION_API_KEY 等）",
			"vision.key.none-needed": "匿名 / 本地端点，无需密钥",
			"vision.key.unset": "未设置",
			"vision.ollama": "本地 Ollama",
			"vision.ollamaModel": "已检测到（{model}）",
			"vision.ollamaNone": "未检测到",
			"vision.cache": "转译缓存",
			"vision.cacheEntries": "{count} 条（按图片内容哈希）",
			"vision.lastError": "最近失败",
			"vision.lastErrorNone": "无",
			"vision.failuresTitle": "识别尝试失败记录",
			"vision.failuresNone": "无",
			"vision.source.dsh": "DSH 模型",
			"vision.source.endpoint": "独立 API",
			"vision.source.ollama": "Ollama",
			"vision.statusTitle": "当前状态",
			"vision.form.switchesTitle": "开关",
			"vision.form.enabled": "启用图片理解",
			"vision.form.enabledHint": "纯文本模型发送图片时自动转写为文字描述",
			"vision.form.patchAdmission": "放行图片发送",
			"vision.form.patchAdmissionHint": "包装 resolveModelInfo，通过发送门禁与 read_image 门禁",
			"vision.form.harnessTitle": "DSH 多模态模型（识别用）",
			"vision.form.harnessHint": "勾选 DSH 已声明支持图片的模型作为模型池，按列表顺序依次尝试；全部失败后轮到下面的独立识图 API。",
			"vision.form.harnessPoolHint": "当前模型池 {count} 个",
			"vision.form.harnessAutoHint": "未勾选：自动探测所有声明支持图片的模型（最多 4 个）",
			"vision.form.noImageModels": "当前 DSH 渠道里没有声明支持图片的模型。可以用下面的独立识图 API，或在 DSH 里为该模型声明 image 输入。",
			"vision.form.endpointTitle": "独立识图 API（不参与 DSH 渠道）",
			"vision.form.endpointHint": "只用于本插件的图片转写，不会注册进 DSH 的模型选择器；Base URL 留空则不启用。任何 OpenAI 兼容 /chat/completions 端点都行。",
			"vision.form.baseUrl": "Base URL",
			"vision.form.endpointModel": "优先模型（可选）",
			"vision.form.endpointModelHint": "留空则按模型池顺序；池为空时可直接手填",
			"vision.form.endpointModelAuto": "按模型池顺序",
			"vision.form.fetchModels": "拉取模型列表",
			"vision.form.fetchingModels": "拉取中…",
			"vision.form.fetchedCount": "共 {count} 个模型",
			"vision.form.fetchedTruncated": "列表已截断",
			"vision.form.fetchError": "拉取失败：{message}",
			"vision.form.noFetchedModels": "该端点没有返回模型",
			"vision.form.poolHint": "点「拉取模型列表」后勾选一批候选模型，保存即成为模型池；转写时按池顺序依次尝试。",
			"vision.form.apiKey": "API Key",
			"vision.form.apiKeyPlaceholder": "已设置密钥时显示为已保存",
			"vision.form.apiKeyHint": "留空保持不变；点「清除密钥」删除已保存的密钥",
			"vision.form.apiKeyClear": "清除密钥",
			"vision.form.anonymous": "匿名端点（不带 Authorization 头）",
			"vision.form.timeout": "超时（毫秒）",
			"vision.form.maxTokens": "最大输出 token",
			"vision.form.ollamaTitle": "本地 Ollama",
			"vision.form.autoLocalOllama": "启动时自动探测本地 Ollama",
			"vision.form.localOllamaUrl": "Ollama Base URL",
			"vision.form.localOllamaModel": "Ollama 模型（留空自动选择）",
			"vision.form.localOllamaModelHint": "建议填视觉模型，如 qwen3-vl:4b",
			"vision.form.promptTitle": "描述提示词与标记",
			"vision.form.prompt": "提示词",
			"vision.form.marker": "标记",
			"vision.form.save": "保存（立即生效）",
			"vision.form.saving": "保存中…",
			"vision.form.saved": "已保存，正在生效",
			"vision.form.saveError": "保存失败：{message}",
			"vision.form.conflict": "配置已在其他窗口被修改，已重新加载，请再试一次",
			"vision.form.invalidNumber": "超时与最大 token 必须是正整数",
			"vision.form.unavailable": "识图配置命名空间不可用：{message}。仍可用 cordis.patch.yml 里的 vision* 静态配置。",
			"vision.hint": "本页保存后立即生效并持久化到 DSH settings；cordis.patch.yml 里的 vision* 静态配置作为底值，界面保存的值优先。fallbackModels 等高级项仍走静态配置或直接编辑 settings.yaml。\n\n注意：本功能已内置于 dsh-web-enhanced，请不要再同时安装 DSH-vision（dsh-image-vision），两个插件会重复识别同一张图片。",
			"plugins.title": "已安装插件",
			"plugins.subtitle": "profile「{profile}」的依赖，位于 {dir}",
			"plugins.reload": "刷新",
			"plugins.loading": "读取中…",
			"plugins.empty": "该 profile 还没有安装任何插件",
			"plugins.error": "读取插件列表失败：{message}",
			"plugins.noProfile": "当前部署不是从 dsh profile 加载本插件的（例如源码检出或测试环境），因此没有可管理的插件。",
			"plugins.remove": "移除",
			"plugins.update": "更新",
			"plugins.busy": "正在执行…",
			"plugins.layerActive": "已启用为层",
			"plugins.layerInactive": "未启用为层",
			"plugins.plain": "普通依赖",
			"plugins.self": "本插件",
			"plugins.version": "v{version}",
			"plugins.versionUnknown": "未安装",
			"plugins.templateTitle": "模板层",
			"plugins.templateHint": "来自 profile 模板、不是依赖，因此无法在这里移除或更新。",
			"plugins.confirmRemove": "确定移除 {name}？下次启动后生效。",
			"plugins.confirmRemoveSelf": "{name} 就是当前这个插件。移除后，重启 DSH 就会失去这个设置页以及任务看板、Git 图谱等全部功能，只能用命令行装回来。确定继续？",
			"plugins.confirmUpdate": "把 {name} 更新到它所跟踪的最新版本？下次启动后生效。",
			"plugins.confirm": "确定",
			"plugins.cancel": "取消",
			"plugins.restart": "已写入磁盘。**重启 DSH 后生效** —— 插件层在启动时组合，运行中的进程不会改变。",
			"plugins.changed": "层列表变化：{changes}",
			"plugins.added": "+{name}",
			"plugins.removed": "−{name}",
			"plugins.failed": "操作失败",
			"plugins.output": "pnpm 输出",
			"about.title": "dsh-web-enhanced",
			"about.description": "DeepSeek Harness 的 Web 增强插件：把任务看板、Git 图谱、工作区、文件引用、余额与识图整合进 Web 界面。",
			"about.featuresTitle": "功能",
			"about.feature.board": "任务看板（cron 定时）",
			"about.feature.graph": "Git 图谱与分支切换",
			"about.feature.workspace": "工作区：文件 / 预览 / 变更",
			"about.feature.mention": "文件与文件夹 mention",
			"about.feature.balance": "余额与本轮花费",
			"about.feature.vision": "识图（纯文本模型图片理解）",
			"about.feature.plugins": "插件管理",
			"about.configTitle": "配置",
			"about.configHint": "识图在「识图」标签页在线配置、保存立即生效；\n其余选项在 profile 的 cordis.patch.yml 中按插件行配置。",
			"about.license": "MIT",
			"about.version": "版本 {version}",
			"about.repo": "项目主页",
			"branch.label": "分支",
			"branch.switch": "切换到 {branch}",
			"branch.loading": "读取分支…",
			"branch.error": "读取分支失败",
			"branch.none": "非 Git 仓库",
			"branch.dirty": "有 {count} 处未提交改动（已跟踪 {tracked} · 未跟踪 {untracked}）。切换到「{branch}」时 git 会带着这些改动走；两个分支都改过同一个文件时它会拒绝切换，改动不会丢。",
			"branch.dirtyConfirm": "仍然切换",
			"branch.dirtyCancel": "取消",
			"branch.failed": "切换失败：",
			"view.workspace": "工作区",
			"panel.tab.explorer": "资源管理器",
			"panel.tab.scm": "变更",
			"panel.tab.board": "任务看板",
			"panel.tab.graph": "Git 图谱",
			"files.collapse": "收起侧边栏",
			"navbar.pin": "精选",
			"navbar.unpin": "取消精选",
			"navbar.olderTurn": "第 {turn} 轮（尚未加载，点击加载并跳转）",
			"navbar.olderMore": "还有 {count} 个更早轮次未显示，点击加载",
			"modelPicker.select": "选择模型",
			"modelPicker.title": "选择模型",
			"modelPicker.close": "关闭",
			"modelPicker.hint": "按渠道选择模型；默认只展开当前渠道。",
			"modelPicker.loading": "读取模型…",
			"modelPicker.retry": "重试",
			"modelPicker.effort": "推理强度",
			"modelPicker.providerDefault": "渠道默认",
			"modelPicker.error": "模型选择失败：{message}",
			"files.expand": "展开侧边栏",
			"panel.noWorkspace": "当前会话未绑定项目",
			"files.search": "按文件名搜索",
			"files.empty": "目录为空",
			"files.searchEmpty": "没有匹配的文件",
			"files.error": "读取目录失败：{message}",
			"preview.empty": "在文件树中选择文件以预览",
			"preview.mode.source": "源码",
			"preview.backToTop": "返回顶部",
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
			"balance.error": "余额不可用：{message}",
			"balance.cost": "本会话约 {cost}"
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
			"board.expand": "Show task details",
			"board.collapse": "Hide task details",
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
			"graph.working.title": "Uncommitted changes",
			"graph.working.counts": "{staged} staged · {unstaged} unstaged · {untracked} untracked",
			"graph.working.staged": "staged",
			"graph.working.unstaged": "unstaged",
			"graph.working.untracked": "untracked",
			"graph.working.truncated": "Too many files; showing the first {count}",
			"graph.working.unknown": "Line count unknown (binary, or over the read cap)",
			"mention.file": "Mention file",
			"mention.fileDescription": "Pick a file, or enter a folder to browse; the picked path goes into the composer",
			"mention.folder": "Mention folder",
			"mention.folderDescription": "Pick a folder and insert its path into the composer",
			"mention.browse": "📁 Open file browser… (click folders to enter)",
			"mention.empty": "No matching entries",
			"mention.error": "Could not read the workspace: {message}",
			"browse.titleFile": "Pick a file",
			"browse.titleFolder": "Pick a folder",
			"browse.close": "Close",
			"browse.filter": "Filter by name",
			"browse.home": "Home",
			"browse.parent": "Parent folder",
			"browse.crumbs": "Path",
			"browse.useCurrent": "Use this folder",
			"browse.loading": "Loading…",
			"browse.empty": "This folder is empty",
			"browse.truncated": "Too many entries; the list was cut",
			"browse.error": "Could not read the directory: {message}",
			"settings.nav": "Web Enhanced",
			"modelCapabilities.nav": "Model Capabilities",
			"modelCapabilities.title": "Model Capabilities",
			"modelCapabilities.intro": "Edit each provider model's input modalities (text / image) and reasoning efforts. Changes are written to the owning llm settings namespace and take effect immediately.",
			"modelCapabilities.loading": "Loading…",
			"modelCapabilities.loadFailed": "Loading model capability settings failed",
			"modelCapabilities.retry": "Retry",
			"modelCapabilities.readOnly": "The settings document is read-only in this deployment.",
			"modelCapabilities.noProviders": "No editable model providers. Configure one on the Models page first.",
			"modelCapabilities.catalogError": "Reading the model catalog failed for some providers: {message}",
			"modelCapabilities.saved": "Saved.",
			"modelCapabilities.apply": "Save",
			"modelCapabilities.applying": "Saving…",
			"modelCapabilities.reset": "Discard unsaved changes",
			"modelCapabilities.conflict": "These settings changed elsewhere while this card was open. Reset and edit the current values.",
			"modelCapabilities.saveError": "Save failed: {message}",
			"modelCapabilities.deepseekHint": "DeepSeek official thinking and reasoning effort are provider-wide settings for all of its models.",
			"modelCapabilities.thinking": "Thinking mode",
			"modelCapabilities.thinkingInherit": "Use the adapter default",
			"modelCapabilities.thinkingEnabled": "Enabled",
			"modelCapabilities.thinkingDisabled": "Disabled",
			"modelCapabilities.reasoningEffort": "Default reasoning effort",
			"modelCapabilities.reasoningEffortInherit": "Use the adapter default (high)",
			"modelCapabilities.routeSection": "Provider defaults",
			"modelCapabilities.defaultInput": "Default input modalities",
			"modelCapabilities.defaultInputHint": "Models whose catalog declares no modalities use these defaults.",
			"modelCapabilities.defaultInputEmpty": "Default input needs at least one modality (text or image).",
			"modelCapabilities.routeReasoning": "Default reasoning level",
			"modelCapabilities.routeReasoningInherit": "Use the adapter / catalog default",
			"modelCapabilities.modelSection": "Model input and reasoning effort",
			"modelCapabilities.modelsListMode": "This provider uses a custom models list",
			"modelCapabilities.modelsListModeHint": "Add/remove models and their ids, names, and capacities on the Models page; this card edits each model's input and reasoningEfforts only.",
			"modelCapabilities.overridesMode": "Catalog model overrides (modelOverrides)",
			"modelCapabilities.overridesModeHint": "Only overridden models are listed. Picking a catalog model adds an override without affecting the others.",
			"modelCapabilities.addOverride": "Add override",
			"modelCapabilities.addOverridePlaceholder": "Pick a model to override…",
			"modelCapabilities.noCandidates": "No catalog models available to override.",
			"modelCapabilities.removeOverride": "Remove this model override",
			"modelCapabilities.emptyOverrides": "No model overrides yet.",
			"modelCapabilities.modelInput": "Input modalities",
			"modelCapabilities.inputInherit": "Inherit",
			"modelCapabilities.inputText": "Text",
			"modelCapabilities.inputImage": "Image",
			"modelCapabilities.reasoning": "Reasoning effort",
			"modelCapabilities.reasoningInherit": "Inherit catalog capability",
			"modelCapabilities.reasoningNone": "Non-reasoning (false)",
			"modelCapabilities.reasoningCustom": "Custom offered levels",
			"modelCapabilities.reasoningCustomHint": "Check the levels to offer and enter the wire value each sends; leave “off” empty to send no parameter.",
			"modelCapabilities.reasoningLevelOff": "off",
			"modelCapabilities.reasoningLevelMinimal": "minimal",
			"modelCapabilities.reasoningLevelLow": "low",
			"modelCapabilities.reasoningLevelMedium": "medium",
			"modelCapabilities.reasoningLevelHigh": "high",
			"modelCapabilities.reasoningLevelXHigh": "xhigh",
			"modelCapabilities.reasoningLevelMax": "max",
			"modelCapabilities.reasoningWire": "Wire value",
			"modelCapabilities.reasoningWireOffPlaceholder": "Empty = send nothing",
			"modelCapabilities.reasoningWirePlaceholder": "e.g. low / medium / high",
			"modelCapabilities.reasoningNeedLevel": "Custom reasoning needs at least one non-off level.",
			"modelCapabilities.reasoningWireRequired": "Every checked non-off level needs a non-empty wire value.",
			"modelCapabilities.modelInputInvalid": "input must be a list of text / image.",
			"modelCapabilities.modelOverrideEmptyId": "Model override ids must not be empty.",
			"modelCapabilities.thinkingInvalid": "thinking must be enabled or disabled.",
			"modelCapabilities.reasoningEffortInvalid": "reasoningEffort must be off, high, or max.",
			"modelCapabilities.reasoningDisabledConflict": "With thinking disabled, reasoningEffort can only be off.",
			"settings.tab.plugins": "Plugins",
			"settings.tab.general": "General",
			"settings.tab.vision": "Vision",
			"settings.tab.about": "About",
			"settings.tab.skins": "Skins",
			"settings.general.title": "General settings",
			"settings.general.hint": "General preferences that do not belong to another tab.",
			"modelRetry.title": "Model request retry",
			"modelRetry.provider": "Provider",
			"modelRetry.providerName": "DeepSeek official (deepseek-official)",
			"modelRetry.current": "Current retries after failure",
			"modelRetry.unlimited": "Unlimited (always)",
			"modelRetry.maxLabel": "Retries after failure",
			"modelRetry.placeholder": "e.g. 2",
			"modelRetry.hint": "Manages the deepseek-official route only. Saving writes the llm-deepseek retryPolicy setting; the next request uses it immediately, no restart required.",
			"modelRetry.invalid": "Enter a non-negative integer",
			"modelRetry.save": "Save",
			"modelRetry.saved": "Saved; the next request uses it",
			"modelRetry.saveError": "Could not save: {message}",
			"modelRetry.loading": "Loading…",
			"modelRetry.error": "Could not read: {message}",
			"modelRetry.backoffTitle": "Backoff (read-only)",
			"modelRetry.initialDelay": "Initial delay",
			"modelRetry.maxDelay": "Maximum delay",
			"modelRetry.jitter": "Jitter ratio",
			"skins.title": "Interface skins",
			"skins.hint": "A skin recolors the whole Web surface through the theme service override stack (light and dark palettes defined in pairs, following the Appearance preference). The choice persists in the browser, applies immediately, and needs no reload.",
			"skins.unavailable": "The theme service (dsh-client-ui-theme) is not composed in this deployment; skins are unavailable.",
			"skins.none.name": "Stock",
			"skins.none.desc": "No override layer; the host built-in palette.",
			"skins.ocean.name": "Ocean",
			"skins.ocean.desc": "Deep-sea navy and cool white-blue with business-blue accents.",
			"skins.amber.name": "Amber",
			"skins.amber.desc": "Warm sand cream and soft charcoal with amber accents.",
			"skins.forest.name": "Forest",
			"skins.forest.desc": "Moss green over pine dark with natural green accents.",
			"skins.violet.name": "Violet",
			"skins.violet.desc": "Lavender light and plum dark with iridescent purple accents.",
			"skins.bg.title": "Custom background image",
			"skins.bg.hint": "PNG / JPG / WebP / GIF / AVIF / BMP / ICO / SVG, stored in the browser. Pictures over the storage budget are compressed automatically before applying; every custom background gets the same uniform fade (a high-opacity veil plus a slight blur) so it never competes with content, alongside any skin and either Appearance mode.",
			"skins.bg.none": "No background set",
			"skins.bg.pick": "Choose image",
			"skins.bg.clear": "Clear background",
			"skins.bg.compressed": "The picture was over the storage budget and has been compressed automatically.",
			"skins.bg.tooLarge": "The picture stays over the storage budget after compression; please pick another or reduce its resolution.",
			"skins.bg.badType": "Unsupported file type; please pick an image file.",
			"vision.refresh": "Refresh status",
			"vision.loading": "Loading…",
			"vision.error": "Could not read the vision status: {message}",
			"vision.notMounted": "The vision integration service is not mounted (this deployment lacks the host llm/attachments services).",
			"vision.enabled": "Image understanding",
			"vision.on": "Enabled",
			"vision.off": "Disabled",
			"vision.admission": "Send-admission patch",
			"vision.patched": "Active",
			"vision.notPatched": "Inactive",
			"vision.harnessTitle": "DSH multimodal models",
			"vision.harnessNone": "None found (auto-detect)",
			"vision.endpointTitle": "Transcription endpoint",
			"vision.endpointNone": "Not configured (visionBaseUrl + visionEndpointModel)",
			"vision.keySource": "Endpoint key source",
			"vision.key.config": "Plugin config visionApiKey",
			"vision.key.env": "Environment (VISION_API_KEY etc.)",
			"vision.key.none-needed": "Anonymous / local endpoint, no key needed",
			"vision.key.unset": "Unset",
			"vision.ollama": "Local Ollama",
			"vision.ollamaModel": "Detected ({model})",
			"vision.ollamaNone": "Not detected",
			"vision.cache": "Transcription cache",
			"vision.cacheEntries": "{count} entries (keyed by image content hash)",
			"vision.lastError": "Last failure",
			"vision.lastErrorNone": "None",
			"vision.failuresTitle": "Failed transcription attempts",
			"vision.failuresNone": "None",
			"vision.source.dsh": "DSH model",
			"vision.source.endpoint": "Dedicated API",
			"vision.source.ollama": "Ollama",
			"vision.statusTitle": "Current status",
			"vision.form.switchesTitle": "Switches",
			"vision.form.enabled": "Enable image understanding",
			"vision.form.enabledHint": "Transcribe images for text-only models into text descriptions",
			"vision.form.patchAdmission": "Admit image sends",
			"vision.form.patchAdmissionHint": "Wraps resolveModelInfo to pass the send gate and the read_image gate",
			"vision.form.harnessTitle": "DSH multimodal models (for transcription)",
			"vision.form.harnessHint": "Check DSH models that declare image input to form the pool, tried in list order; when all fail, the dedicated API below takes over.",
			"vision.form.harnessPoolHint": "{count} model(s) in the pool",
			"vision.form.harnessAutoHint": "Nothing checked: auto-detect every model that declares image input (up to 4)",
			"vision.form.noImageModels": "No configured DSH channel declares an image-capable model. Use the dedicated API below, or declare image input for that model in DSH.",
			"vision.form.endpointTitle": "Dedicated transcription API (outside DSH channels)",
			"vision.form.endpointHint": "Used only for image transcription — it is never registered in the DSH model picker. Leave the base URL empty to disable it. Any OpenAI-compatible /chat/completions endpoint works.",
			"vision.form.baseUrl": "Base URL",
			"vision.form.endpointModel": "Preferred model (optional)",
			"vision.form.endpointModelHint": "Empty follows the pool order; you can type one while the pool is empty",
			"vision.form.endpointModelAuto": "Follow pool order",
			"vision.form.fetchModels": "Fetch model list",
			"vision.form.fetchingModels": "Fetching…",
			"vision.form.fetchedCount": "{count} models",
			"vision.form.fetchedTruncated": "list truncated",
			"vision.form.fetchError": "Fetch failed: {message}",
			"vision.form.noFetchedModels": "The endpoint returned no models",
			"vision.form.poolHint": "Click \"Fetch model list\", check a batch of candidate models, and save — that becomes the pool, tried in order during transcription.",
			"vision.form.apiKey": "API key",
			"vision.form.apiKeyPlaceholder": "Shows as saved when a key exists",
			"vision.form.apiKeyHint": "Leave blank to keep the current key; use \"Clear key\" to delete it",
			"vision.form.apiKeyClear": "Clear key",
			"vision.form.anonymous": "Anonymous endpoint (no Authorization header)",
			"vision.form.timeout": "Timeout (ms)",
			"vision.form.maxTokens": "Max output tokens",
			"vision.form.ollamaTitle": "Local Ollama",
			"vision.form.autoLocalOllama": "Probe local Ollama at startup",
			"vision.form.localOllamaUrl": "Ollama base URL",
			"vision.form.localOllamaModel": "Ollama model (empty auto-picks)",
			"vision.form.localOllamaModelHint": "Prefer a vision model, e.g. qwen3-vl:4b",
			"vision.form.promptTitle": "Description prompt and marker",
			"vision.form.prompt": "Prompt",
			"vision.form.marker": "Marker",
			"vision.form.save": "Save (applies immediately)",
			"vision.form.saving": "Saving…",
			"vision.form.saved": "Saved and applying",
			"vision.form.saveError": "Save failed: {message}",
			"vision.form.conflict": "The configuration changed in another window and was reloaded — please try again",
			"vision.form.invalidNumber": "Timeout and max tokens must be positive integers",
			"vision.form.unavailable": "The vision config namespace is unavailable: {message}. The static vision* keys in cordis.patch.yml still work.",
			"vision.hint": "Saving on this page applies immediately and persists in DSH settings; the static vision* keys in cordis.patch.yml act as the base layer, and what is saved here wins. Advanced items such as fallbackModels still come from static config or a direct settings.yaml edit.\n\nNote: this feature is built into dsh-web-enhanced — do not install DSH-vision (dsh-image-vision) alongside it, or the same image would be transcribed twice.",
			"plugins.title": "Installed plugins",
			"plugins.subtitle": "Dependencies of profile \"{profile}\", at {dir}",
			"plugins.reload": "Refresh",
			"plugins.loading": "Loading…",
			"plugins.empty": "This profile has no plugins installed",
			"plugins.error": "Could not read the plugin list: {message}",
			"plugins.noProfile": "This deployment does not load the plugin from a dsh profile (a source checkout or a test), so there is nothing to manage.",
			"plugins.remove": "Remove",
			"plugins.update": "Update",
			"plugins.busy": "Working…",
			"plugins.layerActive": "Active layer",
			"plugins.layerInactive": "Not a layer",
			"plugins.plain": "Plain dependency",
			"plugins.self": "This plugin",
			"plugins.version": "v{version}",
			"plugins.versionUnknown": "not installed",
			"plugins.templateTitle": "Template layers",
			"plugins.templateHint": "From the profile template rather than a dependency, so they cannot be removed or updated here.",
			"plugins.confirmRemove": "Remove {name}? Takes effect on the next start.",
			"plugins.confirmRemoveSelf": "{name} is this very plugin. Removing it means the next DSH start has no settings page, no task board, no git graph — reinstalling it needs the command line. Continue?",
			"plugins.confirmUpdate": "Update {name} to the head of what it tracks? Takes effect on the next start.",
			"plugins.confirm": "Confirm",
			"plugins.cancel": "Cancel",
			"plugins.restart": "Written to disk. **Restart DSH for it to take effect** — the layer stack is composed at boot, so the running process is unchanged.",
			"plugins.changed": "Layer list changed: {changes}",
			"plugins.added": "+{name}",
			"plugins.removed": "−{name}",
			"plugins.failed": "The operation failed",
			"plugins.output": "pnpm output",
			"about.title": "dsh-web-enhanced",
			"about.description": "A Web-enhanced plugin for DeepSeek Harness: task board, git graph, workspace, file mentions, balance, and image understanding in one Web UI.",
			"about.featuresTitle": "Features",
			"about.feature.board": "Task board (cron)",
			"about.feature.graph": "Git graph & branch switching",
			"about.feature.workspace": "Workspace: files / preview / changes",
			"about.feature.mention": "File & folder mentions",
			"about.feature.balance": "Balance & session cost",
			"about.feature.vision": "Vision (image understanding for text-only models)",
			"about.feature.plugins": "Plugin management",
			"about.configTitle": "Configuration",
			"about.configHint": "Image understanding is configured live on the \"Vision\" tab;\nother options live on the plugin row in the profile's cordis.patch.yml.",
			"about.license": "MIT",
			"about.version": "Version {version}",
			"about.repo": "Project home",
			"branch.label": "Branch",
			"branch.switch": "Switch to {branch}",
			"branch.loading": "Reading branches…",
			"branch.error": "Could not read branches",
			"branch.none": "Not a git repository",
			"branch.dirty": "{count} uncommitted change(s) ({tracked} tracked · {untracked} untracked). Switching to \"{branch}\" carries them along; git refuses the switch when both branches changed the same file, so nothing is lost either way.",
			"branch.dirtyConfirm": "Switch anyway",
			"branch.dirtyCancel": "Cancel",
			"branch.failed": "Switch failed:",
			"view.workspace": "Workspace",
			"panel.tab.explorer": "Explorer",
			"panel.tab.scm": "Changes",
			"panel.tab.board": "Task Board",
			"panel.tab.graph": "Git Graph",
			"files.collapse": "Collapse sidebar",
			"navbar.pin": "Pin",
			"navbar.unpin": "Unpin",
			"navbar.olderTurn": "Turn {turn} (not loaded; click to load and jump)",
			"navbar.olderMore": "{count} older turns hidden; click to load",
			"modelPicker.select": "Select model",
			"modelPicker.title": "Select model",
			"modelPicker.close": "Close",
			"modelPicker.hint": "Pick by provider; only the current provider starts expanded.",
			"modelPicker.loading": "Loading models…",
			"modelPicker.retry": "Retry",
			"modelPicker.effort": "Reasoning effort",
			"modelPicker.providerDefault": "Provider default",
			"modelPicker.error": "Model selection failed: {message}",
			"files.expand": "Expand sidebar",
			"panel.noWorkspace": "The current session has no project",
			"files.search": "Search by file name",
			"files.empty": "Empty directory",
			"files.searchEmpty": "No matching files",
			"files.error": "Could not read the directory: {message}",
			"preview.empty": "Pick a file in the tree to preview it",
			"preview.mode.source": "Source",
			"preview.backToTop": "Back to top",
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
			"balance.error": "Balance unavailable: {message}",
			"balance.cost": "≈ {cost} this session"
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
				pricingGet: async (request) => open(await raw.pricingGet(request)),
				visionStatus: async () => open(await raw.visionStatus()),
				visionConfigGet: async () => open(await raw.visionConfigGet()),
				visionConfigSet: async (request) => open(await raw.visionConfigSet(request)),
				visionEndpointModels: async (request) => open(await raw.visionEndpointModels(request)),
				modelRetryGet: async () => open(await raw.modelRetryGet()),
				modelRetrySet: async (request) => open(await raw.modelRetrySet(request)),
				gitBranches: async (request) => open(await raw.gitBranches(request)),
				gitLog: async (request) => open(await raw.gitLog(request)),
				gitCommit: async (request) => open(await raw.gitCommit(request)),
				gitWorking: async (request) => open(await raw.gitWorking(request)),
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
				fsOfficePreview: async (request) => open(await raw.fsOfficePreview(request)),
				fsBrowse: async (request) => open(await raw.fsBrowse(request)),
				pluginList: async (request) => open(await raw.pluginList(request)),
				pluginRemove: async (request) => open(await raw.pluginRemove(request)),
				pluginUpdate: async (request) => open(await raw.pluginUpdate(request))
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
				model: (sessionId) => storeOf(sessionId)?.getSnapshot().current?.model,
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
		* file row appends `@<path>` to the draft: a plain-text reference the model
		* reads as a path it can hand to `read_file`, and one this plugin can produce
		* without owning an `@` trigger source or a reference codec.
		*
		* The popup shell is a flat list with a local filter — it fetches its options
		* once and cannot host a nested tree. This module compensates by rendering the
		* recursive listing as an indented directory view: every folder row carries a
		* `navigate` target, and picking one opens the plugin's own file-browser
		* overlay AT that folder. The overlay is the real explorer — breadcrumbs,
		* parent, per-level listing, click a folder to enter, click a file to choose.
		* @module dsh-web-enhanced/src/client/mention
		*/
		/**
		* Id of the row that opens the host-wide browser instead of choosing a path.
		*
		* A control character so no real path can collide with it: every other row's
		* id IS a path.
		*/
		const BROWSE_OPTION_ID = "\0browse";
		/**
		* Render one path as a composer mention.
		*
		* Quoted only when it needs it, so the common case stays readable — but an
		* absolute Windows path with spaces is exactly the case that needs it, and
		* that is what the host-wide browser produces.
		* @param path - workspace-relative or absolute path.
		* @returns the mention text, with the trailing space that separates it.
		*/
		function mentionOf(path) {
			return /\s/u.test(path) ? `@"${path}" ` : `@${path} `;
		}
		/** Visual indentation of one recursive-search row (root level stays flush). */
		function indentOf$1(path) {
			const depth = path.split("/").length;
			return depth <= 1 ? "" : "\xA0\xA0".repeat(depth - 1);
		}
		/**
		* Join a workspace-relative search path onto the workspace's absolute root.
		* The mention itself stays relative, but the browser walks ABSOLUTE paths, so
		* a folder row's navigate target must be absolute before it is handed over.
		*/
		function workspaceAbsolute(root, rel) {
			const separator = root.includes("\\") ? "\\" : "/";
			return `${root.replace(/[\\/]+$/u, "")}${separator}${rel.split("/").join(separator)}`;
		}
		/** Build the row for one recursive-listing entry, in explorer order. */
		function rowOfEntry(entry, kind, workspaceRoot) {
			const folder = entry.kind === "dir";
			const indent = indentOf$1(entry.path);
			return {
				id: entry.path,
				label: `${indent}${folder ? "▸ " : "· "}${entry.name}${folder ? "/" : ""}`,
				detail: entry.path,
				...kind === "file" && folder ? { navigate: workspaceAbsolute(workspaceRoot, entry.path) } : {}
			};
		}
		/**
		* Build the option rows for one picker.
		*
		* The host search is bounded (`searchMaxEntries`), so this is a bounded
		* recursive listing the shell then filters locally rather than a live query
		* per keystroke. Rows are indented by depth, so the flat popup reads like a
		* directory tree; folder rows in the file picker carry `navigate` and open the
		* explorer at that folder when picked.
		*
		* The listing deliberately keeps the search's default `skipDirs` filter
		* (default `node_modules`): dependency trees are exactly the files nobody
		* references from the composer, and letting them flood the bounded list would
		* crowd out real project files. Files inside a skipped directory are still
		* reachable through the browse row, whose walker applies no such filter.
		*
		* The host walk also lists each directory's files before descending into its
		* subdirectories, so root-level documents like `TODO.md` stay in the batch
		* instead of being cut off by the entry cap behind a deep `lib` tree.
		*
		* A session with no project still gets the browse row: it has no listing to
		* offer, but nothing about it forbids naming a path.
		* @param deps - remote and workspace resolution.
		* @param kind - entries to keep (file picker keeps both, folders navigate).
		* @param sessionId - the session whose project is listed.
		* @returns the browse row followed by the project's entries.
		* @throws when the host refuses the listing.
		*/
		async function mentionOptions(deps, kind, sessionId) {
			const workspace = deps.workspaceOf(sessionId);
			const browseRow = {
				id: BROWSE_OPTION_ID,
				label: deps.browseLabel(),
				...workspace === void 0 ? {} : { detail: workspace.path }
			};
			if (workspace === void 0) return [browseRow];
			const result = await deps.remote.fsSearch({ workspaceId: workspace.workspaceId });
			if ("error" in result) throw new Error(result.error.message);
			return [browseRow, ...result.entries.filter((entry) => kind === "file" || entry.kind === "dir").map((entry) => rowOfEntry(entry, kind, workspace.path))];
		}
		/**
		* Apply one picked row: append its mention to the session's draft, or open the
		* file browser — at the workspace root for the browse row, at the row's own
		* directory for a folder row.
		* @param deps - draft access, the browser opener, and the deferral seam.
		* @param kind - the picker's entry kind (the browser inherits it).
		* @param sessionId - the session that opened the picker.
		* @param option - the picked row: a path, a navigable folder, or {@link BROWSE_OPTION_ID}.
		*/
		function applyMention(deps, kind, sessionId, option) {
			(deps.defer ?? ((run) => {
				setTimeout(run, 0);
			}))(() => {
				if (option.id === "\0browse") {
					deps.openBrowse(kind, sessionId, deps.workspaceOf(sessionId)?.path);
					return;
				}
				if (option.navigate !== void 0) {
					deps.openBrowse(kind, sessionId, option.navigate);
					return;
				}
				deps.appendDraft(sessionId, mentionOf(option.id));
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
		/**
		* Pending flushers of debounced cells: a pagehide pass drains them so the
		* last state before a close still lands (the pending timer alone would be
		* cancelled by teardown). Cells never unsubscribe — they live for the page.
		*/
		const flushers = /* @__PURE__ */ new Set();
		if (typeof window !== "undefined") window.addEventListener("pagehide", () => {
			for (const flush of flushers) flush();
		});
		/**
		* Create one shared state cell, optionally mirrored to localStorage.
		*
		* Persistence is a durable boundary: stored text is parsed defensively and a
		* value that does not survive `revive` is discarded in favour of the initial
		* state, so a format change or hand-edited storage cannot wedge the panel.
		* The mirror is DEBOUNCED and write-skipping: localStorage writes are
		* synchronous main-thread work, and a keystroke-rate writer (the tree filter)
		* would otherwise pay a JSON.stringify of the whole state per key. `project`
		* lets a cell exclude live-only fields (the filter) whose serialization
		* `revive` would drop anyway.
		* @param initial - starting value when nothing valid was restored.
		* @param persist - localStorage key, reviver, and optional persistence
		* projection; omitted keeps the cell in memory.
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
			let timer;
			let lastWritten;
			const persistNow = () => {
				if (persist === void 0 || typeof localStorage === "undefined") return;
				try {
					const serialized = JSON.stringify(persist.project === void 0 ? value : persist.project(value));
					if (serialized === lastWritten) return;
					lastWritten = serialized;
					localStorage.setItem(persist.key, serialized);
				} catch {}
			};
			const schedulePersist = () => {
				if (timer !== void 0) clearTimeout(timer);
				timer = setTimeout(() => {
					timer = void 0;
					persistNow();
				}, 300);
				flushers.add(persistNow);
			};
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
					if (persist !== void 0 && typeof localStorage !== "undefined") schedulePersist();
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
		/** Create the browser cell and its bound actions. */
		function createBrowse() {
			const cell = createCell({
				open: false,
				kind: "file",
				sessionId: ""
			});
			return {
				cell,
				actions: {
					openBrowse: (kind, sessionId, startPath) => {
						cell.update(() => ({
							open: true,
							kind,
							sessionId,
							...startPath === void 0 ? {} : { startPath }
						}));
					},
					closeBrowse: () => {
						cell.update((current) => current.open ? {
							...current,
							open: false
						} : current);
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
				tab: tab === "files" || tab === "preview" ? "explorer" : tab === "scm" || tab === "board" || tab === "graph" ? tab : "explorer",
				sidebarCollapsed: record["sidebarCollapsed"] === true,
				expanded,
				query: ""
			};
		}
		/** Create the view cell and its bound actions. */
		function createPanel() {
			const cell = createCell({
				tab: "explorer",
				sidebarCollapsed: false,
				expanded: {},
				query: ""
			}, {
				key: PANEL_PERSIST_KEY,
				revive: revivePanel,
				project: ({ query: _query, ...durable }) => durable
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
					},
					setSidebarCollapsed: (collapsed) => {
						cell.update((current) => current.sidebarCollapsed === collapsed ? current : {
							...current,
							sidebarCollapsed: collapsed
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
		/** The catalog, in display order. */
		const SKINS = [
			{
				id: "none",
				nameKey: "skins.none.name",
				descKey: "skins.none.desc",
				tokens: {},
				lightSwatch: [
					"#FFFFFF",
					"#F2F3F5",
					"#4D6BFE"
				],
				darkSwatch: [
					"#111418",
					"#1B1F26",
					"#7C96FF"
				]
			},
			{
				id: "ocean",
				nameKey: "skins.ocean.name",
				descKey: "skins.ocean.desc",
				tokens: {
					"--dsw-alias-bg-base": {
						light: "#F4F8FD",
						dark: "#0C121B"
					},
					"--dsw-alias-bg-layer-1": {
						light: "#FFFFFF",
						dark: "#111A27"
					},
					"--dsw-alias-bg-layer-2": {
						light: "#ECF2FA",
						dark: "#162130"
					},
					"--dsw-alias-bg-layer-3": {
						light: "#E2EBF7",
						dark: "#1C2A3D"
					},
					"--dsw-alias-bg-overlay": {
						light: "#DCE7F4",
						dark: "#22334A"
					},
					"--dsw-alias-bg-module-platform": {
						light: "#FFFFFF",
						dark: "#111A27"
					},
					"--dsw-alias-bg-skeleton": {
						light: "rgba(19, 45, 83, 0.08)",
						dark: "rgba(148, 180, 220, 0.12)"
					},
					"--dsw-alias-bg-mask-1": {
						light: "rgba(19, 37, 62, 0.3)",
						dark: "rgba(4, 8, 14, 0.55)"
					},
					"--dsw-alias-bg-mask-2": {
						light: "rgba(19, 37, 62, 0.12)",
						dark: "rgba(4, 8, 14, 0.25)"
					},
					"--dsw-alias-bg-mask-3": {
						light: "rgba(19, 37, 62, 0.3)",
						dark: "rgba(4, 8, 14, 0.5)"
					},
					"--dsw-alias-bg-mask-drop": {
						light: "rgba(244, 248, 253, 0.72)",
						dark: "rgba(12, 18, 27, 0.7)"
					},
					"--dsw-alias-border-l1": {
						light: "rgba(19, 45, 83, 0.08)",
						dark: "rgba(148, 180, 220, 0.08)"
					},
					"--dsw-alias-border-l2": {
						light: "rgba(19, 45, 83, 0.14)",
						dark: "rgba(148, 180, 220, 0.15)"
					},
					"--dsw-alias-border-l2-darkmode-thin": {
						light: "rgba(19, 45, 83, 0.1)",
						dark: "rgba(148, 180, 220, 0.1)"
					},
					"--dsw-alias-border-l3": {
						light: "rgba(19, 45, 83, 0.22)",
						dark: "rgba(148, 180, 220, 0.24)"
					},
					"--dsw-alias-border-l4": {
						light: "rgba(19, 45, 83, 0.32)",
						dark: "rgba(148, 180, 220, 0.34)"
					},
					"--dsw-alias-border-inverted": {
						light: "rgba(19, 45, 83, 0.06)",
						dark: "rgba(148, 180, 220, 0.12)"
					},
					"--dsw-alias-border-inverted2": {
						light: "rgba(19, 45, 83, 0.08)",
						dark: "rgba(148, 180, 220, 0.08)"
					},
					"--dsw-alias-label-primary": {
						light: "#13243E",
						dark: "#EAF2FC"
					},
					"--dsw-alias-label-secondary": {
						light: "#40597A",
						dark: "#AFC3DC"
					},
					"--dsw-alias-label-tertiary": {
						light: "#5D7696",
						dark: "#8399B5"
					},
					"--dsw-alias-label-caption": {
						light: "#7E93AC",
						dark: "#6B829F"
					},
					"--dsw-alias-label-dimmed": {
						light: "#C9D4E2",
						dark: "#4E5F76"
					},
					"--dsw-alias-label-primary-bluish": {
						light: "#2E5EB8",
						dark: "#BFD6F6"
					},
					"--dsw-alias-label-primary-dimmed": {
						light: "#1E3556",
						dark: "#D7E3F4"
					},
					"--dsw-alias-label-primary-inverted": {
						light: "#FFFFFF",
						dark: "#162130"
					},
					"--dsw-alias-label-primary-foreground": {
						light: "#FFFFFF",
						dark: "#FFFFFF"
					},
					"--dsw-alias-brand-primary": {
						light: "#13243E",
						dark: "#EAF2FC"
					},
					"--dsw-alias-brand-text": {
						light: "#13243E",
						dark: "#EAF2FC"
					},
					"--dsw-alias-brand-primary-invert": {
						light: "#FFFFFF",
						dark: "#0C121B"
					},
					"--dsw-alias-state-business-primary": {
						light: "#3F76D8",
						dark: "#6E9BE8"
					},
					"--dsw-alias-state-business-tertiary": {
						light: "#DCE9FB",
						dark: "#1D2C44"
					},
					"--dsw-alias-state-success-tertiary": {
						light: "#DDF3E4",
						dark: "#12271C"
					},
					"--dsw-alias-state-warn-tertiary": {
						light: "#FCEED6",
						dark: "#2A2416"
					},
					"--dsw-alias-button-primary-fill": {
						light: "#3F76D8",
						dark: "#4A7FD9"
					},
					"--dsw-alias-button-primary-hover": {
						light: "#5C8DE0",
						dark: "#5E8FE6"
					},
					"--dsw-alias-button-primary-dimmed": {
						light: "#DCE9FB",
						dark: "#162130"
					},
					"--dsw-alias-button-info-fill": {
						light: "#3F76D8",
						dark: "#6E9BE8"
					},
					"--dsw-alias-button-info-hover": {
						light: "#5C8DE0",
						dark: "#7FA8EF"
					},
					"--dsw-alias-button-elevated-fill": {
						light: "#FFFFFF",
						dark: "#162130"
					},
					"--dsw-alias-button-floating-fill": {
						light: "#FFFFFF",
						dark: "#162130"
					},
					"--dsw-alias-button-floating-hover": {
						light: "#F0F5FB",
						dark: "#1C2A3D"
					},
					"--dsw-alias-button-contrast-fill": {
						light: "#26364D",
						dark: "#EAF2FC"
					},
					"--dsw-alias-button-ghost-active-fill": {
						light: "#DCE7F4",
						dark: "#1C2A3D"
					},
					"--dsw-alias-button-ghost-active-hover": {
						light: "#E9F0F8",
						dark: "#162130"
					},
					"--dsw-alias-button-ghost-active-border": {
						light: "#8FA3BC",
						dark: "#6B829F"
					},
					"--dsw-alias-interactive-bg-hover": {
						light: "rgba(63, 118, 216, 0.08)",
						dark: "rgba(126, 164, 223, 0.1)"
					},
					"--dsw-alias-interactive-bg-hover-accent": {
						light: "rgba(63, 118, 216, 0.14)",
						dark: "rgba(126, 164, 223, 0.2)"
					},
					"--dsw-alias-interactive-bg-active": {
						light: "rgba(63, 118, 216, 0.2)",
						dark: "rgba(126, 164, 223, 0.26)"
					},
					"--dsw-alias-interactive-bg-hover-danger": {
						light: "rgba(236, 19, 19, 0.05)",
						dark: "rgba(242, 90, 90, 0.14)"
					},
					"--dsw-alias-interactive-bg-hover-solid": {
						light: "#F0F5FB",
						dark: "#1C2A3D"
					},
					"--dsw-alias-markdown-code-block": {
						light: "#F0F5FB",
						dark: "#0D141F"
					},
					"--dsw-alias-markdown-code-block-banner": {
						light: "#F5F8FD",
						dark: "#121B29"
					}
				},
				lightSwatch: [
					"#F4F8FD",
					"#E2EBF7",
					"#3F76D8"
				],
				darkSwatch: [
					"#0C121B",
					"#1C2A3D",
					"#6E9BE8"
				]
			},
			{
				id: "amber",
				nameKey: "skins.amber.name",
				descKey: "skins.amber.desc",
				tokens: {
					"--dsw-alias-bg-base": {
						light: "#FBF7F0",
						dark: "#171310"
					},
					"--dsw-alias-bg-layer-1": {
						light: "#FFFFFF",
						dark: "#1E1915"
					},
					"--dsw-alias-bg-layer-2": {
						light: "#F6EFE3",
						dark: "#26201A"
					},
					"--dsw-alias-bg-layer-3": {
						light: "#F0E6D5",
						dark: "#2E261E"
					},
					"--dsw-alias-bg-overlay": {
						light: "#EDE2CE",
						dark: "#362C22"
					},
					"--dsw-alias-bg-module-platform": {
						light: "#FFFFFF",
						dark: "#1E1915"
					},
					"--dsw-alias-bg-skeleton": {
						light: "rgba(90, 63, 22, 0.08)",
						dark: "rgba(226, 190, 138, 0.12)"
					},
					"--dsw-alias-bg-mask-1": {
						light: "rgba(62, 45, 20, 0.3)",
						dark: "rgba(10, 7, 4, 0.55)"
					},
					"--dsw-alias-bg-mask-2": {
						light: "rgba(62, 45, 20, 0.12)",
						dark: "rgba(10, 7, 4, 0.25)"
					},
					"--dsw-alias-bg-mask-3": {
						light: "rgba(62, 45, 20, 0.3)",
						dark: "rgba(10, 7, 4, 0.5)"
					},
					"--dsw-alias-bg-mask-drop": {
						light: "rgba(251, 247, 240, 0.72)",
						dark: "rgba(23, 19, 16, 0.7)"
					},
					"--dsw-alias-border-l1": {
						light: "rgba(90, 63, 22, 0.08)",
						dark: "rgba(226, 190, 138, 0.08)"
					},
					"--dsw-alias-border-l2": {
						light: "rgba(90, 63, 22, 0.14)",
						dark: "rgba(226, 190, 138, 0.15)"
					},
					"--dsw-alias-border-l2-darkmode-thin": {
						light: "rgba(90, 63, 22, 0.1)",
						dark: "rgba(226, 190, 138, 0.1)"
					},
					"--dsw-alias-border-l3": {
						light: "rgba(90, 63, 22, 0.22)",
						dark: "rgba(226, 190, 138, 0.24)"
					},
					"--dsw-alias-border-l4": {
						light: "rgba(90, 63, 22, 0.32)",
						dark: "rgba(226, 190, 138, 0.34)"
					},
					"--dsw-alias-border-inverted": {
						light: "rgba(90, 63, 22, 0.06)",
						dark: "rgba(226, 190, 138, 0.12)"
					},
					"--dsw-alias-border-inverted2": {
						light: "rgba(90, 63, 22, 0.08)",
						dark: "rgba(226, 190, 138, 0.08)"
					},
					"--dsw-alias-label-primary": {
						light: "#3E2E1B",
						dark: "#F5EDE1"
					},
					"--dsw-alias-label-secondary": {
						light: "#6B563B",
						dark: "#D6C2A4"
					},
					"--dsw-alias-label-tertiary": {
						light: "#8A7354",
						dark: "#B39D7E"
					},
					"--dsw-alias-label-caption": {
						light: "#A8906D",
						dark: "#947E60"
					},
					"--dsw-alias-label-dimmed": {
						light: "#D9CBB4",
						dark: "#6A5843"
					},
					"--dsw-alias-label-primary-bluish": {
						light: "#A96A12",
						dark: "#EBB765"
					},
					"--dsw-alias-label-primary-dimmed": {
						light: "#57401F",
						dark: "#E7D9C5"
					},
					"--dsw-alias-label-primary-inverted": {
						light: "#FFFFFF",
						dark: "#26201A"
					},
					"--dsw-alias-label-primary-foreground": {
						light: "#FFFFFF",
						dark: "#1E1915"
					},
					"--dsw-alias-brand-primary": {
						light: "#3E2E1B",
						dark: "#F5EDE1"
					},
					"--dsw-alias-brand-text": {
						light: "#3E2E1B",
						dark: "#F5EDE1"
					},
					"--dsw-alias-brand-primary-invert": {
						light: "#FFFFFF",
						dark: "#171310"
					},
					"--dsw-alias-state-business-primary": {
						light: "#C77E1E",
						dark: "#E0A24A"
					},
					"--dsw-alias-state-business-tertiary": {
						light: "#F8E8CE",
						dark: "#332718"
					},
					"--dsw-alias-state-success-tertiary": {
						light: "#E1F0DC",
						dark: "#172616"
					},
					"--dsw-alias-state-warn-tertiary": {
						light: "#FBEFD2",
						dark: "#2E2412"
					},
					"--dsw-alias-button-primary-fill": {
						light: "#C77E1E",
						dark: "#A9701F"
					},
					"--dsw-alias-button-primary-hover": {
						light: "#D6923A",
						dark: "#E0A24A"
					},
					"--dsw-alias-button-primary-dimmed": {
						light: "#F8E8CE",
						dark: "#26201A"
					},
					"--dsw-alias-button-info-fill": {
						light: "#C77E1E",
						dark: "#E0A24A"
					},
					"--dsw-alias-button-info-hover": {
						light: "#D6923A",
						dark: "#E9B468"
					},
					"--dsw-alias-button-elevated-fill": {
						light: "#FFFFFF",
						dark: "#26201A"
					},
					"--dsw-alias-button-floating-fill": {
						light: "#FFFFFF",
						dark: "#26201A"
					},
					"--dsw-alias-button-floating-hover": {
						light: "#F6EFE3",
						dark: "#2E261E"
					},
					"--dsw-alias-button-contrast-fill": {
						light: "#4A3A21",
						dark: "#F5EDE1"
					},
					"--dsw-alias-button-ghost-active-fill": {
						light: "#F0E6D5",
						dark: "#2E261E"
					},
					"--dsw-alias-button-ghost-active-hover": {
						light: "#F6EFE3",
						dark: "#26201A"
					},
					"--dsw-alias-button-ghost-active-border": {
						light: "#B79A6F",
						dark: "#947E60"
					},
					"--dsw-alias-interactive-bg-hover": {
						light: "rgba(199, 126, 30, 0.08)",
						dark: "rgba(224, 162, 74, 0.1)"
					},
					"--dsw-alias-interactive-bg-hover-accent": {
						light: "rgba(199, 126, 30, 0.14)",
						dark: "rgba(224, 162, 74, 0.2)"
					},
					"--dsw-alias-interactive-bg-active": {
						light: "rgba(199, 126, 30, 0.2)",
						dark: "rgba(224, 162, 74, 0.26)"
					},
					"--dsw-alias-interactive-bg-hover-danger": {
						light: "rgba(236, 19, 19, 0.05)",
						dark: "rgba(242, 90, 90, 0.14)"
					},
					"--dsw-alias-interactive-bg-hover-solid": {
						light: "#F6EFE3",
						dark: "#2E261E"
					},
					"--dsw-alias-markdown-code-block": {
						light: "#F6EFE3",
						dark: "#14100C"
					},
					"--dsw-alias-markdown-code-block-banner": {
						light: "#FBF7F0",
						dark: "#1A1511"
					}
				},
				lightSwatch: [
					"#FBF7F0",
					"#F0E6D5",
					"#C77E1E"
				],
				darkSwatch: [
					"#171310",
					"#2E261E",
					"#E0A24A"
				]
			},
			{
				id: "forest",
				nameKey: "skins.forest.name",
				descKey: "skins.forest.desc",
				tokens: {
					"--dsw-alias-bg-base": {
						light: "#F4F8F4",
						dark: "#0E1411"
					},
					"--dsw-alias-bg-layer-1": {
						light: "#FFFFFF",
						dark: "#141C17"
					},
					"--dsw-alias-bg-layer-2": {
						light: "#EBF2EA",
						dark: "#1A241D"
					},
					"--dsw-alias-bg-layer-3": {
						light: "#E0EBDF",
						dark: "#212D24"
					},
					"--dsw-alias-bg-overlay": {
						light: "#D8E6D6",
						dark: "#28362C"
					},
					"--dsw-alias-bg-module-platform": {
						light: "#FFFFFF",
						dark: "#141C17"
					},
					"--dsw-alias-bg-skeleton": {
						light: "rgba(31, 66, 42, 0.08)",
						dark: "rgba(155, 200, 168, 0.12)"
					},
					"--dsw-alias-bg-mask-1": {
						light: "rgba(24, 50, 32, 0.3)",
						dark: "rgba(4, 9, 6, 0.55)"
					},
					"--dsw-alias-bg-mask-2": {
						light: "rgba(24, 50, 32, 0.12)",
						dark: "rgba(4, 9, 6, 0.25)"
					},
					"--dsw-alias-bg-mask-3": {
						light: "rgba(24, 50, 32, 0.3)",
						dark: "rgba(4, 9, 6, 0.5)"
					},
					"--dsw-alias-bg-mask-drop": {
						light: "rgba(244, 248, 244, 0.72)",
						dark: "rgba(14, 20, 17, 0.7)"
					},
					"--dsw-alias-border-l1": {
						light: "rgba(31, 66, 42, 0.08)",
						dark: "rgba(155, 200, 168, 0.08)"
					},
					"--dsw-alias-border-l2": {
						light: "rgba(31, 66, 42, 0.14)",
						dark: "rgba(155, 200, 168, 0.15)"
					},
					"--dsw-alias-border-l2-darkmode-thin": {
						light: "rgba(31, 66, 42, 0.1)",
						dark: "rgba(155, 200, 168, 0.1)"
					},
					"--dsw-alias-border-l3": {
						light: "rgba(31, 66, 42, 0.22)",
						dark: "rgba(155, 200, 168, 0.24)"
					},
					"--dsw-alias-border-l4": {
						light: "rgba(31, 66, 42, 0.32)",
						dark: "rgba(155, 200, 168, 0.34)"
					},
					"--dsw-alias-border-inverted": {
						light: "rgba(31, 66, 42, 0.06)",
						dark: "rgba(155, 200, 168, 0.12)"
					},
					"--dsw-alias-border-inverted2": {
						light: "rgba(31, 66, 42, 0.08)",
						dark: "rgba(155, 200, 168, 0.08)"
					},
					"--dsw-alias-label-primary": {
						light: "#1C3325",
						dark: "#E9F2EA"
					},
					"--dsw-alias-label-secondary": {
						light: "#3F5A48",
						dark: "#B2C8B7"
					},
					"--dsw-alias-label-tertiary": {
						light: "#5B7663",
						dark: "#8CA394"
					},
					"--dsw-alias-label-caption": {
						light: "#7B927F",
						dark: "#718A79"
					},
					"--dsw-alias-label-dimmed": {
						light: "#C6D6C8",
						dark: "#4C5F51"
					},
					"--dsw-alias-label-primary-bluish": {
						light: "#2F7D46",
						dark: "#A4D6B2"
					},
					"--dsw-alias-label-primary-dimmed": {
						light: "#294534",
						dark: "#D8E6DA"
					},
					"--dsw-alias-label-primary-inverted": {
						light: "#FFFFFF",
						dark: "#1A241D"
					},
					"--dsw-alias-label-primary-foreground": {
						light: "#FFFFFF",
						dark: "#0E1411"
					},
					"--dsw-alias-brand-primary": {
						light: "#1C3325",
						dark: "#E9F2EA"
					},
					"--dsw-alias-brand-text": {
						light: "#1C3325",
						dark: "#E9F2EA"
					},
					"--dsw-alias-brand-primary-invert": {
						light: "#FFFFFF",
						dark: "#0E1411"
					},
					"--dsw-alias-state-business-primary": {
						light: "#3E8B57",
						dark: "#7CB88F"
					},
					"--dsw-alias-state-business-tertiary": {
						light: "#DCF0E1",
						dark: "#1B2B20"
					},
					"--dsw-alias-state-success-tertiary": {
						light: "#DCF0E1",
						dark: "#172616"
					},
					"--dsw-alias-state-warn-tertiary": {
						light: "#FCEED6",
						dark: "#2A2416"
					},
					"--dsw-alias-button-primary-fill": {
						light: "#3E8B57",
						dark: "#47875C"
					},
					"--dsw-alias-button-primary-hover": {
						light: "#56A06E",
						dark: "#5C9C6E"
					},
					"--dsw-alias-button-primary-dimmed": {
						light: "#DCF0E1",
						dark: "#1A241D"
					},
					"--dsw-alias-button-info-fill": {
						light: "#3E8B57",
						dark: "#7CB88F"
					},
					"--dsw-alias-button-info-hover": {
						light: "#56A06E",
						dark: "#96C7A5"
					},
					"--dsw-alias-button-elevated-fill": {
						light: "#FFFFFF",
						dark: "#1A241D"
					},
					"--dsw-alias-button-floating-fill": {
						light: "#FFFFFF",
						dark: "#1A241D"
					},
					"--dsw-alias-button-floating-hover": {
						light: "#EBF2EA",
						dark: "#212D24"
					},
					"--dsw-alias-button-contrast-fill": {
						light: "#2B4232",
						dark: "#E9F2EA"
					},
					"--dsw-alias-button-ghost-active-fill": {
						light: "#E0EBDF",
						dark: "#212D24"
					},
					"--dsw-alias-button-ghost-active-hover": {
						light: "#EBF2EA",
						dark: "#1A241D"
					},
					"--dsw-alias-button-ghost-active-border": {
						light: "#8AA691",
						dark: "#718A79"
					},
					"--dsw-alias-interactive-bg-hover": {
						light: "rgba(62, 139, 87, 0.08)",
						dark: "rgba(124, 184, 143, 0.1)"
					},
					"--dsw-alias-interactive-bg-hover-accent": {
						light: "rgba(62, 139, 87, 0.14)",
						dark: "rgba(124, 184, 143, 0.2)"
					},
					"--dsw-alias-interactive-bg-active": {
						light: "rgba(62, 139, 87, 0.2)",
						dark: "rgba(124, 184, 143, 0.26)"
					},
					"--dsw-alias-interactive-bg-hover-danger": {
						light: "rgba(236, 19, 19, 0.05)",
						dark: "rgba(242, 90, 90, 0.14)"
					},
					"--dsw-alias-interactive-bg-hover-solid": {
						light: "#EBF2EA",
						dark: "#212D24"
					},
					"--dsw-alias-markdown-code-block": {
						light: "#EBF2EA",
						dark: "#0C110E"
					},
					"--dsw-alias-markdown-code-block-banner": {
						light: "#F4F8F4",
						dark: "#111814"
					}
				},
				lightSwatch: [
					"#F4F8F4",
					"#E0EBDF",
					"#3E8B57"
				],
				darkSwatch: [
					"#0E1411",
					"#212D24",
					"#7CB88F"
				]
			},
			{
				id: "violet",
				nameKey: "skins.violet.name",
				descKey: "skins.violet.desc",
				tokens: {
					"--dsw-alias-bg-base": {
						light: "#F7F5FC",
						dark: "#120F1A"
					},
					"--dsw-alias-bg-layer-1": {
						light: "#FFFFFF",
						dark: "#181423"
					},
					"--dsw-alias-bg-layer-2": {
						light: "#F0ECF9",
						dark: "#1F1A2C"
					},
					"--dsw-alias-bg-layer-3": {
						light: "#E7E1F4",
						dark: "#262035"
					},
					"--dsw-alias-bg-overlay": {
						light: "#DED7F0",
						dark: "#2E2740"
					},
					"--dsw-alias-bg-module-platform": {
						light: "#FFFFFF",
						dark: "#181423"
					},
					"--dsw-alias-bg-skeleton": {
						light: "rgba(56, 38, 98, 0.08)",
						dark: "rgba(184, 164, 228, 0.12)"
					},
					"--dsw-alias-bg-mask-1": {
						light: "rgba(43, 29, 76, 0.3)",
						dark: "rgba(6, 4, 12, 0.55)"
					},
					"--dsw-alias-bg-mask-2": {
						light: "rgba(43, 29, 76, 0.12)",
						dark: "rgba(6, 4, 12, 0.25)"
					},
					"--dsw-alias-bg-mask-3": {
						light: "rgba(43, 29, 76, 0.3)",
						dark: "rgba(6, 4, 12, 0.5)"
					},
					"--dsw-alias-bg-mask-drop": {
						light: "rgba(247, 245, 252, 0.72)",
						dark: "rgba(18, 15, 26, 0.7)"
					},
					"--dsw-alias-border-l1": {
						light: "rgba(56, 38, 98, 0.08)",
						dark: "rgba(184, 164, 228, 0.08)"
					},
					"--dsw-alias-border-l2": {
						light: "rgba(56, 38, 98, 0.14)",
						dark: "rgba(184, 164, 228, 0.15)"
					},
					"--dsw-alias-border-l2-darkmode-thin": {
						light: "rgba(56, 38, 98, 0.1)",
						dark: "rgba(184, 164, 228, 0.1)"
					},
					"--dsw-alias-border-l3": {
						light: "rgba(56, 38, 98, 0.22)",
						dark: "rgba(184, 164, 228, 0.24)"
					},
					"--dsw-alias-border-l4": {
						light: "rgba(56, 38, 98, 0.32)",
						dark: "rgba(184, 164, 228, 0.34)"
					},
					"--dsw-alias-border-inverted": {
						light: "rgba(56, 38, 98, 0.06)",
						dark: "rgba(184, 164, 228, 0.12)"
					},
					"--dsw-alias-border-inverted2": {
						light: "rgba(56, 38, 98, 0.08)",
						dark: "rgba(184, 164, 228, 0.08)"
					},
					"--dsw-alias-label-primary": {
						light: "#2A2050",
						dark: "#EEEAF8"
					},
					"--dsw-alias-label-secondary": {
						light: "#4E4275",
						dark: "#C4B8DE"
					},
					"--dsw-alias-label-tertiary": {
						light: "#6A5D91",
						dark: "#9C90BB"
					},
					"--dsw-alias-label-caption": {
						light: "#8A7DAB",
						dark: "#7E72A1"
					},
					"--dsw-alias-label-dimmed": {
						light: "#D2CBE4",
						dark: "#574B74"
					},
					"--dsw-alias-label-primary-bluish": {
						light: "#6442C8",
						dark: "#C5B0F5"
					},
					"--dsw-alias-label-primary-dimmed": {
						light: "#3A2E63",
						dark: "#DFD8F0"
					},
					"--dsw-alias-label-primary-inverted": {
						light: "#FFFFFF",
						dark: "#1F1A2C"
					},
					"--dsw-alias-label-primary-foreground": {
						light: "#FFFFFF",
						dark: "#120F1A"
					},
					"--dsw-alias-brand-primary": {
						light: "#2A2050",
						dark: "#EEEAF8"
					},
					"--dsw-alias-brand-text": {
						light: "#2A2050",
						dark: "#EEEAF8"
					},
					"--dsw-alias-brand-primary-invert": {
						light: "#FFFFFF",
						dark: "#120F1A"
					},
					"--dsw-alias-state-business-primary": {
						light: "#7A52D6",
						dark: "#A98AEC"
					},
					"--dsw-alias-state-business-tertiary": {
						light: "#EAE2FA",
						dark: "#241D38"
					},
					"--dsw-alias-state-success-tertiary": {
						light: "#DDF3E4",
						dark: "#12271C"
					},
					"--dsw-alias-state-warn-tertiary": {
						light: "#FCEED6",
						dark: "#2A2416"
					},
					"--dsw-alias-button-primary-fill": {
						light: "#7A52D6",
						dark: "#8459DE"
					},
					"--dsw-alias-button-primary-hover": {
						light: "#8F6ADD",
						dark: "#9673E4"
					},
					"--dsw-alias-button-primary-dimmed": {
						light: "#EAE2FA",
						dark: "#1F1A2C"
					},
					"--dsw-alias-button-info-fill": {
						light: "#7A52D6",
						dark: "#A98AEC"
					},
					"--dsw-alias-button-info-hover": {
						light: "#8F6ADD",
						dark: "#B9A0F1"
					},
					"--dsw-alias-button-elevated-fill": {
						light: "#FFFFFF",
						dark: "#1F1A2C"
					},
					"--dsw-alias-button-floating-fill": {
						light: "#FFFFFF",
						dark: "#1F1A2C"
					},
					"--dsw-alias-button-floating-hover": {
						light: "#F0ECF9",
						dark: "#262035"
					},
					"--dsw-alias-button-contrast-fill": {
						light: "#3B3059",
						dark: "#EEEAF8"
					},
					"--dsw-alias-button-ghost-active-fill": {
						light: "#E7E1F4",
						dark: "#262035"
					},
					"--dsw-alias-button-ghost-active-hover": {
						light: "#F0ECF9",
						dark: "#1F1A2C"
					},
					"--dsw-alias-button-ghost-active-border": {
						light: "#A292C6",
						dark: "#7E72A1"
					},
					"--dsw-alias-interactive-bg-hover": {
						light: "rgba(122, 82, 214, 0.08)",
						dark: "rgba(169, 138, 236, 0.1)"
					},
					"--dsw-alias-interactive-bg-hover-accent": {
						light: "rgba(122, 82, 214, 0.14)",
						dark: "rgba(169, 138, 236, 0.2)"
					},
					"--dsw-alias-interactive-bg-active": {
						light: "rgba(122, 82, 214, 0.2)",
						dark: "rgba(169, 138, 236, 0.26)"
					},
					"--dsw-alias-interactive-bg-hover-danger": {
						light: "rgba(236, 19, 19, 0.05)",
						dark: "rgba(242, 90, 90, 0.14)"
					},
					"--dsw-alias-interactive-bg-hover-solid": {
						light: "#F0ECF9",
						dark: "#262035"
					},
					"--dsw-alias-markdown-code-block": {
						light: "#F0ECF9",
						dark: "#100D17"
					},
					"--dsw-alias-markdown-code-block-banner": {
						light: "#F7F5FC",
						dark: "#15111F"
					}
				},
				lightSwatch: [
					"#F7F5FC",
					"#E7E1F4",
					"#7A52D6"
				],
				darkSwatch: [
					"#120F1A",
					"#262035",
					"#A98AEC"
				]
			}
		];
		/** Look up one skin by id (unknown/absent storage resolves to `none`). */
		function skinOf(id) {
			return SKINS.find((skin) => skin.id === id) ?? SKINS[0];
		}
		//#endregion
		//#region lib/types/client/skins/background-store.js
		/**
		* Blob persistence for the skin background image.
		*
		* The persisted form is one Blob in IndexedDB; the layer serves it to the
		* page as an object URL, so the multi-megabyte base64 data URL never lives
		* as a long-lived string copy (storage, layer field, backdrop src). A legacy
		* localStorage data URL migrates into this store on first load. Without
		* IndexedDB (node tests) the store reads empty and writes are no-ops: the
		* background is a browser-only surface and its persistence is best-effort,
		* like a localStorage denial.
		* @module dsh-web-enhanced/src/client/skins/background-store
		*/
		/** IndexedDB database holding singleton blobs. */
		const DB_NAME = "dsh-web-enhanced";
		/** Object store: purpose-named keys to Blob values. */
		const STORE = "blobs";
		/** Key of the skin background blob. */
		const BACKGROUND_KEY = "skin-background";
		/** Store layout version; fresh databases create the object store. */
		const DB_VERSION = 1;
		/**
		* Whether this environment has IndexedDB (node test runs do not).
		* @returns the availability flag the store wrappers guard on.
		*/
		function indexedDbAvailable() {
			return typeof indexedDB !== "undefined";
		}
		/** Memoized open promise; reset on failure so a later call can retry. */
		let dbPromise;
		/** Open (once) the singleton database, creating the store on first open. */
		function database() {
			dbPromise ??= new Promise((resolve, reject) => {
				const request = indexedDB.open(DB_NAME, DB_VERSION);
				request.onupgradeneeded = () => {
					request.result.createObjectStore(STORE);
				};
				request.onsuccess = () => {
					resolve(request.result);
				};
				request.onerror = () => {
					dbPromise = void 0;
					reject(request.error);
				};
				request.onblocked = () => {
					dbPromise = void 0;
					reject(/* @__PURE__ */ new Error("indexedDB open blocked"));
				};
			});
			return dbPromise;
		}
		/**
		* Run one store request to completion.
		* @param mode - transaction mode for the operation.
		* @param run - builds the request from the `blobs` object store.
		* @returns the request's result.
		*/
		async function transact(mode, run) {
			const db = await database();
			return new Promise((resolve, reject) => {
				const request = run(db.transaction(STORE, mode).objectStore(STORE));
				request.onsuccess = () => {
					resolve(request.result);
				};
				request.onerror = () => {
					reject(request.error);
				};
			});
		}
		/** The IndexedDB-backed background store: the skin layer's default {@link BackgroundStore}. */
		const backgroundStore = {
			async get() {
				if (!indexedDbAvailable()) return void 0;
				return transact("readonly", (blobs) => blobs.get(BACKGROUND_KEY));
			},
			async put(blob) {
				if (!indexedDbAvailable()) return;
				await transact("readwrite", (blobs) => blobs.put(blob, BACKGROUND_KEY));
			},
			async remove() {
				if (!indexedDbAvailable()) return;
				await transact("readwrite", (blobs) => blobs.delete(BACKGROUND_KEY));
			}
		};
		/**
		* Decode a base64 data URL into a Blob.
		* @param dataUrl - the `data:<mime>;base64,<payload>` form.
		* @returns the decoded bytes typed with the header's mime type.
		*/
		function dataUrlToBlob(dataUrl) {
			const comma = dataUrl.indexOf(",");
			const header = comma === -1 ? "" : dataUrl.slice(0, comma);
			const encoded = comma === -1 ? dataUrl : dataUrl.slice(comma + 1);
			const mime = /^data:([^;,]+)/u.exec(header)?.[1] ?? "application/octet-stream";
			const binary = atob(encoded);
			const bytes = new Uint8Array(binary.length);
			for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
			return new Blob([bytes], { type: mime });
		}
		//#endregion
		//#region \0dsh-css:D:\Documents\Dev-Repo\deepseek-harness\dsh-plugins\dsh-web-enhanced\src\client\skins\skin-bg.module.css.mjs
		const css$20 = ".fRJphW_backdrop{z-index:0;pointer-events:none;position:fixed;inset:0;overflow:hidden}.fRJphW_image{object-fit:cover;width:100%;height:100%;display:block}.fRJphW_veilLight,.fRJphW_veilDark{backdrop-filter:blur(3px)saturate(.9);position:absolute;inset:0}.fRJphW_veilLight{background:#fafbfddb}.fRJphW_veilDark{background:#090d14d1;display:none}body[data-ds-dark-theme] .fRJphW_veilLight{display:none}body[data-ds-dark-theme] .fRJphW_veilDark{display:block}body[data-dsh-webenhanced-skin-bg=true] [data-composer-seat]{background:linear-gradient(180deg, transparent 0px, var(--dsw-alias-bg-overlay,#e9ecf2) 36px)!important}";
		const tagId$20 = "dsh-web-enhanced/skin-bg.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$20) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId$20;
			tag.textContent = css$20;
			document.head.appendChild(tag);
		}
		var skin_bg_module_css_default = {
			"backdrop": "fRJphW_backdrop",
			"image": "fRJphW_image",
			"veilDark": "fRJphW_veilDark",
			"veilLight": "fRJphW_veilLight"
		};
		//#endregion
		//#region lib/types/client/skins/skin-layer.js
		/**
		* Skin layer: the skin system's runtime half. Owns the durable skin choice
		* (localStorage — a browser-local visual preference, like the selected-session
		* key) and stacks the chosen skin's token layer onto the theme service's
		* override stack. The custom background persists as one Blob in IndexedDB
		* (see `background-store.ts`) and lives in the page as an object URL — no
		* long-lived base64 string copies. Re-calling `overrideTokens` with the same
		* source replaces the layer, so switching skins is one call and disposing the
		* plugin (or the empty `none` layer) restores the stock palette exactly.
		*
		* The theme service is read uninjected through a structural face: a
		* deployment composed without it keeps every other feature of this plugin and
		* the skin page reports unavailable instead of failing the entry.
		* @module dsh-web-enhanced/src/client/skins/skin-layer
		*/
		/** localStorage key carrying the selected skin id. */
		const SKIN_STORAGE_KEY = "dsh.web-enhanced.skin";
		/** Legacy localStorage key of the background data URL; migrates to the blob store. */
		const SKIN_BACKGROUND_KEY = "dsh.web-enhanced.skin-bg";
		/** The layer's identity in the theme override stack (inspection-visible). */
		const OVERRIDE_SOURCE = "dsh-web-enhanced";
		/**
		* The skin system runtime: persisted choice plus one override layer on the
		* theme stack. Created once in the client entry; the settings panel talks to
		* it only through {@link SkinFace}.
		*/
		var SkinLayer = class {
			theme;
			store;
			skin;
			backgroundUrl = "";
			backdrop;
			alive = true;
			initStarted = false;
			readyPromise = Promise.resolve();
			/**
			* @param ctx - client root context (the override layer, the background
			* load, the background node, and the `theme/change` listener are effects,
			* released on plugin dispose).
			* @param store - background blob persistence; defaults to the IndexedDB
			* wrapper (tests inject an in-memory double).
			*/
			constructor(ctx, store = backgroundStore) {
				this.theme = ctx.get("theme");
				this.store = store;
				let storedSkin = null;
				try {
					storedSkin = localStorage.getItem(SKIN_STORAGE_KEY);
				} catch {}
				this.skin = skinOf(storedSkin ?? "none");
				if (this.theme !== void 0) {
					const theme = this.theme;
					ctx.effect(() => theme.overrideTokens(OVERRIDE_SOURCE, this.tokensOf()), "web-enhanced: skin token layer");
				}
				ctx.effect(() => {
					this.readyPromise = this.initBackground();
					return () => {
						this.alive = false;
						this.unmountBackdrop();
						this.releaseBackground();
					};
				}, "web-enhanced: skin background layer");
			}
			/** Whether the theme service is composed (the skin page's availability). */
			get available() {
				return this.theme !== void 0;
			}
			/** The active skin definition. */
			getSkin() {
				return this.skin;
			}
			/** Resolves once the persisted background has settled; never rejects. */
			ready() {
				return this.readyPromise;
			}
			/**
			* Switch the skin: persist the choice and replace the override layer.
			* @param id - a {@link SKIN_IDS} member.
			*/
			setSkin(id) {
				const next = skinOf(id);
				if (next === this.skin) return;
				this.skin = next;
				try {
					localStorage.setItem(SKIN_STORAGE_KEY, next.id);
				} catch {}
				this.theme?.overrideTokens(OVERRIDE_SOURCE, this.tokensOf());
			}
			/** The background image's object URL ('' when none is set). */
			getBackground() {
				return this.backgroundUrl;
			}
			/**
			* Set or clear the custom background: persist the blob, swap the fixed
			* backdrop node, and re-stack the token layer (a set background makes the
			* frame's base paint transparent so the image shows; every content surface
			* stays opaque).
			* @param dataUrl - the image as a data URL, or '' to clear.
			*/
			setBackground(dataUrl) {
				if (dataUrl === "") {
					if (this.backgroundUrl === "") return;
					this.releaseBackground();
					this.unmountBackdrop();
					this.store.remove().catch(() => {});
				} else {
					const blob = dataUrlToBlob(dataUrl);
					this.releaseBackground();
					this.backgroundUrl = URL.createObjectURL(blob);
					this.mountBackdrop();
					this.store.put(blob).catch(() => {});
				}
				this.theme?.overrideTokens(OVERRIDE_SOURCE, this.tokensOf());
			}
			/**
			* The token layer to stack: the skin's palette, plus a transparent
			* `--dsw-alias-bg-base` while a background is set (later spread wins over
			* the skin's own base value).
			*/
			tokensOf() {
				if (this.backgroundUrl === "") return this.skin.tokens;
				return {
					...this.skin.tokens,
					"--dsw-alias-bg-base": {
						light: "transparent",
						dark: "transparent"
					}
				};
			}
			/**
			* Load the persisted background once: a legacy localStorage data URL
			* migrates into the blob store first (best-effort; an undecodable value
			* paints nothing, a failed put retries next session), then the blob is
			* revealed as one object URL plus the transparent-base token layer. A
			* dispose before the load settles leaves the page without a background.
			*/
			async initBackground() {
				if (this.initStarted) return;
				this.initStarted = true;
				const legacy = this.readLegacyBackground();
				let blob;
				if (legacy !== "") try {
					blob = dataUrlToBlob(legacy);
					await this.store.put(blob);
					try {
						localStorage.removeItem(SKIN_BACKGROUND_KEY);
					} catch {}
				} catch {}
				else try {
					blob = await this.store.get();
				} catch {}
				if (blob === void 0 || !this.alive) return;
				this.backgroundUrl = URL.createObjectURL(blob);
				this.mountBackdrop();
				this.theme?.overrideTokens(OVERRIDE_SOURCE, this.tokensOf());
			}
			/** The legacy localStorage data URL, '' when absent or unreadable. */
			readLegacyBackground() {
				try {
					return localStorage.getItem("dsh.web-enhanced.skin-bg") ?? "";
				} catch {
					return "";
				}
			}
			/** (Re)build the fixed backdrop under the app frame; a no-op without one set. */
			mountBackdrop() {
				if (typeof document === "undefined") return;
				this.unmountBackdrop();
				if (this.backgroundUrl === "") return;
				const image = document.createElement("img");
				image.className = skin_bg_module_css_default.image;
				image.alt = "";
				image.src = this.backgroundUrl;
				const veilLight = document.createElement("div");
				veilLight.className = skin_bg_module_css_default.veilLight;
				const veilDark = document.createElement("div");
				veilDark.className = skin_bg_module_css_default.veilDark;
				const backdrop = document.createElement("div");
				backdrop.className = skin_bg_module_css_default.backdrop;
				backdrop.setAttribute("aria-hidden", "true");
				backdrop.setAttribute("data-dsh-webenhanced-skin-bg", "");
				backdrop.append(image, veilLight, veilDark);
				document.body.prepend(backdrop);
				document.body.dataset.dshWebenhancedSkinBg = "true";
				this.backdrop = backdrop;
			}
			/** Remove the live backdrop node, if any. */
			unmountBackdrop() {
				this.backdrop?.remove();
				this.backdrop = void 0;
				if (typeof document !== "undefined") delete document.body.dataset.dshWebenhancedSkinBg;
			}
			/** Revoke the live object URL, if any, and clear the background state. */
			releaseBackground() {
				if (this.backgroundUrl === "") return;
				URL.revokeObjectURL(this.backgroundUrl);
				this.backgroundUrl = "";
			}
			/** The resolved color scheme (drives the swatch preview's active half). */
			isDark() {
				return this.theme?.getTheme().active.colorScheme === "dark";
			}
			/**
			* Subscribe to theme changes (scheme flips while the preference rides
			* `system`, or later override layers re-stacking).
			* @param ctx - client root context (the listener is an effect).
			* @param listener - invoked with the resolved dark flag on every change.
			* @returns the disposer.
			*/
			onChange(ctx, listener) {
				if (this.theme === void 0) return () => {};
				return ctx.effect(() => ctx.on("theme/change", () => {
					listener(this.isDark());
				}), "web-enhanced: skin scheme sync");
			}
		};
		//#endregion
		//#region lib/types/client/navbar/pin-store.js
		/**
		* Pin store: per-session curated turns behind the navbar's gold pills.
		*
		* Persistence is localStorage keyed per session id (a client-only reading
		* aid, like the selected-session key). The DOM attributes the navbar reads
		* (`data-we-nav-pinned` / `data-we-nav-pin-text` on the chat row) are a
		* projection this store owns; storage is injectable so node tests run it
		* against a Map.
		* @module dsh-web-enhanced/src/client/navbar/pin-store
		*/
		/** Create one pin store bound to a storage seam. */
		function createPinStore(storage) {
			const key = (sessionId) => `dsh.web-enhanced.navbar.pins:${sessionId}`;
			/** Parse a session's stored list; corruption reads as empty. */
			const load = (sessionId) => {
				try {
					const raw = storage.getItem(key(sessionId));
					if (raw === null) return [];
					const parsed = JSON.parse(raw);
					if (!Array.isArray(parsed)) return [];
					return parsed.filter((item) => {
						if (typeof item !== "object" || item === null) return false;
						const record = item;
						return typeof record["messageId"] === "string" && typeof record["text"] === "string" && typeof record["ts"] === "number" && (record["turn"] === void 0 || typeof record["turn"] === "number");
					});
				} catch {
					return [];
				}
			};
			const write = (sessionId, pins) => {
				storage.setItem(key(sessionId), JSON.stringify(pins));
			};
			return {
				load,
				/**
				* Whether one message is pinned.
				* @param sessionId - the owning session.
				* @param messageId - the assistant message id.
				*/
				isPinned(sessionId, messageId) {
					return load(sessionId).some((item) => item.messageId === messageId);
				},
				/**
				* Stored context text of one pin.
				* @param sessionId - the owning session.
				* @param messageId - the assistant message id.
				*/
				textOf(sessionId, messageId) {
					return load(sessionId).find((item) => item.messageId === messageId)?.text;
				},
				/**
				* Pinned turn numbers of one session (rows carry `data-turn-tail`).
				* @param sessionId - the owning session.
				*/
				turnsOf(sessionId) {
					const turns = /* @__PURE__ */ new Set();
					for (const pin of load(sessionId)) if (pin.turn !== void 0 && Number.isFinite(pin.turn)) turns.add(pin.turn);
					return turns;
				},
				/**
				* Stored context text of one pinned turn.
				* @param sessionId - the owning session.
				* @param turn - the turn number.
				*/
				textOfTurn(sessionId, turn) {
					return load(sessionId).find((item) => item.turn === turn)?.text;
				},
				/**
				* Pin or unpin one message.
				* @param sessionId - the owning session.
				* @param messageId - the assistant message id.
				* @param text - curated context text.
				* @param turn - the turn number, when known.
				* @returns true when the message is pinned after the call.
				*/
				toggle(sessionId, messageId, text, turn) {
					const pins = [...load(sessionId)];
					const index = pins.findIndex((item) => item.messageId === messageId);
					if (index >= 0) {
						pins.splice(index, 1);
						write(sessionId, pins);
						return false;
					}
					pins.push({
						messageId,
						text,
						ts: Date.now(),
						...turn !== void 0 ? { turn } : {}
					});
					write(sessionId, pins);
					return true;
				}
			};
		}
		/** The live store over the browser's localStorage. */
		const pinStore = typeof localStorage === "undefined" ? createPinStore({
			getItem: () => null,
			setItem: () => {}
		}) : createPinStore(localStorage);
		/**
		* Number of unrendered older turns the navbar should still represent.
		*
		* The host virtualizes the transcript, so the DOM only carries the loaded
		* tail window. The first rendered user row's turn number is the exact count
		* of earlier turns when available; otherwise the whole-log `sessionStats`
		* projection supplies a lower bound.
		* @param firstTurn - turn number of the first rendered user row, when known.
		* @param totalTurns - whole-log counted turns from the sessionStats projection.
		* @param renderedCount - user rows currently materialized in the DOM.
		* @returns virtual leading dots to render above the materialized range.
		*/
		function olderNodeCount(firstTurn, totalTurns, renderedCount) {
			if (renderedCount <= 0) return 0;
			if (firstTurn !== null && Number.isSafeInteger(firstTurn) && firstTurn > 0) return Math.max(0, firstTurn - 1);
			return Math.max(0, totalTurns - renderedCount);
		}
		/**
		* Cap the number of per-turn virtual dots for unrendered older turns.
		*
		* The strip still navigates into the page beyond `加载更早`, but a session
		* with thousands of earlier turns must not materialize one button per turn.
		* The closest {@link MAX_OLDER_DOTS} turns stay individually addressable;
		* anything older folds into one "load older" marker.
		* @param count - unrendered older turns.
		* @param max - per-turn dot budget.
		* @returns how many turns fold away and how many get dots.
		*/
		function olderWindow(count, max = 200) {
			const visible = Math.min(Math.max(0, count), max);
			return {
				hidden: Math.max(0, count - visible),
				visible
			};
		}
		/**
		* Compute the visible window.
		* @param count - total user-message nodes (>= 0).
		* @param active - the active node index (-1 when none).
		* @param pinnedIndexes - node indexes that must stay visible (ascending).
		* @param windowSize - node count past which windowing starts.
		* @param halfWindow - nodes on either side of the active one.
		* @returns the clamped visible range (lo <= hi when any node exists).
		*/
		function navWindow(count, active, pinnedIndexes, windowSize = 11, halfWindow = 5) {
			if (count <= 0) return {
				lo: 0,
				hi: -1
			};
			if (count <= windowSize) return {
				lo: 0,
				hi: count - 1
			};
			const anchor = Math.min(Math.max(active, 0), count - 1);
			let lo = Math.max(0, anchor - halfWindow);
			let hi = Math.min(count - 1, anchor + halfWindow);
			for (const index of pinnedIndexes) if (index >= 0 && index < count) {
				lo = Math.min(lo, index);
				hi = Math.max(hi, index);
			}
			return {
				lo,
				hi
			};
		}
		//#endregion
		//#region lib/types/client/navbar/index.js
		/**
		* Conversation node navbar: an equidistant node strip on the chat flow's
		* right edge — one node per user message. The active pill follows the
		* reading position, hover/focus shows a glass preview card (6-line clamp),
		* a click smooth-jumps to that message, >11 nodes slide a window around the
		* active one, and pinned turns (gold pills, from the assistant action bar)
		* stay visible and jump straight to the curated reply.
		*
		* Zero data-channel dependency: everything reads the host's own DOM anchors
		* (`data-time-hover-root` rows, the `data-chat-flow` column, `data-turn-tail`
		* turn numbers). All listeners, observers, and nodes are created through one
		* disposer, so unloading the plugin retracts the strip exactly.
		*
		* Ported from the reference dsh-navbar plugin (v0.3.0), attribute namespace
		* renamed to this plugin's (`data-dsh-we-navbar` / `data-we-nav-*`).
		* @module dsh-web-enhanced/src/client/navbar
		*/
		/**
		* Mount the navbar for this page.
		* @param ctx - client root context (slots for the pin action).
		* @returns the disposer removing every node, listener, and observer.
		*/
		function applyNavbar(ctx) {
			if (typeof document === "undefined") return () => {};
			const body = document.body;
			if (body === null) return () => {};
			const sessions = ctx.sessions;
			const t = ctx.locale.bind("webEnhanced");
			const STYLE_ID = "dsh-web-enhanced-navbar-style";
			if (document.getElementById(STYLE_ID) === null) {
				const style = document.createElement("style");
				style.id = STYLE_ID;
				style.textContent = `
[data-dsh-we-navbar] {
  position: fixed; top: 50%; transform: translateY(-50%); z-index: 900;
  display: flex; flex-direction: column; gap: 10px; padding: 8px;
  border-radius: 12px; font-family: system-ui;
  max-height: calc(100vh - 32px); overflow-y: auto;
  scrollbar-width: none;
  background: transparent; border: 1px solid transparent;
  transition: background .18s ease, border-color .18s ease;
}
[data-dsh-we-navbar]::-webkit-scrollbar { display: none; }
[data-we-nav-dot] {
  width: 7px; height: 7px; border-radius: 999px; padding: 0; border: none;
  background: rgba(128, 128, 140, .45); cursor: pointer; flex: none; position: relative;
  transition: background .22s ease, transform .22s ease;
}
/* Hit area: the visual pill stays 7px; ::after widens it to a 13px target. */
[data-we-nav-dot]::after {
  content: ''; position: absolute; inset: -3px; border-radius: 999px;
}
[data-we-nav-dot]:hover { }
[data-we-nav-dot][data-virtual-turn] {
  width: 5px; height: 5px; background: rgba(128, 128, 140, .28);
}
[data-we-nav-dot][data-virtual-turn].hover,
[data-we-nav-dot][data-virtual-turn]:hover {
  width: 14px; background: rgba(128, 128, 140, .6);
}
[data-we-nav-dot].active, [data-we-nav-dot].hover, [data-we-nav-dot].pinned {
  transition: width .22s ease, height .22s ease, background .22s ease, transform .22s ease;
}
[data-we-nav-dot].active {
  width: 22px; border-radius: 999px;
  background: var(--dsw-alias-text-accent, #4c9aff);
}
[data-we-nav-dot].hover {
  width: 22px; border-radius: 999px; transform: none;
  background: rgba(128, 128, 140, .8);
}
[data-we-nav-dot].active.hover { background: var(--dsw-alias-text-accent, #4c9aff); }
[data-we-nav-preview] {
  position: fixed; z-index: 910; width: 244px; box-sizing: border-box;
  padding: 12px 16px; border-radius: 12px; font-size: 12px; line-height: 1.55;
  color: var(--dsw-alias-text-1, #eee);
  background: var(--dsw-hovercard-bg, #2C2C2E);
  box-shadow: var(--dsw-shadow-lv3);
  overflow: hidden; white-space: pre-wrap; word-break: break-word;
  display: -webkit-box; -webkit-line-clamp: 6; -webkit-box-orient: vertical;
  pointer-events: none;
}
[data-we-nav-more] { width: 3px; height: 3px; border-radius: 999px; background: rgba(128,128,140,.5); flex: none; }
[data-we-nav-older-more] {
  width: 5px; height: 5px; border-radius: 999px; padding: 0; border: 1px dashed rgba(128,128,140,.55);
  background: transparent; cursor: pointer; flex: none;
}
[data-we-nav-older-more]:hover { background: rgba(128,128,140,.35); }
[data-we-nav-dot].pinned {
  width: 14px; height: 8px; border-radius: 999px; background: #f0b429;
}
[data-we-nav-dot].pinned.hover {
  width: 22px; height: 8px; background: #f0b429;
}
[data-we-nav-dot].active.pinned {
  width: 22px; height: 8px; border-radius: 999px;
  background: #f0b429; filter: none;
}
[data-we-nav-pin-button] {
  width: 28px; height: 28px; padding: 6px; border: none; border-radius: 28px;
  display: inline-flex; align-items: center; justify-content: center;
  color: var(--dsw-alias-label-tertiary); background: transparent; cursor: pointer;
  transition: background .18s ease, color .18s ease;
}
[data-we-nav-pin-button]:hover { background: var(--dsw-alias-interactive-bg-hover); color: var(--dsw-alias-label-secondary); }
[data-we-nav-pin-button][data-active] { color: #f0b429; }
@media (prefers-reduced-motion: reduce) {
  [data-dsh-we-navbar], [data-we-nav-dot], [data-we-nav-dot].active {
    transition: none; animation: none;
  }
}
`;
				document.head.appendChild(style);
			}
			const bar = document.createElement("nav");
			bar.setAttribute("data-dsh-we-navbar", "");
			bar.setAttribute("aria-label", "用户消息导航");
			body.appendChild(bar);
			const preview = document.createElement("div");
			preview.setAttribute("data-we-nav-preview", "");
			preview.style.display = "none";
			body.appendChild(preview);
			const flowOf = () => document.querySelector("[data-chat-flow=\"\"]");
			const scrollerOf = () => {
				let node = flowOf()?.parentElement ?? null;
				while (node !== null) {
					const style = getComputedStyle(node);
					if (style.overflowY === "auto" || style.overflowY === "scroll") return node;
					node = node.parentElement;
				}
				return null;
			};
			/** All message rows, excluding pending steering. */
			const allRows = () => [...document.querySelectorAll("[data-time-hover-root]")].filter((row) => !row.hasAttribute("data-pending-steering"));
			/**
			* User rows: a message row with a bubble that is not a turn-tail row. The
			* tail check is what keeps host tooltips (whose class contains "bubble")
			* mounted inside tail rows from counting as user messages.
			*/
			const userRows = () => allRows().filter((row) => !row.hasAttribute("data-turn-tail") && row.querySelector("[class*=\"bubble\"]") !== null);
			/** Turn number owning user row i, read from the turn-tail row in its range. */
			const turnOfUserIndex = (all, rows, i) => {
				const row = rows[i];
				if (row === void 0) return null;
				const start = all.indexOf(row);
				if (start < 0) return null;
				const end = i + 1 < rows.length ? all.indexOf(rows[i + 1] ?? row) : all.length;
				for (let k = start; k < end; k++) {
					const turn = Number(all[k]?.getAttribute("data-turn-tail") ?? NaN);
					if (Number.isFinite(turn)) return turn;
				}
				return null;
			};
			/** The currently rendered user row owning a turn number, if any. */
			const rowOfTurn = (turn) => {
				const rows = userRows();
				const all = allRows();
				for (let i = 0; i < rows.length; i++) if (turnOfUserIndex(all, rows, i) === turn) return rows[i] ?? null;
				return null;
			};
			const position = () => {
				const flow = flowOf();
				if (flow === null) return;
				const right = flow.getBoundingClientRect().right;
				const next = Math.round(Math.min(right + 12, window.innerWidth - bar.offsetWidth - 8));
				const nextLeft = `${Math.max(8, next)}px`;
				if (bar.style.left !== nextLeft) bar.style.left = nextLeft;
			};
			let posScheduled = false;
			const requestPosition = () => {
				if (posScheduled) return;
				posScheduled = true;
				requestAnimationFrame(() => {
					posScheduled = false;
					position();
				});
			};
			let activeIndex = -1;
			/** Active = the topmost user message inside the viewport (the reading head). */
			const computeActive = () => {
				const rows = userRows();
				if (rows.length === 0) return -1;
				let best = 0;
				let found = false;
				let bestTop = Number.POSITIVE_INFINITY;
				for (let i = 0; i < rows.length; i++) {
					const top = rows[i]?.getBoundingClientRect().top ?? Number.POSITIVE_INFINITY;
					if (top >= 0 && top < bestTop) {
						bestTop = top;
						best = i;
						found = true;
					}
				}
				return found ? best : rows.length - 1;
			};
			let currentSessionId = null;
			const syncSessionId = () => {
				const selected = sessions.list.getSnapshot().current;
				if (selected !== void 0 && String(selected) !== "") {
					currentSessionId = String(selected);
					return;
				}
				const button = document.querySelector("[data-we-nav-pin-button][data-session-id]");
				if (button !== null) currentSessionId = button.getAttribute("data-session-id") ?? currentSessionId;
			};
			let statsFace;
			let disposeStats = () => {};
			const statsOf = () => {
				const turns = (statsFace?.getSnapshot())?.turns;
				return Number.isSafeInteger(turns) && turns >= 0 ? turns : 0;
			};
			const syncStatsFace = () => {
				const id = currentSessionId;
				const next = (id === null ? void 0 : sessions.binding(id))?.session.projections.faceOf("sessionStats");
				if (next === statsFace) return;
				disposeStats();
				statsFace = next;
				disposeStats = next === void 0 ? () => {} : next.subscribe(scheduleRender);
			};
			/** The pinned row inside user row i's turn, when that turn is curated. */
			const pinnedRowOf = (all, rows, i, turns) => {
				const row = rows[i];
				if (row === void 0) return null;
				const start = all.indexOf(row);
				if (start < 0) return null;
				const end = i + 1 < rows.length ? all.indexOf(rows[i + 1] ?? row) : all.length;
				if (end < 0) return null;
				for (let k = start; k < end; k++) {
					const row = all[k];
					if (row === void 0) continue;
					if (row.hasAttribute("data-we-nav-pinned")) return {
						row,
						text: row.getAttribute("data-we-nav-pin-text") ?? ""
					};
					const turn = Number(row.getAttribute("data-turn-tail") ?? NaN);
					if (Number.isFinite(turn) && currentSessionId !== null && turns.has(turn)) return {
						row,
						text: pinStore.textOfTurn(currentSessionId, turn) ?? ""
					};
				}
				return null;
			};
			const positionPreview = (anchor) => {
				const rect = anchor.getBoundingClientRect();
				preview.style.right = `${window.innerWidth - rect.left + 14}px`;
				preview.style.top = `${Math.min(window.innerHeight - 120, rect.top - 12)}px`;
			};
			const showPreview = (row, anchor, pinned) => {
				let text;
				if (pinned !== null) {
					text = pinned.text.trim();
					if (text === "") text = ((row.querySelector("[class*=\"bubble\"]") ?? row).textContent ?? "").trim();
				} else text = ((row.querySelector("[class*=\"bubble\"]") ?? row).textContent ?? "").trim();
				if (text === "") return;
				preview.textContent = text;
				preview.style.display = "block";
				positionPreview(anchor);
			};
			const hidePreview = () => {
				preview.style.display = "none";
			};
			let lo = 0;
			let builtRows = [];
			let scheduleRender = () => {};
			const jumpToRow = (row) => {
				const scroller = scrollerOf();
				if (scroller === null) return;
				scroller.dispatchEvent(new WheelEvent("wheel", {
					deltaY: -1,
					bubbles: true,
					cancelable: true
				}));
				scroller.scrollTop = scroller.scrollTop + row.getBoundingClientRect().top - scroller.getBoundingClientRect().top;
			};
			/** Load older pages until a turn materializes, then jump to it. */
			const jumpToTurn = async (turn) => {
				for (let attempt = 0; attempt < 24; attempt++) {
					const row = rowOfTurn(turn);
					if (row !== null) {
						jumpToRow(row);
						return;
					}
					const id = currentSessionId;
					if (id === null) return;
					const binding = sessions.binding(id);
					if (binding === void 0) return;
					const snapshot = binding.session.getSnapshot();
					if (snapshot.loadingOlder) {
						await new Promise((resolve) => setTimeout(resolve, 120));
						continue;
					}
					if (!snapshot.hasMore) return;
					try {
						await binding.session.loadOlder();
					} catch {
						return;
					}
					await new Promise((resolve) => setTimeout(resolve, 60));
				}
			};
			/** Load one older page (the folded virtual-dot marker's action). */
			const loadOneOlderPage = async () => {
				const id = currentSessionId;
				if (id === null) return;
				const binding = sessions.binding(id);
				if (binding === void 0) return;
				const snapshot = binding.session.getSnapshot();
				if (!snapshot.hasMore || snapshot.loadingOlder) return;
				try {
					await binding.session.loadOlder();
					await new Promise((resolve) => setTimeout(resolve, 60));
				} catch {}
			};
			const dotsOf = () => [...bar.querySelectorAll("[data-we-nav-dot]")];
			const updateActiveClass = (active) => {
				let cursor = 0;
				dotsOf().forEach((dot) => {
					if (dot.hasAttribute("data-virtual-turn")) return;
					if (cursor + lo === active) dot.classList.add("active");
					else dot.classList.remove("active");
					cursor += 1;
				});
			};
			const render = () => {
				position();
				const rows = userRows();
				if (flowOf() === null || rows.length < 2) {
					bar.style.display = "none";
					return;
				}
				bar.style.display = "flex";
				const active = computeActive();
				activeIndex = active;
				const all = allRows();
				syncSessionId();
				syncStatsFace();
				const pinnedTurns = currentSessionId !== null ? pinStore.turnsOf(currentSessionId) : /* @__PURE__ */ new Set();
				const pinnedOf = (i) => pinnedRowOf(all, rows, i, pinnedTurns);
				const pinnedIndexes = [];
				for (let i = 0; i < rows.length; i++) if (pinnedOf(i) !== null) pinnedIndexes.push(i);
				const range = navWindow(rows.length, active, pinnedIndexes, 11, 5);
				lo = range.lo;
				const hi = range.hi;
				const older = olderNodeCount(turnOfUserIndex(all, rows, 0), statsOf(), rows.length);
				const olderView = olderWindow(older, 200);
				const expectedCount = (olderView.hidden > 0 ? 1 : 0) + olderView.visible + (lo > 0 ? 1 : 0) + (hi - lo + 1) + (hi < rows.length - 1 ? 1 : 0);
				if (rows.length === builtRows.length && rows.every((row, i) => row === builtRows[i]) && bar.childElementCount === expectedCount) {
					updateActiveClass(active);
					let cursor = 0;
					dotsOf().forEach((dot) => {
						if (dot.hasAttribute("data-virtual-turn")) return;
						if (pinnedOf(cursor + lo) !== null) dot.classList.add("pinned");
						else dot.classList.remove("pinned");
						cursor += 1;
					});
					return;
				}
				bar.textContent = "";
				const appendMore = () => {
					const more = document.createElement("span");
					more.setAttribute("data-we-nav-more", "");
					bar.appendChild(more);
				};
				if (olderView.hidden > 0) {
					const more = document.createElement("button");
					more.type = "button";
					more.setAttribute("data-we-nav-older-more", "");
					more.setAttribute("aria-label", t("navbar.olderMore", { count: String(olderView.hidden) }));
					more.setAttribute("title", t("navbar.olderMore", { count: String(olderView.hidden) }));
					more.addEventListener("focus", () => {
						preview.textContent = t("navbar.olderMore", { count: String(olderView.hidden) });
						preview.style.display = "block";
						positionPreview(more);
					});
					more.addEventListener("blur", hidePreview);
					more.addEventListener("click", () => {
						loadOneOlderPage();
					});
					bar.appendChild(more);
				}
				for (let turn = olderView.hidden + 1; turn <= older; turn++) {
					const dot = document.createElement("button");
					dot.type = "button";
					dot.setAttribute("data-we-nav-dot", "");
					dot.setAttribute("data-virtual-turn", String(turn));
					dot.setAttribute("aria-label", t("navbar.olderTurn", { turn: String(turn) }));
					if (pinnedTurns.has(turn)) dot.classList.add("pinned");
					dot.addEventListener("focus", () => {
						preview.textContent = t("navbar.olderTurn", { turn: String(turn) });
						preview.style.display = "block";
						positionPreview(dot);
					});
					dot.addEventListener("blur", hidePreview);
					dot.addEventListener("click", () => {
						jumpToTurn(turn);
					});
					bar.appendChild(dot);
				}
				if (lo > 0) appendMore();
				for (let i = lo; i <= hi; i++) {
					const index = i;
					const dot = document.createElement("button");
					dot.type = "button";
					dot.setAttribute("data-we-nav-dot", "");
					const pinned = pinnedOf(index);
					dot.setAttribute("aria-label", `user #${index + 1}${pinned !== null ? "（已精选）" : ""}（点击跳转）`);
					const slot = index - lo;
					dot.addEventListener("focus", () => {
						const row = userRows()[lo + slot];
						if (row !== void 0) showPreview(row, dot, pinnedOf(lo + slot));
					});
					dot.addEventListener("blur", hidePreview);
					dot.addEventListener("click", () => {
						const row = userRows()[lo + slot];
						if (row === void 0) return;
						jumpToRow(pinnedOf(lo + slot)?.row ?? row);
					});
					if (index === active) dot.classList.add("active");
					if (pinned !== null) dot.classList.add("pinned");
					bar.appendChild(dot);
				}
				if (hi < rows.length - 1) appendMore();
				builtRows = rows;
			};
			let flow = null;
			let sizeObserver = null;
			const bindFlow = () => {
				const next = flowOf();
				if (next === flow) return false;
				flow = next;
				sizeObserver?.disconnect();
				sizeObserver = null;
				if (flow !== null) {
					sizeObserver = new ResizeObserver(() => {
						requestPosition();
					});
					let el = flow;
					while (el !== null && el !== body) {
						sizeObserver.observe(el);
						el = el.parentElement;
					}
				}
				position();
				return true;
			};
			bindFlow();
			window.addEventListener("resize", requestPosition);
			let scrollScheduled = false;
			const updateActive = () => {
				scrollScheduled = false;
				const next = computeActive();
				if (next === activeIndex) return;
				activeIndex = next;
				render();
			};
			const scheduleActive = () => {
				if (scrollScheduled) return;
				scrollScheduled = true;
				requestAnimationFrame(updateActive);
			};
			let intersection = null;
			const bindIntersection = () => {
				intersection?.disconnect();
				const root = scrollerOf();
				if (root === null) return;
				intersection = new IntersectionObserver(scheduleActive, {
					root,
					rootMargin: "0px 0px -15% 0px",
					threshold: [
						0,
						.25,
						.5,
						.75,
						1
					]
				});
				for (const row of userRows()) intersection.observe(row);
			};
			bindIntersection();
			render();
			let renderScheduled = false;
			scheduleRender = () => {
				if (renderScheduled) return;
				renderScheduled = true;
				requestAnimationFrame(() => {
					renderScheduled = false;
					render();
				});
			};
			const observer = new MutationObserver((mutations) => {
				if (bindFlow()) {
					bindIntersection();
					scheduleRender();
					return;
				}
				bindIntersection();
				for (const mutation of mutations) {
					if (mutation.target === bar || bar.contains(mutation.target)) continue;
					if (mutation.target === preview || preview.contains(mutation.target)) continue;
					if (flow !== null && (mutation.target === flow || flow.contains(mutation.target))) {
						scheduleRender();
						return;
					}
				}
			});
			observer.observe(body, {
				childList: true,
				subtree: true
			});
			const nearestDot = (y) => {
				const dots = dotsOf();
				if (dots.length === 0) return null;
				let best = null;
				let bestSlot = -1;
				let bestVirtual = null;
				let bestDist = Number.POSITIVE_INFINITY;
				let cursor = 0;
				for (const dot of dots) {
					const rect = dot.getBoundingClientRect();
					const distance = Math.abs(rect.top + rect.height / 2 - y);
					if (distance < bestDist) {
						bestDist = distance;
						best = dot;
						bestSlot = cursor;
						const virtual = dot.getAttribute("data-virtual-turn");
						bestVirtual = virtual === null ? null : Number(virtual);
					}
					if (!dot.hasAttribute("data-virtual-turn")) cursor += 1;
				}
				if (best === null) return null;
				return {
					dot: best,
					row: bestVirtual === null ? userRows()[lo + bestSlot] ?? null : null,
					slot: bestSlot,
					virtualTurn: bestVirtual
				};
			};
			const hoverableDot = (y) => {
				const dots = dotsOf();
				if (dots.length === 0) return null;
				const first = dots[0]?.getBoundingClientRect();
				const last = dots[dots.length - 1]?.getBoundingClientRect();
				if (first === void 0 || last === void 0) return null;
				if (y < first.top - 1 || y > last.bottom + 1) return null;
				return nearestDot(y);
			};
			let hoverScheduled = false;
			let hoverRow = null;
			let hoverAnchor = null;
			let hoverDot = null;
			let lastHoverY = null;
			const setHoverDot = (dot) => {
				if (hoverDot === dot) return;
				hoverDot?.classList.remove("hover");
				hoverDot = dot;
				dot?.classList.add("hover");
			};
			const applyHover = (y) => {
				const hit = hoverableDot(y);
				setHoverDot(hit?.dot ?? null);
				if (hit === null) {
					hoverRow = null;
					hoverAnchor = null;
					hidePreview();
					return;
				}
				if (hit.virtualTurn !== null) {
					hoverRow = null;
					hoverAnchor = hit.dot;
					preview.textContent = t("navbar.olderTurn", { turn: String(hit.virtualTurn) });
					preview.style.display = "block";
					positionPreview(hit.dot);
					return;
				}
				if (hit.row === null) {
					hidePreview();
					return;
				}
				if (hoverRow === hit.row && hoverAnchor === hit.dot) return;
				hoverRow = hit.row;
				hoverAnchor = hit.dot;
				const turns = currentSessionId !== null ? pinStore.turnsOf(currentSessionId) : /* @__PURE__ */ new Set();
				const pinned = pinnedRowOf(allRows(), userRows(), lo + hit.slot, turns);
				showPreview(hit.row, hit.dot, pinned);
			};
			const onBarMove = (event) => {
				lastHoverY = event.clientY;
				if (hoverScheduled) return;
				hoverScheduled = true;
				requestAnimationFrame(() => {
					hoverScheduled = false;
					if (lastHoverY !== null) applyHover(lastHoverY);
				});
			};
			const onBarLeave = () => {
				lastHoverY = null;
				setHoverDot(null);
				hoverRow = null;
				hoverAnchor = null;
				hidePreview();
			};
			bar.addEventListener("mousemove", onBarMove);
			bar.addEventListener("mouseleave", onBarLeave);
			bar.addEventListener("click", (event) => {
				const target = event.target;
				if (target !== null && target.closest("[data-we-nav-dot]") !== null) return;
				const hit = nearestDot(event.clientY);
				if (hit === null) return;
				if (hit.virtualTurn !== null) {
					jumpToTurn(hit.virtualTurn);
					return;
				}
				if (hit.row === null) return;
				const turns = currentSessionId !== null ? pinStore.turnsOf(currentSessionId) : /* @__PURE__ */ new Set();
				const pinned = pinnedRowOf(allRows(), userRows(), lo + hit.slot, turns);
				if (pinned !== null) jumpToRow(pinned.row);
				else jumpToRow(hit.row);
			});
			let lastWheelAt = 0;
			bar.addEventListener("wheel", (event) => {
				event.preventDefault();
				const now = performance.now();
				if (now - lastWheelAt < 120) return;
				lastWheelAt = now;
				const rows = userRows();
				if (rows.length < 2) return;
				const base = activeIndex >= 0 ? activeIndex : computeActive();
				if (base < 0) return;
				const next = Math.min(rows.length - 1, Math.max(0, base + (event.deltaY > 0 ? 1 : -1)));
				const row = rows[next];
				if (next === base || row === void 0) return;
				jumpToRow(row);
			}, { passive: false });
			/** Context text of a pin: the turn's user message, truncated. */
			const pinRowText = (button) => {
				let el = button?.closest("[data-time-hover-root]") ?? null;
				while (el !== null) {
					const bubble = el.querySelector("[class*=\"bubble\"]");
					if (el.hasAttribute("data-time-hover-root") && bubble !== null) {
						const text = ((bubble ?? el).textContent ?? "").trim();
						return text.length > 160 ? `${text.slice(0, 160)}…` : text;
					}
					el = el.previousElementSibling;
				}
				return "";
			};
			/** Project pin state onto the row and wake the strip (attributes bypass MO). */
			const syncPinRow = (button, isPinned, text) => {
				const row = button?.closest("[data-time-hover-root]");
				if (!(row instanceof HTMLElement)) return;
				if (isPinned) {
					row.setAttribute("data-we-nav-pinned", "");
					row.setAttribute("data-we-nav-pin-text", text ?? "");
				} else {
					row.removeAttribute("data-we-nav-pinned");
					row.removeAttribute("data-we-nav-pin-text");
				}
				scheduleRender();
			};
			function PinAction({ messageId, sessionId, t }) {
				const [active, setActive] = (0, react.useState)(() => messageId !== void 0 && pinStore.isPinned(sessionId, messageId));
				const ref = (0, react.useRef)(null);
				(0, react.useEffect)(() => {
					if (messageId === void 0) return;
					syncPinRow(ref.current, pinStore.isPinned(sessionId, messageId), pinStore.textOf(sessionId, messageId));
				}, [messageId, sessionId]);
				const label = active ? t("navbar.unpin") : t("navbar.pin");
				const button = (0, react.createElement)("button", {
					type: "button",
					ref,
					"data-we-nav-pin-button": "",
					"data-session-id": sessionId,
					"data-active": active || void 0,
					"aria-pressed": active,
					"aria-label": label,
					onClick: () => {
						if (messageId === void 0) return;
						const text = pinRowText(ref.current);
						const row = ref.current?.closest("[data-time-hover-root]");
						const turn = Number(row?.getAttribute("data-turn-tail") ?? NaN);
						const next = pinStore.toggle(sessionId, messageId, text, Number.isFinite(turn) ? turn : void 0);
						setActive(next);
						syncPinRow(ref.current, next, text);
					}
				}, (0, react.createElement)("svg", {
					width: 16,
					height: 16,
					viewBox: "0 0 24 24",
					fill: "currentColor",
					"aria-hidden": true
				}, (0, react.createElement)("path", { d: "M16 9V4h1c.55 0 1-.45 1-1s-.45-1-1-1H7c-.55 0-1 .45-1 1s.45 1 1 1h1v5c0 1.66-1.34 3-3 3v2h5.97v7l1 1 1-1v-7H19v-2c-1.66 0-3-1.34-3-3z" })));
				return (0, react.createElement)(_deepseek_ai_dsh_client_ui_primitives.Tooltip, {
					label,
					side: "bottom",
					children: button
				});
			}
			const disposePin = ctx.effect(() => ctx.slots.inject("conversation.chat.assistant-actions", () => {
				const dispose = ctx.slots.register({
					name: "conversation.chat.assistant-actions",
					id: "web-enhanced-navbar-pin",
					order: 5,
					locale: "webEnhanced",
					inject: (sessionId) => ({ sessionId })
				}, PinAction);
				return () => {
					dispose();
				};
			}), "web-enhanced: navbar pin action");
			return () => {
				disposePin();
				disposeStats();
				observer.disconnect();
				sizeObserver?.disconnect();
				intersection?.disconnect();
				window.removeEventListener("resize", requestPosition);
				bar.remove();
				preview.remove();
				document.getElementById(STYLE_ID)?.remove();
			};
		}
		//#endregion
		//#region \0dsh-css:D:\Documents\Dev-Repo\deepseek-harness\dsh-plugins\dsh-web-enhanced\src\client\model-picker\ModelPicker.module.css.mjs
		const css$19 = ".-Mw5AW_trigger{border:1px solid var(--dsw-alias-border-l2,#0000001a);min-width:132px;max-width:260px;color:inherit;cursor:pointer;background:0 0;border-radius:8px;align-items:center;gap:6px;padding:5px 8px;font-family:inherit;font-size:13px;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s;display:flex}.-Mw5AW_trigger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#2631480f)}.-Mw5AW_trigger:disabled{cursor:default;opacity:.5}.-Mw5AW_triggerLabel,.-Mw5AW_triggerEffort{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.-Mw5AW_triggerLabel{text-align:start;flex:1;min-width:0}.-Mw5AW_triggerEffort{color:var(--dsw-alias-label-tertiary,#81858c);flex:none}.-Mw5AW_chevron{flex:none}.-Mw5AW_modal{width:min(640px,100vw - 32px);max-height:min(720px,100vh - 32px)}.-Mw5AW_modalContent{max-height:min(640px,100vh - 120px)}.-Mw5AW_footer{min-width:0;color:var(--dsw-alias-label-secondary,#61666b);align-items:center;gap:10px;font-size:12px;display:flex}.-Mw5AW_footerCurrent{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.-Mw5AW_loading{color:var(--dsw-alias-label-tertiary,#81858c);flex:none}.-Mw5AW_error,.-Mw5AW_warning{border-radius:8px;align-items:center;gap:8px;margin:0 0 10px;padding:6px 8px;font-size:12px;line-height:1.5;display:flex}.-Mw5AW_error{background:var(--dsw-alias-state-error-secondary,#f25a5a);color:var(--dsw-alias-state-error-primary,#ec1313)}.-Mw5AW_warning{background:var(--dsw-alias-state-warn-tertiary,#fef5e7);color:var(--dsw-alias-state-warn-primary,#f59e0b)}.-Mw5AW_retry{border:1px solid var(--dsw-alias-border-l2,#0000001a);color:inherit;cursor:pointer;background:0 0;border-radius:8px;flex:none;padding:2px 8px;font-size:12px}.-Mw5AW_retry:hover{background:var(--dsw-alias-interactive-bg-hover,#2631480f)}.-Mw5AW_groups{flex-direction:column;gap:8px;display:flex}.-Mw5AW_group{border:1px solid var(--dsw-alias-border-l2,#0000001a);border-radius:10px;overflow:hidden}.-Mw5AW_providerHeader{background:var(--dsw-alias-bg-layer-2,transparent);width:100%;color:inherit;cursor:pointer;font:inherit;text-align:start;border:none;align-items:center;gap:8px;padding:9px 10px;font-size:13px;font-weight:600;transition:background-color .14s,color .14s;display:flex}.-Mw5AW_providerHeader:hover{background:var(--dsw-alias-interactive-bg-hover,#2631480f)}.-Mw5AW_providerHeader:focus-visible,.-Mw5AW_modelRow:focus-visible,.-Mw5AW_retry:focus-visible{outline-offset:-2px;box-shadow:inset 0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}.-Mw5AW_providerName{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.-Mw5AW_count{color:var(--dsw-alias-label-tertiary,#81858c);flex:none;margin-inline-start:auto;font-size:12px;font-weight:400}.-Mw5AW_chevronClosed,.-Mw5AW_chevronOpen{color:var(--dsw-alias-label-tertiary,#81858c);flex:none;transition:transform .14s}.-Mw5AW_chevronOpen{transform:rotate(180deg)}.-Mw5AW_models{border-top:1px solid var(--dsw-alias-border-l1,#0000000a);flex-direction:column;gap:2px;padding:6px;display:flex}.-Mw5AW_modelRow{width:100%;color:inherit;cursor:pointer;font:inherit;text-align:start;background:0 0;border:none;border-radius:8px;align-items:flex-start;gap:10px;padding:7px 8px;transition:background-color .14s,color .14s;display:flex}.-Mw5AW_modelRow:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#2631480f)}.-Mw5AW_modelRow:disabled{cursor:default;opacity:.55}.-Mw5AW_modelSelected{background:var(--dsw-alias-interactive-bg-active,#2631481a)}.-Mw5AW_modelCopy{flex-direction:column;flex:1;gap:1px;min-width:0;display:flex}.-Mw5AW_modelName{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.-Mw5AW_description{color:var(--dsw-alias-label-tertiary,#81858c);text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:1.4;overflow:hidden}.-Mw5AW_selectedMark{color:var(--dsw-alias-text-accent,#4c9aff);flex:none}.-Mw5AW_effortSection{margin-top:10px}.-Mw5AW_effortTitle{color:var(--dsw-alias-label-secondary,#61666b);margin:0 0 6px;font-size:13px;font-weight:600}@media (prefers-reduced-motion:reduce){.-Mw5AW_trigger,.-Mw5AW_providerHeader,.-Mw5AW_modelRow,.-Mw5AW_retry,.-Mw5AW_chevronClosed,.-Mw5AW_chevronOpen{transition:none}}";
		const tagId$19 = "dsh-web-enhanced/ModelPicker.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$19) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId$19;
			tag.textContent = css$19;
			document.head.appendChild(tag);
		}
		var ModelPicker_module_css_default = {
			"chevron": "-Mw5AW_chevron",
			"chevronClosed": "-Mw5AW_chevronClosed",
			"chevronOpen": "-Mw5AW_chevronOpen",
			"count": "-Mw5AW_count",
			"description": "-Mw5AW_description",
			"effortSection": "-Mw5AW_effortSection",
			"effortTitle": "-Mw5AW_effortTitle",
			"error": "-Mw5AW_error",
			"footer": "-Mw5AW_footer",
			"footerCurrent": "-Mw5AW_footerCurrent",
			"group": "-Mw5AW_group",
			"groups": "-Mw5AW_groups",
			"loading": "-Mw5AW_loading",
			"modal": "-Mw5AW_modal",
			"modalContent": "-Mw5AW_modalContent",
			"modelCopy": "-Mw5AW_modelCopy",
			"modelName": "-Mw5AW_modelName",
			"modelRow": "-Mw5AW_modelRow",
			"modelSelected": "-Mw5AW_modelSelected",
			"models": "-Mw5AW_models",
			"providerHeader": "-Mw5AW_providerHeader",
			"providerName": "-Mw5AW_providerName",
			"retry": "-Mw5AW_retry",
			"selectedMark": "-Mw5AW_selectedMark",
			"trigger": "-Mw5AW_trigger",
			"triggerEffort": "-Mw5AW_triggerEffort",
			"triggerLabel": "-Mw5AW_triggerLabel",
			"warning": "-Mw5AW_warning"
		};
		//#endregion
		//#region lib/types/client/model-picker/ModelPicker.js
		/**
		* Composer model picker: a plugin-owned shadow of the host
		* `conversation.input.model` seat.
		*
		* The host ui-model-selection component is a small in-place menu with every
		* provider expanded at once. This registration wins the single slot at a lower
		* priority and renders a centered floating dialog instead: one collapsible
		* section per provider (only the selected provider starts expanded), plus the
		* current model's reasoning-effort choices. Data and writes still ride the
		* host's shared per-session ModelDirectory, so the /model command and this
		* seat stay one fact source.
		* @module dsh-web-enhanced/src/client/model-picker/ModelPicker
		*/
		/** Stable empty snapshot for deployments where the directory never mounts. */
		const EMPTY_STATE = {
			current: null,
			groups: [],
			failures: [],
			status: "idle",
			error: null
		};
		/**
		* The composer model seat replacement: compact trigger + centered dialog.
		* @param props - locked, shared directory store, load/select verbs, locale.
		*/
		function ModelPicker({ locked, available, directory, load, select, t }) {
			const state = (0, react.useSyncExternalStore)((callback) => directory?.subscribe(callback) ?? (() => {}), () => directory?.getSnapshot() ?? EMPTY_STATE);
			const [open, setOpen] = (0, react.useState)(false);
			const [openProviders, setOpenProviders] = (0, react.useState)(/* @__PURE__ */ new Set());
			const [toast, setToast] = (0, react.useState)(null);
			const toastSeq = (0, react.useRef)(0);
			const triggerRef = (0, react.useRef)(null);
			const currentModel = (state.current === null ? void 0 : state.groups.find((group) => group.id === state.current.provider))?.models.find((model) => model.id === state.current?.model);
			const reasoning = currentModel?.reasoning;
			const effectiveEffort = state.current?.reasoningEffort ?? reasoning?.defaultEffort;
			const modelLabel = currentModel?.name ?? (state.current === null ? t("modelPicker.select") : state.current.model);
			const effortLabel = reasoning === void 0 ? void 0 : effectiveEffort === void 0 ? t("modelPicker.providerDefault") : reasoning.efforts.find((level) => level.id === effectiveEffort)?.name ?? effectiveEffort;
			const busy = state.status === "selecting";
			const show = () => {
				setOpenProviders(state.current === null ? /* @__PURE__ */ new Set() : /* @__PURE__ */ new Set([state.current.provider]));
				setOpen(true);
				load();
			};
			const toggleProvider = (0, react.useCallback)((provider) => {
				setOpenProviders((current) => {
					const next = new Set(current);
					if (next.has(provider)) next.delete(provider);
					else next.add(provider);
					return next;
				});
			}, []);
			(0, react.useEffect)(() => {
				if (available) load();
			}, [available, load]);
			(0, react.useEffect)(() => {
				if (open && state.current !== null) setOpenProviders((current) => current.size === 0 ? /* @__PURE__ */ new Set([state.current.provider]) : current);
			}, [open, state.current]);
			const announceFailure = (0, react.useCallback)(() => {
				const message = directory?.getSnapshot().error;
				if (message !== null && message !== "") {
					toastSeq.current += 1;
					setToast({
						seq: toastSeq.current,
						text: t("modelPicker.error", { message })
					});
				}
			}, [directory, t]);
			const choose = (0, react.useCallback)(async (selection) => {
				if (state.current?.provider === selection.provider && state.current.model === selection.model && state.current.reasoningEffort === selection.reasoningEffort) {
					setOpen(false);
					return;
				}
				if (await select(selection)) setOpen(false);
				else announceFailure();
			}, [
				announceFailure,
				select,
				state.current
			]);
			const chooseEffort = (0, react.useCallback)(async (effort) => {
				if (state.current === null) return;
				if (effectiveEffort === effort) {
					setOpen(false);
					return;
				}
				if (await select({
					provider: state.current.provider,
					model: state.current.model,
					...effort === void 0 ? {} : { reasoningEffort: effort }
				})) setOpen(false);
				else announceFailure();
			}, [
				announceFailure,
				effectiveEffort,
				select,
				state.current
			]);
			const effortRows = (0, react.useMemo)(() => reasoning === void 0 ? [] : [...reasoning.defaultEffort === void 0 ? [{
				id: "effort:default",
				name: t("modelPicker.providerDefault"),
				description: void 0
			}] : [], ...reasoning.efforts.map((level) => ({
				id: `effort:${level.id}`,
				name: level.name,
				description: level.description
			}))], [reasoning, t]);
			if (!available || directory === null) return null;
			const trigger = (0, react_jsx_runtime.jsxs)("button", {
				ref: triggerRef,
				type: "button",
				className: ModelPicker_module_css_default.trigger,
				"aria-haspopup": "dialog",
				"aria-expanded": open,
				disabled: locked || busy,
				title: `${modelLabel}${effortLabel === void 0 ? "" : ` · ${effortLabel}`}`,
				onClick: () => {
					open ? setOpen(false) : show();
				},
				children: [
					(0, react_jsx_runtime.jsx)("span", {
						className: ModelPicker_module_css_default.triggerLabel,
						children: modelLabel
					}),
					effortLabel !== void 0 && (0, react_jsx_runtime.jsx)("span", {
						className: ModelPicker_module_css_default.triggerEffort,
						children: effortLabel
					}),
					(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, { className: ModelPicker_module_css_default.chevron })
				]
			});
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				trigger,
				(0, react_jsx_runtime.jsxs)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
					open,
					onClose: () => {
						setOpen(false);
					},
					title: t("modelPicker.title"),
					closeLabel: t("modelPicker.close"),
					description: t("modelPicker.hint"),
					className: ModelPicker_module_css_default.modal,
					contentClassName: ModelPicker_module_css_default.modalContent,
					footer: (0, react_jsx_runtime.jsxs)("div", {
						className: ModelPicker_module_css_default.footer,
						children: [(0, react_jsx_runtime.jsxs)("span", {
							className: ModelPicker_module_css_default.footerCurrent,
							children: [modelLabel, effortLabel === void 0 ? "" : ` · ${effortLabel}`]
						}), state.status === "loading" && (0, react_jsx_runtime.jsx)("span", {
							className: ModelPicker_module_css_default.loading,
							children: t("modelPicker.loading")
						})]
					}),
					children: [
						state.error !== null && state.groups.length === 0 && (0, react_jsx_runtime.jsxs)("div", {
							className: ModelPicker_module_css_default.error,
							children: [(0, react_jsx_runtime.jsx)("span", { children: t("modelPicker.error", { message: state.error }) }), (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: ModelPicker_module_css_default.retry,
								onClick: load,
								children: t("modelPicker.retry")
							})]
						}),
						state.failures.map((failure) => (0, react_jsx_runtime.jsxs)("div", {
							className: ModelPicker_module_css_default.warning,
							children: [
								failure.name,
								": ",
								failure.message
							]
						}, failure.id)),
						(0, react_jsx_runtime.jsx)("div", {
							className: ModelPicker_module_css_default.groups,
							children: state.groups.map((group) => {
								const expanded = openProviders.has(group.id);
								return (0, react_jsx_runtime.jsxs)("section", {
									className: ModelPicker_module_css_default.group,
									children: [(0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: ModelPicker_module_css_default.providerHeader,
										"aria-expanded": expanded,
										onClick: () => {
											toggleProvider(group.id);
										},
										children: [
											(0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconChevronDownOutline14, { className: expanded ? ModelPicker_module_css_default.chevronOpen : ModelPicker_module_css_default.chevronClosed }),
											(0, react_jsx_runtime.jsx)("span", {
												className: ModelPicker_module_css_default.providerName,
												children: group.name
											}),
											(0, react_jsx_runtime.jsx)("span", {
												className: ModelPicker_module_css_default.count,
												children: group.models.length
											})
										]
									}), expanded && (0, react_jsx_runtime.jsx)("div", {
										className: ModelPicker_module_css_default.models,
										role: "group",
										children: group.models.map((model) => {
											const selected = state.current?.provider === group.id && state.current.model === model.id;
											return (0, react_jsx_runtime.jsxs)("button", {
												type: "button",
												className: `${ModelPicker_module_css_default.modelRow}${selected ? ` ${ModelPicker_module_css_default.modelSelected}` : ""}`,
												disabled: busy,
												onClick: () => {
													choose({
														provider: group.id,
														model: model.id,
														...model.reasoning?.defaultEffort === void 0 ? {} : { reasoningEffort: model.reasoning.defaultEffort }
													});
												},
												children: [(0, react_jsx_runtime.jsxs)("span", {
													className: ModelPicker_module_css_default.modelCopy,
													children: [(0, react_jsx_runtime.jsx)("span", {
														className: ModelPicker_module_css_default.modelName,
														children: model.name
													}), model.description !== void 0 && (0, react_jsx_runtime.jsx)("span", {
														className: ModelPicker_module_css_default.description,
														children: model.description
													})]
												}), selected && (0, react_jsx_runtime.jsx)("span", {
													className: ModelPicker_module_css_default.selectedMark,
													children: "✓"
												})]
											}, model.id);
										})
									})]
								}, group.id);
							})
						}),
						effortRows.length > 0 && (0, react_jsx_runtime.jsxs)("section", {
							className: ModelPicker_module_css_default.effortSection,
							children: [(0, react_jsx_runtime.jsx)("h3", {
								className: ModelPicker_module_css_default.effortTitle,
								children: t("modelPicker.effort")
							}), (0, react_jsx_runtime.jsx)("div", {
								className: ModelPicker_module_css_default.models,
								children: effortRows.map((level) => {
									const selected = level.id === "effort:default" ? effectiveEffort === void 0 : effectiveEffort === level.id.slice(7);
									return (0, react_jsx_runtime.jsxs)("button", {
										type: "button",
										className: `${ModelPicker_module_css_default.modelRow}${selected ? ` ${ModelPicker_module_css_default.modelSelected}` : ""}`,
										disabled: busy,
										onClick: () => {
											chooseEffort(level.id === "effort:default" ? void 0 : level.id.slice(7));
										},
										children: [(0, react_jsx_runtime.jsxs)("span", {
											className: ModelPicker_module_css_default.modelCopy,
											children: [(0, react_jsx_runtime.jsx)("span", {
												className: ModelPicker_module_css_default.modelName,
												children: level.name
											}), level.description !== void 0 && (0, react_jsx_runtime.jsx)("span", {
												className: ModelPicker_module_css_default.description,
												children: level.description
											})]
										}), selected && (0, react_jsx_runtime.jsx)("span", {
											className: ModelPicker_module_css_default.selectedMark,
											children: "✓"
										})]
									}, level.id);
								})
							})]
						})
					]
				}),
				toast !== null && (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Toast, {
					text: toast.text,
					icon: (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconWarningOutline16, {}),
					anchor: triggerRef.current?.closest("[data-composer-card]") ?? null,
					onDone: () => {
						setToast(null);
					}
				}, toast.seq)
			] });
		}
		//#endregion
		//#region \0dsh-css:D:\Documents\Dev-Repo\deepseek-harness\dsh-plugins\dsh-web-enhanced\src\client\shell\OverlayShell.module.css.mjs
		const css$18 = "._3L05G_backdrop{background:var(--dsw-alias-bg-mask-3,#0000007a);pointer-events:auto;justify-content:center;align-items:center;padding:32px;display:flex;position:fixed;inset:0}._3L05G_panel{border:1px solid var(--dsw-alias-border-l4,#00000029);background:var(--dsw-alias-bg-overlay,#e9ecf2);width:min(1180px,100%);height:min(760px,100%);color:var(--dsw-alias-label-primary,#0f1115);border-radius:12px;flex-direction:column;display:flex;overflow:hidden;box-shadow:0 1px 2px #00000014,0 8px 24px #0000001f,0 24px 64px #0003}._3L05G_panel:focus{outline:none}._3L05G_header{border-bottom:1px solid var(--dsw-alias-border-l1,#0000000a);flex:none;align-items:center;gap:12px;padding:10px 14px;display:flex}._3L05G_title{margin:0;font-size:15px;font-weight:600}._3L05G_actions{flex:1;align-items:center;gap:8px;display:flex}._3L05G_close{color:inherit;cursor:pointer;opacity:.7;background:0 0;border:none;border-radius:8px;padding:4px 6px;font-size:15px;line-height:1;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s}._3L05G_close:hover{opacity:1;background:var(--dsw-alias-interactive-bg-hover,#2631480f)}._3L05G_close:focus-visible{opacity:1;outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}._3L05G_body{scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l3,#00000024) transparent;flex:1;min-height:0;padding:14px;font-size:14px;overflow:auto}._3L05G_body[data-fill]{flex-direction:column;gap:10px;min-width:0;display:flex;overflow:auto}@media (prefers-reduced-motion:reduce){*{transition-duration:0s}}";
		const tagId$18 = "dsh-web-enhanced/OverlayShell.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$18) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId$18;
			tag.textContent = css$18;
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
		function OverlayShell({ title, closeLabel, onClose, actions, fill, testId, children }) {
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
						"data-fill": fill === true || void 0,
						children
					})]
				})
			});
		}
		//#endregion
		//#region \0dsh-css:D:\Documents\Dev-Repo\deepseek-harness\dsh-plugins\dsh-web-enhanced\src\client\browse\BrowseOverlay.module.css.mjs
		const css$17 = ".aA-6Bq_action,.aA-6Bq_primary{border:1px solid var(--dsw-alias-border-l2,#0000001a);color:inherit;cursor:pointer;background:0 0;border-radius:8px;padding:6px 12px;font-size:13px;font-weight:500;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s}.aA-6Bq_action:hover{background:var(--dsw-alias-interactive-bg-hover,#2631480f)}.aA-6Bq_action:active{background:var(--dsw-alias-interactive-bg-active,#2631481a)}.aA-6Bq_action:focus-visible,.aA-6Bq_primary:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}.aA-6Bq_primary{border-color:var(--dsw-alias-state-business-primary,#4176e6);background:var(--dsw-alias-state-business-tertiary,#b7c8fe)}.aA-6Bq_primary:hover{background:var(--dsw-alias-interactive-bg-hover-accent,#26314824)}.aA-6Bq_filter{border:1px solid var(--dsw-alias-border-l2,#0000001a);color:inherit;background:0 0;border-radius:8px;width:160px;padding:4px 8px;font-size:13px}.aA-6Bq_filter:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}.aA-6Bq_nav{border-bottom:1px solid var(--dsw-alias-border-l1,#0000000a);flex:none;align-items:baseline;gap:10px;padding-bottom:6px;display:flex}.aA-6Bq_roots{flex:none;gap:3px;display:flex}.aA-6Bq_root{border:1px solid var(--dsw-alias-border-l2,#0000001a);color:inherit;cursor:pointer;background:0 0;border-radius:8px;padding:2px 8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s}.aA-6Bq_root:hover{background:var(--dsw-alias-interactive-bg-hover,#2631480f)}.aA-6Bq_root:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}.aA-6Bq_root[data-active]{border-color:var(--dsw-alias-state-business-primary,#4176e6);background:var(--dsw-alias-state-business-tertiary,#b7c8fe)}.aA-6Bq_crumbs{flex-wrap:wrap;flex:1;align-items:center;gap:2px;min-width:0;display:flex}.aA-6Bq_crumbGroup{align-items:center;display:inline-flex}.aA-6Bq_crumb{color:inherit;cursor:pointer;background:0 0;border:0;border-radius:8px;padding:2px 8px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s}.aA-6Bq_crumb:hover{background:var(--dsw-alias-interactive-bg-hover,#2631480f)}.aA-6Bq_crumb:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}.aA-6Bq_crumbSep{color:var(--dsw-alias-label-tertiary,#81858c)}.aA-6Bq_rows{scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l3,#00000024) transparent;flex:1;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));align-content:start;gap:2px 10px;min-height:0;margin:0;padding:0;list-style:none;display:grid;overflow:auto}.aA-6Bq_row{width:100%;color:inherit;cursor:pointer;font:inherit;text-align:start;background:0 0;border:0;border-radius:8px;align-items:center;gap:8px;padding:4px 8px;font-size:13px;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s;display:flex}.aA-6Bq_row:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#2631480f)}.aA-6Bq_row:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}.aA-6Bq_row:disabled{cursor:default;opacity:.45}.aA-6Bq_icon{width:12px;color:var(--dsw-alias-label-tertiary,#81858c);flex:none}.aA-6Bq_row[data-kind=dir] .aA-6Bq_name{color:var(--dsw-alias-label-primary,#0f1115);font-weight:600}.aA-6Bq_name{text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;overflow:hidden}.aA-6Bq_empty,.aA-6Bq_notice,.aA-6Bq_error{color:var(--dsw-alias-label-secondary,#61666b);margin:0;font-size:13px;list-style:none}.aA-6Bq_empty{grid-column:1/-1}.aA-6Bq_notice,.aA-6Bq_error{flex:none}.aA-6Bq_error{color:var(--dsw-alias-state-error-primary,#ec1313)}@media (prefers-reduced-motion:reduce){*{transition-duration:0s}}";
		const tagId$17 = "dsh-web-enhanced/BrowseOverlay.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$17) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId$17;
			tag.textContent = css$17;
			document.head.appendChild(tag);
		}
		var BrowseOverlay_module_css_default = {
			"action": "aA-6Bq_action",
			"crumb": "aA-6Bq_crumb",
			"crumbGroup": "aA-6Bq_crumbGroup",
			"crumbSep": "aA-6Bq_crumbSep",
			"crumbs": "aA-6Bq_crumbs",
			"empty": "aA-6Bq_empty",
			"error": "aA-6Bq_error",
			"filter": "aA-6Bq_filter",
			"icon": "aA-6Bq_icon",
			"name": "aA-6Bq_name",
			"nav": "aA-6Bq_nav",
			"notice": "aA-6Bq_notice",
			"primary": "aA-6Bq_primary",
			"root": "aA-6Bq_root",
			"roots": "aA-6Bq_roots",
			"row": "aA-6Bq_row",
			"rows": "aA-6Bq_rows"
		};
		//#endregion
		//#region lib/types/client/browse/BrowseOverlay.js
		/**
		* Host-wide file browser behind the composer's mention pickers.
		*
		* The in-project picker is a flat search over the workspace; this is the other
		* half of the same gesture — walking anywhere on the host to name a path that
		* lives outside the project. It lists directories through the plugin's own
		* `fsBrowse` remote (names, kinds, sizes; never content), so the browser works
		* on a Web deployment with no operating-system dialog available. Where the
		* host DOES serve its native directory chooser, folder mode offers it too.
		* @module dsh-web-enhanced/src/client/browse/BrowseOverlay
		*/
		/** Split an absolute path into its navigable ancestors, deepest last. */
		function crumbsOf(path) {
			const separator = path.includes("\\") && !path.startsWith("/") ? "\\" : "/";
			const parts = path.split(/[\\/]/u);
			const crumbs = [];
			let prefix = "";
			for (const [index, part] of parts.entries()) {
				if (part === "" && index > 0) continue;
				if (index === 0) {
					prefix = part === "" ? separator : /^[A-Za-z]:$/u.test(part) ? `${part}${separator}` : part;
					crumbs.push({
						name: part === "" ? separator : part,
						path: prefix
					});
					continue;
				}
				prefix = `${prefix}${prefix.endsWith(separator) ? "" : separator}${part}`;
				crumbs.push({
					name: part,
					path: prefix
				});
			}
			return crumbs;
		}
		/** The host-wide file browser. */
		function BrowseOverlay({ useBrowse, remote, closeBrowse, appendMention, t }) {
			const open = useBrowse((state) => state.open);
			const kind = useBrowse((state) => state.kind);
			const sessionId = useBrowse((state) => state.sessionId);
			const startPath = useBrowse((state) => state.startPath);
			const [path, setPath] = (0, react.useState)(void 0);
			const [level, setLevel] = (0, react.useState)({ phase: "loading" });
			const [query, setQuery] = (0, react.useState)("");
			const live = (0, react.useRef)(true);
			(0, react.useEffect)(() => () => {
				live.current = false;
			}, []);
			const load = (0, react.useCallback)(async (target) => {
				setLevel({ phase: "loading" });
				const result = await remote.fsBrowse(target === void 0 ? {} : { path: target });
				if (!live.current) return;
				if ("error" in result) {
					setLevel({
						phase: "error",
						message: result.error.message
					});
					return;
				}
				setLevel({
					phase: "ready",
					value: result
				});
			}, [remote]);
			(0, react.useEffect)(() => {
				if (!open) return;
				setPath(startPath);
				setQuery("");
			}, [open, startPath]);
			(0, react.useEffect)(() => {
				if (open) load(path);
			}, [
				load,
				open,
				path
			]);
			const choose = (0, react.useCallback)((chosen) => {
				appendMention(sessionId, mentionOf(chosen));
				closeBrowse();
			}, [
				appendMention,
				closeBrowse,
				sessionId
			]);
			if (!open) return null;
			const current = level.phase === "ready" ? level.value : void 0;
			const needle = query.trim().toLowerCase();
			const entries = (current?.entries ?? []).filter((entry) => needle === "" || entry.name.toLowerCase().includes(needle));
			return (0, react_jsx_runtime.jsxs)(OverlayShell, {
				title: t(kind === "file" ? "browse.titleFile" : "browse.titleFolder"),
				closeLabel: t("browse.close"),
				onClose: closeBrowse,
				testId: "browse-overlay",
				fill: true,
				actions: (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
					(0, react_jsx_runtime.jsx)("input", {
						className: BrowseOverlay_module_css_default.filter,
						type: "search",
						value: query,
						placeholder: t("browse.filter"),
						"data-testid": "browse-filter",
						onChange: (event) => {
							setQuery(event.target.value);
						}
					}),
					current !== void 0 && (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: BrowseOverlay_module_css_default.action,
						onClick: () => {
							setPath(current.home);
						},
						children: t("browse.home")
					}),
					kind === "dir" && current !== void 0 && (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: BrowseOverlay_module_css_default.primary,
						"data-testid": "browse-choose-current",
						onClick: () => {
							choose(current.path);
						},
						children: t("browse.useCurrent")
					})
				] }),
				children: [
					current !== void 0 && (0, react_jsx_runtime.jsxs)("div", {
						className: BrowseOverlay_module_css_default.nav,
						children: [current.roots.length > 0 && (0, react_jsx_runtime.jsx)("div", {
							className: BrowseOverlay_module_css_default.roots,
							"data-testid": "browse-roots",
							children: current.roots.map((root) => (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: BrowseOverlay_module_css_default.root,
								"data-active": root === current.path || void 0,
								onClick: () => {
									setPath(root);
								},
								children: root.replace(/[\\/]+$/u, "")
							}, root))
						}), (0, react_jsx_runtime.jsx)("nav", {
							className: BrowseOverlay_module_css_default.crumbs,
							"aria-label": t("browse.crumbs"),
							children: crumbsOf(current.path).map((crumb, index) => (0, react_jsx_runtime.jsxs)("span", {
								className: BrowseOverlay_module_css_default.crumbGroup,
								children: [index > 0 && (0, react_jsx_runtime.jsx)("span", {
									className: BrowseOverlay_module_css_default.crumbSep,
									"aria-hidden": "true",
									children: crumb.path.includes("\\") && !crumb.path.startsWith("/") ? "\\" : "/"
								}), (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: BrowseOverlay_module_css_default.crumb,
									onClick: () => {
										setPath(crumb.path);
									},
									children: crumb.name
								})]
							}, crumb.path))
						})]
					}),
					level.phase === "loading" && (0, react_jsx_runtime.jsx)("p", {
						className: BrowseOverlay_module_css_default.empty,
						children: t("browse.loading")
					}),
					level.phase === "error" && (0, react_jsx_runtime.jsx)("p", {
						className: BrowseOverlay_module_css_default.error,
						children: t("browse.error", { message: level.message })
					}),
					current !== void 0 && (0, react_jsx_runtime.jsxs)("ul", {
						className: BrowseOverlay_module_css_default.rows,
						"data-testid": "browse-rows",
						children: [
							current.parent !== null && (0, react_jsx_runtime.jsx)("li", { children: (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: BrowseOverlay_module_css_default.row,
								"data-testid": "browse-up",
								onClick: () => {
									setPath(current.parent);
								},
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: BrowseOverlay_module_css_default.icon,
									"aria-hidden": true,
									children: "↰"
								}), (0, react_jsx_runtime.jsx)("span", {
									className: BrowseOverlay_module_css_default.name,
									children: t("browse.parent")
								})]
							}) }),
							entries.map((entry) => (0, react_jsx_runtime.jsx)("li", { children: (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								className: BrowseOverlay_module_css_default.row,
								"data-kind": entry.kind,
								onClick: () => {
									if (entry.kind === "dir") setPath(entry.path);
									else if (kind === "file") choose(entry.path);
								},
								disabled: entry.kind === "file" && kind === "dir",
								children: [(0, react_jsx_runtime.jsx)("span", {
									className: BrowseOverlay_module_css_default.icon,
									"aria-hidden": true,
									children: entry.kind === "dir" ? "▸" : "·"
								}), (0, react_jsx_runtime.jsx)("span", {
									className: BrowseOverlay_module_css_default.name,
									children: entry.name
								})]
							}) }, entry.path)),
							entries.length === 0 && (0, react_jsx_runtime.jsx)("li", {
								className: BrowseOverlay_module_css_default.empty,
								children: t("browse.empty")
							})
						]
					}),
					current?.truncated === true && (0, react_jsx_runtime.jsx)("p", {
						className: BrowseOverlay_module_css_default.notice,
						children: t("browse.truncated")
					})
				]
			});
		}
		//#endregion
		//#region \0dsh-css:D:\Documents\Dev-Repo\deepseek-harness\dsh-plugins\dsh-web-enhanced\src\client\git\BranchStrip.module.css.mjs
		const css$16 = "._8I-SYq_strip{box-sizing:border-box;min-width:0;color:var(--dsw-alias-label-secondary,inherit);flex-direction:column;flex:none;gap:4px;padding:0 4px;font-size:12px;display:flex}._8I-SYq_line{align-items:center;gap:8px;display:flex}._8I-SYq_label{color:var(--dsw-alias-label-tertiary,#81858c);flex:none}._8I-SYq_select{border:1px solid var(--dsw-alias-border-l2,#0000001a);color:inherit;background:0 0;border-radius:8px;max-width:220px;padding:1px 8px;font-size:12px}._8I-SYq_select:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}._8I-SYq_confirm{border:1px solid var(--dsw-alias-state-warn-secondary,#f7ad31);background:var(--dsw-alias-state-warn-tertiary,#fef5e7);border-radius:8px;flex-wrap:wrap;align-items:center;gap:6px;padding:4px 8px;display:flex}._8I-SYq_confirmText{flex:1;min-width:200px}._8I-SYq_confirmAction{border:1px solid var(--dsw-alias-border-l2,#0000001a);color:inherit;cursor:pointer;font:inherit;background:0 0;border-radius:8px;flex:none;padding:1px 8px;font-size:12px;font-weight:500;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s}._8I-SYq_confirmAction:hover{background:var(--dsw-alias-interactive-bg-hover,#2631480f)}._8I-SYq_confirmAction:active{background:var(--dsw-alias-interactive-bg-active,#2631481a)}._8I-SYq_confirmAction:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}._8I-SYq_message{color:var(--dsw-alias-state-error-primary,#ec1313)}._8I-SYq_messageTitle{font-weight:600}._8I-SYq_messageBody{white-space:pre-wrap;overflow-wrap:anywhere;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l3,#00000024) transparent;max-height:120px;margin:2px 0 0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;overflow:auto}@media (prefers-reduced-motion:reduce){*{transition-duration:0s}}";
		const tagId$16 = "dsh-web-enhanced/BranchStrip.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$16) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId$16;
			tag.textContent = css$16;
			document.head.appendChild(tag);
		}
		var BranchStrip_module_css_default = {
			"confirm": "_8I-SYq_confirm",
			"confirmAction": "_8I-SYq_confirmAction",
			"confirmText": "_8I-SYq_confirmText",
			"label": "_8I-SYq_label",
			"line": "_8I-SYq_line",
			"message": "_8I-SYq_message",
			"messageBody": "_8I-SYq_messageBody",
			"messageTitle": "_8I-SYq_messageTitle",
			"select": "_8I-SYq_select",
			"strip": "_8I-SYq_strip"
		};
		//#endregion
		//#region lib/types/client/git/BranchStrip.js
		/**
		* Branch switcher in the session header's action row (titleCluster): the
		* current branch, a switcher over the local branches, and the dirty-tree
		* confirmation. Rendered only for a session whose workspace is a git
		* repository — an unrelated project should not grow a dead control.
		* @module dsh-web-enhanced/src/client/git/BranchStrip
		*/
		/**
		* Summarize a porcelain status for the switch warning.
		*
		* Tracked and untracked are counted apart because they fail differently: git
		* refuses a checkout whose target changes a file the work tree modified, while
		* an untracked file only collides when the target branch happens to carry the
		* same path.
		* @param entries - porcelain v1 entries.
		* @returns the counts.
		*/
		function dirtySummary(entries) {
			let untracked = 0;
			for (const entry of entries) if (entry.staged === "?" && entry.unstaged === "?") untracked += 1;
			return {
				total: entries.length,
				tracked: entries.length - untracked,
				untracked
			};
		}
		/** How long one workspace's branch listing serves later mounts (ms). */
		const BRANCHES_TTL_MS = 5e3;
		/** Branch listings by workspace id: the settled-or-in-flight promise and its age. */
		const branchesCache = /* @__PURE__ */ new Map();
		/**
		* Fetch one workspace's branches through the shared cache.
		*
		* Every session-header mount asks for the same listing, so a hit (settled or
		* in flight) saves a `git branch --list` subprocess. Error listings and
		* rejections are not cached: they are usually transient (or "not a
		* repository", which the strip renders as nothing) and the next mount
		* retries instead of inheriting them.
		* @param workspaceId - the workspace whose branches to list.
		* @param fetch - the remote call, invoked only on a miss.
		* @returns the branch listing result.
		*/
		function cachedGitBranches(workspaceId, fetch) {
			const hit = branchesCache.get(workspaceId);
			if (hit !== void 0 && Date.now() - hit.at < BRANCHES_TTL_MS) return hit.promise;
			const promise = fetch();
			branchesCache.set(workspaceId, {
				at: Date.now(),
				promise
			});
			promise.then((result) => {
				if ("error" in result) branchesCache.delete(workspaceId);
			}, () => branchesCache.delete(workspaceId));
			return promise;
		}
		/**
		* Drop one workspace's cached branch listing.
		*
		* Called after a checkout this plugin performed: a cached listing still names
		* the branch that WAS current.
		* @param workspaceId - the workspace whose listing to drop.
		*/
		function invalidateBranchesCache(workspaceId) {
			branchesCache.delete(workspaceId);
		}
		/** The branch strip: current branch and the switcher. */
		function BranchStrip({ sessionId, useWorkspaces, remote, t }) {
			const workspaceId = workspaceOfSessionId(sessionId, useWorkspaces((state) => state))?.workspaceId;
			const [branches, setBranches] = (0, react.useState)({ phase: "loading" });
			const [switching, setSwitching] = (0, react.useState)(false);
			const [message, setMessage] = (0, react.useState)(null);
			const [pending, setPending] = (0, react.useState)(null);
			const live = (0, react.useRef)(true);
			(0, react.useEffect)(() => () => {
				live.current = false;
			}, []);
			const load = (0, react.useCallback)(async () => {
				if (workspaceId === void 0) return;
				const result = await cachedGitBranches(workspaceId, () => remote.gitBranches({ workspaceId }));
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
			const runSwitch = (0, react.useCallback)(async (branch) => {
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
					invalidateBranchesCache(workspaceId);
					await load();
				} finally {
					if (live.current) setSwitching(false);
				}
			}, [
				load,
				remote,
				workspaceId
			]);
			/**
			* Ask before switching out of a dirty tree.
			*
			* Not a refusal: git carries non-conflicting changes across a checkout and
			* refuses the conflicting case on its own, so blocking here would forbid
			* something that ordinarily works. What is missing without this step is that
			* the user is never told the tree is dirty at all — a silent success that
			* moved edited files to another branch reads as data loss even though it is
			* not.
			*/
			const requestSwitch = (0, react.useCallback)(async (branch) => {
				if (workspaceId === void 0) return;
				setMessage(null);
				const status = await remote.gitStatus({ workspaceId });
				if (!live.current) return;
				const dirty = "error" in status ? {
					total: 0,
					tracked: 0,
					untracked: 0
				} : dirtySummary(status.entries);
				if (dirty.total === 0) {
					await runSwitch(branch);
					return;
				}
				setPending({
					branch,
					dirty
				});
			}, [
				remote,
				runSwitch,
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
					(0, react_jsx_runtime.jsxs)("div", {
						className: BranchStrip_module_css_default.line,
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: BranchStrip_module_css_default.label,
							children: t("branch.label")
						}), (0, react_jsx_runtime.jsx)("select", {
							className: BranchStrip_module_css_default.select,
							value: current,
							disabled: switching || pending !== null,
							"data-testid": "branch-select",
							"aria-label": t("branch.label"),
							onChange: (event) => {
								requestSwitch(event.target.value);
							},
							children: branches.items.map((branch) => (0, react_jsx_runtime.jsx)("option", {
								value: branch.name,
								children: branch.name
							}, branch.name))
						})]
					}),
					pending !== null && (0, react_jsx_runtime.jsxs)("div", {
						className: BranchStrip_module_css_default.confirm,
						"data-testid": "branch-dirty-confirm",
						children: [
							(0, react_jsx_runtime.jsx)("span", {
								className: BranchStrip_module_css_default.confirmText,
								children: t("branch.dirty", {
									count: String(pending.dirty.total),
									tracked: String(pending.dirty.tracked),
									untracked: String(pending.dirty.untracked),
									branch: pending.branch
								})
							}),
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: BranchStrip_module_css_default.confirmAction,
								"data-testid": "branch-dirty-continue",
								onClick: () => {
									const target = pending.branch;
									setPending(null);
									runSwitch(target);
								},
								children: t("branch.dirtyConfirm")
							}),
							(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: BranchStrip_module_css_default.confirmAction,
								onClick: () => {
									setPending(null);
								},
								children: t("branch.dirtyCancel")
							})
						]
					}),
					message !== null && (0, react_jsx_runtime.jsxs)("div", {
						className: BranchStrip_module_css_default.message,
						"data-testid": "branch-message",
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: BranchStrip_module_css_default.messageTitle,
							children: t("branch.failed")
						}), (0, react_jsx_runtime.jsx)("pre", {
							className: BranchStrip_module_css_default.messageBody,
							children: message
						})]
					})
				]
			});
		}
		//#endregion
		//#region lib/types/client/media.js
		/**
		* Media registry: object URLs for binary payloads, LRU-capped.
		*
		* A base64 preview payload re-concatenated into a `data:` URL on every render
		* (and duplicated per referencing component) costs multi-megabyte allocations
		* per keystroke-scale update. Here the base64 decodes ONCE into a Blob, the
		* browser owns the bytes, and consumers share one object URL per key.
		* Environments without `URL.createObjectURL` (node tests) fall back to the
		* data URL — nothing registers, nothing leaks.
		* @module dsh-web-enhanced/src/client/media
		*/
		/** How many object URLs may live at once; the least-recently used revokes. */
		const URL_CAPACITY = 16;
		/** Live registry: key → object URL, insertion order = recency order. */
		const urls = /* @__PURE__ */ new Map();
		/** Whether object URLs are usable in this environment. */
		function objectUrlsAvailable() {
			return typeof URL !== "undefined" && typeof URL.createObjectURL === "function";
		}
		/** Decode a base64 string into bytes. */
		function bytesOfBase64(base64) {
			const raw = atob(base64);
			const bytes = new Uint8Array(new ArrayBuffer(raw.length));
			for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
			return bytes;
		}
		/**
		* The stable URL of one binary payload.
		* @param key - registry identity (one URL per key, whatever it names).
		* @param base64 - the payload.
		* @param mime - the payload's MIME type.
		* @returns the object URL, or the equivalent data URL when object URLs are
		* unavailable (the fallback never registers and must not be revoked).
		*/
		function binaryObjectUrl(key, base64, mime) {
			if (!objectUrlsAvailable()) return `data:${mime};base64,${base64}`;
			const existing = urls.get(key);
			if (existing !== void 0) {
				urls.delete(key);
				urls.set(key, existing);
				return existing;
			}
			const url = URL.createObjectURL(new Blob([bytesOfBase64(base64)], { type: mime }));
			urls.set(key, url);
			while (urls.size > URL_CAPACITY) {
				const oldest = urls.keys().next();
				if (oldest.done === true) break;
				const url2 = urls.get(oldest.value);
				urls.delete(oldest.value);
				if (url2 !== void 0) URL.revokeObjectURL(url2);
			}
			return url;
		}
		/** 32-bit FNV-1a over a string (content identity; one pass per new payload). */
		function fnv1a(text) {
			let hash = 2166136261;
			for (let i = 0; i < text.length; i++) {
				hash ^= text.charCodeAt(i);
				hash = Math.imul(hash, 16777619);
			}
			return (hash >>> 0).toString(36);
		}
		/**
		* Registry key for one binary payload: content-derived, so replacing a tab
		* with same-path different bytes cannot serve the previous image.
		* @param prefix - usage namespace.
		* @param binary - the base64 payload.
		*/
		function contentKey(prefix, binary) {
			return `${prefix}:${binary.length}:${fnv1a(binary)}`;
		}
		/** Release every registered object URL. */
		function releaseAllObjectUrls() {
			for (const url of urls.values()) if (objectUrlsAvailable()) URL.revokeObjectURL(url);
			urls.clear();
		}
		/** Single-flight loads: key → the promise every concurrent mount shares. */
		const inflight = /* @__PURE__ */ new Map();
		/**
		* The object URL of one workspace image, fetched at most once at a time.
		*
		* The same image referenced N times in one markdown document (or mounted in
		* N components) shares one read and one URL; a failed read drops the promise
		* so the next mount retries instead of caching the failure.
		* @param remote - the read face.
		* @param workspaceId - the owning workspace.
		* @param path - workspace-relative image path.
		* @param mimeOfPath - MIME resolver for the path (extension-driven).
		* @returns the URL on success.
		* @throws the read error branch for the caller to render inline.
		*/
		function workspaceImageUrl(remote, workspaceId, path, mimeOfPath) {
			const key = `wsimg:${workspaceId}:${path}`;
			const shared = inflight.get(key);
			if (shared !== void 0) return shared;
			const settled = (async () => {
				const mime = mimeOfPath(path);
				const result = await remote.fsRead({
					workspaceId,
					path
				});
				if ("error" in result) throw result.error;
				if (result.kind === "binary") {
					if (result.content === "") throw new Error("empty image payload");
					return binaryObjectUrl(key, result.content, mime);
				}
				if (mime === "image/svg+xml") return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(result.content)}`;
				throw new Error("not an image payload");
			})().finally(() => {
				inflight.delete(key);
			});
			inflight.set(key, settled);
			return settled;
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
		//#region \0dsh-css:D:\Documents\Dev-Repo\deepseek-harness\dsh-plugins\dsh-web-enhanced\src\client\board\TaskCard.module.css.mjs
		const css$15 = ".Nl19Xa_card{border:1px solid var(--dsw-alias-border-l2,#0000001a);background:var(--dsw-alias-interactive-bg-hover,#2631480f);border-radius:12px;flex-direction:column;flex:none;gap:6px;min-width:0;padding:8px 12px;display:flex}.Nl19Xa_card[data-status=running]{border-color:var(--dsw-alias-state-business-primary,#4176e6)}.Nl19Xa_card[data-status=failed]{border-color:var(--dsw-alias-state-error-primary,#ec1313)}.Nl19Xa_title{overflow-wrap:anywhere;margin:0;font-size:14px;font-weight:600}.Nl19Xa_card[data-collapsed=true]{padding:4px 6px}.Nl19Xa_summary{width:100%;color:inherit;cursor:pointer;font:inherit;text-align:start;background:0 0;border:0;align-items:center;gap:6px;padding:0;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s;display:flex}.Nl19Xa_summary:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}.Nl19Xa_chevron{color:var(--dsw-alias-label-tertiary,#81858c);flex:none;font-size:12px}.Nl19Xa_summaryTitle{text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;font-size:14px;font-weight:600;overflow:hidden}.Nl19Xa_summaryTime{font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-tertiary,#81858c);flex:none;font-size:12px}.Nl19Xa_prompt{color:var(--dsw-alias-label-secondary,#61666b);overflow-wrap:anywhere;white-space:pre-wrap;margin:0;font-size:13px;line-height:1.45}.Nl19Xa_meta{color:var(--dsw-alias-label-tertiary,#81858c);flex-direction:column;gap:2px;margin:0;font-size:12px;display:flex}.Nl19Xa_metaRow{font-variant-numeric:tabular-nums;overflow-wrap:anywhere}.Nl19Xa_result,.Nl19Xa_resultError{background:var(--dsw-alias-interactive-bg-hover,#2631480f);overflow-wrap:anywhere;white-space:pre-wrap;border-radius:8px;margin:0;padding:4px 8px;font-size:12px;line-height:1.4}.Nl19Xa_resultError{background:var(--dsw-alias-state-error-secondary,#f25a5a);color:var(--dsw-alias-state-error-primary,#ec1313)}.Nl19Xa_actions{flex-wrap:wrap;gap:5px;display:flex}.Nl19Xa_primary,.Nl19Xa_action,.Nl19Xa_danger{border:1px solid var(--dsw-alias-border-l2,#0000001a);color:inherit;cursor:pointer;background:0 0;border-radius:8px;padding:2px 8px;font-size:12px;font-weight:500;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s}.Nl19Xa_action:hover{background:var(--dsw-alias-interactive-bg-hover,#2631480f)}.Nl19Xa_action:active,.Nl19Xa_danger:active{background:var(--dsw-alias-interactive-bg-active,#2631481a)}.Nl19Xa_primary:focus-visible,.Nl19Xa_action:focus-visible,.Nl19Xa_danger:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}.Nl19Xa_primary{border-color:var(--dsw-alias-state-business-primary,#4176e6);background:var(--dsw-alias-state-business-tertiary,#b7c8fe)}.Nl19Xa_primary:hover{background:var(--dsw-alias-interactive-bg-hover-accent,#26314824)}.Nl19Xa_danger{color:var(--dsw-alias-state-error-primary,#ec1313);border-color:var(--dsw-alias-state-error-primary,#ec1313)}.Nl19Xa_field{flex-direction:column;gap:3px;display:flex}.Nl19Xa_fieldLabel{color:var(--dsw-alias-label-secondary,#61666b);font-size:12px}.Nl19Xa_input,.Nl19Xa_textarea{border:1px solid var(--dsw-alias-border-l2,#0000001a);color:inherit;background:0 0;border-radius:8px;padding:4px 6px;font-family:inherit;font-size:13px}.Nl19Xa_input:focus-visible,.Nl19Xa_textarea:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}.Nl19Xa_textarea{resize:vertical}.Nl19Xa_hint{color:var(--dsw-alias-label-tertiary,#81858c);font-size:12px}@media (prefers-reduced-motion:reduce){*{transition-duration:0s}}";
		const tagId$15 = "dsh-web-enhanced/TaskCard.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$15) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId$15;
			tag.textContent = css$15;
			document.head.appendChild(tag);
		}
		var TaskCard_module_css_default = {
			"action": "Nl19Xa_action",
			"actions": "Nl19Xa_actions",
			"card": "Nl19Xa_card",
			"chevron": "Nl19Xa_chevron",
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
			"summary": "Nl19Xa_summary",
			"summaryTime": "Nl19Xa_summaryTime",
			"summaryTitle": "Nl19Xa_summaryTitle",
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
		/**
		* Whether a card starts collapsed.
		*
		* Only the done column. A finished task's prompt and result are what made the
		* column scroll for pages, and both are already history — but a FAILED task is
		* the opposite case: its message is the reason to look at the board at all, so
		* it stays open.
		* @param status - the task's column.
		* @returns true when the card collapses by default.
		*/
		function collapsesByDefault(status) {
			return status === "done";
		}
		/**
		* One task card: summary, schedule, outcome, and the actions for its column.
		* Memoized: the board polls every {@link RUNNING_POLL_MS} while a task runs,
		* and a card whose task, callbacks, and dictionary seat did not move should
		* not re-render for it.
		*/
		const TaskCard = (0, react.memo)(function TaskCard({ task, workspaces, t, onRun, onOpen, onRemove, onUpdate }) {
			const [editing, setEditing] = (0, react.useState)(false);
			const [expanded, setExpanded] = (0, react.useState)(false);
			const [title, setTitle] = (0, react.useState)(task.title);
			const [prompt, setPrompt] = (0, react.useState)(task.prompt);
			const [cron, setCron] = (0, react.useState)(task.cron ?? "");
			const [workspaceId, setWorkspaceId] = (0, react.useState)(task.workspaceId ?? "");
			const running = task.status === "running";
			const collapsible = collapsesByDefault(task.status);
			const collapsed = collapsible && !expanded;
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
			if (collapsed) return (0, react_jsx_runtime.jsx)("li", {
				className: TaskCard_module_css_default.card,
				"data-testid": "task-card",
				"data-status": task.status,
				"data-collapsed": "true",
				children: (0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: TaskCard_module_css_default.summary,
					"aria-expanded": false,
					title: t("board.expand"),
					"data-testid": "task-expand",
					onClick: () => {
						setExpanded(true);
					},
					children: [
						(0, react_jsx_runtime.jsx)("span", {
							className: TaskCard_module_css_default.chevron,
							"aria-hidden": true,
							children: "▸"
						}),
						(0, react_jsx_runtime.jsx)("span", {
							className: TaskCard_module_css_default.summaryTitle,
							children: task.title
						}),
						(0, react_jsx_runtime.jsx)("span", {
							className: TaskCard_module_css_default.summaryTime,
							children: timeOf(task.lastRunAt)
						})
					]
				})
			});
			return (0, react_jsx_runtime.jsxs)("li", {
				className: TaskCard_module_css_default.card,
				"data-testid": "task-card",
				"data-status": task.status,
				children: [
					collapsible ? (0, react_jsx_runtime.jsxs)("button", {
						type: "button",
						className: TaskCard_module_css_default.summary,
						"aria-expanded": true,
						title: t("board.collapse"),
						"data-testid": "task-collapse",
						onClick: () => {
							setExpanded(false);
						},
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: TaskCard_module_css_default.chevron,
							"aria-hidden": true,
							children: "▾"
						}), (0, react_jsx_runtime.jsx)("span", {
							className: TaskCard_module_css_default.summaryTitle,
							children: task.title
						})]
					}) : (0, react_jsx_runtime.jsx)("h4", {
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
		});
		//#endregion
		//#region \0dsh-css:D:\Documents\Dev-Repo\deepseek-harness\dsh-plugins\dsh-web-enhanced\src\client\board\BoardOverlay.module.css.mjs
		const css$14 = ".tNcfJa_panel{flex-direction:column;flex:1;gap:10px;min-height:0;display:flex}.tNcfJa_toolbar{flex:none;gap:6px;display:flex}.tNcfJa_action,.tNcfJa_primary{border:1px solid var(--dsw-alias-border-l2,#0000001a);color:inherit;cursor:pointer;background:0 0;border-radius:8px;padding:6px 12px;font-size:13px;font-weight:500;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s}.tNcfJa_action:hover{background:var(--dsw-alias-interactive-bg-hover,#2631480f)}.tNcfJa_action:active{background:var(--dsw-alias-interactive-bg-active,#2631481a)}.tNcfJa_action:focus-visible,.tNcfJa_primary:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}.tNcfJa_primary{border-color:var(--dsw-alias-state-business-primary,#4176e6);background:var(--dsw-alias-state-business-tertiary,#b7c8fe)}.tNcfJa_primary:hover{background:var(--dsw-alias-interactive-bg-hover-accent,#26314824)}.tNcfJa_primary:disabled{cursor:default;opacity:.45}.tNcfJa_error{background:var(--dsw-alias-state-error-secondary,#f25a5a);color:var(--dsw-alias-state-error-primary,#ec1313);border-radius:8px;flex:none;margin:0;padding:6px 12px;font-size:13px}.tNcfJa_form{border:1px solid var(--dsw-alias-border-l2,#0000001a);border-radius:8px;flex:none;gap:8px;padding:12px;display:grid}.tNcfJa_field{flex-direction:column;gap:3px;display:flex}.tNcfJa_fieldLabel{color:var(--dsw-alias-label-secondary,#61666b);font-size:12px}.tNcfJa_input,.tNcfJa_textarea{border:1px solid var(--dsw-alias-border-l2,#0000001a);color:inherit;background:0 0;border-radius:8px;padding:4px 8px;font-family:inherit;font-size:13px}.tNcfJa_input:focus-visible,.tNcfJa_textarea:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}.tNcfJa_textarea{resize:vertical}.tNcfJa_hint{color:var(--dsw-alias-label-tertiary,#81858c);font-size:12px}.tNcfJa_formActions{gap:6px;display:flex}.tNcfJa_columns{flex:1;grid-template-columns:repeat(5,minmax(0,1fr));align-items:stretch;gap:10px;min-height:0;display:grid}@media (width<=900px){.tNcfJa_columns{grid-template-columns:none;grid-auto-columns:minmax(200px,1fr);grid-auto-flow:column;overflow-x:auto}}.tNcfJa_column{flex-direction:column;gap:8px;min-width:0;min-height:0;display:flex}.tNcfJa_columnTitle{color:var(--dsw-alias-label-secondary,#61666b);flex:none;align-items:center;gap:6px;margin:0;font-size:12px;font-weight:600;display:flex}.tNcfJa_count{background:var(--dsw-alias-interactive-bg-hover,#2631480f);border-radius:999px;padding:0 6px;font-size:12px}.tNcfJa_cards{scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l3,#00000024) transparent;flex-direction:column;flex:1;gap:8px;min-height:0;margin:0;padding:0 2px 0 0;list-style:none;display:flex;overflow-y:auto}@media (prefers-reduced-motion:reduce){*{transition-duration:0s}}.tNcfJa_empty{color:var(--dsw-alias-label-tertiary,#81858c);flex:none;margin:0;font-size:12px}";
		const tagId$14 = "dsh-web-enhanced/BoardOverlay.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$14) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId$14;
			tag.textContent = css$14;
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
			"panel": "tNcfJa_panel",
			"primary": "tNcfJa_primary",
			"textarea": "tNcfJa_textarea",
			"toolbar": "tNcfJa_toolbar"
		};
		//#endregion
		//#region lib/types/client/board/BoardOverlay.js
		/**
		* Task board: the five status columns, the create form, and the refresh
		* cadence. Two surfaces share the same panel — the full-frame overlay and the
		* workspace view's「任务看板」tab — so the data/logic lives in {@link
		* BoardPanel} and the two wrappers own only their chrome.
		*
		* A running task settles on the host (the agent session finishes and the
		* record is written back), so the board polls WHILE it shows a running task
		* and stops as soon as none is left — the status change has no push channel
		* to this plugin, and a permanent timer would poll an idle board forever.
		* A hidden browser tab skips its ticks (network + a full-column re-render
		* nobody sees) and the first visible moment catches the poll up.
		* @module dsh-web-enhanced/src/client/board/BoardOverlay
		*/
		/** Poll interval while at least one task is running, in milliseconds. */
		const RUNNING_POLL_MS = 2e3;
		/**
		* Same-length, same-record shallow equality: a poll whose records did not
		* move (id, column, updated timestamp) keeps the previous array reference so
		* React skips re-rendering every column and card.
		*/
		function tasksUnchanged(previous, next) {
			return previous.length === next.length && previous.every((task, index) => {
				const fresh = next[index];
				return fresh !== void 0 && task.id === fresh.id && task.status === fresh.status && task.updatedAt === fresh.updatedAt;
			});
		}
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
		/** The chrome-free board: error strip, create form, and the five columns. */
		function BoardPanel({ remote, workspaces, openSession, t }) {
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
				setTasks((previous) => tasksUnchanged(previous, result.tasks) ? previous : result.tasks);
			}, [remote]);
			(0, react.useEffect)(() => {
				reload();
			}, [reload]);
			const anyRunning = tasks.some((task) => task.status === "running");
			(0, react.useEffect)(() => {
				if (!anyRunning) return;
				const tick = () => {
					if (document.hidden) return;
					reload();
				};
				const onVisible = () => {
					if (!document.hidden) reload();
				};
				const timer = setInterval(tick, RUNNING_POLL_MS);
				document.addEventListener("visibilitychange", onVisible);
				return () => {
					clearInterval(timer);
					document.removeEventListener("visibilitychange", onVisible);
				};
			}, [anyRunning, reload]);
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
			const onRun = (0, react.useCallback)((target) => {
				mutate(remote.taskRun({ id: target.id }));
			}, [mutate, remote]);
			const onRemove = (0, react.useCallback)((target) => {
				mutate(remote.taskRemove({ id: target.id }));
			}, [mutate, remote]);
			const onUpdate = (0, react.useCallback)((request) => {
				mutate(remote.taskUpdate(request));
			}, [mutate]);
			return (0, react_jsx_runtime.jsxs)("div", {
				className: BoardOverlay_module_css_default.panel,
				"data-testid": "board-panel",
				children: [
					(0, react_jsx_runtime.jsx)("div", {
						className: BoardOverlay_module_css_default.toolbar,
						children: (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: BoardOverlay_module_css_default.action,
							"data-testid": "board-create-toggle",
							onClick: () => {
								setCreating((value) => !value);
							},
							children: t("board.create")
						})
					}),
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
										onRun,
										onOpen: openSession,
										onRemove,
										onUpdate
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
		/**
		* Place the uncommitted-changes row against HEAD.
		*
		* It is drawn where HEAD is rather than always on top, because that is what it
		* describes: with `--all` the newest commit in view may belong to another
		* branch entirely. When HEAD is not among the drawn rows — the graph is
		* filtered to a branch that is not checked out, or HEAD fell past the row cap —
		* the row goes to the top on lane 0 with nothing to connect to, because the
		* changes are still real even though their base is off-screen.
		* @param rows - the laid-out commit rows.
		* @param head - HEAD's commit hash.
		* @returns the placement.
		*/
		function placeWorking(rows, head) {
			const index = rows.findIndex((row) => row.commit.hash === head);
			if (index === -1) return {
				index: 0,
				lane: 0,
				through: []
			};
			const lane = rows[index].lane;
			return {
				index,
				lane,
				through: (index === 0 ? [] : rows[index - 1].through).filter((candidate) => candidate !== lane)
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
		const css$13 = ".H0OCzq_panel{flex-direction:column;flex:1;gap:10px;min-height:0;display:flex}.H0OCzq_toolbar{flex:none;align-items:center;gap:10px;display:flex}.H0OCzq_action{border:1px solid var(--dsw-alias-border-l2,#0000001a);color:inherit;cursor:pointer;background:0 0;border-radius:8px;padding:6px 12px;font-size:13px;font-weight:500;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s}.H0OCzq_action:hover{background:var(--dsw-alias-interactive-bg-hover,#2631480f)}.H0OCzq_action:active{background:var(--dsw-alias-interactive-bg-active,#2631481a)}.H0OCzq_action:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}.H0OCzq_filter{align-items:center;gap:6px;font-size:13px;display:flex}.H0OCzq_filterLabel{color:var(--dsw-alias-label-tertiary,#81858c)}.H0OCzq_select{border:1px solid var(--dsw-alias-border-l2,#0000001a);color:inherit;background:0 0;border-radius:8px;max-width:180px;padding:2px 8px;font-size:13px}.H0OCzq_select:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}.H0OCzq_rows{scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l3,#0000001f) transparent;flex:1;min-height:0;margin:0;padding:0 0 8px;list-style:none;overflow:auto}.H0OCzq_entry{border-bottom:1px solid var(--dsw-alias-border-l1,#0000000a)}.H0OCzq_row{width:100%;height:34px;color:inherit;cursor:pointer;font:inherit;text-align:start;background:0 0;border:0;align-items:center;gap:8px;padding:0;font-size:13px;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s;display:flex}.H0OCzq_row:hover{background:var(--dsw-alias-interactive-bg-hover,#2631480f)}.H0OCzq_row:focus-visible{outline-offset:-2px;box-shadow:inset 0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}.H0OCzq_rail{flex:none}.H0OCzq_edge{stroke-width:1.6px;fill:none}.H0OCzq_dot{stroke:var(--dsw-alias-bg-overlay,#e9ecf2);stroke-width:1.5px}.H0OCzq_edge[data-lane=\"0\"]{stroke:#6a8fd8}.H0OCzq_edge[data-lane=\"1\"]{stroke:#4caf72}.H0OCzq_edge[data-lane=\"2\"]{stroke:#d9a441}.H0OCzq_edge[data-lane=\"3\"]{stroke:#b978d1}.H0OCzq_edge[data-lane=\"4\"]{stroke:#48b3c2}.H0OCzq_edge[data-lane=\"5\"]{stroke:#d9534f}.H0OCzq_dot[data-lane=\"0\"]{fill:#6a8fd8}.H0OCzq_dot[data-lane=\"1\"]{fill:#4caf72}.H0OCzq_dot[data-lane=\"2\"]{fill:#d9a441}.H0OCzq_dot[data-lane=\"3\"]{fill:#b978d1}.H0OCzq_dot[data-lane=\"4\"]{fill:#48b3c2}.H0OCzq_dot[data-lane=\"5\"]{fill:#d9534f}.H0OCzq_hash{color:var(--dsw-alias-label-tertiary,#81858c);flex:none;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}.H0OCzq_subject{text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;overflow:hidden}.H0OCzq_ref{background:var(--dsw-alias-state-business-tertiary,#b7c8fe);border-radius:999px;flex:none;padding:1px 7px;font-size:12px}.H0OCzq_author,.H0OCzq_date{color:var(--dsw-alias-label-tertiary,#81858c);flex:none;font-size:12px}.H0OCzq_empty,.H0OCzq_error{color:var(--dsw-alias-label-secondary,#61666b);margin:12px 0;font-size:13px}.H0OCzq_error{color:var(--dsw-alias-state-error-primary,#ec1313)}.H0OCzq_detail{border-inline-start:2px solid var(--dsw-alias-state-business-primary,#4176e6);margin:0 0 8px 24px;padding:6px 0 6px 10px;font-size:13px}.H0OCzq_facts{grid-template-columns:max-content 1fr;gap:2px 10px;margin:0;display:grid}.H0OCzq_facts dt{color:var(--dsw-alias-label-tertiary,#81858c)}.H0OCzq_facts dd{overflow-wrap:anywhere;margin:0}.H0OCzq_mono{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}.H0OCzq_body{background:var(--dsw-alias-interactive-bg-hover,#2631480f);white-space:pre-wrap;border-radius:8px;margin:8px 0 0;padding:6px 8px;font-size:12px}.H0OCzq_filesTitle{color:var(--dsw-alias-label-tertiary,#81858c);margin:8px 0 4px}.H0OCzq_files{margin:0;padding:0;list-style:none}.H0OCzq_file{align-items:center;gap:8px;display:flex}.H0OCzq_filePath{text-overflow:ellipsis;white-space:nowrap;flex:1;min-width:0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px;overflow:hidden}.H0OCzq_added,.H0OCzq_removed{text-align:end;flex:none;min-width:42px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}.H0OCzq_added{color:var(--dsw-alias-state-success-primary,#22c55e)}.H0OCzq_removed{color:var(--dsw-alias-state-error-primary,#ec1313)}.H0OCzq_pendingEdge{stroke-width:1.6px;stroke-dasharray:3 3;fill:none}.H0OCzq_pendingDot{fill:var(--dsw-alias-bg-overlay,#e9ecf2);stroke-width:1.6px;stroke-dasharray:2.5 2}.H0OCzq_pendingEdge[data-lane=\"0\"],.H0OCzq_pendingDot[data-lane=\"0\"]{stroke:#6a8fd8}.H0OCzq_pendingEdge[data-lane=\"1\"],.H0OCzq_pendingDot[data-lane=\"1\"]{stroke:#4caf72}.H0OCzq_pendingEdge[data-lane=\"2\"],.H0OCzq_pendingDot[data-lane=\"2\"]{stroke:#d9a441}.H0OCzq_pendingEdge[data-lane=\"3\"],.H0OCzq_pendingDot[data-lane=\"3\"]{stroke:#b978d1}.H0OCzq_pendingEdge[data-lane=\"4\"],.H0OCzq_pendingDot[data-lane=\"4\"]{stroke:#48b3c2}.H0OCzq_pendingEdge[data-lane=\"5\"],.H0OCzq_pendingDot[data-lane=\"5\"]{stroke:#d9534f}.H0OCzq_workingCounts{color:var(--dsw-alias-label-tertiary,#81858c);flex:none;font-size:12px}.H0OCzq_stateTag{text-align:center;border-radius:999px;flex:none;min-width:44px;padding:1px 6px;font-size:12px}.H0OCzq_stateTag[data-state=staged]{background:var(--dsw-alias-state-success-tertiary,#e6faed)}.H0OCzq_stateTag[data-state=unstaged]{background:var(--dsw-alias-state-warn-tertiary,#fef5e7)}.H0OCzq_stateTag[data-state=untracked]{background:var(--dsw-alias-interactive-bg-hover,#2631480f)}@media (prefers-reduced-motion:reduce){*{transition-duration:0s}}";
		const tagId$13 = "dsh-web-enhanced/GraphOverlay.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$13) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId$13;
			tag.textContent = css$13;
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
			"panel": "H0OCzq_panel",
			"pendingDot": "H0OCzq_pendingDot",
			"pendingEdge": "H0OCzq_pendingEdge",
			"rail": "H0OCzq_rail",
			"ref": "H0OCzq_ref",
			"removed": "H0OCzq_removed",
			"row": "H0OCzq_row",
			"rows": "H0OCzq_rows",
			"select": "H0OCzq_select",
			"stateTag": "H0OCzq_stateTag",
			"subject": "H0OCzq_subject",
			"toolbar": "H0OCzq_toolbar",
			"workingCounts": "H0OCzq_workingCounts"
		};
		//#endregion
		//#region lib/types/client/git/GraphOverlay.js
		/**
		* Git graph: branch lanes and commit history for one workspace. Two surfaces
		* share the same panel — the full-frame overlay and the workspace view's「Git
		* 图谱」tab — so the data/logic lives in {@link GraphPanel} and the wrappers
		* own only their chrome.
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
		/** The chrome-free graph: filter, refresh, and the laid-out commit list. */
		function GraphPanel({ workspaceId, remote, t }) {
			const [commits, setCommits] = (0, react.useState)({ phase: "loading" });
			const [working, setWorking] = (0, react.useState)(null);
			const [workingOpen, setWorkingOpen] = (0, react.useState)(false);
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
				const [log, uncommitted] = await Promise.all([remote.gitLog({
					workspaceId,
					...branch === ALL_BRANCHES ? {} : { branch }
				}), remote.gitWorking({ workspaceId })]);
				if (!live.current) return;
				setCommits("error" in log ? {
					phase: "error",
					message: log.error.message
				} : {
					phase: "ready",
					items: log.commits
				});
				setWorking("error" in uncommitted ? null : uncommitted.working);
			}, [
				branch,
				remote,
				workspaceId
			]);
			(0, react.useEffect)(() => {
				if (workspaceId === void 0) return;
				(async () => {
					const result = await remote.gitBranches({ workspaceId });
					if (live.current && !("error" in result)) setBranches(result.branches);
				})();
			}, [remote, workspaceId]);
			(0, react.useEffect)(() => {
				if (workspaceId !== void 0) load();
			}, [load, workspaceId]);
			(0, react.useEffect)(() => {
				setExpanded(null);
			}, [branch]);
			return (0, react_jsx_runtime.jsx)("div", {
				className: GraphOverlay_module_css_default.panel,
				"data-testid": "graph-panel",
				children: workspaceId === void 0 ? (0, react_jsx_runtime.jsx)("p", {
					className: GraphOverlay_module_css_default.empty,
					children: t("graph.noWorkspace")
				}) : (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsxs)("div", {
					className: GraphOverlay_module_css_default.toolbar,
					children: [(0, react_jsx_runtime.jsxs)("label", {
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
					})]
				}), commits.phase === "loading" ? (0, react_jsx_runtime.jsx)("p", {
					className: GraphOverlay_module_css_default.empty,
					children: t("graph.loading")
				}) : commits.phase === "error" ? (0, react_jsx_runtime.jsx)("p", {
					className: GraphOverlay_module_css_default.error,
					children: t("graph.error", { message: commits.message })
				}) : (0, react_jsx_runtime.jsx)(GraphBody, {
					commits: commits.items,
					working,
					empty: t("graph.empty"),
					expanded,
					workingOpen,
					workspaceId,
					remote,
					onToggle: (hash) => {
						setExpanded((current) => current === hash ? null : hash);
					},
					onToggleWorking: () => {
						setWorkingOpen((value) => !value);
					},
					t
				})] })
			});
		}
		/** Whether a working view has anything to show. */
		function hasChanges(working) {
			return working !== null && working.staged + working.unstaged + working.untracked > 0;
		}
		/** The laid-out commit list; the lane math itself lives in `./lanes.ts`. */
		function GraphBody({ commits, working, empty, expanded, workingOpen, workspaceId, remote, onToggle, onToggleWorking, t }) {
			const layout = (0, react.useMemo)(() => layoutLanes(commits), [commits]);
			const railWidth = (layout.width + 1) * LANE_STEP;
			const dirty = hasChanges(working);
			const placement = (0, react.useMemo)(() => dirty ? placeWorking(layout.rows, working.head) : null, [
				dirty,
				layout,
				working
			]);
			const workingRow = dirty ? (0, react_jsx_runtime.jsx)(WorkingRow, {
				working,
				lane: placement?.lane ?? 0,
				through: placement?.through ?? [],
				railWidth,
				open: workingOpen,
				onToggle: onToggleWorking,
				t
			}) : null;
			if (commits.length === 0) return workingRow === null ? (0, react_jsx_runtime.jsx)("p", {
				className: GraphOverlay_module_css_default.empty,
				children: empty
			}) : (0, react_jsx_runtime.jsx)("ol", {
				className: GraphOverlay_module_css_default.rows,
				"data-testid": "graph-rows",
				children: workingRow
			});
			return (0, react_jsx_runtime.jsx)("ol", {
				className: GraphOverlay_module_css_default.rows,
				"data-testid": "graph-rows",
				children: layout.rows.map((row, index) => (0, react_jsx_runtime.jsxs)(react.Fragment, { children: [placement?.index === index && workingRow, (0, react_jsx_runtime.jsxs)("li", {
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
				})] }, row.commit.hash))
			});
		}
		/**
		* The uncommitted-changes row: a hollow dot on HEAD's lane, joined to HEAD by
		* a dashed stub. Dashed and hollow because it is not a commit — nothing in the
		* repository records it, and it disappears the moment it is committed.
		*/
		function WorkingRow({ working, lane, through, railWidth, open, onToggle, t }) {
			const dotX = (lane + 1) * LANE_STEP;
			return (0, react_jsx_runtime.jsxs)("li", {
				className: GraphOverlay_module_css_default.entry,
				children: [(0, react_jsx_runtime.jsxs)("button", {
					type: "button",
					className: GraphOverlay_module_css_default.row,
					"aria-expanded": open,
					"data-testid": "graph-working-row",
					onClick: onToggle,
					children: [
						(0, react_jsx_runtime.jsxs)("svg", {
							className: GraphOverlay_module_css_default.rail,
							width: railWidth,
							height: ROW_HEIGHT,
							"aria-hidden": true,
							children: [
								through.map((other) => (0, react_jsx_runtime.jsx)("line", {
									className: GraphOverlay_module_css_default.edge,
									"data-lane": laneColor(other, PALETTE_SIZE),
									x1: (other + 1) * LANE_STEP,
									y1: 0,
									x2: (other + 1) * LANE_STEP,
									y2: ROW_HEIGHT
								}, `through-${String(other)}`)),
								(0, react_jsx_runtime.jsx)("line", {
									className: GraphOverlay_module_css_default.pendingEdge,
									"data-lane": laneColor(lane, PALETTE_SIZE),
									x1: dotX,
									y1: ROW_HEIGHT / 2,
									x2: dotX,
									y2: ROW_HEIGHT
								}),
								(0, react_jsx_runtime.jsx)("circle", {
									className: GraphOverlay_module_css_default.pendingDot,
									"data-lane": laneColor(lane, PALETTE_SIZE),
									cx: dotX,
									cy: ROW_HEIGHT / 2,
									r: 4
								})
							]
						}),
						(0, react_jsx_runtime.jsx)("span", {
							className: GraphOverlay_module_css_default.hash,
							children: "••••••"
						}),
						(0, react_jsx_runtime.jsx)("span", {
							className: GraphOverlay_module_css_default.subject,
							children: t("graph.working.title")
						}),
						(0, react_jsx_runtime.jsx)("span", {
							className: GraphOverlay_module_css_default.workingCounts,
							children: t("graph.working.counts", {
								staged: String(working.staged),
								unstaged: String(working.unstaged),
								untracked: String(working.untracked)
							})
						})
					]
				}), open && (0, react_jsx_runtime.jsx)(WorkingDetail, {
					working,
					t
				})]
			});
		}
		/** The expanded file list of the uncommitted row. */
		function WorkingDetail({ working, t }) {
			return (0, react_jsx_runtime.jsxs)("div", {
				className: GraphOverlay_module_css_default.detail,
				"data-testid": "graph-working-detail",
				children: [working.truncated && (0, react_jsx_runtime.jsx)("p", {
					className: GraphOverlay_module_css_default.filesTitle,
					children: t("graph.working.truncated", { count: String(working.files.length) })
				}), (0, react_jsx_runtime.jsx)("ul", {
					className: GraphOverlay_module_css_default.files,
					children: working.files.map((file) => (0, react_jsx_runtime.jsxs)("li", {
						className: GraphOverlay_module_css_default.file,
						children: [
							(0, react_jsx_runtime.jsx)("span", {
								className: GraphOverlay_module_css_default.stateTag,
								"data-state": file.state,
								children: stateLabel(file, t)
							}),
							(0, react_jsx_runtime.jsx)("span", {
								className: GraphOverlay_module_css_default.filePath,
								title: file.path,
								children: file.path
							}),
							(0, react_jsx_runtime.jsx)("span", {
								className: GraphOverlay_module_css_default.added,
								title: file.added === null ? t("graph.working.unknown") : void 0,
								children: file.added === null ? "—" : `+${String(file.added)}`
							}),
							(0, react_jsx_runtime.jsx)("span", {
								className: GraphOverlay_module_css_default.removed,
								children: file.removed === null ? "—" : `-${String(file.removed)}`
							})
						]
					}, `${file.state}:${file.path}`))
				})]
			});
		}
		/** Short tag naming which diff a working file came out of. */
		function stateLabel(file, t) {
			if (file.state === "staged") return t("graph.working.staged");
			return file.state === "unstaged" ? t("graph.working.unstaged") : t("graph.working.untracked");
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
		/** MIME type used for an image path, from its extension. */
		function mimeOfImagePath(path) {
			const ext = extensionOf(path);
			if (ext === "svg") return "image/svg+xml";
			if (ext === "jpg" || ext === "jpeg") return "image/jpeg";
			return `image/${ext === "" ? "png" : ext}`;
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
		const css$12 = ".gtoRXG_tree{flex-direction:column;flex:1;min-height:0;display:flex;overflow:hidden}.gtoRXG_searchRow{flex:none;align-items:center;gap:6px;padding:8px 8px 0;display:flex}.gtoRXG_search{border:1px solid var(--dsw-alias-border-l2,#0000001a);min-width:0;color:inherit;background:0 0;border-radius:8px;flex:1;margin:0;padding:5px 8px;font-size:13px;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s}.gtoRXG_search:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}.gtoRXG_collapse{border:1px solid var(--dsw-alias-border-l2,#0000001a);background:var(--dsw-alias-bg-layer-2,transparent);width:28px;height:28px;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer;border-radius:8px;flex:none;justify-content:center;align-items:center;padding:0;font-size:14px;line-height:1;transition:background-color .14s,color .14s;display:flex}.gtoRXG_collapse:hover{background:var(--dsw-alias-interactive-bg-hover,#2631480f);color:var(--dsw-alias-label-primary,#0f1115)}.gtoRXG_collapse:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4176e6);outline-offset:1px}.gtoRXG_list{scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l3,#0000001f) transparent;flex:1;min-height:0;margin:0;padding:0 0 8px;list-style:none;overflow:auto}.gtoRXG_row{width:100%;color:inherit;cursor:pointer;text-align:start;background:0 0;border:none;border-radius:8px;align-items:center;gap:6px;padding:3px 8px;font-size:13px;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s;display:flex}.gtoRXG_row:hover{background:var(--dsw-alias-interactive-bg-hover,#2631480f)}.gtoRXG_row:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}.gtoRXG_glyph{width:10px;color:var(--dsw-alias-label-tertiary,#81858c);flex:none;font-size:12px}.gtoRXG_name{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.gtoRXG_row[data-kind=dir] .gtoRXG_name{color:var(--dsw-alias-label-primary,#0f1115);font-weight:500}.gtoRXG_path{color:var(--dsw-alias-label-tertiary,#81858c);text-overflow:ellipsis;white-space:nowrap;margin-inline-start:auto;font-size:12px;overflow:hidden}.gtoRXG_empty,.gtoRXG_error{color:var(--dsw-alias-label-secondary,#61666b);margin:8px;font-size:13px}.gtoRXG_error{color:var(--dsw-alias-state-error-primary,#ec1313)}@media (prefers-reduced-motion:reduce){.gtoRXG_search,.gtoRXG_collapse,.gtoRXG_row{transition:none}}";
		const tagId$12 = "dsh-web-enhanced/FileTree.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$12) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId$12;
			tag.textContent = css$12;
			document.head.appendChild(tag);
		}
		var FileTree_module_css_default = {
			"collapse": "gtoRXG_collapse",
			"empty": "gtoRXG_empty",
			"error": "gtoRXG_error",
			"glyph": "gtoRXG_glyph",
			"list": "gtoRXG_list",
			"name": "gtoRXG_name",
			"path": "gtoRXG_path",
			"row": "gtoRXG_row",
			"search": "gtoRXG_search",
			"searchRow": "gtoRXG_searchRow",
			"tree": "gtoRXG_tree"
		};
		//#endregion
		//#region lib/types/client/panel/FileTree.js
		/**
		* Workspace file tree sidebar: lazily expanded directories, whole-row click
		* to expand, and a file-name filter that switches the tree into a flat match
		* list. Clicking a file opens it in the explorer's preview side, which the
		* combined layout keeps visible beside the tree.
		*
		* Directory contents are fetched on first expansion and cached for the life
		* of the mount: a tree that re-listed on every render would hammer the host
		* on each keystroke of the filter.
		* @module dsh-web-enhanced/src/client/panel/FileTree
		*/
		/** Debounce of the search query, in milliseconds. */
		const SEARCH_DEBOUNCE_MS = 200;
		/** Directory listings retained at once; the oldest expansion drops. */
		const LISTING_CAPACITY = 50;
		/**
		* Shared empty expansion set: the selector below must return one stable
		* reference, or every panel-store write re-renders the whole recursive tree.
		*/
		const NO_EXPANSIONS = [];
		/**
		* Copy the listings map with one directory's entry replaced, dropping the
		* oldest entry beyond {@link LISTING_CAPACITY} (insertion order = age; the
		* replaced key re-arms as newest).
		*/
		function withListing(current, path, listing) {
			const next = new Map(current);
			next.delete(path);
			next.set(path, listing);
			while (next.size > LISTING_CAPACITY) {
				const oldest = next.keys().next();
				if (oldest.done === true) break;
				next.delete(oldest.value);
			}
			return next;
		}
		/** The file tree. */
		function FileTree({ workspaceId, usePanel, remote, toggleExpanded, setQuery, openTab, t, onCollapse, collapseLabel }) {
			const expanded = usePanel((state) => state.expanded[workspaceId] ?? NO_EXPANSIONS);
			const query = usePanel((state) => state.query);
			const [listings, setListings] = (0, react.useState)(/* @__PURE__ */ new Map());
			const [matches, setMatches] = (0, react.useState)(null);
			const live = (0, react.useRef)(true);
			(0, react.useEffect)(() => () => {
				live.current = false;
			}, []);
			const list = (0, react.useCallback)(async (path) => {
				setListings((current) => withListing(current, path, { phase: "loading" }));
				const result = await remote.fsList({
					workspaceId,
					path
				});
				if (!live.current) return;
				setListings((current) => withListing(current, path, "error" in result ? {
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
			}, [
				openTab,
				remote,
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
				children: [(0, react_jsx_runtime.jsxs)("div", {
					className: FileTree_module_css_default.searchRow,
					children: [(0, react_jsx_runtime.jsx)("input", {
						className: FileTree_module_css_default.search,
						value: query,
						placeholder: t("files.search"),
						"aria-label": t("files.search"),
						"data-testid": "file-tree-search",
						onChange: (event) => {
							setQuery(event.target.value);
						}
					}), onCollapse !== void 0 && (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: FileTree_module_css_default.collapse,
						"aria-label": collapseLabel ?? "",
						title: collapseLabel,
						"data-testid": "workspace-sidebar-collapse",
						onClick: onCollapse,
						children: (0, react_jsx_runtime.jsx)("span", {
							"aria-hidden": "true",
							children: "‹"
						})
					})]
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
		/**
		* Whether an image href is browser-addressable on its own: any scheme (after
		* `safeSrc` has allowed it) or a protocol-relative URL. The browser resolves
		* these; a workspace-relative path cannot, and must be read through `fsRead`.
		*/
		function browserImageHref(href) {
			const trimmed = href.trim();
			if (/^[a-z][a-z0-9+.-]*:/iu.test(trimmed) || trimmed.startsWith("//")) return trimmed;
		}
		/**
		* Resolve a Markdown image href against its document to a workspace-relative
		* path. Returns undefined for browser-addressable URLs, absolute filesystem
		* paths, and `..` chains that would escape the workspace root.
		* @param markdownPath - workspace-relative path of the Markdown file.
		* @param href - the image reference from the document.
		*/
		function workspaceImagePathOf(markdownPath, href) {
			const trimmed = href.trim();
			if (trimmed === "" || browserImageHref(trimmed) !== void 0) return void 0;
			if (/^[\\/]/u.test(trimmed) || /^[a-zA-Z]:/u.test(trimmed)) return void 0;
			const raw = trimmed.split(/[?#]/u, 1)[0];
			let decoded = raw;
			try {
				decoded = decodeURIComponent(raw);
			} catch {}
			const normalized = decoded.replace(/\\/gu, "/");
			const base = markdownPath.includes("/") ? markdownPath.slice(0, markdownPath.lastIndexOf("/") + 1) : "";
			const parts = [];
			for (const segment of `${base}${normalized}`.split("/")) {
				if (segment === "" || segment === ".") continue;
				if (segment === "..") {
					if (parts.length === 0) return void 0;
					parts.pop();
					continue;
				}
				parts.push(segment);
			}
			return parts.length === 0 ? void 0 : parts.join("/");
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
		/** Leading indentation width of a line, counting tabs as one column. */
		function indentOf(line) {
			return line.length - line.trimStart().length;
		}
		/** Read a list marker at the head of a line, or undefined when there is none. */
		function listMarkerOf(line) {
			const found = /^([ \t]*)([-*+]|\d+[.)])\s+(.*)$/u.exec(line);
			if (found === null) return void 0;
			const number = /^(\d+)[.)]$/u.exec(found[2]);
			return {
				indent: found[1].length,
				ordered: number !== null,
				...number === null ? {} : { start: Number(number[1]) },
				text: found[3]
			};
		}
		/**
		* Read a GFM task marker from the head of list-item text.
		* @returns the task state and the text after the marker.
		*/
		function taskMarkerOf(text) {
			const found = /^\[([ xX])\]\s*(.*)$/u.exec(text);
			if (found === null) return {
				task: false,
				checked: false,
				text
			};
			return {
				task: true,
				checked: found[1].toLowerCase() === "x",
				text: found[2]
			};
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
			/**
			* Consume one list block at `baseIndent`, including task state and nested
			* child lists. Items keep a shared marker style: every unordered marker
			* belongs to the same list, while an ordered marker starts a new one.
			*/
			const takeList = (baseIndent, ordered, start) => {
				const items = [];
				while (index < lines.length) {
					const marker = listMarkerOf(lines[index]);
					if (marker === void 0 || marker.indent !== baseIndent || marker.ordered !== ordered) break;
					index += 1;
					const task = taskMarkerOf(ordered && /^[-*+]\s+/u.test(marker.text) ? marker.text.replace(/^[-*+]\s+/u, "") : marker.text);
					const parts = task.text === "" ? [] : [task.text];
					const children = [];
					while (index < lines.length) {
						const line = lines[index];
						if (line.trim() === "") break;
						const nested = listMarkerOf(line);
						if (nested !== void 0) {
							if (nested.indent <= baseIndent) break;
							children.push(takeList(nested.indent, nested.ordered, nested.start));
							continue;
						}
						if (indentOf(line) <= baseIndent) break;
						parts.push(line.trim());
						index += 1;
					}
					items.push({
						spans: parts.length === 0 ? [] : parseInline(parts.join(" ")),
						...task.task ? {
							task: true,
							checked: task.checked
						} : {},
						children
					});
				}
				return {
					type: "list",
					ordered,
					...start === void 0 ? {} : { start },
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
					blocks.push({
						type: "paragraph",
						spans: parseInline(lines.slice(start, index).map((part) => part.trim()).join(" "))
					});
					continue;
				}
				const list = listMarkerOf(line);
				if (list !== void 0) {
					blocks.push(takeList(list.indent, list.ordered, list.start));
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
		const css$11 = ".yPmR4G_pane{flex-direction:column;flex:1;min-height:0;display:flex;position:relative}.yPmR4G_backToTop{z-index:2;border:1px solid var(--dsw-alias-border-l2,#0000001a);background:var(--dsw-alias-bg-layer-1,#fff);width:36px;height:36px;color:var(--dsw-alias-label-primary,inherit);cursor:pointer;border-radius:999px;justify-content:center;align-items:center;padding:0;font-size:16px;line-height:1;transition:background-color .14s,color .14s,transform .14s;display:flex;position:absolute;bottom:20px;right:20px;box-shadow:0 1px 2px #00000014,0 8px 24px #0000001f}.yPmR4G_backToTop:hover{background:var(--dsw-alias-interactive-bg-hover,#2631480f)}.yPmR4G_backToTop:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4176e6);outline-offset:2px}.yPmR4G_strip{scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l3,#0000001f) transparent;border-bottom:1px solid var(--dsw-alias-border-l1,#0000000a);flex:none;gap:2px;padding:4px 6px;display:flex;overflow-x:auto}.yPmR4G_stripItem{border-radius:8px;align-items:center;padding-inline-end:2px;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s;display:flex}.yPmR4G_stripItem:hover{background:var(--dsw-alias-interactive-bg-hover,#2631480f)}.yPmR4G_stripItem[data-active]{background:var(--dsw-alias-interactive-bg-active,#2631481a)}.yPmR4G_stripName{max-width:160px;color:inherit;cursor:pointer;text-overflow:ellipsis;white-space:nowrap;background:0 0;border:none;align-items:center;gap:4px;padding:3px 6px;font-size:12px;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s;display:flex;overflow:hidden}.yPmR4G_stripName:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}.yPmR4G_dirty{color:var(--dsw-alias-state-warn-primary,#f59e0b)}.yPmR4G_stripClose{color:var(--dsw-alias-label-tertiary,#81858c);cursor:pointer;background:0 0;border:none;border-radius:8px;padding:2px 4px;font-size:12px;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s}.yPmR4G_stripClose:hover{background:var(--dsw-alias-interactive-bg-hover,#2631480f);color:var(--dsw-alias-label-primary,#0f1115)}.yPmR4G_stripClose:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}.yPmR4G_toolbar{border-bottom:1px solid var(--dsw-alias-border-l1,#0000000a);flex:none;align-items:center;gap:6px;padding:5px 8px;display:flex}.yPmR4G_mode,.yPmR4G_save{border:1px solid var(--dsw-alias-border-l2,#0000001a);color:inherit;cursor:pointer;background:0 0;border-radius:8px;padding:2px 8px;font-size:12px;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s}.yPmR4G_mode:hover,.yPmR4G_save:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#2631480f)}.yPmR4G_mode:focus-visible,.yPmR4G_save:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}.yPmR4G_mode[data-active]{background:var(--dsw-alias-interactive-bg-active,#2631481a)}.yPmR4G_save{margin-inline-start:auto}.yPmR4G_save:disabled{cursor:default;opacity:.4}.yPmR4G_notice{color:var(--dsw-alias-label-tertiary,#81858c);font-size:12px}.yPmR4G_error{color:var(--dsw-alias-state-error-primary,#ec1313);margin:6px 8px;font-size:12px}.yPmR4G_body{flex:1;min-height:0;display:flex}.yPmR4G_body[data-mode=split]>*{flex:1;min-width:0}.yPmR4G_body[data-mode=split] .yPmR4G_view{border-inline-start:1px solid var(--dsw-alias-border-l2,#0000001a)}.yPmR4G_editor{resize:none;min-width:0;color:inherit;background:0 0;border:none;flex:1;padding:12px 16px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:1.5}.yPmR4G_editor:focus{outline:none}.yPmR4G_editor:focus-visible{outline-offset:-2px;box-shadow:inset 0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}.yPmR4G_source,.yPmR4G_diff{white-space:pre-wrap;word-break:break-word;scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l3,#0000001f) transparent;flex:1;min-width:0;margin:0;padding:12px 16px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;line-height:1.5;overflow:auto}.yPmR4G_view{flex:1;min-width:0;padding:16px 20px;overflow:auto}.yPmR4G_empty{color:var(--dsw-alias-label-secondary,#61666b);margin:12px;font-size:13px}.yPmR4G_frame{background:var(--dsw-alias-bg-base,#f9fafb);border:none;width:100%;height:100%;min-height:320px}.yPmR4G_image{max-width:100%;height:auto}.yPmR4G_markdown{font-size:14px;line-height:1.65}.yPmR4G_markdown h1{font-size:22px}.yPmR4G_markdown h2{font-size:19px}.yPmR4G_markdown h3{font-size:17px}.yPmR4G_markdown blockquote{border-inline-start:3px solid var(--dsw-alias-border-l3,#0000001f);color:var(--dsw-alias-label-secondary,#61666b);margin:8px 0;padding-inline-start:10px}.yPmR4G_markdown ul[data-ordered=false] li[data-task=true]{margin-inline-start:-1.25em;list-style:none}.yPmR4G_task{align-items:flex-start;gap:6px;display:flex}.yPmR4G_taskBox{width:13px;height:13px;accent-color:var(--dsw-alias-state-business-primary,#4176e6);flex:none;margin:3px 0 0}.yPmR4G_taskText{min-width:0}.yPmR4G_markdown li[data-checked=true]>.yPmR4G_task .yPmR4G_taskText{color:var(--dsw-alias-label-tertiary,#81858c);text-decoration:line-through}.yPmR4G_inlineCode,.yPmR4G_codeBlock{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px}.yPmR4G_inlineCode{background:var(--dsw-alias-interactive-bg-hover,#2631480f);border-radius:4px;padding:1px 4px}.yPmR4G_codeBlock{background:var(--dsw-alias-interactive-bg-hover,#2631480f);border-radius:4px;padding:8px 10px;overflow:auto}.yPmR4G_table{border-collapse:collapse;width:100%;font-size:13px}.yPmR4G_table th,.yPmR4G_table td{border:1px solid var(--dsw-alias-border-l2,#0000001a);text-align:start;padding:3px 7px}.yPmR4G_table th{background:var(--dsw-alias-interactive-bg-hover,#2631480f)}.yPmR4G_inlineImage{vertical-align:middle;max-width:100%}.yPmR4G_inlineImageFallback{color:var(--dsw-alias-label-tertiary,#81858c);font-style:italic}.yPmR4G_diffLine{display:block}.yPmR4G_diffLine[data-kind=added]{background:var(--dsw-alias-state-success-tertiary,#e6faed)}.yPmR4G_diffLine[data-kind=removed]{background:var(--dsw-alias-state-error-secondary,#f25a5a)}.yPmR4G_diffLine[data-kind=hunk]{color:var(--dsw-alias-state-business-primary,#4176e6)}.yPmR4G_diffLine[data-kind=meta]{color:var(--dsw-alias-label-tertiary,#81858c)}@media (prefers-reduced-motion:reduce){.yPmR4G_backToTop,.yPmR4G_stripItem,.yPmR4G_stripName,.yPmR4G_stripClose,.yPmR4G_mode,.yPmR4G_save{transition:none}}";
		const tagId$11 = "dsh-web-enhanced/PreviewPane.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$11) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId$11;
			tag.textContent = css$11;
			document.head.appendChild(tag);
		}
		var PreviewPane_module_css_default = {
			"backToTop": "yPmR4G_backToTop",
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
			"inlineImageFallback": "yPmR4G_inlineImageFallback",
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
			"task": "yPmR4G_task",
			"taskBox": "yPmR4G_taskBox",
			"taskText": "yPmR4G_taskText",
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
		/** Scroll depth past which the back-to-top button appears, px. */
		const TOP_THRESHOLD_PX = 240;
		/** Shared empty row set for the non-CSV kinds (stable reference for useMemo). */
		const EMPTY_ROWS = [];
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
			const activePath = active?.path;
			const markdownImage = (0, react.useMemo)(() => ({
				tabPath: activePath ?? "",
				workspaceId,
				remote
			}), [
				activePath,
				workspaceId,
				remote
			]);
			const [saveError, setSaveError] = (0, react.useState)(null);
			const scroller = (0, react.useRef)(null);
			const [showTop, setShowTop] = (0, react.useState)(false);
			const live = (0, react.useRef)(true);
			/** Bind the active scroll region to the back-to-top button. */
			const bindScroller = (element) => {
				scroller.current = element;
				setShowTop(element !== null && element.scrollTop > TOP_THRESHOLD_PX);
			};
			const trackScroll = (event) => {
				setShowTop(event.currentTarget.scrollTop > TOP_THRESHOLD_PX);
			};
			const backToTop = () => {
				const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
				scroller.current?.scrollTo({
					top: 0,
					behavior: reduce ? "auto" : "smooth"
				});
			};
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
								ref: bindScroller,
								className: PreviewPane_module_css_default.editor,
								value: body,
								spellCheck: false,
								"data-testid": "preview-editor",
								onChange: (event) => {
									setDraft(active.path, event.target.value);
								},
								onScroll: trackScroll
							}),
							(active.mode === "source" || active.mode === "split") && !editable && (0, react_jsx_runtime.jsx)("pre", {
								className: PreviewPane_module_css_default.source,
								ref: bindScroller,
								onScroll: trackScroll,
								children: body
							}),
							(active.mode === "view" || active.mode === "split") && (0, react_jsx_runtime.jsx)("div", {
								className: PreviewPane_module_css_default.view,
								"data-testid": "preview-view",
								ref: bindScroller,
								onScroll: trackScroll,
								children: (0, react_jsx_runtime.jsx)(RenderedForm, {
									tab: active,
									text: body,
									unsupported: t("preview.unsupported"),
									image: markdownImage
								})
							})
						]
					}),
					showTop && (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: PreviewPane_module_css_default.backToTop,
						"aria-label": t("preview.backToTop"),
						"data-testid": "preview-back-to-top",
						onClick: backToTop,
						children: (0, react_jsx_runtime.jsx)("span", {
							"aria-hidden": "true",
							children: "↑"
						})
					})
				]
			});
		}
		/**
		* The rendered (non-source) form of one tab. Memoized with the heavy parse
		* and data-URL work hoisted into `useMemo`: the pane re-renders on
		* scroll-position flips and save errors, and re-parsing the document or
		* re-concatenating a multi-megabyte base64 string for those would be pure
		* waste.
		*/
		const RenderedForm = (0, react.memo)(function RenderedForm({ tab, text, unsupported, image }) {
			const csvRows = (0, react.useMemo)(() => tab.kind === "csv" ? parseDelimited(text, extensionOf(tab.path) === "tsv" ? "	" : ",") : EMPTY_ROWS, [tab, text]);
			const dataSrc = (0, react.useMemo)(() => {
				if (tab.binary === void 0 || tab.binary === "") return void 0;
				const mime = tab.kind === "pdf" ? "application/pdf" : mimeOfImagePath(tab.path);
				return binaryObjectUrl(contentKey("preview", tab.binary), tab.binary, mime);
			}, [tab]);
			switch (tab.kind) {
				case "markdown": return (0, react_jsx_runtime.jsx)(MarkdownView, {
					source: text,
					image
				});
				case "csv": return (0, react_jsx_runtime.jsx)(TableView, { rows: csvRows });
				case "diff": return (0, react_jsx_runtime.jsx)(DiffView, { source: text });
				case "html": return (0, react_jsx_runtime.jsx)("iframe", {
					className: PreviewPane_module_css_default.frame,
					sandbox: "",
					srcDoc: text,
					title: tab.name
				});
				case "image": return dataSrc === void 0 ? (0, react_jsx_runtime.jsx)("p", {
					className: PreviewPane_module_css_default.empty,
					children: unsupported
				}) : (0, react_jsx_runtime.jsx)("img", {
					className: PreviewPane_module_css_default.image,
					src: dataSrc,
					alt: tab.name
				});
				case "pdf": return dataSrc === void 0 ? (0, react_jsx_runtime.jsx)("p", {
					className: PreviewPane_module_css_default.empty,
					children: unsupported
				}) : (0, react_jsx_runtime.jsx)("object", {
					className: PreviewPane_module_css_default.frame,
					data: dataSrc,
					type: "application/pdf",
					"aria-label": tab.name
				});
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
		});
		/**
		* A workspace-relative Markdown image, read through the plugin's own `fsRead`
		* and rendered as a data URL. The host's read stays workspace-scoped, so this
		* loads exactly the same file an IDE resolves — and nothing outside the root.
		*/
		function WorkspaceImage({ path, alt, workspaceId, remote }) {
			const [url, setUrl] = (0, react.useState)(null);
			const [failed, setFailed] = (0, react.useState)(false);
			(0, react.useEffect)(() => {
				let live = true;
				setUrl(null);
				setFailed(false);
				workspaceImageUrl(remote, workspaceId, path, mimeOfImagePath).then((next) => {
					if (live) setUrl(next);
				}, () => {
					if (live) setFailed(true);
				});
				return () => {
					live = false;
				};
			}, [
				path,
				workspaceId,
				remote
			]);
			if (failed) return (0, react_jsx_runtime.jsx)("span", {
				className: PreviewPane_module_css_default.inlineImageFallback,
				children: alt === "" ? path : alt
			});
			if (url === null) return null;
			return (0, react_jsx_runtime.jsx)("img", {
				className: PreviewPane_module_css_default.inlineImage,
				src: url,
				alt
			});
		}
		/** Inline spans as React elements. */
		function Spans({ spans, image }) {
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
					case "image": {
						const external = browserImageHref(span.href);
						if (external !== void 0) return (0, react_jsx_runtime.jsx)("img", {
							className: PreviewPane_module_css_default.inlineImage,
							src: external,
							alt: span.text
						}, index);
						const path = workspaceImagePathOf(image.tabPath, span.href);
						if (path === void 0) return (0, react_jsx_runtime.jsx)("span", {
							className: PreviewPane_module_css_default.inlineImageFallback,
							children: span.text
						}, index);
						return (0, react_jsx_runtime.jsx)(WorkspaceImage, {
							path,
							alt: span.text,
							workspaceId: image.workspaceId,
							remote: image.remote
						}, index);
					}
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
		function MarkdownTable({ block, image }) {
			return (0, react_jsx_runtime.jsxs)("table", {
				className: PreviewPane_module_css_default.table,
				children: [block.header.length > 0 && (0, react_jsx_runtime.jsx)("thead", { children: (0, react_jsx_runtime.jsx)("tr", { children: block.header.map((cell, index) => (0, react_jsx_runtime.jsx)("th", {
					style: block.align[index] === void 0 ? void 0 : { textAlign: block.align[index] },
					children: (0, react_jsx_runtime.jsx)(Spans, {
						spans: cell,
						image
					})
				}, index)) }) }), (0, react_jsx_runtime.jsx)("tbody", { children: block.rows.map((row, rowIndex) => (0, react_jsx_runtime.jsx)("tr", { children: row.map((cell, index) => (0, react_jsx_runtime.jsx)("td", {
					style: block.align[index] === void 0 ? void 0 : { textAlign: block.align[index] },
					children: (0, react_jsx_runtime.jsx)(Spans, {
						spans: cell,
						image
					})
				}, index)) }, rowIndex)) })]
			});
		}
		/** Rendered Markdown blocks, shared by documents and nested list children. */
		function Blocks({ blocks, image }) {
			return blocks.map((block, index) => {
				switch (block.type) {
					case "heading": {
						const Tag = `h${String(Math.min(block.level, 6))}`;
						return (0, react_jsx_runtime.jsx)(Tag, { children: (0, react_jsx_runtime.jsx)(Spans, {
							spans: block.spans,
							image
						}) }, index);
					}
					case "paragraph": return (0, react_jsx_runtime.jsx)("p", { children: (0, react_jsx_runtime.jsx)(Spans, {
						spans: block.spans,
						image
					}) }, index);
					case "code": return (0, react_jsx_runtime.jsx)("pre", {
						className: PreviewPane_module_css_default.codeBlock,
						"data-lang": block.lang,
						children: (0, react_jsx_runtime.jsx)("code", { children: block.code })
					}, index);
					case "quote": return (0, react_jsx_runtime.jsx)("blockquote", { children: (0, react_jsx_runtime.jsx)(Spans, {
						spans: block.spans,
						image
					}) }, index);
					case "rule": return (0, react_jsx_runtime.jsx)("hr", {}, index);
					case "table": return (0, react_jsx_runtime.jsx)(MarkdownTable, {
						block,
						image
					}, index);
					case "list": {
						const Tag = block.ordered ? "ol" : "ul";
						return (0, react_jsx_runtime.jsx)(Tag, {
							"data-ordered": block.ordered ? "true" : "false",
							start: block.ordered ? block.start : void 0,
							children: block.items.map((item, itemIndex) => (0, react_jsx_runtime.jsxs)("li", {
								"data-task": item.task === true ? "true" : void 0,
								"data-checked": item.task === true && item.checked ? "true" : void 0,
								children: [item.task === true ? (0, react_jsx_runtime.jsxs)("label", {
									className: PreviewPane_module_css_default.task,
									children: [(0, react_jsx_runtime.jsx)("input", {
										className: PreviewPane_module_css_default.taskBox,
										type: "checkbox",
										disabled: true,
										checked: item.checked
									}), (0, react_jsx_runtime.jsx)("span", {
										className: PreviewPane_module_css_default.taskText,
										children: (0, react_jsx_runtime.jsx)(Spans, {
											spans: item.spans,
											image
										})
									})]
								}) : (0, react_jsx_runtime.jsx)(Spans, {
									spans: item.spans,
									image
								}), item.children.length > 0 && (0, react_jsx_runtime.jsx)(Blocks, {
									blocks: item.children,
									image
								})]
							}, itemIndex))
						}, index);
					}
				}
			});
		}
		/** Structural Markdown rendering. */
		function MarkdownView({ source, image }) {
			const blocks = (0, react.useMemo)(() => parseMarkdown(source), [source]);
			return (0, react_jsx_runtime.jsx)("div", {
				className: PreviewPane_module_css_default.markdown,
				children: (0, react_jsx_runtime.jsx)(Blocks, {
					blocks,
					image
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
			const lines = (0, react.useMemo)(() => source.split(/\r?\n/u), [source]);
			return (0, react_jsx_runtime.jsx)("pre", {
				className: PreviewPane_module_css_default.diff,
				children: lines.map((line, index) => (0, react_jsx_runtime.jsx)("span", {
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
		const css$10 = ".AjjPzG_pane{flex-direction:column;flex:1;min-height:0;display:flex}.AjjPzG_toolbar{justify-content:flex-end;padding:6px 8px;display:flex}.AjjPzG_group{padding-bottom:6px}.AjjPzG_groupTitle{color:var(--dsw-alias-label-secondary,#61666b);align-items:center;gap:6px;margin:0;padding:4px 10px;font-size:12px;font-weight:600;display:flex}.AjjPzG_count{background:var(--dsw-alias-interactive-bg-hover,#2631480f);border-radius:999px;padding:0 6px;font-size:12px}.AjjPzG_list{margin:0;padding:0;list-style:none}.AjjPzG_row{align-items:center;gap:4px;padding:2px 8px;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s;display:flex}.AjjPzG_row:hover{background:var(--dsw-alias-interactive-bg-hover,#2631480f)}.AjjPzG_name{min-width:0;color:inherit;cursor:pointer;text-align:start;background:0 0;border:none;flex:1;align-items:center;gap:6px;padding:2px 0;font-size:13px;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s;display:flex}.AjjPzG_name:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}.AjjPzG_code{text-align:center;flex:none;width:12px;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}.AjjPzG_code[data-code=M]{color:var(--dsw-alias-state-warn-primary,#f59e0b)}.AjjPzG_code[data-code=A]{color:var(--dsw-alias-state-success-primary,#22c55e)}.AjjPzG_code[data-code=D]{color:var(--dsw-alias-state-error-primary,#ec1313)}.AjjPzG_code[data-code=R]{color:var(--dsw-alias-state-business-primary,#4176e6)}.AjjPzG_code[data-code=\\?]{color:var(--dsw-alias-label-tertiary,#81858c)}.AjjPzG_label{text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.AjjPzG_action,.AjjPzG_danger{color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer;background:0 0;border:none;border-radius:8px;flex:none;padding:2px 5px;font-size:12px;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s}.AjjPzG_action:hover{background:var(--dsw-alias-interactive-bg-hover,#2631480f);color:var(--dsw-alias-label-primary,#0f1115)}.AjjPzG_action:focus-visible,.AjjPzG_danger:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}.AjjPzG_danger{color:var(--dsw-alias-state-error-primary,#ec1313)}.AjjPzG_danger:hover{background:var(--dsw-alias-interactive-bg-hover-danger,#ec13130d);color:var(--dsw-alias-state-error-primary,#ec1313)}.AjjPzG_empty,.AjjPzG_error{color:var(--dsw-alias-label-secondary,#61666b);margin:12px;font-size:13px}.AjjPzG_error{color:var(--dsw-alias-state-error-primary,#ec1313)}@media (prefers-reduced-motion:reduce){.AjjPzG_row,.AjjPzG_name,.AjjPzG_action,.AjjPzG_danger{transition:none}}";
		const tagId$10 = "dsh-web-enhanced/ScmPane.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$10) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId$10;
			tag.textContent = css$10;
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
				selectTab("explorer");
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
		const css$9 = ".ifAxLG_view{flex-direction:column;height:100%;min-height:0;display:flex;overflow:hidden}.ifAxLG_tabs{border-bottom:1px solid var(--dsw-alias-border-l1,#0000000a);flex:none;gap:4px;padding:6px 12px;display:flex}.ifAxLG_tab{color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer;background:0 0;border:none;border-radius:8px;padding:4px 10px;font-size:13px;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s}.ifAxLG_tab:hover{background:var(--dsw-alias-interactive-bg-hover,#2631480f);color:var(--dsw-alias-label-primary,#0f1115)}.ifAxLG_tab:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}.ifAxLG_tab[data-active]{background:var(--dsw-alias-interactive-bg-active,#2631481a);color:var(--dsw-alias-label-primary,#0f1115)}.ifAxLG_explorer{grid-template-columns:minmax(200px,280px) minmax(0,1fr);height:100%;min-height:0;display:grid;overflow:hidden}.ifAxLG_explorerCollapsed{grid-template-columns:24px minmax(0,1fr);height:100%;min-height:0;display:grid;overflow:hidden}.ifAxLG_sidebar{border-right:1px solid var(--dsw-alias-border-l2,#0000001a);background:var(--dsw-alias-bg-layer-1,transparent);flex-direction:column;min-width:0;min-height:0;display:flex;position:relative;overflow:hidden}.ifAxLG_expand{border:1px solid var(--dsw-alias-border-l2,#0000001a);background:var(--dsw-alias-bg-layer-2,transparent);width:20px;height:20px;color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer;border-radius:8px;justify-content:center;place-self:flex-start start;align-items:center;margin:8px 0 0 2px;padding:0;font-size:14px;line-height:1;transition:background-color .14s,color .14s;display:flex}.ifAxLG_expand:hover{background:var(--dsw-alias-interactive-bg-hover,#2631480f);color:var(--dsw-alias-label-primary,#0f1115)}.ifAxLG_expand:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4176e6);outline-offset:1px}.ifAxLG_body{min-height:0;padding-bottom:calc(var(--dsh-composer-height,152px) + 16px);scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l3,#0000001f) transparent;flex-direction:column;flex:1;display:flex;overflow:auto}.ifAxLG_module{border:2px solid var(--dsw-alias-border-l3,#0000001f);background:var(--dsw-alias-bg-layer-1,transparent);scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l3,#0000001f) transparent;border-radius:12px;flex-direction:column;flex:1;min-width:0;min-height:0;margin:12px;padding:12px;display:flex;overflow:auto}.ifAxLG_module>*{flex:1;min-width:0;min-height:0}@media (prefers-reduced-motion:reduce){.ifAxLG_tab,.ifAxLG_expand{transition:none}}.ifAxLG_empty{color:var(--dsw-alias-label-secondary,#61666b);text-align:center;margin:24px auto;font-size:13px}";
		const tagId$9 = "dsh-web-enhanced/WorkspaceView.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$9) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId$9;
			tag.textContent = css$9;
			document.head.appendChild(tag);
		}
		var WorkspaceView_module_css_default = {
			"body": "ifAxLG_body",
			"empty": "ifAxLG_empty",
			"expand": "ifAxLG_expand",
			"explorer": "ifAxLG_explorer",
			"explorerCollapsed": "ifAxLG_explorerCollapsed",
			"module": "ifAxLG_module",
			"sidebar": "ifAxLG_sidebar",
			"tab": "ifAxLG_tab",
			"tabs": "ifAxLG_tabs",
			"view": "ifAxLG_view"
		};
		//#endregion
		//#region lib/types/client/panel/WorkspaceView.js
		/**
		* Workspace view: the explorer (VSCode-style file tree sidebar plus preview
		* of the open file), SCM, the task board, and the git graph for the session's
		* project, registered as one tab in the conversation's view ring beside Chat
		* and Trajectory.
		*
		* It lives in `conversation.view` rather than floating over the frame. The
		* view ring renders one entry at a time at full column width, so this surface
		* owns no geometry of its own — no docking, no collapse. The one geometry it
		* does own is the explorer's sidebar width split, which lives entirely inside
		* the tab.
		* @module dsh-web-enhanced/src/client/panel/WorkspaceView
		*/
		/** Tabs in display order with their dictionary keys. */
		const TABS = [
			{
				tab: "explorer",
				key: "panel.tab.explorer"
			},
			{
				tab: "scm",
				key: "panel.tab.scm"
			},
			{
				tab: "board",
				key: "panel.tab.board"
			},
			{
				tab: "graph",
				key: "panel.tab.graph"
			}
		];
		/** The workspace view. */
		function WorkspaceView(props) {
			const { sessionId, usePanel, useWorkspaces, selectTab, clearTabs, setSidebarCollapsed, t } = props;
			const workspaces = useWorkspaces((state) => state);
			const workspaceId = workspaceOfSessionId(sessionId, workspaces)?.workspaceId;
			const tab = usePanel((state) => state.tab);
			const sidebarCollapsed = usePanel((state) => state.sidebarCollapsed);
			const lastWorkspace = (0, react.useRef)(workspaceId);
			(0, react.useEffect)(() => {
				if (lastWorkspace.current === workspaceId) return;
				lastWorkspace.current = workspaceId;
				releaseAllObjectUrls();
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
				"data-conversation-composer-overlay": "",
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
						tab === "explorer" && (0, react_jsx_runtime.jsx)("div", {
							className: WorkspaceView_module_css_default.module,
							children: (0, react_jsx_runtime.jsxs)("div", {
								className: sidebarCollapsed ? WorkspaceView_module_css_default.explorerCollapsed : WorkspaceView_module_css_default.explorer,
								"data-testid": "workspace-explorer",
								"data-sidebar": sidebarCollapsed ? "collapsed" : "expanded",
								children: [sidebarCollapsed ? (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: WorkspaceView_module_css_default.expand,
									"aria-label": t("files.expand"),
									"data-testid": "workspace-sidebar-expand",
									title: t("files.expand"),
									onClick: () => {
										setSidebarCollapsed(false);
									},
									children: (0, react_jsx_runtime.jsx)("span", {
										"aria-hidden": "true",
										children: "›"
									})
								}) : (0, react_jsx_runtime.jsx)("aside", {
									className: WorkspaceView_module_css_default.sidebar,
									children: (0, react_jsx_runtime.jsx)(FileTree, {
										...props,
										workspaceId: String(workspaceId),
										onCollapse: () => {
											setSidebarCollapsed(true);
										},
										collapseLabel: t("files.collapse")
									})
								}), (0, react_jsx_runtime.jsx)(PreviewPane, {
									...props,
									workspaceId: String(workspaceId)
								})]
							})
						}),
						tab === "scm" && (0, react_jsx_runtime.jsx)("div", {
							className: WorkspaceView_module_css_default.module,
							children: (0, react_jsx_runtime.jsx)(ScmPane, {
								...props,
								workspaceId: String(workspaceId)
							})
						}),
						tab === "board" && (0, react_jsx_runtime.jsx)("div", {
							className: WorkspaceView_module_css_default.module,
							children: (0, react_jsx_runtime.jsx)(BoardPanel, {
								remote: props.remote,
								workspaces: workspaces.items,
								openSession: props.openSession,
								t
							})
						}),
						tab === "graph" && (0, react_jsx_runtime.jsx)("div", {
							className: WorkspaceView_module_css_default.module,
							children: (0, react_jsx_runtime.jsx)(GraphPanel, {
								workspaceId: String(workspaceId),
								remote: props.remote,
								t
							})
						})
					]
				})]
			});
		}
		//#endregion
		//#region lib/types/client/skins/background.js
		/**
		* Background image budgeting and compression.
		*
		* The picker's working product is a base64 data URL (4 UTF-16 units of text
		* per 3 image bytes) that becomes the persisted Blob, so the invariant that
		* matters is the ENCODED data URL length, not the source file size: the
		* budget caps the transient encode/decode work. A picture within budget
		* keeps its original bytes (GIF animation and SVG vectors survive); an
		* oversized one is re-encoded through a canvas on a descending scale/quality
		* plan until the encoded form fits.
		* @module dsh-web-enhanced/src/client/skins/background
		*/
		/** Budget for the encoded data URL, UTF-16 units (caps transient encode work). */
		const BACKGROUND_MAX_CHARS = 45e5;
		/** Preferred encode steps: edge shrinks before quality does, coarsest last. */
		const STEPS = [
			{
				maxEdge: 2560,
				quality: .85
			},
			{
				maxEdge: 2560,
				quality: .72
			},
			{
				maxEdge: 1920,
				quality: .85
			},
			{
				maxEdge: 1920,
				quality: .72
			},
			{
				maxEdge: 1536,
				quality: .8
			},
			{
				maxEdge: 1280,
				quality: .75
			},
			{
				maxEdge: 1024,
				quality: .72
			},
			{
				maxEdge: 800,
				quality: .7
			}
		];
		/**
		* The compression plan in application order. Every step stays at or above
		* {@link MIN_EDGE}; callers stop at the first step whose encoding fits.
		* @returns fresh step list (callers may mutate their copy).
		*/
		function compressionPlan() {
			return STEPS.map((step) => ({ ...step }));
		}
		/**
		* Budget test for a stored value.
		* @param dataUrl - the encoded image.
		* @returns whether it fits within {@link BACKGROUND_MAX_CHARS}.
		*/
		function fitsBudget(dataUrl) {
			return dataUrl.length <= BACKGROUND_MAX_CHARS;
		}
		/** Decode through createImageBitmap, falling back to an <img> for SVG. */
		async function decode(file) {
			try {
				const bitmap = await createImageBitmap(file);
				return {
					width: bitmap.width,
					height: bitmap.height,
					draw: (context, width, height) => {
						context.drawImage(bitmap, 0, 0, width, height);
					},
					release: () => {
						bitmap.close();
					}
				};
			} catch {
				const url = URL.createObjectURL(file);
				try {
					const image = new Image();
					image.src = url;
					await image.decode();
					return {
						width: image.naturalWidth || 1024,
						height: image.naturalHeight || 1024,
						draw: (context, width, height) => {
							context.drawImage(image, 0, 0, width, height);
						},
						release: () => {
							URL.revokeObjectURL(url);
						}
					};
				} catch (error) {
					URL.revokeObjectURL(url);
					throw error;
				}
			}
		}
		/**
		* Re-encode one decoded image at a step's scale and quality.
		* @returns the encoded data URL, or undefined when the canvas is unavailable.
		*/
		function encode(image, step) {
			if (typeof document === "undefined") return void 0;
			const scale = Math.min(1, step.maxEdge / Math.max(image.width, image.height));
			const canvas = document.createElement("canvas");
			canvas.width = Math.max(1, Math.round(image.width * scale));
			canvas.height = Math.max(1, Math.round(image.height * scale));
			const context = canvas.getContext("2d");
			if (context === null) return void 0;
			image.draw(context, canvas.width, canvas.height);
			return canvas.toDataURL("image/webp", step.quality);
		}
		/**
		* Compress a picked image until its encoded form fits the storage budget.
		* The original bytes win outright when they already fit.
		* @param file - the picked image file.
		* @returns the best-fitting data URL.
		* @throws when no step fits (or decoding/encoding is impossible).
		*/
		async function encodeBackground(file) {
			const decoded = await decode(file);
			try {
				for (const step of compressionPlan()) {
					const encoded = encode(decoded, step);
					if (encoded !== void 0 && fitsBudget(encoded)) return encoded;
				}
			} finally {
				decoded.release();
			}
			throw new Error("background image stays over the storage budget after compression");
		}
		//#endregion
		//#region \0dsh-css:D:\Documents\Dev-Repo\deepseek-harness\dsh-plugins\dsh-web-enhanced\src\client\skins\SkinPanel.module.css.mjs
		const css$8 = ".eI5iUW_root{flex-direction:column;gap:16px;display:flex}.eI5iUW_hint{color:var(--dsw-alias-label-secondary,#60666f);margin:0;font-size:13px;line-height:1.6}.eI5iUW_unavailable{color:var(--dsw-alias-label-tertiary,#7a8089);margin:0;font-size:13px}.eI5iUW_grid{grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px;display:grid}.eI5iUW_card,.eI5iUW_cardActive{text-align:left;border:1px solid var(--dsw-alias-border-l2,#0000001a);background:var(--dsw-alias-bg-layer-1,#fff);color:var(--dsw-alias-label-primary,inherit);cursor:pointer;border-radius:12px;flex-direction:column;gap:10px;padding:12px;transition:background-color .14s,border-color .14s,box-shadow .14s,transform .14s;display:flex}.eI5iUW_card:hover,.eI5iUW_cardActive:hover{background:var(--dsw-alias-interactive-bg-hover,#0000000a)}.eI5iUW_card:active,.eI5iUW_cardActive:active{background:var(--dsw-alias-interactive-bg-active,#00000014)}.eI5iUW_card:focus-visible,.eI5iUW_cardActive:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4d6bfe);outline-offset:2px}.eI5iUW_cardActive{border-color:var(--dsw-alias-state-business-primary,#4d6bfe);box-shadow:0 1px 2px #00000014,0 8px 24px #0000001f}.eI5iUW_swatch{border-radius:8px;height:64px;display:flex;position:relative;overflow:hidden}.eI5iUW_swatchHalf{flex:1;position:relative}.eI5iUW_chipLayer{border-radius:4px;width:28px;height:12px;position:absolute;top:10px;left:10px}.eI5iUW_chipAccent{border-radius:999px;width:18px;height:18px;position:absolute;top:28px;left:10px}.eI5iUW_markerLight,.eI5iUW_markerDark{background:var(--dsw-alias-state-business-primary,#4d6bfe);border-radius:999px;width:24px;height:3px;transition:left .14s;position:absolute;bottom:6px}.eI5iUW_markerLight{left:calc(25% - 12px)}.eI5iUW_markerDark{left:calc(75% - 12px)}.eI5iUW_cardBody{flex-direction:column;gap:4px;display:flex}.eI5iUW_cardTitle{font-size:13px;font-weight:600}.eI5iUW_cardDesc{color:var(--dsw-alias-label-tertiary,#7a8089);font-size:12px;line-height:1.5}@media (prefers-reduced-motion:reduce){.eI5iUW_card,.eI5iUW_cardActive,.eI5iUW_markerLight,.eI5iUW_markerDark{transition:none}}.eI5iUW_bgSection{border:1px solid var(--dsw-alias-border-l2,#0000001a);background:var(--dsw-alias-bg-layer-1,transparent);border-radius:12px;flex-direction:column;gap:8px;padding:14px;display:flex}.eI5iUW_bgTitle{margin:0;font-size:13px;font-weight:600}.eI5iUW_bgHint{color:var(--dsw-alias-label-tertiary,#7a8089);margin:0;font-size:12px;line-height:1.6}.eI5iUW_bgRow{flex-wrap:wrap;align-items:center;gap:12px;display:flex}.eI5iUW_bgThumb{object-fit:cover;border:1px solid var(--dsw-alias-border-l2,#0000001a);width:96px;height:60px;box-shadow:inset 0 0 0 999px color-mix(in srgb, var(--dsw-alias-bg-base,#fff) 84%, transparent);border-radius:8px}.eI5iUW_bgEmpty{border:1px dashed var(--dsw-alias-border-l3,#00000029);width:96px;height:60px;color:var(--dsw-alias-label-tertiary,#7a8089);border-radius:8px;justify-content:center;align-items:center;font-size:12px;display:inline-flex}.eI5iUW_bgActions{align-items:center;gap:8px;display:flex}.eI5iUW_bgPick{border:1px solid var(--dsw-alias-border-l2,#0000001a);color:var(--dsw-alias-label-primary,inherit);cursor:pointer;background:0 0;border-radius:8px;align-items:center;padding:6px 12px;font-size:12px;font-weight:500;transition:background-color .14s,border-color .14s,color .14s;display:inline-flex;position:relative}.eI5iUW_bgPick:hover{background:var(--dsw-alias-interactive-bg-hover,#0000000a)}.eI5iUW_bgPick input{clip:rect(0 0 0 0);white-space:nowrap;width:1px;height:1px;position:absolute;overflow:hidden}.eI5iUW_bgPick:focus-within{outline:2px solid var(--dsw-alias-state-business-primary,#4d6bfe);outline-offset:2px}.eI5iUW_bgClear{border:1px solid var(--dsw-alias-border-l2,#0000001a);color:var(--dsw-alias-state-error-primary,#ec1313);cursor:pointer;background:0 0;border-radius:8px;padding:6px 12px;font-size:12px;font-weight:500;transition:background-color .14s,border-color .14s,color .14s}.eI5iUW_bgClear:hover{background:var(--dsw-alias-interactive-bg-hover-danger,#ec13130f)}.eI5iUW_bgClear:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4d6bfe);outline-offset:2px}.eI5iUW_bgError{color:var(--dsw-alias-state-error-primary,#ec1313);margin:0;font-size:12px}.eI5iUW_bgNote{color:var(--dsw-alias-label-tertiary,#7a8089);margin:0;font-size:12px}";
		const tagId$8 = "dsh-web-enhanced/SkinPanel.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$8) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId$8;
			tag.textContent = css$8;
			document.head.appendChild(tag);
		}
		var SkinPanel_module_css_default = {
			"bgActions": "eI5iUW_bgActions",
			"bgClear": "eI5iUW_bgClear",
			"bgEmpty": "eI5iUW_bgEmpty",
			"bgError": "eI5iUW_bgError",
			"bgHint": "eI5iUW_bgHint",
			"bgNote": "eI5iUW_bgNote",
			"bgPick": "eI5iUW_bgPick",
			"bgRow": "eI5iUW_bgRow",
			"bgSection": "eI5iUW_bgSection",
			"bgThumb": "eI5iUW_bgThumb",
			"bgTitle": "eI5iUW_bgTitle",
			"card": "eI5iUW_card",
			"cardActive": "eI5iUW_cardActive",
			"cardBody": "eI5iUW_cardBody",
			"cardDesc": "eI5iUW_cardDesc",
			"cardTitle": "eI5iUW_cardTitle",
			"chipAccent": "eI5iUW_chipAccent",
			"chipLayer": "eI5iUW_chipLayer",
			"grid": "eI5iUW_grid",
			"hint": "eI5iUW_hint",
			"markerDark": "eI5iUW_markerDark",
			"markerLight": "eI5iUW_markerLight",
			"root": "eI5iUW_root",
			"swatch": "eI5iUW_swatch",
			"swatchHalf": "eI5iUW_swatchHalf",
			"unavailable": "eI5iUW_unavailable"
		};
		//#endregion
		//#region lib/types/client/skins/SkinPanel.js
		/**
		* The Settings page's Skins tab: one card per catalog skin with a dual-mode
		* swatch preview (light and dark halves side by side — the halves are the
		* literal palette of the skin, so they do not ride the alias tokens), plus a
		* custom background image section. Clicking a card applies the skin
		* immediately through {@link SkinFace}; the swatch's active half follows the
		* resolved Appearance scheme.
		* @module dsh-web-enhanced/src/client/skins/SkinPanel
		*/
		/** Accepted background image formats (picker filter + validation). */
		const BACKGROUND_ACCEPT = ".png,.jpg,.jpeg,.webp,.gif,.avif,.bmp,.ico,.svg,image/*";
		/** The skins tab body. */
		function SkinPanel({ skin, t }) {
			const [current, setCurrent] = (0, react.useState)(skin.current);
			const [dark, setDark] = (0, react.useState)(skin.dark);
			const [background, setBackground] = (0, react.useState)(skin.background);
			const [backgroundError, setBackgroundError] = (0, react.useState)(null);
			const [backgroundNote, setBackgroundNote] = (0, react.useState)(null);
			(0, react.useEffect)(() => skin.subscribe(setDark), [skin]);
			const applyBackground = (dataUrl) => {
				skin.setBackground(dataUrl);
				setBackground(dataUrl);
			};
			const onBackgroundPicked = (file) => {
				if (file === void 0) return;
				if (!file.type.startsWith("image/") && !/\.(png|jpe?g|webp|gif|avif|bmp|ico|svg)$/iu.test(file.name)) {
					setBackgroundError(t("skins.bg.badType"));
					return;
				}
				const reader = new FileReader();
				reader.onload = () => {
					const original = typeof reader.result === "string" ? reader.result : "";
					if (original === "") {
						setBackgroundError(t("skins.bg.badType"));
						return;
					}
					if (fitsBudget(original)) {
						setBackgroundError(null);
						setBackgroundNote(null);
						applyBackground(original);
						return;
					}
					encodeBackground(file).then((encoded) => {
						setBackgroundError(null);
						setBackgroundNote(t("skins.bg.compressed"));
						applyBackground(encoded);
					}, () => {
						setBackgroundNote(null);
						setBackgroundError(t("skins.bg.tooLarge"));
					});
				};
				reader.onerror = () => {
					setBackgroundError(t("skins.bg.badType"));
				};
				reader.readAsDataURL(file);
			};
			const clearBackground = () => {
				skin.setBackground("");
				setBackground("");
				setBackgroundError(null);
			};
			if (!skin.available) return (0, react_jsx_runtime.jsx)("p", {
				className: SkinPanel_module_css_default.unavailable,
				children: t("skins.unavailable")
			});
			return (0, react_jsx_runtime.jsxs)("div", {
				className: SkinPanel_module_css_default.root,
				children: [
					(0, react_jsx_runtime.jsx)("p", {
						className: SkinPanel_module_css_default.hint,
						children: t("skins.hint")
					}),
					(0, react_jsx_runtime.jsx)("div", {
						className: SkinPanel_module_css_default.grid,
						role: "radiogroup",
						"aria-label": t("skins.title"),
						children: SKINS.map((entry) => {
							const active = entry.id === current;
							return (0, react_jsx_runtime.jsxs)("button", {
								type: "button",
								role: "radio",
								"aria-checked": active,
								className: active ? SkinPanel_module_css_default.cardActive : SkinPanel_module_css_default.card,
								"data-testid": `skin-${entry.id}`,
								onClick: () => {
									setCurrent(skin.apply(entry.id));
								},
								children: [(0, react_jsx_runtime.jsxs)("span", {
									className: SkinPanel_module_css_default.swatch,
									children: [
										(0, react_jsx_runtime.jsxs)("span", {
											className: SkinPanel_module_css_default.swatchHalf,
											style: { background: entry.lightSwatch[0] },
											children: [(0, react_jsx_runtime.jsx)("span", {
												className: SkinPanel_module_css_default.chipLayer,
												style: { background: entry.lightSwatch[1] }
											}), (0, react_jsx_runtime.jsx)("span", {
												className: SkinPanel_module_css_default.chipAccent,
												style: { background: entry.lightSwatch[2] }
											})]
										}),
										(0, react_jsx_runtime.jsxs)("span", {
											className: SkinPanel_module_css_default.swatchHalf,
											style: { background: entry.darkSwatch[0] },
											children: [(0, react_jsx_runtime.jsx)("span", {
												className: SkinPanel_module_css_default.chipLayer,
												style: { background: entry.darkSwatch[1] }
											}), (0, react_jsx_runtime.jsx)("span", {
												className: SkinPanel_module_css_default.chipAccent,
												style: { background: entry.darkSwatch[2] }
											})]
										}),
										(0, react_jsx_runtime.jsx)("span", {
											className: dark ? SkinPanel_module_css_default.markerDark : SkinPanel_module_css_default.markerLight,
											"aria-hidden": "true"
										})
									]
								}), (0, react_jsx_runtime.jsxs)("span", {
									className: SkinPanel_module_css_default.cardBody,
									children: [(0, react_jsx_runtime.jsx)("span", {
										className: SkinPanel_module_css_default.cardTitle,
										children: t(entry.nameKey)
									}), (0, react_jsx_runtime.jsx)("span", {
										className: SkinPanel_module_css_default.cardDesc,
										children: t(entry.descKey)
									})]
								})]
							}, entry.id);
						})
					}),
					(0, react_jsx_runtime.jsxs)("section", {
						className: SkinPanel_module_css_default.bgSection,
						children: [
							(0, react_jsx_runtime.jsx)("h4", {
								className: SkinPanel_module_css_default.bgTitle,
								children: t("skins.bg.title")
							}),
							(0, react_jsx_runtime.jsx)("p", {
								className: SkinPanel_module_css_default.bgHint,
								children: t("skins.bg.hint")
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: SkinPanel_module_css_default.bgRow,
								children: [background !== "" ? (0, react_jsx_runtime.jsx)("img", {
									className: SkinPanel_module_css_default.bgThumb,
									src: background,
									alt: t("skins.bg.title"),
									"data-testid": "skin-bg-thumb"
								}) : (0, react_jsx_runtime.jsx)("span", {
									className: SkinPanel_module_css_default.bgEmpty,
									"data-testid": "skin-bg-empty",
									children: t("skins.bg.none")
								}), (0, react_jsx_runtime.jsxs)("div", {
									className: SkinPanel_module_css_default.bgActions,
									children: [(0, react_jsx_runtime.jsxs)("label", {
										className: SkinPanel_module_css_default.bgPick,
										children: [t("skins.bg.pick"), (0, react_jsx_runtime.jsx)("input", {
											type: "file",
											accept: BACKGROUND_ACCEPT,
											"data-testid": "skin-bg-input",
											onChange: (event) => {
												onBackgroundPicked(event.target.files?.[0]);
												event.target.value = "";
											}
										})]
									}), background !== "" && (0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: SkinPanel_module_css_default.bgClear,
										"data-testid": "skin-bg-clear",
										onClick: clearBackground,
										children: t("skins.bg.clear")
									})]
								})]
							}),
							backgroundError !== null && (0, react_jsx_runtime.jsx)("p", {
								className: SkinPanel_module_css_default.bgError,
								"data-testid": "skin-bg-error",
								children: backgroundError
							}),
							backgroundError === null && backgroundNote !== null && (0, react_jsx_runtime.jsx)("p", {
								className: SkinPanel_module_css_default.bgNote,
								"data-testid": "skin-bg-note",
								children: backgroundNote
							})
						]
					})
				]
			});
		}
		//#endregion
		//#region lib/types/client/meta.js
		/**
		* Build-time metadata shown in the Settings → About tab.
		*
		* `WEB_ENHANCED_VERSION` must be bumped together with `package.json`'s
		* `version` (the client bundle cannot read the package manifest at runtime).
		* @module dsh-web-enhanced/src/client/meta
		*/
		/** Plugin version rendered in the About tab. */
		const WEB_ENHANCED_VERSION = "0.19.0";
		/** Public repository, rendered as the project-home link. */
		const WEB_ENHANCED_REPOSITORY = "https://github.com/banlanzs/dsh-web-enhanced";
		//#endregion
		//#region \0dsh-css:D:\Documents\Dev-Repo\deepseek-harness\dsh-plugins\dsh-web-enhanced\src\client\settings\AboutPanel.module.css.mjs
		const css$7 = ".fhdfJW_root{flex-direction:column;gap:16px;max-width:640px;min-height:0;display:flex}.fhdfJW_header{flex-direction:column;gap:6px;display:flex}.fhdfJW_title{color:var(--dsw-alias-label-primary,#0f1115);margin:0;font-size:18px;font-weight:700}.fhdfJW_meta{color:var(--dsw-alias-label-secondary,#61666b);flex-wrap:wrap;align-items:center;gap:8px;font-size:13px;display:flex}.fhdfJW_version{border:1px solid var(--dsw-alias-border-l2,#0000001a);background:var(--dsw-alias-interactive-bg-hover,#2631480f);border-radius:999px;padding:1px 8px;font-family:ui-monospace,Cascadia Code,Consolas,monospace;font-size:12px}.fhdfJW_license{color:var(--dsw-alias-label-tertiary,#81858c);font-size:12px}.fhdfJW_dot{color:var(--dsw-alias-label-tertiary,#81858c)}.fhdfJW_description,.fhdfJW_note{max-width:62ch;color:var(--dsw-alias-label-secondary,#61666b);margin:0;font-size:13px;line-height:1.7}.fhdfJW_note{white-space:pre-wrap}.fhdfJW_section{border:1px solid var(--dsw-alias-border-l2,#0000001a);border-radius:12px;flex-direction:column;gap:8px;padding:14px;display:flex}.fhdfJW_sectionTitle{color:var(--dsw-alias-label-primary,#0f1115);margin:0;font-size:14px;font-weight:600}.fhdfJW_features{flex-wrap:wrap;gap:8px;margin:0;padding:0;list-style:none;display:flex}.fhdfJW_feature{border:1px solid var(--dsw-alias-border-l2,#0000001a);background:var(--dsw-alias-interactive-bg-hover,#2631480f);border-radius:999px;padding:3px 12px;font-size:12px;line-height:1.5}.fhdfJW_footer{align-items:center;gap:10px;display:flex}.fhdfJW_link{color:var(--dsw-alias-state-business-primary,#4176e6);font-size:13px;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s}.fhdfJW_link:hover{color:var(--dsw-alias-state-business-primary,#4176e6);text-decoration:underline}.fhdfJW_link:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}@media (prefers-reduced-motion:reduce){.fhdfJW_link{transition:none}}";
		const tagId$7 = "dsh-web-enhanced/AboutPanel.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$7) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId$7;
			tag.textContent = css$7;
			document.head.appendChild(tag);
		}
		var AboutPanel_module_css_default = {
			"description": "fhdfJW_description",
			"dot": "fhdfJW_dot",
			"feature": "fhdfJW_feature",
			"features": "fhdfJW_features",
			"footer": "fhdfJW_footer",
			"header": "fhdfJW_header",
			"license": "fhdfJW_license",
			"link": "fhdfJW_link",
			"meta": "fhdfJW_meta",
			"note": "fhdfJW_note",
			"root": "fhdfJW_root",
			"section": "fhdfJW_section",
			"sectionTitle": "fhdfJW_sectionTitle",
			"title": "fhdfJW_title",
			"version": "fhdfJW_version"
		};
		//#endregion
		//#region lib/types/client/settings/AboutPanel.js
		/** Feature list rendered as chips (kept in display order here). */
		const FEATURE_KEYS = [
			"about.feature.board",
			"about.feature.graph",
			"about.feature.workspace",
			"about.feature.mention",
			"about.feature.balance",
			"about.feature.vision",
			"about.feature.plugins"
		];
		/** The About tab. */
		function AboutPanel({ t }) {
			return (0, react_jsx_runtime.jsxs)("div", {
				className: AboutPanel_module_css_default.root,
				children: [
					(0, react_jsx_runtime.jsxs)("header", {
						className: AboutPanel_module_css_default.header,
						children: [(0, react_jsx_runtime.jsx)("h3", {
							className: AboutPanel_module_css_default.title,
							children: t("about.title")
						}), (0, react_jsx_runtime.jsxs)("div", {
							className: AboutPanel_module_css_default.meta,
							children: [
								(0, react_jsx_runtime.jsx)("span", {
									className: AboutPanel_module_css_default.version,
									children: t("about.version", { version: WEB_ENHANCED_VERSION })
								}),
								(0, react_jsx_runtime.jsx)("span", {
									className: AboutPanel_module_css_default.dot,
									"aria-hidden": "true",
									children: "·"
								}),
								(0, react_jsx_runtime.jsx)("span", {
									className: AboutPanel_module_css_default.license,
									children: t("about.license")
								})
							]
						})]
					}),
					(0, react_jsx_runtime.jsx)("p", {
						className: AboutPanel_module_css_default.description,
						children: t("about.description")
					}),
					(0, react_jsx_runtime.jsxs)("section", {
						className: AboutPanel_module_css_default.section,
						children: [(0, react_jsx_runtime.jsx)("h4", {
							className: AboutPanel_module_css_default.sectionTitle,
							children: t("about.featuresTitle")
						}), (0, react_jsx_runtime.jsx)("ul", {
							className: AboutPanel_module_css_default.features,
							children: FEATURE_KEYS.map((key) => (0, react_jsx_runtime.jsx)("li", {
								className: AboutPanel_module_css_default.feature,
								children: t(key)
							}, key))
						})]
					}),
					(0, react_jsx_runtime.jsxs)("section", {
						className: AboutPanel_module_css_default.section,
						children: [(0, react_jsx_runtime.jsx)("h4", {
							className: AboutPanel_module_css_default.sectionTitle,
							children: t("about.configTitle")
						}), (0, react_jsx_runtime.jsx)("p", {
							className: AboutPanel_module_css_default.note,
							children: t("about.configHint")
						})]
					}),
					(0, react_jsx_runtime.jsx)("footer", {
						className: AboutPanel_module_css_default.footer,
						children: (0, react_jsx_runtime.jsx)("a", {
							className: AboutPanel_module_css_default.link,
							href: WEB_ENHANCED_REPOSITORY,
							target: "_blank",
							rel: "noreferrer",
							children: t("about.repo")
						})
					})
				]
			});
		}
		//#endregion
		//#region \0dsh-css:D:\Documents\Dev-Repo\deepseek-harness\dsh-plugins\dsh-web-enhanced\src\client\settings\ModelRetryPanel.module.css.mjs
		const css$6 = ".Fgw-oG_panel{flex-direction:column;gap:10px;max-width:560px;display:flex}.Fgw-oG_title,.Fgw-oG_subtitle{margin:0;font-size:14px;font-weight:600}.Fgw-oG_subtitle{color:var(--dsw-alias-label-secondary,#61666b);margin-top:8px;font-size:13px}.Fgw-oG_hint,.Fgw-oG_note{color:var(--dsw-alias-label-tertiary,#81858c);margin:0;font-size:12px;line-height:1.6}.Fgw-oG_facts{grid-template-columns:max-content 1fr;gap:2px 10px;margin:0;font-size:13px;display:grid}.Fgw-oG_facts dt{color:var(--dsw-alias-label-tertiary,#81858c)}.Fgw-oG_facts dd{font-variant-numeric:tabular-nums;margin:0}.Fgw-oG_field{flex-direction:column;gap:3px;display:flex}.Fgw-oG_label{color:var(--dsw-alias-label-secondary,#61666b);font-size:12px}.Fgw-oG_input{border:1px solid var(--dsw-alias-border-l2,#0000001a);width:120px;color:inherit;background:0 0;border-radius:8px;padding:4px 8px;font-family:inherit;font-size:13px}.Fgw-oG_input:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}.Fgw-oG_save{border:1px solid var(--dsw-alias-border-l2,#0000001a);color:inherit;cursor:pointer;background:0 0;border-radius:8px;align-self:flex-start;padding:6px 12px;font-size:13px;font-weight:500;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s}.Fgw-oG_save:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#2631480f)}.Fgw-oG_save:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}.Fgw-oG_save:disabled{cursor:default;opacity:.4}.Fgw-oG_saved{color:var(--dsw-alias-state-success-primary,#22c55e);margin:0;font-size:12px}.Fgw-oG_error{color:var(--dsw-alias-state-error-primary,#ec1313);margin:0;font-size:12px}@media (prefers-reduced-motion:reduce){.Fgw-oG_input,.Fgw-oG_save{transition:none}}";
		const tagId$6 = "dsh-web-enhanced/ModelRetryPanel.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$6) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId$6;
			tag.textContent = css$6;
			document.head.appendChild(tag);
		}
		var ModelRetryPanel_module_css_default = {
			"error": "Fgw-oG_error",
			"facts": "Fgw-oG_facts",
			"field": "Fgw-oG_field",
			"hint": "Fgw-oG_hint",
			"input": "Fgw-oG_input",
			"label": "Fgw-oG_label",
			"note": "Fgw-oG_note",
			"panel": "Fgw-oG_panel",
			"save": "Fgw-oG_save",
			"saved": "Fgw-oG_saved",
			"subtitle": "Fgw-oG_subtitle",
			"title": "Fgw-oG_title"
		};
		//#endregion
		//#region lib/types/client/settings/ModelRetryPanel.js
		/**
		* Model-request retry settings: edits the DeepSeek provider's bounded retry
		* count through the host settings service. The value lives in the
		* `llm-deepseek` namespace (owned by the provider plugin), so saving here is
		* a settings write, not a web-enhanced config — and the provider re-registers
		* its route immediately, applying the new policy to the next request.
		* @module dsh-web-enhanced/src/client/settings/ModelRetryPanel
		*/
		/** The DeepSeek retry settings panel. */
		function ModelRetryPanel({ remote, t }) {
			const [state, setState] = (0, react.useState)({ phase: "loading" });
			const [saving, setSaving] = (0, react.useState)(false);
			const [saved, setSaved] = (0, react.useState)(false);
			const [saveError, setSaveError] = (0, react.useState)(null);
			const live = (0, react.useRef)(true);
			(0, react.useEffect)(() => () => {
				live.current = false;
			}, []);
			(0, react.useEffect)(() => {
				setState({ phase: "loading" });
				(async () => {
					const result = await remote.modelRetryGet();
					if (!live.current) return;
					setState("error" in result ? {
						phase: "error",
						message: result.error.message
					} : {
						phase: "ready",
						config: result.config,
						draft: result.config.maxRetries === null ? "" : String(result.config.maxRetries)
					});
				})();
			}, [remote]);
			const save = (0, react.useCallback)(async () => {
				if (state.phase !== "ready") return;
				const maxRetries = Number(state.draft);
				if (!Number.isSafeInteger(maxRetries) || maxRetries < 0) return;
				setSaving(true);
				setSaved(false);
				setSaveError(null);
				const result = await remote.modelRetrySet({
					maxRetries,
					...state.config.revision === null ? {} : { expectedRevision: state.config.revision }
				});
				if (!live.current) return;
				setSaving(false);
				if ("error" in result) {
					setSaveError(result.error.message);
					return;
				}
				setState({
					phase: "ready",
					config: {
						...state.config,
						mode: "normal",
						maxRetries,
						revision: result.revision
					},
					draft: String(maxRetries)
				});
				setSaved(true);
			}, [remote, state]);
			if (state.phase === "loading") return (0, react_jsx_runtime.jsx)("p", {
				className: ModelRetryPanel_module_css_default.note,
				children: t("modelRetry.loading")
			});
			if (state.phase === "error") return (0, react_jsx_runtime.jsx)("p", {
				className: ModelRetryPanel_module_css_default.error,
				children: t("modelRetry.error", { message: state.message })
			});
			const valid = state.draft !== "" && Number.isSafeInteger(Number(state.draft)) && Number(state.draft) >= 0;
			const unchanged = state.config.maxRetries !== null && state.draft === String(state.config.maxRetries);
			return (0, react_jsx_runtime.jsxs)("section", {
				className: ModelRetryPanel_module_css_default.panel,
				"data-testid": "model-retry-panel",
				children: [
					(0, react_jsx_runtime.jsx)("h3", {
						className: ModelRetryPanel_module_css_default.title,
						children: t("modelRetry.title")
					}),
					(0, react_jsx_runtime.jsxs)("dl", {
						className: ModelRetryPanel_module_css_default.facts,
						children: [
							(0, react_jsx_runtime.jsx)("dt", { children: t("modelRetry.provider") }),
							(0, react_jsx_runtime.jsx)("dd", { children: t("modelRetry.providerName") }),
							(0, react_jsx_runtime.jsx)("dt", { children: t("modelRetry.current") }),
							(0, react_jsx_runtime.jsx)("dd", { children: state.config.maxRetries === null ? t("modelRetry.unlimited") : String(state.config.maxRetries) })
						]
					}),
					(0, react_jsx_runtime.jsx)("p", {
						className: ModelRetryPanel_module_css_default.hint,
						children: t("modelRetry.hint")
					}),
					(0, react_jsx_runtime.jsxs)("label", {
						className: ModelRetryPanel_module_css_default.field,
						children: [(0, react_jsx_runtime.jsx)("span", {
							className: ModelRetryPanel_module_css_default.label,
							children: t("modelRetry.maxLabel")
						}), (0, react_jsx_runtime.jsx)("input", {
							className: ModelRetryPanel_module_css_default.input,
							type: "number",
							min: 0,
							step: 1,
							value: state.draft,
							placeholder: t("modelRetry.placeholder"),
							"data-testid": "model-retry-input",
							onChange: (event) => {
								setSaved(false);
								setSaveError(null);
								setState({
									...state,
									draft: event.target.value
								});
							}
						})]
					}),
					!valid && state.draft !== "" && (0, react_jsx_runtime.jsx)("p", {
						className: ModelRetryPanel_module_css_default.error,
						children: t("modelRetry.invalid")
					}),
					(0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: ModelRetryPanel_module_css_default.save,
						disabled: saving || !valid || unchanged,
						"data-testid": "model-retry-save",
						onClick: () => {
							save();
						},
						children: t("modelRetry.save")
					}),
					saved && (0, react_jsx_runtime.jsx)("p", {
						className: ModelRetryPanel_module_css_default.saved,
						children: t("modelRetry.saved")
					}),
					saveError !== null && (0, react_jsx_runtime.jsx)("p", {
						className: ModelRetryPanel_module_css_default.error,
						children: t("modelRetry.saveError", { message: saveError })
					}),
					(0, react_jsx_runtime.jsx)("h4", {
						className: ModelRetryPanel_module_css_default.subtitle,
						children: t("modelRetry.backoffTitle")
					}),
					(0, react_jsx_runtime.jsxs)("dl", {
						className: ModelRetryPanel_module_css_default.facts,
						children: [
							(0, react_jsx_runtime.jsx)("dt", { children: t("modelRetry.initialDelay") }),
							(0, react_jsx_runtime.jsxs)("dd", { children: [state.config.initialDelayMs, "ms"] }),
							(0, react_jsx_runtime.jsx)("dt", { children: t("modelRetry.maxDelay") }),
							(0, react_jsx_runtime.jsxs)("dd", { children: [state.config.maxDelayMs, "ms"] }),
							(0, react_jsx_runtime.jsx)("dt", { children: t("modelRetry.jitter") }),
							(0, react_jsx_runtime.jsx)("dd", { children: state.config.jitterRatio })
						]
					})
				]
			});
		}
		//#endregion
		//#region \0dsh-css:D:\Documents\Dev-Repo\deepseek-harness\dsh-plugins\dsh-web-enhanced\src\client\settings\GeneralSettingsPanel.module.css.mjs
		const css$5 = ".m0E7ya_general{flex-direction:column;gap:10px;max-width:560px;display:flex}.m0E7ya_title{margin:0;font-size:15px;font-weight:600}.m0E7ya_hint{color:var(--dsw-alias-label-tertiary,#81858c);margin:0;font-size:12px;line-height:1.6}";
		const tagId$5 = "dsh-web-enhanced/GeneralSettingsPanel.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$5) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId$5;
			tag.textContent = css$5;
			document.head.appendChild(tag);
		}
		var GeneralSettingsPanel_module_css_default = {
			"general": "m0E7ya_general",
			"hint": "m0E7ya_hint",
			"title": "m0E7ya_title"
		};
		//#endregion
		//#region lib/types/client/settings/GeneralSettingsPanel.js
		/** General settings: currently the model-request retry policy. */
		function GeneralSettingsPanel({ remote, t }) {
			return (0, react_jsx_runtime.jsxs)("section", {
				className: GeneralSettingsPanel_module_css_default.general,
				"data-testid": "general-settings",
				children: [
					(0, react_jsx_runtime.jsx)("h2", {
						className: GeneralSettingsPanel_module_css_default.title,
						children: t("settings.general.title")
					}),
					(0, react_jsx_runtime.jsx)("p", {
						className: GeneralSettingsPanel_module_css_default.hint,
						children: t("settings.general.hint")
					}),
					(0, react_jsx_runtime.jsx)(ModelRetryPanel, {
						remote,
						t
					})
				]
			});
		}
		//#endregion
		//#region \0dsh-css:D:\Documents\Dev-Repo\deepseek-harness\dsh-plugins\dsh-web-enhanced\src\client\settings\PluginManager.module.css.mjs
		const css$4 = "._4z0ojW_root{flex-direction:column;gap:14px;min-width:0;display:flex}._4z0ojW_head{flex:none;justify-content:space-between;align-items:flex-start;gap:12px;display:flex}._4z0ojW_headText{min-width:0}._4z0ojW_title{color:var(--dsw-alias-label-primary,#0f1115);font-size:14px;font-weight:600}._4z0ojW_subtitle{color:var(--dsw-alias-label-tertiary,#81858c);overflow-wrap:anywhere;margin-top:3px;font-size:13px}._4z0ojW_muted{color:var(--dsw-alias-label-secondary,#61666b);margin:0;font-size:14px;line-height:1.7}._4z0ojW_ghost,._4z0ojW_primary,._4z0ojW_danger{border:1px solid var(--dsw-alias-border-l2,#0000001a);color:inherit;cursor:pointer;font:inherit;white-space:nowrap;background:0 0;border-radius:4px;padding:3px 10px;font-size:13px;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s}._4z0ojW_ghost:hover:not(:disabled),._4z0ojW_primary:hover:not(:disabled),._4z0ojW_danger:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#2631480f)}._4z0ojW_ghost:focus-visible,._4z0ojW_primary:focus-visible,._4z0ojW_danger:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}._4z0ojW_primary{border-color:var(--dsw-alias-state-business-primary,#4176e6);background:var(--dsw-alias-state-business-tertiary,#b7c8fe)}._4z0ojW_danger{border-color:var(--dsw-alias-state-error-primary,#ec1313);color:var(--dsw-alias-state-error-primary,#ec1313)}._4z0ojW_ghost:disabled,._4z0ojW_primary:disabled,._4z0ojW_danger:disabled{cursor:default;opacity:.45}._4z0ojW_rows{flex-direction:column;gap:8px;margin:0;padding:0;list-style:none;display:flex}._4z0ojW_row{border:1px solid var(--dsw-alias-border-l2,#0000001a);border-radius:12px;justify-content:space-between;align-items:flex-start;gap:12px;padding:10px 12px;display:flex;box-shadow:0 1px 2px #00000014,0 8px 24px #0000001f}._4z0ojW_rowMain{flex-direction:column;flex:1;gap:4px;min-width:0;display:flex}._4z0ojW_rowTitle{flex-wrap:wrap;align-items:baseline;gap:8px;display:flex}._4z0ojW_name{overflow-wrap:anywhere;color:var(--dsw-alias-label-primary,#0f1115);font-size:14px;font-weight:600}._4z0ojW_version{color:var(--dsw-alias-label-tertiary,#81858c);font-size:12px}._4z0ojW_selfTag{border:1px solid var(--dsw-alias-state-business-primary,#4176e6);color:var(--dsw-alias-state-business-primary,#4176e6);border-radius:999px;padding:0 5px;font-size:12px}._4z0ojW_desc{color:var(--dsw-alias-label-secondary,#61666b);overflow-wrap:anywhere;font-size:13px;line-height:1.6}._4z0ojW_meta{flex-wrap:wrap;align-items:center;gap:8px;margin-top:2px;display:flex}._4z0ojW_tag,._4z0ojW_tagOn{border:1px solid var(--dsw-alias-border-l2,#0000001a);color:var(--dsw-alias-label-secondary,#61666b);border-radius:999px;padding:0 5px;font-size:12px}._4z0ojW_tagOn{border-color:var(--dsw-alias-state-success-primary,#22c55e);color:var(--dsw-alias-state-success-primary,#22c55e)}._4z0ojW_spec{color:var(--dsw-alias-label-tertiary,#81858c);overflow-wrap:anywhere;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:12px}._4z0ojW_rowActions{flex:none;gap:6px;display:flex}._4z0ojW_noteOk,._4z0ojW_noteBad{border:1px solid var(--dsw-alias-state-success-primary,#22c55e);border-radius:8px;padding:8px 10px;font-size:13px;line-height:1.6}._4z0ojW_noteBad{border-color:var(--dsw-alias-state-error-primary,#ec1313)}._4z0ojW_output{margin-top:6px;font-size:12px}._4z0ojW_output summary{cursor:pointer;color:var(--dsw-alias-label-tertiary,#81858c)}._4z0ojW_output pre{white-space:pre-wrap;overflow-wrap:anywhere;max-height:220px;color:var(--dsw-alias-label-secondary,#61666b);scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l3,#0000001f) transparent;margin:6px 0 0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;overflow:auto}._4z0ojW_template{border-top:1px solid var(--dsw-alias-border-l1,#0000000a);padding-top:10px}._4z0ojW_templateTitle{color:var(--dsw-alias-label-secondary,#61666b);font-size:13px;font-weight:600}._4z0ojW_templateHint{color:var(--dsw-alias-label-tertiary,#81858c);margin-top:3px;font-size:12px;line-height:1.6}._4z0ojW_templateList{flex-wrap:wrap;gap:8px;margin-top:6px;display:flex}._4z0ojW_confirm{border:1px solid var(--dsw-alias-state-business-primary,#4176e6);background:var(--dsw-alias-state-business-tertiary,#b7c8fe);border-radius:12px;padding:12px;box-shadow:0 1px 2px #00000014,0 8px 24px #0000001f}._4z0ojW_confirmText{color:var(--dsw-alias-label-primary,#0f1115);margin:0 0 10px;font-size:14px;line-height:1.7}._4z0ojW_confirmActions{justify-content:flex-end;gap:8px;display:flex}@media (prefers-reduced-motion:reduce){._4z0ojW_ghost,._4z0ojW_primary,._4z0ojW_danger{transition:none}}";
		const tagId$4 = "dsh-web-enhanced/PluginManager.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$4) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId$4;
			tag.textContent = css$4;
			document.head.appendChild(tag);
		}
		var PluginManager_module_css_default = {
			"confirm": "_4z0ojW_confirm",
			"confirmActions": "_4z0ojW_confirmActions",
			"confirmText": "_4z0ojW_confirmText",
			"danger": "_4z0ojW_danger",
			"desc": "_4z0ojW_desc",
			"ghost": "_4z0ojW_ghost",
			"head": "_4z0ojW_head",
			"headText": "_4z0ojW_headText",
			"meta": "_4z0ojW_meta",
			"muted": "_4z0ojW_muted",
			"name": "_4z0ojW_name",
			"noteBad": "_4z0ojW_noteBad",
			"noteOk": "_4z0ojW_noteOk",
			"output": "_4z0ojW_output",
			"primary": "_4z0ojW_primary",
			"root": "_4z0ojW_root",
			"row": "_4z0ojW_row",
			"rowActions": "_4z0ojW_rowActions",
			"rowMain": "_4z0ojW_rowMain",
			"rowTitle": "_4z0ojW_rowTitle",
			"rows": "_4z0ojW_rows",
			"selfTag": "_4z0ojW_selfTag",
			"spec": "_4z0ojW_spec",
			"subtitle": "_4z0ojW_subtitle",
			"tag": "_4z0ojW_tag",
			"tagOn": "_4z0ojW_tagOn",
			"template": "_4z0ojW_template",
			"templateHint": "_4z0ojW_templateHint",
			"templateList": "_4z0ojW_templateList",
			"templateTitle": "_4z0ojW_templateTitle",
			"title": "_4z0ojW_title",
			"version": "_4z0ojW_version"
		};
		//#endregion
		//#region lib/types/client/settings/PluginManager.js
		/**
		* Installed-plugin management: list, update, remove.
		*
		* The host's own `pluginInventory` service lists the LOADER TREE and states
		* plainly that it cannot mutate anything. This surface answers a different
		* question — what the profile has INSTALLED — because that is the set `pnpm`
		* can act on. The two do not coincide: one npm package can contribute several
		* loader rows, and the profile template's bundles are loader rows that no
		* dependency provides at all.
		*
		* Every mutation is confirmed before it runs, and every success says the same
		* thing: it takes effect on the next start. Nothing here can change the running
		* tree, because Cordis composed that tree at boot.
		* @module dsh-web-enhanced/src/client/settings/PluginManager
		*/
		/**
		* Describe what a row is in the layer stack.
		*
		* Three distinct states, not two: a package can be installed without declaring
		* `dsh.bundle` (a plain library), and one that declares it can still be absent
		* from the list if the manifest was edited by hand.
		* @param plugin - the row.
		* @param t - translate.
		* @returns the tag text.
		*/
		function layerTag(plugin, t) {
			if (!plugin.bundle) return t("plugins.plain");
			return plugin.active ? t("plugins.layerActive") : t("plugins.layerInactive");
		}
		/**
		* Which confirmation a pending mutation asks for.
		*
		* Removing the row that IS this plugin is its own branch, not a wording
		* variation: the consequence — no settings page, no board, no graph after the
		* next start, and no way back except the command line — is not something the
		* ordinary removal sentence conveys.
		* @param action - the pending action.
		* @param plugin - the row it targets.
		* @returns the locale key of the confirmation text.
		*/
		function confirmKeyOf(action, plugin) {
			if (action === "update") return "plugins.confirmUpdate";
			return plugin.self ? "plugins.confirmRemoveSelf" : "plugins.confirmRemove";
		}
		/** Installed-plugin management. */
		function PluginManager({ remote, t }) {
			const [inventory, setInventory] = (0, react.useState)({ phase: "loading" });
			const [pending, setPending] = (0, react.useState)(void 0);
			const [busy, setBusy] = (0, react.useState)(false);
			const [outcome, setOutcome] = (0, react.useState)(void 0);
			const live = (0, react.useRef)(true);
			(0, react.useEffect)(() => () => {
				live.current = false;
			}, []);
			const load = (0, react.useCallback)(async () => {
				setInventory({ phase: "loading" });
				const result = await remote.pluginList({});
				if (!live.current) return;
				if ("error" in result) {
					setInventory({
						phase: "error",
						code: result.error.code,
						message: result.error.message
					});
					return;
				}
				setInventory({
					phase: "ready",
					value: result
				});
			}, [remote]);
			(0, react.useEffect)(() => {
				load();
			}, [load]);
			const confirm = (0, react.useCallback)(async () => {
				if (pending === void 0) return;
				const { action, plugin } = pending;
				setPending(void 0);
				setBusy(true);
				setOutcome(void 0);
				const result = action === "remove" ? await remote.pluginRemove({ name: plugin.name }) : await remote.pluginUpdate({ name: plugin.name });
				if (!live.current) return;
				setBusy(false);
				if ("error" in result) {
					setOutcome({
						ok: false,
						text: result.error.message,
						output: ""
					});
					return;
				}
				if (!result.ok) {
					setOutcome({
						ok: false,
						text: t("plugins.failed"),
						output: result.output
					});
					return;
				}
				const changes = [...result.added.map((name) => t("plugins.added", { name })), ...result.removed.map((name) => t("plugins.removed", { name }))].join("  ");
				setOutcome({
					ok: true,
					text: changes === "" ? t("plugins.restart") : `${t("plugins.changed", { changes })} — ${t("plugins.restart")}`,
					output: result.output
				});
				await load();
			}, [
				pending,
				remote,
				t,
				load
			]);
			if (inventory.phase === "loading") return (0, react_jsx_runtime.jsx)("p", {
				className: PluginManager_module_css_default.muted,
				children: t("plugins.loading")
			});
			if (inventory.phase === "error") {
				const text = inventory.code === "no-profile" ? t("plugins.noProfile") : t("plugins.error", { message: inventory.message });
				return (0, react_jsx_runtime.jsx)("p", {
					className: PluginManager_module_css_default.muted,
					children: text
				});
			}
			const view = inventory.value;
			return (0, react_jsx_runtime.jsxs)("div", {
				className: PluginManager_module_css_default.root,
				children: [
					(0, react_jsx_runtime.jsxs)("div", {
						className: PluginManager_module_css_default.head,
						children: [(0, react_jsx_runtime.jsxs)("div", {
							className: PluginManager_module_css_default.headText,
							children: [(0, react_jsx_runtime.jsx)("div", {
								className: PluginManager_module_css_default.title,
								children: t("plugins.title")
							}), (0, react_jsx_runtime.jsx)("div", {
								className: PluginManager_module_css_default.subtitle,
								children: t("plugins.subtitle", {
									profile: view.profileName,
									dir: view.profileDir
								})
							})]
						}), (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: PluginManager_module_css_default.ghost,
							disabled: busy,
							onClick: () => {
								load();
							},
							children: t("plugins.reload")
						})]
					}),
					outcome !== void 0 && (0, react_jsx_runtime.jsxs)("div", {
						className: outcome.ok ? PluginManager_module_css_default.noteOk : PluginManager_module_css_default.noteBad,
						children: [(0, react_jsx_runtime.jsx)("div", { children: outcome.text }), outcome.output !== "" && (0, react_jsx_runtime.jsxs)("details", {
							className: PluginManager_module_css_default.output,
							children: [(0, react_jsx_runtime.jsx)("summary", { children: t("plugins.output") }), (0, react_jsx_runtime.jsx)("pre", { children: outcome.output })]
						})]
					}),
					busy && (0, react_jsx_runtime.jsx)("p", {
						className: PluginManager_module_css_default.muted,
						children: t("plugins.busy")
					}),
					view.plugins.length === 0 ? (0, react_jsx_runtime.jsx)("p", {
						className: PluginManager_module_css_default.muted,
						children: t("plugins.empty")
					}) : (0, react_jsx_runtime.jsx)("ul", {
						className: PluginManager_module_css_default.rows,
						children: view.plugins.map((plugin) => (0, react_jsx_runtime.jsxs)("li", {
							className: PluginManager_module_css_default.row,
							children: [(0, react_jsx_runtime.jsxs)("div", {
								className: PluginManager_module_css_default.rowMain,
								children: [
									(0, react_jsx_runtime.jsxs)("div", {
										className: PluginManager_module_css_default.rowTitle,
										children: [
											(0, react_jsx_runtime.jsx)("span", {
												className: PluginManager_module_css_default.name,
												children: plugin.name
											}),
											(0, react_jsx_runtime.jsx)("span", {
												className: PluginManager_module_css_default.version,
												children: plugin.version === null ? t("plugins.versionUnknown") : t("plugins.version", { version: plugin.version })
											}),
											plugin.self && (0, react_jsx_runtime.jsx)("span", {
												className: PluginManager_module_css_default.selfTag,
												children: t("plugins.self")
											})
										]
									}),
									plugin.description !== null && (0, react_jsx_runtime.jsx)("div", {
										className: PluginManager_module_css_default.desc,
										children: plugin.description
									}),
									(0, react_jsx_runtime.jsxs)("div", {
										className: PluginManager_module_css_default.meta,
										children: [(0, react_jsx_runtime.jsx)("span", {
											className: plugin.active ? PluginManager_module_css_default.tagOn : PluginManager_module_css_default.tag,
											children: layerTag(plugin, t)
										}), (0, react_jsx_runtime.jsx)("code", {
											className: PluginManager_module_css_default.spec,
											children: plugin.spec
										})]
									})
								]
							}), (0, react_jsx_runtime.jsxs)("div", {
								className: PluginManager_module_css_default.rowActions,
								children: [(0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: PluginManager_module_css_default.ghost,
									disabled: busy,
									onClick: () => {
										setPending({
											action: "update",
											plugin
										});
									},
									children: t("plugins.update")
								}), (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: PluginManager_module_css_default.danger,
									disabled: busy,
									onClick: () => {
										setPending({
											action: "remove",
											plugin
										});
									},
									children: t("plugins.remove")
								})]
							})]
						}, plugin.name))
					}),
					view.templateBundles.length > 0 && (0, react_jsx_runtime.jsxs)("div", {
						className: PluginManager_module_css_default.template,
						children: [
							(0, react_jsx_runtime.jsx)("div", {
								className: PluginManager_module_css_default.templateTitle,
								children: t("plugins.templateTitle")
							}),
							(0, react_jsx_runtime.jsx)("div", {
								className: PluginManager_module_css_default.templateHint,
								children: t("plugins.templateHint")
							}),
							(0, react_jsx_runtime.jsx)("div", {
								className: PluginManager_module_css_default.templateList,
								children: view.templateBundles.map((name) => (0, react_jsx_runtime.jsx)("code", {
									className: PluginManager_module_css_default.spec,
									children: name
								}, name))
							})
						]
					}),
					pending !== void 0 && (0, react_jsx_runtime.jsxs)("div", {
						className: PluginManager_module_css_default.confirm,
						role: "alertdialog",
						"aria-modal": "true",
						children: [(0, react_jsx_runtime.jsx)("p", {
							className: PluginManager_module_css_default.confirmText,
							children: t(confirmKeyOf(pending.action, pending.plugin), { name: pending.plugin.name })
						}), (0, react_jsx_runtime.jsxs)("div", {
							className: PluginManager_module_css_default.confirmActions,
							children: [(0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: PluginManager_module_css_default.ghost,
								onClick: () => {
									setPending(void 0);
								},
								children: t("plugins.cancel")
							}), (0, react_jsx_runtime.jsx)("button", {
								type: "button",
								className: pending.action === "remove" ? PluginManager_module_css_default.danger : PluginManager_module_css_default.primary,
								onClick: () => {
									confirm();
								},
								children: t("plugins.confirm")
							})]
						})]
					})
				]
			});
		}
		//#endregion
		//#region \0dsh-css:D:\Documents\Dev-Repo\deepseek-harness\dsh-plugins\dsh-web-enhanced\src\client\settings\VisionStatusPanel.module.css.mjs
		const css$3 = ".-rfqqq_root{flex-direction:column;gap:12px;max-width:760px;min-height:0;display:flex}.-rfqqq_form{flex-direction:column;gap:12px;display:flex}.-rfqqq_section{border:1px solid var(--dsw-alias-border-l2,#0000001a);border-radius:12px;flex-direction:column;gap:8px;padding:14px;display:flex}.-rfqqq_sectionTitle{color:var(--dsw-alias-label-primary,#0f1115);margin:0;font-size:14px;font-weight:600}.-rfqqq_sectionHint,.-rfqqq_fieldHint{color:var(--dsw-alias-label-tertiary,#81858c);margin:0;font-size:12px;line-height:1.6}.-rfqqq_checks,.-rfqqq_grid{gap:10px 16px;display:grid}.-rfqqq_grid{grid-template-columns:repeat(auto-fit,minmax(220px,1fr))}.-rfqqq_field{flex-direction:column;gap:4px;min-width:0;display:flex}.-rfqqq_fieldLabel{color:var(--dsw-alias-label-secondary,#61666b);font-size:13px}.-rfqqq_input,.-rfqqq_textarea{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,#0000001a);width:100%;color:inherit;font:inherit;background:0 0;border-radius:8px;padding:6px 9px;font-size:13px;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s}.-rfqqq_input:focus-visible,.-rfqqq_textarea:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}.-rfqqq_textarea{resize:vertical;min-height:88px}.-rfqqq_keyRow{align-items:center;gap:8px;display:flex}.-rfqqq_minorButton{border:1px solid var(--dsw-alias-border-l2,#0000001a);color:inherit;cursor:pointer;font:inherit;background:0 0;border-radius:8px;flex:none;padding:5px 10px;font-size:12px;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s}.-rfqqq_minorButton:hover{background:var(--dsw-alias-interactive-bg-hover,#2631480f)}.-rfqqq_minorButton:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}.-rfqqq_actions{flex-wrap:wrap;align-items:center;gap:10px;display:flex}.-rfqqq_poolBlock{border-top:1px solid var(--dsw-alias-border-l1,#0000000a);flex-direction:column;gap:8px;padding-top:10px;display:flex}.-rfqqq_poolToolbar{flex-wrap:wrap;align-items:center;gap:10px;display:flex}.-rfqqq_poolList{border:1px solid var(--dsw-alias-border-l1,#0000000a);scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l3,#0000001f) transparent;border-radius:8px;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:4px 12px;max-height:220px;padding:8px;display:grid;overflow:auto}.-rfqqq_poolRow{cursor:pointer;border-radius:8px;align-items:center;gap:8px;min-width:0;font-size:13px;line-height:1.6;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s;display:flex}.-rfqqq_poolRow:hover{background:var(--dsw-alias-interactive-bg-hover,#2631480f)}.-rfqqq_poolRow:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#3f76d8);outline-offset:2px}.-rfqqq_poolName{overflow-wrap:anywhere;min-width:0}.-rfqqq_save{background:var(--dsw-alias-button-primary-fill,#4176e6);color:var(--dsw-alias-label-primary-foreground,#fff);cursor:pointer;font:inherit;border:none;border-radius:8px;padding:7px 18px;font-size:13px;font-weight:600;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s}.-rfqqq_save:hover{background:var(--dsw-alias-button-primary-hover,#43454a)}.-rfqqq_save:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}.-rfqqq_save:disabled{opacity:.55;cursor:default}.-rfqqq_saved{color:var(--dsw-alias-state-success-primary,#22c55e);font-size:13px}.-rfqqq_card{border:1px solid var(--dsw-alias-border-l2,#0000001a);border-radius:12px;flex-direction:column;gap:8px;padding:14px;display:flex}.-rfqqq_statusHeader{justify-content:space-between;align-items:center;gap:10px;display:flex}.-rfqqq_failures{flex-direction:column;gap:6px;width:100%;min-width:0;display:flex}.-rfqqq_failureEntry{flex-wrap:wrap;align-items:baseline;gap:6px;min-width:0;font-size:12px;line-height:1.6;display:flex}.-rfqqq_failureTime{color:var(--dsw-alias-label-tertiary,#81858c)}.-rfqqq_failureMessage{overflow-wrap:anywhere;white-space:pre-wrap;min-width:0;color:var(--dsw-alias-label-secondary,#61666b);flex:100%}.-rfqqq_row{grid-template-columns:minmax(130px,200px) 1fr;align-items:start;gap:12px;font-size:13px;line-height:1.6;display:grid}.-rfqqq_label{color:var(--dsw-alias-label-tertiary,#81858c);overflow-wrap:anywhere}.-rfqqq_value{overflow-wrap:anywhere;flex-wrap:wrap;gap:6px;min-width:0;display:flex}.-rfqqq_code{border:1px solid var(--dsw-alias-border-l2,#0000001a);background:var(--dsw-alias-interactive-bg-hover,#2631480f);border-radius:999px;padding:1px 6px;font-family:ui-monospace,Cascadia Code,Consolas,monospace;font-size:12px}.-rfqqq_list{flex-wrap:wrap;gap:6px;display:flex}.-rfqqq_badgeOk{background:var(--dsw-alias-state-success-tertiary,#e6faed);color:var(--dsw-alias-state-success-primary,#22c55e);border-radius:999px;padding:1px 9px;font-size:12px;line-height:1.5}.-rfqqq_badgeMuted{background:var(--dsw-alias-interactive-bg-hover,#2631480f);color:var(--dsw-alias-label-secondary,#61666b);border-radius:999px;padding:1px 9px;font-size:12px;line-height:1.5}.-rfqqq_muted{color:var(--dsw-alias-label-secondary,#61666b)}.-rfqqq_note,.-rfqqq_warn,.-rfqqq_hint,.-rfqqq_failure{margin:0;font-size:13px;line-height:1.7}.-rfqqq_warn{color:var(--dsw-alias-state-warn-primary,#f59e0b)}.-rfqqq_failure{color:var(--dsw-alias-state-error-primary,#ec1313);white-space:pre-wrap}.-rfqqq_hint{max-width:68ch;color:var(--dsw-alias-label-tertiary,#81858c);white-space:pre-wrap}@media (prefers-reduced-motion:reduce){.-rfqqq_input,.-rfqqq_textarea,.-rfqqq_minorButton,.-rfqqq_poolRow,.-rfqqq_save{transition:none}}";
		const tagId$3 = "dsh-web-enhanced/VisionStatusPanel.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$3) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId$3;
			tag.textContent = css$3;
			document.head.appendChild(tag);
		}
		var VisionStatusPanel_module_css_default = {
			"actions": "-rfqqq_actions",
			"badgeMuted": "-rfqqq_badgeMuted",
			"badgeOk": "-rfqqq_badgeOk",
			"card": "-rfqqq_card",
			"checks": "-rfqqq_checks",
			"code": "-rfqqq_code",
			"failure": "-rfqqq_failure",
			"failureEntry": "-rfqqq_failureEntry",
			"failureMessage": "-rfqqq_failureMessage",
			"failureTime": "-rfqqq_failureTime",
			"failures": "-rfqqq_failures",
			"field": "-rfqqq_field",
			"fieldHint": "-rfqqq_fieldHint",
			"fieldLabel": "-rfqqq_fieldLabel",
			"form": "-rfqqq_form",
			"grid": "-rfqqq_grid",
			"hint": "-rfqqq_hint",
			"input": "-rfqqq_input",
			"keyRow": "-rfqqq_keyRow",
			"label": "-rfqqq_label",
			"list": "-rfqqq_list",
			"minorButton": "-rfqqq_minorButton",
			"muted": "-rfqqq_muted",
			"note": "-rfqqq_note",
			"poolBlock": "-rfqqq_poolBlock",
			"poolList": "-rfqqq_poolList",
			"poolName": "-rfqqq_poolName",
			"poolRow": "-rfqqq_poolRow",
			"poolToolbar": "-rfqqq_poolToolbar",
			"root": "-rfqqq_root",
			"row": "-rfqqq_row",
			"save": "-rfqqq_save",
			"saved": "-rfqqq_saved",
			"section": "-rfqqq_section",
			"sectionHint": "-rfqqq_sectionHint",
			"sectionTitle": "-rfqqq_sectionTitle",
			"statusHeader": "-rfqqq_statusHeader",
			"textarea": "-rfqqq_textarea",
			"value": "-rfqqq_value",
			"warn": "-rfqqq_warn"
		};
		//#endregion
		//#region lib/types/client/settings/VisionStatusPanel.js
		/**
		* The Vision tab: live configuration form + status.
		*
		* Configuration is a settings namespace (`dsh-web-enhanced-vision`) owned by
		* this plugin; saves go through the plugin gateway (`visionConfigGet` /
		* `visionConfigSet`) and the host-side interceptor watches the commit, so
		* changes apply immediately without a restart. The DSH provider/model selects
		* read the same directory the model picker renders, filtered to models that
		* declare image input. The dedicated API section is only used for image
		* transcription — it never registers into DSH's model channels.
		* @module dsh-web-enhanced/src/client/settings/VisionStatusPanel
		*/
		function draftOf(value) {
			return {
				enabled: value.enabled,
				patchAdmission: value.patchAdmission,
				provider: value.provider,
				model: value.model,
				harnessModels: value.harnessModels.map((entry) => ({
					provider: entry.provider,
					model: entry.model
				})),
				prompt: value.prompt,
				marker: value.marker,
				baseUrl: value.baseUrl,
				apiKeyInput: "",
				endpointModel: value.endpointModel,
				endpointModels: [...value.endpointModels],
				anonymous: value.anonymous,
				timeoutMs: String(value.timeoutMs),
				maxTokens: String(value.maxTokens),
				autoLocalOllama: value.autoLocalOllama,
				localOllamaModel: value.localOllamaModel,
				localOllamaUrl: value.localOllamaUrl,
				revision: value.revision
			};
		}
		/** One key/value row in the status card. */
		function Row({ label, children }) {
			return (0, react_jsx_runtime.jsxs)("div", {
				className: VisionStatusPanel_module_css_default.row,
				children: [(0, react_jsx_runtime.jsx)("div", {
					className: VisionStatusPanel_module_css_default.label,
					children: label
				}), (0, react_jsx_runtime.jsx)("div", {
					className: VisionStatusPanel_module_css_default.value,
					children
				})]
			});
		}
		/** One labelled form field. */
		function Field({ label, hint, children }) {
			return (0, react_jsx_runtime.jsxs)("div", {
				className: VisionStatusPanel_module_css_default.field,
				children: [
					(0, react_jsx_runtime.jsx)("span", {
						className: VisionStatusPanel_module_css_default.fieldLabel,
						children: label
					}),
					children,
					hint !== void 0 && (0, react_jsx_runtime.jsx)("span", {
						className: VisionStatusPanel_module_css_default.fieldHint,
						children: hint
					})
				]
			});
		}
		/** Locale key of one apiKeySource value. */
		function keySourceKey(source) {
			switch (source) {
				case "config": return "vision.key.config";
				case "env": return "vision.key.env";
				case "none-needed": return "vision.key.none-needed";
				default: return "vision.key.unset";
			}
		}
		/** Locale key of one failure source. */
		function failureSourceKey(source) {
			switch (source) {
				case "ollama": return "vision.source.ollama";
				case "endpoint": return "vision.source.endpoint";
				default: return "vision.source.dsh";
			}
		}
		/** The Vision tab: configuration form above, live status below. */
		function VisionStatusPanel({ remote, t }) {
			const [loading, setLoading] = (0, react.useState)(true);
			const [configError, setConfigError] = (0, react.useState)(null);
			const [view, setView] = (0, react.useState)(null);
			const [status, setStatus] = (0, react.useState)(null);
			const [draft, setDraft] = (0, react.useState)(null);
			const [saving, setSaving] = (0, react.useState)(false);
			const [saved, setSaved] = (0, react.useState)(false);
			const [saveError, setSaveError] = (0, react.useState)(null);
			const [discovered, setDiscovered] = (0, react.useState)(null);
			const [discoveredTruncated, setDiscoveredTruncated] = (0, react.useState)(false);
			const [discovering, setDiscovering] = (0, react.useState)(false);
			const [discoverError, setDiscoverError] = (0, react.useState)(null);
			const load = (0, react.useCallback)(async () => {
				setLoading(true);
				setConfigError(null);
				const [configResult, statusResult] = await Promise.all([remote.visionConfigGet(), remote.visionStatus()]);
				if ("error" in statusResult) setStatus(null);
				else setStatus(statusResult);
				if ("error" in configResult) {
					setConfigError(configResult.error.message);
					setView(null);
					setDraft(null);
				} else {
					setView(configResult);
					setDraft(draftOf(configResult));
				}
				setLoading(false);
			}, [remote]);
			(0, react.useEffect)(() => {
				load();
			}, [load]);
			/** Pull the dedicated endpoint's model list (one-shot key if typed). */
			const fetchModels = (0, react.useCallback)(async () => {
				if (draft === null) return;
				setDiscovering(true);
				setDiscoverError(null);
				const result = await remote.visionEndpointModels({
					baseUrl: draft.baseUrl.trim(),
					...draft.apiKeyInput.trim() === "" ? {} : { apiKey: draft.apiKeyInput.trim() },
					anonymous: draft.anonymous
				});
				if ("error" in result) setDiscoverError(result.error.message);
				else {
					setDiscovered(result.models);
					setDiscoveredTruncated(result.truncated);
					setDraft((current) => current === null ? current : {
						...current,
						endpointModels: result.models.filter((model) => current.endpointModels.includes(model.id)).map((model) => model.id)
					});
				}
				setDiscovering(false);
			}, [draft, remote]);
			/** Check/uncheck one fetched model in the candidate pool. */
			const toggleEndpointModel = (id) => {
				setDraft((current) => {
					if (current === null) return current;
					const checked = current.endpointModels.includes(id);
					const pool = checked ? current.endpointModels.filter((existing) => existing !== id) : [...current.endpointModels, id];
					return {
						...current,
						endpointModels: pool,
						endpointModel: current.endpointModel === "" && !checked ? id : current.endpointModel
					};
				});
			};
			/** Check/uncheck one DSH provider/model pair in the harness pool. */
			const toggleHarnessModel = (provider, model) => {
				setDraft((current) => {
					if (current === null) return current;
					const pool = current.harnessModels.some((entry) => entry.provider === provider && entry.model === model) ? current.harnessModels.filter((entry) => entry.provider !== provider || entry.model !== model) : [...current.harnessModels, {
						provider,
						model
					}];
					return {
						...current,
						harnessModels: pool
					};
				});
			};
			/** Providers that offer at least one image-capable model (picker source). */
			const visionProviders = (view?.providers ?? []).filter((provider) => provider.models.some((model) => model.supportsImage));
			const save = (0, react.useCallback)(async (patch) => {
				if (draft === null) return;
				setSaving(true);
				setSaved(false);
				setSaveError(null);
				const request = {
					patch,
					...draft.revision === null ? {} : { expectedRevision: draft.revision }
				};
				const result = await remote.visionConfigSet(request);
				if ("error" in result) {
					if (result.error.code === "vision-config-conflict") {
						await load();
						setSaveError(t("vision.form.conflict"));
					} else setSaveError(result.error.message);
				} else {
					setDraft((current) => current === null ? current : {
						...current,
						revision: result.revision,
						apiKeyInput: ""
					});
					await load();
					setSaved(true);
				}
				setSaving(false);
			}, [
				draft,
				load,
				remote,
				t
			]);
			const submit = () => {
				if (draft === null) return;
				const timeoutMs = Number(draft.timeoutMs);
				const maxTokens = Number(draft.maxTokens);
				if (!Number.isFinite(timeoutMs) || timeoutMs <= 0 || !Number.isFinite(maxTokens) || maxTokens <= 0) {
					setSaveError(t("vision.form.invalidNumber"));
					return;
				}
				const patch = {
					enabled: draft.enabled,
					patchAdmission: draft.patchAdmission,
					provider: draft.provider,
					model: draft.provider === "" ? "" : draft.model,
					harnessModels: draft.harnessModels.map((entry) => ({
						provider: entry.provider,
						model: entry.model
					})),
					prompt: draft.prompt,
					marker: draft.marker,
					baseUrl: draft.baseUrl.trim(),
					endpointModel: draft.endpointModel.trim(),
					endpointModels: [...draft.endpointModels],
					anonymous: draft.anonymous,
					timeoutMs,
					maxTokens,
					autoLocalOllama: draft.autoLocalOllama,
					localOllamaModel: draft.localOllamaModel.trim(),
					localOllamaUrl: draft.localOllamaUrl.trim()
				};
				if (draft.apiKeyInput.trim() !== "") patch.apiKey = draft.apiKeyInput.trim();
				save(patch);
			};
			if (loading && status === null && draft === null) return (0, react_jsx_runtime.jsx)("p", {
				className: VisionStatusPanel_module_css_default.note,
				children: t("vision.loading")
			});
			return (0, react_jsx_runtime.jsxs)("div", {
				className: VisionStatusPanel_module_css_default.root,
				children: [
					configError !== null && (0, react_jsx_runtime.jsx)("p", {
						className: VisionStatusPanel_module_css_default.warn,
						children: t("vision.form.unavailable", { message: configError })
					}),
					draft !== null && (0, react_jsx_runtime.jsxs)("div", {
						className: VisionStatusPanel_module_css_default.form,
						children: [
							(0, react_jsx_runtime.jsxs)("section", {
								className: VisionStatusPanel_module_css_default.section,
								children: [(0, react_jsx_runtime.jsx)("h3", {
									className: VisionStatusPanel_module_css_default.sectionTitle,
									children: t("vision.form.switchesTitle")
								}), (0, react_jsx_runtime.jsxs)("div", {
									className: VisionStatusPanel_module_css_default.checks,
									children: [(0, react_jsx_runtime.jsx)(Field, {
										label: t("vision.form.enabled"),
										hint: t("vision.form.enabledHint"),
										children: (0, react_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: draft.enabled,
											onChange: (event) => {
												setDraft({
													...draft,
													enabled: event.target.checked
												});
											}
										})
									}), (0, react_jsx_runtime.jsx)(Field, {
										label: t("vision.form.patchAdmission"),
										hint: t("vision.form.patchAdmissionHint"),
										children: (0, react_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: draft.patchAdmission,
											onChange: (event) => {
												setDraft({
													...draft,
													patchAdmission: event.target.checked
												});
											}
										})
									})]
								})]
							}),
							(0, react_jsx_runtime.jsxs)("section", {
								className: VisionStatusPanel_module_css_default.section,
								children: [
									(0, react_jsx_runtime.jsx)("h3", {
										className: VisionStatusPanel_module_css_default.sectionTitle,
										children: t("vision.form.harnessTitle")
									}),
									(0, react_jsx_runtime.jsx)("p", {
										className: VisionStatusPanel_module_css_default.sectionHint,
										children: t("vision.form.harnessHint")
									}),
									visionProviders.length === 0 && (0, react_jsx_runtime.jsx)("p", {
										className: VisionStatusPanel_module_css_default.sectionHint,
										children: t("vision.form.noImageModels")
									}),
									visionProviders.length > 0 && (0, react_jsx_runtime.jsx)("div", {
										className: VisionStatusPanel_module_css_default.poolList,
										children: visionProviders.flatMap((provider) => provider.models.filter((model) => model.supportsImage).map((model) => {
											const checked = draft.harnessModels.some((entry) => entry.provider === provider.provider && entry.model === model.id);
											return (0, react_jsx_runtime.jsxs)("label", {
												className: VisionStatusPanel_module_css_default.poolRow,
												children: [(0, react_jsx_runtime.jsx)("input", {
													type: "checkbox",
													checked,
													onChange: () => {
														toggleHarnessModel(provider.provider, model.id);
													}
												}), (0, react_jsx_runtime.jsxs)("span", {
													className: VisionStatusPanel_module_css_default.poolName,
													children: [
														provider.name,
														" · ",
														model.name === model.id ? model.id : `${model.name}（${model.id}）`
													]
												})]
											}, `${provider.provider}/${model.id}`);
										}))
									}),
									(0, react_jsx_runtime.jsx)("p", {
										className: VisionStatusPanel_module_css_default.sectionHint,
										children: draft.harnessModels.length > 0 ? t("vision.form.harnessPoolHint", { count: String(draft.harnessModels.length) }) : t("vision.form.harnessAutoHint")
									})
								]
							}),
							(0, react_jsx_runtime.jsxs)("section", {
								className: VisionStatusPanel_module_css_default.section,
								children: [
									(0, react_jsx_runtime.jsx)("h3", {
										className: VisionStatusPanel_module_css_default.sectionTitle,
										children: t("vision.form.endpointTitle")
									}),
									(0, react_jsx_runtime.jsx)("p", {
										className: VisionStatusPanel_module_css_default.sectionHint,
										children: t("vision.form.endpointHint")
									}),
									(0, react_jsx_runtime.jsxs)("div", {
										className: VisionStatusPanel_module_css_default.grid,
										children: [
											(0, react_jsx_runtime.jsx)(Field, {
												label: t("vision.form.baseUrl"),
												children: (0, react_jsx_runtime.jsx)("input", {
													className: VisionStatusPanel_module_css_default.input,
													value: draft.baseUrl,
													placeholder: "https://dashscope.aliyuncs.com/compatible-mode/v1",
													onChange: (event) => {
														setDraft({
															...draft,
															baseUrl: event.target.value
														});
													}
												})
											}),
											(0, react_jsx_runtime.jsx)(Field, {
												label: t("vision.form.endpointModel"),
												hint: t("vision.form.endpointModelHint"),
												children: draft.endpointModels.length > 0 ? (0, react_jsx_runtime.jsxs)("select", {
													className: VisionStatusPanel_module_css_default.input,
													value: draft.endpointModel,
													onChange: (event) => {
														setDraft({
															...draft,
															endpointModel: event.target.value
														});
													},
													children: [
														(0, react_jsx_runtime.jsx)("option", {
															value: "",
															children: t("vision.form.endpointModelAuto")
														}),
														draft.endpointModels.map((id) => (0, react_jsx_runtime.jsx)("option", {
															value: id,
															children: id
														}, id)),
														draft.endpointModel !== "" && !draft.endpointModels.includes(draft.endpointModel) && (0, react_jsx_runtime.jsx)("option", {
															value: draft.endpointModel,
															children: draft.endpointModel
														})
													]
												}) : (0, react_jsx_runtime.jsx)("input", {
													className: VisionStatusPanel_module_css_default.input,
													value: draft.endpointModel,
													placeholder: "qwen3.7-flash",
													onChange: (event) => {
														setDraft({
															...draft,
															endpointModel: event.target.value
														});
													}
												})
											}),
											(0, react_jsx_runtime.jsx)(Field, {
												label: t("vision.form.apiKey"),
												hint: t("vision.form.apiKeyHint"),
												children: (0, react_jsx_runtime.jsxs)("div", {
													className: VisionStatusPanel_module_css_default.keyRow,
													children: [(0, react_jsx_runtime.jsx)("input", {
														className: VisionStatusPanel_module_css_default.input,
														type: "password",
														value: draft.apiKeyInput,
														placeholder: t("vision.form.apiKeyPlaceholder"),
														onChange: (event) => {
															setDraft({
																...draft,
																apiKeyInput: event.target.value
															});
														}
													}), (0, react_jsx_runtime.jsx)("button", {
														type: "button",
														className: VisionStatusPanel_module_css_default.minorButton,
														onClick: () => {
															setSaveError(null);
															setDraft((current) => current === null ? current : {
																...current,
																apiKeyInput: ""
															});
															save({ apiKey: "" });
														},
														children: t("vision.form.apiKeyClear")
													})]
												})
											}),
											(0, react_jsx_runtime.jsx)(Field, {
												label: t("vision.form.anonymous"),
												children: (0, react_jsx_runtime.jsx)("input", {
													type: "checkbox",
													checked: draft.anonymous,
													onChange: (event) => {
														setDraft({
															...draft,
															anonymous: event.target.checked
														});
													}
												})
											}),
											(0, react_jsx_runtime.jsx)(Field, {
												label: t("vision.form.timeout"),
												children: (0, react_jsx_runtime.jsx)("input", {
													className: VisionStatusPanel_module_css_default.input,
													inputMode: "numeric",
													value: draft.timeoutMs,
													onChange: (event) => {
														setDraft({
															...draft,
															timeoutMs: event.target.value
														});
													}
												})
											}),
											(0, react_jsx_runtime.jsx)(Field, {
												label: t("vision.form.maxTokens"),
												children: (0, react_jsx_runtime.jsx)("input", {
													className: VisionStatusPanel_module_css_default.input,
													inputMode: "numeric",
													value: draft.maxTokens,
													onChange: (event) => {
														setDraft({
															...draft,
															maxTokens: event.target.value
														});
													}
												})
											})
										]
									}),
									(0, react_jsx_runtime.jsxs)("div", {
										className: VisionStatusPanel_module_css_default.poolBlock,
										children: [
											(0, react_jsx_runtime.jsxs)("div", {
												className: VisionStatusPanel_module_css_default.poolToolbar,
												children: [(0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: VisionStatusPanel_module_css_default.minorButton,
													disabled: discovering || draft.baseUrl.trim() === "",
													onClick: () => {
														fetchModels();
													},
													children: discovering ? t("vision.form.fetchingModels") : t("vision.form.fetchModels")
												}), discovered !== null && (0, react_jsx_runtime.jsxs)("span", {
													className: VisionStatusPanel_module_css_default.fieldHint,
													children: [t("vision.form.fetchedCount", { count: String(discovered.length) }), discoveredTruncated ? ` · ${t("vision.form.fetchedTruncated")}` : ""]
												})]
											}),
											discoverError !== null && (0, react_jsx_runtime.jsx)("p", {
												className: VisionStatusPanel_module_css_default.failure,
												children: t("vision.form.fetchError", { message: discoverError })
											}),
											discovered !== null && discovered.length > 0 && (0, react_jsx_runtime.jsx)("div", {
												className: VisionStatusPanel_module_css_default.poolList,
												children: discovered.map((model) => (0, react_jsx_runtime.jsxs)("label", {
													className: VisionStatusPanel_module_css_default.poolRow,
													children: [(0, react_jsx_runtime.jsx)("input", {
														type: "checkbox",
														checked: draft.endpointModels.includes(model.id),
														onChange: () => {
															toggleEndpointModel(model.id);
														}
													}), (0, react_jsx_runtime.jsx)("span", {
														className: VisionStatusPanel_module_css_default.poolName,
														children: model.name === model.id ? model.id : `${model.name}（${model.id}）`
													})]
												}, model.id))
											}),
											discovered !== null && discovered.length === 0 && (0, react_jsx_runtime.jsx)("p", {
												className: VisionStatusPanel_module_css_default.sectionHint,
												children: t("vision.form.noFetchedModels")
											}),
											discovered === null && (0, react_jsx_runtime.jsx)("p", {
												className: VisionStatusPanel_module_css_default.sectionHint,
												children: t("vision.form.poolHint")
											})
										]
									})
								]
							}),
							(0, react_jsx_runtime.jsxs)("section", {
								className: VisionStatusPanel_module_css_default.section,
								children: [(0, react_jsx_runtime.jsx)("h3", {
									className: VisionStatusPanel_module_css_default.sectionTitle,
									children: t("vision.form.ollamaTitle")
								}), (0, react_jsx_runtime.jsxs)("div", {
									className: VisionStatusPanel_module_css_default.grid,
									children: [
										(0, react_jsx_runtime.jsx)(Field, {
											label: t("vision.form.autoLocalOllama"),
											children: (0, react_jsx_runtime.jsx)("input", {
												type: "checkbox",
												checked: draft.autoLocalOllama,
												onChange: (event) => {
													setDraft({
														...draft,
														autoLocalOllama: event.target.checked
													});
												}
											})
										}),
										(0, react_jsx_runtime.jsx)(Field, {
											label: t("vision.form.localOllamaUrl"),
											children: (0, react_jsx_runtime.jsx)("input", {
												className: VisionStatusPanel_module_css_default.input,
												value: draft.localOllamaUrl,
												onChange: (event) => {
													setDraft({
														...draft,
														localOllamaUrl: event.target.value
													});
												}
											})
										}),
										(0, react_jsx_runtime.jsx)(Field, {
											label: t("vision.form.localOllamaModel"),
											hint: t("vision.form.localOllamaModelHint"),
											children: (0, react_jsx_runtime.jsx)("input", {
												className: VisionStatusPanel_module_css_default.input,
												value: draft.localOllamaModel,
												onChange: (event) => {
													setDraft({
														...draft,
														localOllamaModel: event.target.value
													});
												}
											})
										})
									]
								})]
							}),
							(0, react_jsx_runtime.jsxs)("section", {
								className: VisionStatusPanel_module_css_default.section,
								children: [
									(0, react_jsx_runtime.jsx)("h3", {
										className: VisionStatusPanel_module_css_default.sectionTitle,
										children: t("vision.form.promptTitle")
									}),
									(0, react_jsx_runtime.jsx)(Field, {
										label: t("vision.form.prompt"),
										children: (0, react_jsx_runtime.jsx)("textarea", {
											className: VisionStatusPanel_module_css_default.textarea,
											value: draft.prompt,
											onChange: (event) => {
												setDraft({
													...draft,
													prompt: event.target.value
												});
											}
										})
									}),
									(0, react_jsx_runtime.jsx)(Field, {
										label: t("vision.form.marker"),
										children: (0, react_jsx_runtime.jsx)("input", {
											className: VisionStatusPanel_module_css_default.input,
											value: draft.marker,
											onChange: (event) => {
												setDraft({
													...draft,
													marker: event.target.value
												});
											}
										})
									})
								]
							}),
							(0, react_jsx_runtime.jsxs)("div", {
								className: VisionStatusPanel_module_css_default.actions,
								children: [
									(0, react_jsx_runtime.jsx)("button", {
										type: "button",
										className: VisionStatusPanel_module_css_default.save,
										disabled: saving,
										onClick: submit,
										children: saving ? t("vision.form.saving") : t("vision.form.save")
									}),
									saved && (0, react_jsx_runtime.jsx)("span", {
										className: VisionStatusPanel_module_css_default.saved,
										children: t("vision.form.saved")
									}),
									saveError !== null && (0, react_jsx_runtime.jsx)("span", {
										className: VisionStatusPanel_module_css_default.failure,
										children: t("vision.form.saveError", { message: saveError })
									})
								]
							})
						]
					}),
					(0, react_jsx_runtime.jsxs)("div", {
						className: VisionStatusPanel_module_css_default.statusHeader,
						children: [(0, react_jsx_runtime.jsx)("h3", {
							className: VisionStatusPanel_module_css_default.sectionTitle,
							children: t("vision.statusTitle")
						}), (0, react_jsx_runtime.jsx)("button", {
							type: "button",
							className: VisionStatusPanel_module_css_default.minorButton,
							onClick: () => {
								load();
							},
							children: t("vision.refresh")
						})]
					}),
					status === null ? (0, react_jsx_runtime.jsx)("p", {
						className: VisionStatusPanel_module_css_default.note,
						children: t("vision.loading")
					}) : (0, react_jsx_runtime.jsxs)("div", {
						className: VisionStatusPanel_module_css_default.card,
						children: [
							!status.mounted && (0, react_jsx_runtime.jsx)("p", {
								className: VisionStatusPanel_module_css_default.warn,
								children: t("vision.notMounted")
							}),
							(0, react_jsx_runtime.jsx)(Row, {
								label: t("vision.enabled"),
								children: (0, react_jsx_runtime.jsx)("span", {
									className: status.enabled ? VisionStatusPanel_module_css_default.badgeOk : VisionStatusPanel_module_css_default.badgeMuted,
									children: status.enabled ? t("vision.on") : t("vision.off")
								})
							}),
							(0, react_jsx_runtime.jsx)(Row, {
								label: t("vision.admission"),
								children: (0, react_jsx_runtime.jsx)("span", {
									className: status.admissionActive ? VisionStatusPanel_module_css_default.badgeOk : VisionStatusPanel_module_css_default.badgeMuted,
									children: status.admissionActive ? t("vision.patched") : t("vision.notPatched")
								})
							}),
							(0, react_jsx_runtime.jsx)(Row, {
								label: t("vision.harnessTitle"),
								children: status.harnessModels.length === 0 ? (0, react_jsx_runtime.jsx)("span", {
									className: VisionStatusPanel_module_css_default.muted,
									children: t("vision.harnessNone")
								}) : (0, react_jsx_runtime.jsx)("span", {
									className: VisionStatusPanel_module_css_default.list,
									children: status.harnessModels.map((model) => (0, react_jsx_runtime.jsxs)("code", {
										className: VisionStatusPanel_module_css_default.code,
										children: [
											model.provider,
											"/",
											model.model
										]
									}, `${model.provider}/${model.model}`))
								})
							}),
							(0, react_jsx_runtime.jsx)(Row, {
								label: t("vision.endpointTitle"),
								children: status.endpointConfigured ? (0, react_jsx_runtime.jsx)("code", {
									className: VisionStatusPanel_module_css_default.code,
									children: status.endpointModel
								}) : (0, react_jsx_runtime.jsx)("span", {
									className: VisionStatusPanel_module_css_default.muted,
									children: t("vision.endpointNone")
								})
							}),
							(0, react_jsx_runtime.jsx)(Row, {
								label: t("vision.keySource"),
								children: (0, react_jsx_runtime.jsx)("span", {
									className: VisionStatusPanel_module_css_default.muted,
									children: t(keySourceKey(status.apiKeySource))
								})
							}),
							(0, react_jsx_runtime.jsx)(Row, {
								label: t("vision.ollama"),
								children: status.ollamaDetected ? (0, react_jsx_runtime.jsx)("span", {
									className: VisionStatusPanel_module_css_default.badgeOk,
									children: t("vision.ollamaModel", { model: status.ollamaModel ?? "" })
								}) : (0, react_jsx_runtime.jsx)("span", {
									className: VisionStatusPanel_module_css_default.muted,
									children: t("vision.ollamaNone")
								})
							}),
							(0, react_jsx_runtime.jsx)(Row, {
								label: t("vision.cache"),
								children: (0, react_jsx_runtime.jsx)("span", {
									className: VisionStatusPanel_module_css_default.muted,
									children: t("vision.cacheEntries", { count: String(status.cacheSize) })
								})
							}),
							(0, react_jsx_runtime.jsx)(Row, {
								label: t("vision.lastError"),
								children: status.lastError === null ? (0, react_jsx_runtime.jsx)("span", {
									className: VisionStatusPanel_module_css_default.muted,
									children: t("vision.lastErrorNone")
								}) : (0, react_jsx_runtime.jsx)("span", {
									className: VisionStatusPanel_module_css_default.failure,
									children: status.lastError
								})
							}),
							(0, react_jsx_runtime.jsx)(Row, {
								label: t("vision.failuresTitle"),
								children: status.failures.length === 0 ? (0, react_jsx_runtime.jsx)("span", {
									className: VisionStatusPanel_module_css_default.muted,
									children: t("vision.failuresNone")
								}) : (0, react_jsx_runtime.jsx)("div", {
									className: VisionStatusPanel_module_css_default.failures,
									children: status.failures.map((failure, index) => (0, react_jsx_runtime.jsxs)("div", {
										className: VisionStatusPanel_module_css_default.failureEntry,
										children: [
											(0, react_jsx_runtime.jsx)("span", {
												className: VisionStatusPanel_module_css_default.badgeMuted,
												children: t(failureSourceKey(failure.source))
											}),
											(0, react_jsx_runtime.jsx)("span", {
												className: VisionStatusPanel_module_css_default.failureTime,
												children: new Date(failure.time).toLocaleTimeString()
											}),
											(0, react_jsx_runtime.jsx)("code", {
												className: VisionStatusPanel_module_css_default.code,
												children: failure.label
											}),
											(0, react_jsx_runtime.jsx)("span", {
												className: VisionStatusPanel_module_css_default.failureMessage,
												children: failure.message
											})
										]
									}, `${failure.time}-${index}`))
								})
							})
						]
					}),
					(0, react_jsx_runtime.jsx)("p", {
						className: VisionStatusPanel_module_css_default.hint,
						children: t("vision.hint")
					})
				]
			});
		}
		//#endregion
		//#region \0dsh-css:D:\Documents\Dev-Repo\deepseek-harness\dsh-plugins\dsh-web-enhanced\src\client\settings\SettingsSection.module.css.mjs
		const css$2 = ".mbowna_root{flex-direction:column;gap:14px;min-height:0;display:flex}.mbowna_tabs{border-bottom:1px solid var(--dsw-alias-border-l1,#0000000a);flex:none;gap:4px;display:flex}.mbowna_tab,.mbowna_tabActive{color:inherit;cursor:pointer;font:inherit;background:0 0;border:none;border-bottom:2px solid #0000;padding:6px 12px;font-size:14px;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s}.mbowna_tab{color:var(--dsw-alias-label-secondary,#61666b)}.mbowna_tab:hover{background:var(--dsw-alias-interactive-bg-hover,#2631480f);color:var(--dsw-alias-label-primary,#0f1115)}.mbowna_tab:focus-visible,.mbowna_tabActive:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}.mbowna_tabActive{border-bottom-color:var(--dsw-alias-state-business-primary,#4176e6);color:var(--dsw-alias-label-primary,#0f1115);font-weight:600}.mbowna_body{scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l3,#0000001f) transparent;flex-direction:column;flex:1;min-height:0;display:flex;overflow:auto}@media (prefers-reduced-motion:reduce){.mbowna_tab,.mbowna_tabActive{transition:none}}";
		const tagId$2 = "dsh-web-enhanced/SettingsSection.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$2) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId$2;
			tag.textContent = css$2;
			document.head.appendChild(tag);
		}
		var SettingsSection_module_css_default = {
			"body": "mbowna_body",
			"root": "mbowna_root",
			"tab": "mbowna_tab",
			"tabActive": "mbowna_tabActive",
			"tabs": "mbowna_tabs"
		};
		//#endregion
		//#region lib/types/client/settings/SettingsSection.js
		/**
		* The plugin's own Settings page.
		*
		* Registered into `settings.section`, the root list slot the settings shell
		* projects into its nav list: each registration's `id`, `order`, and `label`
		* become one nav row, and the shell renders only the selected section's
		* component. That is the whole contribution contract — the icon comes from the
		* shell's own id allowlist (an unknown id gets the generic one) and nothing
		* else about the nav is ours to decide.
		*
		* The page carries its own tabs because it hosts five unrelated things:
		* managing what the profile has installed, general settings (model-request
		* retry), configuring image understanding, switching the interface skin, and
		* describing what this plugin is. None deserves a separate nav row.
		* @module dsh-web-enhanced/src/client/settings/SettingsSection
		*/
		/** The web-enhanced settings page. */
		function SettingsSection({ remote, t, skin }) {
			const [tab, setTab] = (0, react.useState)("plugins");
			const tabs = [
				{
					id: "plugins",
					label: t("settings.tab.plugins")
				},
				{
					id: "general",
					label: t("settings.tab.general")
				},
				{
					id: "vision",
					label: t("settings.tab.vision")
				},
				{
					id: "skins",
					label: t("settings.tab.skins")
				},
				{
					id: "about",
					label: t("settings.tab.about")
				}
			];
			return (0, react_jsx_runtime.jsxs)("div", {
				className: SettingsSection_module_css_default.root,
				children: [(0, react_jsx_runtime.jsx)("div", {
					className: SettingsSection_module_css_default.tabs,
					role: "tablist",
					children: tabs.map((entry) => (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						role: "tab",
						"aria-selected": tab === entry.id,
						className: tab === entry.id ? SettingsSection_module_css_default.tabActive : SettingsSection_module_css_default.tab,
						onClick: () => {
							setTab(entry.id);
						},
						children: entry.label
					}, entry.id))
				}), (0, react_jsx_runtime.jsxs)("div", {
					className: SettingsSection_module_css_default.body,
					children: [
						tab === "plugins" && (0, react_jsx_runtime.jsx)(PluginManager, {
							remote,
							t
						}),
						tab === "general" && (0, react_jsx_runtime.jsx)(GeneralSettingsPanel, {
							remote,
							t
						}),
						tab === "vision" && (0, react_jsx_runtime.jsx)(VisionStatusPanel, {
							remote,
							t
						}),
						tab === "skins" && (0, react_jsx_runtime.jsx)(SkinPanel, {
							skin,
							t
						}),
						tab === "about" && (0, react_jsx_runtime.jsx)(AboutPanel, { t })
					]
				})]
			});
		}
		//#endregion
		//#region lib/types/client/model-capabilities/settings-draft.js
		/**
		* Draft model for the Model Capabilities settings page.
		*
		* Every card edits one user-settings subtree with the same minimal path-op
		* discipline as the host Models page: the draft is cloned from the redacted
		* `user` layer, unknown keys survive an apply untouched, and only changed
		* top-level keys become `settings.mutate` ops. That way the page can name the
		* fields it owns (`input`, `reasoningEfforts`, route-level defaults) without
		* ever rebuilding a subtree from a partial descriptor.
		* @module dsh-web-enhanced/src/client/model-capabilities/settings-draft
		*/
		/** Namespace owning the DeepSeek route-level thinking fields. */
		const DEEPSEEK_NS = "llm-deepseek";
		/** Namespace owning pi-ai provider profiles and per-model capabilities. */
		const PI_AI_NS = "llm-pi-ai";
		/** Every request modality a pi-ai model may declare. */
		const MODALITIES = ["text", "image"];
		/** Every pi-ai thinking level, in canonical escalation order. */
		const THINKING_LEVELS = [
			"off",
			"minimal",
			"low",
			"medium",
			"high",
			"xhigh",
			"max"
		];
		/** Whether a value is a plain data object (not an array or null). */
		function isRecord(value) {
			return typeof value === "object" && value !== null && !Array.isArray(value);
		}
		/** Read a value as a record, defaulting every non-record to `{}`. */
		function recordOf(value) {
			return isRecord(value) ? value : {};
		}
		/** Deep-clone a value as a record, defaulting every non-record to `{}`. */
		function cloneRecord(value) {
			return structuredClone(recordOf(value));
		}
		/**
		* A user-section subtree as a plain draft object (absent → empty).
		* @param namespace - the namespace whose redacted user layer is read.
		* @param path - path from the section root to the edited subtree.
		*/
		function draftAt(namespace, path) {
			return cloneRecord((0, _deepseek_ai_dsh_client_schema_form.getPath)(namespace.user, path));
		}
		/**
		* The minimal path ops carrying `after` over `before`. Only keys observed in
		* the draft are named, so redacted secret fields and fields outside the card
		* survive an apply unchanged.
		* @param base - path of the edited subtree inside the user section.
		* @param before - the subtree as loaded, or undefined when it is new.
		* @param after - the subtree as edited.
		* @returns ordered set/unset ops; empty when nothing changed.
		*/
		function pathOps(base, before, after) {
			const previous = recordOf(before);
			const ops = [];
			for (const [key, value] of Object.entries(after)) {
				if (JSON.stringify(previous[key]) === JSON.stringify(value)) continue;
				ops.push({
					op: "set",
					path: [...base, key],
					value
				});
			}
			for (const key of Object.keys(previous)) if (!(key in after)) ops.push({
				op: "unset",
				path: [...base, key]
			});
			return ops;
		}
		/** Human text for a rejected wire call. */
		function messageOf(error) {
			return error instanceof Error ? error.message : String(error);
		}
		/**
		* Apply one card's draft through path-addressed settings ops.
		* @param args - namespace, subtree, before/after values, and revision facts.
		* @returns the new committed subtree/revision, or the failure to show.
		*/
		async function applyDraft(args) {
			const { api, ns, path, before, after, expectedRevision, conflictText } = args;
			const ops = pathOps(path, before, after);
			if (ops.length === 0) return {
				ok: true,
				committed: before,
				revision: expectedRevision
			};
			try {
				const response = await api.settings.mutate({
					ns,
					ops,
					expectedRevision
				});
				if (!response.result.ok) return {
					ok: false,
					failure: response.result.error.code === "settings-conflict" ? conflictText : response.result.error.message
				};
				return {
					ok: true,
					committed: (0, _deepseek_ai_dsh_client_schema_form.getPath)(response.result.value.user, path),
					revision: response.result.value.revision
				};
			} catch (error) {
				return {
					ok: false,
					failure: messageOf(error)
				};
			}
		}
		/** Whether a value is a valid pi-ai `input` modality list. */
		function validInputList(value) {
			return Array.isArray(value) && value.every((modality) => MODALITIES.includes(modality));
		}
		/** Validate one `reasoningEfforts` dict against the adapter's resolution rules. */
		function reasoningFailure(value) {
			if (!isRecord(value)) return "reasoningWireRequired";
			const entries = Object.entries(value);
			if (entries.length === 0 || !entries.some(([level]) => level !== "off")) return "reasoningNeedLevel";
			for (const [level, wire] of entries) {
				if (!THINKING_LEVELS.includes(level)) return "reasoningWireRequired";
				if (level === "off") {
					if (wire !== null && (typeof wire !== "string" || wire.length === 0)) return "reasoningWireRequired";
				} else if (typeof wire !== "string" || wire.length === 0) return "reasoningWireRequired";
			}
		}
		/** Validate the capability fields of one model entry (`models` row or override). */
		function modelCapabilitiesFailure(entry) {
			const input = entry["input"];
			if (input !== void 0 && !validInputList(input)) return "modelInputInvalid";
			const efforts = entry["reasoningEfforts"];
			if (efforts !== void 0 && efforts !== false) {
				const failure = reasoningFailure(efforts);
				if (failure !== void 0) return failure;
			}
		}
		/**
		* Drop empty `modelOverrides` entries and an emptied dict before saving.
		* An override whose every capability field was removed has nothing left to
		* say, so it returns to inheritance instead of lingering as `{}`.
		* @param draft - the provider profile draft.
		* @returns a normalized copy.
		*/
		function normalizePiAiDraft(draft) {
			const next = { ...draft };
			const overrides = next["modelOverrides"];
			if (!isRecord(overrides)) return next;
			const cleaned = {};
			for (const [id, entry] of Object.entries(overrides)) {
				if (!isRecord(entry) || Object.keys(entry).length === 0) continue;
				cleaned[id] = entry;
			}
			if (Object.keys(cleaned).length > 0) next["modelOverrides"] = cleaned;
			else delete next["modelOverrides"];
			return next;
		}
		/**
		* Validate one pi-ai provider profile draft before it is written.
		* @param draft - the provider profile draft.
		* @returns the first localized failure key, or undefined when it may apply.
		*/
		function validatePiAiDraft(draft) {
			const defaultInput = draft["defaultInput"];
			if (defaultInput !== void 0 && (!validInputList(defaultInput) || defaultInput.length === 0)) return "defaultInputEmpty";
			const models = draft["models"];
			if (models !== void 0) {
				if (!Array.isArray(models)) return "modelInputInvalid";
				for (const entry of models) {
					if (!isRecord(entry)) return "modelInputInvalid";
					const failure = modelCapabilitiesFailure(entry);
					if (failure !== void 0) return failure;
				}
			}
			const overrides = draft["modelOverrides"];
			if (overrides !== void 0) {
				if (!isRecord(overrides)) return "modelInputInvalid";
				for (const [id, entry] of Object.entries(overrides)) {
					if (id.length === 0) return "modelOverrideEmptyId";
					if (!isRecord(entry)) return "modelInputInvalid";
					const failure = modelCapabilitiesFailure(entry);
					if (failure !== void 0) return failure;
				}
			}
		}
		/**
		* Validate the DeepSeek route-level thinking fields. The adapter rejects
		* `thinking: disabled` beside a non-off reasoning effort, so the card
		* refuses that combination before spending a wire round trip.
		* @param draft - the whole llm-deepseek user-section draft.
		* @returns the first localized failure key, or undefined when it may apply.
		*/
		function validateDeepSeekDraft(draft) {
			const thinking = draft["thinking"];
			if (thinking !== void 0 && thinking !== "enabled" && thinking !== "disabled") return "thinkingInvalid";
			const effort = draft["reasoningEffort"];
			if (effort !== void 0 && effort !== "off" && effort !== "high" && effort !== "max") return "reasoningEffortInvalid";
			if (thinking === "disabled" && effort !== void 0 && effort !== "off") return "reasoningDisabledConflict";
		}
		//#endregion
		//#region lib/types/client/model-capabilities/capability-join.js
		/**
		* Pure provider/model joins behind the Model Capabilities page: which
		* directory entries belong on the page and what override candidates a
		* provider offers. Kept separate from the snapshot store so node-env tests
		* can exercise the decisions without loading the browser runtime module.
		* @module dsh-web-enhanced/src/client/model-capabilities/capability-join
		*/
		/**
		* Whether a directory entry belongs on the capabilities page. DeepSeek always
		* does (its fields live at the section root); a pi-ai route is shown once it
		* is configured, active, or hand-declared — dormant catalog providers stay on
		* the ordinary Models page, where their first profile belongs.
		* @param entry - one configurable-provider directory entry.
		* @param namespace - its settings namespace view, when the host has one.
		* @returns whether the page renders a card for the entry.
		*/
		function visibleCapabilityProvider(entry, namespace) {
			if (entry.settingsNs === "llm-deepseek") return true;
			if (entry.settingsNs !== "llm-pi-ai") return false;
			if (entry.settingsPath.length === 0) return false;
			if (entry.active || entry.declared === true) return true;
			return namespace !== void 0 && (0, _deepseek_ai_dsh_client_schema_form.getPath)(namespace.user, entry.settingsPath) !== void 0;
		}
		/**
		* Effective model options for a provider, preferring the live catalog and
		* falling back to the settings layers so a dormant/declared route still has
		* candidates.
		* @param namespace - the provider's settings namespace view.
		* @param path - the provider profile path.
		* @param catalog - live catalog models for the route (possibly empty).
		* @returns deduplicated options in display order.
		*/
		function modelOptionsOf(namespace, path, catalog) {
			const seen = /* @__PURE__ */ new Set();
			const options = [];
			const push = (id, name) => {
				if (typeof id !== "string" || id.length === 0 || seen.has(id)) return;
				seen.add(id);
				options.push({
					id,
					...typeof name === "string" && name.length > 0 ? { name } : {}
				});
			};
			for (const model of catalog) push(model.id, model.name);
			for (const layer of [namespace.value, namespace.base]) {
				const models = (0, _deepseek_ai_dsh_client_schema_form.getPath)(layer, [...path, "models"]);
				if (!Array.isArray(models)) continue;
				for (const entry of models) {
					if (typeof entry !== "object" || entry === null || Array.isArray(entry)) continue;
					push(entry["id"], entry["name"]);
				}
			}
			for (const layer of [namespace.value, namespace.base]) {
				const overrides = (0, _deepseek_ai_dsh_client_schema_form.getPath)(layer, [...path, "modelOverrides"]);
				if (typeof overrides !== "object" || overrides === null || Array.isArray(overrides)) continue;
				for (const id of Object.keys(overrides)) push(id, void 0);
			}
			return options;
		}
		//#endregion
		//#region lib/types/client/model-capabilities/store.js
		/**
		* Snapshot store behind the Model Capabilities settings page. It joins three
		* wire facts, all already served by the host for the ordinary Models page:
		* the configurable-provider directory (`llm.providers`), the settings
		* namespaces (`settings.describe`), and the live model catalog (`llm.models`)
		* used only to offer override candidates. The host stays the single fact
		* source; every edit writes through `settings.mutate`.
		* @module dsh-web-enhanced/src/client/model-capabilities/store
		*/
		/**
		* Refresh the page snapshot only after its first load: an unopened page must
		* not fetch on background invalidations.
		* @param controller - the page store.
		*/
		function refreshIfLoaded(controller) {
			if (controller.store.getSnapshot().status === "idle") return;
			controller.load();
		}
		/** The Model Capabilities page controller (one per settings surface). */
		var CapabilitiesStore = class {
			api;
			/** The snapshot the section renders from. */
			store = (0, _deepseek_ai_dsh_client_runtime_client.createSnapshotStore)({
				status: "idle",
				error: null,
				writable: false,
				providers: [],
				namespaces: /* @__PURE__ */ new Map(),
				modelsByProvider: /* @__PURE__ */ new Map(),
				modelFailures: []
			});
			/** Latest load wins; an older response never overwrites a newer one. */
			generation = 0;
			/**
			* @param api - the wire face (settings and llm domains).
			*/
			constructor(api) {
				this.api = api;
			}
			/**
			* Refresh the whole page snapshot: providers, namespaces, and the model
			* catalog in parallel. A failure of either directory keeps the last good
			* rows and surfaces the error; a model-catalog failure alone degrades the
			* override picker rather than the page.
			* @returns nothing; the snapshot carries the outcome.
			*/
			async load() {
				const generation = ++this.generation;
				this.store.update((s) => {
					s.status = "loading";
					s.error = null;
				});
				let providers;
				let writable;
				let views;
				let groups = [];
				let modelFailures = [];
				try {
					const [providersResponse, settingsResponse, modelsResponse] = await Promise.all([
						this.api.llm.providers({}),
						this.api.settings.describe({}),
						this.api.llm.models({})
					]);
					if (!providersResponse.result.ok) throw new Error(providersResponse.result.error.message);
					if (!settingsResponse.result.ok) throw new Error(settingsResponse.result.error.message);
					providers = providersResponse.result.value.providers;
					writable = settingsResponse.result.value.writable;
					views = settingsResponse.result.value.namespaces;
					if (modelsResponse.result.ok) {
						groups = modelsResponse.result.value.groups;
						modelFailures = modelsResponse.result.value.failures;
					}
				} catch (error) {
					if (generation !== this.generation) return;
					this.store.update((s) => {
						s.status = "error";
						s.error = error instanceof Error ? error.message : String(error);
					});
					return;
				}
				const namespaces = new Map(views.map((view) => [view.ns, view]));
				const visible = providers.filter((entry) => visibleCapabilityProvider(entry, namespaces.get(entry.settingsNs)));
				const modelsByProvider = new Map(groups.map((group) => [group.id, group.models]));
				if (generation !== this.generation) return;
				this.store.update((s) => {
					s.status = "ready";
					s.error = null;
					s.writable = writable;
					s.providers = visible;
					s.namespaces = namespaces;
					s.modelsByProvider = modelsByProvider;
					s.modelFailures = modelFailures;
				});
			}
		};
		//#endregion
		//#region \0dsh-css:D:\Documents\Dev-Repo\deepseek-harness\dsh-plugins\dsh-web-enhanced\src\client\model-capabilities\ModelCapabilities.module.css.mjs
		const css$1 = "._3LTqlG_root{scrollbar-width:thin;scrollbar-color:var(--dsw-alias-border-l3,#0000001f) transparent;flex-direction:column;flex:1;gap:12px;min-height:0;display:flex;overflow:auto}._3LTqlG_title{color:var(--dsw-alias-label-primary,#0f1115);flex:none;margin:0;font-size:18px;font-weight:600}._3LTqlG_intro,._3LTqlG_notice,._3LTqlG_saved{color:var(--dsw-alias-label-secondary,#61666b);flex:none;margin:0;font-size:13px;line-height:1.5}._3LTqlG_saved{color:var(--dsw-alias-state-success,#2e8b57)}._3LTqlG_error{color:var(--dsw-alias-state-danger,#d64a4a);flex:none;margin:0;font-size:13px;line-height:1.5}._3LTqlG_card{border:1px solid var(--dsw-alias-border-l1,#0000000a);background:var(--dsw-alias-bg-card,#fff9);border-radius:10px;flex:none;overflow:hidden}._3LTqlG_summary{cursor:pointer;user-select:none;align-items:center;gap:8px;padding:10px 12px;list-style:none;display:flex}._3LTqlG_summary::-webkit-details-marker{display:none}._3LTqlG_summary:hover{background:var(--dsw-alias-interactive-bg-hover,#2631480f)}._3LTqlG_cardTitle{color:var(--dsw-alias-label-primary,#0f1115);font-size:14px;font-weight:600}._3LTqlG_cardRoute{color:var(--dsw-alias-label-tertiary,#8f949b);font-size:12px}._3LTqlG_cardBody{border-top:1px solid var(--dsw-alias-border-l1,#0000000a);flex-direction:column;gap:12px;padding:12px;display:flex}._3LTqlG_section{flex-direction:column;gap:10px;display:flex}._3LTqlG_sectionTitle{color:var(--dsw-alias-label-primary,#0f1115);margin:0;font-size:13px;font-weight:600}._3LTqlG_field{flex-direction:column;gap:6px;display:flex}._3LTqlG_fieldHead{flex-direction:column;gap:2px;display:flex}._3LTqlG_fieldLabel{color:var(--dsw-alias-label-secondary,#61666b);font-size:12px;font-weight:500}._3LTqlG_fieldHint{color:var(--dsw-alias-label-tertiary,#8f949b);margin:0;font-size:12px;line-height:1.45}._3LTqlG_select,._3LTqlG_input{box-sizing:border-box;border:1px solid var(--dsw-alias-border-l2,#00000017);background:var(--dsw-alias-bg-base,#fff);width:100%;max-width:340px;color:var(--dsw-alias-label-primary,#0f1115);font:inherit;border-radius:6px;padding:6px 8px;font-size:13px}._3LTqlG_select:focus-visible,._3LTqlG_input:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}._3LTqlG_checkRow{flex-wrap:wrap;align-items:center;gap:10px;display:flex}._3LTqlG_check{color:var(--dsw-alias-label-primary,#0f1115);cursor:pointer;align-items:center;gap:5px;font-size:13px;display:inline-flex}._3LTqlG_inheritBadge{color:var(--dsw-alias-label-tertiary,#8f949b);font-size:12px}._3LTqlG_reasoningEditor{flex-direction:column;gap:8px;display:flex}._3LTqlG_reasoningCustom{flex-direction:column;gap:6px;display:flex}._3LTqlG_reasoningLevelRow{align-items:center;gap:10px;display:flex}._3LTqlG_reasoningLevelRow ._3LTqlG_input{max-width:220px}._3LTqlG_modelHead{flex-wrap:wrap;align-items:baseline;gap:8px;display:flex}._3LTqlG_modelList{flex-direction:column;gap:8px;display:flex}._3LTqlG_modelRow{border:1px solid var(--dsw-alias-border-l1,#0000000a);border-radius:8px;flex-direction:column;gap:10px;padding:10px;display:flex}._3LTqlG_modelId{color:var(--dsw-alias-label-primary,#0f1115);font-family:ui-monospace,SFMono-Regular,Consolas,monospace;font-size:13px}._3LTqlG_modelName{color:var(--dsw-alias-label-secondary,#61666b);font-size:12px}._3LTqlG_addOverrideRow{flex-wrap:wrap;align-items:center;gap:8px;display:flex}._3LTqlG_actions{border-top:1px solid var(--dsw-alias-border-l1,#0000000a);justify-content:flex-end;gap:8px;padding-top:10px;display:flex}._3LTqlG_button,._3LTqlG_buttonPrimary,._3LTqlG_linkButton{font:inherit;cursor:pointer;border-radius:6px;padding:6px 12px;font-size:13px;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s}._3LTqlG_button{border:1px solid var(--dsw-alias-border-l2,#00000017);color:var(--dsw-alias-label-primary,#0f1115);background:0 0}._3LTqlG_button:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#2631480f)}._3LTqlG_buttonPrimary{background:var(--dsw-alias-state-business-primary,#4176e6);color:#fff;border:1px solid #0000}._3LTqlG_buttonPrimary:hover:not(:disabled){filter:brightness(1.05)}._3LTqlG_linkButton{color:var(--dsw-alias-state-danger,#d64a4a);background:0 0;border:none;padding:2px 6px}._3LTqlG_linkButton:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#2631480f)}._3LTqlG_button:disabled,._3LTqlG_buttonPrimary:disabled,._3LTqlG_linkButton:disabled,._3LTqlG_select:disabled,._3LTqlG_input:disabled{cursor:not-allowed;opacity:.5}._3LTqlG_button:focus-visible,._3LTqlG_buttonPrimary:focus-visible,._3LTqlG_linkButton:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}@media (prefers-reduced-motion:reduce){._3LTqlG_button,._3LTqlG_buttonPrimary,._3LTqlG_linkButton{transition:none}}";
		const tagId$1 = "dsh-web-enhanced/ModelCapabilities.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-web-enhanced";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var ModelCapabilities_module_css_default = {
			"actions": "_3LTqlG_actions",
			"addOverrideRow": "_3LTqlG_addOverrideRow",
			"button": "_3LTqlG_button",
			"buttonPrimary": "_3LTqlG_buttonPrimary",
			"card": "_3LTqlG_card",
			"cardBody": "_3LTqlG_cardBody",
			"cardRoute": "_3LTqlG_cardRoute",
			"cardTitle": "_3LTqlG_cardTitle",
			"check": "_3LTqlG_check",
			"checkRow": "_3LTqlG_checkRow",
			"error": "_3LTqlG_error",
			"field": "_3LTqlG_field",
			"fieldHead": "_3LTqlG_fieldHead",
			"fieldHint": "_3LTqlG_fieldHint",
			"fieldLabel": "_3LTqlG_fieldLabel",
			"inheritBadge": "_3LTqlG_inheritBadge",
			"input": "_3LTqlG_input",
			"intro": "_3LTqlG_intro",
			"linkButton": "_3LTqlG_linkButton",
			"modelHead": "_3LTqlG_modelHead",
			"modelId": "_3LTqlG_modelId",
			"modelList": "_3LTqlG_modelList",
			"modelName": "_3LTqlG_modelName",
			"modelRow": "_3LTqlG_modelRow",
			"notice": "_3LTqlG_notice",
			"reasoningCustom": "_3LTqlG_reasoningCustom",
			"reasoningEditor": "_3LTqlG_reasoningEditor",
			"reasoningLevelRow": "_3LTqlG_reasoningLevelRow",
			"root": "_3LTqlG_root",
			"saved": "_3LTqlG_saved",
			"section": "_3LTqlG_section",
			"sectionTitle": "_3LTqlG_sectionTitle",
			"select": "_3LTqlG_select",
			"summary": "_3LTqlG_summary",
			"title": "_3LTqlG_title"
		};
		//#endregion
		//#region lib/types/client/model-capabilities/ModelCapabilities.js
		/**
		* The Model Capabilities settings page: a separate settings section right
		* after the host Models page. It edits exactly what the host Models editor
		* deliberately leaves out:
		*
		* - llm-deepseek (whole section): `thinking` and `reasoningEffort`.
		* - llm-pi-ai provider profiles: `defaultInput` / `reasoning`, plus every
		*   model's `input` and `reasoningEfforts` — through `models` rows when the
		*   profile already owns the list, through minimal `modelOverrides` entries
		*   for catalog routes otherwise.
		*
		* Every card applies path-addressed settings ops against the user layer it
		* cloned, so fields edited by the host Models page survive untouched.
		* @module dsh-web-enhanced/src/client/model-capabilities/ModelCapabilities
		*/
		const LEVEL_KEYS = {
			off: "modelCapabilities.reasoningLevelOff",
			minimal: "modelCapabilities.reasoningLevelMinimal",
			low: "modelCapabilities.reasoningLevelLow",
			medium: "modelCapabilities.reasoningLevelMedium",
			high: "modelCapabilities.reasoningLevelHigh",
			xhigh: "modelCapabilities.reasoningLevelXHigh",
			max: "modelCapabilities.reasoningLevelMax"
		};
		/** Render the settings section content column. */
		function ModelCapabilitiesSection(props) {
			return (0, react_jsx_runtime.jsx)(Loaded, { ...props });
		}
		function Loaded({ controller, useSnapshot, api, t }) {
			const state = useSnapshot((snapshot) => snapshot);
			if (state.status === "idle") controller.load();
			if (state.status === "error") {
				const errorText = state.error ?? "";
				return (0, react_jsx_runtime.jsxs)("div", {
					className: ModelCapabilities_module_css_default.root,
					children: [(0, react_jsx_runtime.jsx)("p", {
						className: ModelCapabilities_module_css_default.error,
						children: `${t("modelCapabilities.loadFailed")}: ${errorText}`
					}), (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: ModelCapabilities_module_css_default.button,
						onClick: () => {
							controller.load();
						},
						children: t("modelCapabilities.retry")
					})]
				});
			}
			const deepseek = state.providers.find((entry) => entry.settingsNs === DEEPSEEK_NS);
			const piAi = state.providers.filter((entry) => entry.settingsNs === PI_AI_NS);
			const deepseekNamespace = deepseek === void 0 ? void 0 : state.namespaces.get(DEEPSEEK_NS);
			return (0, react_jsx_runtime.jsxs)("div", {
				className: ModelCapabilities_module_css_default.root,
				children: [
					(0, react_jsx_runtime.jsx)("h2", {
						className: ModelCapabilities_module_css_default.title,
						children: t("modelCapabilities.title")
					}),
					(0, react_jsx_runtime.jsx)("p", {
						className: ModelCapabilities_module_css_default.intro,
						children: t("modelCapabilities.intro")
					}),
					!state.writable && state.status === "ready" ? (0, react_jsx_runtime.jsx)("p", {
						className: ModelCapabilities_module_css_default.notice,
						children: t("modelCapabilities.readOnly")
					}) : null,
					state.modelFailures.map((failure) => (0, react_jsx_runtime.jsx)("p", {
						className: ModelCapabilities_module_css_default.notice,
						children: t("modelCapabilities.catalogError").replace("{message}", failure.message)
					}, failure.id)),
					state.status === "loading" && deepseek === void 0 && piAi.length === 0 ? (0, react_jsx_runtime.jsx)("p", {
						className: ModelCapabilities_module_css_default.notice,
						children: t("modelCapabilities.loading")
					}) : null,
					deepseek !== void 0 && deepseekNamespace !== void 0 ? (0, react_jsx_runtime.jsx)(DeepSeekCapabilitiesCard, {
						entry: deepseek,
						namespace: deepseekNamespace,
						api,
						t,
						readOnly: !state.writable
					}) : null,
					piAi.map((entry) => {
						const namespace = state.namespaces.get(PI_AI_NS);
						/* v8 ignore next -- the join only shows rows whose namespace resolved */
						if (namespace === void 0) return null;
						return (0, react_jsx_runtime.jsx)(PiAiCapabilitiesCard, {
							entry,
							namespace,
							catalog: state.modelsByProvider.get(entry.provider) ?? [],
							api,
							t,
							readOnly: !state.writable
						}, entry.provider);
					}),
					deepseek === void 0 && piAi.length === 0 && state.status === "ready" ? (0, react_jsx_runtime.jsx)("p", {
						className: ModelCapabilities_module_css_default.notice,
						children: t("modelCapabilities.noProviders")
					}) : null
				]
			});
		}
		function CardActions({ busy, disabled, saved, failure, t, onReset, onApply }) {
			return (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [
				saved && failure === void 0 ? (0, react_jsx_runtime.jsx)("p", {
					className: ModelCapabilities_module_css_default.saved,
					role: "status",
					children: t("modelCapabilities.saved")
				}) : null,
				failure !== void 0 ? (0, react_jsx_runtime.jsx)("p", {
					className: ModelCapabilities_module_css_default.error,
					children: failure
				}) : null,
				(0, react_jsx_runtime.jsxs)("div", {
					className: ModelCapabilities_module_css_default.actions,
					children: [(0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: ModelCapabilities_module_css_default.button,
						disabled,
						onClick: onReset,
						children: t("modelCapabilities.reset")
					}), (0, react_jsx_runtime.jsx)("button", {
						type: "button",
						className: ModelCapabilities_module_css_default.buttonPrimary,
						disabled,
						onClick: onApply,
						children: busy ? t("modelCapabilities.applying") : t("modelCapabilities.apply")
					})]
				})
			] });
		}
		function InputEditor({ value, onChange, disabled, required = false, t }) {
			const list = Array.isArray(value) ? value : [];
			const has = (modality) => list.includes(modality);
			const toggle = (modality) => {
				const next = has(modality) ? list.filter((existing) => existing !== modality) : [...list, modality];
				onChange(next.length === 0 && !required ? void 0 : next);
			};
			return (0, react_jsx_runtime.jsxs)("div", {
				className: ModelCapabilities_module_css_default.checkRow,
				children: [value === void 0 ? (0, react_jsx_runtime.jsx)("span", {
					className: ModelCapabilities_module_css_default.inheritBadge,
					children: t("modelCapabilities.inputInherit")
				}) : null, MODALITIES.map((modality) => (0, react_jsx_runtime.jsxs)("label", {
					className: ModelCapabilities_module_css_default.check,
					children: [(0, react_jsx_runtime.jsx)("input", {
						type: "checkbox",
						checked: has(modality),
						disabled,
						onChange: () => {
							toggle(modality);
						}
					}), (0, react_jsx_runtime.jsx)("span", { children: modality === "text" ? t("modelCapabilities.inputText") : t("modelCapabilities.inputImage") })]
				}, modality))]
			});
		}
		/** Read the reasoning-efforts field as one of the editor's three states. */
		function reasoningModeOf(value) {
			if (value === false) return "none";
			return isRecord(value) ? "custom" : "inherit";
		}
		/** The fixed custom-effort rows, initialized with the common levels. */
		const CUSTOM_REASONING_DEFAULT = {
			off: null,
			high: "high"
		};
		function ReasoningEditor({ value, onChange, disabled, t }) {
			const mode = reasoningModeOf(value);
			const dict = mode === "custom" && isRecord(value) ? value : {};
			const setMode = (next) => {
				if (next === "inherit") onChange(void 0);
				else if (next === "none") onChange(false);
				else onChange(cloneRecord(isRecord(value) ? value : CUSTOM_REASONING_DEFAULT));
			};
			const toggleLevel = (level) => {
				const next = { ...dict };
				if (level in next) delete next[level];
				else next[level] = level === "off" ? null : level;
				onChange(next);
			};
			const setWire = (level, text) => {
				const next = { ...dict };
				if (level === "off") next[level] = text.trim().length === 0 ? null : text;
				else next[level] = text;
				onChange(next);
			};
			const wireText = (level) => {
				const wire = dict[level];
				return wire === null ? "" : typeof wire === "string" ? wire : "";
			};
			return (0, react_jsx_runtime.jsxs)("div", {
				className: ModelCapabilities_module_css_default.reasoningEditor,
				children: [(0, react_jsx_runtime.jsxs)("select", {
					className: ModelCapabilities_module_css_default.select,
					value: mode,
					disabled,
					"aria-label": t("modelCapabilities.reasoning"),
					onChange: (event) => {
						setMode(event.target.value);
					},
					children: [
						(0, react_jsx_runtime.jsx)("option", {
							value: "inherit",
							children: t("modelCapabilities.reasoningInherit")
						}),
						(0, react_jsx_runtime.jsx)("option", {
							value: "none",
							children: t("modelCapabilities.reasoningNone")
						}),
						(0, react_jsx_runtime.jsx)("option", {
							value: "custom",
							children: t("modelCapabilities.reasoningCustom")
						})
					]
				}), mode === "custom" ? (0, react_jsx_runtime.jsxs)("div", {
					className: ModelCapabilities_module_css_default.reasoningCustom,
					children: [(0, react_jsx_runtime.jsx)("p", {
						className: ModelCapabilities_module_css_default.fieldHint,
						children: t("modelCapabilities.reasoningCustomHint")
					}), THINKING_LEVELS.map((level) => (0, react_jsx_runtime.jsxs)("div", {
						className: ModelCapabilities_module_css_default.reasoningLevelRow,
						children: [(0, react_jsx_runtime.jsxs)("label", {
							className: ModelCapabilities_module_css_default.check,
							children: [(0, react_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: level in dict,
								disabled,
								onChange: () => {
									toggleLevel(level);
								}
							}), (0, react_jsx_runtime.jsx)("span", { children: t(LEVEL_KEYS[level]) })]
						}), level in dict ? (0, react_jsx_runtime.jsx)("input", {
							className: ModelCapabilities_module_css_default.input,
							type: "text",
							value: wireText(level),
							placeholder: level === "off" ? t("modelCapabilities.reasoningWireOffPlaceholder") : t("modelCapabilities.reasoningWirePlaceholder"),
							"aria-label": `${t("modelCapabilities.reasoningWire")} ${t(LEVEL_KEYS[level])}`,
							disabled,
							onChange: (event) => {
								setWire(level, event.target.value);
							}
						}) : null]
					}, level))]
				}) : null]
			});
		}
		function DeepSeekCapabilitiesCard({ namespace, api, t, readOnly }) {
			const [draft, setDraft] = (0, react.useState)(() => draftAt(namespace, []));
			const [committedOriginal, setCommittedOriginal] = (0, react.useState)(() => (0, _deepseek_ai_dsh_client_schema_form.getPath)(namespace.user, []));
			const [expectedRevision, setExpectedRevision] = (0, react.useState)(() => namespace.revision);
			const [busy, setBusy] = (0, react.useState)(false);
			const [failure, setFailure] = (0, react.useState)(void 0);
			const [saved, setSaved] = (0, react.useState)(false);
			const disabled = readOnly || busy;
			const stringAt = (key) => {
				const value = draft[key];
				return typeof value === "string" && value.length > 0 ? value : void 0;
			};
			const setField = (key, next) => {
				setSaved(false);
				setFailure(void 0);
				setDraft((current) => next === void 0 ? (0, _deepseek_ai_dsh_client_schema_form.deletePath)(current, [key]) : (0, _deepseek_ai_dsh_client_schema_form.setPath)(current, [key], next));
			};
			const reset = () => {
				setFailure(void 0);
				setSaved(false);
				setDraft(cloneRecord(committedOriginal));
			};
			const apply = async () => {
				setBusy(true);
				setFailure(void 0);
				setSaved(false);
				const validation = validateDeepSeekDraft(draft);
				if (validation !== void 0) {
					setFailure(t(`modelCapabilities.${validation}`));
					setBusy(false);
					return;
				}
				const result = await applyDraft({
					api,
					ns: namespace.ns,
					path: [],
					before: committedOriginal,
					after: draft,
					expectedRevision,
					conflictText: t("modelCapabilities.conflict")
				});
				if (!result.ok) {
					setFailure(t("modelCapabilities.saveError").replace("{message}", result.failure));
					setBusy(false);
					return;
				}
				setCommittedOriginal(result.committed);
				setExpectedRevision(result.revision);
				setDraft(cloneRecord(result.committed));
				setSaved(true);
				setBusy(false);
			};
			return (0, react_jsx_runtime.jsxs)("details", {
				className: ModelCapabilities_module_css_default.card,
				open: true,
				children: [(0, react_jsx_runtime.jsxs)("summary", {
					className: ModelCapabilities_module_css_default.summary,
					children: [(0, react_jsx_runtime.jsx)("span", {
						className: ModelCapabilities_module_css_default.cardTitle,
						children: "DeepSeek"
					}), (0, react_jsx_runtime.jsx)("span", {
						className: ModelCapabilities_module_css_default.cardRoute,
						children: "deepseek-official"
					})]
				}), (0, react_jsx_runtime.jsxs)("div", {
					className: ModelCapabilities_module_css_default.cardBody,
					children: [
						(0, react_jsx_runtime.jsx)("p", {
							className: ModelCapabilities_module_css_default.fieldHint,
							children: t("modelCapabilities.deepseekHint")
						}),
						(0, react_jsx_runtime.jsxs)("label", {
							className: ModelCapabilities_module_css_default.field,
							children: [(0, react_jsx_runtime.jsx)("span", {
								className: ModelCapabilities_module_css_default.fieldLabel,
								children: t("modelCapabilities.thinking")
							}), (0, react_jsx_runtime.jsxs)("select", {
								className: ModelCapabilities_module_css_default.select,
								value: stringAt("thinking") ?? "",
								disabled,
								onChange: (event) => {
									setField("thinking", event.target.value === "" ? void 0 : event.target.value);
								},
								children: [
									(0, react_jsx_runtime.jsx)("option", {
										value: "",
										children: t("modelCapabilities.thinkingInherit")
									}),
									(0, react_jsx_runtime.jsx)("option", {
										value: "enabled",
										children: t("modelCapabilities.thinkingEnabled")
									}),
									(0, react_jsx_runtime.jsx)("option", {
										value: "disabled",
										children: t("modelCapabilities.thinkingDisabled")
									})
								]
							})]
						}),
						(0, react_jsx_runtime.jsxs)("label", {
							className: ModelCapabilities_module_css_default.field,
							children: [(0, react_jsx_runtime.jsx)("span", {
								className: ModelCapabilities_module_css_default.fieldLabel,
								children: t("modelCapabilities.reasoningEffort")
							}), (0, react_jsx_runtime.jsxs)("select", {
								className: ModelCapabilities_module_css_default.select,
								value: stringAt("reasoningEffort") ?? "",
								disabled,
								onChange: (event) => {
									setField("reasoningEffort", event.target.value === "" ? void 0 : event.target.value);
								},
								children: [
									(0, react_jsx_runtime.jsx)("option", {
										value: "",
										children: t("modelCapabilities.reasoningEffortInherit")
									}),
									(0, react_jsx_runtime.jsx)("option", {
										value: "off",
										children: "off"
									}),
									(0, react_jsx_runtime.jsx)("option", {
										value: "high",
										children: "high"
									}),
									(0, react_jsx_runtime.jsx)("option", {
										value: "max",
										children: "max"
									})
								]
							})]
						}),
						(0, react_jsx_runtime.jsx)(CardActions, {
							busy,
							disabled,
							saved,
							failure,
							t,
							onReset: reset,
							onApply: () => {
								apply();
							}
						})
					]
				})]
			});
		}
		function PiAiCapabilitiesCard({ entry, namespace, catalog, api, t, readOnly }) {
			const path = entry.settingsPath;
			const [draft, setDraft] = (0, react.useState)(() => draftAt(namespace, path));
			const [committedOriginal, setCommittedOriginal] = (0, react.useState)(() => (0, _deepseek_ai_dsh_client_schema_form.getPath)(namespace.user, path));
			const [expectedRevision, setExpectedRevision] = (0, react.useState)(() => namespace.revision);
			const [busy, setBusy] = (0, react.useState)(false);
			const [failure, setFailure] = (0, react.useState)(void 0);
			const [saved, setSaved] = (0, react.useState)(false);
			const [addingId, setAddingId] = (0, react.useState)("");
			const disabled = readOnly || busy;
			const configured = (0, _deepseek_ai_dsh_client_schema_form.getPath)(namespace.user, path) !== void 0;
			const stringAt = (key) => {
				const value = draft[key];
				return typeof value === "string" && value.length > 0 ? value : void 0;
			};
			const setField = (key, next) => {
				setSaved(false);
				setFailure(void 0);
				setDraft((current) => next === void 0 ? (0, _deepseek_ai_dsh_client_schema_form.deletePath)(current, [key]) : (0, _deepseek_ai_dsh_client_schema_form.setPath)(current, [key], next));
			};
			const patchListEntry = (index, key, value) => {
				setSaved(false);
				setFailure(void 0);
				setDraft((current) => {
					const models = Array.isArray(current["models"]) ? [...current["models"]] : [];
					const next = { ...recordOf(models[index]) };
					if (value === void 0) delete next[key];
					else next[key] = value;
					models[index] = next;
					return (0, _deepseek_ai_dsh_client_schema_form.setPath)(current, ["models"], models);
				});
			};
			const patchOverride = (id, key, value) => {
				setSaved(false);
				setFailure(void 0);
				setDraft((current) => {
					const next = { ...recordOf(recordOf(current["modelOverrides"])[id]) };
					if (value === void 0) delete next[key];
					else next[key] = value;
					return (0, _deepseek_ai_dsh_client_schema_form.setPath)(current, ["modelOverrides", id], next);
				});
			};
			const removeOverride = (id) => {
				setSaved(false);
				setFailure(void 0);
				setDraft((current) => {
					const next = { ...recordOf(current["modelOverrides"]) };
					delete next[id];
					return Object.keys(next).length === 0 ? (0, _deepseek_ai_dsh_client_schema_form.deletePath)(current, ["modelOverrides"]) : (0, _deepseek_ai_dsh_client_schema_form.setPath)(current, ["modelOverrides"], next);
				});
			};
			const addOverride = () => {
				const id = addingId;
				if (id.length === 0) return;
				setAddingId("");
				setSaved(false);
				setFailure(void 0);
				setDraft((current) => (0, _deepseek_ai_dsh_client_schema_form.setPath)(current, ["modelOverrides", id], { input: ["text"] }));
			};
			const reset = () => {
				setFailure(void 0);
				setSaved(false);
				setDraft(cloneRecord(committedOriginal));
			};
			const apply = async () => {
				setBusy(true);
				setFailure(void 0);
				setSaved(false);
				const normalized = normalizePiAiDraft(draft);
				const validation = validatePiAiDraft(normalized);
				if (validation !== void 0) {
					setFailure(t(`modelCapabilities.${validation}`));
					setBusy(false);
					return;
				}
				const result = await applyDraft({
					api,
					ns: namespace.ns,
					path,
					before: committedOriginal,
					after: normalized,
					expectedRevision,
					conflictText: t("modelCapabilities.conflict")
				});
				if (!result.ok) {
					setFailure(t("modelCapabilities.saveError").replace("{message}", result.failure));
					setBusy(false);
					return;
				}
				setCommittedOriginal(result.committed);
				setExpectedRevision(result.revision);
				setDraft(cloneRecord(result.committed));
				setSaved(true);
				setBusy(false);
			};
			const listMode = (0, _deepseek_ai_dsh_client_schema_form.hasPath)(draft, ["models"]);
			const models = Array.isArray(draft["models"]) ? draft["models"] : [];
			const overrides = recordOf(draft["modelOverrides"]);
			const overrideIds = new Set(Object.keys(overrides));
			const candidates = modelOptionsOf(namespace, path, catalog).filter((option) => !overrideIds.has(option.id));
			return (0, react_jsx_runtime.jsxs)("details", {
				className: ModelCapabilities_module_css_default.card,
				open: configured || entry.active,
				children: [(0, react_jsx_runtime.jsxs)("summary", {
					className: ModelCapabilities_module_css_default.summary,
					children: [(0, react_jsx_runtime.jsx)("span", {
						className: ModelCapabilities_module_css_default.cardTitle,
						children: entry.displayName
					}), (0, react_jsx_runtime.jsx)("span", {
						className: ModelCapabilities_module_css_default.cardRoute,
						children: entry.provider
					})]
				}), (0, react_jsx_runtime.jsxs)("div", {
					className: ModelCapabilities_module_css_default.cardBody,
					children: [
						(0, react_jsx_runtime.jsxs)("section", {
							className: ModelCapabilities_module_css_default.section,
							"aria-label": t("modelCapabilities.routeSection"),
							children: [
								(0, react_jsx_runtime.jsx)("h3", {
									className: ModelCapabilities_module_css_default.sectionTitle,
									children: t("modelCapabilities.routeSection")
								}),
								(0, react_jsx_runtime.jsxs)("div", {
									className: ModelCapabilities_module_css_default.field,
									children: [(0, react_jsx_runtime.jsxs)("div", {
										className: ModelCapabilities_module_css_default.fieldHead,
										children: [(0, react_jsx_runtime.jsx)("span", {
											className: ModelCapabilities_module_css_default.fieldLabel,
											children: t("modelCapabilities.defaultInput")
										}), (0, react_jsx_runtime.jsx)("span", {
											className: ModelCapabilities_module_css_default.fieldHint,
											children: t("modelCapabilities.defaultInputHint")
										})]
									}), (0, react_jsx_runtime.jsx)(InputEditor, {
										value: draft["defaultInput"],
										onChange: (value) => {
											setField("defaultInput", value);
										},
										disabled,
										required: true,
										t
									})]
								}),
								(0, react_jsx_runtime.jsxs)("label", {
									className: ModelCapabilities_module_css_default.field,
									children: [(0, react_jsx_runtime.jsx)("span", {
										className: ModelCapabilities_module_css_default.fieldLabel,
										children: t("modelCapabilities.routeReasoning")
									}), (0, react_jsx_runtime.jsxs)("select", {
										className: ModelCapabilities_module_css_default.select,
										value: stringAt("reasoning") ?? "",
										disabled,
										onChange: (event) => {
											setField("reasoning", event.target.value === "" ? void 0 : event.target.value);
										},
										children: [(0, react_jsx_runtime.jsx)("option", {
											value: "",
											children: t("modelCapabilities.routeReasoningInherit")
										}), THINKING_LEVELS.map((level) => (0, react_jsx_runtime.jsx)("option", {
											value: level,
											children: t(LEVEL_KEYS[level])
										}, level))]
									})]
								})
							]
						}),
						(0, react_jsx_runtime.jsxs)("section", {
							className: ModelCapabilities_module_css_default.section,
							"aria-label": t("modelCapabilities.modelSection"),
							children: [(0, react_jsx_runtime.jsxs)("div", {
								className: ModelCapabilities_module_css_default.modelHead,
								children: [(0, react_jsx_runtime.jsx)("h3", {
									className: ModelCapabilities_module_css_default.sectionTitle,
									children: t("modelCapabilities.modelSection")
								}), (0, react_jsx_runtime.jsx)("span", {
									className: ModelCapabilities_module_css_default.fieldHint,
									children: listMode ? t("modelCapabilities.modelsListModeHint") : t("modelCapabilities.overridesModeHint")
								})]
							}), listMode ? (0, react_jsx_runtime.jsx)("div", {
								className: ModelCapabilities_module_css_default.modelList,
								children: models.map((model, index) => {
									const entry = recordOf(model);
									const id = typeof entry["id"] === "string" ? entry["id"] : "";
									return (0, react_jsx_runtime.jsxs)("div", {
										className: ModelCapabilities_module_css_default.modelRow,
										children: [
											(0, react_jsx_runtime.jsxs)("div", {
												className: ModelCapabilities_module_css_default.modelHead,
												children: [(0, react_jsx_runtime.jsx)("span", {
													className: ModelCapabilities_module_css_default.modelId,
													children: id
												}), typeof entry["name"] === "string" && entry["name"].length > 0 ? (0, react_jsx_runtime.jsx)("span", {
													className: ModelCapabilities_module_css_default.modelName,
													children: entry["name"]
												}) : null]
											}),
											(0, react_jsx_runtime.jsxs)("label", {
												className: ModelCapabilities_module_css_default.field,
												children: [(0, react_jsx_runtime.jsx)("span", {
													className: ModelCapabilities_module_css_default.fieldLabel,
													children: t("modelCapabilities.modelInput")
												}), (0, react_jsx_runtime.jsx)(InputEditor, {
													value: entry["input"],
													onChange: (value) => {
														patchListEntry(index, "input", value);
													},
													disabled,
													t
												})]
											}),
											(0, react_jsx_runtime.jsxs)("label", {
												className: ModelCapabilities_module_css_default.field,
												children: [(0, react_jsx_runtime.jsx)("span", {
													className: ModelCapabilities_module_css_default.fieldLabel,
													children: t("modelCapabilities.reasoning")
												}), (0, react_jsx_runtime.jsx)(ReasoningEditor, {
													value: entry["reasoningEfforts"],
													onChange: (value) => {
														patchListEntry(index, "reasoningEfforts", value);
													},
													disabled,
													t
												})]
											})
										]
									}, index);
								})
							}) : (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [(0, react_jsx_runtime.jsxs)("div", {
								className: ModelCapabilities_module_css_default.addOverrideRow,
								children: [(0, react_jsx_runtime.jsxs)("select", {
									className: ModelCapabilities_module_css_default.select,
									value: addingId,
									disabled: disabled || candidates.length === 0,
									onChange: (event) => {
										setAddingId(event.target.value);
									},
									children: [(0, react_jsx_runtime.jsx)("option", {
										value: "",
										children: t("modelCapabilities.addOverridePlaceholder")
									}), candidates.map((option) => (0, react_jsx_runtime.jsx)("option", {
										value: option.id,
										children: option.name === void 0 ? option.id : `${option.name} (${option.id})`
									}, option.id))]
								}), (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: ModelCapabilities_module_css_default.button,
									disabled: disabled || addingId.length === 0,
									onClick: addOverride,
									children: t("modelCapabilities.addOverride")
								})]
							}), Object.keys(overrides).length === 0 ? (0, react_jsx_runtime.jsx)("p", {
								className: ModelCapabilities_module_css_default.notice,
								children: t("modelCapabilities.emptyOverrides")
							}) : (0, react_jsx_runtime.jsx)("div", {
								className: ModelCapabilities_module_css_default.modelList,
								children: Object.entries(overrides).map(([id, override]) => {
									const entry = recordOf(override);
									return (0, react_jsx_runtime.jsxs)("div", {
										className: ModelCapabilities_module_css_default.modelRow,
										children: [
											(0, react_jsx_runtime.jsxs)("div", {
												className: ModelCapabilities_module_css_default.modelHead,
												children: [(0, react_jsx_runtime.jsx)("span", {
													className: ModelCapabilities_module_css_default.modelId,
													children: id
												}), (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: ModelCapabilities_module_css_default.linkButton,
													disabled,
													"aria-label": t("modelCapabilities.removeOverride"),
													onClick: () => {
														removeOverride(id);
													},
													children: t("modelCapabilities.removeOverride")
												})]
											}),
											(0, react_jsx_runtime.jsxs)("label", {
												className: ModelCapabilities_module_css_default.field,
												children: [(0, react_jsx_runtime.jsx)("span", {
													className: ModelCapabilities_module_css_default.fieldLabel,
													children: t("modelCapabilities.modelInput")
												}), (0, react_jsx_runtime.jsx)(InputEditor, {
													value: entry["input"],
													onChange: (value) => {
														patchOverride(id, "input", value);
													},
													disabled,
													t
												})]
											}),
											(0, react_jsx_runtime.jsxs)("label", {
												className: ModelCapabilities_module_css_default.field,
												children: [(0, react_jsx_runtime.jsx)("span", {
													className: ModelCapabilities_module_css_default.fieldLabel,
													children: t("modelCapabilities.reasoning")
												}), (0, react_jsx_runtime.jsx)(ReasoningEditor, {
													value: entry["reasoningEfforts"],
													onChange: (value) => {
														patchOverride(id, "reasoningEfforts", value);
													},
													disabled,
													t
												})]
											})
										]
									}, id);
								})
							})] })]
						}),
						(0, react_jsx_runtime.jsx)(CardActions, {
							busy,
							disabled,
							saved,
							failure,
							t,
							onReset: reset,
							onApply: () => {
								apply();
							}
						})
					]
				})]
			});
		}
		//#endregion
		//#region lib/types/client/balance/cost.js
		/**
		* Session-cost arithmetic for the balance line.
		*
		* The token-usage projection bills in four buckets (uncached input, cache
		* read, cache write, output) and models.dev prices are USD per one million
		* tokens. The readout is an estimate by design: projections are the host's
		* durable accounting, but a price can lag a vendor's repricing.
		* @module dsh-web-enhanced/src/client/balance/cost
		*/
		/**
		* Cost of one session's billed tokens under one model's prices.
		* @param usage - the session's token-usage projection.
		* @param pricing - per-million-token prices from models.dev.
		* @returns USD cost (rounded to the floating-point value), or null when no token was billed.
		*/
		function sessionCostOf(usage, pricing) {
			if (usage === void 0 || pricing === void 0) return null;
			if (usage.uncachedInputTokens + usage.cacheReadTokens + usage.cacheWriteTokens + usage.outputTokens <= 0) return null;
			const cacheRead = pricing.cacheRead ?? pricing.input;
			const cacheWrite = pricing.cacheWrite ?? pricing.input;
			const cost = (usage.uncachedInputTokens * pricing.input + usage.cacheReadTokens * cacheRead + usage.cacheWriteTokens * cacheWrite + usage.outputTokens * pricing.output) / 1e6;
			return Math.max(0, cost);
		}
		/**
		* Format a USD estimate: four decimals while it is under one cent, then two.
		* @param cost - USD amount.
		* @returns the prefixed display string.
		*/
		function formatUsdCost(cost) {
			if (cost === 0) return "$0.00";
			return cost < .01 ? `$${cost.toFixed(4)}` : `$${cost.toFixed(2)}`;
		}
		//#endregion
		//#region \0dsh-css:D:\Documents\Dev-Repo\deepseek-harness\dsh-plugins\dsh-web-enhanced\src\client\balance\BalanceLine.module.css.mjs
		const css = "[data-slot=\"conversation.composer.dock\"]>div:not([data-testid=balance-line]),.FJxK0a_root{box-sizing:border-box;width:100%;max-width:none;padding:4px calc(var(--dsh-composer-side-clearance) + 16px) 0;white-space:normal;overflow-wrap:anywhere;text-overflow:clip;margin:0 auto;display:block;overflow:visible}[data-conversation-scroll]{scroll-padding-bottom:var(--dsh-composer-height,152px)}.cMdddW_line{box-sizing:border-box;width:100%;max-width:var(--dsh-chat-content-width);padding:4px calc(var(--dsh-composer-side-clearance) + 16px) 0;color:var(--dsw-alias-label-secondary,#61666b);align-items:center;gap:8px;margin:0 auto;font-size:12px;line-height:20px;display:flex}.cMdddW_label{color:var(--dsw-alias-label-tertiary,#81858c);flex:none}.cMdddW_value,.cMdddW_error{text-overflow:ellipsis;white-space:nowrap;min-width:0;overflow:hidden}.cMdddW_value{font-variant-numeric:tabular-nums;color:var(--dsw-alias-label-primary,#0f1115)}.cMdddW_error{color:var(--dsw-alias-state-error-primary,#ec1313)}.cMdddW_refresh{color:var(--dsw-alias-label-secondary,#61666b);cursor:pointer;background:0 0;border:none;border-radius:4px;flex:none;padding:2px 4px;font-size:12px;transition:background-color .14s,border-color .14s,color .14s,box-shadow .14s,transform .14s}.cMdddW_refresh:disabled{cursor:default;opacity:.4}.cMdddW_refresh:hover:not(:disabled){color:var(--dsw-alias-label-primary,#0f1115)}.cMdddW_refresh:focus-visible{outline-offset:2px;box-shadow:0 0 0 2px var(--dsw-alias-state-business-primary,#4176e6);outline:2px solid #0000}@media (prefers-reduced-motion:reduce){*{transition-duration:0s}}";
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
		* Balance line under the composer: the DeepSeek account balance plus an
		* estimated cost of the current session's billed tokens. Both ride the host's
		* caches — the balance view is cached server-side, and models.dev pricing is
		* cached once per gateway TTL — so mounting several sessions does not fan out.
		*
		* The line is tied to the session's model route. The balance endpoint serves
		* ONE account at one vendor, so a session switched to another channel gets no
		* balance part at all; pricing is shown only when models.dev has an entry for
		* the exact provider/model selection.
		* @module dsh-web-enhanced/src/client/balance/BalanceLine
		*/
		/** Format one balance line as `CNY 12.34`. */
		function summaryOf(view) {
			return view.infos.map((info) => `${info.currency} ${info.totalBalance.toFixed(2)}`).join(" · ");
		}
		/** One primitive of the session's live route, re-read on selection changes. */
		function useRouteField(modelRoute, sessionId, read) {
			const subscribe = (0, react.useMemo)(() => (listener) => modelRoute.subscribe(sessionId, listener), [modelRoute, sessionId]);
			const snapshot = (0, react.useCallback)(() => read(modelRoute, sessionId), [
				modelRoute,
				read,
				sessionId
			]);
			return (0, react.useSyncExternalStore)(subscribe, snapshot, snapshot);
		}
		/** The balance line: one muted row under the composer. */
		function BalanceLine({ remote, modelRoute, sessionId, useProjection, t }) {
			const [view, setView] = (0, react.useState)(null);
			const [pricing, setPricing] = (0, react.useState)(null);
			const [busy, setBusy] = (0, react.useState)(false);
			const provider = useRouteField(modelRoute, String(sessionId), (route, id) => route.provider(id));
			const model = useRouteField(modelRoute, String(sessionId), (route, id) => route.model(id));
			const usage = useProjection("tokenUsage");
			const live = (0, react.useRef)(true);
			(0, react.useEffect)(() => () => {
				live.current = false;
			}, []);
			const refresh = (0, react.useCallback)(async () => {
				setBusy(true);
				try {
					const [next, nextPricing] = await Promise.all([remote.balanceGet(provider === void 0 ? {} : { provider }), provider !== void 0 && model !== void 0 ? remote.pricingGet({
						provider,
						model
					}).then((result) => "error" in result ? null : result) : Promise.resolve(null)]);
					if (!live.current) return;
					setView(next);
					setPricing(nextPricing);
				} finally {
					if (live.current) setBusy(false);
				}
			}, [
				model,
				provider,
				remote
			]);
			(0, react.useEffect)(() => {
				refresh();
			}, [refresh]);
			if (view === null || !view.applicable) return null;
			const summary = summaryOf(view);
			const cost = sessionCostOf(usage, pricing?.pricing);
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
					cost !== null && (0, react_jsx_runtime.jsx)("span", {
						className: BalanceLine_module_css_default.value,
						"data-testid": "balance-cost",
						children: t("balance.cost", { cost: formatUsdCost(cost) })
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
		* - `conversation.view` — the Workspace tab whose internal tablist carries
		*   Files / Preview / Changes / Task Board / Git Graph.
		* - `shell.overlay` — the mention file browser (the frame-wide floating
		*   layer). The alternative, `details`, is a `single` slot already occupied
		*   by ui-conversation's DetailsPanel — registering there would REPLACE the
		*   tool-details column rather than add to it.
		* - `conversation.session.header.actions` — the branch strip, beside the
		*   session title (titleCluster).
		* - `conversation.composer.dock` — the balance + session-cost line (below
		*   the composer).
		*
		* Shared state lives in `apply` as plain observables and reaches components
		* through each registration's inject `hooks` compartment; a slot store handle
		* could not, because these surfaces span the `root` and `session` scopes.
		* @module dsh-web-enhanced/src/client
		*/
		/** Locale namespace owned by this plugin. */
		const NS = "webEnhanced";
		/**
		* Append one mention to a session's composer draft.
		*
		* `ctx.conversation` owns the per-session input machine and is read
		* uninjected, so a deployment composed without it degrades this one gesture
		* rather than the whole plugin.
		* @param ctx - client root context.
		* @param sessionId - the session whose draft receives the text.
		* @param text - the mention, trailing separator included.
		*/
		function appendMentionTo(ctx, sessionId, text) {
			const conversation = ctx.get("conversation");
			const actx = ctx.sessions.scope(sessionId);
			if (conversation === void 0 || actx === void 0) return;
			const input = conversation.input.for(actx);
			const draft = input.state.getSnapshot().draft;
			input.setDraft(draft === "" || /\s$/u.test(draft) ? draft + text : `${draft} ${text}`);
		}
		/**
		* Register the file and folder mention pickers into the composer's `+` menu.
		*
		* A no-op disposer when the deployment composes no command menu — the rest of
		* this plugin does not depend on one.
		* @param ctx - client root context.
		* @param remote - the envelope-free host facade.
		* @param openBrowse - opener of the file-browser overlay (project root, a
		*   folder entered from the picker, or the host home for ungrouped sessions).
		* @returns the disposer.
		*/
		function registerMentionCommands(ctx, remote, openBrowse) {
			const commandUi = ctx.get("commandUi");
			if (commandUi === void 0) return () => {};
			const t = ctx.locale.bind(NS);
			const deps = {
				remote,
				workspaceOf: (sessionId) => {
					const workspace = workspaceOfSessionId(sessionId, ctx.workspaces.list.getSnapshot());
					return workspace === void 0 ? void 0 : {
						workspaceId: String(workspace.workspaceId),
						path: workspace.path
					};
				},
				appendDraft: (sessionId, text) => {
					appendMentionTo(ctx, sessionId, text);
				},
				openBrowse,
				browseLabel: () => t("mention.browse")
			};
			const picker = (kind, name, description) => commandUi.register({
				name,
				description,
				available: () => true,
				ui: {
					kind: "popupSelect",
					options: (session) => mentionOptions(deps, kind, String(session.sessionId)),
					onSelect: (option, session) => {
						applyMention(deps, kind, String(session.sessionId), option);
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
			"connection",
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
			const connection = ctx.get("connection");
			const capabilities = new CapabilitiesStore(connection.api);
			const useCapabilities = (0, _deepseek_ai_dsh_client_web_react.bindSnapshotSelector)(capabilities.store);
			const capabilitiesInjected = () => ({
				controller: capabilities,
				useSnapshot: useCapabilities,
				api: connection.api
			});
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "model-capabilities",
				order: 11,
				locale: NS,
				label: () => ctx.locale.bind(NS)("modelCapabilities.nav"),
				inject: capabilitiesInjected
			}, ModelCapabilitiesSection));
			ctx.effect(() => {
				const refresh = () => {
					refreshIfLoaded(capabilities);
				};
				const disposers = [
					ctx.remote.$on("settings/document-updated", refresh),
					ctx.remote.$on("llm/adapters-updated", refresh),
					ctx.on("connection/reset", refresh)
				];
				return () => {
					for (const dispose of disposers) dispose();
				};
			}, "web-enhanced: model capabilities invalidations");
			const overlay = createOverlay();
			const browse = createBrowse();
			const panel = createPanel();
			const preview = createPreview();
			ctx.effect(() => applyNavbar(ctx), "web-enhanced: navbar");
			ctx.effect(() => {
				const directories = () => ctx.get("modelDirectories");
				const sessions = ctx.sessions;
				return ctx.slots.inject("conversation.input.model", () => ctx.slots.register({
					name: "conversation.input.model",
					locale: NS,
					priority: -1,
					inject: (sessionId) => {
						const directory = directories()?.directoryFor(sessionId);
						const available = sessions.subagentAddress(sessionId) === void 0;
						return {
							available,
							directory: directory?.store ?? null,
							load: () => {
								if (available && directory !== void 0) directory.load().catch(() => {});
							},
							select: async (selection) => {
								if (!available || directory === void 0) return false;
								try {
									await directory.select(selection);
									return true;
								} catch {
									return false;
								}
							}
						};
					}
				}, ModelPicker));
			}, "web-enhanced: model picker");
			const skinLayer = new SkinLayer(ctx);
			const skin = {
				get available() {
					return skinLayer.available;
				},
				get current() {
					return skinLayer.getSkin().id;
				},
				get dark() {
					return skinLayer.isDark();
				},
				get background() {
					return skinLayer.getBackground();
				},
				setBackground: (dataUrl) => {
					skinLayer.setBackground(dataUrl);
				},
				apply: (id) => {
					skinLayer.setSkin(id);
					return skinLayer.getSkin().id;
				},
				subscribe: (listener) => skinLayer.onChange(ctx, listener)
			};
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
						appendMention: (sessionId, text) => {
							appendMentionTo(ctx, sessionId, text);
						},
						openSession: (sessionId) => {
							ctx.sessions.open(sessionId);
						},
						hooks: {
							overlay: overlay.cell,
							browse: browse.cell,
							panel: panel.cell,
							preview: preview.cell
						},
						skin,
						...overlay.actions,
						...browse.actions,
						...panel.actions,
						...preview.actions
					});
					disposers.push(ctx.slots.inject("shell.overlay", () => ctx.slots.register({
						name: "shell.overlay",
						id: "web-enhanced-browse-overlay",
						order: 30,
						locale: NS,
						inject: face
					}, BrowseOverlay)), ctx.slots.inject("conversation.view", () => ctx.slots.register({
						name: "conversation.view",
						id: "web-enhanced-workspace",
						order: 30,
						locale: NS,
						label: () => ctx.locale.bind(NS)("view.workspace"),
						inject: face
					}, WorkspaceView)), ctx.slots.inject("conversation.session.header.actions", () => ctx.slots.register({
						name: "conversation.session.header.actions",
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
					}, BalanceLine)), ctx.slots.inject("settings.section", () => ctx.slots.register({
						name: "settings.section",
						id: "web-enhanced",
						order: 60,
						locale: NS,
						label: () => ctx.locale.bind(NS)("settings.nav"),
						inject: face
					}, SettingsSection)), registerMentionCommands(ctx, remote, browse.actions.openBrowse));
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
		exports.createBrowse = createBrowse;
		exports.createOverlay = createOverlay;
		exports.createPanel = createPanel;
		exports.createPreview = createPreview;
		exports.inject = inject;
		exports.workspaceOfSession = workspaceOfSession;
		return module.exports;
	}
});
