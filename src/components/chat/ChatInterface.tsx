"use client";

import { useEffect, useRef, useState } from "react";
import SignupWall from "./SignupWall";
import { saveMessages } from "@/actions/conversation";

type Message = { role: "user" | "assistant"; content: string };
type WallVariant = "pattern" | "continue" | "dead";
type EducationStage = "school" | "college" | "graduating" | "graduated";

const GARBAGE_ANSWERS = new Set([
  "ok", "okay", "k", "kk", "idk", "nah", "yep", "nope", "sure",
  "fine", "yeah", "none", "dunno", "nothing", "hmm", "hm", "lol",
  "haha", "no", "yes", "y", "n", "maybe", "idc", "idek", "whatever",
]);

function isGarbageAnswer(text: string): boolean {
  const t = text.trim().toLowerCase();
  return t.length <= 2 || GARBAGE_ANSWERS.has(t);
}

const EDUCATION_OPTIONS: { value: EducationStage; label: string; sub: string }[] = [
  { value: "school",     label: "Still in school",              sub: "Figuring out what to study or aim for" },
  { value: "college",    label: "In college or university",     sub: "Mid-degree, questioning the path" },
  { value: "graduating", label: "Final year / about to finish", sub: "Graduation is close, next step unclear" },
  { value: "graduated",  label: "Already graduated",            sub: "Degree done, direction still unclear" },
];

const OPENING_BY_STAGE: Record<EducationStage, string> = {
  school:     "What's making choosing a career hard for you right now?",
  college:    "What's making it hard to figure out your career path right now?",
  graduating: "With graduation coming up, what's making the next step feel unclear?",
  graduated:  "What's making it hard to figure out your next career move?",
};

// Apostrophe-free core of each closing line the conversation prompt emits. We
// match on these (not the full sentence) so apostrophe variants the model may
// produce — straight ' or curly ’ — never break detection.
const PATTERN_TRIGGER = "starting to see a pattern";
const CONTINUE_TRIGGER = "started building a picture";
const SAFETY_MAX = 12;

const STAGES = [
  { label: "Getting to know you", upTo: 3 },
  { label: "Going deeper",        upTo: 8 },
  { label: "Finding your pattern", upTo: Infinity },
];

const OPENING_CHIPS = [
  "Too many options, I don't know where to start",
  "Scared of choosing wrong and wasting years",
  "I don't know what I'm actually good at",
  "Torn between passion and a stable income",
  "My family wants something different for me",
  "I just feel completely stuck",
];

