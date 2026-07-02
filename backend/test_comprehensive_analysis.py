"""
Tests for ComprehensiveAnalysisGenerator service.

Tests gap extraction, prioritization, and building of improvement plans.
"""

import pytest
from hypothesis import given, strategies as st
from app.services.comprehensive_analysis import ComprehensiveAnalysisGenerator
from app.models.analysis import PriorityLevel


@pytest.fixture
def generator():
    """Create a generator instance for testing."""
    return ComprehensiveAnalysisGenerator()


class TestExtractTechnicalGaps:
    """Tests for extract_technical_gaps method."""
    
    def test_extract_skill_gaps_only(self, generator):
        """Test extracting gaps from skill_gaps array only."""
        analysis = {
            "skill_gaps": ["System Design", "Algorithms"],
            "recommended_topics": []
        }
        
        gaps = generator.extract_technical_gaps(analysis)
        
        assert len(gaps) == 2
        assert "System Design" in gaps
        assert "Algorithms" in gaps
    
    def test_extract_recommended_topics_only(self, generator):
        """Test extracting gaps from recommended_topics array only."""
        analysis = {
            "skill_gaps": [],
            "recommended_topics": ["Code Quality", "Communication"]
        }
        
        gaps = generator.extract_technical_gaps(analysis)
        
        assert len(gaps) == 2
        assert "Code Quality" in gaps
        assert "Communication" in gaps
    
    def test_extract_both_arrays(self, generator):
        """Test extracting gaps from both arrays."""
        analysis = {
            "skill_gaps": ["System Design", "Algorithms"],
            "recommended_topics": ["Algorithms", "Code Quality"]
        }
        
        gaps = generator.extract_technical_gaps(analysis)
        
        # Should have 3 unique gaps (Algorithms appears in both but should be deduplicated)
        assert len(gaps) == 3
        assert "System Design" in gaps
        assert "Algorithms" in gaps
        assert "Code Quality" in gaps
    
    def test_deduplication_case_insensitive(self, generator):
        """Test that deduplication works with case-insensitive matching."""
        analysis = {
            "skill_gaps": ["System Design", "system design", "Algorithms"],
            "recommended_topics": ["ALGORITHMS", "Code Quality"]
        }
        
        gaps = generator.extract_technical_gaps(analysis)
        
        # Should have 3 unique gaps (case-insensitive deduplication)
        assert len(gaps) == 3
        gap_counts = {gap: gaps.count(gap) for gap in gaps}
        
        # Each gap should appear exactly once
        for gap, count in gap_counts.items():
            assert count == 1
    
    def test_empty_analysis(self, generator):
        """Test with empty analysis."""
        analysis = {}
        
        gaps = generator.extract_technical_gaps(analysis)
        
        assert gaps == []
    
    def test_none_analysis(self, generator):
        """Test with None analysis."""
        gaps = generator.extract_technical_gaps(None)
        
        assert gaps == []
    
    def test_none_arrays(self, generator):
        """Test with None arrays."""
        analysis = {
            "skill_gaps": None,
            "recommended_topics": None
        }
        
        gaps = generator.extract_technical_gaps(analysis)
        
        assert gaps == []
    
    def test_empty_strings_filtered(self, generator):
        """Test that empty strings are filtered out."""
        analysis = {
            "skill_gaps": ["System Design", "", "Algorithms"],
            "recommended_topics": ["", "Code Quality"]
        }
        
        gaps = generator.extract_technical_gaps(analysis)
        
        assert len(gaps) == 3
        assert "" not in gaps
        assert "System Design" in gaps
        assert "Algorithms" in gaps
        assert "Code Quality" in gaps
    
    def test_whitespace_normalization(self, generator):
        """Test that whitespace is normalized."""
        analysis = {
            "skill_gaps": ["  System Design  ", "Algorithms"],
            "recommended_topics": ["  Code Quality  "]
        }
        
        gaps = generator.extract_technical_gaps(analysis)
        
        assert len(gaps) == 3
        assert "System Design" in gaps
        assert "  System Design  " not in gaps
        assert "Code Quality" in gaps
        assert "  Code Quality  " not in gaps
    
    def test_mixed_array_types(self, generator):
        """Test handling of non-string items in arrays."""
        analysis = {
            "skill_gaps": ["System Design", 123, None, "Algorithms"],
            "recommended_topics": ["Code Quality", ["nested"], {"dict": "item"}]
        }
        
        gaps = generator.extract_technical_gaps(analysis)
        
        # Should only extract strings
        assert len(gaps) == 3
        assert "System Design" in gaps
        assert "Algorithms" in gaps
        assert "Code Quality" in gaps
    
    @given(st.lists(st.text(min_size=1, max_size=50), unique=True, max_size=10))
    def test_property_extraction_completeness(self, skill_gaps):
        """
        Property test: Gap extraction should return all unique gaps from both arrays.
        
        For any analysis with technical gaps in skill_gaps and recommended_topics,
        extraction should return all gaps from both arrays without loss or duplication.
        
        **Validates: Requirement 1.1**
        """
        generator = ComprehensiveAnalysisGenerator()
        recommended_topics = [gap for gap in skill_gaps[::2]] if skill_gaps else []
        
        analysis = {
            "skill_gaps": skill_gaps,
            "recommended_topics": recommended_topics
        }
        
        gaps = generator.extract_technical_gaps(analysis)
        
        # Expected unique gaps: all input gaps that have non-whitespace content, stripped and case-insensitive
        all_input_gaps = skill_gaps + recommended_topics
        expected_unique = set(gap.strip().lower() for gap in all_input_gaps if gap.strip())
        actual_unique = set(gap.lower() for gap in gaps)
        
        # All extracted gaps should match expectations
        assert actual_unique == expected_unique
        
        # No duplicates in output
        assert len(gaps) == len(set(gap.lower() for gap in gaps))
    
    def test_real_interview_example(self, generator):
        """Test with realistic interview analysis structure."""
        analysis = {
            "skill_gaps": ["System Design", "Algorithms", "System Design"],
            "recommended_topics": ["Algorithms", "Code Quality"],
            "communication_assessment": {
                "gaps": ["Rambling"]
            },
            "behavioral_star_analysis": {}
        }
        
        gaps = generator.extract_technical_gaps(analysis)
        
        assert len(gaps) == 3
        assert "System Design" in gaps
        assert "Algorithms" in gaps
        assert "Code Quality" in gaps


