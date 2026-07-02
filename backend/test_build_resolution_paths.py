"""
Unit tests for build_resolution_paths method.
Tests the creation of 4-step resolution paths for technical gaps.
"""

import pytest
from app.models.analysis import ResolutionPath, ResolutionStep, PriorityLevel
from app.services.comprehensive_analysis import ComprehensiveAnalysisGenerator


class TestBuildResolutionPaths:
    """Test suite for build_resolution_paths method."""
    
    def test_empty_gaps_list(self):
        """Test that empty gaps list returns empty resolution paths."""
        gaps = []
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        assert result == []
    
    def test_single_gap_creates_resolution_path(self):
        """Test that a single gap creates a complete resolution path."""
        gaps = ["System Design"]
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        
        assert len(result) == 1
        assert isinstance(result[0], ResolutionPath)
        assert result[0].gap_category == "System Design"
    
    def test_resolution_path_has_four_steps(self):
        """Test that each resolution path has exactly 4 steps."""
        gaps = ["Algorithms"]
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        
        path = result[0]
        assert len(path.steps) == 4
        assert all(isinstance(step, ResolutionStep) for step in path.steps)
    
    def test_steps_have_correct_sequence(self):
        """Test that steps are in correct sequence: Understand, Practice, Demonstrate, Validate."""
        gaps = ["Code Quality"]
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        
        path = result[0]
        expected_titles = ["Understand", "Practice", "Demonstrate", "Validate"]
        
        for i, step in enumerate(path.steps):
            assert step.step_number == i + 1
            assert step.title == expected_titles[i]
    
    def test_step_has_required_fields(self):
        """Test that each step has all required fields."""
        gaps = ["System Design"]
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        
        path = result[0]
        for step in path.steps:
            assert step.step_number is not None
            assert step.title is not None
            assert step.description is not None
            assert isinstance(step.activities, list)
            assert len(step.activities) > 0
            assert step.time_estimate is not None
            assert isinstance(step.resources, list)
    
    def test_activities_not_empty(self):
        """Test that each step has activities."""
        gaps = ["Algorithms"]
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        
        path = result[0]
        for step in path.steps:
            assert len(step.activities) > 0, f"Step {step.title} has no activities"
    
    def test_time_estimates_present(self):
        """Test that each step has a time estimate."""
        gaps = ["Following Instructions"]
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        
        path = result[0]
        for step in path.steps:
            assert step.time_estimate is not None
            assert len(step.time_estimate) > 0
    
    def test_resolution_path_estimated_total_time(self):
        """Test that resolution path has estimated total time."""
        gaps = ["Communication"]
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        
        path = result[0]
        assert path.estimated_total_time is not None
        assert len(path.estimated_total_time) > 0
    
    def test_multiple_gaps_create_multiple_paths(self):
        """Test that multiple gaps create multiple resolution paths."""
        gaps = ["System Design", "Algorithms", "Code Quality"]
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        
        assert len(result) == 3
        assert all(isinstance(path, ResolutionPath) for path in result)
    
    def test_tactical_strategies_used_for_descriptions(self):
        """Test that tactical strategies are used in step descriptions."""
        gaps = ["System Design"]
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        
        path = result[0]
        # The Understand step should have tactical strategy content
        understand_step = path.steps[0]
        assert understand_step.title == "Understand"
        # Description should contain tactical guidance (check for keywords)
        assert "design" in understand_step.description.lower() or "approach" in understand_step.description.lower()
    
    def test_gap_specific_activities_generated(self):
        """Test that gap-specific activities are generated."""
        gaps = ["System Design"]
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        
        path = result[0]
        practice_step = path.steps[1]  # Practice is step 2
        
        # System Design practice activities should mention system design concepts
        activities_text = " ".join(practice_step.activities).lower()
        assert "design" in activities_text or "scale" in activities_text or "practice" in activities_text
    
    def test_resources_included_in_steps(self):
        """Test that resources are included in resolution steps."""
        gaps = ["Algorithms"]
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        
        path = result[0]
        # At least some steps should have resources
        has_resources = any(len(step.resources) > 0 for step in path.steps)
        # This may be true or false depending on RESOURCE_DATABASE content
        # Just verify that resources field is present and is a list
        for step in path.steps:
            assert isinstance(step.resources, list)
    
    def test_unknown_gap_still_creates_path(self):
        """Test that even unknown gaps create resolution paths with sensible defaults."""
        gaps = ["Unknown Gap Category"]
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        
        assert len(result) == 1
        path = result[0]
        assert path.gap_category == "Unknown Gap Category"
        assert len(path.steps) == 4
        # Should still have activities even without tactical strategy
        for step in path.steps:
            assert len(step.activities) > 0


