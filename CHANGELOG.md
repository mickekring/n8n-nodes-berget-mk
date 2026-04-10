# Changelog

All notable changes to `n8n-nodes-berget-mk` are documented here. Format loosely follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses [Semantic Versioning](https://semver.org).

## [0.4.2] - 2026-04-10

### Fixed

- **API error messages now include the HTTP status code, error code, and structured details instead of a bare opaque string.** The previous error formatter assumed a single shape (`data.error.message`) which didn't match the `ApiError` schema documented in Berget's OpenAPI spec (`{ error: "string", code: "string", details: ... }`). When Berget returned an error, the formatter silently fell through to a generic fallback, making it impossible to diagnose issues like OCR failures. The new `formatBergetError()` helper in `nodes/BergetAi/shared.ts` handles multiple response shapes defensively (OpenAPI-documented, OpenAI-compatible, plain message, bare string) and always includes the HTTP status code. Applied to chat, OCR, rerank, and speech resources.

### Why

A user reported OCR failing with the opaque error `"Berget AI OCR error: Failed to process document"` across multiple document URLs. Without the HTTP status code or any structured error details, there was no way to tell whether the failure was a 400 (bad request), 408 (timeout), 500 (server error), or something else. The new error format will make the root cause visible on the next retry.

## [0.4.1] - 2026-04-10

### Fixed

- **Speech to Text now accepts n8n binary data properly.** The previous implementation had an `Audio File` text field that passed its string value straight into a multipart form upload — which never worked for real workflows where audio arrives as binary data on the incoming item (Form Trigger upload, HTTP Request with file response, Read Binary File, etc.). Replaced the string field with an `Input Data Field Name` field matching n8n's standard binary-data pattern (same as the built-in OpenAI node's Audio → Transcribe). The execute function now uses `context.helpers.assertBinaryData()` and `context.helpers.getBinaryDataBuffer()` to pull the audio buffer off the item by binary property name, then streams it into the multipart upload with the correct filename and mime type preserved from n8n's binary metadata.
- **Large audio uploads no longer risk truncation.** Added `maxContentLength: Infinity` and `maxBodyLength: Infinity` to the axios request for the transcription endpoint, so the default 10 MB axios body limit can't silently cap long recordings.

### Migration

If you had a workflow on `0.4.0` using the Speech to Text resource — you probably didn't, because it was broken for any real audio input. The new field `Input Data Field Name` defaults to `"data"`, which is what most n8n binary-producing nodes use. If you use a Form Trigger with a field named `"Audio"`, set this to `"Audio"` instead.

## [0.4.0] - 2026-04-10

### Added

- **`Berget AI Embeddings Model` sub-node.** New LangChain sub-node that supplies an `OpenAIEmbeddings` instance pointed at Berget AI's `/v1/embeddings` endpoint. Plugs into n8n's built-in Vector Store nodes (Supabase, Qdrant, Pinecone, PGVector, etc.), Question and Answer Chain, Vector Store Retriever, and any other parent node that accepts an `AiEmbedding` connection. Loads the model dropdown live from the Berget API, filtering for `model_type === 'embedding'`. Includes standard options: batch size, strip new lines, timeout.

### Changed (breaking)

- **`Embeddings` resource removed from the `Berget AI` action node.** Embeddings are now handled by the new `Berget AI Embeddings Model` sub-node that plugs into Vector Store nodes — the proper architectural home for embedding providers in n8n's AI ecosystem. If you had a `0.3.0` workflow using the action node's `Embeddings` resource, the node will now report "Unknown resource: embeddings"; replace it with the new sub-node wired into a Vector Store or QA Chain.
- **`Berget AI` action node placement and rendering fix.** Added `usableAsTool: true` and updated `codex.subcategories` from `['Miscellaneous']` to `['Agents', 'Miscellaneous', 'Root Nodes']` — matching how the built-in OpenAI, Anthropic, Google Gemini, and Ollama vendor nodes declare themselves. This should move the node from "Other AI Nodes → Miscellaneous" up into the top-level "AI Nodes" panel alongside the other vendor cards, and switch its canvas rendering from the small-square style to the larger vendor-card style. Placement behaviour in n8n's palette is not perfectly documented and may need iteration if the result isn't quite right.
- The `Berget AI` action node can now be used as a tool by n8n's built-in AI Agent (via `usableAsTool: true`), so you can expose any of its resources (Chat, OCR, Rerank, Speech to Text) as agent-callable tools.

### Architecture notes

After this release there are three published nodes:

1. **`Berget AI`** — multi-resource action node with four resources: Chat, OCR, Rerank, Speech to Text. Use for one-shot calls (classification, transcription, document extraction, reranking pipelines).
2. **`Berget AI Chat Model`** — sub-node that plugs into n8n's built-in AI Agent / Basic LLM Chain / other LangChain root nodes via `AiLanguageModel`. Use when you want the n8n Agent to drive Berget as the underlying LLM.
3. **`Berget AI Embeddings Model`** — sub-node that plugs into Vector Store / QA Chain nodes via `AiEmbedding`. Use when building retrieval pipelines backed by Berget embeddings.

A future release may add a `Berget AI Reranker` sub-node that plugs into Vector Store nodes via the `AiReranker` connection type, replacing the current action-node Rerank resource. That's deferred because LangChain JS has no off-the-shelf generic reranker class — it would require writing a small custom `BaseDocumentCompressor` subclass that calls Berget's `/v1/rerank` endpoint directly.

### Migration

