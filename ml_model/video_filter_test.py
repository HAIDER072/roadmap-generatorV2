#!/usr/bin/env python3

"""
Video Filter Test Utility
Test the duration filtering functionality for YouTube videos.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from collect_data_modified import parse_duration, is_valid_tutorial_video

def test_duration_parsing():
    """Test duration parsing function with various YouTube duration formats."""
    print("🧪 Testing Duration Parsing Function")
    print("=" * 50)
    
    test_cases = [
        ("PT45S", 45, "YouTube Short (45 seconds)"),
        ("PT1M30S", 90, "Short video (1.5 minutes)"),
        ("PT10M20S", 620, "Medium video (10m 20s)"),
        ("PT1H5M30S", 3930, "Long video (1h 5m 30s)"),
        ("PT2H30M15S", 9015, "Tutorial video (2h 30m 15s)"),
        ("PT3H45M", 13500, "Long tutorial (3h 45m)"),
        ("PT5H12M43S", 18763, "Very long course (5h 12m 43s)"),
        ("PT0S", 0, "Zero duration"),
        ("", 0, "Empty duration"),
    ]
    
    for duration_str, expected_seconds, description in test_cases:
        result = parse_duration(duration_str)
        status = "✅" if result == expected_seconds else "❌"
        minutes = result / 60
        print(f"{status} {duration_str:12} -> {result:5}s ({minutes:6.1f}min) | {description}")
    
    print()

def test_video_filtering():
    """Test video filtering function with realistic video data."""
    print("🔍 Testing Video Filtering Function")
    print("=" * 50)
    
    test_videos = [
        {
            "title": "Python Programming in 30 seconds #shorts",
            "duration": "PT30S",
            "view_count": 50000,
            "description": "Quick Python tip"
        },
        {
            "title": "JavaScript Quick Tip",
            "duration": "PT2M15S", 
            "view_count": 25000,
            "description": "Brief JS tutorial"
        },
        {
            "title": "Complete Python Course - Learn Python in 12 Hours",
            "duration": "PT12H15M30S",
            "view_count": 2500000,
            "description": "Full Python course for beginners"
        },
        {
            "title": "React Tutorial - Full Course for Beginners",
            "duration": "PT2H45M20S",
            "view_count": 1500000,
            "description": "Complete React tutorial course"
        },
        {
            "title": "Web Development Bootcamp 2024",
            "duration": "PT3H30M45S",
            "view_count": 850000,
            "description": "Full stack web development course"
        },
        {
            "title": "Low view tutorial",
            "duration": "PT2H30M",
            "view_count": 500,
            "description": "Tutorial with low engagement"
        }
    ]
    
    for i, video in enumerate(test_videos, 1):
        is_valid, reason = is_valid_tutorial_video(video, min_duration_minutes=120)
        status = "✅ PASS" if is_valid else "❌ FILTER"
        duration_minutes = parse_duration(video['duration']) / 60
        
        print(f"{status} Video {i}: '{video['title'][:45]}...'")
        print(f"     Duration: {video['duration']} ({duration_minutes:.1f} min)")
        print(f"     Views: {video['view_count']:,}")
        print(f"     Result: {reason}")
        print()

def test_filtering_thresholds():
    """Test filtering with different duration thresholds."""
    print("⚙️ Testing Different Duration Thresholds")
    print("=" * 50)
    
    sample_video = {
        "title": "Sample Tutorial Video",
        "duration": "PT1H30M",  # 90 minutes
        "view_count": 100000,
        "description": "Sample tutorial"
    }
    
    thresholds = [30, 60, 90, 120, 180]  # minutes
    
    for threshold in thresholds:
        is_valid, reason = is_valid_tutorial_video(sample_video, min_duration_minutes=threshold)
        status = "✅ PASS" if is_valid else "❌ FILTER"
        print(f"{status} Threshold {threshold:3}min: {reason}")
    
    print()

if __name__ == "__main__":
    print("🎬 Video Filtering Test Suite")
    print("=" * 70)
    print()
    
    test_duration_parsing()
    test_video_filtering() 
    test_filtering_thresholds()
    
    print("🏁 Test completed!")
    print()
    print("💡 Summary:")
    print("   - Videos < 60 seconds are filtered as YouTube Shorts")
    print("   - Default minimum duration is 120 minutes (2 hours)")
    print("   - Videos need at least 1,000 views for quality")
    print("   - Educational keywords boost video scores")