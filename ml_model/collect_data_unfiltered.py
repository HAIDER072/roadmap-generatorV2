import os
import sys
from dotenv import load_dotenv
import googleapiclient.discovery
import pandas as pd

# Fix Windows console encoding issues
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

load_dotenv()
API_KEY = os.getenv("YOUTUBE_API_KEY")

def fetch_videos_unfiltered(query, max_results=50):
    """
    Collect videos WITHOUT duration filtering for ML pipeline
    This is step 1: collect maximum data for ML analysis
    """
    if not API_KEY or API_KEY == 'your_youtube_api_key_here':
        print("⚠️ YouTube API key not configured")
        return pd.DataFrame()
    
    print(f"📊 Step 1: Collecting UNFILTERED videos for ML analysis")
    print(f"🎯 Query: '{query}' | Target: {max_results} videos (no duration filtering)")
        
    youtube = googleapiclient.discovery.build("youtube", "v3", developerKey=API_KEY)
    
    # Search for maximum videos without filtering - let ML decide quality
    search_response = youtube.search().list(
        q=f"{query} tutorial course",  # Basic educational keywords
        part="snippet", 
        maxResults=min(max_results, 50),  # YouTube API limit is 50
        type="video",
        order="relevance"  # Get most relevant first
    ).execute()

    videos = []
    
    print(f"📥 Processing {len(search_response['items'])} videos from YouTube...")
    
    for i, item in enumerate(search_response["items"], 1):
        video_id = item["id"]["videoId"]

        # Fetch detailed video information
        try:
            stats = youtube.videos().list(
                part="statistics,contentDetails,snippet", id=video_id
            ).execute()

            for vid in stats["items"]:
                video_data = {
                    "video_id": video_id,
                    "title": vid["snippet"]["title"],
                    "description": vid["snippet"].get("description", ""),
                    "publishedAt": vid["snippet"]["publishedAt"],
                    "duration": vid["contentDetails"]["duration"],
                    "view_count": int(vid["statistics"].get("viewCount", 0)),
                    "like_count": int(vid["statistics"].get("likeCount", 0)),
                    "comment_count": int(vid["statistics"].get("commentCount", 0)),
                }
                videos.append(video_data)
                
                # Show progress
                duration_min = parse_duration_simple(video_data["duration"]) / 60
                print(f"📹 {i:2d}: '{video_data['title'][:45]}...' ({duration_min:.1f}min, {video_data['view_count']:,} views)")
        
        except Exception as e:
            print(f"⚠️ Error fetching video {i}: {str(e)}")
            continue
    
    print(f"✅ Collected {len(videos)} videos for ML analysis")
    return pd.DataFrame(videos)

def parse_duration_simple(duration_str):
    """Simple duration parser for display purposes"""
    if not duration_str or duration_str == 'PT0S':
        return 0
    
    import re
    duration_str = duration_str.replace('PT', '')
    
    hours = 0
    minutes = 0
    seconds = 0
    
    hour_match = re.search(r'(\d+)H', duration_str)
    if hour_match:
        hours = int(hour_match.group(1))
    
    minute_match = re.search(r'(\d+)M', duration_str)
    if minute_match:
        minutes = int(minute_match.group(1))
    
    second_match = re.search(r'(\d+)S', duration_str)
    if second_match:
        seconds = int(second_match.group(1))
    
    return hours * 3600 + minutes * 60 + seconds

if __name__ == "__main__":
    if len(sys.argv) > 1:
        query = sys.argv[1]
        max_results = int(sys.argv[2]) if len(sys.argv) > 2 else 50
    else:
        query = "programming tutorial"
        max_results = 50
        
    print(f"🚀 ML Pipeline Step 1: Data Collection")
    print(f"━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
    print(f"📋 Query: {query}")
    print(f"📊 Target videos: {max_results}")
    print(f"🔄 Filtering: NONE (ML will analyze all videos)")
    print()
    
    df = fetch_videos_unfiltered(query, max_results)
    
    if df.empty:
        print("❌ No videos collected - API key issue")
        # Create sample data for testing
        df = pd.DataFrame({
            'video_id': ['dQw4w9WgXcQ', 'jNQXAC9IVRw', 'fJ9rUzIMcZQ', 'ScMzIvxBSi4', 'dQw4w9WgXcQ'],
            'title': [
                f'{query} Complete Course - Full Tutorial', 
                f'{query} Quick Tips and Tricks', 
                f'{query} Masterclass - Advanced Guide',
                f'{query} Bootcamp - Learn in 30 minutes',
                f'{query} Full Stack Development Course'
            ],
            'description': [
                f'Complete {query} course with practical examples', 
                f'Quick {query} tips for developers', 
                f'{query} masterclass with real projects',
                f'Fast-paced {query} bootcamp',
                f'Full stack {query} development course'
            ],
            'publishedAt': ['2023-01-01T00:00:00Z', '2023-01-02T00:00:00Z', '2023-01-03T00:00:00Z', '2023-01-04T00:00:00Z', '2023-01-05T00:00:00Z'],
            'duration': ['PT2H30M15S', 'PT15M30S', 'PT3H45M20S', 'PT30M45S', 'PT4H15M10S'],  # Mix of durations
            'view_count': [1500000, 250000, 850000, 500000, 1200000],
            'like_count': [25000, 5000, 18000, 8000, 22000],
            'comment_count': [3500, 800, 2200, 1200, 2800]
        })
        print(f"📝 Created sample dataset with {len(df)} videos (mixed durations)")
    
    df.to_csv("raw_videos.csv", index=False)
    print()
    print(f"💾 Saved {len(df)} videos to raw_videos.csv")
    print(f"➡️ Next: Run features.py to analyze videos and extract features")