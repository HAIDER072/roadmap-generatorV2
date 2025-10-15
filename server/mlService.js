import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';
import dotenv from 'dotenv';

dotenv.config();

const ML_MODEL_DIR = path.join(process.cwd(), 'ml_model');
const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;

// Function to extract main topic from roadmap input
export function extractMainTopic(userInput) {
  // Remove common prefixes and suffixes
  const cleaned = userInput
    .toLowerCase()
    .replace(/^(create|generate|make|build)\s+(a\s+)?(roadmap\s+)?for\s+/i, '')
    .replace(/\s+(roadmap|plan|guide|tutorial)$/i, '')
    .trim();
  
  // Handle specific cases
  const topicMappings = {
    'web development': 'web development',
    'web dev': 'web development', 
    'frontend development': 'frontend development',
    'backend development': 'backend development',
    'full stack development': 'full stack development',
    'machine learning': 'machine learning',
    'data science': 'data science',
    'artificial intelligence': 'artificial intelligence',
    'mobile development': 'mobile app development',
    'android development': 'android development',
    'ios development': 'ios development',
    'react': 'react development',
    'nodejs': 'node.js development',
    'python': 'python programming',
    'javascript': 'javascript programming',
    'devops': 'devops engineering'
  };

  // Check if the cleaned input matches any mapping
  for (const [key, value] of Object.entries(topicMappings)) {
    if (cleaned.includes(key)) {
      return value;
    }
  }

  return cleaned || 'programming';
}

// Function to run Python script and capture output
function runPythonScript(scriptPath, args = []) {
  return new Promise((resolve, reject) => {
    const pythonProcess = spawn('python', [scriptPath, ...args], {
      cwd: ML_MODEL_DIR,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    let output = '';
    let errorOutput = '';

    // Add timeout to prevent hanging
    const timeout = setTimeout(() => {
      pythonProcess.kill();
      reject(new Error('Python script timeout after 60 seconds'));
    }, 60000);

    pythonProcess.stdout.on('data', (data) => {
      output += data.toString();
      console.log('Python stdout:', data.toString().trim());
    });

    pythonProcess.stderr.on('data', (data) => {
      errorOutput += data.toString();
      console.log('Python stderr:', data.toString().trim());
    });

    pythonProcess.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve(output);
      } else {
        reject(new Error(`Python script failed with code ${code}: ${errorOutput}`));
      }
    });

    pythonProcess.on('error', (err) => {
      clearTimeout(timeout);
      reject(new Error(`Failed to start Python process: ${err.message}`));
    });
  });
}

