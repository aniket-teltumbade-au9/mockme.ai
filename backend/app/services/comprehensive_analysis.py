"""
Comprehensive Analysis Generator

Service for generating detailed post-interview analysis and improvement plans.
Extracts gaps from analysis data, categorizes them, and generates actionable improvement guidance.
"""

from typing import List, Optional, Dict, Any, Tuple
import re
from app.models.analysis import (
    CommunicationGap, PrioritizedGap, TopicInfo, ResolutionStep, ResolutionPath,
    StudyResource, HolisticGuidance, TransformationAnalysis, ImprovementPlan,
    PriorityLevel
)
from app.models.topic_database import TOPIC_DATABASE
from app.services.remediation import BEHAVIORAL_TACTICS, RESOURCE_DATABASE


class ComprehensiveAnalysisGenerator:
    """
    Generates comprehensive improvement plans from interview analysis data.
    
    Methods focus on extracting, categorizing, and enriching gaps with actionable
    improvement guidance, topic information, and curated resources.
    """
    
    # Mapping of communication gap descriptions to categories
    COMMUNICATION_CATEGORIES = {
        "Clarity": ["unclear", "ambiguous", "hard to follow", "vague"],
        "Structure": ["disorganized", "unstructured", "scattered", "jumping around", "no flow"],
        "Conciseness": ["rambling", "too long", "verbose", "repetitive", "long-winded", "filler words"],
        "Active Listening": ["not listening", "didn't listen", "didn't respond", "missed", "ignored", "failed to respond"],
        "Confidence": ["hesitant", "uncertain", "nervous", "lacked confidence", "second-guessing", "hedging"],
        "Technical Vocabulary": ["imprecise terminology", "wrong terms", "confused terminology", "technical vocab", "terminology", "technical terms", "incorrect terminology"]
    }
    
    @staticmethod
    def extract_communication_gaps(analysis: Dict[str, Any]) -> List[CommunicationGap]:
        """
        Extract communication gaps from Session.analysis.communication_assessment.gaps
        
        For each gap:
        - Determine which category it belongs to (Clarity, Structure, Conciseness, etc.)
        - Extract or infer the candidate_response from transcript context
        - Determine severity level (Critical/High/Medium/Low)
        - Generate 3-5 improvement tips
        - Create a sample improved response
        - Look up related behavioral tactics
        
        Args:
            analysis: Dict containing the analysis data with communication_assessment
            
        Returns:
            List of CommunicationGap objects with full enrichment
            
        Raises:
            ValueError: If analysis structure is invalid
        """
        # Handle missing or invalid analysis
        if not analysis or not isinstance(analysis, dict):
            return []
        
        communication_assessment = analysis.get("communication_assessment", {})
        if not isinstance(communication_assessment, dict):
            return []
        
        gaps_data = communication_assessment.get("gaps", [])
        if not gaps_data or not isinstance(gaps_data, list):
            return []
        
        # Extract transcript history for context
        history = analysis.get("history", [])
        
        communication_gaps = []
        
        for gap_desc in gaps_data:
            if not gap_desc or not isinstance(gap_desc, str):
                continue
            
            # Skip whitespace-only strings
            gap_desc = gap_desc.strip()
            if not gap_desc:
                continue
            
            # Categorize the gap
            category = ComprehensiveAnalysisGenerator._categorize_communication_gap(gap_desc)
            
            # Determine severity based on gap description keywords
            severity = ComprehensiveAnalysisGenerator._determine_communication_severity(gap_desc)
            
            # Extract candidate response from history or gap description
            candidate_response = ComprehensiveAnalysisGenerator._extract_candidate_response(
                gap_desc, history, category
            )
            
            # Generate improvement tips specific to this gap
            improvement_tips = ComprehensiveAnalysisGenerator._generate_improvement_tips(
                category, gap_desc
            )
            
            # Create a sample improved response
            sample_improved = ComprehensiveAnalysisGenerator._generate_improved_response(
                category, candidate_response, gap_desc
            )
            
            # Look up related behavioral tactic
            related_tactic = ComprehensiveAnalysisGenerator._find_related_tactic(
                category, gap_desc
            )
            
            # Create CommunicationGap object
            comm_gap = CommunicationGap(
                category=category,
                severity=severity,
                description=gap_desc,
                candidate_response=candidate_response,
                improvement_tips=improvement_tips,
                sample_improved_response=sample_improved,
                related_tactic=related_tactic
            )
            
            communication_gaps.append(comm_gap)
        
        return communication_gaps
    
    @staticmethod
    def _categorize_communication_gap(gap_description: str) -> str:
        """
        Categorize a communication gap into one of six categories.
        
        Args:
            gap_description: String describing the communication gap
            
        Returns:
            One of: Clarity, Structure, Conciseness, Active Listening, Confidence, Technical Vocabulary
        """
        gap_lower = gap_description.lower()
        
        # Score each category based on keyword matches
        category_scores = {}
        
        for category, keywords in ComprehensiveAnalysisGenerator.COMMUNICATION_CATEGORIES.items():
            matches = sum(1 for keyword in keywords if keyword in gap_lower)
            category_scores[category] = matches
        
        # Return the category with highest score, default to Clarity
        best_category = max(category_scores, key=category_scores.get)
        
        if category_scores[best_category] > 0:
            return best_category
        else:
            return "Clarity"  # Default category
    
    @staticmethod
    def _determine_communication_severity(gap_description: str) -> PriorityLevel:
        """
        Determine severity level for a communication gap.
        
        Args:
            gap_description: String describing the communication gap
            
        Returns:
            PriorityLevel (Critical, High, Medium, Low)
        """
        gap_lower = gap_description.lower()
        
        # Critical indicators: communication failures that impact hire decision
        critical_keywords = ["completely unclear", "unintelligible", "failed to communicate", 
                           "unable to explain", "no understanding demonstrated"]
        if any(kw in gap_lower for kw in critical_keywords):
            return PriorityLevel.CRITICAL
        
        # High indicators: significant communication issues
        high_keywords = ["rambling", "very unclear", "major confusion", "hard to follow",
                        "significant miscommunication", "lost the interviewer"]
        if any(kw in gap_lower for kw in high_keywords):
            return PriorityLevel.HIGH
        
        # Medium indicators: notable but recoverable issues
        medium_keywords = ["could be clearer", "somewhat unclear", "minor rambling",
                          "occasionally lost", "lacks structure"]
        if any(kw in gap_lower for kw in medium_keywords):
            return PriorityLevel.MEDIUM
        
        # Default to low for minor issues
        return PriorityLevel.LOW
    
    @staticmethod
    def _extract_candidate_response(gap_description: str, history: List[Dict], 
                                   category: str) -> str:
        """
        Extract the candidate's actual response from history or create from gap description.
        
        Args:
            gap_description: Description of the gap
            history: Interview history/transcript
            category: Communication category
            
        Returns:
            String representing the candidate's response that caused this gap
        """
        # If gap description contains indicators of direct quote, use it
        if '"' in gap_description:
            # Extract quoted content
            match = re.search(r'"([^"]+)"', gap_description)
            if match:
                return match.group(1)
        
        # Try to find related content in history
        if history and isinstance(history, list):
            for entry in history:
                if isinstance(entry, dict) and "content" in entry:
                    content = entry.get("content", "")
                    if any(word in content.lower() for word in gap_description.lower().split()[:3]):
                        # Return a truncated version (max 300 chars)
                        return content[:300] + ("..." if len(content) > 300 else "")
        
        # Fallback: create plausible candidate response based on category and gap
        fallback_responses = {
            "Clarity": f"[Candidate explanation that lacked clarity: {gap_description}]",
            "Structure": "[Candidate's response lacked clear structure or organization]",
            "Conciseness": "[Candidate's rambling or verbose response about the topic]",
            "Active Listening": "[Candidate didn't respond to the interviewer's clarification or hints]",
            "Confidence": "[Candidate hesitated and showed uncertainty in their answer]",
            "Technical Vocabulary": "[Candidate used imprecise or incorrect technical terms]"
        }
        
        return fallback_responses.get(category, gap_description)
    
    @staticmethod
    def _generate_improvement_tips(category: str, gap_description: str) -> List[str]:
        """
        Generate 3-5 actionable improvement tips specific to the gap.
        
        Args:
            category: Communication category
            gap_description: Description of the gap
            
        Returns:
            List of 3-5 actionable improvement tips
        """
        tips_by_category = {
            "Clarity": [
                "Restate the problem in your own words before answering to ensure you understood it correctly",
                "Use concrete examples instead of abstract language when explaining concepts",
                "After each major point, ask: 'Does that make sense?' or 'Should I clarify this further?'",
                "Avoid jargon without explanation—define technical terms as you use them"
            ],
            "Structure": [
                "Use the 'Situation → Task → Action → Result' framework for behavioral questions",
                "Start with a high-level summary: 'I'll cover three things: [1], [2], [3]'",
                "Number your points: 'First, second, third' to create clarity",
                "Summarize after each major section: 'So to recap that part: [2-3 sentence summary]'"
            ],
            "Conciseness": [
                "Record yourself practicing and flag any answers over 2 minutes—re-script them to 90 seconds",
                "Use the 2-minute sanity check: every 2 minutes, pause and restate your current point in 1 sentence",
                "Delete filler words practice: say 'silence is better' and pause instead of 'um' or 'uh'",
                "Before explaining, state your thesis: 'I think we should [X] because [Y]' then elaborate"
            ],
            "Active Listening": [
                "After the interviewer speaks, pause 2 seconds before responding to show you're thinking about their point",
                "Reference their previous questions: 'Following up on what you asked earlier...'",
                "Ask clarifying questions: 'Just to make sure I understand correctly...' or 'Are you asking about...?'",
                "Incorporate feedback immediately: If they say 'more technical depth,' dive deeper in your next answer"
            ],
            "Confidence": [
                "Replace hedging language: change 'I think maybe we could' to 'I'll use [X] because [Y]'",
                "Start answers with a committed statement: 'I'll approach this with...' rather than 'Maybe we could...'",
                "Practice power pauses: 2-3 second silence is better than 'um,' 'uh,' or 'like'",
                "Practice your reasoning out loud: narrate your thinking as you work through problems"
            ],
            "Technical Vocabulary": [
                "Create a glossary of terms relevant to your target role and review it before interviews",
                "When unsure about a term, ask: 'By [term], do you mean [your definition]?'",
                "Use more precise terminology: instead of 'fast,' say 'O(log n) time complexity'",
                "If you use a term incorrectly, catch and correct yourself: 'I misspoke—I meant [correct term]'"
            ]
        }
        
        base_tips = tips_by_category.get(category, [
            "Record yourself and listen for patterns",
            "Ask for feedback from peers or mentors",
            "Practice with mock interview partners",
            "Review recordings of strong performers in your field"
        ])
        
        # Return up to 5 tips
        return base_tips[:5]
    
    @staticmethod
    def _generate_improved_response(category: str, candidate_response: str, 
                                   gap_description: str) -> str:
        """
        Generate a sample improved response demonstrating better approach.
        
        Args:
            category: Communication category
            candidate_response: The candidate's original response
            gap_description: Description of the gap
            
        Returns:
            String showing an improved version of the response
        """
        if category == "Clarity":
            return (
                "Instead of that explanation, I'd restate the problem first: 'So if I understand correctly, "
                "you're asking about [specific aspect]?' Then I'd break it into concrete steps: "
                "'Here's my approach: [Step 1], [Step 2], [Step 3]. Does that make sense so far?'"
            )
        elif category == "Structure":
            return (
                "I'd organize my answer like this: First, [high-level approach]. "
                "Second, [implementation details]. Third, [trade-offs and alternatives]. "
                "Finally, [summary and why this works]. This way, the interviewer can follow my thinking clearly."
            )
        elif category == "Conciseness":
            return (
                "Instead of going into all those details, I'd be more concise: "
                "'I'd use [approach] because of [key reason]. This gives us [benefit]. "
                "Would you like me to dive deeper into any part?' Then I'd wait for their direction."
            )
        elif category == "Active Listening":
            return (
                "When the interviewer suggested [feedback], I should have immediately incorporated it: "
                "'Great point—let me take that into account. So now I'd [revised approach], "
                "which addresses your concern about [their specific point].'"
            )
        elif category == "Confidence":
            return (
                "Instead of hedging, I'd commit to an approach: 'I'll start with a brute force solution—"
                "here's my thinking: [reasoning].' Then, if challenged, I'd say: 'That's a good question. "
                "Here's how I'd adjust: [modification].'"
            )
        elif category == "Technical Vocabulary":
            return (
                "I'd use more precise terminology: instead of saying '[vague term]', "
                "I'd say '[specific technical term]' because [definition]. "
                "If unsure, I'd define: 'By [term], I mean [your definition]—is that what you're asking?'"
            )
        
        # Fallback
        return (
            "A better approach would have been to: (1) clearly structure the answer, "
            "(2) use concrete examples, (3) confirm understanding with the interviewer, "
            "and (4) keep the explanation focused and concise."
        )
    
    @staticmethod
    def _find_related_tactic(category: str, gap_description: str) -> Optional[Dict[str, Any]]:
        """
        Look up related behavioral tactic from BEHAVIORAL_TACTICS.
        
        Args:
            category: Communication category
            gap_description: Description of the gap
            
        Returns:
            Dict with tactic information, or None if no match found
        """
        gap_lower = gap_description.lower()
        
        # Map communication categories to behavioral tactics
        tactic_mappings = {
            "Conciseness": ["Rambling", "Filler Words"],
            "Clarity": ["Unclear Explanations"],
            "Confidence": ["Nervousness"],
            "Active Listening": ["Unclear Explanations"],
            "Structure": ["Unclear Explanations"],
        }
        
        tactics_to_check = tactic_mappings.get(category, [])
        
        for tactic_name in tactics_to_check:
            if tactic_name in BEHAVIORAL_TACTICS:
                tactic = BEHAVIORAL_TACTICS[tactic_name]
                # Check if any keywords from the tactic match the gap
                if (tactic_name.lower() in gap_lower or 
                    any(word in gap_lower for word in tactic_name.lower().split())):
                    return tactic
        
        return None
    
    @staticmethod
    def extract_technical_gaps(analysis: Dict[str, Any]) -> List[str]:
        """
        Extract all technical gaps from Session.analysis.skill_gaps and recommended_topics.
        
        Combines gaps from both arrays and removes duplicates while maintaining
        semantic uniqueness. Only extracts actual string values.
        
        Args:
            analysis: Dict containing the analysis data with skill_gaps and recommended_topics
            
        Returns:
            List of unique gap strings without duplication
            
        Raises:
            ValueError: If analysis structure is invalid
            
        Requirements: 1.1
        """
        if not analysis or not isinstance(analysis, dict):
            return []
        
        gaps = []
        
        # Extract from skill_gaps array (only strings)
        skill_gaps = analysis.get("skill_gaps", [])
        if isinstance(skill_gaps, list):
            gaps.extend([gap.strip() for gap in skill_gaps if isinstance(gap, str) and gap.strip()])
        
        # Extract from recommended_topics array (only strings)
        recommended_topics = analysis.get("recommended_topics", [])
        if isinstance(recommended_topics, list):
            gaps.extend([topic.strip() for topic in recommended_topics if isinstance(topic, str) and topic.strip()])
        
        # Remove duplicates while preserving order (case-insensitive)
        seen = set()
        unique_gaps = []
        for gap in gaps:
            gap_lower = gap.lower()
            if gap_lower not in seen:
                seen.add(gap_lower)
                unique_gaps.append(gap)
        
        return unique_gaps
    
    @staticmethod
    def assign_priority(gaps: List[str], analysis: Dict[str, Any]) -> List[PrioritizedGap]:
        """
        Assign priority levels to technical gaps based on position and frequency.
        
        Prioritization rules:
        - Gaps from recommended_topics receive higher priority than skill_gaps
        - Position in array affects priority (earlier = higher)
        - Frequency of related issues increases priority
        
        Args:
            gaps: List of gap strings to prioritize
            analysis: Dict containing analysis data with skill_gaps, recommended_topics, etc.
            
        Returns:
            List of PrioritizedGap objects sorted by priority descending
            
        Requirements: 1.2, 1.3
        """
        if not gaps or not analysis:
            return []
        
        prioritized_gaps = []
        
        skill_gaps = analysis.get("skill_gaps", [])
        recommended_topics = analysis.get("recommended_topics", [])
        
        for gap in gaps:
            # Count frequency: how many times this gap appears (case-insensitive) in both arrays
            gap_lower = gap.lower()
            frequency = 0
            
            # Count in skill_gaps (case-insensitive)
            if isinstance(skill_gaps, list):
                frequency += sum(1 for sg in skill_gaps if isinstance(sg, str) and sg.strip().lower() == gap_lower)
            
            # Count in recommended_topics (case-insensitive)
            if isinstance(recommended_topics, list):
                frequency += sum(1 for rt in recommended_topics if isinstance(rt, str) and rt.strip().lower() == gap_lower)
            
            # Ensure minimum frequency is 1 (gap was detected at least once)
            frequency = max(1, frequency)
            
            # Determine base priority based on source and position
            if gap in recommended_topics:
                position_index = recommended_topics.index(gap)
                # Recommended topics get higher baseline priority
                base_priority_score = 90 - (position_index * 5)  # Descending based on position
            elif gap in skill_gaps:
                position_index = skill_gaps.index(gap)
                # Skill gaps get lower baseline priority
                base_priority_score = 60 - (position_index * 3)  # Descending based on position
            else:
                base_priority_score = 40  # Default for gaps not in either array
            
            # Boost impact score based on frequency
            # Each additional occurrence increases impact by 5 points (max boost of +15 for frequency 3+)
            frequency_boost = min(15, (frequency - 1) * 5)
            base_priority_score += frequency_boost
            
            # Ensure score stays in 0-100 range
            impact_score = max(0, min(100, base_priority_score))
            
            # Determine priority level based on impact score
            if impact_score >= 85:
                priority = PriorityLevel.CRITICAL
            elif impact_score >= 65:
                priority = PriorityLevel.HIGH
            elif impact_score >= 40:
                priority = PriorityLevel.MEDIUM
            else:
                priority = PriorityLevel.LOW
            
            # Detect where this gap was identified
            detected_in = "technical_dive"  # Default
            if "coding" in gap.lower():
                detected_in = "coding_round"
            elif "behavioral" in gap.lower():
                detected_in = "behavioral"
            
            prioritized_gap = PrioritizedGap(
                category=gap,
                priority=priority,
                frequency=frequency,
                impact_score=impact_score,
                detected_in=detected_in
            )
            
            prioritized_gaps.append(prioritized_gap)
        
        # Sort by priority descending, then alphabetically
        priority_order = {
            PriorityLevel.CRITICAL: 0,
            PriorityLevel.HIGH: 1,
            PriorityLevel.MEDIUM: 2,
            PriorityLevel.LOW: 3
        }
        
        prioritized_gaps.sort(
            key=lambda x: (priority_order[x.priority], x.category.lower())
        )
        
        return prioritized_gaps
    
    @staticmethod
    def build_topic_info(gap_category: str) -> Optional[TopicInfo]:
        """
        Retrieve topic information from TOPIC_DATABASE for a gap category.
        
        Returns structured topic information containing concept, subtopics,
        competencies, and pitfalls. Uses predefined database, not LLM-generated.
        
        Args:
            gap_category: The gap category to look up (e.g., "System Design", "Algorithms")
            
        Returns:
            TopicInfo object with complete topic data, or None if not found
            
        Requirements: 2.1, 2.2
        """
        if not gap_category or not isinstance(gap_category, str):
            return None
        
        # Normalize category name
        gap_category = gap_category.strip()
        
        # Look up in TOPIC_DATABASE
        if gap_category in TOPIC_DATABASE:
            topic_data = TOPIC_DATABASE[gap_category]
            
            return TopicInfo(
                concept=topic_data.get("concept", ""),
                subtopics=topic_data.get("subtopics", []),
                competencies=topic_data.get("competencies", []),
                pitfalls=topic_data.get("pitfalls", [])
            )
        
        return None
    
    @staticmethod
    def build_resolution_paths(gaps: List[str]) -> List[ResolutionPath]:
        """
        Build 4-step resolution paths for each gap.
        
        Creates structured resolution guidance with:
        - Step 1: Understand (key concepts to learn) - uses TACTICAL_STRATEGIES step_1_clarification
        - Step 2: Practice (specific practice activities) - uses TACTICAL_STRATEGIES step_2_approach
        - Step 3: Demonstrate (how to showcase in interview) - uses TACTICAL_STRATEGIES step_3_iterate
        - Step 4: Validate (self-assessment approach) - uses TACTICAL_STRATEGIES step_4_pressure_test
        
        Includes time estimates, gap-specific activities from TACTICAL_STRATEGIES, and relevant resources.
        
        Args:
            gaps: List of gap strings to build resolution paths for
            
        Returns:
            List of ResolutionPath objects with 4-step guidance
            
        Requirements: 5.1, 5.2, 5.6
        """
        if not gaps:
            return []
        
        from app.services.remediation import TACTICAL_STRATEGIES
        
        resolution_paths = []
        
        for gap in gaps:
            # Get tactical strategy for this gap if available
            tactical_strategy = TACTICAL_STRATEGIES.get(gap, {})
            
            # Get topic info for this gap (to include resources)
            topic_info = ComprehensiveAnalysisGenerator.build_topic_info(gap)
            
            # Curate resources for this gap (unpack tuple: resources, coverage_gaps)
            gap_resources, _ = ComprehensiveAnalysisGenerator.curate_resources([gap])
            
            # Build step 1: Understand
            step1_description = tactical_strategy.get(
                "step_1_clarification",
                f"Learn the foundational concepts and theory behind {gap}. Start with core principles and build understanding."
            )
            step1 = ResolutionStep(
                step_number=1,
                title="Understand",
                description=step1_description,
                activities=ComprehensiveAnalysisGenerator._get_understand_activities(gap, tactical_strategy),
                time_estimate="1-2 hours",
                resources=gap_resources[:2] if gap_resources else []  # Limit to 2 resources per step
            )
            
            # Build step 2: Practice
            step2_description = tactical_strategy.get(
                "step_2_approach",
                f"Apply your knowledge through practical exercises and problems related to {gap}."
            )
            step2 = ResolutionStep(
                step_number=2,
                title="Practice",
                description=step2_description,
                activities=ComprehensiveAnalysisGenerator._get_practice_activities(gap, tactical_strategy),
                time_estimate="3-5 hours",
                resources=[r for r in gap_resources if r.type in ["practice", "tutorial", "course"]][:3]
            )
            
            # Build step 3: Demonstrate
            step3_description = tactical_strategy.get(
                "step_3_iterate",
                f"Practice explaining and demonstrating your {gap} knowledge in an interview setting."
            )
            step3 = ResolutionStep(
                step_number=3,
                title="Demonstrate",
                description=step3_description,
                activities=ComprehensiveAnalysisGenerator._get_demonstrate_activities(gap, tactical_strategy),
                time_estimate="2-3 hours",
                resources=[r for r in gap_resources if r.type in ["guide", "blog", "course"]][:2]
            )
            
            # Build step 4: Validate
            step4_description = tactical_strategy.get(
                "step_4_pressure_test",
                f"Confirm your improvement through self-assessment and practice interviews."
            )
            step4 = ResolutionStep(
                step_number=4,
                title="Validate",
                description=step4_description,
                activities=ComprehensiveAnalysisGenerator._get_validate_activities(gap, tactical_strategy),
                time_estimate="1-2 hours",
                resources=[r for r in gap_resources if r.type in ["practice", "guide"]][:2]
            )
            
            # Create resolution path
            resolution_path = ResolutionPath(
                gap_category=gap,
                steps=[step1, step2, step3, step4],
                estimated_total_time="7-12 hours"
            )
            
            resolution_paths.append(resolution_path)
        
        return resolution_paths
    
    @staticmethod
    def _get_understand_activities(gap: str, tactical_strategy: Dict[str, Any]) -> List[str]:
        """
        Generate specific 'Understand' phase activities based on gap type and tactical strategy.
        
        Args:
            gap: The gap category (e.g., "System Design", "Algorithms")
            tactical_strategy: The tactical strategy dict for this gap
            
        Returns:
            List of specific activities for the Understand phase
        """
        base_activities = [
            "Review core concepts from recommended resources",
            "Study fundamentals and foundational principles",
            "Read documentation or textbook chapters"
        ]
        
        # Add gap-specific activities
        gap_lower = gap.lower()
        if "system design" in gap_lower:
            base_activities.extend([
                "Understand CAP theorem and consistency models",
                "Learn about load balancing, caching, and database scaling basics"
            ])
        elif "algorithm" in gap_lower:
            base_activities.extend([
                "Review Big-O notation and complexity analysis",
                "Study data structures (arrays, lists, trees, graphs, hash tables)"
            ])
        elif "code quality" in gap_lower or "code" in gap_lower:
            base_activities.extend([
                "Study naming conventions and code readability best practices",
                "Learn common refactoring techniques"
            ])
        elif "communication" in gap_lower:
            base_activities.extend([
                "Learn the STAR method structure",
                "Study effective communication frameworks"
            ])
        elif "following instruction" in gap_lower:
            base_activities.extend([
                "Learn active listening techniques",
                "Practice restating requirements clearly"
            ])
        elif "object-oriented" in gap_lower or "oop" in gap_lower:
            base_activities.extend([
                "Study SOLID principles and design patterns",
                "Learn encapsulation, inheritance, and polymorphism concepts"
            ])
        elif "database" in gap_lower:
            base_activities.extend([
                "Study SQL fundamentals and schema design",
                "Learn indexing and query optimization techniques"
            ])
        elif "data structure" in gap_lower:
            base_activities.extend([
                "Study various data structures (arrays, lists, trees, graphs, hash tables)",
                "Learn when to use each data structure"
            ])
        elif "problem solving" in gap_lower:
            base_activities.extend([
                "Study different problem-solving strategies and approaches",
                "Learn how to break down complex problems"
            ])
        elif "behavioral" in gap_lower:
            base_activities.extend([
                "Learn the STAR method for behavioral questions",
                "Study frameworks for answering behavioral questions"
            ])
        
        return base_activities
    
    @staticmethod
    def _get_practice_activities(gap: str, tactical_strategy: Dict[str, Any]) -> List[str]:
        """
        Generate specific 'Practice' phase activities based on gap type and tactical strategy.
        
        Args:
            gap: The gap category (e.g., "System Design", "Algorithms")
            tactical_strategy: The tactical strategy dict for this gap
            
        Returns:
            List of specific activities for the Practice phase
        """
        base_activities = [
            "Complete 5-10 practice problems or exercises",
            "Work through provided examples step-by-step",
            "Build small projects to apply knowledge"
        ]
        
        # Add gap-specific activities
        gap_lower = gap.lower()
        if "system design" in gap_lower:
            base_activities.extend([
                "Design 3-5 systems at different scales (100 users to 1M users)",
                "Practice identifying and resolving bottlenecks",
                "Work through trade-off scenarios"
            ])
        elif "algorithm" in gap_lower:
            base_activities.extend([
                "Solve 10-15 LeetCode-style problems",
                "Practice analyzing time and space complexity",
                "Implement sorting and searching algorithms from scratch"
            ])
        elif "code quality" in gap_lower or "code" in gap_lower:
            base_activities.extend([
                "Refactor 3-5 code samples to improve readability",
                "Add comprehensive comments and documentation",
                "Practice code review techniques on peer code"
            ])
        elif "communication" in gap_lower:
            base_activities.extend([
                "Record 5 practice responses using STAR method",
                "Practice 2-minute summaries of complex topics",
                "Work on pausing and pacing delivery"
            ])
        elif "following instruction" in gap_lower:
            base_activities.extend([
                "Practice restating problem requirements before solving",
                "Work through 5 problems with edge case verification",
                "Practice asking clarifying questions"
            ])
        elif "object-oriented" in gap_lower or "oop" in gap_lower:
            base_activities.extend([
                "Design 5-10 classes and hierarchies",
                "Practice applying design patterns to real scenarios",
                "Refactor code to improve OOP structure"
            ])
        elif "database" in gap_lower:
            base_activities.extend([
                "Write 10+ SQL queries of varying complexity",
                "Design 3-5 database schemas",
                "Practice query optimization"
            ])
        elif "data structure" in gap_lower:
            base_activities.extend([
                "Implement 5-10 data structure operations from scratch",
                "Solve problems using appropriate data structures",
                "Practice choosing optimal data structures"
            ])
        elif "problem solving" in gap_lower:
            base_activities.extend([
                "Work through 10-15 problem-solving scenarios",
                "Practice breaking down complex problems",
                "Learn and apply different solution approaches"
            ])
        elif "behavioral" in gap_lower:
            base_activities.extend([
                "Practice responding to 10-15 behavioral questions using STAR",
                "Record responses to different types of behavioral questions",
                "Work on structuring clear, concise stories about your experience"
            ])
        
        return base_activities
    
    @staticmethod
    def _get_demonstrate_activities(gap: str, tactical_strategy: Dict[str, Any]) -> List[str]:
        """
        Generate specific 'Demonstrate' phase activities based on gap type and tactical strategy.
        
        Args:
            gap: The gap category (e.g., "System Design", "Algorithms")
            tactical_strategy: The tactical strategy dict for this gap
            
        Returns:
            List of specific activities for the Demonstrate phase
        """
        base_activities = [
            "Record mock interview responses",
            "Practice explaining your approach to peers",
            "Conduct whiteboard/screen share practice sessions"
        ]
        
        # Add gap-specific activities
        gap_lower = gap.lower()
        if "system design" in gap_lower:
            base_activities.extend([
                "Record yourself designing a system under time pressure",
                "Practice handling interviewer challenges and trade-off questions",
                "Explain scaling decisions to a peer as if in an interview"
            ])
        elif "algorithm" in gap_lower:
            base_activities.extend([
                "Solve algorithm problems on whiteboard/screen share",
                "Talk through your solution approach before coding",
                "Explain complexity analysis to an interviewer"
            ])
        elif "code quality" in gap_lower or "code" in gap_lower:
            base_activities.extend([
                "Write clean code while explaining your choices",
                "Discuss variable naming and organization decisions",
                "Walk through refactoring decisions in real-time"
            ])
        elif "communication" in gap_lower:
            base_activities.extend([
                "Record yourself answering behavioral questions",
                "Practice transitions between ideas clearly",
                "Record and review for filler words and pacing"
            ])
        elif "following instruction" in gap_lower:
            base_activities.extend([
                "Record yourself restating requirements before solving",
                "Practice asking clarifying questions in mock interviews",
                "Demonstrate verification against problem requirements"
            ])
        elif "object-oriented" in gap_lower or "oop" in gap_lower:
            base_activities.extend([
                "Design a class hierarchy and explain design decisions",
                "Discuss how you apply OOP principles in real code",
                "Walk through design pattern implementations"
            ])
        elif "database" in gap_lower:
            base_activities.extend([
                "Design a database schema on whiteboard/screen share",
                "Explain query optimization decisions",
                "Walk through normalization decisions"
            ])
        elif "data structure" in gap_lower:
            base_activities.extend([
                "Implement a data structure while explaining choices",
                "Discuss trade-offs between different structures",
                "Explain when to use each structure"
            ])
        elif "problem solving" in gap_lower:
            base_activities.extend([
                "Record yourself solving problems and explaining approach",
                "Practice articulating your problem-solving strategy",
                "Explain how you break down complex problems"
            ])
        elif "behavioral" in gap_lower:
            base_activities.extend([
                "Record yourself answering behavioral questions",
                "Practice delivering your stories with good pacing and structure",
                "Review recordings for clarity and conciseness"
            ])
        
        return base_activities
    
    @staticmethod
    def _get_validate_activities(gap: str, tactical_strategy: Dict[str, Any]) -> List[str]:
        """
        Generate specific 'Validate' phase activities based on gap type and tactical strategy.
        
        Args:
            gap: The gap category (e.g., "System Design", "Algorithms")
            tactical_strategy: The tactical strategy dict for this gap
            
        Returns:
            List of specific activities for the Validate phase
        """
        base_activities = [
            "Complete timed practice assessments",
            "Get feedback from peers or mentors",
            "Self-assess against improvement checklist"
        ]
        
        # Add gap-specific activities
        gap_lower = gap.lower()
        if "system design" in gap_lower:
            base_activities.extend([
                "Take a timed system design assessment",
                "Record a system design session and review for gaps",
                "Compare your designs against elite-level responses"
            ])
        elif "algorithm" in gap_lower:
            base_activities.extend([
                "Solve 5 new algorithm problems without references",
                "Complete a timed coding assessment",
                "Review solutions against optimal approaches"
            ])
        elif "code quality" in gap_lower or "code" in gap_lower:
            base_activities.extend([
                "Write code and have it reviewed for quality",
                "Compare your code organization to best practices",
                "Refactor old code using new quality principles"
            ])
        elif "communication" in gap_lower:
            base_activities.extend([
                "Record a mock interview and assess for improvements",
                "Complete a communication checklist self-assessment",
                "Compare your responses to elite-level examples"
            ])
        elif "following instruction" in gap_lower:
            base_activities.extend([
                "Solve problems and verify against all requirements",
                "Take a problem-solving accuracy assessment",
                "Review edge case handling comprehensively"
            ])
        elif "object-oriented" in gap_lower or "oop" in gap_lower:
            base_activities.extend([
                "Review OOP code for adherence to principles",
                "Self-assess design decisions against best practices",
                "Compare your designs to expert-level examples"
            ])
        elif "database" in gap_lower:
            base_activities.extend([
                "Design and optimize a database under time pressure",
                "Review schema designs for normalization and efficiency",
                "Compare your schemas to expert-level designs"
            ])
        elif "data structure" in gap_lower:
            base_activities.extend([
                "Solve data structure problems without references",
                "Self-assess structure choices against optimal approaches",
                "Complete a data structure knowledge assessment"
            ])
        elif "problem solving" in gap_lower:
            base_activities.extend([
                "Solve new problems without references or help",
                "Assess your problem-solving approach effectiveness",
                "Compare your solutions to expert-level approaches"
            ])
        elif "behavioral" in gap_lower:
            base_activities.extend([
                "Record a mock interview with behavioral questions",
                "Self-assess your stories for structure and clarity",
                "Compare your responses to strong examples"
            ])
        
        return base_activities
    
    @staticmethod
    def curate_resources(gaps: List[str], filter_type: Optional[str] = None) -> Tuple[List[StudyResource], List[str]]:
        """
        Curate study resources from RESOURCE_DATABASE matching gap categories.
        
        Extracts resources from RESOURCE_DATABASE that match the provided gap categories.
        Converts them to StudyResource model objects, supports optional filtering by
        resource type, and identifies coverage gaps (gaps with no matching resources).
        
        Args:
            gaps: List of gap category strings to find resources for (e.g., ["System Design", "Algorithms"])
            filter_type: Optional type filter (e.g., "book", "course", "blog", "documentation", 
                        "tutorial", "practice", "guide")
            
        Returns:
            Tuple of:
            - List of StudyResource objects matching the gaps and filter
            - List of gap categories that have no matching resources (coverage gaps)
            
        Requirements: 5.3, 5.4, 5.5
        """
        if not gaps:
            return [], []
        
        curated_resources = []
        gaps_with_resources = set()
        
        # Normalize gap names for matching (case-insensitive)
        gaps_normalized = {gap.lower(): gap for gap in gaps}
        
        # Iterate through RESOURCE_DATABASE
        # Structure: {"Gap Category": [resource_dict1, resource_dict2, ...], ...}
        for db_category, resources_list in RESOURCE_DATABASE.items():
            db_category_lower = db_category.lower()
            
            # Check if this database category matches any of our gaps
            if db_category_lower not in gaps_normalized:
                continue
            
            # Mark this gap as having resources
            gaps_with_resources.add(gaps_normalized[db_category_lower])
            
            # Process each resource in this category
            if not isinstance(resources_list, list):
                continue
            
            for idx, resource_data in enumerate(resources_list):
                if not isinstance(resource_data, dict):
                    continue
                
                # Extract resource fields
                res_type = resource_data.get("type", "").lower() if resource_data.get("type") else ""
                
                # Apply type filter if specified
                if filter_type and res_type != filter_type.lower():
                    continue
                
                # Generate a unique resource ID (category + index)
                resource_id = f"{db_category_lower}_{idx}"
                
                # Create StudyResource object
                study_resource = StudyResource(
                    id=resource_id,
                    title=resource_data.get("title", ""),
                    author=resource_data.get("author"),
                    type=resource_data.get("type", ""),
                    url=resource_data.get("url", ""),
                    categories=[db_category]  # This resource addresses this gap category
                )
                
                curated_resources.append(study_resource)
        
        # Identify coverage gaps: gaps that have no matching resources
        coverage_gaps = []
        for gap in gaps:
            if gap not in gaps_with_resources:
                coverage_gaps.append(gap)
        
        return curated_resources, coverage_gaps
    
    @staticmethod
    def build_holistic_guidance(
        tech_gaps: List[PrioritizedGap],
        comm_gaps: List[CommunicationGap]
    ) -> HolisticGuidance:
        """
        Identify relationships between technical and communication gaps and generate
        integrated guidance for addressing them holistically.
        
        Analyzes gap categories to find connections (e.g., unclear System Design 
        communication often stems from insufficient System Design knowledge). Generates
        a recommended sequence for addressing gaps (root causes first) and creates an
        action checklist grouped by timeline.
        
        Connection Logic:
        - Communication gaps in clarity/structure often relate to technical understanding gaps
        - Confidence gaps may relate to domain knowledge gaps
        - Active listening gaps are behavioral and less dependent on technical knowledge
        - Technical vocabulary gaps directly relate to specific technical knowledge
        
        Args:
            tech_gaps: List of prioritized technical gaps
            comm_gaps: List of communication gaps
            
        Returns:
            HolisticGuidance object containing:
            - gap_relationships: List of dicts with tech_gap, comm_gap, connection description
            - recommended_sequence: List of gap categories in recommended order
            - dependency_map: Dict with visualization data
            - action_checklist: List of dicts with gaps grouped by timeline
            
        Requirements: 4.1, 4.2, 4.3
        """
        
        # Step 1: Identify relationships between technical and communication gaps
        gap_relationships = ComprehensiveAnalysisGenerator._identify_gap_relationships(
            tech_gaps, comm_gaps
        )
        
        # Step 2: Generate recommended sequence for addressing gaps
        recommended_sequence = ComprehensiveAnalysisGenerator._generate_recommended_sequence(
            tech_gaps, comm_gaps, gap_relationships
        )
        
        # Step 3: Create dependency map for visualization
        dependency_map = ComprehensiveAnalysisGenerator._create_dependency_map(
            tech_gaps, comm_gaps, recommended_sequence
        )
        
        # Step 4: Create action checklist grouped by timeline
        action_checklist = ComprehensiveAnalysisGenerator._create_action_checklist(
            tech_gaps, comm_gaps, recommended_sequence
        )
        
        return HolisticGuidance(
            gap_relationships=gap_relationships,
            recommended_sequence=recommended_sequence,
            dependency_map=dependency_map,
            action_checklist=action_checklist
        )
    
    @staticmethod
    def _identify_gap_relationships(
        tech_gaps: List[PrioritizedGap],
        comm_gaps: List[CommunicationGap]
    ) -> List[Dict[str, Any]]:
        """
        Identify connections between technical and communication gaps.
        
        Analyzes gap categories and descriptions to find meaningful relationships:
        - Technical vocabulary gaps connect directly to technical knowledge gaps
        - Clarity/structure gaps often stem from insufficient understanding
        - Confidence gaps may indicate deeper knowledge gaps
        - Active listening gaps are typically behavioral, not technical
        
        Returns list of relationship dictionaries with tech_gap, comm_gap, and connection.
        """
        relationships = []
        
        # Build sets for quick lookup
        tech_categories = {gap.category.lower() for gap in tech_gaps}
        
        # Mapping of communication gap types to typical technical connections
        comm_to_tech_mapping = {
            "Technical Vocabulary": ["System Design", "Algorithms", "Code Quality", "Database Design"],
            "Clarity": ["System Design", "Algorithms", "Architecture"],
            "Structure": ["System Design", "Behavioral"],
            "Confidence": ["System Design", "Algorithms", "Problem Solving"],
            "Conciseness": ["Communication", "System Design"],
            "Active Listening": []  # Not typically connected to technical gaps
        }
        
        for comm_gap in comm_gaps:
            # Get potential technical categories this communication gap might relate to
            potential_tech_categories = comm_to_tech_mapping.get(comm_gap.category, [])
            
            # Special case: if comm gap is about technical vocabulary, find direct matches
            if comm_gap.category == "Technical Vocabulary":
                for tech_gap in tech_gaps:
                    # Check for keyword overlap using the description or category
                    if ComprehensiveAnalysisGenerator._has_semantic_overlap(
                        comm_gap.description, tech_gap.category
                    ) or any(
                        t.lower() in tech_gap.category.lower() 
                        for t in potential_tech_categories
                    ):
                        relationships.append({
                            "tech_gap": tech_gap.category,
                            "comm_gap": comm_gap.category,
                            "connection": f"Your difficulty with {comm_gap.category.lower()} (communication gap) is likely connected to gaps in {tech_gap.category} knowledge (technical gap). "
                                        f"Recommended approach: first strengthen your {tech_gap.category.lower()} fundamentals using the resources below, "
                                        f"then practice explaining your {tech_gap.category.lower()} concepts clearly.",
                            "priority_order": 1  # Technical gap should be addressed first
                        })
                        break  # Only link to the first matching gap
            # General pattern: confidence/clarity gaps may relate to any technical gap
            elif comm_gap.category in ["Clarity", "Confidence"]:
                for tech_gap in tech_gaps:
                    if tech_gap.priority in [PriorityLevel.CRITICAL, PriorityLevel.HIGH]:
                        relationships.append({
                            "tech_gap": tech_gap.category,
                            "comm_gap": comm_gap.category,
                            "connection": f"Your {comm_gap.category.lower()} in discussing {tech_gap.category.lower()} suggests you may benefit from "
                                        f"deeper understanding of {tech_gap.category.lower()} concepts. "
                                        f"Building stronger fundamentals will improve your ability to communicate about this topic.",
                            "priority_order": 1
                        })
                        break  # Only link to the most critical technical gap
            # Structure gaps often relate to System Design or high-priority gaps
            elif comm_gap.category == "Structure":
                # Find high-priority technical gaps
                high_priority_gaps = [g for g in tech_gaps if g.priority in [PriorityLevel.CRITICAL, PriorityLevel.HIGH]]
                if high_priority_gaps:
                    gap = high_priority_gaps[0]
                    relationships.append({
                        "tech_gap": gap.category,
                        "comm_gap": comm_gap.category,
                        "connection": f"Your communication structure could be improved by having a clear mental model of {gap.category.lower()}. "
                                    f"Use the 4-step approach (Define Problem → Constraints → Propose Solution → Discuss Trade-offs) when explaining {gap.category.lower()}.",
                        "priority_order": 1
                    })
        
        return relationships
    
    @staticmethod
    def _has_semantic_overlap(comm_description: str, tech_category: str) -> bool:
        """
        Check if a communication gap description semantically relates to a technical category.
        
        Simple keyword matching to detect relationships.
        """
        comm_lower = comm_description.lower()
        tech_lower = tech_category.lower()
        
        # Direct category matches
        if tech_lower in comm_lower:
            return True
        
        # Keyword mappings for technical categories
        overlaps = {
            "system design": ["architecture", "design", "scaling", "distributed", "load", "database", "cache", "shard"],
            "algorithms": ["complexity", "sorting", "searching", "optimization", "data structures", "big-o"],
            "code quality": ["performance", "clean", "readable", "maintainable", "refactor", "optimization"],
            "database": ["sql", "nosql", "query", "schema", "indexing", "sharding"],
            "data structures": ["arrays", "linked", "trees", "graphs", "hash"],
            "problem solving": ["approach", "strategy", "method", "solution", "process"],
            "communication": ["explain", "clarity", "structure", "conciseness", "confidence"],
            "behavioral": ["star", "situation", "task", "action", "result"],
            "object-oriented design": ["design", "oop", "inheritance", "polymorphism", "abstraction"],
            "following instructions": ["requirements", "constraints", "specifications", "constraints"]
        }
        
        # Check if tech category matches any key in overlaps
        for category, keywords in overlaps.items():
            if tech_lower == category:
                return any(kw in comm_lower for kw in keywords)
        
        # Check if comm_description keywords match the tech category
        comm_keywords = comm_lower.split()
        for keyword in comm_keywords:
            if keyword in tech_lower or any(keyword in keyword for keyword in tech_lower.split()):
                return True
        
        return False
    
    @staticmethod
    def _generate_recommended_sequence(
        tech_gaps: List[PrioritizedGap],
        comm_gaps: List[CommunicationGap],
        relationships: List[Dict[str, Any]]
    ) -> List[str]:
        """
        Generate recommended order for addressing gaps.
        
        Prioritizes root causes first:
        1. Critical technical gaps (foundation)
        2. Related communication gaps
        3. High priority technical gaps
        4. Medium/Low priority gaps
        5. Behavioral communication gaps
        
        Returns list of gap categories in recommended order.
        """
        sequence = []
        processed_gaps = set()
        
        # Step 1: Add critical technical gaps first (root causes)
        for gap in tech_gaps:
            if gap.priority == PriorityLevel.CRITICAL:
                sequence.append(gap.category)
                processed_gaps.add(f"tech_{gap.category}")
        
        # Step 2: Add communication gaps related to critical technical gaps
        related_comm_gaps = set()
        for rel in relationships:
            if rel["tech_gap"] in sequence:
                related_comm_gaps.add(rel["comm_gap"])
        
        # Add related communication gaps (except active listening which is behavioral)
        for gap in comm_gaps:
            if gap.category in related_comm_gaps and gap.category != "Active Listening":
                if gap.category not in processed_gaps:
                    sequence.append(gap.category)
                    processed_gaps.add(gap.category)
        
        # Step 3: Add high priority technical gaps
        for gap in tech_gaps:
            if gap.priority == PriorityLevel.HIGH:
                if gap.category not in processed_gaps:
                    sequence.append(gap.category)
                    processed_gaps.add(f"tech_{gap.category}")
        
        # Step 4: Add remaining technical gaps by priority
        for priority_level in [PriorityLevel.MEDIUM, PriorityLevel.LOW]:
            for gap in tech_gaps:
                if gap.priority == priority_level:
                    if gap.category not in processed_gaps:
                        sequence.append(gap.category)
                        processed_gaps.add(f"tech_{gap.category}")
        
        # Step 5: Add remaining communication gaps (typically behavioral)
        for gap in comm_gaps:
            if gap.category not in processed_gaps:
                sequence.append(gap.category)
                processed_gaps.add(gap.category)
        
        return sequence
    
    @staticmethod
    def _create_dependency_map(
        tech_gaps: List[PrioritizedGap],
        comm_gaps: List[CommunicationGap],
        sequence: List[str]
    ) -> Dict[str, Any]:
        """
        Create visualization data for dependencies between gaps.
        
        Returns a dictionary suitable for frontend visualization with nodes and edges.
        """
        nodes = []
        edges = []
        
        # Add technical gaps as nodes
        tech_gap_map = {gap.category: gap for gap in tech_gaps}
        for i, gap in enumerate(tech_gaps):
            nodes.append({
                "id": f"tech_{gap.category}",
                "label": gap.category,
                "type": "technical",
                "priority": gap.priority,
                "order": sequence.index(gap.category) if gap.category in sequence else len(sequence)
            })
        
        # Add communication gaps as nodes
        for gap in comm_gaps:
            nodes.append({
                "id": f"comm_{gap.category}",
                "label": gap.category,
                "type": "communication",
                "severity": gap.severity,
                "order": sequence.index(gap.category) if gap.category in sequence else len(sequence)
            })
        
        # Add edges (dependencies)
        # Technical gaps that appear earlier in sequence feed into later ones
        for i, gap_category in enumerate(sequence):
            if i + 1 < len(sequence):
                next_category = sequence[i + 1]
                # Create edge from current to next in sequence (weak dependency)
                source_type = "tech" if any(g.category == gap_category for g in tech_gaps) else "comm"
                target_type = "tech" if any(g.category == next_category for g in tech_gaps) else "comm"
                edges.append({
                    "from": f"{source_type}_{gap_category}",
                    "to": f"{target_type}_{next_category}",
                    "label": "address_before"
                })
        
        return {
            "nodes": nodes,
            "edges": edges,
            "total_gaps": len(tech_gaps) + len(comm_gaps),
            "critical_count": len([g for g in tech_gaps if g.priority == PriorityLevel.CRITICAL]),
            "recommended_start": sequence[0] if sequence else None
        }
    
    @staticmethod
    def _create_action_checklist(
        tech_gaps: List[PrioritizedGap],
        comm_gaps: List[CommunicationGap],
        sequence: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Create action checklist grouped by realistic timelines.
        
        Groups gaps into: this week, next week, long-term based on:
        - Priority level and estimated time to resolution
        - Impact score and frequency
        
        Timeline calculation:
        - This week: Critical gaps + top High gaps (estimated 5-7 hours)
        - Next week: Remaining High + start Medium gaps (estimated 10-15 hours)
        - Long-term: Medium/Low + behavioral gaps (ongoing, 2+ weeks)
        """
        checklist = []
        
        # Build gap maps for quick lookup
        tech_gap_map = {gap.category: gap for gap in tech_gaps}
        comm_gap_map = {gap.category: gap for gap in comm_gaps}
        
        # Categorize gaps by timeline
        this_week_gaps = []
        next_week_gaps = []
        long_term_gaps = []
        
        cumulative_hours = 0
        
        for gap_category in sequence:
            # Estimate time based on gap type and priority
            estimated_hours = 0
            
            if gap_category in tech_gap_map:
                gap = tech_gap_map[gap_category]
                # Technical gaps: estimate based on priority
                if gap.priority == PriorityLevel.CRITICAL:
                    estimated_hours = 7  # 7-12 hours
                elif gap.priority == PriorityLevel.HIGH:
                    estimated_hours = 5  # 5-8 hours
                elif gap.priority == PriorityLevel.MEDIUM:
                    estimated_hours = 3  # 3-5 hours
                else:
                    estimated_hours = 2  # 2-3 hours
                    
                gap_obj = {
                    "gap_name": gap_category,
                    "type": "technical",
                    "priority": gap.priority,
                    "frequency": gap.frequency,
                    "estimated_hours": estimated_hours,
                    "actions": [
                        f"Review core concepts of {gap_category}",
                        f"Work through practice problems",
                        f"Practice explaining {gap_category} concepts",
                        f"Complete mock interview or self-assessment"
                    ]
                }
            else:
                gap = comm_gap_map[gap_category]
                # Communication gaps: estimate based on severity
                if gap.severity == PriorityLevel.CRITICAL:
                    estimated_hours = 3
                elif gap.severity == PriorityLevel.HIGH:
                    estimated_hours = 2
                else:
                    estimated_hours = 1
                    
                gap_obj = {
                    "gap_name": gap_category,
                    "type": "communication",
                    "severity": gap.severity,
                    "estimated_hours": estimated_hours,
                    "actions": [
                        f"Review improvement tips for {gap_category}",
                        f"Practice with provided prompts",
                        f"Record yourself and review",
                        f"Compare against sample improved response"
                    ]
                }
            
            # Assign to timeline based on cumulative hours and priority
            if cumulative_hours < 5:
                # This week: prioritize critical gaps and top high gaps up to ~5 hours
                if gap_category in tech_gap_map and tech_gap_map[gap_category].priority in [PriorityLevel.CRITICAL, PriorityLevel.HIGH]:
                    this_week_gaps.append(gap_obj)
                    cumulative_hours += estimated_hours
                else:
                    next_week_gaps.append(gap_obj)
            elif cumulative_hours < 15:
                # Next week: continuing through high and starting medium gaps
                if gap_category in tech_gap_map:
                    if tech_gap_map[gap_category].priority in [PriorityLevel.HIGH, PriorityLevel.MEDIUM]:
                        next_week_gaps.append(gap_obj)
                        cumulative_hours += estimated_hours
                    else:
                        long_term_gaps.append(gap_obj)
                else:
                    next_week_gaps.append(gap_obj)
            else:
                # Long-term: everything else
                long_term_gaps.append(gap_obj)
        
        # Create timeline groups
        if this_week_gaps:
            checklist.append({
                "timeline": "This Week",
                "priority": "high",
                "estimated_total_hours": sum(g["estimated_hours"] for g in this_week_gaps),
                "gaps": this_week_gaps,
                "description": "Focus on critical gaps and foundation building"
            })
        
        if next_week_gaps:
            checklist.append({
                "timeline": "Next Week",
                "priority": "medium",
                "estimated_total_hours": sum(g["estimated_hours"] for g in next_week_gaps),
                "gaps": next_week_gaps,
                "description": "Continue with high-priority gaps and begin medium-priority work"
            })
        
        if long_term_gaps:
            checklist.append({
                "timeline": "Long-term (2+ weeks)",
                "priority": "low",
                "estimated_total_hours": sum(g["estimated_hours"] for g in long_term_gaps),
                "gaps": long_term_gaps,
                "description": "Ongoing improvement and behavioral development"
            })
        
        return checklist
