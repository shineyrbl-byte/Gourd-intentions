export const HOUR = 60 * 60 * 1000;
export const DAY = 24 * HOUR;

export type Stage = "fresh" | "carved" | "worried" | "angry" | "rotting" | "ghost";
export type Spice = "gentle" | "sassy" | "unhinged";

export interface Task {
  id: string;
  text: string;
  createdAt: number;
  /** null = "someday": it rots slowly with age instead of by deadline. */
  dueAt: number | null;
  doneAt?: number;
  abandonedAt?: number;
  seed: number; // keeps each pumpkin's shape and spot in the patch stable
}

/** How long a "someday" task lasts before it counts as overdue. */
export const SOMEDAY_LIFE = 7 * DAY;
/** How long a task can be overdue before the pumpkin gives up and becomes a ghost. */
export const GHOST_AFTER = 1 * DAY;

export function deadlineOf(t: Task) {
  return t.dueAt ?? t.createdAt + SOMEDAY_LIFE;
}

/** 0 = just planted, 1 = due now, > 1 = overdue. */
export function ripeness(t: Task, now: number) {
  const span = Math.max(HOUR / 4, deadlineOf(t) - t.createdAt);
  return (now - t.createdAt) / span;
}

export function stageOf(t: Task, now: number): Stage {
  const deadline = deadlineOf(t);
  if (now >= deadline + GHOST_AFTER) return "ghost";
  if (now >= deadline) return "rotting";
  const p = ripeness(t, now);
  if (p < 0.4) return "fresh";
  if (p < 0.7) return "carved";
  if (p < 0.9) return "worried";
  return "angry";
}

/** 0 → 1 inside the rotting stage, used to make the rot get visibly worse. */
export function rotAmount(t: Task, now: number) {
  return Math.max(0, Math.min(1, (now - deadlineOf(t)) / GHOST_AFTER));
}

export const STAGE_INFO: Record<Stage, { label: string; mood: string }> = {
  fresh: { label: "Fresh", mood: "Plenty of time. Suspiciously calm." },
  carved: { label: "Carved", mood: "It's watching you now." },
  worried: { label: "Worried", mood: "Sweating. Pumpkins can sweat." },
  angry: { label: "Furious", mood: "Due very soon. It is NOT happy." },
  rotting: { label: "Rotting", mood: "Overdue. Flies have been notified." },
  ghost: { label: "Ghost", mood: "It died waiting. Now it haunts you." },
};

const ORDER: Stage[] = ["ghost", "rotting", "angry", "worried", "carved", "fresh"];
/** Most urgent first; ties broken by deadline. */
export function byUrgency(now: number) {
  return (a: Task, b: Task) => ORDER.indexOf(stageOf(a, now)) - ORDER.indexOf(stageOf(b, now)) || deadlineOf(a) - deadlineOf(b);
}

export function timeLeft(t: Task, now: number) {
  const ms = deadlineOf(t) - now;
  const abs = Math.abs(ms);
  const s =
    abs < HOUR ? `${Math.max(1, Math.round(abs / 60000))} min` : abs < 2 * DAY ? `${Math.round(abs / HOUR)} h` : `${Math.round(abs / DAY)} days`;
  return ms >= 0 ? `due in ${s}` : `overdue by ${s}`;
}

/* ───────── The ghost's lines ───────── */

const ROASTS: Record<Spice, string[]> = {
  gentle: [
    "Hello dear! Just a little reminder about \"{task}\". No pressure! (A little pressure.)",
    "\"{task}\" misses you, sweetheart. Have you eaten? Then do \"{task}\".",
    "I knitted you a scarf while I waited for \"{task}\". It's very long now.",
    "You're doing your best, love. Your best just doesn't include \"{task}\" yet.",
    "I'm not angry about \"{task}\". I'm just… a ghost now. That's all.",
  ],
  sassy: [
    "\"{task}\" has been rotting longer than your last situationship.",
    "Oh, you're on your phone? Bold choice with \"{task}\" still out here.",
    "I died waiting for \"{task}\". Literally. Look at me.",
    "\"{task}\"? Never heard of her. Oh wait, I AM her.",
    "You said \"{task}\" would take five minutes. That was a week ago, bestie.",
    "Even the flies finished their to-do list. Have you done \"{task}\"?",
  ],
  unhinged: [
    "I AM THE GHOST OF \"{TASK}\". I HAVE SEEN YOUR SCREEN TIME.",
    "\"{TASK}\". \"{TASK}\". \"{TASK}\". I will say it until the sun burns out.",
    "I have rotted. I have died. I have RISEN. \"{task}\" is STILL NOT DONE.",
    "Every time you open TikTok, a pumpkin dies. I was that pumpkin. \"{task}\".",
    "I'm going to haunt your group chat. I'll tell them about \"{task}\".",
    "BOO. That was a scare. Do you know what's scarier? \"{task}\" being overdue.",
  ],
};

const EXCUSES = [
  "My dog ate my motivation.",
  "Mercury is in retrograde.",
  "I was emotionally preparing to start.",
  "I'll do it after this one episode.",
  "I work better under pressure. Any minute now.",
  "I was researching productivity apps.",
  "The vibes were off.",
  "I'm waiting for a sign from the universe.",
  "I had to reorganise my desk first.",
  "It's technically still Monday somewhere.",
];

const REJECTIONS = [
  "Rejected. I'm a ghost, and even I can see through that.",
  "Spooky. Not as spooky as your deadline, though.",
  "Interesting. Write that down… right after you do the task.",
  "I've heard that one 47 times. I'm counting. I have nothing else to do.",
  "Denied. Excuse returned to sender. 📮",
];

/** Small deterministic random so a given seed always gives the same line. */
export function pick<T>(list: T[], seed: number) {
  return list[Math.abs(Math.floor(seed)) % list.length];
}

export function roast(task: Task, spice: Spice, n: number) {
  const line = pick(ROASTS[spice], task.seed + n);
  return line.replaceAll("{task}", task.text).replaceAll("{TASK}", task.text.toUpperCase());
}

export function excuseExchange(n: number) {
  return { excuse: pick(EXCUSES, n * 7 + 3), reply: pick(REJECTIONS, n) };
}

/* ───────── Stats ───────── */

export function stats(tasks: Task[], now: number) {
  const done = tasks.filter((t) => t.doneAt);
  const onTime = done.filter((t) => t.doneAt! <= deadlineOf(t));
  const ghosts = tasks.filter((t) => !t.doneAt && !t.abandonedAt && stageOf(t, now) === "ghost");
  return { pies: done.length, onTime: onTime.length, ghosts: ghosts.length, abandoned: tasks.filter((t) => t.abandonedAt).length };
}

/* ───────── Starter patch ───────── */

export function samplePatch(now: number): Task[] {
  const mk = (text: string, ageH: number, dueInH: number | null, seed: number): Task => ({
    id: `sample-${seed}`,
    text,
    createdAt: now - ageH * HOUR,
    dueAt: dueInH === null ? null : now + dueInH * HOUR,
    seed,
  });
  return [
    mk("Email my professor back", 72, -30, 11),
    mk("Do laundry (week 3)", 100, -6, 23),
    mk("Start the essay", 46, 2, 37),
    mk("Call mom", 30, 10, 41),
    mk("Return library book", 10, 40, 53),
    mk("Go to the gym", 1, null, 67),
    mk("Carve an actual pumpkin", 2, 70, 79),
  ];
}
