/* Pure quiz rules, shared by the browser and the Node tests. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.QuizCore = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const EXAM_MINUTES = 90;
  const PRACTICE_PASS_PERCENT = 70;
  function shuffle(items, random = Math.random) {
    const result = [...items];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
  function selectQuestions(bank, config, random = Math.random) {
    let pool;
    if (config.mode === 'exam') {
      if (['A', 'B', 'C'].includes(config.set)) pool = bank.questions.filter(q => q.set_id === config.set);
      else pool = Object.entries({1: 16, 2: 19, 3: 22, 4: 8}).flatMap(([domain, count]) => shuffle(bank.questions.filter(q => q.domain_id === domain), random).slice(0, count));
      if (pool.length !== 65) throw new Error('A full exam requires 65 questions.');
      return shuffle(pool, random).map(q => q.id);
    }
    if (config.mode === 'retry') pool = bank.questions.filter(q => config.questionIds.includes(q.id));
    else pool = config.mode === 'domain' ? bank.questions.filter(q => q.domain_id === config.domain) : bank.questions;
    const count = config.count === 'all' || config.mode === 'retry' ? pool.length : Math.min(Number(config.count) || 20, pool.length);
    if (!pool.length || count < 1) throw new Error('No questions are available for this session.');
    return shuffle(pool, random).slice(0, count).map(q => q.id);
  }
  function isCorrect(question, selected = []) {
    return new Set(selected).size === question.correct_option_ids.length && selected.length === question.correct_option_ids.length && question.correct_option_ids.every(id => selected.includes(id));
  }
  function isAnswered(question, selected = []) {
    return selected.length === question.selection_count && new Set(selected).size === selected.length && selected.every(id => question.options.some(o => o.id === id));
  }
  function summarize(session, bank) {
    const lookup = new Map(bank.questions.map(q => [q.id, q]));
    const domains = Object.fromEntries(Object.keys(bank.domains).map(id => [id, {total: 0, correct: 0}]));
    let correct = 0, answered = 0;
    const missed = [];
    for (const id of session.questionIds) {
      const question = lookup.get(id), selected = session.answers[id] || [];
      domains[question.domain_id].total++;
      if (isAnswered(question, selected)) answered++;
      if (isCorrect(question, selected)) { correct++; domains[question.domain_id].correct++; }
      else missed.push(id);
    }
    const total = session.questionIds.length, percent = Math.round(correct / total * 100);
    return {correct, total, answered, unanswered: total - answered, percent, passed: correct / total * 100 >= PRACTICE_PASS_PERCENT, missed, domains};
  }
  function createSession(bank, config, now = Date.now(), random = Math.random) {
    return {version: 1, bankVersion: bank.bank_version, id: `session-${now}-${random().toString(36).slice(2, 10)}`, config: {...config}, questionIds: selectQuestions(bank, config, random), answers: {}, submitted: {}, flags: [], currentIndex: 0, startedAt: now, deadline: config.mode === 'exam' ? now + EXAM_MINUTES * 60 * 1000 : null, completedAt: null, timedOut: false};
  }
  function remainingSeconds(session, now = Date.now()) { return Math.max(0, Math.ceil((session.deadline - now) / 1000)); }
  function formatTime(seconds) {
    const s = Math.max(0, Math.floor(seconds));
    return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;
  }
  function validSession(s, bank) {
    if (!s || s.version !== 1 || s.bankVersion !== bank.bank_version || typeof s.id !== 'string' || !['domain','mixed','exam','retry'].includes(s.config?.mode) || !Array.isArray(s.questionIds) || !s.questionIds.length || s.questionIds.length > bank.questions.length || new Set(s.questionIds).size !== s.questionIds.length) return false;
    const lookup = new Map(bank.questions.map(q => [q.id, q]));
    if (!s.questionIds.every(id => lookup.has(id)) || !s.answers || typeof s.answers !== 'object' || !s.submitted || typeof s.submitted !== 'object' || !Array.isArray(s.flags) || !s.flags.every(id => s.questionIds.includes(id))) return false;
    if (!Number.isInteger(s.currentIndex) || s.currentIndex < 0 || s.currentIndex >= s.questionIds.length || !Number.isFinite(s.startedAt) || (s.completedAt !== null && (!Number.isFinite(s.completedAt) || s.completedAt < s.startedAt))) return false;
    if (s.config.mode === 'exam' && (s.questionIds.length !== 65 || !Number.isFinite(s.deadline) || s.deadline !== s.startedAt + EXAM_MINUTES * 60000)) return false;
    return Object.entries(s.answers).every(([id, values]) => s.questionIds.includes(id) && Array.isArray(values) && new Set(values).size === values.length && values.length <= lookup.get(id).selection_count && values.every(value => lookup.get(id).options.some(o => o.id === value)));
  }
  return {EXAM_MINUTES, PRACTICE_PASS_PERCENT, shuffle, selectQuestions, isCorrect, isAnswered, summarize, createSession, remainingSeconds, formatTime, validSession};
});
