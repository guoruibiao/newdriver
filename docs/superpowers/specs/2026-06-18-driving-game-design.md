# 新手司机道路考核游戏 · 设计文档

**日期**：2026-06-18
**状态**：已确认，待 writing-plans 转实现计划

---

## 1. 项目目标

构建一个**纯前端单 HTML 文件**的网页交互游戏，让 **驾考学员与新手司机**在俯视角下模拟驾驶，通过 8 个递进关卡系统化考核红绿灯相关交规。游戏提供 **扣分制 + 即时讲解** 的反馈机制，目标是"教会"而非"娱乐"。

### 1.1 范围

**In Scope（v1）**
- 8 个关卡（1 入门 + 6 场景关 + 1 综合）
- 6 类红绿灯场景：圆饼红灯右转 / 圆饼红灯左转直行 / 方向箭头灯 / 右转箭头红灯 / 左转待转区 / 黄灯闪烁
- 俯视角 Canvas 2D 渲染
- 半自动操作（车自动行驶，玩家在路口前决策）
- 扣分制 + 即时讲解弹窗
- 键盘 + 触屏虚拟按钮
- 单 HTML 文件分发
- localStorage 保存通关进度

**Out of Scope（v1.1+ 再考虑）**
- 真实物理引擎、车道保持、自由转向
- 第一/第三人称视角、3D 渲染
- 多车交互、行人/非机动车动态（行人仅作为静态考点出现）
- 后端服务、多账号、成绩上传
- 题库后台、动态出题
- 移动 App 打包

### 1.2 成功标准

- 玩家能完整通关 8 关，每关有明确的"通过/失败"判定
- 错误决策后玩家能立刻知道"为什么错"和"正确做法"
- 加新关卡只需修改 `LEVELS[]` 数据，不改逻辑代码
- 判分逻辑能独立于 Canvas/游戏循环运行（可单测）

---

## 2. 核心决策汇总

| 维度 | 决策 | 理由 |
|---|---|---|
| 目标用户 | 驾考 / 新手学习辅助 | 严谨交规教学 |
| 玩法形式 | 实时模拟驾驶 | 沉浸 + 实操感 |
| 视角 | 俯视角 | Canvas 2D 实现成本最低，路口结构清晰 |
| 考核范围 | 6 个红绿灯场景全覆盖 | 驾考高频考点 |
| 关卡结构 | 1 入门 + 6 场景关 + 1 综合 = 8 关 | 循序渐进 |
| 操作粒度 | 半自动（行/停 + 方向） | 保留驾驶感，避免物理引擎 |
| 判分 | 扣分制（满分 100）+ 即时讲解 | 教学友好，允许试错 |
| 输入 | 键盘 + 触屏虚拟按钮 | 覆盖桌面 + 移动 |
| 部署 | 纯前端单 HTML | 分发简单，双击即开 |
| 架构风格 | 单体脚本 + 数据驱动关卡 | 折中：分发简单 + 关卡可扩展 |

---

## 3. 架构

### 3.1 文件结构

```
index.html
├─ <style>                       全部 CSS
├─ <body>
│  ├─ <canvas id="game">         游戏画面
│  ├─ <div id="hud">             顶部分数/关卡/目标
│  ├─ <div id="decision-prompt"> 路口前操作提示
│  ├─ <div id="explain-modal">   错误讲解弹窗
│  ├─ <div id="start-screen">    关卡选择菜单
│  └─ <div id="touch-buttons">   移动端虚拟按钮
└─ <script>                      单脚本，四段：
   ├─ ① DATA       LEVELS[]、TRAFFIC_RULES、SCORE_CONFIG、EXPLANATIONS
   ├─ ② STATE      game = { mode, levelIdx, score, car, ... }
   ├─ ③ RENDER     draw() 分层：背景 → 灯 → 车 → 行人(可选)
   ├─ ④ LOGIC      update(dt)、decide(action)、score(action)、explain()
   └─ ⑤ LOOP+INPUT rAF 主循环、键盘/触摸事件路由
```

### 3.2 设计原则

1. **数据驱动关卡**：8 关每关一个统一结构的 JS 对象。加新关只改 `LEVELS[]`。
2. **判分逻辑纯函数**：`evaluateDecision(decisionPoint, action, signals) → {correct, deduct, explanationKey}`。可独立测试，不耦合渲染。
3. **游戏模式状态机**：`menu → playing → explaining → level-complete / level-failed → menu`。
4. **Canvas 分层重绘**：背景层静态缓存，只重绘动态层（车、信号灯、HUD）。

