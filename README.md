# n8n-nodes-berget-mk

n8n community nodes for [Berget AI](https://berget.ai). Fork of the upstream `@bergetai/n8n-nodes-all` maintained by Micke Kring, packaged as a single installable module.

Includes six nodes: **Chat**, **Agent** (with tool calling), **Embeddings**, **OCR**, **Speech-to-Text**, and **Rerank**.

## Install

In n8n: **Settings → Community Nodes → Install** and enter:

```text
n8n-nodes-berget-mk
```

Then add a **Berget AI API** credential with your API key from [berget.ai](https://berget.ai).

## Compatibility

Uses the same internal node type names as the upstream package (`bergetAiChat`, `bergetAiAgent`, etc.), so workflows built against `@bergetai/n8n-nodes-all` continue to work after switching.

## License

MIT
