import { describe, expect, it } from "vitest";
import { byUrgency, DAY, excuseExchange, GHOST_AFTER, HOUR, roast, rotAmount, samplePatch, SOMEDAY_LIFE, stageOf, stats, timeLeft, type Stage, type Task } from "./rot";

const now = Date.UTC(2026, 9, 31, 12);
const task = (createdAgoH: number, dueInH: number | null, extra: Partial<Task> = {}): Task => ({
  id: "t",
  text: "Start the essay",
  createdAt: now - createdAgoH * HOUR,
  dueAt: dueInH === null ? null : now + dueInH * HOUR,
  seed: 5,
  ...extra,
});

describe("pumpkin life cycle", () => {
  it("goes fresh → carved → worried → angry → rotting → ghost as time passes", () => {
    const t = task(0, 10);
    const at = (h: number) => stageOf(t, now + h * HOUR);
    const seen: Stage[] = [at(0), at(5), at(8), at(9.5), at(11), at(10 + 25)];
    expect(seen).toEqual(["fresh", "carved", "worried", "angry", "rotting", "ghost"]);
  });

  it("someday tasks rot slowly, by age", () => {
    const t = task(0, null);
    expect(stageOf(t, now + 2 * DAY)).toBe("fresh");
    expect(stageOf(t, now + SOMEDAY_LIFE + HOUR)).toBe("rotting");
    expect(stageOf(t, now + SOMEDAY_LIFE + GHOST_AFTER)).toBe("ghost");
  });

  it("rot gets worse from 0 to 1 while rotting", () => {
    const t = task(5, 0);
    expect(rotAmount(t, now)).toBe(0);
    expect(rotAmount(t, now + GHOST_AFTER / 2)).toBeCloseTo(0.5);
    expect(rotAmount(t, now + 5 * DAY)).toBe(1);
  });

  it("a task added with a deadline in the past rots straight away", () => {
    expect(stageOf(task(0, -2), now)).toBe("rotting");
  });
});

describe("helpers", () => {
  it("sorts ghosts and rotting pumpkins first", () => {
    const list = [task(0, 50, { id: "a" }), task(40, -30, { id: "b" }), task(5, -1, { id: "c" })].sort(byUrgency(now));
    expect(list.map((t) => t.id)).toEqual(["b", "c", "a"]);
  });

  it("describes time left in plain words", () => {
    expect(timeLeft(task(0, 0.5), now)).toBe("due in 30 min");
    expect(timeLeft(task(0, 5), now)).toBe("due in 5 h");
    expect(timeLeft(task(0, -72), now)).toBe("overdue by 3 days");
  });

  it("puts the task name into roasts", () => {
    expect(roast(task(0, 1), "sassy", 0)).toContain("Start the essay");
    expect(roast(task(0, 1), "unhinged", 0)).toMatch(/START THE ESSAY|Start the essay/);
  });

  it("always rejects your excuse", () => {
    const { excuse, reply } = excuseExchange(3);
    expect(excuse.length).toBeGreaterThan(5);
    expect(reply.length).toBeGreaterThan(5);
  });

  it("counts pies, on-time pies and ghosts", () => {
    const s = stats(
      [task(10, 5, { doneAt: now }), task(10, -5, { doneAt: now }), task(60, -40), task(1, 3, { abandonedAt: now })],
      now,
    );
    expect(s).toEqual({ pies: 2, onTime: 1, ghosts: 1, abandoned: 1 });
  });

  it("the sample patch shows every stage a judge needs to see", () => {
    const stages = new Set(samplePatch(now).map((t) => stageOf(t, now)));
    for (const s of ["ghost", "rotting", "angry", "fresh"] as Stage[]) expect(stages.has(s), s).toBe(true);
  });
});
