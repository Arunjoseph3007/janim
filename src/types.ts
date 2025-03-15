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

export type Bounds = {
  top: number;
  left: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
};
