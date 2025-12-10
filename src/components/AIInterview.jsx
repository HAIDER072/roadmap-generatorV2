import React, { useState, useEffect, useRef } from 'react';
import { AIInterviewService, InterviewPhaseManager, ConversationManager } from '../services/aiInterviewService';
import './AIInterview.css';

/**
 * AI Interview Component
 * Handles voice-based AI interview with real-time speech recognition
 * The AI asks the candidate to introduce themselves and learns their background
 * through conversation, or can use uploaded resume for personalized questions.
 */
const AIInterview = ({ 
  jobContext = {
    position: 'Software Developer',
    skills: ['JavaScript', 'React', 'Node.js'],
    totalQuestions: 5,
    candidateName: '', // Optional - candidate's name
    candidateEmail: '', // Optional - candidate's email
  },
  onInterviewComplete 
}) => {
  // State management
  const [isInterviewStarted, setIsInterviewStarted] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAITyping, setIsAITyping] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [messages, setMessages] = useState([]);
  const [error, setError] = useState(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const lastTranscriptTimeRef = useRef(Date.now());

  // Managers
  const phaseManagerRef = useRef(new InterviewPhaseManager(jobContext.totalQuestions));
  const conversationManagerRef = useRef(new ConversationManager());
  const recognitionRef = useRef(null);
  const synthRef = useRef(window.speechSynthesis);

  // Speech recognition setup
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setTranscript(prev => prev + finalTranscript);
          lastTranscriptTimeRef.current = Date.now();
        } else {
          setTranscript(prev => prev + ' ' + interimTranscript);
          lastTranscriptTimeRef.current = Date.now();
        }
      };

      recognitionRef.current.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setError(`Speech recognition error: ${event.error}`);
        }
      };

      recognitionRef.current.onend = () => {
        if (isListening && !isMuted) {
          // Restart if still listening
          try {
            recognitionRef.current.start();
          } catch (err) {
            console.error('Error restarting recognition:', err);
          }
        }
      };
    } else {
      setError('Speech recognition not supported in this browser. Please use Chrome or Edge.');
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening, isMuted]);

  // Start interview
  const startInterview = async () => {
    try {
      setIsAITyping(true);
      const introResponse = await AIInterviewService.generateIntroduction(jobContext);
      
      if (introResponse.success) {
        const aiMessage = {
          role: 'assistant',
          content: introResponse.message,
          timestamp: new Date(),
        };
        
        setMessages([aiMessage]);
        conversationManagerRef.current.addMessage('assistant', introResponse.message);
        phaseManagerRef.current.updatePhase(introResponse.phase);
        
        // Speak the introduction
        speakText(introResponse.message);
        
        setIsInterviewStarted(true);
      }
    } catch (error) {
      console.error('Error starting interview:', error);
      setError('Failed to start interview. Please try again.');
    } finally {
      setIsAITyping(false);
    }
  };

  // Handle user response submission
  const handleSubmitResponse = async () => {
    if (!transcript.trim()) return;
    
    // Stop AI from speaking if it's still talking
    if (isSpeaking) {
      synthRef.current.cancel();
      setIsSpeaking(false);
    }
    
    // Stop listening while processing
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    const userMessage = {
      role: 'user',
      content: transcript,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    conversationManagerRef.current.addMessage('user', transcript);
    setTranscript('');
    setIsAITyping(true);

    try {
      const currentPhase = phaseManagerRef.current.getCurrentPhase();
      const conversationHistory = conversationManagerRef.current.getMessages();
      
      const aiResponse = await AIInterviewService.generateResponse(
        conversationHistory,
        transcript,
        jobContext,
        currentPhase
      );

      if (aiResponse.success) {
        // Add feedback and next question
        const feedbackMessage = {
          role: 'assistant',
          content: aiResponse.feedback,
          timestamp: new Date(),
          isFeedback: true,
        };

        setMessages(prev => [...prev, feedbackMessage]);
        conversationManagerRef.current.addMessage('assistant', aiResponse.feedback);

        if (aiResponse.nextQuestion) {
          const questionMessage = {
            role: 'assistant',
            content: aiResponse.nextQuestion,
            timestamp: new Date(),
          };

          setMessages(prev => [...prev, questionMessage]);
          conversationManagerRef.current.addMessage('assistant', aiResponse.nextQuestion);
          
          // Speak feedback and next question
          speakText(aiResponse.feedback + ' ' + aiResponse.nextQuestion);
        } else {
          // Interview complete
          speakText(aiResponse.feedback);
          
          if (onInterviewComplete) {
            onInterviewComplete({
              messages: conversationManagerRef.current.getMessages(),
              phase: aiResponse.phase,
            });
          }
        }

        // Update phase
        if (aiResponse.phase) {
          phaseManagerRef.current.updatePhase(aiResponse.phase);
        }
      }
    } catch (error) {
      console.error('Error generating AI response:', error);
      setError('Failed to generate response. Please try again.');
    } finally {
      setIsAITyping(false);
    }
  };

  // Text-to-speech with female voice selection
  const speakText = (text) => {
    if (isMuted || isSpeaking) return;

    // Cancel any ongoing speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Select female voice only
    const voices = synthRef.current.getVoices();
    const femaleVoice = voices.find(voice => 
      voice.name.toLowerCase().includes('female') || 
      voice.name.toLowerCase().includes('zira') ||
      voice.name.toLowerCase().includes('samantha') ||
      (voice.name.toLowerCase().includes('google') && voice.name.toLowerCase().includes('us') && !voice.name.toLowerCase().includes('male'))
    ) || voices.find(voice => voice.lang === 'en-US' && !voice.name.toLowerCase().includes('male'));
    
    if (femaleVoice) {
      utterance.voice = femaleVoice;
      console.log('Using voice:', femaleVoice.name);
    }
    
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };
  
  // Load voices on component mount
  useEffect(() => {
    const loadVoices = () => {
      const voices = synthRef.current.getVoices();
      console.log('Available voices:', voices.map(v => v.name));
    };
    
    if (synthRef.current.getVoices().length > 0) {
      loadVoices();
    } else {
      synthRef.current.onvoiceschanged = loadVoices;
    }
  }, []);

  // Toggle listening
  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current?.start();
        setIsListening(true);
      } catch (err) {
        console.error('Error starting recognition:', err);
      }
    }
  };

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (!isMuted) {
      synthRef.current.cancel();
    }
  };

  // Get progress
  const progress = phaseManagerRef.current.getProgress();

  return (
    <div className="ai-interview-container">
      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {!isInterviewStarted ? (
        <div className="interview-start-screen">
          <h1>AI Interview</h1>
          <div className="interview-details">
            <h2>Position: {jobContext.position}</h2>
            <p>Total Questions: {jobContext.totalQuestions}</p>
            <p>Skills: {jobContext.skills.join(', ')}</p>
          </div>
          <button className="start-button" onClick={startInterview}>
            Start Interview
          </button>
        </div>
      ) : (
        <div className="interview-screen">
          {/* Progress bar */}
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${progress.percentage}%` }}>
              {progress.percentage}%
            </div>
          </div>

          <div className="interview-main-layout">
            {/* Left side - Messages */}
            <div className="messages-section">
              <div className="messages-container">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`message ${msg.role} ${msg.isFeedback ? 'feedback' : ''}`}
                  >
                    <div className="message-header">
                      <span className="message-role">
                        {msg.role === 'assistant' ? '🤖 AI Interviewer' : '👤 You'}
                      </span>
                      <span className="message-time">
                        {msg.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="message-content">{msg.content}</div>
                  </div>
                ))}
                
                {isAITyping && (
                  <div className="message assistant typing">
                    <div className="typing-indicator">
                      <span></span>
                      <span></span>
                      <span></span>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Transcript input */}
              <div className="transcript-input-section">
                <textarea
                  className="transcript-input"
                  value={transcript}
                  onChange={(e) => setTranscript(e.target.value)}
                  placeholder="Or type your response here..."
                  rows={3}
                />
              </div>

              {/* Controls */}
              <div className="controls">
                <button
                  className={`control-button ${isListening ? 'active' : ''}`}
                  onClick={toggleListening}
                  disabled={isAITyping || isSpeaking}
                >
                  {isListening ? '🎤 Stop Listening' : '🎤 Start Listening'}
                </button>
                
                <button
                  className={`control-button ${isMuted ? 'active' : ''}`}
                  onClick={toggleMute}
                >
                  {isMuted ? '🔇 Unmute' : '🔊 Mute'}
                </button>
                
                <button
                  className="control-button submit"
                  onClick={handleSubmitResponse}
                  disabled={!transcript.trim() || isAITyping}
                >
                  Submit Response
                </button>
              </div>
            </div>
            
            {/* Right side - Live Caption Sidebar */}
            <div className="live-caption-sidebar">
              <div className="sidebar-header">
                <h3>🎤 Live Caption</h3>
                {isListening && <span className="listening-badge">Listening...</span>}
                {isSpeaking && <span className="speaking-badge">AI Speaking...</span>}
              </div>
              <div className="live-caption-display">
                {transcript || 'Start speaking to see live captions here...'}
              </div>
              <div className="caption-info">
                <small>ℹ️ Your speech appears here in real-time</small>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIInterview;
