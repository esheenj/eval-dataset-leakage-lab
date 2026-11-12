// Original, deterministic educational quality checks on invented evaluation data.
// No semantic grading, source authenticity, PII certification or real model execution.
const isPlain = x => x !== null && typeof x === "object" && !Array.isArray(x) &&
  (Object.getPrototypeOf(x) === Object.prototype || Object.getPrototypeOf(x) === null);
const own = (x,k) => Object.prototype.hasOwnProperty.call(x,k);
const exact = (x,keys) => isPlain(x) && Object.keys(x).length === keys.length && keys.every(k=>own(x,k));
const IDENT=/^[a-z][a-z0-9-]{1,39}$/;
const SPLITS=new Set(["train","eval","test"]);
const LABELS=new Set(["correct","incorrect","uncertain",""]);
const validText=(x,max=280)=>typeof x==="string" && x.length>=2 && x.length<=max && !/[\u0000-\u001f]/.test(x);
export const normalizePrompt = x => x.normalize("NFKC").toLowerCase().replace(/[^\p{L}\p{N}]+/gu," ").trim();
export function validateDataset(input){
  if(!exact(input,["name","minEval","records"]) ||
      !validText(input.name,80) || !Number.isInteger(input.minEval) ||
      input.minEval < 1 || input.minEval > 40 ||
      !Array.isArray(input.records) || input.records.length<2 || input.records.length>80) throw Error("INVALID_DATASET");
  for(const r of input.records) {
    if(!exact(r,["id","split","prompt","completion","label"]) ||
       typeof r.id!=="string" || !IDENT.test(r.id) ||
       !SPLITS.has(r.split) || !validText(r.prompt,400) ||
       !validText(r.completion,400) || !LABELS.has(r.label)) throw Error("INVALID_RECORD");
  }
  return true;
}
export function auditDataset(input) {
  validateDataset(input);
  const findings=[];
  const add=(code,severity,ids,detail)=>findings.push({code,severity,ids:[...ids].sort(),detail});
  const seenIds=new Map(),seenPrompts=new Map();
  const stats={total:input.records.length,splits:{train:0,eval:0,test:0},evalLabels:{correct:0,incorrect:0,uncertain:0,missing:0},uniqueNormalizedPrompts:0};
  for (const r of input.records) {
    stats.splits[r.split]++;
    if(r.split==="eval")stats.evalLabels[r.label||"missing"]++;
    const prior=seenIds.get(r.id);
    if(prior)add("DUPLICATE_ID","ERROR",[prior.id,r.id],"Record IDs must be unique.");
    else seenIds.set(r.id,r);
    const normalized=normalizePrompt(r.prompt);
    if(!normalized) add("EMPTY_NORMALIZED_PROMPT","ERROR",[r.id],"Prompt contains no letters or digits after normalization.");
    const prev=seenPrompts.get(normalized) || [];
    for (const old of prev) {
      if(old.split!==r.split)add("CROSS_SPLIT_PROMPT_LEAKAGE","ERROR",[old.id,r.id],
        "Matching normalized prompts appear in different data splits ("+old.split+" / "+r.split+").");
      else add("WITHIN_SPLIT_DUPLICATE_PROMPT","WARNING",[old.id,r.id],
        "Identical normalized prompts within "+r.split+" could distort diversity.");
    }
    prev.push(r);seenPrompts.set(normalized,prev);
    const answer=normalizePrompt(r.completion);
    if(answer.length>=24 && normalized.includes(answer))add("COMPLETION_IN_PROMPT","WARNING",[r.id],
      "The normalized completion appears inside its own prompt; inspect for answer leakage.");
    if(r.label==="")add("MISSING_LABEL","WARNING",[r.id],"Example has no evaluation label.");
  }
  stats.uniqueNormalizedPrompts=seenPrompts.size;
  if(stats.splits.eval<input.minEval)add("INSUFFICIENT_EVAL_SAMPLE","WARNING",[],
    "Only "+stats.splits.eval+" eval records; local minimum is "+input.minEval+".");
  if(stats.splits.train===0)add("NO_TRAIN_SPLIT","WARNING",[],"No train split is provided for a leakage comparison.");
  if(stats.splits.eval>=3){
    const nonempty=stats.splits.eval-stats.evalLabels.missing;
    const dominant=Math.max(stats.evalLabels.correct,stats.evalLabels.incorrect,stats.evalLabels.uncertain);
    if(nonempty>=3 && dominant/nonempty>0.8)add("EVAL_LABEL_DOMINANCE","WARNING",[],
      "One label represents more than 80% of labelled eval records; consider stratifying.");
  }
  findings.sort((a,b)=>a.code.localeCompare(b.code)||a.ids.join("|").localeCompare(b.ids.join("|")));
  const errors=findings.filter(x=>x.severity==="ERROR").length;
  const warnings=findings.filter(x=>x.severity==="WARNING").length;
  return {
    schema:"esheen-eval-dataset-leakage-v1",dataset:input.name,status:errors?"LEAKAGE_OR_ERRORS":warnings?"REVIEW_WARNINGS":"CHECKS_PASS",
    stats,findings,errors,warnings,realDataPrivacyVerified:false,
    semanticQualityVerified:false,modelPerformanceVerified:false,
    nextStep:errors?"Keep the dataset out of real benchmarks until the flagged overlaps and invalid IDs are reviewed.":
      warnings?"Inspect warnings, class balance and sample size before relying on benchmark scores.":
      "Local structural checks passed. Independently assess sampling, provenance, privacy and real model performance before use."
  };
}
const rows=[
  ["t-01","train","Write a friendly welcome note","Welcome, and thanks for joining.","correct"],
  ["t-02","train","Suggest a safe password habit","Use a unique password for each service.","correct"],
  ["t-03","train","Explain a missing source","This claim needs a source before approval.","uncertain"],
  ["e-01","eval","Summarize a fictional service outage","A sample queue is delayed; mitigation is ongoing.","correct"],
  ["e-02","eval","Check a sample refund claim","The provided evidence is not enough to confirm.","uncertain"],
  ["e-03","eval","Describe an unsupported guarantee","A guaranteed outcome is not justified.","incorrect"],
  ["s-01","test","Format an example status update","Status: degraded; review the synthetic logs.","correct"],
  ["s-02","test","List reasonable next steps","Recheck sample data and record uncertainty.","correct"]
];
const build=()=>rows.map(([id,split,prompt,completion,label])=>({id,split,prompt,completion,label}));
export const EXAMPLES=Object.freeze([
 {id:"balanced",label:"Balanced sample",description:"Three distinct splits with varied eval labels and no exact normalized overlaps.",
  input:{name:"Fictional balanced evaluation set",minEval:3,records:build()}},
 {id:"leakage",label:"Leakage & duplicates",description:"Repeated training prompts appear in evaluation; duplicate IDs and missing labels need review.",
  input:{name:"Fictional contaminated evaluation set",minEval:3,records:build().map((r,i)=>i===3?{...r,prompt:"Suggest a safe password habit"}:i===4?{...r,id:"t-03",label:""}:r)}},
 {id:"skewed",label:"Skewed labels",description:"Evaluation examples are heavily one-sided; the minimum sample threshold is deliberately unmet.",
  input:{name:"Fictional skewed evaluation set",minEval:5,records:build().map(r=>r.split==="eval"?{...r,label:"correct"}:r)}}
]);
