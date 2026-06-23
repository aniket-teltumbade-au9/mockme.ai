from app.services.llm import client
import json

TACTICAL_STRATEGIES = {
    "System Design": {
        "step_1_clarification": "Before designing, ask: What's the scale (users, RPS)? What are the main constraints (latency, consistency, cost)?",
        "step_2_approach": "Draw boxes: Client → Load Balancer → API Servers → Database. Then fill in each layer with specific tech choices.",
        "step_3_iterate": "For each bottleneck (CPU, disk I/O, network), explain how your design scales. Consider trade-offs between consistency and availability.",
        "step_4_pressure_test": "When interviewer challenges your choice ('What if we need 10x traffic?'), modify one layer at a time (add caching, sharding, replicas)."
    },
    "Algorithms": {
        "step_1_clarification": "Ask: What's the input size? What's the acceptable time/space complexity? Are there any constraints on the data?",
        "step_2_approach": "Start with a brute force solution first. State its complexity. Then optimize: can you use a hash map? Binary search? DP?",
        "step_3_iterate": "Write pseudocode before actual code. Trace through one example. Explain each step as you code.",
        "step_4_pressure_test": "When asked about edge cases, go through them systematically: empty input, single element, duplicates, negative numbers."
    },
    "Communication": {
        "step_1_clarification": "Pause every 90 seconds. Ask the interviewer: 'Does that make sense so far, or should I clarify?'",
        "step_2_approach": "Use the STAR method: Situation → Task → Action → Result. When explaining a project, follow this structure.",
        "step_3_iterate": "If you catch yourself rambling (over 2 minutes on one point), reset: 'Let me summarize that: [1-2 sentence summary]'.",
        "step_4_pressure_test": "When the interviewer asks a follow-up, don't immediately go deep. Ask: 'Would you like me to dive into [specific area], or is this direction good?'"
    },
    "Code Quality": {
        "step_1_clarification": "Ask: What's the expected input format? Should I handle errors? What's the naming convention?",
        "step_2_approach": "Write readable code first: meaningful variable names, clear function signatures, proper indentation. Then optimize.",
        "step_3_iterate": "As you code, explain your variable naming: 'I'm using `user_ids` instead of `u` because it's clearer.' Add comments for complex logic.",
        "step_4_pressure_test": "When asked to optimize, refactor step-by-step: first remove nested loops, then optimize data structures, then consider caching."
    },
    "Following Instructions": {
        "step_1_clarification": "Restate the problem in your own words. Confirm: 'So I need to return [X], not [Y], right?'",
        "step_2_approach": "Write down the constraints and examples. Keep this visible while coding.",
        "step_3_iterate": "Before submitting code, trace through the given examples. Verify each one passes.",
        "step_4_pressure_test": "If the interviewer says 'that's not quite right', ask: 'What edge case am I missing?' Don't assume—clarify."
    }
}

BEHAVIORAL_TACTICS = {
    "Rambling": {
        "tactic_name": "The 2-Minute Sanity Check",
        "description": "Every 2 minutes of explanation, pause and state your current hypothesis or progress in 1-2 sentences.",
        "example": "Instead of: [long explanation about caching strategies]. Try: 'So far, I'm thinking we need Redis for caching because of the scale. Should I dive into consistency trade-offs, or move on?'"
    },
    "Filler Words": {
        "tactic_name": "The Pause Technique",
        "description": "When you feel an 'um' or 'uh' coming, pause instead. The silence is better than filler. Take a breath.",
        "example": "Instead of: 'Um, so we could, like, uh, use a hash map.' Try: [pause 2 seconds] 'We could use a hash map here.'"
    },
    "Long Silences": {
        "tactic_name": "The Thinking Out Loud Protocol",
        "description": "Instead of going silent, narrate your thinking: 'I'm thinking through the edge cases here...' or 'Let me trace this example.'",
        "example": "Instead of: [5 seconds of silence while coding]. Try: 'I'm going to iterate through the array and check each element against our conditions.'"
    },
    "Unclear Explanations": {
        "tactic_name": "The Clarification Loop",
        "description": "After each explanation, ask: 'Does that make sense? Should I explain differently or move on?'",
        "example": "Instead of: [vague explanation that interviewer looks confused about]. Try: 'Let me rephrase: we're grouping events by type because...'"
    },
    "Nervousness": {
        "tactic_name": "The Confidence Anchor",
        "description": "Start each answer with a confident statement: 'I'll use X approach because...' Commit to a direction first, then elaborate.",
        "example": "Instead of: 'Maybe we could, I think we should, or perhaps...' Try: 'I'll start with a brute force solution, then optimize.'"
    },
    "Missing Trade-offs": {
        "tactic_name": "The Trade-off Framework",
        "description": "Whenever you propose a solution, explicitly state the trade-off: 'This is fast but uses more memory. Should I optimize for speed or space?'",
        "example": "Instead of: [proposing solution without context]. Try: 'I'm choosing a hash map for O(1) lookup—it uses more memory but we prioritize speed here.'"
    }
}

