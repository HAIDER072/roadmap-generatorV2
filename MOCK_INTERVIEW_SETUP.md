# Mock Interview Feature Setup

## Overview
The AI Mock Interview feature provides users with a realistic interview practice experience using AI-powered voice interaction. Users can upload their resume, select a position, and practice answering interview questions with voice input/output.

## Features
✅ Resume upload (TXT, PDF, DOC formats)
✅ Position-specific interview questions (SDE1, SDE2, Data Analyst, etc.)
✅ Voice AI interaction (Speech-to-Text & Text-to-Speech)
✅ Real-time answer recording with voice input
✅ Detailed performance report with scoring
✅ PDF report download
✅ Token-based system (5 tokens per interview)

## API Keys Required

### Gemini AI (Google) - **FREE**
The Mock Interview feature uses **Google Gemini AI** which is already configured in your `.env` file:
```
GEMINI_API_KEY="AIzaSyBEob_NX8h3sLN64qG5lNyK_vkJ6A2AIGI"
```

**Gemini AI is FREE** with generous usage limits:
- 60 requests per minute
- 1,500 requests per day
- Perfect for Mock Interview feature

**Get your own API key (optional):**
1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy and replace in `.env` file

### No Additional Costs
✅ Gemini AI is FREE
✅ Web Speech API (voice recognition) is FREE (built into browsers)
✅ Speech Synthesis API (text-to-speech) is FREE (built into browsers)

## Token System
- **Cost per interview:** 5 tokens
- **Default free tokens:** 100 tokens (20 free interviews!)
- Users can purchase more tokens through the platform

## Technical Implementation

### Voice Recognition
Uses browser's native **Web Speech API** (Chrome/Edge):
- Real-time speech-to-text conversion
- No external API required
- Completely FREE

### Text-to-Speech
Uses browser's native **Speech Synthesis API**:
- AI reads questions aloud to user
- Natural voice synthesis
- No external API required
- Completely FREE

### AI Question Generation
Uses **Gemini AI** to:
- Parse resume content
- Generate position-specific questions (5 questions per interview)
- Evaluate candidate answers
- Create detailed performance reports

## How It Works

### 1. Setup Phase
```
User uploads resume → Selects position → Clicks "Start Interview"
                                              ↓
                        System deducts 5 tokens from user account
                                              ↓
                        Gemini AI analyzes resume and generates 5 questions
```

### 2. Interview Phase
```
AI speaks question aloud → User hears question
                                ↓
                    User clicks "Start Voice Input"
                                ↓
                    User speaks answer (voice-to-text)
                                ↓
                    User clicks "Next Question"
                                ↓
                    Repeat for all 5 questions
```

### 3. Report Phase
```
All answers submitted → Gemini AI evaluates responses
                                ↓
                    Generates comprehensive report:
                    - Overall Score (0-100)
                    - Strengths (3 points)
                    - Areas for Improvement (3 points)
                    - Question-by-question feedback
                    - Final recommendation
                                ↓
                    User can download PDF report
```

## Browser Compatibility

### Voice Features
- ✅ **Chrome/Edge:** Full support for voice recognition
- ⚠️ **Firefox:** Limited voice recognition support
- ⚠️ **Safari:** Limited voice recognition support
- ✅ **All browsers:** Text-to-speech support

**Recommendation:** Use Chrome or Edge for best voice experience

## Server Endpoints

### Start Interview
```
POST /api/mock-interview/start
Body: {
  userId: string,
  resumeText: string,
  position: string
}
Response: {
  success: true,
  questions: string[],
  tokensUsed: 5,
  tokensRemaining: number
}
```

### Generate Report
```
POST /api/mock-interview/report
Body: {
  userId: string,
  questions: Question[],
  position: string,
  resumeText: string
}
Response: {
  success: true,
  report: {
    overallScore: number,
    strengths: string[],
    improvements: string[],
    detailedFeedback: Question[],
    recommendation: string
  }
}
```

## Testing

### Sample Resume (for testing)
Create a file `test-resume.txt` with:
```
John Doe
Software Engineer

EXPERIENCE:
- 3 years as Full Stack Developer at Tech Corp
- Built React applications with Node.js backend
- Expertise in JavaScript, TypeScript, Python
- Led team of 5 developers

EDUCATION:
- BS in Computer Science, State University, 2020

SKILLS:
- Frontend: React, Vue.js, HTML/CSS
- Backend: Node.js, Express, MongoDB
- DevOps: Docker, AWS, CI/CD
```

### Test Flow
1. Start the server: `npm start`
2. Navigate to `/mock-interview`
3. Upload test resume
4. Select "SDE1" position
5. Click "Start Mock Interview"
6. Use voice or type answers
7. Review generated report

## Cost Summary
| Component | Cost | Notes |
|-----------|------|-------|
| Gemini AI | **FREE** | 1,500 requests/day |
| Voice Recognition | **FREE** | Built into browser |
| Text-to-Speech | **FREE** | Built into browser |
| **Total Cost** | **$0.00** | Completely FREE! |

## Environment Variables
Required in `.env`:
```bash
# Already configured - FREE Gemini AI
GEMINI_API_KEY="AIzaSyBEob_NX8h3sLN64qG5lNyK_vkJ6A2AIGI"

# Token configuration
TOKENS_PER_INTERVIEW=5
DEFAULT_FREE_TOKENS=100
```

## Support & Troubleshooting

### Voice Recognition Not Working
- Ensure you're using Chrome or Edge browser
- Check microphone permissions in browser settings
- Try refreshing the page

### AI Responses Slow
- Gemini AI typically responds in 1-3 seconds
- Check internet connection
- Verify API key is valid

### Insufficient Tokens
- Users start with 100 free tokens (20 interviews)
- Users can purchase more tokens via the platform
- Check token balance in dashboard

## Future Enhancements
- [ ] Support for PDF/DOC resume parsing
- [ ] Multiple interview rounds
- [ ] Industry-specific questions
- [ ] Video recording option
- [ ] Mock interview scheduling
- [ ] Practice with different difficulty levels

---

**Note:** This implementation uses only FREE services with no recurring costs! 🎉
