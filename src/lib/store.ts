import { samplePatch, type Spice, type Task } from "./rot";

const KEY = "gi.tasks.v1";

export function loadTasks(now: number): Task[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as Task[];
  } catch {
    // Broken data: start again with the sample patch.
  }
  return samplePatch(now);
}

export const saveTasks = (tasks: Task[]) => localStorage.setItem(KEY, JSON.stringify(tasks));

export const loadSpice = (): Spice => (localStorage.getItem("gi.spice") as Spice) || "sassy";
export const saveSpice = (s: Spice) => localStorage.setItem("gi.spice", s);

/** Demo time travel: how far ahead of real time the patch is. */
export const loadOffset = () => Number(localStorage.getItem("gi.offset")) || 0;
export const saveOffset = (ms: number) => localStorage.setItem("gi.offset", String(ms));
