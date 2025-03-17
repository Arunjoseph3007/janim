const DEBUG = 0;

import Font from "./font";
import {
  Vec2,
  TLerpFunc,
  CubicCurve,
  ColoringMode,
  EasingFunc,
  Contour,
  GlpyhData,
  Bounds,
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
  translateGlyph,
  solvePolynomial,
  subdivide,
} from "./utils";
import GoogleFontsJson from "./googleFonts.json";

export const todo = (): never => {
  throw new Error("TODO: not implmented yet");
};

const loadedFonts: Record<string, Font> = {};
export const loadFont = (name: string, font: Font) => {
  if (name in loadedFonts) return;
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
  const uri = (GoogleFontsJson as Record<string, string>)[family];
  if (!uri) throw new Error("Cant find font " + family);

  loadFontFromUri(family, `http://fonts.gstatic.com/s/${uri}.ttf`);
};

const { PI, tan } = Math;

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
const WHITE = new RGBA(255, 255, 255);
const TRANSPARENT = new RGBA(0, 0, 0, 0);

const lerpRgba: TLerpFunc<RGBA> = (t, a, b) =>
  new RGBA(
    lerpNum(t, a.r, b.r),
    lerpNum(t, a.g, b.g),
    lerpNum(t, a.b, b.b),
    lerpNum(t, a.a, b.a)
  );

const linear: EasingFunc = (t) => t;
const quadratic: (cp: Vec2) => EasingFunc = function (cp) {
  console.assert(
    cp[0] >= 0 && cp[0] <= 1 && cp[1] >= 0 && cp[1] <= 1,
    "Control point must be withing 0-1 range"
  );

  return function (x) {
    const a = 1 - 2 * cp[0];
    const b = 2 * cp[0];
    const c = -x;

    const [t1, t2] = solveQuadEQ(a, b, c);
    const t = t1 >= 0 && t1 <= 1 ? t1 : t2;

    const y = 2 * t * (1 - t) * cp[1] + t * t;
    return y;
  };
};
const cubic: (p1: Vec2, p2: Vec2) => EasingFunc = function (p1, p2) {
  console.assert(
    p1[0] >= 0 && p1[0] <= 1 && p1[1] >= 0 && p1[1] <= 1,
    "Control points must be withing 0-1 range"
  );
  console.assert(
    p2[0] >= 0 && p2[0] <= 1 && p2[1] >= 0 && p2[1] <= 1,
    "Control points must be withing 0-1 range"
  );
  return function (x) {
    const a = 3 * p1[0] - 3 * p2[0] + 1;
    const b = 3 * p2[0] - 6 * p1[0];
    const c = 3 * p1[0];
    const d = -x;

    const t = solvePolynomial([d, c, b, a]);

    const y =
      3 * (1 - t) * (1 - t) * t * p1[1] + 3 * (1 - t) * t * t * p2[1] + t ** 3;

    return y;
  };
};
export const Easings = {
  linear,
  quadratic,
  cubic,
  ease: cubic([0.25, 0.1], [0.25, 1]),
  easeIn: cubic([0.42, 0], [1, 1]),
  easeOut: cubic([0, 0], [0.58, 1]),
  easeInOut: cubic([0.42, 0], [0.58, 1]),
};

const __dummyElm = document.createElement("div");
document.body.appendChild(__dummyElm);
const colorToRGBA = (color: string) => {
  __dummyElm.style.color = color;
  const rgbstr = window.getComputedStyle(__dummyElm).color;
  return RGBA.fromStr(rgbstr);
};

type JObjectUpdater = (obj: JObject, t: number) => void;

export abstract class JObject {
  _strokeStyle: RGBA | CanvasGradient = WHITE;
  _fillStyle: RGBA = TRANSPARENT;
  strokeWidth = 1;
  translation: Vec2 = [0, 0];
  scaling: Vec2 = [1, 1];
  rotation = 0;
  opacity = 1;
  updaters: JObjectUpdater[] = [];

