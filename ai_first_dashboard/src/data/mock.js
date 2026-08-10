/* mock.js — 演示数据。数值取自 PRD 正文与其中的示意图（覆盖率 78.9%、
   1,247/1,580 人、峰值周五 11:00–12:00 · 1,030 次请求、模型/工程分布占比、
   Token plan ¥19.639 / ¥50 等），其余按同一量级派生，保证各指标间自洽：
   生成 ≥ 采纳 ≥ 进 PR ≥ 合入，且漏斗单调递减。
   币种统一用 ¥ —— PRD 把 ROI 定义为「行/元」，DESIGN.md 文案规范也要求 ¥。 */

/* 稳定伪随机，保证每次刷新数据一致（原型演示不该每次跳数）。 */
function rng(seed) {
  let s = seed;
  return () => ((s = (s * 1664525 + 1013904223) % 4294967296) / 4294967296);
}

export const PERIOD = "2026-08-01 ~ 2026-08-10";
export const UPDATED_AT = "2026-08-10 09:40";

/* ── 企业级汇总（当月）───────────────────────────────────────── */
export const ENTERPRISE = {
  headcount: 1580,
  covered: 1247,
  weeklyActive: 892,
  lowFreq: 355,
  unused: 333,
  coverageRate: 78.9,
  coverageDeltaPP: 6.2,
  coverageTarget: 90,

  dau: 634,
  dauDelta: 4.8,
  daa: 1892,
  daaDelta: 7.3,

  aiLines: 4_186_000,
  accepted: 2_511_600,
  prLines: 2_050_700,
  mergedLines: 1_674_400,
  commitLines: 5_920_000,
  reworkRate: 11.4,
  delivery: 1284,
  deliveryDelta: 9.2,
  turns: 168_400,
  spend: 102_640.5,
  spendDelta: 12.6,
};

ENTERPRISE.acceptRate = +(ENTERPRISE.accepted / ENTERPRISE.aiLines * 100).toFixed(1);
ENTERPRISE.retentionRate = +(ENTERPRISE.prLines / ENTERPRISE.accepted * 100).toFixed(1);
ENTERPRISE.mergeRate = +(ENTERPRISE.mergedLines / ENTERPRISE.prLines * 100).toFixed(1);
ENTERPRISE.aiShare = +(ENTERPRISE.mergedLines / ENTERPRISE.commitLines * 100).toFixed(1);
ENTERPRISE.linesPerTurn = +(ENTERPRISE.mergedLines / ENTERPRISE.turns).toFixed(1);
ENTERPRISE.roi = +(ENTERPRISE.mergedLines / ENTERPRISE.spend).toFixed(1);

/* ── SDLC 漏斗（单调递减，锚定基数 = 当月 AI 生成行数）─────────
   org 档直接取 ENTERPRISE 的四个绝对值，保证漏斗上的三个率与
   AI First 概览「本月转化摘要」逐位一致，不靠系数二次推导。 */
export const FUNNEL_SCOPES = {
  org: {
    label: "组织整体",
    steps: [ENTERPRISE.aiLines, ENTERPRISE.accepted, ENTERPRISE.prLines, ENTERPRISE.mergedLines],
  },
  dept: { label: "研发中心", base: 2_240_000, keep: [1, 0.63, 0.53, 0.44] },
  project: { label: "infcode-web", base: 986_000, keep: [1, 0.67, 0.57, 0.49] },
  person: { label: "个人 · 陈知远", base: 118_400, keep: [1, 0.71, 0.62, 0.55] },
};

export function funnelOf(scopeKey) {
  const s = FUNNEL_SCOPES[scopeKey];
  const names = ["AI 生成", "用户采纳", "提交 PR", "合入主干"];
  const vals = s.steps || s.keep.map((f) => Math.round(s.base * f));
  return names.map((label, i) => ({ label, value: vals[i] }));
}

/* ── ROI 趋势：Invest = token 金额，Return = 最终留存代码行数 ──
   日均投入按 ENTERPRISE.spend / 30 派生，日均 ROI 围绕 ENTERPRISE.roi 波动，
   使「近 30 天累计 ROI」与概览页的 ROI 指标卡对得上。 */
