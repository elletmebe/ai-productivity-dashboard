/* RankCard.jsx — SDLC/ROI Part 3 的排行卡（PRD v3）
   一张卡 = 一个结果指标的排行：
     · 左上「团队 / 个人」切换，右上「7 天 / 30 天」时间窗
     · 一行说明当前排序口径
     · 表格：名次 + 对象（名称 + 次要元信息）+ 比例条 + 主值 + 两列辅助指标

   比例条是「同一个度量的大小对比」，不是分类，所以整卡同色，取一个图表
   槽位（--th-chart-1）；空轨道取 --color-data-track，不是 gray-50。
   辅助列一律降为 muted 文字元信息，不给底色、不做 Tag（降噪第 2 步）。 */
import React from "react";
import { Card, CardHead, Segmented, DataTable, compact, nf } from "../ds/index.js";
import { rankRows } from "../data/mock.js";

const BY = [{ label: "团队", value: "team" }, { label: "个人", value: "person" }];
const WIN = [{ label: "7 天", value: "7" }, { label: "30 天", value: "30" }];

const fmtVal = (v, how) =>
  how === "compact" ? compact(v)
    : how === "fixed1" ? Number(v).toFixed(1)
    : how === "pct" ? `${Number(v).toFixed(1)}%`
    : how === "money" ? `¥${nf(Math.round(v))}`
    : how === "text" ? v
    : nf(v);

export default function RankCard({ dim, defaultBy = "team" }) {
  const [by, setBy] = React.useState(defaultBy);
  const [win, setWin] = React.useState(30);

  const rows = React.useMemo(() => rankRows(dim, by, win), [dim, by, win]);
  const max = Math.max(...rows.map((r) => r.__value), 1);

  // token 消耗维度：团队看人均、个人看总量，标题与列名随之切换
  const title = dim.key === "tokenSpend"
    ? (by === "team" ? dim.teamLabel : dim.personLabel)
    : `${/[A-Za-z0-9]$/.test(dim.label) ? dim.label + " " : dim.label}排行`;
  const valueUnit = dim.key === "tokenSpend" ? " tokens" : dim.unit;

  const columns = [
    {
      key: "rank", label: "#", width: "36px", align: "right",
      render: (r) => (
        <span className="th-nums" style={{ color: "var(--color-fg-muted)" }}>
          {rows.indexOf(r) + 1}
        </span>
      ),
    },
    {
      key: "name", label: by === "team" ? "团队" : "成员", width: "1.1fr",
      render: (r) => (
        <span style={{ display: "flex", flexDirection: "column", gap: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {by === "team" ? r.name : r.name}
          </span>
          <span style={{ fontSize: "var(--th-text-2xs)", color: "var(--color-fg-subtle)", whiteSpace: "nowrap" }}>
            {by === "team" ? `${r.people} 人` : r.team}
          </span>
        </span>
      ),
    },
    {
      key: "bar", label: "", width: "1.5fr",
      render: (r) => (
        <span aria-hidden="true" style={{
          display: "block", width: "100%", height: 8, borderRadius: 999,
          background: "var(--color-data-track)", overflow: "hidden",
        }}>
          <span style={{
            display: "block", height: "100%", borderRadius: 999,
            width: `${(r.__value / max) * 100}%`, background: "var(--th-chart-1)",
          }} />
        </span>
      ),
    },
    {
      key: "value", label: dim.key === "tokenSpend" ? "tokens" : dim.unit.trim() || "值",
      width: "88px", align: "right",
      render: (r) => (
        <span className="th-nums" style={{ fontWeight: 600 }}>
          {fmtVal(r.__value, dim.fmt)}
        </span>
      ),
    },
    ...((by === "team" && dim.teamCols) || dim.cols).map((c) => ({
      key: c.key, label: c.label, width: "84px", align: "right",
      render: (r) => (
        <span className="th-nums" style={{ color: "var(--color-fg-muted)" }}>
          {fmtVal(r[c.key], c.fmt)}
        </span>
      ),
    })),
  ];

  return (
    <Card pad={false} style={{ flex: 1, minWidth: 0 }}>
      <div style={{ padding: "var(--th-card-pad)", display: "flex", flexDirection: "column", gap: 8 }}>
        <CardHead
          title={title}
          hint={dim.hint}
          actions={
            <span style={{ display: "inline-flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <Segmented size="sm" options={BY} value={by} onChange={setBy} />
              <Segmented size="sm" options={WIN} value={String(win)} onChange={(v) => setWin(+v)} />
            </span>
          }
        />
        <span style={{ fontSize: "var(--th-text-2xs)", color: "var(--color-fg-muted)" }}>
          按{dim.key === "tokenSpend" ? title : dim.label}排序 · 近 {win} 天 · 仅计产码场景 · Top {rows.length}
        </span>
      </div>
      <DataTable
        embedded density="compact" rowKey="id"
        columns={columns} rows={rows} animate={false}
      />
    </Card>
  );
}

export { fmtVal, BY as RANK_BY_OPTS, WIN as RANK_WIN_OPTS };
