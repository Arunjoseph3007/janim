const todo = (): never => {
  throw new Error("TODO: not implmented yet");
};

const clamp = (v: number, min = 0, max = 1) => Math.min(max, Math.max(v, min));

export class RGBA {
  r: number;
  g: number;
  b: number;
  a: number;

  constructor(r: number, g: number, b: number, a: number = 1) {
    this.r = r;
    this.g = g;
    this.b = b;
    this.a = a;
  }

  static fromStr(str: string) {
    const startIndex = str.indexOf("(") + 1;
    const segments = str
      .slice(startIndex, -1)
      .split(",")
      .map((s) => s.trim())
      .map(Number);

    // @ts-expect-error
    return new RGBA(...segments);
  }
  toStyle() {
    const { r, g, b, a } = this;
    return `rgba(${r},${g},${b},${a})`;
  }
  toString() {
    return this.toStyle();
  }
}
const WHITE = new RGBA(1, 1, 1);
const TRANSPARENT = new RGBA(1, 1, 0);

type Vec2 = [number, number];
type TLerpFunc<T> = (t: number, a: T, b: T) => T;
enum ColorMorphMode {
  Stroke,
  Fill,
  StrokeAndFill,
}

const lerpNum: TLerpFunc<number> = (t, a, b) => a + (b - a) * t;
const lerpVec2: TLerpFunc<Vec2> = (t, a, b) => [
  lerpNum(t, a[0], b[0]),
  lerpNum(t, a[1], b[1]),
];
const lerpRgba: TLerpFunc<RGBA> = (t, a, b) =>
  new RGBA(
    lerpNum(t, a.r, b.r),
    lerpNum(t, a.g, b.g),
    lerpNum(t, a.b, b.b),
    lerpNum(t, a.a, b.a)
  );

const solveQuadEQ = (a: number, b: number, c: number): [number, number] => {
  const disc = b * b - 4 * a * c;
  const d = Math.sqrt(disc);
  return [(-b + d) / (2 * a), (-b - d) / (2 * a)];
};

type EasingFunc = (t: number) => number;
const linear: EasingFunc = (t) => t;
const quadratic: (cp: Vec2) => EasingFunc = (cp) => {
  return function (x) {
    const a = 1 - 2 * cp[0];
    const b = 2 * cp[0];
    const c = -x;

    const [t1, t2] = solveQuadEQ(a, b, c);

    const t = t1 >= 0 && t1 <= 1 ? t1 : t2;
    const y = t * t * (1 - 2 * cp[1]) + 2 * t + cp[1];

    return y;
  };
};
const cubic: (a: Vec2, b: Vec2) => EasingFunc = (a, b) => {
  todo();
  return function (t) {
    return t;
  };
};
export const Easings = {
  linear,
  quadratic,
  cubic,
};

const __dummyElm = document.createElement("div");
document.body.appendChild(__dummyElm);
const colorToRGBA = (color: string) => {
  __dummyElm.style.color = color;
  const rgbstr = window.getComputedStyle(__dummyElm).color;
  return RGBA.fromStr(rgbstr);
};

type CubicCurve = [Vec2, Vec2, Vec2];

export class JObject {
  _strokeStyle: RGBA = WHITE;
  _fillStyle: RGBA = TRANSPARENT;
  translation: Vec2 = [0, 0];
  scaling: Vec2 = [1, 1];
  rotation = 0;
  opacity = 1;

  set fillStyle(c: string) {
    this._fillStyle = colorToRGBA(c);
  }
  get fillStyle() {
    return this._fillStyle.toStyle();
  }

  fill(c: string) {
    this.fillStyle = c;
    return this;
  }
  stroke(c: string) {
    this.strokeStyle = c;
    return this;
  }

  set strokeStyle(c: string) {
    this._strokeStyle = colorToRGBA(c);
  }
  get strokeStyle() {
    return this._strokeStyle.toStyle();
  }

  translateX(x: number) {
    this.translation[0] += x;
    return this;
  }
  translateY(y: number) {
    this.translation[1] += y;
    return this;
  }
  translate(x: number, y: number) {
    this.translateX(x);
    this.translateY(y);
    return this;
  }
  setTranslateX(x: number) {
    this.translation[0] = x;
    return this;
  }
  setTranslateY(y: number) {
    this.translation[1] = y;
    return this;
  }
  setTranslation(x: number, y: number) {
    this.setTranslateX(x);
    this.setTranslateY(y);
    return this;
  }
  scaleX(x: number) {
    this.scaling[0] *= x;
    return this;
  }
  scaleY(y: number) {
    this.scaling[1] *= y;
    return this;
  }
  scale(x: number, y: number) {
    this.scaleX(x);
    this.scaleY(y);
    return this;
  }
  setScaleX(x: number) {
    this.scaling[0] = x;
    return this;
  }
  setScaleY(y: number) {
    this.scaling[1] = y;
    return this;
  }
  setScale(x: number, y: number) {
    this.setScaleX(x);
    this.setScaleY(y);
    return this;
  }
  rotate(angle: number) {
    this.rotation += angle;
    return this;
  }
  rotateDeg(angle: number) {
    this.rotate((angle * Math.PI) / 180);
    return this;
  }
  setRotation(angle: number) {
    this.rotation = angle;
    return this;
  }
  setRotationDeg(angle: number) {
    this.setRotation((angle * Math.PI) / 180);
    return this;
  }