If you had a `0.3.0` workflow using the `Embeddings` resource of the action node:

1. After upgrade, the node will error with "Unknown resource: embeddings" at execution time.
2. Delete that node (or change its Resource dropdown to one of the remaining options).
3. For the embeddings work, add a Vector Store or QA Chain node, and wire a new `Berget AI Embeddings Model` sub-node into its Embedding socket.

Workflows using `Berget AI Chat Model` or the other action-node resources (Chat, OCR, Rerank, Speech to Text) need no changes.

## [0.3.0] - 2026-04-10

### Changed (breaking)

- **The five individual action nodes (`Berget AI Chat`, `Berget AI Embeddings`, `Berget AI OCR`, `Berget AI Rerank`, `Berget AI Speech`) are replaced by a single multi-resource `Berget AI` action node.** The new node has a `Resource` selector at the top (Chat / Embeddings / OCR / Rerank / Speech to Text) and exposes the same parameters per resource as the old individual nodes did, just all under one node. This matches the pattern n8n's built-in vendor nodes use (OpenAI, Anthropic, Google Gemini, Ollama) and gives the package a single card in the AI Nodes palette instead of five separate entries.
- **Internal node type names change.** The old `bergetAiChat`, `bergetAiEmbeddings`, `bergetAiOcr`, `bergetAiRerank`, `bergetAiSpeech` node type identifiers are removed. Workflows built on `0.2.x` using any of those five nodes will show them as missing after upgrading to `0.3.0` and will need to be rebuilt using the new `Berget AI` node with the appropriate resource selected. The `Berget AI Chat Model` sub-node (used with n8n's built-in AI Agent) is **unchanged** — its internal name `bergetAiChatModel` is preserved, so any workflow using the Chat Model sub-node continues to work.

### Added

- **`Berget AI` multi-resource action node** with five resources:
  - **Chat** — one-shot chat completions
  - **Embeddings** — generate text embeddings
  - **OCR** — extract text from PDF/DOCX/PPTX/HTML/images
  - **Rerank** — rerank documents by relevance to a query
  - **Speech to Text** — transcribe audio (defaults to Swedish, KB-Whisper)
- Consolidated model loading: a single shared helper fetches `/v1/models` once per call and filters by `model_type` for the selected resource, replacing five nearly-identical copies of the same code across the old nodes.
- Consolidated API client helper in `nodes/BergetAi/shared.ts` to reduce duplication across resource modules.

### Migration

If you had a workflow on `0.2.x`:

1. After upgrading to `0.3.0`, any `Berget AI Chat`, `Berget AI Embeddings`, `Berget AI OCR`, `Berget AI Rerank`, or `Berget AI Speech` nodes in the workflow will appear as missing.
2. Delete each missing node and add the new `Berget AI` node in its place.
3. Select the matching `Resource` value (e.g. "Chat" to replace the old `Berget AI Chat` node).
4. Re-enter the model, messages / input / query / etc. as you had them before.
5. Workflows using the `Berget AI Chat Model` sub-node (plugged into n8n's built-in AI Agent) need no changes.

## [0.2.1] - 2026-04-10

### Fixed

- **Streaming now works in the AI Agent.** Added `streaming: true` to the `ChatOpenAI` constructor in the `Berget AI Chat Model` sub-node. Without it, LangChain would run the model in non-streaming mode regardless of what the parent Agent requested, so token-by-token output never appeared in the n8n UI.
- **Model dropdown is no longer cluttered.** The model list in the Chat Model sub-node now shows just the model ID per option, dropping the redundant secondary description. Matches how n8n's built-in OpenAI Chat Model formats its list.

### Changed

- **Node description shortened** for the Chat Model sub-node so the palette and details panel don't wrap awkwardly.
- **Reasoning Effort option description** now explicitly notes that while the `reasoning_effort` parameter is sent to the model (and does influence answer quality), the `@langchain/openai` JavaScript package does not currently extract reasoning tokens from the response, so the chain-of-thought is not visible in the Agent's output. This is a known gap in the LangChain JS ecosystem tracked upstream; it may be addressed in a future release.

### Known limitations

- **Reasoning content is not surfaced to the Agent.** When using a reasoning-capable model like GPT-OSS-120B or DeepSeek R1 with `reasoning_effort: high`, the model reasons internally and you get a higher-quality final answer, but the chain-of-thought tokens themselves are dropped before the Agent receives them. Root cause: `@langchain/openai@1.4.x` does not parse non-standard fields like `reasoning_content`, `reasoning`, or `reasoning_details` out of the chat completions response. Fixing this properly requires either upstream support in `@langchain/openai` or writing a custom LangChain `ChatModel` class in this package — both are tracked but not in the `0.2.1` scope.
- **"Add to workflow" extra step for community nodes.** When adding the `Berget AI Chat Model` sub-node to an AI Agent's Chat Model socket, n8n shows a confirmation panel with an "Add to workflow" button — unlike built-in models which drop directly into place. This is n8n's client-side UX for community nodes (note the package icon next to community entries in the palette) and cannot be changed from the node side. The only way to remove it is for the package to become a verified n8n community node.
- **Streaming reproducibility: inconclusive in testing.** After shipping `streaming: true` in the `ChatOpenAI` constructor, streaming still did not produce token-by-token output on the test self-hosted n8n instance — but the same instance also failed to stream with the built-in OpenAI Chat Model, suggesting an n8n server-side configuration issue on that deployment rather than a bug in this package. The node is believed correct; leaving the issue open as "unverified on a known-good streaming-capable n8n instance".

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
