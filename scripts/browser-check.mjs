import {createServer} from "node:http";
import {readFileSync} from "node:fs";
import {spawn} from "node:child_process";
import {resolve} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(fileURLToPath(new URL("../dist/pages/",import.meta.url)));
const paths=new Map([["/","index.html"],["/index.html","index.html"],["/app.mjs","app.mjs"],["/src/audit.mjs","src/audit.mjs"]]);
const server=createServer((req,res)=>{
 const file=paths.get(new URL(req.url,"http://127.0.0.1").pathname);
 if(!file){res.writeHead(404).end();return;}
 try{res.writeHead(200,{"Content-Type":file.endsWith(".mjs")?"text/javascript; charset=utf-8":"text/html; charset=utf-8","Cache-Control":"no-store"}).end(readFileSync(resolve(root,file)));}
 catch{res.writeHead(500).end();}
});
await new Promise(ok=>server.listen(0,"127.0.0.1",ok));const port=server.address().port;
async function browser(scenario,expected,expectedCode){
 const url="http://127.0.0.1:"+port+"/?scenario="+scenario;
 const args=["--headless=new","--no-sandbox","--disable-gpu","--disable-dev-shm-usage",
 "--no-first-run","--no-default-browser-check","--window-size=375,850","--virtual-time-budget=2200","--dump-dom",url];
 const html=await new Promise((ok,fail)=>{
  const child=spawn(process.env.CHROME_BIN||"google-chrome",args,{stdio:["ignore","pipe","pipe"]});
  let out="",err="";
  const stop=setTimeout(()=>{child.kill("SIGKILL");fail(Error("CHROME_TIMEOUT:"+scenario));},30000);
  child.stdout.on("data",chunk=>{out+=chunk.toString();if(out.length>400000)child.kill("SIGKILL");});
  child.stderr.on("data",chunk=>{err+=chunk.toString();if(err.length>8000)err=err.slice(-8000);});
  child.on("error",e=>{clearTimeout(stop);fail(e);});
  child.on("close",code=>{clearTimeout(stop);code===0?ok(out):fail(Error("CHROME_EXIT_"+code+":"+err.slice(-250)));});
 });
 if(!html.includes('data-scenario="'+scenario+'"')||
    !html.includes('data-state="'+expected+'"')||
    !html.includes('id="receipt"'))throw Error("BROWSER_SCENARIO_MISMATCH:"+scenario+":"+expected);
 if(expectedCode && !html.includes(expectedCode.replaceAll("_"," ")))throw Error("FINDING_MISSING:"+expectedCode);
 console.log("CHROME_PASS "+scenario+" => "+expected);
}
try{
 await browser("balanced","CHECKS_PASS",null);
 await browser("leakage","LEAKAGE_OR_ERRORS","CROSS_SPLIT_PROMPT_LEAKAGE");
 await browser("skewed","REVIEW_WARNINGS","EVAL_LABEL_DOMINANCE");
}finally{server.close();}
