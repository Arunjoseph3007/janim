import { Contour, CubicCurve, GlpyhData, Vec2 } from "./types";
import {
  checkBoundIntersect,
  cubicBezierAt,
  splitBezier,
  solvePolynomial,
  fAt,
} from "./utils";

const { abs } = Math;

interface CurveIntersection {
  ta: number;
  tb: number;
  p: Vec2;
}
export const findCurveIntersections = (
  a: CubicCurve,
  b: CubicCurve,
  ta1 = 0,
  ta2 = 1,
  tb1 = 0,
  tb2 = 1
): CurveIntersection[] => {
  const ca = subBezier(a, ta1, ta2);
  const cb = subBezier(b, tb1, tb2);
  if (!checkBoundIntersect(ca, cb)) return [];

  const MIN_GAP = 0.0001;
  const mida = (ta1 + ta2) / 2;
  const midb = (tb1 + tb2) / 2;
  if (abs(ta2 - ta1) < MIN_GAP && abs(tb2 - tb1) < MIN_GAP) {
    return [{ ta: mida, tb: midb, p: cubicBezierAt(ca, mida) }];
  }

  return [
    findCurveIntersections(a, b, ta1, mida, tb1, midb),
    findCurveIntersections(a, b, mida, ta2, tb1, midb),
    findCurveIntersections(a, b, ta1, mida, midb, tb2),
    findCurveIntersections(a, b, mida, ta2, midb, tb2),
  ].flat();
};

export interface ContourIntersection extends CurveIntersection {
  cntA: number;
  cntB: number;
  // PLUS CurveIntersection feilds  { tx, ty, p}
}
/**
 * Mind you must be very fast
 * @param a Spline a
 * @param b Spline b
 * @returns
 */
export const findContourIntersections = (
  a: Contour,
  b: Contour
): ContourIntersection[] => {
  const intersections: ContourIntersection[] = [];

  a.forEach((curveA, cntA) => {
    b.forEach((curveB, cntB) => {
      findCurveIntersections(curveA, curveB).forEach((int) => {
        intersections.push({ ...int, cntA, cntB });
      });
    });
  });

  return intersections;
};

export interface GlyphIntersection extends ContourIntersection {
  glyphA: number;
  glyphB: number;
  // PLUS ContourIntersection feilds  { tx, ty, p, ia, ib}
}
export const findGlyphIntersections = (
  a: GlpyhData,
  b: GlpyhData
): GlyphIntersection[] => {
  const intersections: GlyphIntersection[] = [];

  a.forEach((cntA, glyphA) => {
    b.forEach((cntB, glyphB) => {
      findContourIntersections(cntA, cntB).forEach((int) => {
        intersections.push({ ...int, glyphA, glyphB });
      });
    });
  });

  return intersections;
};

/**
 * Extract a cubic bezier segment between given t values
 * @link https://www.sciencedirect.com/topics/mathematics/bezier-curve (Section 5.5.4.2)
 * @param a Bezier curve to chop
 * @param t1
 * @param t2
 * @returns Bezier curve
 */
export const subBezier = (
  a: CubicCurve,
  t1: number,
  t2: number
): CubicCurve => {
  const [subA, _a] = splitBezier(a, t2);
  const [_b, subB] = splitBezier(subA, t1 / t2);

  return subB;
};

export type ChopPoint = {
  index: number;
  curveIndex: number;
  glyphIndex: number;
  t: number;
};
export const chopAtIntersections = (
  contour: Contour,
  chopPoints: ChopPoint[],
  glyphIndex: number
): [Contour, Record<number, number>] => {
  const chopped: Contour = [];
  const indexMap: Record<number, number> = {};

  contour.forEach((curve, i) => {
    const curveChopPoints = chopPoints
      .filter((cp) => cp.glyphIndex == glyphIndex && cp.curveIndex == i)
      .sort((a, b) => a.t - b.t);

    if (curveChopPoints.length == 0) {
      chopped.push(curve);
      return;
    }

    let startT = 0;
    curveChopPoints.forEach((ccp) => {
      const subCurve = subBezier(curve, startT, ccp.t);
      startT = ccp.t;

      chopped.push(subCurve);

      indexMap[ccp.index] = chopped.length;
    });

    const lastCurve = subBezier(curve, startT, 1);
    chopped.push(lastCurve);
  });

  return [chopped, indexMap];
};

/**
 * Returns Y coordinate for a given X Cooradinate for a point on a cubic bezier curve.
 * Currently it calculates x by first solving bezier equation in x space to find t
 * and then using this t values and substituting in bezier equation to find y
 *
 * An alternate approach could be to Binary search between 0 - 1
 * We can calculate x and y values for somes t's and subdivide [0,1] range
 * until x is very close to given x and return corresponding y
 * This might be more performant
 * @param curve
 * @param x
 * @returns
 */
