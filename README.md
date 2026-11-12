# Evaluation Dataset Leakage Lab

**Discover hidden contamination before relying on an AI benchmark.**

An original, independent Esheen Labs open-source project for examining **fictional** evaluation datasets. Compare train/eval/test splits, duplicate prompts, missing labels, small evaluation samples and label distribution. Run it in your browser or locally in Node.js.

**[Open the live playground](https://esheenj.github.io/eval-dataset-leakage-lab/)** · [Explore the Labs gallery](https://esheenj.github.io/compound-intelligence-starter/) · [Contribute](CONTRIBUTING.md)

> The browser link becomes valid only after separately verified Pages publication. Source creation and green CI do not prove deployment.

## Three interactive examples

- **Balanced sample:** eight synthetic records, three distinct splits and varied evaluation labels.
- **Leakage & duplicates:** a normalized train prompt reappears in eval, a record identifier repeats and one label is missing.
- **Skewed labels:** one class dominates an undersized evaluation set.

Choose a sample, edit fictional JSON and run the local checks. Each finding includes an exact code, severity and affected record identifiers. The browser and CLI share a pure deterministic engine. No models, embeddings, remote APIs, analytics or dependencies.

## Run locally

Node 20+; no npm install required.

~~~sh
npm test
npm run check:site
npm run demo
npm run stage
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist/pages
~~~

Open http://127.0.0.1:8000.

The CLI accepts a single fictional JSON file:

~~~sh
node bin/audit.mjs path/to/fictional-dataset.json
~~~

The JSON has three exact top-level keys: name (short text), minEval (integer 1 to 40), and records (2 to 80 objects). Every record has exactly id, split (train / eval / test), prompt, completion and label (correct, incorrect, uncertain, or an empty label). CLI input size is bounded to 64 KiB.

## Available checks

| Finding code | Explanation |
|---|---|
| CROSS_SPLIT_PROMPT_LEAKAGE | Matching normalized prompt appears in different splits |
| DUPLICATE_ID | Reused record identifier |
| WITHIN_SPLIT_DUPLICATE_PROMPT | Same normalized prompt within one split |
| MISSING_LABEL | Unlabeled evaluation record |
| INSUFFICIENT_EVAL_SAMPLE | Too few evaluation records for the selected minimum |
| EVAL_LABEL_DOMINANCE | One label exceeds 80% of nonempty eval labels |
| NO_TRAIN_SPLIT | No train data provided for a leakage comparison |
| COMPLETION_IN_PROMPT | Long completion appears verbatim in normalized prompt |
| EMPTY_NORMALIZED_PROMPT | Prompt has no letters or numbers after normalization |

Normalization: Unicode NFKC, lowercase and punctuation/whitespace collapse. This is **not semantic similarity or a full memorization test**. A clean finding list does not guarantee privacy, data provenance, unbiased sampling, correct annotations, statistical validity or real-world model accuracy.

Use invented data only. Never paste customer records, private prompts, secrets, personal identifiers, financial/trading information or employer source.

## Engineering and release evidence

| Path | Purpose |
|---|---|
| src/audit.mjs | Pure deterministic audit module and three synthetic examples |
| index.html, app.mjs | Responsive interactive inspector |
| bin/audit.mjs | Bounded CLI and machine-readable report |
| tests/audit.test.mjs | Eighteen positive and negative tests |
| scripts/stage-site.mjs | Four-file allowlisted static Pages bundle |
| scripts/browser-check.mjs | Real headless Chrome tests of the three examples |
| .github/workflows/ | Main-CI gated exact-head Pages deployment |

MIT-licensed original source with clean history. No private Esheen Labs control plane, financial/trading authority, proprietary employer source, new paid services or external npm dependencies. **R0 additional recurring spend.**

[Security](SECURITY.md) · [Contributions](CONTRIBUTING.md).
