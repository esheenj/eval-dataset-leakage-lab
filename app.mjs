import {auditDataset,EXAMPLES} from "./src/audit.mjs";
const $=id=>document.getElementById(id);
const buttons=$("scenarios"),data=$("dataset-json"),resultList=$("results");
let active=EXAMPLES[0];
function text(tag,value,cls=""){const x=document.createElement(tag);x.textContent=value;if(cls)x.className=cls;return x;}
function runAudit(){
  resultList.replaceChildren();
  try {
    if(data.value.length>48000)throw Error("INPUT_TOO_LARGE");
    const dataset=JSON.parse(data.value);
    const report=auditDataset(dataset);
    document.body.dataset.state=report.status;
    $("state").textContent=report.status.replaceAll("_"," ");
    const metrics=$("metrics");metrics.replaceChildren();
    for(const [n,label] of [[report.stats.total,"total records"],[report.errors,"errors"],[report.warnings,"warnings"]]){
      const box=text("div","","metric");box.append(text("strong",String(n)),text("small",label));metrics.append(box);
    }
    for(const finding of report.findings){
      const li=text("li","","finding");li.dataset.level=finding.severity;
      const head=text("div","","finding-head");
      head.append(text("strong",finding.code.replaceAll("_"," ")),text("span",finding.severity,"level"));
      li.append(head,text("p",finding.detail),text("small",finding.ids.length?finding.ids.join(", "):"dataset-level finding"));
      resultList.append(li);
    }
    if(report.findings.length===0)resultList.append(text("li","No listed structural findings in this example.","finding"));
    $("next").textContent=report.nextStep;
    $("receipt").textContent=JSON.stringify(report,null,2);
  }catch(error){
    document.body.dataset.state="LEAKAGE_OR_ERRORS";
    $("state").textContent="INVALID DATASET";
    $("metrics").replaceChildren();
    resultList.append(text("li","Input rejected: "+String(error.message).slice(0,95),"finding"));
    $("next").textContent="Provide valid, fictional JSON using the documented record shape.";
    $("receipt").textContent="Invalid input";
  }
}
function activate(id){
  const found=EXAMPLES.find(x=>x.id===id);if(!found)return;
  active=found;for(const b of buttons.querySelectorAll("button"))b.setAttribute("aria-pressed",String(b.dataset.scenario===id));
  document.body.dataset.scenario=id;
  $("scenario-description").textContent=found.description;
  data.value=JSON.stringify(found.input,null,2);
  runAudit();
}
for(const scenario of EXAMPLES){
  const button=text("button",scenario.label,"tab");button.type="button";
  button.dataset.scenario=scenario.id;button.setAttribute("aria-pressed","false");
  button.addEventListener("click",()=>activate(scenario.id));buttons.append(button);
}
$("audit").addEventListener("click",runAudit);
$("reset").addEventListener("click",()=>activate(active.id));
const desired=new URLSearchParams(location.search).get("scenario");
activate(EXAMPLES.some(x=>x.id===desired)?desired:EXAMPLES[0].id);