export const xToYCubicCurve = (curve: CubicCurve, x: number): number | null => {
  const [p0, p1, p2, p3] = curve.map((p) => p[0]);
  const [q0, q1, q2, q3] = curve.map((p) => p[1]);

  const ax = -p0 + 3 * p1 - 3 * p2 + p3;
  const bx = 3 * p0 - 6 * p1 + 3 * p2;
  const cx = -3 * p0 + 3 * p1;
  const dx = p0 - x;

  const t = solvePolynomial([dx, cx, bx, ax], 0.5, 0.00001);

  if (t < 0 || t > 1) return null;

  const ay = -q0 + 3 * q1 - 3 * q2 + q3;
  const by = 3 * q0 - 6 * q1 + 3 * q2;
  const cy = -3 * q0 + 3 * q1;
  const dy = q0;

  return fAt([dy, cy, by, ay], t);
};

/**
 * Returns if a point p is inside spline contour
 * @param p
 * @param contour
 * @returns
 */
export const isInsideContour = (p: Vec2, contour: Contour): boolean => {
  const curvesAbove = contour
    .map((c) => xToYCubicCurve(c, p[0])) // Get y for given x
    .filter((y) => y != null) // filter curves that dont ailgn
    .filter((y) => y > p[1]); // filter curves that are below

  return curvesAbove.length % 2 == 1;
};

export const findUnion = (a: GlpyhData, b: GlpyhData): GlpyhData => {
  const intersections = findGlyphIntersections(a, b);

  if (intersections.length == 0) {
    return [...a, ...b];
  }

  console.log({intersections});

  // return [intersections.map((int) => [int.p, int.p, int.p, int.p])];

  const unionGlyph: GlpyhData = [];

  const choppedA = a.map((cnt, glyphI) => {
    const [choppedCntA, indexMap] = chopAtIntersections(
      cnt,
      intersections.map((int, i) => ({
        curveIndex: int.cntA,
        glyphIndex: int.glyphA,
        t: int.ta,
        index: i,
      })),
      glyphI
    );

    // it contour is completely disjoint
    if (choppedCntA.length == cnt.length) {
      unionGlyph.push(cnt);
    }

    for (const a in indexMap) {
      intersections[a].cntA = indexMap[a];
    }

    return choppedCntA;
  });

  const choppedB = b.map((cnt, glyphI) => {
    const [choppedCntB, indexMap] = chopAtIntersections(
      cnt,
      intersections.map((int, i) => ({
        curveIndex: int.cntB,
        glyphIndex: int.glyphB,
        t: int.tb,
        index: i,
      })),
      glyphI
    );

    // it contour is completely disjoint
    if (choppedCntB.length == cnt.length) {
      unionGlyph.push(cnt);
    }

    for (const a in indexMap) {
      intersections[a].cntB = indexMap[a];
    }
    return choppedCntB;
  });

  // Segment combination logic. Different for all BinaryOps
  const intersectionVisited: number[] = new Array(intersections.length).fill(0);
  while (intersectionVisited.some((i) => i == 0)) {
    const startPoint = intersectionVisited.findIndex((i) => i == 0);

    console.log({ startPoint });

    // Segment combination logic. Different for all BinaryOps
    intersectionVisited[startPoint] = 1;

    const unionContour: Contour = [];

    const _int = intersections[startPoint];
    let ia = _int.cntA;
    let ib = _int.cntB;
    let ga = _int.glyphA;
    let gb = _int.glyphB;

    const testPoint = cubicBezierAt(choppedB[gb][ib], 0.1);
    let isA = isInsideContour(testPoint, choppedA[ga]);

    while (true) {
      console.log({ isA, ia, ib, ga, gb });

      if (isA) {
        console.log(ga, ia);

        unionContour.push(choppedA[ga][ia]);

        ia = (ia + 1) % choppedA[ga].length;

        const intIdx = intersections.findIndex(
          (int) => int.glyphA == ga && int.cntA == ia
        );
        if (intIdx == startPoint) {
          break;
        }
        if (intIdx != -1) {
          isA = !isA;
          ib = intersections[intIdx].cntB;
          gb = intersections[intIdx].glyphB;
          intersectionVisited[intIdx] = 1;
        }
      } else {
        unionContour.push(choppedB[gb][ib]);

        ib = (ib + 1) % choppedB[gb].length;

        const intIdx = intersections.findIndex(
          (int) => int.glyphB == gb && int.cntB == ib
        );
        if (intIdx == startPoint) {
          break;
        }

        if (intIdx != -1) {
          isA = !isA;
          ia = intersections[intIdx].cntA;
          ga = intersections[intIdx].glyphA;
          intersectionVisited[intIdx] = 1;
        }
      }
    }

    unionGlyph.push(unionContour);
  }

  return unionGlyph;
};