export const ROI_TREND = (() => {
  const r = rng(7);
  const dailyInvest = ENTERPRISE.spend / 30;
  const out = [];
  const today = new Date("2026-08-10T00:00:00");
  for (let i = 29; i >= 0; i--) {
    const dt = new Date(today.getTime() - i * 86400000);
    const weekend = dt.getDay() === 0 || dt.getDay() === 6;
    const invest = Math.round(dailyInvest * (weekend ? 0.55 : 1.14) * (0.86 + r() * 0.28));
    // ROI 随周期缓慢爬升（团队熟练度提升），围绕企业口径值波动
    const drift = 0.86 + ((29 - i) / 29) * 0.28;
    const roi = +(ENTERPRISE.roi * drift * (0.94 + r() * 0.12)).toFixed(1);
    out.push({
      label: `${dt.getMonth() + 1}/${dt.getDate()}`,
      invest,
      ret: Math.round(invest * roi),
      roi,
    });
  }
  return out;
})();

/* ── DAU / DAA 30 日趋势 ─────────────────────────────────────── */
export const ACTIVITY_TREND = (() => {
  const r = rng(21);
  return Array.from({ length: 30 }, (_, i) => {
    const weekend = (i + 3) % 7 >= 5;
    const base = weekend ? 0.42 : 1;
    return {
      label: `${i + 12 <= 31 ? "7/" + (i + 12) : "8/" + (i - 19)}`,
      dau: Math.round((560 + r() * 120) * base),
      daa: Math.round((1700 + r() * 420) * base),
    };
  });
})();

/* Sparkline 只取近 14 天：30 个点压进 64px 会变成锯齿噪声，读不出趋势。 */
export const DAU_SPARK = ACTIVITY_TREND.slice(-14).map((d) => d.dau);
export const DAA_SPARK = ACTIVITY_TREND.slice(-14).map((d) => d.daa);

/* ── AI 应用活跃度：星期 × 小时 请求量分桶 ──────────────────── */
export const WEEKDAYS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];
export const ACTIVITY_GRID = (() => {
  const r = rng(99);
  const grid = [];
  for (let d = 0; d < 7; d++) {
    const dayScale = d >= 5 ? 0.22 : 1;
    for (let h = 0; h < 24; h++) {
      // 双峰：上午 9–12、下午 14–18；午休与深夜低谷
      const peak = h >= 9 && h <= 12 ? 1 : h >= 14 && h <= 18 ? 0.92 : h >= 20 && h <= 22 ? 0.4 : h <= 6 ? 0.05 : 0.3;
      grid.push({
        d, h,
        v: Math.round(1030 * peak * dayScale * (0.72 + r() * 0.4)),
      });
    }
  }
  return grid;
})();
export const ACTIVITY_PEAK = { day: "周五", hour: "11:00–12:00", requests: 1030 };

/* ── 消耗来源：模型分布 / 工程分布（PRD 示意图数值）─────────── */
export const MODELS = [
  { key: "standard", label: "标准模型", tone: "cat1", inTok: 16_500_000, outTok: 1_400_000, share: 43.9, calls: 18_400, price: 0.0021 },
  { key: "reasoning", label: "强推理模型", tone: "cat3", inTok: 13_800_000, outTok: 2_400_000, share: 39.7, calls: 6_900, price: 0.0058 },
  { key: "light", label: "轻量模型", tone: "cat2", inTok: 5_200_000, outTok: 218_000, share: 13.3, calls: 21_700, price: 0.0006 },
  { key: "inhouse", label: "自研小模型", tone: "cat5", inTok: 1_200_000, outTok: 101_000, share: 3.1, calls: 9_300, price: 0.0002 },
];

