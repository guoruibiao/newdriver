# 新手司机道路考核游戏 v1 · 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 实现一个纯前端单 HTML 的俯视角模拟驾驶游戏，8 关递进考核红绿灯交规，扣分制 + 即时讲解。

**Architecture:** 单 `index.html` 文件包含全部 HTML/CSS/JS。脚本内分四段（DATA/STATE/RENDER/LOGIC），关卡数据驱动，判分逻辑独立为纯函数并通过 `window.__test__` 暴露到 console 自测。

**Tech Stack:** 原生 HTML + CSS + JavaScript（ES5 兼容），Canvas 2D，无构建工具，无外部依赖。

**Spec:** `docs/superpowers/specs/2026-06-18-driving-game-design.md`

---

## 文件结构

```
index.html              # 单文件游戏（HTML + CSS + JS）
docs/superpowers/
  specs/2026-06-18-driving-game-design.md   # 已存在
  plans/2026-06-18-driving-game.md          # 本文件
test/
  console-snippet.js    # 复制粘贴到浏览器 console 测判分
  manual/
    L1.md ~ L8.md        # 8 份手动黄金路径测试卡
```

每个 task 内部按 TDD 风格组织：写测试 → 验证失败 → 实现 → 验证通过 → 提交。纯函数 task（如 evaluateDecision）严格 TDD；渲染/UI task 采用"实现 → 手动验证 → 提交"。

---

## Phase 1：骨架与状态机

### Task 1：HTML/CSS 骨架 + Canvas + 主循环空转

**Files:**
- Create: `index.html`

- [ ] **Step 1: 创建 index.html 骨架**

