"""
Example test demonstrating the build_resolution_paths method in action.
This shows what a resolution path looks like for a real gap.
"""

from app.services.comprehensive_analysis import ComprehensiveAnalysisGenerator
from app.models.analysis import ResolutionPath


def test_resolution_path_example():
    """
    Example demonstrating build_resolution_paths for System Design gap.
    """
    gaps = ["System Design"]
    
    # Build resolution paths
    paths = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
    
    assert len(paths) == 1
    path: ResolutionPath = paths[0]
    
    print("\n" + "="*80)
    print(f"RESOLUTION PATH FOR: {path.gap_category}")
    print("="*80)
    print(f"Estimated Total Time: {path.estimated_total_time}\n")
    
    for step in path.steps:
        print(f"\n{'─'*80}")
        print(f"STEP {step.step_number}: {step.title.upper()}")
        print(f"{'─'*80}")
        print(f"\nDescription:")
        print(f"  {step.description}\n")
        
        print(f"Time Estimate: {step.time_estimate}\n")
        
        print(f"Activities:")
        for i, activity in enumerate(step.activities, 1):
            print(f"  {i}. {activity}")
        
        print(f"\nResources ({len(step.resources)} available):")
        if step.resources:
            for resource in step.resources[:3]:  # Show first 3
                print(f"  • {resource.title}")
                if resource.author:
                    print(f"    by {resource.author}")
                print(f"    Type: {resource.type}")
        else:
            print(f"  (No resources configured for this step)")
    
    print("\n" + "="*80 + "\n")


def test_multiple_gaps_example():
    """
    Example showing resolution paths for multiple gaps.
    """
    gaps = ["Algorithms", "Code Quality", "Communication"]
    
    paths = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
    
    print("\n" + "="*80)
    print(f"RESOLUTION PATHS FOR {len(gaps)} GAPS")
    print("="*80)
    
    for path in paths:
        print(f"\n{path.gap_category}:")
        print(f"  Total Time: {path.estimated_total_time}")
        
        # Show step progression
        step_titles = " → ".join([step.title for step in path.steps])
        print(f"  Path: {step_titles}")
        
        # Show key activities
        print(f"  Key Activities:")
        for step in path.steps:
            if step.activities:
                print(f"    • {step.title}: {step.activities[0]}")
    
    print("\n" + "="*80 + "\n")


def test_tactical_strategies_integration():
    """
    Example showing how tactical strategies are integrated into resolution paths.
    """
    gaps = ["System Design"]
    paths = ComprehensiveAnalysisGenerator.build_resolution_paths(gaps)
    path = paths[0]
    
    print("\n" + "="*80)
    print(f"TACTICAL STRATEGIES INTEGRATION: {path.gap_category}")
    print("="*80)
    
    # Show how tactical strategies appear in descriptions
    for step in path.steps:
        print(f"\n{step.title} Step Description:")
        print(f"  {step.description[:150]}...")
        print(f"\n  Activities from TACTICAL_STRATEGIES:")
        for activity in step.activities[:2]:
            print(f"    • {activity}")
    
    print("\n" + "="*80 + "\n")


if __name__ == "__main__":
    # Run examples
    test_resolution_path_example()
    test_multiple_gaps_example()
    test_tactical_strategies_integration()
    print("✓ All examples completed successfully!")
