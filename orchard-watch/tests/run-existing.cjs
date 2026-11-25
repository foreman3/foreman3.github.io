// Agent Yoda: save the existing report before its obsolete catalog-status assertion.
// No original test assertions, rules or gameplay are altered.
const fs=require('fs'),path=require('path'),cp=require('child_process');
const source=path.resolve(__dirname,'../verify.cjs'),adapter=path.join(__dirname,'existing-regression.cjs');
let code=fs.readFileSync(source,'utf8').replace("path.resolve(__dirname, '..')","path.resolve(__dirname, '../..')");
code=code.replace('    const arcade=await context.newPage();',"    fs.writeFileSync(path.join(output,'pre-catalog-results.json'),JSON.stringify(report,null,2));\n    const arcade=await context.newPage();");
fs.writeFileSync(adapter,code);
const result=cp.spawnSync(process.execPath,[adapter],{env:{...process.env,SHOT_DIR:path.join(__dirname,'existing-regression')},encoding:'utf8'});
fs.writeFileSync(path.join(__dirname,'existing-output.txt'),result.stdout+result.stderr);process.stdout.write(result.stdout+result.stderr);process.exitCode=result.status;
