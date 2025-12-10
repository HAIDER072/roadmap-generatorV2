# AI Interview Integration

This document explains how to use the AI Interview system integrated from the Hirelytics repository into your React/Vite project.

## Features

- **Voice-based Interviews**: Real-time speech recognition and text-to-speech
- **AI-Powered Conversations**: Context-aware interview questions using Google Gemini AI
- **Phase Management**: Structured interview flow (introduction → questions → closing)
- **Progress Tracking**: Visual progress bar showing interview completion
- **Flexible Configuration**: Customizable job context, questions, and skills
- **Fallback Support**: Works even without AI service configured

## Installation

The AI Interview system is already integrated. No additional packages needed beyond what's in your `package.json`.

## Quick Start

### 1. Import the Component

```jsx
import AIInterview from './components/AIInterview';
```

### 2. Configure Job Context

```jsx
const jobContext = {
  position: 'Software Developer',
  skills: ['JavaScript', 'React', 'Node.js'],
  totalQuestions: 5,
};
```

### 3. Use the Component

```jsx
<AIInterview 
  jobContext={jobContext}
  onInterviewComplete={(result) => {
    console.log('Interview completed:', result);
  }}
/>
```

## Component Props

### `jobContext` (object)

Configuration for the interview:

- `position` (string): Job title/position name
- `skills` (array): Array of skills to focus on
- `totalQuestions` (number): Number of questions to ask
- `description` (string, optional): Job description
- `requirements` (array, optional): Job requirements

Example:
```jsx
{
  position: 'Full Stack Developer',
  skills: ['JavaScript', 'React', 'Node.js', 'MongoDB'],
  totalQuestions: 5,
  description: 'We are looking for an experienced developer...',
  requirements: ['3+ years experience', 'Strong React skills']
}
```

### `onInterviewComplete` (function)

Callback function called when the interview is complete:

```jsx
onInterviewComplete={(result) => {
  // result contains:
  // - messages: Array of all conversation messages
  // - phase: Final interview phase information
}}
```

## Interview Flow

### 1. Introduction Phase
- AI introduces itself
- Explains the interview structure
- Asks candidate to introduce themselves

### 2. Questions Phase
- AI asks questions based on job skills
- Provides feedback on each answer
- Tracks progress through questions

### 3. Closing Phase
- AI thanks the candidate
- Provides final feedback
- Concludes the interview

## API Endpoints

The system uses these backend endpoints (already configured in `server/index.js`):

### Generate Introduction
```
POST /api/ai-interview/introduction
Body: { jobContext: {...} }
```

### Generate Response
```
POST /api/ai-interview/response
Body: {
  conversationHistory: [...],
  userResponse: "...",
  jobContext: {...},
  currentPhase: {...}
}
```

### Save Conversation
```
POST /api/ai-interview/save
Body: {
  interviewId: "...",
  messages: [...]
}
```

## Browser Requirements

### Speech Recognition
- **Supported**: Chrome, Edge, Safari (latest versions)
- **Not Supported**: Firefox, older browsers

The component will show an error message if speech recognition is not supported.

### Text-to-Speech
Supported in all modern browsers via Web Speech API.

## Customization

### Change AI Model

Edit `server/index.js` to use different models:

```javascript
// Current: gemini-2.0-flash
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

// Change to: gemini-pro or other models
const model = genAI.getGenerativeModel({ model: "gemini-pro" });
```

### Styling

Modify `src/components/AIInterview.css` to customize:
- Colors and gradients
- Layout and spacing
- Button styles
- Message appearance

### Interview Logic

Edit `src/services/aiInterviewService.js` to customize:
- Phase transitions
- Question generation logic
- Conversation management
- Fallback behavior

## Example Usage

### Basic Interview
```jsx
import AIInterview from './components/AIInterview';

function App() {
  return (
    <AIInterview 
      jobContext={{
        position: 'Frontend Developer',
        skills: ['React', 'TypeScript', 'CSS'],
        totalQuestions: 3
      }}
    />
  );
}
```

### With Custom Handler
```jsx
<AIInterview 
  jobContext={myJobContext}
  onInterviewComplete={(result) => {
    // Save to database
    saveInterviewResults(result);
    
    // Navigate to results page
    navigate('/interview-results');
    
    // Send notification
    sendEmailNotification(result);
  }}
/>
```

### Multiple Interview Types
```jsx
const interviewTypes = {
  technical: {
    position: 'Senior Developer',
    skills: ['System Design', 'Algorithms', 'Architecture'],
    totalQuestions: 10
  },
  behavioral: {
    position: 'Team Lead',
    skills: ['Leadership', 'Communication', 'Conflict Resolution'],
    totalQuestions: 5
  }
};

<AIInterview jobContext={interviewTypes.technical} />
```

## Troubleshooting

### Speech Recognition Not Working
- Ensure you're using Chrome or Edge
- Check browser permissions for microphone
- Try refreshing the page

### AI Not Responding
- Check if Gemini API key is configured in `.env`
- Verify server is running (`npm run server`)
- Check browser console for errors

### Styling Issues
- Clear browser cache
- Check that `AIInterview.css` is imported
- Verify no CSS conflicts with other components

## Advanced Features

### Custom Question Categories
```jsx
const jobContext = {
  position: 'Data Scientist',
  skills: ['Python', 'Machine Learning', 'Statistics'],
  totalQuestions: 8,
  questionCategories: [
    { type: 'technical', count: 4 },
    { type: 'behavioral', count: 2 },
    { type: 'situational', count: 2 }
  ]
};
```

### Resume-Based Questions
```jsx
const jobContext = {
  position: 'Software Engineer',
  skills: ['Java', 'Spring Boot', 'Microservices'],
  totalQuestions: 5,
  resumeContext: candidateResume, // From resume parsing
};
```

### Multi-Language Support
```jsx
const jobContext = {
  position: 'Developer',
  skills: ['JavaScript'],
  totalQuestions: 5,
  language: 'en-US', // or 'es-ES', 'fr-FR', etc.
};
```

## Integration with Hirelytics Logic

This implementation is adapted from the Hirelytics repository with the following key components:

1. **AI Interview Service** (`aiInterviewService.js`)
   - Based on Hirelytics' `ai-interview.ts`
   - Handles AI communication and phase management

2. **Interview Component** (`AIInterview.jsx`)
   - Adapted from Hirelytics' interview flow
   - Added speech recognition and text-to-speech

3. **Backend API** (`server/index.js`)
   - Implements Hirelytics-style interview endpoints
   - Uses Google Gemini AI for responses

## Key Differences from Hirelytics

- **Framework**: React (Vite) instead of Next.js
- **Backend**: Express.js instead of Next.js API routes
- **State Management**: React hooks instead of server actions
- **Speech**: Browser APIs instead of custom implementation

## Credits

This AI Interview system is adapted from the [Hirelytics](https://github.com/hirelyticsapp/hirelytics) project, specifically:
- Interview conversation logic
- AI prompt engineering
- Phase management system
- Job context handling

## License

This integration follows the license of your main project. Refer to the original Hirelytics repository for their licensing terms.