  wrapedRender(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const originalAlpha = ctx.globalAlpha;

    ctx.strokeStyle = this.strokeStyle;
    ctx.fillStyle = this.fillStyle;
    ctx.globalAlpha = this.opacity;

    ctx.translate(this.translation[0], this.translation[1]);
    ctx.scale(this.scaling[0], this.scaling[1]);
    ctx.rotate(this.rotation);

    this.render(ctx);

    ctx.restore();
    ctx.globalAlpha = originalAlpha;
  }

  render(ctx: CanvasRenderingContext2D) {
    todo();
  }
}
export class Spline extends JObject {
  private curves: CubicCurve[];

  constructor() {
    super();
    this.curves = [];
  }
  addCurve(curve: CubicCurve) {
    this.curves.push(curve);
    return this;
  }
  insert(index: number, curve: CubicCurve) {
    this.curves = [
      ...this.curves.slice(0, index - 1),
      curve,
      ...this.curves.slice(index, -1),
    ];
    return this;
  }
  render(ctx: CanvasRenderingContext2D): void {
    const origin = this.curves[this.curves.length - 1][2];

    ctx.beginPath();
    ctx.moveTo(origin[0], origin[1]);

    this.curves.forEach((curve) => {
      ctx.bezierCurveTo(
        curve[0][0],
        curve[0][1],
        curve[1][0],
        curve[1][1],
        curve[2][0],
        curve[2][1]
      );
    });

    ctx.stroke();
    ctx.fill();
  }
}
export class Text extends JObject {
  text: string;
  mode: ColorMorphMode;
  maxWidth?: number;
  fontFamily: string;
  fontSize: number;
  constructor(text: string) {
    super();
    this.text = text;
    this.mode = ColorMorphMode.StrokeAndFill;
    this.fontFamily = "monospace";
    this.fontSize = 40;

    this._fillStyle = WHITE;
    this._strokeStyle = WHITE;
  }
  getFont() {
    return `${this.fontSize}px ${this.fontFamily}`;
  }
  setFontFamily(family: string) {
    this.fontFamily = family;
    return this;
  }
  setFontSize(size: number) {
    this.fontSize = size;
    return this;
  }
  render(ctx: CanvasRenderingContext2D): void {
    ctx.font = this.getFont();

    if (this.mode == ColorMorphMode.Fill) {
      ctx.fillText(this.text, 0, 0, this.maxWidth);
    } else if (this.mode == ColorMorphMode.Stroke) {
      ctx.strokeText(this.text, 0, 0, this.maxWidth);
    } else if (this.mode == ColorMorphMode.StrokeAndFill) {
      ctx.fillText(this.text, 0, 0, this.maxWidth);
      ctx.strokeText(this.text, 0, 0, this.maxWidth);
    }
  }
}
export class Circle extends JObject {
  r: number;

  constructor(r: number) {
    super();
    this.r = r;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.arc(0, 0, this.r, 0, Math.PI * 2, true);
    ctx.stroke();
    ctx.fill();
  }
}
export class Rectangle extends JObject {
  w: number;
  h: number;
  rounding: number;

  constructor(w: number, h: number) {
    super();
    this.w = w;
    this.h = h;
    this.rounding = 2;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    const left = -this.w / 2;
    const top = -this.h / 2;
    ctx.moveTo(left + this.rounding, top);
    const r = this.rounding;
    // prettier-ignore
    {
      ctx.arcTo(left + this.w,  top,          left + this.w,      top + r,          r);
      ctx.arcTo(left + this.w,  top + this.h, left + this.w - r,  top + this.h,     r);
      ctx.arcTo(left,           top + this.h, left,               top + this.h - r, r);
      ctx.arcTo(left,           top,          left + r,           top,              r);
    }
    ctx.stroke();
    ctx.fill();
  }
}
export class Polygon extends JObject {
  points: Vec2[];
  constructor(...points: Vec2[]) {
    super();
    this.points = points;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    ctx.moveTo(this.points[0][0], this.points[0][1]);
    this.points.forEach((point) => ctx.lineTo(point[0], point[1]));
    ctx.lineTo(this.points[0][0], this.points[0][1]);
    ctx.stroke();
    ctx.fill();
  }
}
export class Group extends JObject {
  objs: JObject[];

