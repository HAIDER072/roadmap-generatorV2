
import subprocess
import sys
import os
import pandas as pd

import time

def run_ml_pipeline(topic, max_videos=10):
    try:
        start_total = time.time()
        
        # Step 1: Collect data
        print(f"Collecting data for: {topic}", flush=True)
        start_t = time.time()
        subprocess.run([sys.executable, "collect_data_modified.py", topic, str(max_videos)], check=True)
        print(f"Step 1 Complete: {time.time() - start_t:.2f}s", flush=True)
        
        # Step 2: Create features
        print("Creating features...", flush=True)
        start_t = time.time()
        subprocess.run([sys.executable, "features.py"], check=True)
        print(f"Step 2 Complete: {time.time() - start_t:.2f}s", flush=True)
        
        # Step 3: Train and rank
        print("Training and ranking...", flush=True)
        start_t = time.time()
        subprocess.run([sys.executable, "train_and_rank.py"], check=True)
        print(f"Step 3 Complete: {time.time() - start_t:.2f}s", flush=True)
        
        print(f"Total Pipeline Time: {time.time() - start_total:.2f}s", flush=True)
        
        # Read the results
        if os.path.exists("features.csv"):
            df = pd.read_csv("features.csv")
            if "video_id" in df.columns:
                top_videos = df.nlargest(5, "target_score") if "target_score" in df.columns else df.head(5)
                print("Top 5 ranked video links:", flush=True)
                for i, (_, row) in enumerate(top_videos.iterrows()):
                    video_link = f"{i+1}. https://www.youtube.com/watch?v={row['video_id']}"
                    print(video_link, flush=True)
                    print(f"   - Title: {row.get('title', 'Unknown Title')}", flush=True)
                    # Try to get duration from numeric minutes or string
                    duration = row.get('duration_minutes', 0)
                    if isinstance(duration, (int, float)):
                         print(f"   - Duration: {duration:.1f} minutes", flush=True)
                    else:
                         print(f"   - Duration: {row.get('duration', '0')} minutes", flush=True)
                         
                    print(f"   - ML Score: {row.get('target_score', 0):.3f}", flush=True)
                return True
        
        print("No results generated", flush=True)
        return False
        
    except Exception as e:
        print(f"Pipeline failed: {str(e)}", flush=True)
        return False

if __name__ == "__main__":
    topic = sys.argv[1] if len(sys.argv) > 1 else "programming"
    max_videos = int(sys.argv[2]) if len(sys.argv) > 2 else 10
    run_ml_pipeline(topic, max_videos)