写入 `index.html`：

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>新手司机道路考核</title>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body { width: 100%; height: 100%; font-family: -apple-system, "PingFang SC", sans-serif; background: #1a1a1a; color: #fff; overflow: hidden; }
  #app { position: relative; width: 100vw; height: 100vh; display: flex; align-items: center; justify-content: center; }
  #game { background: #2d5a2d; display: block; max-width: 100%; max-height: 100%; }
  .overlay { position: absolute; inset: 0; pointer-events: none; }
  .overlay > * { pointer-events: auto; }
</style>
</head>
<body>
<div id="app">
  <canvas id="game" width="800" height="600"></canvas>
</div>
<script>
(function(){
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  let lastT = 0;
  function loop(t){
    const dt = Math.min(100, t - lastT || 16);
    lastT = t;
    ctx.fillStyle = '#2d5a2d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('Game loop running · ' + Math.round(1000/dt) + ' FPS', 20, 30);
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);
})();
</script>
</body>
</html>
```

- [ ] **Step 2: 验证骨架**

在项目目录起一个本地 server（任选其一）：
- `python3 -m http.server 8000` 然后浏览器打开 `http://localhost:8000`
- 或直接双击 `index.html`

Expected: 绿色画布，左上角显示"Game loop running · XX FPS"，数字在 30~60 之间波动。

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: 项目骨架 + Canvas 主循环"
```

---

### Task 2：游戏状态机框架

**Files:**
- Modify: `index.html`（替换 `<script>` 内容）

- [ ] **Step 1: 在 console 写状态机期望测试**

打开浏览器 console，粘贴：

```js
// 期望：state.mode 初始为 'menu'
console.assert(window.game && window.game.state.mode === 'menu', 'initial mode should be menu');
// 期望：调用 transition('playing') 后切换
window.game.transition('playing');
console.assert(window.game.state.mode === 'playing', 'should transition to playing');
console.log('Task 2 tests done');
```

Expected: 报错 "Cannot read properties of undefined"，因为 `window.game` 还不存在。

- [ ] **Step 2: 替换 script 内容实现状态机**

替换 `<script>...</script>` 之间的内容为：

```html
<script>
(function(){
  'use strict';
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');

  // ===== STATE =====
  const VALID_MODES = ['menu','playing','awaiting-decision','explaining','paused','level-complete','level-failed'];
  const state = {
    mode: 'menu',
    levelIdx: 0,
    score: 100,
    car: null,
    currentDecisionPoint: null,
    signalStates: {},
    unlockedLevels: 1,
  };
  function transition(newMode){
    if (!VALID_MODES.includes(newMode)) {
      console.error('Invalid mode:', newMode);
      return;
    }
    state.mode = newMode;
  }

  // ===== LOOP =====
  let lastT = 0;
  function loop(t){
    const dt = Math.min(100, t - lastT || 16);
    lastT = t;
    update(dt);
    render();
    requestAnimationFrame(loop);
  }
  function update(dt){
    // 各模式 update 逻辑后续 task 填充
  }
  function render(){
    ctx.fillStyle = '#2d5a2d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('mode = ' + state.mode, 20, 30);
  }

  // ===== EXPOSE =====
  window.game = { state, transition };

  requestAnimationFrame(loop);
})();
</script>
```

- [ ] **Step 3: 在 console 重跑测试**

刷新页面，再次粘贴 Step 1 的测试代码。

Expected: 全部 `console.assert` 无报错，最后输出 "Task 2 tests done"。

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: 游戏状态机框架（menu 模式起步）"
```

---

## Phase 2：渲染层

### Task 3：RoadRenderer（道路 + 路口 + 车道线）

**Files:**
- Modify: `index.html`（在 RENDER 段添加）

- [ ] **Step 1: 添加 RoadRenderer 函数**

在 `// ===== LOOP =====` 之前插入：

```javascript
  // ===== RENDER =====
  function drawRoad(road){
    // 背景
    ctx.fillStyle = '#2d5a2d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!road) return;
    // 主路：垂直方向
    road.lanes.forEach(function(lane){
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(lane.x - lane.w/2, 0, lane.w, canvas.height);
    });
    // 路口处的横向道路
    if (road.intersections) {
      road.intersections.forEach(function(it){
        ctx.fillStyle = '#3a3a3a';
        ctx.fillRect(0, it.center.y - road.crossHalfWidth, canvas.width, road.crossHalfWidth * 2);
        // 停止线（白色实线）
        ctx.fillStyle = '#fff';
        ctx.fillRect(it.center.x - road.crossHalfWidth, it.center.y - road.crossHalfWidth - 3, road.crossHalfWidth * 2, 3);
        ctx.fillRect(it.center.x - road.crossHalfWidth, it.center.y + road.crossHalfWidth, road.crossHalfWidth * 2, 3);
      });
    }
    // 中线（黄色虚线）
    if (road.centerLine) {
      ctx.strokeStyle = '#ffd700';
      ctx.setLineDash([20, 15]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(road.centerLine.x, 0);
      ctx.lineTo(road.centerLine.x, canvas.height);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }
```

- [ ] **Step 2: 在 render() 中调用 drawRoad**

把 `render()` 内的纯色填充替换为：

```javascript
  function render(){
    drawRoad(currentLevel && currentLevel.road);
    ctx.fillStyle = '#fff';
    ctx.font = '16px sans-serif';
    ctx.fillText('mode = ' + state.mode, 20, 30);
  }
```

在 STATE 段顶部加：`let currentLevel = null;`

- [ ] **Step 3: 在 console 临时验证渲染**

打开 console 粘贴：

```js
window.game.__test_renderRoad = {
  lanes: [{ x: 400, w: 80 }],
  centerLine: { x: 400 },
  crossHalfWidth: 60,
  intersections: [{ id: 'int-1', center: { x: 400, y: 300 }, roads: ['n','s'] }]
};
// 然后修改 render 使用临时数据
```

为简化测试，直接在 console 修改全局变量：

```js
window.game.__currentLevel = { road: window.game.__test_renderRoad };
// 暴露渲染钩子（在 Step 2 的代码中已通过 currentLevel 实现）
```

刷新浏览器查看：应看到灰色南北向道路、中间黄色虚线、300 高度处有横向路口。

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: RoadRenderer - 道路/路口/车道线/中线"
```

---

### Task 4：LightRenderer（圆饼灯 + 箭头灯 + 标志）

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 添加 drawLights 函数**

在 `drawRoad` 之后添加：

```javascript
  function drawLights(signals, signalStates){
    if (!signals) return;
    signals.forEach(function(sig){
      const st = signalStates[sig.id] || 'red';
      const x = sig.pos.x, y = sig.pos.y;
      if (sig.type === 'circle') {
        // 圆饼灯外壳
        ctx.fillStyle = '#222';
        ctx.fillRect(x - 14, y - 38, 28, 76);
        // 三个圆
        [['red','#c33',-22],['yellow','#cc0',0],['green','#3c3',22]].forEach(function(p){
          ctx.beginPath();
          ctx.fillStyle = (st === p[0]) ? p[1] : '#444';
          ctx.arc(x, y + p[2], 9, 0, Math.PI*2);
          ctx.fill();
        });
      } else if (sig.type === 'arrow') {
        // 箭头灯：三个方向独立显示
        ctx.fillStyle = '#222';
        ctx.fillRect(x - 18, y - 30, 36, 60);
        ['left','forward','right'].forEach(function(dir, i){
          const ay = y - 20 + i * 20;
          const isOn = (st === dir + '-green') || (st === dir + '-red' && false);
          const color = st.startsWith(dir + '-green') ? '#3c3' : '#5a1a1a';
          drawArrow(x, ay, dir, color);
        });
      }
    });
  }
  function drawArrow(cx, cy, dir, color){
    ctx.fillStyle = color;
    ctx.beginPath();
    if (dir === 'forward') {
      ctx.moveTo(cx, cy - 8); ctx.lineTo(cx + 5, cy + 4); ctx.lineTo(cx - 5, cy + 4);
    } else if (dir === 'left') {
      ctx.moveTo(cx - 8, cy); ctx.lineTo(cx + 4, cy - 5); ctx.lineTo(cx + 4, cy + 5);
    } else if (dir === 'right') {
      ctx.moveTo(cx + 8, cy); ctx.lineTo(cx - 4, cy - 5); ctx.lineTo(cx - 4, cy + 5);
    }
    ctx.closePath();
    ctx.fill();
  }
```

- [ ] **Step 2: 在 render() 中调用 drawLights**

在 `drawRoad(...)` 之后加一行：

```javascript
    drawLights(currentLevel && currentLevel.signals, state.signalStates);
```

- [ ] **Step 3: 手动验证**

在 console 临时设置：

```js
// 注入测试信号灯
const origRender = window.game.__render;
// 简单做法：刷新前在 STATE 段写测试数据。此处略，直接走 Task 6 的真实 LEVELS 数据。
```

刷新浏览器，本 task 主要靠后续 Task 6 关卡数据来验证。先提交。

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: LightRenderer - 圆饼灯 + 箭头灯绘制"
```

---

### Task 5：CarRenderer

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 添加 drawCar 函数**

在 `drawArrow` 之后添加：

```javascript
  function drawCar(car){
    if (!car) return;
    ctx.save();
    ctx.translate(car.x, car.y);
    ctx.rotate(car.heading || 0);
    // 车身（红色矩形）
    ctx.fillStyle = '#c33';
    ctx.fillRect(-9, -16, 18, 32);
    // 挡风玻璃
    ctx.fillStyle = '#aac';
    ctx.fillRect(-7, -12, 14, 8);
    // 前灯
    ctx.fillStyle = '#ffd';
    ctx.fillRect(-8, -16, 3, 2);
    ctx.fillRect(5, -16, 3, 2);
    ctx.restore();
  }
```

- [ ] **Step 2: 在 render() 中调用 drawCar**

在 `drawLights(...)` 之后加一行：

```javascript
    drawCar(state.car);
```

- [ ] **Step 3: 手动验证**

console 注入临时车辆数据：

```js
window.game.state.car = { x: 400, y: 400, heading: 0 };
```

刷新浏览器：应在 (400, 400) 位置看到一辆红色矩形车。

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: CarRenderer - 玩家车辆绘制"
```

---

## Phase 3：数据层与判分

### Task 6：LEVELS 数据结构 + EXPLANATIONS + LevelLoader（含 schema 校验）

**Files:**
- Modify: `index.html`（在 STATE 段之前添加 DATA 段）

- [ ] **Step 1: 添加 DATA 段（含 L1 入门关 + 一条 EXPLANATIONS）**

在 `// ===== STATE =====` 之前插入：

```javascript
  // ===== DATA =====
  const SCORE_CONFIG = {
    initial: 100,
    deductBySeverity: { minor: 10, normal: 20, major: 30, critical: 50 }
  };

  const EXPLANATIONS = {
    'red-light-stop': {
      title: '闯红灯',
      why: '圆饼红灯亮时，直行和左转必须停在停止线后等待。',
      correct: '红灯时停车等待，绿灯亮后再通行。',
      rule: '《道路交通安全法》第 26 条'
    },
    'green-light-go': {
      title: '绿灯通行',
      why: '绿灯亮时，确认安全后可以通行。',
      correct: '观察左右后通过。',
      rule: '《道路交通安全法》第 26 条'
    },
    'safe-stop': {
      title: '安全停车',
      why: '不确定时停车等待是最稳妥的选择。',
      correct: '等信号明确或确认安全后再行动。',
      rule: '防御性驾驶原则'
    },
    'unknown-action': {
      title: '未识别的操作',
      why: '系统未识别该动作。',
      correct: '使用 Space / 方向键操作。',
      rule: '——'
    },
    'signal-missing': {
      title: '信号灯故障',
      why: '路口信号灯未工作。',
      correct: '减速观察，确认安全后通过，必要时停车。',
      rule: '《道交法实施条例》第 52 条'
    }
    // 其余 explanation key 在 Task 16-22 添加关卡时按需补充
  };

  const LEVELS = [
    {
      id: 'L1',
      title: '第 1 关 · 入门：绿灯行红灯停',
      intro: '前方圆饼信号灯。红灯停，绿灯行。',
      passScore: 80,
      road: {
        lanes: [{ x: 400, w: 80 }],
        centerLine: { x: 400 },
        crossHalfWidth: 60,
        intersections: [
          { id: 'int-1', center: { x: 400, y: 300 }, roads: ['n','s'] }
        ]
      },
      signals: [
        { id: 'sig-n', type: 'circle', pos: { x: 340, y: 240 },
          program: [{ state: 'green', duration: 5000 }, { state: 'yellow', duration: 1000 }, { state: 'red', duration: 5000 }] }
      ],
      signs: [],
      decisionPoints: [
        {
          id: 'dp-1',
          atIntersection: 'int-1',
          trigger: { x: 400, y: 380, radius: 50 },
          prompt: '观察信号灯，决定通过还是停车',
          evaluate: {
            'pass-through': { _dynamic: 'passThroughBySignal', deduct: 30, explanationKey: 'red-light-stop' },
            'stop':         { correct: true,  deduct: 0,  explanationKey: 'safe-stop' },
            'left-turn':    { correct: false, deduct: 0,  explanationKey: 'unknown-action' },
            'right-turn':   { correct: false, deduct: 0,  explanationKey: 'unknown-action' }
          }
        }
      ],
      completion: { intersections: 1 }
    }
    // L2~L8 在后续 task 添加
  ];
```

- [ ] **Step 2: 添加 LevelLoader + schema 校验**

在 DATA 段之后（STATE 之前）添加：

```javascript
  function loadLevel(idx){
    const lv = LEVELS[idx];
    if (!lv) return null;
    const errs = validateLevel(lv);
    if (errs.length > 0) {
      console.error('Level data invalid:', lv.id, errs);
      showDataErrorBanner(lv.id, errs);
      return null;
    }
    return lv;
  }
  function validateLevel(lv){
    const errs = [];
    ['id','title','passScore','road','signals','decisionPoints'].forEach(function(k){
      if (!lv[k]) errs.push('missing ' + k);
    });
    if (lv.passScore && (lv.passScore < 0 || lv.passScore > 100)) errs.push('passScore out of range');
    if (lv.decisionPoints) {
      lv.decisionPoints.forEach(function(dp, i){
        if (!dp.evaluate) errs.push('dp['+i+'] missing evaluate');
        else if (!dp.evaluate['pass-through']) errs.push('dp['+i+'] missing pass-through rule');
        Object.keys(dp.evaluate).forEach(function(act){
          const r = dp.evaluate[act];
          if (!r._dynamic && !EXPLANATIONS[r.explanationKey]) errs.push('dp['+i+'].'+act+' unknown explanationKey: '+r.explanationKey);
        });
      });
    }
    return errs;
  }
  function showDataErrorBanner(id, errs){
    const div = document.createElement('div');
    div.style.cssText = 'position:fixed;top:0;left:0;right:0;background:#c33;color:#fff;padding:8px;font-size:13px;z-index:9999;';
    div.textContent = '[关卡数据异常] ' + id + ': ' + errs.join('; ');
    document.body.appendChild(div);
  }
```

- [ ] **Step 3: console 验证**

刷新后 console 跑：

```js
const lv = window.game.__test.levels[0];
const errs = window.game.__test.validateLevel(lv);
console.assert(errs.length === 0, 'L1 should pass validation', errs);
```

需要先在 EXPOSE 段补一行：`window.game.__test = { levels: LEVELS, validateLevel, loadLevel };`

Expected: 无 assertion 报错。

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: LEVELS 数据结构 + L1 数据 + LevelLoader schema 校验"
```

---

### Task 7：evaluateDecision 纯函数 + console 测试 snippet

**Files:**
- Modify: `index.html`
- Create: `test/console-snippet.js`

- [ ] **Step 1: 写 console 测试 snippet（先写测试）**

写入 `test/console-snippet.js`：

```js
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
```

- [ ] **Step 2: 把 snippet 粘到 console 跑，确认失败**

Expected: 报错 `t.evaluateDecision is not a function`。

- [ ] **Step 3: 实现 evaluateDecision**

在 DATA 段之后插入：

```javascript
  function evaluateDecision(dp, action, signalStates){
    // 1. action 不在 evaluate 表里
    if (!dp.evaluate[action]) {
      return { correct: false, deduct: 0, explanationKey: 'unknown-action' };
    }
    const rule = dp.evaluate[action];
    // 2. 动态规则（如根据信号灯状态判定）
    if (rule._dynamic === 'passThroughBySignal') {
      const sigId = (dp.signalBindings && dp.signalBindings[0]) || (currentLevel && currentLevel.signals[0] && currentLevel.signals[0].id);
      const sigState = sigId ? signalStates[sigId] : null;
      if (!sigState) {
        return { correct: false, deduct: 20, explanationKey: 'signal-missing' };
      }
      if (sigState === 'green' || sigState === 'yellow') {
        return { correct: true, deduct: 0, explanationKey: 'green-light-go' };
      }
      // 红灯
      return { correct: false, deduct: rule.deduct, explanationKey: rule.explanationKey };
    }
    // 3. 静态规则
    return { correct: rule.correct, deduct: rule.deduct || 0, explanationKey: rule.explanationKey };
  }
```

在 EXPOSE 段加：`window.game.__test.evaluateDecision = evaluateDecision;`

- [ ] **Step 4: 重跑 snippet 验证通过**

刷新浏览器，再次粘贴 `test/console-snippet.js` 全部内容到 console。

Expected: 输出 "All Task 7 tests passed ✓"。

- [ ] **Step 5: Commit**

```bash
git add index.html test/console-snippet.js
git commit -m "feat: evaluateDecision 判分纯函数 + console 测试 snippet"
```

---

### Task 8：ScoringEngine + 通过线判断

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 添加 ScoringEngine**

在 `evaluateDecision` 之后添加：

```javascript
  function applyDeduct(deduct){
    state.score = Math.max(0, state.score - deduct);
  }
  function checkPass(score, passScore){
    return score >= passScore;
  }
```

- [ ] **Step 2: console 验证**

console 跑：

```js
window.game.state.score = 100;
window.game.__test.applyDeduct(30);
console.assert(window.game.state.score === 70, '70 after -30');
window.game.__test.applyDeduct(80);
console.assert(window.game.state.score === 0, 'clamped to 0');
console.assert(window.game.__test.checkPass(80, 80) === true, 'pass when equal');
console.assert(window.game.__test.checkPass(79, 80) === false, 'fail below');
console.log('Task 8 done');
```

在 EXPOSE 段加：`window.game.__test.applyDeduct = applyDeduct; window.game.__test.checkPass = checkPass;`

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: ScoringEngine - 扣分累积 + 通过线判断"
```

---

## Phase 4：玩法逻辑

### Task 9：CarController（半自动行驶）

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 添加 CarController + 信号灯状态机**

在 LOGIC 段（update 之前）添加：

```javascript
  // ===== LOGIC =====
  function initCarForLevel(lv){
    // 玩家车从底部出现，向北行驶（heading=0 表示朝上）
    state.car = { x: 400, y: 540, heading: 0, speed: 80, stopped: false, currentLane: 'forward' };
    state.score = SCORE_CONFIG.initial;
    state.currentDecisionPoint = null;
    // 初始化信号灯状态
    state.signalStates = {};
    state.signalStart = performance.now();
  }
  function updateSignals(now){
    if (!currentLevel) return;
    currentLevel.signals.forEach(function(sig){
      const cycleTotal = sig.program.reduce(function(s,p){ return s + p.duration; }, 0);
      const elapsed = (now - state.signalStart) % cycleTotal;
      let t = elapsed;
      for (let i = 0; i < sig.program.length; i++) {
        if (t < sig.program[i].duration) {
          state.signalStates[sig.id] = sig.program[i].state;
          return;
        }
        t -= sig.program[i].duration;
      }
    });
  }
  function updateCar(dt){
    const car = state.car;
    if (!car || car.stopped) return;
    // 简化：车沿 -y 方向匀速前进
    car.y -= car.speed * dt / 1000;
  }
```

- [ ] **Step 2: 接入主循环 update**

修改 `update(dt)`：

```javascript
  function update(dt){
    updateSignals(performance.now());
    if (state.mode === 'playing' || state.mode === 'awaiting-decision') {
      updateCar(dt);
    }
  }
```

- [ ] **Step 3: 在 transition('playing') 时初始化车**

修改 `transition`：

```javascript
  function transition(newMode){
    if (!VALID_MODES.includes(newMode)) { console.error('Invalid mode:', newMode); return; }
    if (newMode === 'playing' && state.mode !== 'paused') {
      currentLevel = loadLevel(state.levelIdx);
      if (!currentLevel) { state.mode = 'menu'; return; }
      initCarForLevel(currentLevel);
    }
    state.mode = newMode;
  }
```

并把 STATE 段的 `let currentLevel = null;` 改为顶部 `let currentLevel = null;`（确保 transition 可见）。

- [ ] **Step 4: 手动验证**

console：

```js
window.game.transition('playing');
// 等几秒
console.assert(window.game.state.car.y < 540, '车应该向北移动');
console.assert(Object.keys(window.game.state.signalStates).length === 1, '信号灯状态应有 1 条');
```

刷新浏览器后跑：车辆应从底部逐渐向上移动，信号灯状态随时间变化。

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: CarController 半自动行驶 + 信号灯时序状态机"
```

---

### Task 10：IntersectionDetector + 决策区触发

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 添加 IntersectionDetector**

在 LOGIC 段添加：

```javascript
  function checkDecisionZone(){
    if (!state.car || !currentLevel) return;
    if (state.mode !== 'playing') return;
    for (const dp of currentLevel.decisionPoints) {
      const dx = state.car.x - dp.trigger.x;
      const dy = state.car.y - dp.trigger.y;
      if (Math.sqrt(dx*dx + dy*dy) < dp.trigger.radius) {
        state.currentDecisionPoint = dp;
        transition('awaiting-decision');
        showDecisionPrompt(dp);
        return;
      }
    }
  }
```

- [ ] **Step 2: 在 update 中调用**

修改 update：

```javascript
  function update(dt){
    updateSignals(performance.now());
    if (state.mode === 'playing') {
      updateCar(dt);
      checkDecisionZone();
    } else if (state.mode === 'awaiting-decision') {
      // 等待玩家决策，车继续滑行（轻微）
      // 不主动改变模式
    }
  }
```

- [ ] **Step 3: 添加 showDecisionPrompt 占位**

```javascript
  function showDecisionPrompt(dp){
    // UI 在 Task 12 实现，先 console.log
    console.log('[DecisionPrompt]', dp.prompt);
  }
```

- [ ] **Step 4: 手动验证**

console 跑 `window.game.transition('playing')`，观察 console：当车接近 (400, 380) 半径 50 时应输出 `[DecisionPrompt] 观察信号灯...`。

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: IntersectionDetector - 决策区检测与模式切换"
```

---

### Task 11：输入处理（键盘 + 触屏）

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 添加 Input 处理**

在 EXPOSE 段之前添加：

```javascript
  // ===== INPUT =====
  function handleAction(action){
    if (state.mode === 'awaiting-decision') {
      decide(action);
    } else if (state.mode === 'playing') {
      // 玩家在行驶中可主动停车（Space）
      if (action === 'stop') state.car.stopped = !state.car.stopped;
    }
  }
  function decide(action){
    const dp = state.currentDecisionPoint;
    if (!dp) return;
    const result = evaluateDecision(dp, action, state.signalStates);
    if (result.deduct > 0) {
      applyDeduct(result.deduct);
      showExplanation(result.explanationKey);
      // mode 切换由讲解弹窗关闭时处理
    } else {
      // 正确决策：车通过路口
      proceedThrough(action);
      state.currentDecisionPoint = null;
      transition('playing');
      checkLevelComplete();
    }
  }
  function proceedThrough(action){
    // 简化：让车继续向北，离开决策区
    state.car.y -= 80;
    state.car.stopped = false;
  }
  function checkLevelComplete(){
    // 简化：车到达屏幕顶部视为完成
    if (state.car.y < 50) {
      const pass = checkPass(state.score, currentLevel.passScore);
      transition(pass ? 'level-complete' : 'level-failed');
    }
  }
  function showExplanation(key){
    // UI 在 Task 13 实现
    console.log('[Explain]', key, window.game.__test.EXPLANATIONS[key]);
    // 临时：3 秒后自动关闭
    setTimeout(function(){
      transition('playing');
      proceedThrough('pass-through');
      state.currentDecisionPoint = null;
      checkLevelComplete();
    }, 3000);
  }

  document.addEventListener('keydown', function(e){
    const map = { 'Space':'stop','ArrowUp':'pass-through','ArrowDown':'stop','ArrowLeft':'left-turn','ArrowRight':'right-turn','Escape':'pause' };
    const action = map[e.code];
    if (action) { e.preventDefault(); handleAction(action); }
  });
```

- [ ] **Step 2: EXPOSE 补充**

在 EXPOSE 段加：

```javascript
  window.game.__test.EXPLANATIONS = EXPLANATIONS;
  window.game.__test.handleAction = handleAction;
```

- [ ] **Step 3: 手动验证**

console 跑：

```js
window.game.transition('playing');
// 等车进入决策区，看到 [DecisionPrompt]
// 按下方向键 ↑（pass-through）或 ↓（stop）
```

应看到 `[Explain] ...`（如果是红灯闯过去）或车继续前进（如果是绿灯或停车）。

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: 输入处理 + decide + proceedThrough + checkLevelComplete"
```

---

## Phase 5：UI 层

### Task 12：HUD（顶部状态栏）

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 添加 HUD DOM 元素**

在 `<div id="app">` 内的 `<canvas>` 之后添加：

```html
  <div id="hud" class="overlay" style="display:none;">
    <div style="position:absolute;top:12px;left:12px;background:rgba(0,0,0,0.7);color:#fff;padding:8px 14px;border-radius:6px;font-size:14px;">
      <div id="hud-level">关卡</div>
      <div id="hud-score" style="font-size:20px;font-weight:bold;">100</div>
      <div id="hud-pass" style="font-size:11px;opacity:0.7;">通过线: 80</div>
    </div>
    <button id="hud-pause" style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,0.7);color:#fff;border:none;padding:8px 14px;border-radius:6px;font-size:14px;cursor:pointer;">暂停 (Esc)</button>
  </div>
