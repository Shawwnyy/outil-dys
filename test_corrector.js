const fs=require('fs'),vm=require('vm');
const code=['data.js','corrector.js'].map(f=>fs.readFileSync(__dirname+'/js/'+f,'utf8')).join('\n')+';globalThis.C=Corrector;globalThis.D={EXEMPLE,CATS};';
vm.runInThisContext(code);
const t0=Date.now();
const r=C.analyze(D.EXEMPLE);
console.log('ms',Date.now()-t0,'erreurs',r.errors.length);
for(const e of r.errors) console.log(e.cat.padEnd(7),JSON.stringify(e.orig).padEnd(28),'->',JSON.stringify(e.sugg),e.kind);
const fixed=C.autoCorrect(D.EXEMPLE,'safe');
console.log('\nCORRIGÉ:',fixed.text);
// faux positifs sur un texte correct
const ok="Les enfants sont partis à l'école hier matin. Il n'est pas content, mais il continue. Nous avons mangé des pommes. Quelque chose ne va pas : où est mon livre ? Il ne sait pas où il habite.";
const r2=C.analyze(ok);console.log('\nTEXTE CORRECT -> erreurs signalées:',r2.errors.map(e=>e.cat+':'+JSON.stringify(e.orig)));
