/*
########### WARNING ###########
THE 3D VERSION FOR JANIM IS NOT SUPPORTED, 
THIS IS JUST FOR EXPERIMENT TO EXPLORE THE POSSIBILITY
########### WARNING ###########
*/
import "./style.css";
import { Scene3D } from "./janim3d";

const FACTOR = 70;
const WIDTH = 16 * FACTOR;
const HEIGHT = 9 * FACTOR;

class EmptyScene extends Scene3D {
  construct(): void {}
}

const SceneMap: Record<string, typeof Scene3D> = {
  EmptyScene,
};

async function main() {
  const canvas = document.querySelector<HTMLCanvasElement>("#canvas");
  if (!canvas) {
    console.log("Couldnt find canvas");
    return;
  }
  canvas.width = WIDTH;
  canvas.height = HEIGHT;

  let sc: Scene3D | null = new EmptyScene(canvas);

  const sceneSelect = document.querySelector("#scene-select")!;
  for (const scene in SceneMap) {
    const optionElm = document.createElement("button");
    optionElm.value = scene;
    optionElm.innerText = scene;
    optionElm.addEventListener("click", () => {
      sc?.abort();
      // @ts-ignore
      sc = new SceneMap[scene](canvas);
      sc?.mainLoop();
    });
    sceneSelect.appendChild(optionElm);
  }

  document.addEventListener("keypress", (e) => {
    if (!sc) {
      console.warn("No scene selected");
      return;
    }

    if (e.key == " ") {
      sc.togglePlayState();
    } else if (e.key == "r") {
      sc.startRecording();
    } else if (e.key == "s") {
      sc.stopRecording();
    } else if (e.key == "q") {
      sc.abort();
    }
  });

  sc.mainLoop();
}

main();
