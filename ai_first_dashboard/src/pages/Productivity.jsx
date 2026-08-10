/* Productivity.jsx — 生产力监控大盘（PRD 3.1.2 / 3.2）
   1. 指标卡：DAU（有对话的用户）、DAA (active session)
   2. 团队排行榜  3. 员工排行榜
   4. 分层：前 3 名高潜力、后 10% 低潜力、中间层中潜力，每层可以分页
   排名维度 a–e：AI 代码占比 / 交付量 / 返工率 / 单轮对话平均贡献行数 / 消耗排行

   扫读主键 = 排名维度的数值，因此强度色（heat）只给当前维度那一列，整屏 1 处。
   着色语义 3 类：状态（潜力分层）+ 强度（当前维度列）+ 分类（团队条形图色板）。
   MetricStrip 在本页刻意不带 Sparkline —— 再加数据墨色就是第 4 类，超预算。 */
import React from "react";
import {
  PageHeader, Card, CardHead, MetricStrip, DataTable, Chart, Segmented,
  StatusChip, Pager, Avatar, compact, nf,
} from "../ds/index.js";
import { BoardActions, ScopeTag, InsetNote } from "./shared.jsx";
import { M } from "../data/metrics.js";
import {
  ENTERPRISE, TEAMS, EMPLOYEES, MY_TEAM, MY_TEAM_MEMBERS,
  RANK_DIMS, rankBy, tierSplit, UPDATED_AT,
} from "../data/mock.js";

const TIERS = [
  { key: "high", label: "高潜力", tone: "success", note: "排名前 3" },
  { key: "mid", label: "中潜力", tone: "info", note: "中间层" },
  { key: "low", label: "低潜力", tone: "warning", note: "末位 10%" },
];

const PAGE_SIZE = 5;

export default function Productivity({ ctx }) {
  const team = ctx.scope === "team";
  const k = team ? MY_TEAM.people / ENTERPRISE.headcount : 1;
  const [dim, setDim] = React.useState("aiShare");
  const people = team ? MY_TEAM_MEMBERS : EMPLOYEES;

  const dimMeta = RANK_DIMS.find((d) => d.key === dim);
  const sorted = React.useMemo(() => rankBy(people, dim), [people, dim]);
  const tiers = React.useMemo(() => tierSplit(sorted), [sorted]);
  const rankOf = React.useMemo(
    () => new Map(sorted.map((e, i) => [e.id, i + 1])), [sorted]
  );

  /* 热力标尺必须钉在整份榜单上，不能让每层每页各自归一化 —— 否则末位 19.3%
     会和榜首 67.7% 渲染成同样深的紫，强度色就什么也没说了。
     逆向维度（返工率）取负值参与排序与分档，方向才和「越深越好」一致。 */
  const heatScale = React.useMemo(() => {
    const vals = sorted.map((e) => (dimMeta.inverse ? -e[dim] : e[dim]));
    return { min: Math.min(...vals), max: Math.max(...vals) };
  }, [sorted, dim, dimMeta]);

  const teamsRanked = React.useMemo(() => rankBy(TEAMS, dim), [dim]);

  return (
    <>
      <PageHeader
        title="生产力监控大盘"
        tags={<ScopeTag scope={ctx.scope} />}
        meta={`更新于 ${UPDATED_AT}`}
        description="活跃度看「有多少人在用、发生了多少次使用」，排行榜看「谁在产出、谁在返工、谁在烧钱」。"
        actions={<BoardActions ctx={ctx} />}
      />

      <MetricStrip
        animate
        items={[
          { key: "dau", label: M.dau.label, hint: M.dau.hint, value: Math.round(ENTERPRISE.dau * k), suffix: "人", delta: ENTERPRISE.dauDelta },
          { key: "daa", label: M.daa.label, hint: M.daa.hint, value: Math.round(ENTERPRISE.daa * k), suffix: "次", delta: ENTERPRISE.daaDelta },
          { key: "delivery", label: M.delivery.label, hint: M.delivery.hint, value: Math.round(ENTERPRISE.delivery * k), suffix: "MR", delta: ENTERPRISE.deliveryDelta },
          { key: "lpt", label: M.linesPerTurn.label, hint: M.linesPerTurn.hint, value: ENTERPRISE.linesPerTurn, suffix: "行/轮", delta: 5.6, format: (n) => n.toFixed(1) },
        ]}
      />

      {/* 维度切换：团队榜与员工榜共用同一个维度，避免两处各切一次 */}
      <Card>
        <CardHead
          title="排名维度"
          hint="切换后，团队排行榜与员工排行榜同时按该维度重排。返工率是「越低越好」的逆向指标，榜首为最低值。"
          actions={
            <Segmented
              size="sm"
              options={RANK_DIMS.map((d) => ({ label: d.label, value: d.key }))}
              value={dim}
              onChange={setDim}
            />
          }
        />
        <InsetNote>
          当前维度：<strong style={{ color: "var(--color-fg)" }}>{dimMeta.label}</strong>
          {dimMeta.inverse ? "（越低越好，升序排名）" : "（越高越好，降序排名）"} ·{" "}
          {M[dim === "spendTokens" ? "spendRank" : dim === "linesPerTurn" ? "linesPerTurn" : dim === "rework" ? "reworkRate" : dim === "delivery" ? "delivery" : "aiShare"].hint}
        </InsetNote>
      </Card>

      {/* ── 团队排行榜 ───────────────────────────────────────── */}
      {!team && (
        <Card>
          <CardHead
            title="团队排行榜"
            meta={`${TEAMS.length} 个团队 · 按${dimMeta.label}`}
            hint="团队维度的横向对比。条形长度即该维度取值，色板按名次取自图表色环。"
          />
          <Chart
            type="hbar"
            height={TEAMS.length * 30}
            data={teamsRanked.map((t) => ({ label: t.name, value: t[dim] }))}
            yFormat={(v) => (dim === "spendTokens" ? compact(v) : dim === "delivery" ? nf(v) : v.toFixed(1))}
            unit={dim === "spendTokens" ? "" : dimMeta.unit}
            showLegend={false}
          />
        </Card>
      )}

      {/* ── 员工排行榜（分层 + 每层分页）───────────────────────── */}
      <Card pad={false}>
        <div style={{ padding: "var(--th-card-pad)", display: "flex", flexDirection: "column", gap: "var(--th-stack-gap)" }}>
          <CardHead
            title={team ? "团队内员工排行" : "员工排行榜"}
            meta={`${people.length} 人 · 按${dimMeta.label}`}
            hint="潜力分层用于识别推广重点：前 3 名是可复制的高潜力样本，末位 10% 是需要介入的低潜力层，中间层是主体。每层独立分页。"
          />
          <InsetNote>
            前 3 名为<strong style={{ color: "var(--color-fg)" }}>高潜力</strong>，末位 10%（{tiers.low.length} 人）为
            <strong style={{ color: "var(--color-fg)" }}>低潜力</strong>，中间 {tiers.mid.length} 人为
            <strong style={{ color: "var(--color-fg)" }}>中潜力</strong>层，衡量员工潜力。
          </InsetNote>
        </div>

        {TIERS.map((t) => (
          <TierBlock
            key={t.key + dim}
            tier={t}
            rows={tiers[t.key]}
            dim={dim}
            dimMeta={dimMeta}
            rankOf={rankOf}
            heatScale={heatScale}
            showTeam={!team}
          />
        ))}
      </Card>
    </>
  );
}

