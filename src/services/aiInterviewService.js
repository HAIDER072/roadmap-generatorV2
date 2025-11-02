/**
 * AI Interview Service
 * Handles AI interview generation and conversation management
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export class AIInterviewService {
  /**
   * Generate interview introduction
   */
  static async generateIntroduction(jobContext) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-interview/introduction`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobContext }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate introduction: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating introduction:', error);
      
      // Fallback introduction
      return {
        success: true,
        message: `Hello! I'm your AI interviewer and it's wonderful to connect with you today. I'll be conducting your interview for ${jobContext?.position || 'this position'} and I'm genuinely excited to learn about your professional journey. We have several thoughtfully structured questions to explore your qualifications, and I'll provide feedback throughout our conversation. To start, could you please introduce yourself and share what motivates you in your professional life?`,
        phase: {
          current: 'introduction',
          questionIndex: 0,
          totalQuestions: jobContext?.totalQuestions || 5,
        }
      };
    }
  }

  /**
   * Generate AI response during interview
   */
  static async generateResponse(conversationHistory, userResponse, jobContext, currentPhase) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-interview/response`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationHistory,
          userResponse,
          jobContext,
          currentPhase,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to generate response: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error generating AI response:', error);
      
      // Fallback response
      const isClosing = currentPhase?.questionIndex >= (jobContext?.totalQuestions || 5);
      
      return {
        success: true,
        feedback: isClosing
          ? `Thank you so much for taking the time to discuss the ${jobContext?.position || 'position'} with me today. Your experience and insights have been truly valuable, and I appreciate your thoughtful responses throughout our conversation. This concludes our interview. Best of luck!`
          : 'Thank you for sharing that insight with me.',
        nextQuestion: isClosing
          ? ''
          : `Can you describe a challenging situation you faced in your career and how you approached solving it?`,
        phase: {
          current: isClosing ? 'closing' : 'questions',
          questionIndex: (currentPhase?.questionIndex || 0) + 1,
          totalQuestions: jobContext?.totalQuestions || 5,
        }
      };
    }
  }

  /**
   * Save interview conversation
   */
  static async saveConversation(interviewId, messages) {
    try {
      const response = await fetch(`${API_BASE_URL}/api/ai-interview/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          interviewId,
          messages,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to save conversation: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error saving conversation:', error);
      return { success: false, error: error.message };
    }
  }
}

/**
 * Interview Phase Manager
 */
export class InterviewPhaseManager {
  constructor(totalQuestions = 5) {
    this.totalQuestions = totalQuestions;
    this.currentPhase = {
      current: 'introduction',
      questionIndex: 0,
      totalQuestions: totalQuestions,
    };
  }

  getCurrentPhase() {
    return this.currentPhase;
  }

  updatePhase(newPhase) {
    this.currentPhase = newPhase;
  }

  isInterviewComplete() {
    return this.currentPhase.current === 'closing';
  }

  getProgress() {
    return {
      current: this.currentPhase.questionIndex,
      total: this.totalQuestions,
      percentage: Math.round((this.currentPhase.questionIndex / this.totalQuestions) * 100),
    };
  }
}

/**
 * Conversation Manager
 */
export class ConversationManager {
  constructor() {
    this.messages = [];
  }

  addMessage(role, content, timestamp = new Date()) {
    this.messages.push({
      role,
      content,
      timestamp,
    });
  }

  getMessages() {
    return this.messages;
  }

  getLastMessage() {
    return this.messages[this.messages.length - 1];
  }

  clear() {
    this.messages = [];
  }

  exportToJSON() {
    return JSON.stringify({
      messages: this.messages,
      exportedAt: new Date().toISOString(),
    }, null, 2);
  }
}
