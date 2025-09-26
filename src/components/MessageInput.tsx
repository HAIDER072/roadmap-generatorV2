import React, { useState } from 'react';
import { Send, ChefHat, MapPin, Briefcase, Dumbbell, BookOpen, ChevronDown, ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { Category } from '../types';

interface MessageInputProps {
  onSendMessage: (text: string, category: Category, travelData?: TravelFormData) => void;
  isGenerating: boolean;
  selectedCategory: Category | null;
}

interface TravelFormData {
  destination: string;
  startingLocation: string;
  duration: number;
  travelers: number;
  budget: number;
}

const categories = [
  { value: 'kitchen_recipe' as Category, label: 'Kitchen Recipe', icon: ChefHat, color: 'from-orange-500 to-red-500' },
  { value: 'travel_planner' as Category, label: 'Travel Planner', icon: MapPin, color: 'from-blue-500 to-cyan-500' },
  { value: 'project' as Category, label: 'Project Planner', icon: Briefcase, color: 'from-indigo-500 to-purple-500' },
  { value: 'fitness_planner' as Category, label: 'Fitness Planner', icon: Dumbbell, color: 'from-green-500 to-emerald-500' },
  { value: 'subject' as Category, label: 'Subject Learning', icon: BookOpen, color: 'from-yellow-500 to-amber-500' },
];

const travelQuestions = [
  { key: 'destination', question: 'What is your destination?', type: 'text', placeholder: 'e.g., Paris, France' },
  { key: 'startingLocation', question: 'What is your starting location?', type: 'text', placeholder: 'e.g., New York, USA' },
  { key: 'duration', question: 'What is the duration of your journey?', type: 'number', placeholder: '7', suffix: 'days', max: 15, min: 1 },
  { key: 'travelers', question: 'How many travelers?', type: 'number', placeholder: '2', min: 1 },
  { key: 'budget', question: 'What is your budget?', type: 'number', placeholder: '2000', prefix: '$', min: 1 },
];

const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isGenerating,
  selectedCategory
}) => {
  const [inputText, setInputText] = useState('');
  const [currentCategory, setCurrentCategory] = useState<Category | null>(selectedCategory);
  const [showDropdown, setShowDropdown] = useState(false);
  
  // Travel form states
  const [showTravelForm, setShowTravelForm] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [travelData, setTravelData] = useState<TravelFormData>({
    destination: '',
    startingLocation: '',
    duration: 0,
    travelers: 0,
    budget: 0
  });
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim() && !isGenerating && currentCategory) {
      if (currentCategory === 'travel_planner') {
        // Start travel questionnaire
        setShowTravelForm(true);
        setCurrentQuestionIndex(0);
        setCurrentAnswer('');
        setValidationError(null);
      } else {
        // Regular submission for other categories
        onSendMessage(inputText.trim(), currentCategory);
        setInputText('');
      }
    }
  };

  const handleTravelAnswer = () => {
    if (!currentAnswer.trim()) return;

    const currentQuestion = travelQuestions[currentQuestionIndex];
    setValidationError(null);

    // Validation for number inputs
    if (currentQuestion.type === 'number') {
      const numValue = Number(currentAnswer);
      
      // Check if it's a valid number
      if (isNaN(numValue) || numValue <= 0) {
        setValidationError('Please enter a valid positive number');
        return;
      }

      // Check min/max constraints
      if (currentQuestion.min !== undefined && numValue < currentQuestion.min) {
        setValidationError(`Minimum value is ${currentQuestion.min}`);
        return;
      }

      if (currentQuestion.max !== undefined && numValue > currentQuestion.max) {
        if (currentQuestion.key === 'duration') {
          setValidationError(`Maximum duration is ${currentQuestion.max} days`);
        } else {
          setValidationError(`Maximum value is ${currentQuestion.max}`);
        }
        return;
      }
    }

    const value = currentQuestion.type === 'number' ? Number(currentAnswer) : currentAnswer;
    
    setTravelData(prev => ({
      ...prev,
      [currentQuestion.key]: value
    }));

    if (currentQuestionIndex < travelQuestions.length - 1) {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentAnswer('');
      setValidationError(null);
    } else {
      // All questions answered, generate roadmap
      const finalTravelData = {
        ...travelData,
        [currentQuestion.key]: value
      };
      
      onSendMessage(inputText.trim(), 'travel_planner', finalTravelData);
      
      // Reset form
      setShowTravelForm(false);
      setCurrentQuestionIndex(0);
      setTravelData({
        destination: '',
        startingLocation: '',
        duration: 0,
        travelers: 0,
        budget: 0
      });
      setCurrentAnswer('');
      setValidationError(null);
      setInputText('');
    }
  };

  const handleTravelBack = () => {
    setValidationError(null);
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      const prevQuestion = travelQuestions[currentQuestionIndex - 1];
      setCurrentAnswer(String(travelData[prevQuestion.key as keyof TravelFormData]));
    } else {
      // Go back to main form
      setShowTravelForm(false);
      setCurrentQuestionIndex(0);
      setCurrentAnswer('');
    }
  };

  const selectedCategoryData = categories.find(cat => cat.value === currentCategory);
  const currentQuestion = travelQuestions[currentQuestionIndex];

  if (showTravelForm) {
    return (
      <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-6 min-w-[600px] max-w-4xl">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-slate-600 mb-2">
            <span>Travel Planning</span>
            <span>{currentQuestionIndex + 1} of {travelQuestions.length}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / travelQuestions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Question */}
        <div className="text-center mb-6">
          <h3 className="text-2xl font-bold text-slate-800 mb-2">
            {currentQuestion.question}
          </h3>
          <p className="text-slate-600">
            Step {currentQuestionIndex + 1} of {travelQuestions.length}
          </p>
        </div>

        {/* Validation Error */}
        {validationError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
            {validationError}
          </div>
        )}

        {/* Answer Input */}
        <div className="flex items-center space-x-3 mb-4">
          {currentQuestionIndex > 0 && (
            <button
              type="button"
              onClick={handleTravelBack}
              className="px-4 py-3 bg-slate-200 text-slate-600 rounded-xl hover:bg-slate-300 transition-all duration-200 flex items-center space-x-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back</span>
            </button>
          )}
          
          <div className="flex-1 flex items-center space-x-2">
            {currentQuestion.prefix && (
              <span className="text-lg font-semibold text-slate-600">{currentQuestion.prefix}</span>
            )}
            <input
              type={currentQuestion.type}
              value={currentAnswer}
              onChange={(e) => {
                setCurrentAnswer(e.target.value);
                setValidationError(null); // Clear error when user types
              }}
              placeholder={currentQuestion.placeholder}
              min={currentQuestion.min}
              max={currentQuestion.max}
              className={`flex-1 px-6 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 text-lg ${
                validationError ? 'border-red-300 bg-red-50' : 'border-slate-300'
              }`}
              autoFocus
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  handleTravelAnswer();
                }
              }}
            />
            {currentQuestion.suffix && (
              <span className="text-lg font-semibold text-slate-600">
                {currentQuestion.suffix === 'days' && Number(currentAnswer) === 1 ? 'day' : currentQuestion.suffix}
              </span>
            )}
          </div>

          <button
            onClick={handleTravelAnswer}
            disabled={!currentAnswer.trim()}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center space-x-2"
          >
            <span>{currentQuestionIndex === travelQuestions.length - 1 ? 'Generate' : 'Next'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Helper text for duration */}
        {currentQuestion.key === 'duration' && (
          <div className="text-center text-sm text-slate-500 mb-2">
            Duration must be between 1 and 15 days
          </div>
        )}

        {/* Cancel Button */}
        <div className="text-center">
          <button
            onClick={() => {
              setShowTravelForm(false);
              setCurrentQuestionIndex(0);
              setCurrentAnswer('');
              setValidationError(null);
            }}
            className="text-slate-500 hover:text-slate-700 text-sm transition-colors duration-200"
          >
            Cancel and go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/20 p-6 min-w-[600px] max-w-4xl">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main Input with Category Button */}
        <div className="flex items-center space-x-3">
          {/* Category Selector - IMPROVED: Icon-based design */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowDropdown(!showDropdown)}
              className={`flex items-center space-x-2 px-4 py-3 rounded-xl transition-all duration-200 hover:scale-105 shadow-lg ${
                currentCategory 
                  ? `bg-gradient-to-r ${selectedCategoryData?.color} text-white`
                  : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
              }`}
              title={selectedCategoryData?.label || 'Select Category'}
            >
              {selectedCategoryData ? (
                <>
                  <selectedCategoryData.icon className="w-5 h-5" />
                  <span className="font-medium whitespace-nowrap">
                    {selectedCategoryData.label}
                  </span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span className="font-medium whitespace-nowrap">
                    Category
                  </span>
                </>
              )}
              <div className={`transform transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}>
                <ChevronDown className="w-4 h-4" />
              </div>
            </button>

            {showDropdown && (
              <div className="absolute bottom-full left-0 mb-2 bg-white border border-slate-200 rounded-xl shadow-xl z-10 overflow-hidden min-w-[200px]">
                {categories.map((category) => (
                  <button
                    key={category.value}
                    type="button"
                    onClick={() => {
                      setCurrentCategory(category.value);
                      setShowDropdown(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 hover:bg-slate-50 transition-colors duration-200 ${
                      currentCategory === category.value ? 'bg-slate-50' : ''
                    }`}
                  >
                    <category.icon className="w-5 h-5 text-slate-600" />
                    <span className="text-slate-800 font-medium">{category.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Message Input */}
          <div className="flex-1 flex space-x-3">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={
                currentCategory === 'travel_planner' 
                  ? "Describe your travel goals"
                  : "Describe your Query"
              }
              className="flex-1 px-6 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200 text-lg"
              disabled={isGenerating}
            />
            {/* IMPROVED: Smaller generate button with only icon */}
            <button
              type="submit"
              disabled={!inputText.trim() || isGenerating || !currentCategory}
              className="px-4 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-105 shadow-lg flex items-center justify-center"
              title="Generate"
            >
              {isGenerating ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Helper Text */}
        <p className="text-sm text-slate-600 text-center">
          {!currentCategory 
            ? 'Please select a category first, then describe your goal to generate a personalized roadmap'
            : currentCategory === 'travel_planner'
            ? 'Describe your travel goals, then we\'ll ask a few questions to create your perfect itinerary'
            : 'Describe your goal to generate a personalized roadmap'
          }
        </p>
      </form>
    </div>
  );
};

export default MessageInput;