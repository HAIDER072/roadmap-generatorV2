
import os
from dotenv import load_dotenv
import googleapiclient.discovery
import pandas as pd

load_dotenv()
API_KEY = os.getenv("YOUTUBE_API_KEY")

def fetch_videos(query, max_results=10):
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
    query = input("Enter search query for videos: ")
    try:
        max_results = int(input("How many videos to fetch? (max 50): "))
    except ValueError:
        max_results = 50
    df = fetch_videos(query, max_results)
    df.to_csv("raw_videos.csv", index=False)
    print(f"✅ Fetched and saved {len(df)} videos to raw_videos.csv")