function getChipsForMessage(text: string): string[] | null {
  const lower = text.toLowerCase();

  // Never show chips for open-ended listing questions
  if (/\b(name (every|all|the)|list (all|every|the)|what (specific|are the|career|roles|paths|options) (are|do|have)|all the options|every option|name one)\b/.test(lower)) {
    return null;
  }

  const sentences = text.split(/(?<=[.!?])\s+/).filter((s) => s.trim().length > 0);
  const last = sentences[sentences.length - 1]?.trim().toLowerCase() ?? "";

  // Motivation
  if (/\b(what draws|what drives|what pulls|what matters|what do you want.{0,30}(give|career|work)|why do you want|what appeals|what kind of (life|future)|beyond.*enjoy|what.{0,20}pull.{0,10}you|what.*motivat|motivates you more)\b/.test(lower)) {
    return ["Passion for it", "Money & security", "Freedom & flexibility", "Status & respect", "Making an impact", "Helping people"];
  }

  // Resources / access
  if (/\b(afford|connections|realistic|resources|support from|money for|can you (get|access)|path.*open|available to you|barriers|qualif|background|family (help|support|pull)|need.{0,20}(money|connections|contacts)|accessible|costs or)\b/.test(lower)) {
    return ["No, it's not realistic right now", "I have support", "Money is tight", "Need connections I don't have", "Not sure yet"];
  }

  // Fear / wrong choice
  if (/\b(wrong (choice|career|path)|regret|what.*lose|what.*cost|if you picked|if (it|this) (fails|doesn't work)|what worries|what scares|what.*hesitat|what would you (lose|miss)|picking wrong|risking or losing)\b/.test(lower)) {
    return ["Wasting years", "Disappointing my family", "Not being good enough", "Trying is better than nothing", "Missing a better path"];
  }

  // Experience
  if (/\b(tried|have you done|done anything|any experience|ever (done|tried|worked|studied)|internship|outside of (just|only)|hands.?on)\b/.test(lower)) {
    return ["Yes, a bit", "Never tried it", "Only in theory", "Seen someone else do it"];
  }

  // Yes/No — last sentence only
  if (/^(have you|did you|do you|were you|would you|has there|is there|was there|can you)\b/.test(last)) {
    return ["Yes", "Sort of", "Not really"];
  }

  // Scale
  if (/^(how much|how often)\b/.test(last)) {
    return ["A lot", "A little", "Not at all"];
  }

  if (/\b(torn between|confused between|part of me|on one hand|but also|can't decide|stuck between)\b/.test(lower)) {
    return [
      "Creativity vs stability",
      "Money vs meaning",
      "Freedom vs security",
      "Interest vs confidence",
      "Passion vs family expectations",
    ];
  }

  return null;
}

function StageRing({ stageIndex }: { stageIndex: number }) {
  const size = 40;
  const sw = 3.5;
  const r = (size - sw) / 2;
  const circ = 2 * Math.PI * r;
  const segLen = (112 / 360) * circ;
  const starts = [-90, 30, 150];

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {starts.map((rot, i) => (
        <circle
          key={i}
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={i <= stageIndex ? "#7c3aed" : "#e7e5e4"}
          strokeWidth={sw}
          strokeDasharray={`${segLen} ${circ - segLen}`}
          strokeLinecap="round"
          style={{
            transform: `rotate(${rot}deg)`,
            transformOrigin: `${size / 2}px ${size / 2}px`,
            transition: "stroke 0.6s ease",
          }}
        />
      ))}
      <text
        x={size / 2}
        y={size / 2 + 0.5}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="11"
        fontWeight="700"
        fill="#7c3aed"
        fontFamily="inherit"
      >
        {stageIndex + 1}/3
      </text>
    </svg>
  );
}

export default function ChatInterface() {
  const [educationStage, setEducationStage] = useState<EducationStage | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [wallVariant, setWallVariant] = useState<WallVariant | null>(null);
  const [error, setError] = useState<string | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const sessionIdRef = useRef("");
  const conversationIdRef = useRef<string | null>(null);
  const garbageStreakRef = useRef(0);

  useEffect(() => {
    const navEntry = performance?.getEntriesByType?.("navigation")?.[0] as PerformanceNavigationTiming | undefined;
    const isReturning = navEntry?.type === "back_forward" || navEntry?.type === "reload";

    let id = sessionStorage.getItem("ccc_session_id");

    if (!isReturning || !id) {
      id = crypto.randomUUID();
      sessionStorage.setItem("ccc_session_id", id);
      sessionStorage.removeItem("ccc_messages");
      sessionStorage.removeItem("ccc_wall");
      sessionStorage.removeItem("ccc_stage");
      sessionStorage.removeItem("ccc_conv_id");
    } else {
      const savedStage = sessionStorage.getItem("ccc_stage") as EducationStage | null;
      if (savedStage) setEducationStage(savedStage);

      const saved = sessionStorage.getItem("ccc_messages");
      if (saved) {
        try { setMessages(JSON.parse(saved)); } catch {}
      }
      const savedWall = sessionStorage.getItem("ccc_wall");
      if (savedWall) setWallVariant(savedWall as WallVariant);

      const savedConvId = sessionStorage.getItem("ccc_conv_id");
      if (savedConvId) conversationIdRef.current = savedConvId;
    }

    sessionIdRef.current = id;
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      sessionStorage.setItem("ccc_messages", JSON.stringify(messages));
    }
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function selectStage(stage: EducationStage) {
    setEducationStage(stage);
    sessionStorage.setItem("ccc_stage", stage);
    const opening: Message = { role: "assistant", content: OPENING_BY_STAGE[stage] };
    setMessages([opening]);
  }

  const userCount = messages.filter((m) => m.role === "user").length;
  const showWall = wallVariant !== null;
  const stageIndex = userCount <= 3 ? 0 : userCount <= 8 ? 1 : 2;

  function detectClosing(text: string): WallVariant | null {
    const normalized = text
      .toLowerCase()
      .replace(/[^a-z0-9 ]+/g, " ") // strip ALL punctuation — apostrophes, dashes, quotes
      .replace(/\s+/g, " ")
      .trim();
    if (normalized.includes(PATTERN_TRIGGER)) return "pattern";
    if (normalized.includes(CONTINUE_TRIGGER)) return "continue";
    return null;
  }

  async function ensureConversationCreated(stage: EducationStage) {
    if (conversationIdRef.current) return;
    try {
      const res = await fetch("/api/chat/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionIdRef.current,
          educationStage: stage,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        conversationIdRef.current = data.conversationId;
        sessionStorage.setItem("ccc_conv_id", data.conversationId);
      }
    } catch {
      // Silently fail — conversation continues without DB persistence
    }
  }

  async function send(overrideText?: string, isChip = false) {
    const text = (overrideText ?? input).trim();
    if (!text || isStreaming || showWall) return;

    setInput("");
    setError(null);
    if (inputRef.current) inputRef.current.style.height = "auto";

    const userMsg: Message = { role: "user", content: text };
    const next = [...messages, userMsg];
    setMessages(next);

    // Dead session detection — 3 consecutive garbage answers (chip picks are never garbage)
    const newStreak = (!isChip && isGarbageAnswer(text)) ? garbageStreakRef.current + 1 : 0;
    garbageStreakRef.current = newStreak;

    if (newStreak >= 3) {
      const dead: Message = {
        role: "assistant",
        content: "I need real answers to help you — I can't build anything from this. Sign up to try again when you're ready.",
      };
      setTimeout(() => {
        setMessages((p) => [...p, dead]);
        setTimeout(() => {
          setWallVariant("dead");
          sessionStorage.setItem("ccc_wall", "dead");
        }, 700);
      }, 400);
      return;
    }

    if (userCount + 1 >= SAFETY_MAX) {
      const closing: Message = {
        role: "assistant",
        content: "We've started building a picture. Sign up to keep going — the more you share, the clearer it gets.",
      };
      setTimeout(() => {
        setMessages((p) => [...p, closing]);
        setTimeout(() => {
          setWallVariant("continue");
          sessionStorage.setItem("ccc_wall", "continue");
        }, 700);
      }, 400);
      return;
    }

    // Create conversation record in DB on first message
    if (educationStage) {
      await ensureConversationCreated(educationStage);
    }

    setIsStreaming(true);
    setMessages((p) => [...p, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: next,
          sessionId: sessionIdRef.current,
          educationStage,
        }),
      });

      if (!res.ok || !res.body) throw new Error("Request failed");

      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let fullText = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = dec.decode(value);
        fullText += chunk;
        setMessages((p) => {
          const u = [...p];
          u[u.length - 1] = { role: "assistant", content: fullText };
          return u;
        });
      }

      // Persist the exchange to the database (fire-and-forget)
      if (conversationIdRef.current && fullText) {
        saveMessages(conversationIdRef.current, text, fullText).catch(() => {});
      }

      const variant = detectClosing(fullText);
      if (variant) {
        setTimeout(() => {
          setWallVariant(variant);
          sessionStorage.setItem("ccc_wall", variant);
        }, 900);
      }
    } catch {
      setMessages((p) => p.slice(0, -1));
      setError("Something went wrong. Try again.");
    } finally {
      setIsStreaming(false);
      inputRef.current?.focus();
    }
  }

  function onKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  }

  function onInput(e: React.FormEvent<HTMLTextAreaElement>) {
    const t = e.currentTarget;
    t.style.height = "auto";
    t.style.height = Math.min(t.scrollHeight, 120) + "px";
  }

  return (
    <div className="flex h-screen flex-col bg-stone-50">

      {/* Header */}
      <header className="shrink-0 bg-white shadow-[0_1px_0_0_#e7e5e4]">
        <div className="mx-auto flex max-w-xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-violet-600">
              <svg viewBox="0 0 16 16" fill="none" className="h-4 w-4">
                <circle cx="8" cy="6" r="3" fill="white" />
                <path d="M3 14c0-2.761 2.239-4 5-4s5 1.239 5 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-sm font-semibold text-stone-900">ClearCareerChoice</span>
          </div>

          {educationStage && (
            <div className="flex items-center gap-2.5">
              <span className="text-xs font-medium text-stone-500">
                {STAGES[stageIndex].label}
              </span>
              <StageRing stageIndex={stageIndex} />
            </div>
          )}
        </div>
      </header>

      {/* Education stage selector */}
      {!educationStage ? (
        <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
          <div className="w-full max-w-sm">
            <div className="mb-6 text-center">
              <h2 className="text-lg font-bold text-stone-900">Where are you right now?</h2>
              <p className="mt-1 text-sm text-stone-500">This helps me ask the right questions.</p>
            </div>
            <div className="flex flex-col gap-3">
              {EDUCATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => selectStage(opt.value)}
                  className="w-full rounded-2xl border border-stone-200 bg-white px-5 py-4 text-left shadow-sm transition hover:border-violet-400 hover:shadow-md active:scale-[0.99]"
                >
                  <span className="block text-sm font-semibold text-stone-900">{opt.label}</span>
                  <span className="block text-xs text-stone-400 mt-0.5">{opt.sub}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Messages */}
          <main className="flex-1 overflow-y-auto">
            <div className="mx-auto flex max-w-xl flex-col gap-5 px-4 py-6">
              {messages.map((msg, i) => (
                <div key={i}>
                  {msg.role === "assistant" ? (
                    <div className="flex flex-col gap-3">
                      <div className="rounded-2xl rounded-tl-sm bg-white px-5 py-4 text-sm leading-relaxed text-stone-800 shadow-sm ring-1 ring-stone-100">
                        {msg.content ? msg.content : (
                          <span className="flex items-center gap-1.5">
                            <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400" />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:150ms]" />
                            <span className="h-2 w-2 animate-bounce rounded-full bg-violet-400 [animation-delay:300ms]" />
                          </span>
                        )}
                      </div>

                      {/* Opening chips */}
                      {i === 0 && userCount === 0 && (
                        <div className="flex flex-wrap gap-2">
                          {OPENING_CHIPS.map((chip) => (
                            <button
                              key={chip}
                              onClick={() => send(chip, true)}
                              disabled={isStreaming}
                              className="rounded-full border border-violet-200 bg-violet-50 px-3 py-1.5 text-left text-xs font-medium text-violet-700 transition hover:border-violet-400 hover:bg-violet-100 disabled:opacity-40"
                            >
                              {chip}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* Mid-conversation chips */}
                      {i > 0 && i === messages.length - 1 && !isStreaming && msg.content && (() => {
                        const chips = getChipsForMessage(msg.content);
                        if (!chips) return null;
                        return (
                          <div className="flex flex-wrap gap-2">
                            {chips.map((chip) => (
                              <button
                                key={chip}
                                onClick={() => send(chip, true)}
                                disabled={isStreaming}
                                className="rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-medium text-stone-600 transition hover:border-violet-300 hover:bg-violet-50 hover:text-violet-700 disabled:opacity-40"
                              >
                                {chip}
                              </button>
                            ))}
                          </div>
                        );
                      })()}
                    </div>
                  ) : (
                    <div className="flex justify-end">
                      <div className="max-w-[75%] rounded-2xl rounded-tr-sm bg-violet-600 px-4 py-3 text-sm leading-relaxed text-white">
                        {msg.content}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {error && (
                <button
                  onClick={() => send()}
                  className="self-center rounded-full border border-red-200 bg-red-50 px-4 py-2 text-xs text-red-600 hover:bg-red-100"
                >
                  {error} Tap to retry.
                </button>
              )}

              <div ref={endRef} />
            </div>
          </main>

          {/* Input */}
          <div className="shrink-0 border-t border-stone-200 bg-white px-4 py-3">
            <div className="mx-auto flex max-w-xl items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKey}
                onInput={onInput}
                disabled={isStreaming || showWall}
                placeholder={userCount === 0 ? "Or type your own reply…" : "Reply…"}
                rows={1}
                className="flex-1 resize-none overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 outline-none transition focus:border-violet-400 focus:bg-white focus:ring-2 focus:ring-violet-100 disabled:opacity-40"
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || isStreaming || showWall}
                aria-label="Send"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-600 text-white transition hover:bg-violet-700 active:scale-95 disabled:opacity-30"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                  <path d="M3.105 2.288a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.086l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.154.75.75 0 0 0 0-1.115A28.897 28.897 0 0 0 3.105 2.288Z" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}

      {showWall && wallVariant && <SignupWall variant={wallVariant} />}
    </div>
  );
}
