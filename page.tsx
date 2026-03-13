"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { createClient, createAccount } from "genlayer-js";
import { studionet } from "genlayer-js/chains";

// ─────────────────────────────────────────────────────────────────────────────
//  🔧 CONFIG — PASTE YOUR CONTRACT ADDRESS HERE AFTER DEPLOYING
// ─────────────────────────────────────────────────────────────────────────────
const CONTRACT_ADDRESS = "PASTE_YOUR_CONTRACT_ADDRESS_HERE";
// ─────────────────────────────────────────────────────────────────────────────

const POLL_MS = 4000;
const WINS_NEEDED = 3;

// ── TYPES ─────────────────────────────────────────────────────────────────────
interface Creature {
  name: string;
  traits: string;
  ability: string;
  weakness: string;
}

interface RoundHistory {
  round: number;
  scenario: string;
  tactics: Record<string, string>;
  winner: string;
  verdict: string;
}

interface GameState {
  game_id: number;
  status: "waiting" | "battling" | "finished";
  players: string[];
  creatures: Record<string, Creature>;
  scores: Record<string, number>;
  current_round: number;
  current_scenario: string | null;
  tactics: Record<string, string>;
  round_winner: string | null;
  round_verdict: string | null;
  game_winner: string | null;
  history: RoundHistory[];
}

type Screen = "home" | "build" | "join" | "lobby" | "game" | "gameOver";

// ── GENLAYER HELPERS ──────────────────────────────────────────────────────────
function makeClient() {
  const account = createAccount();
  return { client: createClient({ chain: studionet, account }) };
}

async function readContract(gameId: number): Promise<GameState | null> {
  try {
    const { client } = makeClient();
    const result = await client.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      functionName: "get_game",
      args: [gameId],
    });
    if (!result) return null;
    return JSON.parse(result as string) as GameState;
  } catch { return null; }
}

async function readCount(): Promise<number> {
  try {
    const { client } = makeClient();
    const r = await client.readContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      functionName: "get_game_count",
      args: [],
    });
    return Number(r);
  } catch { return 0; }
}

async function writeContract(fn: string, args: unknown[]): Promise<boolean> {
  try {
    const { client } = makeClient();
    const hash = await client.writeContract({
      address: CONTRACT_ADDRESS as `0x${string}`,
      functionName: fn,
      args,
      leaderOnly: true,
    });
    await client.waitForTransactionReceipt({ hash, status: "ACCEPTED", retries: 60, interval: 3000 });
    return true;
  } catch { return false; }
}

// ── CREATURE SUGGESTIONS ──────────────────────────────────────────────────────
const TRAIT_SUGGESTIONS = [
  "Regenerates limbs in 10 seconds",
  "Breathes underwater and fire simultaneously",
  "Can become invisible but only when sneezing",
  "Has 400 eyes, all seeing different timelines",
  "Made entirely of solidified sound waves",
  "Teleports but always arrives slightly sideways",
  "Can eat anything including abstract concepts",
  "Grows stronger every time it's confused",
  "Communicates by vibrating at different frequencies",
  "Body temperature matches its mood — confident = volcanic",
];

const ABILITY_SUGGESTIONS = [
  "CHAOS BURST — releases pure randomness that breaks physics locally",
  "VOID STEP — phases through solid matter for 5 seconds",
  "MIND MELT — projects terrifying visions into opponents",
  "ECHO CLONE — creates 3 copies that all argue with each other",
  "GRAVITY FLIP — reverses gravity in a 10m radius",
  "TIME HICCUP — stutters time briefly in its favour",
  "BIOMASS SURGE — doubles in size by absorbing nearby matter",
  "STATIC FIELD — generates electromagnetic chaos",
];

const WEAKNESS_SUGGESTIONS = [
  "Extremely polite, will stop to apologise mid-battle",
  "Terrified of the colour beige",
  "Melts slightly when exposed to jazz music",
  "Gets distracted by anything shiny for 30 seconds",
  "Can't function below 40°C",
  "Becomes philosophical when threatened and debates instead of acting",
  "Allergic to bureaucracy and forms",
  "Loses all powers when told a terrible pun",
];

