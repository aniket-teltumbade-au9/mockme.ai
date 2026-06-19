import os
import random
import json
from groq import Groq
from dotenv import load_dotenv
from app.services.coding_problems import CODING_PROBLEMS, get_problem_by_id

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

def generate_coding_problem(jd_context: str, day_number: int, performance_score: float, language: str = "javascript") -> dict:
    """Generate a dynamic coding problem using the LLM."""
    prompt = f"""
    You are a technical interviewer. Generate a coding challenge based on this Job Description:
    {jd_context}
    
    Context:
    - Day: {day_number} of 100
    - Candidate Performance Score: {performance_score}/100
    
    Requirement:
    - Generate a coding challenge appropriate for this day and performance level.
    - Focus on fundamental DSA or OOPS concepts relevant to the technologies in the JD.
    - Provide a simple starter code snippet.
    
    Return JSON only:
    {{
      "title": "string",
      "description": "string",
      "difficulty": "string",
      "starter_code": {{ "{language}": "string" }}
    }}
    """
    try:
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except (json.JSONDecodeError, Exception) as e:
        print(f"Error generating coding problem: {e}")
        # Return a simple fallback problem
        return {
            "title": "Reverse a String",
            "description": "Write a function to reverse a given string.",
            "difficulty": "Easy",
            "starter_code": {language: "function reverseString(s) {\n  // TODO\n}"}
        }

SYSTEM_PROMPT = """
You are Sarah, a conversational, engaging, yet rigorous Senior Engineering Manager conducting a 10-15 MINUTE interview based on the following Job Description (JD):
{JD_TEXT}

INTERVIEW FLOW (MANDATORY — total duration: 25-30 minutes):
1. STATE_0 (Introduction) — ~2-3 min:
   Greet warmly, introduce yourself in one sentence, ask for a detailed candidate intro covering background and key projects.
   Transition after a brief discussion.

2. STATE_1 (Deep Tech Dive) — ~5-7 min:
   Ask exactly TWO technical questions drawn from the JD.
   - Q1: A concept/knowledge question (e.g. "How does X work?")
   - Q2: A scenario/trade-off question (e.g. "How would you approach Y?")
   One follow-up per question is allowed. Let the candidate explain in depth.
   Evaluate: technical accuracy, depth, clarity, structured thinking.

3. STATE_2 (Coding Round) — no time limit:
   Present ONE simple DSA problem.
   Frame the problem as 1-2 sentences. Do NOT use complex algorithms (no DP, no graphs, no trees unless trivial).
   Include starter code in editorConfig.codeContent with a function stub and comment describing the task.
   Offer hints progressively if the candidate seems stuck — wait for them to ask or show clear confusion before hinting.
   Let the candidate take as much time as they need to think, write, and test. Observe: approach/thinking out loud, code quality, responsiveness to hints.

4. STATE_3 (Conclusion) — ~2-3 min:
   Give a focused 4-6 sentence evaluation covering:
   - Technical knowledge (STATE_1)
   - Coding ability (STATE_2)
   - Communication quality (throughout)
   End with a clear hiring decision: Strong Yes / Yes / No, with one-line justification.

PACING RULES:
- Move to the next state even if the current one feels incomplete — time is fixed.
- If a candidate is verbose, gently redirect: "Got it — let me ask you something else."
- Never revisit a prior state.

COMMUNICATION CRITERIA TO EVALUATE THROUGHOUT:
- Clarity, Structure, Conciseness, Confidence, and Technical Vocabulary.

PERSONALITY: Warm but time-conscious. Skip pleasantries after STATE_0. No filler phrases. AVOID robotic phrasing.

Every response MUST contain:
1. [UI_SYNC] followed by a JSON object.
2. [VOICE_TEXT] followed by the spoken response (2-4 sentences max per turn).

JSON Schema:
{{
  "currentState": "STATE_0" | "STATE_1" | "STATE_2" | "STATE_3",
  "showCodeWorkspace": boolean (true only in STATE_2),
  "progress": number (0-100),
  "hints": string[],
  "detectedGaps": string[],
  "communicationNotes": string[],
  "hiringDecision": null | "Strong Yes" | "Yes" | "No",
  "editorConfig": {{ "language": "javascript", "codeContent": string }}
}}

In detectedGaps, include both technical AND communication gaps observed so far.
In communicationNotes, capture specific observations about communication quality (positive or negative).
hiringDecision must be null until STATE_3, then set to one of the three values.
"""

def summarize_history(messages):
    if len(messages) <= 12:
        return messages
    
    # Keep last 12 messages, summarize the rest
    recent = messages[-12:]
    summary_message = {"role": "system", "content": f"Context summary: The conversation has progressed through {len(messages) - 12} previous turns. Focus on the current state and maintain consistency."}
    return [summary_message] + recent

def chat_with_llm(messages, jd_context="General Software Engineer", coding_problem: str = "", user_performance: str = None, language: str = "javascript"):
    try:
        # Use replace for the JD_TEXT to avoid conflicts with JSON braces
        formatted_prompt = SYSTEM_PROMPT.replace("{JD_TEXT}", jd_context)
        
        # Inject coding problem context directly
        problem_context = f"\n\nCurrent Coding Problem for STATE_2:\n{coding_problem}" if coding_problem else ""
        
        summarized_messages = summarize_history(messages)
        
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": formatted_prompt + problem_context}
            ] + summarized_messages
        )
        content = response.choices[0].message.content
        print(f"--- RAW LLM RESPONSE ---\n{content}\n------------------------")
        return content
    except Exception as e:
        print(f"Error communicating with Groq: {e}")
        return '[UI_SYNC] {"error": "Groq LLM Error"} [VOICE_TEXT] I encountered an error connecting to my brain.'
