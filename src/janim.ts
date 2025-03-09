import { Font } from "./font";
import {
  Vec2,
  TLerpFunc,
  CubicCurve,
  ColoringMode,
  EasingFunc,
  Contour,
  GlpyhData,
} from "./types";
import {
  lerpNum,
  solveQuadEQ,
  range,
  midpoint,
  polarToXY,
  clamp,
  lerpVec2,
  lerpGlyph,
} from "./utils";

const GoogleFonstJson = (await import("./googleFonts.json")) as {
  default: Record<string, string>;
};

const DEBUG = 0;

const todo = (): never => {
  throw new Error("TODO: not implmented yet");
};

const loadedFonts: Record<string, Font> = {};
export const loadFont = (name: string, font: Font) => {
  loadedFonts[name] = font;
};
export const loadFontFromUri = async (name: string, uri: string) => {
  loadFont(name, await Font.fromURI(uri));
};
/**
 * @link https://gist.github.com/karimnaaji/b6c9c9e819204113e9cabf290d580551
 * @param family string
 * @returns
 */
export const loadGoogleFont = async (family: string) => {
  const uri = GoogleFonstJson.default[family];
  if (!uri) return;

  loadFontFromUri(family, uri);
};

const { PI, tan, sin, cos } = Math;

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

const lerpRgba: TLerpFunc<RGBA> = (t, a, b) =>
  new RGBA(
    lerpNum(t, a.r, b.r),
    lerpNum(t, a.g, b.g),
    lerpNum(t, a.b, b.b),
    lerpNum(t, a.a, b.a)
  );

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

export class JObject {
  _strokeStyle: RGBA = WHITE;
  _fillStyle: RGBA = TRANSPARENT;
  strokeWidth = 1;
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
  setFillOpacity(o: number) {
    this._fillStyle.a = o;
    return this;
  }
  setStrokeOpacity(o: number) {
    this._strokeStyle.a = o;
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
    this.rotate((angle * PI) / 180);
    return this;
  }
  setRotation(angle: number) {
    this.rotation = angle;
    return this;
  }
  setRotationDeg(angle: number) {
    this.setRotation((angle * PI) / 180);
    return this;
  }

  setStrokeWidth(w: number) {
    this.strokeWidth = w;
    return this;
  }

