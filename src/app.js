(() => {
  'use strict';
  const bank = window.CCP_BANK, core = window.QuizCore;
  const main = document.getElementById('main');
  if (!bank?.questions?.length || !core) {main.innerHTML = '<div class="loading">The question bank could not load. Please keep the assets and src folders beside index.html, then reload.</div>';return;}
  const byId = new Map(bank.questions.map(q => [q.id, q]));
  const keys = {session: 'cloudroom.session.v1', history: 'cloudroom.history.v1'};
  const colors = {'1':'#a1784e','2':'#4e725e','3':'#6a7c9a','4':'#c9774e'};
  const descriptions = {'1':'Cloud benefits, design principles & economics','2':'Shared responsibility, identity & data protection','3':'Compute, storage, databases & networking','4':'Pricing models, cost management & support'};
  const icons = {
    arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>', up:'<path d="M6 18 18 6M6 6h12v12"/>', back:'<path d="M19 12H5m6-6-6 6 6 6"/>',
    check:'<path d="m5 12 4 4L19 6"/>', cross:'<path d="m6 6 12 12M6 18 18 6"/>', clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    shuffle:'<path d="m17 3 4 4-4 4M3 17h3c5 0 7-10 12-10h3M3 7h3c2 0 3 1 4 3m4 4c1 2 2 3 4 3h3m-4-4 4 4-4 4"/>',
    flag:'<path d="M5 21V3m0 1c5-3 8 3 14 0v10c-6 3-9-3-14 0"/>', leaf:'<path d="M20 4C8 2 2 8 6 15s16 4 14-11ZM5 21 15 9"/>',
    book:'<path d="M12 6c-3-3-7-2-9-1v14c3-1 6-2 9 1 3-3 6-2 9-1V5c-2-1-6-2-9 1Zm0 0v14"/>', shield:'<path d="m12 3 8 3v6c0 5-8 9-8 9s-8-4-8-9V6l8-3Z"/><path d="m8 12 3 3 5-6"/>'
  };
  const icon = name => `<svg class="icon" viewBox="0 0 24 24" aria-hidden="true">${icons[name] || icons.arrow}</svg>`;
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const read = (key, fallback) => {try {return JSON.parse(localStorage.getItem(key)) ?? fallback;} catch {return fallback;}};
  let storageAvailable = true;
  function write(key, value) {try {localStorage.setItem(key, JSON.stringify(value));} catch {storageAvailable = false;document.getElementById('storage-warning').hidden = false;}}
  const candidate = read(keys.session, null);
  let session = core.validSession(candidate, bank) ? candidate : null;
  const savedHistory = read(keys.history, []);
  let history = Array.isArray(savedHistory) ? savedHistory.filter(s => core.validSession(s, bank) && s.completedAt).slice(0, 50) : [];
  let view = 'home', displaySession = null, reviewFilter = 'all', reviewIndex = 0;
  let setupConfig = {mode:'mixed', domain:'1', count:'20', set:'random'};
  let confirmCallback = null, lastTimerWarning = '';
  function save() {write(keys.session, session);}
  function announce(message) {document.getElementById('announcement').textContent = message;}
  function scrollTop() {window.scrollTo({top:0,behavior:'instant'});}
  function focusHeading(selector) {const el = document.querySelector(selector);if (el) {el.setAttribute('tabindex','-1');el.focus({preventScroll:true});}}
  function modeName(s) {return s.config.mode === 'exam' ? 'Exam simulation' : s.config.mode === 'domain' ? bank.domains[s.config.domain]?.name || 'Domain practice' : s.config.mode === 'retry' ? 'Missed questions' : 'Mixed practice';}
  function answeredCount(s) {return s.questionIds.filter(id => (s.config.mode === 'exam' || s.submitted[id]) && core.isAnswered(byId.get(id), s.answers[id])).length;}
  function dateLabel(value) {return new Date(value).toLocaleDateString(undefined,{month:'short',day:'numeric'});}
  function closeDialogs() {document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
  function blueprint() {return `<div class="study-board"><div class="board-top"><span class="board-label">YOUR NEXT MILESTONE</span><span class="board-edition">CLF–C02</span></div>
    <svg class="blueprint" viewBox="0 0 440 275" fill="none" role="img" aria-label="Four areas of knowledge, one Cloud Practitioner certification">
      <defs><pattern id="dots" width="17" height="17" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r=".7" fill="#c4c9ba"/></pattern></defs>
      <rect x="21" y="15" width="398" height="245" fill="url(#dots)"/>
      <ellipse cx="220" cy="141" rx="147" ry="90" stroke="#bdc5b4" stroke-dasharray="3 5"/>
      <path d="M96 70 220 130 344 70M96 209 220 150 344 209" stroke="#aeb8a3"/>
      <path d="m147 146 73-39 73 39v37l-73 39-73-39Z" fill="#dce1d1" stroke="#91a085"/>
      <path d="m147 146 73 39 73-39M220 185v37" stroke="#91a085"/>
      <path d="m147 125 73-39 73 39v20l-73 39-73-39Z" fill="#eef0e6" stroke="#91a085"/>
      <path d="m147 125 73 39 73-39M220 164v20" stroke="#91a085"/>
      <path d="m147 103 73-39 73 39v20l-73 39-73-39Z" fill="#faf9f0" stroke="#91a085"/>
      <path d="m147 103 73 39 73-39M220 142v20" stroke="#91a085"/>
      <path d="M202 107h34c9 0 12-10 5-14-2-12-20-13-25-3-10-6-21 4-14 11-6 0-7 6 0 6Z" fill="#f0b38b" stroke="#a96842"/>
      <g font-family="-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif" font-size="9" fill="#52604e" letter-spacing="1">
        <rect x="45" y="49" width="91" height="28" rx="4" fill="#f7f7ee" stroke="#c6cbbb"/><text x="57" y="67">01 / CONCEPTS</text>
        <rect x="301" y="49" width="94" height="28" rx="4" fill="#f7f7ee" stroke="#c6cbbb"/><text x="313" y="67">02 / SECURITY</text>
        <rect x="45" y="205" width="91" height="28" rx="4" fill="#f7f7ee" stroke="#c6cbbb"/><text x="57" y="223">03 / SERVICES</text>
        <rect x="301" y="205" width="94" height="28" rx="4" fill="#f7f7ee" stroke="#c6cbbb"/><text x="313" y="223">04 / PRICING</text>
      </g><circle cx="220" cy="32" r="4" fill="#d67842"/><path d="M213 32h-13m27 0h13" stroke="#c3c9b9"/>
    </svg><div class="board-bottom"><div class="board-stat"><strong>65</strong><small>questions on exam day</small></div><div class="board-stat"><strong>90 <span style="font-size:14px">min</span></strong><small>to make them count</small></div><div class="board-stat"><strong>700</strong><small>passing scaled score</small></div></div></div>`;}
  function renderHome() {
    view = 'home';displaySession = null;
    const resumable = session && !session.completedAt;
    main.innerHTML = `<div class="shell">${resumable ? `<div class="resume-banner"><div><strong>Your ${session.config.mode === 'exam' ? 'exam is still running' : 'study session is waiting'}.</strong><p>${answeredCount(session)} of ${session.questionIds.length} answered${session.config.mode === 'exam' ? ' · The timer continues while you’re away.' : ' · Pick up where you left off.'}</p></div><button class="btn btn-soft" data-action="resume">Resume ${icon('arrow')}</button></div>` : ''}
      <section class="hero"><div class="hero-copy"><div class="eyebrow"><span class="dot"></span> A study space for AWS CLF–C02</div><h1>Know the cloud.<br><em>Own the exam.</em></h1><p>Build your confidence, one question at a time. A thoughtful place to practice for the AWS Certified Cloud Practitioner exam.</p><div class="hero-actions"><button class="btn btn-primary" data-action="setup">Start practicing ${icon('arrow')}</button><a class="text-link" href="#domains">Explore the domains <span aria-hidden="true">↓</span></a></div><div class="hero-note">${icon('check')} No sign-up. Your progress stays on this device.</div></div>${blueprint()}</section>
      <div class="bank-strip"><span class="strip-label">Small sessions.<br>Solid foundations.</span><div class="strip-items"><span><strong>195</strong> practice questions</span><span><strong>4</strong> exam domains</span><span><strong>3</strong> ways to practice</span></div><span class="eyebrow strip-extra">Made for your next step ↗</span></div>
      <section id="domains"><div class="section-head"><div><div class="eyebrow">The exam, at a glance</div><h2>Four domains. One foundation.</h2></div><p>Learn the ideas behind the services.<br>Pick a domain to give it a little extra attention.</p></div><div class="domain-list">${Object.entries(bank.domains).map(([id,d])=>`<button class="domain-row" data-action="domain" data-domain="${id}" style="--domain-color:${colors[id]}" aria-label="Practice ${esc(d.name)}"><span class="domain-num">0${id}</span><span><span class="domain-title">${esc(d.name)}</span><span class="domain-description">${descriptions[id]}</span></span><span class="domain-weight"><span class="weight-bar"><i style="width:${d.exam_weight_percent*2}%"></i></span><strong>${d.exam_weight_percent}%</strong></span><span class="domain-arrow">${icon('up')}</span></button>`).join('')}</div><p class="footnote">Percentages reflect the official CLF-C02 exam’s scored content. Multiple-choice and multiple-response questions are included.</p></section>
      <section class="progress-section" id="progress">${renderProgress()}</section></div>`;
    if (window.innerWidth < 1050) document.querySelector('.strip-extra').hidden = true;
  }
  function renderProgress() {
    if (!history.length) return `<div class="empty-progress"><div class="mini-mark">${icon('leaf')}</div><div class="empty-copy"><h3>A little practice. A lot more confidence.</h3><p>Complete your first session to start seeing your progress here.</p></div><button class="text-link" data-action="setup">Find your starting point ${icon('arrow')}</button></div>`;
    const summaries = history.map(s=>core.summarize(s,bank));
    const correct = summaries.reduce((n,s)=>n+s.correct,0), total=summaries.reduce((n,s)=>n+s.total,0);
    const unique = new Set(history.flatMap(s=>s.questionIds.filter(id=>s.submitted[id] || (s.config.mode==='exam' && core.isAnswered(byId.get(id),s.answers[id]))))).size;
    return `<div class="section-head"><div><div class="eyebrow">Your progress</div><h2>It adds up.</h2></div><p>Recent sessions, saved in this browser.<br>Every explanation is another step forward.</p></div><div class="stats-grid"><div class="stat-card"><strong>${history.length}</strong><span>completed sessions</span></div><div class="stat-card"><strong>${Math.round(correct/total*100)}%</strong><span>overall accuracy</span></div><div class="stat-card"><strong>${unique}<span> / 195</span></strong><span>unique questions answered</span></div></div>${history.slice(0,5).map((s,i)=>`<div class="history-row"><div><strong>${esc(modeName(s))}</strong><p>${dateLabel(s.completedAt)} · ${s.questionIds.length} questions</p></div><span class="history-score">${summaries[i].percent}%</span><button class="text-link" data-action="history" data-id="${esc(s.id)}">View results ${icon('up')}</button></div>`).join('')}`;
  }
  function openSetup(domain) {
    if (domain) setupConfig = {...setupConfig,mode:'domain',domain};
    const dialog = document.getElementById('setup-dialog');
    dialog.innerHTML = `<div class="dialog-head"><div><div class="eyebrow">Make room for practice</div><h2 id="setup-title">How will you study today?</h2></div><button class="icon-btn" data-action="close" aria-label="Close practice setup">${icon('cross')}</button></div><form id="setup-form" class="dialog-content"><p class="dialog-intro">A focused refresher or the full experience. You set the pace.</p><fieldset class="options"><legend class="sr-only">Choose a practice mode</legend><div class="mode-list">${[['domain','grid','Focus on a domain','Spend some time with one of the four exam domains.'],['mixed','shuffle','Mix it up','A fresh selection of questions from across the bank.'],['exam','clock','Simulate exam day','65 questions. 90 minutes. Feedback at the finish.']].map(([mode,ic,title,description])=>`<label class="mode-option"><span class="mode-icon">${icon(ic)}</span><span><strong>${title}</strong><small>${description}</small></span><input type="radio" name="mode" value="${mode}" ${setupConfig.mode===mode?'checked':''}></label>`).join('')}</div></fieldset><div id="setup-details"></div></form>`;
    renderSetupDetails();dialog.showModal();focusHeading('#setup-title');
  }
  function renderSetupDetails() {
    const exam=setupConfig.mode==='exam';
    document.getElementById('setup-details').innerHTML = `<div class="setup-fields">${setupConfig.mode==='domain' ? `<label class="field full">Domain<select name="domain">${Object.entries(bank.domains).map(([id,d])=>`<option value="${id}" ${setupConfig.domain===id?'selected':''}>${id}. ${esc(d.name)} (${bank.questions.filter(q=>q.domain_id===id).length} questions)</option>`).join('')}</select></label>`:''}${exam ? `<label class="field full">Question selection<select name="set"><option value="random" ${setupConfig.set==='random'?'selected':''}>Fresh exam · balanced across domains</option>${['A','B','C'].map(id=>`<option value="${id}" ${setupConfig.set===id?'selected':''}>Practice Set ${id} · 65 questions</option>`).join('')}</select></label>` : `<label class="field">Session length<select name="count">${['10','20','30','50','all'].map(count=>`<option value="${count}" ${setupConfig.count===count?'selected':''}>${count==='all'?'All available':count+' questions'}</option>`).join('')}</select></label><div class="field">Your pace<span style="font-size:12px;font-weight:400;padding-top:9px;color:var(--muted)">Untimed · instant feedback</span></div>`}</div><p class="setup-note">${exam ? `Answers stay hidden until you submit. You can revisit questions and flag them for review. The clock keeps running if you leave.<br><strong>Practice pass: ${core.PRACTICE_PASS_PERCENT}%.</strong> All 65 questions count here. This is a study benchmark, not AWS’s scaled passing score of 700.` : 'Single-answer questions reveal feedback as soon as you choose. For multiple-answer questions, select the required options, then check your answer. Sessions never repeat a question; longer sessions use all questions available in the selected domain.'}</p><div class="dialog-bottom"><small>${exam?'Find a quiet spot. You’ve got this.':'Progress saves as you go.'}</small><button type="submit" class="btn btn-primary">${exam?'Begin 90-minute exam':'Let’s get started'} ${icon('arrow')}</button></div>`;
  }
  function startSession(config) {
    closeDialogs();session=core.createSession(bank,config);displaySession=null;lastTimerWarning='';save();view='quiz';renderQuestion();scrollTop();focusHeading('.question-prompt');
  }
  function confirmAction(title, copy, label, callback, cancel='Keep practicing') {
    const d=document.getElementById('confirm-dialog');confirmCallback=callback;
    d.innerHTML=`<div class="dialog-head"><h2 id="confirm-title" style="font-size:25px">${esc(title)}</h2><button class="icon-btn" data-action="close" aria-label="Close confirmation">${icon('cross')}</button></div><div class="dialog-content"><p class="confirm-copy">${copy}</p><div class="confirm-actions"><button class="btn btn-outline" data-action="close">${esc(cancel)}</button><button class="btn btn-primary" data-action="confirm">${esc(label)}</button></div></div>`;
    d.showModal();focusHeading('#confirm-title');
  }
  function requestStart(config) {
    document.getElementById('setup-dialog').close();
    if(session && !session.completedAt) confirmAction('Start a fresh session?', 'Your unfinished session will be replaced. Completed sessions will remain in your progress.', 'Start new session',()=>startSession(config),'Go back');
    else startSession(config);
  }
  function questionsForReview() {
    if (!displaySession) return [];
    if (reviewFilter==='missed') return core.summarize(displaySession,bank).missed;
    if (reviewFilter==='flagged') return displaySession.questionIds.filter(id=>displaySession.flags.includes(id));
    return displaySession.questionIds;
  }
  function feedbackMarkup(q, selected) {
    const correct=core.isCorrect(q,selected);
    const sources=q.source_refs.map(ref=>bank.sources[ref]).filter(source=>source?.url && /^https:\/\//.test(source.url));
    return `<section class="feedback-summary ${correct?'':'incorrect'}" aria-label="Answer explanation"><h3 tabindex="-1" id="feedback-heading">${icon(correct?'check':'book')}${correct?'That’s right.':selected.length?'A good one to revisit.':'Let’s fill in the gap.'}</h3><p>${esc(q.explanation)}</p></section>${sources.length?`<details class="sources"><summary>Go a little deeper · official references</summary>${sources.map(source=>`<a href="${esc(source.url)}" target="_blank" rel="noopener noreferrer">${esc(source.title)} ↗</a>`).join('')}</details>`:''}`;
  }
  function mapMarkup(s, currentId, review=false) {
    const ids=review?questionsForReview():s.questionIds;
    return `<div class="question-map">${ids.map((id,index)=>{const answered=(s.config.mode==='exam'||s.submitted[id])&&core.isAnswered(byId.get(id),s.answers[id]);return `<button class="map-button ${answered?'answered':''} ${id===currentId?'current':''} ${s.flags.includes(id)?'flagged':''}" data-action="jump" data-index="${index}" aria-label="Question ${s.questionIds.indexOf(id)+1}, ${answered?'answered':'unanswered'}${s.flags.includes(id)?', flagged':''}" ${id===currentId?'aria-current="step"':''}>${s.questionIds.indexOf(id)+1}</button>`;}).join('')}</div><div class="map-legend"><span><i class="legend-square"></i> Answered</span><span><i class="legend-dot"></i> Flagged</span></div>`;
  }
  function renderQuestion() {
    const review=view==='review', s=review?displaySession:session;
    if (!s) {renderHome();return;}
    if (!review && s.completedAt) {renderResults(s);return;}
    const ids=review?questionsForReview():s.questionIds;
    const idx=review?Math.min(reviewIndex,Math.max(0,ids.length-1)):s.currentIndex;
    const id=ids[idx], q=byId.get(id), exam=s.config.mode==='exam', locked=review||!!s.submitted[id];
    const selected=s.answers[id]||[], count=answeredCount(s);
    const reviewHeader=`<div class="review-banner"><span>Answer review · ${ids.length} ${ids.length===1?'question':'questions'}</span><label><span class="sr-only">Filter answer review</span><select id="review-filter"><option value="all" ${reviewFilter==='all'?'selected':''}>All questions</option><option value="missed" ${reviewFilter==='missed'?'selected':''}>Incorrect & unanswered</option><option value="flagged" ${reviewFilter==='flagged'?'selected':''}>Flagged questions</option></select></label></div>`;
    main.innerHTML=`<div class="shell room"><div class="room-top"><div class="room-breadcrumb"><button class="text-link" data-action="${review?'results':'leave'}">${icon('back')} ${review?'Results':'Overview'}</button><span>/</span><strong>${review?'Answer review':esc(modeName(s))}</strong></div><div class="room-top-actions">${!review?`<span class="save-note">${icon('check')} ${storageAvailable?'Saved on this device':'Session in memory'}</span>`:''}${exam&&!review?`<div class="timer" role="timer" aria-label="Time remaining"><span>${icon('clock')}</span><span id="timer-value">${core.formatTime(core.remainingSeconds(s))}</span></div>`:''}<button class="mobile-map" data-action="map">${icon('grid')} ${count}/${s.questionIds.length}</button></div></div>${review?reviewHeader:''}${!q?`<div class="empty-review"><h2>Nothing to review here.</h2><p>${reviewFilter==='flagged'?'You didn’t flag any questions in this session.':'You answered every question correctly. Nicely done.'}</p><button class="btn btn-outline" data-action="results">Back to results</button></div>`:`<div class="room-grid"><div><article class="question-panel"><div class="question-progress"><i style="width:${(idx+1)/ids.length*100}%"></i></div><div class="question-body"><div class="question-meta"><span class="domain-tag" style="--domain-color:${colors[q.domain_id]}"><i></i>${esc(bank.domains[q.domain_id].name)}</span><span>Question ${idx+1} of ${ids.length}</span></div><h1 class="question-prompt" id="question-title">${esc(q.prompt)}</h1><div class="instruction">${q.selection_count>1?`<span class="multi-chip">Choose ${q.selection_count}</span>`:''}<span>${esc(q.instruction)}</span>${q.selection_count>1&&!locked?'<span id="selection-count">'+selected.length+' selected</span>':''}</div><fieldset class="options" aria-labelledby="question-title"><legend class="sr-only">Answer options</legend>${q.options.map(option=>{const chosen=selected.includes(option.id);return `<label class="answer-option ${locked?'locked '+(option.is_correct?'correct-answer':chosen?'wrong-answer':''):''}"><input type="${q.selection_count>1?'checkbox':'radio'}" name="answer" value="${option.id}" ${chosen?'checked':''} ${locked?'disabled':''}><span class="option-letter">${locked&&(chosen||option.is_correct)?icon(option.is_correct?'check':'cross'):option.id}</span><span class="option-main"><span class="option-text">${esc(option.text)}</span>${locked?`<span class="option-feedback"><strong>${chosen?'Your answer'+(option.is_correct?' · correct':' · incorrect'):option.is_correct?'Correct answer · not selected':'Not selected'}</strong>${esc(chosen?option.feedback_when_selected:option.feedback_when_omitted)}</span>`:''}</span>${!locked&&chosen?'<span class="answer-state">Selected</span>':''}</label>`;}).join('')}</fieldset>${locked?feedbackMarkup(q,selected):'<div class="selection-message" id="selection-message" role="status"></div>'}</div><div class="question-footer"><div class="footer-left"><button class="btn btn-outline" data-action="previous" ${idx===0?'disabled':''}>${icon('back')} Previous</button>${!review?`<button class="flag-button ${s.flags.includes(id)?'active':''}" data-action="flag" aria-pressed="${s.flags.includes(id)}" aria-label="Flag question for review">${icon('flag')}<span>${s.flags.includes(id)?'Flagged':'Flag for review'}</span></button>`:''}</div><div style="display:flex;gap:10px;align-items:center">${!review&&!exam&&!locked&&q.selection_count>1?`<button class="text-link" data-action="skip">Skip</button><button class="btn btn-primary" id="check-answer" data-action="check" ${selected.length!==q.selection_count?'disabled':''}>Check answer</button>`:`<button class="btn ${!exam&&!locked?'btn-outline':'btn-primary'}" data-action="next">${idx===ids.length-1?(review?'Back to results':exam?'Review & finish':'Finish session'):!exam&&!locked?'Skip question':'Next question'} ${icon('arrow')}</button>`}</div></div></article><p class="room-helper">${review?'Review the reasoning behind every option.':exam?'Answers can be changed until submission. No feedback is shown during the exam.':locked?'Take a moment with the explanation. Understanding is the point.':q.selection_count>1?'Choose the required number of answers, then check your selection.':'Choose an answer to see the explanation.'}</p>${!review?'<button class="text-link mobile-map" style="margin:18px auto 0;border:0" data-action="finish">'+(exam?'Finish exam':'Finish session')+'</button>':''}</div><aside class="room-sidebar"><div class="side-card"><div class="eyebrow">${review?'Look back. Learn more.':exam?'The exam room':'Your practice room'}</div><h3>${review?'Make it stick.':exam?'One question<br>at a time.':'Curiosity over<br>perfection.'}</h3><p>${review?'A missed question is a useful place to spend a little more time.':exam?'Take your time. Flag anything you want to come back to.':exam?'':'Read the question, make your choice, and learn the why.'}</p><div class="session-count"><strong>${count}<span> / ${s.questionIds.length}</span></strong><span>answered</span></div><div class="mini-progress"><i style="width:${count/s.questionIds.length*100}%"></i></div><div id="desktop-map">${mapMarkup(s,id,review)}</div><button class="btn btn-outline finish-link" data-action="${review?'results':'finish'}">${review?'Back to results':exam?'Finish exam':'Finish session'}</button></div><div class="exam-info">${exam?'90 minutes · 65 questions<br>Exact-match scoring for multiple answers. Unanswered questions receive no credit.':'A question is a starting point.<br>The explanation is where it clicks.'}</div></aside></div>`}</div>`;
    tick();
  }
  function chooseAnswer(value, input) {
    if (view!=='quiz'||!session||session.completedAt) return;
    if(session.config.mode==='exam'&&core.remainingSeconds(session)===0) {finishSession(true);return;}
    const q=byId.get(session.questionIds[session.currentIndex]);
    if(session.submitted[q.id]) return;
    let selected=[...(session.answers[q.id]||[])];
    if(q.selection_count===1) selected=[value];
    else if(selected.includes(value)) selected=selected.filter(id=>id!==value);
    else if(selected.length<q.selection_count) selected.push(value);
    else {if(input)input.checked=false;const message=`Choose exactly ${q.selection_count}. Unselect an option before choosing another.`;document.getElementById('selection-message').textContent=message;announce(message);return;}
    session.answers[q.id]=selected;save();
    if(session.config.mode!=='exam'&&q.selection_count===1) {commitAnswer();return;}
    const countNode=document.getElementById('selection-count');if(countNode)countNode.textContent=`${selected.length} selected`;
    const check=document.getElementById('check-answer');if(check)check.disabled=selected.length!==q.selection_count;
    const message=document.getElementById('selection-message');if(message)message.textContent='';
    // Update progress without replacing the focused answer control.
    const count=answeredCount(session), map=document.getElementById('desktop-map');
    if(map)map.innerHTML=mapMarkup(session,q.id);
    const number=document.querySelector('.session-count strong');if(number)number.innerHTML=`${count}<span> / ${session.questionIds.length}</span>`;
    const bar=document.querySelector('.mini-progress i');if(bar)bar.style.width=`${count/session.questionIds.length*100}%`;
    const mobile=document.querySelector('.room-top .mobile-map');if(mobile)mobile.innerHTML=`${icon('grid')} ${count}/${session.questionIds.length}`;
    document.querySelectorAll('.answer-state').forEach(el=>el.remove());
  }
  function commitAnswer() {
    const q=byId.get(session.questionIds[session.currentIndex]);
    if(!core.isAnswered(q,session.answers[q.id]))return;
    session.submitted[q.id]=true;save();renderQuestion();focusHeading('#feedback-heading');announce(core.isCorrect(q,session.answers[q.id])?'Correct answer. Explanation shown.':'Not quite. Explanation shown.');
  }
  function moveQuestion(index) {
    if(view==='review') {reviewIndex=index;} else {session.currentIndex=index;save();}
    document.getElementById('map-dialog').close();renderQuestion();scrollTop();focusHeading('.question-prompt');
  }
  function requestFinish() {
    if(!session||session.completedAt)return;
    const unanswered=session.questionIds.length-answeredCount(session), exam=session.config.mode==='exam';
    confirmAction(exam?'Ready to submit your exam?':'Finish this practice session?', `${unanswered?`<strong>${unanswered} ${unanswered===1?'question is':'questions are'} unanswered.</strong> Unanswered or unchecked questions receive no credit. `:'You’ve answered every question. '}You’ll see your score, domain breakdown, and explanations after you finish.`,exam?'Submit exam':'See my results',()=>finishSession(false));
  }
  function finishSession(timedOut=false) {
    if(!session||session.completedAt)return;
    closeDialogs();
    if(session.config.mode!=='exam')for(const id of session.questionIds)if(!session.submitted[id])delete session.answers[id];
    session.completedAt=timedOut?session.deadline:Date.now();session.timedOut=timedOut;
    history=[session,...history.filter(s=>s.id!==session.id)].slice(0,50);write(keys.history,history);save();renderResults(session);scrollTop();focusHeading('.results-title');announce(timedOut?'Time is up. Your exam has been submitted.':'Session complete. Your results are ready.');
  }
  function renderResults(s) {
    view='results';displaySession=s;
    const result=core.summarize(s,bank), exam=s.config.mode==='exam';
    const elapsed=Math.max(0,Math.floor((s.completedAt-s.startedAt)/1000));
    const ranked=Object.entries(result.domains).filter(([,d])=>d.total).sort((a,b)=>a[1].correct/a[1].total-b[1].correct/b[1].total);
    const weakest=ranked[0];
    main.innerHTML=`<div class="results"><button class="text-link" data-action="home">${icon('back')} Back to overview</button><div class="eyebrow" style="margin-top:30px">${esc(modeName(s))} · Session complete</div><h1 class="results-title">${exam?'Your exam, in perspective.':'Another step forward.'}</h1><p class="results-intro">${s.timedOut?'Time’s up. Your answers were submitted automatically.':exam?'The clock has stopped. Now make the review count.':'Keep what clicked. Revisit what didn’t. That’s how it adds up.'}</p><div class="result-hero"><div class="score-ring" style="--score:${result.percent}%"><div class="score-ring-inner"><strong>${result.percent}%</strong><small>${result.correct} of ${result.total} correct</small></div></div><div><span class="result-badge">${exam?(result.passed?'Practice pass':'Below practice target'):'Practice complete'}</span><h2>${result.percent===100?'Everything clicked.':result.passed?'A solid step forward.':'You know where to grow.'}</h2><p>${exam?`You ${result.passed?'met':'did not meet'} this simulator’s ${core.PRACTICE_PASS_PERCENT}% practice benchmark.`:'Every question you understand is progress.'}<br>${result.missed.length?'Your answer review is ready, with explanations for every option.':'Keep the momentum with a new mix of questions.'}</p><div class="result-metrics"><span><strong>${core.formatTime(elapsed)}</strong> elapsed</span><span><strong>${result.total-result.correct-result.unanswered}</strong> incorrect</span><span><strong>${result.unanswered}</strong> unanswered</span></div></div></div>${exam?`<div class="score-disclaimer"><strong>A practice result, not an official AWS result.</strong> This simulator scores all 65 questions and uses a ${core.PRACTICE_PASS_PERCENT}% raw-score benchmark. AWS scores 50 questions, includes 15 unscored questions, and requires a scaled score of 700 on a 100–1,000 scale. Raw percentages cannot be converted to AWS scaled scores or guarantee a pass. <a href="https://docs.aws.amazon.com/aws-certification/latest/cloud-practitioner-02/cloud-practitioner-02.html#cloud-practitioner-02-exam-content" target="_blank" rel="noopener noreferrer">About exam scoring ↗</a></div>`:''}<div class="results-actions"><button class="btn btn-primary" data-action="review">Review answers ${icon('arrow')}</button>${result.missed.length?'<button class="btn btn-outline" data-action="retry">Retry missed questions</button>':''}<button class="text-link" data-action="setup">Start a new session ${icon('up')}</button></div><div class="breakdown"><h3>A closer look at the domains</h3>${Object.entries(result.domains).map(([id,d])=>`<div class="breakdown-row"><span class="breakdown-name">${esc(bank.domains[id].name)}</span><span class="breakdown-bar"><i style="width:${d.total?d.correct/d.total*100:0}%;background:${colors[id]}"></i></span><span>${d.total?`${d.correct} / ${d.total}`:'—'}</span></div>`).join('')}<p class="footnote">Correct answers / questions in this session. Multiple-answer questions earn credit only when all required answers, and no others, are selected.</p>${weakest&&weakest[1].correct<weakest[1].total?`<p class="next-focus">A useful next step: spend a little more time on <strong>${esc(bank.domains[weakest[0]].name)}</strong>. <button class="text-link" data-action="domain" data-domain="${weakest[0]}">Practice this domain ${icon('arrow')}</button></p>`:''}</div></div>`;
  }
  function tick() {
    if(!session||session.completedAt||session.config.mode!=='exam')return;
    const remaining=core.remainingSeconds(session);
    if(remaining<=0) {finishSession(true);return;}
    const el=document.getElementById('timer-value');if(el){el.textContent=core.formatTime(remaining);el.closest('.timer').classList.toggle('low',remaining<=300);}
    const warning=remaining<=60?'1 minute':remaining<=300?'5 minutes':'';
    if(warning&&warning!==lastTimerWarning){lastTimerWarning=warning;announce(`${warning} remaining in your exam.`);}
  }
  function goHome(anchor='') {
    const navigate=()=>{renderHome();if(anchor)document.getElementById(anchor)?.scrollIntoView();else scrollTop();};
    if(view==='quiz'&&session&&!session.completedAt) confirmAction('Take a moment?',session.config.mode==='exam'?'Your answers are saved, but the exam timer will keep running. If time runs out, your answers will be submitted automatically.':'Your answers and place will be saved. You can resume from the overview.', 'Save & leave',navigate);
    else navigate();
  }
  document.addEventListener('click',event=>{
    const el=event.target.closest('[data-action]');if(!el||el.disabled)return;
    event.preventDefault();const action=el.dataset.action;
    if(action==='setup'){openSetup();return;}
    if(action==='domain'){openSetup(el.dataset.domain);return;}
    if(action==='close'){el.closest('dialog').close();return;}
    if(action==='confirm'){document.getElementById('confirm-dialog').close();const fn=confirmCallback;confirmCallback=null;fn?.();return;}
    if(action==='home'||action==='leave'){goHome();return;}
    if(action==='domains'||action==='progress'){goHome(action);return;}
    if(action==='resume'){view='quiz';renderQuestion();scrollTop();return;}
    if(action==='history'){const found=history.find(s=>s.id===el.dataset.id);if(found){renderResults(found);scrollTop();}return;}
    if(action==='results'){renderResults(displaySession);scrollTop();return;}
    if(action==='review'){reviewIndex=0;reviewFilter='all';view='review';renderQuestion();scrollTop();focusHeading('.question-prompt');return;}
    if(action==='retry'){const ids=core.summarize(displaySession,bank).missed;requestStart({mode:'retry',questionIds:ids,count:'all'});return;}
    if(action==='finish'){requestFinish();return;}
    if(action==='check'){commitAnswer();return;}
    if(action==='previous'){moveQuestion((view==='review'?reviewIndex:session.currentIndex)-1);return;}
    if(action==='next'||action==='skip'){
      const index=view==='review'?reviewIndex:session.currentIndex;
      const length=view==='review'?questionsForReview().length:session.questionIds.length;
      if(index===length-1){if(view==='review'){renderResults(displaySession);scrollTop();}else requestFinish();}
      else moveQuestion(index+1);return;
    }
    if(action==='flag'){
      const id=session.questionIds[session.currentIndex];session.flags=session.flags.includes(id)?session.flags.filter(q=>q!==id):[...session.flags,id];save();
      renderQuestion();document.querySelector('.flag-button')?.focus({preventScroll:true});return;
    }
    if(action==='jump'){moveQuestion(Number(el.dataset.index));return;}
    if(action==='map'){
      const review=view==='review',s=review?displaySession:session,ids=review?questionsForReview():s.questionIds;
      const currentId=ids[review?reviewIndex:s.currentIndex],d=document.getElementById('map-dialog');
      d.innerHTML=`<div class="dialog-head"><div><div class="eyebrow">Find your place</div><h2 id="map-title">Your questions</h2></div><button class="icon-btn" data-action="close" aria-label="Close question navigator">${icon('cross')}</button></div><div class="dialog-content">${mapMarkup(s,currentId,review)}<p class="footnote">Choose a number to jump to that question.</p></div>`;d.showModal();return;
    }
  });
  document.addEventListener('change',event=>{
    const el=event.target;
    if(el.name==='mode'){setupConfig.mode=el.value;renderSetupDetails();}
    else if(['domain','count','set'].includes(el.name))setupConfig[el.name]=el.value;
    else if(el.name==='answer')chooseAnswer(el.value,el);
    else if(el.id==='review-filter'){reviewFilter=el.value;reviewIndex=0;renderQuestion();document.getElementById('review-filter')?.focus({preventScroll:true});}
  });
  document.addEventListener('submit',event=>{if(event.target.id==='setup-form'){event.preventDefault();requestStart({...setupConfig});}});
  // A click outside the dialog dismisses it; native dialog handles Escape and focus return.
  document.querySelectorAll('dialog').forEach(dialog=>dialog.addEventListener('click',event=>{
    if(event.target!==dialog)return;const box=dialog.getBoundingClientRect();
    if(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom)dialog.close();
  }));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)tick();});
  setInterval(tick,1000);
  if(session&&!session.completedAt){view='quiz';renderQuestion();}
  else renderHome();
})();
