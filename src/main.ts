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
    const sp = jf
      .VObject()
      .translate(120, 120)
      .addCurve([
        [-40, 40],
        [-40, 40],
        [20, 180],
      ])
      .addCurve([
        [90, 220],
        [90, 220],
        [250, 60],
      ])
      .addCurve([
        [80, -80],
        [80, -80],
        [0, 0],
      ]);

    this.add(sp);
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
