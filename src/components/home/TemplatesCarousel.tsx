import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Play, ExternalLink } from 'lucide-react';

const TemplatesCarousel: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const templates = [
    {
      id: 1,
      title: 'Learn React Development',
      category: 'Learning',
      description: 'Master React from basics to advanced concepts in 12 weeks',
      phases: ['Foundation', 'Components', 'State Management', 'Advanced Patterns'],
      color: 'from-blue-500 to-cyan-500',
      image: '/api/placeholder/400/300',
      stats: { steps: 48, duration: '12 weeks', difficulty: 'Intermediate' }
    },
    {
      id: 2,
      title: 'Japan Travel Adventure',
      category: 'Travel',
      description: 'Complete 14-day journey through Tokyo, Kyoto, and Osaka',
      phases: ['Tokyo Exploration', 'Cultural Kyoto', 'Modern Osaka', 'Mount Fuji'],
      color: 'from-pink-500 to-rose-500',
      image: '/api/placeholder/400/300',
      stats: { steps: 56, duration: '14 days', difficulty: 'Easy' }
    },
    {
      id: 3,
      title: 'SaaS Product Launch',
      category: 'Project',
      description: 'Build and launch your SaaS product from idea to market',
      phases: ['Research & Planning', 'MVP Development', 'Testing & Feedback', 'Launch & Scale'],
      color: 'from-purple-500 to-indigo-500',
      image: '/api/placeholder/400/300',
      stats: { steps: 72, duration: '6 months', difficulty: 'Advanced' }
    },
    {
      id: 4,
      title: 'Fitness Transformation',
      category: 'Fitness',
      description: 'Complete body transformation with nutrition and exercise',
      phases: ['Assessment', 'Foundation Building', 'Strength Training', 'Maintenance'],
      color: 'from-green-500 to-emerald-500',
      image: '/api/placeholder/400/300',
      stats: { steps: 36, duration: '16 weeks', difficulty: 'Beginner' }
    },
    {
      id: 5,
      title: 'Master Python Programming',
      category: 'Learning',
      description: 'Comprehensive Python course from beginner to expert level',
      phases: ['Basics', 'Data Structures', 'OOP', 'Advanced Topics'],
      color: 'from-yellow-500 to-orange-500',
      image: '/api/placeholder/400/300',
      stats: { steps: 64, duration: '20 weeks', difficulty: 'Beginner' }
    },
    {
      id: 6,
      title: 'European Backpacking',
      category: 'Travel',
      description: 'Epic 30-day backpacking adventure across 8 European countries',
      phases: ['Western Europe', 'Central Europe', 'Eastern Europe', 'Scandinavia'],
      color: 'from-teal-500 to-blue-500',
      image: '/api/placeholder/400/300',
      stats: { steps: 120, duration: '30 days', difficulty: 'Intermediate' }
    }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % Math.ceil(templates.length / 3));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + Math.ceil(templates.length / 3)) % Math.ceil(templates.length / 3));
  };

  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner': return 'text-green-600 bg-green-100';
      case 'Intermediate': return 'text-yellow-600 bg-yellow-100';
      case 'Advanced': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Popular{' '}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Templates
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Get inspired by these successful roadmaps created by our community
          </p>
        </div>

        {/* Carousel Container */}
        <div 
          className="relative"
          onMouseEnter={() => setIsAutoPlaying(false)}
          onMouseLeave={() => setIsAutoPlaying(true)}
        >
          {/* Navigation Buttons */}
          <button
            onClick={prevSlide}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:shadow-xl transition-all duration-300 hover:scale-110"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600" />
          </button>

          <button
            onClick={nextSlide}
            className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-12 h-12 bg-white rounded-full shadow-lg border border-gray-200 flex items-center justify-center hover:shadow-xl transition-all duration-300 hover:scale-110"
          >
            <ChevronRight className="w-6 h-6 text-gray-600" />
          </button>

          {/* Carousel Content */}
          <div className="overflow-hidden mx-16">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {Array.from({ length: Math.ceil(templates.length / 3) }).map((_, slideIndex) => (
                <div key={slideIndex} className="w-full flex-shrink-0">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {templates.slice(slideIndex * 3, slideIndex * 3 + 3).map((template, index) => (
                      <div
                        key={template.id}
                        className="group bg-white rounded-3xl shadow-lg border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:scale-105"
                      >
                        {/* Template Image */}
                        <div className="relative h-48 overflow-hidden">
                          <div 
                            className={`absolute inset-0 bg-gradient-to-br ${template.color} opacity-90`}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="text-center text-white">
                              <h3 className="text-2xl font-bold mb-2">{template.title}</h3>
                              <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium">
                                {template.category}
                              </span>
                            </div>
                          </div>
                          
                          {/* Play Button Overlay */}
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <button className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-colors duration-300">
                              <Play className="w-6 h-6 text-gray-800 ml-1" />
                            </button>
                          </div>
                        </div>

                        {/* Template Content */}
                        <div className="p-6">
                          <p className="text-gray-600 mb-4 leading-relaxed">
                            {template.description}
                          </p>

                          {/* Phases */}
                          <div className="mb-4">
                            <h4 className="text-sm font-semibold text-gray-800 mb-2">Phases:</h4>
                            <div className="flex flex-wrap gap-2">
                              {template.phases.map((phase, phaseIndex) => (
                                <span
                                  key={phaseIndex}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium"
                                >
                                  {phase}
                                </span>
                              ))}
                            </div>
                          </div>

                          {/* Stats */}
                          <div className="grid grid-cols-3 gap-4 mb-4 text-center">
                            <div>
                              <div className="text-lg font-bold text-gray-900">{template.stats.steps}</div>
                              <div className="text-xs text-gray-500">Steps</div>
                            </div>
                            <div>
                              <div className="text-lg font-bold text-gray-900">{template.stats.duration}</div>
                              <div className="text-xs text-gray-500">Duration</div>
                            </div>
                            <div>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(template.stats.difficulty)}`}>
                                {template.stats.difficulty}
                              </span>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex space-x-3">
                            <button className={`flex-1 py-2 px-4 bg-gradient-to-r ${template.color} text-white rounded-xl font-medium text-sm hover:shadow-lg transition-all duration-300 hover:scale-105`}>
                              Use Template
                            </button>
                            <button className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors duration-300">
                              <ExternalLink className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="flex justify-center mt-8 space-x-2">
          {Array.from({ length: Math.ceil(templates.length / 3) }).map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                currentSlide === index
                  ? 'bg-purple-500 scale-125'
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-gray-600 mb-6">
            Can't find what you're looking for? Create your own custom roadmap!
          </p>
          <Link 
            to="/signup" 
            className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
            Create Custom Roadmap
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TemplatesCarousel;