RESOURCE_DATABASE = {
    "System Design": [
        {"title": "Designing Data-Intensive Applications", "author": "Martin Kleppmann", "type": "book", "url": "https://dataintensive.info"},
        {"title": "ByteByteGo System Design", "author": "Alex Xu", "type": "course", "url": "https://bytebytego.com"},
        {"title": "Netflix Tech Blog - Distributed Systems", "type": "blog", "url": "https://netflixtechblog.com"},
        {"title": "AWS Architecture Patterns", "type": "documentation", "url": "https://docs.aws.amazon.com/"}
    ],
    "Algorithms": [
        {"title": "LeetCode Pattern List", "type": "practice", "url": "https://leetcode.com/discuss/general-discussion/"},
        {"title": "Cracking the Coding Interview", "author": "Gayle Laakmann McDowell", "type": "book", "url": "https://crackingthecodinginterview.com"},
        {"title": "Introduction to Algorithms (CLRS)", "author": "Cormen, Leiserson, Rivest, Stein", "type": "book", "url": "https://mitpress.mit.edu/9780262033848/"},
        {"title": "TopCoder Algorithm Tutorials", "type": "tutorial", "url": "https://www.topcoder.com/community/competitive-programming/tutorials/"}
    ],
    "Communication": [
        {"title": "Crucial Conversations", "author": "Patterson, Grenny, McMillan, Switzler", "type": "book", "url": "https://www.vitalsmarts.com/crucial-conversations/"},
        {"title": "The Art of Clear Thinking", "type": "blog", "url": "https://www.youtube.com/results?search_query=clear+communication+explained"},
        {"title": "STAR Method Guide for Interviews", "type": "guide", "url": "https://www.thebalancecareers.com/"},
        {"title": "Technical Communication Course", "type": "course", "url": "https://www.udemy.com/"}
    ],
    "Code Quality": [
        {"title": "Clean Code", "author": "Robert C. Martin", "type": "book", "url": "https://www.pearson.com/"},
        {"title": "Refactoring", "author": "Martin Fowler", "type": "book", "url": "https://refactoring.guru/"},
        {"title": "Google Style Guide (Python/JavaScript)", "type": "guide", "url": "https://google.github.io/styleguide/"},
        {"title": "Code Review Best Practices", "type": "guide", "url": "https://google.github.io/eng-practices/review/"}
    ],
    "Following Instructions": [
        {"title": "Problem-Solving Interview Techniques", "type": "guide", "url": "https://www.interviewbit.com/"},
        {"title": "Effective Listening Skills", "type": "course", "url": "https://www.coursera.org/"},
        {"title": "Debugging Real Issues in Technical Interviews", "type": "blog", "url": "https://dev.to/"}
    ]
}

def generate_remediation_plan(detected_gaps: list[str]) -> dict:
    """Generate a comprehensive remediation plan with tactical strategies, behavioral tools, and resources."""
    if not detected_gaps:
        return {
            "summary": "No specific gaps identified. Continue practicing!",
            "topics": [],
            "tactical_strategies": [],
            "behavioral_tactics": [],
            "resources": []
        }

    # Get tactical strategies for detected gaps
    strategies = []
    for gap in detected_gaps:
        if gap in TACTICAL_STRATEGIES:
            strategies.append({
                "gap": gap,
                "strategy": TACTICAL_STRATEGIES[gap]
            })
    
    # Get behavioral tactics for communication gaps
    tactics = []
    behavioral_gaps = {
        "Rambling": BEHAVIORAL_TACTICS.get("Rambling"),
        "Unclear Explanations": BEHAVIORAL_TACTICS.get("Unclear Explanations"),
        "Filler Words": BEHAVIORAL_TACTICS.get("Filler Words"),
        "Long Silences": BEHAVIORAL_TACTICS.get("Long Silences"),
        "Nervousness": BEHAVIORAL_TACTICS.get("Nervousness"),
    }
    for gap_pattern, tactic in behavioral_gaps.items():
        if tactic and any(gap_pattern.lower() in g.lower() for g in detected_gaps):
            tactics.append(tactic)
    
    # Get relevant resources
    resources = []
    for gap in detected_gaps:
        if gap in RESOURCE_DATABASE:
            resources.extend(RESOURCE_DATABASE[gap])
    
    # Remove duplicates from resources
    seen = set()
    resources = [r for r in resources if not (r["title"] in seen or seen.add(r["title"]))]
    
    # Generate LLM-based summary
    prompt = f"""
    You are a technical career coach. The candidate has identified the following skill gaps:
    {', '.join(detected_gaps)}
    
    Create a 2-3 sentence summary of the top priority for remediation in the next 3 days.
    Be concise and action-oriented.
    """
    
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}]
    )
    
    summary = response.choices[0].message.content

    return {
        "summary": summary,
        "tactical_strategies": strategies,
        "behavioral_tactics": tactics,
        "resources": resources,
        "gaps_addressed": detected_gaps
    }
