/* Overview.jsx — AI First 概览（PRD 3.1 / 3.2 首个模块）
   「AI 洞察，Agent 视角重构看板 —— 告诉用户 1. 决策依据 2. 有无风险」

   着色语义（视觉预算 ≤3 类）：状态色（洞察的风险/决策语气）+ 构成色阶
   （覆盖率分层条）+ 数据墨色（MetricStrip 的 Sparkline）。本页不使用强度色。
   AI 输出区用 --color-surface-quiet（4% 品牌 tint，不可点击、不构成交互暗示，
   是 DESIGN.md 原则 1 的唯一例外）。 */
import React from "react";
import {
  Card, CardHead, MetricStrip, Button, StatusChip,
  TokenMeter, TrendDelta, Divider, compact, nf,
} from "../ds/index.js";
import { Section, SECTION_IDS, KV } from "./shared.jsx";
import { M } from "../data/metrics.js";
import { ENTERPRISE, MY_TEAM, insightsFor, DAU_SPARK, DAA_SPARK, UPDATED_AT } from "../data/mock.js";

const TONE_LABEL = { danger: "高风险", warning: "需关注", success: "机会", info: "提示" };

export default function Overview({ ctx }) {
  const team = ctx.scope === "team";
  // 团队口径按人数占比缩放，保证与企业口径自洽。
  const k = team ? MY_TEAM.people / ENTERPRISE.headcount : 1;

  const insights = React.useMemo(
    () => insightsFor(ctx.scope, MY_TEAM.name), [ctx.scope]
  );
  const risks = insights.filter((i) => i.kind === "risk");
  const decisions = insights.filter((i) => i.kind === "decision");

  return (
    <Section id={SECTION_IDS.overview} title="AI First 概览">
      <MetricStrip
        animate
        items={[
          { key: "dau", label: M.dau.label, hint: M.dau.hint, value: Math.round(ENTERPRISE.dau * k), suffix: "人", delta: ENTERPRISE.dauDelta, series: DAU_SPARK },
          { key: "daa", label: M.daa.label, hint: M.daa.hint, value: Math.round(ENTERPRISE.daa * k), suffix: "次", delta: ENTERPRISE.daaDelta, series: DAA_SPARK },
          { key: "roi", label: M.roi.label, hint: M.roi.hint, value: ENTERPRISE.roi, suffix: "行/元", delta: 8.4, format: (n) => n.toFixed(1) },
          { key: "spend", label: "本月消耗", hint: M.spendRank.hint, value: +(ENTERPRISE.spend * k).toFixed(2), prefix: "¥", delta: ENTERPRISE.spendDelta, deltaTone: "inverse", format: (n) => nf(n, 2) },
        ]}
      />

      {/* AI 洞察 —— 静态 AI 输出区，quiet tint 打底，不可点击 */}
      <Card>
        <CardHead
          title="AI 洞察"
          hint="由本周期指标自动生成：先判断有无风险，再给出可执行的决策依据。每条洞察都标注它读的是哪几个指标。"
          meta={`${insights.length} 条 · 风险 ${risks.length} · 机会 ${decisions.length}`}
        />
        <div style={{
          background: "var(--color-surface-quiet)",
          border: "1px solid var(--color-surface-quiet-border)",
          borderRadius: "var(--th-radius-sm)",
          padding: 12,
          display: "flex", flexDirection: "column", gap: 12, minWidth: 0,
        }}>
          <SectionLabel icon="ri-alert-line">有无风险</SectionLabel>
          {risks.map((it) => <InsightRow key={it.id} item={it} ctx={ctx} />)}
          <Divider />
          <SectionLabel icon="ri-compass-3-line">决策依据</SectionLabel>
          {decisions.map((it) => <InsightRow key={it.id} item={it} ctx={ctx} />)}
        </div>
      </Card>

      {/* 覆盖率 + 转化摘要：两张并排卡，窄屏自动堆叠（不写固定列数） */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))",
        gap: 16, minWidth: 0,
      }}>
        <Card>
          <CardHead title={team ? "团队 AI 覆盖率" : M.coverage.label} hint={M.coverage.hint} meta="本月" />
          <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
            <span className="th-nums" style={{
              fontSize: "var(--th-text-xl)", fontWeight: 600, color: "var(--color-fg)", lineHeight: 1.15,
            }}>{ENTERPRISE.coverageRate}%</span>
            <span className="th-nums" style={{ fontSize: "var(--th-text-xs)", color: "var(--color-fg-muted)" }}>
              {nf(Math.round(ENTERPRISE.covered * k))} / {nf(Math.round(ENTERPRISE.headcount * k))} 人
            </span>
            <span style={{ marginLeft: "auto" }}>
              <TrendDelta value={ENTERPRISE.coverageDeltaPP} suffix="pp" />
            </span>
          </div>
          {/* 一个总量被切开 → 构成色阶，未使用是中性余量段 */}
          <TokenMeter
            unit="人"
            segments={[
              { label: "周活跃使用", value: Math.round(ENTERPRISE.weeklyActive * k) },
              { label: "低频使用", value: Math.round(ENTERPRISE.lowFreq * k) },
            ]}
            residual={Math.round(ENTERPRISE.unused * k)}
            residualLabel="未使用"
            showTotal={false}
          />
          <Button variant="link" icon="ri-arrow-right-line" iconPosition="right"
                  onClick={() => ctx.go("adoption")}>
            查看应用情况
          </Button>
        </Card>

        <Card>
          <CardHead title="本月转化摘要" hint={M.funnel.hint} meta="锚定 = 当月 AI 生成行数" />
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <KV label={M.aiLines.label} value={`${compact(ENTERPRISE.aiLines * k)} 行`} />
            <KV label={M.acceptRate.label} value={`${ENTERPRISE.acceptRate}%`} />
            <KV label={M.retentionRate.label} value={`${ENTERPRISE.retentionRate}%`} />
            <KV label={M.mergeRate.label} value={`${ENTERPRISE.mergeRate}%`} />
            <Divider />
            <KV label={M.reworkRate.label} value={`${ENTERPRISE.reworkRate}%`} />
            <KV label={M.delivery.label} value={`${nf(Math.round(ENTERPRISE.delivery * k))} MR`} />
          </div>
          <Button variant="link" icon="ri-arrow-right-line" iconPosition="right"
                  onClick={() => ctx.go("funnel")}>
            查看转化漏斗
          </Button>
        </Card>
      </div>
    </Section>
  );
}

