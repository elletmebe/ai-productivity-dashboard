/* Personal.jsx — 个人看板（PRD 3.3 新版，单页）
   自上而下四块：
     ① 八张统计卡（一排 4 个 / 两排）：messages / lifetime tokens /
        peak tokens / longest chat / current streak / longest streak /
        peak hour / favorite model，每张带 ⓘ 口径提示
     ② 贡献日历：**通栏铺满整行**，按自然日标记贡献强度，Less → More 共 5 档
     ③ 日历下方左右两栏：左＝本月用量（credits 进度条，三档颜色状态
        正常消耗蓝色 / 接近上限黄色 / 用到池化共享额度红色），
        右＝Contribution activity（按月分组的贡献流水，展开后在本区域内
        滚动，页面高度不变）

   下方两栏用 flex-wrap 而不是两列网格（DESIGN.md 自适应与栅格）：
   左栏 flex:4 1 480px，右栏 flex:1 1 300px + max-width，
   窄屏时自动堆叠，不会把右栏压到内容溢出。

   着色语义 3 类：强度（贡献日历，整屏唯一一处热力）+ 状态（用量水位、
   时间轴当前月节点）+ 分类（仓库主语言 Tag）。 */
import React from "react";
import {
  Card, CardHead, MetricStrip, Heatgrid, HeatLegend,
  Progress, Tag, Button, nf, compactTokens,
} from "../ds/index.js";
import { InsetNote, usageLevel, QUOTA_WARN_AT } from "./shared.jsx";
import { M } from "../data/metrics.js";
import {
  ME, CONTRIB_DAYS, CONTRIB_TOTAL, CONTRIB_RANGE,
  CONTRIB_MONTHS, CONTRIB_PREVIEW_MONTHS, UPDATED_AT,
} from "../data/mock.js";

const WEEKS = 53;
/* CONTRIB_DAYS 第 0 天是周一，所以标签落在第 0/2/4 行（隔行标注）。 */
const DOW = ["周一", "", "周三", "", "周五", "", ""];
const CELL = 11;
const GAP = 3;

