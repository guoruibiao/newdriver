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
