"use client";

import { useEffect, useRef } from "react";

/**
 * The produce that lands at the foot of the brand screens.
 *
 * Matter.js does the arranging: the fruit drops in, knocks against itself and
 * settles wherever it settles, so the pile is never quite the same twice and
 * never looks like a laid-out illustration. Once everything is asleep the loop
 * stops — this is scenery, not a running animation.
 *
 * It is decorative and says so: aria-hidden, pointer-events: none, and no
 * mouse constraint. It must never intercept a tap meant for the form on top.
 *
 * Fills are the ones already in the product (ProductMark, the Sweep start
 * canvas, --ripe-strong). No new greens, no new reds, two tones per object,
 * flat, no outline, no gradient.
 */

const FILL = {
  red: "#C8452F",
  coral: "#E4574C",
  orange: "#E8912B",
  peach: "#F2C078",
  cream: "#F0D9A8",
  sand: "#D9BE86",
  pink: "#F3C0C6",
  rose: "#D98C8C",
  olive: "#C3CC4E",
  lime: "#A8C42A",
  leaf: "#4E8A46",
  deep: "#0F3A22",
} as const;

type Kind = "slice" | "pear" | "blob" | "berry" | "oval";

type Piece = {
  kind: Kind;
  /** Fraction of the container's short edge. */
  scale: number;
  fill: string;
  /** Seeds, pips and cut faces. */
  detail: string;
  /** Where it drops from, as a fraction of the width. */
  at: number;
};

/** Roughly the arrangement in the reference: slices, a pear, blobs, berries. */
const SCENES: Record<"name" | "ready" | "how", Piece[]> = {
  name: [
    { kind: "slice", scale: 0.62, fill: FILL.red, detail: FILL.deep, at: 0.1 },
    { kind: "pear", scale: 0.78, fill: FILL.olive, detail: FILL.deep, at: 0.3 },
    { kind: "blob", scale: 0.4, fill: FILL.pink, detail: FILL.rose, at: 0.46 },
    { kind: "berry", scale: 0.44, fill: FILL.coral, detail: FILL.pink, at: 0.58 },
    { kind: "slice", scale: 0.52, fill: FILL.peach, detail: FILL.sand, at: 0.72 },
    { kind: "oval", scale: 0.5, fill: FILL.leaf, detail: FILL.lime, at: 0.86 },
    { kind: "blob", scale: 0.34, fill: FILL.rose, detail: FILL.pink, at: 0.95 },
  ],
  ready: [
    { kind: "oval", scale: 0.52, fill: FILL.lime, detail: FILL.leaf, at: 0.08 },
    { kind: "slice", scale: 0.58, fill: FILL.orange, detail: FILL.deep, at: 0.24 },
    { kind: "blob", scale: 0.38, fill: FILL.pink, detail: FILL.rose, at: 0.4 },
    { kind: "pear", scale: 0.72, fill: FILL.cream, detail: FILL.sand, at: 0.56 },
    { kind: "berry", scale: 0.42, fill: FILL.red, detail: FILL.pink, at: 0.72 },
    { kind: "slice", scale: 0.5, fill: FILL.olive, detail: FILL.deep, at: 0.88 },
  ],
  how: [
    { kind: "slice", scale: 0.56, fill: FILL.red, detail: FILL.deep, at: 0.12 },
    { kind: "oval", scale: 0.46, fill: FILL.leaf, detail: FILL.lime, at: 0.3 },
    { kind: "pear", scale: 0.7, fill: FILL.olive, detail: FILL.deep, at: 0.5 },
    { kind: "blob", scale: 0.36, fill: FILL.pink, detail: FILL.rose, at: 0.68 },
    { kind: "slice", scale: 0.52, fill: FILL.peach, detail: FILL.sand, at: 0.86 },
  ],
};

/** Half-disc, flat edge along the top. Convex, so no decomposition needed. */
function sliceVerts(r: number, steps = 14) {
  return Array.from({ length: steps + 1 }, (_, i) => {
    const a = (Math.PI * i) / steps;
    return { x: r * Math.cos(a), y: r * Math.sin(a) };
  });
}

