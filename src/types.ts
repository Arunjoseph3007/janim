export type Vec2 = [number, number];
export type CubicCurve = [Vec2, Vec2, Vec2, Vec2];
export type Contour = CubicCurve[];
export type GlpyhData = Contour[];
export type Bounds = {
  top: number;
  left: number;
  bottom: number;
  right: number;
  width: number;
  height: number;
};

export type Vec3 = [number, number, number];
export type CubicCurve3D = [Vec3, Vec3, Vec3, Vec3];
export type Contour3D = CubicCurve3D[];
export type GlpyhData3D = Contour3D[];
export type Bounds3D = {
  top: number;
  left: number;
  bottom: number;
  right: number;
  front: number;
  back: number;
  width: number;
  height: number;
  depth: number;
};

export type TLerpFunc<T> = (t: number, a: T, b: T) => T;

export type EasingFunc = (t: number) => number;

export enum ColoringMode {
  StrokeOnly = "StrokeOnly",
  FillOnly = "FillOnly",
  StrokeAndFill = "StrokeAndFill",
}
