# ML Video Recommendation Setup Guide

This project now includes an ML-powered video recommendation system that suggests relevant YouTube videos based on your roadmap topics.

## Features

- **Automatic Integration**: Video recommendations are automatically generated when you create a roadmap
- **ML-Powered**: Uses machine learning to rank videos by predicted Average View Duration and satisfaction metrics
- **Fallback System**: Includes curated recommendations if ML pipeline fails
- **Smart Topic Extraction**: Automatically extracts the main learning topic from your roadmap prompt

## Setup Instructions

### 1. Python Dependencies

Install the required Python packages:

```bash
cd ml_model
pip install -r requirements.txt
```

### 2. YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **YouTube Data API v3**
4. Create credentials (API Key)
5. Add the API key to your `.env` file:

```env
YOUTUBE_API_KEY=your_actual_youtube_api_key_here
```

### 3. Python Installation

Make sure you have Python 3.8+ installed:
- Download from [python.org](https://python.org)
- Or use `python --version` to check your current version

## How It Works

### 1. Topic Extraction
When you generate a roadmap with a prompt like "create roadmap for web development", the system extracts "web development" as the main topic.

### 2. ML Pipeline
The system runs a 3-step ML pipeline:
1. **Data Collection**: Fetches YouTube videos related to the topic
2. **Feature Engineering**: Analyzes video metrics, sentiment, and engagement
3. **Ranking**: Uses Random Forest to predict and rank videos by learning value

### 3. Integration
- Videos are automatically included in roadmap generation response
- Video sidebar appears in the roadmap viewer with a play button
- Click the play button in the header to view recommended videos

## Fallback System

If the ML pipeline fails (e.g., no YouTube API key, Python issues), the system automatically falls back to:
- Curated video recommendations for popular topics
- Manual topic-based video suggestions
- No interruption to the main roadmap generation

## Video Sidebar Features

- **Embedded Player**: Watch videos directly in the sidebar
- **AI Recommendations**: Videos marked with ML recommendations
- **Smart Topics**: Automatically detected learning subjects
- **External Links**: Direct YouTube links for full experience

## Troubleshooting

### Python Issues
```bash
# Check Python installation
python --version

# Install pip if missing
python -m ensurepip --upgrade

# Install dependencies
cd ml_model
pip install -r requirements.txt
```

### API Key Issues
- Ensure YouTube Data API v3 is enabled in Google Cloud Console
- Check API key has no restrictions that block server requests
- Verify the key is correctly added to `.env` file

### ML Pipeline Logs
Check server console for ML pipeline status:
- `🔍 Starting ML pipeline for topic: [topic]`
- `✅ Generated X video recommendations`
- `⚠️ ML pipeline failed, using fallback recommendations`

## Development

### Testing ML Pipeline
You can test the ML pipeline directly:

```bash
cd ml_model
python pipeline_runner.py "web development" 10
```

### Adding New Topics
Add new fallback videos in `server/mlService.js`:

```javascript
const fallbackVideos = {
  'your_topic': [
    { title: 'Video Title', url: 'https://youtube.com/...', ... }
  ]
};
```

## Architecture

```
User Input → Topic Extraction → ML Pipeline → Video Recommendations → Frontend Sidebar
    ↓              ↓                ↓               ↓                    ↓
"web dev"    "web development"   Python ML    [video1, video2...]   Video Player
```

The ML integration is completely optional - the main roadmap generation works independently, with video recommendations as an enhanced feature.