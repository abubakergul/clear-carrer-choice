import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient, ExplorationStatus, ExplorationType, ExplorationIntensity, ReflectionSource } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

function daysAgo(days: number, hour = 10, minute = 0): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

function rand(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const CONVERSATIONS = [
  {
    theme: "Career Alignment",
    sessionId: "seed-career-alignment-001",
    daysAgo: 18,
    messages: [
      { role: "user", content: "I've been in my current job for two years and I'm starting to feel like something's off. I do the work fine, but I'm not excited about it." },
      { role: "assistant", content: "That gap between competence and engagement is worth paying attention to. Can you tell me more about what a good day at work looks like for you — even if they're rare right now?" },
      { role: "user", content: "The days I like are when I can just put headphones on and solve a hard problem without being interrupted for hours." },
      { role: "assistant", content: "That's a clear signal — you're energized by deep, uninterrupted problem-solving. How often does that actually happen in your current role?" },
      { role: "user", content: "Maybe once or twice a week. Most of my time is in meetings or Slack threads." },
      { role: "assistant", content: "So you're spending most of your energy in exactly the environment that drains you. That's a meaningful misalignment. Do you have any autonomy over how you structure your day?" },
      { role: "user", content: "Not really. My manager schedules most things for me." },
      { role: "assistant", content: "That constraint is often more draining than the work itself. Let's explore what environments have felt most aligned for you historically — not just this job, but any context where you were genuinely engaged." },
      { role: "user", content: "Probably when I was doing freelance work. I set my own schedule and chose my own projects." },
      { role: "assistant", content: "Freelance gave you the two things your current role removes: autonomy and task selection. That pattern matters. It suggests you may need structural independence — a smaller team, async-first culture, or a role with clear ownership over your domain." },
      { role: "user", content: "That makes a lot of sense actually. I never thought about it as a structural thing." },
    ],
  },
  {
    theme: "Focus & Productivity",
    sessionId: "seed-focus-productivity-001",
    daysAgo: 14,
    messages: [
      { role: "user", content: "I've been really struggling to focus lately. I sit down to work and an hour later I've done basically nothing." },
      { role: "assistant", content: "That experience of losing time without output is frustrating. Is the problem getting started, staying on track, or both?" },
      { role: "user", content: "Mostly staying on track. I'll start something and then end up doing three other things before finishing." },
      { role: "assistant", content: "That's context switching — your brain is jumping between tasks before any of them get closed out. What does your workspace look like when you're trying to work?" },
      { role: "user", content: "Lots of tabs open, Slack notifications on, usually 4-5 things I think I need to do." },
      { role: "assistant", content: "You've described a high-interruption environment. The issue isn't willpower — it's that your setup is optimized for reactivity, not depth. What would feel different if you had one thing to do for two hours?" },
      { role: "user", content: "Honestly terrifying at first but I think I'd actually get stuff done." },
      { role: "assistant", content: "That anxiety at the start of a focus block is normal — your brain is used to constant input. The productive window often starts 15–20 minutes in. Have you tried time-blocking or working from a single task list?" },
      { role: "user", content: "I've tried but never stuck with it." },
      { role: "assistant", content: "Systems often fail not because they're wrong, but because they're too complex to maintain. What's the simplest change you could make tomorrow — not a whole system, just one thing?" },
    ],
  },
  {
    theme: "Burnout Prevention",
    sessionId: "seed-burnout-prevention-001",
    daysAgo: 10,
    messages: [
      { role: "user", content: "I've been working really hard for the past few months and I'm starting to feel completely empty. Like I go through the motions but nothing lands anymore." },
      { role: "assistant", content: "What you're describing — going through the motions without anything registering — is a classic sign of emotional exhaustion. How long has it been building?" },
      { role: "user", content: "Probably 6 weeks. It started after a big sprint and I never really recovered." },
      { role: "assistant", content: "That post-sprint crash that doesn't lift is significant. Did you take any real downtime after that sprint, or did you move straight into the next thing?" },
      { role: "user", content: "Straight into the next thing. We had a deadline." },
      { role: "assistant", content: "Burnout often isn't about one hard push — it's the accumulation of hard pushes with no recovery between them. Your nervous system never got a signal that it was safe to decompress. Are you still sleeping and eating normally?" },
      { role: "user", content: "Sleep is fine. Eating is fine. I just feel flat." },
      { role: "assistant", content: "Flat affect with normal basic functions usually points to cognitive and emotional exhaustion more than physical. That can take longer to recover from because rest alone doesn't fix it — you also need a sense of meaning or small wins. What's one thing recently that actually felt good?" },
      { role: "user", content: "I helped a colleague debug something and that actually felt satisfying." },
      { role: "assistant", content: "That's useful data. Helping someone else gave you a sense of impact — something that direct execution on a deadline often removes. You may need more human-scale feedback loops in your work. How often do you see the result of what you build?" },
      { role: "user", content: "Almost never. It's all internal tooling." },
      { role: "assistant", content: "Working with invisible outputs is one of the harder environments to sustain energy in. The brain needs feedback to stay engaged. This might be worth raising with your manager — not as a complaint, but as a sustainability conversation." },
      { role: "user", content: "What would I even say?" },
      { role: "assistant", content: "Something like: 'I do better when I can see the impact of what I build. Are there opportunities for me to work on something with more visible outcomes?' That frames it as a performance question. And in the short term: protect one low-demand hour a day. That small signal of safety can start to shift the flatness over time." },
    ],
  },
  {
    theme: "Weekly Reflection",
    sessionId: "seed-weekly-reflection-001",
    daysAgo: 7,
    messages: [
      { role: "user", content: "Trying to do a proper end-of-week reflection. This week felt scattered." },
      { role: "assistant", content: "Let's work through it. What were your top three intended outcomes for this week?" },
      { role: "user", content: "Finish the auth migration, review the design specs, and do 1:1s with two team members." },
      { role: "assistant", content: "Which of those actually happened?" },
      { role: "user", content: "Auth migration is 80% done. Design review didn't happen. 1:1s happened." },
      { role: "assistant", content: "Two out of three, with the third partially done — that's a reasonable week. What got in the way of the design review?" },
      { role: "user", content: "An incident on Monday took up half my day and I never caught up." },
      { role: "assistant", content: "Incidents are unavoidable, but losing an entire day of planned work from a single disruption suggests your plan had no slack. Did you have buffer time built in?" },
      { role: "user", content: "No. I basically planned at 100% capacity." },
      { role: "assistant", content: "That's the structural issue. Planning at full capacity means any disruption creates a domino effect. A useful target is 70–80% planned, with the rest as buffer. What would you do differently next week?" },
    ],
  },
  {
    theme: "Planning & Execution",
    sessionId: "seed-planning-execution-001",
    daysAgo: 3,
    messages: [
      { role: "user", content: "I have a huge amount to do this quarter and I honestly don't know where to start. Everything feels equally urgent." },
      { role: "assistant", content: "That feeling of everything being urgent is often a sign that priorities haven't been clearly set. What are the consequences if you do nothing for a week?" },
      { role: "user", content: "Realistically? Probably the API integration is the only thing that blocks anyone else." },
      { role: "assistant", content: "So there's one genuinely blocking item. That's your actual priority. What's the status of the API integration right now?" },
      { role: "user", content: "About halfway done. I keep getting pulled into other stuff before I can close it out." },
      { role: "assistant", content: "A half-finished integration that blocks the team is more costly than a fully unstarted optional feature. It sounds like you need a 'no new work' sprint until it ships. What's standing between you and finishing it this week?" },
      { role: "user", content: "Honestly just focus time. The work is clear. I just need to sit down and do it." },
      { role: "assistant", content: "That's a surprisingly clean situation. You know what to do and you have the skills — you just need protected time. Can you block two focused hours tomorrow morning before anything else touches your calendar?" },
      { role: "user", content: "Yes. I can do 8–10 before standups." },
      { role: "assistant", content: "Perfect. Ship the integration, then reassess the rest of your quarter from a position of clarity rather than overwhelm. The backlog will look different once the blocker is gone." },
      { role: "user", content: "This was genuinely helpful. I feel less stuck." },
      { role: "assistant", content: "You weren't stuck on the work — just on where to start. Sometimes the most useful thing is a conversation that collapses the list down to one next action. Good luck tomorrow." },
    ],
  },
];

const EXPLORATIONS = [
  {
    title: "Spend 30 minutes reading about a field you've dismissed",
    prompt: "Pick a career area you've always assumed wasn't for you. Read about what someone actually does day-to-day. Notice what comes up — curiosity, boredom, resistance, or something unexpected.",
    status: ExplorationStatus.COMPLETED,
    type: ExplorationType.OBSERVE,
    intensity: ExplorationIntensity.VERY_LIGHT,
    generationContext: {
      basedOnSignals: ["resistance", "avoidance"],
      basedOnTensions: ["stability vs creativity"],
      reason: "User dismissed certain paths reflexively — this surfaces whether the resistance is real or assumed.",
    },
    daysAgo: 15,
    reflection: {
      source: ReflectionSource.COMPLETION,
      selectedSignals: ["curiosity", "surprise", "mild resistance"],
      emotionalState: "reflective",
      curiosityLevel: 4,
      intimidationLevel: 2,
    },
  },
  {
    title: "Teach something you know to a friend or in writing",
    prompt: "Explain a skill or concept you're comfortable with to someone unfamiliar with it. Notice whether explaining it energizes or drains you.",
    status: ExplorationStatus.COMPLETED,
    type: ExplorationType.INTERACT,
    intensity: ExplorationIntensity.LIGHT,
    generationContext: {
      basedOnSignals: ["energy", "engagement"],
      basedOnTensions: ["solo work vs people-facing roles"],
      reason: "Testing whether knowledge-sharing creates energy or feels like performance pressure.",
    },
    daysAgo: 10,
    reflection: {
      source: ReflectionSource.COMPLETION,
      selectedSignals: ["energy", "engagement", "flow"],
      emotionalState: "energized",
      energyLevel: 5,
      curiosityLevel: 3,
    },
  },
  {
    title: "Do one hour of solo, unstructured creative work",
    prompt: "Set aside an hour with no goal except to make or explore something freely — writing, sketching, building, designing. No output required. Notice how your attention moves.",
    status: ExplorationStatus.COMPLETED,
    type: ExplorationType.SIMULATE,
    intensity: ExplorationIntensity.LIGHT,
    generationContext: {
      basedOnSignals: ["curiosity", "desire for creativity"],
      basedOnTensions: ["desire for structure vs open-ended work"],
      reason: "Observing whether ambiguity creates anxiety or freedom.",
    },
    daysAgo: 5,
    reflection: {
      source: ReflectionSource.COMPLETION,
      selectedSignals: ["curiosity", "excitement", "desire for structure"],
      emotionalState: "mixed",
      energyLevel: 3,
      curiosityLevel: 4,
      intimidationLevel: 2,
    },
  },
  {
    title: "Shadow or interview someone in a role you're curious about",
    prompt: "Reach out to someone whose work seems interesting and ask for 20 minutes to learn about their day. If that's not possible, find a detailed interview or video online. Notice your reaction as they describe their reality.",
    status: ExplorationStatus.ACTIVE,
    type: ExplorationType.OBSERVE,
    intensity: ExplorationIntensity.LIGHT,
    generationContext: {
      basedOnSignals: ["curiosity", "engagement"],
      basedOnTensions: ["uncertainty about fit"],
      reason: "Moving from passive observation to direct exposure of what the work actually feels like.",
    },
    daysAgo: 1,
    reflection: null,
  },
];

async function main() {
  console.log("Seeding database...");

  const user = await prisma.user.upsert({
    where: { email: "demo@mindframe.ai" },
    update: {},
    create: {
      email: "demo@mindframe.ai",
      name: "Demo User",
      image: "https://i.pravatar.cc/300?img=12",
      emailVerified: new Date(),
    },
  });
  console.log(`  User: ${user.email} (${user.id})`);

  // Clear existing seeded data before recreating (idempotency)
  await prisma.exploration.deleteMany({ where: { userId: user.id } });
  await prisma.fitInsight.deleteMany({ where: { userId: user.id } });
  await prisma.conversation.deleteMany({ where: { userId: user.id } });

  for (const conv of CONVERSATIONS) {
    const baseDate = daysAgo(conv.daysAgo, rand(9, 14), rand(0, 45));
    const conversation = await prisma.conversation.create({
      data: {
        userId: user.id,
        sessionId: conv.sessionId,
        createdAt: baseDate,
      },
    });

    let messageTime = new Date(baseDate);
    for (const msg of conv.messages) {
      messageTime = new Date(messageTime.getTime() + rand(30, 180) * 1000);
      await prisma.message.create({
        data: {
          conversationId: conversation.id,
          role: msg.role,
          content: msg.content,
          createdAt: messageTime,
        },
      });
    }
    console.log(`  Conversation: ${conv.theme} (${conv.messages.length} messages)`);
  }

  const fitInsight = await prisma.fitInsight.create({
    data: {
      userId: user.id,
      summary:
        "This user performs best in autonomous, low-interruption environments with extended blocks of focused time. Frequent context switching, meeting-heavy schedules, and reactive communication patterns consistently reduce energy and engagement. They show strong capacity for independent problem-solving and technical depth, but require visible impact and clear ownership to sustain motivation over time.",
      directions: [
        "Independent deep-focus work",
        "Visible user-facing impact",
        "Systems thinking and technical depth",
        "Async-first autonomous teams",
        "Teaching and knowledge transfer",
        "Creative work within constraints",
      ],
      tensions: [
        "Context switching fatigue in reactive, meeting-heavy environments",
        "Difficulty sustaining motivation when output is invisible",
        "Perfectionism loops on low-stakes tasks",
        "Overcommitting when boundaries are unclear",
        "Resistance to ambiguity without a structural container",
      ],
      version: 1,
    },
  });
  console.log("  FitInsight: created");

  for (const exp of EXPLORATIONS) {
    const createdAt = daysAgo(exp.daysAgo, rand(9, 14), rand(0, 45));
    const isCompleted = exp.status === ExplorationStatus.COMPLETED;
    const completedAt = isCompleted
      ? new Date(createdAt.getTime() + rand(30, 90) * 60 * 1000)
      : null;
    const expiresAt = new Date(createdAt.getTime() + 48 * 60 * 60 * 1000);

    const exploration = await prisma.exploration.create({
      data: {
        userId: user.id,
        fitInsightId: fitInsight.id,
        title: exp.title,
        prompt: exp.prompt,
        status: exp.status,
        type: exp.type,
        intensity: exp.intensity,
        generationContext: exp.generationContext,
        createdAt,
        completedAt,
        expiresAt,
      },
    });

    if (isCompleted && exp.reflection) {
      await prisma.reflection.create({
        data: {
          explorationId: exploration.id,
          source: exp.reflection.source,
          selectedSignals: exp.reflection.selectedSignals,
          emotionalState: exp.reflection.emotionalState,
          energyLevel: exp.reflection.energyLevel ?? null,
          curiosityLevel: exp.reflection.curiosityLevel ?? null,
          intimidationLevel: exp.reflection.intimidationLevel ?? null,
          createdAt: completedAt!,
        },
      });
    }

    console.log(`  Exploration: "${exp.title.slice(0, 50)}..." (${exp.status})`);
  }

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