export default function Personal() {
  const calendar = React.useMemo(() => {
    const out = [];
    for (let dow = 0; dow < 7; dow++) {
      for (let w = 0; w < WEEKS; w++) out.push(CONTRIB_DAYS[w * 7 + dow]);
    }
    return out;
  }, []);

  const pct = (ME.usedCredits / ME.quotaCredits) * 100;
  const level = usageLevel(pct);
  const peak = compactTokens(ME.peakTokens);
  const life = compactTokens(ME.lifetimeTokens);

  return (
    <>

      {/* ① 八张统计卡 —— 通栏，一排 4 个（宽屏 4 列 / 两排），
          用 columns 网格模式：DESIGN.md 禁止写死列数，传「单列最小可读宽」，
          宽屏自然排成 4 列，窄屏自动退成 3 / 2 / 1 列且不会带错分隔线。
          每项只有 label + 值，无 caption / delta / sparkline —— 本条 strip
          不承载任何着色语义，留给贡献日历那一处热力。 */}
      <MetricStrip
        animate
        columns={176}
        items={[
              {
                key: "messages", label: M.messages.label, hint: M.messages.hint,
                value: ME.messages,
              },
              {
                key: "life", label: M.lifetimeTokens.label, hint: M.lifetimeTokens.hint,
                value: Number(life.n), suffix: life.u, format: (n) => n.toFixed(1),
              },
              {
                key: "peak", label: M.peakTokens.label, hint: M.peakTokens.hint,
                value: Number(peak.n), suffix: peak.u, format: (n) => n.toFixed(1),
              },
              {
                key: "longestChat", label: M.longestChat.label, hint: M.longestChat.hint,
                value: ME.longestChat,
              },
              {
                key: "currentStreak", label: M.currentStreak.label, hint: M.currentStreak.hint,
                value: ME.currentStreak, suffix: "d",
              },
              {
                key: "longestStreak", label: M.longestStreak.label, hint: M.longestStreak.hint,
                value: ME.longestStreak, suffix: "d",
              },
              {
                key: "peakHour", label: M.peakHour.label, hint: M.peakHour.hint,
                value: ME.peakHour,
              },
              {
                key: "favoriteModel", label: M.favoriteModel.label, hint: M.favoriteModel.hint,
                value: ME.favoriteModel,
              },
        ]}
      />

      {/* ② 贡献日历 —— 通栏铺满整行（一年 53 周的热力条本就横向，通栏读起来最完整）。 */}
      <Card>
        <CardHead
          title={M.contributions.label}
          hint={M.contributions.hint}
          meta={`${nf(CONTRIB_TOTAL)} contributions in the last year`}
          actions={<HeatLegend lessLabel="Less" moreLabel="More" />}
        />
        <div style={{ overflowX: "auto", paddingBottom: 4, minWidth: 0 }}>
          <div style={{ display: "flex", gap: 6, alignItems: "flex-start", width: "max-content" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: GAP }}>
              {DOW.map((d, i) => (
                <span key={i} style={{
                  height: CELL, lineHeight: `${CELL}px`, width: 26, textAlign: "right",
                  fontSize: "var(--th-text-2xs)", color: "var(--color-fg-muted)", whiteSpace: "nowrap",
                }}>{d}</span>
              ))}
            </div>
            <Heatgrid columns={WEEKS} cellSize={CELL} gap={GAP} data={calendar} />
          </div>
        </div>
        <span style={{ fontSize: "var(--th-text-2xs)", color: "var(--color-fg-subtle)" }}>
          单日贡献值由当日 commit 行数 / 次数换算后分档，共 5 档，决定当日格子颜色。
        </span>
      </Card>

      {/* 日历下方的左右两栏：左＝本月用量，右＝Contribution activity。
          窄屏自动堆叠，不会把右栏压到内容溢出。 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "flex-start", minWidth: 0 }}>
        {/* ④ 本月用量 */}
        <div style={{ flex: "4 1 480px", minWidth: 0, display: "flex" }}>
          <Card style={{ flex: 1, minWidth: 0 }}>
            <CardHead
              title={M.monthlyUsage.label}
              hint={M.monthlyUsage.hint}
              actions={
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <i className="ri-refresh-line" aria-hidden="true"
                     style={{ fontSize: 14, color: "var(--color-fg-muted)" }} />
                  <span className="th-nums" style={{ fontSize: "var(--th-text-xs)", color: "var(--color-fg-muted)" }}>
                    {ME.resetPolicy} · {ME.nextReset}
                  </span>
                </span>
              }
            />
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", minWidth: 0 }}>
              <span className="th-nums" style={{
                fontSize: "var(--th-text-xl)", fontWeight: 600, color: "var(--color-fg)",
                lineHeight: 1.15, letterSpacing: "-0.01em",
              }}>{nf(ME.usedCredits)}</span>
              <span className="th-nums" style={{ fontSize: "var(--th-text-sm)", color: "var(--color-fg-muted)" }}>
                / {nf(ME.quotaCredits)} credits
              </span>
              {/* 水位状态由进度条颜色承载（PRD：正常蓝 / 接近上限黄 / 超额红），
                  不再另加一个状态 chip —— 同一属性只在一处着色。 */}
              <span className="th-nums" style={{
                marginLeft: "auto", fontSize: "var(--th-text-md)",
                fontWeight: 600, color: "var(--color-fg)",
              }}>{pct.toFixed(1)}%</span>
            </div>
            <Progress value={ME.usedCredits} max={ME.quotaCredits} tone={level.tone} />
            <InsetNote>
              颜色状态：<strong style={{ color: "var(--color-fg)" }}>正常消耗</strong>蓝色 ·
              <strong style={{ color: "var(--color-fg)" }}> 接近上限</strong>（≥{QUOTA_WARN_AT}%）黄色 ·
              <strong style={{ color: "var(--color-fg)" }}> 用到池化共享额度</strong>（≥100%）红色。
              额度{ME.resetPolicy}，下次重置 {ME.nextReset}。
            </InsetNote>
          </Card>
        </div>

        {/* ── ③ 右栏：Contribution activity ─────────────────── */}
        <div style={{ flex: "1 1 300px", minWidth: 0, maxWidth: 420, display: "flex" }}>
          <ContributionActivity />
        </div>
      </div>
    </>
  );
}

/* 按月分组的贡献流水。没有对应的规范组件 —— AgentTimeline 是 agent 单次
   运行轨迹（thinking / tool call / retrieval），语义不匹配，不能挪用；
   这里按 DESIGN.md 的 token 与状态色规则做成页面内组件。
   展开后高度锁死并在本区域内滚动，页面整体仍是一屏。 */