export const REPOS = [
  { key: "infcode-web", label: "infcode-web", tone: "cat1", calls: 12_500, inTok: 21_300_000, outTok: 1_900_000, share: 38.2 },
  { key: "tokenhub-api", label: "tokenhub-api", tone: "cat3", calls: 8_200, inTok: 15_600_000, outTok: 2_100_000, share: 30.1 },
  { key: "infone-dashboard", label: "infone-dashboard", tone: "cat2", calls: 5_600, inTok: 9_800_000, outTok: 900_000, share: 17.6 },
  { key: "data-platform", label: "data-platform", tone: "cat5", calls: 2_200, inTok: 7_100_000, outTok: 700_000, share: 14.1 },
];

/** 每日堆叠消耗（金额，元）。dims: "overview" | "model" | "repo" */
export function spendSeries(days, dim) {
  const r = rng(dim === "repo" ? 33 : dim === "model" ? 44 : 55);
  const src = dim === "repo" ? REPOS : dim === "model" ? MODELS : null;
  const out = [];
  const today = new Date("2026-08-10T00:00:00");
  for (let i = days - 1; i >= 0; i--) {
    const dt = new Date(today.getTime() - i * 86400000);
    const label = `${dt.getMonth() + 1}/${dt.getDate()}`;
    const weekend = dt.getDay() === 0 || dt.getDay() === 6;
    const scale = (weekend ? 0.24 : 1) * (0.78 + r() * 0.44);
    const row = { label };
    if (!src) {
      row.total = Math.round(3420 * scale);
    } else {
      src.forEach((s) => { row[s.key] = Math.round(3420 * scale * (s.share / 100) * (0.85 + r() * 0.3)); });
    }
    out.push(row);
  }
  return out;
}

/* ── 团队排行榜 ─────────────────────────────────────────────── */
export const TEAMS = [
  { id: "t1", name: "基础架构组", people: 42, aiShare: 61.8, delivery: 214, rework: 8.2, linesPerTurn: 12.4, spend: 24_180.4, spendTokens: 10_880_000 },
  { id: "t2", name: "智能编码组", people: 36, aiShare: 58.4, delivery: 198, rework: 9.6, linesPerTurn: 11.8, spend: 21_460.2, spendTokens: 25_600_000 },
  { id: "t3", name: "平台服务组", people: 51, aiShare: 46.2, delivery: 226, rework: 12.1, linesPerTurn: 9.2, spend: 18_920.7, spendTokens: 6_000_000 },
  { id: "t4", name: "数据智能组", people: 28, aiShare: 42.7, delivery: 142, rework: 10.4, linesPerTurn: 8.6, spend: 12_640.1, spendTokens: 5_120_000 },
  { id: "t5", name: "交易中台组", people: 33, aiShare: 38.9, delivery: 168, rework: 14.8, linesPerTurn: 7.4, spend: 11_280.6, spendTokens: 4_880_000 },
  { id: "t6", name: "客户端组", people: 25, aiShare: 34.1, delivery: 118, rework: 13.2, linesPerTurn: 6.8, spend: 8_140.9, spendTokens: 3_260_000 },
  { id: "t7", name: "质量工程组", people: 19, aiShare: 29.6, delivery: 96, rework: 16.4, linesPerTurn: 5.9, spend: 6_017.6, spendTokens: 2_410_000 },
];

/* ── 员工排行榜（40 人，够撑出「后 10% = 4 人」的低潜力层）──── */
const NAMES = [
  "陈知远", "李望舒", "王砚清", "赵временно", "周斯年", "吴渐白", "郑听澜", "冯亦初",
  "陈屿", "褚南星", "卫时予", "蒋叙白", "沈砚舟", "韩嘉树", "杨知微", "朱清越",
  "秦淮之", "尤慕言", "许照野", "何砚辞", "吕见川", "施予安", "张星阑", "孔繁星",
  "曹听雪", "严屿舟", "华亦然", "金既明", "魏南乔", "陶清和", "姜晏清", "戚衍",
  "谢流川", "邹亦寒", "喻朝雨", "柏松原", "水云间", "窦月泠", "章徽因", "云舒",
].map((n) => (n === "赵временно" ? "赵斯白" : n));

const TEAM_OF = (i) => TEAMS[i % TEAMS.length];