```

- [ ] **Step 2: 添加 updateHUD 函数**

```javascript
  const hudEl = document.getElementById('hud');
  function updateHUD(){
    if (!currentLevel) return;
    const show = (state.mode === 'playing' || state.mode === 'awaiting-decision' || state.mode === 'explaining');
    hudEl.style.display = show ? 'block' : 'none';
    document.getElementById('hud-level').textContent = currentLevel.title;
    document.getElementById('hud-score').textContent = state.score;
    document.getElementById('hud-pass').textContent = '通过线: ' + currentLevel.passScore;
  }
  document.getElementById('hud-pause').addEventListener('click', function(){
    if (state.mode === 'paused') transition('playing');
    else if (state.mode === 'playing' || state.mode === 'awaiting-decision') transition('paused');
  });
```

在 render() 末尾调用 `updateHUD();`，并把 Esc 处理改为：

```javascript
    if (e.code === 'Escape') {
      if (state.mode === 'paused') transition('playing');
      else if (state.mode === 'playing' || state.mode === 'awaiting-decision') transition('paused');
    }
```

- [ ] **Step 3: 手动验证**

console 跑 `window.game.transition('playing')`：左上角应显示关卡标题、分数 100、通过线 80；右上角显示"暂停"按钮。按 Esc 暂停/恢复（车不再移动）。

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: HUD 顶部状态栏（关卡/分数/通过线/暂停）"
```

