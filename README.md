# 🎃 Gourd Intentions

**The to-do list where your ignored tasks rot… and come back to haunt you.**

**▶ Try it: https://gourd-intentions.vercel.app**

Everyone has good intentions. Gourd Intentions makes procrastination visible, and a little bit spooky.

## How it works

1. **Plant a task.** Type what you're avoiding, pick a deadline (in 1 hour, tonight, tomorrow, 3 days, next week, or *someday 🙃*), and a fresh pumpkin appears in your patch.
2. **Watch it ripen.** As the deadline gets closer, your pumpkin changes:

| Stage | When | What you see |
|---|---|---|
| 🎃 Fresh | plenty of time | smooth, shiny, "suspiciously calm" |
| 😀 Carved | getting closer | a glowing jack-o'-lantern face |
| 😰 Worried | soon | worried eyebrows, wobbly mouth, a sweat drop |
| 😡 Furious | due any minute | angry brows, flickering fire, shaking |
| 🤢 Rotting | overdue | drooping, mouldy, flies, stink lines |
| 👻 Ghost | overdue by a day | it leaves the patch and **haunts you** |

3. **Get haunted.** Ghosts float above your patch and pop up to roast you about the task. Pick their attitude: **👵 Gentle Grandma**, **💅 Sassy** or **🔥 Unhinged**. Try to make an excuse and the ghost will reject it.
4. **Bake a pie.** Finish a task and the pumpkin is baked into a 🥧 on your pie shelf (marked *on time ✨* or *late, still tasty*). Or give up and smash it. 💀

## Features
- Real, useful to-do list: deadlines, most-urgent-first sorting, and "due in / overdue by" times
- Hand-drawn SVG pumpkins with a different face for every stage, and a slightly different shape for each pumpkin
- Floating ghosts with roasts, rejected excuses and a "wooo" sound effect
- 🕰️ **Time machine:** jump ahead +1 hour, +6 hours or +1 day to watch your tasks rot (great for demos)
- Sound effects made with the Web Audio API (no audio files), with a mute button
- Saves your patch in your browser (localStorage). No account, no server.
- Works on phones, keyboard-friendly, and respects "reduce motion"

## Run it

```bash
npm install
npm run dev     # http://localhost:5173
npm test        # unit tests for the rot logic (Vitest)
npm run build
```

## Tech

React 19 · TypeScript · Vite · SVG · Web Audio API · Vitest. Built for **Pumpkin Playground** (ACM Long Beach) with the help of Claude Code.

## Project structure

- `src/lib/rot.ts`: the life cycle (fresh → ghost), deadlines, roasts, excuses, stats
- `src/components/Pumpkin.tsx`: the SVG pumpkin (every stage) and ghost
- `src/lib/sound.ts`: tiny synthesized sound effects
- `src/lib/store.ts`: saving to localStorage
- `src/App.tsx`: the patch, ghosts, pie shelf and time machine