---

## 4. 组件清单

### 4.1 画面层（Canvas 绘制）

| 组件 | 职责 | 依赖 |
|---|---|---|
| `RoadRenderer` | 道路、车道线、停止线、人行横道、路口几何 | `level.road` |
| `LightRenderer` | 圆饼灯 / 方向箭头灯 / 辅助标志 | `level.signals[]` + 灯当前状态 |
| `CarRenderer` | 玩家车辆 + 朝向 + 简单装饰 | `state.car` |
| `PedestrianRenderer`（v1.1） | 静态行人考点 | `level.pedestrians[]` |

### 4.2 UI 层（DOM 元素）

| 组件 | 触发时机 | 内容 |
|---|---|---|
| `StartScreen` | 进入 `menu` 模式 | 8 关按钮，已通关高亮，未解锁灰显 |
| `HUD` | `playing` 全程 | 关卡 / 分数 / 目标分 / 暂停 |
| `DecisionPrompt` | 进入决策区（路口前 ~50px） | 操作提示 + 当前信号灯摘要 |
| `ExplainModal` | 错误决策后 | "为什么错 / 正确做法 / 关联交规" + 关闭按钮 |
| `TouchButtons` | 触屏设备 | Space + 方向键 + 暂停 |
| `LevelCompleteScreen` | 通过关卡 | 分数 + 错误数 + 重玩/下一关/回菜单 |
| `LevelFailScreen` | 分数 < passScore | 分数 + 重试/回菜单 |

### 4.3 逻辑模块

| 模块 | 职责 |
|---|---|
| `gameState` | 全局状态 + 模式状态机 |
| `CarController` | 半自动行驶：自动按车道前进，玩家决定行/停 + 转向 |
| `IntersectionDetector` | 检测车辆是否进入决策区 |
| `evaluateDecision` | **判分纯函数** |
| `ScoringEngine` | 累积扣分、判断通过线 |
| `LevelLoader` | 加载关卡 + 初始化状态 + schema 校验 |

### 4.4 边界约束

- Canvas 只读状态，不改状态
- DOM UI 不直接调 Canvas，联动通过 `gameState`
- 判分与文案解耦：`evaluateDecision` 只返回 `explanationKey`，文案查 `DATA.EXPLANATIONS`

---

## 5. 数据结构

### 5.1 关卡数据结构

以"圆饼红灯能否右转"关为例：

```js
{
  id: 'L2-red-right-turn',
  title: '第 2 关 · 圆饼红灯能否右转',
  intro: '前方圆饼红灯，无禁右标志。你的车道允许直行或右转。',
  passScore: 80,

  road: {
    width: 800, height: 1200,
    lanes: [ /* 车道几何 */ ],
    intersections: [
      { id: 'int-1', center: {x:400,y:600},
        roads: ['north','south','east','west'],
        stopLines: [ /* 各方向停止线 */ ] }
    ]
  },

  signals: [
    { id: 'sig-n', type: 'circle',
      pos: {x:380,y:560},
      program: [{state:'red', duration:99999}] }
  ],

  signs: [],  // 无禁右标志 → 右转默认允许

  decisionPoints: [
    {
      id: 'dp-1',
      atIntersection: 'int-1',
      trigger: {x:380,y:700,radius:60},
      prompt: '圆饼红灯，准备通过路口',
      evaluate: {
        'pass-through': { correct:false, deduct:30, explanationKey:'red-light-stop' },
        'right-turn':   { correct:true,  deduct:0,  explanationKey:'circle-red-right-allowed' },
        'left-turn':    { correct:false, deduct:30, explanationKey:'red-light-no-left' },
        'stop':         { correct:true,  deduct:0,  explanationKey:'safe-stop' }
      }
    }
  ],

  completion: { intersections: 1 }
}
```

**关键字段说明**

- `evaluate`：判分表，覆盖 4 种动作 `pass-through / left-turn / right-turn / stop`，每个动作显式声明结果
- `signals[].program`：信号灯时序，`[{state, duration}]` 数组，循环播放；长红用 `duration: 99999`
- `signs`：通过是否含 `no-right-on-red` 表达"能否右转"，逻辑层读字段而非硬编码
- `completion`：关卡完成条件（如通过 N 个路口）

