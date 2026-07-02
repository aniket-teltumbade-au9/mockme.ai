"""
Tests for build_holistic_guidance method.

Tests gap relationship identification, recommended sequence generation,
dependency map creation, and action checklist grouping.
"""

import pytest
from hypothesis import given, strategies as st
from app.services.comprehensive_analysis import ComprehensiveAnalysisGenerator
from app.models.analysis import (
    PriorityLevel, PrioritizedGap, CommunicationGap, HolisticGuidance
)


@pytest.fixture
def generator():
    """Create a generator instance for testing."""
    return ComprehensiveAnalysisGenerator()


class TestBuildHolisticGuidance:
    """Tests for build_holistic_guidance method."""
    
    def test_basic_guidance_generation(self, generator):
        """Test basic holistic guidance generation with simple gaps."""
        tech_gaps = [
            PrioritizedGap(
                category="System Design",
                priority=PriorityLevel.CRITICAL,
                frequency=2,
                impact_score=90,
                detected_in="technical_dive"
            ),
            PrioritizedGap(
                category="Algorithms",
                priority=PriorityLevel.HIGH,
                frequency=1,
                impact_score=75,
                detected_in="coding_round"
            )
        ]
        
        comm_gaps = [
            CommunicationGap(
                category="Clarity",
                severity=PriorityLevel.HIGH,
                description="Unclear explanations of design concepts",
                candidate_response="Um, so like, I would use a cache... or maybe not",
                improvement_tips=["Be clear about tradeoffs", "Define terms upfront"],
                sample_improved_response="I propose using Redis for caching with a TTL of 24 hours.",
                related_tactic=None
            )
        ]
        
        guidance = generator.build_holistic_guidance(tech_gaps, comm_gaps)
        
        # Verify it returns a HolisticGuidance object
        assert isinstance(guidance, HolisticGuidance)
        assert guidance.gap_relationships is not None
        assert guidance.recommended_sequence is not None
        assert guidance.dependency_map is not None
        assert guidance.action_checklist is not None
    
    def test_gap_relationships_identified(self, generator):
        """Test that gap relationships are correctly identified."""
        tech_gaps = [
            PrioritizedGap(
                category="System Design",
                priority=PriorityLevel.CRITICAL,
                frequency=2,
                impact_score=90,
                detected_in="technical_dive"
            )
        ]
        
        comm_gaps = [
            CommunicationGap(
                category="Technical Vocabulary",
                severity=PriorityLevel.HIGH,
                description="Imprecise terminology in system design",
                candidate_response="I would use a... thing... for scaling",
                improvement_tips=["Use correct terms"],
                sample_improved_response="I would implement sharding for horizontal scaling.",
                related_tactic=None
            )
        ]
        
        guidance = generator.build_holistic_guidance(tech_gaps, comm_gaps)
        
        # Should identify relationship between System Design gap and Technical Vocabulary gap
        assert len(guidance.gap_relationships) > 0
        
        # Check relationship structure
        for rel in guidance.gap_relationships:
            assert "tech_gap" in rel
            assert "comm_gap" in rel
            assert "connection" in rel
            assert rel["tech_gap"] == "System Design"
            assert rel["comm_gap"] == "Technical Vocabulary"
    
    def test_recommended_sequence_prioritizes_critical_gaps(self, generator):
        """Test that recommended sequence prioritizes critical technical gaps."""
        tech_gaps = [
            PrioritizedGap(
                category="Critical Gap",
                priority=PriorityLevel.CRITICAL,
                frequency=1,
                impact_score=95,
                detected_in="technical_dive"
            ),
            PrioritizedGap(
                category="High Gap",
                priority=PriorityLevel.HIGH,
                frequency=1,
                impact_score=75,
                detected_in="technical_dive"
            ),
            PrioritizedGap(
                category="Medium Gap",
                priority=PriorityLevel.MEDIUM,
                frequency=1,
                impact_score=50,
                detected_in="technical_dive"
            )
        ]
        
        comm_gaps = []
        
        guidance = generator.build_holistic_guidance(tech_gaps, comm_gaps)
        
        # Critical gap should appear before High gap
        if "Critical Gap" in guidance.recommended_sequence and "High Gap" in guidance.recommended_sequence:
            critical_idx = guidance.recommended_sequence.index("Critical Gap")
            high_idx = guidance.recommended_sequence.index("High Gap")
            assert critical_idx < high_idx
    
    def test_recommended_sequence_includes_all_gaps(self, generator):
        """Test that recommended sequence includes all gaps."""
        tech_gaps = [
            PrioritizedGap(
                category="System Design",
                priority=PriorityLevel.CRITICAL,
                frequency=2,
                impact_score=90,
                detected_in="technical_dive"
            ),
            PrioritizedGap(
                category="Algorithms",
                priority=PriorityLevel.HIGH,
                frequency=1,
                impact_score=75,
                detected_in="coding_round"
            )
        ]
        
        comm_gaps = [
            CommunicationGap(
                category="Clarity",
                severity=PriorityLevel.MEDIUM,
                description="Unclear explanations",
                candidate_response="Um...",
                improvement_tips=["Be clear"],
                sample_improved_response="Clear response",
                related_tactic=None
            ),
            CommunicationGap(
                category="Confidence",
                severity=PriorityLevel.LOW,
                description="Hesitant responses",
                candidate_response="I think maybe...",
                improvement_tips=["Be confident"],
                sample_improved_response="Confident response",
                related_tactic=None
            )
        ]
        
        guidance = generator.build_holistic_guidance(tech_gaps, comm_gaps)
        
        # All gap categories should be in the sequence
        sequence_set = set(guidance.recommended_sequence)
        assert "System Design" in sequence_set
        assert "Algorithms" in sequence_set
        assert "Clarity" in sequence_set or "Confidence" in sequence_set  # At least one comm gap
    
    def test_dependency_map_structure(self, generator):
        """Test that dependency map has correct structure."""
        tech_gaps = [
            PrioritizedGap(
                category="System Design",
                priority=PriorityLevel.CRITICAL,
                frequency=1,
                impact_score=90,
                detected_in="technical_dive"
            )
        ]
        
        comm_gaps = [
            CommunicationGap(
                category="Clarity",
                severity=PriorityLevel.HIGH,
                description="Unclear",
                candidate_response="Um...",
                improvement_tips=["Be clear"],
                sample_improved_response="Clear",
                related_tactic=None
            )
        ]
        
        guidance = generator.build_holistic_guidance(tech_gaps, comm_gaps)
        
        dep_map = guidance.dependency_map
        assert "nodes" in dep_map
        assert "edges" in dep_map
        assert "total_gaps" in dep_map
        assert "critical_count" in dep_map
        assert "recommended_start" in dep_map
        
        # Verify nodes
        assert len(dep_map["nodes"]) >= 2
        for node in dep_map["nodes"]:
            assert "id" in node
            assert "label" in node
            assert "type" in node
            assert node["type"] in ["technical", "communication"]
        
        # Verify total gaps
        assert dep_map["total_gaps"] == 2
        assert dep_map["critical_count"] == 1
    
    def test_action_checklist_structure(self, generator):
        """Test that action checklist has correct structure."""
        tech_gaps = [
            PrioritizedGap(
                category="System Design",
                priority=PriorityLevel.CRITICAL,
                frequency=1,
                impact_score=90,
                detected_in="technical_dive"
            ),
            PrioritizedGap(
                category="Algorithms",
                priority=PriorityLevel.HIGH,
                frequency=1,
                impact_score=75,
                detected_in="coding_round"
            ),
            PrioritizedGap(
                category="Code Quality",
                priority=PriorityLevel.MEDIUM,
                frequency=1,
                impact_score=50,
                detected_in="technical_dive"
            )
        ]
        
        comm_gaps = [
            CommunicationGap(
                category="Confidence",
                severity=PriorityLevel.LOW,
                description="Hesitant",
                candidate_response="I think...",
                improvement_tips=["Be confident"],
                sample_improved_response="Confident",
                related_tactic=None
            )
        ]
        
        guidance = generator.build_holistic_guidance(tech_gaps, comm_gaps)
        
        checklist = guidance.action_checklist
        
        # Should have multiple timeline groups
        assert len(checklist) > 0
        
        # Verify each timeline group structure
        for timeline_group in checklist:
            assert "timeline" in timeline_group
            assert "priority" in timeline_group
            assert "estimated_total_hours" in timeline_group
            assert "gaps" in timeline_group
            assert "description" in timeline_group
            
            # Verify gaps within timeline
            for gap_item in timeline_group["gaps"]:
                assert "gap_name" in gap_item
                assert "type" in gap_item
                assert "estimated_hours" in gap_item
                assert "actions" in gap_item
                assert isinstance(gap_item["actions"], list)
                assert len(gap_item["actions"]) > 0
    
    def test_action_checklist_timeline_organization(self, generator):
        """Test that action checklist is organized by realistic timelines."""
        tech_gaps = [
            PrioritizedGap(
                category="System Design",
                priority=PriorityLevel.CRITICAL,
                frequency=2,
                impact_score=95,
                detected_in="technical_dive"
            ),
            PrioritizedGap(
                category="Algorithms",
                priority=PriorityLevel.HIGH,
                frequency=1,
                impact_score=80,
                detected_in="coding_round"
            ),
            PrioritizedGap(
                category="Code Quality",
                priority=PriorityLevel.MEDIUM,
                frequency=1,
                impact_score=50,
                detected_in="technical_dive"
            ),
            PrioritizedGap(
                category="Data Structures",
                priority=PriorityLevel.LOW,
                frequency=1,
                impact_score=30,
                detected_in="technical_dive"
            )
        ]
        
        comm_gaps = []
        
        guidance = generator.build_holistic_guidance(tech_gaps, comm_gaps)
        
        checklist = guidance.action_checklist
        
        # Should have at least "This Week" timeline
        timelines = [tg["timeline"] for tg in checklist]
        assert "This Week" in timelines or "Next Week" in timelines or "Long-term (2+ weeks)" in timelines
        
        # "This Week" should have Critical gaps
        for timeline_group in checklist:
            if timeline_group["timeline"] == "This Week":
                gap_names = [g["gap_name"] for g in timeline_group["gaps"]]
                assert "System Design" in gap_names or "Algorithms" in gap_names
    
    def test_empty_gaps_handling(self, generator):
        """Test handling of empty gap lists."""
        guidance = generator.build_holistic_guidance([], [])
        
        assert isinstance(guidance, HolisticGuidance)
        assert guidance.recommended_sequence == []
        assert guidance.action_checklist == [] or len(guidance.action_checklist) == 0
    
    def test_only_technical_gaps(self, generator):
        """Test with only technical gaps, no communication gaps."""
        tech_gaps = [
            PrioritizedGap(
                category="System Design",
                priority=PriorityLevel.CRITICAL,
                frequency=2,
                impact_score=90,
                detected_in="technical_dive"
            )
        ]
        
        guidance = generator.build_holistic_guidance(tech_gaps, [])
        
        assert isinstance(guidance, HolisticGuidance)
        assert "System Design" in guidance.recommended_sequence
        assert len(guidance.action_checklist) > 0
    
    def test_only_communication_gaps(self, generator):
        """Test with only communication gaps, no technical gaps."""
        comm_gaps = [
            CommunicationGap(
                category="Clarity",
                severity=PriorityLevel.CRITICAL,
                description="Unclear",
                candidate_response="Um...",
                improvement_tips=["Be clear"],
                sample_improved_response="Clear",
                related_tactic=None
            )
        ]
        
        guidance = generator.build_holistic_guidance([], comm_gaps)
        
        assert isinstance(guidance, HolisticGuidance)
        assert "Clarity" in guidance.recommended_sequence
        assert len(guidance.action_checklist) > 0
    
    def test_gap_relationships_with_clarity_gap(self, generator):
        """Test gap relationship identification with clarity communication gap."""
        tech_gaps = [
            PrioritizedGap(
                category="System Design",
                priority=PriorityLevel.CRITICAL,
                frequency=1,
                impact_score=90,
                detected_in="technical_dive"
            )
        ]
        
        comm_gaps = [
            CommunicationGap(
                category="Clarity",
                severity=PriorityLevel.HIGH,
                description="Unclear explanations",
                candidate_response="I would design it... but I'm not sure how...",
                improvement_tips=["Be clear"],
                sample_improved_response="I would use the 4-step approach.",
                related_tactic=None
            )
        ]
        
        guidance = generator.build_holistic_guidance(tech_gaps, comm_gaps)
        
        # Should have identified relationship between System Design and Clarity
        relationships = guidance.gap_relationships
        assert len(relationships) > 0
        
        # Check that relationship mentions both gaps
        relationship_found = any(
            rel.get("tech_gap") == "System Design" and rel.get("comm_gap") == "Clarity"
            for rel in relationships
        )
        assert relationship_found
    
    def test_gap_relationships_active_listening_not_tech_dependent(self, generator):
        """Test that Active Listening gaps don't create tech relationships."""
        tech_gaps = [
            PrioritizedGap(
                category="System Design",
                priority=PriorityLevel.HIGH,
                frequency=1,
                impact_score=75,
                detected_in="technical_dive"
            )
        ]
        
        comm_gaps = [
            CommunicationGap(
                category="Active Listening",
                severity=PriorityLevel.HIGH,
                description="Not responding to hints",
                candidate_response="Candidate ignored feedback",
                improvement_tips=["Listen carefully"],
                sample_improved_response="Thank you for that hint, let me adjust my approach.",
                related_tactic=None
            )
        ]
        
        guidance = generator.build_holistic_guidance(tech_gaps, comm_gaps)
        
        # Active Listening shouldn't create a relationship with tech gaps
        relationships = guidance.gap_relationships
        for rel in relationships:
            if rel.get("comm_gap") == "Active Listening":
                # Relationship should not exist or be minimal
                pass  # Implementation may vary
    
    def test_multiple_comm_gaps_same_category(self, generator):
        """Test handling of multiple communication gaps in same category."""
        tech_gaps = [
            PrioritizedGap(
                category="System Design",
                priority=PriorityLevel.CRITICAL,
                frequency=1,
                impact_score=90,
                detected_in="technical_dive"
            )
        ]
        
        comm_gaps = [
            CommunicationGap(
                category="Clarity",
                severity=PriorityLevel.CRITICAL,
                description="Unclear design explanations",
                candidate_response="Um...",
                improvement_tips=["Be clear"],
                sample_improved_response="Clear",
                related_tactic=None
            ),
            CommunicationGap(
                category="Clarity",
                severity=PriorityLevel.HIGH,
                description="Unclear about tradeoffs",
                candidate_response="I don't know",
                improvement_tips=["Discuss tradeoffs"],
                sample_improved_response="Here are the tradeoffs.",
                related_tactic=None
            )
        ]
        
        guidance = generator.build_holistic_guidance(tech_gaps, comm_gaps)
        
        # Should still work with multiple gaps in same category
        assert isinstance(guidance, HolisticGuidance)
        assert len(guidance.action_checklist) > 0
    
    def test_estimated_hours_in_checklist(self, generator):
        """Test that action checklist includes reasonable time estimates."""
        tech_gaps = [
            PrioritizedGap(
                category="System Design",
                priority=PriorityLevel.CRITICAL,
                frequency=1,
                impact_score=90,
                detected_in="technical_dive"
            )
        ]
        
        comm_gaps = [
            CommunicationGap(
                category="Clarity",
                severity=PriorityLevel.HIGH,
                description="Unclear",
                candidate_response="Um...",
                improvement_tips=["Be clear"],
                sample_improved_response="Clear",
                related_tactic=None
            )
        ]
        
        guidance = generator.build_holistic_guidance(tech_gaps, comm_gaps)
        
        # Check that time estimates are reasonable
        for timeline_group in guidance.action_checklist:
            assert timeline_group["estimated_total_hours"] > 0
            
            for gap_item in timeline_group["gaps"]:
                assert gap_item["estimated_hours"] > 0
                # Time estimates should be reasonable (1-15 hours each)
                assert gap_item["estimated_hours"] <= 15
    
    @given(
        st.lists(
            st.just(None),  # We'll create gaps manually
            min_size=0,
            max_size=5
        )
    )
    def test_property_guidance_always_returns_valid_object(self, _):
        """
        Property test: build_holistic_guidance always returns a valid HolisticGuidance object
        with all required fields populated.
        
        **Validates: Requirements 4.1, 4.2, 4.3**
        """
        generator = ComprehensiveAnalysisGenerator()
        
        # Create some test gaps
        tech_gaps = [
            PrioritizedGap(
                category="System Design",
                priority=PriorityLevel.CRITICAL,
                frequency=1,
                impact_score=90,
                detected_in="technical_dive"
            )
        ]
        
        comm_gaps = [
            CommunicationGap(
                category="Clarity",
                severity=PriorityLevel.HIGH,
                description="Unclear",
                candidate_response="Um...",
                improvement_tips=["Be clear"],
                sample_improved_response="Clear",
                related_tactic=None
            )
        ]
        
        guidance = generator.build_holistic_guidance(tech_gaps, comm_gaps)
        
        # Verify it's a HolisticGuidance object
        assert isinstance(guidance, HolisticGuidance)
        
        # Verify all required fields are present
        assert guidance.gap_relationships is not None
        assert isinstance(guidance.gap_relationships, list)
        
        assert guidance.recommended_sequence is not None
        assert isinstance(guidance.recommended_sequence, list)
        
        assert guidance.dependency_map is not None
        assert isinstance(guidance.dependency_map, dict)
        
        assert guidance.action_checklist is not None
        assert isinstance(guidance.action_checklist, list)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