// Simplified direct video fetch (faster alternative to full ML pipeline)
export async function getVideoRecommendationsSimple(topic, maxVideos = 5, minDurationMinutes = 120) {
  try {
    console.log(`🎥 Fetching FILTERED videos for topic: ${topic}`);
    console.log(`📏 Filter: Min duration ${minDurationMinutes}min, Max results ${maxVideos}`);
    
    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'your_youtube_api_key_here') {
      console.log('⚠️ YouTube API key not configured, using fallback recommendations');
      return getFallbackRecommendations(topic);
    }

    // Use the full ML pipeline for consistent results
    console.log('📄 Running FULL ML pipeline for consistent filtering...');
    
    // Step 1: Collect unfiltered data
    await runPythonScript('collect_data_for_ml.py', [topic, (maxVideos * 10).toString()]);
    
    // Step 2: Features with sentiment
    await runPythonScript('features.py');
    
    // Step 3: Train, filter 2+ hours, rank by sentiment
    const output = await runPythonScript('train_and_rank.py');
    console.log('📄 ML pipeline completed successfully');
    
    // Read and parse the generated CSV file
    const csvPath = path.join(ML_MODEL_DIR, 'raw_videos.csv');
    const csvExists = await fs.access(csvPath).then(() => true).catch(() => false);
    
    if (csvExists) {
      try {
        // Read the CSV file content and parse it properly
        const csvContent = await fs.readFile(csvPath, 'utf-8');
        
        // Simple CSV parser that handles quoted fields
        const parseCSVLine = (line) => {
          const result = [];
          let current = '';
          let inQuotes = false;
          
          for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
              inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
              result.push(current.trim());
              current = '';
            } else {
              current += char;
            }
          }
          result.push(current.trim());
          return result;
        };
        
        const lines = csvContent.split('\n').filter(line => line.trim());
        
        if (lines.length > 1) { // Has header + data
          const headers = parseCSVLine(lines[0]);
          const videoRecommendations = [];
          
          // Parse each data row
          for (let i = 1; i < lines.length && videoRecommendations.length < maxVideos; i++) {
            const values = parseCSVLine(lines[i]);
            const video = {};
            
            headers.forEach((header, index) => {
              video[header] = values[index] || '';
            });
            
            if (video.video_id && video.title) {
              videoRecommendations.push({
                title: video.title,
                url: `https://www.youtube.com/watch?v=${video.video_id}`,
                videoId: video.video_id,
                thumbnail: `https://img.youtube.com/vi/${video.video_id}/mqdefault.jpg`,
                source: 'ml_youtube_api',
                description: video.description ? video.description.substring(0, 200) : '',
                viewCount: parseInt(video.view_count) || 0,
                duration: video.duration || ''
              });
            }
          }
          
          if (videoRecommendations.length > 0) {
            console.log(`✅ Successfully parsed ${videoRecommendations.length} real YouTube videos for: ${topic}`);
            return videoRecommendations;
          }
        }
      } catch (parseError) {
        console.error('⚠️ Failed to parse CSV file:', parseError.message);
      }
    }
    
    console.log('⚠️ No valid videos found, using fallback recommendations');
    return getFallbackRecommendations(topic);
  } catch (error) {
    console.error('❌ Simple video fetch failed:', error.message);
    return getFallbackRecommendations(topic);
  }
}

// Main ML pipeline function with consistent filtering
export async function getVideoRecommendations(topic, maxVideos = 10, minDurationMinutes = 120) {
  try {
    console.log(`🔍 Starting FULL ML pipeline for topic: ${topic}`);
    console.log(`📏 Filtering: Min ${minDurationMinutes}min duration, Max ${maxVideos} results`);
    
    // Check if YouTube API key is configured
    if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY === 'your_youtube_api_key_here') {
      console.log('⚠️ YouTube API key not configured, using fallback recommendations');
      return getFallbackRecommendations(topic);
    }

    // Step 1: Collect UNFILTERED data (50+ videos for ML analysis)
    console.log('Step 1: Collecting UNFILTERED video data for ML analysis...');
    const collectDataScript = 'collect_data_for_ml.py';
    const fetchCount = Math.max(maxVideos * 10, 50); // Collect many videos for ML analysis
    await runPythonScript(collectDataScript, [topic, fetchCount.toString()]);
    console.log(`Collected ${fetchCount} unfiltered videos for ML analysis`);

    // Step 2: Generate features with comment sentiment analysis
    console.log('🔧 Step 2: Engineering features with comment sentiment analysis...');
    const featuresScript = 'features.py';
    await runPythonScript(featuresScript);

    // Step 3: Train model, filter 2+ hour videos, and rank by sentiment
    console.log('🤖 Step 3: Training ML model, filtering 2+ hour videos, ranking by comment sentiment...');
    const trainRankScript = 'train_and_rank.py';
    const output = await runPythonScript(trainRankScript);

    // Parse the output to extract video links
    const videoLinks = parseVideoLinksFromOutput(output);
    
    if (videoLinks.length > 0) {
      console.log(`✅ ML pipeline completed. Found ${videoLinks.length} ML-ranked videos`);
      return videoLinks;
    } else {
      console.log('⚠️ ML pipeline returned no videos, trying filtered fallback');
      return getVideoRecommendationsSimple(topic, 5, minDurationMinutes);
    }

  } catch (error) {
    console.error('❌ ML pipeline failed:', error.message);
    console.log('🔄 Falling back to simplified filtered version...');
    return getVideoRecommendationsSimple(topic, 5, minDurationMinutes);
  }
}

