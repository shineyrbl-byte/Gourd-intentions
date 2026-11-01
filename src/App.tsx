import { useEffect, useMemo, useRef, useState } from "react";
import { Ghost, Pumpkin } from "./components/Pumpkin";
import { byUrgency, DAY, excuseExchange, HOUR, roast, rotAmount, samplePatch, STAGE_INFO, stageOf, stats, timeLeft, type Spice, type Task } from "./lib/rot";
import { isMuted, setMuted, sounds } from "./lib/sound";
import { loadOffset, loadSpice, loadTasks, saveOffset, saveSpice, saveTasks } from "./lib/store";

const SPICES: { id: Spice; label: string }[] = [
  { id: "gentle", label: "👵 Gentle Grandma" },
  { id: "sassy", label: "💅 Sassy" },
  { id: "unhinged", label: "🔥 Unhinged" },
];

const DEADLINES: { label: string; at: (now: number) => number | null }[] = [
  { label: "In 1 hour", at: (n) => n + HOUR },
  {
    label: "Tonight",
    at: (n) => {
      const d = new Date(n);
      d.setHours(23, 59, 0, 0);
      return d.getTime() > n + HOUR ? d.getTime() : n + 3 * HOUR;
    },
  },
  { label: "Tomorrow", at: (n) => n + DAY },
  { label: "In 3 days", at: (n) => n + 3 * DAY },
  { label: "Next week", at: (n) => n + 7 * DAY },
  { label: "Someday 🙃", at: () => null },
];

