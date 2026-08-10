/* FunnelRoi.jsx — SDLC / ROI 转化漏斗（PRD 3.1.4 / 3.2）
   Part 1 · SDLC 漏斗：以当月 AI 生成的代码行数为锚定基数，后续每个节点统计
     「这批锚定行中，走完到该环节且仍存活的行数」。锚定行只会被保留或被删除/
     改写（掉出统计），因此单调递减，不受后续人工新增代码影响。
     细分组织整体 / 部门 / 项目 / 个人的漏斗，右上角可切换面板；
     漏斗陡峭程度衡量转化效率。
   Part 2 · ROI 趋势：Invest = token 金额，Return = 最终留存代码行数，
     杠杆形态直观展现多少投入撬动了多大产出。

   着色语义 3 类：分类（漏斗与图表色板）+ 状态（转化率涨跌）+ 表面层次
   （公式表 inset）。本页不用强度色 —— 强度色整屏 ≤1 处，已给 AI 应用分析页。 */
import React from "react";
import {
  PageHeader, Card, CardHead, Chart, Segmented, Divider,
  TrendDelta, compact, nf,
} from "../ds/index.js";
import { BoardActions, ScopeTag, InsetNote, KV } from "./shared.jsx";
import { M } from "../data/metrics.js";
import { FUNNEL_SCOPES, funnelOf, ROI_TREND, ENTERPRISE, UPDATED_AT } from "../data/mock.js";
import { rangeDays } from "./shared.jsx";

const SCOPE_OPTS = [
  { label: "组织整体", value: "org" },
  { label: "部门", value: "dept" },
  { label: "项目", value: "project" },
  { label: "个人", value: "person" },
];

export default function FunnelRoi({ ctx }) {
  const [scope, setScope] = React.useState(ctx.scope === "team" ? "dept" : "org");
  const steps = funnelOf(scope);

  const [gen, acc, pr, merged] = steps.map((s) => s.value);
  const acceptRate = (acc / gen) * 100;
  const retentionRate = (pr / acc) * 100;
  const mergeRate = (merged / pr) * 100;
  // 陡峭程度：首步到末步的整体存活率，越高漏斗越平缓、转化效率越好
  const overall = (merged / gen) * 100;

  const days = rangeDays(ctx.range);
  const trend = ROI_TREND.slice(-days);
  const invest = trend.reduce((s, d) => s + d.invest, 0);
  const ret = trend.reduce((s, d) => s + d.ret, 0);
  const roi = ret / invest;

  return (
    <>
      <PageHeader
        title="SDLC / ROI 转化漏斗"
        tags={<ScopeTag scope={ctx.scope} />}
        meta={`更新于 ${UPDATED_AT}`}
        description="漏斗回答「AI 写的代码最后活下来多少」，ROI 趋势回答「这些代码值不值这笔钱」。"
        actions={<BoardActions ctx={ctx} />}
      />

      {/* ── Part 1 · SDLC 漏斗 ───────────────────────────────── */}
      <Card>
        <CardHead
          title="Part 1 · SDLC 漏斗"
          hint={M.funnel.hint}
          meta={`锚定基数 ${compact(gen)} 行 · ${FUNNEL_SCOPES[scope].label}`}
          actions={<Segmented size="sm" options={SCOPE_OPTS} value={scope} onChange={setScope} />}
        />

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
          gap: 16, alignItems: "start", minWidth: 0,
        }}>
          <Chart
            type="funnel"
            height={232}
            data={steps}
            yFormat={compact}
            unit=" 行"
          />

          <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
            <InsetNote>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <FormulaRow
                  name={M.acceptRate.label}
                  formula="采纳行数 ÷ AI 生成行数"
                  value={acceptRate}
                  detail={`${compact(acc)} ÷ ${compact(gen)}`}
                />
                <Divider />
                <FormulaRow
                  name={M.retentionRate.label}
                  formula="提交 PR 的 AI 行数 ÷ 采纳行数"
                  value={retentionRate}
                  detail={`${compact(pr)} ÷ ${compact(acc)}`}
                />
                <Divider />
                <FormulaRow
                  name={M.mergeRate.label}
                  formula="合入主干的 AI 行数 ÷ 提交 PR 的 AI 行数"
                  value={mergeRate}
                  detail={`${compact(merged)} ÷ ${compact(pr)}`}
                />
              </div>
            </InsetNote>

            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <KV label="整体存活率（首步 → 末步）" value={`${overall.toFixed(1)}%`} />
              <KV label="转化效率判读" value={overall >= 40 ? "漏斗平缓，转化健康" : "漏斗陡峭，需排查采纳后流失"} mono={false} />
              <KV label={M.reworkRate.label} value={`${ENTERPRISE.reworkRate}%`} />
            </div>
          </div>
        </div>
      </Card>

      {/* ── Part 2 · ROI 趋势 ────────────────────────────────── */}
      <Card>
        <CardHead
          title="Part 2 · ROI 趋势"
          hint={M.roi.hint}
          meta={`近 ${days} 天 · ${FUNNEL_SCOPES[scope].label}`}
          actions={
            <span style={{ display: "inline-flex", alignItems: "baseline", gap: 6 }}>
              <span className="th-nums" style={{ fontSize: "var(--th-text-md)", fontWeight: 600, color: "var(--color-fg)" }}>
                {roi.toFixed(1)}
              </span>
              <span style={{ fontSize: "var(--th-text-xs)", color: "var(--color-fg-muted)" }}>行/元</span>
              <TrendDelta value={8.4} />
            </span>
          }
        />

        {/* 一个量（Invest 金额，柱 · 左轴）+ 一个率（ROI 行/元，线 · 右轴），
            量级差 ≥10×，是 DESIGN.md 允许双轴的唯一情形 */}
        <Chart
          type="combo"
          height={236}
          data={trend}
          series={[
            { key: "invest", name: "Invest · token 金额（元）" },
            { key: "roi", name: "ROI（行/元）", type: "line", axis: "right", color: "--th-chart-5" },
          ]}
          yFormat={(v) => `¥${compact(v)}`}
          y2Format={(v) => v.toFixed(0)}
        />

        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12, minWidth: 0,
        }}>
          <KV label="Invest · token 金额" value={`¥${nf(invest, 2)}`} />
          <KV label="Return · 最终留存代码行数" value={`${compact(ret)} 行`} />
          <KV label="杠杆" value={`每 ¥1 撬动 ${roi.toFixed(1)} 行留存代码`} />
        </div>
      </Card>
    </>
  );
}

function FormulaRow({ name, formula, value, detail }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, minWidth: 0 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 12 }}>
        <span style={{ fontSize: "var(--th-text-xs)", color: "var(--color-fg)", fontWeight: 600 }}>{name}</span>
        <span className="th-nums" style={{ fontSize: "var(--th-text-sm)", color: "var(--color-fg)", fontWeight: 600 }}>
          {value.toFixed(1)}%
        </span>
      </div>
      <span style={{ fontSize: "var(--th-text-2xs)", color: "var(--color-fg-muted)", lineHeight: 1.6 }}>
        {formula}
      </span>
      <span className="th-nums" style={{ fontSize: "var(--th-text-2xs)", color: "var(--color-fg-subtle)" }}>
        {detail}
      </span>
    </div>
  );
}
