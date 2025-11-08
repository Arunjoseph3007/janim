/*
########### WARNING ###########
THE 3D VERSION FOR JANIM IS NOT SUPPORTED, 
THIS IS JUST FOR EXPERIMENT TO EXPLORE THE POSSIBILITY
########### WARNING ###########
*/
import { linear } from "./easing";
import { RGBA, WHITE, TRANSPARENT, colorToRGBA } from "./rgba";
import { EasingFunc, Vec2 } from "./types";
import { clamp, todo } from "./utils";

const { PI } = Math;

type J3ObjectUpdater = (obj: J3Object, t: number) => void;

class Shader {
  private readonly prog: WebGLProgram;

  constructor(gl: WebGL2RenderingContext, vertSrc: string, fragSrc: string) {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    if (!vertexShader) throw new Error("Coudnt create `gl.VERTEX_SHADER`");
    gl.shaderSource(vertexShader, vertSrc);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    if (!fragmentShader) throw new Error("Coudnt create `gl.FRAGMENT_SHADER`");
    gl.shaderSource(fragmentShader, fragSrc);
    gl.compileShader(fragmentShader);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    gl.detachShader(program, vertexShader);
    gl.detachShader(program, fragmentShader);
    gl.deleteShader(vertexShader);
    gl.deleteShader(fragmentShader);

    this.prog = program;
  }

  activate(gl: WebGL2RenderingContext) {
    gl.useProgram(this.prog);
  }
}

export abstract class J3Object {
  _strokeStyle: RGBA = WHITE;
  _fillStyle: RGBA = TRANSPARENT;
  strokeWidth = 1;
  translation: Vec2 = [0, 0];
  scaling: Vec2 = [1, 1];
  rotation = 0;
  opacity = 1;
  updaters: J3ObjectUpdater[] = [];

  // Updater funcs
  addUpdaters(...updaters: J3ObjectUpdater[]) {
    this.updaters.push(...updaters);
    return this;
  }
  removeUpdater(updater: J3ObjectUpdater) {
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

  get animate() {
    return todo();
  }

  abstract render(gl: WebGL2RenderingContext): void;
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
    return todo();
    return {
      // set: (to: number) => new SetTrackerValue(this, null, to),
    };
  }
}

export abstract class JAnimation {
  durationMs = 3000;
  runTimeMs = 0;
  done = false;

  constructor() {}

  abstract step(dt: number): void;

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

/*##########################################################
###################  SIMPLE ANIMATION  #####################
############################################################*/
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

export abstract class Scene3D {
  objects: J3Object[] = [];
  selfCenter = false;
  runTimeMs = 0;
  done = false;
  gl: WebGL2RenderingContext;
  dt = 0;
  running = false;
  private isRecording = false;
  private mRecoder: MediaRecorder;
  private mouse: Vec2 = [0, 0];
  private loc: Vec2;
  private trackers: Tracker[] = [];
  private aborted = false;

  constructor(canvas: HTMLCanvasElement) {
    const _gl = canvas.getContext("webgl2");
    if (!_gl) throw Error("Could get webgl2 context");
    this.gl = _gl;

    this.gl.viewport(
      0,
      0,
      this.gl.drawingBufferWidth,
      this.gl.drawingBufferHeight
    );
    const boundingRect = canvas.getBoundingClientRect();
    this.loc = [boundingRect.x, boundingRect.y];

    canvas.addEventListener("mousemove", (e) => {
      this.mouse[0] = e.clientX - this.loc[0];
      this.mouse[1] = e.clientY - this.loc[1];
    });

    const stream = canvas.captureStream(0);
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

  abort() {
    this.aborted = true;
  }

  add(...objs: J3Object[]) {
    objs.forEach((obj) => {
      this.remove(obj);
      this.objects.push(obj);
    });
  }

  remove(obj: J3Object) {
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

  // TODO: maybe we can return exit codes. 0 for normal exit, 1 for abortion
  async play(anim: JAnimation) {
    return new Promise<void>((resolve) => {
      let startTime = 0;
      let playTime = 0;
      let dt = 0;
      let prevT = 0;

      const loop: FrameRequestCallback = (t) => {
        if (this.aborted) {
          resolve();
          return;
        }
        // When recording have a steady FPS
        dt = this.isRecording ? 1000 / 60 : t - prevT;
        prevT = t;

        if (this.running) {
          anim.step(dt);
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
    this.gl.clearColor(0, 0, 0, 0);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);

    this.objects.forEach((obj) => obj.render(this.gl));
  }
}
