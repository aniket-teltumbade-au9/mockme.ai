from app.services.llm import client
import json

def generate_remediation_plan(detected_gaps: list[str]) -> str:
    """Generate a study plan based on identified skill gaps."""
    if not detected_gaps:
        return "No specific gaps identified. Continue practicing!"

    prompt = f"""
    You are a technical career coach. The candidate has identified the following skill gaps during a mock interview:
    {', '.join(detected_gaps)}
    
    Create a personalized study plan for the next 3 days, focusing on remediation.
    - Provide 3 specific topics to study.
    - Suggest 2 coding problems for each topic (or general resources).
    - Be actionable and concise.
    """
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )
    return response.choices[0].message.content
