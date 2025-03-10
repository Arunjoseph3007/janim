export type Vec2 = [number, number];

export type CubicCurve = [Vec2, Vec2, Vec2, Vec2];

export type Contour = CubicCurve[];

export type GlpyhData = Contour[];

export type TLerpFunc<T> = (t: number, a: T, b: T) => T;

export type EasingFunc = (t: number) => number;

export enum ColoringMode {
  StrokeOnly = "StrokeOnly",
  FillOnly = "FillOnly",
  StrokeAndFill = "StrokeAndFill",
}

export const differentiatePolynomial = (poly: number[]) => {
  const derivative: number[] = [];
  for (let i = 1; i < poly.length; i++) {
    derivative.push(poly[i] * i);
  }

  return derivative;
};

const fAt = (poly: number[], x: number) =>
  poly.map((c, i) => c * x ** i).reduce((a, c) => a + c, 0);

export const solvePolynomial = (
  poly: number[],
  startPoint = 1,
  precision = 0.01
) => {
  let y = poly.map((a) => a).reverse();
  let dy = differentiatePolynomial(y);

  let root = startPoint;
  let fAtRoot = fAt(y, root);
  while (fAtRoot > precision) {
    root = root - fAtRoot / fAt(dy, root);
    fAtRoot = fAt(y, root);
  }

  return root;
};
