/**
 * labelLayout.ts
 *
 * Implements a physics-based collision resolution layout for xeokit annotations.
 * This runs multiple simulation iterations instantly to push overlapping labels
 * apart while drawing a leader line back to their 3D anchor points.
 */

interface LabelData {
  el: HTMLElement;
  line: SVGLineElement;
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  wrapperX: number;
  wrapperY: number;
}

export function updateLabelLayout() {
  const wrappers = Array.from(
    document.querySelectorAll(".xeokit-annotation-label-wrapper"),
  ) as HTMLElement[];

  if (wrappers.length === 0) return;

  const labelsData = wrappers
    .map((wrapper) => {
      const el = wrapper.querySelector(".xeokit-annotation-label") as HTMLElement;
      const line = wrapper.querySelector("line") as SVGLineElement;
      if (!el || !line) return null;

      // Extract previously stored physics position, or default to (0, 30) below the anchor
      const prevX = parseFloat(el.dataset.lx || "0");
      const prevY = parseFloat(el.dataset.ly || "30");

      const rect = el.getBoundingClientRect();
      const wrapperRect = wrapper.getBoundingClientRect();

      // If width is 0, the element is probably not rendered fully yet
      if (rect.width === 0) return null;

      return {
        el,
        line,
        x: prevX,
        y: prevY,
        vx: 0,
        vy: 0,
        width: rect.width,
        height: rect.height,
        // The wrapper's absolute screen coordinates
        wrapperX: wrapperRect.left,
        wrapperY: wrapperRect.top,
      } as LabelData;
    })
    .filter(Boolean) as LabelData[];

  if (labelsData.length === 0) return;

  // Physics constraints
  const SPRING_FORCE = 0.1;
  const DAMPING = 0.6;
  const REPULSION_FORCE = 150;
  const PADDING = 12; // Gap between labels

  // Run 30 physics iterations instantly (no requestAnimationFrame) to stick to the camera without lag
  const ITERATIONS = 30;

  for (let step = 0; step < ITERATIONS; step++) {
    for (let i = 0; i < labelsData.length; i++) {
      const a = labelsData[i];

      // 1. Spring force pulling label towards its ideal resting spot (0, 30) relative to its anchor
      a.vx += (0 - a.x) * SPRING_FORCE;
      a.vy += (30 - a.y) * SPRING_FORCE;

      // 2. Collision detection and repulsion from all other labels
      for (let j = 0; j < labelsData.length; j++) {
        if (i === j) continue;
        const b = labelsData[j];

        // Label center X is its wrapper X plus the physics offset
        // (the label's transform has translate(-50%, 0), so x is its horizontal center)
        const cxA = a.wrapperX + a.x;
        const cyA = a.wrapperY + a.y + a.height / 2;

        const cxB = b.wrapperX + b.x;
        const cyB = b.wrapperY + b.y + b.height / 2;

        const dx = cxA - cxB;
        const dy = cyA - cyB;

        const minDx = (a.width + b.width) / 2 + PADDING;
        const minDy = (a.height + b.height) / 2 + PADDING;

        // Simple AABB (Axis-Aligned Bounding Box) intersection check
        if (Math.abs(dx) < minDx && Math.abs(dy) < minDy) {
          const distSq = dx * dx + dy * dy || 1;
          const dist = Math.sqrt(distSq);

          // Push them apart inversely proportional to their distance
          const force = REPULSION_FORCE / dist;
          a.vx += (dx / dist) * force;
          a.vy += (dy / dist) * force;
        }
      }

      // Apply damping and update position
      a.vx *= DAMPING;
      a.vy *= DAMPING;
      a.x += a.vx;
      a.y += a.vy;
    }
  }

  // Finally, apply the calculated positions to the DOM elements
  for (const a of labelsData) {
    // We use calc(-50% + Xpx) so the label stays horizontally centered on its line
    a.el.style.transform = `translate(calc(-50% + ${a.x}px), ${a.y}px)`;
    
    // Save state for the next frame to prevent jitter
    a.el.dataset.lx = a.x.toString();
    a.el.dataset.ly = a.y.toString();

    // The SVG is positioned absolutely inside the wrapper starting at 0,0.
    // We just point the line's endpoint to the label's top-center (x, y).
    a.line.setAttribute("x2", a.x.toString());
    a.line.setAttribute("y2", a.y.toString());
  }
}