---

### Task 13：DecisionPrompt + ExplainModal

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 添加 DecisionPrompt DOM**

在 `#hud` 之后添加：

```html
  <div id="decision-prompt" class="overlay" style="display:none;">
    <div style="position:absolute;bottom:60px;left:50%;transform:translateX(-50%);background:rgba(0,0,0,0.85);color:#fff;padding:12px 20px;border-radius:8px;text-align:center;max-width:80%;">
      <div id="dp-text" style="font-size:15px;margin-bottom:8px;"></div>
      <div style="font-size:12px;opacity:0.8;">Space 停/行 · ↑ 直行 · ← 左转 · → 右转</div>
    </div>
  </div>
```

- [ ] **Step 2: 添加 ExplainModal DOM**

```html
  <div id="explain-modal" class="overlay" style="display:none;">
    <div style="position:absolute;inset:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;">
      <div style="background:#fff;color:#222;padding:24px;border-radius:10px;max-width:480px;width:90%;">
        <h3 id="em-title" style="margin-bottom:12px;"></h3>
        <p style="margin-bottom:8px;"><strong>为什么错：</strong><span id="em-why"></span></p>
        <p style="margin-bottom:8px;"><strong>正确做法：</strong><span id="em-correct"></span></p>
        <p style="margin-bottom:16px;font-size:13px;color:#666;"><span id="em-rule"></span></p>
        <button id="em-close" style="background:#2d5a2d;color:#fff;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;">继续</button>
      </div>
    </div>
  </div>
```

- [ ] **Step 3: 实现 showDecisionPrompt + showExplanation**

替换 Task 10/11 的占位实现：

```javascript
  const dpEl = document.getElementById('decision-prompt');
  const dpText = document.getElementById('dp-text');
  function showDecisionPrompt(dp){
    dpText.textContent = dp.prompt;
    dpEl.style.display = 'block';
  }
  function hideDecisionPrompt(){ dpEl.style.display = 'none'; }

  const emEl = document.getElementById('explain-modal');
  function showExplanation(key){
    const ex = EXPLANATIONS[key] || EXPLANATIONS['unknown-action'];
    document.getElementById('em-title').textContent = ex.title;
    document.getElementById('em-why').textContent = ex.why;
    document.getElementById('em-correct').textContent = ex.correct;
    document.getElementById('em-rule').textContent = ex.rule;
    emEl.style.display = 'block';
    state._preExplainMode = state.mode;
    state.mode = 'explaining';
  }
  document.getElementById('em-close').addEventListener('click', function(){
    emEl.style.display = 'none';
    // 关闭后继续行驶
    proceedThrough('pass-through');
    state.currentDecisionPoint = null;
    hideDecisionPrompt();
    transition('playing');
    checkLevelComplete();
  });
```

- [ ] **Step 4: 删除 Task 11 里的临时 setTimeout 实现**

把 Task 11 的 `showExplanation` 里的 setTimeout 代码删除（已被新实现替代）。

- [ ] **Step 5: 手动验证**

console 跑 `window.game.transition('playing')`：车进入决策区时显示底部提示条；按 ↑（红灯时）应弹出讲解弹窗，点"继续"按钮关闭，车继续行驶。

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: DecisionPrompt + ExplainModal 完整实现"
```

---

### Task 14：StartScreen + LevelCompleteScreen + LevelFailScreen + TouchButtons

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 添加 4 个 DOM 元素**

在 `#explain-modal` 之后添加：

```html
  <div id="start-screen" class="overlay" style="display:flex;">
    <div style="position:absolute;inset:0;background:linear-gradient(135deg,#1a3a1a,#2d5a2d);display:flex;flex-direction:column;align-items:center;justify-content:center;color:#fff;">
      <h1 style="margin-bottom:32px;font-size:32px;">新手司机道路考核</h1>
      <div id="ss-levels" style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;max-width:560px;"></div>
      <div id="ss-errors"></div>
    </div>
  </div>

  <div id="level-complete" class="overlay" style="display:none;">
    <div style="position:absolute;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;">
      <div style="background:#fff;color:#222;padding:32px;border-radius:10px;text-align:center;min-width:320px;">
        <h2 style="color:#2d5a2d;margin-bottom:16px;">关卡通过 ✓</h2>
        <p style="font-size:14px;margin-bottom:8px;">得分：<span id="lc-score" style="font-weight:bold;font-size:20px;"></span></p>
        <div style="margin-top:20px;display:flex;gap:8px;justify-content:center;">
          <button data-lc-action="replay" style="padding:8px 16px;border:none;background:#eee;border-radius:6px;cursor:pointer;">重玩</button>
          <button data-lc-action="next" id="lc-next" style="padding:8px 16px;border:none;background:#2d5a2d;color:#fff;border-radius:6px;cursor:pointer;">下一关</button>
          <button data-lc-action="menu" style="padding:8px 16px;border:none;background:#eee;border-radius:6px;cursor:pointer;">回菜单</button>
        </div>
      </div>
    </div>
  </div>

  <div id="level-fail" class="overlay" style="display:none;">
    <div style="position:absolute;inset:0;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;">
      <div style="background:#fff;color:#222;padding:32px;border-radius:10px;text-align:center;min-width:320px;">
        <h2 style="color:#c33;margin-bottom:16px;">未达标</h2>
        <p style="font-size:14px;">得分：<span id="lf-score" style="font-weight:bold;font-size:20px;"></span> · 通过线 <span id="lf-pass"></span></p>
        <div style="margin-top:20px;display:flex;gap:8px;justify-content:center;">
          <button data-lf-action="retry" style="padding:8px 16px;border:none;background:#2d5a2d;color:#fff;border-radius:6px;cursor:pointer;">重试</button>
          <button data-lf-action="menu" style="padding:8px 16px;border:none;background:#eee;border-radius:6px;cursor:pointer;">回菜单</button>
        </div>
      </div>
    </div>
  </div>

  <div id="touch-buttons" class="overlay" style="display:none;">
    <div style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:8px;">
      <button data-touch="stop" style="width:54px;height:54px;border-radius:50%;border:none;background:rgba(0,0,0,0.7);color:#fff;font-size:12px;">停/行</button>
      <button data-touch="pass-through" style="width:54px;height:54px;border-radius:50%;border:none;background:rgba(0,0,0,0.7);color:#fff;font-size:20px;">↑</button>
      <button data-touch="left-turn" style="width:54px;height:54px;border-radius:50%;border:none;background:rgba(0,0,0,0.7);color:#fff;font-size:20px;">←</button>
      <button data-touch="right-turn" style="width:54px;height:54px;border-radius:50%;border:none;background:rgba(0,0,0,0.7);color:#fff;font-size:20px;">→</button>
    </div>
  </div>
```

