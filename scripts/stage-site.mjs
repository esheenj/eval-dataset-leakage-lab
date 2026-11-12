import {readFileSync,writeFileSync,mkdirSync,lstatSync,existsSync} from "node:fs";
import {resolve,join,dirname} from "node:path";
import {fileURLToPath} from "node:url";
import {createHash} from "node:crypto";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const dest=join(root,"dist","pages");
const allow=["index.html","app.mjs","src/audit.mjs"];
const read=p=>{const file=join(root,p);if(lstatSync(file).isSymbolicLink())throw Error("SYMLINK_SOURCE");return readFileSync(file);};
const html=read("index.html").toString("utf8"),app=read("app.mjs").toString("utf8");
if(!html.includes("connect-src 'none'")||!html.includes("script-src 'self'")||
  !html.includes('src="./app.mjs"')||html.includes("<iframe")||html.includes("<img"))throw Error("SITE_SAFETY_CONTRACT");
if(/(?:fetch\s*\(|XMLHttpRequest|localStorage|innerHTML|eval\s*\()/.test(app))throw Error("UNSAFE_APP_PRIMITIVE");
if(existsSync(dest))throw Error("STAGE_EXISTS");
mkdirSync(dest,{recursive:true});
const hashes={};
for(const p of allow){
  const content=read(p);if(content.length>85000)throw Error("SOURCE_TOO_LARGE");
  mkdirSync(dirname(join(dest,p)),{recursive:true});
  writeFileSync(join(dest,p),content,{flag:"wx"});
  hashes[p]=createHash("sha256").update(content).digest("hex");
}
writeFileSync(join(dest,".nojekyll"),"",{flag:"wx"});
console.log(JSON.stringify({state:"STAGED_ONLY",files:[...allow,".nojekyll"],hashes,networkRequired:false}));
