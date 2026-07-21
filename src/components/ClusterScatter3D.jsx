import { useEffect, useRef, useState, useMemo } from "react";

const SEGMENT_COLORS = {
  Champions: "#2563eb",
  "Potential Loyalists": "#06b6d4",
  "At Risk / Hibernating": "#f59e0b",
};

function colorFor(segment) {
  return SEGMENT_COLORS[segment] || "#64748b";
}

/**
 * Lightweight interactive 3D scatter for RFM clusters (R, F, M).
 * Canvas projection with drag-rotate; no Three.js dependency.
 */
export default function ClusterScatter3D({ points = [], height = 420 }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const stateRef = useRef({
    rotY: 0.55,
    rotX: 0.35,
    dragging: false,
    lastX: 0,
    lastY: 0,
    auto: true,
  });
  const [hover, setHover] = useState(null);
  const [reduced, setReduced] = useState(false);

  const normalized = useMemo(() => {
    if (!points.length) return [];
    let maxR = 1;
    let maxF = 1;
    let maxM = 1;
    for (const p of points) {
      maxR = Math.max(maxR, p.r || 0);
      maxF = Math.max(maxF, p.f || 0);
      maxM = Math.max(maxM, p.m || 0);
    }
    return points.map((p) => ({
      x: ((p.r || 0) / maxR) * 2 - 1, // recency
      y: ((p.m || 0) / maxM) * 2 - 1, // monetary (up)
      z: ((p.f || 0) / maxF) * 2 - 1, // frequency
      r: p.r,
      f: p.f,
      m: p.m,
      segment: p.segment,
      cluster_id: p.cluster_id,
      color: colorFor(p.segment),
    }));
  }, [points]);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    stateRef.current.auto = !mq.matches;
    const onChange = () => {
      setReduced(mq.matches);
      stateRef.current.auto = !mq.matches;
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap || !normalized.length) return;

    const ctx = canvas.getContext("2d");
    let raf = 0;
    let running = true;
    const projected = new Array(normalized.length);

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = wrap.clientWidth;
      const h = height;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const project = (x, y, z, rotY, rotX, cx, cy, scale) => {
      // rotate Y then X
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      let x1 = x * cosY - z * sinY;
      let z1 = x * sinY + z * cosY;
      let y1 = y * cosX - z1 * sinX;
      z1 = y * sinX + z1 * cosX;
      const perspective = 2.8 / (2.8 + z1);
      return {
        sx: cx + x1 * scale * perspective,
        sy: cy - y1 * scale * perspective,
        depth: z1,
        scale: perspective,
      };
    };

    const drawAxes = (rotY, rotX, cx, cy, scale) => {
      const axes = [
        { a: [-1, -1, -1], b: [1.05, -1, -1], label: "R (recency)", color: "#94a3b8" },
        { a: [-1, -1, -1], b: [-1, 1.05, -1], label: "M (monetary)", color: "#94a3b8" },
        { a: [-1, -1, -1], b: [-1, -1, 1.05], label: "F (frequency)", color: "#94a3b8" },
      ];
      for (const ax of axes) {
        const p0 = project(ax.a[0], ax.a[1], ax.a[2], rotY, rotX, cx, cy, scale);
        const p1 = project(ax.b[0], ax.b[1], ax.b[2], rotY, rotX, cx, cy, scale);
        ctx.beginPath();
        ctx.strokeStyle = ax.color;
        ctx.lineWidth = 1.25;
        ctx.moveTo(p0.sx, p0.sy);
        ctx.lineTo(p1.sx, p1.sy);
        ctx.stroke();
        ctx.fillStyle = "#64748b";
        ctx.font = "600 11px JetBrains Mono, ui-monospace, monospace";
        ctx.fillText(ax.label, p1.sx + 4, p1.sy);
      }
    };

    const frame = () => {
      if (!running) return;
      const w = wrap.clientWidth;
      const h = height;
      const s = stateRef.current;
      if (s.auto && !s.dragging && !reduced) {
        s.rotY += 0.004;
      }

      ctx.clearRect(0, 0, w, h);
      // subtle background grid wash
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, "#f8fafc");
      grad.addColorStop(1, "#eef2ff");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      const cx = w / 2;
      const cy = h / 2 + 8;
      const scale = Math.min(w, h) * 0.32;

      drawAxes(s.rotY, s.rotX, cx, cy, scale);

      for (let i = 0; i < normalized.length; i++) {
        const p = normalized[i];
        const pr = project(p.x, p.y, p.z, s.rotY, s.rotX, cx, cy, scale);
        projected[i] = { ...pr, i, p };
      }
      projected.sort((a, b) => a.depth - b.depth);

      for (const pr of projected) {
        const r = 2.2 + pr.scale * 2.4;
        ctx.beginPath();
        ctx.fillStyle = pr.p.color;
        ctx.globalAlpha = 0.72;
        ctx.arc(pr.sx, pr.sy, r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(frame);
    };

    resize();
    frame();

    const onResize = () => resize();
    window.addEventListener("resize", onResize);

    const onDown = (e) => {
      const s = stateRef.current;
      s.dragging = true;
      s.auto = false;
      s.lastX = e.clientX ?? e.touches?.[0]?.clientX ?? 0;
      s.lastY = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
    };
    const onMove = (e) => {
      const s = stateRef.current;
      const x = e.clientX ?? e.touches?.[0]?.clientX;
      const y = e.clientY ?? e.touches?.[0]?.clientY;
      if (x == null) return;
      if (s.dragging) {
        const dx = x - s.lastX;
        const dy = y - s.lastY;
        s.rotY += dx * 0.008;
        s.rotX = Math.max(-1.2, Math.min(1.2, s.rotX + dy * 0.008));
        s.lastX = x;
        s.lastY = y;
      } else {
        // hover nearest point in screen space
        const rect = canvas.getBoundingClientRect();
        const mx = x - rect.left;
        const my = y - rect.top;
        let best = null;
        let bestD = 12;
        for (const pr of projected) {
          if (!pr) continue;
          const d = Math.hypot(pr.sx - mx, pr.sy - my);
          if (d < bestD) {
            bestD = d;
            best = pr.p;
          }
        }
        setHover(best);
      }
    };
    const onUp = () => {
      stateRef.current.dragging = false;
    };
    const onLeave = () => {
      stateRef.current.dragging = false;
      setHover(null);
    };

    canvas.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointerleave", onLeave);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      canvas.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointerleave", onLeave);
    };
  }, [normalized, height, reduced]);

  const segments = useMemo(() => {
    const set = new Map();
    for (const p of points) {
      if (!set.has(p.segment)) set.set(p.segment, colorFor(p.segment));
    }
    return [...set.entries()];
  }, [points]);

  return (
    <div ref={wrapRef} className="relative overflow-hidden rounded-[12px] border border-line">
      <canvas
        ref={canvasRef}
        className="block w-full cursor-grab touch-none active:cursor-grabbing"
        aria-label="3D RFM cluster scatter plot"
      />
      <div className="pointer-events-none absolute left-3 top-3 rounded-lg border border-line bg-white/90 px-2.5 py-1.5 text-[11px] text-muted shadow-card backdrop-blur-sm">
        Drag to rotate · Axes: R / F / M
      </div>
      <div className="absolute bottom-3 left-3 flex flex-wrap gap-2">
        {segments.map(([name, color]) => (
          <span
            key={name}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white/95 px-2 py-1 text-[10px] font-medium text-navy shadow-card"
          >
            <span className="h-2 w-2 rounded-full" style={{ background: color }} />
            {name}
          </span>
        ))}
      </div>
      {hover && (
        <div className="pointer-events-none absolute right-3 top-3 max-w-[200px] rounded-lg border border-line bg-white px-3 py-2 text-xs shadow-card">
          <div className="font-semibold text-navy">{hover.segment}</div>
          <div className="mt-1 font-mono text-[11px] text-muted">
            R {hover.r}d · F {hover.f} · M R${Number(hover.m).toFixed(0)}
          </div>
        </div>
      )}
    </div>
  );
}
