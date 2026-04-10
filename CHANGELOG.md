# Changelog

All notable changes to `n8n-nodes-berget-mk` are documented here. Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org).

## [0.2.0] - 2026-04-10

### Added

- **`Berget AI Chat Model` sub-node.** A new sub-node that plugs directly into n8n's built-in **AI Agent**, **Basic LLM Chain**, and other LangChain-based nodes via the `AiLanguageModel` connection type. Built on top of LangChain's `ChatOpenAI` class pointed at Berget AI's OpenAI-compatible `/v1` endpoint. Exposes the full standard LLM parameter set: model (dynamic list), temperature, top p, max tokens, frequency/presence penalties, response format (text/JSON), timeout, and **reasoning effort** (low/medium/high) for reasoning-capable models like GPT-OSS and DeepSeek R1. Because the sub-node only provides the LLM instance, users automatically get all of n8n's framework-level features — memory, tool calling, iteration control, chat history — from the parent Agent node without us reimplementing any of it.

### Removed

- **`Berget AI Agent` node deleted.** The home-built agent loop is replaced by n8n's built-in **AI Agent** node combined with the new `Berget AI Chat Model` sub-node. The home-built node never exposed modern LLM parameters (like `reasoning_effort`) and did not integrate with n8n's Memory/Tool sub-node architecture. Workflows that used the old `Berget AI Agent` will see it as a missing node after upgrading; rebuild them using the n8n **AI Agent** node with **Berget AI Chat Model** wired into its Chat Model socket.

### Changed

- **`n8n-workflow` devDependency bumped** from `^1.17.0` to `^2.16.0` to compile against the modern n8n 2.x type surface (specifically `ISupplyDataFunctions`, `SupplyData`, and `NodeConnectionTypes.AiLanguageModel`). The runtime peer dependency is still `*`, so the package works against any installed n8n version that exposes those types.

### Dependencies

- Added `@langchain/openai` and `@langchain/core` as **peer dependencies** (wildcard). These are bundled with any n8n installation that supports LangChain-based nodes, so no extra disk space is required on the host. Adding them as peer deps (rather than regular deps) is critical — if we bundled our own copy, our `ChatOpenAI` instance would be a different JavaScript class than n8n's, and `instanceof` checks inside n8n's Agent code would fail.

### Migration notes

If you upgrade from `0.1.x` and had a workflow using the old `Berget AI Agent` node:

1. The old node will appear as a missing node after upgrade.
2. Delete it and add n8n's built-in **AI Agent** node instead.
3. Add a **Berget AI Chat Model** sub-node below the Agent and connect it to the **Chat Model** socket.
4. Wire up any tools or memory you need — they now come from n8n's standard sub-node sockets, not from parameters on the Berget node.

## [0.1.1] - 2026-04-10

### Fixed

- **Node icons are now visible in the n8n palette.** The inherited SVG used an `invertFilter` that turned the black logo path white, making it invisible on n8n's light background. Rewrote the SVG as a clean single-path file with a solid emerald (`#10b981`) fill that renders correctly on both light and dark n8n themes.

### Changed

- README marked as **experimental** and explicitly labelled as actively developed, with the expectation of breaking changes before `1.0.0`.

## [0.1.0] - 2026-04-10

### Added

- Initial release of `n8n-nodes-berget-mk` as a single installable npm package.
- Six nodes included: **Chat**, **Agent** (with tool calling, removed in 0.2.0), **Embeddings**, **OCR**, **Speech-to-Text**, **Rerank**.
- Shared `Berget AI API` credential using a Bearer API key.
- Dynamic model loading from `https://api.berget.ai/v1/models` for five of the six nodes (OCR uses a fixed model set).

### Origin notes

The initial `0.1.0` codebase was restructured from an earlier seven-package monorepo layout into a single npm package. The monorepo's rerank sub-package was missing a `files: ["dist"]` entry in its `package.json`, which caused it to publish without its compiled output and break installation of the meta-package on any n8n instance. Collapsing to a single package removes that class of failure entirely.