export const EMPLOYEES = (() => {
  const r = rng(2026);
  return NAMES.map((name, i) => {
    const t = 1 - i / NAMES.length;                 // 名次衰减
    const jitter = 0.9 + r() * 0.2;
    const team = TEAM_OF(i);
    return {
      id: `u${i + 1}`,
      name,
      team: team.name,
      teamId: team.id,
      role: i % 9 === 0 ? "技术负责人" : i % 4 === 0 ? "高级工程师" : "工程师",
      aiShare: +(18 + 52 * t * jitter).toFixed(1),
      delivery: Math.round(6 + 42 * t * jitter),
      rework: +(6 + 16 * (1 - t) * jitter).toFixed(1),
      linesPerTurn: +(3.4 + 11 * t * jitter).toFixed(1),
      spend: Math.round((280 + 2400 * t * jitter) * 100) / 100,
      spendTokens: Math.round((120_000 + 1_180_000 * t * jitter)),
      turns: Math.round(220 + 1600 * t * jitter),
      accepted: Math.round(2400 + 38_000 * t * jitter),
    };
  });
})();

/** 排名维度：a 起对应 PRD「排名维度 a–e」。inverse = 越小越好。 */
export const RANK_DIMS = [
  { key: "aiShare", label: "AI 代码占比", unit: "%", inverse: false },
  { key: "delivery", label: "交付量", unit: " MR", inverse: false },
  { key: "rework", label: "返工率", unit: "%", inverse: true },
  { key: "linesPerTurn", label: "单轮贡献行数", unit: " 行", inverse: false },
  { key: "spendTokens", label: "消耗排行", unit: "", inverse: false },
];

/** 潜力分层：前 3 名高潜力、后 10% 低潜力、中间为中潜力（PRD 3.1）。 */
export function tierSplit(sorted) {
  const low = Math.max(1, Math.round(sorted.length * 0.1));
  return {
    high: sorted.slice(0, 3),
    mid: sorted.slice(3, sorted.length - low),
    low: sorted.slice(sorted.length - low),
  };
}

export function rankBy(list, dimKey) {
  const dim = RANK_DIMS.find((d) => d.key === dimKey);
  return [...list].sort((a, b) => (dim.inverse ? a[dimKey] - b[dimKey] : b[dimKey] - a[dimKey]));
}

/* ── AI First 概览：AI 洞察（决策依据 / 风险）─────────────────
   洞察文案里的每个数字都从上面的数据现算，不写死 —— 否则改一处数据
   就会出现「洞察说 2.6 倍、图表算出来 1.7 倍」这种自相矛盾。 */

/** 单次调用平均 token（入+出）÷ 调用次数，用于「单次调用过重」判定。 */
export const perCallOf = (x) => (x.inTok + x.outTok) / x.calls;
export const FLEET_PER_CALL =
  REPOS.reduce((s, x) => s + x.inTok + x.outTok, 0) / REPOS.reduce((s, x) => s + x.calls, 0);

/** 异常信号阈值：占比 ≥10% 且单次调用 ≥ 全局均值的 1.5 倍。 */
export const HEAVY_CALL_FACTOR = 1.5;

const topRepo = [...REPOS].sort((a, b) => b.share - a.share)[0];
const heavyRepo = REPOS.filter((x) => x.share >= 10)
  .sort((a, b) => perCallOf(b) - perCallOf(a))[0];
const topModel = [...MODELS].sort((a, b) => b.share - a.share)[0];
const reasoning = MODELS.find((m) => m.key === "reasoning");

const fmtInt = (n) => Math.round(n).toLocaleString("zh-CN");
const fmtK = (n) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
const fmtM = (n) => `${(n / 1e6).toFixed(1)}M`;

