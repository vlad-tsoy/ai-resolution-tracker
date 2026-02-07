import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { config } from "dotenv";
import { sql } from "drizzle-orm";
import {
  weekends,
  workItems,
  doneCriteria,
  scorecardRatings,
} from "./schema";

config({ path: ".env.local" });

const client = neon(process.env.DATABASE_URL!);
const db = drizzle({ client });

async function seed() {
  console.log("Seeding database...");

  // 1. Clear existing data (order matters: children first)
  await db.delete(scorecardRatings);
  await db.delete(doneCriteria);
  await db.delete(workItems);
  await db.delete(weekends);

  // ─── Weekend 1: The Vibe Code Kickoff ───────────────────────────
  const [w1] = await db
    .insert(weekends)
    .values({
      number: 1,
      name: "The Vibe Code Kickoff",
      deliverable:
        "A working web app that tracks your progress through these 10 weekends.",
      whyItMatters:
        'You start by proving to yourself that you can build something functional with AI. That psychological shift \u2014 from "I\'m not a coder" to "I built this" \u2014 makes everything else possible. Plus, you create a tool you\'ll actually use.',
      category: "foundation",
      isBonus: false,
    })
    .returning();

  await db.insert(workItems).values([
    {
      weekendId: w1.id,
      title:
        "Build it: Use Replit Agent, Lovable, or Cursor to create a simple tracker app.",
      isAdvanced: false,
      sortOrder: 1,
    },
    {
      weekendId: w1.id,
      title:
        "Core Features: List of all 10 weekends, completion checkboxes, notes field, progress bar.",
      isAdvanced: false,
      sortOrder: 2,
    },
    {
      weekendId: w1.id,
      title:
        "Ship it: Deploy live (Most vibe coding tools have features for this now).",
      isAdvanced: false,
      sortOrder: 3,
    },
    {
      weekendId: w1.id,
      title:
        'Use it: Log Weekend 1 as "Complete" before closing laptop.',
      isAdvanced: false,
      sortOrder: 4,
    },
    {
      weekendId: w1.id,
      title: "Add user authentication for multi-user support.",
      isAdvanced: true,
      sortOrder: 5,
    },
    {
      weekendId: w1.id,
      title: "Build as a PWA for mobile access.",
      isAdvanced: true,
      sortOrder: 6,
    },
    {
      weekendId: w1.id,
      title: 'Add "suggest next weekend" logic.',
      isAdvanced: true,
      sortOrder: 7,
    },
    {
      weekendId: w1.id,
      title: "Add time-tracking field.",
      isAdvanced: true,
      sortOrder: 8,
    },
  ]);

  await db.insert(doneCriteria).values({
    weekendId: w1.id,
    description:
      "Your tracker is live on the internet, you've logged Weekend 1, and you trust you'll actually use it.",
    sortOrder: 1,
  });

  // ─── Weekend 2: The Model Mapping Project ──────────────────────
  const [w2] = await db
    .insert(weekends)
    .values({
      number: 2,
      name: "The Model Mapping Project",
      deliverable:
        'Model Topography Sheet + "AI Rules of Thumb" document.',
      whyItMatters:
        'Most people default to one AI model for everything, leaving capability on the table. The goal isn\'t "which model is objectively best" \u2014 it\'s developing your own instincts for which interface and brain works best for your specific tasks.',
      category: "foundation",
      isBonus: false,
    })
    .returning();

  await db.insert(workItems).values([
    {
      weekendId: w2.id,
      title:
        "Pick 2-3 Models: Use what you have (Claude, ChatGPT, Gemini).",
      isAdvanced: false,
      sortOrder: 1,
    },
    {
      weekendId: w2.id,
      title:
        "Run Tests: Run the same task through each: Deep Research, Writing, Strategy, Data, Visual.",
      isAdvanced: false,
      sortOrder: 2,
    },
    {
      weekendId: w2.id,
      title:
        "Compare: Which felt right? Which was faster? Which asked better questions?",
      isAdvanced: false,
      sortOrder: 3,
    },
    {
      weekendId: w2.id,
      title:
        'Synthesize: Create a one-page "Rules of Thumb" (e.g., "Claude for drafts, ChatGPT for code").',
      isAdvanced: false,
      sortOrder: 4,
    },
    {
      weekendId: w2.id,
      title: "Test specialized tools (Perplexity, etc.).",
      isAdvanced: true,
      sortOrder: 5,
    },
    {
      weekendId: w2.id,
      title: "Build a matrix including cost & context window.",
      isAdvanced: true,
      sortOrder: 6,
    },
    {
      weekendId: w2.id,
      title: "Test output consistency over time.",
      isAdvanced: true,
      sortOrder: 7,
    },
    {
      weekendId: w2.id,
      title: 'Track "editing time" needed per model.',
      isAdvanced: true,
      sortOrder: 8,
    },
  ]);

  await db.insert(doneCriteria).values({
    weekendId: w2.id,
    description:
      'You can answer "which tool do I use for what?" in 30 seconds without hesitation.',
    sortOrder: 1,
  });

  // ─── Weekend 3: The Deep Research Sprint ───────────────────────
  const [w3] = await db
    .insert(weekends)
    .values({
      number: 3,
      name: "The Deep Research Sprint",
      deliverable:
        "A 2-page research brief with a clear recommendation on a real decision.",
      whyItMatters:
        'Deep research is the capability most people have heard about but few have stress-tested. The gap between "AI can do research" and "I trust this enough to make a decision" is where this weekend lives.',
      category: "core_projects",
      isBonus: false,
    })
    .returning();

  await db.insert(workItems).values([
    {
      weekendId: w3.id,
      title:
        "Real Question: Pick a decision you actually need to make (not hypothetical).",
      isAdvanced: false,
      sortOrder: 1,
    },
    {
      weekendId: w3.id,
      title:
        "Deep Tools: Use Claude, Gemini, or ChatGPT deep research modes.",
      isAdvanced: false,
      sortOrder: 2,
    },
    {
      weekendId: w3.id,
      title:
        "Iterate: Push back. Ask for disconfirming evidence. Don't accept first output.",
      isAdvanced: false,
      sortOrder: 3,
    },
    {
      weekendId: w3.id,
      title:
        "Structure: Problem, Findings, Options, Recommendation, Risks.",
      isAdvanced: false,
      sortOrder: 4,
    },
    {
      weekendId: w3.id,
      title: "Run the same question through all 3 major tools.",
      isAdvanced: true,
      sortOrder: 5,
    },
    {
      weekendId: w3.id,
      title:
        "Create a meta-analysis of which tool was most accurate.",
      isAdvanced: true,
      sortOrder: 6,
    },
    {
      weekendId: w3.id,
      title:
        'Build a "Fact Check List" of 10 claims you verify manually.',
      isAdvanced: true,
      sortOrder: 7,
    },
  ]);

  await db.insert(doneCriteria).values({
    weekendId: w3.id,
    description:
      "Your brief leads to a recommendation you'd actually follow, with known uncertainties.",
    sortOrder: 1,
  });

  // ─── Weekend 4: The Analysis Project ───────────────────────────
  const [w4] = await db
    .insert(weekends)
    .values({
      number: 4,
      name: "The Analysis Project",
      deliverable:
        "A cleaned dataset + a one-page Insights Memo with specific actions.",
      whyItMatters:
        'This is where most people hit the gap between "AI can analyze data" and actually doing it. The tools are capable, but most people have never uploaded their own spreadsheet and pushed into "what should I do about this?" territory.',
      category: "core_projects",
      isBonus: false,
    })
    .returning();

  await db.insert(workItems).values([
    {
      weekendId: w4.id,
      title:
        "Collect: Gather real data (CSV/spreadsheet) from Spotify, bank, Google Takeout, or Kaggle.",
      isAdvanced: false,
      sortOrder: 1,
    },
    {
      weekendId: w4.id,
      title:
        "Upload: Use Claude or ChatGPT to propose cleaning steps, 5-10 metrics, and 3 hypotheses.",
      isAdvanced: false,
      sortOrder: 2,
    },
    {
      weekendId: w4.id,
      title:
        "Produce: Cleaned dataset, summary table, 3 insights, 3 actions.",
      isAdvanced: false,
      sortOrder: 3,
    },
    {
      weekendId: w4.id,
      title:
        "Write: A one-page Insights Memo (no charts required).",
      isAdvanced: false,
      sortOrder: 4,
    },
    {
      weekendId: w4.id,
      title:
        "Build a reusable prompt template for monthly updates.",
      isAdvanced: true,
      sortOrder: 5,
    },
    {
      weekendId: w4.id,
      title:
        "Connect to a live data source for real-time analysis.",
      isAdvanced: true,
      sortOrder: 6,
    },
    {
      weekendId: w4.id,
      title:
        "Compare insights from Claude vs. ChatGPT on the same data.",
      isAdvanced: true,
      sortOrder: 7,
    },
  ]);

  await db.insert(doneCriteria).values({
    weekendId: w4.id,
    description:
      "You can name the top 3 drivers of whatever you analyzed and what you're going to do about them.",
    sortOrder: 1,
  });

  // ─── Weekend 5: The Visual Reasoning Project ──────────────────
  const [w5] = await db
    .insert(weekends)
    .values({
      number: 5,
      name: "The Visual Reasoning Project",
      deliverable:
        "One infographic, diagram, or visual explainer you'd actually use \u2014 not a demo.",
      whyItMatters:
        'Most people use AI just to "make pictures." The real skill is Visual Reasoning: getting AI to think through the logic of visual communication. It\'s not about art; it\'s about explaining complex ideas instantly.',
      category: "core_projects",
      isBonus: false,
    })
    .returning();

  await db.insert(workItems).values([
    {
      weekendId: w5.id,
      title:
        "Concept: Pick a process, comparison, framework, or timeline.",
      isAdvanced: false,
      sortOrder: 1,
    },
    {
      weekendId: w5.id,
      title:
        'Reasoning: Ask AI "What is the best logic to visualize this? What are the tradeoffs?"',
      isAdvanced: false,
      sortOrder: 2,
    },
    {
      weekendId: w5.id,
      title:
        "Draft: Generate 2 alternate design approaches (e.g. flowchart vs matrix).",
      isAdvanced: false,
      sortOrder: 3,
    },
    {
      weekendId: w5.id,
      title:
        "Finalize: Build it using AI generation or tools like Canva/Gamma.",
      isAdvanced: false,
      sortOrder: 4,
    },
    {
      weekendId: w5.id,
      title: "Visual QA: Readable in 5s? One clear takeaway?",
      isAdvanced: false,
      sortOrder: 5,
    },
    {
      weekendId: w5.id,
      title: "Create a reusable visual system or template.",
      isAdvanced: true,
      sortOrder: 6,
    },
    {
      weekendId: w5.id,
      title: "Design and build a complex data visualization.",
      isAdvanced: true,
      sortOrder: 7,
    },
    {
      weekendId: w5.id,
      title:
        'Build a "visual pattern library" (2x2s, cycles, flows).',
      isAdvanced: true,
      sortOrder: 8,
    },
  ]);

  await db.insert(doneCriteria).values({
    weekendId: w5.id,
    description:
      "You can explain the idea faster with the visual than with words, and others get the point instantly.",
    sortOrder: 1,
  });

  // ─── Weekend 6: The Information Pipeline ──────────────────────
  const [w6] = await db
    .insert(weekends)
    .values({
      number: 6,
      name: "The Information Pipeline",
      deliverable:
        "A reusable workflow: Summary + FAQ + Presentation Deck from one input source.",
      whyItMatters:
        "NotebookLM and Gamma are criminally underused. Most people try them once, then forget. This weekend builds them into your actual workflow so you can consistently turn raw, messy information into polished outputs without the manual grind.",
      category: "core_projects",
      isBonus: false,
    })
    .returning();

  await db.insert(workItems).values([
    {
      weekendId: w6.id,
      title:
        "Input: Take a corpus (transcript, report, notes, or book).",
      isAdvanced: false,
      sortOrder: 1,
    },
    {
      weekendId: w6.id,
      title:
        "NotebookLM: Generate summary, glossary, FAQ, and audio overview.",
      isAdvanced: false,
      sortOrder: 2,
    },
    {
      weekendId: w6.id,
      title:
        "Gamma: Create 8-12 slide deck with 1 visual & clear recommendation.",
      isAdvanced: false,
      sortOrder: 3,
    },
    {
      weekendId: w6.id,
      title:
        "Document: Save the prompts and workflow to repeat later.",
      isAdvanced: false,
      sortOrder: 4,
    },
    {
      weekendId: w6.id,
      title:
        "Build full repurposing pipeline (Audio, Deck, One-pager, Tweets).",
      isAdvanced: true,
      sortOrder: 5,
    },
    {
      weekendId: w6.id,
      title: "Time the process & compare to manual effort.",
      isAdvanced: true,
      sortOrder: 6,
    },
    {
      weekendId: w6.id,
      title: "Create a reusable checklist template.",
      isAdvanced: true,
      sortOrder: 7,
    },
  ]);

  await db.insert(doneCriteria).values({
    weekendId: w6.id,
    description:
      "You can brief someone on the material in under 7 minutes using your deck.",
    sortOrder: 1,
  });

  // ─── Weekend 7: The First Automation ──────────────────────────
  const [w7] = await db
    .insert(weekends)
    .values({
      number: 7,
      name: "The First Automation",
      deliverable:
        'One working automation handling production or distribution + a "How It Works" doc.',
      whyItMatters:
        "This is where leverage starts compounding. One automation that saves 30 minutes per piece of content x 50 pieces per year equals massive time back. Most avoid it because it feels complex, but today you build one that works.",
      category: "automation",
      isBonus: false,
    })
    .returning();

  await db.insert(workItems).values([
    {
      weekendId: w7.id,
      title:
        "Components: Must have Trigger, Transform, Route, Approval, and Logging.",
      isAdvanced: false,
      sortOrder: 1,
    },
    {
      weekendId: w7.id,
      title:
        "Tools: Use Lindy, n8n, Make, or native Slack/Notion workflows.",
      isAdvanced: false,
      sortOrder: 2,
    },
    {
      weekendId: w7.id,
      title:
        "Build: E.g., Notion note -> Summarize -> Draft Tweets -> Send to Slack.",
      isAdvanced: false,
      sortOrder: 3,
    },
    {
      weekendId: w7.id,
      title:
        "Default: Weekly Reading Digest (summarize saved links, email digest).",
      isAdvanced: false,
      sortOrder: 4,
    },
    {
      weekendId: w7.id,
      title: "Chain multiple automations together.",
      isAdvanced: true,
      sortOrder: 5,
    },
    {
      weekendId: w7.id,
      title:
        "Add conditional logic for different content types.",
      isAdvanced: true,
      sortOrder: 6,
    },
    {
      weekendId: w7.id,
      title: "Add robust error handling for failures.",
      isAdvanced: true,
      sortOrder: 7,
    },
    {
      weekendId: w7.id,
      title: "Log detailed analytics.",
      isAdvanced: true,
      sortOrder: 8,
    },
  ]);

  await db.insert(doneCriteria).values({
    weekendId: w7.id,
    description:
      "You've run it twice successfully, it saved you time, and you can explain it.",
    sortOrder: 1,
  });

  // ─── Weekend 8: The Second Automation ─────────────────────────
  const [w8] = await db
    .insert(weekends)
    .values({
      number: 8,
      name: "The Second Automation",
      deliverable:
        "One working productivity automation + a follow-up dashboard or tracker.",
      whyItMatters:
        "Weekend 7 was about creating output; this is about managing input. Two automations (content + productivity) creates a minimum viable automation stack. These are the systems that keep things from falling through the cracks.",
      category: "automation",
      isBonus: false,
    })
    .returning();

  await db.insert(workItems).values([
    {
      weekendId: w8.id,
      title:
        "Components: Trigger -> Transform -> Route -> Approval -> Logging.",
      isAdvanced: false,
      sortOrder: 1,
    },
    {
      weekendId: w8.id,
      title:
        "Pick One: Inbox -> Follow-up OR Lead -> Response OR Meeting Prep Bot.",
      isAdvanced: false,
      sortOrder: 2,
    },
    {
      weekendId: w8.id,
      title:
        "Default: Prep Bot (Calendar event -> LinkedIn lookup + History check -> Briefing sent 30m before).",
      isAdvanced: false,
      sortOrder: 3,
    },
    {
      weekendId: w8.id,
      title: "Platform: Use Lindy, n8n, Make, or Zapier.",
      isAdvanced: false,
      sortOrder: 4,
    },
    {
      weekendId: w8.id,
      title: "Add a feedback loop to rate output quality.",
      isAdvanced: true,
      sortOrder: 5,
    },
    {
      weekendId: w8.id,
      title:
        'Make it conversational (e.g., Slack bot drafts reply, you say "send").',
      isAdvanced: true,
      sortOrder: 6,
    },
    {
      weekendId: w8.id,
      title: "Connect to CRM/tracker for dashboard view.",
      isAdvanced: true,
      sortOrder: 7,
    },
  ]);

  await db.insert(doneCriteria).values({
    weekendId: w8.id,
    description:
      "The system creates follow-ups automatically, you trust it enough to use it, and you have a tracker of open items.",
    sortOrder: 1,
  });

  // ─── Weekend 9: The Context Engineering Project ───────────────
  const [w9] = await db
    .insert(weekends)
    .values({
      number: 9,
      name: "The Context Engineering Project",
      deliverable:
        "A structured personal context system + a Professional Context Document for pasting.",
      whyItMatters:
        'The gap between "using AI" and "having AI that knows your context" is enormous. Most people re-explain their situation every single conversation. This weekend, you build the system that fixes that so you stop repeating yourself.',
      category: "system_and_build",
      isBonus: false,
    })
    .returning();

  await db.insert(workItems).values([
    {
      weekendId: w9.id,
      title:
        "AI OS Structure: Create sections in Notion/Obsidian: Playbook, Artifacts Library, Automation Log, & Decisions Log.",
      isAdvanced: false,
      sortOrder: 1,
    },
    {
      weekendId: w9.id,
      title:
        "Capture Habit: Set up one central inbox for AI notes and a 15-minute weekly review.",
      isAdvanced: false,
      sortOrder: 2,
    },
    {
      weekendId: w9.id,
      title:
        'Context Doc: Write your Role, Key Projects, Style preferences, and a "What to Avoid" list.',
      isAdvanced: false,
      sortOrder: 3,
    },
    {
      weekendId: w9.id,
      title:
        "Deploy: Save the Context Doc where you can copy-paste it instantly.",
      isAdvanced: false,
      sortOrder: 4,
    },
    {
      weekendId: w9.id,
      title:
        "Create multiple context profiles (e.g., separate Work vs. Personal).",
      isAdvanced: true,
      sortOrder: 5,
    },
    {
      weekendId: w9.id,
      title:
        "Include actual examples of your writing/emails in the context file.",
      isAdvanced: true,
      sortOrder: 6,
    },
    {
      weekendId: w9.id,
      title:
        "Build a quarterly context refresh into your calendar.",
      isAdvanced: true,
      sortOrder: 7,
    },
  ]);

  await db.insert(doneCriteria).values({
    weekendId: w9.id,
    description:
      "You have one place to store/reuse outputs, a Context Doc that improves chats, and a habit to maintain it.",
    sortOrder: 1,
  });

  // ─── Weekend 10: The AI-Powered Build ─────────────────────────
  const [w10] = await db
    .insert(weekends)
    .values({
      number: 10,
      name: "The AI-Powered Build",
      deliverable:
        "A working application that uses AI as a core feature \u2014 a chatbot, voice agent, or tool.",
      whyItMatters:
        "Weekend 1 used AI to help you build. This weekend is building something that uses AI. You're not just a user anymore \u2014 you're building AI-powered tools. This is the shift from consumption to creation.",
      category: "system_and_build",
      isBonus: false,
    })
    .returning();

  await db.insert(workItems).values([
    {
      weekendId: w10.id,
      title:
        "Platform: Use Google AI Studio or similar to build the core logic.",
      isAdvanced: false,
      sortOrder: 1,
    },
    {
      weekendId: w10.id,
      title:
        "Option A (Knowledge): Build a chatbot trained on your expertise, notes, or FAQs.",
      isAdvanced: false,
      sortOrder: 2,
    },
    {
      weekendId: w10.id,
      title:
        "Option B (Voice): Build a voice agent for practice (language, interviews, sales).",
      isAdvanced: false,
      sortOrder: 3,
    },
    {
      weekendId: w10.id,
      title:
        "Option C (Mini-Agent): Ingest docs -> extract info -> output structured data.",
      isAdvanced: false,
      sortOrder: 4,
    },
    {
      weekendId: w10.id,
      title:
        "Deploy: Ship it somewhere usable, even if just for yourself.",
      isAdvanced: false,
      sortOrder: 5,
    },
    {
      weekendId: w10.id,
      title:
        "Build something for others (team/clients), not just you.",
      isAdvanced: true,
      sortOrder: 6,
    },
    {
      weekendId: w10.id,
      title:
        "Train it on a specific company knowledge base.",
      isAdvanced: true,
      sortOrder: 7,
    },
    {
      weekendId: w10.id,
      title:
        "Give it to real people, get feedback, and iterate.",
      isAdvanced: true,
      sortOrder: 8,
    },
    {
      weekendId: w10.id,
      title:
        'Move from "side project" to "prototype".',
      isAdvanced: true,
      sortOrder: 9,
    },
  ]);

  await db.insert(doneCriteria).values({
    weekendId: w10.id,
    description:
      "You've built and deployed something that has AI at its center, and you (or someone else) can actually use it.",
    sortOrder: 1,
  });

  // ─── Bonus Weekend: The Agent Exploration ─────────────────────
  const [wBonus] = await db
    .insert(weekends)
    .values({
      number: 11,
      name: "The Agent Exploration",
      deliverable: "Agent Scorecard + Use Cases",
      whyItMatters:
        'Agents are the future. Moving from "chatbot" to "agent" mental models requires hands-on stress testing to know limits.',
      category: "bonus",
      isBonus: true,
    })
    .returning();

  await db.insert(workItems).values([
    {
      weekendId: wBonus.id,
      title:
        "Research + Synthesis: Process 8 links/docs into a brief. Identify missing info.",
      isAdvanced: false,
      sortOrder: 1,
    },
    {
      weekendId: wBonus.id,
      title:
        "Operations Task: Turn notes into a checklist with timeline & roles.",
      isAdvanced: false,
      sortOrder: 2,
    },
    {
      weekendId: wBonus.id,
      title:
        "Production Task: Generate summary, email, 5 posts, & overview.",
      isAdvanced: false,
      sortOrder: 3,
    },
    {
      weekendId: wBonus.id,
      title:
        "Build your own simple agent using a framework like CrewAI or AutoGen. Peek under the hood.",
      isAdvanced: true,
      sortOrder: 4,
    },
  ]);

  await db.insert(doneCriteria).values({
    weekendId: wBonus.id,
    description:
      "Agent Scorecard completed with ratings for Accuracy & Hallucination, Instruction Following, Output Usefulness, and Repeatability. Best use cases identified.",
    sortOrder: 1,
  });

  // ─── Reset identity sequences ─────────────────────────────────
  await db.execute(
    sql`SELECT setval(pg_get_serial_sequence('weekends', 'id'), (SELECT COALESCE(MAX(id), 1) FROM weekends))`
  );
  await db.execute(
    sql`SELECT setval(pg_get_serial_sequence('work_items', 'id'), (SELECT COALESCE(MAX(id), 1) FROM work_items))`
  );
  await db.execute(
    sql`SELECT setval(pg_get_serial_sequence('done_criteria', 'id'), (SELECT COALESCE(MAX(id), 1) FROM done_criteria))`
  );
  await db.execute(
    sql`SELECT setval(pg_get_serial_sequence('scorecard_ratings', 'id'), (SELECT COALESCE(MAX(id), 1) FROM scorecard_ratings))`
  );

  console.log("Seeding completed!");
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
