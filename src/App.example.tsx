import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import LoginForm from './components/auth/LoginForm';
import SignupForm from './components/auth/SignupForm';
import Dashboard from './components/dashboard/Dashboard';
import CreateRoadmapPage from './pages/CreateRoadmapPage';
import RoadmapViewerPage from './pages/RoadmapViewerPage';
import { LogIn, UserPlus, ChefHat, MapPin, Briefcase, Dumbbell, Sparkles, ArrowRight, Zap, Target, Calendar, Star, Users, Globe, TrendingUp, CheckCircle, Award, Clock, Shield, Rocket, Heart, BookOpen, Lightbulb, Compass, Trophy } from 'lucide-react';

// Landing page component for non-authenticated users
const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Hero Section */}
          <div className="w-32 h-32 mx-auto mb-8 bg-white rounded-3xl flex items-center justify-center shadow-xl border border-indigo-100 overflow-hidden animate-bounce">
            <img 
              src="/chartly_logo.png" 
              alt="Flowniq Logo" 
              className="w-20 h-20 object-contain"
            />
          </div>
          <h1 className="text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-6 animate-in slide-in-from-bottom-4 duration-1000">
            Welcome to Flowniq
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto animate-in slide-in-from-bottom-4 duration-1000 delay-200">
            Transform your goals into clear, visual learning roadmaps with AI assistance
          </p>
          <div className="space-y-4 mb-12 animate-in slide-in-from-bottom-4 duration-1000 delay-300">
            <p className="text-lg text-slate-500">
              Create personalized roadmaps for learning, travel planning, project management, and fitness goals
            </p>
          </div>
          
          {/* Authentication Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6 mb-16 animate-in slide-in-from-bottom-4 duration-1000 delay-500">
            <Link
              to="/signup"
              className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-lg text-lg font-medium group"
            >
              <UserPlus className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
              <span>Get Started</span>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
            </Link>
            
            <Link
              to="/login"
              className="inline-flex items-center space-x-3 px-8 py-4 bg-white text-slate-700 rounded-2xl hover:bg-slate-50 transition-all duration-200 hover:scale-105 shadow-lg border border-slate-200 text-lg font-medium group"
            >
              <LogIn className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
              <span>Sign In</span>
            </Link>
          </div>
          
          {/* Enhanced Features Preview with Animations */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
            <div className="text-center group animate-in slide-in-from-bottom-4 duration-1000 delay-700">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-orange-400 to-red-500 rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <ChefHat className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-bold text-slate-800 mb-3 text-lg">Kitchen Recipes</h3>
              <p className="text-sm text-slate-600 leading-relaxed">Step-by-step cooking guides with ingredient lists and techniques</p>
              <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-orange-600">
                <Sparkles className="w-3 h-3" />
                <span>AI-Powered Instructions</span>
              </div>
            </div>
            
            <div className="text-center group animate-in slide-in-from-bottom-4 duration-1000 delay-800">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <MapPin className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-bold text-slate-800 mb-3 text-lg">Travel Planning</h3>
              <p className="text-sm text-slate-600 leading-relaxed">Complete trip itineraries with maps and local recommendations</p>
              <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-blue-600">
                <Calendar className="w-3 h-3" />
                <span>Interactive Maps</span>
              </div>
            </div>
            
            <div className="text-center group animate-in slide-in-from-bottom-4 duration-1000 delay-900">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-purple-400 to-indigo-500 rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Briefcase className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-bold text-slate-800 mb-3 text-lg">Project Management</h3>
              <p className="text-sm text-slate-600 leading-relaxed">Structured project roadmaps with milestones and deliverables</p>
              <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-purple-600">
                <Target className="w-3 h-3" />
                <span>Goal Tracking</span>
              </div>
            </div>
            
            <div className="text-center group animate-in slide-in-from-bottom-4 duration-1000 delay-1000">
              <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Dumbbell className="w-10 h-10 text-white" />
              </div>
              <h3 className="font-bold text-slate-800 mb-3 text-lg">Fitness Planning</h3>
              <p className="text-sm text-slate-600 leading-relaxed">Personalized workout plans with nutrition and progress tracking</p>
              <div className="mt-4 flex items-center justify-center space-x-2 text-xs text-green-600">
                <Zap className="w-3 h-3" />
                <span>Progress Tracking</span>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="mt-20 grid grid-cols-1 md:grid-cols-4 gap-8 animate-in slide-in-from-bottom-4 duration-1000 delay-1200">
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Users className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-2 animate-pulse">10K+</div>
              <div className="text-slate-600">Active Users</div>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Star className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-2 animate-pulse">50K+</div>
              <div className="text-slate-600">Roadmaps Created</div>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <Globe className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-2 animate-pulse">100+</div>
              <div className="text-slate-600">Countries</div>
            </div>
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <div className="text-3xl font-bold text-slate-800 mb-2 animate-pulse">95%</div>
              <div className="text-slate-600">Success Rate</div>
            </div>
          </div>

          {/* Why Choose Flowniq Section */}
          <div className="mt-24 animate-in slide-in-from-bottom-4 duration-1000 delay-1400">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">Why Choose Flowniq?</h2>
            <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto">
              Experience the future of goal planning with our cutting-edge AI technology
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 hover:scale-105 transition-all duration-300 group">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                  <Rocket className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">Lightning Fast</h3>
                <p className="text-slate-600 leading-relaxed">Generate comprehensive roadmaps in seconds, not hours. Our AI processes your goals instantly.</p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 hover:scale-105 transition-all duration-300 group">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-green-500 to-emerald-600 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                  <Shield className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">Secure & Private</h3>
                <p className="text-slate-600 leading-relaxed">Your data is protected with enterprise-grade security. We never share your personal information.</p>
              </div>
              
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 hover:scale-105 transition-all duration-300 group">
                <div className="w-16 h-16 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform duration-300">
                  <Heart className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">User-Friendly</h3>
                <p className="text-slate-600 leading-relaxed">Intuitive interface designed for everyone. No technical knowledge required to create amazing roadmaps.</p>
              </div>
            </div>
          </div>

          {/* Features Deep Dive */}
          <div className="mt-24 animate-in slide-in-from-bottom-4 duration-1000 delay-1500">
            <h2 className="text-4xl font-bold text-slate-800 mb-12">Powerful Features</h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              <div className="space-y-8">
                <div className="flex items-start space-x-4 group">
                  <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Lightbulb className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">AI-Powered Intelligence</h3>
                    <p className="text-slate-600">Advanced AI algorithms analyze your goals and create personalized, step-by-step roadmaps tailored to your needs.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 group">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <BookOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Rich Learning Resources</h3>
                    <p className="text-slate-600">Each step includes curated YouTube videos, articles, and interactive content to accelerate your learning.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 group">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Compass className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Interactive Navigation</h3>
                    <p className="text-slate-600">Navigate through your roadmap with intuitive controls, zoom, pan, and explore every detail of your journey.</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="flex items-start space-x-4 group">
                  <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Trophy className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Progress Tracking</h3>
                    <p className="text-slate-600">Monitor your progress with visual indicators, completion tracking, and milestone celebrations.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 group">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Clock className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Time Management</h3>
                    <p className="text-slate-600">Smart scheduling and time estimates help you plan your learning journey effectively.</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-4 group">
                  <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-rose-600 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Achievement System</h3>
                    <p className="text-slate-600">Earn badges and achievements as you complete milestones and reach your goals.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Testimonials Section */}
          <div className="mt-24 animate-in slide-in-from-bottom-4 duration-1000 delay-1600">
            <h2 className="text-4xl font-bold text-slate-800 mb-4">What Our Users Say</h2>
            <p className="text-xl text-slate-600 mb-12">Join thousands of satisfied users who've transformed their goals into reality</p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 hover:scale-105 transition-all duration-300 group">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    S
                  </div>
                  <div className="ml-4">
                    <div className="font-bold text-slate-800 text-lg">Sarah Chen</div>
                    <div className="text-sm text-slate-600">Product Manager at Google</div>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-700 italic leading-relaxed">"Flowniq transformed how I plan my learning goals. The AI-generated roadmaps are incredibly detailed and practical. I've completed 3 major skill upgrades this year!"</p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 hover:scale-105 transition-all duration-300 group">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    M
                  </div>
                  <div className="ml-4">
                    <div className="font-bold text-slate-800 text-lg">Mike Rodriguez</div>
                    <div className="text-sm text-slate-600">Travel Blogger & Photographer</div>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-700 italic leading-relaxed">"The travel planning feature is amazing! It created a perfect 10-day itinerary for my Japan trip with all the details I needed. Saved me weeks of research!"</p>
              </div>
              
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20 hover:scale-105 transition-all duration-300 group">
                <div className="flex items-center mb-6">
                  <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xl">
                    A
                  </div>
                  <div className="ml-4">
                    <div className="font-bold text-slate-800 text-lg">Alex Thompson</div>
                    <div className="text-sm text-slate-600">Certified Fitness Coach</div>
                  </div>
                </div>
                <div className="flex mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-yellow-400 fill-current" />
                  ))}
                </div>
                <p className="text-slate-700 italic leading-relaxed">"I use Flowniq to create workout plans for my clients. The visual roadmaps make it easy for them to track progress and stay motivated. Game changer!"</p>
              </div>
            </div>
          </div>

          {/* How It Works Section */}
          <div className="mt-24 animate-in slide-in-from-bottom-4 duration-1000 delay-1700">
            <h2 className="text-4xl font-bold text-slate-800 mb-12">How It Works</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <div className="text-center group">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl group-hover:scale-110 transition-transform duration-300">
                  1
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">Describe Your Goal</h3>
                <p className="text-slate-600 leading-relaxed">Simply tell us what you want to achieve. Whether it's learning a new skill, planning a trip, or starting a fitness journey.</p>
              </div>
              
              <div className="text-center group">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-2xl group-hover:scale-110 transition-transform duration-300">
                  2
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">AI Creates Your Roadmap</h3>
                <p className="text-slate-600 leading-relaxed">Our advanced AI analyzes your goal and generates a personalized, step-by-step roadmap with resources and timelines.</p>
              </div>
              
              <div className="text-center group">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-2xl group-hover:scale-110 transition-transform duration-300">
                  3
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-4">Follow & Achieve</h3>
                <p className="text-slate-600 leading-relaxed">Follow your interactive roadmap, track progress, and achieve your goals faster than ever before.</p>
              </div>
            </div>
          </div>

          {/* Final CTA Section */}
          <div className="mt-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-12 text-white animate-in slide-in-from-bottom-4 duration-1000 delay-1800">
            <h2 className="text-4xl font-bold mb-6">Ready to Transform Your Goals?</h2>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Join thousands of users who've already achieved their dreams with Flowniq. Start your journey today!
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-6">
              <Link
                to="/signup"
                className="inline-flex items-center space-x-3 px-8 py-4 bg-white text-indigo-600 rounded-2xl hover:bg-gray-100 transition-all duration-200 hover:scale-105 shadow-lg text-lg font-medium group"
              >
                <UserPlus className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" />
                <span>Start Free Today</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200" />
              </Link>
              
              <div className="flex items-center space-x-2 text-white/80">
                <CheckCircle className="w-5 h-5" />
                <span>No credit card required</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// App routes component
const AppRoutes: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <Routes>
        {/* Public routes */}
        <Route 
          path="/" 
          element={user ? <Navigate to="/dashboard" replace /> : <LandingPage />} 
        />
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" replace /> : <LoginForm />} 
        />
        <Route 
          path="/signup" 
          element={user ? <Navigate to="/dashboard" replace /> : <SignupForm />} 
        />
        
        {/* Protected routes */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/create" 
          element={
            <ProtectedRoute>
              <CreateRoadmapPage />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/roadmap" 
          element={
            <ProtectedRoute>
              <RoadmapViewerPage />
            </ProtectedRoute>
          } 
        />
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;