function drawSeeds(
  ctx: CanvasRenderingContext2D,
  colour: string,
  points: [number, number][],
  size: number,
) {
  ctx.fillStyle = colour;
  for (const [x, y] of points) {
    ctx.beginPath();
    ctx.ellipse(x, y, size * 0.5, size * 0.8, 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPiece(ctx: CanvasRenderingContext2D, piece: Piece, r: number) {
  ctx.fillStyle = piece.fill;

  switch (piece.kind) {
    case "slice": {
      // The cut face of a melon: rind along the straight edge, seeds inside.
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = piece.detail;
      ctx.beginPath();
      ctx.arc(0, 0, r, Math.PI * 0.02, Math.PI * 0.98);
      ctx.arc(0, 0, r * 0.86, Math.PI * 0.98, Math.PI * 0.02, true);
      ctx.closePath();
      ctx.globalAlpha = 0.55;
      ctx.fill();
      ctx.globalAlpha = 1;
      drawSeeds(
        ctx,
        piece.detail,
        [
          [-r * 0.42, r * 0.3],
          [-r * 0.1, r * 0.46],
          [r * 0.24, r * 0.36],
          [r * 0.5, r * 0.2],
        ],
        r * 0.13,
      );
      break;
    }

    case "pear": {
      ctx.beginPath();
      ctx.moveTo(0, -r);
      ctx.bezierCurveTo(r * 0.62, -r * 0.86, r * 0.72, -r * 0.1, r * 0.66, r * 0.28);
      ctx.bezierCurveTo(r * 0.6, r * 0.86, -r * 0.6, r * 0.86, -r * 0.66, r * 0.28);
      ctx.bezierCurveTo(-r * 0.72, -r * 0.1, -r * 0.62, -r * 0.86, 0, -r);
      ctx.fill();
      ctx.fillStyle = piece.detail;
      ctx.fillRect(-r * 0.05, -r * 1.16, r * 0.1, r * 0.3);
      drawSeeds(
        ctx,
        piece.detail,
        [
          [-r * 0.16, r * 0.18],
          [r * 0.16, r * 0.18],
          [0, r * 0.42],
        ],
        r * 0.11,
      );
      break;
    }

    case "blob": {
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.94, 0, 0, Math.PI * 2);
      ctx.fill();
      drawSeeds(
        ctx,
        piece.detail,
        [
          [-r * 0.3, -r * 0.16],
          [r * 0.22, r * 0.1],
          [-r * 0.06, r * 0.4],
        ],
        r * 0.14,
      );
      break;
    }

    case "berry": {
      ctx.beginPath();
      ctx.moveTo(0, r);
      ctx.bezierCurveTo(-r * 0.98, r * 0.1, -r * 0.7, -r * 0.9, 0, -r * 0.76);
      ctx.bezierCurveTo(r * 0.7, -r * 0.9, r * 0.98, r * 0.1, 0, r);
      ctx.fill();
      ctx.fillStyle = FILL.leaf;
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.78, r * 0.42, r * 0.2, 0, 0, Math.PI * 2);
      ctx.fill();
      drawSeeds(
        ctx,
        piece.detail,
        [
          [-r * 0.3, -r * 0.1],
          [r * 0.28, -r * 0.16],
          [0, r * 0.24],
          [-r * 0.14, r * 0.54],
        ],
        r * 0.1,
      );
      break;
    }

    case "oval": {
      ctx.beginPath();
      ctx.ellipse(0, 0, r, r * 0.66, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = piece.detail;
      ctx.beginPath();
      ctx.ellipse(0, 0, r * 0.6, r * 0.38, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
  }
}

export function ProduceScene({
  variant,
  className = "",
}: {
  variant: "name" | "ready" | "how";
  className?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const host = hostRef.current;
    const canvas = canvasRef.current;
    if (!host || !canvas) return;

    let stopped = false;
    let frame = 0;
    let teardown: (() => void) | null = null;

    // Kept out of the initial bundle: nothing before the first paint needs it.
    import("matter-js")
      .then(({ Bodies, Body, Composite, Engine, Vertices }) => {
        if (stopped) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        const reduceMotion = window.matchMedia(
          "(prefers-reduced-motion: reduce)",
        ).matches;

        const all = SCENES[variant];
        let width = 0;
        let height = 0;
        let engine: ReturnType<typeof Engine.create> | null = null;
        let drawn: { body: Matter.Body; piece: Piece; r: number }[] = [];

        function build() {
          width = host!.clientWidth;
          height = host!.clientHeight;
          if (width < 2 || height < 2) return;

          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          canvas!.width = Math.round(width * dpr);
          canvas!.height = Math.round(height * dpr);
          ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);

          engine = Engine.create({ enableSleeping: true });
          engine.gravity.y = 1.1;

          // Big enough to crop at the edges, small enough that a form can sit
          // over it and still be the thing you read first.
          const short = Math.min(width, height) * 0.72;
          const wall = 200;
          // Floor and sides only. There is no ceiling, so the fruit can drop in.
          const bounds = [
            Bodies.rectangle(width / 2, height + wall / 2, width * 3, wall, {
              isStatic: true,
            }),
            Bodies.rectangle(-wall / 2, height / 2, wall, height * 4, {
              isStatic: true,
            }),
            Bodies.rectangle(width + wall / 2, height / 2, wall, height * 4, {
              isStatic: true,
            }),
          ];
          Composite.add(engine.world, bounds);

          // A narrow phone gets fewer, so the pile stays a crop rather than a
          // heap climbing into the copy.
          const pieces = width < 420 ? all.slice(0, 4) : all;

          drawn = pieces.map((piece, i) => {
            const r = (short * piece.scale) / 2;
            const x = Math.max(r, Math.min(width - r, piece.at * width));
            // Reduced motion still uses the engine, but everything starts low
            // and settles in a few silent steps rather than falling on screen.
            const y = reduceMotion
              ? height - r - (i % 2) * r * 0.4
              : -r * 2 - i * r * 1.6;

            const options = {
              restitution: 0.16,
              friction: 0.5,
              frictionAir: 0.02,
              sleepThreshold: 30,
            };

            let body: Matter.Body;
            if (piece.kind === "slice") {
              const verts = sliceVerts(r);
              body = Bodies.fromVertices(x, y, [verts], options);
              // fromVertices re-centres on the centroid, so the drawing has to
              // be shifted by the same amount or the art sits off its body.
              const centre = Vertices.centre(verts);
              (body as Matter.Body & { drawOffset?: Matter.Vector }).drawOffset =
                centre;
            } else if (piece.kind === "pear" || piece.kind === "berry") {
              body = Bodies.polygon(x, y, 8, r * 0.82, options);
            } else if (piece.kind === "oval") {
              body = Bodies.polygon(x, y, 10, r * 0.78, options);
            } else {
              body = Bodies.circle(x, y, r * 0.9, options);
            }

            Body.setAngle(body, (i % 3) - 1);
            Composite.add(engine!.world, body);
            return { body, piece, r };
          });

          if (reduceMotion) {
            for (let i = 0; i < 90; i++) Engine.update(engine, 1000 / 60);
          }
        }

        function paint() {
          ctx!.clearRect(0, 0, width, height);
          for (const { body, piece, r } of drawn) {
            const offset = (
              body as Matter.Body & { drawOffset?: Matter.Vector }
            ).drawOffset;
            ctx!.save();
            ctx!.translate(body.position.x, body.position.y);
            ctx!.rotate(body.angle);
            if (offset) ctx!.translate(-offset.x, -offset.y);
            drawPiece(ctx!, piece, r);
            ctx!.restore();
          }
        }

        const startedAt = performance.now();

        function tick() {
          if (stopped || !engine) return;
          Engine.update(engine, 1000 / 60);
          paint();

          // Scenery, not an animation: once it has come to rest, stop burning
          // frames. The time cap catches anything still jittering.
          const settled = drawn.every(({ body }) => body.isSleeping);
          if (settled || performance.now() - startedAt > 12_000) return;
          frame = requestAnimationFrame(tick);
        }

        build();
        if (reduceMotion) paint();
        else frame = requestAnimationFrame(tick);

        const observer = new ResizeObserver(() => {
          if (
            Math.abs(host!.clientWidth - width) < 24 &&
            Math.abs(host!.clientHeight - height) < 24
          ) {
            return;
          }
          cancelAnimationFrame(frame);
          build();
          if (reduceMotion) paint();
          else frame = requestAnimationFrame(tick);
        });
        observer.observe(host!);

        teardown = () => {
          observer.disconnect();
          cancelAnimationFrame(frame);
          if (engine) {
            Composite.clear(engine.world, false);
            Engine.clear(engine);
          }
        };
      })
      .catch(() => {
        // No physics, no picture, no problem: the screen is complete without it.
      });

    return () => {
      stopped = true;
      cancelAnimationFrame(frame);
      teardown?.();
    };
  }, [variant]);

  return (
    <div
      ref={hostRef}
      aria-hidden
      className={`pointer-events-none overflow-hidden ${className}`}
    >
      <canvas ref={canvasRef} className="block h-full w-full" />
    </div>
  );
}
