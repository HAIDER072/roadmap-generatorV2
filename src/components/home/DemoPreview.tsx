import React, { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, RotateCcw } from 'lucide-react';

const DemoPreview: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const totalTime = 120; // 2 minutes demo

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Simulate video progress
  React.useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentTime(prev => {
        if (prev >= totalTime) {
          setIsPlaying(false);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, totalTime]);

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            See It In{' '}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Action
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Watch how Flowniq transforms a simple goal into a comprehensive, actionable roadmap
          </p>
        </div>

        {/* Demo Video Container */}
        <div className="relative max-w-5xl mx-auto">
          {/* Video Player */}
          <div className="relative bg-black rounded-3xl overflow-hidden shadow-2xl">
            {/* Video Content Area */}
            <div className="relative aspect-video bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900">
              {/* Simulated App Interface */}
              <div className="absolute inset-0 p-8 flex items-center justify-center">
                <div className="w-full max-w-4xl">
                  {/* Mock Browser Window */}
                  <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Browser Header */}
                    <div className="bg-gray-100 px-6 py-4 flex items-center space-x-3">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-red-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-400 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-400 rounded-full"></div>
                      </div>
                      <div className="flex-1 bg-white rounded-lg px-4 py-2 text-sm text-gray-600">
                        flowniq.ai/create
                      </div>
                    </div>

                    {/* App Content */}
                    <div className="p-8 h-96">
                      {currentTime < 30 && (
                        <div className="animate-fade-in">
                          <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                            Create Your AI Roadmap
                          </h3>
                          <div className="space-y-4">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Category
                              </label>
                              <div className="grid grid-cols-4 gap-3">
                                {['Kitchen Recipe', 'Travel', 'Project', 'Fitness'].map((cat, i) => (
                                  <button
                                    key={cat}
                                    className={`p-3 rounded-lg border-2 transition-all duration-300 ${
                                      i === 0 ? 'border-purple-500 bg-purple-50' : 'border-gray-200'
                                    }`}
                                  >
                                    {cat}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {currentTime >= 30 && currentTime < 60 && (
                        <div className="animate-fade-in">
                          <div className="space-y-4">
                            <label className="block text-sm font-medium text-gray-700">
                              Describe Your Goal
                            </label>
                            <div className="relative">
                              <input
                                type="text"
                                value="Learn React development from scratch"
                                readOnly
                                className="w-full p-4 border-2 border-blue-500 rounded-xl bg-blue-50"
                              />
                            </div>
                            <button className="w-full py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-xl font-semibold">
                              Generate Roadmap
                            </button>
                          </div>
                        </div>
                      )}

                      {currentTime >= 60 && currentTime < 90 && (
                        <div className="animate-fade-in">
                          <div className="text-center py-8">
                            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            </div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">
                              AI is creating your roadmap...
                            </h3>
                            <p className="text-gray-600">Analyzing your goal and generating phases</p>
                          </div>
                        </div>
                      )}

                      {currentTime >= 90 && (
                        <div className="animate-fade-in">
                          <h3 className="text-xl font-semibold text-gray-900 mb-4">
                            Your React Learning Roadmap
                          </h3>
                          <div className="space-y-3">
                            {['Foundation', 'Components & Props', 'State & Hooks', 'Advanced Patterns'].map((phase, i) => (
                              <div key={phase} className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
                                  {i + 1}
                                </div>
                                <div>
                                  <p className="font-medium text-purple-700">Phase {i + 1}: {phase}</p>
                                  <p className="text-sm text-purple-600">4 steps • Resources included</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Play Button Overlay */}
              {!isPlaying && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                  <button
                    onClick={togglePlay}
                    className="w-20 h-20 bg-white/90 rounded-full flex items-center justify-center hover:bg-white transition-all duration-300 hover:scale-110 shadow-2xl"
                  >
                    <Play className="w-8 h-8 text-gray-800 ml-1" />
                  </button>
                </div>
              )}
            </div>

            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <div className="flex items-center space-x-4">
                {/* Play/Pause */}
                <button
                  onClick={togglePlay}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-300"
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 text-white" />
                  ) : (
                    <Play className="w-5 h-5 text-white ml-0.5" />
                  )}
                </button>

                {/* Progress Bar */}
                <div className="flex-1 flex items-center space-x-3">
                  <span className="text-white text-sm font-medium">
                    {formatTime(currentTime)}
                  </span>
                  <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                      style={{ width: `${(currentTime / totalTime) * 100}%` }}
                    />
                  </div>
                  <span className="text-white text-sm font-medium">
                    {formatTime(totalTime)}
                  </span>
                </div>

                {/* Controls */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentTime(0)}
                    className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-300"
                  >
                    <RotateCcw className="w-4 h-4 text-white" />
                  </button>
                  
                  <button
                    onClick={toggleMute}
                    className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-300"
                  >
                    {isMuted ? (
                      <VolumeX className="w-4 h-4 text-white" />
                    ) : (
                      <Volume2 className="w-4 h-4 text-white" />
                    )}
                  </button>

                  <button className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-300">
                    <Maximize className="w-4 h-4 text-white" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Stats */}
          <div className="absolute -top-8 -right-8 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">2:00</div>
              <div className="text-sm text-gray-600">Demo Length</div>
            </div>
          </div>

          <div className="absolute -bottom-8 -left-8 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">4</div>
              <div className="text-sm text-gray-600">Phases Created</div>
            </div>
          </div>
        </div>

        {/* Demo Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Play className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Interactive Demo</h3>
            <p className="text-gray-600">See the complete roadmap creation process from start to finish</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <RotateCcw className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Real-time Generation</h3>
            <p className="text-gray-600">Watch AI create personalized roadmaps in real-time</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Maximize className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Full Experience</h3>
            <p className="text-gray-600">Experience the complete user journey and interface</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </section>
  );
};

export default DemoPreview;