// Function to parse video links from ML model output
function parseVideoLinksFromOutput(output) {
  const lines = output.split('\n');
  const videoLinks = [];
  
  let inVideoSection = false;
  let currentVideoIndex = 0;
  
  for (const line of lines) {
    if (line.includes('Top 5 ranked video links:')) {
      inVideoSection = true;
      continue;
    }
    
    if (inVideoSection && line.trim()) {
      // Match numbered video links: "1. https://www.youtube.com/watch?v=..."
      const numberedLinkMatch = line.match(/^(\d+)\. (https:\/\/www\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11}))/);
      
      if (numberedLinkMatch) {
        const videoId = numberedLinkMatch[3];
        const url = numberedLinkMatch[2];
        currentVideoIndex = parseInt(numberedLinkMatch[1]);
        
        videoLinks.push({
          title: `Loading title for ${videoId}...`, // Temporary title, will be updated
          url: url,
          videoId: videoId,
          thumbnail: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
          source: 'ml_recommendation',
          index: currentVideoIndex
        });
      }
      
      // Match title lines: "   - Title: React JS - React Tutorial for Beginners..."
      const titleMatch = line.match(/^\s*-\s*Title:\s*(.+?)(?:\.\.\.)?$/);
      if (titleMatch && videoLinks.length > 0) {
        const lastVideo = videoLinks[videoLinks.length - 1];
        if (lastVideo && lastVideo.index === currentVideoIndex) {
          lastVideo.title = titleMatch[1].trim();
        }
      }
      
      // Match duration lines: "   - Duration: 145.4 minutes"
      const durationMatch = line.match(/^\s*-\s*Duration:\s*([\d.]+)\s*minutes/);
      if (durationMatch && videoLinks.length > 0) {
        const lastVideo = videoLinks[videoLinks.length - 1];
        if (lastVideo && lastVideo.index === currentVideoIndex) {
          lastVideo.duration = `PT${Math.floor(parseFloat(durationMatch[1]))}M`;
        }
      }
      
      // Match ML Score lines: "   - ML Score: 0.163"
      const scoreMatch = line.match(/^\s*-\s*ML Score:\s*([\d.]+)/);
      if (scoreMatch && videoLinks.length > 0) {
        const lastVideo = videoLinks[videoLinks.length - 1];
        if (lastVideo && lastVideo.index === currentVideoIndex) {
          lastVideo.mlScore = parseFloat(scoreMatch[1]);
        }
      }
    }
  }
  
  // Clean up temporary data
  videoLinks.forEach(video => {
    delete video.index;
    // If title wasn't found, use a fallback
    if (video.title.includes('Loading title for')) {
      video.title = `ML Recommended Tutorial - ${video.videoId}`;
    }
  });
  
  console.log(`Parsed ${videoLinks.length} videos with titles:`);
  videoLinks.forEach((video, i) => {
    console.log(`  ${i+1}. "${video.title}" (${video.videoId})`);
  });
  
  return videoLinks.slice(0, 5); // Return top 5 videos
}

