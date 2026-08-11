/* AgentUsage.jsx — Agent 使用监控大盘（PRD v3 · 2.1 第二个模块）
     · DAU 活跃度趋势：分 InfCode IDE / 插件
     · 平均对话轮次趋势
     · Commit 趋势
     · 分析：对话轮次与 commit 趋势交叉验证
         轮次涨幅 > commit 涨幅 → AI 使用更加频繁，但产出效率没跟上
         commit 涨幅 > 轮次涨幅 → AI 使用效能大幅提升、产能显著扩张
     · InfCode 使用分析：AI 生成代码行数 / 采纳代码行数 / 采纳率

   着色语义 3 类：分类（DAU 分端与 InfCode 堆叠的图表色）+ 状态（交叉验证
   结论的语气）+ 数据墨色（均值虚线）。本模块不用强度色。 */
import React from "react";
import {
  Card, CardHead, Chart, Segmented, TrendDelta, compact, nf,
} from "../ds/index.js";
import { Section, SECTION_IDS, ChartNote } from "./shared.jsx";
import { M } from "../data/metrics.js";
import {
  ENTERPRISE, MY_TEAM, DAU_BY_CLIENT, TURNS_TREND, COMMIT_TREND,
  INFCODE_USAGE, mean, growth,
} from "../data/mock.js";

const WIN = [{ label: "7 天", value: 7 }, { label: "30 天", value: 30 }];

