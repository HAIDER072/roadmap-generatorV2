import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Target, 
  Zap, 
  Shield, 
  Users, 
  BarChart3, 
  Palette, 
  Globe,
  ArrowRight
} from 'lucide-react';

const FeaturesGrid: React.FC = () => {
  const [hoveredFeature, setHoveredFeature] = useState<number | null>(null);

  const features = [
    {
      id: 1,
      icon: Sparkles,
      title: 'AI-Powered Intelligence',
      description: 'Advanced algorithms analyze your goals and create personalized, step-by-step roadmaps tailored to your needs.',
      color: 'from-purple-500 to-pink-500',
      bgColor: 'from-purple-50 to-pink-50',
      stats: '99.9% Accuracy'
    },
    {
      id: 2,
      icon: Target,
      title: 'Goal-Oriented Planning',
      description: 'Break down complex objectives into manageable phases with clear milestones and actionable steps.',
      color: 'from-blue-500 to-cyan-500',
      bgColor: 'from-blue-50 to-cyan-50',
      stats: '4.9/5 Success Rate'
    },
    {
      id: 3,
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Generate comprehensive roadmaps in seconds, not hours. Our AI processes your goals instantly.',
      color: 'from-yellow-500 to-orange-500',
      bgColor: 'from-yellow-50 to-orange-50',
      stats: '<3s Generation'
    },
    {
      id: 4,
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is protected with enterprise-grade security. We never share your personal information.',
      color: 'from-green-500 to-emerald-500',
      bgColor: 'from-green-50 to-emerald-50',
      stats: 'SOC 2 Compliant'
    },
    {
      id: 5,
      icon: Users,
      title: 'Collaborative',
      description: 'Share roadmaps with team members, mentors, or friends. Get feedback and track progress together.',
      color: 'from-indigo-500 to-purple-500',
      bgColor: 'from-indigo-50 to-purple-50',
      stats: '10K+ Teams'
    },
    {
      id: 6,
      icon: BarChart3,
      title: 'Progress Tracking',
      description: 'Monitor your advancement with visual indicators, completion tracking, and milestone celebrations.',
      color: 'from-red-500 to-pink-500',
      bgColor: 'from-red-50 to-pink-50',
      stats: 'Real-time Updates'
    },
    {
      id: 7,
      icon: Palette,
      title: 'Beautiful Design',
      description: 'Enjoy a clean, intuitive interface designed for productivity and visual appeal.',
      color: 'from-teal-500 to-blue-500',
      bgColor: 'from-teal-50 to-blue-50',
      stats: 'Award Winning UI'
    },
    {
      id: 8,
      icon: Globe,
      title: 'Multi-Platform',
      description: 'Access your roadmaps anywhere, anytime. Works seamlessly across all devices and platforms.',
      color: 'from-violet-500 to-purple-500',
      bgColor: 'from-violet-50 to-purple-50',
      stats: '99.9% Uptime'
    }
  ];

  return (
    <section className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Powerful{' '}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Features
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to transform your goals into reality with cutting-edge AI technology
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isHovered = hoveredFeature === feature.id;
            
            return (
              <div
                key={feature.id}
                onMouseEnter={() => setHoveredFeature(feature.id)}
                onMouseLeave={() => setHoveredFeature(null)}
                className={`group relative p-8 rounded-3xl border-2 transition-all duration-500 cursor-pointer ${
                  isHovered
                    ? 'border-transparent shadow-2xl scale-105 -translate-y-2'
                    : 'border-gray-100 hover:border-gray-200 shadow-lg'
                }`}
                style={{
                  background: isHovered 
                    ? `linear-gradient(135deg, ${feature.bgColor.split(' ')[1]}, ${feature.bgColor.split(' ')[3]})`
                    : 'white',
                  animationDelay: `${index * 100}ms`
                }}
              >
                {/* Glow Effect */}
                {isHovered && (
                  <div 
                    className="absolute inset-0 rounded-3xl opacity-20 blur-xl transition-opacity duration-500"
                    style={{
                      background: `linear-gradient(135deg, ${feature.color.split(' ')[1]}, ${feature.color.split(' ')[3]})`
                    }}
                  />
                )}

                {/* Icon */}
                <div className="relative mb-6">
                  <div 
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${feature.color} flex items-center justify-center shadow-lg transition-all duration-500 ${
                      isHovered ? 'scale-110 rotate-3' : 'group-hover:scale-105'
                    }`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  
                  {/* Floating Badge */}
                  <div className={`absolute -top-2 -right-2 px-2 py-1 bg-white rounded-full shadow-md border transition-all duration-500 ${
                    isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
                  }`}>
                    <span className="text-xs font-semibold text-gray-600">{feature.stats}</span>
                  </div>
                </div>

                {/* Content */}
                <div className="relative">
                  <h3 className={`text-xl font-bold mb-3 transition-colors duration-300 ${
                    isHovered ? 'text-gray-900' : 'text-gray-800'
                  }`}>
                    {feature.title}
                  </h3>
                  
                  <p className={`text-gray-600 leading-relaxed mb-4 transition-colors duration-300 ${
                    isHovered ? 'text-gray-700' : ''
                  }`}>
                    {feature.description}
                  </p>

                  {/* Learn More Link */}
                  <div className={`flex items-center space-x-2 text-sm font-semibold transition-all duration-300 ${
                    isHovered 
                      ? 'opacity-100 translate-x-0' 
                      : 'opacity-0 -translate-x-4'
                  }`}>
                    <span 
                      className="bg-gradient-to-r bg-clip-text text-transparent"
                      style={{
                        backgroundImage: `linear-gradient(to right, ${feature.color.split(' ')[1]}, ${feature.color.split(' ')[3]})`
                      }}
                    >
                      Learn more
                    </span>
                    <ArrowRight className="w-4 h-4" style={{
                      color: feature.color.includes('purple') ? '#8b5cf6' : 
                             feature.color.includes('blue') ? '#3b82f6' :
                             feature.color.includes('yellow') ? '#f59e0b' :
                             feature.color.includes('green') ? '#10b981' :
                             feature.color.includes('red') ? '#ef4444' :
                             feature.color.includes('teal') ? '#14b8a6' :
                             '#8b5cf6'
                    }} />
                  </div>
                </div>

                {/* Decorative Elements */}
                <div className={`absolute top-4 right-4 w-2 h-2 rounded-full transition-all duration-500 ${
                  isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${feature.color.split(' ')[1]}, ${feature.color.split(' ')[3]})`
                }} />
                
                <div className={`absolute bottom-4 left-4 w-1 h-1 rounded-full transition-all duration-700 ${
                  isHovered ? 'opacity-100 scale-100' : 'opacity-0 scale-50'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${feature.color.split(' ')[1]}, ${feature.color.split(' ')[3]})`
                }} />
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <p className="text-lg text-gray-600 mb-8">
            Ready to experience the power of AI-driven roadmap generation?
          </p>
          <Link 
            to="/signup"
            className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl font-semibold text-lg shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 inline-flex items-center space-x-2"
          >
            <span>Start Creating Now</span>
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturesGrid;