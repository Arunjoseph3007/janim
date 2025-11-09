import {
  Bounds,
  Contour,
  CubicCurve,
  CubicCurve3D,
  GlpyhData,
  TLerpFunc,
  Vec2,
  Vec3,
} from "./types";

const { max, min, abs, sin, cos } = Math;

export const todo = (): never => {
  throw new Error("TODO: not implmented yet");
};

export const range = (r: number) => new Array(r).fill(0).map((_, i) => i);

export const stepRange = (start: number, end: number, step = 1) => {
  const array: number[] = [];
  for (let i = start; i < end; i += step) array.push(i);
  return array;
};

export const subdivide = (start: number, end: number, divisions: number) =>
  stepRange(start, end, (end - start) / divisions);

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
export const lerpVec3: TLerpFunc<Vec3> = (t, a, b) => [
  lerpNum(t, a[0], b[0]),
  lerpNum(t, a[1], b[1]),
  lerpNum(t, a[2], b[2]),
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

export const vec2Add = (...vecs: Vec2[]): Vec2 =>
  vecs.reduce((acc, cur) => [acc[0] + cur[0], acc[1] + cur[1]], [0, 0]);

export const vec2Neg = (vec: Vec2): Vec2 => [-vec[0], -vec[1]];

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
export const midpoint3D = (a: Vec3, b: Vec3) => lerpVec3(0.5, a, b);

/**
 * Uses quadratic formula to solve equation
 * @param a coeffcient of x^2
 * @param b coeffcient of x^1
 * @param c coeffcient of x^0
 * @returns
 */
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

/**
 * Calculates derivative of polynomials.
 * @note polynomial is in reverse order
 * @formula y = a.x^n => dy/dx = a.n.x^(n-1)
 * @param poly
 * @returns
 */
export const differentiatePolynomial = (poly: number[]) => {
  const derivative: number[] = [];
  for (let i = 1; i < poly.length; i++) {
    derivative.push(poly[i] * i);
  }

  return derivative;
};

/**
 * Evaluates polynomial at x
 * @note polynomial is in reverse order
 * @param poly
 * @param x
 * @returns
 */
export const fAt = (poly: number[], x: number) => {
  let ans = 0;
  for (let i = 0; i < poly.length; i++) {
    ans += poly[i] * x ** i;
  }
  return ans;
};

/**
 * Uses Netwon-Raphson method to solve polynomial equations
 * @formula x0 = x0 - f(x0)/f'(x0)
 * @param y
 * @param startPoint
 * @param precision
 * @returns
 */
export const solvePolynomial = (
  y: number[],
  startPoint = 0.54321,
  precision = 0.01
) => {
  let dy = differentiatePolynomial(y);

  let root = startPoint;
  let fAtRoot = fAt(y, root);

  let iterations = 0;
  const MAX_ITERATIONS = 30;
  while (abs(fAtRoot) > precision || iterations < MAX_ITERATIONS) {
    root = root - fAtRoot / fAt(dy, root);
    fAtRoot = fAt(y, root);

    iterations++;
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

/**
 * Gaussian distribution
 * @param x
 * @param y
 * @returns
 */
export const gauss = (x: number, y: number) => {
  const d2 = x ** 2 + y ** 2;
  return Math.pow(Math.E, -d2 / 0.32);
};

export function checkBoundIntersect(curveA: CubicCurve, curveB: CubicCurve) {
  let topA = Infinity;
  let leftA = Infinity;
  let bottomA = -Infinity;
  let rightA = -Infinity;

  for (const p of curveA) {
    leftA = Math.min(leftA, p[0]);
    rightA = Math.max(rightA, p[0]);
    topA = Math.min(topA, p[1]);
    bottomA = Math.max(bottomA, p[1]);
  }

  let topB = Infinity;
  let leftB = Infinity;
  let bottomB = -Infinity;
  let rightB = -Infinity;

  for (const p of curveB) {
    leftB = Math.min(leftB, p[0]);
    rightB = Math.max(rightB, p[0]);
    topB = Math.min(topB, p[1]);
    bottomB = Math.max(bottomB, p[1]);
  }

  if (leftB > rightA || leftA > rightB || topA > bottomB || topB > bottomA)
    return false;

  return true;
}
export const cubicBezierAt = (p: CubicCurve, t: number): Vec2 => {
  return [
    (1 - t) * (1 - t) * (1 - t) * p[0][0] +
      3 * (1 - t) * (1 - t) * t * p[1][0] +
      3 * (1 - t) * t * t * p[2][0] +
      t * t * t * p[3][0],
    (1 - t) * (1 - t) * (1 - t) * p[0][1] +
      3 * (1 - t) * (1 - t) * t * p[1][1] +
      3 * (1 - t) * t * t * p[2][1] +
      t * t * t * p[3][1],
  ];
};
export const dist = (a: Vec2, b: Vec2) =>
  (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

/**
 * @link https://pages.mtu.edu/~shene/COURSES/cs3621/NOTES/spline/Bezier/bezier-sub.html
 * @param p Cubic Bezier Curve
 * @param t where along the curve to split
 * @returns
 */
export const splitBezier = (
  p: CubicCurve,
  t: number
): [CubicCurve, CubicCurve] => {
  const q1 = lerpVec2(t, p[0], p[1]);
  const q2 = lerpVec2(t, p[1], p[2]);
  const q3 = lerpVec2(t, p[2], p[3]);

  const r1 = lerpVec2(t, q1, q2);
  const r2 = lerpVec2(t, q2, q3);

  const s = lerpVec2(t, r1, r2);
  return [
    [p[0], q1, r1, s],
    [s, r2, q3, p[3]],
  ];
};
export const splitBezier3D = (
  p: CubicCurve3D,
  t: number
): [CubicCurve3D, CubicCurve3D] => {
  const q1 = lerpVec3(t, p[0], p[1]);
  const q2 = lerpVec3(t, p[1], p[2]);
  const q3 = lerpVec3(t, p[2], p[3]);

  const r1 = lerpVec3(t, q1, q2);
  const r2 = lerpVec3(t, q2, q3);

  const s = lerpVec3(t, r1, r2);
  return [
    [p[0], q1, r1, s],
    [s, r2, q3, p[3]],
  ];
};

export const getCurveBounds = (curve: CubicCurve): Bounds => {
  let top = Infinity;
  let left = Infinity;
  let bottom = -Infinity;
  let right = -Infinity;

  curve.forEach(([x, y]) => {
    left = min(left, x);
    right = max(right, x);
    top = min(top, y);
    bottom = max(bottom, y);
  });

  return {
    left,
    right,
    top,
    bottom,
    width: right - left,
    height: top - bottom,
  };
};

export const quadraticToCubicBezier = (
  p0: Vec2,
  p1: Vec2,
  p2: Vec2
): CubicCurve => {
  const QuadToCubic = 0.78;

  const cp1 = lerpVec2(QuadToCubic, p0, p1);
  const cp2 = lerpVec2(QuadToCubic, p1, p2);

  return [p0, cp1, cp2, p2];
};
