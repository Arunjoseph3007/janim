import { EasingFunc, Vec2 } from "./types";
import { solvePolynomial, solveQuadEQ } from "./utils";

/*##########################################################
#####################  EASING STUFF  #######################
############################################################*/
export const linear: EasingFunc = (t) => t;
export const quadratic: (cp: Vec2) => EasingFunc = function (cp) {
  console.assert(
    cp[0] >= 0 && cp[0] <= 1 && cp[1] >= 0 && cp[1] <= 1,
    "Control point must be withing 0-1 range"
  );

  return function (x) {
    const a = 1 - 2 * cp[0];
    const b = 2 * cp[0];
    const c = -x;

    const [t1, t2] = solveQuadEQ(a, b, c);
    const t = t1 >= 0 && t1 <= 1 ? t1 : t2;

    const y = 2 * t * (1 - t) * cp[1] + t * t;
    return y;
  };
};
export const cubic: (p1: Vec2, p2: Vec2) => EasingFunc = function (p1, p2) {
  [p1, p2]
    .flat()
    .forEach((v) =>
      console.assert(
        v >= 0 && v <= 1,
        "Control points must be withing 0-1 range"
      )
    );

  return function (x) {
    const a = 3 * p1[0] - 3 * p2[0] + 1;
    const b = 3 * p2[0] - 6 * p1[0];
    const c = 3 * p1[0];
    const d = -x;

    const t = solvePolynomial([d, c, b, a]);

    const y =
      3 * (1 - t) * (1 - t) * t * p1[1] + 3 * (1 - t) * t * t * p2[1] + t ** 3;

    return y;
  };
};
export const Easings = {
  linear,
  quadratic,
  cubic,
  ease: cubic([0.25, 0.1], [0.25, 1]),
  easeIn: cubic([0.42, 0], [1, 1]),
  easeOut: cubic([0, 0], [0.58, 1]),
  easeInOut: cubic([0.42, 0], [0.58, 1]),
};
