
import subprocess
import sys
import os
import pandas as pd

import time

def run_ml_pipeline(topic, max_videos=10):
    try:
        # Step 1: Collect data
        print(f"Collecting data for: {topic}")
        subprocess.run([sys.executable, "collect_data_modified.py", topic, str(max_videos)], check=True)
        
        # Step 2: Create features
        print("Creating features...")
        subprocess.run([sys.executable, "features.py"], check=True)
        
        # Step 3: Train and rank
        print("Training and ranking...")
        subprocess.run([sys.executable, "train_and_rank.py"], check=True)
        
        # Read the results
        if os.path.exists("features.csv"):
            df = pd.read_csv("features.csv")
            if "video_id" in df.columns:
                top_videos = df.nlargest(5, "target_score") if "target_score" in df.columns else df.head(5)
                print("Top 5 ranked video links:")
                for i, (_, row) in enumerate(top_videos.iterrows()):
                    video_link = f"{i+1}. https://www.youtube.com/watch?v={row['video_id']}"
                    print(video_link)
                    print(f"   - Title: {row.get('title', 'Unknown Title')}")
                    # Try to get duration from numeric minutes or string
                    duration = row.get('duration_minutes', 0)
                    if isinstance(duration, (int, float)):
                         print(f"   - Duration: {duration:.1f} minutes")
                    else:
                         print(f"   - Duration: {row.get('duration', '0')} minutes")
                         
                    print(f"   - ML Score: {row.get('target_score', 0):.3f}")
                return True
        
        print("No results generated")
        return False
        
    except Exception as e:
        print(f"Pipeline failed: {str(e)}")
        return False

if __name__ == "__main__":
    topic = sys.argv[1] if len(sys.argv) > 1 else "programming"
    max_videos = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    run_ml_pipeline(topic, max_videos)
