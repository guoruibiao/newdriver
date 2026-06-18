// 复制粘贴到浏览器 console 跑判分测试
(function(){
  const t = window.game.__test;
  const assert = (cond, msg) => { if (!cond) { console.error('FAIL: ' + msg); throw new Error(msg); } else console.log('PASS: ' + msg); };

  const L1 = t.levels[0];
  const dp = L1.decisionPoints[0];
  const sigState = { 'sig-n': 'red' };

  // L1: 红灯时直行 -> 错
  let r = t.evaluateDecision(dp, 'pass-through', { 'sig-n': 'red' });
  assert(r.correct === false, 'L1 红灯 pass-through 应判错');
  assert(r.deduct === 30, 'L1 红灯 pass-through 应扣 30');
  assert(r.explanationKey === 'red-light-stop', 'explanationKey 应为 red-light-stop');

  // L1: 绿灯时直行 -> 对
  r = t.evaluateDecision(dp, 'pass-through', { 'sig-n': 'green' });
  assert(r.correct === true, 'L1 绿灯 pass-through 应判对');
  assert(r.deduct === 0, 'L1 绿灯 pass-through 不扣分');
  assert(r.explanationKey === 'green-light-go', 'explanationKey 应为 green-light-go');

  // L1: 任何时候停车 -> 对
  r = t.evaluateDecision(dp, 'stop', sigState);
  assert(r.correct === true && r.deduct === 0, 'L1 stop 永远正确');

  // 未知动作
  r = t.evaluateDecision(dp, 'fly', sigState);
  assert(r.correct === false && r.explanationKey === 'unknown-action', '未知动作返回 unknown-action');

  console.log('All Task 7 tests passed ✓');
})();
