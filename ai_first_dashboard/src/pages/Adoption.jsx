/* Adoption.jsx — AI 应用情况分析（PRD 3.1.3 / 3.2）
   1. 全员 AI 覆盖率：分活跃使用、低频使用、未使用三层，从用户覆盖视角
      展现企业 AI Native 程度（适配高层「现有员工 AI 应用情况 + 阶段」的可见性需要）
   2. AI 应用活跃度：衡量活跃时间分布（大模型请求）

   着色语义 3 类：构成色阶（覆盖率三层 = 一个总量被切开）+ 强度色阶
   （活跃度热力，整屏唯一一处）+ 状态色（较上月 / 距目标的涨跌）。 */
import React from "react";
import {
  Card, CardHead, Heatgrid, HeatLegend, TokenMeter,
  TrendDelta, Progress, nf,
} from "../ds/index.js";
import { Section, SECTION_IDS, InsetNote, KV } from "./shared.jsx";
import { M } from "../data/metrics.js";
import {
  ENTERPRISE, MY_TEAM, WEEKDAYS, ACTIVITY_GRID, ACTIVITY_PEAK, UPDATED_AT,
} from "../data/mock.js";

const GAP = 3;
const LABEL_W = 34;                    // 星期标签列宽 + 与网格的间距
const HOUR_TICKS = [0, 3, 6, 9, 12, 15, 18, 21];

/* 24 列是小时刻度，不是可变列数，所以格子边长按容器宽度算出来铺满卡片，
   而不是写死 —— 写死会让整卡右半边成为一片零信息空白（DESIGN.md
   「预览区与占位区：面积最大的块不得是零信息」）。夹在 12–46px 之间：
   小于 12 分档读不出来，大于 46 会把一周撑得比卡还高。 */
function useCellSize(min = 12, max = 46) {
  const ref = React.useRef(null);
  const [cell, setCell] = React.useState(16);
  React.useLayoutEffect(() => {
    if (!ref.current) return;
    const calc = (w) => {
      const avail = w - LABEL_W - GAP * 23;
      setCell(Math.max(min, Math.min(max, Math.floor(avail / 24))));
    };
    const ro = new ResizeObserver(([e]) => calc(e.contentRect.width));
    ro.observe(ref.current);
    calc(ref.current.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, [min, max]);
  return [ref, cell];
}

export default function Adoption({ ctx }) {
  const team = ctx.scope === "team";
  const k = team ? MY_TEAM.people / ENTERPRISE.headcount : 1;

  const head = Math.round(ENTERPRISE.headcount * k);
  const active = Math.round(ENTERPRISE.weeklyActive * k);
  const low = Math.round(ENTERPRISE.lowFreq * k);
  const unused = Math.round(ENTERPRISE.unused * k);
  const rate = +(((active + low) / head) * 100).toFixed(1);
  const gapToTarget = Math.max(0, Math.ceil((ENTERPRISE.coverageTarget / 100) * head) - (active + low));

  // 团队口径下按人数缩放请求量，热力分档随之自适应
  const grid = React.useMemo(
    () => ACTIVITY_GRID.map((c) => ({ ...c, v: Math.round(c.v * k) })), [k]
  );
  const peak = Math.round(ACTIVITY_PEAK.requests * k);
  const [gridRef, cell] = useCellSize();

  return (
    <Section id={SECTION_IDS.adoption} title="AI 应用情况分析">
      <Card>
        <CardHead
          title={team ? "团队 AI 覆盖率" : M.coverage.label}
          hint={M.coverage.hint}
          meta="本月"
          actions={<TrendDelta value={ENTERPRISE.coverageDeltaPP} suffix="pp" />}
        />

        <div style={{ display: "flex", alignItems: "baseline", gap: 12, flexWrap: "wrap", minWidth: 0 }}>
          <span className="th-nums" style={{
            fontSize: "var(--th-text-xl)", fontWeight: 600, color: "var(--color-fg)",
            lineHeight: 1.15, letterSpacing: "-0.01em",
          }}>{rate}%</span>
          <span className="th-nums" style={{ fontSize: "var(--th-text-sm)", color: "var(--color-fg-muted)" }}>
            {nf(active + low)} / {nf(head)} 人
          </span>
        </div>

        {/* 一个总量（在册员工）被切开 → 构成色阶；未使用是中性余量段 */}
        <TokenMeter
          unit="人"
          height={10}
          segments={[
            { label: "周活跃使用", value: active },
            { label: "低频使用", value: low },
          ]}
          residual={unused}
          residualLabel="未使用"
          showTotal={false}
        />

        <Progress
          size="sm"
          value={rate}
          max={100}
          label={`目标覆盖率 ${ENTERPRISE.coverageTarget}%`}
          caption={gapToTarget > 0 ? `距目标还差 ${nf(gapToTarget)} 人` : "已达标"}
          tone={rate >= ENTERPRISE.coverageTarget ? "success" : "accent"}
        />

        <InsetNote>
          三层口径：<strong style={{ color: "var(--color-fg)" }}>周活跃使用</strong>指近 7 天内有过大模型请求；
          <strong style={{ color: "var(--color-fg)" }}>低频使用</strong>指本月有请求但近 7 天无；
          <strong style={{ color: "var(--color-fg)" }}>未使用</strong>指本月无任何请求。覆盖率 =（周活跃 + 低频）÷ 在册员工数。
        </InsetNote>
      </Card>

      <Card>
        <CardHead
          title={M.activityDist.label}
          hint={M.activityDist.hint}
          meta="近 30 天 · 大模型请求"
          actions={<HeatLegend />}
        />

        <div ref={gridRef} style={{ overflowX: "auto", paddingBottom: 4, minWidth: 0 }}>
          <div style={{ width: "max-content", minWidth: 0 }}>
            {/* 小时刻度 */}
            <div style={{ display: "flex", gap: GAP, marginLeft: LABEL_W, marginBottom: 4 }}>
              {Array.from({ length: 24 }, (_, h) => (
                <span key={h} style={{
                  width: cell, fontSize: "var(--th-text-2xs)", color: "var(--color-fg-muted)",
                  textAlign: "center", lineHeight: 1, fontVariantNumeric: "tabular-nums",
                }}>{HOUR_TICKS.includes(h) ? h : ""}</span>
              ))}
            </div>

            <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: GAP }}>
                {WEEKDAYS.map((d) => (
                  <span key={d} style={{
                    height: cell, lineHeight: `${cell}px`, width: LABEL_W - 8, textAlign: "right",
                    fontSize: "var(--th-text-2xs)", color: "var(--color-fg-muted)", whiteSpace: "nowrap",
                  }}>{d}</span>
                ))}
              </div>
              <Heatgrid
                columns={24}
                cellSize={cell}
                gap={GAP}
                data={grid.map((c) => ({
                  v: c.v,
                  label: `${WEEKDAYS[c.d]} ${String(c.h).padStart(2, "0")}:00–${String(c.h + 1).padStart(2, "0")}:00 · ${nf(c.v)} 次请求`,
                }))}
              />
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <KV label="峰值时段" value={`${ACTIVITY_PEAK.day} ${ACTIVITY_PEAK.hour} · ${nf(peak)} 次请求`} />
          <KV label="工作日 / 周末请求比" value="4.5 : 1" />
          <KV label="集中区间" value="09:00–12:00 与 14:00–18:00 合计占 68.4%" />
        </div>
      </Card>
    </Section>
  );
}
