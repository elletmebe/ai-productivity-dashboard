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
  Card, CardHead, Chart, Segmented, Divider,
  TrendDelta, compact, nf,
} from "../ds/index.js";
import { Section, SECTION_IDS, InsetNote, KV } from "./shared.jsx";
import RankCard from "./RankCard.jsx";
import { M } from "../data/metrics.js";
import { FUNNEL_SCOPES, funnelOf, ROI_TREND_MONTHLY, RESULT_DIMS, ENTERPRISE } from "../data/mock.js";

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

  /* PRD v3：Part 2 时间线按月，不再按日。 */
  const trend = ROI_TREND_MONTHLY;
  const invest = trend.reduce((s, d) => s + d.invest, 0);
  const ret = trend.reduce((s, d) => s + d.ret, 0);
  const roi = ret / invest;

  return (
    <Section id={SECTION_IDS.funnel} title="SDLC / ROI 结果指标">
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
          meta={`近 ${trend.length} 个月 · ${FUNNEL_SCOPES[scope].label}`}
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
            { key: "invest", name: "Invest · token 金额（元 / 月）" },
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

      {/* ── Part 3 · 排行榜（排名维度为结果指标）──────────────
          PRD v3 四个维度：AI 采纳代码量 / Token 消耗（团队看人均、个人看
          总量）/ 对话平均贡献行数 / ROI。每张卡自带「团队 · 个人」与
          「7 天 · 30 天」两个切换，互不影响。 */}
      <Card>
        <CardHead
          title="Part 3 · 排行榜"
          hint="排名维度全部是结果指标，不用过程指标排名 —— 过程指标（对话轮次、调用次数）高不等于产出高。"
          meta="按结果指标排序 · Top 6"
        />
        <InsetNote>
          四个维度：<strong style={{ color: "var(--color-fg)" }}>AI 采纳代码量</strong>（生成并采纳的代码数量）·
          <strong style={{ color: "var(--color-fg)" }}> Token 消耗</strong>（团队看人均、个人看总量）·
          <strong style={{ color: "var(--color-fg)" }}> 对话平均贡献行数</strong>（平均每轮对话带来的有效产出）·
          <strong style={{ color: "var(--color-fg)" }}> ROI</strong>（平均每块钱贡献代码行数）。
        </InsetNote>
      </Card>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(460px, 1fr))",
        gap: 16, minWidth: 0,
      }}>
        {RESULT_DIMS.map((d) => (
          <div key={d.key} style={{ display: "flex", minWidth: 0 }}>
            <RankCard dim={d} />
          </div>
        ))}
      </div>

      <Card>
        <CardHead title="交叉分析" hint="把四个榜单叠起来读：消耗高但 ROI 低的对象，是成本优化的第一顺位。" />
        <div style={{ display: "flex", flexDirection: "column", gap: 12, minWidth: 0 }}>
          <CrossRow
            icon="ri-scales-3-line"
            title="产出与效率背离"
            body="人均 token 消耗榜首若不在 ROI 榜前三，说明「烧得多」没换来「产出高」，该团队是成本优化的第一顺位。"
          />
          <CrossRow
            icon="ri-seedling-line"
            title="可复制样本"
            body="对话平均贡献行数与 ROI 双高的团队，其模型选型与上下文策略值得沉淀成实践并向中低分层推广。"
          />
          <CrossRow
            icon="ri-user-follow-line"
            title="介入优先级"
            body="AI 采纳代码量低且 ROI 低的对象，问题在用法不在额度 —— 优先做用法培训，而不是加额度。"
          />
        </div>
      </Card>

    </Section>
  );
}

/* 交叉分析的一条结论：图标 + 标题 + 一段说明。
   图标走 muted 数据墨色，不新增着色语义。 */
function CrossRow({ icon, title, body }) {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "flex-start", minWidth: 0 }}>
      <i className={icon} aria-hidden="true" style={{
        fontSize: 16, lineHeight: 1.5, flexShrink: 0, color: "var(--color-fg-subtle)",
      }} />
      <div style={{ display: "flex", flexDirection: "column", gap: 2, minWidth: 0 }}>
        <span style={{ fontSize: "var(--th-text-sm)", fontWeight: 600, color: "var(--color-fg)", lineHeight: 1.5 }}>
          {title}
        </span>
        <span style={{ fontSize: "var(--th-text-xs)", color: "var(--color-fg-muted)", lineHeight: 1.7 }}>
          {body}
        </span>
      </div>
    </div>
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
