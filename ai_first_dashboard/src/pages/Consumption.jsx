/* Consumption.jsx — 消耗来源（from tokenhub）（PRD v3 · 2.1 第三个模块）
     1. Token / day 每日 token 消耗趋势图
     2. Token 消耗模型分布（by 模型）→ ROI 最高 / 最低的模型
     3. Token 消耗项目分布（by 代码库）→ ROI 最高的项目
     4. Cost breakdown：更多成本分析，外链至 TokenHub

   维度 tab：总览 / 模型 / 工程，三视图共用同一张图与同一套图例可切换。
   时间范围：全部 / 30 天 / 7 天，按自然日分桶，取调用记录的 timestamp
   本地时区归日。

   着色语义 3 类：分类（图表色板，图例与堆叠柱同色，同一属性只着色一处）+
   状态（ROI 高低的结论语气）+ 表面层次（口径 inset）。 */
import React from "react";
import {
  Card, CardHead, Chart, Segmented, DataTable, Button, compact, nf,
} from "../ds/index.js";
import { Section, SECTION_IDS, ChartNote, rangeDays } from "./shared.jsx";
import { M } from "../data/metrics.js";
import {
  MODELS, REPOS, spendSeries, TOKEN_DAILY, MY_TEAM, ENTERPRISE,
  mean, bestBy, worstBy,
} from "../data/mock.js";

const DIMS = [
  { label: "总览", value: "overview" },
  { label: "模型", value: "model" },
  { label: "工程", value: "repo" },
];

const DIM_NOTE = {
  overview: "总览回答「花了多少」：每日全口径消耗金额，按自然日分桶。",
  model: "模型回答「用了什么」：看模型选型与成本结构，占比按 token 数计。",
  repo: "工程回答「为什么花」：看消耗归属与异常定位，占比按金额计，非按 token 计。工程 = 调用发生的代码仓库，也和项目概念等同。",
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

  // 每日 token 消耗趋势（PRD 第 1 项）
  const daily = React.useMemo(
    () => TOKEN_DAILY.slice(-days).map((d) => ({ ...d, value: Math.round(d.value * k) })),
    [days, k]
  );
  const dailyMean = mean(daily);

  const bestModel = bestBy(MODELS, "roi");
  const worstModel = worstBy(MODELS, "roi");
  const bestRepo = bestBy(REPOS, "roi");
  const topRepo = bestBy(REPOS, "share");

  return (
    <Section id={SECTION_IDS.consumption} title="消耗来源（from tokenhub）">
      {/* ── 1. Token / day 每日消耗趋势 ── */}
      <Card>
        <CardHead
          title="Token 消耗"
          hint="每日 token 消耗总量，按自然日分桶，取调用记录的 timestamp 本地时区归日。虚线为窗口内日均。"
          meta={`近 ${days} 天 · 悬停查看单日`}
        />
        <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap" }}>
          <span className="th-nums" style={{
            fontSize: "var(--th-text-xl)", fontWeight: 600, color: "var(--color-fg)",
            lineHeight: 1.15, letterSpacing: "-0.01em",
          }}>日均 {compact(dailyMean)}</span>
          <span style={{ fontSize: "var(--th-text-xs)", color: "var(--color-fg-muted)" }}>tokens</span>
        </div>
        <Chart
          type="area" height={200} data={daily} smooth
          series={[{ key: "value", name: "每日 token 消耗" }]}
          showLegend={false}
          yFormat={compact}
          refLine={{ value: dailyMean, label: `均值 ${compact(dailyMean)}` }}
        />
        <ChartNote>
          {`日均 ${compact(dailyMean)} tokens，随工作日起伏、无异常尖峰，节奏可预期。`}
        </ChartNote>
      </Card>

      {/* ── 2 / 3. 模型分布与工程分布，共用同一张图与图例 ── */}
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
          series={src ? src.map((s) => ({ key: s.key, name: s.label })) : [{ key: "total", name: "每日消耗" }]}
          yFormat={(v) => `¥${compact(v)}`}
        />

        <ChartNote>
          {dim === "model"
            ? `ROI 最高${bestModel.label} ${bestModel.roi} 行/元，最低${worstModel.label} ${worstModel.roi}，后者可优先收敛。`
            : dim === "repo"
            ? `ROI 最高 ${bestRepo.label} ${bestRepo.roi} 行/元；占比最高的 ${topRepo.label} 仅 ${topRepo.roi}，优先优化。`
            : `近 ${days} 天合计 ¥${nf(total, 0)}，日均 ¥${nf(Math.round(total / days))}，周末回落明显。`}
        </ChartNote>
      </Card>

      {/* ── 明细表 ── */}
      {src && (
        <Card pad={false}>
          <div style={{ padding: "var(--th-card-pad)" }}>
            <CardHead
              title={dim === "model" ? "模型明细" : "工程明细"}
              hint={`${M.calls.hint}；${M.inOut.hint}`}
              meta={`${src.length} 项 · 与上方图例同色`}
              actions={
                /* 4. Cost breakdown：更多成本分析外链至 TokenHub */
                <Button variant="link" icon="ri-external-link-line" iconPosition="right"
                        onClick={() => ctx.openTokenHub?.("cost-breakdown")}>
                  Cost breakdown
                </Button>
              }
            />
          </div>
          <DataTable
            embedded
            density="compact"
            rowKey="key"
            columns={[
              {
                key: "label", label: dim === "model" ? "模型" : "工程（repo_key）", width: "1.6fr",
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
                key: "roi", label: "ROI", width: "84px", align: "right",
                render: (r) => <span className="th-nums">{r.roi.toFixed(1)} 行/元</span>,
              },
              {
                key: "share", label: "占比", width: "72px", align: "right",
                render: (r) => <span className="th-nums" style={{ fontWeight: 600 }}>{r.share}%</span>,
              },
            ]}
            rows={src}
          />
        </Card>
      )}
    </Section>
  );
}
