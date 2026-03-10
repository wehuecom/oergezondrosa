# 5 Agent Workflows

Copy-paste multi-agent recipes that spawn a team of AI workers. Each one runs multiple tasks in parallel — like having employees who all start at the same time.

These use Claude Code's Task tool to create sub-agents. You paste the prompt, agents spin up, they each do their job simultaneously, and you get everything back at once.

---

## 1. Competitor Deep Dive

**What it does:** Researches 3 competitors at the same time — their content, positioning, and gaps — then gives you your angle.

```
I need a competitive analysis. Here are 3 competitors in my space:

1. [Competitor 1 name/URL]
2. [Competitor 2 name/URL]
3. [Competitor 3 name/URL]

Run these tasks in parallel using sub-agents:

**Agent 1 — Competitor 1 Analysis:** Research [Competitor 1]. Break down: what they sell, who they target, their content strategy (topics, formats, frequency), their positioning/messaging, their pricing (if visible), and their biggest strengths.

**Agent 2 — Competitor 2 Analysis:** Do the same for [Competitor 2].

**Agent 3 — Competitor 3 Analysis:** Do the same for [Competitor 3].

Once all 3 are done, synthesize the findings:
- What do they ALL do well? (industry table stakes)
- What does each one do differently?
- Where are the GAPS — things none of them are doing that my audience wants?
- Give me 3 specific angles I can own that none of them are covering
- Write a one-paragraph "why choose me" statement I can use in my marketing

Base everything on my business context from CLAUDE.md.
```

---

## 2. Content Blitz

**What it does:** Takes ONE topic and generates 5 different pieces of content in parallel. Same topic, 5 angles, all at once.

```
Topic: [YOUR TOPIC]

Run these 5 tasks in parallel using sub-agents:

**Agent 1 — Hot Take Post:** Write a contrarian/hot take post about this topic. Something that starts a conversation. Punchy, bold, opinionated. For Instagram/Twitter.

**Agent 2 — Educational Breakdown:** Write a value-packed educational post. "Here's how [topic] actually works" — clear, actionable, save-worthy. For Instagram carousel or LinkedIn.

**Agent 3 — Story Post:** Write a personal story or experience related to this topic. Emotional, relatable, ends with a lesson. For Instagram/TikTok caption.

**Agent 4 — Short-Form Script:** Write a 30-60 second video script about this topic. Hook in the first line, deliver the insight, end with a CTA. For TikTok/Reels.

**Agent 5 — Email/Newsletter:** Write a newsletter segment about this topic. Conversational, one key insight, one actionable takeaway. Under 300 words.

All content should be in MY voice (check CLAUDE.md). Make each piece stand on its own — someone should be able to see any one of these and get value, without needing the others.
```

---

## 3. Client Research (Pre-Sales Call Prep)

**What it does:** Before a sales call, researches the prospect from every angle simultaneously. You walk into the call knowing more about them than they expect.

```
I have a sales call with [PROSPECT NAME] from [COMPANY/BRAND]. Their website is [URL] and their social is [SOCIAL LINKS].

Run these tasks in parallel using sub-agents:

**Agent 1 — Business Research:** Research their business. What do they sell? Who's their audience? What's their positioning? What stage are they at (startup, growing, established)? Any recent news or changes?

**Agent 2 — Content & Social Analysis:** Look at their social media presence. What kind of content do they post? How often? What's their engagement like? What topics do they talk about most? What's their tone/brand voice?

**Agent 3 — Pain Point Identification:** Based on what you find, identify their top 3 likely pain points. What are they probably struggling with? What's keeping them up at night? What would make the biggest difference in their business right now?

**Agent 4 — Opportunity Brief:** Based on all the research, write me a one-page brief I can review before the call. Include: 3 conversation starters that show I did my homework, 2 specific ways I could help them (based on what I do — check my CLAUDE.md), and 1 question I should ask that would make them think "wow, this person really gets it."

Compile everything into a clean pre-call brief I can scan in 2 minutes.
```

---

## 4. Ad Copy Lab

**What it does:** Generates 3 completely different ad variations in parallel — emotional, logical, and curiosity-driven. Test all 3 and let the data decide.

```
I'm running ads for: [YOUR OFFER/PRODUCT/SERVICE]
Target audience: [WHO YOU'RE TARGETING — or say "check my CLAUDE.md"]
Goal: [CONVERSIONS / LEADS / TRAFFIC / AWARENESS]

Run these 3 tasks in parallel using sub-agents:

**Agent 1 — Emotional Ad:** Write ad copy that hits the FEELINGS. Pain points, desires, transformation. "Imagine if..." or "You're tired of..." energy. Lead with the emotion, close with the solution. Include: headline, primary text (under 125 words), and CTA.

**Agent 2 — Logical Ad:** Write ad copy that hits the BRAIN. Stats, proof, specifics, ROI. "Here's exactly what you get" energy. Lead with the proof, close with the offer. Include: headline, primary text (under 125 words), and CTA.

**Agent 3 — Curiosity Ad:** Write ad copy that creates an ITCH. Open loops, unexpected angles, "wait what?" moments. Lead with intrigue, close with the click. Include: headline, primary text (under 125 words), and CTA.

All 3 should be in my voice (check CLAUDE.md). After generating all 3, tell me which one you'd test FIRST and why — based on my audience and what typically performs in my niche.
```

---

## 5. Weekly CEO Brief

**What it does:** Pulls industry news, summarizes trends, and suggests actions — your personal briefing every Monday morning.

```
Build me a weekly CEO brief for my business. Run these tasks in parallel:

**Agent 1 — Industry News:** Find the top 5 most relevant news items, updates, or developments in my industry from the past 7 days. Focus on things that directly affect my business or my audience. Summarize each in 2-3 sentences.

**Agent 2 — Trend Watch:** Identify 3 trends happening right now in my space — what's gaining traction, what's fading, what's emerging. For each trend, tell me: what it is, why it matters, and whether I should act on it.

**Agent 3 — Content Opportunities:** Based on what's happening in my industry right now, give me 5 content ideas I could create THIS week that would be timely, relevant, and likely to perform well. Include the angle and the platform it's best suited for.

**Agent 4 — Action Items:** Based on everything above, give me my top 3 priorities for this week. What should I focus on? What should I create? What should I pay attention to? Be specific — not "create content" but "post about [specific topic] on [platform] using [angle]."

Compile everything into a clean brief with clear sections. This should take me 5 minutes to read and give me my marching orders for the week.
```

---

## How to Use These

1. **Copy the prompt** you want to use
2. **Fill in the [BRACKETS]** with your specific info
3. **Paste it into Claude Code** and hit enter
4. **Watch agents spin up** — you'll see multiple tasks running at the same time
5. **Get everything back at once** — all results compiled together

## Pro Tips

- **The more specific you are in the brackets, the better the output.** "My fitness coaching business" is fine. "My online fitness coaching program for busy moms who want to lose 20lbs in 90 days" is 10x better.
- **Your CLAUDE.md does the heavy lifting.** These prompts reference it constantly. The better your CLAUDE.md, the more personalized every agent's output.
- **Run the Content Blitz weekly.** One topic → 5 pieces of content → your whole week is planned.
- **Run the CEO Brief every Monday.** It takes 2 minutes to set up and gives you clarity for the entire week.
- **Customize these.** Add agents, remove agents, change the tasks. These are starting points — make them yours.

---

*Agents are the difference between "using AI" and "running AI." One Claude is helpful. Five Claudes working simultaneously is a team.*
