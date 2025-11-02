import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Upload, FileText, Briefcase, Send, CheckCircle, AlertCircle, Download, Video, VideoOff, Camera, ArrowRight, Volume2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';
import VapiVoiceInterview from './VapiVoiceInterview';

interface Question {
  id: number;
  question: string;
  answer: string;
  feedback?: string;
}

interface InterviewReport {
  overallScore: number;
  strengths: string[];
  improvements: string[];
  detailedFeedback: Question[];
  recommendation: string;
}

const MockInterview: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State management
  const [step, setStep] = useState<'setup' | 'interview' | 'report'>('setup');
  const [interviewMode, setInterviewMode] = useState<'standard' | 'voice-only'>('standard');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeText, setResumeText] = useState<string>('');
  const [position, setPosition] = useState<string>('');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: string; content: string}>>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [report, setReport] = useState<InterviewReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [speechAnalysis, setSpeechAnalysis] = useState<{
    fillerWords: number;
    pace: number; // words per minute
    clarity: number; // 0-100
    pauseCount: number;
  }>({ fillerWords: 0, pace: 0, clarity: 0, pauseCount: 0 });
  const [startTime, setStartTime] = useState<number>(0);
  const [wordCount, setWordCount] = useState<number>(0);
  const [isAISpeaking, setIsAISpeaking] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState<string>('');
  const [conversationActive, setConversationActive] = useState(false);
  const [interviewDuration, setInterviewDuration] = useState<number>(5); // minutes
  const [interviewStartTime, setInterviewStartTime] = useState<number>(0);
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [useVapi, setUseVapi] = useState<boolean>(true); // Use Vapi for voice interviews by default
  const [vapiTranscript, setVapiTranscript] = useState<string>('');
  
  // Web Speech API references
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const conversationTimeoutRef = useRef<any>(null);
  const conversationActiveRef = useRef<boolean>(false);
  const isAISpeakingRef = useRef<boolean>(false);
  const noSpeechTimeoutRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          const confidence = event.results[i][0].confidence;
          
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
            
            // Analyze speech patterns
            const fillerWords = ['um', 'uh', 'like', 'you know', 'actually', 'basically', 'literally'];
            const words = transcript.toLowerCase().split(' ');
            const fillerCount = words.filter(w => fillerWords.includes(w.trim())).length;
            
            setSpeechAnalysis(prev => ({
              ...prev,
              fillerWords: prev.fillerWords + fillerCount,
              clarity: Math.round(((prev.clarity + (confidence * 100)) / 2) || 70)
            }));
            
            setWordCount(prev => prev + words.length);
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setCurrentAnswer(prev => prev + finalTranscript);
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      // Cleanup camera stream
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  // Initialize camera when interview starts
  useEffect(() => {
    if (step === 'interview' && cameraEnabled) {
      startCamera();
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [step, cameraEnabled]);

  // Start camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720 },
        audio: false 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraEnabled(false);
    }
  };

  // Toggle camera
  const toggleCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
      setCameraEnabled(false);
    } else {
      setCameraEnabled(true);
      startCamera();
    }
  };

  // Handle resume file upload - use backend parsing
  const handleResumeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setResumeFile(file);
    setError('');
    setLoading(true);
    
    try {
      console.log('Uploading resume for parsing:', file.name);
      
      // Create FormData to send file to backend
      const formData = new FormData();
      formData.append('resume', file);
      
      // Send to backend for parsing
      const response = await fetch('http://localhost:3001/api/parse-resume', {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to parse resume');
      }
      
      console.log('✅ Resume parsed successfully!');
      console.log('Extracted', data.length, 'characters');
      console.log('Preview:', data.text.substring(0, 200) + '...');
      
      setResumeText(data.text);
      
    } catch (err: any) {
      console.error('❌ Error parsing resume:', err);
      setError(err.message || 'Failed to parse resume file. Please try a different file.');
      setResumeFile(null);
      setResumeText('');
    } finally {
      setLoading(false);
    }
  };

  // Start the interview
  const startInterview = async () => {
    if (!resumeText || !position) {
      setError('Please upload your resume and select a position');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (interviewMode === 'voice-only') {
        // Voice-only mode: Start conversation immediately
        await startVoiceConversation();
      } else {
        // Standard mode: Generate questions
        const response = await fetch('http://localhost:3001/api/mock-interview/start', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id,
            resumeText,
            position,
            questionCount
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to start interview');
        }

        setQuestions(data.questions.map((q: string, i: number) => ({
          id: i + 1,
          question: q,
          answer: ''
        })));
        setStep('interview');
        
        // Speak the first question
        speakQuestion(data.questions[0]);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Start voice-only conversation
  const startVoiceConversation = async () => {
    setStep('interview');
    setConversationActive(true);
    conversationActiveRef.current = true;
    
    // Start interview timer
    const startTime = Date.now();
    setInterviewStartTime(startTime);
    
    // Update elapsed time every second
    timerIntervalRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTimeElapsed(elapsed);
      
      // Check if interview duration exceeded
      if (elapsed >= interviewDuration * 60) {
        console.log('Interview time limit reached');
        finishVoiceInterview();
      }
    }, 1000);
    
    // Initial greeting from AI
    const greeting = `Hello! I'm your AI interviewer today. I've reviewed your resume for the ${position} position. We have ${interviewDuration} minutes for this conversation. Let's begin. Tell me about yourself and why you're interested in this role.`;
    
    // Add greeting to conversation history
    setConversationHistory([{ role: 'assistant', content: greeting }]);
    
    await speakAIResponse(greeting);
    
    // Start listening for user response after AI finishes speaking
    setTimeout(() => {
      startContinuousListening();
    }, 500);
  };

  // Speak AI response with visual feedback
  const speakAIResponse = async (text: string) => {
    return new Promise<void>((resolve) => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1;
        utterance.volume = 1;
        
        utterance.onstart = () => {
          setIsAISpeaking(true);
          isAISpeakingRef.current = true;
        };
        utterance.onend = () => {
          setIsAISpeaking(false);
          isAISpeakingRef.current = false;
          resolve();
        };
        utterance.onerror = () => {
          setIsAISpeaking(false);
          isAISpeakingRef.current = false;
          resolve();
        };
        
        window.speechSynthesis.speak(utterance);
      } else {
        resolve();
      }
    });
  };

  // Start continuous listening for voice-only mode
  const startContinuousListening = () => {
    if (!recognitionRef.current) {
      console.error('Speech recognition not available');
      return;
    }

    // Reset transcript accumulator
    let accumulatedTranscript = '';
    let hasSpoken = false;

    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    // Clear any existing no-speech timeout
    if (noSpeechTimeoutRef.current) {
      clearTimeout(noSpeechTimeoutRef.current);
    }

    // Set 8-second timeout for no speech - if user doesn't speak, move to next question
    noSpeechTimeoutRef.current = setTimeout(() => {
      if (!hasSpoken && conversationActiveRef.current) {
        console.log('No speech detected for 8 seconds, moving to next question');
        // Send a default response to move to next question
        handleVoiceResponse('I prefer not to answer this question.');
      }
    }, 8000);

    recognitionRef.current.onresult = (event: any) => {
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        }
      }

      if (finalTranscript) {
        hasSpoken = true;
        accumulatedTranscript += finalTranscript;
        setVoiceTranscript(accumulatedTranscript);
        
        // Clear the no-speech timeout since user has spoken
        if (noSpeechTimeoutRef.current) {
          clearTimeout(noSpeechTimeoutRef.current);
        }
        
        // Clear previous conversation timeout
        if (conversationTimeoutRef.current) {
          clearTimeout(conversationTimeoutRef.current);
        }

        // Wait for user to finish speaking (2.5 seconds of silence)
        conversationTimeoutRef.current = setTimeout(() => {
          if (accumulatedTranscript.trim()) {
            const userInput = accumulatedTranscript.trim();
            accumulatedTranscript = ''; // Reset for next turn
            setVoiceTranscript('');
            handleVoiceResponse(userInput);
          }
        }, 2500);
      }
    };

    recognitionRef.current.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'no-speech') {
        // Restart if no speech detected
        console.log('No speech detected, continuing to listen...');
      } else if (event.error !== 'aborted') {
        // Try to restart unless deliberately aborted
        setTimeout(() => {
          if (recognitionRef.current && conversationActive) {
            try {
              recognitionRef.current.start();
            } catch (e) {
              console.error('Failed to restart recognition:', e);
            }
          }
        }, 1000);
      }
    };

    recognitionRef.current.onend = () => {
      // Auto-restart if conversation is still active and AI is not speaking
      console.log('Recognition ended. Active:', conversationActiveRef.current, 'AI Speaking:', isAISpeakingRef.current);
      if (conversationActiveRef.current && !isAISpeakingRef.current) {
        console.log('Restarting recognition...');
        setTimeout(() => {
          if (recognitionRef.current && conversationActiveRef.current && !isAISpeakingRef.current) {
            try {
              recognitionRef.current.start();
              console.log('Recognition restarted successfully');
            } catch (e) {
              console.error('Failed to restart recognition:', e);
            }
          }
        }, 300);
      }
    };

    try {
      recognitionRef.current.start();
      console.log('Voice recognition started');
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  };

  // Handle user voice response and get AI reply
  const handleVoiceResponse = async (userResponse: string) => {
    if (!userResponse.trim() || !conversationActive) return;

    console.log('User said:', userResponse);

    // Stop listening while AI responds
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    }

    // Add user message to conversation
    const updatedHistory = [
      ...conversationHistory,
      { role: 'user', content: userResponse }
    ];
    setConversationHistory(updatedHistory);

    try {
      // Get AI response from Gemini
      const response = await fetch('http://localhost:3001/api/mock-interview/voice-response', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationHistory: updatedHistory,
          position,
          resumeText
        })
      });

      const data = await response.json();

      if (data.success && data.aiResponse) {
        // Add AI response to conversation
        const newHistory = [
          ...updatedHistory,
          { role: 'assistant', content: data.aiResponse }
        ];
        setConversationHistory(newHistory);

        console.log(`Conversation progress: ${newHistory.length} messages`);

        // Speak the AI response
        await speakAIResponse(data.aiResponse);

        // Check if interview should end using the UPDATED history length
        if (data.shouldEnd || newHistory.length >= 20) {
          console.log('Interview ending condition met');
          await finishVoiceInterview();
        } else {
          // Add a small delay before resuming listening (your 5-second timer idea)
          console.log('Waiting 2 seconds before listening for next response...');
          setTimeout(() => {
            if (conversationActiveRef.current) {
              console.log('Resuming listening for user response');
              startContinuousListening();
            }
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      // Resume listening even on error
      startContinuousListening();
    }
  };

  // Finish voice interview and generate report
  const finishVoiceInterview = async () => {
    console.log('Finishing voice interview');
    setConversationActive(false);
    conversationActiveRef.current = false;
    
    // Clear all timers
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }
    if (conversationTimeoutRef.current) {
      clearTimeout(conversationTimeoutRef.current);
    }
    if (noSpeechTimeoutRef.current) {
      clearTimeout(noSpeechTimeoutRef.current);
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error('Error stopping recognition:', e);
      }
    }

    await speakAIResponse("Thank you for your time today. I'll now generate your interview report.");
    
    // Convert conversation to questions/answers format for report
    console.log('Converting conversation history to Q&A format...');
    console.log('Total conversation messages:', conversationHistory.length);
    
    const formattedQA: Question[] = [];
    // Start from 0 and pair assistant questions with user answers
    for (let i = 0; i < conversationHistory.length - 1; i += 2) {
      const currentMsg = conversationHistory[i];
      const nextMsg = conversationHistory[i + 1];
      
      console.log(`Pair ${i/2 + 1}: [${currentMsg?.role}] -> [${nextMsg?.role}]`);
      
      if (currentMsg && nextMsg && currentMsg.role === 'assistant' && nextMsg.role === 'user') {
        formattedQA.push({
          id: formattedQA.length + 1,
          question: currentMsg.content,
          answer: nextMsg.content,
        });
      }
    }
    
    console.log(`Formatted ${formattedQA.length} Q&A pairs`);

    setQuestions(formattedQA);
    generateReport();
  };

  // Text-to-Speech for questions
  const speakQuestion = (questionText: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      synthesisRef.current = new SpeechSynthesisUtterance(questionText);
      synthesisRef.current.rate = 0.9;
      synthesisRef.current.pitch = 1;
      synthesisRef.current.volume = 1;
      
      synthesisRef.current.onstart = () => setIsSpeaking(true);
      synthesisRef.current.onend = () => setIsSpeaking(false);
      
      window.speechSynthesis.speak(synthesisRef.current);
    }
  };

  // Toggle voice recording
  const toggleListening = () => {
    if (!recognitionRef.current) {
      setError('Speech recognition not supported in your browser');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      
      // Calculate speech pace (words per minute)
      const duration = (Date.now() - startTime) / 1000 / 60; // minutes
      if (duration > 0) {
        const pace = Math.round(wordCount / duration);
        setSpeechAnalysis(prev => ({ ...prev, pace }));
      }
      setWordCount(0);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      setStartTime(Date.now());
      setWordCount(0);
    }
  };

  // Submit answer and move to next question
  const submitAnswer = () => {
    if (!currentAnswer.trim()) {
      setError('Please provide an answer before continuing');
      return;
    }

    const updatedQuestions = [...questions];
    updatedQuestions[currentQuestionIndex].answer = currentAnswer;
    setQuestions(updatedQuestions);
    setCurrentAnswer('');
    
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    if (currentQuestionIndex < questions.length - 1) {
      const nextIndex = currentQuestionIndex + 1;
      setCurrentQuestionIndex(nextIndex);
      speakQuestion(questions[nextIndex].question);
    } else {
      // Interview complete, generate report
      generateReport();
    }
  };

  // Generate interview report
  const generateReport = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3001/api/mock-interview/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          questions: questions,
          position,
          resumeText,
          speechAnalysis
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate report');
      }

      setReport(data.report);
      setStep('report');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Download report as PDF
  const downloadReport = () => {
    if (!report) return;

    const doc = new jsPDF();
    let yPos = 20;

    // Title
    doc.setFontSize(20);
    doc.text('Mock Interview Report', 20, yPos);
    yPos += 15;

    // Overall Score
    doc.setFontSize(14);
    doc.text(`Overall Score: ${report.overallScore}/100`, 20, yPos);
    yPos += 10;

    // Strengths
    doc.setFontSize(12);
    doc.text('Strengths:', 20, yPos);
    yPos += 7;
    doc.setFontSize(10);
    report.strengths.forEach(strength => {
      doc.text(`• ${strength}`, 25, yPos);
      yPos += 6;
    });
    yPos += 5;

    // Areas for Improvement
    doc.setFontSize(12);
    doc.text('Areas for Improvement:', 20, yPos);
    yPos += 7;
    doc.setFontSize(10);
    report.improvements.forEach(improvement => {
      doc.text(`• ${improvement}`, 25, yPos);
      yPos += 6;
    });

    doc.save('interview-report.pdf');
  };

  // Render setup step
  const renderSetup = () => (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full mb-6 shadow-xl">
          <Camera className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent mb-4">AI Mock Interview</h2>
        <p className="text-lg text-slate-600 dark:text-slate-400">Upload your resume and select a position to start your AI-powered interview practice</p>
      </div>

      {/* Resume Upload */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700 hover:border-blue-300 transition-all duration-300">
        <label className="flex flex-col items-center justify-center w-full h-56 border-2 border-dashed border-slate-300 rounded-xl cursor-pointer hover:border-blue-500 hover:bg-blue-50/30 transition-all duration-200 group">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <p className="mb-2 text-base text-slate-700 dark:text-slate-300">
              <span className="font-semibold text-blue-600">Click to upload resume</span> or drag and drop
            </p>
            <p className="text-sm text-slate-500">TXT, PDF, or DOC (Max 5MB)</p>
            {resumeFile && (
              <div className="mt-4 flex items-center space-x-2 px-4 py-2 bg-blue-50 rounded-lg border border-blue-200">
                <FileText className="w-5 h-5 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">{resumeFile.name}</span>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            )}
          </div>
          <input
            type="file"
            className="hidden"
            accept=".txt,.pdf,.doc,.docx"
            onChange={handleResumeUpload}
          />
        </label>
      </div>

      {/* Position Selection */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
        <label className="block text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">
          Select Position
        </label>
        <div className="relative">
          <Briefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 text-blue-500 w-6 h-6" />
          <select
            value={position}
            onChange={(e) => setPosition(e.target.value)}
            className="w-full pl-14 pr-4 py-4 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200 text-slate-700 dark:text-slate-300 font-medium text-base bg-white dark:bg-slate-800 hover:border-blue-400"
          >
            <option value="">Choose a position...</option>
            <option value="SDE1">Software Development Engineer 1 (SDE1)</option>
            <option value="SDE2">Software Development Engineer 2 (SDE2)</option>
            <option value="SDE3">Software Development Engineer 3 (SDE3)</option>
            <option value="Data Analyst">Data Analyst</option>
            <option value="Data Scientist">Data Scientist</option>
            <option value="Product Manager">Product Manager</option>
            <option value="Frontend Developer">Frontend Developer</option>
            <option value="Backend Developer">Backend Developer</option>
            <option value="Full Stack Developer">Full Stack Developer</option>
            <option value="DevOps Engineer">DevOps Engineer</option>
          </select>
        </div>
      </div>

      {/* Interview Mode Selection */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
        <label className="block text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">
          Interview Mode
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => setInterviewMode('standard')}
            className={`p-6 rounded-xl border-2 transition-all duration-200 text-left ${
              interviewMode === 'standard'
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-lg'
                : 'border-slate-300 dark:border-slate-600 hover:border-blue-300 dark:hover:border-blue-700'
            }`}
          >
            <div className="flex items-start space-x-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                interviewMode === 'standard'
                  ? 'bg-blue-500'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}>
                <FileText className={`w-6 h-6 ${
                  interviewMode === 'standard' ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-lg mb-1 ${
                  interviewMode === 'standard'
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-slate-800 dark:text-slate-200'
                }`}>
                  Standard Mode
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Answer via text or voice with visual feedback. See questions on screen.
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => setInterviewMode('voice-only')}
            className={`p-6 rounded-xl border-2 transition-all duration-200 text-left relative overflow-hidden ${
              interviewMode === 'voice-only'
                ? 'border-green-500 bg-green-50 dark:bg-green-900/20 shadow-lg'
                : 'border-slate-300 dark:border-slate-600 hover:border-green-300 dark:hover:border-green-700'
            }`}
          >
            <div className="absolute top-2 right-2">
              <span className="text-xs px-2 py-1 bg-green-500 text-white rounded-full font-bold animate-pulse">
                NEW
              </span>
            </div>
            <div className="flex items-start space-x-3">
              <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                interviewMode === 'voice-only'
                  ? 'bg-green-500'
                  : 'bg-slate-200 dark:bg-slate-700'
              }`}>
                <Mic className={`w-6 h-6 ${
                  interviewMode === 'voice-only' ? 'text-white' : 'text-slate-600 dark:text-slate-400'
                }`} />
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-lg mb-1 ${
                  interviewMode === 'voice-only'
                    ? 'text-green-600 dark:text-green-400'
                    : 'text-slate-800 dark:text-slate-200'
                }`}>
                  Voice-Only Mode 🎙️
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400">
                  Real-time AI conversation. Camera + voice only, no text. Like a real interview!
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Question Count Selection - Only show for standard mode */}
      {interviewMode === 'standard' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
          <label className="block text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">
            Number of Questions
          </label>
          <div className="grid grid-cols-4 gap-4">
            {[5, 10, 15, 20].map((count) => (
              <button
                key={count}
                onClick={() => setQuestionCount(count)}
                className={`py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 ${
                  questionCount === count
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg scale-105'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 border-2 border-slate-300 dark:border-slate-600'
                }`}
              >
                {count}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-500 mt-3">
            Selected: <span className="font-semibold text-blue-600">{questionCount} questions</span>
          </p>
        </div>
      )}

      {/* Interview Duration Selection - Only show for voice-only mode */}
      {interviewMode === 'voice-only' && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
          <label className="block text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">
            Interview Duration
          </label>
          <div className="grid grid-cols-4 gap-4">
            {[1, 2, 5, 10].map((duration) => (
              <button
                key={duration}
                onClick={() => setInterviewDuration(duration)}
                className={`py-4 px-6 rounded-xl font-bold text-lg transition-all duration-200 ${
                  interviewDuration === duration
                    ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg scale-105'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 border-2 border-slate-300 dark:border-slate-600'
                }`}
              >
                {duration} min
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-500 mt-3">
            Selected: <span className="font-semibold text-green-600">{interviewDuration} minute{interviewDuration > 1 ? 's' : ''}</span> • Auto-skip after 8s of silence
          </p>
        </div>
      )}

      {/* Token Info */}
      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-lg">🪙</span>
          </div>
          <div>
            <p className="text-base font-semibold text-blue-900">
              Cost: 5 tokens per interview
            </p>
            <p className="text-sm text-blue-700">
              Tokens will be deducted when you start the interview
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 flex items-start space-x-3 animate-shake">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <p className="text-base text-red-800 font-medium">{error}</p>
        </div>
      )}

      <button
        onClick={startInterview}
        disabled={loading || !resumeFile || !position}
        className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-5 rounded-xl font-bold text-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:shadow-blue-500/50 hover:scale-[1.02] transform flex items-center justify-center space-x-3"
      >
        {loading ? (
          <>
            <div className="w-6 h-6 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            <span>Starting Interview...</span>
          </>
        ) : (
          <>
            <Camera className="w-6 h-6" />
            <span>Start Mock Interview</span>
            <ArrowRight className="w-6 h-6" />
          </>
        )}
      </button>
    </div>
  );

  // Handle Vapi interview end
  const handleVapiInterviewEnd = async (transcript: string) => {
    console.log('Vapi interview ended with transcript:', transcript);
    setVapiTranscript(transcript);
    
    // Generate report from transcript
    setLoading(true);
    try {
      // Parse transcript into questions format
      const messages = transcript.split('\n\n');
      const parsedQuestions: Question[] = messages
        .filter(msg => msg.includes('Candidate:'))
        .map((msg, idx) => ({
          id: idx + 1,
          question: messages[idx * 2]?.replace('Interviewer:', '').trim() || `Question ${idx + 1}`,
          answer: msg.replace('Candidate:', '').trim(),
          feedback: ''
        }));

      const response = await fetch('http://localhost:3001/api/mock-interview/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id,
          questions: parsedQuestions,
          position,
          resumeText
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate report');
      }

      setReport(data.report);
      setQuestions(data.report.detailedFeedback);
      setStep('report');
    } catch (err: any) {
      console.error('Error generating report:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Render voice-only interview mode
  const renderVoiceOnlyInterview = () => {
    // Use Vapi for professional voice interview
    if (useVapi) {
      return (
        <VapiVoiceInterview
          position={position}
          resumeText={resumeText}
          duration={interviewDuration}
          onInterviewEnd={handleVapiInterviewEnd}
          onError={(error) => setError(error)}
        />
      );
    }
    
    // Fallback to Web Speech API (old implementation)
    return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-6xl w-full">
        {/* Header with Timer */}
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-slate-800 dark:text-slate-200 mb-2">
            Voice Interview Mode
          </h2>
          <p className="text-slate-600 dark:text-slate-400">
            {conversationActive ? 'Having a conversation with AI...' : 'Preparing interview...'}
          </p>
          {conversationActive && (
            <div className="mt-4 inline-flex items-center space-x-2 bg-blue-100 dark:bg-blue-900/30 px-6 py-3 rounded-full border-2 border-blue-300 dark:border-blue-700">
              <span className="text-2xl">⏱️</span>
              <span className="text-lg font-bold text-blue-700 dark:text-blue-300">
                {Math.floor(timeElapsed / 60)}:{String(timeElapsed % 60).padStart(2, '0')}
              </span>
              <span className="text-sm text-blue-600 dark:text-blue-400">/ {interviewDuration} min</span>
            </div>
          )}
        </div>

        {/* Two-Circle Interface */}
        <div className="flex items-center justify-center space-x-16 mb-12">
          {/* User Circle - Video Feed */}
          <div className="relative">
            <div className="w-64 h-64 rounded-full overflow-hidden border-8 border-blue-500 shadow-2xl">
              {cameraEnabled && stream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-slate-700 flex items-center justify-center">
                  <VideoOff className="w-20 h-20 text-slate-400" />
                </div>
              )}
            </div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-6 py-2 rounded-full font-bold shadow-lg">
              You
            </div>
          </div>

          {/* Connection Line */}
          <div className="flex items-center space-x-2">
            <div className="w-12 h-1 bg-gradient-to-r from-blue-500 to-green-500 rounded-full"></div>
            <Mic className={`w-8 h-8 ${
              conversationActive ? 'text-green-500 animate-pulse' : 'text-slate-400'
            }`} />
            <div className="w-12 h-1 bg-gradient-to-r from-green-500 to-blue-500 rounded-full"></div>
          </div>

          {/* AI Circle - Visual Indicator */}
          <div className="relative">
            <div className={`w-64 h-64 rounded-full flex items-center justify-center border-8 shadow-2xl transition-all duration-300 ${
              isAISpeaking
                ? 'border-green-500 bg-gradient-to-br from-green-400 to-emerald-500 scale-110'
                : 'border-slate-400 bg-gradient-to-br from-slate-600 to-slate-700'
            }`}>
              <div className="text-center">
                {isAISpeaking ? (
                  <>
                    <div className="relative">
                      <Volume2 className="w-24 h-24 text-white animate-pulse" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-32 h-32 border-4 border-white/30 rounded-full animate-ping"></div>
                      </div>
                    </div>
                    <p className="text-white font-bold mt-4 text-lg">AI Speaking...</p>
                  </>
                ) : (
                  <>
                    <Mic className="w-24 h-24 text-slate-400" />
                    <p className="text-slate-300 font-bold mt-4 text-lg">Listening...</p>
                  </>
                )}
              </div>
            </div>
            <div className="absolute -bottom-4 left-1/2 transform -translate-x-1/2 bg-green-600 text-white px-6 py-2 rounded-full font-bold shadow-lg">
              AI Interviewer
            </div>
          </div>
        </div>

        {/* Live Transcript (Optional - Show what's being said) */}
        {voiceTranscript && (
          <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-slate-200 dark:border-slate-700 max-w-2xl mx-auto mb-8">
            <div className="flex items-start space-x-3">
              <Mic className="w-6 h-6 text-blue-500 flex-shrink-0 mt-1" />
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">You're saying:</p>
                <p className="text-slate-600 dark:text-slate-400 italic">"{voiceTranscript}"</p>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          <button
            onClick={toggleCamera}
            className={`px-8 py-4 rounded-xl font-bold text-lg transition-all duration-200 shadow-lg flex items-center space-x-3 ${
              cameraEnabled
                ? 'bg-red-500 hover:bg-red-600 text-white'
                : 'bg-green-500 hover:bg-green-600 text-white'
            }`}
          >
            {cameraEnabled ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            <span>{cameraEnabled ? 'Turn Off Camera' : 'Turn On Camera'}</span>
          </button>

          <button
            onClick={async () => {
              await finishVoiceInterview();
            }}
            disabled={!conversationActive}
            className="px-8 py-4 rounded-xl font-bold text-lg bg-blue-600 hover:bg-blue-700 text-white transition-all duration-200 shadow-lg flex items-center space-x-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckCircle className="w-5 h-5" />
            <span>End Interview</span>
          </button>
        </div>

        {/* Conversation Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg rounded-xl p-4 text-center border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Exchanges</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {Math.floor(conversationHistory.length / 2)}
            </p>
          </div>
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg rounded-xl p-4 text-center border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Time Left</p>
            <p className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {Math.max(0, Math.floor((interviewDuration * 60 - timeElapsed) / 60))}:{String(Math.max(0, (interviewDuration * 60 - timeElapsed) % 60)).padStart(2, '0')}
            </p>
          </div>
          <div className="bg-white/60 dark:bg-slate-800/60 backdrop-blur-lg rounded-xl p-4 text-center border border-slate-200 dark:border-slate-700">
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Status</p>
            <p className={`text-sm font-bold ${
              conversationActive ? 'text-green-600' : 'text-slate-600'
            }`}>
              {conversationActive ? '● Active' : '○ Inactive'}
            </p>
          </div>
        </div>

        {error && (
          <div className="mt-6 bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-5 flex items-start space-x-3 max-w-2xl mx-auto">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
            <p className="text-base text-red-800 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}
      </div>
    </div>
    );
  };

  // Render interview step
  const renderInterview = () => {
    if (interviewMode === 'voice-only') {
      return renderVoiceOnlyInterview();
    }
    
    return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Camera Feed - Left Side */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden sticky top-24">
            <div className="bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-4">
              <h3 className="text-white font-bold text-lg flex items-center space-x-2">
                <Video className="w-5 h-5" />
                <span>Live Camera</span>
              </h3>
            </div>
            <div className="relative bg-slate-900 aspect-video">
              {cameraEnabled && stream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center">
                    <VideoOff className="w-16 h-16 text-slate-600 dark:text-slate-400 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm">Camera is off</p>
                  </div>
                </div>
              )}
              {/* Camera overlay controls */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
                <button
                  onClick={toggleCamera}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 shadow-lg ${
                    cameraEnabled
                      ? 'bg-red-500 hover:bg-red-600 text-white'
                      : 'bg-green-500 hover:bg-green-600 text-white'
                  }`}
                >
                  {cameraEnabled ? (
                    <div className="flex items-center space-x-2">
                      <VideoOff className="w-4 h-4" />
                      <span>Turn Off</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <Video className="w-4 h-4" />
                      <span>Turn On</span>
                    </div>
                  )}
                </button>
              </div>
            </div>
            {/* Interview Stats */}
            <div className="p-6 bg-gradient-to-br from-slate-50 to-slate-100">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-600 dark:text-slate-400">Progress</span>
                  <span className="text-sm font-bold text-blue-600">
                    {Math.round(((currentQuestionIndex + 1) / questions.length) * 100)}%
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-cyan-600 h-3 rounded-full transition-all duration-500 shadow-lg"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="text-xs text-slate-500">Question {currentQuestionIndex + 1} of {questions.length}</span>
                  <span className="text-xs text-slate-500">{questions.length - currentQuestionIndex - 1} remaining</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Interview Content - Right Side */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">

            {/* Question Card */}
            <div className="mb-8">
              <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-2xl p-6 border-2 border-blue-200">
                <div className="flex items-start space-x-4">
                  <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-white font-bold text-lg">Q{currentQuestionIndex + 1}</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-2xl font-semibold text-slate-800 dark:text-slate-200 leading-relaxed">
                      {questions[currentQuestionIndex]?.question}
                    </p>
                    {isSpeaking && (
                      <div className="flex items-center space-x-2 mt-4 text-blue-600 bg-white dark:bg-slate-800 px-4 py-2 rounded-lg inline-flex">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                          <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                        <span className="font-medium">AI is speaking...</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Answer Input */}
            <div className="mb-6">
              <label className="block text-base font-semibold text-slate-800 dark:text-slate-200 mb-3">Your Answer</label>
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer or use voice input..."
                className="w-full h-48 p-5 border-2 border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none text-base text-slate-700 dark:text-slate-300 placeholder-slate-400 transition-all duration-200"
              />
            </div>

            {/* Voice Controls */}
            <div className="flex items-center justify-between mb-6 bg-slate-50 dark:bg-slate-900 p-4 rounded-xl">
              <button
                onClick={toggleListening}
                className={`flex items-center space-x-3 px-8 py-4 rounded-xl font-bold text-base transition-all duration-200 shadow-lg ${
                  isListening
                    ? 'bg-red-500 hover:bg-red-600 text-white scale-105'
                    : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white'
                }`}
              >
                {isListening ? (
                  <>
                    <MicOff className="w-6 h-6" />
                    <span>Stop Recording</span>
                  </>
                ) : (
                  <>
                    <Mic className="w-6 h-6" />
                    <span>Start Voice Input</span>
                  </>
                )}
              </button>

              {isListening && (
                <div className="flex items-center space-x-3 bg-red-50 px-4 py-3 rounded-lg border-2 border-red-200">
                  <div className="relative">
                    <div className="w-4 h-4 bg-red-500 rounded-full animate-ping absolute"></div>
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                  </div>
                  <span className="text-base font-bold text-red-700">Recording...</span>
                </div>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-5 flex items-start space-x-3 mb-6 animate-shake">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <p className="text-base text-red-800 font-medium">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              onClick={submitAnswer}
              disabled={!currentAnswer.trim()}
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-5 rounded-xl font-bold text-xl hover:from-blue-700 hover:to-cyan-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl hover:shadow-blue-500/50 flex items-center justify-center space-x-3 hover:scale-[1.02] transform"
            >
              <span>{currentQuestionIndex === questions.length - 1 ? 'Finish Interview' : 'Next Question'}</span>
              <Send className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
  };

  // Render report step
  const renderReport = () => (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Interview Complete!</h2>
        <p className="text-gray-600 dark:text-slate-400">Here's your detailed performance report</p>
      </div>

      {report && (
        <>
          {/* Overall Score */}
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg p-8 text-white">
            <h3 className="text-2xl font-bold mb-2">Overall Score</h3>
            <div className="text-6xl font-bold">{report.overallScore}/100</div>
          </div>

          {/* Speech Analysis Metrics */}
          {speechAnalysis.pace > 0 && (
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-8 border border-slate-200 dark:border-slate-700">
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-6 flex items-center space-x-2">
                <Mic className="w-7 h-7 text-blue-600" />
                <span>Speech Performance Analysis</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Speech Clarity */}
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-100 to-cyan-100 flex items-center justify-center">
                    <span className="text-3xl font-bold text-blue-600">{speechAnalysis.clarity}%</span>
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Speech Clarity</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {speechAnalysis.clarity >= 80 ? 'Excellent clarity' : speechAnalysis.clarity >= 60 ? 'Good clarity' : 'Needs improvement'}
                  </p>
                </div>

                {/* Speaking Pace */}
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-100 to-emerald-100 flex items-center justify-center">
                    <span className="text-2xl font-bold text-green-600">{speechAnalysis.pace}</span>
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Words Per Minute</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {speechAnalysis.pace >= 120 && speechAnalysis.pace <= 150 ? 'Perfect pace' : speechAnalysis.pace < 120 ? 'Speak faster' : 'Speak slower'}
                  </p>
                </div>

                {/* Filler Words */}
                <div className="text-center">
                  <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gradient-to-r from-amber-100 to-orange-100 flex items-center justify-center">
                    <span className="text-3xl font-bold text-amber-600">{speechAnalysis.fillerWords}</span>
                  </div>
                  <p className="font-semibold text-slate-800 dark:text-slate-200">Filler Words</p>
                  <p className="text-sm text-slate-500 mt-1">
                    {speechAnalysis.fillerWords <= 5 ? 'Great control' : speechAnalysis.fillerWords <= 10 ? 'Acceptable' : 'Reduce usage'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Strengths & Improvements */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span>Strengths</span>
              </h3>
              <ul className="space-y-2">
                {report.strengths.map((strength, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-green-500">•</span>
                    <span className="text-gray-700 dark:text-slate-300">{strength}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center space-x-2">
                <AlertCircle className="w-6 h-6 text-amber-500" />
                <span>Areas for Improvement</span>
              </h3>
              <ul className="space-y-2">
                {report.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <span className="text-amber-500">•</span>
                    <span className="text-gray-700 dark:text-slate-300">{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Detailed Feedback */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-slate-700">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Detailed Feedback</h3>
            <div className="space-y-6">
              {report.detailedFeedback.map((item, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4">
                  <p className="font-medium text-gray-900 dark:text-white mb-2">Q{item.id}: {item.question}</p>
                  <p className="text-sm text-gray-600 dark:text-slate-400 mb-2"><strong>Your Answer:</strong> {item.answer}</p>
                  {item.feedback && (
                    <p className="text-sm text-blue-600 dark:text-blue-400"><strong>Feedback:</strong> {item.feedback}</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recommendation */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
            <h3 className="text-xl font-bold text-blue-900 dark:text-blue-300 mb-3">Recommendation</h3>
            <p className="text-blue-800 dark:text-blue-400">{report.recommendation}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={downloadReport}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 text-white py-4 rounded-lg font-semibold hover:from-green-700 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center space-x-2"
            >
              <Download className="w-5 h-5" />
              <span>Download Report</span>
            </button>
            <button
              onClick={() => {
                setStep('setup');
                setResumeFile(null);
                setResumeText('');
                setPosition('');
                setQuestions([]);
                setCurrentQuestionIndex(0);
                setCurrentAnswer('');
                setReport(null);
                setError('');
              }}
              className="flex-1 bg-white dark:bg-slate-800 border-2 border-blue-600 dark:border-blue-500 text-blue-600 dark:text-blue-400 py-4 rounded-lg font-semibold hover:bg-blue-50 dark:hover:bg-slate-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Start New Interview
            </button>
          </div>
        </>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 pt-24 pb-12 px-4 transition-colors duration-200">
      {step === 'setup' && renderSetup()}
      {step === 'interview' && renderInterview()}
      {step === 'report' && renderReport()}
    </div>
  );
};

export default MockInterview;