export default function App() {
  const [offset, setOffset] = useState(loadOffset);
  const [real, setReal] = useState(() => Date.now());
  const now = real + offset;
  const [tasks, setTasks] = useState<Task[]>(() => loadTasks(Date.now() + loadOffset()));
  const [spice, setSpice] = useState<Spice>(loadSpice);
  const [muted, setMutedState] = useState(isMuted);
  const [open, setOpen] = useState<string | null>(null); // which ghost's speech bubble is open
  const [toast, setToast] = useState("");

  useEffect(() => {
    const t = setInterval(() => setReal(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => saveTasks(tasks), [tasks]);
  useEffect(() => saveOffset(offset), [offset]);
  useEffect(() => saveSpice(spice), [spice]);

  const active = useMemo(() => tasks.filter((t) => !t.doneAt && !t.abandonedAt).sort(byUrgency(now)), [tasks, now]);
  const patch = active.filter((t) => stageOf(t, now) !== "ghost");
  const ghosts = active.filter((t) => stageOf(t, now) === "ghost");
  const pies = tasks.filter((t) => t.doneAt).sort((a, b) => b.doneAt! - a.doneAt!);
  const s = stats(tasks, now);

  // A ghost "wooo"s when it first appears.
  const knownGhosts = useRef(new Set(ghosts.map((g) => g.id)));
  useEffect(() => {
    const fresh = ghosts.filter((g) => !knownGhosts.current.has(g.id));
    if (fresh.length) {
      sounds.ghost();
      say(`👻 "${fresh[0].text}" has become a ghost.`);
    }
    knownGhosts.current = new Set(ghosts.map((g) => g.id));
  }, [ghosts.map((g) => g.id).join()]); // eslint-disable-line react-hooks/exhaustive-deps

  const toastTimer = useRef(0);
  function say(msg: string) {
    setToast(msg);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(""), 3500);
  }

  const update = (id: string, patchFields: Partial<Task>) => setTasks((all) => all.map((t) => (t.id === id ? { ...t, ...patchFields } : t)));
  const bake = (t: Task) => {
    update(t.id, { doneAt: now });
    sounds.pie();
    setOpen(null);
    say(`🥧 "${t.text}" was baked into a pie!`);
  };
  const smash = (t: Task) => {
    update(t.id, { abandonedAt: now });
    sounds.splat();
    setOpen(null);
    say(`💀 You let "${t.text}" go. It's at peace now. Probably.`);
  };

  const travel = (ms: number) => {
    sounds.tick();
    setOffset((o) => (ms === 0 ? 0 : o + ms));
  };

  return (
    <div className="app">
      <Leaves />
      <header className="top">
        <div>
          <h1 className="logo">
            <span aria-hidden>🎃</span> Gourd Intentions
          </h1>
          <p className="tagline">The to-do list where ignored tasks rot… and come back to haunt you.</p>
        </div>
        <div className="top-controls">
          <label className="spice">
            <span>Ghost attitude</span>
            <select value={spice} onChange={(e) => setSpice(e.target.value as Spice)}>
              {SPICES.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.label}
                </option>
              ))}
            </select>
          </label>
          <button
            className="icon-btn"
            aria-pressed={!muted}
            onClick={() => {
              setMuted(!muted);
              setMutedState(!muted);
            }}
          >
            {muted ? "🔇 Sound off" : "🔊 Sound on"}
          </button>
        </div>
      </header>

      <PlantForm
        onPlant={(text, dueAt) => {
          setTasks((all) => [...all, { id: crypto.randomUUID(), text, createdAt: now, dueAt, seed: Math.floor(Math.random() * 1000) }]);
          sounds.plant();
          say(`🌱 Planted "${text}". It's fresh… for now.`);
        }}
        now={now}
      />

      <div className="stats" aria-label="Your patch at a glance">
        <span>🎃 <b>{patch.length}</b> growing</span>
        <span>👻 <b>{ghosts.length}</b> {ghosts.length === 1 ? "ghost" : "ghosts"} haunting you</span>
        <span>🥧 <b>{s.pies}</b> {s.pies === 1 ? "pie" : "pies"} baked ({s.onTime} on time)</span>
        {s.abandoned > 0 && <span>💀 <b>{s.abandoned}</b> let go</span>}
      </div>

      <section className="scene" aria-label="Your pumpkin patch">
        <div className="sky" aria-hidden>
          <div className="moon" />
          <div className="stars" />
        </div>

        {ghosts.map((g, i) => (
          <FloatingGhost
            key={g.id}
            task={g}
            index={i}
            spice={spice}
            open={open === g.id}
            onToggle={() => setOpen(open === g.id ? null : g.id)}
            onDone={() => bake(g)}
            onLetGo={() => smash(g)}
          />
        ))}

        <div className="fence" aria-hidden />
        {patch.length === 0 && ghosts.length === 0 ? (
          <div className="empty">
            <p>🌾 Your patch is empty. Either you're incredibly productive, or you haven't planted anything yet.</p>
          </div>
        ) : (
          <ul className="patch">
            {patch.map((t) => (
              <PumpkinTile key={t.id} task={t} now={now} onDone={() => bake(t)} onSmash={() => smash(t)} />
            ))}
          </ul>
        )}
      </section>

      {ghosts.length > 0 && (
        <section className="haunt-list" aria-label="Ghosts haunting you">
          <h2>👻 Haunting you</h2>
          <ul>
            {ghosts.map((g) => (
              <li key={g.id}>
                <b>{g.text}</b> <span className="muted">({timeLeft(g, now)})</span>
                <button className="mini" onClick={() => setOpen(g.id)}>Talk to it</button>
                <button className="mini good" onClick={() => bake(g)}>✅ Did it</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="shelf" aria-label="Pie shelf">
        <h2>🥧 Pie shelf <span className="muted">· every finished task becomes a pie</span></h2>
        {pies.length === 0 ? (
          <p className="muted">No pies yet. Finish a task to bake your first one.</p>
        ) : (
          <ul className="pies">
            {pies.slice(0, 18).map((p) => {
              const late = p.dueAt !== null && p.doneAt! > p.dueAt;
              return (
                <li key={p.id} title={`${p.text}${late ? " (a little late)" : " (on time!)"}`}>
                  <span className="pie" aria-hidden>🥧</span>
                  <span className="pie-label">{p.text}</span>
                  <span className={late ? "late" : "ontime"}>{late ? "late, still tasty" : "on time ✨"}</span>
                  <button className="mini" onClick={() => update(p.id, { doneAt: undefined })} aria-label={`Un-bake ${p.text}`}>
                    ↩
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <TimeMachine now={now} offset={offset} onTravel={travel} />

      <footer className="foot">
        <button
          className="mini"
          onClick={() => {
            setTasks(samplePatch(now));
            setOpen(null);
            say("🌱 Replanted the sample patch.");
          }}
        >
          Reset to sample patch
        </button>
        <button
          className="mini"
          onClick={() => {
            setTasks([]);
            say("🧹 Patch cleared. A fresh start!");
          }}
        >
          Clear everything
        </button>
        <span className="muted">Made for Pumpkin Playground 🎃 Your tasks are saved only in this browser.</span>
      </footer>

      <div className={`toast ${toast ? "show" : ""}`} role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}

/* ───────── Planting ───────── */

function PlantForm({ onPlant, now }: { onPlant: (text: string, dueAt: number | null) => void; now: number }) {
  const [text, setText] = useState("");
  const [when, setWhen] = useState(2);
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = text.trim();
    if (!clean) return;
    onPlant(clean.slice(0, 60), DEADLINES[when].at(now));
    setText("");
  };
  return (
    <form className="plant" onSubmit={submit}>
      <label htmlFor="task" className="plant-label">
        What are you avoiding?
      </label>
      <div className="plant-row">
        <input id="task" value={text} onChange={(e) => setText(e.target.value)} placeholder="e.g. Start the essay" maxLength={60} autoComplete="off" />
        <button className="btn primary" type="submit" disabled={!text.trim()}>
          🌱 Plant it
        </button>
      </div>
      <fieldset className="when">
        <legend>Due</legend>
        {DEADLINES.map((d, i) => (
          <label key={d.label} className={`chip ${when === i ? "on" : ""}`}>
            <input type="radio" name="when" checked={when === i} onChange={() => setWhen(i)} />
            {d.label}
          </label>
        ))}
      </fieldset>
    </form>
  );
}

/* ───────── A pumpkin in the patch ───────── */

function PumpkinTile({ task, now, onDone, onSmash }: { task: Task; now: number; onDone: () => void; onSmash: () => void }) {
  const stage = stageOf(task, now);
  const info = STAGE_INFO[stage];
  return (
    <li className={`tile stage-${stage}`}>
      <div className="tile-art">
        <Pumpkin stage={stage} rot={rotAmount(task, now)} seed={task.seed} size={118} />
      </div>
      <div className="sign">
        <b className="task-text">{task.text}</b>
        <span className={`when-left ${stage === "rotting" ? "over" : ""}`}>{timeLeft(task, now)}</span>
        <span className="stage-chip">
          {info.label} · <span className="muted">{info.mood}</span>
        </span>
      </div>
      <div className="tile-actions">
        <button className="mini good" onClick={onDone} aria-label={`Done: ${task.text}. Bake it into a pie`}>
          ✅ Done → 🥧
        </button>
        <button className="mini" onClick={onSmash} aria-label={`Give up on ${task.text}`}>
          💀 Give up
        </button>
      </div>
    </li>
  );
}

/* ───────── Ghosts ───────── */

function FloatingGhost({
  task,
  index,
  spice,
  open,
  onToggle,
  onDone,
  onLetGo,
}: {
  task: Task;
  index: number;
  spice: Spice;
  open: boolean;
  onToggle: () => void;
  onDone: () => void;
  onLetGo: () => void;
}) {
  const [n, setN] = useState(0);
  const [excuse, setExcuse] = useState<{ excuse: string; reply: string } | null>(null);
  const [peek, setPeek] = useState(false);

  // Every so often the ghost pipes up on its own.
  useEffect(() => {
    const t = setInterval(() => {
      if (Math.random() < 0.45) {
        setN((x) => x + 1);
        setPeek(true);
        setTimeout(() => setPeek(false), 4500);
      }
    }, 9000 + index * 2300);
    return () => clearInterval(t);
  }, [index]);

  const line = roast(task, spice, n);
  const lane = [12, 62, 34, 80, 22, 50][index % 6];
  return (
    <div className={`ghost float-${index % 3} ${lane < 30 ? "edge-left" : lane > 70 ? "edge-right" : ""}`} style={{ left: `${lane}%`, top: `${14 + (index % 3) * 22}px` }}>
      {(open || peek) && (
        <div className="bubble" role={open ? "dialog" : undefined} aria-label={open ? `Ghost of ${task.text}` : undefined}>
          <p className="bubble-title">Ghost of "{task.text}"</p>
          <p>{excuse ? <><i>You: "{excuse.excuse}"</i><br />👻 {excuse.reply}</> : line}</p>
          {open && (
            <div className="bubble-actions">
              <button className="mini good" onClick={onDone}>✅ Fine, I did it</button>
              <button
                className="mini"
                onClick={() => {
                  setExcuse(excuseExchange(n + Math.floor(Math.random() * 10)));
                  setN((x) => x + 1);
                }}
              >
                🙄 Make an excuse
              </button>
              <button
                className="mini"
                onClick={() => {
                  setExcuse(null);
                  setN((x) => x + 1);
                  sounds.ghost();
                }}
              >
                🗣️ Roast me again
              </button>
              <button className="mini" onClick={onLetGo}>💀 Let it go</button>
            </div>
          )}
        </div>
      )}
      <button className="ghost-btn" onClick={onToggle} aria-expanded={open} aria-label={`Ghost of ${task.text}. ${open ? "Close" : "Talk to it"}`}>
        <Ghost size={84} />
      </button>
    </div>
  );
}

/* ───────── Time machine (for demos) ───────── */

function TimeMachine({ now, offset, onTravel }: { now: number; offset: number; onTravel: (ms: number) => void }) {
  const ahead = offset >= DAY ? `${Math.round(offset / DAY)} day(s)` : `${Math.round(offset / HOUR)} hour(s)`;
  return (
    <aside className="time-machine" aria-label="Time machine">
      <p>
        <b>🕰️ Time machine</b>{" "}
        <span className="muted">
          {new Date(now).toLocaleString(undefined, { weekday: "short", hour: "numeric", minute: "2-digit" })}
          {offset > 0 && ` · ${ahead} in the future`}
        </span>
      </p>
      <div className="tm-buttons">
        <button className="mini" onClick={() => onTravel(HOUR)}>+1 hour</button>
        <button className="mini" onClick={() => onTravel(6 * HOUR)}>+6 hours</button>
        <button className="mini" onClick={() => onTravel(DAY)}>+1 day</button>
        {offset > 0 && <button className="mini" onClick={() => onTravel(0)}>Back to now</button>}
      </div>
    </aside>
  );
}

function Leaves() {
  return (
    <div className="leaves" aria-hidden>
      {["🍂", "🍁", "🍂", "🍁", "🍂", "🍁", "🍂"].map((l, i) => (
        <span key={i} style={{ left: `${8 + i * 13}%`, animationDelay: `${i * 2.1}s`, animationDuration: `${11 + (i % 3) * 3}s` }}>
          {l}
        </span>
      ))}
    </div>
  );
}