### 5.2 全局状态

```js
const state = {
  mode: 'menu' | 'playing' | 'awaiting-decision' | 'explaining'
        | 'level-complete' | 'level-failed' | 'paused',
  levelIdx: 0,
  score: 100,
  car: { x, y, heading, speed, currentLane },
  currentDecisionPoint: null,
  signalStates: { /* 各信号灯当前状态 */ },
  unlockedLevels: 1,  // localStorage 持久化
}
```

### 5.3 全局数据

```js
const SCORE_CONFIG = {
  initial: 100,
  severity: { minor: 10, normal: 20, major: 30, critical: 50 }
};

const EXPLANATIONS = {
  'red-light-stop': { title:'闯红灯', why:'...', correct:'...', rule:'《道交法》第26条' },
  'circle-red-right-allowed': { title:'圆饼红灯允许右转', why:'...', correct:'...', rule:'...' },
  // ... 每个判分 key 对应一条讲解
};
```

---

## 6. 数据流

### 6.1 一次决策的完整时序

```
[加载关卡] LevelLoader.init(idx)
    ↓
state = { mode:'playing', car:{...}, score:100 }

[每帧 rAF]
  update(dt)
    ├─ CarController.advance(dt)            // 自动按车道前进
    └─ IntersectionDetector.check()
        └─ 进入决策区?  →  mode = 'awaiting-decision'
                          DecisionPrompt 显示
  render()                                  // 分层重绘

[玩家输入] Input.route(action)
    ↓
decide(action)
  ├─ evaluateDecision(decisionPoint, action, signals)
  │     → { correct, deduct, explanationKey }
  ├─ deduct > 0 ?
  │   yes → score -= deduct
  │         → mode = 'explaining'
  │         → ExplainModal.show(EXPLANATIONS[key])
  │   no  → CarController.proceedThrough(action)

[关卡结束] ScoringEngine.checkPass(score, passScore)
    → LevelCompleteScreen 或 LevelFailScreen
```

### 6.2 状态机模式切换

```
                  ┌──────────┐
        ┌────────→│   menu   │←────────┐
        │         └────┬─────┘         │
        │              ↓ 选关           │
        │       ┌────────────┐         │
        │       │  playing   │         │
        │       └──┬──────┬──┘         │
        │  错误决策│      │通关          │
        │          ↓      ↓            │
        │    ┌─────────┐ ┌─────────┐   │
        │    │explaining│ │complete │───┤
        │    └────┬────┘ └─────────┘   │
        │      关闭│                    │
        │          ↓                    │
        │      playing                  │
        │          │ 分数<passScore     │
        │          ↓                    │
        │     ┌──────────┐              │
        └─────│   fail   │──────────────┘
              └──────────┘
```

`paused` 可从 `playing` / `awaiting-decision` 进入，提供"继续 / 重玩 / 回菜单"。

---

## 7. 错误处理与边界情况

### 7.1 玩家行为边界

| 情况 | 处理 | 扣分 |
|---|---|---|
| 决策区未做输入，车驶过路口 | 按 `pass-through` 评估 | 按 `evaluate['pass-through'].deduct` |
| 反复按 Space 停/走犹豫 | 允许，最终必须做方向决策 | 0 |
| 黄灯关卡决策超时（停 5 秒未行动） | 弹超时提示 + 按"未及时决策"扣分 | 20 |
| 非决策区按方向键 | 忽略（半自动模式） | 0 |
| 讲解弹窗时狂按键盘 | 冻结输入 | 0 |

### 7.2 关卡状态边界

| 情况 | 处理 |
|---|---|
| 分数 < passScore 但关卡未结束 | 继续行驶，结算时才判 fail |
| 分数扣到 0 以下 | 钳制为 0，仍走完结算 |
| 中途按 Esc / 暂停 | 进入 `paused`，提供继续/重玩/回菜单 |
| 关闭浏览器/刷新 | `localStorage` 保存通关进度，本局进度丢失 |

### 7.3 数据完整性

