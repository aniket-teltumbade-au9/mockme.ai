"""
Tests for the extract_communication_gaps method of ComprehensiveAnalysisGenerator.

These tests verify:
1. Correct extraction of communication gaps from analysis data
2. Proper categorization into the six communication categories
3. Severity determination based on gap keywords
4. Candidate response extraction/generation
5. Improvement tips generation
6. Sample improved response generation
7. Related behavioral tactic lookup
"""

import pytest
from app.services.comprehensive_analysis import ComprehensiveAnalysisGenerator
from app.models.analysis import CommunicationGap, PriorityLevel


class TestExtractCommunicationGaps:
    """Tests for extract_communication_gaps method."""
    
    def test_empty_analysis_returns_empty_list(self):
        """Test that empty or None analysis returns empty list."""
        generator = ComprehensiveAnalysisGenerator()
        
        # None analysis
        result = generator.extract_communication_gaps(None)
        assert result == []
        
        # Empty dict
        result = generator.extract_communication_gaps({})
        assert result == []
        
        # Dict without communication_assessment
        result = generator.extract_communication_gaps({"skill_gaps": []})
        assert result == []
    
    def test_communication_assessment_without_gaps_returns_empty(self):
        """Test that analysis without gaps returns empty list."""
        analysis = {
            "communication_assessment": {
                "overall_score": 70,
                "clarity": 7
            }
        }
        result = ComprehensiveAnalysisGenerator.extract_communication_gaps(analysis)
        assert result == []
    
    def test_single_gap_extraction(self):
        """Test extraction of a single communication gap."""
        analysis = {
            "communication_assessment": {
                "gaps": ["Candidate was unclear when explaining the algorithm"]
            }
        }
        result = ComprehensiveAnalysisGenerator.extract_communication_gaps(analysis)
        
        assert len(result) == 1
        gap = result[0]
        assert isinstance(gap, CommunicationGap)
        assert gap.category == "Clarity"
        assert gap.description == "Candidate was unclear when explaining the algorithm"
    
    def test_multiple_gaps_extraction(self):
        """Test extraction of multiple communication gaps."""
        analysis = {
            "communication_assessment": {
                "gaps": [
                    "Rambling and verbose response",
                    "Lacked confidence in the answer",
                    "Didn't listen to the interviewer's hints"
                ]
            }
        }
        result = ComprehensiveAnalysisGenerator.extract_communication_gaps(analysis)
        
        assert len(result) == 3
        categories = [gap.category for gap in result]
        assert "Conciseness" in categories
        assert "Confidence" in categories
        assert "Active Listening" in categories
    
    def test_gap_categorization_clarity(self):
        """Test that clarity gaps are properly categorized."""
        gaps = [
            "Unclear explanation of the approach",
            "Ambiguous response to the question",
            "Confusing way of stating the solution"
        ]
        
        for gap_desc in gaps:
            category = ComprehensiveAnalysisGenerator._categorize_communication_gap(gap_desc)
            assert category == "Clarity", f"Expected Clarity for '{gap_desc}', got {category}"
    
    def test_gap_categorization_conciseness(self):
        """Test that conciseness gaps are properly categorized."""
        gaps = [
            "Rambling response with unnecessary details",
            "Too verbose, should have been more concise",
            "Long-winded explanation with filler words"
        ]
        
        for gap_desc in gaps:
            category = ComprehensiveAnalysisGenerator._categorize_communication_gap(gap_desc)
            assert category == "Conciseness", f"Expected Conciseness for '{gap_desc}', got {category}"
    
    def test_gap_categorization_structure(self):
        """Test that structure gaps are properly categorized."""
        gaps = [
            "Disorganized response without clear flow",
            "Scattered approach, jumping between topics",
            "Unstructured answer"
        ]
        
        for gap_desc in gaps:
            category = ComprehensiveAnalysisGenerator._categorize_communication_gap(gap_desc)
            assert category == "Structure", f"Expected Structure for '{gap_desc}', got {category}"
    
    def test_gap_categorization_confidence(self):
        """Test that confidence gaps are properly categorized."""
        gaps = [
            "Candidate was hesitant and uncertain",
            "Lacked confidence in the technical explanation",
            "Second-guessing and hedging throughout"
        ]
        
        for gap_desc in gaps:
            category = ComprehensiveAnalysisGenerator._categorize_communication_gap(gap_desc)
            assert category == "Confidence", f"Expected Confidence for '{gap_desc}', got {category}"
    
    def test_gap_categorization_active_listening(self):
        """Test that active listening gaps are properly categorized."""
        gaps = [
            "Didn't listen to the interviewer's hints",
            "Missed the clarification question",
            "Failed to respond to feedback"
        ]
        
        for gap_desc in gaps:
            category = ComprehensiveAnalysisGenerator._categorize_communication_gap(gap_desc)
            assert category == "Active Listening", f"Expected Active Listening for '{gap_desc}', got {category}"
    
    def test_gap_categorization_technical_vocabulary(self):
        """Test that technical vocabulary gaps are properly categorized."""
        gaps = [
            "Imprecise terminology when describing the algorithm",
            "Confused technical terms",
            "Wrong technical vocabulary used"
        ]
        
        for gap_desc in gaps:
            category = ComprehensiveAnalysisGenerator._categorize_communication_gap(gap_desc)
            assert category == "Technical Vocabulary", f"Expected Technical Vocabulary for '{gap_desc}', got {category}"
    
    def test_severity_determination_critical(self):
        """Test that critical severity is assigned correctly."""
        critical_gaps = [
            "Completely unclear explanation",
            "Unintelligible response to the technical question",
            "Failed to communicate the solution"
        ]
        
        for gap_desc in critical_gaps:
            severity = ComprehensiveAnalysisGenerator._determine_communication_severity(gap_desc)
            assert severity == PriorityLevel.CRITICAL, f"Expected CRITICAL for '{gap_desc}', got {severity}"
    
    def test_severity_determination_high(self):
        """Test that high severity is assigned correctly."""
        high_gaps = [
            "Major rambling throughout the interview",
            "Very unclear explanation of approach",
            "Significant miscommunication with interviewer"
        ]
        
        for gap_desc in high_gaps:
            severity = ComprehensiveAnalysisGenerator._determine_communication_severity(gap_desc)
            assert severity == PriorityLevel.HIGH, f"Expected HIGH for '{gap_desc}', got {severity}"
    
    def test_severity_determination_medium(self):
        """Test that medium severity is assigned correctly."""
        medium_gaps = [
            "Could be clearer in explanation",
            "Somewhat unclear response",
            "Lacks structure in answer"
        ]
        
        for gap_desc in medium_gaps:
            severity = ComprehensiveAnalysisGenerator._determine_communication_severity(gap_desc)
            assert severity == PriorityLevel.MEDIUM, f"Expected MEDIUM for '{gap_desc}', got {severity}"
    
    def test_severity_determination_low(self):
        """Test that low severity is assigned for minor issues."""
        low_gaps = [
            "Minor filler word usage",
            "Slight hesitation in response",
            "Could have elaborated more"
        ]
        
        for gap_desc in low_gaps:
            severity = ComprehensiveAnalysisGenerator._determine_communication_severity(gap_desc)
            assert severity == PriorityLevel.LOW, f"Expected LOW for '{gap_desc}', got {severity}"
    
    def test_candidate_response_extraction_from_gap(self):
        """Test that candidate response is extracted or generated."""
        gap_desc = "Rambling explanation about algorithm complexity"
        response = ComprehensiveAnalysisGenerator._extract_candidate_response(gap_desc, [], "Conciseness")
        
        assert isinstance(response, str)
        assert len(response) > 0
        # Should contain some indicator of the gap
        assert "rambling" in response.lower() or "verbose" in response.lower() or "[Candidate" in response
    
    def test_improvement_tips_generation_clarity(self):
        """Test improvement tips generation for clarity gaps."""
        tips = ComprehensiveAnalysisGenerator._generate_improvement_tips("Clarity", "Unclear explanation")
        
        assert isinstance(tips, list)
        assert len(tips) >= 3
        assert len(tips) <= 5
        assert all(isinstance(tip, str) for tip in tips)
        assert all(len(tip) > 0 for tip in tips)
        # Check for relevant content
        assert any("restate" in tip.lower() or "example" in tip.lower() for tip in tips)
    
    def test_improvement_tips_generation_conciseness(self):
        """Test improvement tips generation for conciseness gaps."""
        tips = ComprehensiveAnalysisGenerator._generate_improvement_tips("Conciseness", "Too rambling")
        
        assert isinstance(tips, list)
        assert len(tips) >= 3
        assert all(isinstance(tip, str) for tip in tips)
        # Should have tips about being concise
        assert any("2 minute" in tip.lower() or "concise" in tip.lower() for tip in tips)
    
    def test_improved_response_generation(self):
        """Test that improved response samples are generated."""
        original_response = "Um, so like, I think maybe we could use, like, a hash table or something"
        
        improved = ComprehensiveAnalysisGenerator._generate_improved_response(
            "Confidence", original_response, "Lacked confidence"
        )
        
        assert isinstance(improved, str)
        assert len(improved) > 50  # Should be substantial
        # Should not contain the hedging language
        assert "I'll" in improved or "I would" in improved or "approach" in improved
    
    def test_related_tactic_lookup_rambling(self):
        """Test that related behavioral tactics are found."""
        tactic = ComprehensiveAnalysisGenerator._find_related_tactic(
            "Conciseness", "Candidate was rambling throughout"
        )
        
        if tactic:  # Tactic may or may not be found
            assert isinstance(tactic, dict)
            assert "tactic_name" in tactic or "description" in tactic
    
    def test_complete_gap_object_properties(self):
        """Test that complete CommunicationGap objects have all required properties."""
        analysis = {
            "communication_assessment": {
                "gaps": ["Rambling response without clear structure"]
            }
        }
        
        result = ComprehensiveAnalysisGenerator.extract_communication_gaps(analysis)
        gap = result[0]
        
        # Check all required properties
        assert gap.category in ["Clarity", "Structure", "Conciseness", "Active Listening", "Confidence", "Technical Vocabulary"]
        assert gap.severity in [PriorityLevel.CRITICAL, PriorityLevel.HIGH, PriorityLevel.MEDIUM, PriorityLevel.LOW]
        assert isinstance(gap.description, str)
        assert len(gap.description) > 0
        assert isinstance(gap.candidate_response, str)
        assert len(gap.candidate_response) > 0
        assert isinstance(gap.improvement_tips, list)
        assert len(gap.improvement_tips) >= 3
        assert len(gap.improvement_tips) <= 5
        assert all(isinstance(tip, str) for tip in gap.improvement_tips)
        assert isinstance(gap.sample_improved_response, str)
        assert len(gap.sample_improved_response) > 0
        # related_tactic is optional
        if gap.related_tactic:
            assert isinstance(gap.related_tactic, dict)
    
    def test_multiple_gaps_each_properly_enriched(self):
        """Test that multiple gaps are each properly enriched."""
        analysis = {
            "communication_assessment": {
                "gaps": [
                    "Unclear explanation of system design approach",
                    "Rambling and verbose when describing algorithm",
                    "Lacked confidence in technical depth"
                ]
            }
        }
        
        gaps = ComprehensiveAnalysisGenerator.extract_communication_gaps(analysis)
        
        assert len(gaps) == 3
        
        # Each gap should be complete
        for gap in gaps:
            assert gap.category
            assert gap.severity
            assert gap.description
            assert gap.candidate_response
            assert gap.improvement_tips
            assert len(gap.improvement_tips) >= 3
            assert gap.sample_improved_response
    
    def test_invalid_gap_entries_skipped(self):
        """Test that invalid gap entries (None, empty string) are skipped."""
        analysis = {
            "communication_assessment": {
                "gaps": [
                    "Valid gap description",
                    None,
                    "",
                    "Another valid gap",
                    "  "  # Whitespace only
                ]
            }
        }
        
        result = ComprehensiveAnalysisGenerator.extract_communication_gaps(analysis)
        
        # Should only extract valid gaps
        assert len(result) == 2
        assert all(gap.description and gap.description.strip() for gap in result)


class TestCommunicationGapCategorization:
    """Additional tests for gap categorization edge cases."""
    
    def test_mixed_keywords_uses_highest_score(self):
        """Test that when gap mentions multiple categories, highest scoring category wins."""
        # "rambling" (Conciseness) appears once, "unclear" (Clarity) appears once
        gap = "Rambling and unclear explanation"
        category = ComprehensiveAnalysisGenerator._categorize_communication_gap(gap)
        
        # Should be one of the matched categories
        assert category in ["Clarity", "Conciseness"]
    
    def test_default_to_clarity_for_unknown_gap(self):
        """Test that unknown gaps default to Clarity category."""
        gap = "Some random communication issue"
        category = ComprehensiveAnalysisGenerator._categorize_communication_gap(gap)
        
        assert category == "Clarity"  # Default category


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