export default function AgentUsage({ ctx }) {
  const team = ctx.scope === "team";
  const k = team ? MY_TEAM.people / ENTERPRISE.headcount : 1;

  const [turnsWin, setTurnsWin] = React.useState(30);
  const [commitWin, setCommitWin] = React.useState(30);
  const [dauWin, setDauWin] = React.useState(30);

  const scale = React.useCallback(
    (rows, keys) => rows.map((r) => {
      const o = { ...r };
      keys.forEach((key) => { o[key] = Math.round(r[key] * k); });
      return o;
    }), [k]
  );

  const dau = React.useMemo(
    () => scale(DAU_BY_CLIENT, ["ide", "plugin"]).slice(-dauWin), [scale, dauWin]
  );
  const turns = React.useMemo(
    () => scale(TURNS_TREND, ["value"]).slice(-turnsWin), [scale, turnsWin]
  );
  const commits = React.useMemo(
    () => scale(COMMIT_TREND, ["value"]).slice(-commitWin), [scale, commitWin]
  );
  const infcode = React.useMemo(
    () => scale(INFCODE_USAGE, ["accepted", "rejected"]), [scale]
  );

  const turnsMean = mean(turns);
  const commitMean = mean(commits);
  const dauTotal = dau.map((d) => ({ ...d, total: d.ide + d.plugin }));
  const dauMean = mean(dauTotal, "total");

  /* 交叉验证：两条趋势的前后半程涨幅之差决定结论的语气。
     取全 30 天窗口比较，避免用户把窗口切到 7 天后结论跟着抖。 */
  const turnsGrowth = growth(scale(TURNS_TREND, ["value"]));
  const commitGrowth = growth(scale(COMMIT_TREND, ["value"]));
  const outpaced = turnsGrowth > commitGrowth;
  const gap = Math.abs(turnsGrowth - commitGrowth);

  const genTotal = infcode.reduce((s, d) => s + d.accepted + d.rejected, 0);
  const accTotal = infcode.reduce((s, d) => s + d.accepted, 0);
  const accRate = (accTotal / genTotal) * 100;

  return (
    <Section id={SECTION_IDS.agent} title="Agent 使用监控大盘">
      {/* ── DAU 活跃度趋势：分 InfCode IDE / 插件 ── */}
      <Card>
        <CardHead
          title="DAU 活跃度趋势"
          hint={`${M.dau.hint}。按客户端拆分为 InfCode IDE 与插件两端。`}
          meta={`近 ${dauWin} 天 · 日均 ${nf(Math.round(dauMean))} 人`}
          actions={<Segmented size="sm" options={WIN} value={String(dauWin)} onChange={(v) => setDauWin(+v)} />}
        />
        <Chart
          type="line"
          height={220}
          data={dau}
          series={[
            { key: "ide", name: "InfCode IDE" },
            { key: "plugin", name: "插件" },
          ]}
          smooth
          yFormat={(v) => nf(v)}
          unit=" 人"
        />
      </Card>
      <ChartNote>
        {`活跃度长期趋近 ${nf(Math.round(dauMean))} 人/日，IDE 端占 ${((mean(dau, "ide") / dauMean) * 100).toFixed(0)}%，两端同步波动。`}
      </ChartNote>

      {/* ── 对话轮次 / Commit 两条趋势并排，供交叉验证 ── */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "stretch", minWidth: 0 }}>
        <div style={{ flex: "1 1 420px", minWidth: 0, display: "flex" }}>
          <Card style={{ flex: 1, minWidth: 0 }}>
            <CardHead
              title="对话轮次"
              hint={M.turns.hint}
              meta={`近 ${turnsWin} 天`}
              actions={<Segmented size="sm" options={WIN} value={String(turnsWin)} onChange={(v) => setTurnsWin(+v)} />}
            />
            <TrendHeadline value={turns[turns.length - 1].value} meanValue={turnsMean}
                           label={turns[turns.length - 1].label} unit="轮" />
            <Chart
              type="area" height={188} data={turns} smooth
              series={[{ key: "value", name: "对话轮次" }]}
              showLegend={false}
              yFormat={(v) => nf(v)}
              refLine={{ value: turnsMean, label: `均值 ${nf(Math.round(turnsMean))}` }}
            />
          </Card>
        </div>

        <div style={{ flex: "1 1 420px", minWidth: 0, display: "flex" }}>
          <Card style={{ flex: 1, minWidth: 0 }}>
            <CardHead
              title="Commit"
              hint="代码提交次数的每日趋势，用于与对话轮次交叉验证「用得多」是否真的换来了「产出多」。"
              meta={`近 ${commitWin} 天`}
              actions={<Segmented size="sm" options={WIN} value={String(commitWin)} onChange={(v) => setCommitWin(+v)} />}
            />
            <TrendHeadline value={commits[commits.length - 1].value} meanValue={commitMean}
                           label={commits[commits.length - 1].label} unit="次" />
            <Chart
              type="area" height={188} data={commits} smooth
              series={[{ key: "value", name: "Commit", color: "--th-chart-5" }]}
              showLegend={false}
              yFormat={(v) => nf(v)}
              refLine={{ value: commitMean, label: `均值 ${nf(Math.round(commitMean))}` }}
            />
          </Card>
        </div>
      </div>

      {/* ── 使用趋势分析 ──
          两张图共用这一条结论，图内不再各自加注释：单看任一条曲线都得不出
          判断，「用得多」还是「产出强」只能由两者涨幅之差读出来。
          文案取 PRD 标黄原句，涨幅从同一份数据现算，两支会随数据自动翻面。 */}
      <ChartNote label="使用趋势分析" tone={outpaced ? "warning" : "success"}>
        {outpaced
          ? `平均对话轮次涨幅 ${turnsGrowth.toFixed(1)}% 高于 commit 涨幅 ${commitGrowth.toFixed(1)}%，AI 使用更加频繁但产出效率没跟上。`
          : `commit 涨幅 ${commitGrowth.toFixed(1)}% 高于对话轮次涨幅 ${turnsGrowth.toFixed(1)}%，AI 使用效能大幅提升、产能显著扩张。`}
      </ChartNote>

      {/* ── InfCode 使用分析 ── */}
      <Card>
        <CardHead
          title="InfCode 使用分析"
          hint="每日 AI 生成代码行数拆成采纳 / 未采纳两段，折线为当日采纳率（右轴）。"
          meta={`近 30 天 · 生成 ${compact(genTotal)} 行 · 采纳 ${compact(accTotal)} 行 · 采纳率 ${accRate.toFixed(1)}%`}
        />
        {/* 一个量（行数，堆叠柱 · 左轴）+ 一个率（采纳率 % · 右轴），
            量级差 ≥10×，是 DESIGN.md 允许双轴的唯一情形 */}
        <Chart
          type="combo"
          height={236}
          data={infcode}
          series={[
            { key: "accepted", name: "采纳行数" },
            { key: "rejected", name: "未采纳行数", color: "--th-chart-11" },
            { key: "rate", name: "采纳率（%）", type: "line", axis: "right", color: "--th-chart-5" },
          ]}
          yFormat={(v) => compact(v)}
          y2Format={(v) => `${v.toFixed(0)}%`}
        />
      </Card>
      <ChartNote>
        {`生成 ${compact(genTotal)} 行、采纳 ${compact(accTotal)} 行，采纳率 ${accRate.toFixed(1)}%，整体趋势向上。`}
      </ChartNote>
    </Section>
  );
}

/* 趋势卡的头部大数字：当日值 + 与均值的偏离。
   偏离用 TrendDelta（状态色 -fg 档，写在文字上，不填形状）。 */
function TrendHeadline({ value, meanValue, label, unit }) {
  const delta = meanValue ? ((value - meanValue) / meanValue) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "baseline", gap: 8, flexWrap: "wrap", minWidth: 0 }}>
      <span className="th-nums" style={{
        fontSize: "var(--th-text-xl)", fontWeight: 600, color: "var(--color-fg)",
        lineHeight: 1.15, letterSpacing: "-0.01em",
      }}>{nf(value)}</span>
      <span style={{ fontSize: "var(--th-text-xs)", color: "var(--color-fg-muted)" }}>{unit}</span>
      <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 8 }}>
        <span className="th-nums" style={{ fontSize: "var(--th-text-2xs)", color: "var(--color-fg-subtle)" }}>
          {label} · 较均值
        </span>
        <TrendDelta value={+delta.toFixed(1)} tone="neutral" />
      </span>
    </div>
  );
}
