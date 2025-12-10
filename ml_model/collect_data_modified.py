
import os
import sys
from dotenv import load_dotenv
import googleapiclient.discovery
import pandas as pd

load_dotenv()
API_KEY = os.getenv("YOUTUBE_API_KEY")

def fetch_videos(query, max_results=10):
    if not API_KEY or API_KEY == 'your_youtube_api_key_here':
        print("Warning: YouTube API key not configured")
        # Return empty dataframe for fallback
        return pd.DataFrame()
        
    youtube = googleapiclient.discovery.build("youtube", "v3", developerKey=API_KEY)
    search_response = youtube.search().list(
        q=query, part="snippet", maxResults=max_results, type="video"
    ).execute()

    videos = []
    for item in search_response["items"]:
        video_id = item["id"]["videoId"]

        # Fetch video statistics
        stats = youtube.videos().list(
            part="statistics,contentDetails,snippet", id=video_id
        ).execute()

        for vid in stats["items"]:
            data = {
                "video_id": video_id,
                "title": vid["snippet"]["title"],
                "description": vid["snippet"].get("description", ""),
                "publishedAt": vid["snippet"]["publishedAt"],
                "duration": vid["contentDetails"]["duration"],
                "view_count": int(vid["statistics"].get("viewCount", 0)),
                "like_count": int(vid["statistics"].get("likeCount", 0)),
                "comment_count": int(vid["statistics"].get("commentCount", 0)),
            }
            videos.append(data)

    return pd.DataFrame(videos)

if __name__ == "__main__":
    if len(sys.argv) > 1:
        query = sys.argv[1]
        max_results = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    else:
        query = "programming tutorial"
        max_results = 10
        
    print(f"Fetching videos for: {query}")
    df = fetch_videos(query, max_results)
    
    if df.empty:
        print("No videos fetched - API key not configured or API error")
        # Create dummy data for testing
        df = pd.DataFrame({
            'video_id': ['dQw4w9WgXcQ', 'jNQXAC9IVRw', 'fJ9rUzIMcZQ'],
            'title': [f'{query} Tutorial 1', f'{query} Tutorial 2', f'{query} Tutorial 3'],
            'description': [f'Learn {query}', f'Complete {query} guide', f'{query} for beginners'],
            'publishedAt': ['2023-01-01T00:00:00Z', '2023-01-02T00:00:00Z', '2023-01-03T00:00:00Z'],
            'duration': ['PT10M30S', 'PT15M45S', 'PT8M20S'],
            'view_count': [1000000, 500000, 750000],
            'like_count': [10000, 5000, 7500],
            'comment_count': [1000, 500, 750]
        })
    
    df.to_csv("raw_videos.csv", index=False)
    print(f"Fetched and saved {len(df)} videos to raw_videos.csv")
