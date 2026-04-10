# n8n-nodes-berget-mk

n8n community nodes for [Berget AI](https://berget.ai), packaged as a single installable module. Maintained by Micke Kring.

Three nodes:

- **Berget AI** — multi-resource action node for one-shot calls: **Chat** (completions, classification), **Rerank** (document reranking), and **Speech to Text** (Swedish-tuned KB-Whisper). Can also be exposed as a tool to an AI Agent. (OCR is temporarily hidden — see [CHANGELOG.md](CHANGELOG.md) for `0.4.4` for details.)
- **Berget AI Chat Model** — sub-node that plugs into n8n's built-in **AI Agent**, **Basic LLM Chain**, and other LangChain-based nodes. Exposes `reasoning_effort` and the full standard LLM parameter set.
- **Berget AI Embeddings Model** — sub-node that plugs into n8n's **Vector Store** nodes (Supabase, Qdrant, Pinecone, PGVector, etc.) and **Question and Answer Chain**.

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

### Agent with tools and memory

1. Add n8n's built-in **AI Agent**.
2. Add **Berget AI Chat Model** and connect it to the Agent's Chat Model socket.
3. Add Memory and Tool sub-nodes as needed — they work with Berget as the underlying LLM.

### RAG / vector search

1. Add a Vector Store node (Supabase, Qdrant, etc.) or a Question and Answer Chain.
2. Add **Berget AI Embeddings Model** and connect it to the Embedding socket.
3. Index documents or query as usual.

### Swedish speech transcription

1. Drop **Berget AI** onto the canvas, pick Resource = **Speech to Text**, pick a model (defaults to `KB-Whisper-Large`), and point at an audio file.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for what's changed between releases.

## License

MIT. Originally based on the open-source Berget AI n8n nodes.
