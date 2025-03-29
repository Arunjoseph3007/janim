import {
  Cube,
  Easings,
  Image,
  Scene,
  jf,
  loadFontFromUri,
  splitBezier as splitCubicBezier,
} from "./janim";
import "./style.css";
import { CubicCurve } from "./types";
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
    else if (0) {
      const c = jf.Circle(200).fill("red");
      // const c = jf.Text("hahahah", "Montserrat").fill("pink").setFontSize(3);
      c.addUpdaters((o) => {
        o.translation = this.getMouse();
      });
      this.add(c);
      this.wait(10000000);
    }
    // Easing functions
    else if (0) {
      const sq1 = jf.Rectangle(200, 100).fill("red").translate(150, 100);
      const sq2 = jf.Rectangle(200, 100).fill("magenta").translate(150, 250);
      const sq3 = jf.Rectangle(200, 100).fill("yellow").translate(150, 400);
      const sq4 = jf.Rectangle(200, 100).fill("yellow").translate(150, 550);
      this.add(sq1, sq2, sq3, sq4);

      ["ease", "easeIn", "easeOut", "easeInOut"]
        .map((e, i) =>
          jf
            .Text(e, "JetBrainsMono")
            .fill("pink")
            .setFillOpacity(0.5)
            .translate(700, 120 + 150 * i)
            .setFontSize(6)
        )
        .forEach((a) => this.add(a));

      await this.playAll(
        jf.Translate(sq1, null, [600, 100]).ease(Easings.ease),
        jf.Translate(sq2, null, [600, 250]).ease(Easings.easeIn),
        jf.Translate(sq3, null, [600, 400]).ease(Easings.easeOut),
        jf.Translate(sq4, null, [600, 550]).ease(Easings.easeInOut)
      );
    }
    // Stroke
    else if (0) {
      const sq = jf
        .Rectangle(200, 200)
        .fill("transparent")
        .stroke("pink")
        .fill("#00ffff66")
        .setStrokeWidth(5)
        .translate(400, 200);
      const ci = jf
        .Circle(150)
        .translate(300, 500)
        .stroke("#ffff0066")
        .fill("#ffff0066")
        .setStrokeWidth(15);
      this.add(sq, ci);
      const st = jf.Create(sq);
      const ct = jf.Create(ci);

      await this.playAll(st, ct);
    }
    // Axes and plotting
    else if (0) {
      this.selfCenter = true;
      const axes = jf.Axes({});
      this.add(axes);

      const sq = axes.plot((x) => x * x).stroke("#23d997");
      const s = axes.plot(Math.sin).stroke("teal").setStrokeOpacity(0.2);
      const s1 = axes
        .plot(Math.sin, { range: [2, 6], divisions: 30 })
        .stroke("yellow")
        .setStrokeWidth(4);
      const t = axes.plot(Math.log).stroke("red");
      this.add(sq, s, s1);

      await this.play(sq.become(s));
      await this.play(sq.become(t));
    }
    // Images
    else if (0) {
      this.selfCenter = true;
      const uri =
        "https://images.pexels.com/photos/674010/pexels-photo-674010.jpeg?cs=srgb&dl=pexels-anjana-c-169994-674010.jpg&fm=jpg";

      const uri2 =
        "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTtnvAOajH9gS4C30cRF7rD_voaTAKly2Ntaw&s";

      const i1 = Image.fromURI(uri).rotateDeg(45);
      const i2 = Image.fromURI(uri2).translate(100, 100);

      this.add(i1, i2);

      await this.play(jf.Morph(i1, i2));
    }
    // Tracker
    else if (0) {
      this.selfCenter = true;
      const tr = this.createTracker(0);
      const va = tr.animate.set(-100).ease(Easings.easeInOut);

      const c = jf.Circle(100).translateX(-200);
      const s = jf.Rectangle(100, 100).translateX(200);

      c.addUpdaters((o) => o.setTranslateY(tr.getValue()));
      s.addUpdaters((o) => o.setTranslateY(tr.getValue()));

      this.add(c, s);

      await this.play(va);
    }
    // Binory Ops
    else if (0) {
      this.selfCenter = true;
      // const ci = jf.Circle(200).stroke("#ffffff44");
      // const sq = jf.Rectangle(600, 200).stroke("#ffffff44");

      // this.add(sq, ci);
      // this.add(jf.Union(sq, ci).stroke("green").setStrokeWidth(3));
      const curve = [
        [-100, -100],
        [-100, 100],
        [100, 100],
        [100, -100],
      ] as CubicCurve;
      const [a, b] = splitCubicBezier(curve, 0.4);

      const v = jf.VObject().translateX(0);
      v.addContour([curve]);
      this.add(v);

      const va = jf.VObject().stroke("red");
      va.addContour([a]);

      const vb = jf.VObject().stroke("blue");
      vb.addContour([b]);

      this.add(va, vb);
    }
    // 3D cube
    else if (0) {
      this.selfCenter = true;
      const cu = jf.Cube().fill("#00888822");
      this.add(cu);

      const cr = jf.Create(cu);
      await this.play(cr);

      cu.addUpdaters((u, t) => {
        const tu = u as Cube;
        const tt = t / 1000;
        tu.translation3d[0] = Math.sin(tt) * 2.5;
        // tu.translation3d[1] = Math.cos(tt) * 2.5;
      });
      await this.wait(20000);
    }

    // Write anim
    else if (1) {
      this.selfCenter = true;
      const cu = jf.Cube().fill("#00888866");
      this.add(cu);

      const wr = jf.Write(cu);
      await this.play(wr);

      const tx = jf
        .Text("Hi there", "Montserrat")
        .setFontSize(10)
        .translateY(-200)
        .fill("pink");
      this.add(tx);

      const tw = jf.Write(tx);
      await this.play(tw);
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
    } else if (e.key == "r") {
      sc.startRecording();
    } else if (e.key == "s") {
      sc.stopRecording();
    }
  });

  sc.mainLoop();
}

main();
