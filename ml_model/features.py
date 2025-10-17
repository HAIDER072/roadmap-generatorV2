import pandas as pd
from textblob import TextBlob
import re
from datetime import datetime
import isodate
import sys
import os
from dotenv import load_dotenv
import googleapiclient.discovery
import numpy as np

# Fix Windows console encoding issues
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

load_dotenv()
API_KEY = os.getenv("YOUTUBE_API_KEY")

def clean_text(text):
    if not isinstance(text, str):
        text = ""
    return re.sub(r'\W+', ' ', text.lower())

def get_sentiment(text):
    if not text or pd.isna(text):
        return 0
    return TextBlob(text).sentiment.polarity  # between -1 and +1

def iso_to_seconds(duration):
    try:
        return isodate.parse_duration(duration).total_seconds()
    except:
        return 0

def get_comment_sentiment(video_id, max_comments=20):
    """
    Fetch and analyze comment sentiment for a video
    Returns average sentiment score from comments
    """
    if not API_KEY or API_KEY == 'your_youtube_api_key_here':
        print(f"WARNING: No API key - using default sentiment for {video_id[:8]}...")
        return 0.1  # Neutral-positive default
    
    try:
        youtube = googleapiclient.discovery.build("youtube", "v3", developerKey=API_KEY)
        
        # Fetch comments
        comments_response = youtube.commentThreads().list(
            part="snippet",
            videoId=video_id,
            maxResults=max_comments,
            order="relevance"  # Get most relevant comments
        ).execute()
        
        sentiments = []
        comment_texts = []
        
        for comment in comments_response.get('items', []):
            comment_text = comment['snippet']['topLevelComment']['snippet']['textDisplay']
            if len(comment_text.strip()) > 10:  # Only meaningful comments
                sentiment = get_sentiment(comment_text)
                sentiments.append(sentiment)
                comment_texts.append(comment_text[:50])
        
        if sentiments:
            avg_sentiment = np.mean(sentiments)
            print(f"Comments {video_id[:8]}: {len(sentiments)} comments, avg sentiment: {avg_sentiment:.3f}")
            return avg_sentiment
        else:
            print(f"Comments {video_id[:8]}: No meaningful comments found")
            return 0.0
            
    except Exception as e:
        print(f"WARNING: Comment analysis failed for {video_id[:8]}: {str(e)[:50]}")
        return 0.0  # Neutral default

def create_features(df):
    print(f"STEP 2: Feature Engineering with Comment Sentiment Analysis")
    print(f"=" * 55)
    print(f"Analyzing {len(df)} videos...")
    print()
    
    # Basic features
    df["like_ratio"] = df["like_count"] / (df["view_count"] + 1)
    df["comment_ratio"] = df["comment_count"] / (df["view_count"] + 1)
    df["title_len"] = df["title"].apply(lambda x: len(clean_text(x)))
    df["desc_len"] = df["description"].apply(lambda x: len(clean_text(x)))
    df["desc_sentiment"] = df["description"].apply(get_sentiment)
    df["duration_sec"] = df["duration"].apply(iso_to_seconds)
    
    df["age_days"] = df["publishedAt"].apply(
        lambda x: (datetime.now() - datetime.fromisoformat(x.replace("Z", ""))).days
    )
    
    # NEW: Comment sentiment analysis (the key ranking factor you wanted)
    print("Analyzing comment sentiment for ranking...")
    df["comment_sentiment"] = df["video_id"].apply(
        lambda video_id: get_comment_sentiment(video_id, max_comments=15)
    )
    
    # Enhanced satisfaction score with comment sentiment as major factor
    print("\nCalculating quality scores...")
    df["target_score"] = (
        0.3 * df["like_ratio"] +           # 30% - like engagement
        0.2 * df["comment_ratio"] +       # 20% - comment engagement  
        0.4 * df["comment_sentiment"] +   # 40% - comment sentiment (main ranking factor)
        0.1 * df["desc_sentiment"]        # 10% - description sentiment
    )
    
    # Show duration distribution before filtering
    duration_minutes = df["duration_sec"] / 60
    long_videos = sum(duration_minutes >= 120)
    print(f"\nDuration Analysis:")
    print(f"   - Videos >= 2 hours: {long_videos}/{len(df)}")
    print(f"   - Average duration: {duration_minutes.mean():.1f} minutes")
    print(f"   - Longest video: {duration_minutes.max():.1f} minutes")
    
    feature_cols = [
        "view_count", "like_count", "comment_count",
        "like_ratio", "comment_ratio", 
        "title_len", "desc_len", 
        "desc_sentiment", "comment_sentiment",  # Both sentiment types
        "duration_sec", "age_days"
    ]
    
    result_df = df[feature_cols + ["target_score", "video_id", "title", "duration"]]
    
    print(f"\nFeature engineering complete")
    print(f"Top video by ML score: '{result_df.loc[result_df['target_score'].idxmax(), 'title'][:60]}...'")
    
    return result_df

if __name__ == "__main__":
    print("ML Pipeline Step 2: Feature Engineering")
    print("=" * 60)
    
    df = pd.read_csv("raw_videos.csv")
    print(f"Loaded {len(df)} videos from raw_videos.csv")
    
    final_df = create_features(df)
    final_df.to_csv("features.csv", index=False)
    
    print(f"\nSaved features for {len(final_df)} videos to features.csv")
    print(f"Next: Run train_and_rank.py for ML training and 2+ hour filtering")