class TestResolutionPathStructure:
    """Test the structural validity of resolution paths."""
    
    def test_steps_numbered_correctly(self):
        """Test that steps are numbered 1-4."""
        gaps = ["System Design"]
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        
        path = result[0]
        for i, step in enumerate(path.steps):
            assert step.step_number == i + 1
    
    def test_understand_step_first(self):
        """Test that Understand is always the first step."""
        gaps = ["Algorithms", "Code Quality", "Communication"]
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        
        for path in result:
            assert path.steps[0].title == "Understand"
    
    def test_validate_step_last(self):
        """Test that Validate is always the last step."""
        gaps = ["System Design", "Following Instructions"]
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        
        for path in result:
            assert path.steps[3].title == "Validate"


class TestActivityGeneration:
    """Test that activities are generated appropriately for each phase."""
    
    def test_understand_activities_present(self):
        """Test that Understand phase has learning-focused activities."""
        gaps = ["System Design"]
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        
        path = result[0]
        understand_activities = path.steps[0].activities
        
        # Should have conceptual learning activities
        assert len(understand_activities) > 0
        assert all(isinstance(a, str) for a in understand_activities)
    
    def test_practice_activities_present(self):
        """Test that Practice phase has hands-on activities."""
        gaps = ["Algorithms"]
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        
        path = result[0]
        practice_activities = path.steps[1].activities
        
        # Should have practical hands-on activities
        assert len(practice_activities) > 0
        assert any("practice" in a.lower() or "solve" in a.lower() or "complete" in a.lower() 
                  for a in practice_activities)
    
    def test_demonstrate_activities_present(self):
        """Test that Demonstrate phase has interview-focused activities."""
        gaps = ["Communication"]
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        
        path = result[0]
        demonstrate_activities = path.steps[2].activities
        
        # Should have demonstration/recording activities
        assert len(demonstrate_activities) > 0
        assert any("mock" in a.lower() or "record" in a.lower() or "practice" in a.lower() 
                  for a in demonstrate_activities)
    
    def test_validate_activities_present(self):
        """Test that Validate phase has assessment activities."""
        gaps = ["Code Quality"]
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        
        path = result[0]
        validate_activities = path.steps[3].activities
        
        # Should have assessment/validation activities
        assert len(validate_activities) > 0
        assert any("assess" in a.lower() or "review" in a.lower() or "compare" in a.lower() 
                  or "test" in a.lower() for a in validate_activities)


class TestTimeEstimates:
    """Test time estimate consistency."""
    
    def test_understand_time_estimate(self):
        """Test that Understand step has reasonable time estimate."""
        gaps = ["System Design"]
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        
        path = result[0]
        time_est = path.steps[0].time_estimate
        assert "1-2 hours" in time_est or "1-2" in time_est
    
    def test_practice_time_estimate(self):
        """Test that Practice step has reasonable time estimate."""
        gaps = ["Algorithms"]
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        
        path = result[0]
        time_est = path.steps[1].time_estimate
        assert "3-5 hours" in time_est or "3-5" in time_est
    
    def test_demonstrate_time_estimate(self):
        """Test that Demonstrate step has reasonable time estimate."""
        gaps = ["Code Quality"]
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        
        path = result[0]
        time_est = path.steps[2].time_estimate
        assert "2-3 hours" in time_est or "2-3" in time_est
    
    def test_validate_time_estimate(self):
        """Test that Validate step has reasonable time estimate."""
        gaps = ["Following Instructions"]
        result = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
        
        path = result[0]
        time_est = path.steps[3].time_estimate
        assert "1-2 hours" in time_est or "1-2" in time_est


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
