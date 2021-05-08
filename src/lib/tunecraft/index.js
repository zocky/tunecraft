import { processTree } from "./TunecraftProcessor";
import { scheduleTree } from "./TunecraftScheduler";
import parser from "./tunecraft.pegjs";

export function parse(code) {
  return parser.parse(code);
}

export function process(parsed) {
  return processTree(parsed);
}

export function schedule(processed) {
  return scheduleTree(processed);
}

export function compile(code) {
  return schedule(process(parse(code)));
}

export const Tunecraft = { parse, process, compile }