function ContributionActivity() {
  const [expanded, setExpanded] = React.useState(false);
  const shown = expanded ? CONTRIB_MONTHS : CONTRIB_MONTHS.slice(0, CONTRIB_PREVIEW_MONTHS);
  const rest = CONTRIB_MONTHS.length - CONTRIB_PREVIEW_MONTHS;

  return (
    <Card style={{ flex: 1, minWidth: 0 }}>
      <CardHead title={M.contribActivity.label} hint={M.contribActivity.hint} />
      <span className="th-nums" style={{
        fontSize: "var(--th-text-2xs)", color: "var(--color-fg-muted)", lineHeight: 1.6,
      }}>
        {CONTRIB_RANGE.start} – {CONTRIB_RANGE.end} · 共 {nf(CONTRIB_RANGE.deliveries)} 次交付
      </span>

      <div style={{
        // 展开后不撑高页面：锁高度、区域内滚动
        maxHeight: expanded ? 420 : "none",
        overflowY: expanded ? "auto" : "visible",
        minWidth: 0, paddingRight: expanded ? 4 : 0,
      }}>
        {shown.map((m) => <MonthGroup key={`${m.year}-${m.month}`} m={m} />)}
      </div>

      {rest > 0 && (
        <Button
          variant="secondary" size="sm"
          icon={expanded ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"}
          onClick={() => setExpanded((v) => !v)}
        >
          {expanded ? "收起" : `展开全部 · 还有 ${rest} 个月`}
        </Button>
      )}
    </Card>
  );
}

function MonthGroup({ m }) {
  return (
    <div style={{ display: "flex", gap: 10, minWidth: 0 }}>
      {/* 时间轴轨：当前统计月用成功色实心节点，其余空心中性 */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", flexShrink: 0, paddingTop: 4 }}>
        <span style={{
          width: 8, height: 8, borderRadius: "50%", flexShrink: 0,
          background: m.current ? "var(--color-success-solid)" : "var(--color-surface)",
          border: m.current ? "none" : "1.5px solid var(--th-gray-200)",
        }} />
        <span style={{ flex: 1, width: 1, background: "var(--color-divider)", minHeight: 8 }} />
      </div>

      <div style={{ flex: 1, minWidth: 0, paddingBottom: 14 }}>
        <span style={{ display: "flex", alignItems: "baseline", gap: 6, marginBottom: 6 }}>
          <span style={{ fontSize: "var(--th-text-sm)", fontWeight: 600, color: "var(--color-fg)" }}>
            {m.month}
          </span>
          <span className="th-nums" style={{ fontSize: "var(--th-text-2xs)", color: "var(--color-fg-subtle)" }}>
            {m.year}
          </span>
        </span>
        <div style={{ display: "flex", flexDirection: "column", gap: 10, minWidth: 0 }}>
          {m.events.map((ev, i) => <EventRow key={i} ev={ev} />)}
        </div>
      </div>
    </div>
  );
}

const EVENT_ICON = {
  commit: "ri-git-commit-line",
  repo: "ri-git-repository-line",
  mr: "ri-git-merge-line",
  peak: "ri-trophy-line",     // 用图标，不用 emoji（DESIGN.md 原则 4「无噪声」）
};

const LANG_TONE = { TypeScript: "cat1", JavaScript: "cat4", Python: "cat5", Go: "cat2", Rust: "cat6" };

function EventRow({ ev }) {
  const peak = ev.type === "peak";
  return (
    <div style={{ display: "flex", gap: 8, minWidth: 0 }}>
      <i className={EVENT_ICON[ev.type]} aria-hidden="true" style={{
        fontSize: 14, lineHeight: 1.5, flexShrink: 0,
        color: peak ? "var(--color-warning-fg)" : "var(--color-fg-subtle)",
      }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
        <span className={peak ? "th-nums" : undefined} style={{
          fontSize: "var(--th-text-xs)",
          fontWeight: peak ? 600 : 500,
          color: "var(--color-fg)", lineHeight: 1.5,
        }}>{ev.text}</span>

        {/* 右侧栏窄，仓库名一行一个 —— 挤在一行会从单词中间断开
            （ai-productivity-dashboard · platform-ops-cons / ole）。 */}
        {ev.repos && (
          <span style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
            {ev.repos.map((r) => (
              <span key={r} style={{
                fontFamily: "var(--th-font-mono)", fontSize: "var(--th-text-2xs)",
                color: "var(--color-link)", lineHeight: 1.6,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }} title={r}>{r}</span>
            ))}
          </span>
        )}

        {ev.type === "repo" && (
          <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap", minWidth: 0 }}>
            <span title={ev.repo} style={{
              fontFamily: "var(--th-font-mono)", fontSize: "var(--th-text-2xs)",
              color: "var(--color-link)", minWidth: 0,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
            }}>{ev.repo}</span>
            <Tag tone={LANG_TONE[ev.language] || "cat3"}>{ev.language}</Tag>
            <span className="th-nums" style={{ fontSize: "var(--th-text-2xs)", color: "var(--color-fg-subtle)" }}>
              {ev.date}
            </span>
          </span>
        )}

        {ev.note && (
          <span className="th-nums" style={{
            fontSize: "var(--th-text-2xs)", color: "var(--color-fg-muted)", lineHeight: 1.6,
          }}>{ev.note}</span>
        )}
      </div>
    </div>
  );
}