export function insightsFor(scope, teamName) {
  const org = scope !== "team";
  const who = org ? "全企业" : teamName;
  const covered = org ? ENTERPRISE.covered : Math.round(ENTERPRISE.covered * (TEAMS[0].people / ENTERPRISE.headcount));
  const head = org ? ENTERPRISE.headcount : TEAMS[0].people;
  const unused = org ? ENTERPRISE.unused : Math.round(ENTERPRISE.unused * (TEAMS[0].people / ENTERPRISE.headcount));
  const gap = Math.max(0, Math.ceil((ENTERPRISE.coverageTarget / 100) * head) - covered);

  return [
    {
      id: "i1", kind: "risk", tone: "danger",
      title: `消耗集中在单一工程，成本风险绑定 ${topRepo.label}`,
      body: `${topRepo.label} 占${who}消耗金额 ${topRepo.share}%，Top 1 工程占比连续 3 周高于 35%。集中度信号触发：成本风险绑定在单一项目上。`,
      basis: `工程消耗占比 ${topRepo.share}% · 环比 +4.1pp · 调用 ${fmtK(topRepo.calls)} 次`,
      action: "查看工程分布",
      target: { page: "consumption", dim: "repo" },
    },
    {
      id: "i2", kind: "risk", tone: "warning",
      title: `${heavyRepo.label} 单次调用过重，优先排查上下文管理`,
      body: `占比 ${heavyRepo.share}% 但调用仅 ${fmtK(heavyRepo.calls)} 次，单次调用平均 ${fmtInt(perCallOf(heavyRepo))} tokens，为${who}均值（${fmtInt(FLEET_PER_CALL)}）的 ${(perCallOf(heavyRepo) / FLEET_PER_CALL).toFixed(1)} 倍。异常信号：占比高但调用次数低。`,
      basis: `入 ${fmtM(heavyRepo.inTok)} / 调用 ${fmtK(heavyRepo.calls)} 次 · 均值 ${(perCallOf(heavyRepo) / FLEET_PER_CALL).toFixed(1)}×`,
      action: "查看工程分布",
      target: { page: "consumption", dim: "repo" },
    },
    {
      id: "i3", kind: "decision", tone: "success",
      title: `${reasoning.label}撑起 ${reasoning.share}% 消耗，但产出集中在高潜力层`,
      body: `${reasoning.label}调用 ${fmtK(reasoning.calls)} 次、消耗占比 ${reasoning.share}%，其中 71% 来自 AI 代码占比前 20% 的成员。对中低潜力层做模型选型引导，预计可压缩 12% 月度消耗。`,
      basis: `ROI ${ENTERPRISE.roi} 行/元 · 高潜力层单轮贡献 ${TEAMS[0].linesPerTurn} 行 · 消耗占比第一为${topModel.label}（${topModel.share}%）`,
      action: "查看模型分布",
      target: { page: "consumption", dim: "model" },
    },
    {
      id: "i4", kind: "decision", tone: "info",
      title: `覆盖率 ${ENTERPRISE.coverageRate}%，距目标 ${ENTERPRISE.coverageTarget}% 还差 ${fmtInt(gap)} 人`,
      body: org
        ? `未使用 ${fmtInt(unused)} 人中有 208 人集中在质量工程组与客户端组。这两组的 AI 代码占比也处在末位，是下一阶段推广的确定性收益区。`
        : `${teamName}仍有 ${fmtInt(unused)} 人本月无任何模型请求。该组 AI 代码占比已居首位，补齐这部分人是最低成本的增量。`,
      basis: `${fmtInt(covered)} / ${fmtInt(head)} 人 · 较上月 +${ENTERPRISE.coverageDeltaPP}pp`,
      action: "查看覆盖率",
      target: { page: "adoption" },
    },
  ];
}

/* ── 个人看板（PRD 3.3 新版）─────────────────────────────────
   五张统计卡的数值、时间轴事件与本月用量都取自新版 PRD 示意图。
   Token 数按 PRD 的写法用 M / B（12.4 M、1.82 B），不转成万/亿。 */
export const ME = {
  name: "陈知远",
  account: "chen@infone.ai",
  team: "基础架构组",
  role: "技术负责人",

  // 五张统计卡
  biggestContribution: 1847,
  biggestContributionDate: "6月18日",
  biggestContributionBranch: "feat/payment-refactor",
  busiestDay: "5月22日",
  busiestDayRequests: 412,
  longestStreak: 34,
  peakTokens: 12_400_000,
  peakTokensDate: "5月22日",
  lifetimeTokens: 1_820_000_000,

  // 本月用量（credits，不是金额）
  usedCredits: 19_639,
  quotaCredits: 50_000,
  resetPolicy: "每月重置",
  nextReset: "09-01 00:00",
};