  wrapedRender(ctx: CanvasRenderingContext2D) {
    ctx.save();
    const originalAlpha = ctx.globalAlpha;

    ctx.strokeStyle = this.strokeStyle;
    ctx.lineWidth = this.strokeWidth;
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
export class VObject extends JObject {
  glyphData: GlpyhData;

  constructor() {
    super();
    this.glyphData = [];
    this._strokeStyle = WHITE;
    this._fillStyle = TRANSPARENT;
  }
  lastContour() {
    return this.glyphData[this.glyphData.length - 1];
  }
  pos(): Vec2 {
    if (this.glyphData.length == 0) return [0, 0];
    const contour = this.lastContour();
    return contour[contour.length - 1][3];
  }
  addCurve(curve: CubicCurve) {
    if (this.glyphData.length == 0) this.glyphData.push([]);
    this.glyphData[this.glyphData.length - 1].push(curve);
    return this;
  }
  addCurves(...curves: CubicCurve[]) {
    curves.forEach((p) => this.addCurve(p));
    return this;
  }
  addContour(contour: Contour) {
    this.glyphData.push(contour);
  }
  addDummyContour(len: number = 1) {
    const pos = this.pos();
    const newCountour: Contour = range(len).map((i) => [
      [...pos],
      [...pos],
      [...pos],
      [...pos],
    ]);
    this.addContour(newCountour);
  }
  addDummyCurve() {
    // Splatting just to make copy
    const pos = this.pos();
    this.addCurve([[...pos], [...pos], [...pos], [...pos]]);
  }
  lineTo(point: Vec2) {
    const mid = midpoint(this.pos(), point);
    this.addCurve([[...this.pos()], mid, mid, point]);
    return this;
  }
  cubicTo(c1: Vec2, c2: Vec2, c: Vec2) {
    this.addCurve([[...this.pos()], c1, c2, c]);
    return this;
  }
  quadTo(control: Vec2, point: Vec2) {
    this.addCurve([[...this.pos()], control, control, point]);
    return this;
  }
  render(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    this.glyphData.forEach((contour) => {
      const startPoint = contour[0][0];
      ctx.moveTo(startPoint[0], startPoint[1]);

      contour.forEach((curve) => {
        ctx.lineTo(curve[0][0], curve[0][1]);
        ctx.bezierCurveTo(
          curve[1][0],
          curve[1][1],
          curve[2][0],
          curve[2][1],
          curve[3][0],
          curve[3][1]
        );
      });

      ctx.lineTo(startPoint[0], startPoint[1]);
    });
    ctx.stroke();
    ctx.fill();

    if (DEBUG) {
      ctx.font = "34px monospace";
      this.glyphData.forEach((contour) => {
        contour.forEach(([c1, c2, c3, c], i) => {
          ctx.beginPath();
          ctx.arc(c1[0], c1[1], 5, 0, 2 * PI);
          ctx.stroke();
          ctx.fill();
          ctx.beginPath();

          ctx.beginPath();
          ctx.arc(c2[0], c2[1], 5, 0, 2 * PI);
          ctx.stroke();
          ctx.fill();
          ctx.beginPath();

          ctx.beginPath();
          ctx.arc(c3[0], c3[1], 5, 0, 2 * PI);
          ctx.stroke();
          ctx.fill();
          ctx.beginPath();

          ctx.beginPath();
          ctx.arc(c[0], c[1], 5, 0, 2 * PI);
          ctx.stroke();
          ctx.fill();
          ctx.beginPath();

          ctx.fillText(i.toString(), c[0] - 10, c[1] - 10);
        });
      });
    }
  }
}
export class Text extends JObject {
  text: string;
  mode: ColoringMode;
  maxWidth?: number;
  fontFamily: string;
  fontSize: number;
  constructor(text: string) {
    super();
    this.text = text;
    this.mode = ColoringMode.StrokeAndFill;
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

    if (this.mode == ColoringMode.FillOnly) {
      ctx.fillText(this.text, 0, 0, this.maxWidth);
    } else if (this.mode == ColoringMode.StrokeOnly) {
      ctx.strokeText(this.text, 0, 0, this.maxWidth);
    } else if (this.mode == ColoringMode.StrokeAndFill) {
      ctx.fillText(this.text, 0, 0, this.maxWidth);
      ctx.strokeText(this.text, 0, 0, this.maxWidth);
    }
  }
}
export class Circle extends VObject {
  private r: number;

  constructor(r: number) {
    super();
    this.r = r;

    const detail = 8;
    /**
     * @link https://stackoverflow.com/a/27863181
     */
    const optimalDist = (4 / 3) * tan(PI / (2 * detail));
    const optimalRad = Math.sqrt(optimalDist ** 2 + 1) * this.r;

    range(detail).forEach((a) => {
      this.addCurve([
        polarToXY(this.r, (PI * 2 * (3 * a + 0)) / (3 * detail)),
        polarToXY(optimalRad, (PI * 2 * (3 * a + 1)) / (3 * detail)),
        polarToXY(optimalRad, (PI * 2 * (3 * a + 2)) / (3 * detail)),
        polarToXY(this.r, (PI * 2 * (3 * a + 3)) / (3 * detail)),
      ]);
    });
  }
}
export class Rectangle extends VObject {
  w: number;
  h: number;
  rounding: number;

  constructor(w: number, h: number) {
    super();
    this.w = w;
    this.h = h;
    this.rounding = 20;

    this.computeSpline();
  }

  private computeSpline() {
    const top = -this.h / 2;
    const left = -this.w / 2;
    const r = this.rounding;

    // TODO instead of arcing
    this.addCurve([
      [left + r, top],
      [left, top],
      [left, top],
      [left, top + r],
    ]);
    this.lineTo([left, top + this.h - this.rounding]);
    this.quadTo([left, top + this.h], [left + r, top + this.h]);
    this.lineTo([left + this.w - r, top + this.h]);
    this.quadTo(
      [left + this.w, top + this.h],
      [left + this.w, top + this.h - r]
    );
    this.lineTo([left + this.w, top + r]);
    this.quadTo([left + this.w, top], [left + this.w - r, top]);
    this.lineTo([left + r, top]);
  }
}
export class Polygon extends VObject {
  points: Vec2[];
  constructor(...points: Vec2[]) {
    super();
    this.points = points;
    this.addCurve([
      this.points[0],
      this.points[0],
      this.points[0],
      this.points[0],
    ]);
    this.points.forEach((p) => this.quadTo(p, p));
  }
}
export class Letter extends VObject {
  char: string;
  font: Font;
  constructor(char: string, font: string) {
    super();
    this.char = char;
    this.font = loadedFonts[font];

    const code = this.char.charCodeAt(0);
    const glyphId = this.font.cmapTable.getGlyphId(code);
    const glyph = this.font.glyphs[glyphId];

    this.glyphData = glyph.getGlyphData(1);
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
      this.onFinish();
    }
  }

  onFinish() {}
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
    this.obj.setRotation(lerpNum(t, this.from, this.to));
  }
}
export class ColorMorph extends SimplePropertyAnim {
  obj: JObject;
  from: RGBA;
  to: RGBA;
  mode: ColoringMode;

