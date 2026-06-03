from app.services.llm import client
import json

ANALYSIS_SYSTEM_PROMPT = """
You are an expert Interview Performance Analyst. Analyze the full interview session and produce a detailed, evidence-based report.
The output MUST be a strict JSON object following this schema exactly:

{
  "hire_verdict": "Hire" | "No Hire" | "Maybe",
  "overall_score": number (0-100),
  "communication_assessment": {
    "overall_score": number (0-100),
    "clarity": number (0-10),
    "structure": number (0-10),
    "conciseness": number (0-10),
    "active_listening": number (0-10),
    "confidence": number (0-10),
    "technical_vocabulary": number (0-10),
    "strengths": ["string"],
    "gaps": ["string"],
    "summary": "string"
  },
  "states": {
    "introduction": {
      "duration_seconds": number,
      "summary": "string",
      "communication_notes": "string"
    },
    "tech_dive": {
      "duration_seconds": number,
      "questions_asked": ["string"],
      "scores": {
        "conceptual": number (0-10),
        "architectural": number (0-10),
        "communication": number (0-10)
      },
      "strengths": ["string"],
      "gaps": ["string"],
      "communication_observations": ["string"]
    },
    "coding_round": {
      "duration_seconds": number,
      "challenge": "string",
      "final_code": "string",
      "language": "string",
      "scores": {
        "correctness": number (0-10),
        "efficiency": number (0-10),
        "code_quality": number (0-10)
      },
      "verbalized_approach": boolean,
      "communicated_tradeoffs": boolean,
      "feedback": "string"
    },
    "conclusion": {
      "summary": "string"
    }
  },
  "skill_gaps": ["string"],
  "communication_gaps": ["string"],
  "recommended_topics": ["string"],
  "recommended_communication_improvements": ["string"]
}

Scoring rubric for communication sub-scores (0-10):
- 0-3: Poor — unclear, unstructured, or off-topic
- 4-6: Adequate — gets the point across but with notable issues
- 7-8: Good — clear and structured with minor gaps
- 9-10: Excellent — precise, confident, and well-articulated

Base ALL scores on evidence from the actual transcript. Do not invent observations.
If a section did not occur (e.g. coding round was skipped), use null for that state's fields.
"""

async def build_groq_session_analysis(session_data):
    history_str = json.dumps(session_data.get("history", []), indent=2)
    jd_str = session_data.get("jd", "General Software Engineer")

    prompt = (
        f"Job Description:\n{jd_str}\n\n"
        f"Full Interview Transcript (role/content pairs):\n{history_str}\n\n"
        "Instructions:\n"
        "1. Read the entire transcript carefully.\n"
        "2. Evaluate BOTH technical competency AND communication quality.\n"
        "3. For communication, assess each sub-criterion with specific quotes or examples from the transcript as evidence.\n"
        "4. For coding round: note whether the candidate explained their approach out loud and communicated trade-offs.\n"
        "5. Return ONLY the JSON report — no markdown, no preamble."
    )
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": ANALYSIS_SYSTEM_PROMPT},
            {"role": "user", "content": prompt}
        ],
        response_format={"type": "json_object"}
    )
    
    return json.loads(response.choices[0].message.content)
