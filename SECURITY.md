# Safety scope

This project is a fictional offline evaluation-quality demonstration, not a data security, privacy or AI compliance certification.

- All JSON is processed locally; no network model calls, telemetry, accounts, databases or backend uploads.
- Unexpected fields and oversized inputs are rejected before scoring.
- Browser output uses textContent for dynamic content; strict CSP permits only local ES modules.
- GitHub Pages publishes only three source files and a nojekyll marker, after exact-main green CI.
- Normalized exact prompts miss paraphrases and sometimes flag harmless shared templates. No privacy, fairness, annotation or provenance claims are made.

Never paste confidential real data or keys into the public playground. Report sensitive vulnerabilities privately through GitHub where supported.
