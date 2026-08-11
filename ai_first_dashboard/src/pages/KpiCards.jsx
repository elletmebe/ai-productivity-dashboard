/* KpiCards.jsx — 指标卡（PRD v3 · 2.1 第一个模块）
     · 最上方展现关键指标卡（本周）：ROI / 交付量 / 采纳率 / AI 代码占比 /
       单轮对话平均贡献
     · Agent 使用覆盖率
     · Token 额度：超额 / 未超额 两种状态，超额弹出提示

   着色语义 2 类：状态（涨跌、额度水位、超额提示）+ 构成（覆盖率三层）。
   本模块不用强度色，也不用分类色 —— 留给下面三个模块。 */
import React from "react";
import {
  Card, CardHead, MetricStrip, TokenMeter, TrendDelta, Banner,
  StatusChip, Tooltip, compact, nf,
} from "../ds/index.js";
import { Section, SECTION_IDS, usageLevel, QUOTA_WARN_AT } from "./shared.jsx";
import { M } from "../data/metrics.js";
import { ENTERPRISE, MY_TEAM, WEEK_KPI, QUOTA } from "../data/mock.js";

export default function KpiCards({ ctx }) {
  const team = ctx.scope === "team";
  const k = team ? MY_TEAM.people / ENTERPRISE.headcount : 1;

  const covered = Math.round(ENTERPRISE.covered * k);
  const head = Math.round(ENTERPRISE.headcount * k);
  const rate = +((covered / head) * 100).toFixed(1);

  const today = QUOTA.today;
  const pct = (today.used / today.total) * 100;
  const level = usageLevel(pct);
  const over = pct >= QUOTA_WARN_AT;

  return (
    <Section id={SECTION_IDS.kpi} title="指标卡">
      {/* 超额弹出提示 —— 只在触达预警线时出现 */}
      {over && (
        <Banner
          tone={pct >= 100 ? "danger" : "warning"}
          title={`今日 Token 额度已用 ${pct.toFixed(0)}%，按当前速率约 ${today.burnoutHours} 小时后耗尽`}
          description={pct >= 100
            ? "已进入池化共享额度，超出部分转按量计费。建议核对高消耗工程的上下文策略。"
            : `已越过 ${QUOTA_WARN_AT}% 预警线。耗尽后超出部分转按量计费。`}
        />
      )}

      {/* 本周关键指标卡（5 项） */}
      <MetricStrip
        animate
        columns={186}
        items={[
          { key: "roi", label: M.roi.label, hint: M.roi.hint,
            value: WEEK_KPI.roi, suffix: "行/元", delta: WEEK_KPI.roiDelta, format: (n) => n.toFixed(1) },
          { key: "delivery", label: M.delivery.label, hint: M.delivery.hint,
            value: Math.round(WEEK_KPI.delivery * k), suffix: "MR", delta: WEEK_KPI.deliveryDelta },
          { key: "acceptRate", label: M.acceptRate.label, hint: M.acceptRate.hint,
            value: WEEK_KPI.acceptRate, suffix: "%", delta: WEEK_KPI.acceptRateDelta, format: (n) => n.toFixed(1) },
          { key: "aiShare", label: M.aiShare.label, hint: M.aiShare.hint,
            value: WEEK_KPI.aiShare, suffix: "%", delta: WEEK_KPI.aiShareDelta, format: (n) => n.toFixed(1) },
          { key: "lpt", label: M.linesPerTurn.label, hint: M.linesPerTurn.hint,
            value: WEEK_KPI.linesPerTurn, suffix: "行/轮", delta: WEEK_KPI.linesPerTurnDelta, format: (n) => n.toFixed(1) },
        ]}
      />

      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "stretch", minWidth: 0 }}>
        {/* Agent 使用覆盖率 */}
        <div style={{ flex: "3 1 420px", minWidth: 0, display: "flex" }}>
          <Card style={{ flex: 1, minWidth: 0 }}>
            <CardHead
              title={team ? "团队 Agent 使用覆盖率" : "Agent 使用覆盖率"}
              hint={M.coverage.hint}
              meta="本周"
              actions={<TrendDelta value={ENTERPRISE.coverageDeltaPP} suffix="pp" />}
            />
            <div style={{ display: "flex", alignItems: "baseline", gap: 10, flexWrap: "wrap" }}>
              <span className="th-nums" style={{
                fontSize: "var(--th-text-xl)", fontWeight: 600, color: "var(--color-fg)",
                lineHeight: 1.15, letterSpacing: "-0.01em",
              }}>{rate}%</span>
              <span className="th-nums" style={{ fontSize: "var(--th-text-xs)", color: "var(--color-fg-muted)" }}>
                {nf(covered)} / {nf(head)} 人
              </span>
            </div>
            {/* 一个总量（在册员工）被切开 → 构成色阶，未使用是中性余量段 */}
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
          </Card>
        </div>

        {/* Token 额度水位：两种状态并排演示 */}
        <div style={{ flex: "2 1 320px", minWidth: 0, display: "flex" }}>
          <Card style={{ flex: 1, minWidth: 0 }}>
            <CardHead
              title="Token 额度"
              hint={`当日已消耗 token ÷ 当日额度。越过 ${QUOTA_WARN_AT}% 预警线转黄，用尽后进入池化共享额度转红，超出部分按量计费。`}
              meta={`预警线 ${QUOTA_WARN_AT}%`}
            />
            <div style={{
              display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: 12, minWidth: 0,
            }}>
              <QuotaGauge q={QUOTA.today} />
              <QuotaGauge q={QUOTA.yesterday} />
            </div>
          </Card>
        </div>
      </div>
    </Section>
  );
}

