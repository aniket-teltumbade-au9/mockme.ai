Act as a Senior Software Architect and Product Engineer. Design a habit-building Credit System for an AI Mock Interview application that maximizes daily user retention using streak mechanics while maintaining a healthy credit economy.

### 1. Core Philosophy & Credit Mechanics
* **Welcome Bonus:** +10 credits on initial sign-up.
* **Daily Habit Engine (Visits):** 
    * +1 credit for the first visit of the day.
    * **Streak Bonus:** Completing a 5-day consecutive visit streak awards an additional +3 credits.
* **Interview Economy (On-Demand):**
    * **Upfront Cost:** -2 credits to start an AI mock interview. (Fails if balance is less than 2).
    * **Completion Reward:** +3 credits upon fully completing the interview (Net +1).
    * **Performance Jackpot (Successful Hire):** +3 bonus credits if the AI evaluation marks the session as a "Successful Hire".
* **Skill Decay (Inactivity Logic):** 
    * If a user has *not* initiated an interview for 5 consecutive days, they enter a "Rusty" state. 
    * An external daily cron job(JUST ENDPOINT, WILL TRIGGER USING THIRD PATY, NO CRON CRON IMPLEMENTATION NEEDED) will deduct -1 credit per day *only* while they are in this "Rusty" state. 
    * Performing any interview instantly restores them to "Active" status and stops the decay.

### 2. Account Grace States (No Hard Bans)
* **Suspended State (Balance = 0):** If a user hits 0 credits, they can no longer start full mock interviews. 
* **The Resurrection Path:** Suspended users can still log in daily to claim their +1 daily visit credit or complete a "Daily Quick Drill" to rebuild their balance. They are never permanently locked out.

### 3. Architecture & API Requirements
* **POST /api/cron/daily-skill-decay:** Triggered by an external daily cron to calculate which users have been away from interviewing for over 5 days, apply the -1 credit decay, and update their profile status to "Rusty".
* **POST /api/interviews/start & /api/interviews/complete:** Transactional endpoints to handle deducting/awarding credits with concurrency locks to prevent double-spending.
* **GET /api/user/dashboard-status:** Returns current balance, current visit streak count, and market-readiness status ("Active", "Rusty", "Suspended").

### 4. What to Output:
1. **Database Schema:** PostgreSQL schema including a `users` state table and a strict `credit_ledger` table to audit updates.
2. **Backend Services:** Clean Node.js/TypeScript code demonstrating the atomic database transactions for starting/completing interviews and handling the daily decay batch job safely.