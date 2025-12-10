import React, { useEffect, useState, useRef } from 'react';
import Vapi from '@vapi-ai/web';
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX } from 'lucide-react';

interface VapiVoiceInterviewProps {
  position: string;
  resumeText: string;
  duration: number; // in minutes
  onInterviewEnd: (transcript: string) => void;
  onError: (error: string) => void;
}

const VapiVoiceInterview: React.FC<VapiVoiceInterviewProps> = ({
  position,
  resumeText,
  duration,
  onInterviewEnd,
  onError
}) => {
  const [isCallActive, setIsCallActive] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [transcript, setTranscript] = useState<string>('');
  const [conversationMessages, setConversationMessages] = useState<Array<{
    role: 'assistant' | 'user';
    content: string;
  }>>([]);
  const [callDuration, setCallDuration] = useState(0);
  const vapiRef = useRef<any>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    // Initialize Vapi
    const vapiApiKey = import.meta.env.VITE_VAPI_API_KEY;
    
    if (!vapiApiKey) {
      onError('Vapi API key not configured. Please add VITE_VAPI_API_KEY to your .env file.');
      return;
    }

    vapiRef.current = new Vapi(vapiApiKey);

    // Event listeners
    vapiRef.current.on('call-start', () => {
      console.log('Call started');
      setIsCallActive(true);
      startTimer();
    });

    vapiRef.current.on('call-end', () => {
      console.log('Call ended');
      setIsCallActive(false);
      stopTimer();
      
      // Send transcript to parent
      const fullTranscript = conversationMessages
        .map(msg => `${msg.role === 'assistant' ? 'Interviewer' : 'Candidate'}: ${msg.content}`)
        .join('\n\n');
      onInterviewEnd(fullTranscript);
    });

    vapiRef.current.on('speech-start', () => {
      console.log('Assistant started speaking');
    });

    vapiRef.current.on('speech-end', () => {
      console.log('Assistant stopped speaking');
    });

    vapiRef.current.on('message', (message: any) => {
      console.log('Message received:', message);
      
      if (message.type === 'transcript' && message.transcriptType === 'final') {
        const role = message.role === 'assistant' ? 'assistant' : 'user';
        const content = message.transcript;
        
        setConversationMessages(prev => [...prev, { role, content }]);
        setTranscript(prev => prev + `\n${role === 'assistant' ? 'Interviewer' : 'You'}: ${content}`);
      }
    });

    vapiRef.current.on('error', (error: any) => {
      console.error('Vapi error:', error);
      onError(`Voice call error: ${error.message || 'Unknown error'}`);
    });

    return () => {
      // Cleanup
      if (vapiRef.current && isCallActive) {
        vapiRef.current.stop();
      }
      stopTimer();
    };
  }, []);

  const startTimer = () => {
    timerRef.current = setInterval(() => {
      setCallDuration(prev => {
        const newDuration = prev + 1;
        
        // Auto-end call after specified duration
        if (newDuration >= duration * 60) {
          endCall();
        }
        
        return newDuration;
      });
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const startCall = async () => {
    if (!vapiRef.current) return;

    try {
      // Create assistant configuration with free/cheaper models
      const assistantConfig = {
        name: 'AI Interview Assistant',
        model: {
          provider: 'openai',
          model: 'gpt-3.5-turbo', // Free tier friendly model (was gpt-4)
          messages: [
            {
              role: 'system',
              content: `You are an experienced interviewer conducting a ${duration}-minute interview for a ${position} position. 

**CANDIDATE'S RESUME (Extracted using OpenAI from PDF):**
${resumeText.substring(0, 1500)}...

**YOUR RESPONSIBILITIES:**
- Ask relevant technical and behavioral questions **BASED ON THEIR RESUME**
- Reference specific projects, technologies, and experiences from their resume
- Probe deeper into the details they've written in their resume
- Ask about specific technologies, tools, and frameworks they claim to know
- Verify their experience by asking detailed questions about their listed projects
- Be conversational and natural
- Keep track of time - you have ${duration} minutes total
- Ask follow-up questions to understand their experience better
- Be encouraging but professional
- After ${duration} minutes or about 8-10 exchanges, politely wrap up the interview

**EXAMPLE APPROACH:**
- "I see you worked on [project from resume]. Tell me about that."
- "You mentioned [technology]. How did you use it in [project]?"
- "In your role at [company], what was your biggest challenge?"

Start by greeting the candidate and asking them to introduce themselves briefly.`
            }
          ],
          temperature: 0.7,
          maxTokens: 200 // Reduced for cost efficiency
        },
        voice: {
          provider: 'playht', // Using PlayHT instead of ElevenLabs (more cost-effective)
          voiceId: 'jennifer', // Professional female voice
        },
        firstMessage: `Hello! I'm your AI interviewer today. I've reviewed your resume for the ${position} position. We have ${duration} minutes for this conversation. Let's begin - tell me about yourself and why you're interested in this role.`,
        transcriber: {
          provider: 'deepgram',
          model: 'nova-2', // Good balance of quality and cost
          language: 'en'
        },
        recordingEnabled: true,
        endCallPhrases: ['goodbye', 'thank you for your time', 'that concludes our interview'],
        silenceTimeoutSeconds: 30,
        maxDurationSeconds: duration * 60
      };

      // Start the call
      await vapiRef.current.start(assistantConfig);
    } catch (error: any) {
      console.error('Error starting call:', error);
      onError(`Failed to start interview: ${error.message || 'Unknown error'}`);
    }
  };

  const endCall = () => {
    if (vapiRef.current && isCallActive) {
      vapiRef.current.stop();
    }
  };

  const toggleMute = () => {
    if (vapiRef.current) {
      if (isMuted) {
        vapiRef.current.setMuted(false);
        setIsMuted(false);
      } else {
        vapiRef.current.setMuted(true);
        setIsMuted(true);
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-blue-900 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl p-8 border-2 border-slate-200 dark:border-slate-700">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-100 mb-2">
              Voice Interview in Progress
            </h2>
            <p className="text-slate-600 dark:text-slate-400">
              {position} Position • {duration} minute{duration > 1 ? 's' : ''}
            </p>
          </div>

          {/* Call Status */}
          <div className="flex justify-center mb-8">
            <div className={`relative w-48 h-48 rounded-full flex items-center justify-center ${
              isCallActive 
                ? 'bg-gradient-to-br from-green-400 to-emerald-600 animate-pulse' 
                : 'bg-gradient-to-br from-blue-400 to-cyan-600'
            }`}>
              <div className="absolute inset-0 rounded-full bg-white dark:bg-slate-800 opacity-20"></div>
              {isCallActive ? (
                <Phone className="w-24 h-24 text-white animate-bounce" />
              ) : (
                <Mic className="w-24 h-24 text-white" />
              )}
            </div>
          </div>

          {/* Timer */}
          {isCallActive && (
            <div className="text-center mb-6">
              <div className="inline-block bg-slate-100 dark:bg-slate-700 px-6 py-3 rounded-full">
                <p className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  {formatTime(callDuration)} / {formatTime(duration * 60)}
                </p>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex justify-center gap-4 mb-8">
            {!isCallActive ? (
              <button
                onClick={startCall}
                className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-full font-bold text-lg hover:from-green-600 hover:to-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-3"
              >
                <Phone className="w-6 h-6" />
                Start Interview Call
              </button>
            ) : (
              <>
                <button
                  onClick={toggleMute}
                  className={`px-6 py-4 rounded-full font-bold text-lg transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2 ${
                    isMuted
                      ? 'bg-yellow-500 hover:bg-yellow-600 text-white'
                      : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-100'
                  }`}
                >
                  {isMuted ? <VolumeX className="w-6 h-6" /> : <Volume2 className="w-6 h-6" />}
                  {isMuted ? 'Unmute' : 'Mute'}
                </button>
                
                <button
                  onClick={endCall}
                  className="px-6 py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-full font-bold text-lg hover:from-red-600 hover:to-rose-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center gap-2"
                >
                  <PhoneOff className="w-6 h-6" />
                  End Interview
                </button>
              </>
            )}
          </div>

          {/* Live Transcript */}
          {isCallActive && conversationMessages.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-900 rounded-2xl p-6 border-2 border-slate-200 dark:border-slate-700 max-h-96 overflow-y-auto">
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <Volume2 className="w-5 h-5" />
                Live Transcript
              </h3>
              <div className="space-y-4">
                {conversationMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-4 rounded-xl ${
                      msg.role === 'assistant'
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500'
                        : 'bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500'
                    }`}
                  >
                    <p className="font-semibold text-sm mb-1 text-slate-700 dark:text-slate-300">
                      {msg.role === 'assistant' ? '🤖 Interviewer' : '👤 You'}
                    </p>
                    <p className="text-slate-800 dark:text-slate-200">{msg.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          {!isCallActive && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800">
              <h3 className="font-bold text-lg text-blue-900 dark:text-blue-100 mb-3">
                📋 Instructions
              </h3>
              <ul className="space-y-2 text-blue-800 dark:text-blue-200">
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Click "Start Interview Call" to begin the voice interview</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Speak naturally - the AI will ask you questions and respond to your answers</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>The interview will automatically end after {duration} minutes</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>You can mute yourself or end the call anytime</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-500 font-bold">•</span>
                  <span>Your conversation is transcribed in real-time for evaluation</span>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VapiVoiceInterview;