/* 单个额度水位：竖向水位条 + 百分比 + 状态 chip + 一行说明。
   水位条是被填充的形状 → 走状态色的 -solid 档（不是 -fg）。
   空轨道取 --color-data-track，不是 gray-50。 */
function QuotaGauge({ q }) {
  const pct = Math.min(100, (q.used / q.total) * 100);
  const level = usageLevel((q.used / q.total) * 100);
  const fill = level.tone === "accent" ? "var(--color-accent)" : `var(--color-${level.tone}-solid)`;

  return (
    <div style={{ display: "flex", gap: 12, minWidth: 0 }}>
      <span aria-hidden="true" style={{
        width: 10, borderRadius: 999, background: "var(--color-data-track)",
        flexShrink: 0, position: "relative", overflow: "hidden", alignSelf: "stretch", minHeight: 62,
      }}>
        <span style={{
          position: "absolute", left: 0, right: 0, bottom: 0,
          height: `${pct}%`, background: fill, borderRadius: 999,
        }} />
      </span>

      <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 0 }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6, flexWrap: "wrap" }}>
          <span className="th-nums" style={{
            fontSize: "var(--th-text-xl)", fontWeight: 600, color: "var(--color-fg)", lineHeight: 1.15,
          }}>{Math.round(pct)}%</span>
          <StatusChip tone={level.chip}>{level.tone === "accent" ? "安全" : level.label}</StatusChip>
        </span>
        <span className="th-nums" style={{ fontSize: "var(--th-text-2xs)", color: "var(--color-fg-muted)" }}>
          {q.label} · {compact(q.used)} / {compact(q.total)}
        </span>
        <span style={{ fontSize: "var(--th-text-2xs)", color: level.tone === "accent" ? "var(--color-fg-subtle)" : `var(--color-${level.tone}-fg)`, lineHeight: 1.6 }}>
          {q.burnoutHours
            ? `约 ${q.burnoutHours} 小时后耗尽，超出部分转按量计费`
            : "按当前速率额度充足"}
        </span>
      </div>
    </div>
  );
}
