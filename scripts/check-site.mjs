import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const html=readFileSync(new URL("../index.html",import.meta.url),"utf8");
const app=readFileSync(new URL("../app.mjs",import.meta.url),"utf8");
test("strict offline CSP and only local scripts",()=>{
 assert.match(html,/connect-src 'none'/);assert.match(html,/script-src 'self'/);
 assert.match(html,/src="\.\/app\.mjs"/);assert.match(app,/\.\/src\/audit\.mjs/);
 assert.doesNotMatch(html,/<img|<iframe|<script[^>]*https?:/i);
 assert.doesNotMatch(app,/\bfetch\s*\(|XMLHttpRequest|innerHTML|localStorage|\beval\s*\(/);
});
test("accessible basic controls and mobile responsive style",()=>{
 for(const id of ["dataset-json","scenarios","results","state","metrics","receipt","audit","reset"]){
  assert.match(html,new RegExp('id="'+id+'"'));
 }
 assert.match(html,/aria-live="polite"/);
 assert.match(html,/prefers-reduced-motion/);
 assert.match(html,/max-width:840px/);
 assert.match(html,/Skip to dataset workbench/);
});
test("copy does not assert total model quality or real-data privacy",()=>{
 assert.match(html,/cannot certify real-data privacy/);
 assert.match(html,/not proof of source authenticity/i);
 assert.doesNotMatch(html,/guaranteed fair|GDPR compliant|WCAG certified/i);
});
