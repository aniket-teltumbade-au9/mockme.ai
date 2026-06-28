Act as a Senior Frontend Developer specializing in UI/UX and Tailwind CSS. 

Create a single-page, responsive, minimalist HTML landing page for an AI Mock Interview platform called "Mockmeai.com". The target audience is software engineers and tech practitioners. The page should not look like a corporate sales pitch—it should feel like an open-source, community-driven utility built by a developer, for developers.

### UI & Styling Guidelines:
* **Tech Stack:** Single `index.html` file using modern, semantic HTML5 and Tailwind CSS (via CDN). Include a clean sans-serif font (like Inter or Geist).
* **Color Palette:** A dark-mode first design. Use a sleek background (e.g., slate-950 or zinc-900), sharp typography (emerald, indigo, or sky accents for primary actions), and subtle borders. 
* **Design Style:** Dev-focused, clean, high whitespace, crisp borders (no heavy drop shadows), and a clean scannable hierarchy.

### Copywriting & Content Structure:

1. **Header / Nav:** Minimal brand name `Mockmeai.com` on the left. A simple secondary button on the right saying "Launch App →".
2. **Hero Section:**
    * **Headline:** "Practice AI Mock Interviews. Built for the Community."
    * **Subheadline:** "An on-demand AI sandbox designed to help fellow practitioners stay sharp, confident, and market-ready. No paywalls, no aggressive tracking."
    * **Primary Call to Action:** A prominent button saying "Start Practice Session" and a small text note below it saying "Takes less than 60 seconds to get started."
3. **"Why This Exists" Section (Creator Note):**
    * Display this like a clean, blockquote markdown note.
    * Text: "Hey, I'm a fellow developer. I built Mockmeai.com because interview preparation is stressful, and existing tools are locked behind expensive subscriptions. This is a fair sandbox for us to practice tech and behavioral rounds. It uses a habit-building credit loop to keep you consistent—not to gatekeep your growth."
4. **"How the Sandbox Works" Section:**
    * A 3-column minimalist layout using clean step cards:
        * **1. Claim Starter Pack:** Sign up to instantly receive 10 welcome credits.
        * **2. Run Mock Interviews:** Spend 2 credits to start any live AI simulation. Complete it to get 3 credits back.
        * **3. Maintain Momentum:** Build consistency streaks. If you stop practicing for over 5 days, your balance undergoes minor skill-decay.
5. **The Credit Economy Table:**
    * A clear, scannable table mapping out the system logic:
        * Welcome Bonus | +10 Credits | Instant playground access
        * Daily Habit Visit | +1 Credit | Rewards daily consistency
        * Finish an Interview | Net +1 Credit | Costs 2 to start, returns 3 on completion
        * Inactivity (5+ Days) | -1 Credit / day | Simulates skills getting "rusty"
6. **Footer:** Clean copyright notice and a placeholder for feedback or a link to a GitHub repository/Contact link.

### Output Requirements:
Provide the complete, un-truncated `index.html` code block. Ensure it includes responsive utility classes (`md:`, `lg:`) so it scales flawlessly from mobile phones to wide monitors.