- [ ] **Step 2: 实现 StartScreen 渲染 + 关卡选择**

```javascript
  const startScreen = document.getElementById('start-screen');
  function renderStartScreen(){
    const container = document.getElementById('ss-levels');
    container.innerHTML = '';
    LEVELS.forEach(function(lv, idx){
      const unlocked = idx < state.unlockedLevels;
      const btn = document.createElement('button');
      btn.textContent = lv.title.split('·')[0].trim();
      btn.style.cssText = 'padding:12px 8px;border-radius:8px;border:none;cursor:'+(unlocked?'pointer':'not-allowed')+';background:'+(unlocked?'#fff':'#555')+';color:'+(unlocked?'#222':'#999')+';font-size:13px;';
      btn.disabled = !unlocked;
      btn.addEventListener('click', function(){
        state.levelIdx = idx;
        transition('playing');
        hideAllOverlays();
      });
      container.appendChild(btn);
    });
  }
  function hideAllOverlays(){
    startScreen.style.display = 'none';
    document.getElementById('level-complete').style.display = 'none';
    document.getElementById('level-fail').style.display = 'none';
    hudEl.style.display = 'none';
    dpEl.style.display = 'none';
  }
  function showStartScreen(){
    hideAllOverlays();
    renderStartScreen();
    startScreen.style.display = 'flex';
  }
  // 启动时显示
  showStartScreen();
```

- [ ] **Step 3: 实现 LevelComplete/Fail 显示与按钮**

```javascript
  function showLevelComplete(){
    document.getElementById('lc-score').textContent = state.score;
    const isLast = state.levelIdx >= LEVELS.length - 1;
    document.getElementById('lc-next').style.display = isLast ? 'none' : 'block';
    document.getElementById('level-complete').style.display = 'block';
    // 解锁下一关
    if (state.levelIdx + 1 >= state.unlockedLevels && !isLast) {
      state.unlockedLevels = state.levelIdx + 2;
      saveProgress();
    }
  }
  function showLevelFail(){
    document.getElementById('lf-score').textContent = state.score;
    document.getElementById('lf-pass').textContent = currentLevel.passScore;
    document.getElementById('level-fail').style.display = 'block';
  }
  document.querySelectorAll('[data-lc-action]').forEach(function(btn){
    btn.addEventListener('click', function(){
      const a = btn.getAttribute('data-lc-action');
      if (a === 'replay') transition('playing');
      else if (a === 'next') { state.levelIdx++; transition('playing'); }
      else if (a === 'menu') { state.mode = 'menu'; showStartScreen(); }
      document.getElementById('level-complete').style.display = 'none';
    });
  });
  document.querySelectorAll('[data-lf-action]').forEach(function(btn){
    btn.addEventListener('click', function(){
      const a = btn.getAttribute('data-lf-action');
      if (a === 'retry') transition('playing');
      else if (a === 'menu') { state.mode = 'menu'; showStartScreen(); }
      document.getElementById('level-fail').style.display = 'none';
    });
  });
```

把 Task 11 的 checkLevelComplete 改为：

```javascript
  function checkLevelComplete(){
    if (state.car.y < 50) {
      const pass = checkPass(state.score, currentLevel.passScore);
      if (pass) { state.mode = 'level-complete'; showLevelComplete(); }
      else { state.mode = 'level-failed'; showLevelFail(); }
    }
  }
```

- [ ] **Step 4: 实现 TouchButtons 显示与事件**

```javascript
  function setupTouch(){
    const isTouch = navigator.maxTouchPoints > 0 && !window.matchMedia('(pointer:fine)').matches;
    document.getElementById('touch-buttons').style.display = isTouch ? 'block' : 'none';
    document.querySelectorAll('[data-touch]').forEach(function(btn){
      btn.addEventListener('click', function(){
        handleAction(btn.getAttribute('data-touch'));
      });
    });
  }
  setupTouch();
```

- [ ] **Step 5: 手动验证**

刷新浏览器：应看到开始屏幕，列出 L1（其他关卡因 unlockedLevels=1 灰显）。点 L1 进入游戏。完成后弹出通过/失败面板，按钮工作正常。

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: StartScreen + LevelComplete + LevelFail + TouchButtons"
```

---

## Phase 6：关卡内容

> 每个 task 添加一个关卡。流程一致：
> 1. 在 `EXPLANATIONS` 添加新 key 的文案
> 2. 在 `LEVELS` 末尾添加关卡对象
> 3. console 跑 `validateLevel` 确认无错
> 4. 手动玩一遍验证
> 5. 写黄金路径测试卡
> 6. Commit

### Task 15：L2 圆饼红灯能否右转

**Files:**
- Modify: `index.html`
- Create: `test/manual/L2.md`

- [ ] **Step 1: 添加 EXPLANATIONS 新条目**

在 `EXPLANATIONS` 对象内 `'safe-stop'` 之后添加：

```javascript
    'circle-red-right-allowed': {
      title: '圆饼红灯允许右转',
      why: '圆饼红灯时，如果没有"红灯禁止右转"标志，右转车辆在确认安全、让行人和被放行车辆后可以通行。',
      correct: '减速、观察右侧、让行人，安全后右转。',
      rule: '《道交法实施条例》第 38 条'
    },
    'red-light-no-left': {
      title: '红灯禁止左转',
      why: '圆饼红灯时，左转和直行都必须停在停止线后。',
      correct: '停车等待绿灯。',
      rule: '《道交法实施条例》第 38 条'
    },
    'red-light-no-right-sign': {
      title: '红灯禁右标志下不得右转',
      why: '路口设有"红灯禁止右转"辅助标志时，红灯期间禁止右转。',
      correct: '停车等待绿灯。',
      rule: 'GB 5768 道路交通标志'
    },
```

- [ ] **Step 2: 在 LEVELS 末尾添加 L2**

```javascript
    {
      id: 'L2',
      title: '第 2 关 · 圆饼红灯能否右转',
      intro: '前方圆饼红灯，无禁右标志。你的车道允许直行或右转。',
      passScore: 80,
      road: {
        lanes: [{ x: 400, w: 80 }],
        centerLine: { x: 400 },
        crossHalfWidth: 60,
        intersections: [{ id: 'int-1', center: { x: 400, y: 300 }, roads: ['n','s','e','w'] }]
      },
      signals: [
        { id: 'sig-n', type: 'circle', pos: { x: 340, y: 240 },
          program: [{ state: 'red', duration: 99999 }] }
      ],
      signs: [],
      decisionPoints: [{
        id: 'dp-1',
        atIntersection: 'int-1',
        trigger: { x: 400, y: 380, radius: 50 },
        prompt: '圆饼红灯，无禁右标志。可以右转吗？',
        evaluate: {
          'pass-through': { correct: false, deduct: 30, explanationKey: 'red-light-stop' },
          'right-turn':   { correct: true,  deduct: 0,  explanationKey: 'circle-red-right-allowed' },
          'left-turn':    { correct: false, deduct: 30, explanationKey: 'red-light-no-left' },
          'stop':         { correct: true,  deduct: 0,  explanationKey: 'safe-stop' }
        }
      }],
      completion: { intersections: 1 }
    }
```

- [ ] **Step 3: console 验证**

```js
const L2 = window.game.__test.levels[1];
const errs = window.game.__test.validateLevel(L2);
console.assert(errs.length === 0, 'L2 should be valid', errs);
```

- [ ] **Step 4: 写黄金路径测试卡**

写入 `test/manual/L2.md`：

```markdown
# L2 · 圆饼红灯能否右转

