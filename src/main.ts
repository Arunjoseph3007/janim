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
      .scale(2, 2);
    this.add(s);

    const p = jf
      .Polygon([200, 200], [200, 400], [500, 400], [300, 150])
      .translate(60, 100)
      .fill("#ff000044");
    this.add(p);

    const l = jf.Spinner(s).repeat(10);
    const ls = jf
      .Sequence(
        jf.Translate(c, null, [100, 100]).in(250).repeat(2),
        jf.Translate(c, [100, 100], [200, 200]).in(250)
      )
      .repeat(10);

    await this.play(ls);
    await this.play(l);
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
