/* Run with PLAYWRIGHT_MODULE pointing at a local Playwright installation.
   Uses a separate headless browser profile; never touches your personal browser. */
const {chromium}=require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const core=require('../src/core.js');
const bank=require('../assets/question-bank.json');
const byId=new Map(bank.questions.map(q=>[q.id,q]));
const root=path.resolve(__dirname,'..');
fs.mkdirSync(path.join(root,'qa'),{recursive:true});
const base=process.env.PREVIEW_URL || 'http://127.0.0.1:4173';
let checks=0;
const passed=message=>{checks++;console.log(`PASS ${message}`);};
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'});
 const context=await browser.newContext({viewport:{width:1440,height:1050},deviceScaleFactor:1});
 const page=await context.newPage();const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 const getSession=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('cloudroom.session.v1')));
 async function loadSession(s){await page.evaluate(s=>localStorage.setItem('cloudroom.session.v1',JSON.stringify(s)),s);await page.reload();await page.locator('.question-prompt, .results-title').waitFor();}
 const screenshot=name=>page.screenshot({path:path.join(root,'qa',name+'.png'),fullPage:true});
 const noOverflow=async()=>assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`Horizontal overflow at ${await page.evaluate(()=>innerWidth)}`);
 await page.goto(base);await page.getByRole('heading',{name:'Know the cloud. Own the exam.'}).waitFor();await noOverflow();await screenshot('home-desktop');passed('desktop landing page renders without overflow');
 await page.getByRole('button',{name:'Start practicing',exact:true}).click();await page.locator('#setup-dialog').waitFor({state:'visible'});await screenshot('setup-desktop');
 await page.locator('#setup-dialog input[value="domain"]').check();await page.locator('select[name="domain"]').selectOption('2');await page.locator('select[name="count"]').selectOption('10');await page.getByRole('button',{name:'Let’s get started'}).click();
 let s=await getSession();assert.equal(s.questionIds.length,10);assert.ok(s.questionIds.every(id=>byId.get(id).domain_id==='2'));passed('domain picker starts the requested domain and length');
 let q=byId.get(s.questionIds[0]);
 // Put a single-answer question first while keeping the actual UI-created session.
 if(q.selection_count!==1){const at=s.questionIds.findIndex(id=>byId.get(id).selection_count===1);[s.questionIds[0],s.questionIds[at]]=[s.questionIds[at],s.questionIds[0]];await loadSession(s);q=byId.get(s.questionIds[0]);}
 await page.locator(`input[name="answer"][value="${q.options.find(o=>!o.is_correct).id}"]`).check();
 assert.ok(await page.locator('.feedback-summary').isVisible());assert.equal(await page.locator('.option-feedback').count(),q.options.length);assert.equal(await page.locator('.wrong-answer').count(),1);assert.ok((await page.locator('.feedback-summary p').innerText()).includes(q.explanation));assert.ok(await page.locator('.sources').count());passed('wrong single answer immediately shows supplied per-option explanations and references');
 await screenshot('practice-feedback-desktop');await page.reload();assert.ok(await page.locator('.feedback-summary').isVisible());s=await getSession();assert.equal(s.submitted[q.id],true);passed('refresh preserves the selected answer and feedback');
 await page.getByRole('button',{name:'Next question'}).click();s=await getSession();assert.equal(s.currentIndex,1);
 await page.getByRole('button',{name:'Flag question for review'}).click();s=await getSession();assert.ok(s.flags.includes(s.questionIds[1]));await page.getByRole('button',{name:'Previous'}).click();passed('previous, next, and flag navigation preserve state');
 // Multiple-response practice: no partial credit and no early reveal.
 const multi=bank.questions.find(q=>q.selection_count===2);
 const ms=core.createSession(bank,{mode:'retry',questionIds:[multi.id],count:'all'});await loadSession(ms);
 await page.locator(`input[name="answer"][value="${multi.correct_option_ids[0]}"]`).check();assert.equal(await page.locator('.feedback-summary').count(),0);assert.equal(await page.locator('#check-answer').isDisabled(),true);
 await page.locator(`input[name="answer"][value="${multi.correct_option_ids[1]}"]`).check();assert.equal(await page.locator('#check-answer').isEnabled(),true);
 await page.locator(`label.answer-option:has(input[value="${multi.options.find(o=>!o.is_correct).id}"])`).click();assert.equal((await getSession()).answers[multi.id].length,2);assert.ok((await page.locator('#selection-message').innerText()).includes('Unselect'));
 await page.getByRole('button',{name:'Check answer',exact:true}).click();assert.equal(await page.locator('.correct-answer').count(),2);assert.ok((await page.locator('#feedback-heading').innerText()).includes('That’s right'));passed('multiple-response selection enforces count and reveals feedback only after checking');
 await page.locator('.question-footer').getByRole('button',{name:'Finish session'}).click();await page.getByRole('button',{name:'See my results',exact:true}).click();assert.ok((await page.locator('.score-ring strong').innerText()).includes('100%'));await screenshot('practice-results-desktop');passed('completed practice shows accurate score and saves results');
 await page.getByRole('button',{name:'Review answers'}).click();await page.locator('#review-filter').selectOption('missed');assert.ok(await page.getByRole('heading',{name:'Nothing to review here.'}).isVisible());passed('answer review handles an empty missed-question filter');
 await page.getByRole('button',{name:'Back to results',exact:true}).click();await page.getByRole('button',{name:'Start a new session'}).click();await page.locator('#setup-dialog input[value="exam"]').check();await page.locator('select[name="set"]').selectOption('B');await page.getByRole('button',{name:'Begin 90-minute exam'}).click();s=await getSession();assert.equal(s.questionIds.length,65);assert.ok(s.questionIds.every(id=>byId.get(id).set_id==='B'));assert.equal(s.deadline-s.startedAt,5400000);passed('exam setup starts 65 questions with a 90-minute deadline');
 q=byId.get(s.questionIds[0]);for(const id of q.correct_option_ids)await page.locator(`input[name="answer"][value="${id}"]`).check();assert.equal(await page.locator('.feedback-summary,.option-feedback,.correct-answer,.sources').count(),0);assert.ok((await page.locator('.room-helper').innerText()).includes('No feedback'));await screenshot('exam-desktop');passed('exam answers reveal no correctness or explanations before submission');
 const wrong=q.options.find(o=>!o.is_correct).id;
 if(q.selection_count===1)await page.locator(`input[name="answer"][value="${wrong}"]`).check();else{await page.locator(`input[name="answer"][value="${q.correct_option_ids[0]}"]`).uncheck();await page.locator(`input[name="answer"][value="${wrong}"]`).check();}
 s=await getSession();assert.ok(s.answers[q.id].includes(wrong));const deadline=s.deadline;await page.reload();assert.equal((await getSession()).deadline,deadline);assert.equal(await page.locator('.feedback-summary').count(),0);passed('exam answers can change and refresh does not reset the timer');
 await page.locator('.room-sidebar').getByRole('button',{name:'Finish exam',exact:true}).click();assert.ok((await page.locator('.confirm-copy').innerText()).includes('64 questions are unanswered'));await page.getByRole('button',{name:'Submit exam',exact:true}).click();assert.equal(await page.locator('.score-ring strong').innerText(),'0%');assert.ok((await page.locator('.result-badge').textContent()).includes('Below practice target'));assert.ok((await page.locator('.score-disclaimer').innerText()).includes('cannot be converted'));passed('exam submission counts unanswered questions and labels practice scoring honestly');
 await page.getByRole('button',{name:'Review answers'}).click();assert.ok(await page.locator('.feedback-summary').isVisible());await page.locator('#review-filter').selectOption('missed');assert.equal(await page.locator('.room-sidebar .map-button').count(),65);await screenshot('exam-review-desktop');passed('exam explanations become available only after submission');
 await page.getByRole('button',{name:'Results',exact:true}).click();await page.getByRole('button',{name:'Retry missed questions'}).click();s=await getSession();assert.equal(s.config.mode,'retry');assert.equal(s.questionIds.length,65);passed('retry creates an untimed session from missed questions');
 const expired=core.createSession(bank,{mode:'exam',set:'A'},Date.now()-5401000);expired.answers[expired.questionIds[0]]=byId.get(expired.questionIds[0]).correct_option_ids;await loadSession(expired);assert.ok((await page.locator('.results-intro').innerText()).includes('automatically'));s=await getSession();assert.equal(s.timedOut,true);assert.equal(s.completedAt,s.deadline);passed('expired saved exams automatically submit on reload');
 const near=core.createSession(bank,{mode:'exam',set:'A'},Date.now()-5398000);await loadSession(near);await page.locator('.results-title').waitFor({timeout:6000});assert.equal((await getSession()).timedOut,true);passed('a running exam automatically submits when the clock reaches zero');
 const pass=core.createSession(bank,{mode:'exam',set:'C'});for(const id of pass.questionIds.slice(0,46))pass.answers[id]=byId.get(id).correct_option_ids;await loadSession(pass);await page.locator('.room-sidebar').getByRole('button',{name:'Finish exam',exact:true}).click();await page.getByRole('button',{name:'Submit exam',exact:true}).click();assert.equal(await page.locator('.result-badge').textContent(),'Practice pass');assert.equal(await page.locator('.score-ring strong').innerText(),'71%');await screenshot('exam-results-desktop');passed('46 of 65 earns the configured practice pass without a fake AWS scaled score');
 // Phone walkthrough and responsive layout checks.
 await page.setViewportSize({width:390,height:844});await page.getByRole('button',{name:'Back to overview',exact:true}).click();await noOverflow();await screenshot('home-mobile');assert.ok(await page.locator('#progress .stats-grid').isVisible());passed('mobile landing and progress stay within the viewport');
 await page.getByRole('button',{name:'Start practicing',exact:true}).click();await page.locator('#setup-dialog input[value="mixed"]').check();await screenshot('setup-mobile');await page.getByRole('button',{name:'Let’s get started'}).click();await noOverflow();s=await getSession();q=byId.get(s.questionIds[0]);for(const id of q.correct_option_ids)await page.locator(`input[name="answer"][value="${id}"]`).check();if(q.selection_count>1)await page.getByRole('button',{name:'Check answer',exact:true}).click();await screenshot('practice-feedback-mobile');await noOverflow();passed('mobile practice supports answers and readable feedback');
 await page.locator('.room-top .mobile-map').click();assert.ok(await page.locator('#map-dialog').isVisible());await page.locator('#map-dialog .map-button').nth(4).click();assert.equal((await getSession()).currentIndex,4);passed('phone question navigator jumps to the requested question');
 await page.setViewportSize({width:320,height:700});await noOverflow();await screenshot('practice-small-mobile');await page.getByRole('button',{name:'Overview',exact:true}).click();await page.getByRole('button',{name:'Save & leave',exact:true}).click();await noOverflow();await screenshot('home-small-mobile');passed('320px layout has no horizontal overflow and leaving preserves the session');
 await page.getByRole('button',{name:'Resume',exact:false}).click();assert.equal((await getSession()).currentIndex,4);passed('saved session resumes at the same question');
 const narrowMulti=core.createSession(bank,{mode:'retry',questionIds:[multi.id],count:'all'});await loadSession(narrowMulti);await noOverflow();
 const footerFits=await page.evaluate(()=>{const panel=document.querySelector('.question-panel').getBoundingClientRect();return [...document.querySelectorAll('.question-footer button')].every(button=>{const b=button.getBoundingClientRect();return b.left>=panel.left&&b.right<=panel.right;});});assert.equal(footerFits,true);await screenshot('multiple-answer-small-mobile');passed('multiple-answer controls fit inside the question panel at 320px');
 assert.deepEqual(errors,[]);passed('no browser runtime errors across the complete walkthrough');
 // Direct file access must also work: no fetch or module server requirement.
 const filePage=await context.newPage();await filePage.goto('file://'+path.join(root,'index.html'));await filePage.getByRole('heading',{name:'Know the cloud. Own the exam.'}).waitFor();await filePage.getByRole('button',{name:'Start practicing',exact:true}).click();await filePage.getByRole('button',{name:'Let’s get started'}).click();assert.ok(await filePage.locator('.question-prompt').isVisible());passed('opening index.html directly works without a server or network');
 console.log(`\n${checks} browser checks passed. Screenshots saved in qa/.`);await browser.close();
})().catch(error=>{console.error(error);process.exit(1);});
