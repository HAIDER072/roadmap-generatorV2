import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
import joblib
import sys
import re

# Fix Windows console encoding issues
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

def parse_duration_to_minutes(duration_str):
    """Parse YouTube duration to minutes for display"""
    if not duration_str or duration_str == 'PT0S':
        return 0
    
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
    
    total_minutes = hours * 60 + minutes + seconds / 60
    return total_minutes

print("ML Pipeline Step 3: Training & Ranking")
print("=" * 60)

# Load dataset
df = pd.read_csv("features.csv")
print(f"Loaded {len(df)} videos with features")

if len(df) == 0:
    print("❌ No data available for training")
    exit(1)

# Prepare features (exclude metadata columns)
feature_columns = [col for col in df.columns if col not in ["target_score", "video_id", "title", "duration"]]
X = df[feature_columns]
y = df["target_score"]

print(f"Training features: {len(feature_columns)} features")
print(f"Target: ML quality scores based on engagement + comment sentiment")

# Handle small datasets by adjusting test size
if len(df) < 5:
    test_size = 0.0  # Use all data for training if dataset is very small
else:
    test_size = 0.2

if test_size > 0:
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=test_size, random_state=42)
else:
    X_train, X_test, y_train, y_test = X, X, y, y

# Train model
model = RandomForestRegressor(n_estimators=300, random_state=42)
model.fit(X_train, y_train)

print("✅ Model trained successfully!")

# Save model
joblib.dump(model, "model.pkl")
print("💾 Saved model as model.pkl")

# Function to rank new videos
def rank_new_videos(new_videos_features_csv):
    print("\nStep 4: Filtering & Ranking Videos")
    print("=" * 50)
    
    model = joblib.load("model.pkl")
    df_new = pd.read_csv(new_videos_features_csv)
    
    if len(df_new) == 0:
        print("ERROR: No videos to rank")
        return pd.DataFrame(columns=["title", "video_link", "predicted_score"])
    
    print(f"Starting with {len(df_new)} videos")
    
    # Add duration in minutes for better display
    if "duration" in df_new.columns:
        df_new["duration_min"] = df_new["duration"].apply(parse_duration_to_minutes)
    
    # Filter videos longer than 2 hours (120 minutes) - YOUR REQUIREMENT
    if "duration_sec" in df_new.columns:
        original_count = len(df_new)
        df_new = df_new[df_new["duration_sec"] >= 7200]  # 2 hours = 7200 seconds
        filtered_count = len(df_new)
        
        print(f"Duration filtering: {original_count} -> {filtered_count} videos (>=2 hours)")
        
        if filtered_count > 0:
            avg_duration = df_new["duration_min"].mean() if "duration_min" in df_new.columns else "N/A"
            print(f"Average duration of filtered videos: {avg_duration:.1f} minutes")
    
    # Handle case where all videos are filtered out
    if len(df_new) == 0:
        print("WARNING: No videos >=2 hours found - using top 3 longest videos as fallback")
        df_new = pd.read_csv(new_videos_features_csv)
        if "duration_sec" in df_new.columns:
            df_new = df_new.nlargest(3, "duration_sec")
    
    # Prepare features for ML prediction
    feature_columns = [col for col in df_new.columns if col not in ["video_id", "title", "target_score", "duration", "duration_min"]]
    X_features = df_new[feature_columns]
    
    if len(X_features) == 0:
        print("ERROR: No feature data available")
        return df_new[["title", "video_id"]].rename(columns={"video_id": "video_link"})
    
    # ML prediction
    preds = model.predict(X_features)
    df_new["predicted_score"] = preds
    df_new["video_link"] = df_new["video_id"].apply(lambda vid: f"https://www.youtube.com/watch?v={vid}")
    
    # Rank by ML score (which includes comment sentiment analysis)
    ranked = df_new.sort_values("predicted_score", ascending=False)
    
    print(f"\nFinal ranking by ML score (includes comment sentiment):")
    for i, (_, video) in enumerate(ranked.head(5).iterrows(), 1):
        duration = video.get("duration_min", "N/A")
        score = video["predicted_score"]
        title = video["title"][:50]
        print(f"#{i}: {title}... ({duration:.1f}min, score: {score:.3f})")
    
    return ranked[["title", "video_link", "predicted_score", "duration_min"] if "duration_min" in ranked.columns else ["title", "video_link", "predicted_score"]]

if __name__ == "__main__":
    # Run the complete ranking pipeline
    ranked = rank_new_videos("features.csv")
    
    print("\nFinal Results:")
    print("=" * 40)
    
    if len(ranked) > 0:
        print("Top 5 ranked video links:")
        for i, (_, row) in enumerate(ranked.head(5).iterrows(), 1):
            print(f"{i}. {row['video_link']}")
            if 'duration_min' in row:
                print(f"   - Title: {row['title'][:60]}...")
                print(f"   - Duration: {row['duration_min']:.1f} minutes")
                print(f"   - ML Score: {row['predicted_score']:.3f}")
            print()
    else:
        print("ERROR: No videos found after filtering")
        
    print("ML Pipeline Complete!")
    print("Videos ranked by: Comment sentiment (40%) + Engagement (50%) + Content quality (10%)")
