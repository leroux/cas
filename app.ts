import { InputObserver } from "./observers/InputObserver";
import { PointerObserver } from "./observers/PointerObserver";

const canvas = document.getElementById("canvas") as HTMLCanvasElement;
const ctx = canvas.getContext("2d")!;

const HEIGHT = ctx.canvas.height;
const WIDTH = ctx.canvas.width;
const ORIGIN_X = WIDTH/2;
const ORIGIN_Y = HEIGHT/2;
const GRAPH_MIN = -12;
const GRAPH_MAX = 12;
const UNIT_COUNT = GRAPH_MAX - GRAPH_MIN;
const TICK_COUNT = UNIT_COUNT;
const DELTA_X = 0.1;

// x-axis
ctx.beginPath();
ctx.strokeStyle = "black";
ctx.moveTo(0, HEIGHT/2);
ctx.lineTo(WIDTH, HEIGHT/2);
ctx.stroke();

const tick_x = WIDTH / TICK_COUNT;
for (let i=0; i<=TICK_COUNT; i++) {
    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.moveTo(i*tick_x, HEIGHT/2 - tick_x/2);
    ctx.lineTo(i*tick_x, HEIGHT/2 + tick_x/2);
    ctx.stroke();
}

// y-axis
ctx.beginPath();
ctx.strokeStyle = "blue";
ctx.moveTo(WIDTH/2, 0);
ctx.lineTo(WIDTH/2, HEIGHT);
ctx.stroke();

const tick_y = HEIGHT / TICK_COUNT;
for (let i=0; i<=TICK_COUNT; i++) {
    ctx.beginPath();
    ctx.strokeStyle = "blue";
    ctx.moveTo(WIDTH/2 - tick_y/2, i*tick_y);
    ctx.lineTo(WIDTH/2 + tick_y/2, i*tick_y);
    ctx.stroke();
}

type MathFunction = (x: number) => number;
interface Point {
    x: number;
    y: number;
}

const floatRange = (a: number, b: number, delta: number, precision = 1e10): number[] => {
  if (delta === 0) throw new Error("delta cannot be 0");

  const ratio = (b - a) / delta;
  if (ratio < 0) return [];

  const steps = Math.trunc(ratio * (1 + 4 * Number.EPSILON)) + 1;

  return Array.from({ length: steps }, (_, i) => 
    Math.round((a + i * delta) * precision) / precision
  );
};

function getCoordinates(fn: MathFunction, xs: number[]): Point[] {
    return xs.map((x) => ({
        x: x,
        y: fn(x),
    }));
}

function mapToComputerGraphicsCoordinates(points: Point[]): Point[] {
    // assuming origin is center
    // TODO: support non-centered origin
    const SCALING_FACTOR = WIDTH / TICK_COUNT;
    // TODO: y_scale & x_scale
    return points.map((point) => ({
        x: point.x * SCALING_FACTOR + ORIGIN_X,
        y: -point.y * SCALING_FACTOR + ORIGIN_Y,
    }));
}

function plot(fn: MathFunction, start: number, stop: number, delta: number): void {
    const points = getCoordinates(fn, floatRange(start, stop, delta));
    const mappedPoints = mapToComputerGraphicsCoordinates(points);

    const [first, ...rest] = mappedPoints;
    if (!first) return;

    ctx.beginPath();
    ctx.strokeStyle = "black";
    ctx.moveTo(first.x, first.y);

    for (const [i, point] of rest.entries()) {
        if (!point) continue;
        console.log("cartesian: ", points[i], "cg: ", point);
        // ctx.fillRect(point.x, point.y, 3, 3);
        ctx.lineTo(point.x, point.y);
    }
    ctx.stroke();
}

// cap max width of the input element
const input = document.querySelector<HTMLInputElement>("#input");
const resizeObserver = new ResizeObserver(() => {
  input!.style.maxWidth = `${canvas.offsetWidth}px`;
});
resizeObserver.observe(canvas);

const inputObserver = new InputObserver((value) => {
    console.log(value);
    try {
        plot((x) => eval(value), GRAPH_MIN, GRAPH_MAX, DELTA_X);
    } catch (e) {
        if ((e instanceof SyntaxError) || // eg. "2*x + "
            (e instanceof ReferenceError)) { // eg. "2*x + f"
            console.log(e)
        } else {
            throw e
        }
    }
});
inputObserver.observe(input!);
plot(x => x, GRAPH_MIN, GRAPH_MAX, DELTA_X);
plot(x => Math.sin(x), GRAPH_MIN, GRAPH_MAX, DELTA_X);


const pointerObserver = new PointerObserver(({ type, x, y }) => {
  console.log("Pointer:", type, x, y); // LOG
  if (type === "start") {
    ctx.beginPath();
    ctx.strokeStyle = "red";
    ctx.moveTo(x, y);
  } else if (type === "move") {
    ctx.lineTo(x, y);
    ctx.stroke();
  }
});
pointerObserver.observe(canvas);