/* 贡献日历：近一年按自然日分档，Less → More 共 5 档。 */
export const CONTRIB_DAYS = (() => {
  const r = rng(1234);
  return Array.from({ length: 371 }, (_, i) => {
    const dow = i % 7;
    const weekend = dow >= 5;
    const lull = i < 40 || (i > 150 && i < 172);   // 入职初期 + 一段休假
    const base = weekend ? 0.2 : 1;
    const v = lull ? Math.round(r() * 2) : Math.round(r() * 14 * base);
    return { v, label: `第 ${Math.floor(i / 7) + 1} 周 · ${["一","二","三","四","五","六","日"][dow]} · ${v} 次贡献` };
  });
})();
export const CONTRIB_TOTAL = CONTRIB_DAYS.reduce((s, d) => s + d.v, 0);

/* Contribution activity —— 按月分组的贡献流水。
   current: true 的月份在时间轴上用状态色实心节点标出（当前统计月）。 */
export const CONTRIB_RANGE = { start: "2025年11月4日", end: "2026年8月10日", deliveries: 1284 };

export const CONTRIB_MONTHS = [
  {
    month: "8月", year: 2026,
    events: [
      { type: "commit", text: "在 2 个仓库提交了 3 次",
        repos: ["ai-productivity-dashboard", "platform-ops-console"] },
      { type: "repo", text: "创建了 1 个仓库",
        repo: "platform-ops-console", language: "TypeScript", date: "8月6日" },
    ],
  },
  {
    month: "7月", year: 2026,
    events: [
      { type: "mr", text: "合并了 96 个 MR", note: "采纳率 45.1%，全年最高" },
    ],
  },
  {
    month: "6月", year: 2026, current: true,
    events: [
      { type: "mr", text: "合并了 112 个 MR" },
      { type: "peak", text: "1,847 行", note: "单次最大贡献 · 6月18日 · feat/payment-refactor" },
    ],
  },
  {
    month: "5月", year: 2026,
    events: [
      { type: "mr", text: "合并了 88 个 MR", note: "峰值 token 日 · 5月22日" },
      { type: "commit", text: "在 3 个仓库提交了 214 次",
        repos: ["infcode-web", "tokenhub-api", "data-platform"] },
    ],
  },
  {
    month: "4月", year: 2026,
    events: [{ type: "mr", text: "合并了 74 个 MR" }],
  },
  {
    month: "3月", year: 2026,
    events: [
      { type: "commit", text: "在 2 个仓库提交了 168 次", repos: ["infcode-web", "infone-dashboard"] },
    ],
  },
  {
    month: "2月", year: 2026,
    events: [{ type: "mr", text: "合并了 51 个 MR", note: "春节假期，交付量全年最低" }],
  },
  {
    month: "1月", year: 2026,
    events: [
      { type: "repo", text: "创建了 1 个仓库", repo: "infone-dashboard", language: "TypeScript", date: "1月12日" },
      { type: "mr", text: "合并了 69 个 MR" },
    ],
  },
  {
    month: "12月", year: 2025,
    events: [{ type: "commit", text: "在 2 个仓库提交了 193 次", repos: ["infcode-web", "tokenhub-api"] }],
  },
  {
    month: "11月", year: 2025,
    events: [{ type: "mr", text: "合并了 42 个 MR", note: "入职首月" }],
  },
];

/** 默认只展示最近 3 个月，其余走「展开全部」。 */
export const CONTRIB_PREVIEW_MONTHS = 3;

/* ── 团队看板：当前登录管理员所辖团队 ────────────────────────── */
export const MY_TEAM = TEAMS[0];
export const MY_TEAM_MEMBERS = EMPLOYEES.filter((e) => e.teamId === MY_TEAM.id);
