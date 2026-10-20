const {test}=require('node:test');
const assert=require('node:assert/strict');
const core=require('../src/core.js');
const bank=require('../assets/question-bank.json');
const seeded=()=>{let n=42;return()=>((n=(n*1664525+1013904223)>>>0)/4294967296);};
test('all 195 imported questions have consistent answers and complete option feedback',()=>{
 assert.equal(bank.questions.length,195);
 assert.equal(new Set(bank.questions.map(q=>q.id)).size,195);
 assert.equal(new Set(bank.questions.map(q=>q.prompt)).size,195);
 for(const q of bank.questions){
  assert.ok(bank.domains[q.domain_id]);assert.ok(q.explanation);
  assert.equal(q.correct_option_ids.length,q.selection_count);
  assert.deepEqual(q.options.filter(o=>o.is_correct).map(o=>o.id).sort(),[...q.correct_option_ids].sort());
  for(const o of q.options){assert.ok(o.feedback_when_selected);assert.ok(o.feedback_when_omitted);assert.ok(o.explanation);}
 }
});
test('a fresh exam has 65 unique questions and the intended domain balance',()=>{
 for(let i=0;i<30;i++){
  const ids=core.selectQuestions(bank,{mode:'exam',set:'random'});
  assert.equal(ids.length,65);assert.equal(new Set(ids).size,65);
  const counts={};for(const id of ids){const d=bank.questions.find(q=>q.id===id).domain_id;counts[d]=(counts[d]||0)+1;}
  assert.deepEqual(counts,{1:16,2:19,3:22,4:8});
 }
});
test('each supplied exam set contains exactly its own 65 questions',()=>{
 for(const set of ['A','B','C']){
  const ids=core.selectQuestions(bank,{mode:'exam',set},seeded());assert.equal(ids.length,65);
  assert.ok(ids.every(id=>bank.questions.find(q=>q.id===id).set_id===set));
 }
});
test('domain sessions clamp to availability and never leak another domain',()=>{
 const ids=core.selectQuestions(bank,{mode:'domain',domain:'4',count:50},seeded());
 assert.equal(ids.length,23);assert.equal(new Set(ids).size,23);
 assert.ok(ids.every(id=>bank.questions.find(q=>q.id===id).domain_id==='4'));
});
test('mixed practice and all-questions modes do not repeat questions',()=>{
 assert.equal(core.selectQuestions(bank,{mode:'mixed',count:20}).length,20);
 const ids=core.selectQuestions(bank,{mode:'mixed',count:'all'});assert.equal(new Set(ids).size,195);
});
test('question selection never mutates the original bank',()=>{
 const original=JSON.stringify(bank);core.selectQuestions(bank,{mode:'exam',set:'random'});assert.equal(JSON.stringify(bank),original);
});
test('multi-response scoring requires an exact set, in any order',()=>{
 const q=bank.questions.find(q=>q.selection_count===2),wrong=q.options.find(o=>!o.is_correct).id;
 assert.equal(core.isCorrect(q,[...q.correct_option_ids].reverse()),true);
 for(const selected of [[],q.correct_option_ids.slice(0,1),[...q.correct_option_ids,wrong],[q.correct_option_ids[0],wrong],[q.correct_option_ids[0],q.correct_option_ids[0]]])assert.equal(core.isCorrect(q,selected),false);
 assert.equal(core.isAnswered(q,[q.correct_option_ids[0]]),false);
});
test('unanswered and wrong answers get zero; domains total to the exam score',()=>{
 const s=core.createSession(bank,{mode:'exam',set:'A'},Date.now(),seeded());
 s.questionIds.slice(0,45).forEach(id=>s.answers[id]=bank.questions.find(q=>q.id===id).correct_option_ids);
 const summary=core.summarize(s,bank);
 assert.equal(summary.correct,45);assert.equal(summary.unanswered,20);assert.equal(summary.passed,false);
 const id=s.questionIds[45];s.answers[id]=bank.questions.find(q=>q.id===id).correct_option_ids;
 const pass=core.summarize(s,bank);assert.equal(pass.passed,true);assert.equal(pass.correct,46);
 assert.equal(Object.values(pass.domains).reduce((n,d)=>n+d.correct,0),46);
 assert.equal(Object.values(pass.domains).reduce((n,d)=>n+d.total,0),65);
});
test('retry sessions contain only missed questions',()=>{
 const ids=bank.questions.slice(0,7).map(q=>q.id);
 assert.deepEqual(core.selectQuestions(bank,{mode:'retry',questionIds:ids}).sort(),ids.sort());
});
test('timer uses a fixed deadline across serialization and expiration',()=>{
 const s=core.createSession(bank,{mode:'exam',set:'random'},100000,seeded());
 assert.equal(core.remainingSeconds(s,100000),5400);
 const reloaded=JSON.parse(JSON.stringify(s));assert.equal(core.remainingSeconds(reloaded,160000),5340);
 assert.equal(core.remainingSeconds(reloaded,s.deadline+5000),0);
 assert.equal(core.formatTime(5400),'90:00');assert.equal(core.formatTime(59),'00:59');
});
test('saved sessions reject malformed or out-of-bank data',()=>{
 const s=core.createSession(bank,{mode:'mixed',count:10},Date.now(),seeded());
 assert.equal(core.validSession(s,bank),true);
 assert.equal(core.validSession({...s,questionIds:['missing']},bank),false);
 assert.equal(core.validSession({...s,questionIds:[s.questionIds[0],s.questionIds[0]]},bank),false);
 assert.equal(core.validSession({...s,currentIndex:999},bank),false);
 assert.equal(core.validSession({...s,answers:{[s.questionIds[0]]:['Z']}},bank),false);
 assert.equal(core.validSession({...s,flags:['missing']},bank),false);
 assert.equal(core.validSession({...s,bankVersion:'old'},bank),false);
 const exam=core.createSession(bank,{mode:'exam',set:'random'});
 assert.equal(core.validSession({...exam,deadline:exam.deadline+1},bank),false);
});
