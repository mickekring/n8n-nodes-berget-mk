# Berget AI — OpenAPI Spec vs. Runtime Discrepancies

**Report date**: 2026-04-11
**Reported by**: Micke Kring (`mickekring` on npm, maintainer of [`n8n-nodes-berget-mk`](https://www.npmjs.com/package/n8n-nodes-berget-mk))
**Endpoint base**: `https://api.berget.ai/v1`
**OpenAPI spec source**: `https://api.berget.ai/openapi.json`

## Summary

While building an n8n community-node package for Berget AI, three separate endpoints were found to behave differently from what the public OpenAPI spec declares. Each discrepancy is a real blocker — not a cosmetic doc difference — and each is reproducible with a single `curl` command against production. This document is intended as a concrete report so the Berget team can pick whichever fix they prefer for each (spec catches up to runtime, or runtime catches up to spec).

The package's own workaround for each issue is noted at the end of each section, so nothing is urgent on Berget's side — but users of the spec outside the community-node package would hit the same walls.

All curls below assume `$BERGET_API_KEY` is set in the environment.

---

## 1. `/v1/ocr` sync endpoint always returns HTTP 500

### Spec says

`POST /v1/ocr` with a valid `OCRRequest` body returns `HTTP 200` with an `OCRResponse` containing `{ usage, content, metadata }`.

Declared response codes: `200`, `202` (async), `400`, `401`, `408`, `500`.

### Runtime does

Every sync request — minimum valid body, trivial 1-page PDF, multiple `ocrMethod` values — returns `HTTP 500` with:

```json
{
  "error": {
    "message": "Failed to process document",
    "type": "server_error",
    "param": null,
    "code": "OCR_SERVICE_ERROR"
  }
}
```

The async path (`async: true`) accepts jobs and returns `HTTP 202` with a `taskId` as expected. Polling `/v1/ocr/result/{taskId}` does return data eventually, though in our testing tasks sat in `processing` state for 10+ minutes on trivial 1-page PDFs.

### Reproducer

```bash
curl -X POST https://api.berget.ai/v1/ocr \
  -H "Authorization: Bearer $BERGET_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "document": {
      "url": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      "type": "document"
    },
    "options": {
      "outputFormat": "md"
    }
  }'
```

Observed: `HTTP 500`, `OCR_SERVICE_ERROR`.

Compare with `"async": true` on the same body — returns `HTTP 202` with a taskId.

### Additional note

Berget's public pricing/models page no longer lists OCR as a product. If OCR has been sunset, returning `HTTP 410 Gone` or `HTTP 404` on this endpoint would be clearer than `HTTP 500`. If OCR is still supported, the sync path needs attention.

### Our workaround

The n8n node's OCR resource is hidden from the UI as of package version `0.4.4`. Implementation is still in the codebase and can be re-enabled with a one-line change once the sync path is working again, or we adjust to async-only if that's the intended future.

---

## 2. `/v1/embeddings` `dimensions` parameter always returns HTTP 503

### Spec says

`POST /v1/embeddings` accepts an optional `dimensions` number parameter, described as:

> The number of dimensions the resulting output embeddings should have. If not specified, the model's default dimension size will be used (1024 for `intfloat/multilingual-e5-large-instruct`).

This matches OpenAI's `/v1/embeddings` API and is how LangChain's `OpenAIEmbeddings` class forwards its `dimensions` option.

### Runtime does

Any request that includes `dimensions` in the body fails with `HTTP 503`:

```json
{
  "error": {
    "message": "Failed to create embeddings: Unknown error",
    "type": "server_error",
    "param": null,
    "code": "EMBEDDING_CREATION_ERROR"
  }
}
```

This happens at **any value**, including the model's own native size (`1024` for `intfloat/multilingual-e5-large-instruct`). The backend rejects the field's *presence*, not its value.

Omitting the field — `HTTP 200`, returns a 1024-dim vector as documented.

### Reproducer

```bash
# Works — returns HTTP 200 with a 1024-dim vector
curl -X POST https://api.berget.ai/v1/embeddings \
  -H "Authorization: Bearer $BERGET_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"intfloat/multilingual-e5-large-instruct","input":"test"}'

# Fails — HTTP 503 EMBEDDING_CREATION_ERROR
curl -X POST https://api.berget.ai/v1/embeddings \
  -H "Authorization: Bearer $BERGET_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"intfloat/multilingual-e5-large-instruct","input":"test","dimensions":1024}'

# Also fails — HTTP 503 with any value
curl -X POST https://api.berget.ai/v1/embeddings \
  -H "Authorization: Bearer $BERGET_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"intfloat/multilingual-e5-large-instruct","input":"test","dimensions":512}'
```

### Diagnostic note

When a Vector Store indexing run hits this in a tight loop, the 503s burn through the per-minute rate-limit budget very quickly. The observable symptom in an n8n workflow is a cascade of `HTTP 429 Rate limit exceeded` errors *after* a few successful 503 rejections, which can mislead a debugger into thinking the problem is rate-limit related rather than the underlying 503. It took some careful isolation to realize the 429s were a secondary effect of the 503s consuming the rate budget.

### Our workaround

The Dimensions option in the Embeddings sub-node defaults to `0` as of package version `0.4.8`, which is a sentinel meaning "don't send the parameter". The field is kept in the UI with a warning in its description explaining the current backend rejection, so users can opt in once Berget fixes the backend without needing a package update.

---

## 3. `/v1/rerank` response shape doesn't match the spec

### Spec says

`POST /v1/rerank` returns `RerankResponse`:

```json
{
  "object": "list",
  "data": [
    {
      "object": "reranked_document",
      "document": "<string>",
      "index": 0,
      "relevance_score": 0.99
    }
  ],
  "model": "BAAI/bge-reranker-v2-m3",
  "usage": { "prompt_tokens": 147, "total_tokens": 147 }
}
```

Top-level array key: `data`. Each result's `document` field: a string.

### Runtime does

```json
{
  "id": "rerank-65d9f05b2163d2e805870be280e6458c",
  "model": "BAAI/bge-reranker-v2-m3",
  "usage": { "prompt_tokens": 147, "total_tokens": 147 },
  "results": [
    {
      "index": 0,
      "document": {
        "text": "Berget AI är en svensk leverantör ...",
        "multi_modal": null
      },
      "relevance_score": 0.9998
    }
  ]
}
```

Three differences:

1. Top-level array key is **`results`**, not `data`.
2. Top-level key **`id`** is present, not documented in the spec.
3. Each result's **`document` is an object** `{ text, multi_modal }`, not a bare string.

Additionally, the spec declares a `return_documents` request parameter that defaults to `true`. Runtime appears to include the `document` object in every response regardless of what `return_documents` is set to — setting it to `false` does not remove the document field.

### Reproducer

```bash
curl -X POST https://api.berget.ai/v1/rerank \
  -H "Authorization: Bearer $BERGET_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "BAAI/bge-reranker-v2-m3",
    "query": "vad är berget ai",
    "documents": [
      "Berget AI är en svensk leverantör av AI-modeller.",
      "Pokémon är ett japanskt mediefranchise.",
      "Berget bygger en molnplattform för EU-data."
    ],
    "top_n": 3,
    "return_documents": false
  }'
```

Observed: `HTTP 200` with `results` (not `data`), each result's `document` is `{ text, multi_modal }` (not a string), and the `document` field is present despite `return_documents: false`.

### Impact

Clients built from the OpenAPI spec — including LangChain wrappers, SDKs, and our initial implementation — read `response.data` and get `undefined`, which then maps to an empty array, which returns zero documents. The symptom in a RAG workflow is "reranker runs without error but returns no documents", which is particularly hard to diagnose because the call succeeds end-to-end.

### Our workaround

The Reranker sub-node reads `payload.results ?? payload.data` as of package version `0.4.10`, which handles both the current runtime shape and the spec-declared shape if/when they're reconciled. The `document` field is typed as `string | { text, multi_modal }` for the same reason.

---

## Minor observation: `/v1/ocr` also has a docs-vs-runtime diff

While not blocking, the published docs example at `berget.ai` shows:

```js
options: {
  tableMode: 'accurate',
  ocrMethod: 'easyocr',
  formats: ['md']          // ← runtime rejects this
}
```

But the runtime validator requires:

```js
options: {
  outputFormat: 'md'       // ← singular string, required
}
```

Reproduced by sending the docs example body and receiving:

```json
{
  "error": "Validation failed",
  "code": "VALIDATION_ERROR",
  "details": {
    "errors": [{
      "field": "outputFormat",
      "message": "The field \"outputFormat\" is required",
      "code": "invalid_type"
    }]
  }
}
```

The OpenAPI spec correctly declares `outputFormat`. Only the prose docs example is out of sync.

---

## Why this matters (brief)

Each of these is a small fix on Berget's end — either the spec catches up to the code or vice versa. What makes them worth reporting together is the pattern: **Berget's OpenAPI spec is drifting from the running service, in ways that break any client that trusts the spec as ground truth**. SDK generators, LangChain integrations, and community nodes all read the spec and build against it. When the spec lies, every downstream builder has to discover the truth individually.

For any new endpoint added after this report, a simple "publish the spec, then run a contract test against production" step in CI would catch most of these before they ship.

Not reporting these as anything critical — the package has workarounds for all three and everything the node claims to do is verified working. Just a concrete list with repros in case it's useful to the team.

Happy to answer questions or help test fixes.

---

## Appendix — which package versions document each issue

- `0.4.4` — OCR sync issue noted, OCR resource hidden
- `0.4.8` — Embeddings dimensions issue noted, default changed to off
- `0.4.10` — Rerank response shape issue noted, reader made tolerant