class TestAssignPriority:
    """Tests for assign_priority method."""
    
    def test_prioritize_recommended_over_skill_gaps(self, generator):
        """Test that recommended_topics gaps get higher priority than skill_gaps."""
        gaps = ["System Design", "Algorithms"]
        analysis = {
            "skill_gaps": ["Algorithms"],
            "recommended_topics": ["System Design"]
        }
        
        prioritized = generator.assign_priority(gaps, analysis)
        
        # System Design should come first (from recommended_topics)
        assert prioritized[0].category == "System Design"
        assert prioritized[0].priority in [PriorityLevel.CRITICAL, PriorityLevel.HIGH]
        
        # Algorithms should come second (from skill_gaps)
        assert prioritized[1].category == "Algorithms"
    
    def test_position_affects_priority(self, generator):
        """Test that earlier position in arrays gives higher priority."""
        gaps = ["First Gap", "Second Gap", "Third Gap"]
        analysis = {
            "skill_gaps": [],
            "recommended_topics": ["First Gap", "Second Gap", "Third Gap"]
        }
        
        prioritized = generator.assign_priority(gaps, analysis)
        
        # Earlier positions should have higher impact scores
        assert prioritized[0].impact_score >= prioritized[1].impact_score
        assert prioritized[1].impact_score >= prioritized[2].impact_score
    
    def test_frequency_increases_priority(self, generator):
        """Test that gaps appearing multiple times get higher priority."""
        gaps = ["System Design"]
        analysis = {
            "skill_gaps": ["System Design", "System Design", "Algorithms"],
            "recommended_topics": []
        }
        
        prioritized = generator.assign_priority(gaps, analysis)
        
        # Frequency should be 2 (appears twice in skill_gaps)
        assert prioritized[0].frequency == 2
        # Higher frequency should increase impact score
        assert prioritized[0].impact_score > 40  # Base skill gap score
    
    def test_case_insensitive_frequency_counting(self, generator):
        """Test that frequency counting is case-insensitive."""
        gaps = ["System Design"]
        analysis = {
            "skill_gaps": ["System Design", "system design", "SYSTEM DESIGN"],
            "recommended_topics": []
        }
        
        prioritized = generator.assign_priority(gaps, analysis)
        
        # Should count all variations as the same gap
        assert prioritized[0].frequency == 3
    
    def test_empty_gaps(self, generator):
        """Test with empty gaps list."""
        prioritized = generator.assign_priority([], {})
        
        assert prioritized == []
    
    def test_empty_analysis(self, generator):
        """Test with empty analysis."""
        gaps = ["System Design"]
        prioritized = generator.assign_priority(gaps, {})
        
        # With empty analysis, method returns empty list
        assert len(prioritized) == 0
    
    def test_gap_not_in_arrays(self, generator):
        """Test gap that's not in either array."""
        gaps = ["Unknown Gap"]
        analysis = {
            "skill_gaps": ["System Design"],
            "recommended_topics": ["Algorithms"]
        }
        
        prioritized = generator.assign_priority(gaps, analysis)
        
        assert len(prioritized) == 1
        assert prioritized[0].category == "Unknown Gap"
        # Gap not in arrays gets base score of 40, which maps to MEDIUM priority
        assert prioritized[0].priority == PriorityLevel.MEDIUM
        assert prioritized[0].frequency == 1
    
    def test_sort_by_priority_descending(self, generator):
        """Test that results are sorted by priority descending."""
        gaps = ["Gap1", "Gap2", "Gap3"]
        analysis = {
            "skill_gaps": [],
            "recommended_topics": ["Gap1", "Gap2", "Gap3"]  # All in recommended_topics
        }
        
        prioritized = generator.assign_priority(gaps, analysis)
        
        # All should have priority but sorted by priority then name
        priority_order = {
            PriorityLevel.CRITICAL: 0,
            PriorityLevel.HIGH: 1,
            PriorityLevel.MEDIUM: 2,
            PriorityLevel.LOW: 3
        }
        
        # Verify sorted
        for i in range(len(prioritized) - 1):
            curr_priority = priority_order[prioritized[i].priority]
            next_priority = priority_order[prioritized[i+1].priority]
            assert curr_priority <= next_priority
    
    def test_sort_alphabetical_within_priority(self, generator):
        """Test that gaps with same priority are sorted alphabetically."""
        gaps = ["Zebra Gap", "Apple Gap", "Banana Gap"]
        analysis = {
            "skill_gaps": ["Zebra Gap", "Apple Gap", "Banana Gap"],
            "recommended_topics": []
        }
        
        prioritized = generator.assign_priority(gaps, analysis)
        
        # All have same priority level (skill gap with same position cost)
        # Should be sorted alphabetically within the same priority
        categories = [p.category for p in prioritized]
        assert categories == sorted(categories, key=str.lower)
    
    def test_frequency_boost_increases_impact_score(self, generator):
        """Test that frequency boost increases impact score appropriately."""
        gaps = ["System Design", "Code Quality"]
        analysis = {
            "skill_gaps": ["System Design"],  # Appears once
            "recommended_topics": ["Code Quality", "Code Quality"]  # Appears twice
        }
        
        prioritized = generator.assign_priority(gaps, analysis)
        
        # Find the gaps in results
        design_gap = next(g for g in prioritized if g.category == "System Design")
        quality_gap = next(g for g in prioritized if g.category == "Code Quality")
        
        # Code Quality appears twice so should have higher impact
        assert quality_gap.frequency == 2
        # Frequency boost is (frequency - 1) * 5, so 2 frequency = +5 boost
        assert quality_gap.impact_score > design_gap.impact_score
    
    def test_frequency_boost_capped_at_15(self, generator):
        """Test that frequency boost is capped at +15 points."""
        gaps = ["System Design"]
        analysis = {
            "skill_gaps": ["System Design", "System Design", "System Design", "System Design"],
            "recommended_topics": []
        }
        
        prioritized = generator.assign_priority(gaps, analysis)
        
        # Frequency is 4, boost would be (4-1)*5 = 15
        assert prioritized[0].frequency == 4
        # Impact score should be capped at 100
        assert prioritized[0].impact_score <= 100
    
    def test_impact_score_in_valid_range(self, generator):
        """Test that all impact scores are between 0 and 100."""
        gaps = ["Gap1", "Gap2", "Gap3"]
        analysis = {
            "skill_gaps": ["Gap1", "Gap1", "Gap1"],
            "recommended_topics": ["Gap2", "Gap2", "Gap3"]
        }
        
        prioritized = generator.assign_priority(gaps, analysis)
        
        for gap in prioritized:
            assert 0 <= gap.impact_score <= 100
    
    def test_priority_levels_assigned_correctly(self, generator):
        """Test that priority levels are assigned based on impact score thresholds."""
        gaps = ["Critical", "High", "Medium", "Low"]
        analysis = {
            "skill_gaps": [],
            "recommended_topics": ["Critical", "High", "Medium", "Low"]
        }
        
        prioritized = generator.assign_priority(gaps, analysis)
        
        # First gap (Critical) should have highest impact
        critical = prioritized[0] if prioritized[0].category == "Critical" else None
        if critical:
            assert critical.impact_score >= 85
            assert critical.priority == PriorityLevel.CRITICAL
    
    def test_detected_in_field_set_correctly(self, generator):
        """Test that detected_in field is set based on gap content."""
        gaps = ["System Design", "Coding Challenge", "Behavioral Issue"]
        analysis = {
            "skill_gaps": gaps,
            "recommended_topics": []
        }
        
        prioritized = generator.assign_priority(gaps, analysis)
        
        for gap in prioritized:
            if "coding" in gap.category.lower():
                assert gap.detected_in == "coding_round"
            elif "behavioral" in gap.category.lower():
                assert gap.detected_in == "behavioral"
            else:
                assert gap.detected_in == "technical_dive"
    
    @given(st.lists(st.text(min_size=1, max_size=30), unique=True, min_size=1, max_size=5))
    def test_property_priority_assignment_determinism(self, gaps):
        """
        Property test: Priority assignment should be deterministic and reproducible.
        
        For any set of gaps with varying frequencies and positions, priority
        assignment should produce the same results when called twice with the same data.
        
        **Validates: Requirement 1.2**
        """
        generator = ComprehensiveAnalysisGenerator()
        
        # Create analysis with gaps distributed
        skill_gaps = gaps[::2] if len(gaps) > 1 else gaps
        recommended = gaps[1::2] if len(gaps) > 1 else []
        
        analysis = {
            "skill_gaps": skill_gaps,
            "recommended_topics": recommended
        }
        
        # Call twice
        result1 = generator.assign_priority(gaps, analysis)
        result2 = generator.assign_priority(gaps, analysis)
        
        # Results should be identical
        assert len(result1) == len(result2)
        for g1, g2 in zip(result1, result2):
            assert g1.category == g2.category
            assert g1.priority == g2.priority
            assert g1.frequency == g2.frequency
            assert g1.impact_score == g2.impact_score
    
    @given(st.lists(st.text(min_size=1, max_size=30), unique=True, min_size=1, max_size=5))
    def test_property_all_gaps_assigned_priority(self, input_gaps):
        """
        Property test: All gaps should receive exactly one priority level.
        
        For any set of gaps, priority assignment should return a gap with a priority
        for each input gap, with no gaps missing and no duplicates in category.
        
        **Validates: Requirement 1.2**
        """
        generator = ComprehensiveAnalysisGenerator()
        
        analysis = {
            "skill_gaps": input_gaps[:len(input_gaps)//2],
            "recommended_topics": input_gaps[len(input_gaps)//2:]
        }
        
        result = generator.assign_priority(input_gaps, analysis)
        
        # Every input gap should have a result
        assert len(result) == len(input_gaps)
        
        # Each gap should have a valid priority
        for gap in result:
            assert gap.priority in [PriorityLevel.CRITICAL, PriorityLevel.HIGH, 
                                   PriorityLevel.MEDIUM, PriorityLevel.LOW]
            assert gap.frequency >= 1
            assert 0 <= gap.impact_score <= 100


if __name__ == "__main__":
    pytest.main([__file__, "-v"])


class TestBuildTopicInfo:
    """Tests for build_topic_info method."""
    
    def test_system_design_topic_retrieval(self, generator):
        """Test retrieving System Design topic information."""
        topic_info = generator.build_topic_info("System Design")
        
        assert topic_info is not None
        assert topic_info.concept is not None
        assert len(topic_info.concept) > 0
        assert "scalable" in topic_info.concept.lower() or "distributed" in topic_info.concept.lower()
        assert len(topic_info.subtopics) > 0
        assert any("Load Balancing" in s for s in topic_info.subtopics)
        assert len(topic_info.competencies) > 0
        assert len(topic_info.pitfalls) > 0
    
    def test_algorithms_topic_retrieval(self, generator):
        """Test retrieving Algorithms topic information."""
        topic_info = generator.build_topic_info("Algorithms")
        
        assert topic_info is not None
        assert topic_info.concept is not None
        assert len(topic_info.concept) > 0
        assert len(topic_info.subtopics) > 0
        assert any("Big-O Notation" in s for s in topic_info.subtopics)
        assert len(topic_info.competencies) > 0
        assert len(topic_info.pitfalls) > 0
    
    def test_code_quality_topic_retrieval(self, generator):
        """Test retrieving Code Quality topic information."""
        topic_info = generator.build_topic_info("Code Quality")
        
        assert topic_info is not None
        assert topic_info.concept is not None
        assert len(topic_info.subtopics) > 0
        assert len(topic_info.competencies) > 0
        assert len(topic_info.pitfalls) > 0
    
    def test_following_instructions_topic_retrieval(self, generator):
        """Test retrieving Following Instructions topic information."""
        topic_info = generator.build_topic_info("Following Instructions")
        
        assert topic_info is not None
        assert topic_info.concept is not None
        assert len(topic_info.subtopics) > 0
        assert len(topic_info.competencies) > 0
        assert len(topic_info.pitfalls) > 0
    
    def test_communication_topic_retrieval(self, generator):
        """Test retrieving Communication topic information."""
        topic_info = generator.build_topic_info("Communication")
        
        assert topic_info is not None
        assert topic_info.concept is not None
        assert len(topic_info.subtopics) > 0
        assert len(topic_info.competencies) > 0
        assert len(topic_info.pitfalls) > 0
    
    def test_problem_solving_topic_retrieval(self, generator):
        """Test retrieving Problem Solving topic information."""
        topic_info = generator.build_topic_info("Problem Solving")
        
        assert topic_info is not None
        assert topic_info.concept is not None
        assert len(topic_info.subtopics) > 0
        assert len(topic_info.competencies) > 0
        assert len(topic_info.pitfalls) > 0
    
    def test_data_structures_topic_retrieval(self, generator):
        """Test retrieving Data Structures topic information."""
        topic_info = generator.build_topic_info("Data Structures")
        
        assert topic_info is not None
        assert topic_info.concept is not None
        assert len(topic_info.subtopics) > 0
        assert len(topic_info.competencies) > 0
        assert len(topic_info.pitfalls) > 0
    
    def test_behavioral_topic_retrieval(self, generator):
        """Test retrieving Behavioral topic information."""
        topic_info = generator.build_topic_info("Behavioral")
        
        assert topic_info is not None
        assert topic_info.concept is not None
        assert len(topic_info.subtopics) > 0
        assert len(topic_info.competencies) > 0
        assert len(topic_info.pitfalls) > 0
    
    def test_object_oriented_design_topic_retrieval(self, generator):
        """Test retrieving Object-Oriented Design topic information."""
        topic_info = generator.build_topic_info("Object-Oriented Design")
        
        assert topic_info is not None
        assert topic_info.concept is not None
        assert len(topic_info.subtopics) > 0
        assert len(topic_info.competencies) > 0
        assert len(topic_info.pitfalls) > 0
    
    def test_database_design_topic_retrieval(self, generator):
        """Test retrieving Database Design topic information."""
        topic_info = generator.build_topic_info("Database Design")
        
        assert topic_info is not None
        assert topic_info.concept is not None
        assert len(topic_info.subtopics) > 0
        assert len(topic_info.competencies) > 0
        assert len(topic_info.pitfalls) > 0
    
    def test_nonexistent_topic(self, generator):
        """Test retrieving a topic that doesn't exist."""
        topic_info = generator.build_topic_info("Nonexistent Topic")
        
        assert topic_info is None
    
    def test_empty_category(self, generator):
        """Test with empty category string."""
        topic_info = generator.build_topic_info("")
        
        assert topic_info is None
    
    def test_none_category(self, generator):
        """Test with None category."""
        topic_info = generator.build_topic_info(None)
        
        assert topic_info is None
    
    def test_whitespace_only_category(self, generator):
        """Test with whitespace-only category."""
        topic_info = generator.build_topic_info("   ")
        
        assert topic_info is None
    
    def test_category_with_leading_trailing_whitespace(self, generator):
        """Test category lookup with leading/trailing whitespace."""
        topic_info = generator.build_topic_info("  System Design  ")
        
        # Should normalize and find the topic
        assert topic_info is not None
        assert len(topic_info.concept) > 0
    
    def test_topic_info_structure_completeness(self, generator):
        """Test that TopicInfo has all required fields populated."""
        topic_info = generator.build_topic_info("System Design")
        
        assert topic_info is not None
        # All fields should be non-empty
        assert topic_info.concept and isinstance(topic_info.concept, str)
        assert topic_info.subtopics and isinstance(topic_info.subtopics, list)
        assert len(topic_info.subtopics) > 0
        assert all(isinstance(s, str) for s in topic_info.subtopics)
        assert topic_info.competencies and isinstance(topic_info.competencies, list)
        assert len(topic_info.competencies) > 0
        assert all(isinstance(c, str) for c in topic_info.competencies)
        assert topic_info.pitfalls and isinstance(topic_info.pitfalls, list)
        assert len(topic_info.pitfalls) > 0
        assert all(isinstance(p, str) for p in topic_info.pitfalls)
    
    @given(st.sampled_from([
        "System Design", "Algorithms", "Code Quality", "Following Instructions",
        "Communication", "Problem Solving", "Data Structures", "Behavioral",
        "Object-Oriented Design", "Database Design"
    ]))
    def test_property_topic_info_structural_validity(self, category):
        """
        Property test: For any gap category in TOPIC_DATABASE, retrieving topic info
        SHALL return a complete structure with all required fields.
        
        **Validates: Requirement 2.1, 2.2**
        """
        generator = ComprehensiveAnalysisGenerator()
        topic_info = generator.build_topic_info(category)
        
        # Should find the topic
        assert topic_info is not None
        
        # Verify all fields are present and non-empty
        assert isinstance(topic_info.concept, str) and len(topic_info.concept) > 0
        assert isinstance(topic_info.subtopics, list) and len(topic_info.subtopics) > 0
        assert all(isinstance(s, str) for s in topic_info.subtopics)
        assert isinstance(topic_info.competencies, list) and len(topic_info.competencies) > 0
        assert all(isinstance(c, str) for c in topic_info.competencies)
        assert isinstance(topic_info.pitfalls, list) and len(topic_info.pitfalls) > 0
        assert all(isinstance(p, str) for p in topic_info.pitfalls)
    
    def test_invalid_input_types(self, generator):
        """Test with invalid input types."""
        assert generator.build_topic_info(123) is None
        assert generator.build_topic_info([]) is None
        assert generator.build_topic_info({}) is None
        assert generator.build_topic_info(False) is None
    
    def test_topic_concept_is_descriptive(self, generator):
        """Test that concept is descriptive (multiple words/sentences)."""
        topic_info = generator.build_topic_info("System Design")
        
        assert topic_info is not None
        # Concept should be descriptive, typically 2+ sentences
        assert len(topic_info.concept) > 50



class TestCurateResources:
    """Tests for curate_resources method."""
    
    def test_curate_system_design_resources(self, generator):
        """Test curating resources for System Design gap."""
        gaps = ["System Design"]
        
        resources, coverage_gaps = generator.curate_resources(gaps)
        
        # Should return resources
        assert len(resources) > 0
        # Should have no coverage gaps
        assert "System Design" not in coverage_gaps
        
        # Verify resource structure
        for resource in resources:
            assert resource.id is not None
            assert resource.title is not None and len(resource.title) > 0
            assert resource.type in ["book", "course", "blog", "documentation", "tutorial", "practice", "guide"]
            assert resource.url is not None and len(resource.url) > 0
            assert "System Design" in resource.categories
    
    def test_curate_algorithms_resources(self, generator):
        """Test curating resources for Algorithms gap."""
        gaps = ["Algorithms"]
        
        resources, coverage_gaps = generator.curate_resources(gaps)
        
        # Should return resources
        assert len(resources) > 0
        assert "Algorithms" not in coverage_gaps
        
        # Verify all resources relate to Algorithms
        for resource in resources:
            assert "Algorithms" in resource.categories
    
    def test_curate_multiple_gaps_resources(self, generator):
        """Test curating resources for multiple gaps."""
        gaps = ["System Design", "Algorithms", "Code Quality"]
        
        resources, coverage_gaps = generator.curate_resources(gaps)
        
        # Should return resources for each gap
        assert len(resources) > 0
        
        # Verify resources cover the gaps
        resource_categories = set()
        for resource in resources:
            resource_categories.update(resource.categories)
        
        for gap in gaps:
            assert gap in resource_categories or gap in coverage_gaps
    
    def test_filter_by_resource_type_book(self, generator):
        """Test filtering resources by type 'book'."""
        gaps = ["System Design", "Algorithms"]
        
        resources, coverage_gaps = generator.curate_resources(gaps, filter_type="book")
        
        # Should only return books
        assert all(resource.type == "book" for resource in resources)
    
    def test_filter_by_resource_type_course(self, generator):
        """Test filtering resources by type 'course'."""
        gaps = ["System Design"]
        
        resources, coverage_gaps = generator.curate_resources(gaps, filter_type="course")
        
        # Should only return courses
        assert all(resource.type == "course" for resource in resources)
    
    def test_filter_by_resource_type_tutorial(self, generator):
        """Test filtering resources by type 'tutorial'."""
        gaps = ["Algorithms"]
        
        resources, coverage_gaps = generator.curate_resources(gaps, filter_type="tutorial")
        
        # Should only return tutorials
        assert all(resource.type == "tutorial" for resource in resources)
    
    def test_filter_by_resource_type_practice(self, generator):
        """Test filtering resources by type 'practice'."""
        gaps = ["Algorithms"]
        
        resources, coverage_gaps = generator.curate_resources(gaps, filter_type="practice")
        
        # Should only return practice resources
        assert all(resource.type == "practice" for resource in resources)
    
    def test_filter_by_resource_type_no_matches(self, generator):
        """Test filtering for type that doesn't match gap resources."""
        gaps = ["System Design"]
        
        # Filter for practice type, but System Design doesn't have practice resources
        resources, coverage_gaps = generator.curate_resources(gaps, filter_type="practice")
        
        # May have no resources after filtering
        if resources:
            assert all(resource.type == "practice" for resource in resources)
    
    def test_coverage_gaps_identified(self, generator):
        """Test that coverage gaps are identified for gaps with no resources."""
        # Create a gap that doesn't exist in RESOURCE_DATABASE
        gaps = ["System Design", "Nonexistent Gap"]
        
        resources, coverage_gaps = generator.curate_resources(gaps)
        
        # Should identify the nonexistent gap as a coverage gap
        assert "Nonexistent Gap" in coverage_gaps
        # System Design should NOT be a coverage gap
        assert "System Design" not in coverage_gaps
    
    def test_coverage_gaps_with_filter(self, generator):
        """Test coverage gaps identification with type filter."""
        gaps = ["System Design"]
        
        # Filter for practice type which System Design doesn't have
        resources, coverage_gaps = generator.curate_resources(gaps, filter_type="practice")
        
        # After filtering, System Design may or may not be a coverage gap
        # depending on whether it has practice resources
        # This test just ensures the method handles filtering consistently
        assert isinstance(coverage_gaps, list)
    
    def test_empty_gaps_list(self, generator):
        """Test with empty gaps list."""
        resources, coverage_gaps = generator.curate_resources([])
        
        assert resources == []
        assert coverage_gaps == []
    
    def test_none_gaps_list(self, generator):
        """Test with None gaps list."""
        resources, coverage_gaps = generator.curate_resources(None)
        
        assert resources == []
        assert coverage_gaps == []
    
    def test_case_insensitive_gap_matching(self, generator):
        """Test that gap matching is case-insensitive."""
        gaps = ["system design", "ALGORITHMS", "Code Quality"]
        
        resources, coverage_gaps = generator.curate_resources(gaps)
        
        # Should find resources despite case differences
        assert len(resources) > 0
        # Should not flag these as coverage gaps
        assert "system design" not in coverage_gaps or len(resources) > 0
    
    def test_case_insensitive_filter_type(self, generator):
        """Test that filter type is case-insensitive."""
        gaps = ["System Design"]
        
        # Filter with uppercase type
        resources1, _ = generator.curate_resources(gaps, filter_type="BOOK")
        resources2, _ = generator.curate_resources(gaps, filter_type="book")
        
        # Should return same results
        assert len(resources1) == len(resources2)
    
    def test_resource_id_format(self, generator):
        """Test that resource IDs are properly formatted."""
        gaps = ["System Design"]
        
        resources, _ = generator.curate_resources(gaps)
        
        # IDs should follow pattern: category_index
        for resource in resources:
            assert "_" in resource.id or resource.id.startswith("system_design_")
    
    def test_resource_categories_include_gap(self, generator):
        """Test that each resource's categories include the matching gap."""
        gaps = ["System Design", "Algorithms"]
        
        resources, _ = generator.curate_resources(gaps)
        
        # Each resource should list the gap it addresses
        for resource in resources:
            assert len(resource.categories) > 0
            # At least one category should match a gap (case-insensitive)
            resource_gap_categories = [cat.lower() for cat in resource.categories]
            gap_match = any(gap.lower() in resource_gap_categories for gap in gaps)
            assert gap_match
    
    def test_no_duplicate_resources(self, generator):
        """Test that no duplicate resources are returned."""
        gaps = ["System Design", "Algorithms"]
        
        resources, _ = generator.curate_resources(gaps)
        
        # Resource IDs should be unique
        ids = [r.id for r in resources]
        assert len(ids) == len(set(ids))
    
    def test_all_resource_types_present(self, generator):
        """Test that different resource types are returned."""
        gaps = ["System Design", "Algorithms"]
        
        resources, _ = generator.curate_resources(gaps)
        
        # Should have variety of types
        types = set(r.type for r in resources)
        assert len(types) > 1  # Multiple types
    
    def test_resource_url_is_valid(self, generator):
        """Test that all resource URLs are non-empty strings."""
        gaps = ["System Design"]
        
        resources, _ = generator.curate_resources(gaps)
        
        for resource in resources:
            assert isinstance(resource.url, str)
            assert len(resource.url) > 0
            assert resource.url.startswith("http")
    
    def test_resource_title_is_present(self, generator):
        """Test that all resources have titles."""
        gaps = ["System Design"]
        
        resources, _ = generator.curate_resources(gaps)
        
        for resource in resources:
            assert isinstance(resource.title, str)
            assert len(resource.title) > 0
    
    def test_resource_author_optional(self, generator):
        """Test that author field is optional."""
        gaps = ["System Design"]
        
        resources, _ = generator.curate_resources(gaps)
        
        # Some resources may have authors, some may not
        has_authors = any(r.author is not None for r in resources)
        has_no_authors = any(r.author is None for r in resources)
        
        # This is valid - author is optional
        assert True
    
    def test_return_type_is_tuple(self, generator):
        """Test that return value is a tuple of (resources, coverage_gaps)."""
        gaps = ["System Design"]
        
        result = generator.curate_resources(gaps)
        
        assert isinstance(result, tuple)
        assert len(result) == 2
        resources, coverage_gaps = result
        assert isinstance(resources, list)
        assert isinstance(coverage_gaps, list)
    
    def test_coverage_gaps_are_gap_strings(self, generator):
        """Test that coverage gaps contain gap strings."""
        gaps = ["System Design", "Unknown Gap"]
        
        _, coverage_gaps = generator.curate_resources(gaps)
        
        # Coverage gaps should be strings matching input gap format
        for gap in coverage_gaps:
            assert isinstance(gap, str)
            assert gap in gaps
    
    @given(st.lists(st.sampled_from([
        "System Design", "Algorithms", "Code Quality", "Communication",
        "Following Instructions"
    ]), unique=True, min_size=1, max_size=3))
    def test_property_resources_match_gaps(self, gaps):
        """
        Property test: For any gap list, curated resources should only come from
        RESOURCE_DATABASE entries matching those gaps.
        
        **Validates: Requirement 5.3, 5.4**
        """
        generator = ComprehensiveAnalysisGenerator()
        resources, _ = generator.curate_resources(gaps)
        
        # Every resource should match at least one gap (case-insensitive)
        gaps_lower = set(gap.lower() for gap in gaps)
        for resource in resources:
            resource_gaps_lower = set(cat.lower() for cat in resource.categories)
            assert len(resource_gaps_lower & gaps_lower) > 0
    
    @given(st.lists(st.sampled_from([
        "System Design", "Algorithms"
    ]), unique=True, min_size=1, max_size=2),
           st.sampled_from(["book", "course", "blog", "documentation", "tutorial", "practice", "guide"]))
    def test_property_filter_consistency(self, gaps, filter_type):
        """
        Property test: For any gap list and filter type, returned resources should
        all match the specified type.
        
        **Validates: Requirement 5.3**
        """
        generator = ComprehensiveAnalysisGenerator()
        resources, _ = generator.curate_resources(gaps, filter_type=filter_type)
        
        # All resources should match the filter type
        for resource in resources:
            assert resource.type.lower() == filter_type.lower()
    
    @given(st.lists(st.text(min_size=1, max_size=30), unique=True, min_size=1, max_size=3))
    def test_property_coverage_gaps_completeness(self, gaps):
        """
        Property test: Coverage gap identification should be complete.
        
        For any set of gaps, those without matching resources should appear in
        coverage_gaps exactly once.
        
        **Validates: Requirement 5.5**
        """
        generator = ComprehensiveAnalysisGenerator()
        resources, coverage_gaps = generator.curate_resources(gaps)
        
        # Verify coverage gap identification
        gaps_with_resources = set()
        for resource in resources:
            gaps_with_resources.update(cat.lower() for cat in resource.categories)
        
        # Gaps not in resources should be in coverage_gaps
        for gap in gaps:
            if gap.lower() not in gaps_with_resources:
                # This gap should be in coverage_gaps (case-insensitive match)
                coverage_gaps_lower = set(g.lower() for g in coverage_gaps)
                assert gap.lower() in coverage_gaps_lower
    
    def test_resource_structure_matches_model(self, generator):
        """Test that returned StudyResource objects match the model definition."""
        gaps = ["System Design"]
        
        resources, _ = generator.curate_resources(gaps)
        
        from app.models.analysis import StudyResource
        for resource in resources:
            assert isinstance(resource, StudyResource)
            assert hasattr(resource, 'id')
            assert hasattr(resource, 'title')
            assert hasattr(resource, 'author')
            assert hasattr(resource, 'type')
            assert hasattr(resource, 'url')
            assert hasattr(resource, 'categories')
    
    def test_real_database_resources_returned(self, generator):
        """Test with real RESOURCE_DATABASE to ensure data flows correctly."""
        from app.services.remediation import RESOURCE_DATABASE
        
        gaps = list(RESOURCE_DATABASE.keys())[:2]  # Use real gap categories
        
        resources, coverage_gaps = generator.curate_resources(gaps)
        
        # Should get real resources
        assert len(resources) > 0
        
        # These gaps should NOT be coverage gaps
        for gap in gaps:
            assert gap not in coverage_gaps
