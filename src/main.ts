import { Scene, jf, loadFontFromUri } from "./janim";
import "./style.css";

const FACTOR = 70;
const WIDTH = 16 * FACTOR;
const HEIGHT = 9 * FACTOR;

class MyScene extends Scene {
  constructor(ctx: CanvasRenderingContext2D) {
    super(ctx);
  }

  async construct() {
    // new Array(26)
    //   .fill(0)
    //   .map((_, i) => [i + 65, i + 97])
    //   .flat()
    //   .map((i) => String.fromCharCode(i))
    //   .map((c, i) =>
    //     jf
    //       .Letter(c, "Montserrat")
    //       .translateX((i % 10) * 100 + 80)
    //       .translateY(Math.floor(i / 10) * 100 + 80)
    //       .scale(0.05, -0.05)
    //       .fill("pink")
    //       .stroke("orange")
    //       .setStrokeWidth(40)
    //   )
    //   .forEach((o) => this.add(o));

    const c = jf.Circle(200).translate(250, 250).fill("#00ffff77");
    this.add(c);

    await this.wait();

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
  await loadFontFromUri("Montserrat", "Montserrat-Regular.ttf");
  await loadFontFromUri("JetBrainsMono", "JetBrainsMono.ttf");

  const sc = new MyScene(ctx);
  sc.mainLoop();
}

main();