  constructor(...objs: JObject[]) {
    super();
    this.objs = objs;
  }

  add(...objs: JObject[]) {
    this.objs.push(...objs);
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.objs.forEach((obj) => obj.render(ctx));
  }
}

export class JAnimation {
  background = false;
  durationMs = 3000;
  runTimeMs = 0;
  done = false;

  constructor() {}
  step(dt: number) {
    todo();
  }

  in(durationMs: number) {
    this.durationMs = durationMs;
    return this;
  }

  repeat(times: number) {
    return new Repeat(this, times);
  }

  reset() {
    this.runTimeMs = 0;
    this.done = false;
  }
}
export class Wait extends JAnimation {
  constructor(durationMs = 1000) {
    super();
    this.durationMs = durationMs;
  }

  step(dt: number): void {
    this.runTimeMs += dt;
    const t = this.runTimeMs / this.durationMs;

    if (t > 1) this.done = true;
  }
}
export class SimplePropertyAnim extends JAnimation {
  easing: EasingFunc = linear;
  constructor() {
    super();
  }

  protected updateProperty(t: number) {
    todo();
  }

  ease(fn: EasingFunc) {
    this.easing = fn;
    return this;
  }

  step(dt: number): void {
    this.runTimeMs += dt;
    const t = this.runTimeMs / this.durationMs;

    this.updateProperty(this.easing(clamp(t)));

    if (this.runTimeMs > this.durationMs) {
      this.done = true;
    }
  }
}
export class Translate extends SimplePropertyAnim {
  obj: JObject;
  from: Vec2;
  to: Vec2;

  constructor(obj: JObject, from: Vec2 | null, to: Vec2) {
    super();
    this.obj = obj;
    this.from = from || obj.translation;
    this.to = to;
  }

  updateProperty(t: number): void {
    this.obj.translation = lerpVec2(t, this.from, this.to);
  }
}
export class FadeIn extends SimplePropertyAnim {
  obj: JObject;
  from: number;
  to: number;

  constructor(obj: JObject, from: number = 0, to: number = 1) {
    super();
    this.obj = obj;
    this.from = from;
    this.to = to;
  }

  updateProperty(t: number): void {
    this.obj.opacity = clamp(lerpNum(t, this.from, this.to));
  }
}
export class Spinner extends SimplePropertyAnim {
  obj: JObject;
  from: number;
  to: number;

  constructor(obj: JObject, from: number = 0, to: number = 360) {
    super();
    this.obj = obj;
    this.from = from;
    this.to = to;
  }

  protected updateProperty(t: number): void {
    this.obj.setRotationDeg(lerpNum(t, this.from, this.to));
  }
}
export class ColorMorph extends SimplePropertyAnim {
  obj: JObject;
  from: RGBA;
  to: RGBA;
  mode: ColorMorphMode;

  constructor(
    obj: JObject,
    from: RGBA | string | null,
    to: RGBA | string,
    mode = ColorMorphMode.StrokeAndFill
  ) {
    super();
    this.obj = obj;
    if (from instanceof RGBA) this.from = from;
    else if (typeof from == "string") this.from = colorToRGBA(from);
    else this.from = obj._fillStyle;

    if (to instanceof RGBA) this.to = to;
    else this.to = colorToRGBA(to);
    this.mode = mode;
  }

  protected updateProperty(t: number): void {
    const color = lerpRgba(t, this.from, this.to);

    switch (this.mode) {
      case ColorMorphMode.Fill:
        this.obj._fillStyle = color;

        break;
      case ColorMorphMode.Stroke:
        this.obj._strokeStyle = color;
        break;
      case ColorMorphMode.StrokeAndFill:
        this.obj._strokeStyle = color;
        this.obj._fillStyle = color;
        break;
    }
  }
}

export class Parallel extends JAnimation {
  anims: JAnimation[] = [];

  constructor(...anims: JAnimation[]) {
    super();
    this.anims = anims;
    this.updateDurationMs();
  }

  private updateDurationMs() {
    this.durationMs = this.anims
      .map((anim) => anim.durationMs)
      .reduce((p, r) => Math.max(p, r), 0);
  }

  add(...anims: JAnimation[]) {
    this.anims.push(...anims);
    this.updateDurationMs();
  }

  step(dt: number): void {
    this.runTimeMs += dt;

    this.anims.forEach((anim) => anim.step(dt));

    if (this.anims.every((anim) => anim.done)) {
      this.done = true;
    }
  }
}
export class Repeat extends JAnimation {
  anim: JAnimation;
  times: number;