  constructor(
    obj: JObject,
    from: RGBA | string | null,
    to: RGBA | string,
    mode = ColoringMode.StrokeAndFill
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
      case ColoringMode.FillOnly:
        this.obj._fillStyle = color;

        break;
      case ColoringMode.StrokeOnly:
        this.obj._strokeStyle = color;
        break;
      case ColoringMode.StrokeAndFill:
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
export class ShapeMorph extends SimplePropertyAnim {
  source: VObject;
  dest: VObject;
  private from: GlpyhData;

  constructor(source: VObject, dest: VObject) {
    super();
    this.source = source;
    this.dest = dest;

    while (this.source.glyphData.length < this.dest.glyphData.length)
      this.source.addDummyContour();
    while (this.dest.glyphData.length < this.source.glyphData.length)
      this.dest.addDummyContour();

    range(this.source.glyphData.length).forEach((i) => {
      const sourceContour = this.source.glyphData[i];
      const destContour = this.dest.glyphData[i];

      while (sourceContour.length < destContour.length)
        sourceContour.push([...sourceContour[sourceContour.length - 1]]);
      while (destContour.length < sourceContour.length)
        destContour.push([...destContour[destContour.length - 1]]);

      console.assert(sourceContour.length == destContour.length, "Fails");
    });

    this.from = this.source.glyphData;
  }

  protected updateProperty(t: number): void {
    this.source.glyphData = lerpGlyph(t, this.from, this.dest.glyphData);
  }
}
export class VMorph extends Parallel {
  source: VObject;
  dest: VObject;

  constructor(source: VObject, dest: VObject) {
    super();
    this.source = source;
    this.dest = dest;

    this.add(
      new ShapeMorph(source, dest),
      new Translate(source, source.translation, dest.translation),
      new Spinner(source, source.rotation, dest.rotation),
      new ColorMorph(source, source._fillStyle, dest._fillStyle)
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
    this.durationMs = this.anims.reduce(
      (acc, anim) => acc + anim.durationMs,
      0
    );
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
    this.render();
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
  VObject: (...a: _CP<typeof VObject>) => new VObject(...a),
  Text: (...a: _CP<typeof Text>) => new Text(...a),
  Letter: (...a: _CP<typeof Letter>) => new Letter(...a),
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
  ShapeMorph: (...a: _CP<typeof ShapeMorph>) => new ShapeMorph(...a),
  VMorph: (...a: _CP<typeof VMorph>) => new VMorph(...a),
};
