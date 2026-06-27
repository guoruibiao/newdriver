// 复制粘贴到浏览器 console 跑全关卡判分测试
(function(){
  const t = window.game.__test;
  const s = window.game.state;
  const assert = (cond, msg) => { if (!cond) { console.error('FAIL: ' + msg); throw new Error(msg); } else console.log('  PASS: ' + msg); };
  const ev = (dp, action, sig) => t.evaluateDecision(dp, action, sig);

  // ===== 辅助：加载关卡并返回 =====
  function load(idx) {
    t.loadLevel(idx);
    // loadLevel 设置了闭包 currentLevel 并返回
    // 需要通过 transition 触发 loadLevel 内部赋值
    s.levelIdx = idx;
    window.game.transition('level-complete'); // 先到可重入态
    window.game.transition('playing');         // 触发 loadLevel + initCar
    return s;
  }

  // ===== L1 · 绿灯行红灯停 =====
  console.log('L1 · 入门：绿灯行红灯停');
  (function(){
    load(0);
    const lv = t.levels[0];
    const dp = lv.decisionPoints[0];
    let r;
    r = ev(dp, 'pass-through', {'sig-n':'red'});
    assert(r.correct === false && r.deduct === 30, '红灯直行→错/扣30');
    r = ev(dp, 'pass-through', {'sig-n':'green'});
    assert(r.correct === true && r.deduct === 0, '绿灯直行→对/不扣');
    r = ev(dp, 'pass-through', {'sig-n':'yellow'});
    assert(r.correct === true, '黄灯直行→对');
    r = ev(dp, 'right-turn', {'sig-n':'red'});
    assert(r.correct === true, '红灯右转→对(圆饼不禁右)');
    r = ev(dp, 'stop', {'sig-n':'red'});
    assert(r.correct === true && r.deduct === 0, '红灯停车→对');
    r = ev(dp, 'fly', {'sig-n':'red'});
    assert(r.correct === false && r.explanationKey === 'unknown-action', '未知动作→unknown-action');
  })();

  // ===== L2 · 圆饼红灯能否右转 =====
  console.log('L2 · 圆饼红灯能否右转');
  (function(){
    load(1);
    const lv = t.levels[1];
    const dp = lv.decisionPoints[0];
    let r;
    r = ev(dp, 'pass-through', {'sig-n':'red'});
    assert(r.correct === false, '红灯直行→错');
    r = ev(dp, 'right-turn', {'sig-n':'red'});
    assert(r.correct === true, '红灯右转→对(无禁右标志)');
    r = ev(dp, 'left-turn', {'sig-n':'red'});
    assert(r.correct === false, '红灯左转→错');
    r = ev(dp, 'stop', {'sig-n':'red'});
    assert(r.correct === true, '停车→对');
  })();

  // ===== L3 · 圆饼红灯+禁右标志 =====
  console.log('L3 · 圆饼红灯左转/直行禁止');
  (function(){
    load(2);
    const lv = t.levels[2];
    const dp = lv.decisionPoints[0];
    let r;
    r = ev(dp, 'right-turn', {'sig-n':'red'});
    assert(r.correct === false, '禁右标志+红灯右转→错');
    r = ev(dp, 'right-turn', {'sig-n':'green'});
    assert(r.correct === true, '绿灯右转→对');
    r = ev(dp, 'pass-through', {'sig-n':'red'});
    assert(r.correct === false, '红灯直行→错');
    r = ev(dp, 'stop', {'sig-n':'red'});
    assert(r.correct === true, '停车→对');
  })();

  // ===== L4 · 方向箭头灯 =====
  console.log('L4 · 方向箭头灯');
  (function(){
    load(3);
    const lv = t.levels[3];
    const dp = lv.decisionPoints[0];
    let r;
    r = ev(dp, 'pass-through', {'sig-arrow':'forward-green'});
    assert(r.correct === true, '直行绿+直行→对');
    r = ev(dp, 'pass-through', {'sig-arrow':'left-green'});
    assert(r.correct === false, '左转绿+直行→错');
    r = ev(dp, 'left-turn', {'sig-arrow':'left-green'});
    assert(r.correct === true, '左转绿+左转→对');
    r = ev(dp, 'left-turn', {'sig-arrow':'all-red'});
    assert(r.correct === false, '全红+左转→错');
    r = ev(dp, 'right-turn', {'sig-arrow':'right-green'});
    assert(r.correct === true, '右转绿+右转→对');
    r = ev(dp, 'stop', {'sig-arrow':'all-red'});
    assert(r.correct === true, '停车→对');
  })();

  // ===== L5 · 右转箭头红灯 =====
  console.log('L5 · 右转箭头红灯');
  (function(){
    load(4);
    const lv = t.levels[4];
    const dp = lv.decisionPoints[0];
    let r;
    r = ev(dp, 'right-turn', {'sig-circle':'green','sig-arrow':'right-red'});
    assert(r.correct === false, '箭头右红+右转→错');
    r = ev(dp, 'right-turn', {'sig-circle':'green','sig-arrow':'right-green'});
    assert(r.correct === true, '箭头右绿+右转→对');
    r = ev(dp, 'pass-through', {'sig-circle':'green','sig-arrow':'right-red'});
    assert(r.correct === true, '圆饼绿+直行(箭头右红无关)→对');
    r = ev(dp, 'stop', {'sig-circle':'red','sig-arrow':'right-red'});
    assert(r.correct === true, '停车→对');
  })();

  // ===== L6 · 左转待转区 =====
  console.log('L6 · 左转待转区');
  (function(){
    load(5);
    const lv = t.levels[5];
    const dpEnter = lv.decisionPoints[0];
    const dpTurn = lv.decisionPoints[1];
    let r;
    // dp-enter: 直行绿灯时左转 → 进入待转区
    r = ev(dpEnter, 'left-turn', {'sig-fwd':'green'});
    assert(r.correct === true, '直行绿+左转→进待转区→对');
    r = ev(dpEnter, 'left-turn', {'sig-fwd':'red'});
    assert(r.correct === false, '直行红+左转→闯红灯→错');
    r = ev(dpEnter, 'pass-through', {'sig-fwd':'green'});
    assert(r.correct === true, '直行绿+直行→对');
    r = ev(dpEnter, 'right-turn', {'sig-fwd':'red'});
    assert(r.correct === true, '圆饼红灯右转→对');
    // dp-turn: 左转绿灯时
    r = ev(dpTurn, 'left-turn', {'sig-left':'left-green'});
    assert(r.correct === true, '左转绿+左转→对');
    r = ev(dpTurn, 'left-turn', {'sig-left':'left-red'});
    assert(r.correct === false, '左转红+左转→错');
  })();

  // ===== L7 · 黄灯闪烁 =====
  console.log('L7 · 黄灯闪烁');
  (function(){
    load(6);
    const lv = t.levels[6];
    const dpStop = lv.decisionPoints[0];
    const dpPass = lv.decisionPoints[1];
    let r;
    r = ev(dpStop, 'pass-through', {'sig-y':'yellow-flash'});
    assert(r.correct === false, '黄闪+未过线直行→错');
    r = ev(dpStop, 'right-turn', {'sig-y':'yellow-flash'});
    assert(r.correct === true, '黄闪+右转→对');
    r = ev(dpStop, 'stop', {'sig-y':'yellow-flash'});
    assert(r.correct === true, '黄闪+停车→对');
    r = ev(dpPass, 'pass-through', {'sig-y':'yellow-flash'});
    assert(r.correct === true, '黄闪+已过线直行→对');
    r = ev(dpPass, 'left-turn', {'sig-y':'yellow-flash'});
    assert(r.correct === true, '黄闪+已过线左转→对');
  })();

  // ===== L8 · 综合考核 =====
  console.log('L8 · 综合考核');
  (function(){
    load(7);
    const lv = t.levels[7];
    const dp1 = lv.decisionPoints[0];
    const dp2 = lv.decisionPoints[1];
    let r;
    r = ev(dp1, 'pass-through', {'sig-1':'green'});
    assert(r.correct === true, '路口1圆饼绿+直行→对');
    r = ev(dp1, 'pass-through', {'sig-1':'red'});
    assert(r.correct === false, '路口1圆饼红+直行→错');
    r = ev(dp1, 'right-turn', {'sig-1':'red'});
    assert(r.correct === true, '路口1圆饼红+右转→对');
    r = ev(dp2, 'right-turn', {'sig-2':'right-red','sig-2-left':'left-green'});
    assert(r.correct === false, '路口2箭头右红+右转→错');
    r = ev(dp2, 'left-turn', {'sig-2':'right-red','sig-2-left':'left-green'});
    assert(r.correct === true, '路口2箭头左绿+左转→对');
  })();

  // ===== L9 · 多车道：正确车道通行 =====
  console.log('L9 · 多车道：正确车道通行');
  (function(){
    load(8);
    const lv = t.levels[8];
    const dp = lv.decisionPoints[0];
    const lanes = lv.road.lanes;
    let r;
    // 随机车道出发 → isLaneCorrectForAction 门控
    // 左转车道
    assert(t.isLaneCorrectForAction('left-turn','left-turn') === true, '左转车道+左转→门控通过');
    assert(t.isLaneCorrectForAction('left-turn','pass-through') === false, '左转车道+直行→门控拒绝');
    // 直行车道
    assert(t.isLaneCorrectForAction('forward','pass-through') === true, '直行车道+直行→门控通过');
    assert(t.isLaneCorrectForAction('forward','left-turn') === false, '直行车道+左转→门控拒绝');
    // 右转车道
    assert(t.isLaneCorrectForAction('right-turn','right-turn') === true, '右转车道+右转→门控通过');
    assert(t.isLaneCorrectForAction('right-turn','pass-through') === false, '右转车道+直行→门控拒绝');
    // stop 永远通过
    assert(t.isLaneCorrectForAction('left-turn','stop') === true, 'stop→门控永远通过');
    // 圆饼绿灯 + 合法车道动作
    r = ev(dp, 'left-turn', {'sig-n':'green'});
    assert(r.correct === true, '绿灯+左转车道左转→对');
    r = ev(dp, 'pass-through', {'sig-n':'green'});
    assert(r.correct === true, '绿灯+直行车道直行→对');
    r = ev(dp, 'right-turn', {'sig-n':'red'});
    assert(r.correct === true, '红灯+右转车道右转→对(圆饼不禁右)');
    r = ev(dp, 'pass-through', {'sig-n':'red'});
    assert(r.correct === false, '红灯+直行→错');
  })();

  // ===== L10 · 多车道+箭头灯 =====
  console.log('L10 · 多车道+箭头灯');
  (function(){
    load(9);
    const lv = t.levels[9];
    const dp = lv.decisionPoints[0];
    let r;
    r = ev(dp, 'pass-through', {'sig-arrow':'forward-green'});
    assert(r.correct === true, '直行绿+直行→对');
    r = ev(dp, 'pass-through', {'sig-arrow':'left-green'});
    assert(r.correct === false, '左转绿+直行→错');
    r = ev(dp, 'left-turn', {'sig-arrow':'left-green'});
    assert(r.correct === true, '左转绿+左转→对');
    r = ev(dp, 'right-turn', {'sig-arrow':'right-green'});
    assert(r.correct === true, '右转绿+右转→对');
    r = ev(dp, 'right-turn', {'sig-arrow':'forward-green'});
    assert(r.correct === false, '直行绿+右转→错');
  })();

  // ===== L11 · 转弯等待区 (随机左/右) =====
  console.log('L11 · 转弯等待区');
  (function(){
    load(10);
    // L11 由 _randomWaitingZone 动态生成，currentLevel 已被 loadLevel 填充
    const dps = s; // state 不可直接拿 decisionPoints，通过 levels 拿
    // 实际 currentLevel 在闭包内，这里通过 __test.levels 拿原始数据不靠谱
    // 改为直接测 evaluate 规则的通用逻辑
    let r;
    // 测 waitingZoneEnterBySignal: 直行绿→进待转区
    const fakeDp = { signalBindings: ['sig-fwd'], evaluate: {
      'left-turn': { _dynamic: 'waitingZoneEnterBySignal', deduct: 30, explanationKey: 'waiting-zone-premature' },
    }};
    r = ev(fakeDp, 'left-turn', {'sig-fwd':'green'});
    assert(r.correct === true, '直行绿+左转进待转区→对');
    r = ev(fakeDp, 'left-turn', {'sig-fwd':'red'});
    assert(r.correct === false, '直行红+左转进待转区→错');
  })();

  // ===== L12 · 黄灯转弯等待区 =====
  console.log('L12 · 黄灯转弯等待区');
  (function(){
    load(11);
    const lv = t.levels[11];
    const dpStop = lv.decisionPoints[0];
    const dpWait = lv.decisionPoints[1];
    let r;
    r = ev(dpStop, 'pass-through', {'sig-y':'yellow-flash'});
    assert(r.correct === false, '黄闪未过线直行→错');
    r = ev(dpStop, 'right-turn', {'sig-y':'yellow-flash'});
    assert(r.correct === true, '黄闪+右转→对');
    r = ev(dpWait, 'pass-through', {'sig-y':'yellow-flash'});
    assert(r.correct === true, '黄闪已过线直行→对');
    r = ev(dpWait, 'left-turn', {'sig-y':'yellow-flash'});
    assert(r.correct === true, '黄闪已过线左转→对');
    r = ev(dpWait, 'pass-through', {'sig-y':'green'});
    assert(r.correct === true, '绿灯已过线直行→对');
  })();

  // ===== L13 · 路口掉头 =====
  console.log('L13 · 路口掉头');
  (function(){
    load(12);
    const lv = t.levels[12];
    const dp = lv.decisionPoints[0];
    let r;
    // u-turn 需要左转车道
    assert(t.isLaneCorrectForAction('left-turn','u-turn') === true, '左转车道+掉头→门控通过');
    assert(t.isLaneCorrectForAction('forward','u-turn') === false, '直行车道+掉头→门控拒绝');
    assert(t.isLaneCorrectForAction('right-turn','u-turn') === false, '右转车道+掉头→门控拒绝');
    // 信号判定
    r = ev(dp, 'u-turn', {'sig-left':'left-green','sig-circle':'red'});
    assert(r.correct === true, '左转绿+掉头→对');
    r = ev(dp, 'u-turn', {'sig-left':'left-red','sig-circle':'green'});
    assert(r.correct === true, '圆饼绿+掉头→对');
    r = ev(dp, 'u-turn', {'sig-left':'left-red','sig-circle':'red'});
    assert(r.correct === false, '全红+掉头→错');
    // 右转→圆饼红灯允许
    r = ev(dp, 'right-turn', {'sig-left':'left-red','sig-circle':'red'});
    assert(r.correct === true, '全红+右转(圆饼不禁右)→对');
  })();

  // ===== L14 · 禁止掉头 =====
  console.log('L14 · 禁止掉头');
  (function(){
    load(13);
    const lv = t.levels[13];
    const dp = lv.decisionPoints[0];
    let r;
    r = ev(dp, 'u-turn', {'sig-left':'left-green','sig-circle':'red'});
    assert(r.correct === false, '禁掉标志+左转绿+掉头→错');
    r = ev(dp, 'u-turn', {'sig-left':'left-red','sig-circle':'green'});
    assert(r.correct === false, '禁掉标志+圆饼绿+掉头→错');
    r = ev(dp, 'stop', {'sig-left':'left-red','sig-circle':'red'});
    assert(r.correct === true, '停车→对');
  })();

  // ===== L15 · 信号灯故障 =====
  console.log('L15 · 信号灯故障');
  (function(){
    load(14);
    const lv = t.levels[14];
    const dpSlow = lv.decisionPoints[0];
    const dpProceed = lv.decisionPoints[1];
    let r;
    // dp-slow: 信号灯全灭→停车观察
    r = ev(dpSlow, 'stop', {'sig-n':'all-dark'});
    assert(r.correct === true, '灯灭+停车→对');
    r = ev(dpSlow, 'pass-through', {'sig-n':'all-dark'});
    assert(r.correct === false, '灯灭+直行(未减速)→错');
    r = ev(dpSlow, 'right-turn', {'sig-n':'all-dark'});
    assert(r.correct === true, '灯灭+右转→对(圆饼不禁右)');
    // dp-proceed: 已减速后可通行
    r = ev(dpProceed, 'pass-through', {'sig-n':'all-dark'});
    assert(r.correct === true, '灯灭+已减速直行→对');
    r = ev(dpProceed, 'pass-through', {'sig-n':'red'});
    assert(r.correct === false, '灯恢复红+直行→错');
  })();

  // ===== L16 · 可变车道 =====
  console.log('L16 · 可变车道');
  (function(){
    load(15);
    const lv = t.levels[15];
    const dp = lv.decisionPoints[0];
    let r;
    // variable 车道：LED方向影响有效车道类型
    assert(t.isLaneCorrectForAction('variable','pass-through') === true, 'variable默认→forward→直行门控通过');
    // 可变车道+LED指示匹配
    // 模拟在可变车道，indicator=left，信号绿
    s.variableLaneStates = ['left'];
    s.car = s.car || {};
    s.car.currentLaneIdx = 1; // variable lane
    r = ev(dp, 'left-turn', {'sig-n':'green'});
    // variableLaneByIndicator: currentLane.type='variable', indicator='left', actionDir='left' → match → green → correct
    assert(r.correct === true, '可变车道LED=左+左转+绿灯→对');
    r = ev(dp, 'pass-through', {'sig-n':'green'});
    // indicator='left' 但 actionDir='forward' → mismatch → wrong
    assert(r.correct === false, '可变车道LED=左+直行→方向不匹配→错');
    // 非可变车道
    s.car.currentLaneIdx = 0; // left-turn lane
    r = ev(dp, 'left-turn', {'sig-n':'green'});
    assert(r.correct === true, '固定左转车道+绿灯左转→对');
    r = ev(dp, 'left-turn', {'sig-n':'red'});
    assert(r.correct === false, '固定左转车道+红灯左转→错');
    // 右转车道→circleRightBySignal
    r = ev(dp, 'right-turn', {'sig-n':'red'});
    assert(r.correct === true, '右转车道+红灯右转→对(圆饼不禁右)');
  })();

  // ===== L17 · 铁道路口 =====
  console.log('L17 · 铁道路口');
  (function(){
    load(16);
    const lv = t.levels[16];
    const dpRr = lv.decisionPoints[0];
    const dpInt = lv.decisionPoints[1];
    let r;
    // 栏杆放下→禁止通行
    s.railroadStates = {'rr-1':'barrier-down'};
    r = ev(dpRr, 'pass-through', {'sig-n':'green'});
    assert(r.correct === false, '栏杆下+直行→错');
    r = ev(dpRr, 'stop', {'sig-n':'green'});
    assert(r.correct === true, '栏杆下+停车→对');
    // 栏杆抬起→允许
    s.railroadStates = {'rr-1':'barrier-up'};
    r = ev(dpRr, 'pass-through', {'sig-n':'green'});
    assert(r.correct === true, '栏杆上+直行→对');
    // dp-intersection
    r = ev(dpInt, 'pass-through', {'sig-n':'green'});
    assert(r.correct === true, '路口绿灯直行→对');
    r = ev(dpInt, 'pass-through', {'sig-n':'red'});
    assert(r.correct === false, '路口红灯直行→错');
    r = ev(dpInt, 'right-turn', {'sig-n':'red'});
    assert(r.correct === true, '路口红灯右转→对');
  })();

  // ===== L18 · 压线违章 =====
  console.log('L18 · 压线违章');
  (function(){
    load(17);
    const lv = t.levels[17];
    const dp = lv.decisionPoints[0];
    // 实线阻止变道→玩家必须在当前车道操作
    // 车道门控
    assert(t.isLaneCorrectForAction('left-turn','left-turn') === true, '左转车道+左转→门控通过');
    assert(t.isLaneCorrectForAction('forward','pass-through') === true, '直行车道+直行→门控通过');
    assert(t.isLaneCorrectForAction('right-turn','right-turn') === true, '右转车道+右转→门控通过');
    let r;
    r = ev(dp, 'pass-through', {'sig-n':'green'});
    assert(r.correct === true, '绿灯直行→对');
    r = ev(dp, 'right-turn', {'sig-n':'red'});
    assert(r.correct === true, '红灯右转→对');
    r = ev(dp, 'pass-through', {'sig-n':'red'});
    assert(r.correct === false, '红灯直行→错');
  })();

  // ===== L19 · 转弯让直行 =====
  console.log('L19 · 转弯让直行');
  (function(){
    load(18);
    const lv = t.levels[18];
    const dp = lv.decisionPoints[0];
    // 随机车道 → 车道门控
    assert(t.isLaneCorrectForAction('left-turn','left-turn') === true, '左转车道+左转→门控通过');
    assert(t.isLaneCorrectForAction('forward','pass-through') === true, '直行车道+直行→门控通过');
    assert(t.isLaneCorrectForAction('right-turn','right-turn') === true, '右转车道+右转→门控通过');
    let r;
    // 绿灯+NPC在场→左转必须让行
    s.npcs = [{ id:'npc-1', x:450, y:200, heading:Math.PI, speed:200, color:'#3b7dd8', label:'对向直行', turnTarget:null, moveTarget:{x:450,y:580,onArrive:null}, turnRate:null, active:true, finished:false }];
    r = ev(dp, 'left-turn', {'sig-n':'green'});
    assert(r.correct === false, '绿灯+NPC在场+左转→未让行→错');
    r = ev(dp, 'stop', {'sig-n':'green'});
    assert(r.correct === true, '绿灯+NPC在场+停车让行→对');
    r = ev(dp, 'pass-through', {'sig-n':'green'});
    assert(r.correct === true, '绿灯+直行→对');
    // 绿灯+无NPC→左转可以
    s.npcs = [];
    r = ev(dp, 'left-turn', {'sig-n':'green'});
    assert(r.correct === true, '绿灯+无NPC+左转→对');
  })();

  // ===== L20 · 右转让左转 =====
  console.log('L20 · 右转让左转');
  (function(){
    load(19);
    const lv = t.levels[19];
    const dp = lv.decisionPoints[0];
    let r;
    // NPC在场→右转必须让行
    s.npcs = [{ id:'npc-1', x:450, y:200, heading:Math.PI, speed:180, color:'#e6a817', label:'对向左转', turnTarget:Math.PI/2, moveTarget:{x:450,y:240,onArrive:null}, turnRate:0.5, active:true, finished:false }];
    r = ev(dp, 'right-turn', {'sig-n':'green'});
    assert(r.correct === false, '绿灯+NPC在场+右转→未让行→错');
    r = ev(dp, 'stop', {'sig-n':'green'});
    assert(r.correct === true, '绿灯+NPC在场+停车让行→对');
    r = ev(dp, 'pass-through', {'sig-n':'green'});
    assert(r.correct === true, '绿灯+直行→对');
    // 无NPC→右转可以
    s.npcs = [];
    r = ev(dp, 'right-turn', {'sig-n':'green'});
    assert(r.correct === true, '绿灯+无NPC+右转→对');
  })();

  // ===== L21 · 让右方来车先行 =====
  console.log('L21 · 让右方来车先行');
  (function(){
    load(20);
    const lv = t.levels[20];
    const dp = lv.decisionPoints[0];
    let r;
    // 无信号灯→dp 无 signalBindings
    assert(!dp.signalBindings || dp.signalBindings.length === 0, 'L21 无信号灯绑定');
    // NPC在场→任何通行动作必须让行
    s.npcs = [{ id:'npc-1', x:520, y:330, heading:-Math.PI/2, speed:180, color:'#d84315', label:'右方来车', turnTarget:null, moveTarget:{x:-40,y:330,onArrive:null}, turnRate:null, active:true, finished:false }];
    r = ev(dp, 'pass-through', {});
    assert(r.correct === false, 'NPC在场+直行→未让行→错');
    r = ev(dp, 'left-turn', {});
    assert(r.correct === false, 'NPC在场+左转→未让行→错');
    r = ev(dp, 'stop', {});
    assert(r.correct === true, 'NPC在场+停车让行→对');
    // 无NPC→可通行
    s.npcs = [];
    r = ev(dp, 'pass-through', {});
    assert(r.correct === true, '无NPC+直行→对');
  })();

  // ===== 通用：applyDeduct + checkPass =====
  console.log('通用判分逻辑');
  (function(){
    s.score = 100;
    t.applyDeduct(30);
    assert(s.score === 70, 'applyDeduct(30) 100→70');
    t.applyDeduct(50);
    assert(s.score === 20, 'applyDeduct(50) 70→20(不低于0)');
    t.applyDeduct(100);
    assert(s.score === 0, 'applyDeduct 下限0');
    assert(t.checkPass(80, 80) === true, 'checkPass 80≥80→通过');
    assert(t.checkPass(79, 80) === false, 'checkPass 79<80→不通过');
  })();

  // ===== 通用：validateLevel =====
  console.log('通用校验逻辑');
  (function(){
    const errs = t.validateLevel({id:'X1',title:'t',passScore:80,road:{},signals:[],decisionPoints:[]});
    // road 缺 lanes, intersections → validateLevel 不检查这些
    // decisionPoints=[] → 通过
    assert(errs.length === 0, '空 decisionPoints 校验通过');
    const errs2 = t.validateLevel({id:'X2',title:'t',passScore:80,road:{},signals:[],decisionPoints:[{evaluate:{'pass-through':{correct:true,deduct:0,explanationKey:'safe-stop'}}}]});
    assert(errs2.length === 0, '有效 explanationKey 校验通过');
    const errs3 = t.validateLevel({id:'X3',title:'t',passScore:80,road:{},signals:[],decisionPoints:[{evaluate:{'pass-through':{correct:true,deduct:0,explanationKey:'nonexistent-key'}}}]});
    assert(errs3.length > 0, '无效 explanationKey 校验失败');
  })();

  console.log('');
  console.log('=== All L1-L21 tests passed ===');

  // ===== L22 · 避让行人 =====
  console.log('L22 · 避让行人');
  (function(){
    load(21);
    const lv = t.levels[21];
    const dp = lv.decisionPoints[0];
    let r;
    // 行人在场 + 绿灯 → 必须停车让行
    s.npcs = [{ id:'ped-1', x:460, y:295, heading:Math.PI, speed:60, color:'#e67e22', label:'行人', category:'pedestrian', turnTarget:null, moveTarget:null, turnRate:null, active:true, finished:false }];
    r = ev(dp, 'pass-through', {'sig-n':'green'});
    assert(r.correct === false, '绿灯+行人在场+直行→未让行→错');
    r = ev(dp, 'left-turn', {'sig-n':'green'});
    assert(r.correct === false, '绿灯+行人在场+左转→未让行→错');
    r = ev(dp, 'stop', {'sig-n':'green'});
    assert(r.correct === true, '绿灯+行人在场+停车让行→对');
    // 无行人 + 绿灯 → 可通行
    s.npcs = [];
    r = ev(dp, 'pass-through', {'sig-n':'green'});
    assert(r.correct === true, '绿灯+无行人+直行→对');
    // 红灯+右转(无行人) → 圆饼不禁右
    r = ev(dp, 'right-turn', {'sig-n':'red'});
    assert(r.correct === true, '红灯+无行人+右转→对(圆饼不禁右)');
    // 红灯+右转+行人在场 → 必须让行人
    s.npcs = [{ id:'ped-1', x:460, y:295, heading:Math.PI, speed:60, color:'#e67e22', label:'行人', category:'pedestrian', turnTarget:null, moveTarget:null, turnRate:null, active:true, finished:false }];
    r = ev(dp, 'right-turn', {'sig-n':'red'});
    assert(r.correct === false, '红灯+行人在场+右转→未让行→错');
    // 红灯 → 不可通行(直行/左转)
    r = ev(dp, 'pass-through', {'sig-n':'red'});
    assert(r.correct === false, '红灯+直行→错');
    r = ev(dp, 'stop', {'sig-n':'red'});
    assert(r.correct === true, '红灯+停车→对');
  })();

  // ===== L23 · 圆饼红+左转绿箭头 =====
  console.log('L23 · 圆饼红+左转绿箭头');
  (function(){
    load(22);
    const lv = t.levels[22];
    const dp = lv.decisionPoints[0];
    let r;
    // 圆饼红+左转绿箭头
    r = ev(dp, 'left-turn', {'sig-circle':'red','sig-arrow':'left-green'});
    assert(r.correct === true, '圆饼红+左转绿+左转→对');
    r = ev(dp, 'pass-through', {'sig-circle':'red','sig-arrow':'left-green'});
    assert(r.correct === false, '圆饼红+左转绿+直行→错');
    r = ev(dp, 'right-turn', {'sig-circle':'red','sig-arrow':'left-green'});
    assert(r.correct === true, '圆饼红+右转→对(圆饼不禁右)');
    r = ev(dp, 'stop', {'sig-circle':'red','sig-arrow':'left-green'});
    assert(r.correct === true, '停车→对');
    // 圆饼绿+箭头all-red
    r = ev(dp, 'pass-through', {'sig-circle':'green','sig-arrow':'all-red'});
    assert(r.correct === true, '圆饼绿+直行→对');
    // 左转箭头红灯
    r = ev(dp, 'left-turn', {'sig-circle':'red','sig-arrow':'all-red'});
    assert(r.correct === false, '圆饼红+箭头全红+左转→错');
  })();

  // ===== L24 · 避让特种车辆 =====
  console.log('L24 · 避让特种车辆');
  (function(){
    load(23);
    const lv = t.levels[23];
    const dp = lv.decisionPoints[0];
    let r;
    // 特种车辆在场 → 必须让行
    s.npcs = [{ id:'amb-1', x:410, y:500, heading:0, speed:260, color:'#fff', label:'救护车', emergency:true, turnTarget:null, moveTarget:null, turnRate:null, active:true, finished:false }];
    r = ev(dp, 'pass-through', {'sig-n':'green'});
    assert(r.correct === false, '绿灯+救护车在场+直行→未让行→错');
    r = ev(dp, 'stop', {'sig-n':'green'});
    assert(r.correct === true, '绿灯+救护车在场+停车让行→对');
    // 无特种车辆 → 按信号灯正常判断
    s.npcs = [];
    r = ev(dp, 'pass-through', {'sig-n':'green'});
    assert(r.correct === true, '绿灯+无救护车+直行→对');
    r = ev(dp, 'pass-through', {'sig-n':'red'});
    assert(r.correct === false, '红灯+无救护车+直行→闯红灯→错');
    r = ev(dp, 'right-turn', {'sig-n':'red'});
    assert(r.correct === true, '红灯+无救护车+右转→对(圆饼不禁右)');
  })();

  // ===== L25 · 右转避让行人 =====
  console.log('L25 · 右转避让行人');
  (function(){
    load(24);
    const lv = t.levels[24];
    const dp = lv.decisionPoints[0];
    let r;
    // 行人在场 + 绿灯 + 右转 → 必须让行
    s.npcs = [{ id:'ped-1', x:460, y:295, heading:Math.PI, speed:55, color:'#e67e22', label:'行人', category:'pedestrian', turnTarget:null, moveTarget:null, turnRate:null, active:true, finished:false }];
    r = ev(dp, 'right-turn', {'sig-n':'green'});
    assert(r.correct === false, '绿灯+行人在场+右转→未让行→错');
    r = ev(dp, 'stop', {'sig-n':'green'});
    assert(r.correct === true, '绿灯+行人在场+停车让行→对');
    r = ev(dp, 'pass-through', {'sig-n':'green'});
    assert(r.correct === true, '绿灯+直行(非右转)→对');
    // 无行人 + 右转 → 可以
    s.npcs = [];
    r = ev(dp, 'right-turn', {'sig-n':'green'});
    assert(r.correct === true, '绿灯+无行人+右转→对');
  })();

  // ===== L26 · 网格线区域禁停 =====
  console.log('L26 · 网格线区域禁停');
  (function(){
    load(25);
    const lv = t.levels[25];
    const dp = lv.decisionPoints[0];
    let r;
    // 拥堵NPC在场 → 不得进入
    s.npcs = [{ id:'npc-block', x:410, y:260, heading:0, speed:30, color:'#888', label:'拥堵车辆', turnTarget:null, moveTarget:null, turnRate:null, active:true, finished:false }];
    r = ev(dp, 'pass-through', {'sig-n':'green'});
    assert(r.correct === false, '绿灯+拥堵+直行→网格线违章→错');
    r = ev(dp, 'stop', {'sig-n':'green'});
    assert(r.correct === true, '绿灯+拥堵+停车→对');
    // 无拥堵 → 可通行
    s.npcs = [];
    r = ev(dp, 'pass-through', {'sig-n':'green'});
    assert(r.correct === true, '绿灯+无拥堵+直行→对');
    // 红灯 → 不可通行
    r = ev(dp, 'pass-through', {'sig-n':'red'});
    assert(r.correct === false, '红灯+直行→错');
  })();

  // ===== L27 · 让行标志 =====
  console.log('L27 · 让行标志');
  (function(){
    load(26);
    const lv = t.levels[26];
    const dp = lv.decisionPoints[0];
    let r;
    // NPC在场 → 必须让行
    s.npcs = [{ id:'npc-1', x:520, y:330, heading:-Math.PI/2, speed:180, color:'#d84315', label:'右方来车', turnTarget:null, moveTarget:{x:-40,y:330,onArrive:null}, turnRate:null, active:true, finished:false }];
    r = ev(dp, 'pass-through', {});
    assert(r.correct === false, '让行标志+NPC在场+直行→未让行→错');
    r = ev(dp, 'stop', {});
    assert(r.correct === true, '让行标志+NPC在场+停车让行→对');
    // 无NPC → 可通行
    s.npcs = [];
    r = ev(dp, 'pass-through', {});
    assert(r.correct === true, '让行标志+无NPC+直行→对');
  })();

  // ===== L28 · 停车让行标志 =====
  console.log('L28 · 停车让行标志');
  (function(){
    load(27);
    const lv = t.levels[27];
    const dpStop = lv.decisionPoints[0];
    const dpProceed = lv.decisionPoints[1];
    let r;
    // 停车让行标志：必须停车
    r = ev(dpStop, 'pass-through', {});
    assert(r.correct === false, '停车让行标志+直行(未停)→错');
    r = ev(dpStop, 'left-turn', {});
    assert(r.correct === false, '停车让行标志+左转(未停)→错');
    r = ev(dpStop, 'stop', {});
    assert(r.correct === true, '停车让行标志+停车→对');
    // 停车后可通行
    r = ev(dpProceed, 'pass-through', {});
    assert(r.correct === true, '停车后直行→对');
    r = ev(dpProceed, 'left-turn', {});
    assert(r.correct === true, '停车后左转→对');
  })();

  // ===== L29 · 红灯闪烁 =====
  console.log('L29 · 红灯闪烁');
  (function(){
    load(28);
    const lv = t.levels[28];
    const dpStop = lv.decisionPoints[0];
    const dpProceed = lv.decisionPoints[1];
    let r;
    // 红灯闪烁 + 直行 → 必须停车
    r = ev(dpStop, 'pass-through', {'sig-n':'red-flash'});
    assert(r.correct === false, '红闪+直行→错');
    r = ev(dpStop, 'left-turn', {'sig-n':'red-flash'});
    assert(r.correct === false, '红闪+左转→错');
    r = ev(dpStop, 'right-turn', {'sig-n':'red-flash'});
    assert(r.correct === true, '红闪+右转→对(圆饼不禁右)');
    r = ev(dpStop, 'stop', {'sig-n':'red-flash'});
    assert(r.correct === true, '红闪+停车→对');
    // 绿灯
    r = ev(dpStop, 'pass-through', {'sig-n':'green'});
    assert(r.correct === true, '绿灯+直行→对');
    // 停车后通行
    r = ev(dpProceed, 'pass-through', {'sig-n':'red-flash'});
    assert(r.correct === true, '红闪+停车后直行→对');
    r = ev(dpProceed, 'left-turn', {'sig-n':'red-flash'});
    assert(r.correct === true, '红闪+停车后左转→对');
  })();

  // ===== L30 · 禁止左转标志 =====
  console.log('L30 · 禁止左转标志');
  (function(){
    load(29);
    const lv = t.levels[29];
    const dp = lv.decisionPoints[0];
    let r;
    // 禁止左转标志：任何灯态下不得左转
    r = ev(dp, 'left-turn', {'sig-n':'green'});
    assert(r.correct === false, '绿灯+禁止左转标志+左转→错');
    r = ev(dp, 'left-turn', {'sig-n':'red'});
    assert(r.correct === false, '红灯+禁止左转标志+左转→错');
    // 直行：按信号灯正常判断
    r = ev(dp, 'pass-through', {'sig-n':'green'});
    assert(r.correct === true, '绿灯+直行→对');
    r = ev(dp, 'pass-through', {'sig-n':'red'});
    assert(r.correct === false, '红灯+直行→错');
    // 右转：圆饼不禁右
    r = ev(dp, 'right-turn', {'sig-n':'red'});
    assert(r.correct === true, '红灯+右转→对');
    // 停车
    r = ev(dp, 'stop', {'sig-n':'green'});
    assert(r.correct === true, '停车→对');
    // 掉头也禁止
    r = ev(dp, 'u-turn', {'sig-n':'green'});
    assert(r.correct === false, '绿灯+禁止左转标志+掉头→错');
  })();

  console.log('');
  console.log('=== Regression / Bug-fix tests ===');

  // L18 回归：导流线不覆盖任何车道中心
  (function(){
    load(17);
    var lv = t.levels[17];
    var ga = lv.road.guideAreas;
    function pip(x,y,pts){ var inside=false; for(var i=0,j=pts.length-1;i<pts.length;j=i++){var xi=pts[i].x,yi=pts[i].y,xj=pts[j].x,yj=pts[j].y; if(((yi>y)!==(yj>y))&&(x<(xj-xi)*(y-yi)/(yj-yi)+xi)) inside=!inside; } return inside; }
    var centers = [{name:'left-turn',x:360},{name:'forward',x:420},{name:'right-turn',x:480}];
    var fail = false;
    centers.forEach(function(c){
      for(var y=340;y<=385;y+=5){
        ga.forEach(function(g){
          if(pip(c.x,y,g.points)){ fail=true; assert(false, 'L18导流线BUG:'+c.name+'(x='+c.x+',y='+y+')在导流区内'); }
        });
      }
    });
    if(!fail) console.log('PASS: L18导流线不覆盖任何车道中心');
  })();

  // L20 回归：让行后NPC离开冲突区→DP可重新触发→右转正确
  (function(){
    load(19);
    var dp = t.levels[19].decisionPoints[0];
    var r;
    // NPC已离开冲突区域（finished=true）
    s.npcs = [{ id:'npc-1', x:900, y:280, heading:Math.PI/2, speed:180, color:'#e6a817', label:'对向左转', active:false, finished:true }];
    r = ev(dp, 'right-turn', {'sig-n':'green'});
    assert(r.correct === true, '绿灯+NPC已离开+右转→对');
    // NPC仍在冲突区域
    s.npcs = [{ id:'npc-1', x:450, y:280, heading:Math.PI/2, speed:180, color:'#e6a817', label:'对向左转', active:true, finished:false, turnTarget:null, moveTarget:{x:840,y:280,onArrive:null}, turnRate:null }];
    r = ev(dp, 'right-turn', {'sig-n':'green'});
    assert(r.correct === false, '绿灯+NPC在冲突区+右转→未让行→错');
    s.npcs = [];
  })();

  console.log('');
  console.log('=== All L1-L30 tests passed ===');
})();