// ── ANIMATED GRADIENT BG ──────────────────────────────────────────────────────
function ArenaBg() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      {/* Base dark */}
      <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, #080818 0%, #0d0d2b 50%, #080818 100%)" }} />
      {/* Animated gradient blobs — matching GenLayer brand */}
      <div style={{
        position: "absolute", width: "70vw", height: "70vw",
        borderRadius: "50%", top: "-20vw", left: "-10vw",
        background: "radial-gradient(circle, rgba(155,106,246,0.18) 0%, transparent 70%)",
        animation: "blobDrift1 12s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", width: "50vw", height: "50vw",
        borderRadius: "50%", bottom: "-15vw", right: "-5vw",
        background: "radial-gradient(circle, rgba(17,15,255,0.15) 0%, transparent 70%)",
        animation: "blobDrift2 15s ease-in-out infinite",
      }} />
      <div style={{
        position: "absolute", width: "40vw", height: "40vw",
        borderRadius: "50%", top: "40%", left: "30%",
        background: "radial-gradient(circle, rgba(227,125,247,0.1) 0%, transparent 70%)",
        animation: "blobDrift3 18s ease-in-out infinite",
      }} />
      {/* Wave texture — subtle data waves like brand guidelines specify */}
      <svg style={{ position: "absolute", bottom: 0, left: 0, width: "100%", opacity: 0.06 }}
        viewBox="0 0 1440 200" preserveAspectRatio="none">
        <path d="M0,100 C360,160 720,40 1080,100 C1260,130 1380,80 1440,100 L1440,200 L0,200 Z"
          fill="url(#waveGrad)" />
        <path d="M0,130 C300,80 600,160 900,120 C1100,95 1300,140 1440,130 L1440,200 L0,200 Z"
          fill="url(#waveGrad)" opacity="0.5" />
        <defs>
          <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9B6AF6" />
            <stop offset="50%" stopColor="#E37DF7" />
            <stop offset="100%" stopColor="#110FFF" />
          </linearGradient>
        </defs>
      </svg>
      {/* Floating triangles — GenLayer strong mark motif */}
      {[
        { size: 30, x: 8, y: 20, op: 0.06, dur: 9 },
        { size: 18, x: 85, y: 15, op: 0.05, dur: 12 },
        { size: 24, x: 70, y: 60, op: 0.07, dur: 8 },
        { size: 14, x: 20, y: 70, op: 0.04, dur: 14 },
        { size: 20, x: 90, y: 80, op: 0.06, dur: 10 },
        { size: 12, x: 50, y: 10, op: 0.05, dur: 16 },
      ].map((t, i) => (
        <svg key={i} style={{
          position: "absolute", left: `${t.x}%`, top: `${t.y}%`,
          width: t.size, opacity: t.op,
          animation: `triFloat ${t.dur}s ease-in-out infinite`,
          animationDelay: `${i * 1.3}s`,
        }} viewBox="0 0 97.76 91.93">
          <polygon points="44.26,32.35 27.72,67.12 43.29,74.9 0,91.93 44.26,0 44.26,32.35" fill="#9B6AF6" />
          <polygon points="53.5,32.35 70.04,67.12 54.47,74.9 97.76,91.93 53.5,0 53.5,32.35" fill="#E37DF7" />
          <polygon points="48.64,43.78 58.33,62.94 48.64,67.69 39.47,62.92 48.64,43.78" fill="white" />
        </svg>
      ))}
    </div>
  );
}

// ── CREATURE CARD ─────────────────────────────────────────────────────────────
function CreatureCard({ creature, playerName, score, isMe, isWinner }: {
  creature: Creature; playerName: string; score: number; isMe: boolean; isWinner?: boolean;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.04)",
      border: `1px solid ${isWinner ? "rgba(227,125,247,0.7)" : isMe ? "rgba(155,106,246,0.4)" : "rgba(255,255,255,0.1)"}`,
      borderRadius: 16,
      padding: "1.5rem",
      display: "flex", flexDirection: "column", gap: "0.8rem",
      boxShadow: isWinner ? "0 0 40px rgba(227,125,247,0.25)" : isMe ? "0 0 20px rgba(155,106,246,0.1)" : "none",
      transition: "all 0.4s",
      flex: 1,
    }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
        <div>
          <div style={{ fontSize: "0.65rem", letterSpacing: "0.15em", color: "rgba(155,106,246,0.8)", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.2rem" }}>
            {isMe ? "YOUR CREATURE" : "OPPONENT'S CREATURE"}
          </div>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: "1.3rem", fontWeight: 800, color: "white", lineHeight: 1.1 }}>
            {creature.name}
          </div>
          <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.4)", marginTop: "0.15rem" }}>played by {playerName}</div>
        </div>
        {/* Score pips */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.3rem" }}>
          <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: "2rem", fontWeight: 900,
            background: "linear-gradient(135deg, #E37DF7, #9B6AF6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {score}
          </div>
          <div style={{ display: "flex", gap: 4 }}>
            {Array.from({ length: WINS_NEEDED }).map((_, i) => (
              <div key={i} style={{
                width: 8, height: 8, borderRadius: "50%",
                background: i < score ? "linear-gradient(135deg, #E37DF7, #9B6AF6)" : "rgba(255,255,255,0.15)",
                border: "1px solid rgba(155,106,246,0.4)",
                transition: "all 0.3s",
              }} />
            ))}
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: "rgba(155,106,246,0.2)" }} />

      {/* Traits */}
      <div>
        <div style={{ fontSize: "0.62rem", letterSpacing: "0.1em", color: "rgba(155,106,246,0.7)", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.3rem" }}>🧬 Traits</div>
        <div style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.5 }}>{creature.traits}</div>
      </div>

      {/* Ability */}
      <div style={{ background: "rgba(155,106,246,0.1)", borderRadius: 8, padding: "0.6rem 0.8rem", border: "1px solid rgba(155,106,246,0.2)" }}>
        <div style={{ fontSize: "0.62rem", letterSpacing: "0.1em", color: "rgba(227,125,247,0.9)", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.2rem" }}>⚡ Special Ability</div>
        <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.85)", fontWeight: 600 }}>{creature.ability}</div>
      </div>

      {/* Weakness */}
      <div style={{ background: "rgba(239,68,68,0.06)", borderRadius: 8, padding: "0.6rem 0.8rem", border: "1px solid rgba(239,68,68,0.15)" }}>
        <div style={{ fontSize: "0.62rem", letterSpacing: "0.1em", color: "rgba(239,68,68,0.8)", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.2rem" }}>💀 Weakness</div>
        <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.7)" }}>{creature.weakness}</div>
      </div>
    </div>
  );
}

