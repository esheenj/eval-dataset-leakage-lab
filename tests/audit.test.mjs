import test from "node:test";
import assert from "node:assert/strict";
import {auditDataset,validateDataset,normalizePrompt,EXAMPLES} from "../src/audit.mjs";
const healthy=EXAMPLES[0].input;
const clone=x=>JSON.parse(JSON.stringify(x));
test("healthy synthetic example passes only local structural checks",()=>{
 const r=auditDataset(healthy);
 assert.equal(r.status,"CHECKS_PASS");
 assert.equal(r.errors,0);assert.equal(r.warnings,0);
 assert.equal(r.stats.total,8);assert.equal(r.stats.splits.eval,3);
 assert.equal(r.semanticQualityVerified,false);assert.equal(r.realDataPrivacyVerified,false);
});
test("leakage fixture flags cross-split prompt contamination",()=>{
 const r=auditDataset(EXAMPLES[1].input);
 assert.equal(r.status,"LEAKAGE_OR_ERRORS");
 assert.ok(r.findings.some(f=>f.code==="CROSS_SPLIT_PROMPT_LEAKAGE"));
 assert.ok(r.findings.some(f=>f.code==="DUPLICATE_ID"));
 assert.ok(r.findings.some(f=>f.code==="MISSING_LABEL"));
});
test("label imbalance and inadequate sample trigger warning, not PASS",()=>{
 const r=auditDataset(EXAMPLES[2].input);
 assert.equal(r.status,"REVIEW_WARNINGS");
 assert.ok(r.findings.some(f=>f.code==="EVAL_LABEL_DOMINANCE"));
 assert.ok(r.findings.some(f=>f.code==="INSUFFICIENT_EVAL_SAMPLE"));
});
test("normalization detects case, punctuation and unicode equivalent prompts",()=>{
 assert.equal(normalizePrompt("RESET — Your Password!"),normalizePrompt("reset your password"));
 assert.equal(normalizePrompt("Ｆｏｏ  BＡＲ"),"foo bar");
});
test("within-split duplicate detected separately",()=>{
 const x=clone(healthy);x.records[1].prompt=x.records[0].prompt.toUpperCase();
 const r=auditDataset(x);assert.ok(r.findings.some(f=>f.code==="WITHIN_SPLIT_DUPLICATE_PROMPT"));
 assert.equal(r.errors,0);
});
test("completion directly embedded in prompt is flagged",()=>{
 const x=clone(healthy);x.records[0].prompt="Please write: "+x.records[0].completion;
 assert.ok(auditDataset(x).findings.some(f=>f.code==="COMPLETION_IN_PROMPT"));
});
test("missing train split triggers review rather than misleading green",()=>{
 const x=clone(healthy);x.records=x.records.filter(r=>r.split!=="train");
 assert.ok(auditDataset(x).findings.some(f=>f.code==="NO_TRAIN_SPLIT"));
});
test("reject unexpected fields in dataset",()=>{
 assert.throws(()=>validateDataset({...healthy,credentials:"not allowed"}),/INVALID_DATASET/);
});
test("reject inherited dataset fields",()=>{
 const x=Object.assign(Object.create({admin:true}),healthy);
 assert.throws(()=>validateDataset(x),/INVALID_DATASET/);
});
test("reject invalid split",()=>{
 const x=clone(healthy);x.records[0].split="production";
 assert.throws(()=>auditDataset(x),/INVALID_RECORD/);
});
test("reject unexpected keys in record",()=>{
 const x=clone(healthy);x.records[0].trusted=true;
 assert.throws(()=>auditDataset(x),/INVALID_RECORD/);
});
test("reject oversized text",()=>{
 const x=clone(healthy);x.records[0].prompt="x".repeat(401);
 assert.throws(()=>auditDataset(x),/INVALID_RECORD/);
});
test("reject oversized dataset",()=>{
 const x=clone(healthy);x.records=Array.from({length:81},(_,i)=>({...x.records[0],id:"r-"+i}));
 assert.throws(()=>auditDataset(x),/INVALID_DATASET/);
});
test("reject empty invalid dataset",()=>{
 const x=clone(healthy);x.records=[];
 assert.throws(()=>auditDataset(x),/INVALID_DATASET/);
});
test("reject control character in sample prompt",()=>{
 const x=clone(healthy);x.records[0].prompt="Hello\nworld";
 assert.throws(()=>auditDataset(x),/INVALID_RECORD/);
});
test("reject unsupported labels",()=>{
 const x=clone(healthy);x.records[0].label="authentic";
 assert.throws(()=>auditDataset(x),/INVALID_RECORD/);
});
test("duplicate ID is reported and not silently overwritten",()=>{
 const x=clone(healthy);x.records[1].id=x.records[0].id;
 const r=auditDataset(x);
 assert.ok(r.findings.some(f=>f.code==="DUPLICATE_ID"));
});
test("findings stable under repeat evaluation",()=>{
 assert.deepEqual(auditDataset(EXAMPLES[1].input),auditDataset(EXAMPLES[1].input));
});