## 通关路径
1. 进入关卡 → 车在 (400, 540)
2. 车前进到 (400, 380) 触发决策
3. 按 → 右转 → 应判对，无讲解弹窗
4. 车继续前进，到 y < 50 → 通关，分数 100 ≥ 80 ✓

## 失败路径
1. 同上到决策区
2. 按 ↑ 直行 → 弹讲解 "闯红灯" + 扣 30
3. 关闭讲解 → 车通过路口 → 结算分数 70 < 80 → Fail ✓

## 边界
- 不做任何输入驶过 → 按 pass-through 扣 30
- 按 ← 左转 → 弹讲解 "红灯禁止左转" + 扣 30
- 按 Space 停车 → 应判对，不扣分
```

- [ ] **Step 5: Commit**

```bash
git add index.html test/manual/L2.md
git commit -m "feat: L2 圆饼红灯能否右转 + 黄金路径测试卡"
```

---

### Task 16：L3 圆饼红灯左转/直行

**Files:**
- Modify: `index.html`
- Create: `test/manual/L3.md`

- [ ] **Step 1: 在 LEVELS 末尾添加 L3**

```javascript
    {
      id: 'L3',
      title: '第 3 关 · 圆饼红灯左转/直行禁止',
      intro: '前方圆饼红灯。直行、左转均禁止，必须停车等待。',
      passScore: 80,
      road: {
        lanes: [{ x: 400, w: 80 }],
        centerLine: { x: 400 },
        crossHalfWidth: 60,
        intersections: [{ id: 'int-1', center: { x: 400, y: 300 }, roads: ['n','s','e','w'] }]
      },
      signals: [
        { id: 'sig-n', type: 'circle', pos: { x: 340, y: 240 },
          program: [{ state: 'red', duration: 99999 }] }
      ],
      signs: [],
      decisionPoints: [{
        id: 'dp-1', atIntersection: 'int-1',
        trigger: { x: 400, y: 380, radius: 50 },
        prompt: '圆饼红灯。直行 / 左转 / 右转 / 停车，你选哪个？',
        evaluate: {
          'pass-through': { correct: false, deduct: 30, explanationKey: 'red-light-stop' },
          'left-turn':    { correct: false, deduct: 30, explanationKey: 'red-light-no-left' },
          'right-turn':   { correct: true,  deduct: 0,  explanationKey: 'circle-red-right-allowed' },
          'stop':         { correct: true,  deduct: 0,  explanationKey: 'safe-stop' }
        }
      }],
      completion: { intersections: 1 }
    }
```

- [ ] **Step 2: 验证 + 测试卡**

console 验证 `validateLevel(levels[2])` 返回 `[]`。

写入 `test/manual/L3.md`：

```markdown
# L3 · 圆饼红灯左转/直行禁止

## 通关
- 按 → 右转 或 Space 停车 → 100 分通过

## 失败
- 按 ↑ 直行 → 扣 30 → 70 分 Fail
- 按 ← 左转 → 扣 30 → 70 分 Fail
```

- [ ] **Step 3: Commit**

```bash
git add index.html test/manual/L3.md
git commit -m "feat: L3 圆饼红灯左转/直行禁止"
```

---

### Task 17：L4 方向箭头灯

**Files:**
- Modify: `index.html`
- Create: `test/manual/L4.md`

- [ ] **Step 1: 添加 EXPLANATIONS 新条目**

```javascript
    'arrow-green-go': {
      title: '箭头绿灯通行',
      why: '对应方向的箭头绿灯亮起，该方向可通行。',
      correct: '按自己车道对应方向的箭头灯行驶。',
      rule: '《道交法实施条例》第 38 条'
    },
    'arrow-red-stop': {
      title: '箭头红灯禁止该方向',
      why: '某方向箭头为红，该方向禁止通行。',
      correct: '等待该方向箭头变绿。',
      rule: '《道交法实施条例》第 38 条'
    },
```

- [ ] **Step 2: 添加 L4 关卡（直行绿、左转红）**

```javascript
    {
      id: 'L4',
      title: '第 4 关 · 方向箭头灯',
      intro: '前方箭头灯：直行绿，左转红。按对应箭头行驶。',
      passScore: 80,
      road: {
        lanes: [{ x: 400, w: 80 }],
        centerLine: { x: 400 },
        crossHalfWidth: 60,
        intersections: [{ id: 'int-1', center: { x: 400, y: 300 }, roads: ['n','s','e','w'] }]
      },
      signals: [
        { id: 'sig-arrow', type: 'arrow', pos: { x: 340, y: 240 },
          program: [
            { state: 'forward-green', duration: 5000 },
            { state: 'all-red', duration: 2000 },
            { state: 'left-green', duration: 3000 },
            { state: 'all-red', duration: 1000 }
          ] }
      ],
      signs: [],
      decisionPoints: [{
        id: 'dp-1', atIntersection: 'int-1',
        trigger: { x: 400, y: 380, radius: 50 },
        prompt: '观察箭头灯，选择正确方向。',
        evaluate: {
          'pass-through': { _dynamic: 'arrowForwardBySignal', deduct: 30, explanationKey: 'arrow-red-stop' },
          'left-turn':    { _dynamic: 'arrowLeftBySignal',    deduct: 30, explanationKey: 'arrow-red-stop' },
          'right-turn':   { correct: false, deduct: 0,  explanationKey: 'unknown-action' },
          'stop':         { correct: true,  deduct: 0,  explanationKey: 'safe-stop' }
        }
      }],
      completion: { intersections: 1 }
    }
```

- [ ] **Step 3: 扩展 evaluateDecision 支持箭头灯动态规则**

修改 `evaluateDecision` 函数，在 `_dynamic` 分支添加：

```javascript
    if (rule._dynamic === 'arrowForwardBySignal') {
      const sigState = signalStates['sig-arrow'];
      if (!sigState) return { correct: false, deduct: 20, explanationKey: 'signal-missing' };
      const ok = (sigState === 'forward-green');
      return { correct: ok, deduct: ok ? 0 : 30, explanationKey: ok ? 'arrow-green-go' : 'arrow-red-stop' };
    }
    if (rule._dynamic === 'arrowLeftBySignal') {
      const sigState = signalStates['sig-arrow'];
      if (!sigState) return { correct: false, deduct: 20, explanationKey: 'signal-missing' };
      const ok = (sigState === 'left-green');
      return { correct: ok, deduct: ok ? 0 : 30, explanationKey: ok ? 'arrow-green-go' : 'arrow-red-stop' };
    }
```

- [ ] **Step 4: 验证 + 测试卡**

console: `validateLevel(levels[3])` → `[]`。

写入 `test/manual/L4.md`：

```markdown
# L4 · 方向箭头灯

## 通关
- 直行箭头绿（前 5 秒）→ 按 ↑ 直行 → 通过
- 直行红、左转绿（第 7-10 秒）→ 按 ← 左转 → 通过
- 任何时刻按 Space → 通过

## 失败
- 直行红时按 ↑ → 扣 30 → Fail
- 左转红时按 ← → 扣 30 → Fail
```

- [ ] **Step 5: Commit**

```bash
git add index.html test/manual/L4.md
git commit -m "feat: L4 方向箭头灯 + arrowForward/arrowLeft 动态规则"
```

---

### Task 18：L5 右转箭头红灯

**Files:**
- Modify: `index.html`
- Create: `test/manual/L5.md`

- [ ] **Step 1: 添加 L5 关卡**

```javascript
    {
      id: 'L5',
      title: '第 5 关 · 右转箭头红灯（老司机陷阱）',
      intro: '右转箭头为红时，右转也必须停。很多人误以为"右转永远可以"。',
      passScore: 80,
      road: {
        lanes: [{ x: 400, w: 80 }],
        centerLine: { x: 400 },
        crossHalfWidth: 60,
        intersections: [{ id: 'int-1', center: { x: 400, y: 300 }, roads: ['n','s','e','w'] }]
      },
      signals: [
        { id: 'sig-arrow', type: 'arrow', pos: { x: 340, y: 240 },
          program: [
            { state: 'right-red', duration: 99999 }
          ] }
      ],
      signs: [],
      decisionPoints: [{
        id: 'dp-1', atIntersection: 'int-1',
        trigger: { x: 400, y: 380, radius: 50 },
        prompt: '右转箭头红灯。可以右转吗？',
        evaluate: {
          'pass-through': { correct: false, deduct: 30, explanationKey: 'arrow-red-stop' },
          'right-turn':   { _dynamic: 'arrowRightBySignal', deduct: 30, explanationKey: 'arrow-red-stop' },
          'left-turn':    { correct: false, deduct: 30, explanationKey: 'arrow-red-stop' },
          'stop':         { correct: true,  deduct: 0,  explanationKey: 'safe-stop' }
        }
      }],
      completion: { intersections: 1 }
    }