// ── SUGGESTION PILL ───────────────────────────────────────────────────────────
function SuggestionPill({ text, onClick }: { text: string; onClick: () => void }) {
  return (
    <button onClick={onClick} style={{
      background: "rgba(155,106,246,0.1)", border: "1px solid rgba(155,106,246,0.25)",
      borderRadius: 999, padding: "0.3rem 0.75rem",
      fontSize: "0.75rem", color: "rgba(255,255,255,0.7)", cursor: "pointer",
      transition: "all 0.2s", whiteSpace: "nowrap",
    }}
      onMouseEnter={e => { (e.target as HTMLElement).style.background = "rgba(155,106,246,0.25)"; (e.target as HTMLElement).style.color = "white"; }}
      onMouseLeave={e => { (e.target as HTMLElement).style.background = "rgba(155,106,246,0.1)"; (e.target as HTMLElement).style.color = "rgba(255,255,255,0.7)"; }}
    >
      {text}
    </button>
  );
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function EvolutionArena() {
  const [screen, setScreen] = useState<Screen>("home");
  const [isJoiningMode, setIsJoiningMode] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [joinId, setJoinId] = useState("");

  // Creature builder
  const [creatureName, setCreatureName] = useState("");
  const [creatureTraits, setCreatureTraits] = useState("");
  const [creatureAbility, setCreatureAbility] = useState("");
  const [creatureWeakness, setCreatureWeakness] = useState("");

  // Game state
  const [gameId, setGameId] = useState<number | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [tactic, setTactic] = useState("");
  const [submitted, setSubmitted] = useState(false);

  // UX
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [error, setError] = useState("");
  const [showRoundResult, setShowRoundResult] = useState(false);
  const [lastResult, setLastResult] = useState<RoundHistory | null>(null);

  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevHistoryLen = useRef(0);

  // ── POLLING ───────────────────────────────────────────────────────────────
  const poll = useCallback(async () => {
    if (!gameId) return;
    const state = await readContract(gameId);
    if (!state) return;

    if (state.history.length > prevHistoryLen.current) {
      const latest = state.history[state.history.length - 1];
      prevHistoryLen.current = state.history.length;
      setLastResult(latest);
      setShowRoundResult(true);
      setSubmitted(false);
      setTactic("");
    }

    if (state.status === "finished") {
      if (pollRef.current) clearInterval(pollRef.current);
    }

    setGameState(state);
  }, [gameId]);

  useEffect(() => {
    if (gameId && (screen === "lobby" || screen === "game")) {
      poll();
      pollRef.current = setInterval(poll, POLL_MS);
      return () => { if (pollRef.current) clearInterval(pollRef.current); };
    }
  }, [gameId, screen, poll]);

  useEffect(() => {
    if (!gameState) return;
    if (gameState.status === "battling" && screen === "lobby") setScreen("game");
    if (gameState.status === "finished") setScreen("gameOver");
  }, [gameState, screen]);

  // ── ACTIONS ───────────────────────────────────────────────────────────────
  function validateCreature() {
    if (!playerName.trim()) return "Enter your name";
    if (!creatureName.trim()) return "Give your creature a name";
    if (!creatureTraits.trim()) return "Describe your creature's traits";
    if (!creatureAbility.trim()) return "Describe your creature's special ability";
    if (!creatureWeakness.trim()) return "Describe your creature's weakness";
    return null;
  }

  async function handleCreate() {
    const err = validateCreature();
    if (err) { setError(err); return; }
    setLoading(true); setError("");
    setLoadingMsg("Registering your creature in the arena...");
    try {
      const countBefore = await readCount();
      const ok = await writeContract("create_game", [
        playerName.trim(), creatureName.trim(),
        creatureTraits.trim(), creatureAbility.trim(), creatureWeakness.trim(),
      ]);
      if (!ok) throw new Error("Transaction failed");
      const newId = countBefore + 1;
      setGameId(newId);
      prevHistoryLen.current = 0;
      setScreen("lobby");
    } catch { setError("Failed to create game. Check your connection."); }
    setLoading(false);
  }

  async function handleJoin() {
    const err = validateCreature();
    if (err) { setError(err); return; }
    const id = parseInt(joinId);
    if (isNaN(id)) { setError("Enter a valid Game ID"); return; }
    setLoading(true); setError("");
    setLoadingMsg("Entering the arena...");
    try {
      const state = await readContract(id);
      if (!state) throw new Error("Game not found");
      if (state.status !== "waiting") throw new Error("This game has already started");
      if (state.players.includes(playerName.trim())) throw new Error("That name is taken in this game");

      const ok = await writeContract("join_game", [
        id, playerName.trim(), creatureName.trim(),
        creatureTraits.trim(), creatureAbility.trim(), creatureWeakness.trim(),
      ]);
      if (!ok) throw new Error("Transaction failed");
      setGameId(id);
      prevHistoryLen.current = 0;
      const newState = await readContract(id);
      if (newState) setGameState(newState);
      setScreen("game");
    } catch (e: unknown) { setError(e instanceof Error ? e.message : "Failed to join"); }
    setLoading(false);
  }

  async function handleSubmitTactic() {
    if (!tactic.trim() || !gameId) return;
    setLoading(true); setError("");
    setLoadingMsg("Filing your survival tactic with the arena...");
    try {
      const ok = await writeContract("submit_tactic", [gameId, playerName.trim(), tactic.trim()]);
      if (!ok) throw new Error("Failed");
      setSubmitted(true);
    } catch { setError("Failed to submit tactic. Try again."); }
    setLoading(false);
  }

  function reset() {
    setScreen("home"); setIsJoiningMode(false);
    setPlayerName(""); setJoinId("");
    setCreatureName(""); setCreatureTraits(""); setCreatureAbility(""); setCreatureWeakness("");
    setGameId(null); setGameState(null); setTactic(""); setSubmitted(false);
    setLoading(false); setShowRoundResult(false); setLastResult(null);
    prevHistoryLen.current = 0;
    if (pollRef.current) clearInterval(pollRef.current);
  }

  // ── SHARED STYLES ─────────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: "100%", background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(155,106,246,0.25)", borderRadius: 10,
    padding: "0.85rem 1rem", color: "white", fontSize: "0.95rem",
    fontFamily: "'Switzer', 'DM Sans', sans-serif", outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
  };

  const btnPrimary: React.CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 8,
    padding: "0.9rem 2rem", borderRadius: 10, border: "none", cursor: "pointer",
    fontFamily: "'Switzer', 'DM Sans', sans-serif", fontSize: "0.95rem",
    fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase",
    background: "linear-gradient(135deg, #9B6AF6, #E37DF7)",
    color: "white", transition: "all 0.2s",
    boxShadow: "0 4px 24px rgba(155,106,246,0.35)",
  };

  const btnSecondary: React.CSSProperties = {
    ...btnPrimary,
    background: "rgba(155,106,246,0.12)",
    border: "1px solid rgba(155,106,246,0.35)",
    boxShadow: "none",
    color: "rgba(255,255,255,0.85)",
  };

  const btnGhost: React.CSSProperties = {
    ...btnPrimary,
    background: "rgba(255,255,255,0.05)",
    border: "1px solid rgba(255,255,255,0.1)",
    boxShadow: "none",
    color: "rgba(255,255,255,0.5)",
  };

  const card: React.CSSProperties = {
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    borderRadius: 16, padding: "2rem",
    backdropFilter: "blur(10px)",
  };

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Outfit:wght@400;600;700;800;900&family=DM+Sans:ital,wght@0,400;0,500;0,600;1,400&family=DM+Mono:wght@400;500&display=swap');
        @import url('https://api.fontshare.com/v2/css?f[]=switzer@400,500,600,700,800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body { height: 100%; font-family: 'Switzer', 'DM Sans', sans-serif; }

        @keyframes blobDrift1 {
          0%,100% { transform: translate(0, 0) scale(1); }
          33%      { transform: translate(3vw, 4vh) scale(1.1); }
          66%      { transform: translate(-2vw, 2vh) scale(0.95); }
        }
        @keyframes blobDrift2 {
          0%,100% { transform: translate(0, 0) scale(1); }
          40%      { transform: translate(-4vw, -3vh) scale(1.15); }
          70%      { transform: translate(2vw, -5vh) scale(0.9); }
        }
        @keyframes blobDrift3 {
          0%,100% { transform: translate(0, 0) scale(1); }
          50%      { transform: translate(-5vw, 5vh) scale(1.2); }
        }
        @keyframes triFloat {
          0%,100% { transform: translateY(0px) rotate(0deg); }
          50%      { transform: translateY(-14px) rotate(8deg); }
        }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        @keyframes popIn    { from{opacity:0;transform:scale(0.8) translateY(20px)} to{opacity:1;transform:scale(1) translateY(0)} }
        @keyframes spin     { to{transform:rotate(360deg)} }
        @keyframes bounce   { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-7px)} }
        @keyframes glowPulse{
          0%,100%{box-shadow:0 0 0 0 rgba(155,106,246,0.4)}
          50%{box-shadow:0 0 0 10px rgba(155,106,246,0)}
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position: 200% center; }
        }

        .screen { animation: fadeUp 0.45s ease both; }
        .pop-in  { animation: popIn 0.5s cubic-bezier(0.34,1.56,0.64,1) both; }

        input:focus, textarea:focus {
          border-color: rgba(155,106,246,0.6) !important;
          box-shadow: 0 0 0 3px rgba(155,106,246,0.15) !important;
        }
        input::placeholder, textarea::placeholder { color: rgba(255,255,255,0.25); }

        .btn-primary-hover:hover { transform: translateY(-1px); box-shadow: 0 8px 32px rgba(155,106,246,0.5) !important; }
        .btn-primary-hover:active { transform: scale(0.98); }
        .btn-primary-hover { animation: glowPulse 3s ease infinite; }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: rgba(255,255,255,0.03); }
        ::-webkit-scrollbar-thumb { background: rgba(155,106,246,0.3); border-radius: 3px; }

        .gradient-text {
          background: linear-gradient(135deg, #E37DF7 0%, #9B6AF6 50%, #6B8FFF 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }

        .waiting-dot {
          display: inline-block; width: 7px; height: 7px; border-radius: 50%;
          background: linear-gradient(135deg, #9B6AF6, #E37DF7);
          animation: bounce 0.9s ease infinite;
        }
        .loader-ring {
          width: 22px; height: 22px;
          border: 2.5px solid rgba(155,106,246,0.2);
          border-top-color: #9B6AF6;
          border-radius: 50%;
          animation: spin 0.75s linear infinite;
          display: inline-block; flex-shrink: 0;
        }
      `}</style>

      <div style={{ minHeight: "100vh", color: "white", position: "relative" }}>
        <ArenaBg />

        <div style={{ position: "relative", zIndex: 1 }}>

          {/* ── HOME ──────────────────────────────────────────────────────── */}
          {screen === "home" && (
            <div className="screen" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", gap: "3rem", textAlign: "center" }}>

              {/* GenLayer logo */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", opacity: 0.7 }}>
                <img src="/logo/mark.svg" alt="GenLayer" style={{ height: 28 }} />
                <span style={{ fontSize: "0.75rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.6)" }}>GenLayer</span>
              </div>

              {/* Hero */}
              <div>
                <div style={{ fontSize: "0.75rem", letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(155,106,246,0.9)", marginBottom: "1rem", fontWeight: 700 }}>
                  ✦ AI-Powered Arena Game
                </div>
                <h1 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "clamp(3.5rem, 12vw, 8rem)", lineHeight: 0.9, letterSpacing: "-0.02em", margin: "0 0 1.5rem" }}>
                  <span className="gradient-text">EVOLUTION</span>
                  <br />
                  <span style={{ color: "white" }}>ARENA</span>
                </h1>
                <p style={{ fontSize: "clamp(1rem, 2.5vw, 1.2rem)", color: "rgba(255,255,255,0.55)", maxWidth: 480, margin: "0 auto", lineHeight: 1.7 }}>
                  Build a creature. Survive impossible scenarios.<br />
                  The AI decides who lives — first to 3 wins.
                </p>
              </div>

              {/* How it works — 3 steps, simple language */}
              <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center", maxWidth: 700 }}>
                {[
                  { icon: "🧬", step: "1", title: "Design your creature", body: "Give it a name, weird traits, a special power, and a silly weakness. Be creative — the more unique, the better!" },
                  { icon: "🌋", step: "2", title: "Face wild scenarios", body: "Each round, an AI drops your creature into a random disaster — volcano eruptions, disco tsunamis, acid rain from orbit..." },
                  { icon: "⚖️", step: "3", title: "The AI picks a winner", body: "Submit a survival plan. The AI judges both plans and picks the winner based on creativity, your creature's traits, and pure chaos." },
                ].map((s) => (
                  <div key={s.step} style={{ ...card, flex: "1 1 180px", minWidth: 160, textAlign: "left", padding: "1.25rem" }}>
                    <div style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>{s.icon}</div>
                    <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "0.85rem", color: "rgba(155,106,246,0.9)", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                      Step {s.step} · {s.title}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{s.body}</div>
                  </div>
                ))}
              </div>

              {/* Name + CTA */}
              <div style={{ ...card, width: "100%", maxWidth: 420, display: "flex", flexDirection: "column", gap: "1rem" }}>
                <label style={{ fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(155,106,246,0.8)", fontWeight: 700 }}>
                  Your Name
                </label>
                <input style={inputStyle} placeholder="e.g. DrChaos99"
                  value={playerName} onChange={e => setPlayerName(e.target.value)}
                  maxLength={24} />

                <div style={{ display: "flex", gap: "0.75rem" }}>
                  <button className="btn-primary-hover" style={{ ...btnPrimary, flex: 1 }}
                    disabled={!playerName.trim()}
                    onClick={() => { setIsJoiningMode(false); setScreen("build"); }}>
                    🧬 Create Game
                  </button>
                  <button style={{ ...btnSecondary, flex: 1 }}
                    disabled={!playerName.trim()}
                    onClick={() => { setIsJoiningMode(true); setScreen("build"); }}>
                    ⚔️ Join Game
                  </button>
                </div>

                {error && <div style={{ fontSize: "0.8rem", color: "#f87171", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "0.6rem 0.8rem" }}>{error}</div>}
              </div>

              <div style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)", letterSpacing: "0.1em", fontFamily: "'DM Mono', monospace" }}>
                Powered by GenLayer Intelligent Contracts · AI consensus on-chain
              </div>
            </div>
          )}

          {/* ── BUILD CREATURE ─────────────────────────────────────────────── */}
          {screen === "build" && (
            <div className="screen" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "2rem 1rem", gap: "1.5rem", maxWidth: 600, margin: "0 auto" }}>

              {/* Header */}
              <div style={{ textAlign: "center", paddingTop: "1rem" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.5rem" }}>🧬</div>
                <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "2.2rem", lineHeight: 1.1 }}>
                  {isJoiningMode ? "Build your creature — then join!" : "Build your creature"}
                </h2>
                <p style={{ color: "rgba(255,255,255,0.45)", marginTop: "0.5rem", fontSize: "0.9rem" }}>
                  The weirder and more creative, the better your chances. Don't hold back.
                </p>
              </div>

              {/* Game ID field (join mode only) */}
              {isJoiningMode && (
                <div style={{ ...card, width: "100%", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  <label style={{ fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(227,125,247,0.9)", fontWeight: 700 }}>
                    Game ID (ask your opponent for this)
                  </label>
                  <input style={{ ...inputStyle, fontSize: "1.5rem", textAlign: "center" }} type="number"
                    placeholder="e.g. 7" value={joinId} onChange={e => setJoinId(e.target.value)} />
                </div>
              )}

              {/* Creature form */}
              <div style={{ ...card, width: "100%", display: "flex", flexDirection: "column", gap: "1.25rem" }}>

                {/* Creature name */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{ fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(155,106,246,0.8)", fontWeight: 700 }}>
                    Creature Name
                  </label>
                  <input style={inputStyle} placeholder="e.g. The Glutinous Void-Stalker"
                    value={creatureName} onChange={e => setCreatureName(e.target.value)} maxLength={40} />
                </div>

                {/* Traits */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{ fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(155,106,246,0.8)", fontWeight: 700 }}>
                    Traits — What does your creature look like and how does it move?
                  </label>
                  <input style={inputStyle} placeholder="e.g. Has 400 eyes and teleports but always arrives sideways"
                    value={creatureTraits} onChange={e => setCreatureTraits(e.target.value)} maxLength={120} />
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {TRAIT_SUGGESTIONS.slice(0, 4).map(t => (
                      <SuggestionPill key={t} text={t} onClick={() => setCreatureTraits(t)} />
                    ))}
                  </div>
                </div>

                {/* Special ability */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{ fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(227,125,247,0.8)", fontWeight: 700 }}>
                    ⚡ Special Ability — One unique superpower
                  </label>
                  <input style={inputStyle} placeholder="e.g. CHAOS BURST — releases pure randomness that breaks local physics"
                    value={creatureAbility} onChange={e => setCreatureAbility(e.target.value)} maxLength={120} />
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {ABILITY_SUGGESTIONS.slice(0, 3).map(a => (
                      <SuggestionPill key={a} text={a.split("—")[0].trim()} onClick={() => setCreatureAbility(a)} />
                    ))}
                  </div>
                </div>

                {/* Weakness */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  <label style={{ fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(239,68,68,0.7)", fontWeight: 700 }}>
                    💀 Weakness — What will get your creature killed?
                  </label>
                  <input style={inputStyle} placeholder="e.g. Melts slightly when exposed to jazz music"
                    value={creatureWeakness} onChange={e => setCreatureWeakness(e.target.value)} maxLength={120} />
                  <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
                    {WEAKNESS_SUGGESTIONS.slice(0, 3).map(w => (
                      <SuggestionPill key={w} text={w} onClick={() => setCreatureWeakness(w)} />
                    ))}
                  </div>
                </div>
              </div>

              {error && <div style={{ width: "100%", fontSize: "0.82rem", color: "#f87171", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", borderRadius: 8, padding: "0.6rem 0.9rem" }}>{error}</div>}

              <div style={{ display: "flex", gap: "0.75rem", width: "100%" }}>
                <button style={{ ...btnGhost, flex: 1 }} onClick={() => { setError(""); setScreen("home"); }}>← Back</button>
                <button className="btn-primary-hover" style={{ ...btnPrimary, flex: 2 }}
                  disabled={loading}
                  onClick={isJoiningMode ? handleJoin : handleCreate}>
                  {loading
                    ? <><span className="loader-ring" /> {loadingMsg}</>
                    : isJoiningMode ? "⚔️ Enter the Arena" : "🧬 Create Game"
                  }
                </button>
              </div>

              <div style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.25)", textAlign: "center", lineHeight: 1.7 }}>
                Tip: your creature's weakness can actually help you — a creative weakness makes the AI's verdicts funnier and more interesting!
              </div>
            </div>
          )}

          {/* ── LOBBY ──────────────────────────────────────────────────────── */}
          {screen === "lobby" && gameId && (
            <div className="screen" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", gap: "2rem", textAlign: "center" }}>
              <div style={{ fontSize: "3.5rem", animation: "bounce 1.3s ease infinite" }}>⏳</div>
              <div>
                <h2 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "2.5rem", color: "white" }}>Waiting for opponent</h2>
                <p style={{ color: "rgba(255,255,255,0.45)", marginTop: "0.5rem" }}>
                  Share your Game ID with a friend. They'll use it when they click Join Game.
                </p>
              </div>

              <div style={{ ...card, maxWidth: 360, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem" }}>
                <div style={{ fontSize: "0.7rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(155,106,246,0.8)", fontWeight: 700 }}>Your Game ID</div>
                <div className="gradient-text" style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "5.5rem", lineHeight: 1, letterSpacing: "-0.02em" }}>
                  {gameId}
                </div>
                <button style={{ ...btnSecondary, padding: "0.5rem 1.2rem", fontSize: "0.82rem" }}
                  onClick={() => navigator.clipboard.writeText(String(gameId))}>
                  📋 Copy ID
                </button>
              </div>

              {/* Creature preview */}
              {creatureName && (
                <div style={{ ...card, maxWidth: 400, width: "100%", display: "flex", flexDirection: "column", gap: "0.6rem" }}>
                  <div style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(155,106,246,0.7)", fontWeight: 700 }}>Your Creature</div>
                  <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "1.2rem" }}>{creatureName}</div>
                  <div style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.5)" }}>{creatureTraits}</div>
                </div>
              )}

              <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "rgba(255,255,255,0.35)", fontSize: "0.82rem" }}>
                {[0, 0.2, 0.4].map(d => <span key={d} className="waiting-dot" style={{ animationDelay: `${d}s` }} />)}
                <span style={{ marginLeft: "0.5rem" }}>Checking every 4 seconds...</span>
              </div>
            </div>
          )}

          {/* ── GAME ───────────────────────────────────────────────────────── */}
          {screen === "game" && gameState && (() => {
            const myCreature = gameState.creatures[playerName];
            const opponentName = gameState.players.find(p => p !== playerName);
            const opponentCreature = opponentName ? gameState.creatures[opponentName] : null;
            return (
              <div className="screen" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", padding: "1.5rem 1rem", gap: "1.5rem", maxWidth: 800, margin: "0 auto" }}>

                {/* Nav bar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    <img src="/logo/mark.svg" alt="GenLayer" style={{ height: 22, opacity: 0.7 }} />
                    <span style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "1.1rem", letterSpacing: "0.04em" }}>
                      EVOLUTION ARENA
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
                    <span style={{ fontSize: "0.7rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(155,106,246,0.9)", background: "rgba(155,106,246,0.12)", border: "1px solid rgba(155,106,246,0.25)", padding: "0.25rem 0.6rem", borderRadius: 999, fontWeight: 700 }}>
                      Round {gameState.current_round}
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.35)", fontFamily: "'DM Mono', monospace" }}>#{gameId}</span>
                  </div>
                </div>

                {/* Creature cards */}
                <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                  {myCreature && <CreatureCard creature={myCreature} playerName={playerName} score={gameState.scores[playerName] || 0} isMe={true} />}
                  {opponentCreature && opponentName && <CreatureCard creature={opponentCreature} playerName={opponentName} score={gameState.scores[opponentName] || 0} isMe={false} />}
                </div>

                {/* Scenario */}
                {gameState.current_scenario && (
                  <div style={{
                    background: "linear-gradient(135deg, rgba(155,106,246,0.12), rgba(227,125,247,0.06))",
                    border: "1px solid rgba(155,106,246,0.25)",
                    borderLeft: "4px solid rgba(227,125,247,0.8)",
                    borderRadius: 14, padding: "1.5rem 1.75rem",
                  }}>
                    <div style={{ fontSize: "0.65rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(227,125,247,0.9)", fontWeight: 700, marginBottom: "0.6rem" }}>
                      🌋 Round {gameState.current_round} Scenario — Survive This!
                    </div>
                    <p style={{ fontSize: "1.05rem", fontWeight: 600, color: "white", lineHeight: 1.6 }}>
                      {gameState.current_scenario}
                    </p>
                  </div>
                )}

                {/* Survival tactic */}
                {!submitted ? (
                  <div style={{ ...card, display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                    <div>
                      <div style={{ fontSize: "0.72rem", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(155,106,246,0.8)", fontWeight: 700, marginBottom: "0.3rem" }}>
                        Your Survival Plan
                      </div>
                      <p style={{ fontSize: "0.82rem", color: "rgba(255,255,255,0.4)", lineHeight: 1.5 }}>
                        How does <strong style={{ color: "rgba(255,255,255,0.7)" }}>{creatureName || "your creature"}</strong> survive this scenario?
                        Use your traits and ability! Be creative, dramatic, or completely absurd.
                      </p>
                    </div>
                    <textarea
                      style={{ ...inputStyle, minHeight: 120, resize: "vertical", lineHeight: 1.6 } as React.CSSProperties}
                      placeholder="e.g. I use my CHAOS BURST ability to reverse the volcano's gravitational pull, then ride the inverted lava upward to safety while my 400 eyes watch all escape routes simultaneously..."
                      value={tactic} maxLength={350}
                      onChange={e => setTactic(e.target.value)}
                    />
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.3)", fontFamily: "'DM Mono', monospace" }}>{tactic.length}/350</span>
                      {error && <span style={{ fontSize: "0.78rem", color: "#f87171" }}>{error}</span>}
                    </div>
                    <button className="btn-primary-hover" style={{ ...btnPrimary }}
                      disabled={!tactic.trim() || loading}
                      onClick={handleSubmitTactic}>
                      {loading ? <><span className="loader-ring" /> {loadingMsg}</> : "🧬 Submit Survival Plan"}
                    </button>
                  </div>
                ) : (
                  <div style={{ ...card, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "1rem", background: "rgba(155,106,246,0.05)", border: "1px solid rgba(155,106,246,0.2)" }}>
                    <div style={{ fontSize: "2.5rem" }}>📡</div>
                    <p style={{ fontWeight: 700, fontSize: "1rem" }}>Survival plan transmitted!</p>
                    <p style={{ color: "rgba(255,255,255,0.45)", fontSize: "0.87rem" }}>
                      Waiting for your opponent to submit their plan... Then the AI Judge decides.
                    </p>
                    <div style={{ display: "flex", gap: 5 }}>
                      {[0, 0.2, 0.4].map(d => <span key={d} className="waiting-dot" style={{ animationDelay: `${d}s` }} />)}
                    </div>
                  </div>
                )}

                {/* Round history */}
                {gameState.history.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                    <div style={{ fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>Previous Rounds</div>
                    {[...gameState.history].reverse().map(h => (
                      <div key={h.round} style={{ borderLeft: "2px solid rgba(155,106,246,0.3)", paddingLeft: "1rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "rgba(255,255,255,0.3)" }}>Round {h.round}</span>
                          <span style={{ fontSize: "0.7rem", fontWeight: 700, background: "rgba(155,106,246,0.15)", border: "1px solid rgba(155,106,246,0.25)", padding: "0.15rem 0.5rem", borderRadius: 999, color: "rgba(227,125,247,0.9)" }}>
                            🏆 {h.winner}
                          </span>
                        </div>
                        <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", fontStyle: "italic" }}>"{h.verdict}"</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── GAME OVER ─────────────────────────────────────────────────── */}
          {screen === "gameOver" && gameState && (
            <div className="screen" style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "2rem 1rem", gap: "2rem", textAlign: "center" }}>

              <div style={{ fontSize: "5rem", animation: "bounce 0.9s ease infinite" }}>
                {gameState.game_winner === playerName ? "🏆" : "💀"}
              </div>

              <div>
                <div style={{ fontSize: "0.7rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(155,106,246,0.8)", fontWeight: 700, marginBottom: "0.5rem" }}>
                  Match Over
                </div>
                <h2 className={gameState.game_winner === playerName ? "gradient-text" : ""} style={{
                  fontFamily: "'Outfit', sans-serif", fontWeight: 900,
                  fontSize: "clamp(2.5rem, 9vw, 5rem)", lineHeight: 1,
                  color: gameState.game_winner === playerName ? undefined : "rgba(255,255,255,0.4)",
                }}>
                  {gameState.game_winner === playerName ? "Your creature reigns!" : `${gameState.game_winner} wins!`}
                </h2>
                <p style={{ color: "rgba(255,255,255,0.4)", marginTop: "0.6rem" }}>
                  {gameState.game_winner === playerName
                    ? "The arena bows to your magnificent creation."
                    : "Your creature gave it everything. The arena was not ready for it."}
                </p>
              </div>

              {/* Final score cards */}
              <div style={{ display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
                {gameState.players.map(p => {
                  const creature = gameState.creatures[p];
                  const isWinner = p === gameState.game_winner;
                  return (
                    <div key={p} style={{ ...card, minWidth: 180, display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", border: isWinner ? "1px solid rgba(227,125,247,0.5)" : "1px solid rgba(255,255,255,0.08)", boxShadow: isWinner ? "0 0 40px rgba(155,106,246,0.2)" : "none" }}>
                      {isWinner && <div style={{ fontSize: "1.5rem" }}>👑</div>}
                      <div style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 800, fontSize: "1.05rem" }}>{creature?.name}</div>
                      <div style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.4)" }}>played by {p}</div>
                      <div className={isWinner ? "gradient-text" : ""} style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "3.5rem", lineHeight: 1, color: isWinner ? undefined : "rgba(255,255,255,0.3)" }}>
                        {gameState.scores[p] || 0}
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em", textTransform: "uppercase" }}>rounds survived</div>
                    </div>
                  );
                })}
              </div>

              {/* Battle history */}
              {gameState.history.length > 0 && (
                <div style={{ ...card, width: "100%", maxWidth: 540, display: "flex", flexDirection: "column", gap: "0.8rem", maxHeight: 260, overflowY: "auto" }}>
                  <div style={{ fontSize: "0.65rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", fontWeight: 700 }}>
                    Full Battle History
                  </div>
                  {gameState.history.map(h => (
                    <div key={h.round} style={{ borderLeft: "2px solid rgba(155,106,246,0.3)", paddingLeft: "0.9rem" }}>
                      <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", marginBottom: "0.2rem" }}>
                        <span style={{ fontFamily: "'DM Mono', monospace", fontSize: "0.65rem", color: "rgba(255,255,255,0.3)" }}>Round {h.round}</span>
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "rgba(227,125,247,0.9)", background: "rgba(155,106,246,0.15)", border: "1px solid rgba(155,106,246,0.2)", padding: "0.1rem 0.45rem", borderRadius: 999 }}>
                          🏆 {h.winner}
                        </span>
                      </div>
                      <p style={{ fontSize: "0.78rem", color: "rgba(255,255,255,0.5)", fontStyle: "italic", lineHeight: 1.5 }}>"{h.verdict}"</p>
                    </div>
                  ))}
                </div>
              )}

              <button className="btn-primary-hover" style={{ ...btnPrimary, padding: "1rem 2.5rem", fontSize: "1rem" }} onClick={reset}>
                🧬 Play Again
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", opacity: 0.4 }}>
                <img src="/logo/mark.svg" alt="GenLayer" style={{ height: 16 }} />
                <span style={{ fontSize: "0.65rem", letterSpacing: "0.12em" }}>POWERED BY GENLAYER</span>
              </div>
            </div>
          )}

          {/* ── ROUND RESULT OVERLAY ──────────────────────────────────────── */}
          {showRoundResult && lastResult && (
            <div style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(8,8,24,0.9)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem", animation: "fadeIn 0.3s ease both" }}
              onClick={() => setShowRoundResult(false)}>
              <div className="pop-in" onClick={e => e.stopPropagation()} style={{
                width: "100%", maxWidth: 520, padding: "2.5rem",
                background: "linear-gradient(145deg, #0d0d2b, #12102a)",
                border: "1.5px solid rgba(155,106,246,0.4)",
                borderRadius: 20, textAlign: "center",
                boxShadow: "0 0 80px rgba(155,106,246,0.2), 0 40px 80px rgba(0,0,0,0.7)",
              }}>
                <div style={{ fontSize: "3rem", marginBottom: "0.5rem" }}>
                  {lastResult.winner === playerName ? "🏆" : "💀"}
                </div>
                <div style={{ fontSize: "0.65rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(155,106,246,0.8)", marginBottom: "0.4rem", fontWeight: 700 }}>
                  Round {lastResult.round} — Arena Judgment
                </div>
                <h3 style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 900, fontSize: "2.2rem", lineHeight: 1.1, marginBottom: "1.25rem" }}>
                  {lastResult.winner === playerName
                    ? <span className="gradient-text">Your creature survives!</span>
                    : <span style={{ color: "rgba(255,255,255,0.5)" }}>{lastResult.winner} survives!</span>
                  }
                </h3>

                {/* Scenario reminder */}
                <div style={{ background: "rgba(155,106,246,0.08)", border: "1px solid rgba(155,106,246,0.15)", borderRadius: 10, padding: "0.9rem 1.1rem", marginBottom: "1rem" }}>
                  <div style={{ fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(155,106,246,0.7)", fontWeight: 700, marginBottom: "0.3rem" }}>The Scenario Was</div>
                  <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.6)", lineHeight: 1.5 }}>{lastResult.scenario}</p>
                </div>

                {/* The AI verdict */}
                <div style={{ background: "rgba(227,125,247,0.06)", border: "1px solid rgba(227,125,247,0.15)", borderRadius: 10, padding: "1.1rem 1.3rem", marginBottom: "1.5rem" }}>
                  <div style={{ fontSize: "0.62rem", letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(227,125,247,0.8)", fontWeight: 700, marginBottom: "0.4rem" }}>⚖️ The AI Judge Declares</div>
                  <p style={{ fontStyle: "italic", color: "rgba(255,255,255,0.8)", lineHeight: 1.7, fontSize: "0.95rem" }}>
                    "{lastResult.verdict}"
                  </p>
                </div>

                <button className="btn-primary-hover" style={{ ...btnPrimary, width: "100%" }}
                  onClick={() => setShowRoundResult(false)}>
                  {gameState?.status === "finished" ? "See Final Results →" : "Next Round →"}
                </button>
              </div>
            </div>
          )}

          {/* Loading overlay for heavy ops */}
          {loading && screen !== "build" && screen !== "game" && (
            <div style={{ position: "fixed", inset: 0, zIndex: 200, background: "rgba(8,8,24,0.95)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "1.5rem", animation: "fadeIn 0.3s ease" }}>
              <span className="loader-ring" style={{ width: 48, height: 48, borderWidth: 4 }} />
              <p style={{ fontFamily: "'Outfit', sans-serif", fontWeight: 700, fontSize: "1.2rem",
                background: "linear-gradient(135deg, #E37DF7, #9B6AF6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {loadingMsg}
              </p>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
