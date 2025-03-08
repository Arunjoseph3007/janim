export type Vec2 = [number, number];

export type Curve = [Vec2, Vec2, Vec2];

export type TLerpFunc<T> = (t: number, a: T, b: T) => T;

export type EasingFunc = (t: number) => number;

export enum ColoringMode {
  StrokeOnly = "StrokeOnly",
  FillOnly = "FillOnly",
  StrokeAndFill = "StrokeAndFill",
}