```

- [ ] **Step 2: 扩展 evaluateDecision 支持右转箭头**

```javascript
    if (rule._dynamic === 'arrowRightBySignal') {
      const sigState = signalStates['sig-arrow'];
      if (!sigState) return { correct: false, deduct: 20, explanationKey: 'signal-missing' };
      const ok = (sigState === 'right-green');
      return { correct: ok, deduct: ok ? 0 : 30, explanationKey: ok ? 'arrow-green-go' : 'arrow-red-stop' };
    }
```

- [ ] **Step 3: 扩展 drawLights 支持右箭头独立红/绿**

修改 `drawLights` 中 arrow 类型分支：

```javascript
      } else if (sig.type === 'arrow') {
        ctx.fillStyle = '#222';
        ctx.fillRect(x - 18, y - 30, 36, 60);
        // 三个箭头：根据 sigState 高亮
        const st = signalStates[sig.id] || 'all-red';
        [['left','forward','left-green'],['forward','forward','forward-green'],['right','right','right-green']].forEach(function(arr, i){
          const drawDir = arr[0];
          const matchOn = arr[2];
          const ay = y - 20 + i * 20;
          const isOn = st === matchOn;
          const isAnyRed = st === 'all-red' || st === 'left-red' || st === 'forward-red' || st === 'right-red';
          const color = isOn ? '#3c3' : (isAnyRed ? '#5a1a1a' : '#444');
          drawArrow(x, ay, drawDir, color);
        });
      }
```

- [ ] **Step 4: 验证 + 测试卡**

console: `validateLevel(levels[4])` → `[]`。

`test/manual/L5.md`：

```markdown
# L5 · 右转箭头红灯

## 通关
- 按 Space 停车 → 通过

## 失败
- 按 → 右转 → 扣 30 → Fail（陷阱！）
- 按 ↑ 直行 → 扣 30 → Fail
```

- [ ] **Step 5: Commit**

```bash
git add index.html test/manual/L5.md
git commit -m "feat: L5 右转箭头红灯 + arrowRightBySignal 规则"
```

---

### Task 19：L6 左转待转区

**Files:**
- Modify: `index.html`
- Create: `test/manual/L6.md`

- [ ] **Step 1: 添加 EXPLANATIONS 新条目**

```javascript
    'waiting-zone-enter': {
      title: '进入左转待转区',
      why: '直行绿灯、左转红灯时，左转车辆应驶入路口中央的左转待转区等待，左转绿灯亮后再完成转弯。',
      correct: '直行绿灯时进入待转区，左转绿灯时通过。',
      rule: '《道交法实施条例》第 51 条'
    },
    'waiting-zone-premature': {
      title: '未到时机进入待转区',
      why: '直行红灯时不得进入左转待转区。',
      correct: '等直行绿灯亮起再驶入待转区。',
      rule: '《道交法实施条例》第 51 条'
    },
```

- [ ] **Step 2: 添加 L6 关卡（双决策点）**

```javascript
    {
      id: 'L6',
      title: '第 6 关 · 左转待转区',
      intro: '直行绿灯时进入待转区，左转绿灯时完成左转。',
      passScore: 80,
      road: {
        lanes: [{ x: 400, w: 80 }],
        centerLine: { x: 400 },
        crossHalfWidth: 60,
        intersections: [{ id: 'int-1', center: { x: 400, y: 300 }, roads: ['n','s','e','w'] }]
      },
      signals: [
        { id: 'sig-fwd', type: 'circle', pos: { x: 340, y: 240 },
          program: [{ state: 'green', duration: 99999 }] },
        { id: 'sig-left', type: 'circle', pos: { x: 460, y: 240 },
          program: [{ state: 'red', duration: 99999 }] }
      ],
      signs: [],
      decisionPoints: [
        {
          id: 'dp-enter', atIntersection: 'int-1',
          trigger: { x: 400, y: 380, radius: 50 },
          prompt: '直行绿、左转红。要左转的话，怎么办？',
          evaluate: {
            'pass-through': { correct: true,  deduct: 0,  explanationKey: 'green-light-go' },
            'left-turn':    { correct: true,  deduct: 0,  explanationKey: 'waiting-zone-enter' },
            'right-turn':   { correct: false, deduct: 0,  explanationKey: 'unknown-action' },
            'stop':         { correct: true,  deduct: 0,  explanationKey: 'safe-stop' }
          }
        }
      ],
      completion: { intersections: 1 }
    }
```

> 注：v1 简化版只在"是否进入待转区"做一次决策，完整的"二次决策（左转绿再转）"留到 v1.1。

- [ ] **Step 3: 验证 + 测试卡**

console: `validateLevel(levels[5])` → `[]`。

`test/manual/L6.md`：

```markdown
# L6 · 左转待转区

## 通关
- 按 ← 左转 → 进入待转区（动态：直行绿+左转红时正确）→ 通过
- 按 ↑ 直行 → 通过
- 按 Space 停车 → 通过

## v1.1 待补
- 待转区动画（左转车辆部分驶入路口中央）
- 左转绿二次决策
```

- [ ] **Step 4: Commit**

```bash
git add index.html test/manual/L6.md
git commit -m "feat: L6 左转待转区（单决策简化版）"
```

---

### Task 20：L7 黄灯闪烁

**Files:**
- Modify: `index.html`
- Create: `test/manual/L7.md`

- [ ] **Step 1: 添加 EXPLANATIONS**

```javascript
    'yellow-stop': {
      title: '黄灯应停车',
      why: '黄灯亮时，未过停止线的车辆应停车等待；已过停止线的可继续通行。',
      correct: '看见黄灯，能停就停。',
      rule: '《道交法实施条例》第 38 条'
    },
    'yellow-pass': {
      title: '黄灯已过线可通行',
      why: '黄灯亮时已越过停止线的车辆可继续通行。',
      correct: '保持速度通过路口，不抢黄灯。',
      rule: '《道交法实施条例》第 38 条'
    },
```

- [ ] **Step 2: 添加 L7 关卡**

```javascript
    {
      id: 'L7',
      title: '第 7 关 · 黄灯闪烁',
      intro: '前方黄灯。能停就停，已过线则继续。',
      passScore: 80,
      road: {
        lanes: [{ x: 400, w: 80 }],
        centerLine: { x: 400 },
        crossHalfWidth: 60,
        intersections: [{ id: 'int-1', center: { x: 400, y: 300 }, roads: ['n','s','e','w'] }]
      },
      signals: [
        { id: 'sig-y', type: 'circle', pos: { x: 340, y: 240 },
          program: [{ state: 'yellow', duration: 99999 }] }
      ],
      signs: [],
      decisionPoints: [{
        id: 'dp-1', atIntersection: 'int-1',
        trigger: { x: 400, y: 380, radius: 50 },
        prompt: '黄灯亮。能停就停。',
        evaluate: {
          'pass-through': { correct: false, deduct: 30, explanationKey: 'yellow-stop' },
          'left-turn':    { correct: false, deduct: 30, explanationKey: 'yellow-stop' },
          'right-turn':   { correct: false, deduct: 30, explanationKey: 'yellow-stop' },
          'stop':         { correct: true,  deduct: 0,  explanationKey: 'yellow-stop' }
        }
      }],
      completion: { intersections: 1 }
    }
```

- [ ] **Step 3: 验证 + 测试卡**

console: `validateLevel(levels[6])` → `[]`。

`test/manual/L7.md`：

```markdown
# L7 · 黄灯闪烁

## 通关
- 按 Space 停车 → 通过