function SectionLabel({ icon, children }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: 6,
      fontSize: "var(--th-text-xs)", color: "var(--brand-600)", fontWeight: 600,
    }}>
      <i className={icon} aria-hidden="true" style={{ fontSize: 14 }} />
      {children}
    </span>
  );
}

/* 洞察行：主文本 + 1 个状态 chip + 一行 muted 元信息（列表行 ≤3 个视觉元素）。*/
function InsightRow({ item, ctx }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", minWidth: 0 }}>
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", minWidth: 0 }}>
          <StatusChip tone={item.tone}>{TONE_LABEL[item.tone]}</StatusChip>
          <span style={{ fontSize: "var(--th-text-sm)", fontWeight: 600, color: "var(--color-fg)", lineHeight: 1.5 }}>
            {item.title}
          </span>
        </span>
        <span style={{ fontSize: "var(--th-text-xs)", color: "var(--color-fg-muted)", lineHeight: 1.7 }}>
          {item.body}
        </span>
        <span className="th-nums" style={{ fontSize: "var(--th-text-2xs)", color: "var(--color-fg-subtle)" }}>
          依据 · {item.basis}
        </span>
      </div>
      <Button variant="link" onClick={() => ctx.go(item.target.page, item.target)}
              style={{ flexShrink: 0, marginTop: 2 }}>
        {item.action}
      </Button>
    </div>
  );
}
