#!/usr/bin/env node
import {readFileSync} from "node:fs";
import {auditDataset,EXAMPLES} from "../src/audit.mjs";
try{
 if(process.argv.length>3)throw Error("USAGE: node bin/audit.mjs [fictional-dataset.json]");
 let inputs=EXAMPLES.map(x=>x.input);
 if(process.argv[2]){
  const raw=readFileSync(process.argv[2]);
  if(raw.length>65536)throw Error("INPUT_TOO_LARGE");
  inputs=[JSON.parse(raw.toString("utf8"))];
 }
 const reports=inputs.map(auditDataset);
 console.log(JSON.stringify({schema:"esheen-eval-dataset-report-v1",fictional:true,reports},null,2));
}catch(error){console.error("REJECTED: "+String(error.message).slice(0,140));process.exitCode=2;}
