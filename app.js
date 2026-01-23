// app.js (Local rules version)

// ===== 你的本地规则（完全不改）=====
const LOCAL_RULES = new Map([
  ["BBPP","P"],
  ["BBPB","P"],
  ["BPPPBB","P"],
  ["BPPPBP","B"],
  ["BPPPP","B"],
  ["BBBB","B"],
  ["BBBPB","P"],
  ["BBBPPP","P"],
  ["BPPBB","B"],
  ["BPPBP","B"],
  ["BBBPPB","P"],
  ["BPBP","B"],
  ["BPBB","B"],
  ["BPB","P"],

  ["PPBB","B"],
  ["PPBPB","B"],
  ["PPBPP","P"],
  ["PBBBP","P"],
  ["PBBBB","P"],
  ["PPPBB","P"],
  ["PPPP","P"],
  ["PBPB","P"],
  ["PPPBP","B"],
  ["PBBP","P"],
  ["PBPP","P"],
]);

// ===== 百分比循环：92-95-97-97-95-92（无限循环）=====
const PCT_LOOP = [92, 95, 97, 97, 95, 92];
let pctIdx = 0;
function nextFixedPercent(){
  const v = PCT_LOOP[pctIdx];
  pctIdx = (pctIdx + 1) % PCT_LOOP.length;
  return v;
}
function fmtPct(v){
  return `+${Number(v).toFixed(2)}%`;
}

// ===== 状态 =====
let gameHistory = [];
let windowN = 4;
let waiting = false;
let timer = null;

// ===== DOM =====
function byId(id){ return document.getElementById(id); }
function $(sel){ return document.querySelector(sel); }

function setButtonsDisabled(disabled){
  const p = $('.player-btn');
  const b = $('.banker-btn');
  const back = $('.back-btn');
  const reset = $('.reset-btn');
  if(p) p.disabled = disabled;
  if(b) b.disabled = disabled;
  if(back) back.disabled = disabled;
  if(reset) reset.disabled = disabled;
}

function renderHistory(){
  const recordDisplay = byId('recordDisplay');
  if(!recordDisplay) return;
  recordDisplay.innerHTML = '';
  gameHistory.forEach(type => {
    const item = document.createElement('div');
    item.className = `record-item ${type.toLowerCase()}`;
    item.textContent = type;
    recordDisplay.appendChild(item);
  });
}

function suffix(n){
  if(gameHistory.length < n) return null;
  return gameHistory.slice(gameHistory.length - n).join('');
}

function predictAtWindow(N){
  const maxLen = Math.min(N, gameHistory.length);
  for(let len = maxLen; len >= 3; len--){
    const s = suffix(len);
    if(s && LOCAL_RULES.has(s)) return LOCAL_RULES.get(s);
  }
  return null;
}

// UI显示
function showPending(){
  const label = byId('resultLabel');
  const pctEl = byId('resultPct');
  const text = byId('predictionText');

  if(label){
    label.textContent = 'AI';
    label.classList.remove('player','banker');
  }
  if(pctEl) pctEl.textContent = '...%';
  if(text) text.textContent = '人工智能正在预测，请稍后...';
}

function showResult(side, pct){
  const label = byId('resultLabel');
  const pctEl = byId('resultPct');
  const text = byId('predictionText');

  if(label){
    label.textContent = side;
    label.classList.remove('player','banker');
    label.classList.add(side === 'B' ? 'banker' : 'player');
  }
  if(pctEl) pctEl.textContent = fmtPct(pct);
  if(text) text.textContent = side;
}

function showIdle(){
  const label = byId('resultLabel');
  const pctEl = byId('resultPct');
  const text = byId('predictionText');

  if(label){
    label.textContent = 'AI';
    label.classList.remove('player','banker');
  }
  if(pctEl) pctEl.textContent = '';
  if(text) text.textContent = '请稍候...';
}

// 核心逻辑
function updatePrediction(){
  if(timer){ clearTimeout(timer); timer = null; }

  if(gameHistory.length < 4){
    windowN = 4;
    showIdle();
    return;
  }

  const out = predictAtWindow(windowN);

  if(out){
    waiting = true;
    setButtonsDisabled(true);

    showPending();
    const pct = nextFixedPercent();

    timer = setTimeout(() => {
      showResult(out, pct);
      windowN = 4;
      waiting = false;
      setButtonsDisabled(false);
      timer = null;
    }, 2000);
    return;
  }

  if(windowN < 6) windowN += 1;
  showIdle();
}

// 绑定按钮
window.recordResult = function(type){
  if(waiting) return;
  if(type !== 'B' && type !== 'P') return;
  gameHistory.push(type);
  renderHistory();
  updatePrediction();
  updateChartSafe();
};

window.undoLastMove = function(){
  if(waiting) return;
  gameHistory.pop();
  if(gameHistory.length < 4) windowN = 4;
  renderHistory();
  updatePrediction();
  updateChartSafe();
};

window.resetGame = function(){
  if(waiting) return;
  gameHistory = [];
  windowN = 4;
  pctIdx = 0;
  if(timer){ clearTimeout(timer); timer = null; }
  waiting = false;
  setButtonsDisabled(false);
  renderHistory();
  showIdle();
  updateChartSafe();
};

/* ✅说明按钮：自定义弹窗，不用 alert/confirm，所以不显示网址 */
window.toggleInstructions = function(){
  const modal = document.getElementById('instModal');
  const text = document.getElementById('instText');

  if(text){
    text.textContent =
      "1）点击 Player / Banker 录入结果\n" +
      "2）预测时会提示正在预测，约2秒后显示结果\n" +
      "3）Back 撤销上一手，Reset 重置";
  }

  if(modal) modal.classList.remove('hidden');
};

window.closeInstructions = function(){
  const modal = document.getElementById('instModal');
  if(modal) modal.classList.add('hidden');
};

// 缩放+初始化
document.addEventListener('DOMContentLoaded', function(){
  renderHistory();
  updatePrediction();
  updateChartSafe();

  const zoomSlider = byId('zoomSlider');
  const zoomValue = byId('zoomValue');
  const contentWrapper = byId('content-wrapper');

  function applyZoom(value){
    if(contentWrapper){
      contentWrapper.style.transform = `scale(${value/100})`;
      contentWrapper.style.transformOrigin = 'top center';
    }
    if(zoomValue) zoomValue.textContent = `${value}%`;
  }

  if(zoomSlider){
    applyZoom(Number(zoomSlider.value || 70));
    zoomSlider.addEventListener('input', function(){
      applyZoom(Number(this.value || 70));
    });
  }
});

// 图表
function updateChartSafe(){
  const canvas = byId('winChart');
  if(!canvas) return;
  if(typeof Chart === 'undefined') return;

  const ctx = canvas.getContext('2d');
  if(window.gameChart) window.gameChart.destroy();

  const labels = Array.from({length: gameHistory.length}, (_, i) => `Hand ${i + 1}`);
  const bankerData = gameHistory.map((_, index) =>
    gameHistory.slice(0, index + 1).filter(x => x === 'B').length
  );
  const playerData = gameHistory.map((_, index) =>
    gameHistory.slice(0, index + 1).filter(x => x === 'P').length
  );

  window.gameChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        { label: 'Banker Wins', data: bankerData, borderColor: '#ff6b6b', fill: false },
        { label: 'Player Wins', data: playerData, borderColor: '#4ecdc4', fill: false }
      ]
    },
    options: {
      responsive: true,
      scales: {
        y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,.1)' } },
        x: { grid: { color: 'rgba(255,255,255,.1)' } }
      }
    }
  });
}

