import { Contour, CubicCurve, GlpyhData, TLerpFunc, Vec2 } from "./types";

const { max, min, abs, sin, cos } = Math;

export const range = (r: number) => new Array(r).fill(0).map((_, i) => i);

export const polarToXY = (r: number, theta: number): Vec2 => [
  r * cos(theta),
  r * sin(theta),
];

export const clamp = (v: number, minV = 0, maxV = 1) => min(maxV, max(v, minV));

export const lerpNum: TLerpFunc<number> = (t, a, b) => a + (b - a) * t;
export const lerpVec2: TLerpFunc<Vec2> = (t, a, b) => [
  lerpNum(t, a[0], b[0]),
  lerpNum(t, a[1], b[1]),
];
export const lerpCurve: TLerpFunc<CubicCurve> = (t, a, b) => [
  lerpVec2(t, a[0], b[0]),
  lerpVec2(t, a[1], b[1]),
  lerpVec2(t, a[2], b[2]),
  lerpVec2(t, a[3], b[3]),
];
export const lerpContour: TLerpFunc<Contour> = (t, a, b) => {
  console.assert(
    a.length == b.length,
    "Can only lerp contours of equal length"
  );

  return range(a.length).map((i) => lerpCurve(t, a[i], b[i]));
};
export const lerpGlyph: TLerpFunc<GlpyhData> = (t, a, b) => {
  console.assert(a.length == b.length, "Can only lerp glyphs of equal length");

  return range(a.length).map((i) => lerpContour(t, a[i], b[i]));
};

export const translateGlyph = (
  glyphData: GlpyhData,
  offsetX: number,
  offsetY: number
): GlpyhData => {
  return glyphData.map((contour) =>
    contour.map(
      (curve) =>
        curve.map(
          (vec) => [vec[0] + offsetX, vec[1] + offsetY] as Vec2
        ) as CubicCurve
    )
  );
};

export const midpoint = (a: Vec2, b: Vec2) => lerpVec2(0.5, a, b);

export const solveQuadEQ = (
  a: number,
  b: number,
  c: number
): [number, number] => {
  const disc = b * b - 4 * a * c;
  console.assert(disc >= 0, "No real roots of equation");
  const d = Math.sqrt(disc);
  return [(-b + d) / (2 * a), (-b - d) / (2 * a)];
};

export const differentiatePolynomial = (poly: number[]) => {
  const derivative: number[] = [];
  for (let i = 1; i < poly.length; i++) {
    derivative.push(poly[i] * i);
  }

  return derivative;
};

const fAt = (poly: number[], x: number) => {
  let ans = 0;
  for (let i = 0; i < poly.length; i++) {
    ans += poly[i] * x ** i;
  }
  return ans;
};

export const solvePolynomial = (
  y: number[],
  startPoint = 0.54321,
  precision = 0.01
) => {
  let dy = differentiatePolynomial(y);

  let root = startPoint;
  let fAtRoot = fAt(y, root);
  while (abs(fAtRoot) > precision) {
    root = root - fAtRoot / fAt(dy, root);
    fAtRoot = fAt(y, root);
  }

  return root;
};

export const isNthBitOn = (
  word: Uint8Array<ArrayBufferLike>,
  index: number
): boolean => {
  const wordNo = Math.floor(index / 8);
  const bitNo = index % 8;
  return ((word[wordNo] >> bitNo) & 1) == 1;
};
