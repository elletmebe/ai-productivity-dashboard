/* Consumption.jsx — 消耗来源分析（from tokenhub）（PRD 3.1.5 / 3.2）
   维度 tab：总览 / 模型 / 工程 —— 三视图共用同一张图与同一套图例可切换。
     总览：回答花了多少 · 模型：回答用了什么 · 工程：回答为什么花
   时间范围：全部 / 30 天 / 7 天，按自然日分桶，取调用记录的 timestamp 本地时区归日。
   堆叠形态直观展现每天的消耗由哪几个模型/工程构成、谁在推高大盘。
   集中度信号：Top 1 工程占比过高 → 成本风险绑定在单一项目上。
   异常信号：占比高但调用次数低 = 单次调用过重，优先排查上下文管理。

   着色语义 3 类：分类（图表色板，图例与堆叠柱同色，同一属性只着色一处）+
   状态（两类信号 Banner）+ 表面层次（口径 inset）。 */
import React from "react";
import {
  PageHeader, Card, CardHead, Chart, Segmented, DataTable, compact, nf,
} from "../ds/index.js";
import { BoardActions, ScopeTag, InsetNote } from "./shared.jsx";
import { M } from "../data/metrics.js";
import { MODELS, REPOS, spendSeries, MY_TEAM, ENTERPRISE, UPDATED_AT } from "../data/mock.js";
import { rangeDays } from "./shared.jsx";

const DIMS = [
  { label: "总览", value: "overview" },
  { label: "模型", value: "model" },
  { label: "工程", value: "repo" },
];

const DIM_NOTE = {
  overview: "总览回答「花了多少」：每日全口径消耗金额，按自然日分桶。",
  model: "模型回答「用了什么」：看模型选型与成本结构，占比按 token 数计。",
  repo: "工程回答「为什么花」：看消耗归属与异常定位，占比按金额计，非按 token 计。工程 = 调用发生的代码仓库，由客户端透传 repo_key（tokenhub 侧不可得）。",
};

export default function Consumption({ ctx }) {
  const team = ctx.scope === "team";
  const k = team ? MY_TEAM.people / ENTERPRISE.headcount : 1;
  const [dim, setDim] = React.useState(ctx.deepLink?.dim || "repo");

  React.useEffect(() => {
    if (ctx.deepLink?.dim) setDim(ctx.deepLink.dim);
  }, [ctx.deepLink]);

  const days = rangeDays(ctx.range);
  const src = dim === "repo" ? REPOS : dim === "model" ? MODELS : null;

  const rows = React.useMemo(() => {
    const raw = spendSeries(days, dim);
    if (!k || k === 1) return raw;
    return raw.map((r) => {
      const out = { label: r.label };
      Object.keys(r).forEach((key) => { if (key !== "label") out[key] = Math.round(r[key] * k); });
      return out;
    });
  }, [days, dim, k]);

  const total = rows.reduce((s, r) =>
    s + (src ? src.reduce((a, x) => a + (r[x.key] || 0), 0) : r.total), 0);

  return (
    <>
      <PageHeader
        title="消耗来源分析"
        tags={<ScopeTag scope={ctx.scope} />}
        meta={`from tokenhub · 更新于 ${UPDATED_AT}`}
        description="同一张图三个视角：总览看总量，模型看结构，工程看归属。"
        actions={<BoardActions ctx={ctx} />}
      />

      <Card>
        <CardHead
          title={dim === "model" ? M.modelShare.label : dim === "repo" ? M.repoShare.label : "每日消耗总览"}
          hint={dim === "model" ? M.modelShare.hint : dim === "repo" ? M.repoShare.hint : "统计周期内每日消耗金额合计，按自然日分桶。"}
          meta={`近 ${days} 天 · 合计 ¥${nf(total, 2)}`}
          actions={<Segmented size="sm" options={DIMS} value={dim} onChange={setDim} />}
        />

        <Chart
          type={src ? "stackedBar" : "bar"}
          height={248}
          data={rows}
          series={src ? src.map((s, i) => ({ key: s.key, name: s.label })) : [{ key: "total", name: "每日消耗" }]}
          yFormat={(v) => `¥${compact(v)}`}
        />

        <InsetNote>{DIM_NOTE[dim]}</InsetNote>
      </Card>

      {src && (
        <Card pad={false}>
          <div style={{ padding: "var(--th-card-pad)" }}>
            <CardHead
              title={dim === "model" ? "模型明细" : "工程明细"}
              hint={`${M.calls.hint}；${M.inOut.hint}`}
              meta={`${src.length} 项 · 与上方图例同色`}
            />
          </div>
          <DataTable
            embedded
            density="compact"
            rowKey="key"
            columns={[
              {
                key: "label", label: dim === "model" ? "模型" : "工程（repo_key）", width: "1.8fr",
                render: (r) => (
                  <>
                    {/* 图例色块即分类色，不再另起一个 Tag —— 同一属性只在一处着色 */}
                    <span aria-hidden="true" style={{
                      width: 8, height: 8, borderRadius: 2, flexShrink: 0,
                      background: `var(--th-chart-${(src.findIndex((s) => s.key === r.key) % 12) + 1})`,
                    }} />
                    <span style={{
                      fontWeight: 500, fontFamily: dim === "repo" ? "var(--th-font-mono)" : "var(--th-font-cn)",
                      overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                    }}>{r.label}</span>
                  </>
                ),
              },
              {
                key: "calls", label: "调用次数", width: "92px", align: "right",
                render: (r) => <span className="th-nums">{compact(Math.round(r.calls * k))} 次</span>,
              },
              {
                key: "io", label: "入 / 出", width: "132px", align: "right",
                render: (r) => (
                  <span className="th-nums" style={{ color: "var(--color-fg-muted)" }}>
                    {compact(r.inTok * k)} 入 · {compact(r.outTok * k)} 出
                  </span>
                ),
              },
              {
                key: "share", label: "占比", width: "84px", align: "right",
                render: (r) => <span className="th-nums" style={{ fontWeight: 600 }}>{r.share}%</span>,
              },
            ]}
            rows={src}
          />
        </Card>
      )}
    </>
  );
}
