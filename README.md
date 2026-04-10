# n8n-nodes-berget-mk

n8n community nodes for [Berget AI](https://berget.ai), packaged as a single installable module. Maintained by Micke Kring.

Includes:

- **Berget AI Chat** — one-shot chat completions (action node)
- **Berget AI Chat Model** — sub-node that plugs into n8n's built-in **AI Agent**, **Basic LLM Chain**, and other LangChain-based nodes. Exposes `reasoning_effort` and the full standard LLM parameter set.
- **Berget AI Embeddings** — create text embeddings
- **Berget AI OCR** — document text extraction (PDF, DOCX, images)
- **Berget AI Speech-to-Text** — audio transcription (KB-Whisper for Swedish)
- **Berget AI Rerank** — document reranking

> ⚠️ **Experimental — actively developed.** This package is pre-1.0 and the shape of individual nodes may change between minor releases. Pin a specific version in production workflows until `1.0.0`.
>
> **Breaking change in `0.2.0`:** the home-built `Berget AI Agent` node was removed and replaced with a `Berget AI Chat Model` sub-node that plugs into n8n's built-in **AI Agent**. See [CHANGELOG.md](CHANGELOG.md) for migration notes.

## Install

In n8n: **Settings → Community Nodes → Install** and enter:

```text
n8n-nodes-berget-mk
```

Then add a **Berget AI API** credential with your API key from [berget.ai](https://berget.ai).

## Using Berget with n8n's AI Agent

1. Add n8n's built-in **AI Agent** node to your workflow.
2. Add a **Berget AI Chat Model** node and drag it onto the canvas below the Agent.
3. Connect it to the Agent's **Chat Model** socket.
4. Select a Berget AI chat model (the list loads live from the API).
5. Optionally add Memory and Tool sub-nodes — they work as normal with Berget as the underlying LLM.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for what's changed between releases.

## License

MIT. Originally based on the open-source Berget AI n8n nodes.
