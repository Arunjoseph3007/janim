import { Font } from "./font";
import { Easings, Scene, jf } from "./janim";
import "./style.css";

const FACTOR = 70;
const WIDTH = 16 * FACTOR;
const HEIGHT = 9 * FACTOR;

class MyScene extends Scene {
  constructor(ctx: CanvasRenderingContext2D) {
    super(ctx);
  }

  async construct() {
    const c = jf.Circle(200).translate(300, 250).fill("#ffff0077");
    this.add(c);

    const s = jf
      .Rectangle(200, 100)
      .translate(500, 250)
      .fill("#00ffff66")
      .scale(2, 2)
      .rotateDeg(45);

    const morph = jf.VMorph(c, s);
    await this.play(morph);

    const p = jf
      .Polygon([40, 100], [150, 120], [100, 300])
      .translate(500, 250)
      .fill("orange")
      .scale(4, 4);

    const re = jf.VMorph(c, p);
    await this.play(re);
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
  const f = await Font.fromURI("JetBrainsMono.ttf");

  console.log(f);

  const sc = new MyScene(ctx);
  sc.mainLoop();
}

main();
