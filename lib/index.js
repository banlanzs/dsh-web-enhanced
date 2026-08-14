import { z } from "zod";
import z$1 from "@deepseek-ai/schemastery";
import { Remote, TypertRemoteService } from "@deepseek-ai/dsh-typert-protocol";
import { randomUUID } from "node:crypto";
import { defineDomain, domainTable } from "@deepseek-ai/dsh-storage-domain";
import { installModelSelection } from "@deepseek-ai/dsh-agent";
import { createUserMessage } from "@deepseek-ai/dsh-llm";
import { SessionId } from "@deepseek-ai/dsh-session";
import { open, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import { join, resolve, sep } from "node:path";
import { unzipSync } from "fflate";
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
	isAvailable: z.boolean(),
	infos: z.array(balanceInfoSchema),
	cachedAt: z.number(),
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
	nullary("balanceGet", "BalanceView", balanceViewSchema),
	unary("gitBranches", "GitBranchesRequest", "GitBranchesResult", okOrError(z.object({ branches: z.array(gitBranchViewSchema) }))),
	unary("gitLog", "GitLogRequest", "GitLogResult", okOrError(z.object({ commits: z.array(gitCommitViewSchema) }))),
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
	unary("fsOfficePreview", "FsOfficePreviewRequest", "FsOfficePreviewResult", okOrError(officePreviewSchema))
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
* Create the run's agent session (settled loader, default model selection).
* @param deps - core services.
* @param cwd - run working directory.
* @returns the live agent and its session id.
*/
async function createTaskAgent(deps, cwd) {
	if (deps.awaitLoader !== void 0) await deps.awaitLoader();
	const selection = deps.agentDefaultModel.currentSelection();
	const sessionId = SessionId(`task-${randomUUID()}`);
	const { agent } = await deps.agents.create({
		sessionId,
		meta: { cwd },
		agentOptions: {
			provider: selection.provider,
			model: selection.model
		},
		setup: (agentCtx) => {
			installModelSelection(agentCtx, {
				current: selection,
				assembled: void 0
			});
		}
	});
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
			const { agent, sessionId } = await createTaskAgent(this.deps, this.deps.workspaceRoot(workspaceId));
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
			const { agent, sessionId } = await createTaskAgent(this.deps, this.deps.workspaceRoot(current.workspaceId));
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
/** Recursive basename search with bounded depth and result count. */
async function searchFiles(root, rel, query, limits) {
	const needle = query.trim().toLowerCase();
	const out = [];
	const walk = async (dir, depth) => {
		if (depth > limits.searchMaxDepth || out.length >= limits.searchMaxEntries) return;
		const entries = await readdir(dir, { withFileTypes: true });
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
/** Reject a repository-relative path with traversal or absolutes. */
function assertSafeRelPath(path) {
	if (path.startsWith("/") || /^[A-Za-z]:[\\/]/u.test(path)) throw new Error(`path '${path}' must be relative`);
	if (path.split("/").some((segment) => segment === ".." || segment === ".")) throw new Error(`path '${path}' must not contain '.' or '..' segments`);
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
	/** Recent commits across all refs, newest first, with branch markers. */
	async log(maxCount) {
		const run = await this.run([
			"log",
			"--all",
			"--date-order",
			`--max-count=${maxCount}`,
			`--pretty=format:%H%x1f%P%x1f%an%x1f%at%x1f%s`
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
const Config = z$1.object({
	cronIntervalMs: z$1.number().default(3e4),
	balanceApiKeyEnv: z$1.string().default("DEEPSEEK_API_KEY"),
	balanceCacheTtlMs: z$1.number().default(6e4),
	balanceBaseUrl: z$1.string().default("https://api.deepseek.com"),
	skipDirs: z$1.array(z$1.string()).default(["node_modules"]),
	readMaxBytes: z$1.number().default(1048576),
	writeMaxBytes: z$1.number().default(2097152),
	binaryMaxBytes: z$1.number().default(5242880),
	gitOutputMaxBytes: z$1.number().default(262144),
	gitMaxCount: z$1.number().default(100),
	searchMaxDepth: z$1.number().default(8),
	searchMaxEntries: z$1.number().default(200),
	officeMaxBytes: z$1.number().default(5242880)
});
/** Field defaults applied when the gateway is constructed directly. */
function resolveConfig(config) {
	return {
		cronIntervalMs: config.cronIntervalMs ?? 3e4,
		balanceApiKeyEnv: config.balanceApiKeyEnv ?? "DEEPSEEK_API_KEY",
		balanceCacheTtlMs: config.balanceCacheTtlMs ?? 6e4,
		balanceBaseUrl: config.balanceBaseUrl ?? "https://api.deepseek.com",
		skipDirs: config.skipDirs ?? ["node_modules"],
		readMaxBytes: config.readMaxBytes ?? 1048576,
		writeMaxBytes: config.writeMaxBytes ?? 2097152,
		binaryMaxBytes: config.binaryMaxBytes ?? 5242880,
		gitOutputMaxBytes: config.gitOutputMaxBytes ?? 262144,
		gitMaxCount: config.gitMaxCount ?? 100,
		searchMaxDepth: config.searchMaxDepth ?? 8,
		searchMaxEntries: config.searchMaxEntries ?? 200,
		officeMaxBytes: config.officeMaxBytes ?? 5242880
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
	let _gitBranches_decorators;
	let _gitLog_decorators;
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
	return class WebEnhancedGateway extends _classSuper {
		static {
			const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(_classSuper[Symbol.metadata] ?? null) : void 0;
			_taskList_decorators = [Remote("taskList")];
			_taskCreate_decorators = [Remote("taskCreate")];
			_taskUpdate_decorators = [Remote("taskUpdate")];
			_taskRemove_decorators = [Remote("taskRemove")];
			_taskRun_decorators = [Remote("taskRun")];
			_balanceGet_decorators = [Remote("balanceGet")];
			_gitBranches_decorators = [Remote("gitBranches")];
			_gitLog_decorators = [Remote("gitLog")];
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
		/** One balance view (cached). */
		async balanceGet() {
			return this.balance.get();
		}
		/** Local branches; the current branch carries the flag. */
		async gitBranches(request) {
			return this.withGit(request.workspaceId, async (client) => ({ branches: await client.branches() }));
		}
		/** Recent commits across all refs with branch markers. */
		async gitLog(request) {
			return this.withGit(request.workspaceId, async (client) => {
				const maxCount = request.maxCount === void 0 ? this.resolved.gitMaxCount : request.maxCount;
				return { commits: await client.log(maxCount) };
			});
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
				awaitLoader: loader === void 0 ? void 0 : () => loader.await()
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
				return await fn(new GitClient(this.ctx.subprocess, root, this.gitLimits));
			} catch (error) {
				return { error: this.errorOf(error, "git-error") };
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
	ctx.plugin(WebEnhancedGateway, config);
}
//#endregion
export { Config, WebEnhancedGateway, apply, inject, name };
