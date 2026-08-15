import { z } from "zod";
import z$1 from "@deepseek-ai/schemastery";
import { Remote, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import { open, readFile, readdir, realpath, rm, stat, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, join, resolve, sep } from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { defineDomain, domainTable } from "@deepseek-ai/dsh-storage-domain";
import { installModelSelection } from "@deepseek-ai/dsh-agent";
import { createUserMessage } from "@deepseek-ai/dsh-llm";
import { SessionId } from "@deepseek-ai/dsh-session";
import { unzipSync } from "fflate";
import { fileURLToPath } from "node:url";
import { Service } from "@deepseek-ai/cordis";
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
		schema: z.any()
	};
}
const apiErrorSchema = z.object({
	code: z.string(),
	message: z.string()
});
/** Union of one success payload and the ApiError branch. */
function okOrError(schema) {
	return z.union([schema, z.object({ error: apiErrorSchema })]);
}
const taskResultSchema = z.object({
	reasonKind: z.enum([
		"completed",
		"error",
		"interrupted"
	]).optional(),
	summary: z.string().optional(),
	errorCode: z.string().optional(),
	errorMessage: z.string().optional()
});
const taskRecordSchema$1 = z.object({
	id: z.string(),
	title: z.string(),
	prompt: z.string(),
	status: z.enum([
		"planned",
		"todo",
		"running",
		"done",
		"failed"
	]),
	cron: z.string().nullable(),
	nextRunAt: z.number().nullable(),
	workspaceId: z.string().nullable(),
	sessionId: z.string().nullable(),
	result: taskResultSchema.nullable(),
	createdAt: z.number(),
	updatedAt: z.number(),
	lastRunAt: z.number().nullable()
});
const gitBranchViewSchema = z.object({
	name: z.string(),
	current: z.boolean()
});
const gitCommitViewSchema = z.object({
	hash: z.string(),
	parents: z.array(z.string()),
	refs: z.array(z.string()),
	author: z.string(),
	date: z.number(),
	subject: z.string()
});
const gitCommitDetailSchema = z.object({
	hash: z.string(),
	parents: z.array(z.string()),
	author: z.string(),
	email: z.string(),
	date: z.number(),
	subject: z.string(),
	body: z.string(),
	files: z.array(z.object({
		path: z.string(),
		added: z.number().nullable(),
		removed: z.number().nullable()
	}))
});
const gitWorkingSchema = z.object({
	head: z.string(),
	files: z.array(z.object({
		path: z.string(),
		state: z.enum([
			"staged",
			"unstaged",
			"untracked"
		]),
		added: z.number().nullable(),
		removed: z.number().nullable()
	})),
	staged: z.number(),
	unstaged: z.number(),
	untracked: z.number(),
	truncated: z.boolean()
});
const gitStatusEntrySchema = z.object({
	path: z.string(),
	origPath: z.string().optional(),
	staged: z.string(),
	unstaged: z.string()
});
const gitOkSchema = z.object({
	ok: z.boolean(),
	message: z.string().optional()
});
const fsEntryViewSchema = z.object({
	name: z.string(),
	path: z.string(),
	kind: z.enum(["file", "dir"]),
	size: z.number().optional()
});
const officeBlockSchema = z.union([z.object({
	type: z.enum([
		"h1",
		"h2",
		"h3",
		"p",
		"li"
	]),
	text: z.string()
}), z.object({
	type: z.literal("table"),
	rows: z.array(z.array(z.string()))
})]);
const officePreviewSchema = z.object({
	kind: z.enum(["docx", "xlsx"]),
	blocks: z.array(officeBlockSchema),
	truncated: z.boolean()
});
const balanceInfoSchema = z.object({
	currency: z.string(),
	totalBalance: z.number(),
	grantedBalance: z.number(),
	toppedUpBalance: z.number()
});
const balanceViewSchema = z.object({
	applicable: z.boolean(),
	isAvailable: z.boolean(),
	infos: z.array(balanceInfoSchema),
	cachedAt: z.number(),
	error: apiErrorSchema.optional()
});
const pluginViewSchema = z.object({
	name: z.string(),
	spec: z.string(),
	version: z.string().nullable(),
	description: z.string().nullable(),
	bundle: z.boolean(),
	active: z.boolean(),
	self: z.boolean()
});
const pluginListSchema = z.object({
	profileDir: z.string(),
	profileName: z.string(),
	plugins: z.array(pluginViewSchema),
	templateBundles: z.array(z.string()),
	busy: z.boolean()
});
const pluginMutateSchema = z.object({
	ok: z.boolean(),
	added: z.array(z.string()),
	removed: z.array(z.string()),
	restartRequired: z.boolean(),
	output: z.string()
});
/** The live vision-integration status, shared by two endpoints. */
const visionStatusSchema = z.object({
	mounted: z.boolean(),
	enabled: z.boolean(),
	patchAdmission: z.boolean(),
	admissionActive: z.boolean(),
	harnessModels: z.array(z.object({
		provider: z.string(),
		model: z.string()
	})),
	endpointConfigured: z.boolean(),
	endpointModel: z.string().nullable(),
	apiKeySource: z.enum([
		"config",
		"env",
		"none-needed",
		"unset"
	]),
	ollamaDetected: z.boolean(),
	ollamaModel: z.string().nullable(),
	cacheSize: z.number(),
	lastError: z.string().nullable()
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
/** Every invocation this plugin exposes, in gateway declaration order. */
const WEB_ENHANCED_DESCRIPTORS = [
	nullary("taskList", "TaskListResult", okOrError(z.object({ tasks: z.array(taskRecordSchema$1) }))),
	unary("taskCreate", "TaskCreateRequest", "TaskCreateResult", okOrError(z.object({ task: taskRecordSchema$1 }))),
	unary("taskUpdate", "TaskUpdateRequest", "TaskUpdateResult", okOrError(z.object({ task: taskRecordSchema$1 }))),
	unary("taskRemove", "TaskRemoveRequest", "TaskRemoveResult", okOrError(z.object({ removed: z.boolean() }))),
	unary("taskRun", "TaskRunRequest", "TaskRunResult", okOrError(z.object({
		started: z.boolean(),
		sessionId: z.string().nullable()
	}))),
	unary("balanceGet", "BalanceGetRequest", "BalanceView", balanceViewSchema),
	unary("pricingGet", "PricingGetRequest", "PricingGetResult", okOrError(z.object({
		provider: z.string(),
		model: z.string(),
		pricing: z.object({
			input: z.number(),
			output: z.number(),
			cacheRead: z.number().nullable(),
			cacheWrite: z.number().nullable()
		})
	}))),
	nullary("visionStatus", "VisionStatusResult", okOrError(visionStatusSchema)),
	nullary("visionConfigGet", "VisionConfigGetResult", okOrError(z.object({
		managed: z.boolean(),
		writable: z.boolean(),
		revision: z.number().nullable(),
		enabled: z.boolean(),
		patchAdmission: z.boolean(),
		provider: z.string(),
		model: z.string(),
		prompt: z.string(),
		marker: z.string(),
		baseUrl: z.string(),
		apiKeySet: z.boolean(),
		apiKeyEnv: z.string(),
		endpointModel: z.string(),
		endpointModels: z.array(z.string()),
		anonymous: z.boolean(),
		timeoutMs: z.number(),
		maxTokens: z.number(),
		autoLocalOllama: z.boolean(),
		localOllamaModel: z.string(),
		localOllamaUrl: z.string(),
		fallbackCount: z.number(),
		cacheLimit: z.number(),
		cooldownMs: z.number(),
		providers: z.array(z.object({
			provider: z.string(),
			name: z.string(),
			models: z.array(z.object({
				id: z.string(),
				name: z.string(),
				supportsImage: z.boolean()
			}))
		})),
		status: visionStatusSchema
	}))),
	unary("visionConfigSet", "VisionConfigSaveRequest", "VisionConfigSetResult", okOrError(z.object({
		ok: z.literal(true),
		revision: z.number()
	}))),
	unary("visionEndpointModels", "VisionEndpointModelsRequest", "VisionEndpointModelsResult", okOrError(z.object({
		baseUrl: z.string(),
		models: z.array(z.object({
			id: z.string(),
			name: z.string()
		})),
		truncated: z.boolean()
	}))),
	unary("gitBranches", "GitBranchesRequest", "GitBranchesResult", okOrError(z.object({ branches: z.array(gitBranchViewSchema) }))),
	unary("gitLog", "GitLogRequest", "GitLogResult", okOrError(z.object({ commits: z.array(gitCommitViewSchema) }))),
	unary("gitCommit", "GitCommitRequest", "GitCommitResult", okOrError(z.object({ commit: gitCommitDetailSchema }))),
	unary("gitWorking", "GitWorkingRequest", "GitWorkingResult", okOrError(z.object({ working: gitWorkingSchema }))),
	unary("gitCheckout", "GitCheckoutRequest", "GitCheckoutResult", okOrError(gitOkSchema)),
	unary("gitStatus", "GitStatusRequest", "GitStatusResult", okOrError(z.object({ entries: z.array(gitStatusEntrySchema) }))),
	unary("gitDiff", "GitDiffRequest", "GitDiffResult", okOrError(z.object({ text: z.string() }))),
	unary("gitStage", "GitMutateRequest", "GitMutateResult", okOrError(gitOkSchema)),
	unary("gitUnstage", "GitMutateRequest", "GitMutateResult", okOrError(gitOkSchema)),
	unary("gitDiscard", "GitMutateRequest", "GitMutateResult", okOrError(gitOkSchema)),
	unary("fsList", "FsListRequest", "FsListResult", okOrError(z.object({ entries: z.array(fsEntryViewSchema) }))),
	unary("fsSearch", "FsSearchRequest", "FsSearchResult", okOrError(z.object({ entries: z.array(fsEntryViewSchema) }))),
	unary("fsRead", "FsReadRequest", "FsReadResult", z.union([z.object({
		kind: z.enum(["text", "binary"]),
		content: z.string(),
		truncated: z.boolean(),
		size: z.number()
	}), z.object({ error: apiErrorSchema })])),
	unary("fsWrite", "FsWriteRequest", "FsWriteResult", okOrError(z.object({ ok: z.boolean() }))),
	unary("fsDelete", "FsDeleteRequest", "FsWriteResult", okOrError(z.object({ ok: z.boolean() }))),
	unary("fsOfficePreview", "FsOfficePreviewRequest", "FsOfficePreviewResult", okOrError(officePreviewSchema)),
	unary("fsBrowse", "FsBrowseRequest", "FsBrowseResult", okOrError(z.object({
		path: z.string(),
		parent: z.string().nullable(),
		home: z.string(),
		roots: z.array(z.string()),
		entries: z.array(z.object({
			name: z.string(),
			path: z.string(),
			kind: z.enum(["file", "dir"]),
			size: z.number().optional()
		})),
		truncated: z.boolean()
	}))),
	unary("pluginList", "PluginListRequest", "PluginListResult", okOrError(pluginListSchema)),
	unary("pluginRemove", "PluginMutateRequest", "PluginMutateResult", okOrError(pluginMutateSchema)),
	unary("pluginUpdate", "PluginMutateRequest", "PluginMutateResult", okOrError(pluginMutateSchema))
];
//#endregion
//#region lib/types/balance.js
/**
* DeepSeek balance query.
*
* The API key is resolved exactly the way the model adapter resolves it: the
* credential seam first, the ambient environment only as the fallback for a
* deployment without that seam. Reading `process.env` alone would miss a key
* configured through settings or a `.env` layer — which is the normal case, and
* would report "not set" for an account whose model requests are working.
* Failures are result fields.
* @module dsh-web-enhanced/src/balance
*/
/** Balance query client with a short-lived view cache. */
var BalanceClient = class {
	config;
	resolveCredential;
	cache = null;
	/**
	* @param config - key reference, cache TTL, and endpoint base.
	* @param resolveCredential - credential-seam lookup; omitted falls back to the environment.
	*/
	constructor(config, resolveCredential) {
		this.config = config;
		this.resolveCredential = resolveCredential;
	}
	/** Cached or freshly fetched balance view. */
	async get() {
		const now = Date.now();
		if (this.cache !== null && now - this.cache.at < this.config.cacheTtlMs) return this.cache.value;
		const view = await this.fetchBalance(now);
		this.cache = {
			at: now,
			value: view
		};
		return view;
	}
	/** Drop the cached view (the settings plane can force a refresh). */
	clear() {
		this.cache = null;
	}
	/**
	* The API key, resolved per query so a rotated credential reaches the very
	* next refresh — the same per-operation contract the adapters follow.
	*/
	async apiKey() {
		if (this.resolveCredential !== void 0) {
			const resolved = await this.resolveCredential(this.config.apiKeyEnv);
			if (resolved !== void 0 && resolved.trim() !== "") return resolved;
		}
		const ambient = process.env[this.config.apiKeyEnv];
		return ambient === void 0 || ambient.trim() === "" ? void 0 : ambient;
	}
	async fetchBalance(now) {
		const key = await this.apiKey();
		if (key === void 0) return {
			isAvailable: false,
			infos: [],
			cachedAt: now,
			error: {
				code: "no-api-key",
				message: `credential ${this.config.apiKeyEnv} is not configured (checked the credential store and the environment)`
			}
		};
		let response;
		try {
			response = await fetch(`${this.config.baseUrl}/user/balance`, { headers: {
				Accept: "application/json",
				Authorization: `Bearer ${key}`
			} });
		} catch {
			return {
				isAvailable: false,
				infos: [],
				cachedAt: now,
				error: {
					code: "balance-unreachable",
					message: "the balance endpoint could not be reached"
				}
			};
		}
		if (!response.ok) return {
			isAvailable: false,
			infos: [],
			cachedAt: now,
			error: {
				code: "balance-http",
				message: `balance endpoint answered ${response.status}`
			}
		};
		let body;
		try {
			body = await response.json();
		} catch {
			return {
				isAvailable: false,
				infos: [],
				cachedAt: now,
				error: {
					code: "balance-invalid",
					message: "the balance response was not JSON"
				}
			};
		}
		return parseBalanceBody(body, now);
	}
};
/** Validate and project the endpoint payload; malformed lines are dropped. */
function parseBalanceBody(body, now) {
	if (typeof body !== "object" || body === null) return {
		isAvailable: false,
		infos: [],
		cachedAt: now,
		error: {
			code: "balance-invalid",
			message: "unexpected balance payload"
		}
	};
	const record = body;
	const rawInfos = Array.isArray(record["balance_infos"]) ? record["balance_infos"] : [];
	const infos = [];
	for (const raw of rawInfos) {
		if (typeof raw !== "object" || raw === null) continue;
		const info = raw;
		if (typeof info["currency"] !== "string") continue;
		infos.push({
			currency: info["currency"],
			totalBalance: toNumber(info["total_balance"]),
			grantedBalance: toNumber(info["granted_balance"]),
			toppedUpBalance: toNumber(info["topped_up_balance"])
		});
	}
	return {
		isAvailable: record["is_available"] === true,
		infos,
		cachedAt: now
	};
}
/** Numeric projection tolerant of JSON numbers and numeric strings. */
function toNumber(value) {
	if (typeof value === "number") return Number.isFinite(value) ? value : 0;
	if (typeof value === "string" && value.trim() !== "") {
		const parsed = Number(value);
		return Number.isFinite(parsed) ? parsed : 0;
	}
	return 0;
}
//#endregion
//#region lib/types/browse.js
/**
* Filesystem browsing outside the workspace.
*
* Every other fs capability of this plugin is workspace-scoped and refuses
* absolute paths — that guard is what keeps file READS inside the project. A
* mention is a different need: the path the user wants may sit anywhere on the
* host, and what the composer receives is a STRING, not the bytes. So this
* module lists directories anywhere and returns nothing but names, kinds, and
* sizes; reading, writing, and previewing stay behind the workspace root.
* @module dsh-web-enhanced/src/browse
*/
/**
* The filesystem roots a browser may jump to.
*
* POSIX has exactly one and walking up reaches it, so the list is empty
* there — an affordance that only ever offers `/` is noise. Windows has one
* root PER DRIVE with no common ancestor above them, so walking up from
* `C:\Users\me` dead-ends at `C:\` and no other drive is reachable by
* navigation at all. These jump targets are the only way across.
*
* The drives are probed rather than enumerated: Node exposes no drive list
* without a native binding. The 26 probes run concurrently, so the cost is
* the slowest one — which for a disconnected network letter can still be a
* second or two.
* @returns the roots, or an empty list on POSIX.
*/
async function filesystemRoots() {
	if (process.platform !== "win32") return [];
	const letters = Array.from({ length: 26 }, (_unused, index) => String.fromCharCode(65 + index));
	return (await Promise.all(letters.map(async (letter) => {
		const root = `${letter}:\\`;
		try {
			return (await stat(root)).isDirectory() ? root : void 0;
		} catch {
			return;
		}
	}))).filter((root) => root !== void 0);
}
/**
* List one absolute directory: subdirectories first, then files, each
* name-sorted.
* @param path - absolute directory; omitted or blank lists the host home.
* @param limits - entry cap.
* @returns the level, its parent, the host home, and the filesystem roots.
* @throws when the path does not exist or is not a directory.
*/
async function browseDirectory(path, limits) {
	const home = homedir();
	const target = path === void 0 || path.trim() === "" ? home : resolve(path);
	if (!(await stat(target)).isDirectory()) throw new Error(`'${target}' is not a directory`);
	const [dirents, roots] = await Promise.all([readdir(target, { withFileTypes: true }), filesystemRoots()]);
	const dirs = [];
	const files = [];
	let truncated = false;
	for (const dirent of dirents) {
		if (dirs.length + files.length >= limits.maxEntries) {
			truncated = true;
			break;
		}
		const full = join(target, dirent.name);
		if (dirent.isDirectory()) {
			dirs.push({
				name: dirent.name,
				path: full,
				kind: "dir"
			});
			continue;
		}
		if (!dirent.isFile() && !dirent.isSymbolicLink()) continue;
		let size;
		try {
			const stats = await stat(full);
			if (stats.isDirectory()) {
				dirs.push({
					name: dirent.name,
					path: full,
					kind: "dir"
				});
				continue;
			}
			size = stats.size;
		} catch {}
		files.push({
			name: dirent.name,
			path: full,
			kind: "file",
			...size === void 0 ? {} : { size }
		});
	}
	const byName = (left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0;
	dirs.sort(byName);
	files.sort(byName);
	const parent = dirname(target);
	return {
		path: target,
		parent: parent === target ? null : parent,
		home,
		roots,
		entries: [...dirs, ...files],
		truncated
	};
}
//#endregion
//#region lib/types/channel.js
/**
* Whether the balance query says anything about the session's current model
* route.
*
* The balance endpoint belongs to one account at one vendor. A session routed
* to some other channel — a self-hosted gateway, another vendor, a proxy —
* still has a balance somewhere, but not one this endpoint knows, so the line
* would be reporting a number about a different account than the one paying
* for the conversation. That is worse than showing nothing.
* @module dsh-web-enhanced/src/channel
*/
/** Host of one URL, lowercased; undefined when it does not parse. */
function hostOf(url) {
	try {
		return new URL(url).host.toLowerCase();
	} catch {
		return;
	}
}
/**
* Decide whether the balance line belongs on screen for one model route.
* @param facts - the route, the allow list, and both endpoints.
* @returns true when the balance describes the account this route bills.
*/
function balanceApplies(facts) {
	if (facts.provider === void 0) return true;
	if (!facts.allowed.includes(facts.provider)) return false;
	if (facts.providerBaseUrl === void 0) return true;
	const configured = hostOf(facts.providerBaseUrl);
	const balance = hostOf(facts.balanceBaseUrl);
	return configured !== void 0 && balance !== void 0 && configured === balance;
}
//#endregion
//#region lib/types/cron.js
/**
* Five-field cron parser and next-occurrence solver, local time. Supports
* star, star/step, a-b ranges, a,b lists, and plain numbers; day-of-week 0
* and 7 both mean Sunday. Pure module: no I/O, no state.
* @module dsh-web-enhanced/src/cron
*/
/** Field name and legal range of each of the five cron fields. */
const FIELDS = [
	[
		"minute",
		0,
		59
	],
	[
		"hour",
		0,
		23
	],
	[
		"day of month",
		1,
		31
	],
	[
		"month",
		1,
		12
	],
	[
		"day of week",
		0,
		7
	]
];
/** Search horizon: no occurrence beyond ~4 years is planned for. */
const CRON_HORIZON_MS = 1264896e5;
/**
* Parse one comma-separated field into its accepted value set.
* @param raw - the field text (e.g. `0/15`, `1-5`, `3,7`).
* @param field - field name for error messages.
* @param min - inclusive lower bound.
* @param max - inclusive upper bound.
* @returns the accepted values.
* @throws when the field is malformed or out of range.
*/
function parseField(raw, field, min, max) {
	const values = /* @__PURE__ */ new Set();
	for (const token of raw.split(",")) {
		if (token === "") throw new Error(`cron: empty list item in ${field}`);
		let step = 1;
		let range = token;
		const slash = token.indexOf("/");
		if (slash !== -1) {
			if (slash === 0) throw new Error(`cron: ${field} step requires a base`);
			range = token.slice(0, slash);
			const stepRaw = token.slice(slash + 1);
			if (!/^\d+$/u.test(stepRaw)) throw new Error(`cron: invalid step '${stepRaw}' in ${field}`);
			step = Number(stepRaw);
			if (step < 1) throw new Error(`cron: ${field} step must be a positive integer`);
		}
		let lo;
		let hi;
		if (range === "*") {
			lo = min;
			hi = max;
		} else {
			const dash = range.indexOf("-");
			if (dash === -1) {
				if (!/^\d+$/u.test(range)) throw new Error(`cron: invalid value '${range}' in ${field}`);
				lo = Number(range);
				hi = lo;
			} else {
				const loRaw = range.slice(0, dash);
				const hiRaw = range.slice(dash + 1);
				if (!/^\d+$/u.test(loRaw) || !/^\d+$/u.test(hiRaw)) throw new Error(`cron: invalid range '${range}' in ${field}`);
				lo = Number(loRaw);
				hi = Number(hiRaw);
			}
		}
		if (lo < min || hi > max || lo > hi) throw new Error(`cron: ${field} range ${lo}-${hi} outside ${min}-${max}`);
		for (let value = lo; value <= hi; value += step) values.add(value);
	}
	return values;
}
/**
* Parse a five-field cron expression.
* @param expr - the five fields: minute hour day-of-month month day-of-week.
* @returns the accepted value sets.
* @throws when the expression is malformed or a value is out of range.
*/
function parseCron(expr) {
	const parts = expr.trim().split(/\s+/u);
	if (parts.length !== 5) throw new Error(`cron '${expr}': expected 5 fields (minute hour day-of-month month day-of-week)`);
	const minutes = parseField(parts[0], FIELDS[0][0], FIELDS[0][1], FIELDS[0][2]);
	const hours = parseField(parts[1], FIELDS[1][0], FIELDS[1][1], FIELDS[1][2]);
	const days = parseField(parts[2], FIELDS[2][0], FIELDS[2][1], FIELDS[2][2]);
	const months = parseField(parts[3], FIELDS[3][0], FIELDS[3][1], FIELDS[3][2]);
	const weekdays = /* @__PURE__ */ new Set();
	for (const value of parseField(parts[4], FIELDS[4][0], FIELDS[4][1], FIELDS[4][2])) weekdays.add(value === 7 ? 0 : value);
	return {
		minutes,
		hours,
		days,
		months,
		weekdays,
		dayRestricted: parts[2] !== "*",
		weekdayRestricted: parts[4] !== "*"
	};
}
/**
* Day-of-month × day-of-week semantics: when both fields are restricted,
* either matching day fires; when one is unrestricted, only the restricted
* field decides.
*/
function dayMatches(spec, date) {
	if (!spec.dayRestricted && !spec.weekdayRestricted) return true;
	const dom = spec.days.has(date.getDate());
	const dow = spec.weekdays.has(date.getDay());
	if (!spec.dayRestricted) return dow;
	if (!spec.weekdayRestricted) return dom;
	return dom || dow;
}
/**
* Compute the next occurrence strictly after the reference instant (local
* time).
* @param spec - parsed expression.
* @param from - reference instant (ms epoch).
* @returns the next matching instant, or null when none exists within the horizon.
*/
function nextAfter(spec, from) {
	const horizon = from + CRON_HORIZON_MS;
	const start = new Date(from);
	start.setMinutes(start.getMinutes() + 1, 0, 0);
	const first = start.getTime();
	/* v8 ignore next -- the horizon is always at least a minute ahead of the first candidate */
	if (first > horizon) return null;
	for (let day = new Date(start); day.getTime() <= horizon; day.setDate(day.getDate() + 1)) {
		if (!spec.months.has(day.getMonth() + 1)) continue;
		if (!dayMatches(spec, day)) continue;
		const firstHour = day.getTime() === first ? day.getHours() : 0;
		const firstMinute = day.getTime() === first ? day.getMinutes() : 0;
		for (let hour = firstHour; hour < 24; hour++) {
			if (!spec.hours.has(hour)) continue;
			const minuteStart = hour === firstHour ? firstMinute : 0;
			for (let minute = minuteStart; minute < 60; minute++) {
				if (!spec.minutes.has(minute)) continue;
				const candidate = new Date(day);
				candidate.setHours(hour, minute, 0, 0);
				/* v8 ignore next -- candidates start at the next minute, so they are always after the reference */
				if (candidate.getTime() > from) return candidate.getTime();
			}
		}
	}
	return null;
}
//#endregion
//#region lib/types/run-task.js
/**
* Task execution engine: drives one task prompt through a freshly created
* agent session to quiescence and summarizes the outcome. Mirrors the
* headless runner's drive sequence so task runs behave like one-shot
* `dsh --profile headless` runs inside the web host.
* @module dsh-web-enhanced/src/run-task
*/
/**
* Aggregate the last assistant text and turn outcome of one run interval.
* @param events - session events of the run's session.
* @param firstSeq - first event sequence belonging to the run.
* @returns the structured result.
*/
function summarize(events, firstSeq) {
	let started = false;
	let text = "";
	let reasonKind = void 0;
	let errorCode;
	let errorMessage;
	for (const event of events) {
		if (event.seq < firstSeq) continue;
		if (event.type === "turn/start") {
			started = true;
			continue;
		}
		if (!started) continue;
		if (event.type === "assistant/message") {
			const joined = event.data.message.content.filter((block) => block.type === "text").map((block) => block.text).join("");
			if (joined !== "") text = joined;
		}
		if (event.type === "turn/end") {
			reasonKind = event.data.reason.kind === "completed" ? "completed" : event.data.reason.kind === "error" ? "error" : "interrupted";
			if (event.data.reason.kind === "error") {
				errorCode = event.data.reason.error.code;
				errorMessage = event.data.reason.error.message;
			}
		}
	}
	return {
		...reasonKind === void 0 ? {} : { reasonKind },
		...text === "" ? {} : { summary: text },
		...errorCode === void 0 ? {} : { errorCode },
		...errorMessage === void 0 ? {} : { errorMessage }
	};
}
/**
* Create the run's agent session: settled loader, default model selection,
* the deployment's agent preset, and workspace membership.
*
* The preset is what carries the tools. A session composed without one runs on
* whatever the host mounted globally, which is why an unbound run could see
* only the root-registered tools and none of `bash`, `read_file`, or
* `write_file`. The id is resolved BEFORE creation because the session
* boundary snapshots `meta` before setup begins, and mounting happens INSIDE
* setup so a failing composition rolls the whole creation back.
* @param deps - core services.
* @param target - run directory and workspace membership.
* @returns the live agent and its session id.
*/
async function createTaskAgent(deps, target) {
	if (deps.awaitLoader !== void 0) await deps.awaitLoader();
	const selection = deps.agentDefaultModel.currentSelection();
	const sessionId = SessionId(`task-${randomUUID()}`);
	const presets = deps.presets();
	const agentPreset = presets === void 0 ? void 0 : (await presets.resolve()).id;
	const { agent } = await deps.agents.create({
		sessionId,
		meta: {
			cwd: target.cwd,
			...agentPreset === void 0 ? {} : { agentPreset }
		},
		agentOptions: {
			provider: selection.provider,
			model: selection.model
		},
		setup: async (agentCtx) => {
			installModelSelection(agentCtx, {
				current: selection,
				assembled: void 0
			});
			if (presets !== void 0) await presets.mount(agentCtx, agentPreset);
		}
	});
	if (target.workspaceId !== null && deps.attachWorkspaceSession !== void 0) await deps.attachWorkspaceSession(target.workspaceId, sessionId);
	await agent.whenIdle();
	return {
		agent,
		sessionId
	};
}
/**
* Drive the prepared agent to quiescence and summarize the run.
* @param deps - core services.
* @param agent - live agent from {@link createTaskAgent}.
* @param prompt - task prompt.
* @returns the run outcome.
*/
async function executeTaskAgent(deps, agent, prompt) {
	const firstSeq = agent.session.seq;
	agent.followup(createUserMessage({
		content: [{
			type: "text",
			text: prompt
		}],
		source: { kind: "user" }
	}));
	await agent.whenIdle();
	await deps.sessions.flush(agent.session);
	return {
		result: summarize(agent.session.events, firstSeq),
		sessionId: SessionId(agent.session.id)
	};
}
//#endregion
//#region lib/types/schemas.js
/**
* Zod record schema for the web-enhanced task domain. Lives outside
* `types.ts` (which is types-only) so the storage-domain spec can project
* the same schema to the durable boundary.
* @module dsh-web-enhanced/src/schemas
*/
/** Durable task record schema; validates every stored record at load and write. */
const taskRecordSchema = z.object({
	id: z.string(),
	title: z.string().min(1),
	prompt: z.string().min(1),
	status: z.enum([
		"planned",
		"todo",
		"running",
		"done",
		"failed"
	]),
	cron: z.string().nullable(),
	nextRunAt: z.number().nullable(),
	workspaceId: z.string().nullable(),
	sessionId: z.string().nullable(),
	result: z.object({
		reasonKind: z.enum([
			"completed",
			"error",
			"interrupted"
		]).optional(),
		summary: z.string().optional(),
		errorCode: z.string().optional(),
		errorMessage: z.string().optional()
	}).nullable(),
	createdAt: z.number(),
	updatedAt: z.number(),
	lastRunAt: z.number().nullable()
});
//#endregion
//#region lib/types/board.js
/**
* Task board domain: durable records (storage-domain table), cron scheduling
* with restart recovery, and real agent-session execution. The gateway
* delegates every task* method here; business failures are result fields.
* @module dsh-web-enhanced/src/board
*/
/** Brand a raw id as a task id at the owning boundary. */
function taskId(value) {
	return value;
}
/** The web-enhanced task domain: one validated tasks table. */
const taskDomainSpec = defineDomain({
	name: "web_enhanced",
	version: 1,
	tables: { tasks: domainTable(taskRecordSchema) }
});
/**
* The task board: durable CRUD, the cron scheduler, and run settlement.
* One instance per gateway; the storage domain opens once (recovering
* interrupted runs) and the scheduler ticks on the configured interval.
*/
var TaskBoard = class {
	deps;
	ready;
	/** In-flight run guard (the durable status is authoritative; this is the admission lock). */
	runs = /* @__PURE__ */ new Set();
	/**
	* @param ctx - owning context with the injected storageDomain service.
	* @param deps - world access (run services + workspace resolution).
	* @param config - board configuration.
	*/
	constructor(ctx, deps, config) {
		this.deps = deps;
		this.ready = this.openDomain(ctx);
		ctx.effect(() => {
			const timer = setInterval(() => {
				this.schedulerTick();
			}, config.cronIntervalMs);
			this.schedulerTick();
			return () => clearInterval(timer);
		});
	}
	/** List every task, oldest first. */
	async list() {
		return { tasks: [...(await this.ready).table("tasks").entries()].map(([, task]) => task).sort((left, right) => left.createdAt - right.createdAt) };
	}
	/** Create a task; a cron expression is validated and its next run computed. */
	async create(request) {
		try {
			const title = request.title.trim();
			const prompt = request.prompt.trim();
			if (title === "") return { error: {
				code: "invalid-title",
				message: "title must not be empty"
			} };
			if (prompt === "") return { error: {
				code: "invalid-prompt",
				message: "prompt must not be empty"
			} };
			const cron = request.cron === void 0 || request.cron.trim() === "" ? null : request.cron.trim();
			let nextRunAt = null;
			if (cron !== null) {
				nextRunAt = nextAfter(parseCron(cron), Date.now());
				if (nextRunAt === null) return { error: {
					code: "cron-never",
					message: `cron '${cron}' never fires within the planning horizon`
				} };
			}
			const workspaceId = request.workspaceId === void 0 || request.workspaceId === null ? null : this.deps.resolveWorkspaceId(request.workspaceId);
			if (request.workspaceId !== void 0 && request.workspaceId !== null && workspaceId === null) return { error: {
				code: "workspace-not-found",
				message: `workspace '${request.workspaceId}' does not exist`
			} };
			const domain = await this.ready;
			const now = Date.now();
			const task = {
				id: taskId(`task-${randomUUID()}`),
				title,
				prompt,
				status: "planned",
				cron,
				nextRunAt,
				workspaceId,
				sessionId: null,
				result: null,
				createdAt: now,
				updatedAt: now,
				lastRunAt: null
			};
			await domain.table("tasks").put(task.id, task);
			return { task };
		} catch (error) {
			return { error: this.errorOf(error, "task-create") };
		}
	}
	/** Update title, prompt, cron, or board column (planned/todo only). */
	async update(request) {
		try {
			const id = request.id;
			if (id === "") return { error: {
				code: "invalid-id",
				message: "task id must not be empty"
			} };
			const table = (await this.ready).table("tasks");
			const now = Date.now();
			let workspaceId;
			if (request.workspaceId !== void 0) {
				if (request.workspaceId === null) workspaceId = null;
				else {
					workspaceId = this.deps.resolveWorkspaceId(request.workspaceId);
					if (workspaceId === null) return { error: {
						code: "workspace-not-found",
						message: `workspace '${request.workspaceId}' does not exist`
					} };
				}
			}
			return { task: await table.update(id, (current) => {
				if (current.status === "running") throw new Error(`task '${current.title}' is running and cannot be edited`);
				const title = request.title === void 0 ? current.title : request.title.trim();
				if (title === "") throw new Error("title must not be empty");
				const prompt = request.prompt === void 0 ? current.prompt : request.prompt.trim();
				if (prompt === "") throw new Error("prompt must not be empty");
				const status = request.status === void 0 ? current.status : request.status;
				if (status !== "planned" && status !== "todo") throw new Error(`status '${status}' cannot be set through update`);
				let cron;
				let nextRunAt;
				if (request.cron === void 0) {
					cron = current.cron;
					nextRunAt = current.nextRunAt;
				} else {
					const raw = request.cron === null ? "" : request.cron.trim();
					cron = raw === "" ? null : raw;
					nextRunAt = null;
					if (cron !== null) {
						nextRunAt = nextAfter(parseCron(cron), now);
						if (nextRunAt === null) throw new Error(`cron '${cron}' never fires within the planning horizon`);
					}
				}
				return {
					...current,
					title,
					prompt,
					status,
					cron,
					nextRunAt,
					...workspaceId === void 0 ? {} : { workspaceId },
					updatedAt: now
				};
			}) };
		} catch (error) {
			return { error: this.errorOf(error, "task-update") };
		}
	}
	/** Remove one task record. */
	async remove(request) {
		try {
			const id = request.id;
			if (id === "") return { error: {
				code: "invalid-id",
				message: "task id must not be empty"
			} };
			return { removed: await (await this.ready).table("tasks").delete(id) };
		} catch (error) {
			/* v8 ignore next -- the in-memory domain delete never rejects */
			return { error: this.errorOf(error, "task-remove") };
		}
	}
	/** Start one task immediately in a fresh agent session. */
	async run(request) {
		const id = request.id;
		if (id === "") return { error: {
			code: "invalid-id",
			message: "task id must not be empty"
		} };
		const table = (await this.ready).table("tasks");
		const current = table.get(id);
		if (current === void 0) return { error: {
			code: "task-not-found",
			message: `task '${id}' does not exist`
		} };
		if (current.status === "running" || this.runs.has(current.id)) return { error: {
			code: "task-already-running",
			message: `task '${current.title}' is already running`
		} };
		const workspaceId = request.workspaceId === void 0 || request.workspaceId === null ? current.workspaceId : this.deps.resolveWorkspaceId(request.workspaceId);
		if (request.workspaceId !== void 0 && request.workspaceId !== null && workspaceId === null) return { error: {
			code: "workspace-not-found",
			message: `workspace '${request.workspaceId}' does not exist`
		} };
		this.runs.add(current.id);
		try {
			const { agent, sessionId } = await createTaskAgent(this.deps, {
				cwd: this.deps.workspaceRoot(workspaceId),
				workspaceId
			});
			/* v8 ignore next -- admission lock above makes the already-running race unreachable */
			await table.update(current.id, (record) => record.status === "running" ? record : {
				...record,
				status: "running",
				sessionId,
				lastRunAt: Date.now(),
				result: null,
				workspaceId,
				updatedAt: Date.now()
			});
			this.completeRun(current.id, agent, current.prompt);
			return {
				started: true,
				sessionId
			};
		} catch (error) {
			this.runs.delete(current.id);
			return { error: this.errorOf(error, "task-run") };
		}
	}
	/** Recover interrupted runs and open the domain for the gateway. */
	async openDomain(ctx) {
		const domain = await ctx.get("storageDomain").open(taskDomainSpec);
		const now = Date.now();
		for (const [id, task] of [...domain.table("tasks").entries()]) {
			if (task.status !== "running") continue;
			/* v8 ignore next -- the running check above makes the already-failed race unreachable */
			await domain.table("tasks").update(id, (current) => current.status === "running" ? {
				...current,
				status: "failed",
				result: {
					reasonKind: "interrupted",
					errorCode: "host-restart",
					errorMessage: "the host restarted while the task was running"
				},
				updatedAt: now
			} : current);
		}
		return domain;
	}
	/** One scheduler pass: start every due task. */
	async schedulerTick() {
		try {
			const domain = await this.ready;
			const now = Date.now();
			for (const [id, task] of [...domain.table("tasks").entries()]) {
				if (task.status === "running" || this.runs.has(id)) continue;
				if (task.cron === null || task.nextRunAt === null || task.nextRunAt > now) continue;
				await this.runScheduled(id);
			}
		} catch (error) {
			/* v8 ignore next -- the missing-domain TypeError is the only reachable tick failure */
			this.deps.logger.warn(`web-enhanced scheduler tick failed: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	async runScheduled(id) {
		const table = (await this.ready).table("tasks");
		const current = table.get(id);
		if (current === void 0 || current.status === "running" || this.runs.has(id)) return;
		this.runs.add(id);
		try {
			const { agent, sessionId } = await createTaskAgent(this.deps, {
				cwd: this.deps.workspaceRoot(current.workspaceId),
				workspaceId: current.workspaceId
			});
			/* v8 ignore next -- admission lock above makes the already-running race unreachable */
			await table.update(id, (record) => record.status === "running" ? record : {
				...record,
				status: "running",
				sessionId,
				lastRunAt: Date.now(),
				result: null,
				updatedAt: Date.now()
			});
			this.completeRun(id, agent, current.prompt);
		} catch (error) {
			this.runs.delete(id);
			this.deps.logger.warn(`web-enhanced scheduled run for '${current.title}' failed to start: ${error instanceof Error ? error.message : String(error)}`);
		}
	}
	/** Drive the run to quiescence and settle the record (status + result + next run). */
	async completeRun(id, agent, prompt) {
		try {
			const outcome = await executeTaskAgent(this.deps, agent, prompt);
			const domain = await this.ready;
			const now = Date.now();
			await domain.table("tasks").update(id, (current) => {
				const result = outcome.result;
				const status = result.reasonKind === "completed" ? "done" : "failed";
				let nextRunAt = current.nextRunAt;
				if (current.cron !== null) try {
					nextRunAt = nextAfter(parseCron(current.cron), now);
				} catch {
					nextRunAt = null;
				}
				return {
					...current,
					status,
					result,
					nextRunAt,
					updatedAt: now
				};
			});
		} catch (error) {
			try {
				const domain = await this.ready;
				const now = Date.now();
				await domain.table("tasks").update(id, (current) => ({
					...current,
					status: "failed",
					result: {
						reasonKind: "interrupted",
						errorCode: "run-failed",
						errorMessage: error instanceof Error ? error.message : String(error)
					},
					updatedAt: now
				}));
			} catch (settleError) {
				/* v8 ignore next -- domain and backend failures are always Error instances */
				this.deps.logger.warn(`web-enhanced run settlement failed for '${id}': ${settleError instanceof Error ? settleError.message : String(settleError)}`);
			}
		} finally {
			this.runs.delete(id);
		}
	}
	errorOf(error, fallback) {
		const message = error instanceof Error ? error.message : String(error);
		return {
			code: error instanceof Error && error.code === "ENOENT" ? "not-found" : fallback,
			message
		};
	}
};
//#endregion
//#region lib/types/files.js
/**
* Workspace file operations behind the web-enhanced gateway: bounded listing,
* name search, read (size-capped, binary-sniffed), write, and delete. Every
* path resolves against the workspace root and is rejected when it escapes it.
* @module dsh-web-enhanced/src/files
*/
/**
* Resolve a workspace-relative path and assert it stays inside the root.
* @param root - canonical workspace root.
* @param rel - forward-slash relative path; empty means the root itself.
* @returns the resolved absolute path.
* @throws when the path is absolute or traverses upward.
*/
function resolveWithin(root, rel) {
	if (rel.includes("\\")) throw new Error(`path '${rel}' must use forward slashes`);
	if (rel === "") return root;
	if (rel.startsWith("/") || /^[A-Za-z]:[\\/]/u.test(rel)) throw new Error(`path '${rel}' must be relative`);
	const segments = rel.split("/");
	if (segments.some((segment) => segment === ".." || segment === ".")) throw new Error(`path '${rel}' must not contain '.' or '..' segments`);
	const resolved = resolve(join(root, ...segments));
	/* v8 ignore next -- defensive: the segment check above already rejects traversal */
	if (resolved !== root && !resolved.startsWith(root + sep)) throw new Error(`path '${rel}' escapes the workspace root`);
	return resolved;
}
/** Display form: workspace-relative with forward slashes. */
function displayPath(root, full) {
	/* v8 ignore next -- callers always pass a path strictly inside the root */
	return full === root ? "" : full.slice(root.length + 1).split(sep).join("/");
}
/**
* Directory-first, then name-ascending order. Pure: names are unique within
* one directory, so the comparator never answers 0.
* @param left - first entry.
* @param right - second entry.
* @returns -1 when left sorts first, 1 otherwise.
*/
function compareFsEntries(left, right) {
	if (left.kind !== right.kind) return left.kind === "dir" ? -1 : 1;
	return left.name < right.name ? -1 : 1;
}
/** One directory listing, skipping `.git` and the configured skip dirs. */
async function listDirectory(root, rel, limits) {
	const dir = resolveWithin(root, rel);
	const entries = await readdir(dir, { withFileTypes: true });
	const out = [];
	for (const entry of entries) {
		if (entry.isDirectory() && (entry.name === ".git" || limits.skipDirs.includes(entry.name))) continue;
		const full = join(dir, entry.name);
		const kind = entry.isDirectory() ? "dir" : "file";
		let size;
		if (kind === "file") try {
			size = (await stat(full)).size;
		} catch {}
		out.push({
			name: entry.name,
			path: displayPath(root, full),
			kind,
			...size === void 0 ? {} : { size }
		});
	}
	out.sort(compareFsEntries);
	return out;
}
/**
* Recursive basename search with bounded depth and result count.
*
* Skips `.git` and every configured `skipDirs` (default `node_modules`) in
* BOTH consumers — the file tree and the mention pickers. Dependency trees
* are the files a composer mention is least likely to name, and letting them
* flood a bounded list would crowd out the actual project files; the host-wide
* browse walker is the escape hatch for anything inside a skipped directory.
*
* Within one directory, FILES come before subdirectories (each group
* name-sorted). That ordering is what makes a root-level `TODO.md` / README /
* config reach the bounded result even when a deep `lib` or `src` tree would
* otherwise consume every remaining seat first.
*/
async function searchFiles(root, rel, query, limits) {
	const needle = query.trim().toLowerCase();
	const out = [];
	/** Files first, then directories; each group name-ascending. */
	const compareDirents = (left, right) => {
		const leftDir = left.isDirectory() ? 1 : 0;
		const rightDir = right.isDirectory() ? 1 : 0;
		if (leftDir !== rightDir) return leftDir - rightDir;
		return left.name < right.name ? -1 : left.name > right.name ? 1 : 0;
	};
	const walk = async (dir, depth) => {
		if (depth > limits.searchMaxDepth || out.length >= limits.searchMaxEntries) return;
		const entries = (await readdir(dir, { withFileTypes: true })).sort(compareDirents);
		for (const entry of entries) {
			if (out.length >= limits.searchMaxEntries) return;
			if (entry.name === ".git") continue;
			const full = join(dir, entry.name);
			if (entry.isDirectory()) {
				if (limits.skipDirs.includes(entry.name)) continue;
				if (needle === "" || entry.name.toLowerCase().includes(needle)) out.push({
					name: entry.name,
					path: displayPath(root, full),
					kind: "dir"
				});
				await walk(full, depth + 1);
			} else if (needle === "" || entry.name.toLowerCase().includes(needle)) {
				let size;
				try {
					size = (await stat(full)).size;
				} catch {}
				/* v8 ignore next -- the vanished-entry stat failure above is the only way size stays undefined */
				out.push({
					name: entry.name,
					path: displayPath(root, full),
					kind: "file",
					...size === void 0 ? {} : { size }
				});
			}
		}
	};
	await walk(resolveWithin(root, rel), 0);
	return out;
}
/**
* Read one file: text (capped, truncated flag) or binary (base64 when small
* enough for preview). Binary detection sniffs the first 8 KiB for a NUL.
*/
async function readFileView(root, rel, limits) {
	const full = resolveWithin(root, rel);
	const info = await stat(full);
	if (info.isDirectory()) return { error: {
		code: "is-directory",
		message: `path '${rel}' is a directory`
	} };
	const handle = await open(full, "r");
	try {
		const sniff = Buffer.alloc(8192);
		const sniffed = await handle.read(sniff, 0, 8192, 0);
		if (sniffed.bytesRead > 0 && sniff.subarray(0, sniffed.bytesRead).includes(0)) {
			if (info.size > limits.binaryMaxBytes) return {
				kind: "binary",
				content: "",
				truncated: true,
				size: info.size
			};
			const whole = Buffer.alloc(info.size);
			await handle.read(whole, 0, info.size, 0);
			return {
				kind: "binary",
				content: whole.toString("base64"),
				truncated: false,
				size: info.size
			};
		}
		const max = Math.min(info.size, limits.readMaxBytes);
		const buf = Buffer.alloc(max);
		await handle.read(buf, 0, max, 0);
		return {
			kind: "text",
			content: buf.toString("utf8"),
			truncated: max < info.size,
			size: info.size
		};
	} finally {
		await handle.close();
	}
}
/**
* Count the lines of one text file, for an untracked file's added-line count.
*
* `null` rather than a number whenever the answer would be a guess: a binary
* file (git reports `-` for those), a file over the read cap (a partial read
* would undercount), or one that cannot be read at all — an untracked entry can
* vanish between `git ls-files` and this read, and that is not worth an error.
*
* Counts the way git does: newlines, plus one for a final line without its own
* terminator.
* @param root - canonical workspace root.
* @param rel - workspace-relative path.
* @param limits - the read caps.
* @returns the line count, or null when it is not knowable.
*/
async function countTextLines(root, rel, limits) {
	let handle;
	try {
		const full = resolveWithin(root, rel);
		const info = await stat(full);
		if (!info.isFile()) return null;
		if (info.size === 0) return 0;
		if (info.size > limits.readMaxBytes) return null;
		handle = await open(full, "r");
		const buf = Buffer.alloc(info.size);
		await handle.read(buf, 0, info.size, 0);
		if (buf.subarray(0, 8192).includes(0)) return null;
		let lines = 0;
		for (let at = buf.indexOf(10); at !== -1; at = buf.indexOf(10, at + 1)) lines += 1;
		if (buf.at(-1) !== 10) lines += 1;
		return lines;
	} catch {
		return null;
	} finally {
		await handle?.close();
	}
}
/** Write one UTF-8 text file (capped). */
async function writeFileView(root, rel, content, limits) {
	const full = resolveWithin(root, rel);
	const bytes = Buffer.byteLength(content, "utf8");
	if (bytes > limits.writeMaxBytes) throw new Error(`content is ${bytes} bytes, over the ${limits.writeMaxBytes} byte cap`);
	await writeFile(full, content, "utf8");
}
/** Delete one file (never a directory). */
async function deleteFileView(root, rel) {
	const full = resolveWithin(root, rel);
	if ((await stat(full)).isDirectory()) throw new Error(`path '${rel}' is a directory`);
	await rm(full);
}
//#endregion
//#region lib/types/git.js
/**
* Git operations behind the web-enhanced gateway. Every command runs through
* the subprocess seam against the workspace root; output is bounded and
* mutation failures surface their stderr.
* @module dsh-web-enhanced/src/git
*/
/**
* Read `--numstat` rows into per-file line counts.
*
* One `<added>\t<removed>\t<path>` per file, with `-` for a binary file's
* counts. A rename is emitted as three NUL-free fields where the path is
* `old => new` inside braces, so it is kept verbatim — the display shows what
* git says rather than guessing at the halves.
* @param text - the numstat section.
* @returns one entry per parsable row.
*/
function parseNumstat(text) {
	const files = [];
	for (const line of text.split("\n")) {
		const row = line.trimEnd();
		if (row === "") continue;
		const fields = row.split("	");
		if (fields.length < 3) continue;
		const [added = "", removed = "", ...pathParts] = fields;
		files.push({
			path: pathParts.join("	"),
			added: added === "-" ? null : Number(added),
			removed: removed === "-" ? null : Number(removed)
		});
	}
	return files;
}
/**
* Read `git show --numstat` output into one commit detail.
*
* The header is everything before the record separator the format appends;
* the numstat rows follow it.
* @param stdout - the command's output.
* @returns the parsed detail; a missing separator yields an empty file list.
*/
function parseCommitDetail(stdout) {
	const split = stdout.indexOf("");
	const header = split === -1 ? stdout : stdout.slice(0, split);
	const rest = split === -1 ? "" : stdout.slice(split + 1);
	const [hash = "", parents = "", author = "", email = "", at = "", subject = "", ...bodyParts] = header.split("");
	return {
		hash,
		parents: parents === "" ? [] : parents.split(" "),
		author,
		email,
		date: Number(at),
		subject,
		body: bodyParts.join("").trim(),
		files: parseNumstat(rest)
	};
}
/** Reject a repository-relative path with traversal or absolutes. */
function assertSafeRelPath(path) {
	if (path.startsWith("/") || /^[A-Za-z]:[\\/]/u.test(path)) throw new Error(`path '${path}' must be relative`);
	if (path.split("/").some((segment) => segment === ".." || segment === ".")) throw new Error(`path '${path}' must not contain '.' or '..' segments`);
}
/** Reject anything that could be read as a git option or a second revision. */
function assertSafeRev(rev) {
	if (rev === "") throw new Error("revision must not be empty");
	if (rev.startsWith("-")) throw new Error(`revision '${rev}' must not start with '-'`);
	if (/[\s~^:?*[\]\\]/u.test(rev) || rev.includes("..")) throw new Error(`revision '${rev}' contains characters a single ref may not`);
}
/** Thin subprocess-backed git client rooted at one workspace. */
var GitClient = class {
	subprocess;
	root;
	limits;
	/**
	* @param subprocess - subprocess seam.
	* @param root - workspace root; the cwd of every invocation.
	* @param limits - output bounds.
	*/
	constructor(subprocess, root, limits) {
		this.subprocess = subprocess;
		this.root = root;
		this.limits = limits;
	}
	async run(argv) {
		const handle = this.subprocess.spawn({
			argv: ["git", ...argv],
			cwd: this.root,
			stdio: {
				stdin: "ignore",
				stdout: { maxBytes: this.limits.outputMaxBytes },
				stderr: { maxBytes: this.limits.outputMaxBytes }
			},
			graceMs: 5e3
		});
		return {
			exitCode: (await handle.done).exitCode,
			stdout: handle.collected.stdout?.readFrom(0).text ?? "",
			stderr: handle.collected.stderr?.readFrom(0).text ?? ""
		};
	}
	/** True when the root is inside a git work tree. */
	async isRepo() {
		const run = await this.run(["rev-parse", "--is-inside-work-tree"]);
		return run.exitCode === 0 && run.stdout.trim() === "true";
	}
	/** Local branches with the checked-out marker. */
	async branches() {
		const run = await this.run(["branch", "--format=%(refname:short)"]);
		if (run.exitCode !== 0) throw new Error(run.stderr.trim() || "git branch failed");
		const head = await this.run([
			"symbolic-ref",
			"--short",
			"HEAD"
		]);
		const current = head.exitCode === 0 ? head.stdout.trim() : null;
		return run.stdout.split("\n").filter(Boolean).map((name) => ({
			name: name.trim(),
			current: name.trim() === current
		}));
	}
	/**
	* Recent commits, newest first, with branch markers.
	* @param maxCount - row cap.
	* @param branch - walk only this ref's history; omitted walks every ref.
	* @returns the commit rows.
	*/
	async log(maxCount, branch) {
		const fmt = "%H%x1f%P%x1f%an%x1f%at%x1f%s";
		let scope = ["--all"];
		if (branch !== void 0 && branch !== "") {
			assertSafeRev(branch);
			scope = [branch];
		}
		const run = await this.run([
			"log",
			...scope,
			"--date-order",
			`--max-count=${maxCount}`,
			`--pretty=format:${fmt}`
		]);
		if (run.exitCode !== 0) throw new Error(run.stderr.trim() || "git log failed");
		const refs = await this.collectRefs();
		return run.stdout.split("\n").filter(Boolean).map((line) => {
			const [hash = "", parents = "", author = "", at = "", ...rest] = line.split("");
			return {
				hash,
				parents: parents === "" ? [] : parents.split(" "),
				refs: refs.get(hash) ?? [],
				author,
				date: Number(at),
				subject: rest.join("")
			};
		});
	}
	/**
	* One commit's identity and per-file change counts.
	*
	* `--numstat` against the FIRST parent only: a merge diffed against every
	* parent lists the same file once per side and would read as several
	* changes, and the useful question about a merge is what it brought in.
	* A binary file reports `-` for both counts, which stays `null` here rather
	* than becoming a fake zero.
	* @param hash - the commit to describe.
	* @returns identity, message body, and changed files.
	*/
	async commit(hash) {
		assertSafeRev(hash);
		const run = await this.run([
			"show",
			"--no-color",
			"--first-parent",
			"-m",
			"--numstat",
			`--format=%H%x1f%P%x1f%an%x1f%ae%x1f%at%x1f%s%x1f%b%x1e`,
			hash
		]);
		if (run.exitCode !== 0) throw new Error(run.stderr.trim() || "git show failed");
		return parseCommitDetail(run.stdout);
	}
	/**
	* The uncommitted state of the work tree, as the graph's top row shows it.
	*
	* Three reads, because git computes three different diffs and there is no
	* single command that answers all of them: `--cached` is the index against
	* HEAD, a plain `diff` is the work tree against the index, and untracked
	* files are in neither — they are listed by `ls-files --others`.
	*
	* An untracked file has no numstat at all (git would have to add it to the
	* index first, which this must not do), so its added-line count comes from
	* `countLines`, applied only to the entries that survive the cap. Without a
	* counter, or when the file is binary or over the read cap, the count stays
	* `null` and the display shows what a binary file shows.
	* @param maxFiles - cap on the returned file list.
	* @param countLines - optional line counter for untracked files.
	* @returns the working view; totals are pre-cap.
	*/
	async working(maxFiles, countLines) {
		const headRun = await this.run(["rev-parse", "HEAD"]);
		const head = headRun.exitCode === 0 ? headRun.stdout.trim() : "";
		const stagedRun = await this.run([
			"diff",
			"--cached",
			"--numstat"
		]);
		if (stagedRun.exitCode !== 0) throw new Error(stagedRun.stderr.trim() || "git diff --cached failed");
		const unstagedRun = await this.run(["diff", "--numstat"]);
		if (unstagedRun.exitCode !== 0) throw new Error(unstagedRun.stderr.trim() || "git diff failed");
		const othersRun = await this.run([
			"ls-files",
			"--others",
			"--exclude-standard",
			"-z"
		]);
		if (othersRun.exitCode !== 0) throw new Error(othersRun.stderr.trim() || "git ls-files failed");
		const staged = parseNumstat(stagedRun.stdout);
		const unstaged = parseNumstat(unstagedRun.stdout);
		const untracked = othersRun.stdout.split("\0").filter((path) => path !== "");
		const all = [
			...staged.map((file) => ({
				...file,
				state: "staged"
			})),
			...unstaged.map((file) => ({
				...file,
				state: "unstaged"
			})),
			...untracked.map((path) => ({
				path,
				state: "untracked",
				added: null,
				removed: null
			}))
		];
		const truncated = all.length > maxFiles;
		const files = truncated ? all.slice(0, maxFiles) : all;
		if (countLines !== void 0) await Promise.all(files.map(async (file, index) => {
			if (file.state !== "untracked") return;
			files[index] = {
				...file,
				added: await countLines(file.path)
			};
		}));
		return {
			head,
			files,
			staged: staged.length,
			unstaged: unstaged.length,
			untracked: untracked.length,
			truncated
		};
	}
	/** Branch names per commit hash (heads and remotes). */
	async collectRefs() {
		const run = await this.run([
			"for-each-ref",
			"refs/heads",
			"refs/remotes",
			"--format=%(refname:short)%x1f%(objectname)"
		]);
		if (run.exitCode !== 0) return /* @__PURE__ */ new Map();
		const map = /* @__PURE__ */ new Map();
		for (const line of run.stdout.split("\n")) {
			if (line === "") continue;
			const split = line.indexOf("");
			if (split === -1) continue;
			const name = line.slice(0, split);
			const hash = line.slice(split + 1);
			const list = map.get(hash) ?? [];
			list.push(name);
			map.set(hash, list);
		}
		return map;
	}
	/** Check out one branch; a rejected switch returns its stderr. */
	async checkout(branch) {
		if (branch === "") throw new Error("branch name must not be empty");
		const run = await this.run(["checkout", branch]);
		if (run.exitCode === 0) return { ok: true };
		return {
			ok: false,
			message: run.stderr.trim() || "git checkout failed"
		};
	}
	/**
	* Worktree status in porcelain v1 (NUL-separated). A rename or copy is
	* emitted as `XY <new>\0<orig>\0` — the entry's own path is the NEW one, so
	* it stays usable as a git path argument, and the source rides `origPath`.
	*/
	async status() {
		const run = await this.run([
			"status",
			"--porcelain=v1",
			"-z"
		]);
		if (run.exitCode !== 0) throw new Error(run.stderr.trim() || "git status failed");
		const entries = [];
		const parts = run.stdout.split("\0");
		for (let index = 0; index < parts.length; index++) {
			const part = parts[index];
			if (part.length < 3) continue;
			const staged = part[0];
			const unstaged = part[1];
			const path = part.slice(3);
			let origPath;
			if ((staged === "R" || staged === "C") && index + 1 < parts.length) {
				origPath = parts[index + 1];
				index++;
			}
			entries.push({
				path,
				...origPath === void 0 ? {} : { origPath },
				staged,
				unstaged
			});
		}
		return entries;
	}
	/** Unified diff text of one path (or the whole tree), optionally staged. */
	async diff(path, staged) {
		const argv = ["diff"];
		if (staged) argv.push("--cached");
		if (path !== void 0 && path !== "") {
			assertSafeRelPath(path);
			argv.push("--", path);
		}
		const run = await this.run(argv);
		if (run.exitCode !== 0) throw new Error(run.stderr.trim() || "git diff failed");
		return run.stdout;
	}
	/** Stage one or more paths. */
	async stage(paths) {
		await this.mutate([
			"add",
			"--",
			...this.assertPaths(paths)
		]);
	}
	/** Unstage one or more paths. */
	async unstage(paths) {
		await this.mutate([
			"restore",
			"--staged",
			"--",
			...this.assertPaths(paths)
		]);
	}
	/** Discard worktree changes of one or more tracked paths. */
	async discard(paths) {
		await this.mutate([
			"restore",
			"--",
			...this.assertPaths(paths)
		]);
	}
	assertPaths(paths) {
		if (paths.length === 0) throw new Error("at least one path is required");
		for (const path of paths) assertSafeRelPath(path);
		return [...paths];
	}
	async mutate(argv) {
		const run = await this.run(argv);
		if (run.exitCode !== 0) throw new Error(run.stderr.trim() || "git command failed");
	}
};
/** XML nesting guard against pathological documents. */
const MAX_XML_DEPTH = 64;
/** Office extensions mapped to their converter kind. */
const OFFICE_EXT = {
	".docx": "docx",
	".xlsx": "xlsx"
};
/** The converter kind for one file name, or null for unsupported formats. */
function officeKindOf(name) {
	const lower = name.toLowerCase();
	for (const [ext, kind] of Object.entries(OFFICE_EXT)) if (lower.endsWith(ext)) return kind;
	return null;
}
/**
* Read one Office file inside the workspace and convert it to preview
* blocks. Legacy binary formats (.doc/.xls) answer a dedicated error.
* @param root - canonical workspace root.
* @param rel - workspace-relative path.
* @param limits - conversion bounds.
* @returns the preview result; errors are result fields, never throws.
*/
async function officePreviewView(root, rel, limits) {
	const kind = officeKindOf(rel);
	if (kind === null) return { error: {
		code: "office-unsupported",
		message: `'${rel}' is not a supported Office format (docx/xlsx)`
	} };
	const full = resolveWithin(root, rel);
	const info = await stat(full);
	if (info.size > limits.maxBytes) return { error: {
		code: "office-too-large",
		message: `'${rel}' is ${info.size} bytes, over the ${limits.maxBytes} byte preview cap`
	} };
	const data = await readFile(full);
	try {
		const converted = kind === "docx" ? convertDocx(data) : convertXlsx(data);
		return {
			kind,
			blocks: converted.blocks,
			truncated: converted.truncated
		};
	} catch {
		return { error: {
			code: "office-invalid",
			message: `'${rel}' could not be parsed as ${kind}`
		} };
	}
}
/** Split a tag's attribute list into a name/value map. */
function parseAttrs(raw) {
	const attrs = {};
	const re = /([A-Za-z_:][A-Za-z0-9_.:-]*)\s*=\s*"([^"]*)"/gu;
	let match;
	while ((match = re.exec(raw)) !== null) attrs[match[1]] = match[2];
	return attrs;
}
/** Scan one XML document into a tag/character-data event stream. */
function* scanXml(xml) {
	let index = 0;
	const length = xml.length;
	while (index < length) {
		const open = xml.indexOf("<", index);
		if (open === -1) {
			if (index < length) yield xml.slice(index);
			return;
		}
		if (open > index) yield xml.slice(index, open);
		if (xml.startsWith("<!--", open)) {
			const close = xml.indexOf("-->", open + 4);
			if (close === -1) return;
			index = close + 3;
			continue;
		}
		if (xml.startsWith("<![CDATA[", open)) {
			const close = xml.indexOf("]]>", open + 9);
			if (close === -1) return;
			yield xml.slice(open + 9, close);
			index = close + 3;
			continue;
		}
		if (xml.startsWith("<?", open) || xml.startsWith("<!", open)) {
			const close = xml.indexOf(">", open);
			if (close === -1) return;
			index = close + 1;
			continue;
		}
		const close = xml.indexOf(">", open);
		if (close === -1) return;
		const inner = xml.slice(open + 1, close);
		const selfClosing = inner.endsWith("/");
		const body = selfClosing ? inner.slice(0, -1).trimEnd() : inner.trim();
		const space = body.search(/[\s]/u);
		const name = space === -1 ? body : body.slice(0, space);
		const attrsRaw = space === -1 ? "" : body.slice(space + 1);
		const closing = name.startsWith("/");
		yield {
			name: closing ? name.slice(1) : name,
			attrs: closing ? {} : parseAttrs(attrsRaw),
			closing,
			selfClosing
		};
		index = close + 1;
	}
}
/** Build a bounded XML tree from one document. */
function parseXml(xml) {
	const root = {
		name: "#root",
		attrs: {},
		children: [],
		text: ""
	};
	const stack = [root];
	for (const event of scanXml(xml)) {
		if (typeof event === "string") {
			const current = stack[stack.length - 1];
			if (current.children.length === 0) current.text += event;
			else current.children[current.children.length - 1].text += event;
			continue;
		}
		if (event.closing) {
			if (stack.length > 1) stack.pop();
			continue;
		}
		const node = {
			name: event.name,
			attrs: event.attrs,
			children: [],
			text: ""
		};
		stack[stack.length - 1].children.push(node);
		if (!event.selfClosing && stack.length < MAX_XML_DEPTH) stack.push(node);
	}
	return root;
}
/** Collect the text of a subtree in document order, with tab/break tokens. */
function collectText(node) {
	if (node.name === "w:t" || node.name === "t") return node.text;
	if (node.name === "w:tab" || node.name === "tab") return "	";
	if (node.name === "w:br" || node.name === "br") return "\n";
	if (node.name === "w:instrText" || node.name === "w:delText" || node.name === "rPh") return "";
	let out = "";
	for (const child of node.children) out += collectText(child);
	return out;
}
/** Find all descendants with one tag name, in document order. */
function descendants(node, name) {
	const out = [];
	for (const child of node.children) {
		if (child.name === name) out.push(child);
		out.push(...descendants(child, name));
	}
	return out;
}
/** Heading level of a paragraph's style, or 0 for body text. */
function headingLevel(paragraph) {
	const value = (paragraph.children.find((child) => child.name === "w:pPr")?.children.find((child) => child.name === "w:pStyle"))?.attrs["w:val"] ?? "";
	const heading = /^(?:Heading|标题|Titre|Überschrift)\s*([1-3])$/iu.exec(value);
	if (heading !== null) return Number(heading[1]);
	if (value === "1" || value === "2" || value === "3") return Number(value);
	return 0;
}
/** Whether a paragraph carries a numbering property (a list item). */
function isListItem(paragraph) {
	return paragraph.children.some((child) => child.name === "w:pPr" && child.children.some((grand) => grand.name === "w:numPr"));
}
/** Bounded table extraction: rows capped, columns capped, cells padded. */
function extractTable(table) {
	const rows = [];
	let truncated = false;
	for (const row of descendants(table, "w:tr")) {
		if (rows.length >= 200) {
			truncated = true;
			break;
		}
		const cells = [];
		for (const cell of descendants(row, "w:tc")) {
			if (cells.length >= 50) break;
			cells.push(collectText(cell).replace(/\s+/gu, " ").trim());
		}
		if (cells.some((cell) => cell !== "")) rows.push(cells);
	}
	return {
		rows,
		truncated
	};
}
function convertDocx(data) {
	const document = unzipIndex(data)["word/document.xml"];
	if (document === void 0) throw new Error("docx: word/document.xml missing");
	const body = descendants(parseXml(new TextDecoder().decode(document)), "w:body")[0];
	const blocks = [];
	let truncated = false;
	const push = (block) => {
		if (block === null) return;
		if (blocks.length >= 2e3) {
			truncated = true;
			return;
		}
		blocks.push(block);
	};
	const walk = (node) => {
		if (node.name === "w:p") {
			const text = collectText(node).trim();
			if (text === "") return;
			const level = headingLevel(node);
			if (level !== 0) push({
				type: `h${level}`,
				text
			});
			else if (isListItem(node)) push({
				type: "li",
				text
			});
			else push({
				type: "p",
				text
			});
			return;
		}
		if (node.name === "w:tbl") {
			const table = extractTable(node);
			if (table.rows.length > 0) push({
				type: "table",
				rows: table.rows
			});
			if (table.truncated) truncated = true;
			return;
		}
		if (node.name === "w:sectPr" || node.name === "w:bookmarkStart" || node.name === "w:bookmarkEnd") return;
		for (const child of node.children) walk(child);
	};
	if (body !== void 0) walk(body);
	return {
		blocks,
		truncated
	};
}
/** Parse the shared string table into an ordered string list. */
function sharedStrings(data) {
	const root = parseXml(new TextDecoder().decode(data));
	const out = [];
	for (const si of descendants(root, "si")) out.push(collectText(si).replace(/\s+/gu, " ").trim());
	return out;
}
/** Convert a spreadsheet cell reference like "AB12" into a zero-based column. */
function columnOf(ref) {
	let column = 0;
	for (const char of ref) {
		if (char < "A" || char > "Z") break;
		column = column * 26 + (char.charCodeAt(0) - 64);
	}
	return column - 1;
}
function convertXlsx(data) {
	const files = unzipIndex(data);
	const stringsXml = files["xl/sharedStrings.xml"];
	const strings = stringsXml === void 0 ? [] : sharedStrings(stringsXml);
	const sheetName = firstWorksheet(files);
	const sheetXml = sheetName === null ? void 0 : files[sheetName];
	if (sheetXml === void 0) throw new Error("xlsx: no worksheet found");
	const root = parseXml(new TextDecoder().decode(sheetXml));
	const rows = [];
	let truncated = false;
	for (const row of descendants(root, "row")) {
		if (rows.length >= 200) {
			truncated = true;
			break;
		}
		const cells = [];
		for (const cell of descendants(row, "c")) {
			if (cells.length >= 50) break;
			const type = cell.attrs["t"];
			const valueNode = cell.children.find((child) => child.name === "v");
			let value = "";
			if (type === "s" && valueNode !== void 0) {
				const shared = Number(valueNode.text);
				value = Number.isInteger(shared) && shared >= 0 && shared < strings.length ? strings[shared] : "";
			} else if (type === "inlineStr") {
				const is = cell.children.find((child) => child.name === "is");
				value = is === void 0 ? "" : collectText(is);
			} else value = valueNode?.text ?? "";
			const column = columnOf(cell.attrs["r"] ?? "");
			const index = column >= 0 && column < 50 ? column : cells.length;
			while (cells.length < index) cells.push("");
			if (index < 50) cells[index] = value.replace(/\s+/gu, " ").trim();
		}
		if (cells.some((cell) => cell !== "")) rows.push(cells);
	}
	if (rows.length === 0) return {
		blocks: [],
		truncated
	};
	const width = Math.max(...rows.map((row) => row.length));
	return {
		blocks: [{
			type: "table",
			rows: rows.map((row) => {
				const filled = [...row];
				while (filled.length < width) filled.push("");
				return filled;
			})
		}],
		truncated
	};
}
/** The first worksheet path by worksheet order (workbook.xml) or sheet1. */
function firstWorksheet(files) {
	const workbook = files["xl/workbook.xml"];
	if (workbook !== void 0) {
		const rid = descendants(parseXml(new TextDecoder().decode(workbook)), "sheet")[0]?.attrs["r:id"];
		if (rid !== void 0) {
			const rels = files["xl/_rels/workbook.xml.rels"];
			if (rels !== void 0) {
				const relRoot = parseXml(new TextDecoder().decode(rels));
				for (const rel of descendants(relRoot, "Relationship")) if (rel.attrs["Id"] === rid) {
					const target = rel.attrs["Target"];
					if (target !== void 0) {
						const name = target.startsWith("/") ? target.slice(1) : `xl/${target}`;
						if (files[name] !== void 0) return name;
					}
				}
			}
		}
	}
	if (files["xl/worksheets/sheet1.xml"] !== void 0) return "xl/worksheets/sheet1.xml";
	return Object.keys(files).find((name) => /^xl\/worksheets\/sheet\d+\.xml$/u.test(name)) ?? null;
}
/** Unzip into a name→content map; zip bombs are guarded by the byte cap. */
function unzipIndex(data) {
	return unzipSync(data);
}
//#endregion
//#region lib/types/profile.js
/**
* The profile this plugin is installed into: locating it, reading its plugin
* inventory, and reconciling its bundle layer list.
*
* A dsh profile is an ordinary npm package directory under `$DSH_HOME/profiles/`
* whose `package.json` carries a `dsh.profile.bundles` list. `dsh plugin` is a
* thin pnpm forwarder over that directory, so managing plugins from inside the
* running host is the same two steps the CLI performs: run pnpm there, then
* rewrite the layer list from the INSTALLED state.
*
* Nothing here imports `@deepseek-ai/dsh-app-boot`, which owns these routines
* for the CLI. That package is a dependency of the dsh installation, not of the
* profile — a plugin peer-depending on it would fail to resolve in exactly the
* deployment this code runs in. The manifest shape is a stable on-disk contract,
* so it is read directly instead.
* @module dsh-web-enhanced/src/profile
*/
/**
* Read and parse a JSON file, or undefined when it is absent or malformed.
* @param path - absolute file path.
* @returns the parsed value, or undefined.
*/
async function readJson(path) {
	try {
		const parsed = JSON.parse(await readFile(path, "utf8"));
		return typeof parsed === "object" && parsed !== null ? parsed : void 0;
	} catch {
		return;
	}
}
/**
* Whether a manifest declares a profile bundle list.
* @param manifest - a parsed package.json.
* @returns true when `dsh.profile` is present.
*/
function isProfileManifest(manifest) {
	const dsh = manifest["dsh"];
	return typeof dsh === "object" && dsh !== null && "profile" in dsh;
}
/**
* Locate the profile directory containing this module.
*
* The search walks up from the module's own location rather than consulting
* `$DSH_HOME`: a plugin is loaded FROM the profile that installed it, so its
* path is the authority on which profile it belongs to, and a host launched
* with a non-default home or an unusual profile name still resolves correctly.
* A deployment that loads this plugin from outside any profile (a source
* checkout, a test) simply has no profile, and the management surface degrades.
* @param from - starting directory; defaults to this module's directory.
* @returns the profile directory, or undefined when none is above it.
*/
async function findProfileDir(from) {
	let dir = from ?? dirname(fileURLToPath(import.meta.url));
	for (let depth = 0; depth < 40; depth += 1) {
		const manifest = await readJson(join(dir, "package.json"));
		if (manifest !== void 0 && isProfileManifest(manifest)) return dir;
		const parent = dirname(dir);
		if (parent === dir) return void 0;
		dir = parent;
	}
}
/**
* Read a profile's manifest.
* @param profileDir - absolute profile directory.
* @returns the manifest.
* @throws when the manifest is missing or unreadable.
*/
async function readProfileManifest(profileDir) {
	const manifest = await readJson(join(profileDir, "package.json"));
	if (manifest === void 0) throw new Error(`profile manifest unreadable at ${profileDir}`);
	return manifest;
}
/**
* Write a profile's manifest back, preserving npm's two-space formatting.
* @param profileDir - absolute profile directory.
* @param manifest - the manifest to serialize.
*/
async function writeProfileManifest(profileDir, manifest) {
	await writeFile(join(profileDir, "package.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}
/**
* Read one installed dependency's manifest from the profile's `node_modules`.
*
* The direct path is used rather than `require.resolve`: pnpm links every
* direct dependency at `<profile>/node_modules/<name>`, while many packages'
* `exports` maps refuse to expose `package.json` at all.
* @param profileDir - absolute profile directory.
* @param packageName - the dependency name.
* @returns the installed manifest, or undefined when not materialized.
*/
async function readInstalled(profileDir, packageName) {
	return readJson(join(profileDir, "node_modules", ...packageName.split("/"), "package.json"));
}
/**
* Whether an installed dependency exports a profile patch, i.e. is a bundle.
*
* Mirrors the CLI's own test, and for the same reason: the layer list follows
* INSTALLED state, so a package that only gained its `dsh.bundle` declaration
* in a newer version joins the stack on update.
* @param manifest - the installed package manifest, when materialized.
* @returns true when it declares `dsh.bundle.patch`.
*/
function declaresBundle(manifest) {
	if (manifest === void 0) return false;
	const dsh = manifest["dsh"];
	if (typeof dsh !== "object" || dsh === null) return false;
	const bundle = dsh["bundle"];
	if (typeof bundle !== "object" || bundle === null) return false;
	return bundle["patch"] !== void 0;
}
/**
* Resolve the directory of the package this module belongs to, canonicalized.
*
* Used to recognize this plugin's own inventory row by IDENTITY rather than by
* name, so an alias install (`pnpm add mine@github:…`) is still recognized as
* self and does not offer a silent self-removal.
* @returns the canonical package directory, or undefined when unresolvable.
*/
async function selfPackageDir() {
	let dir = dirname(fileURLToPath(import.meta.url));
	for (let depth = 0; depth < 10; depth += 1) {
		const manifest = await readJson(join(dir, "package.json"));
		if (manifest !== void 0 && typeof manifest["name"] === "string") try {
			return await realpath(dir);
		} catch {
			return dir;
		}
		const parent = dirname(dir);
		if (parent === dir) return void 0;
		dir = parent;
	}
}
/**
* Project a profile's manifest and installed state into the plugin inventory.
*
* Only `dependencies` are listed: those are what `dsh plugin add` writes and
* what pnpm can remove. Template bundles appear in the layer list without being
* dependencies, so they are reported separately and never offered for removal.
* @param profileDir - absolute profile directory.
* @returns the inventory.
* @throws when the profile manifest cannot be read.
*/
async function readInventory(profileDir) {
	const manifest = await readProfileManifest(profileDir);
	const dependencies = manifest.dependencies ?? {};
	const bundles = manifest.dsh?.profile?.bundles ?? [];
	const selfDir = await selfPackageDir();
	const names = Object.keys(dependencies);
	const plugins = await Promise.all(names.map(async (name) => {
		const installed = await readInstalled(profileDir, name);
		let self = false;
		if (selfDir !== void 0) try {
			self = await realpath(join(profileDir, "node_modules", ...name.split("/"))) === selfDir;
		} catch {
			self = false;
		}
		const description = installed?.["description"];
		const version = installed?.["version"];
		return {
			name,
			spec: dependencies[name] ?? "",
			version: typeof version === "string" ? version : null,
			description: typeof description === "string" ? description : null,
			bundle: declaresBundle(installed),
			active: bundles.includes(name),
			self
		};
	}));
	return {
		dir: profileDir,
		name: profileDir.split(/[/\\]/u).filter((segment) => segment !== "").pop() ?? profileDir,
		plugins,
		templateBundles: bundles.filter((name) => !(name in dependencies))
	};
}
/**
* Reconcile `dsh.profile.bundles` against the installed state.
*
* This is the half of `dsh plugin` that is not pnpm, reimplemented to the same
* rule: a dependency resolving to a `dsh.bundle`-declaring package joins the
* layer stack; a dependency-managed name that no longer resolves to one leaves
* it. Template bundles are not dependencies and are never touched — removing
* `@deepseek-ai/dsh-base` from the list would unmount the deployment.
* @param profileDir - absolute profile directory.
* @param beforeDependencies - dependency names as they were BEFORE pnpm ran.
* @returns the layer names added and removed.
*/
async function reconcileBundles(profileDir, beforeDependencies) {
	const manifest = await readProfileManifest(profileDir);
	const dependencies = Object.keys(manifest.dependencies ?? {});
	const dependencySet = new Set(dependencies);
	const beforeSet = new Set(beforeDependencies);
	const bundles = [...manifest.dsh?.profile?.bundles ?? []];
	const added = [];
	const removed = [];
	const isBundle = /* @__PURE__ */ new Map();
	await Promise.all(dependencies.map(async (name) => {
		isBundle.set(name, declaresBundle(await readInstalled(profileDir, name)));
	}));
	for (const name of dependencies) if (isBundle.get(name) === true && !bundles.includes(name)) {
		bundles.push(name);
		added.push(name);
	}
	for (const name of [...bundles]) {
		const wasDependency = beforeSet.has(name) || dependencySet.has(name);
		const stillBundle = dependencySet.has(name) && isBundle.get(name) === true;
		if (wasDependency && !stillBundle) {
			bundles.splice(bundles.indexOf(name), 1);
			removed.push(name);
		}
	}
	if (added.length === 0 && removed.length === 0) return {
		added,
		removed
	};
	manifest.dsh = {
		...manifest.dsh,
		profile: {
			...manifest.dsh?.profile,
			bundles
		}
	};
	await writeProfileManifest(profileDir, manifest);
	return {
		added,
		removed
	};
}
/**
* Validate a package name before it becomes a pnpm argument.
*
* The name reaches a spawned process as one argv entry, so it can never become
* two — but it could still become an OPTION, or address a package the caller
* did not name. Only what npm itself accepts as a name passes.
* @param name - the candidate package name.
* @throws when the name is not a plain npm package name.
*/
function assertPackageName(name) {
	if (name === "") throw new Error("package name must not be empty");
	if (name.length > 214) throw new Error("package name is too long");
	if (!/^(?:@[a-z0-9][a-z0-9._-]*\/)?[a-z0-9][a-z0-9._-]*$/u.test(name)) throw new Error(`'${name}' is not a plain npm package name`);
}
//#endregion
//#region lib/types/pnpm.js
/**
* Running pnpm against the profile directory — the executing half of plugin
* management.
*
* `dsh plugin` is a pnpm forwarder, so removing or updating a plugin from the
* running host means the same two steps: run pnpm in the profile, then
* reconcile the layer list against the installed state. What this module adds
* over the CLI is what a long-lived server needs and a one-shot command does
* not — a single-flight lock, a deadline, and bounded output.
*
* None of it takes effect in the running process. Cordis composes the layer
* stack at boot; rewriting `node_modules` underneath a live tree changes what
* the NEXT start loads, nothing more. Every result therefore says so.
* @module dsh-web-enhanced/src/pnpm
*/
/**
* Build the argv that reaches the subprocess seam.
*
* The seam never shell-interprets, which is right for it and inconvenient
* here: on Windows `pnpm` is a `.cmd` shim that CreateProcess cannot execute,
* so the command interpreter has to be named explicitly. `/d` suppresses any
* AutoRun command the registry would otherwise inject into that interpreter.
*
* Joining the arguments with spaces is safe ONLY because every one of them is
* either a literal this module wrote or a package name that passed
* {@link assertPackageName} — no whitespace, quotes, or cmd metacharacters can
* be present. Do not extend this to user-supplied strings without quoting.
* @param args - pnpm arguments.
* @returns argv for the spawn seam.
*/
function pnpmArgv(args) {
	if (process.platform !== "win32") return ["pnpm", ...args];
	return [
		"cmd.exe",
		"/d",
		"/s",
		"/c",
		["pnpm", ...args].join(" ")
	];
}
/**
* Classify a pnpm failure into a stable code the client can branch on.
* @param run - the settled invocation.
* @returns a machine code, or undefined when the run succeeded.
*/
function pnpmFailureCode(run) {
	if (run.timedOut) return "pnpm-timeout";
	if (run.exitCode === 0) return void 0;
	const combined = `${run.stdout}\n${run.stderr}`;
	if (run.exitCode === 9009 || /ENOENT|not recognized|command not found/iu.test(combined)) return "pnpm-not-found";
	return "pnpm-failed";
}
/**
* Serialized pnpm access to one profile directory.
*
* Single-flight rather than queued: these operations take seconds to minutes
* and rewrite the same `node_modules`, so a second caller is told to wait
* instead of silently joining a queue whose head it cannot see.
*/
var PnpmRunner = class {
	subprocess;
	profileDir;
	limits;
	busy = false;
	/**
	* @param subprocess - subprocess seam.
	* @param profileDir - absolute profile directory; the cwd of every run.
	* @param limits - deadline and output bounds.
	*/
	constructor(subprocess, profileDir, limits) {
		this.subprocess = subprocess;
		this.profileDir = profileDir;
		this.limits = limits;
	}
	/** Whether an operation is currently in flight. */
	get running() {
		return this.busy;
	}
	/**
	* Run one pnpm invocation in the profile directory.
	* @param args - pnpm arguments, already validated.
	* @returns the settled run.
	*/
	async run(args) {
		const abort = new AbortController();
		const timer = setTimeout(() => {
			abort.abort();
		}, this.limits.timeoutMs);
		try {
			const handle = this.subprocess.spawn({
				argv: pnpmArgv(args),
				cwd: this.profileDir,
				stdio: {
					stdin: "ignore",
					stdout: { maxBytes: this.limits.outputMaxBytes },
					stderr: { maxBytes: this.limits.outputMaxBytes }
				},
				graceMs: 5e3,
				signal: abort.signal
			});
			return {
				exitCode: (await handle.done).exitCode,
				stdout: handle.collected.stdout?.readFrom(0).text ?? "",
				stderr: handle.collected.stderr?.readFrom(0).text ?? "",
				timedOut: abort.signal.aborted
			};
		} catch (error) {
			return {
				exitCode: null,
				stdout: "",
				stderr: error instanceof Error ? error.message : String(error),
				timedOut: abort.signal.aborted
			};
		} finally {
			clearTimeout(timer);
		}
	}
	/**
	* Run one pnpm operation and reconcile the layer list afterwards.
	*
	* The dependency names are captured BEFORE pnpm runs because reconciliation
	* distinguishes a layer that a dependency stopped providing (remove it) from
	* a template bundle that was never a dependency (leave it) — a distinction
	* only the before-state carries.
	* @param args - pnpm arguments.
	* @returns the run plus the reconciliation outcome.
	*/
	async operate(args) {
		const before = Object.keys((await readProfileManifest(this.profileDir)).dependencies ?? {});
		const run = await this.run(args);
		if (run.exitCode !== 0) return {
			run,
			added: [],
			removed: []
		};
		const { added, removed } = await reconcileBundles(this.profileDir, before);
		return {
			run,
			added,
			removed
		};
	}
	/**
	* Take the single-flight lock for one operation.
	* @param args - pnpm arguments.
	* @returns the operation outcome.
	* @throws when another operation holds the lock.
	*/
	async exclusive(args) {
		if (this.busy) throw new Error("another plugin operation is already running");
		this.busy = true;
		try {
			return await this.operate(args);
		} finally {
			this.busy = false;
		}
	}
	/**
	* Remove one plugin from the profile.
	* @param name - package name.
	* @returns the operation outcome.
	*/
	async remove(name) {
		assertPackageName(name);
		return this.exclusive(["remove", name]);
	}
	/**
	* Update one plugin to the head of whatever its spec tracks.
	*
	* `update`, not `install`: a ref-less git spec tracks a branch, but pnpm
	* pins the commit it resolved into the profile's lockfile, and `install`
	* honours that pin. Only `update` re-resolves the branch head.
	* @param name - package name.
	* @returns the operation outcome.
	*/
	async update(name) {
		assertPackageName(name);
		return this.exclusive(["update", name]);
	}
};
//#endregion
//#region lib/types/pricing.js
/**
* models.dev pricing lookup for the session-cost readout.
*
* The endpoint ships one JSON blob for every provider/model (currently a few
* megabytes), so the gateway fetches it once per cache TTL and indexes only
* the cost fields. Costs are USD per one million tokens, the unit models.dev
* publishes and the same unit the token-usage projection is billed in.
* @module dsh-web-enhanced/src/pricing
*/
/** Read one non-negative finite price, or null for absent/unknown. */
function priceOf(value) {
	return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : null;
}
/** Parse the models.dev JSON shape into `provider/model → ModelPricing`. */
function parseModelsDev(raw) {
	const out = /* @__PURE__ */ new Map();
	/** Bare-model aliases; a name shared by several providers is ambiguous and dropped. */
	const bare = /* @__PURE__ */ new Map();
	if (typeof raw !== "object" || raw === null) return out;
	for (const [providerId, provider] of Object.entries(raw)) {
		if (provider.models === void 0) continue;
		for (const [modelId, model] of Object.entries(provider.models)) {
			const cost = model.cost;
			if (cost === void 0) continue;
			const input = priceOf(cost.input);
			const output = priceOf(cost.output);
			if (input === null || output === null) continue;
			const pricing = {
				input,
				output,
				cacheRead: priceOf(cost.cache_read),
				cacheWrite: priceOf(cost.cache_write)
			};
			out.set(`${providerId}/${modelId}`, pricing);
			bare.set(modelId, bare.has(modelId) ? "ambiguous" : pricing);
		}
	}
	for (const [modelId, pricing] of bare) if (pricing !== "ambiguous") out.set(modelId, pricing);
	return out;
}
/**
* Cached, single-flight models.dev pricing index.
*
* One instance per gateway; a deployment asking for prices of many models
* still performs one download per TTL. In-flight requests share the same
* promise, and a fetch failure clears the pending state so the next call
* retries instead of replaying a dead rejection.
*/
var ModelsDevPricing = class {
	options;
	index;
	loadedAt = 0;
	pending;
	constructor(options) {
		this.options = options;
	}
	/**
	* Look up one route's price.
	* @param provider - the model route's provider id (mapped by config).
	* @param model - the model id the route selected.
	* @returns the price, or undefined when models.dev has no entry.
	*/
	async pricingFor(provider, model) {
		const index = await this.loaded();
		const providerId = this.options.providerMap[provider] ?? provider;
		return index.get(`${providerId}/${model}`) ?? index.get(model);
	}
	/** Fetch (or return the cached) index; concurrent callers share one flight. */
	async loaded() {
		const now = Date.now();
		if (this.index !== void 0 && now - this.loadedAt < this.options.ttlMs) return this.index;
		this.pending ??= this.fetchIndex();
		try {
			const index = await this.pending;
			this.index = index;
			this.loadedAt = now;
			return index;
		} finally {
			this.pending = void 0;
		}
	}
	async fetchIndex() {
		const response = await (this.options.fetchImpl ?? fetch)(this.options.url, {
			headers: { accept: "application/json" },
			signal: AbortSignal.timeout(this.options.timeoutMs)
		});
		if (!response.ok) throw new Error(`models.dev answered ${response.status}`);
		return parseModelsDev(await response.json());
	}
};
//#endregion
//#region lib/types/vision.js
/**
* Image-understanding integration for text-only models.
*
* The design merges the two reference plugins in `dsh-plugins`:
* - `DSH-vision` contributes the TRANSPARENT interception: a reversible,
*   identity-guarded wrap of the shared `llm.resolveModelInfo` admits images
*   past the send preflight and the `read_image` capability gate; the
*   `agent/pre-step` + surface-replace + `deriveMessages` chain keeps the
*   image in the durable transcript (the UI shows it) while the model receives
*   a `[图片内容描述]` text block; `tools/post-execute` does the same for
*   `read_image` results. Multimodal detection always reads the captured
*   ORIGINAL resolver, so native multimodal routes pass through untouched.
* - `dsh-vision-proxy` contributes the TRANSCRIPTION ENGINE: the description
*   itself comes first from DSH-configured vision models (`llm.stream` with
*   the image reference, zero extra keys), then from local Ollama, then from
*   a configured OpenAI-compatible endpoint with an ordered fallback chain,
*   content-hash caching, classified HTTP errors, anonymous-endpoint timeout
*   caps, and a cooldown for endpoints that just failed.
*
* Unlike `DSH-vision`, admission-restore is unload-order safe: our wrapper is
* marked, and teardown only restores the resolver when the live function is
* still ours. It still must not run beside `DSH-vision` (both would pay for
* duplicate transcriptions); this plugin supersedes it.
*
* All faces are structural: the owning host services (`llm`, `attachments`,
* `agentDefaultModel`) are read through `ctx.get`, so a deployment that
* composes none of them still mounts a disabled-but-reporting service rather
* than refusing to boot.
* @module dsh-web-enhanced/src/vision
*/
/** Default description prompt: thorough Chinese transcription + scene detail. */
const DEFAULT_VISION_PROMPT = "请仔细观察这张图片并详细描述其内容，包括：所有可见的文字（请逐字转录）、物体、人物、场景、布局、颜色以及任何值得注意的细节。请用中文回答。";
/** Marker the model sees instead of the image block. */
const DEFAULT_VISION_MARKER = "[图片内容描述]";
/**
* Settings namespace carrying the user-editable vision configuration.
*
* The static `vision*` plugin config is the composition `base` layer; what the
* Settings → Web Enhanced → Vision tab saves becomes the user layer and wins.
* The namespace is owned by this plugin's own gateway/UI (not the host settings
* whitelist), so no api-proxy patch is needed.
*/
const VISION_SETTINGS_NS = "dsh-web-enhanced-vision";
/** Local Ollama health-check budget; it is a probe, not a transcription. */
const OLLAMA_PROBE_TIMEOUT_MS = 1500;
/** Hard cap on the effective timeout for anonymous endpoints (they can hang). */
const ANONYMOUS_TIMEOUT_CAP_MS = 2e4;
/** How many harness vision models are tried for one image. */
const HARNESS_CANDIDATE_CAP = 4;
/** Pause between failed vision-model attempts. */
const RETRY_DELAY_MS = 600;
/** Upper bound for honoring a Retry-After header (seconds), paid endpoints only. */
const MAX_RETRY_AFTER_SECONDS = 15;
/** Field-wise defaults for the vision subset of the plugin config. */
function resolveVisionSettings(config) {
	return {
		enabled: config.visionEnabled ?? true,
		patchAdmission: config.visionPatchAdmission ?? true,
		prompt: config.visionPrompt ?? "请仔细观察这张图片并详细描述其内容，包括：所有可见的文字（请逐字转录）、物体、人物、场景、布局、颜色以及任何值得注意的细节。请用中文回答。",
		marker: config.visionMarker ?? "[图片内容描述]",
		provider: config.visionProvider ?? "",
		model: config.visionModel ?? "",
		baseUrl: config.visionBaseUrl ?? "",
		apiKey: config.visionApiKey ?? "",
		apiKeyEnv: config.visionApiKeyEnv ?? "VISION_API_KEY",
		endpointModel: config.visionEndpointModel ?? "",
		endpointModels: config.visionEndpointModels ?? [],
		anonymous: config.visionAnonymous ?? false,
		timeoutMs: config.visionTimeoutMs ?? 12e4,
		maxTokens: config.visionMaxTokens ?? 4096,
		autoLocalOllama: config.visionAutoLocalOllama ?? true,
		localOllamaModel: config.visionLocalOllamaModel ?? "",
		localOllamaUrl: config.visionLocalOllamaUrl ?? "http://localhost:11434/v1",
		fallbacks: (config.visionFallbackModels ?? []).map((fallback) => ({
			model: fallback.model,
			baseURL: fallback.baseURL ?? "",
			apiKey: fallback.apiKey ?? "",
			anonymous: fallback.anonymous ?? false,
			timeoutMs: fallback.timeoutMs ?? 0
		})),
		cacheLimit: config.visionCacheLimit ?? 200,
		cooldownMs: config.visionCooldownMs ?? 6e4
	};
}
/** Schema of the `dsh-web-enhanced-vision` settings namespace. */
const VisionSettingsSchema = z$1.object({
	enabled: z$1.boolean().default(true),
	patchAdmission: z$1.boolean().default(true),
	provider: z$1.string().default(""),
	model: z$1.string().default(""),
	prompt: z$1.string().default(DEFAULT_VISION_PROMPT),
	marker: z$1.string().default(DEFAULT_VISION_MARKER),
	baseUrl: z$1.string().default(""),
	apiKey: z$1.string().role("secret").default(""),
	apiKeyEnv: z$1.string().default("VISION_API_KEY"),
	endpointModel: z$1.string().default(""),
	endpointModels: z$1.array(z$1.string()).default([]),
	anonymous: z$1.boolean().default(false),
	timeoutMs: z$1.number().default(12e4),
	maxTokens: z$1.number().default(4096),
	autoLocalOllama: z$1.boolean().default(true),
	localOllamaModel: z$1.string().default(""),
	localOllamaUrl: z$1.string().default("http://localhost:11434/v1"),
	fallbackModels: z$1.array(z$1.object({
		model: z$1.string(),
		baseURL: z$1.string().default(""),
		apiKey: z$1.string().role("secret").default(""),
		anonymous: z$1.boolean().default(false),
		timeoutMs: z$1.number().default(0)
	})).default([]),
	cacheLimit: z$1.number().default(200),
	cooldownMs: z$1.number().default(6e4)
});
/**
* The composition `base` layer: only fields the STATIC plugin config actually
* set, so unset keys keep the schema defaults until the UI writes them.
*/
function staticVisionSettingsBase(config) {
	const base = {};
	if (config.visionEnabled !== void 0) base["enabled"] = config.visionEnabled;
	if (config.visionPatchAdmission !== void 0) base["patchAdmission"] = config.visionPatchAdmission;
	if (config.visionProvider !== void 0) base["provider"] = config.visionProvider;
	if (config.visionModel !== void 0) base["model"] = config.visionModel;
	if (config.visionPrompt !== void 0) base["prompt"] = config.visionPrompt;
	if (config.visionMarker !== void 0) base["marker"] = config.visionMarker;
	if (config.visionBaseUrl !== void 0) base["baseUrl"] = config.visionBaseUrl;
	if (config.visionApiKey !== void 0) base["apiKey"] = config.visionApiKey;
	if (config.visionApiKeyEnv !== void 0) base["apiKeyEnv"] = config.visionApiKeyEnv;
	if (config.visionEndpointModel !== void 0) base["endpointModel"] = config.visionEndpointModel;
	if (config.visionEndpointModels !== void 0) base["endpointModels"] = config.visionEndpointModels;
	if (config.visionAnonymous !== void 0) base["anonymous"] = config.visionAnonymous;
	if (config.visionTimeoutMs !== void 0) base["timeoutMs"] = config.visionTimeoutMs;
	if (config.visionMaxTokens !== void 0) base["maxTokens"] = config.visionMaxTokens;
	if (config.visionAutoLocalOllama !== void 0) base["autoLocalOllama"] = config.visionAutoLocalOllama;
	if (config.visionLocalOllamaModel !== void 0) base["localOllamaModel"] = config.visionLocalOllamaModel;
	if (config.visionLocalOllamaUrl !== void 0) base["localOllamaUrl"] = config.visionLocalOllamaUrl;
	if (config.visionFallbackModels !== void 0) base["fallbackModels"] = config.visionFallbackModels;
	if (config.visionCacheLimit !== void 0) base["cacheLimit"] = config.visionCacheLimit;
	if (config.visionCooldownMs !== void 0) base["cooldownMs"] = config.visionCooldownMs;
	return base;
}
/** Map a resolved settings-namespace value back onto the plugin-config face. */
function visionConfigSourceOf(value) {
	return {
		visionEnabled: value.enabled,
		visionPatchAdmission: value.patchAdmission,
		visionProvider: value.provider,
		visionModel: value.model,
		visionPrompt: value.prompt,
		visionMarker: value.marker,
		visionBaseUrl: value.baseUrl,
		visionApiKey: value.apiKey,
		visionApiKeyEnv: value.apiKeyEnv,
		visionEndpointModel: value.endpointModel,
		visionEndpointModels: value.endpointModels,
		visionAnonymous: value.anonymous,
		visionTimeoutMs: value.timeoutMs,
		visionMaxTokens: value.maxTokens,
		visionAutoLocalOllama: value.autoLocalOllama,
		visionLocalOllamaModel: value.localOllamaModel,
		visionLocalOllamaUrl: value.localOllamaUrl,
		visionFallbackModels: value.fallbackModels,
		visionCacheLimit: value.cacheLimit,
		visionCooldownMs: value.cooldownMs
	};
}
/** Recursively detect image blocks, walking tool-result content. */
function hasImageBlocks(blocks) {
	if (blocks === void 0) return false;
	for (const raw of blocks) {
		const block = raw;
		if (block === null || block === void 0) continue;
		if (block.type === "image") return true;
		if (block.type === "tool-result" && Array.isArray(block.content)) {
			if (hasImageBlocks(block.content)) return true;
		}
	}
	return false;
}
/** Whether an endpoint is a localhost service (no key required). */
function isLocalVisionUrl(baseURL) {
	return /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/u.test(baseURL);
}
/**
* Resolve the endpoint API key: config, then environment, per call. Anonymous
* and local endpoints need none; anything else without a key fails fast with
* guidance instead of hanging.
*/
function resolveVisionApiKey(attempt, baseURL, apiKeyEnv, env = process.env) {
	if (attempt.anonymous || isLocalVisionUrl(baseURL)) return "";
	const key = attempt.apiKey !== "" ? attempt.apiKey : env[apiKeyEnv] ?? env.VISION_API_KEY ?? env.DASHSCOPE_API_KEY ?? "";
	if (key === "") throw new Error(`dsh-web-enhanced: no vision API key for ${baseURL}. Set visionApiKey in the plugin config (the reliable path on Windows), or export ${apiKeyEnv} / VISION_API_KEY / DASHSCOPE_API_KEY. Local endpoints like Ollama need none.`);
	return key;
}
/** Classify a failed VLM response into a kind + actionable hint. */
function classifyVisionHttpError(status, body) {
	const text = String(body);
	if (status === 429) return {
		kind: "rate_limit",
		hint: "the vision endpoint is rate-limited; for anonymous free endpoints this usually persists — configure a key or use local Ollama instead"
	};
	if (status === 402 || /insufficient_quota|quota|billing|balance|credit|arrear/iu.test(text)) return {
		kind: "quota",
		hint: "the vision endpoint quota or balance is exhausted — top up at the provider console"
	};
	if (status === 401 || status === 403) {
		if (/region|area|not available in your|unsupported.*region/iu.test(text)) return {
			kind: "region",
			hint: "the vision model is not available in this region — use another endpoint"
		};
		return {
			kind: "auth",
			hint: "the endpoint rejected the API key — verify it matches the platform-issued format exactly, with no extra prefix or line breaks"
		};
	}
	if (status === 404) return {
		kind: "model_not_found",
		hint: "the model id was not found at this endpoint — check visionEndpointModel and visionBaseUrl"
	};
	if (status === 400 && /context|length|too (large|long)|token/iu.test(text)) return {
		kind: "context_too_large",
		hint: "the image is too large for this model — try a smaller image or a model with a longer context"
	};
	return {
		kind: "http",
		hint: `endpoint returned HTTP ${status}`
	};
}
/** Parse a Retry-After header value (seconds or HTTP date) into seconds. */
function parseRetryAfter(header) {
	if (header === null || header === void 0) return void 0;
	const seconds = Number(header);
	if (Number.isFinite(seconds) && seconds >= 0) return seconds;
	const date = Date.parse(header);
	if (Number.isFinite(date)) return Math.max(0, (date - Date.now()) / 1e3);
}
/** Probe an OpenAI-compatible endpoint for its model list. */
async function detectLocalOllama(fetchImpl, baseURL, timeoutMs, preferredModel) {
	try {
		const response = await fetchImpl(`${baseURL.replace(/\/+$/u, "")}/models`, { signal: AbortSignal.timeout(timeoutMs) });
		if (!response.ok) return null;
		const text = await response.text();
		let payload;
		try {
			payload = JSON.parse(text);
		} catch {
			return null;
		}
		const ids = Array.isArray(payload?.data) ? payload.data.map((model) => model?.id).filter((id) => typeof id === "string" && id !== "") : [];
		if (ids.length === 0) return null;
		if (preferredModel !== "" && ids.includes(preferredModel)) return {
			baseURL,
			model: preferredModel
		};
		return {
			baseURL,
			model: ids.find((id) => /vl|vision/iu.test(id)) ?? ids[0]
		};
	} catch {
		return null;
	}
}
const sleep = (ms) => new Promise((resolve) => {
	setTimeout(resolve, ms);
});
/**
* The transcription engine: image reference → text description.
*
* Source order: DSH-configured vision models (zero extra keys), then local
* Ollama, then the configured OpenAI-compatible endpoint with its fallback
* chain. Failures are collected; when every source fails the description is a
* placeholder the model can still read, so an image never reaches a text-only
* adapter raw.
*/
var VisionTranscriber = class {
	settings;
	deps;
	cache = /* @__PURE__ */ new Map();
	cooldowns = /* @__PURE__ */ new Map();
	ollamaProbe;
	failure = null;
	constructor(settings, deps) {
		this.settings = settings;
		this.deps = deps;
		this.ollamaProbe = this.probeFor(settings);
	}
	/** One Ollama probe built from the given settings (restarted on reconfig). */
	probeFor(settings) {
		if (!settings.autoLocalOllama) return Promise.resolve(null);
		return detectLocalOllama(this.fetchImpl, settings.localOllamaUrl, OLLAMA_PROBE_TIMEOUT_MS, settings.localOllamaModel).then((local) => local === null ? null : {
			model: local.model,
			baseURL: local.baseURL,
			apiKey: "",
			anonymous: true,
			timeoutMs: Math.min(settings.timeoutMs, ANONYMOUS_TIMEOUT_CAP_MS),
			maxTokens: settings.maxTokens
		}).catch(() => null);
	}
	/**
	* Adopt a freshly saved settings value (the settings-namespace watch path).
	* The caches and cooldowns survive; only the configuration and the Ollama
	* probe are replaced.
	*/
	reconfigure(next) {
		this.settings = next;
		this.ollamaProbe = this.probeFor(next);
	}
	get fetchImpl() {
		return this.deps.fetchImpl ?? globalThis.fetch;
	}
	/** Entries currently held in the content-hash cache. */
	get cacheSize() {
		return this.cache.size;
	}
	/** The most recent total transcription failure, or null. */
	get lastError() {
		return this.failure;
	}
	/**
	* Describe one image. `memo` deduplicates within one decision (a user
	* message plus its `read_image` duplicate must not transcribe twice).
	* @param ref - durable image reference.
	* @param memo - per-decision attachmentId → description cache.
	* @param signal - caller cancellation.
	* @returns the description (a placeholder when every source failed).
	*/
	async describe(ref, memo, signal) {
		const memoKey = typeof ref.attachmentId === "string" ? ref.attachmentId : "";
		if (memoKey !== "") {
			const hit = memo.get(memoKey);
			if (hit !== void 0) return hit;
		}
		const text = await this.describeFresh(ref, signal);
		if (memoKey !== "") memo.set(memoKey, text);
		return text;
	}
	/**
	* Replace image blocks with descriptions, walking tool-result content. The
	* message itself is never mutated: the caller decides where the transformed
	* blocks go (the model-visible surface replacement).
	*/
	async transformBlocks(blocks, memo, signal) {
		const out = [];
		let changed = false;
		for (const raw of blocks) {
			const block = raw;
			if (block === null || block === void 0) {
				out.push(block);
				continue;
			}
			if (block.type === "image") {
				const attachment = block.attachment;
				if (attachment === void 0) {
					out.push(block);
					continue;
				}
				const description = await this.describe(attachment, memo, signal);
				out.push({
					type: "text",
					text: `\n${this.settings.marker}\n${description}\n`
				});
				changed = true;
			} else if (block.type === "tool-result" && Array.isArray(block.content)) {
				const inner = await this.transformBlocks(block.content, memo, signal);
				if (inner.changed) {
					out.push({
						...block,
						content: inner.blocks
					});
					changed = true;
				} else out.push(block);
			} else out.push(block);
		}
		return {
			blocks: out,
			changed
		};
	}
	/**
	* Vision models from DSH-configured providers: the pinned `visionProvider` /
	* `visionModel` first, then every listed model that declares image input.
	*/
	async harnessCandidates() {
		const list = [];
		const seen = /* @__PURE__ */ new Set();
		const push = (provider, model) => {
			if (list.length >= HARNESS_CANDIDATE_CAP) return;
			const key = `${provider}/${model}`;
			if (seen.has(key)) return;
			seen.add(key);
			list.push({
				provider,
				model
			});
		};
		if (this.settings.provider !== "" && this.settings.model !== "") push(this.settings.provider, this.settings.model);
		const llm = this.deps.llm;
		if (llm === void 0) return list;
		try {
			for (const provider of llm.listProviders()) {
				if (list.length >= HARNESS_CANDIDATE_CAP) break;
				try {
					const models = await llm.listModels(provider.id);
					for (const model of models) if ((model.inputModalities ?? []).includes("image")) push(provider.id, model.id);
				} catch {}
			}
		} catch {}
		return list;
	}
	/** Where the configured endpoint key comes from (never the key itself). */
	apiKeySource() {
		if (this.settings.anonymous) return "none-needed";
		if (this.settings.apiKey !== "") return "config";
		const env = process.env;
		if (this.settings.apiKeyEnv !== "" && env[this.settings.apiKeyEnv] !== void 0 || env.VISION_API_KEY !== void 0 || env.DASHSCOPE_API_KEY !== void 0) return "env";
		return "unset";
	}
	/** Local Ollama probe state (detected at construction, memoized). */
	async ollamaState() {
		const local = await this.ollamaProbe;
		return local === null ? {
			detected: false,
			model: null
		} : {
			detected: true,
			model: local.model
		};
	}
	async describeFresh(ref, signal) {
		const errors = [];
		for (const candidate of await this.harnessCandidates()) {
			const text = await this.streamHarness(candidate, ref, signal);
			if (text !== null) return text;
			errors.push(`vision model ${candidate.provider}/${candidate.model} returned no text`);
			await sleep(RETRY_DELAY_MS);
		}
		for (const attempt of await this.endpointAttempts()) {
			const until = this.cooldowns.get(attempt.baseURL);
			if (until !== void 0) {
				if (Date.now() < until) {
					errors.push(`${attempt.model} @ ${attempt.baseURL}: skipped — endpoint cooling down after a recent failure`);
					continue;
				}
				this.cooldowns.delete(attempt.baseURL);
			}
			if (!attempt.anonymous) try {
				resolveVisionApiKey(attempt, attempt.baseURL, this.settings.apiKeyEnv);
			} catch (error) {
				errors.push(error instanceof Error ? error.message : String(error));
				continue;
			}
			try {
				return await this.transcribeEndpoint(attempt, ref, signal);
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				errors.push(`${attempt.model} @ ${attempt.baseURL}: ${message}`);
				const timedOut = error instanceof Error && error.name === "TimeoutError" || /aborted due to timeout|timed out|timeout/iu.test(message);
				if (message.includes("(rate_limit)") || timedOut) this.cooldowns.set(attempt.baseURL, Date.now() + this.settings.cooldownMs);
			}
		}
		this.failure = errors.join(" | ");
		this.deps.logger.warn(`dsh-web-enhanced vision: image description failed — ${this.failure}`);
		return this.placeholder(errors);
	}
	/** One `llm.stream` description through a DSH-configured vision model. */
	async streamHarness(candidate, ref, signal) {
		const llm = this.deps.llm;
		if (llm === void 0 || typeof llm.stream !== "function") return null;
		const messages = [{
			id: `web-enhanced-vision-${String(Math.random().toString(36).slice(2))}`,
			role: "user",
			content: [{
				type: "text",
				text: this.settings.prompt
			}, {
				type: "image",
				attachment: ref
			}],
			source: { kind: "user" }
		}];
		let text = "";
		try {
			for await (const chunk of llm.stream({
				provider: candidate.provider,
				model: candidate.model,
				messages,
				...signal === void 0 ? {} : { signal }
			})) if (chunk.type === "text-delta" && typeof chunk.text === "string") text += chunk.text;
		} catch (error) {
			this.deps.logger.warn(`dsh-web-enhanced vision: ${candidate.provider}/${candidate.model} failed — ` + (error instanceof Error ? error.message : String(error)));
			return null;
		}
		const trimmed = text.trim();
		return trimmed === "" ? null : trimmed;
	}
	/** Ordered endpoint attempts: local Ollama, main endpoint, fallbacks. */
	async endpointAttempts() {
		const attempts = [];
		const local = await this.ollamaProbe;
		if (local !== null) attempts.push(local);
		if (this.settings.baseUrl.trim() !== "" && this.settings.endpointModel.trim() !== "") attempts.push({
			model: this.settings.endpointModel,
			baseURL: this.settings.baseUrl.replace(/\/+$/u, ""),
			apiKey: this.settings.apiKey,
			anonymous: this.settings.anonymous,
			timeoutMs: this.settings.timeoutMs,
			maxTokens: this.settings.maxTokens
		});
		for (const fallback of this.settings.fallbacks) {
			const baseURL = fallback.baseURL === "" ? this.settings.baseUrl : fallback.baseURL;
			if (fallback.model.trim() === "" || baseURL.trim() === "") continue;
			attempts.push({
				model: fallback.model,
				baseURL: baseURL.replace(/\/+$/u, ""),
				apiKey: fallback.apiKey === "" ? this.settings.apiKey : fallback.apiKey,
				anonymous: fallback.anonymous,
				timeoutMs: fallback.timeoutMs > 0 ? fallback.timeoutMs : this.settings.timeoutMs,
				maxTokens: this.settings.maxTokens
			});
		}
		return attempts;
	}
	/** Read the image bytes once, then hit the content-hash cache. */
	async transcribeEndpoint(attempt, ref, signal) {
		const attachments = this.deps.attachments;
		if (attachments === void 0) throw new Error("no attachment service is mounted, so image bytes cannot be read for the endpoint transcriber");
		const stored = await attachments.readImage(ref, signal);
		const data = stored.data;
		const key = `sha256:${createHash("sha256").update(data).digest("hex")}`;
		const cached = this.cache.get(key);
		if (cached !== void 0) return cached;
		const mediaType = stored.ref.mediaType ?? ref.mediaType ?? "image/png";
		const text = await this.transcribeRequest(attempt, mediaType, data, signal);
		if (this.cache.size >= this.settings.cacheLimit) {
			const oldest = this.cache.keys().next().value;
			if (oldest !== void 0) this.cache.delete(oldest);
		}
		this.cache.set(key, text);
		return text;
	}
	/** One `/chat/completions` request for already-read image bytes. */
	async transcribeRequest(attempt, mediaType, data, signal) {
		const baseURL = attempt.baseURL.replace(/\/+$/u, "");
		const url = `${baseURL}/chat/completions`;
		const apiKey = resolveVisionApiKey(attempt, baseURL, this.settings.apiKeyEnv);
		const effectiveTimeout = attempt.anonymous ? Math.min(attempt.timeoutMs, ANONYMOUS_TIMEOUT_CAP_MS) : attempt.timeoutMs;
		const dataUrl = `data:${mediaType};base64,${Buffer.from(data).toString("base64")}`;
		const post = () => this.fetchImpl(url, {
			method: "POST",
			headers: {
				"content-type": "application/json",
				...apiKey === "" ? {} : { authorization: `Bearer ${apiKey}` }
			},
			body: JSON.stringify({
				model: attempt.model,
				max_tokens: attempt.maxTokens,
				messages: [{
					role: "user",
					content: [{
						type: "image_url",
						image_url: { url: dataUrl }
					}, {
						type: "text",
						text: this.settings.prompt
					}]
				}]
			}),
			signal: AbortSignal.any([AbortSignal.timeout(effectiveTimeout), ...signal === void 0 ? [] : [signal]])
		});
		let response = await post();
		if (response.status === 429) {
			if (attempt.anonymous) {
				const body = await response.text();
				throw new Error(`dsh-web-enhanced vision: transcription failed (rate_limit) at ${url}: ${body.slice(0, 200)} — anonymous free endpoints are strictly rate-limited and may hang; they are not retried. Configure visionApiKey, or use local Ollama.`);
			}
			const retryAfter = parseRetryAfter(response.headers.get("retry-after"));
			if (retryAfter !== void 0) {
				await sleep(Math.min(retryAfter, MAX_RETRY_AFTER_SECONDS) * 1e3);
				response = await post();
			}
		}
		const body = await response.text();
		if (!response.ok) {
			const { kind, hint } = classifyVisionHttpError(response.status, body);
			throw new Error(`dsh-web-enhanced vision: transcription failed (${kind}) at ${url}: ${body.slice(0, 200)} — ${hint}`);
		}
		let payload;
		try {
			payload = JSON.parse(body);
		} catch {
			throw new Error(`dsh-web-enhanced vision: transcription failed, non-JSON response: ${body.slice(0, 200)}`);
		}
		const content = payload?.choices?.[0]?.message?.content;
		const text = typeof content === "string" ? content : Array.isArray(content) ? content.map((part) => typeof part?.text === "string" ? part.text : "").filter((part) => part !== "").join("\n") : void 0;
		if (text === void 0 || text.trim() === "") throw new Error("dsh-web-enhanced vision: transcription failed, the VLM returned no text");
		return text.trim();
	}
	/** The last-resort description: the turn still works, with guidance inside. */
	placeholder(errors) {
		if (errors.length > 0) return `（图片内容识别失败，请稍后重试或检查视觉模型配置。已尝试：${errors.join("；")}）`;
		return "（图片内容识别不可用：DSH 中没有配置支持图片的模型，也未配置视觉转译端点。请在 DSH 中配置一个多模态模型，或在本插件的 cordis.patch.yml 中设置 visionBaseUrl / visionApiKey，或在 http://localhost:11434 启动本地 Ollama。）";
	}
};
/**
* The transparent half of the integration, mounted as the `visionIntegration`
* Cordis service. It patches admission, transcribes image-bearing steps into
* model-visible replacements, and rewrites `read_image` results.
*/
var VisionInterceptor = class extends Service {
	settings;
	transcriber;
	llm;
	defaultModel;
	settingsScope;
	modelByAgent = /* @__PURE__ */ new Map();
	pending = /* @__PURE__ */ new Map();
	lastTurns = /* @__PURE__ */ new Map();
	deriveOriginals = /* @__PURE__ */ new Map();
	originalResolver = null;
	admissionPatched = false;
	constructor(ctx, config = {}) {
		super(ctx, "visionIntegration");
		const llm = ctx.get("llm", false);
		const attachments = ctx.get("attachments", false);
		this.llm = llm;
		this.defaultModel = ctx.get("agentDefaultModel", false);
		this.settingsScope = this.registerSettings(ctx, config);
		const effective = this.settingsScope === null ? config : visionConfigSourceOf(this.settingsScope.get());
		this.settings = resolveVisionSettings(effective);
		this.transcriber = new VisionTranscriber(this.settings, {
			...llm === void 0 ? {} : { llm },
			...attachments === void 0 ? {} : { attachments },
			logger: ctx.logger
		});
		if (this.settings.patchAdmission) this.patchAdmission();
		ctx.on("agent/request", async (payload, next) => {
			const resolved = await next();
			this.rememberModel(payload.agent, resolved);
			return resolved;
		});
		ctx.on("system-prompt/assemble", (async (_assembly, context, next) => {
			const result = await next();
			try {
				const agent = context?.agent;
				const variables = result?.variables;
				if (agent !== void 0) this.rememberModel(agent, variables);
			} catch {}
			return result;
		}));
		ctx.on("agent/pre-step", async (payload, next) => {
			const decision = await next();
			if (!decision || decision.kind !== "enter" || !this.settings.enabled) return decision;
			const agent = payload.agent;
			const session = agent?.session;
			this.ensureDeriveWrapped(session);
			const current = this.currentModel(agent);
			if (current !== null && await this.supportsImage(current.provider, current.model)) return decision;
			const sessionId = session?.id === void 0 ? "" : String(session.id);
			const agentId = agent?.id === void 0 ? "" : String(agent.id);
			if (this.lastTurns.get(agentId) !== payload.turn) {
				this.lastTurns.set(agentId, payload.turn);
				if (sessionId !== "") {
					const prefix = `${sessionId}:`;
					for (const key of this.pending.keys()) if (key.startsWith(prefix)) this.pending.delete(key);
				}
			}
			const memo = /* @__PURE__ */ new Map();
			for (const message of decision.messages) {
				if (message === null || message === void 0 || !Array.isArray(message.content) || !hasImageBlocks(message.content)) continue;
				const id = message.id;
				if (typeof id !== "string" || sessionId === "") continue;
				const transformed = await this.transcriber.transformBlocks(message.content, memo, payload.signal);
				if (transformed.changed) this.pending.set(`${sessionId}:${id}`, { content: transformed.blocks });
			}
			return decision;
		});
		ctx.on("session/event", (session, event) => {
			if (!this.settings.enabled) return;
			if (!event || event.type !== "user/message" || event.surfaceOp !== "append") return;
			const data = event.data;
			if (typeof data?.id !== "string") return;
			const key = `${String(session.id)}:${data.id}`;
			const pending = this.pending.get(key);
			if (pending === void 0) return;
			const replacement = {
				...data,
				content: pending.content
			};
			const shadowed = event.seq;
			queueMicrotask(() => {
				try {
					session.append("user/message", replacement, {
						surfaceOp: {
							op: "replace",
							start: shadowed,
							end: shadowed
						},
						sourceEventSeqs: [shadowed]
					});
					this.pending.delete(key);
				} catch (error) {
					this.logWarn(`could not write the model-visible replacement (deriveMessages wrapper still covers the step): ${this.messageOf(error)}`);
				}
			});
		});
		ctx.on("tools/post-execute", (async (exec, result, next) => {
			if (exec.name !== "read_image") return next();
			const decision = await next();
			if (decision?.kind !== "accept") return decision;
			if (result.isError || !this.settings.enabled) return decision;
			const current = this.currentModel(exec.agent);
			if (current !== null && await this.supportsImage(current.provider, current.model)) return decision;
			const blocks = result.content ?? [];
			const attachment = blocks.find((block) => block?.type === "image")?.attachment;
			if (attachment === void 0) return decision;
			const accepted = decision.content;
			if (accepted !== void 0 && !accepted.some((block) => block?.type === "image")) return decision;
			const description = await this.transcriber.describe(attachment, /* @__PURE__ */ new Map(), exec.signal);
			const envelope = blocks.filter((block) => block?.type === "text").map((block) => typeof block.text === "string" ? block.text : "").filter((text) => text !== "").join("\n");
			return {
				kind: "accept",
				content: [{
					type: "text",
					text: (envelope === "" ? "" : `${envelope}\n`) + `\n${this.settings.marker}\n${description}\n`
				}]
			};
		}));
		ctx.effect(() => () => {
			this.restoreAdmission();
			this.restoreDerive();
		}, "dsh-web-enhanced: vision teardown");
	}
	/** Live status for the Settings tab and the `visionStatus` remote. */
	async status() {
		const [harnessModels, ollama] = await Promise.all([this.transcriber.harnessCandidates(), this.transcriber.ollamaState()]);
		const endpointConfigured = this.settings.baseUrl.trim() !== "" && this.settings.endpointModel.trim() !== "";
		return {
			mounted: true,
			enabled: this.settings.enabled,
			patchAdmission: this.settings.patchAdmission,
			admissionActive: this.admissionPatched,
			harnessModels,
			endpointConfigured,
			endpointModel: endpointConfigured ? this.settings.endpointModel : null,
			apiKeySource: this.transcriber.apiKeySource(),
			ollamaDetected: ollama.detected,
			ollamaModel: ollama.model,
			cacheSize: this.transcriber.cacheSize,
			lastError: this.transcriber.lastError
		};
	}
	/**
	* Register the user-editable settings namespace, with the static plugin
	* config as its base layer. Returns null (and the static config stays in
	* force) in a deployment without the settings service.
	*/
	registerSettings(ctx, config) {
		const service = ctx.get("settings", false);
		if (service === void 0 || typeof service.register !== "function") return null;
		try {
			const scope = service.register(VISION_SETTINGS_NS, VisionSettingsSchema, {
				base: staticVisionSettingsBase(config),
				applies: "live"
			});
			ctx.effect(() => scope.watch((next) => {
				this.applySettings(next);
			}), "dsh-web-enhanced: vision settings watch");
			return scope;
		} catch (error) {
			this.logWarn(`settings namespace registration failed; static config stays in force: ${this.messageOf(error)}`);
			return null;
		}
	}
	/** Adopt a freshly committed settings value: reconfigure and patch/unpatch. */
	applySettings(raw) {
		try {
			const next = resolveVisionSettings(visionConfigSourceOf(raw));
			this.settings = next;
			this.transcriber.reconfigure(next);
			if (next.patchAdmission && !this.admissionPatched) this.patchAdmission();
			else if (!next.patchAdmission && this.admissionPatched) this.restoreAdmission();
		} catch (error) {
			this.logWarn(`could not apply the saved vision settings: ${this.messageOf(error)}`);
		}
	}
	/** Add `image` to the model metadata the two admission gates read. */
	patchAdmission() {
		const llm = this.llm;
		if (llm === void 0 || typeof llm.resolveModelInfo !== "function") return;
		if (llm.resolveModelInfo.__webEnhancedVisionAdmission === true) {
			this.admissionPatched = true;
			return;
		}
		const original = llm.resolveModelInfo.bind(llm);
		this.originalResolver = original;
		const wrapped = (async (provider, model, signal) => {
			const info = await original(provider, model, signal);
			const modalities = Array.isArray(info?.inputModalities) ? info.inputModalities.slice() : ["text"];
			if (!modalities.includes("image")) return {
				...info,
				inputModalities: [...modalities, "image"]
			};
			return info;
		});
		Object.defineProperty(wrapped, "__webEnhancedVisionAdmission", { value: true });
		llm.resolveModelInfo = wrapped;
		this.admissionPatched = true;
	}
	/**
	* Restore only when the live resolver is still ours. If another plugin
	* wrapped after us, removing ours would amputate their wrapper, so the chain
	* is left intact instead (this is the unload-order bug DSH-vision has).
	*/
	restoreAdmission() {
		const llm = this.llm;
		if (llm === void 0 || !this.admissionPatched) return;
		const current = llm.resolveModelInfo;
		if (typeof current === "function" && current.__webEnhancedVisionAdmission === true) llm.resolveModelInfo = this.originalResolver ?? current;
		else if (this.originalResolver !== null) this.logWarn("vision admission patch was superseded by another resolver wrapper; leaving the live chain intact");
		this.admissionPatched = false;
	}
	/** Real multimodal capability, read through the captured original method. */
	async supportsImage(provider, model) {
		if (provider === "" || model === "") return false;
		try {
			const resolve = this.originalResolver ?? this.llm?.resolveModelInfo;
			if (resolve === void 0) return false;
			const info = await resolve(provider, model);
			return Array.isArray(info?.inputModalities) && info.inputModalities.includes("image");
		} catch {
			return false;
		}
	}
	/**
	* Model in force for one agent: the assembly/request capture (zero lag for
	* UI selection), then the session request header, then agent options, then
	* the global default selection.
	*/
	currentModel(agent) {
		const agentId = agent?.id === void 0 ? void 0 : String(agent.id);
		const cached = agentId === void 0 ? void 0 : this.modelByAgent.get(agentId);
		if (cached !== void 0) return cached;
		try {
			const config = (agent?.session?.requestHeader?.())?.config;
			if (typeof config?.provider === "string" && typeof config.model === "string") return {
				provider: config.provider,
				model: config.model
			};
		} catch {}
		const options = agent?.options;
		if (typeof options?.provider === "string" && typeof options.model === "string") return {
			provider: options.provider,
			model: options.model
		};
		try {
			const selected = this.defaultModel?.currentSelection?.();
			if (typeof selected?.provider === "string" && typeof selected.model === "string") return {
				provider: selected.provider,
				model: selected.model
			};
		} catch {}
		return null;
	}
	/** Cache the provider/model an assembly or request actually used. */
	rememberModel(agent, config) {
		const agentId = agent?.id;
		const pair = config;
		if (agentId === void 0 || typeof pair?.provider !== "string" || typeof pair.model !== "string") return;
		this.modelByAgent.set(String(agentId), {
			provider: pair.provider,
			model: pair.model
		});
	}
	/**
	* Wrap one session's `deriveMessages` so the first step of a turn already
	* sees the pending description — the loop derives history synchronously
	* before the microtask that persists the surface replacement can run.
	*/
	ensureDeriveWrapped(session) {
		if (session === void 0 || typeof session.deriveMessages !== "function") return;
		const live = session;
		const marker = live;
		if (marker.__webEnhancedVisionDeriveWrapped === true || this.deriveOriginals.has(live)) return;
		const original = live.deriveMessages.bind(live);
		const sessionId = String(live.id);
		const pending = this.pending;
		live.deriveMessages = function() {
			const messages = original();
			let changed = false;
			const out = messages.map((message) => {
				const id = message.id;
				if (typeof id !== "string") return message;
				const replacement = pending.get(`${sessionId}:${id}`);
				if (replacement === void 0) return message;
				changed = true;
				return {
					...message,
					content: replacement.content
				};
			});
			return changed ? out : messages;
		};
		marker.__webEnhancedVisionDeriveWrapped = true;
		this.deriveOriginals.set(live, original);
	}
	/** Restore every wrapped `deriveMessages` (idempotent, teardown-only). */
	restoreDerive() {
		for (const [session, original] of this.deriveOriginals) try {
			session.deriveMessages = original;
		} catch {}
		this.deriveOriginals.clear();
	}
	messageOf(error) {
		return error instanceof Error ? error.message : String(error);
	}
	logWarn(message) {
		try {
			this.ctx.logger.warn(`dsh-web-enhanced vision: ${message}`);
		} catch {}
	}
};
//#endregion
//#region lib/types/gateway.js
/**
* The web-enhanced gateway: one Typert namespace (`webEnhanced`) exposing
* the task board, git, files, Office preview, and balance capabilities to
* the client. Business failures are result fields, never thrown exceptions,
* so the client renders them inline. The task domain lives in {@link
* TaskBoard}; this class is the wire-facing assembly.
* @module dsh-web-enhanced/src/gateway
*/
var __runInitializers = function(thisArg, initializers, value) {
	var useValue = arguments.length > 2;
	for (var i = 0; i < initializers.length; i++) value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
	return useValue ? value : void 0;
};
var __esDecorate = function(ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
	function accept(f) {
		if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected");
		return f;
	}
	var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
	var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
	var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
	var _, done = false;
	for (var i = decorators.length - 1; i >= 0; i--) {
		var context = {};
		for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
		for (var p in contextIn.access) context.access[p] = contextIn.access[p];
		context.addInitializer = function(f) {
			if (done) throw new TypeError("Cannot add initializers after decoration has completed");
			extraInitializers.push(accept(f || null));
		};
		var result = (0, decorators[i])(kind === "accessor" ? {
			get: descriptor.get,
			set: descriptor.set
		} : descriptor[key], context);
		if (kind === "accessor") {
			if (result === void 0) continue;
			if (result === null || typeof result !== "object") throw new TypeError("Object expected");
			if (_ = accept(result.get)) descriptor.get = _;
			if (_ = accept(result.set)) descriptor.set = _;
			if (_ = accept(result.init)) initializers.unshift(_);
		} else if (_ = accept(result)) {
			if (kind === "field") initializers.unshift(_);
			else descriptor[key] = _;
		}
	}
	if (target) Object.defineProperty(target, contextIn.name, descriptor);
	done = true;
};
/** Settings keys the Vision tab may edit (everything else is read-only). */
const VISION_CONFIG_EDITABLE_KEYS = /* @__PURE__ */ new Set([
	"enabled",
	"patchAdmission",
	"provider",
	"model",
	"prompt",
	"marker",
	"baseUrl",
	"apiKey",
	"endpointModel",
	"endpointModels",
	"anonymous",
	"timeoutMs",
	"maxTokens",
	"autoLocalOllama",
	"localOllamaModel",
	"localOllamaUrl",
	"cacheLimit",
	"cooldownMs"
]);
const Config = z$1.object({
	cronIntervalMs: z$1.number().default(3e4),
	balanceApiKeyEnv: z$1.string().default("DEEPSEEK_API_KEY"),
	balanceCacheTtlMs: z$1.number().default(6e4),
	balanceBaseUrl: z$1.string().default("https://api.deepseek.com"),
	balanceProviders: z$1.array(z$1.string()).default(["deepseek-official"]),
	modelsDevUrl: z$1.string().default("https://models.dev/api.json"),
	modelsDevCacheTtlMs: z$1.number().default(216e5),
	modelsDevTimeoutMs: z$1.number().default(1e4),
	pricingProviderMap: z$1.dict(z$1.string()).default({ "deepseek-official": "deepseek" }),
	skipDirs: z$1.array(z$1.string()).default(["node_modules"]),
	readMaxBytes: z$1.number().default(1048576),
	writeMaxBytes: z$1.number().default(2097152),
	binaryMaxBytes: z$1.number().default(5242880),
	gitOutputMaxBytes: z$1.number().default(262144),
	gitMaxCount: z$1.number().default(100),
	gitWorkingMaxFiles: z$1.number().default(300),
	searchMaxDepth: z$1.number().default(8),
	searchMaxEntries: z$1.number().default(200),
	officeMaxBytes: z$1.number().default(5242880),
	browseMaxEntries: z$1.number().default(500),
	pluginOpTimeoutMs: z$1.number().default(3e5),
	profileDir: z$1.string().default(""),
	visionEnabled: z$1.boolean().default(true),
	visionPatchAdmission: z$1.boolean().default(true),
	visionPrompt: z$1.string().default(DEFAULT_VISION_PROMPT),
	visionMarker: z$1.string().default(DEFAULT_VISION_MARKER),
	visionProvider: z$1.string().default(""),
	visionModel: z$1.string().default(""),
	visionBaseUrl: z$1.string().default(""),
	visionApiKey: z$1.string().role("secret").default(""),
	visionApiKeyEnv: z$1.string().default("VISION_API_KEY"),
	visionEndpointModel: z$1.string().default(""),
	visionEndpointModels: z$1.array(z$1.string()).default([]),
	visionAnonymous: z$1.boolean().default(false),
	visionTimeoutMs: z$1.number().default(12e4),
	visionMaxTokens: z$1.number().default(4096),
	visionAutoLocalOllama: z$1.boolean().default(true),
	visionLocalOllamaModel: z$1.string().default(""),
	visionLocalOllamaUrl: z$1.string().default("http://localhost:11434/v1"),
	visionFallbackModels: z$1.array(z$1.object({
		model: z$1.string(),
		baseURL: z$1.string().default(""),
		apiKey: z$1.string().role("secret").default(""),
		anonymous: z$1.boolean().default(false),
		timeoutMs: z$1.number().default(0)
	})).default([]),
	visionCacheLimit: z$1.number().default(200),
	visionCooldownMs: z$1.number().default(6e4)
});
/** Field defaults applied when the gateway is constructed directly. */
function resolveConfig(config) {
	return {
		cronIntervalMs: config.cronIntervalMs ?? 3e4,
		balanceApiKeyEnv: config.balanceApiKeyEnv ?? "DEEPSEEK_API_KEY",
		balanceCacheTtlMs: config.balanceCacheTtlMs ?? 6e4,
		balanceBaseUrl: config.balanceBaseUrl ?? "https://api.deepseek.com",
		balanceProviders: config.balanceProviders ?? ["deepseek-official"],
		modelsDevUrl: config.modelsDevUrl ?? "https://models.dev/api.json",
		modelsDevCacheTtlMs: config.modelsDevCacheTtlMs ?? 216e5,
		modelsDevTimeoutMs: config.modelsDevTimeoutMs ?? 1e4,
		pricingProviderMap: config.pricingProviderMap ?? { "deepseek-official": "deepseek" },
		skipDirs: config.skipDirs ?? ["node_modules"],
		readMaxBytes: config.readMaxBytes ?? 1048576,
		writeMaxBytes: config.writeMaxBytes ?? 2097152,
		binaryMaxBytes: config.binaryMaxBytes ?? 5242880,
		gitOutputMaxBytes: config.gitOutputMaxBytes ?? 262144,
		gitMaxCount: config.gitMaxCount ?? 100,
		gitWorkingMaxFiles: config.gitWorkingMaxFiles ?? 300,
		searchMaxDepth: config.searchMaxDepth ?? 8,
		searchMaxEntries: config.searchMaxEntries ?? 200,
		officeMaxBytes: config.officeMaxBytes ?? 5242880,
		browseMaxEntries: config.browseMaxEntries ?? 500,
		pluginOpTimeoutMs: config.pluginOpTimeoutMs ?? 3e5,
		profileDir: config.profileDir ?? "",
		visionEnabled: config.visionEnabled ?? true,
		visionPatchAdmission: config.visionPatchAdmission ?? true,
		visionPrompt: config.visionPrompt ?? "请仔细观察这张图片并详细描述其内容，包括：所有可见的文字（请逐字转录）、物体、人物、场景、布局、颜色以及任何值得注意的细节。请用中文回答。",
		visionMarker: config.visionMarker ?? "[图片内容描述]",
		visionProvider: config.visionProvider ?? "",
		visionModel: config.visionModel ?? "",
		visionBaseUrl: config.visionBaseUrl ?? "",
		visionApiKey: config.visionApiKey ?? "",
		visionApiKeyEnv: config.visionApiKeyEnv ?? "VISION_API_KEY",
		visionEndpointModel: config.visionEndpointModel ?? "",
		visionEndpointModels: config.visionEndpointModels ?? [],
		visionAnonymous: config.visionAnonymous ?? false,
		visionTimeoutMs: config.visionTimeoutMs ?? 12e4,
		visionMaxTokens: config.visionMaxTokens ?? 4096,
		visionAutoLocalOllama: config.visionAutoLocalOllama ?? true,
		visionLocalOllamaModel: config.visionLocalOllamaModel ?? "",
		visionLocalOllamaUrl: config.visionLocalOllamaUrl ?? "http://localhost:11434/v1",
		visionFallbackModels: config.visionFallbackModels ?? [],
		visionCacheLimit: config.visionCacheLimit ?? 200,
		visionCooldownMs: config.visionCooldownMs ?? 6e4
	};
}
/**
* The web-enhanced gateway. One Typert namespace so a single `remote`
* contribution reaches the client; methods are grouped by prefix.
*/
let WebEnhancedGateway = (() => {
	let _classSuper = TypertRemoteService;
	let _instanceExtraInitializers = [];
	let _taskList_decorators;
	let _taskCreate_decorators;
	let _taskUpdate_decorators;
	let _taskRemove_decorators;
	let _taskRun_decorators;
	let _balanceGet_decorators;
	let _pricingGet_decorators;
	let _visionStatus_decorators;
	let _visionConfigGet_decorators;
	let _visionConfigSet_decorators;
	let _visionEndpointModels_decorators;
	let _gitBranches_decorators;
	let _gitLog_decorators;
	let _gitCommit_decorators;
	let _gitWorking_decorators;
	let _gitCheckout_decorators;
	let _gitStatus_decorators;
	let _gitDiff_decorators;
	let _gitStage_decorators;
	let _gitUnstage_decorators;
	let _gitDiscard_decorators;
	let _fsList_decorators;
	let _fsSearch_decorators;
	let _fsRead_decorators;
	let _fsWrite_decorators;
	let _fsDelete_decorators;
	let _fsOfficePreview_decorators;
	let _fsBrowse_decorators;
	let _pluginList_decorators;
	let _pluginRemove_decorators;
	let _pluginUpdate_decorators;
	return class WebEnhancedGateway extends _classSuper {
		static {
			const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
			_taskList_decorators = [Remote("taskList")];
			_taskCreate_decorators = [Remote("taskCreate")];
			_taskUpdate_decorators = [Remote("taskUpdate")];
			_taskRemove_decorators = [Remote("taskRemove")];
			_taskRun_decorators = [Remote("taskRun")];
			_balanceGet_decorators = [Remote("balanceGet")];
			_pricingGet_decorators = [Remote("pricingGet")];
			_visionStatus_decorators = [Remote("visionStatus")];
			_visionConfigGet_decorators = [Remote("visionConfigGet")];
			_visionConfigSet_decorators = [Remote("visionConfigSet")];
			_visionEndpointModels_decorators = [Remote("visionEndpointModels")];
			_gitBranches_decorators = [Remote("gitBranches")];
			_gitLog_decorators = [Remote("gitLog")];
			_gitCommit_decorators = [Remote("gitCommit")];
			_gitWorking_decorators = [Remote("gitWorking")];
			_gitCheckout_decorators = [Remote("gitCheckout")];
			_gitStatus_decorators = [Remote("gitStatus")];
			_gitDiff_decorators = [Remote("gitDiff")];
			_gitStage_decorators = [Remote("gitStage")];
			_gitUnstage_decorators = [Remote("gitUnstage")];
			_gitDiscard_decorators = [Remote("gitDiscard")];
			_fsList_decorators = [Remote("fsList")];
			_fsSearch_decorators = [Remote("fsSearch")];
			_fsRead_decorators = [Remote("fsRead")];
			_fsWrite_decorators = [Remote("fsWrite")];
			_fsDelete_decorators = [Remote("fsDelete")];
			_fsOfficePreview_decorators = [Remote("fsOfficePreview")];
			_fsBrowse_decorators = [Remote("fsBrowse")];
			_pluginList_decorators = [Remote("pluginList")];
			_pluginRemove_decorators = [Remote("pluginRemove")];
			_pluginUpdate_decorators = [Remote("pluginUpdate")];
			__esDecorate(this, null, _taskList_decorators, {
				kind: "method",
				name: "taskList",
				static: false,
				private: false,
				access: {
					has: (obj) => "taskList" in obj,
					get: (obj) => obj.taskList
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _taskCreate_decorators, {
				kind: "method",
				name: "taskCreate",
				static: false,
				private: false,
				access: {
					has: (obj) => "taskCreate" in obj,
					get: (obj) => obj.taskCreate
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _taskUpdate_decorators, {
				kind: "method",
				name: "taskUpdate",
				static: false,
				private: false,
				access: {
					has: (obj) => "taskUpdate" in obj,
					get: (obj) => obj.taskUpdate
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _taskRemove_decorators, {
				kind: "method",
				name: "taskRemove",
				static: false,
				private: false,
				access: {
					has: (obj) => "taskRemove" in obj,
					get: (obj) => obj.taskRemove
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _taskRun_decorators, {
				kind: "method",
				name: "taskRun",
				static: false,
				private: false,
				access: {
					has: (obj) => "taskRun" in obj,
					get: (obj) => obj.taskRun
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _balanceGet_decorators, {
				kind: "method",
				name: "balanceGet",
				static: false,
				private: false,
				access: {
					has: (obj) => "balanceGet" in obj,
					get: (obj) => obj.balanceGet
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _pricingGet_decorators, {
				kind: "method",
				name: "pricingGet",
				static: false,
				private: false,
				access: {
					has: (obj) => "pricingGet" in obj,
					get: (obj) => obj.pricingGet
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _visionStatus_decorators, {
				kind: "method",
				name: "visionStatus",
				static: false,
				private: false,
				access: {
					has: (obj) => "visionStatus" in obj,
					get: (obj) => obj.visionStatus
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _visionConfigGet_decorators, {
				kind: "method",
				name: "visionConfigGet",
				static: false,
				private: false,
				access: {
					has: (obj) => "visionConfigGet" in obj,
					get: (obj) => obj.visionConfigGet
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _visionConfigSet_decorators, {
				kind: "method",
				name: "visionConfigSet",
				static: false,
				private: false,
				access: {
					has: (obj) => "visionConfigSet" in obj,
					get: (obj) => obj.visionConfigSet
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _visionEndpointModels_decorators, {
				kind: "method",
				name: "visionEndpointModels",
				static: false,
				private: false,
				access: {
					has: (obj) => "visionEndpointModels" in obj,
					get: (obj) => obj.visionEndpointModels
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _gitBranches_decorators, {
				kind: "method",
				name: "gitBranches",
				static: false,
				private: false,
				access: {
					has: (obj) => "gitBranches" in obj,
					get: (obj) => obj.gitBranches
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _gitLog_decorators, {
				kind: "method",
				name: "gitLog",
				static: false,
				private: false,
				access: {
					has: (obj) => "gitLog" in obj,
					get: (obj) => obj.gitLog
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _gitCommit_decorators, {
				kind: "method",
				name: "gitCommit",
				static: false,
				private: false,
				access: {
					has: (obj) => "gitCommit" in obj,
					get: (obj) => obj.gitCommit
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _gitWorking_decorators, {
				kind: "method",
				name: "gitWorking",
				static: false,
				private: false,
				access: {
					has: (obj) => "gitWorking" in obj,
					get: (obj) => obj.gitWorking
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _gitCheckout_decorators, {
				kind: "method",
				name: "gitCheckout",
				static: false,
				private: false,
				access: {
					has: (obj) => "gitCheckout" in obj,
					get: (obj) => obj.gitCheckout
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _gitStatus_decorators, {
				kind: "method",
				name: "gitStatus",
				static: false,
				private: false,
				access: {
					has: (obj) => "gitStatus" in obj,
					get: (obj) => obj.gitStatus
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _gitDiff_decorators, {
				kind: "method",
				name: "gitDiff",
				static: false,
				private: false,
				access: {
					has: (obj) => "gitDiff" in obj,
					get: (obj) => obj.gitDiff
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _gitStage_decorators, {
				kind: "method",
				name: "gitStage",
				static: false,
				private: false,
				access: {
					has: (obj) => "gitStage" in obj,
					get: (obj) => obj.gitStage
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _gitUnstage_decorators, {
				kind: "method",
				name: "gitUnstage",
				static: false,
				private: false,
				access: {
					has: (obj) => "gitUnstage" in obj,
					get: (obj) => obj.gitUnstage
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _gitDiscard_decorators, {
				kind: "method",
				name: "gitDiscard",
				static: false,
				private: false,
				access: {
					has: (obj) => "gitDiscard" in obj,
					get: (obj) => obj.gitDiscard
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _fsList_decorators, {
				kind: "method",
				name: "fsList",
				static: false,
				private: false,
				access: {
					has: (obj) => "fsList" in obj,
					get: (obj) => obj.fsList
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _fsSearch_decorators, {
				kind: "method",
				name: "fsSearch",
				static: false,
				private: false,
				access: {
					has: (obj) => "fsSearch" in obj,
					get: (obj) => obj.fsSearch
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _fsRead_decorators, {
				kind: "method",
				name: "fsRead",
				static: false,
				private: false,
				access: {
					has: (obj) => "fsRead" in obj,
					get: (obj) => obj.fsRead
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _fsWrite_decorators, {
				kind: "method",
				name: "fsWrite",
				static: false,
				private: false,
				access: {
					has: (obj) => "fsWrite" in obj,
					get: (obj) => obj.fsWrite
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _fsDelete_decorators, {
				kind: "method",
				name: "fsDelete",
				static: false,
				private: false,
				access: {
					has: (obj) => "fsDelete" in obj,
					get: (obj) => obj.fsDelete
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _fsOfficePreview_decorators, {
				kind: "method",
				name: "fsOfficePreview",
				static: false,
				private: false,
				access: {
					has: (obj) => "fsOfficePreview" in obj,
					get: (obj) => obj.fsOfficePreview
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _fsBrowse_decorators, {
				kind: "method",
				name: "fsBrowse",
				static: false,
				private: false,
				access: {
					has: (obj) => "fsBrowse" in obj,
					get: (obj) => obj.fsBrowse
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _pluginList_decorators, {
				kind: "method",
				name: "pluginList",
				static: false,
				private: false,
				access: {
					has: (obj) => "pluginList" in obj,
					get: (obj) => obj.pluginList
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _pluginRemove_decorators, {
				kind: "method",
				name: "pluginRemove",
				static: false,
				private: false,
				access: {
					has: (obj) => "pluginRemove" in obj,
					get: (obj) => obj.pluginRemove
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			__esDecorate(this, null, _pluginUpdate_decorators, {
				kind: "method",
				name: "pluginUpdate",
				static: false,
				private: false,
				access: {
					has: (obj) => "pluginUpdate" in obj,
					get: (obj) => obj.pluginUpdate
				},
				metadata: _metadata
			}, null, _instanceExtraInitializers);
			if (_metadata) Object.defineProperty(this, Symbol.metadata, {
				enumerable: true,
				configurable: true,
				writable: true,
				value: _metadata
			});
		}
		resolved = __runInitializers(this, _instanceExtraInitializers);
		balance;
		board;
		pricing;
		/** Resolved lazily: the walk is filesystem work no other capability needs. */
		profileDirCache;
		/** Built on first mutation, so a deployment outside a profile never makes one. */
		pnpm;
		/**
		* Register the gateway, mount the task board (recovering interrupted
		* runs), and start the scheduler.
		* @param ctx - owning context with the injected core services.
		* @param config - plugin config; defaults apply field-wise.
		*/
		constructor(ctx, config = {}) {
			super(ctx, "webEnhanced");
			this.resolved = resolveConfig(config);
			this.balance = new BalanceClient({
				apiKeyEnv: this.resolved.balanceApiKeyEnv,
				cacheTtlMs: this.resolved.balanceCacheTtlMs,
				baseUrl: this.resolved.balanceBaseUrl
			}, async (ref) => {
				const credentials = ctx.get("credentials");
				if (credentials === void 0) return void 0;
				return (await credentials.resolve(ref))?.value;
			});
			this.board = new TaskBoard(ctx, this.boardDeps(ctx), { cronIntervalMs: this.resolved.cronIntervalMs });
			this.pricing = new ModelsDevPricing({
				url: this.resolved.modelsDevUrl,
				ttlMs: this.resolved.modelsDevCacheTtlMs,
				timeoutMs: this.resolved.modelsDevTimeoutMs,
				providerMap: this.resolved.pricingProviderMap
			});
		}
		/** List every task, oldest first. */
		taskList() {
			return this.board.list();
		}
		/** Create a task; a cron expression is validated and its next run computed. */
		taskCreate(request) {
			return this.board.create(request);
		}
		/** Update title, prompt, cron, or board column (planned/todo only). */
		taskUpdate(request) {
			return this.board.update(request);
		}
		/** Remove one task record. */
		taskRemove(request) {
			return this.board.remove(request);
		}
		/** Start one task immediately in a fresh agent session. */
		taskRun(request) {
			return this.board.run(request);
		}
		/** One balance view (cached), hidden when the route bills another account. */
		async balanceGet(request) {
			if (!this.balanceApplies(request.provider)) return {
				applicable: false,
				isAvailable: false,
				infos: [],
				cachedAt: Date.now()
			};
			return {
				...await this.balance.get(),
				applicable: true
			};
		}
		/** models.dev pricing for one model route (cached, USD per 1M tokens). */
		async pricingGet(request) {
			try {
				const pricing = await this.pricing.pricingFor(request.provider, request.model);
				if (pricing === void 0) return { error: {
					code: "pricing-not-found",
					message: `models.dev has no pricing for '${request.provider}/${request.model}'`
				} };
				return {
					provider: request.provider,
					model: request.model,
					pricing
				};
			} catch (error) {
				return { error: this.errorOf(error, "pricing-error") };
			}
		}
		/**
		* Live state of the image-understanding integration: whether the admission
		* patch is active, which vision models/endpoints the transcription engine
		* can use, and its last failure. Read lazily so a deployment that mounts no
		* integration reports that state instead of throwing.
		*/
		async visionStatus() {
			try {
				return await this.visionStatusView();
			} catch (error) {
				return { error: this.errorOf(error, "vision-status") };
			}
		}
		/**
		* The editable vision configuration plus the picker options and the live
		* status, all in one read. The API key is never returned.
		*/
		async visionConfigGet() {
			try {
				const settings = this.visionSettings();
				if (settings === void 0) return { error: {
					code: "vision-settings-unavailable",
					message: "the settings service is not mounted in this deployment"
				} };
				const raw = settings.get(VISION_SETTINGS_NS);
				if (raw === void 0 || typeof raw !== "object") return { error: {
					code: "vision-settings-unmanaged",
					message: `settings namespace '${VISION_SETTINGS_NS}' is not registered`
				} };
				const descriptor = settings.describe().find((entry) => entry.ns === VISION_SETTINGS_NS);
				return {
					managed: true,
					writable: settings.writable,
					revision: descriptor?.revision ?? null,
					enabled: raw.enabled,
					patchAdmission: raw.patchAdmission,
					provider: raw.provider,
					model: raw.model,
					prompt: raw.prompt,
					marker: raw.marker,
					baseUrl: raw.baseUrl,
					apiKeySet: raw.apiKey !== "",
					apiKeyEnv: raw.apiKeyEnv,
					endpointModel: raw.endpointModel,
					endpointModels: raw.endpointModels,
					anonymous: raw.anonymous,
					timeoutMs: raw.timeoutMs,
					maxTokens: raw.maxTokens,
					autoLocalOllama: raw.autoLocalOllama,
					localOllamaModel: raw.localOllamaModel,
					localOllamaUrl: raw.localOllamaUrl,
					fallbackCount: raw.fallbackModels.length,
					cacheLimit: raw.cacheLimit,
					cooldownMs: raw.cooldownMs,
					providers: await this.visionProviderOptions(),
					status: await this.visionStatusView()
				};
			} catch (error) {
				return { error: this.errorOf(error, "vision-config") };
			}
		}
		/**
		* Save one vision-config patch into the settings namespace. The namespace
		* owner (`VisionInterceptor`) watches the commit and reconfigures live, so
		* no restart is needed; `expectedRevision` gives the save CAS semantics.
		*/
		async visionConfigSet(request) {
			try {
				const settings = this.visionSettings();
				if (settings === void 0) return { error: {
					code: "vision-settings-unavailable",
					message: "the settings service is not mounted in this deployment"
				} };
				if (!settings.writable) return { error: {
					code: "vision-settings-readonly",
					message: "the settings provider is read-only"
				} };
				if (settings.get("dsh-web-enhanced-vision") === void 0) return { error: {
					code: "vision-settings-unmanaged",
					message: `settings namespace '${VISION_SETTINGS_NS}' is not registered`
				} };
				const patch = {};
				const source = request.patch;
				if (source !== void 0) {
					for (const [key, value] of Object.entries(source)) if (VISION_CONFIG_EDITABLE_KEYS.has(key)) patch[key] = value;
				}
				await settings.update(VISION_SETTINGS_NS, patch, request.expectedRevision);
				return {
					ok: true,
					revision: settings.describe().find((entry) => entry.ns === "dsh-web-enhanced-vision")?.revision ?? 0
				};
			} catch (error) {
				const conflict = error.code === "SETTINGS_CONFLICT";
				return { error: this.errorOf(error, conflict ? "vision-config-conflict" : "vision-config-save") };
			}
		}
		/**
		* Fetch the dedicated endpoint's `/models` listing. A typed key is one-shot
		* for this call; otherwise the SAVED key (or its env fallback) is used. The
		* key is never stored, logged, or returned.
		*/
		async visionEndpointModels(request) {
			try {
				const saved = this.visionSettings()?.get(VISION_SETTINGS_NS);
				const baseUrl = (request.baseUrl?.trim() ?? saved?.baseUrl ?? "").trim();
				if (baseUrl === "") return { error: {
					code: "vision-endpoint-missing",
					message: "set the dedicated API base URL first (in the form or in the saved settings)"
				} };
				const apiKey = resolveVisionApiKey({
					apiKey: request.apiKey !== void 0 && request.apiKey !== "" ? request.apiKey : saved?.apiKey ?? "",
					anonymous: request.anonymous ?? saved?.anonymous ?? false
				}, baseUrl, saved?.apiKeyEnv ?? "VISION_API_KEY");
				const timeoutMs = Math.min(saved?.timeoutMs ?? 12e4, 15e3);
				const response = await fetch(`${baseUrl.replace(/\/+$/u, "")}/models`, {
					headers: { ...apiKey === "" ? {} : { authorization: `Bearer ${apiKey}` } },
					signal: AbortSignal.timeout(timeoutMs)
				});
				if (!response.ok) {
					const body = await response.text();
					const { kind, hint } = classifyVisionHttpError(response.status, body);
					return { error: {
						code: `vision-endpoint-${kind}`,
						message: `model listing failed at ${baseUrl}: ${body.slice(0, 200)} — ${hint}`
					} };
				}
				let payload;
				try {
					payload = JSON.parse(await response.text());
				} catch {
					return { error: {
						code: "vision-endpoint-parse",
						message: "the endpoint returned a non-JSON model listing"
					} };
				}
				const listed = Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
				const models = [];
				let truncated = false;
				for (const entry of listed) {
					const id = entry?.id;
					if (typeof id !== "string" || id.trim() === "") continue;
					const name = entry?.name;
					models.push({
						id: id.trim(),
						name: typeof name === "string" && name.trim() !== "" ? name.trim() : id.trim()
					});
					if (models.length >= 200) {
						truncated = listed.length > 200;
						break;
					}
				}
				return {
					baseUrl,
					models,
					truncated
				};
			} catch (error) {
				const message = error instanceof Error ? error.message : String(error);
				const aborted = error instanceof Error && error.name === "TimeoutError" || /aborted due to timeout|timed out/iu.test(message);
				return { error: this.errorOf(error, aborted ? "vision-endpoint-timeout" : "vision-endpoint-fetch") };
			}
		}
		/** Local branches; the current branch carries the flag. */
		async gitBranches(request) {
			return this.withGit(request.workspaceId, async (client) => ({ branches: await client.branches() }));
		}
		/** Recent commits with branch markers; one branch when the graph filters. */
		async gitLog(request) {
			return this.withGit(request.workspaceId, async (client) => {
				const maxCount = request.maxCount === void 0 ? this.resolved.gitMaxCount : request.maxCount;
				return { commits: await client.log(maxCount, request.branch) };
			});
		}
		/** One commit's identity, message, and per-file line counts. */
		async gitCommit(request) {
			return this.withGit(request.workspaceId, async (client) => ({ commit: await client.commit(request.hash) }));
		}
		/**
		* The uncommitted state of the work tree: staged, unstaged, and untracked
		* files with their line counts, plus the HEAD the graph attaches them to.
		*/
		async gitWorking(request) {
			return this.withGit(request.workspaceId, async (client, root) => ({ working: await client.working(this.resolved.gitWorkingMaxFiles, (path) => countTextLines(root, path, this.fsLimits)) }));
		}
		/** Check out one branch; a rejected switch carries its stderr message. */
		async gitCheckout(request) {
			return this.withGit(request.workspaceId, async (client) => client.checkout(request.branch));
		}
		/** Worktree status (porcelain v1). */
		async gitStatus(request) {
			return this.withGit(request.workspaceId, async (client) => ({ entries: await client.status() }));
		}
		/** Unified diff text, optionally staged, optionally one path. */
		async gitDiff(request) {
			return this.withGit(request.workspaceId, async (client) => ({ text: await client.diff(request.path, request.staged === true) }));
		}
		/** Stage paths. */
		async gitStage(request) {
			return this.withGit(request.workspaceId, async (client) => {
				await client.stage(request.paths);
				return { ok: true };
			});
		}
		/** Unstage paths. */
		async gitUnstage(request) {
			return this.withGit(request.workspaceId, async (client) => {
				await client.unstage(request.paths);
				return { ok: true };
			});
		}
		/** Discard worktree changes of tracked paths. */
		async gitDiscard(request) {
			return this.withGit(request.workspaceId, async (client) => {
				await client.discard(request.paths);
				return { ok: true };
			});
		}
		/** List one directory (skips .git and configured skip dirs). */
		async fsList(request) {
			const root = this.workspaceRootFor(request.workspaceId);
			if (root === null) return { error: {
				code: "workspace-not-found",
				message: `workspace '${request.workspaceId}' does not exist`
			} };
			try {
				return { entries: await listDirectory(root, request.path ?? "", this.fsLimits) };
			} catch (error) {
				return { error: this.errorOf(error, "fs-list") };
			}
		}
		/** Recursive basename search (bounded). */
		async fsSearch(request) {
			const root = this.workspaceRootFor(request.workspaceId);
			if (root === null) return { error: {
				code: "workspace-not-found",
				message: `workspace '${request.workspaceId}' does not exist`
			} };
			try {
				return { entries: await searchFiles(root, request.path ?? "", request.query ?? "", this.fsLimits) };
			} catch (error) {
				return { error: this.errorOf(error, "fs-search") };
			}
		}
		/** Read one file (text capped / binary base64 preview). */
		async fsRead(request) {
			const root = this.workspaceRootFor(request.workspaceId);
			if (root === null) return { error: {
				code: "workspace-not-found",
				message: `workspace '${request.workspaceId}' does not exist`
			} };
			try {
				return await readFileView(root, request.path, this.fsLimits);
			} catch (error) {
				return { error: this.errorOf(error, "fs-read") };
			}
		}
		/** Write one UTF-8 file. */
		async fsWrite(request) {
			const root = this.workspaceRootFor(request.workspaceId);
			if (root === null) return { error: {
				code: "workspace-not-found",
				message: `workspace '${request.workspaceId}' does not exist`
			} };
			try {
				await writeFileView(root, request.path, request.content, this.fsLimits);
				return { ok: true };
			} catch (error) {
				return { error: this.errorOf(error, "fs-write") };
			}
		}
		/** Delete one file (never a directory). */
		async fsDelete(request) {
			const root = this.workspaceRootFor(request.workspaceId);
			if (root === null) return { error: {
				code: "workspace-not-found",
				message: `workspace '${request.workspaceId}' does not exist`
			} };
			try {
				await deleteFileView(root, request.path);
				return { ok: true };
			} catch (error) {
				return { error: this.errorOf(error, "fs-delete") };
			}
		}
		/** Convert an Office file (docx/xlsx) into preview blocks. */
		async fsOfficePreview(request) {
			const root = this.workspaceRootFor(request.workspaceId);
			if (root === null) return { error: {
				code: "workspace-not-found",
				message: `workspace '${request.workspaceId}' does not exist`
			} };
			try {
				return await officePreviewView(root, request.path, this.officeLimits);
			} catch (error) {
				return { error: this.errorOf(error, "office-preview") };
			}
		}
		/**
		* List one absolute directory anywhere on the host (the mention browser).
		*
		* Deliberately NOT workspace-scoped: a mention is a path string, and the
		* path the user wants may sit outside the project. Reads, writes, and
		* previews stay behind the workspace root — this returns names, kinds, and
		* sizes only.
		*/
		async fsBrowse(request) {
			try {
				return await browseDirectory(request.path, { maxEntries: this.resolved.browseMaxEntries });
			} catch (error) {
				return { error: this.errorOf(error, "fs-browse") };
			}
		}
		/**
		* The profile's installed plugins.
		*
		* Answers `no-profile` rather than an empty list when this deployment loads
		* the plugin from outside any profile (a source checkout, a test): those are
		* different facts, and an empty list would invite a removal that cannot work.
		*/
		async pluginList(_request) {
			try {
				const dir = await this.profileDir();
				if (dir === void 0) return { error: this.noProfile() };
				const inventory = await readInventory(dir);
				return {
					profileDir: inventory.dir,
					profileName: inventory.name,
					plugins: inventory.plugins,
					templateBundles: inventory.templateBundles,
					busy: this.pnpm?.running ?? false
				};
			} catch (error) {
				return { error: this.errorOf(error, "plugin-list") };
			}
		}
		/** Remove one plugin from the profile (takes effect on the next start). */
		async pluginRemove(request) {
			return this.pluginOperation(request.name, (runner) => runner.remove(request.name));
		}
		/** Update one plugin to its spec's head (takes effect on the next start). */
		async pluginUpdate(request) {
			return this.pluginOperation(request.name, (runner) => runner.update(request.name));
		}
		/** The settings provider the vision config remotes read and write. */
		visionSettings() {
			return this.ctx.get("settings", false);
		}
		/** The live integration status, or the explicit unmounted state. */
		async visionStatusView() {
			const service = this.ctx.get("visionIntegration", false);
			if (service === void 0) return {
				mounted: false,
				enabled: false,
				patchAdmission: false,
				admissionActive: false,
				harnessModels: [],
				endpointConfigured: false,
				endpointModel: null,
				apiKeySource: "unset",
				ollamaDetected: false,
				ollamaModel: null,
				cacheSize: 0,
				lastError: "the vision integration service is not mounted in this deployment"
			};
			return await service.status();
		}
		/** Providers and models for the Vision tab, from the model picker's source. */
		async visionProviderOptions() {
			const llm = this.ctx.get("llm", false);
			if (llm === void 0 || typeof llm.listProviders !== "function") return [];
			const options = [];
			for (const provider of llm.listProviders()) try {
				const models = await llm.listModels(provider.id);
				options.push({
					provider: provider.id,
					name: provider.name ?? provider.id,
					models: models.map((model) => ({
						id: model.id,
						name: model.name ?? model.id,
						supportsImage: (model.inputModalities ?? []).includes("image")
					}))
				});
			} catch {}
			return options;
		}
		/**
		* Whether the balance describes the account one model route bills.
		*
		* The provider's endpoint is read from the settings section its own adapter
		* declares, through `ctx.llm`'s configurable-provider directory — both read
		* uninjected, because a deployment that composes neither still has a working
		* gateway and simply falls back to the allow list.
		*/
		balanceApplies(provider) {
			return balanceApplies({
				provider,
				allowed: this.resolved.balanceProviders,
				balanceBaseUrl: this.resolved.balanceBaseUrl,
				providerBaseUrl: provider === void 0 ? void 0 : this.providerBaseUrl(provider)
			});
		}
		/** Configured endpoint of one provider route, when its settings declare one. */
		providerBaseUrl(provider) {
			const llm = this.ctx.get("llm");
			const settings = this.ctx.get("settings");
			if (llm === void 0 || settings === void 0) return void 0;
			const entry = llm.listConfigurableProviders().find((candidate) => candidate.provider === provider);
			if (entry === void 0 || entry.settingsNs === "") return void 0;
			let value = settings.get(entry.settingsNs);
			for (const step of entry.settingsPath) {
				if (typeof value !== "object" || value === null) return void 0;
				value = value[step];
			}
			if (typeof value !== "object" || value === null) return void 0;
			const baseUrl = value["baseURL"];
			return typeof baseUrl === "string" && baseUrl.trim() !== "" ? baseUrl : void 0;
		}
		get fsLimits() {
			return {
				skipDirs: this.resolved.skipDirs,
				readMaxBytes: this.resolved.readMaxBytes,
				writeMaxBytes: this.resolved.writeMaxBytes,
				binaryMaxBytes: this.resolved.binaryMaxBytes,
				searchMaxDepth: this.resolved.searchMaxDepth,
				searchMaxEntries: this.resolved.searchMaxEntries
			};
		}
		get gitLimits() {
			return {
				outputMaxBytes: this.resolved.gitOutputMaxBytes,
				maxCount: this.resolved.gitMaxCount
			};
		}
		get officeLimits() {
			return { maxBytes: this.resolved.officeMaxBytes };
		}
		runDeps(ctx) {
			const loader = ctx.get("loader");
			return {
				agents: ctx.agents,
				sessions: ctx.sessions,
				agentDefaultModel: ctx.agentDefaultModel,
				awaitLoader: loader === void 0 ? void 0 : () => loader.await(),
				presets: () => ctx.get("agentPresets"),
				attachWorkspaceSession: async (workspaceId, sessionId) => {
					try {
						const workspace = this.ctx.workspaceRegistry.get(workspaceId);
						if (workspace === void 0) throw new Error(`workspace '${workspaceId}' is no longer registered`);
						await workspace.attachSession(sessionId);
					} catch (error) {
						ctx.logger.warn(`web-enhanced could not record run session '${sessionId}' on workspace '${workspaceId}': ` + (error instanceof Error ? error.message : String(error)));
					}
				}
			};
		}
		boardDeps(ctx) {
			return {
				...this.runDeps(ctx),
				workspaceRoot: (workspaceId) => this.workspaceRoot(workspaceId),
				resolveWorkspaceId: (workspaceId) => this.resolveWorkspaceId(workspaceId),
				logger: ctx.logger
			};
		}
		/** Resolve a workspace id to its canonical root; null when unknown. */
		workspaceRootFor(workspaceId) {
			return this.ctx.workspaceRegistry.list().find((workspace) => workspace.id === workspaceId)?.path ?? null;
		}
		resolveWorkspaceId(workspaceId) {
			const found = this.ctx.workspaceRegistry.list().find((workspace) => workspace.id === workspaceId);
			return found === void 0 ? null : found.id;
		}
		workspaceRoot(workspaceId) {
			if (workspaceId === null) return process.cwd();
			return this.ctx.workspaceRegistry.list().find((workspace) => workspace.id === workspaceId)?.path ?? process.cwd();
		}
		async withGit(workspaceId, fn) {
			const root = this.workspaceRootFor(workspaceId);
			if (root === null) return { error: {
				code: "workspace-not-found",
				message: `workspace '${workspaceId}' does not exist`
			} };
			try {
				return await fn(new GitClient(this.ctx.subprocess, root, this.gitLimits), root);
			} catch (error) {
				return { error: this.errorOf(error, "git-error") };
			}
		}
		/** The error returned when this deployment sits outside any profile. */
		noProfile() {
			return {
				code: "no-profile",
				message: "this deployment does not load the plugin from a dsh profile, so there is nothing to manage"
			};
		}
		/**
		* The profile directory, resolved once and cached.
		*
		* A profile cannot move under a running host, so a repeated walk would only
		* repeat the same filesystem reads. The promise itself is cached so
		* concurrent first callers share one walk. A configured path wins outright:
		* the walk is a heuristic over where the module happens to sit.
		*/
		profileDir() {
			if (this.resolved.profileDir !== "") return Promise.resolve(this.resolved.profileDir);
			this.profileDirCache ??= findProfileDir();
			return this.profileDirCache;
		}
		/**
		* Run one plugin mutation, guarding what pnpm itself would not.
		*
		* The refusal here is for a name pnpm cannot act on: a template bundle is in
		* the layer list precisely because nothing depends on it, so `pnpm remove`
		* would report success having done nothing. Removing the row that IS this
		* plugin is NOT refused — that is a legitimate thing to want, and the
		* `self` flag exists so the surface can confirm it rather than have the
		* gateway decide on the user's behalf.
		* @param name - package name from the request.
		* @param operation - the runner call to perform.
		* @returns the mutation result.
		*/
		async pluginOperation(name, operation) {
			try {
				const dir = await this.profileDir();
				if (dir === void 0) return { error: this.noProfile() };
				const inventory = await readInventory(dir);
				if (inventory.plugins.find((plugin) => plugin.name === name) === void 0) {
					const template = inventory.templateBundles.includes(name);
					return { error: {
						code: template ? "plugin-not-removable" : "plugin-not-found",
						message: template ? `'${name}' is a profile template layer, not a dependency — it cannot be removed or updated by pnpm` : `'${name}' is not a dependency of profile '${inventory.name}'`
					} };
				}
				this.pnpm ??= new PnpmRunner(this.ctx.subprocess, dir, {
					timeoutMs: this.resolved.pluginOpTimeoutMs,
					outputMaxBytes: this.resolved.gitOutputMaxBytes
				});
				const { run, added, removed } = await operation(this.pnpm);
				const output = `${run.stdout}\n${run.stderr}`.trim();
				const failure = pnpmFailureCode(run);
				if (failure !== void 0) return {
					ok: false,
					added,
					removed,
					restartRequired: false,
					output: output || failure
				};
				return {
					ok: true,
					added,
					removed,
					restartRequired: true,
					output
				};
			} catch (error) {
				return { error: this.errorOf(error, "plugin-operation") };
			}
		}
		errorOf(error, fallback) {
			const message = error instanceof Error ? error.message : String(error);
			return {
				code: error instanceof Error && error.code === "ENOENT" ? "not-found" : fallback,
				message
			};
		}
	};
})();
//#endregion
//#region lib/types/index.js
/**
* dsh-web-enhanced plugin entry: mounts the web-enhanced gateway (task
* board with cron scheduling, git, files, Office preview, and balance) as
* one Typert namespace consumed by the browser half.
* @module dsh-web-enhanced
*/
/** Cordis plugin name (the loader row references the package, this is the entry name). */
const name = "web-enhanced";
/**
* Core services the gateway and its scheduler require.
*
* `typert` is required for the descriptor registration below, not by the
* gateway itself.
*/
const inject = [
	"agents",
	"sessions",
	"agentDefaultModel",
	"storageDomain",
	"subprocess",
	"workspaceRegistry",
	"typert"
];
/**
* Mount the gateway, its scheduler, and the strict Remote definitions.
*
* The descriptors are registered explicitly instead of relying on the
* Gateway's SRC discovery. SRC mode reads the `@Remote` markers out of
* dsh-typert-protocol's private module state, which is only shared when the
* plugin and the host resolve that package to the same file — a globally
* installed `dsh` CLI bundles its own copy while an installed plugin binds to
* the profile's, so the markers never meet and the Gateway refuses (404s)
* every endpoint. The `ctx.typert.local` registry is a Cordis service and does
* not care how the specifier resolved.
* @param ctx - owning context with the injected core services.
* @param config - plugin config; defaults apply field-wise.
* @throws when the host's Typert service exposes no registration method,
* which would otherwise surface as every endpoint answering 404.
*/
function apply(ctx, config = {}) {
	const registrar = ctx.typert;
	if (typeof registrar.register !== "function") throw new TypeError("dsh-web-enhanced: the host Typert service exposes no register() method, so the Remote definitions cannot be published and every endpoint would answer 404");
	const register = registrar.register.bind(registrar);
	ctx.effect(() => register({
		package: WEB_ENHANCED_PACKAGE,
		face: "host",
		schemas: [],
		model: {
			services: [],
			events: [],
			objects: []
		},
		invocations: WEB_ENHANCED_DESCRIPTORS
	}), "web-enhanced: Remote definitions");
	ctx.plugin(VisionInterceptor, config);
	ctx.plugin(WebEnhancedGateway, config);
}
//#endregion
export { Config, VISION_SETTINGS_NS, VisionInterceptor, VisionSettingsSchema, VisionTranscriber, WebEnhancedGateway, apply, inject, name };
