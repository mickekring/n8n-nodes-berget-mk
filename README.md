# n8n-nodes-berget-mk

n8n community nodes for [Berget AI](https://berget.ai), packaged as a single installable module. Maintained by Micke Kring.

Four nodes:

- **Berget AI** — multi-resource action node for one-shot calls. Resources: **Chat** (completions, classification, JSON Schema structured output), **Image Analysis** (vision-capable models), **Rerank** (document reranking), and **Speech to Text** (Swedish-tuned KB-Whisper, with optional diarization and word-level alignment). Can also be exposed as a tool to an AI Agent. (OCR is temporarily hidden — see [CHANGELOG.md](CHANGELOG.md) for `0.4.4` for details.)
- **Berget AI Chat Model** — sub-node that plugs into n8n's built-in **AI Agent**, **Basic LLM Chain**, and other LangChain-based nodes. Exposes `reasoning_effort` and the full standard LLM parameter set.
- **Berget AI Embeddings Model** — sub-node that plugs into n8n's **Vector Store** nodes (Supabase, Qdrant, Pinecone, PGVector, etc.) and **Question and Answer Chain**.
- **Berget AI Reranker** — sub-node that plugs into Vector Store retrievers via the `AiReranker` connection, reordering candidates by relevance before they reach the agent or chain.

> ⚠️ **Experimental — actively developed.** This package is pre-1.0 and may break between minor releases. Pin a specific version in production workflows until `1.0.0`. See [CHANGELOG.md](CHANGELOG.md) for breaking changes.

## Install

In n8n: **Settings → Community Nodes → Install** and enter:

```text
n8n-nodes-berget-mk
```

Then add a **Berget AI API** credential with your API key from [berget.ai](https://berget.ai).

## Typical workflows

### One-shot chat / classification

1. Drop **Berget AI** onto the canvas, pick Resource = **Chat**, select a model, add a user message. Execute.

For classification or structured extraction tasks, set **Options → Response Format = JSON Schema** and provide a schema. The model is forced to return parseable JSON conforming to your shape — no regex scraping of free-form text.

### Agent with tools and memory

1. Add n8n's built-in **AI Agent**.
2. Add **Berget AI Chat Model** and connect it to the Agent's Chat Model socket.
3. Add Memory and Tool sub-nodes as needed — they work with Berget as the underlying LLM.

### RAG with retrieval and reranking

1. Add a Vector Store node (Qdrant, Supabase, etc.) or a Question and Answer Chain.
2. Add **Berget AI Embeddings Model** and connect it to the Embedding socket.
3. Add **Berget AI Reranker** and connect it to the EmbeddingReranker socket — Vector Store will then retrieve a wider candidate set, the reranker reorders them by relevance, and only the best survive into the answer.
4. Index documents or query as usual.

### Image analysis

1. Drop **Berget AI** onto the canvas, pick Resource = **Image Analysis**.
2. Pick a vision-capable model (the dropdown is filtered automatically).
3. Choose Input Type = **Binary File** (default — works with Form Trigger uploads, HTTP Request responses, etc.) or **Image URL**, and provide a **Text Input** prompt like `"Describe what you see"`.
4. Execute.

### Swedish speech transcription with speakers

1. Drop **Berget AI** onto the canvas, pick Resource = **Speech to Text**.
2. Provide the binary input data from a Form Trigger or HTTP Request.
3. Optional: enable **Options → Diarize (Speaker Identification)** — the response will include a `speaker_transcript` field formatted as readable per-speaker paragraphs (`SPEAKER_00:\n...\n\nSPEAKER_01:\n...`), alongside the raw segment-level timestamps and word-level data.
4. Optional: enable **Word-Level Alignment** for per-word timestamps useful in subtitle generation.
5. Optional: add **Hotwords** (comma-separated) for proper nouns and domain vocabulary.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for what's changed between releases.

## License

MIT. Originally based on the open-source Berget AI n8n nodes.
