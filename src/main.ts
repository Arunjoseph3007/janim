import { Easings, Scene, jf } from "./janim";
import "./style.css";

const FACTOR = 40;
const WIDTH = 16 * FACTOR;
const HEIGHT = 9 * FACTOR;

class MyScene extends Scene {
  constructor(ctx: CanvasRenderingContext2D) {
    super(ctx);
  }

  async construct() {
    const c1 = jf.Circle(25).translate(50, 50).fill("pink");
    this.add(c1);

    const tt = jf
      .Text("hell")
      .translate(100, 100)
      .fill("pink")
      .stroke("yellow")
      .setFontSize(90);
    this.add(tt);

    const s1 = jf.Rectangle(50, 50).translate(100, 100).fill("red");
    this.add(s1);

    await this.wait(500);

    const a = jf.Rectangle(50, 50).translate(50, 250).rotate(45).fill("red");
    const b = jf.Circle(25).translate(300, 80).rotate(60).fill("pink");

    this.add(a);
    
    const p1 = jf.ColorMorph(s1, "red", "blue");
    const sp = jf
    .Translate(s1, null, [140, 100])
    .in(550)
    .ease(Easings.quadratic([0.4, 0.8]));
    
    const pl1 = jf.Parallel(p1, sp);
    
    await this.play(pl1);
    this.add(b);
    await this.play(jf.Morph(a, b));
  }
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

  const sc = new MyScene(ctx);
  sc.mainLoop();
}

main();
