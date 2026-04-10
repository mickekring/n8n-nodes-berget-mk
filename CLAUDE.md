# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

**A single npm package containing six n8n community nodes for [Berget AI](https://berget.ai)** — a Swedish AI inference provider (EU-hosted, GDPR-friendly, open-source models: Llama, Mistral, Qwen, DeepSeek, GPT-OSS, KB-Whisper, etc.).

Published to npm as **`n8n-nodes-berget-mk`**, maintained by Micke Kring. This is a standalone repo, not tracking any upstream — the codebase originated from the open-source Berget AI n8n nodes (MIT) and has been restructured into a single maintainable package. Treat this as "our repo"; do not propose pulling from or rebasing against any other source.

## Repository layout

```text
/
├── package.json              # The published package: n8n-nodes-berget-mk
├── tsconfig.json             # TypeScript config (node16 module resolution)
├── credentials/
│   └── BergetAiApi.credentials.ts   # Shared Bearer-token credentials
├── nodes/
│   ├── BergetAiAgent/
│   │   ├── BergetAiAgent.node.ts    # Agentic node w/ tool-calling loop
│   │   └── bergetai.svg
│   ├── BergetAiChat/                # Chat completions
│   ├── BergetAiEmbeddings/          # Text embeddings
│   ├── BergetAiOcr/                 # Document OCR (sync + async)
│   ├── BergetAiRerank/              # Document reranking
│   └── BergetAiSpeech/               # Speech-to-text (KB-Whisper)
├── scripts/
│   └── copy-assets.js        # Post-tsc step that copies SVGs into dist/
├── dist/                     # Build output, gitignored
├── README.md                 # User-facing install + usage docs
└── CLAUDE.md                 # This file
```

One package, one `tsc` run, one `dist/`, one `npm publish`. No workspaces, no sub-packages, no meta-package indirection.

## Architecture and key patterns

**All 6 nodes share the same shape**:

- Implement `INodeType` from `n8n-workflow` (API version 1).
- Single operation per node, description `version: 1`.
- Call the Berget AI API via **`axios` directly**, not via `this.helpers.httpRequest`. Auth header is built manually: `Authorization: Bearer ${credentials.apiKey}`.
- Base URL: `https://api.berget.ai/v1`.
- **Dynamic model loading** via `methods.loadOptions.getModels` that fetches `/v1/models` live and filters by `model_type` (`text`, `embedding`, `rerank`, `speech-to-text`, `ocr`). The agent node additionally filters by `capabilities.function_calling === true`. OCR node does NOT load models dynamically.

**Credentials** ([credentials/BergetAiApi.credentials.ts](credentials/BergetAiApi.credentials.ts)):

- Name: `bergetAiApi`
- Single `apiKey` string field, password-masked.
- `authenticate`: generic Bearer header injector.
- `test`: `GET /v1/models`.

**Internal node type names** (what n8n uses to identify nodes in workflow JSON — **do not change these without a major version bump**, they determine whether existing workflows keep working):

- `bergetAiAgent`, `bergetAiChat`, `bergetAiEmbeddings`, `bergetAiOcr`, `bergetAiRerank`, `bergetAiSpeech`

**Agent node** ([nodes/BergetAiAgent/BergetAiAgent.node.ts](nodes/BergetAiAgent/BergetAiAgent.node.ts)) is the most complex:

- Takes a system prompt, user message, a fixedCollection of tools (name/description/JSON-Schema parameters), and `max_iterations`.
- Parses each tool's JSON-Schema string, wraps in OpenAI-compatible `{type:'function', function:{...}}`.
- Runs a while-loop: POST `/chat/completions` → append assistant turn → if `tool_calls` present, **intentionally throws** an error instructing the user to implement tool execution in the workflow itself. The node detects tool calls but does not execute them — this is by design.
- Returns `{response, tool_calls, iterations, messages, model}`.

**Speech node** is the only one using `form-data` for multipart uploads to `/v1/audio/transcriptions`. Default language is `sv` (Swedish).

**OCR node** is the only one handling async responses (HTTP 202 → `taskId`) in addition to sync (HTTP 200 → extracted content). It accepts either a URL or a base64 data URL.

**Chat node** wraps `response_format: 'json_object'` into `{type: 'json_object'}` before sending — the (Swedish) comment `// Hantera response_format` marks this block.

## Build and test commands

```bash
npm install              # install all deps (single package, no workspaces)
npm run build            # rm -rf dist && tsc && node scripts/copy-assets.js
npm run dev              # tsc --watch
npm run clean            # rm -rf dist node_modules
npm pack                 # build a .tgz for local install testing
npm publish              # publish to npm (requires npm login + 2FA)
```

**The build script has three steps**:

1. `rm -rf dist` — start clean.
2. `tsc` — compile TypeScript. With `moduleResolution: "node16"`, this exits cleanly even with zod 3.25.x in the tree (the old `moduleResolution: "node10"` combined with TypeScript 4.9.5 broke on zod's newer type syntax — that was one of the original build problems that got fixed during the restructure).
3. `node scripts/copy-assets.js` — copy each node's `bergetai.svg` into `dist/nodes/<NodeName>/`, because tsc doesn't copy non-code assets. The `icon: 'file:bergetai.svg'` in each node description resolves relative to the compiled `.js`, so the SVG must sit next to it in `dist/`.

**Publishing checklist** (before running `npm publish`):

1. Ensure `npm whoami` returns `mickekring`.
2. Bump `version` in `package.json` (semver: patch for fixes, minor for new nodes/features, major for breaking changes to node type names or input schemas).
3. `npm run build` — confirm clean exit, all 6 SVGs copied.
4. `npm pack --dry-run` — sanity check the tarball contents.
5. `npm publish` — will prompt for 2FA.
6. Tag the release in git: `git tag v0.x.y && git push --tags`.

## Conventions and quirks

- **TypeScript**: `target: ES2019`, `module: "node16"`, `moduleResolution: "node16"`, `strict: true`. Compiled output lives in `dist/` (gitignored).
- **Node >= 18** required.
- **peerDependencies**: `n8n-workflow: "*"` — wildcard, matches the official n8n-nodes-starter. The `n8n-workflow` package is installed alongside n8n itself; community nodes must not bundle their own copy.
- **Direct `axios` use, not `this.helpers.httpRequest`**. This is how the code was originally written. It works but misses n8n's built-in retry/proxy/logging behavior. Migrating is future work, not blocking anything today.
- **`any` is common** in API response handling. Tighten opportunistically if you're already editing a file; don't do big sweeping type refactors unprompted.
- **Swedish context leaks**: occasional Swedish comments, default speech language `sv`. The codebase is otherwise English.
- **One Swedish comment** in the chat node (`// Hantera response_format`) — pre-existing, not worth changing.

## Working in this repo

- **Default language**: respond to the user in whatever language they use. Micke writes in Swedish and English interchangeably. Code, comments, and docs stay in English unless explicitly asked otherwise.
- **When adding a model type or changing model filters**: 5 of the 6 nodes (everything except OCR) have their own `getModels` loadOptions method. A change to the model filter logic likely needs to touch all 5 similarly. There's no shared utility — just duplicated per-node code for now.
- **When editing the agent node**: the "detect tool calls but throw" behavior is intentional, not a bug. Don't "fix" it without asking.
- **When changing the credentials shape**: there's only one copy at [credentials/BergetAiApi.credentials.ts](credentials/BergetAiApi.credentials.ts).
- **Before publishing**: always `npm run build` and `npm pack --dry-run` to verify the tarball contains all 6 `.node.js` files + 6 SVGs + the credentials.
- **Don't edit `dist/`** — it's generated and gitignored.
- **Don't reintroduce workspaces** — the whole point of this layout is a single package.
- **Don't suggest pulling from or rebasing against any external upstream.** This repo is standalone; Micke maintains it independently. If a change is needed, make it here.

## n8n 2.x compatibility status

Verified against n8n 2.0 breaking changes (April 2026):

- `n8nNodesApiVersion: 1` — **still correct**, don't bump to 2. The official [n8n-nodes-starter](https://github.com/n8n-io/n8n-nodes-starter) still ships with `n8nNodesApiVersion: 1`.
- None of these nodes import `NodeConnectionType` (renamed to `NodeConnectionTypes` in 2.x), so no code changes needed there.
- None of these nodes use in-memory binary data (OCR takes URL/base64, speech uses form-data multipart) — so the 2.x binary-data changes don't affect them.
- `peerDependencies: { "n8n-workflow": "*" }` means the package resolves against whatever n8n-workflow version the host n8n provides, including 2.x.
- From **May 1, 2026**, community nodes submitted for *verification* must be published via GitHub Actions with an npm provenance attestation. This package isn't aiming for verification at the moment — it's a self-maintained install path. If that changes, add a publish workflow.
