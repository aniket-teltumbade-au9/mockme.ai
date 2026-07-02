"""
Property-based tests for build_resolution_paths method using Hypothesis.

**Validates: Requirements 5.1, 5.2**

Property: Resolution Path Completeness and Consistency
For any set of gap categories, building resolution paths SHALL produce:
1. Exactly one resolution path per gap
2. Each path contains exactly 4 steps (Understand, Practice, Demonstrate, Validate)
3. Each step has all required fields (number, title, description, activities, time_estimate, resources)
4. All steps are properly ordered (step_number 1-4)
5. All steps have non-empty activities and descriptions
"""

from hypothesis import given, strategies as st, settings, assume
import pytest
from app.models.analysis import ResolutionPath, ResolutionStep
from app.services.comprehensive_analysis import ComprehensiveAnalysisGenerator


# Strategy for generating valid gap categories
gap_categories = st.sampled_from([
    "System Design",
    "Algorithms",
    "Code Quality",
    "Communication",
    "Following Instructions",
    "Object-Oriented Design",
    "Data Structures",
    "Problem Solving",
    "Behavioral",
    "Database Design"
])

# Strategy for generating lists of gaps (1-5 unique gaps)
gaps_strategy = st.lists(gap_categories, min_size=1, max_size=5, unique=True)