  // Updater funcs
  addUpdaters(...updaters: JObjectUpdater[]) {
    this.updaters.push(...updaters);
    return this;
  }
  removeUpdater(updater: JObjectUpdater) {
    this.updaters = this.updaters.filter((up) => up != updater);
    return this;
  }

  // Fill
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

  // Stroke
  setStrokeOpacity(o: number) {
    if (this._strokeStyle instanceof RGBA) {
      this._strokeStyle.a = o;
    }
    return this;
  }
  stroke(c: string) {
    this.strokeStyle = c;
    return this;
  }
  set strokeStyle(c: string | CanvasGradient) {
    if (typeof c == "string") this._strokeStyle = colorToRGBA(c);
    else {
      this._strokeStyle = c;
    }
  }
  get strokeStyle() {
    if (this._strokeStyle instanceof RGBA) {
      return this._strokeStyle.toStyle();
    } else {
      return this._strokeStyle;
    }
  }
  setStrokeWidth(w: number) {
    this.strokeWidth = w;
    return this;
  }

  // Translation
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

  // Scale
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

  // Rotation
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

  // Render
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

  get animate() {
    return {
      translate: (to: Vec2) => new Translate(this, null, to),
      spin: (to: number) => new Spinner(this, 0, to),
      fadeIn: () => new FadeIn(this),
      color: (to: RGBA | string) => new ColorMorph(this, null, to),
    };
  }

  abstract render(ctx: CanvasRenderingContext2D): void;
}
type TrackerUpdater = (obj: Tracker, t: number) => void;
// TODO not finalized, may rework the design
class Tracker {
  value: number;
  updaters: TrackerUpdater[] = [];

