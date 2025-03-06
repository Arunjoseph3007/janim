import { Easings, Scene, jf } from "./janim";
import "./style.css";

const FACTOR = 40;
const WIDTH = 16 * FACTOR;
const HEIGHT = 9 * FACTOR;

class MyScene extends Scene {
  constructor() {
    super();
  }

  construct() {
    const c1 = jf.Circle(25).translate(50, 50);
    c1.fillStyle = "pink";
    this.add(c1);

    const s1 = jf.Rectangle(50, 50).translate(100, 100);
    s1.fillStyle = "red";
    this.add(s1);

    this.wait(500);

    const p1 = jf.ColorMorph(s1, "red", "blue");
    const sp = jf
      .Translate(s1, null, [140, 100])
      .in(550)
      .ease(Easings.quadratic([0.4, 0.8]));

    const tt = jf
      .Text("hell")
      .translate(100, 100)
      .fill("pink")
      .stroke("yellow");
    tt.fontSize = 90;
    this.add(tt);

    const pl1 = jf.Parallel(p1, sp);
    this.play(pl1);

    // const a = jf.Rectangle(50, 50).translate(50, 50).rotate(45).fill("red");
    // const b = jf.Circle(25).translate(300, 80).rotate(60).fill("pink");

    // this.add(a);
    // this.add(b);

    // this.play(jf.Morph(a, b));
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