class TestResolutionPathProperties:
    """Property-based tests for resolution path generation."""
    
    @given(gaps_strategy)
    @settings(max_examples=100)
    def test_resolution_path_count_matches_gaps(self, gaps):
        """
        Property: Number of resolution paths equals number of gaps.
        
        For any list of gaps, generating resolution paths SHALL produce
        exactly one ResolutionPath object per gap.
        
        **Validates: Requirements 5.1**
        """
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        
        # Verify count
        assert len(result) == len(gaps), f"Expected {len(gaps)} paths, got {len(result)}"
        
        # Verify each is a ResolutionPath
        assert all(isinstance(path, ResolutionPath) for path in result), \
            "All results should be ResolutionPath objects"
        
        # Verify each path corresponds to a gap
        result_categories = {path.gap_category for path in result}
        input_categories = set(gaps)
        assert result_categories == input_categories, \
            f"Path categories {result_categories} don't match input gaps {input_categories}"
    
    @given(gaps_strategy)
    @settings(max_examples=100)
    def test_each_path_has_four_steps(self, gaps):
        """
        Property: Each resolution path contains exactly 4 steps.
        
        For any gap, the resolution path SHALL contain exactly 4 sequential steps:
        Understand, Practice, Demonstrate, Validate.
        
        **Validates: Requirements 5.1, 5.2**
        """
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        
        for path in result:
            assert isinstance(path.steps, list), f"Path.steps should be a list"
            assert len(path.steps) == 4, \
                f"Each path should have 4 steps, got {len(path.steps)}"
            assert all(isinstance(step, ResolutionStep) for step in path.steps), \
                "All steps should be ResolutionStep objects"
    
    @given(gaps_strategy)
    @settings(max_examples=100)
    def test_steps_have_correct_titles_and_numbers(self, gaps):
        """
        Property: Steps have correct titles in correct order (Understand, Practice, Demonstrate, Validate).
        
        For any resolution path, the 4 steps SHALL be numbered 1-4 with titles
        in order: Understand, Practice, Demonstrate, Validate.
        
        **Validates: Requirements 5.1**
        """
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        expected_titles = ["Understand", "Practice", "Demonstrate", "Validate"]
        
        for path in result:
            for i, step in enumerate(path.steps):
                assert step.step_number == i + 1, \
                    f"Step {i} should be numbered {i+1}, got {step.step_number}"
                assert step.title == expected_titles[i], \
                    f"Step {i} should be titled '{expected_titles[i]}', got '{step.title}'"
    
    @given(gaps_strategy)
    @settings(max_examples=100)
    def test_all_steps_have_required_fields(self, gaps):
        """
        Property: All steps have all required fields populated.
        
        For any step in any resolution path, the step SHALL have:
        - step_number: integer 1-4
        - title: non-empty string
        - description: non-empty string
        - activities: non-empty list of strings
        - time_estimate: non-empty string
        - resources: list (may be empty)
        
        **Validates: Requirements 5.1**
        """
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        
        for path in result:
            for step in path.steps:
                # Verify step_number
                assert isinstance(step.step_number, int), \
                    "step_number must be an integer"
                assert 1 <= step.step_number <= 4, \
                    f"step_number must be 1-4, got {step.step_number}"
                
                # Verify title
                assert isinstance(step.title, str), "title must be a string"
                assert len(step.title) > 0, "title must not be empty"
                
                # Verify description
                assert isinstance(step.description, str), "description must be a string"
                assert len(step.description) > 0, "description must not be empty"
                
                # Verify activities
                assert isinstance(step.activities, list), "activities must be a list"
                assert len(step.activities) > 0, "activities list must not be empty"
                assert all(isinstance(a, str) for a in step.activities), \
                    "all activities must be strings"
                assert all(len(a) > 0 for a in step.activities), \
                    "all activities must be non-empty"
                
                # Verify time_estimate
                assert isinstance(step.time_estimate, str), "time_estimate must be a string"
                assert len(step.time_estimate) > 0, "time_estimate must not be empty"
                
                # Verify resources
                assert isinstance(step.resources, list), "resources must be a list"
    
    @given(gaps_strategy)
    @settings(max_examples=100)
    def test_resolution_path_has_total_time(self, gaps):
        """
        Property: Each resolution path has a total time estimate.
        
        For any resolution path, the estimated_total_time field SHALL be
        a non-empty string with a reasonable time estimate format.
        
        **Validates: Requirements 5.1**
        """
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        
        for path in result:
            assert isinstance(path.estimated_total_time, str), \
                "estimated_total_time must be a string"
            assert len(path.estimated_total_time) > 0, \
                "estimated_total_time must not be empty"
            assert "hour" in path.estimated_total_time.lower(), \
                "estimated_total_time should mention hours"
    
    @given(gaps_strategy)
    @settings(max_examples=100)
    def test_step_time_estimates_follow_progression(self, gaps):
        """
        Property: Time estimates follow logical progression through phases.
        
        For any resolution path, the time estimates through the 4 phases SHALL follow
        a logical progression:
        - Understand: 1-2 hours
        - Practice: 3-5 hours (most intensive learning)
        - Demonstrate: 2-3 hours
        - Validate: 1-2 hours
        
        **Validates: Requirements 5.1, 5.6**
        """
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        
        for path in result:
            understand_time = path.steps[0].time_estimate.lower()
            practice_time = path.steps[1].time_estimate.lower()
            demonstrate_time = path.steps[2].time_estimate.lower()
            validate_time = path.steps[3].time_estimate.lower()
            
            # Verify time estimates are present
            assert "1" in understand_time and "2" in understand_time, \
                f"Understand should be ~1-2 hours, got: {understand_time}"
            assert ("3" in practice_time or "4" in practice_time or "5" in practice_time), \
                f"Practice should be ~3-5 hours, got: {practice_time}"
            assert "2" in demonstrate_time and "3" in demonstrate_time, \
                f"Demonstrate should be ~2-3 hours, got: {demonstrate_time}"
            assert "1" in validate_time and "2" in validate_time, \
                f"Validate should be ~1-2 hours, got: {validate_time}"
    
    @given(gaps_strategy)
    @settings(max_examples=100)
    def test_gap_specific_activities_generated(self, gaps):
        """
        Property: Activities are gap-specific and meaningful.
        
        For any resolution path for a gap, at least some of the activities
        across the 4 steps SHALL be relevant to that specific gap category.
        
        **Validates: Requirements 5.2**
        """
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        
        # Define keywords for each gap type
        gap_keywords = {
            "system design": ["design", "scale", "architecture", "load", "database", "cache"],
            "algorithms": ["algorithm", "complexity", "sorting", "searching", "leetcode"],
            "code quality": ["code", "clean", "refactor", "readable", "quality"],
            "communication": ["communication", "record", "explain", "clarity", "structure"],
            "following instructions": ["requirement", "edge case", "constraint", "verify"],
            "object-oriented design": ["oop", "design", "class", "inheritance", "polymorphism"],
            "data structures": ["structure", "array", "tree", "graph", "hash"],
            "problem solving": ["problem", "approach", "solve", "strategy"],
            "behavioral": ["behavioral", "star", "situation", "task"],
            "database design": ["database", "query", "sql", "schema", "index"]
        }
        
        for path in result:
            gap_lower = path.gap_category.lower()
            keywords = gap_keywords.get(gap_lower, [])
            
            if keywords:  # Only check if we have defined keywords
                # Collect all activities from all steps
                all_activities = []
                for step in path.steps:
                    all_activities.extend(step.activities)
                
                # Convert activities to lowercase for matching
                activities_text = " ".join(all_activities).lower()
                
                # Check if at least one keyword appears
                has_relevant_activity = any(kw in activities_text for kw in keywords)
                assert has_relevant_activity or len(keywords) == 0, \
                    f"Path for '{path.gap_category}' should have activities related to: {keywords}. " \
                    f"Activities: {activities_text}"
    
    @given(gaps_strategy)
    @settings(max_examples=100)
    def test_consistency_across_multiple_calls(self, gaps):
        """
        Property: Multiple calls with the same gaps produce consistent results.
        
        For any set of gaps, calling build_resolution_paths multiple times
        SHALL produce consistent paths (same structure, though content may vary slightly
        if there's randomization).
        
        **Validates: Requirements 5.1**
        """
        # Call the function twice
        result1 = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        result2 = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        
        # Verify structure is identical
        assert len(result1) == len(result2), "Results should have same count"
        
        for path1, path2 in zip(result1, result2):
            assert path1.gap_category == path2.gap_category
            assert len(path1.steps) == len(path2.steps)
            
            for step1, step2 in zip(path1.steps, path2.steps):
                assert step1.step_number == step2.step_number
                assert step1.title == step2.title
                assert len(step1.activities) == len(step2.activities)


class TestResolutionPathEdgeCases:
    """Test edge cases and special scenarios."""
    
    def test_empty_list_returns_empty_paths(self):
        """Test that an empty gap list returns empty list."""
        result = ComprehensiveAnalysisGenerator.build_resolution_paths([])
        assert result == []
    
    def test_single_gap(self):
        """Test with a single gap."""
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(["Algorithms"])
        assert len(result) == 1
        assert len(result[0].steps) == 4
    
    def test_many_gaps(self):
        """Test with many gaps."""
        gaps = [
            "System Design", "Algorithms", "Code Quality", "Communication",
            "Following Instructions"
        ]
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        assert len(result) == len(gaps)
        
        # All should have 4 steps
        for path in result:
            assert len(path.steps) == 4
    
    def test_unknown_gap_category(self):
        """Test with unknown gap category."""
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(
            ["Unknown Gap Category"]
        )
        
        # Should still create a path
        assert len(result) == 1
        path = result[0]
        
        # Should still have 4 steps with all required fields
        assert len(path.steps) == 4
        for step in path.steps:
            assert step.step_number is not None
            assert len(step.title) > 0
            assert len(step.description) > 0
            assert len(step.activities) > 0


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
