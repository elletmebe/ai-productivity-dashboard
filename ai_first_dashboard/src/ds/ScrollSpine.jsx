/* ScrollSpine.jsx — 右侧竖向鱼眼滑动轨道。
   长页面缺少目录，这条轨道给出「现在在第几块 / 还能去哪块」的定位：
     · 每个模块对应一条横线，竖向等距排列，贴视口右缘居中；
     · 线宽按「离活跃项的距离」做鱼眼衰减 —— 活跃项最长，向上下两侧
       逐级变短，形成以活跃项为中心的梭形；
     · 正常态活跃项 = 当前滚到视口里的模块；鼠标在轨道上移动时，活跃中心
       实时跟随指针的纵向位置，梭形随鼠标「滑动」；
     · 点某条线 → 平滑滚到对应模块。

   仅滑动时显现：页面滚动时淡入，停下约 1s 后淡出；鼠标悬在轨道上时保持
   显现（正在用它导航）。着色只用一处 accent（活跃线），其余走中性墨色，
   不新增着色语义。取值全部来自 tokens.css。 */
import React from "react";

/* 鱼眼权重：距活跃中心 d 格时的线宽系数（0–1）。
   用高斯型衰减，sigma≈1.15 让相邻一档明显、两档外收细，梭形干净。 */
function fisheye(d) {
  const sigma = 1.15;
  return Math.exp(-(d * d) / (2 * sigma * sigma));
}

const MIN_W = 10;  // 最短线（最远端）
const MAX_W = 30;  // 最长线（活跃项）
const ROW_H = 20;  // 每条线所占的竖向行高（含点击热区）

const reduceMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function ScrollSpine({ sections = [] }) {
  const railRef = React.useRef(null);
  const idleTimer = React.useRef(null);

  // 当前滚动位置对应的活跃模块下标（整数）
  const [scrollActive, setScrollActive] = React.useState(0);
  // 鼠标在轨道上的活跃中心（小数，null = 没在悬停 → 用 scrollActive）
  const [hoverCenter, setHoverCenter] = React.useState(null);
  const [visible, setVisible] = React.useState(false);

  const center = hoverCenter != null ? hoverCenter : scrollActive;

  /* 显现 + 计时淡出。滚动与轨道交互都调它。 */
  const wake = React.useCallback(() => {
    setVisible(true);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setVisible(false), 1100);
  }, []);

  /* 滚动时：算出「视口中线落在哪个模块」作为活跃项，并唤醒轨道。 */
  React.useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const mid = window.innerHeight / 2;
        let best = 0, bestDist = Infinity;
        sections.forEach((s, i) => {
          const el = document.getElementById(s.id);
          if (!el) return;
          const r = el.getBoundingClientRect();
          // 模块中点到视口中线的距离，取最近的那个模块
          const c = r.top + r.height / 2;
          const dist = Math.abs(c - mid);
          if (dist < bestDist) { bestDist = dist; best = i; }
        });
        setScrollActive(best);
        wake();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [sections, wake]);

  React.useEffect(() => () => { if (idleTimer.current) clearTimeout(idleTimer.current); }, []);

  const scrollTo = React.useCallback((i) => {
    const el = document.getElementById(sections[i]?.id);
    el?.scrollIntoView({ behavior: reduceMotion() ? "auto" : "smooth", block: "start" });
  }, [sections]);

  /* 鼠标在轨道上移动：把指针纵向位置换算成小数活跃中心，梭形实时跟随。 */
  const onRailMove = (e) => {
    const rail = railRef.current;
    if (!rail) return;
    const r = rail.getBoundingClientRect();
    const y = e.clientY - r.top;
    const frac = (y / r.height) * sections.length - 0.5;
    setHoverCenter(Math.max(0, Math.min(sections.length - 1, frac)));
    setVisible(true);
    if (idleTimer.current) clearTimeout(idleTimer.current);
  };

  const onRailLeave = () => {
    setHoverCenter(null);
    wake();
  };

  if (sections.length === 0) return null;

  return (
    <div
      ref={railRef}
      onMouseMove={onRailMove}
      onMouseLeave={onRailLeave}
      aria-hidden="true"
      style={{
        position: "fixed",
        top: "50%",
        right: 16,
        transform: "translateY(-50%)",
        zIndex: 40,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        justifyContent: "center",
        // 热区比可见线宽一点，方便够到；轨道本身透明
        paddingLeft: 24,
        paddingRight: 4,
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transition: "opacity var(--th-dur-2) var(--th-ease)",
      }}
    >
      {sections.map((s, i) => {
        const d = Math.abs(i - center);
        const w = MIN_W + (MAX_W - MIN_W) * fisheye(d);
        const activeInt = Math.round(center) === i;
        return (
          <button
            key={s.key || s.id}
            type="button"
            title={s.label}
            tabIndex={-1}
            onClick={() => scrollTo(i)}
            style={{
              height: ROW_H,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              background: "none",
              border: "none",
              padding: 0,
              cursor: "pointer",
              width: MAX_W + 4,
            }}
          >
            <span
              style={{
                display: "block",
                width: w,
                height: activeInt ? 3 : 2,
                borderRadius: 999,
                background: activeInt ? "var(--color-accent)" : "var(--color-fg-subtle)",
                opacity: activeInt ? 1 : 0.55 + 0.45 * fisheye(d),
                transition: reduceMotion()
                  ? "none"
                  : "width var(--th-dur-1) var(--th-ease), height var(--th-dur-1) var(--th-ease), background var(--th-dur-1) var(--th-ease), opacity var(--th-dur-1) var(--th-ease)",
              }}
            />
          </button>
        );
      })}
    </div>
  );
}
