import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, Zap, Target, CheckCircle } from 'lucide-react';

const CallToActionBanner: React.FC = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-40 right-32 w-24 h-24 bg-blue-500/20 rounded-full blur-xl animate-pulse animation-delay-1000"></div>
        <div className="absolute bottom-32 left-1/3 w-40 h-40 bg-pink-500/20 rounded-full blur-xl animate-pulse animation-delay-2000"></div>
        <div className="absolute bottom-20 right-20 w-28 h-28 bg-cyan-500/20 rounded-full blur-xl animate-pulse animation-delay-3000"></div>
      </div>

      {/* Floating Icons */}
      <div className="absolute top-16 left-16 animate-float">
        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-2xl">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
      </div>
      <div className="absolute top-32 right-24 animate-float-delayed">
        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-2xl">
          <Zap className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="absolute bottom-24 left-24 animate-float">
        <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-2xl">
          <Target className="w-7 h-7 text-white" />
        </div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Main Headline */}
        <div className="mb-12">
          <h2 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
            Ready to Transform
            <br />
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-gradient-x">
              Your Goals?
            </span>
          </h2>
          <p className="text-xl sm:text-2xl text-blue-100 max-w-3xl mx-auto leading-relaxed">
            Join thousands of users who've already achieved their dreams with AI-powered roadmaps. 
            Start your journey today and see the difference.
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-16">
          <div className="text-center">
            <div className="text-4xl sm:text-5xl font-bold text-white mb-2">50K+</div>
            <div className="text-blue-200">Roadmaps Created</div>
          </div>
          <div className="text-center">
            <div className="text-4xl sm:text-5xl font-bold text-white mb-2">95%</div>
            <div className="text-blue-200">Success Rate</div>
          </div>
          <div className="text-center">
            <div className="text-4xl sm:text-5xl font-bold text-white mb-2">10K+</div>
            <div className="text-blue-200">Happy Users</div>
          </div>
        </div>

        {/* Benefits List */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
          {[
            'AI-powered personalized roadmaps',
            'Visual progress tracking',
            'Rich learning resources',
            'Team collaboration features',
            'Multiple export formats',
            'Seamless integrations'
          ].map((benefit, index) => (
            <div key={index} className="flex items-center space-x-3 text-left">
              <div className="w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full flex items-center justify-center flex-shrink-0">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <span className="text-blue-100 text-lg">{benefit}</span>
            </div>
          ))}
        </div>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-12">
          <Link
            to="/signup"
            className="group relative px-10 py-5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-2xl font-bold text-xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-300 hover:scale-105 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-pink-600 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative flex items-center space-x-3">
              <span>Start Creating Now</span>
              <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform duration-300" />
            </div>
          </Link>

          <Link
            to="/demo"
            className="group flex items-center space-x-3 px-10 py-5 bg-white/10 text-white rounded-2xl font-bold text-xl border border-white/20 hover:bg-white/20 transition-all duration-300 hover:scale-105 backdrop-blur-md"
          >
            <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span>Watch Demo</span>
          </Link>
        </div>

        {/* Trust Indicators */}
        <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-8 text-blue-200">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span>No credit card required</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span>14-day free trial</span>
          </div>
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span>Cancel anytime</span>
          </div>
        </div>

        {/* Social Proof */}
        <div className="mt-16 pt-16 border-t border-white/20">
          <p className="text-blue-200 mb-8 text-lg">Trusted by teams at:</p>
          <div className="flex flex-wrap justify-center items-center gap-8 opacity-60">
            {['Google', 'Microsoft', 'Apple', 'Amazon', 'Meta', 'Netflix'].map((company) => (
              <div key={company} className="text-white font-semibold text-xl">
                {company}
              </div>
            ))}
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
        }
        @keyframes float-delayed {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-15px) rotate(-3deg); }
        }
        @keyframes gradient-x {
          0%, 100% {
            background-size: 200% 200%;
            background-position: left center;
          }
          50% {
            background-size: 200% 200%;
            background-position: right center;
          }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-float-delayed {
          animation: float-delayed 8s ease-in-out infinite;
        }
        .animate-gradient-x {
          animation: gradient-x 3s ease infinite;
        }
        .animation-delay-1000 {
          animation-delay: 1s;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-3000 {
          animation-delay: 3s;
        }
      `}</style>
    </section>
  );
};

export default CallToActionBanner;