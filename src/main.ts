import { Scene, jf, loadFontFromUri } from "./janim";
import "./style.css";
import { range } from "./utils";

const FACTOR = 70;
const WIDTH = 16 * FACTOR;
const HEIGHT = 9 * FACTOR;

class MyScene extends Scene {
  constructor(ctx: CanvasRenderingContext2D) {
    super(ctx);
  }

  async construct() {
    // Single alphabet
    if (0) {
      const letter = jf
        .Letter("R", "Montserrat")
        .setFontSize(80)
        .fill("pink")
        .setFillOpacity(0.5)
        .stroke("orange")
        .setStrokeWidth(2)
        .translate(100, 600);

      this.add(letter);
    }
    // All alphabets
    else if (0) {
      range(26)
        .map((_, i) => [i + 65, i + 97])
        .flat()
        .map((i) => String.fromCharCode(i))
        .map((c, i) =>
          jf
            .Letter(c, "JetBrainsMono")
            .translateX((i % 10) * 100 + 50)
            .translateY(100 + 100 * Math.floor(i / 10))
            .scale(0.5, 0.5)
            .fill("pink")
            .setFontSize(20)
            .setFillOpacity(0.5)
        )
        .forEach((a) => this.add(a));
    }
    // All alphabets transform
    else if (0) {
      const alphabets = new Array(26)
        .fill(0)
        .map((_, i) => [i + 65, i + 97])
        .flat()
        .map((i) => String.fromCharCode(i))
        .map((c) =>
          jf
            .Letter(c, "Montserrat")
            .translate(50, 240)
            .scale(0.5, 0.5)
            .fill("pink")
            .setFontSize(60)
            .setFillOpacity(0.5)
        );
      this.add(alphabets[0]);

      for (let i = 1; i < alphabets.length; i++) {
        const t = jf.VMorph(alphabets[0], alphabets[i]);
        await this.play(t);
        await this.wait(250);
      }
    }
    // Alphabet morph
    else if (0) {
      const first = jf
        .Letter("i", "JetBrainsMono")
        .fill("pink")
        .scale(0.5, -0.5)
        .translateY(500);
      const second = jf
        .Letter("g", "Montserrat")
        .fill("pink")
        .scale(0.5, -0.5)
        .translateY(500);
      this.add(first);

      const vm = jf.VMorph(first, second);

      await this.wait(500);
      await this.play(vm);
    }
    // Shapge morhp
    else if (0) {
      const c = jf.Circle(200).translate(250, 250).fill("#00ffff55");
      this.add(c);

      await this.wait();

      const s = jf
        .Rectangle(200, 100)
        .translate(500, 250)
        .fill("#00ffff66")
        .scale(2, 2)
        .rotateDeg(45);

      const p = jf
        .Polygon([40, 100], [150, 120], [100, 300])
        .translate(500, 250)
        .fill("orange")
        .setFillOpacity(0.5)
        .scale(4, 4);

      const re = jf.VMorph(c, p);
      await this.play(re);

      const morph = jf.VMorph(c, s);
      await this.play(morph);
    }
    // Text
    else if (0) {
      const t = jf
        .Text("Text is just vector objects", "Montserrat")
        .fill("pink")
        .translate(100, 200)
        .setFontSize(8);
      this.add(t);

      const s = jf
        .Text("It can transform to anything", "Montserrat")
        .fill("yellow")
        .translate(100, 200)
        .setFontSize(6);

      const vm = jf.VMorph(t, s);
      await this.wait(1000);
      await this.play(vm);
    }
    // Custom Updaters
    else if (1) {
      const c = jf.Circle(200).fill("red");
      // const c = jf.Text("hahahah", "Montserrat").fill("pink").setFontSize(3);
      c.addUpdaters((o) => {
        o.translation = this.getMouse();
      });
      this.add(c);
      this.wait(10000000);
    }
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

  document.addEventListener("keypress", (e) => {
    if (e.key == " ") {
      sc.togglePlayState();
    }
  });

  sc.mainLoop();
}

main();
