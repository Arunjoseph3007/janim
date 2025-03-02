import {
  Circle,
  Polygon,
  Scene,
  Rectangle,
  Translate,
  FadeIn,
  Spinner,
  ColorMorph,
  Parallel,
  Sequence,
} from "./janim";
import "./style.css";

const FACTOR = 40;
const WIDTH = 16 * FACTOR;
const HEIGHT = 9 * FACTOR;

class MyScene extends Scene {
  constructor() {
    super();
  }

  construct() {
    const c1 = new Circle(25);
    c1.translate(50, 50);
    c1.fillStyle = "pink";
    this.add(c1);

    const s1 = new Rectangle(50, 50);
    s1.translate(200, 200);
    s1.fillStyle = "white";

    const p1 = new ColorMorph(s1, "red", "blue");
    const sp = new Spinner(s1);

    const pl1 = new Sequence(p1, sp);
    // const pl1 = new Parallel(p1, sp);
    this.play(pl1);
  }
}

const scene = new MyScene();

console.log(scene.animationTree.length);
console.log(scene.currAnimIndex);

function draw(ctx: CanvasRenderingContext2D, dt: number) {
  // console.log(scene.animationTree[scene.currAnimIndex].runTimeMs);
  scene.stepAnimation(dt);
  scene.render(ctx);
}

async function main() {
  const canvas = document.querySelector<HTMLCanvasElement>("#canvas");
  if (!canvas) {
    console.log("Couldnt find canvas");
    return;
  }

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    console.log("2d context not supported");
    return;
  }

  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  let prevTimestamp = 0;
  const animFunc: FrameRequestCallback = (curTimestamp) => {
    const dt = curTimestamp - prevTimestamp;
    prevTimestamp = curTimestamp;

    draw(ctx, dt);

    requestAnimationFrame(animFunc);
  };

  requestAnimationFrame((curTimestamp) => {
    prevTimestamp = curTimestamp;
    requestAnimationFrame(animFunc);
  });
}

main();