// Fallback recommendations when ML pipeline fails
function getFallbackRecommendations(topic) {
  const fallbackVideos = {
    'web development': [
      { title: 'Complete Web Development Course', url: 'https://www.youtube.com/watch?v=nu_pCVPKzTk', videoId: 'nu_pCVPKzTk', thumbnail: 'https://img.youtube.com/vi/nu_pCVPKzTk/mqdefault.jpg' },
      { title: 'HTML CSS JavaScript Tutorial', url: 'https://www.youtube.com/watch?v=mJgBOIoGihA', videoId: 'mJgBOIoGihA', thumbnail: 'https://img.youtube.com/vi/mJgBOIoGihA/mqdefault.jpg' },
      { title: 'Frontend Development Roadmap', url: 'https://www.youtube.com/watch?v=0pThnRneDjw', videoId: '0pThnRneDjw', thumbnail: 'https://img.youtube.com/vi/0pThnRneDjw/mqdefault.jpg' }
    ],
    'machine learning': [
      { title: 'Machine Learning Course by Andrew Ng', url: 'https://www.youtube.com/watch?v=PPLop4L2eGk', videoId: 'PPLop4L2eGk', thumbnail: 'https://img.youtube.com/vi/PPLop4L2eGk/mqdefault.jpg' },
      { title: 'Python for Machine Learning', url: 'https://www.youtube.com/watch?v=7eh4d6sabA0', videoId: '7eh4d6sabA0', thumbnail: 'https://img.youtube.com/vi/7eh4d6sabA0/mqdefault.jpg' },
      { title: 'Deep Learning Fundamentals', url: 'https://www.youtube.com/watch?v=aircAruvnKk', videoId: 'aircAruvnKk', thumbnail: 'https://img.youtube.com/vi/aircAruvnKk/mqdefault.jpg' }
    ],
    'data science': [
      { title: 'Data Science Full Course', url: 'https://www.youtube.com/watch?v=ua-CiDNNj30', videoId: 'ua-CiDNNj30', thumbnail: 'https://img.youtube.com/vi/ua-CiDNNj30/mqdefault.jpg' },
      { title: 'Python for Data Analysis', url: 'https://www.youtube.com/watch?v=vmEHCJofslg', videoId: 'vmEHCJofslg', thumbnail: 'https://img.youtube.com/vi/vmEHCJofslg/mqdefault.jpg' }
    ],
    'react development': [
      { title: 'React Complete Course', url: 'https://www.youtube.com/watch?v=bMknfKXIFA8', videoId: 'bMknfKXIFA8', thumbnail: 'https://img.youtube.com/vi/bMknfKXIFA8/mqdefault.jpg' },
      { title: 'React Hooks Tutorial', url: 'https://www.youtube.com/watch?v=TNhaISOUy6Q', videoId: 'TNhaISOUy6Q', thumbnail: 'https://img.youtube.com/vi/TNhaISOUy6Q/mqdefault.jpg' }
    ]
  };

  // Find best match for the topic
  let bestMatch = 'web development';
  let maxScore = 0;
  
  for (const [key, videos] of Object.entries(fallbackVideos)) {
    const score = calculateTopicSimilarity(topic.toLowerCase(), key);
    if (score > maxScore) {
      maxScore = score;
      bestMatch = key;
    }
  }

  return fallbackVideos[bestMatch] || fallbackVideos['web development'];
}

// Calculate similarity between two topics (simple word matching)
function calculateTopicSimilarity(topic1, topic2) {
  const words1 = topic1.split(' ');
  const words2 = topic2.split(' ');
  
  let matches = 0;
  for (const word1 of words1) {
    for (const word2 of words2) {
      if (word1.includes(word2) || word2.includes(word1)) {
        matches++;
      }
    }
  }
  
  return matches / Math.max(words1.length, words2.length);
}

// Enhanced ML pipeline integration for better Python script execution
export async function createModifiedPythonScripts() {
  try {
    // Create a modified collect_data.py that accepts command line arguments
    const modifiedCollectData = `
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
`;

    await fs.writeFile(path.join(ML_MODEL_DIR, 'collect_data_modified.py'), modifiedCollectData);

    // Create a simple runner script that handles the full pipeline
    const pipelineRunner = `
import subprocess
import sys
import os
import pandas as pd

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
                for _, row in top_videos.iterrows():
                    video_link = f"https://www.youtube.com/watch?v={row['video_id']}"
                    print(video_link)
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
`;

    await fs.writeFile(path.join(ML_MODEL_DIR, 'pipeline_runner.py'), pipelineRunner);
    
    console.log('✅ Modified Python scripts created successfully');
    return true;
    
  } catch (error) {
    console.error('❌ Failed to create modified Python scripts:', error);
    return false;
  }
}