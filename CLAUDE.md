# CLAUDE.md

Guidance for Claude Code when working in this repository.

## What this is

**A single npm package that ships two n8n community nodes for [Berget AI](https://berget.ai)** — a Swedish AI inference provider (EU-hosted, GDPR-friendly, open-source models: Llama, Mistral, Qwen, DeepSeek, GPT-OSS, KB-Whisper, etc.).

Published to npm as **`n8n-nodes-berget-mk`**, maintained by Micke Kring. This is a standalone repo, not tracking any upstream — the codebase originated from the open-source Berget AI n8n nodes (MIT) and has been restructured repeatedly through the `0.1.x` → `0.2.x` → `0.3.x` series. Treat this as "our repo"; do not propose pulling from or rebasing against any other source.

## The two shipped nodes

1. **`Berget AI`** (`bergetAi`) — a **multi-resource action node** with a `Resource` dropdown that switches between five capabilities:
    - **Chat** — one-shot chat completions
    - **Embeddings** — generate text embeddings
    - **OCR** — extract text from PDF/DOCX/PPTX/HTML/images (sync + async)
    - **Rerank** — rerank documents by relevance
    - **Speech to Text** — audio transcription (defaults to Swedish, KB-Whisper)

    One node, one card in the AI Nodes palette — matches how n8n's built-in vendor nodes (OpenAI, Anthropic, Ollama, Google Gemini) present themselves.

2. **`Berget AI Chat Model`** (`bergetAiChatModel`) — a **sub-node** that supplies a LangChain `ChatOpenAI` instance to n8n's built-in **AI Agent**, **Basic LLM Chain**, and other LangChain-based parent nodes via the `AiLanguageModel` connection type. Points `ChatOpenAI` at Berget's OpenAI-compatible `/v1` endpoint. Exposes `reasoning_effort` and the standard LLM parameter set.

## Repository layout

```text
/
├── package.json              # The published package: n8n-nodes-berget-mk
├── tsconfig.json             # TypeScript config (node16 module resolution)
├── credentials/
│   └── BergetAiApi.credentials.ts   # Shared Bearer-token credentials
├── nodes/
│   ├── BergetAi/                    # The multi-resource action node
│   │   ├── BergetAi.node.ts         # Main class: description + dispatch
│   │   ├── shared.ts                # Shared axios helpers + model loader
│   │   ├── chat.ts                  # Chat resource: properties + execute
│   │   ├── embeddings.ts            # Embeddings resource
│   │   ├── ocr.ts                   # OCR resource
│   │   ├── rerank.ts                # Rerank resource
│   │   ├── speech.ts                # Speech-to-text resource
│   │   └── bergetai.svg
│   └── BergetAiChatModel/           # The LangChain sub-node
│       ├── BergetAiChatModel.node.ts
│       └── bergetai.svg
├── scripts/
│   └── copy-assets.js        # Post-tsc step that copies SVGs into dist/
├── dist/                     # Build output, gitignored
├── README.md                 # Minimal user-facing install + usage docs
├── CHANGELOG.md              # Keep-a-Changelog style release notes
└── CLAUDE.md                 # This file
```

One package, one `tsc` run, one `dist/`, one `npm publish`. No workspaces, no sub-packages.

## Architecture of the multi-resource node

`BergetAi.node.ts` is the main class. It:

1. Declares the node description with a `resource` dropdown and imports each resource module's property array.
2. Declares `methods.loadOptions` with per-resource model loaders (`getChatModels`, `getEmbeddingsModels`, `getRerankModels`, `getSpeechModels`) — each one calls the shared `loadModelOptions()` helper with a different `model_type` filter.
3. Implements `execute()` which switch-dispatches to the resource module's `executeX()` function based on the `resource` parameter.

Each resource module (`chat.ts`, `embeddings.ts`, `ocr.ts`, `rerank.ts`, `speech.ts`) exports:

- A `*Properties: INodeProperties[]` array with `displayOptions.show.resource: ['<name>']` on every field so they only appear when that resource is selected.
- An `execute*()` async function with signature `(context: IExecuteFunctions, itemIndex: number) => Promise<IDataObject>` — takes the context explicitly rather than via `this` binding, which lets it live in a separate file.

**Property name convention**: every resource-specific field is prefixed with the resource name (`chatModel`, `embeddingsModel`, `rerankModel`, `speechModel`, `ocrDocumentType`, etc.) to avoid collisions when they all live in the same properties array. Only the top-level `resource` dropdown uses a bare name.

**Internal node type names** (what n8n uses to identify nodes in workflow JSON — **do not change these without a major version bump**):

- `bergetAi` — the multi-resource action node
- `bergetAiChatModel` — the LangChain sub-node
- The credential type is `bergetAiApi`

## Architecture of the sub-node

`BergetAiChatModel.node.ts` implements a LangChain sub-node pattern:

- `inputs: []`
- `outputs: [NodeConnectionTypes.AiLanguageModel]`
- `outputNames: ['Model']`
- Implements `supplyData(this: ISupplyDataFunctions, itemIndex: number)` which returns `{ response: new ChatOpenAI({...}) }` — a pre-configured LangChain chat model instance, not an execution result.

The `ChatOpenAI` instance is configured with:

- `apiKey` from Berget credentials
- `configuration.baseURL: 'https://api.berget.ai/v1'` — overrides OpenAI's default so requests hit Berget
- `streaming: true` — needed for token-by-token output in the Agent
- Standard params (`temperature`, `topP`, `maxTokens`, `frequencyPenalty`, `presencePenalty`, `timeout`)
- `modelKwargs.reasoning_effort` for reasoning-capable models (sent to the API as a raw kwarg)

**LangChain dependency strategy**: `@langchain/openai` and `@langchain/core` are declared as **peer dependencies** (wildcard) — not bundled. This is critical: if we bundled our own copy, our `ChatOpenAI` instances would be a different JavaScript class than n8n's built-in ones, and `instanceof` checks inside the Agent would fail. n8n ships its own LangChain, and we deliberately use that same instance.

## Build and test commands

```bash
npm install              # install all deps (single package, no workspaces)
npm run build            # rm -rf dist && tsc && node scripts/copy-assets.js
npm run dev              # tsc --watch
npm run clean            # rm -rf dist node_modules
npm pack                 # build a .tgz for local install testing
npm publish              # publish to npm (requires npm login + 2FA)
```

The build script has three steps:

1. `rm -rf dist` — start clean.
2. `tsc` — compile TypeScript. Uses `moduleResolution: "node16"` + `module: "node16"` + `ignoreDeprecations: "6.0"` to stay clean even when zod 3.25.x is hoisted transitively.
3. `node scripts/copy-assets.js` — copy each node's `bergetai.svg` into `dist/nodes/<NodeName>/` next to the compiled `.js`. tsc doesn't copy non-code assets on its own, and n8n's `icon: 'file:bergetai.svg'` reference resolves relative to the compiled node file.

**Publishing checklist** before running `npm publish`:

1. `npm whoami` → `mickekring`.
2. Bump `version` in `package.json` (semver: patch for fixes, minor for new resources/parameters, major for renaming the node type, deleting a resource, or breaking the sub-node's LangChain interface).
3. `npm run build` — confirm clean exit, SVGs copied for both nodes.
4. `npm pack --dry-run` — sanity-check tarball contents. Should contain `dist/nodes/BergetAi/` (including all resource modules) and `dist/nodes/BergetAiChatModel/`.
5. Update `CHANGELOG.md` with the release notes.
6. Commit + push.
7. `npm publish` — prompts for 2FA.
8. Tag the release in git: `git tag v0.x.y && git push --tags`.

## Conventions and quirks

- **TypeScript**: `target: ES2019`, `module: "node16"`, `moduleResolution: "node16"`, `strict: true`. Compiled output lives in `dist/` (gitignored).
- **Node >= 18** required.
- **peerDependencies**: `n8n-workflow: "*"`, `@langchain/openai: "*"`, `@langchain/core: "*"`. Wildcards match how the official n8n-nodes-starter does it.
- **devDependencies**: pin specific recent versions (`n8n-workflow@^2.16.0`, `@langchain/openai@^1.4.3`, `@langchain/core@^1.1.39`, `typescript@^5.3.0`) so builds are reproducible.
- **Axios directly**, not `this.helpers.httpRequest`. This is how the code was originally written and has carried through. It works but misses n8n's built-in retry/proxy/logging. Migrating is future work.
- **Swedish context leaks**: default speech language `sv`, occasional Swedish comments carried over from earlier versions. Otherwise English.
- **Markdownlint config** at `.markdownlint.json` disables MD013 (line-length) and sets `MD024 siblings_only: true` so Keep-a-Changelog style `### Added` / `### Changed` under different version headers don't warn.

## Working in this repo

- **Default language**: respond to the user in whatever language they use. Micke writes in Swedish and English interchangeably. Code, comments, and docs stay in English unless explicitly asked otherwise.
- **When adding a new resource to `BergetAi`**: create a new file under `nodes/BergetAi/`, follow the `chat.ts` pattern (export a `*Properties` array and an `execute*` function), wire it into `BergetAi.node.ts` (import, add to properties array, add a switch case in `execute()`, add a loadOptions method if the resource needs dynamic model loading). Update the `Resource` dropdown options too.
- **When editing a resource's properties**: remember every field must have `displayOptions.show.resource: ['<resource-name>']` or it will show for every resource.
- **When bumping the n8n-workflow dev dep**: peer dep stays wildcard. Only the devDep version controls what types we compile against.
- **When changing the Chat Model sub-node**: remember it supplies a LangChain object, not an execution result. Any change must preserve the `supplyData` contract and return a `ChatOpenAI` (or compatible) instance pointed at Berget's API.
- **Before publishing**: always `npm run build` and `npm pack --dry-run` to verify the tarball contains `dist/nodes/BergetAi/BergetAi.node.js` + the 5 resource modules + both SVGs + `dist/nodes/BergetAiChatModel/BergetAiChatModel.node.js`.
- **Don't edit `dist/`** — it's generated and gitignored.
- **Don't reintroduce workspaces** — the whole point of this layout is a single package.
- **Don't suggest pulling from or rebasing against any external upstream.** This repo is standalone; Micke maintains it independently. If a change is needed, make it here.

## Known limitations

- **Reasoning content is not surfaced.** `@langchain/openai@1.4.x` does not extract non-standard response fields like `reasoning_content` / `reasoning` / `reasoning_details`. The `reasoning_effort` parameter IS sent to the model (so answer quality improves), but the chain-of-thought tokens are dropped before reaching the Agent. Fixing this requires either upstream LangChain support or writing a custom `ChatModel` class in this package.
- **"Add to workflow" extra step for community sub-nodes.** When adding the `Berget AI Chat Model` sub-node to an AI Agent's Chat Model socket, n8n shows a confirmation panel rather than dropping the node directly. This is n8n's client-side UX for community nodes (note the package icon in the palette) and cannot be changed from the node side. Only fixable by the package becoming a verified n8n community node.
- **Streaming**: the Chat Model sub-node sets `streaming: true` on its `ChatOpenAI` instance. A test run on one self-hosted n8n instance failed to show streaming output, but the same instance also failed to stream with n8n's built-in OpenAI Chat Model — pointing at an n8n server-side configuration issue on that deployment rather than a bug in this package. Not confirmed on a known-good streaming n8n instance yet.