  constructor(value: number) {
    this.value = value;
  }
  // Updater funcs
  addUpdaters(...updaters: TrackerUpdater[]) {
    this.updaters.push(...updaters);
    return this;
  }
  removeUpdater(updater: TrackerUpdater) {
    this.updaters = this.updaters.filter((up) => up != updater);
    return this;
  }
  getValue() {
    return this.value;
  }
  setValue(v: number) {
    this.value = v;
  }
  get animate() {
    return {
      set: (to: number) => new SetTrackerValue(this, null, to),
    };
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
    const newCountour: Contour = range(len).map(() => [
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
  getBounds(): Bounds {
    let top = Infinity;
    let left = Infinity;
    let bottom = -Infinity;
    let right = -Infinity;

    for (const contour of this.glyphData) {
      for (const curve of contour) {
        if (curve[0][0] < left) left = curve[0][0];
        if (curve[3][0] < left) left = curve[3][0];

        if (curve[0][0] > right) right = curve[0][0];
        if (curve[3][0] > right) right = curve[3][0];

        if (curve[0][1] < top) top = curve[0][1];
        if (curve[3][1] < top) top = curve[3][1];

        if (curve[0][1] > bottom) bottom = curve[0][1];
        if (curve[3][1] > bottom) bottom = curve[3][1];
      }
    }

    return {
      top,
      left,
      bottom,
      right,
      height: bottom - top,
      width: right - left,
    };
  }
  become(that: VObject) {
    return new VMorph(this, that);
  }
  render(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    this.glyphData.forEach((contour) => {
      const startPoint = contour[0][0];
      ctx.moveTo(startPoint[0], startPoint[1]);

      contour.forEach((curve) => {
        // ctx.lineTo(curve[0][0], curve[0][1]);
        ctx.bezierCurveTo(
          curve[1][0],
          curve[1][1],
          curve[2][0],
          curve[2][1],
          curve[3][0],
          curve[3][1]
        );
      });

      // ctx.lineTo(startPoint[0], startPoint[1]);
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
/**
 * To render text using native functions.
 * If you want features like morphing use Text instead
 */
export class NativeText extends JObject {
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
export class Image extends JObject {
  image: CanvasImageSource;
  h: number;
  w: number;
  constructor(image: CanvasImageSource, w = 200, h = 200) {
    super();
    this.image = image;
    this.h = h;
    this.w = w;
  }

  static fromURI(uri: string, w = 200, h = 200) {
    const elm = document.createElement("img");
    elm.src = uri;

    return new Image(elm, w, h);
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.image;
    ctx.drawImage(this.image, -this.w / 2, -this.h / 2, this.w, this.h);
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
    console.assert(char.length == 1, "Letter expects a single character");
    console.assert(font in loadedFonts, "Font not loaded properly");
    super();
    this.char = char;
    this.font = loadedFonts[font];

    const code = this.char.charCodeAt(0);
    const glyphId = this.font.cmapTable.getGlyphId(code);
    const glyph = this.font.glyphs[glyphId];

    this.glyphData = glyph.getGlyphData(20);
  }

  setFontSize(size: number) {
    const code = this.char.charCodeAt(0);
    const glyphId = this.font.cmapTable.getGlyphId(code);
    const glyph = this.font.glyphs[glyphId];

    this.glyphData = glyph.getGlyphData(size);

    return this;
  }
}
export class Text extends VObject {
  str: string;
  font: Font;
  maxWidth: number;
  fontSize: number;
  constructor(str: string, font: string) {
    console.assert(font in loadedFonts, "Font not loaded properly");
    super();
    this.str = str;
    this.font = loadedFonts[font];
    this.maxWidth = 800;
    this.fontSize = 20;

    this.updateGlyphData();
  }

  private updateGlyphData() {
    // TODO add support for propper text alignment.
    // Maybe we could read in words and calculate appropriate width and then render
    let x = 0;
    let y = 0;
    this.glyphData = [];
    this.str.split("").forEach((char) => {
      if (char == " ") {
        x += 5 * this.fontSize;
        return;
      }
      const code = char.charCodeAt(0);
      const glyphId = this.font.cmapTable.getGlyphId(code);
      const glyph = this.font.glyphs[glyphId];

      const [advancedWidth, leftSideBearing] =
        this.font.hmtxTable.getMetric(glyphId);
      x += (leftSideBearing * this.fontSize) / 100;
      this.glyphData = this.glyphData.concat(
        translateGlyph(glyph.getGlyphData(this.fontSize), x, y)
      );
      x += (advancedWidth * this.fontSize) / 100;

      if (x > this.maxWidth) {
        y += this.fontSize * 15;
        x = 0;
      }
    });
  }

  setFontSize(size: number) {
    this.fontSize = size;
    this.updateGlyphData();
    return this;
  }

  setMaxWidth(width: number) {
    this.maxWidth = width;
    this.updateGlyphData();
    return this;
  }

  setFont(font: string) {
    console.assert(font in loadedFonts, "Font not loaded properly");
    this.font = loadedFonts[font];
    this.updateGlyphData();
    return this;
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
type LabelOptions = {
  x?: null | string;
  y?: null | string;
};
type AxesOptions = {
  arrows?: boolean;
  labels?: LabelOptions;
  range?: Vec2;
};
type PlotFunc = (x: number) => number;
export class Axes extends JObject {
  options: Required<AxesOptions>;
  constructor({
    arrows = true,
    labels = { x: "x", y: "y" },
    range,
  }: AxesOptions) {
    super();
    if (!range) {
      range = [-10, 10];
    }
    this.options = { arrows, labels, range };
    this.fill("white");
    this.stroke("white");
  }
  render(ctx: CanvasRenderingContext2D): void {
    const w = ctx.canvas.width;
    const h = ctx.canvas.height;
    const pad = 50;
    const arrowLen = 12;

    ctx.font = "italic 25px Georgia";

    // X Axis
    {
      ctx.beginPath();
      ctx.moveTo(-w / 2 + pad, 0);
      ctx.lineTo(w / 2 - pad, 0);
      ctx.stroke();

      if (this.options.arrows) {
        ctx.beginPath();
        ctx.moveTo(-w / 2 + pad + arrowLen, -arrowLen);
        ctx.lineTo(-w / 2 + pad, 0);
        ctx.lineTo(-w / 2 + pad + arrowLen, +arrowLen);

        ctx.moveTo(w / 2 - pad - arrowLen, -arrowLen);
        ctx.lineTo(w / 2 - pad, 0);
        ctx.lineTo(w / 2 - pad - arrowLen, +arrowLen);
        ctx.stroke();
      }

      if (this.options.labels.x) {
        ctx.fillText(this.options.labels.x, w / 2 - pad - 20, -20);
      }
    }
    // Y Axis
    {
      ctx.beginPath();
      ctx.moveTo(0, -h / 2 + pad);
      ctx.lineTo(0, h / 2 - pad);
      ctx.stroke();

      if (this.options.arrows) {
        ctx.beginPath();
        ctx.moveTo(-arrowLen, -h / 2 + pad + arrowLen);
        ctx.lineTo(0, -h / 2 + pad);
        ctx.lineTo(+arrowLen, -h / 2 + pad + arrowLen);

        ctx.moveTo(-arrowLen, h / 2 - pad - arrowLen);
        ctx.lineTo(0, h / 2 - pad);
        ctx.lineTo(+arrowLen, h / 2 - pad - arrowLen);
        ctx.stroke();
      }

      if (this.options.labels.y) {
        ctx.fillText(this.options.labels.y, 0 + 20, -h / 2 + pad + 20);
      }
    }
  }
  plot(func: PlotFunc) {
    const plottedGraph = new VObject();
    const [start, end] = this.options.range;

    const factor = (16 * 70 - 2 * 50) / (end - start);
    subdivide(start, end, 100).forEach((x) => {
      const y = func(x);
      // TODO not sure about translation hack
      const rx = x * factor + this.translation[0];
      const ry = -y * factor + this.translation[1];

      if (isNaN(rx) || isNaN(ry)) return;
      plottedGraph.addCurve([
        [rx, ry],
        [rx, ry],
        [rx, ry],
        [rx, ry],
      ]);
    });

    plottedGraph.setStrokeWidth(3);
    return plottedGraph;
  }
}

export abstract class JAnimation {
  background = false;
  durationMs = 3000;
  runTimeMs = 0;
  done = false;

  constructor() {}

  // TODO: not sure if we want to pass context here. Feels wrong semantically
  abstract step(dt: number, ctx: CanvasRenderingContext2D): void;

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
export abstract class SimplePropertyAnim extends JAnimation {
  easing: EasingFunc = linear;
  constructor() {
    super();
  }

  protected abstract updateProperty(t: number): void;

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
class SetTrackerValue extends SimplePropertyAnim {
  tr: Tracker;
  from: number;
  to: number;
  constructor(tr: Tracker, from: number | null, to: number) {
    super();
    this.tr = tr;
    this.from = from ?? tr.getValue();
    this.to = to;
  }
  protected updateProperty(t: number): void {
    this.tr.setValue(lerpNum(t, this.from, this.to));
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

  step(dt: number, ctx: CanvasRenderingContext2D): void {
    this.runTimeMs += dt;

    this.anims.forEach((anim) => anim.step(dt, ctx));

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

  step(dt: number, ctx: CanvasRenderingContext2D): void {
    this.runTimeMs += dt;

    const t = this.runTimeMs / this.durationMs;

    this.anim.step(dt, ctx);

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
      const srcContour = this.source.glyphData[i];
      const destContour = this.dest.glyphData[i];

      while (srcContour.length < destContour.length) {
        const endPos = srcContour[srcContour.length - 1][3];
        srcContour.push([[...endPos], [...endPos], [...endPos], [...endPos]]);
      }
      while (destContour.length < srcContour.length) {
        const endPos = destContour[destContour.length - 1][3];
        destContour.push([[...endPos], [...endPos], [...endPos], [...endPos]]);
      }

      console.assert(srcContour.length == destContour.length, "Fails");
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
      new ColorMorph(
        source,
        source._fillStyle,
        dest._fillStyle,
        ColoringMode.FillOnly
      )
    );

    if (
      source._strokeStyle instanceof RGBA &&
      dest._strokeStyle instanceof RGBA
    ) {
      this.add(
        new ColorMorph(
          source,
          source._strokeStyle,
          dest._strokeStyle,
          ColoringMode.StrokeOnly
        )
      );
    }
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

  step(dt: number, ctx: CanvasRenderingContext2D): void {
    this.runTimeMs += dt;

    const currAnim = this.anims.find((anim) => !anim.done);
    currAnim?.step(dt, ctx);

    if (this.anims.every((anim) => anim.done)) {
      this.done = true;
    }
  }
}
enum GradientPattern {
  Linear = "Linear",
  Conic = "Conic",
  Radial = "Radial",
}
export class Stroke extends JAnimation {
  obj: VObject;
  easing: EasingFunc = linear;
  bound: Bounds;
  fadeAmt = 0.05;
  color: RGBA;
  gradMode: GradientPattern;
  constructor(obj: VObject, gradMode: GradientPattern) {
    super();
    this.obj = obj;
    if (this.obj._strokeStyle instanceof RGBA) {
      this.color = this.obj._strokeStyle;
    } else {
      throw new Error("Expected _strokeStyle to be RGBA");
    }
    this.bound = obj.getBounds();
    this.gradMode = gradMode;
  }

  private giveMeMyGradient(ctx: CanvasRenderingContext2D): CanvasGradient {
    switch (this.gradMode) {
      case GradientPattern.Linear:
        return ctx.createLinearGradient(
          this.bound.left,
          this.bound.top,
          this.bound.right,
          this.bound.bottom
        );
      case GradientPattern.Conic:
        return ctx.createConicGradient(
          0,
          lerpNum(0.5, this.bound.left, this.bound.right),
          lerpNum(0.5, this.bound.top, this.bound.bottom)
        );
      case GradientPattern.Radial:
        return ctx.createRadialGradient(
          lerpNum(0.5, this.bound.left, this.bound.right),
          lerpNum(0.5, this.bound.top, this.bound.bottom),
          0,
          lerpNum(0.5, this.bound.left, this.bound.right),
          lerpNum(0.5, this.bound.top, this.bound.bottom),
          Math.max(
            this.bound.right - this.bound.left,
            this.bound.top - this.bound.bottom
          )
        );
    }
  }

  step(dt: number, ctx: CanvasRenderingContext2D): void {
    this.runTimeMs += dt;
    let t = this.runTimeMs / this.durationMs;
    t = clamp(t);
    t = this.easing(t);

    const grad = this.giveMeMyGradient(ctx);
    grad.addColorStop(clamp(t), this.color.toStyle());
    grad.addColorStop(clamp(t), this.color.toStyle());
    grad.addColorStop(clamp(t + this.fadeAmt), "transparent");

    this.obj._strokeStyle = grad;

    if (this.runTimeMs > this.durationMs) {
      this.done = true;
    }
  }
}
export class Create extends Sequence {
  obj: VObject;
  constructor(obj: VObject, gradMode = GradientPattern.Linear) {
    super();
    this.obj = obj;

    this.add(
      new Stroke(this.obj, gradMode),
      new ColorMorph(
        obj,
        TRANSPARENT,
        this.obj._fillStyle,
        ColoringMode.FillOnly
      )
    );

    this.obj.fillStyle = "transparent";
  }
}

export abstract class Scene {
  objects: JObject[] = [];
  selfCenter = false;
  runTimeMs = 0;
  done = false;
  ctx: CanvasRenderingContext2D;
  dt = 0;
  running = false;
  private isRecording = false;
  private mRecoder: MediaRecorder;
  private mouse: Vec2 = [0, 0];
  private loc: Vec2;
  private trackers: Tracker[] = [];

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    const boundingRect = ctx.canvas.getBoundingClientRect();
    this.loc = [boundingRect.x, boundingRect.y];

    this.ctx.canvas.addEventListener("mousemove", (e) => {
      this.mouse[0] = e.clientX - this.loc[0];
      this.mouse[1] = e.clientY - this.loc[1];
    });

    const stream = this.ctx.canvas.captureStream(0);
    this.mRecoder = new MediaRecorder(stream, {
      mimeType: "video/mp4;codecs=avc1",
    });
  }

  getMouse() {
    return this.mouse;
  }

  startRecording() {
    console.assert(this.mRecoder.state == "inactive", "Already recording");

    this.isRecording = true;

    const chunks: Blob[] = [];
    this.mRecoder.onerror = console.log;
    this.mRecoder.onstop = () => {
      const file = new Blob(chunks, { type: this.mRecoder.mimeType });
      const url = URL.createObjectURL(file);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "janim.mp4";
      anchor.click();
    };
    this.mRecoder.ondataavailable = (e) => {
      chunks.push(e.data);
    };

    this.mRecoder.start();
  }
  stopRecording() {
    this.isRecording = false;
    this.mRecoder.stop();
  }

  pause() {
    this.running = false;
  }
  resume() {
    this.running = true;
  }
  togglePlayState() {
    this.running = !this.running;
  }

  add(...objs: JObject[]) {
    objs.forEach((obj) => {
      this.remove(obj);
      this.objects.push(obj);
    });
  }

  remove(obj: JObject) {
    this.objects = this.objects.filter((it) => it != obj);
  }

  mainLoop() {
    this.running = true;
    this.construct();
    this.render();
  }

  createTracker(initial: number) {
    const t = new Tracker(initial);
    this.addTracker(t);
    return t;
  }

  addTracker(t: Tracker) {
    this.trackers.push(t);
  }

  removeTracker(t: Tracker) {
    this.trackers = this.trackers.filter((it) => it != t);
  }

  async play(anim: JAnimation) {
    return new Promise<void>((resolve) => {
      let startTime = 0;
      let playTime = 0;
      let dt = 0;
      let prevT = 0;

      const loop: FrameRequestCallback = (t) => {
        // When recording have a steady FPS
        dt = this.isRecording ? 1000 / 60 : t - prevT;
        prevT = t;

        if (this.running) {
          anim.step(dt, this.ctx);
          this.objects.forEach((obj) =>
            obj.updaters.forEach((upd) => upd(obj, playTime))
          );
          this.trackers.forEach((tr) =>
            tr.updaters.forEach((upd) => upd(tr, playTime))
          );
          this.render();
          playTime += dt;
        }

        if (this.isRecording) {
          // @ts-ignore
          this.mRecoder.stream.getVideoTracks()?.[0]?.requestFrame();
        }

        if (playTime < anim.durationMs) {
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

  async playAll(...anims: JAnimation[]) {
    await this.play(new Parallel(...anims));
  }

  wait(durationMs = 1000) {
    return this.play(new Wait(durationMs));
  }

  abstract construct(): void;

  render() {
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);

    this.ctx.save();
    if (this.selfCenter) {
      this.ctx.translate(this.ctx.canvas.width / 2, this.ctx.canvas.height / 2);
    }

    this.objects.forEach((obj) => obj.wrapedRender(this.ctx));

    this.ctx.restore();
  }
}

type _CP<T extends abstract new (...args: any) => any> =
  ConstructorParameters<T>;

/**
 * Janim Factory - Incase you hate new keyword
 */
export const jf = {
  // Utils
  RGBA: (...a: _CP<typeof RGBA>) => new RGBA(...a),
  // JObjects
  Circle: (...a: _CP<typeof Circle>) => new Circle(...a),
  Rectangle: (...a: _CP<typeof Rectangle>) => new Rectangle(...a),
  Polygon: (...a: _CP<typeof Polygon>) => new Polygon(...a),
  Group: (...a: _CP<typeof Group>) => new Group(...a),
  VObject: (...a: _CP<typeof VObject>) => new VObject(...a),
  NativeText: (...a: _CP<typeof NativeText>) => new NativeText(...a),
  Text: (...a: _CP<typeof Text>) => new Text(...a),
  Image: (...a: _CP<typeof Image>) => new Image(...a),
  Letter: (...a: _CP<typeof Letter>) => new Letter(...a),
  Axes: (...a: _CP<typeof Axes>) => new Axes(...a),
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
  Stroke: (...a: _CP<typeof Stroke>) => new Stroke(...a),
  Create: (...a: _CP<typeof Create>) => new Create(...a),
};