function TierBlock({ tier, rows, dim, dimMeta, rankOf, heatScale, showTeam }) {
  const [page, setPage] = React.useState(1);
  const totalPages = Math.ceil(rows.length / PAGE_SIZE);
  React.useEffect(() => setPage(1), [dim]);
  const view = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const fmt = (v) =>
    dim === "spendTokens" ? compact(v)
      : dim === "delivery" ? nf(v)
      : `${v.toFixed(1)}${dimMeta.unit}`;

  const columns = [
    {
      key: "rank", label: "#", width: "44px", align: "right",
      render: (r) => <span className="th-nums" style={{ color: "var(--color-fg-muted)" }}>{rankOf.get(r.id)}</span>,
    },
    {
      key: "name", label: "成员", width: "1.6fr",
      render: (r) => (
        <>
          <Avatar name={r.name} size="sm" tone="gray" />
          <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
            <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
            <span style={{ fontSize: "var(--th-text-2xs)", color: "var(--color-fg-subtle)", whiteSpace: "nowrap" }}>
              {r.role}{showTeam ? ` · ${r.team}` : ""}
            </span>
          </span>
        </>
      ),
    },
    // 非扫读属性降为 muted 文字元信息，不给底色、不做 Tag（降噪第 2 步）
    {
      key: "meta", label: "其他维度", width: "1.5fr",
      render: (r) => (
        <span className="th-nums" style={{ fontSize: "var(--th-text-2xs)", color: "var(--color-fg-muted)", whiteSpace: "nowrap" }}>
          {dim !== "aiShare" && `占比 ${r.aiShare}% · `}
          {dim !== "delivery" && `${r.delivery} MR · `}
          {dim !== "rework" && `返工 ${r.rework}%`}
        </span>
      ),
    },
    // 扫读主键：当前维度上强度色，整屏唯一一处热力。标尺来自整份榜单，不是本页 5 行。
    {
      key: dim, label: dimMeta.label, width: "108px", heat: heatScale,
      heatValue: (r) => (dimMeta.inverse ? -r[dim] : r[dim]),
      render: (r) => fmt(r[dim]),
    },
  ];

  return (
    <div style={{ borderTop: "1px solid var(--color-divider)" }}>
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, padding: "10px var(--th-card-pad)", flexWrap: "wrap",
      }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          <StatusChip tone={tier.tone}>{tier.label}</StatusChip>
          <span style={{ fontSize: "var(--th-text-2xs)", color: "var(--color-fg-subtle)" }}>
            {tier.note} · {rows.length} 人
          </span>
        </span>
        <Pager page={page} totalPages={totalPages} onChange={setPage} />
      </div>
      <DataTable embedded density="compact" columns={columns} rows={view} animate={false} />
    </div>
  );
}
