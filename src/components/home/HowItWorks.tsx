import React, { useState, useEffect } from 'react';
import { ChevronRight, Sparkles, Target, MapPin, CheckCircle } from 'lucide-react';

const HowItWorks: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [typedText, setTypedText] = useState('');

  const steps = [
    {
      id: 1,
      title: 'Select Category',
      description: 'Choose from Kitchen Recipe, Travel, Project, or Fitness planning',
      icon: Target,
      color: 'from-purple-500 to-pink-500'
    },
    {
      id: 2,
      title: 'Enter Your Goal',
      description: 'Describe what you want to achieve in natural language',
      icon: Sparkles,
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 3,
      title: 'AI Generates Roadmap',
      description: 'Our AI creates a personalized step-by-step roadmap',
      icon: MapPin,
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 4,
      title: 'Follow & Achieve',
      description: 'Track progress and access resources for each step',
      icon: CheckCircle,
      color: 'from-orange-500 to-red-500'
    }
  ];

  const samplePrompts = [
    "Learn React development from scratch",
    "Plan a 7-day trip to Japan",
    "How to cook Paneer Masala",
    "Get fit and lose 20 pounds"
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeStep === 1) {
      setIsTyping(true);
      setTypedText('');
      
      const prompt = samplePrompts[Math.floor(Math.random() * samplePrompts.length)];
      let currentIndex = 0;
      
      const typeInterval = setInterval(() => {
        if (currentIndex <= prompt.length) {
          setTypedText(prompt.slice(0, currentIndex));
          currentIndex++;
        } else {
          setIsTyping(false);
          clearInterval(typeInterval);
        }
      }, 100);

      return () => clearInterval(typeInterval);
    }
  }, [activeStep]);

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            How It{' '}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Works
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Transform your goals into actionable roadmaps in just four simple steps
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Interactive Demo */}
          <div className="relative">
            <div className="bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
              {/* Demo Header */}
              <div className="flex items-center space-x-3 mb-8">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                </div>
                <span className="text-gray-500 text-sm">Flowniq AI Roadmap Generator</span>
              </div>

              {/* Step 1: Category Selection */}
              <div className={`transition-all duration-500 ${activeStep === 0 ? 'opacity-100' : 'opacity-30'}`}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Select a Category</h3>
                <div className="grid grid-cols-2 gap-3">
                  {['Kitchen Recipe', 'Travel', 'Project', 'Fitness'].map((category, index) => (
                    <button
                      key={category}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 ${
                        index === 0 && activeStep === 0
                          ? 'border-purple-500 bg-purple-50 text-purple-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Goal Input */}
              <div className={`transition-all duration-500 mt-6 ${activeStep === 1 ? 'opacity-100' : 'opacity-30'}`}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Describe Your Goal</h3>
                <div className="relative">
                  <input
                    type="text"
                    value={typedText}
                    readOnly
                    className="w-full p-4 border-2 border-blue-500 rounded-xl focus:outline-none bg-blue-50"
                    placeholder="Enter your goal..."
                  />
                  {isTyping && (
                    <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                      <div className="w-0.5 h-5 bg-blue-500 animate-pulse"></div>
                    </div>
                  )}
                </div>
              </div>

              {/* Step 3: AI Processing */}
              <div className={`transition-all duration-500 mt-6 ${activeStep === 2 ? 'opacity-100' : 'opacity-30'}`}>
                <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-xl border-2 border-green-500">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white animate-spin" />
                  </div>
                  <div>
                    <p className="font-semibold text-green-700">AI is generating your roadmap...</p>
                    <p className="text-sm text-green-600">Analyzing your goal and creating phases</p>
                  </div>
                </div>
              </div>

              {/* Step 4: Generated Roadmap */}
              <div className={`transition-all duration-500 mt-6 ${activeStep === 3 ? 'opacity-100' : 'opacity-30'}`}>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Roadmap is Ready!</h3>
                <div className="space-y-3">
                  {['Foundation', 'Development', 'Mastery'].map((phase, index) => (
                    <div key={phase} className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg border border-orange-200">
                      <div className="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-orange-700">Phase {index + 1}: {phase}</p>
                        <p className="text-sm text-orange-600">4 steps • Resources included</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="absolute -top-6 -right-6 w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg animate-bounce">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
          </div>

          {/* Steps List */}
          <div className="space-y-8">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isActive = activeStep === index;
              
              return (
                <div
                  key={step.id}
                  className={`flex items-start space-x-6 transition-all duration-500 ${
                    isActive ? 'scale-105' : 'scale-100'
                  }`}
                >
                  <div className={`relative flex-shrink-0 w-16 h-16 rounded-2xl bg-gradient-to-r ${step.color} flex items-center justify-center shadow-lg transition-all duration-500 ${
                    isActive ? 'shadow-2xl scale-110' : ''
                  }`}>
                    <Icon className="w-8 h-8 text-white" />
                    {isActive && (
                      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${step.color} animate-ping opacity-75`}></div>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className={`text-xl font-bold transition-colors duration-300 ${
                        isActive ? 'text-gray-900' : 'text-gray-700'
                      }`}>
                        {step.title}
                      </h3>
                      {isActive && (
                        <ChevronRight className="w-5 h-5 text-purple-500 animate-pulse" />
                      )}
                    </div>
                    <p className={`text-lg transition-colors duration-300 ${
                      isActive ? 'text-gray-600' : 'text-gray-500'
                    }`}>
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="flex justify-center mt-16">
          <div className="flex space-x-3">
            {steps.map((_, index) => (
              <button
                key={index}
                onClick={() => setActiveStep(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  activeStep === index
                    ? 'bg-purple-500 scale-125'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;