  constructor(anim: JAnimation, times: number) {
    super();
    this.anim = anim;
    this.times = times;
    this.durationMs = this.anim.durationMs * times;
  }

  step(dt: number): void {
    this.runTimeMs += dt;

    const t = this.runTimeMs / this.durationMs;

    this.anim.step(dt);

    if (this.anim.done) {
      if (t > 1) {
        this.done = true;
      } else {
        this.anim.reset();
      }
    }
  }
}
export class Morph extends Parallel {
  source: JObject;
  dest: JObject;

  constructor(source: JObject, dest: JObject) {
    super();
    this.source = source;
    this.dest = dest;

    this.add(
      new Translate(source, source.translation, dest.translation),
      new Spinner(source, source.rotation, dest.rotation),
      new ColorMorph(source, source._fillStyle, dest._fillStyle),
      new FadeIn(source, 1, 0),

      new Translate(dest, source.translation, dest.translation),
      new Spinner(dest, source.rotation, dest.rotation),
      new ColorMorph(dest, source._fillStyle, dest._fillStyle),
      new FadeIn(dest, 0, 1)
    );
  }
}
export class Sequence extends JAnimation {
  anims: JAnimation[] = [];

  constructor(...anims: JAnimation[]) {
    super();
    this.anims = anims;
    this.updateDurationMs();
  }

  private updateDurationMs() {
    this.durationMs = this.anims
      .map((anim) => anim.durationMs)
      .reduce((p, r) => p + r, 0);
  }

  add(...anims: JAnimation[]) {
    this.anims.push(...anims);
    this.updateDurationMs();
  }

  step(dt: number): void {
    this.runTimeMs += dt;

    const currAnim = this.anims.find((anim) => !anim.done);
    currAnim?.step(dt);

    if (this.anims.every((anim) => anim.done)) {
      this.done = true;
    }
  }
}

export class Scene {
  objects: JObject[] = [];
  selfCenter = false;
  runTimeMs = 0;
  done = false;
  ctx: CanvasRenderingContext2D;
  dt = 0;

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  add(obj: JObject) {
    this.remove(obj);
    this.objects.push(obj);
  }

  remove(obj: JObject) {
    this.objects = this.objects.filter((it) => it != obj);
  }

  mainLoop() {
    this.construct();
  }

  async play(anim: JAnimation) {
    return new Promise<void>((resolve) => {
      let startTime = 0;
      let dt = 0;
      let prevT = 0;

      const loop: FrameRequestCallback = (t) => {
        dt = t - prevT;
        prevT = t;

        anim.step(dt);
        this.render();

        if (t - startTime < anim.durationMs) {
          window.requestAnimationFrame(loop);
        } else {
          resolve();
        }
      };

      window.requestAnimationFrame((t) => {
        startTime = t;
        prevT = startTime;

        window.requestAnimationFrame(loop);
      });
    });
  }

  wait(durationMs = 1000) {
    return this.play(new Wait(durationMs));
  }

  construct() {
    todo();
  }

  render() {
    if (this.selfCenter) {
      this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
    }

    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    this.objects.forEach((obj) => obj.wrapedRender(this.ctx));
  }
}

type _CP<T extends abstract new (...args: any) => any> =
  ConstructorParameters<T>;

export const jf = {
  Scene: (...a: _CP<typeof Scene>) => new Scene(...a),
  // Utils
  RGBA: (...a: _CP<typeof RGBA>) => new RGBA(...a),
  // JObjects
  Circle: (...a: _CP<typeof Circle>) => new Circle(...a),
  Rectangle: (...a: _CP<typeof Rectangle>) => new Rectangle(...a),
  Polygon: (...a: _CP<typeof Polygon>) => new Polygon(...a),
  Group: (...a: _CP<typeof Group>) => new Group(...a),
  Spline: (...a: _CP<typeof Spline>) => new Spline(...a),
  Text: (...a: _CP<typeof Text>) => new Text(...a),
  // Janims
  Translate: (...a: _CP<typeof Translate>) => new Translate(...a),
  FadeIn: (...a: _CP<typeof FadeIn>) => new FadeIn(...a),
  Spinner: (...a: _CP<typeof Spinner>) => new Spinner(...a),
  ColorMorph: (...a: _CP<typeof ColorMorph>) => new ColorMorph(...a),
  Wait: (...a: _CP<typeof Wait>) => new Wait(...a),
  Sequence: (...a: _CP<typeof Sequence>) => new Sequence(...a),
  Parallel: (...a: _CP<typeof Parallel>) => new Parallel(...a),
  Repeat: (...a: _CP<typeof Repeat>) => new Repeat(...a),
  Morph: (...a: _CP<typeof Morph>) => new Morph(...a),
};
