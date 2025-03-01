const todo = () => {
  throw new Error("TODO: not implmented yet");
};

const lerpNum = (t: number, a: number, b: number) => a + (b - a) * t;

type Vec2 = [number, number];

export class JObject {
  strokeStyle: string | CanvasGradient | CanvasPattern = "#fff";
  fillStyle: string | CanvasGradient | CanvasPattern = "transparent";
  translation: Vec2 = [0, 0];
  scaling: Vec2 = [1, 1];
  rotation = 0;
  opacity = 1;

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

  constructor(w: number, h: number) {
    super();
    this.w = w;
    this.h = h;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.beginPath();
    const left = -this.w / 2;
    const top = -this.h / 2;
    ctx.moveTo(left, top);
    ctx.lineTo(left + this.w, top);
    ctx.lineTo(left + this.w, top + this.h);
    ctx.lineTo(left, top + this.h);
    ctx.lineTo(left, top);
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
export class JAnimation {
  background = false;
  durationMs = 3000;
  runTimeMs = 0;
  done = false;

  constructor() {}
  step(dt: number) {
    todo();
  }
  render(ctx: CanvasRenderingContext2D) {
    todo();
  }
}
export class Translate extends JAnimation {
  obj: JObject;
  from: Vec2;
  to: Vec2;

  constructor(obj: JObject, from: Vec2, to: Vec2) {
    super();
    this.obj = obj;
    this.from = from;
    this.to = to;
  }

  step(dt: number): void {
    this.runTimeMs += dt;

    const t = this.runTimeMs / this.durationMs;

    this.obj.setTranslation(
      lerpNum(t, this.from[0], this.to[0]),
      lerpNum(t, this.from[1], this.to[1])
    );

    if (t > 1) {
      this.done = true;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.obj.wrapedRender(ctx);
  }
}

export class Scene {
  objects: JObject[] = [];
  animationTree: JAnimation[] = [];
  selfCenter = false;
  currAnimIndex = 0;
  runTimeMs = 0;
  done = false;

  constructor() {
    this.construct();
  }
  add(obj: JObject) {
    this.objects.push(obj);
  }

  remove(obj: JObject) {
    this.objects = this.objects.filter((it) => it != obj);
  }

  play(anim: JAnimation) {
    this.animationTree.push(anim);
  }

  stepAnimation(dt: number) {
    this.runTimeMs += dt;

    if (this.currAnimIndex >= this.animationTree.length) {
      this.done = true;
    }
    if (this.done) return;

    const currAnim = this.animationTree[this.currAnimIndex];
    currAnim.step(dt);

    if (currAnim.done) {
      this.currAnimIndex++;
    }
  }

  construct() {
    todo();
  }

  render(ctx: CanvasRenderingContext2D) {
    ctx.globalAlpha;
    if (this.selfCenter) {
      ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
    }
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    this.objects.forEach((obj) => obj.wrapedRender(ctx));

    this.animationTree.forEach((anim) => anim.render(ctx));
  }
}
