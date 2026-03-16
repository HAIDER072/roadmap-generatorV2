# Vapi.ai Voice Interview Integration Guide

## Why Vapi.ai?

Vapi.ai provides professional voice AI capabilities that are much better than browser-based speech recognition:

✅ **Natural Conversations** - Handles interruptions, pauses, and natural speech patterns
✅ **High-Quality Voices** - ElevenLabs integration for realistic voice
✅ **Accurate Transcription** - Deepgram for industry-leading speech-to-text
✅ **Real-time Processing** - Low latency for natural conversations
✅ **Professional Experience** - Feels like talking to a real interviewer

## Getting Started

### 1. Get Your Vapi API Key

1. Go to [https://vapi.ai](https://vapi.ai)
2. Sign up for a free account
3. Navigate to your dashboard
4. Copy your API key from the "API Keys" section

### 2. Add API Key to Environment

Add this line to your `.env` file:

```env
# Vapi.ai API Key for Voice Interviews
VITE_VAPI_API_KEY="your_vapi_api_key_here"
```

### 3. Update MockInterview Component

Replace the voice-only mode implementation in `MockInterview.tsx` with the Vapi component:

```typescript
import VapiVoiceInterview from './VapiVoiceInterview';

// In your component, when voice-only mode is selected:
{interviewMode === 'voice-only' && step === 'interview' && (
  <VapiVoiceInterview
    position={position}
    resumeText={resumeText}
    duration={interviewDuration}
    onInterviewEnd={(transcript) => {
      // Handle interview end
      // You can now generate report based on transcript
      generateInterviewReport(transcript);
    }}
    onError={(error) => {
      setError(error);
    }}
  />
)}
```

## Features Included

### 🎙️ Real-time Voice Conversation
- Natural back-and-forth conversation
- AI interviewer asks relevant questions based on resume
- Adapts to candidate's answers with follow-up questions

### 📝 Live Transcription
- Real-time transcript display
- Both interviewer and candidate messages
- Saved for evaluation and report generation

### ⏱️ Time Management
- Configurable interview duration (1, 2, 5, or 10 minutes)
- Visual timer showing elapsed and remaining time
- Auto-end when time limit reached

### 🎚️ Call Controls
- Mute/Unmute functionality
- End call anytime
- Visual call status indicators

### 🎨 Professional UI
- Beautiful, modern interface
- Dark mode support
- Smooth animations and transitions
- Real-time visual feedback

## Configuration Options

### Voice Settings
The default configuration uses:
- **Provider**: ElevenLabs
- **Voice**: Sarah (professional female voice)
- **Model**: GPT-4 for intelligent responses
- **Transcriber**: Deepgram Nova-2

You can customize these in `VapiVoiceInterview.tsx`:

```typescript
voice: {
  provider: 'elevenlabs',
  voiceId: 'sarah', // or 'josh', 'adam', etc.
  stability: 0.5,
  similarityBoost: 0.75
}
```

### Interview Behavior
Customize the AI interviewer's behavior in the system prompt:

```typescript
content: `You are an experienced interviewer conducting a ${duration}-minute interview...`
```

## Cost Considerations

Vapi.ai pricing is based on:
- Minutes of voice call
- Transcription minutes
- AI model usage (GPT-4)

**Estimated cost per 5-minute interview**: ~$0.15-0.30

This is much more cost-effective than building your own voice AI infrastructure!

## Advantages Over Web Speech API

| Feature | Web Speech API | Vapi.ai |
|---------|---------------|---------|
| Voice Quality | Robotic, limited | Natural, human-like |
| Interruption Handling | Poor | Excellent |
| Transcription Accuracy | ~80-85% | ~95-98% |
| Latency | Variable | Consistent, low |
| Cross-browser Support | Limited | Universal |
| Background Noise | Struggles | Handles well |
| Natural Pauses | Often errors | Works smoothly |

## Troubleshooting

### "Vapi API key not configured"
- Make sure `VITE_VAPI_API_KEY` is in your `.env` file
- Restart your dev server after adding the key

### Call doesn't start
- Check browser permissions for microphone
- Ensure you're using HTTPS (required for mic access)
- Check Vapi dashboard for API key validity

### Poor audio quality
- Check your internet connection
- Ensure microphone is working properly
- Try adjusting voice settings

## Next Steps

1. Get your Vapi API key
2. Add it to `.env`
3. Update MockInterview to use VapiVoiceInterview
4. Test with a sample interview
5. Enjoy professional voice interviews! 🎉

## Support

- Vapi Documentation: https://docs.vapi.ai
- Vapi Discord: https://discord.gg/vapi
- Issues: Contact Vapi support or check their docs