| 情况 | 处理 |
|---|---|
| 关卡数据缺字段 | `LevelLoader` 加载时 schema 校验，缺字段 → 弹"关卡数据异常" + 回菜单 |
| `explanationKey` 查不到 | 降级为通用文案 + console.warn |
| 信号灯 `program` 播完无循环 | 保持最后一帧状态 |

### 7.4 浏览器/设备边界

| 情况 | 处理 |
|---|---|
| 浏览器不支持 Canvas | `StartScreen` 降级文案 |
| 触屏设备 | 显示 `TouchButtons`，不绑键盘事件 |
| 桌面 + 触屏 | 优先键盘，`TouchButtons` 按 `navigator.maxTouchPoints` 隐藏 |
| 屏幕 < 600px 宽 | Canvas 等比缩放，HUD 字体适配 |
| `requestAnimationFrame` 异常（标签页失活） | `dt` 钳制到 100ms 上限 |

### 7.5 判分纯函数的输入保护

```js
function evaluateDecision(dp, action, signals) {
  if (!dp.evaluate[action]) {
    return { correct: false, deduct: 0, explanationKey: 'unknown-action' };
  }
  const relevantSignal = lookupSignal(dp, signals);
  if (!relevantSignal) {
    return { correct: false, deduct: 20, explanationKey: 'signal-missing' };
  }
  return dp.evaluate[action];
}
```

---

## 8. 测试策略

### 8.1 测试金字塔

```
       ┌──────────────┐
       │  手动黄金路径  │ ← 8 关每关一份"通关 + 失败"清单
       └──────┬───────┘
       ┌──────┴───────┐
       │  内置自检     │ ← 启动时 schema 校验 + 红条提示
       └──────┬───────┘
       ┌──────┴───────┐
       │  纯函数单测   │ ← 判分函数 Node 跑
       └──────────────┘
```

### 8.2 纯函数单测

`scoring.js` 暴露 `evaluateDecision` 到 `window.__test__`（浏览器）和 `module.exports`（Node），附 `test/scoring.spec.js`：

```js
const { evaluateDecision } = require('../scoring.js');
const assert = require('assert');
assert.strictEqual(
  evaluateDecision(L2_DP1, 'right-turn', L2_SIGNALS).correct, true
);
// 覆盖 6 场景 × 4 动作 ≈ 24 case
```

跑：`node test/scoring.spec.js`，零依赖。

### 8.3 内置自检（启动时）

`LevelLoader` 加载关卡时校验：
- 必填字段：`id / title / passScore / road / signals / decisionPoints`
- 每个 `decisionPoint.evaluate` 至少含 `pass-through`
- 每个 `explanationKey` 在 `EXPLANATIONS` 中能查到

发现问题 → `StartScreen` 顶部红条提示（不阻塞游戏）。

### 8.4 黄金路径清单

每关一份 `test/manual/L{n}.md`，包含：
- **通关路径**：正确决策 → 通过
- **失败路径**：典型错误决策 → 扣分 → fail
- **边界**：未做输入驶过 / 反复犹豫 / 暂停

### 8.5 不做的事

- 不引入 vitest/jest（违背"分发简单"约束）
- 不做代码覆盖率
- 不做 CI（v1 不上）

---

## 9. 8 关内容设计（草案）

| # | 关卡 | 主题 | 考核点 |
|---|---|---|---|
| L1 | 入门：绿灯行红灯停 | 基础反应 | 圆饼红灯停 / 绿灯行 |
| L2 | 圆饼红灯能否右转 | 高频考点 | 看禁右标志 + 让行人 |
| L3 | 圆饼红灯左转/直行 | 基础规则 | 红灯时禁止左转/直行 |
| L4 | 方向箭头灯 | 车道对应 | 按自己车道的箭头行驶 |
| L5 | 右转箭头红灯 | 老司机陷阱 | 右转箭头红 = 必须停 |
| L6 | 左转待转区 | 难点 | 直行绿+左转红 → 待转区 |
| L7 | 黄灯/黄灯闪烁 | 反应训练 | 能停就停，已过线则继续 |
| L8 | 综合考核 | 随机出题 | 上述场景混合 |

---

## 10. 后续版本规划

- **v1.1**：行人/非机动车动态、左转待转区动画、Playwright E2E
- **v1.2**：自定义关卡编辑器、关卡分享（URL 分享）
- **v2.0**：第三人称追尾视角（伪 3D）、多车交互
