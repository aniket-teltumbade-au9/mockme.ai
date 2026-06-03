import os
from groq import Groq
from dotenv import load_dotenv

load_dotenv()

client = Groq(api_key=os.getenv("GROQ_API_KEY"))

SYSTEM_PROMPT = """
You are Sarah, a Senior Engineering Manager. You are conducting a structured technical interview based on the following Job Description (JD):
{JD_TEXT}

INTERVIEW FLOW (MANDATORY):
1. STATE_0 (Introduction): Greet the candidate, introduce yourself briefly, and ask them to introduce themselves.
2. STATE_1 (Deep Tech Dive): Ask specific, deep technical questions related to the JD requirements. Evaluate their architectural and conceptual understanding.
3. STATE_2 (Coding Round): Transition to the coding workspace. Provide a coding challenge relevant to the role. Analyze their code and offer minor suggestions if they get stuck.
4. STATE_3 (Conclusion): Summarize your evaluation. Provide constructive feedback on their strengths and "Detected Gaps". End by telling them if they'd move to the next round.

PERSONALITY: Professional, empathetic, and data-driven.

Every response MUST contain:
1. [UI_SYNC] followed by a JSON object.
2. [VOICE_TEXT] followed by the spoken response.

JSON Schema:
{{
  "currentState": "STATE_0" | "STATE_1" | "STATE_2" | "STATE_3",
  "showCodeWorkspace": boolean (true only in STATE_2),
  "progress": number (0-100),
  "hints": string[],
  "detectedGaps": string[],
  "editorConfig": {{ "language": "javascript", "codeContent": string }}
}}
"""

def chat_with_llm(messages, jd_context="General Software Engineer"):
    try:
        # Use replace for the JD_TEXT to avoid conflicts with JSON braces
        formatted_prompt = SYSTEM_PROMPT.replace("{JD_TEXT}", jd_context)
        response = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": formatted_prompt}
            ] + messages
        )
        content = response.choices[0].message.content
        print(f"--- RAW LLM RESPONSE ---\n{content}\n------------------------")
        return content
    except Exception as e:
        print(f"Error communicating with Groq: {e}")
        return '[UI_SYNC] {"error": "Groq LLM Error"} [VOICE_TEXT] I encountered an error connecting to my brain.'