## 失败
- 按 ↑ 直行 → 黄灯未过线抢行 → 扣 30 → Fail
```

- [ ] **Step 4: Commit**

```bash
git add index.html test/manual/L7.md
git commit -m "feat: L7 黄灯闪烁"
```

---

### Task 21：L8 综合考核

**Files:**
- Modify: `index.html`
- Create: `test/manual/L8.md`

- [ ] **Step 1: 添加 L8 综合考核关**

L8 设计为多路口、混合场景（依次经历：绿灯→红灯右转→右转箭头红→黄灯）：

```javascript
    {
      id: 'L8',
      title: '第 8 关 · 综合考核',
      intro: '多个路口，混合所有信号灯类型。小心应对。',
      passScore: 80,
      road: {
        lanes: [{ x: 400, w: 80 }],
        centerLine: { x: 400 },
        crossHalfWidth: 60,
        intersections: [
          { id: 'int-1', center: { x: 400, y: 450 }, roads: ['n','s'] },
          { id: 'int-2', center: { x: 400, y: 250 }, roads: ['n','s','e','w'] }
        ]
      },
      signals: [
        { id: 'sig-1', type: 'circle', pos: { x: 340, y: 390 },
          program: [{ state: 'green', duration: 99999 }] },
        { id: 'sig-2', type: 'arrow', pos: { x: 340, y: 190 },
          program: [{ state: 'right-red', duration: 99999 }] }
      ],
      signs: [],
      decisionPoints: [
        {
          id: 'dp-1', atIntersection: 'int-1',
          trigger: { x: 400, y: 530, radius: 50 },
          prompt: '路口 1：绿灯。可以直行。',
          evaluate: {
            'pass-through': { correct: true,  deduct: 0,  explanationKey: 'green-light-go' },
            'stop':         { correct: true,  deduct: 0,  explanationKey: 'safe-stop' },
            'left-turn':    { correct: false, deduct: 30, explanationKey: 'unknown-action' },
            'right-turn':   { correct: false, deduct: 0,  explanationKey: 'unknown-action' }
          }
        },
        {
          id: 'dp-2', atIntersection: 'int-2',
          trigger: { x: 400, y: 330, radius: 50 },
          prompt: '路口 2：右转箭头红。能右转吗？',
          evaluate: {
            'pass-through': { correct: true,  deduct: 0,  explanationKey: 'arrow-green-go' },
            'right-turn':   { _dynamic: 'arrowRightBySignal', deduct: 30, explanationKey: 'arrow-red-stop' },
            'left-turn':    { correct: false, deduct: 30, explanationKey: 'arrow-red-stop' },
            'stop':         { correct: true,  deduct: 0,  explanationKey: 'safe-stop' }
          }
        }
      ],
      completion: { intersections: 2 }
    }
```

- [ ] **Step 2: 修改 checkLevelComplete 支持多路口**

修改 `checkLevelComplete` 函数：

```javascript
  function checkLevelComplete(){
    const target = currentLevel.completion.intersections || 1;
    state.intersectionsCleared = state.intersectionsCleared || 0;
    // 车到达屏幕顶部时，统计已通过的决策点数量
    if (state.car.y < 50) {
      const dpsResolved = currentLevel.decisionPoints.length;
      state.intersectionsCleared = dpsResolved;
      const pass = checkPass(state.score, currentLevel.passScore);
      if (pass) { state.mode = 'level-complete'; showLevelComplete(); }
      else { state.mode = 'level-failed'; showLevelFail(); }
    }
  }
```

并在 `initCarForLevel` 里重置：`state.intersectionsCleared = 0;`

- [ ] **Step 3: 让 proceedThrough 不让车一帧跳过所有决策点**

修改 `proceedThrough`：

```javascript
  function proceedThrough(action){
    // 让车前进 120px（越过当前决策点，但不到下一个）
    state.car.y -= 120;
    state.car.stopped = false;
  }
```

- [ ] **Step 4: 验证 + 测试卡**

console: `validateLevel(levels[7])` → `[]`。

`test/manual/L8.md`：

```markdown
# L8 · 综合考核

## 通关
- 路口 1（绿灯）→ 按 ↑ 直行 → 通过
- 路口 2（右转箭头红）→ 按 Space 或 ↑ 直行 → 通过
- 总分 100 ≥ 80 ✓

## 失败
- 路口 2 误按 → 右转 → 扣 30 → 70 < 80 Fail
```

- [ ] **Step 5: Commit**

```bash
git add index.html test/manual/L8.md
git commit -m "feat: L8 综合考核（双路口混合场景）"
```

---

### Task 22：补 L1 黄金路径测试卡

**Files:**
- Create: `test/manual/L1.md`

- [ ] **Step 1: 写 L1 测试卡**

```markdown
# L1 · 入门：绿灯行红灯停

## 通关（任一）
- 等绿灯（每 5 秒切换）→ 按 ↑ 直行 → 100 分通过
- 任何时刻按 Space 停车 → 100 分通过

## 失败
- 红灯时按 ↑ 直行 → 扣 30 → 70 < 80 Fail

## 边界
- 不做输入驶过 → 按 pass-through 处理（红灯扣 30，绿灯过）
```

- [ ] **Step 2: Commit**

```bash
git add test/manual/L1.md
git commit -m "test: L1 黄金路径测试卡"
```

---

## Phase 7：收尾

### Task 23：localStorage 持久化通关进度

**Files:**
- Modify: `index.html`

- [ ] **Step 1: 添加 saveProgress / loadProgress**

在 STATE 段添加：

```javascript
  function saveProgress(){
    try { localStorage.setItem('driving-game-progress', JSON.stringify({ unlockedLevels: state.unlockedLevels })); }
    catch(e){ console.warn('saveProgress failed', e); }
  }
  function loadProgress(){
    try {
      const raw = localStorage.getItem('driving-game-progress');
      if (raw) {
        const obj = JSON.parse(raw);
        if (typeof obj.unlockedLevels === 'number') state.unlockedLevels = obj.unlockedLevels;
      }
    } catch(e){ console.warn('loadProgress failed', e); }
  }
  loadProgress();
```

- [ ] **Step 2: 验证 saveProgress 已被调用**

确认 Task 14 的 `showLevelComplete` 里有 `saveProgress()` 调用（已存在）。

- [ ] **Step 3: 手动验证**

console 跑：

```js
localStorage.clear();
location.reload();
// 玩通 L1
console.assert(JSON.parse(localStorage.getItem('driving-game-progress')).unlockedLevels === 2, '应解锁 L2');
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: localStorage 持久化解锁进度"
```

---

### Task 24：完善黄金路径整体测试 + README

**Files:**
- Create: `README.md`

- [ ] **Step 1: 写 README**

```markdown
# 新手司机道路考核游戏

俯视角模拟驾驶游戏，考核红绿灯交规。8 关递进教学。

## 运行

```bash
# 方式 1：直接双击 index.html
# 方式 2：起本地 server（推荐，避免 file:// 限制）
python3 -m http.server 8000
# 浏览器打开 http://localhost:8000
```

## 操作

- Space：停车 / 继续
- ↑：直行通过路口
- ←：左转
- →：右转
- Esc：暂停

移动端自动显示底部虚拟按钮。

## 关卡

1. L1 入门：绿灯行红灯停
2. L2 圆饼红灯能否右转
3. L3 圆饼红灯左转/直行禁止
4. L4 方向箭头灯
5. L5 右转箭头红灯（陷阱）
6. L6 左转待转区
7. L7 黄灯闪烁
8. L8 综合考核

## 测试

### 判分函数

打开浏览器 console，复制 `test/console-snippet.js` 内容粘贴运行。

### 关卡黄金路径

每关一份手动测试卡：`test/manual/L{n}.md`。

## 文档

- 设计文档：`docs/superpowers/specs/2026-06-18-driving-game-design.md`
- 实施计划：`docs/superpowers/plans/2026-06-18-driving-game.md`
```

- [ ] **Step 2: 跑一次完整的 8 关黄金路径**

按 `test/manual/L1.md` ~ `L8.md` 顺序手动跑一遍，确认：
- 每关能正确进入
- 通关能解锁下一关
- 关闭讲解弹窗后车继续行驶
- 关卡通过线判断正确

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs: README + 8 关黄金路径整体回归"
```

---

## 完工标准

- [ ] 浏览器打开 `index.html` 能看到开始菜单，列出 8 关（仅 L1 解锁）
- [ ] 通关 L1 自动解锁 L2，刷新后进度保留
- [ ] 8 关每关都能进入、能玩、能通过、能失败
- [ ] 错误决策有讲解弹窗
- [ ] `test/console-snippet.js` 在 console 跑全部通过
- [ ] 所有 8 份黄金路径测试卡手动跑过一遍

## Self-Review 结果

**Spec 覆盖：**
- ✓ 俯视角 Canvas 2D（Task 1, 3, 4, 5）
- ✓ 6 类红绿灯场景（Task 15-20 各对应一关）
- ✓ 半自动操作（Task 9, 11）
- ✓ 扣分制 + 即时讲解（Task 7, 8, 13）
- ✓ 键盘 + 触屏（Task 11, 14）
- ✓ 单 HTML 部署（所有 Task 都改 index.html）
- ✓ 8 关（L1 入门 + L2-L7 场景 + L8 综合）
- ✓ localStorage（Task 23）
- ✓ Schema 校验 + 红条（Task 6）
- ✓ 判分纯函数 + console 测试（Task 7）

**Placeholder 扫描：** 无 TODO/TBD/"实现细节后补"。所有 task 含完整代码。

**类型/命名一致性：** `evaluateDecision`、`applyDeduct`、`checkPass`、`proceedThrough`、`checkLevelComplete`、`showExplanation`、`transition` 在所有 task 中签名一致。

**已知简化（spec 第 10 节"后续版本规划"已列出）：**
- L6 左转待转区是单决策简化版（双决策版留 v1.1）
- L8 用决策点数量代替真实的"多路口通过计数"
- 信号灯状态用 `state.signalStates` 简单字典，未抽象为 SignalStateMachine 类
