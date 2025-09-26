import React, { useState } from 'react';
import { 
  Zap, 
  Calendar, 
  FileText, 
  MessageSquare, 
  Github, 
  Trello,
  ArrowRight,
  Plus,
  CheckCircle
} from 'lucide-react';

const Integrations: React.FC = () => {
  const [hoveredIntegration, setHoveredIntegration] = useState<number | null>(null);

  const integrations = [
    {
      id: 1,
      name: 'Google Calendar',
      description: 'Sync roadmap deadlines with your calendar',
      icon: Calendar,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'from-blue-50 to-blue-100',
      status: 'available',
      category: 'Productivity'
    },
    {
      id: 2,
      name: 'Notion',
      description: 'Export roadmaps to your Notion workspace',
      icon: FileText,
      color: 'from-gray-700 to-gray-800',
      bgColor: 'from-gray-50 to-gray-100',
      status: 'available',
      category: 'Documentation'
    },
    {
      id: 3,
      name: 'Slack',
      description: 'Get roadmap updates in your team channels',
      icon: MessageSquare,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'from-purple-50 to-purple-100',
      status: 'available',
      category: 'Communication'
    },
    {
      id: 4,
      name: 'GitHub',
      description: 'Connect with your development workflow',
      icon: Github,
      color: 'from-gray-800 to-black',
      bgColor: 'from-gray-50 to-gray-100',
      status: 'available',
      category: 'Development'
    },
    {
      id: 5,
      name: 'Trello',
      description: 'Convert roadmap steps into Trello cards',
      icon: Trello,
      color: 'from-blue-600 to-blue-700',
      bgColor: 'from-blue-50 to-blue-100',
      status: 'available',
      category: 'Project Management'
    },
    {
      id: 6,
      name: 'Zapier',
      description: 'Connect with 5000+ apps via Zapier',
      icon: Zap,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'from-orange-50 to-orange-100',
      status: 'available',
      category: 'Automation'
    },
    {
      id: 7,
      name: 'Asana',
      description: 'Sync tasks with your Asana projects',
      icon: CheckCircle,
      color: 'from-pink-500 to-pink-600',
      bgColor: 'from-pink-50 to-pink-100',
      status: 'coming-soon',
      category: 'Project Management'
    },
    {
      id: 8,
      name: 'More Integrations',
      description: 'Request new integrations',
      icon: Plus,
      color: 'from-gray-400 to-gray-500',
      bgColor: 'from-gray-50 to-gray-100',
      status: 'request',
      category: 'Custom'
    }
  ];

  const categories = ['All', 'Productivity', 'Documentation', 'Communication', 'Development', 'Project Management', 'Automation'];
  const [selectedCategory, setSelectedCategory] = useState('All');

  const filteredIntegrations = selectedCategory === 'All' 
    ? integrations 
    : integrations.filter(integration => integration.category === selectedCategory);

  return (
    <section className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
            Powerful{' '}
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              Integrations
            </span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Connect Flowniq with your favorite tools and streamline your workflow
          </p>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-12">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-6 py-3 rounded-full font-medium transition-all duration-300 ${
                selectedCategory === category
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:shadow-md'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Integrations Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredIntegrations.map((integration, index) => {
            const Icon = integration.icon;
            const isHovered = hoveredIntegration === integration.id;
            
            return (
              <div
                key={integration.id}
                onMouseEnter={() => setHoveredIntegration(integration.id)}
                onMouseLeave={() => setHoveredIntegration(null)}
                className={`group relative p-6 bg-white rounded-2xl border-2 transition-all duration-500 cursor-pointer ${
                  isHovered
                    ? 'border-transparent shadow-2xl scale-105 -translate-y-2'
                    : 'border-gray-100 hover:border-gray-200 shadow-lg'
                }`}
                style={{
                  background: isHovered 
                    ? `linear-gradient(135deg, ${integration.bgColor.split(' ')[1]}, ${integration.bgColor.split(' ')[3]})`
                    : 'white',
                  animationDelay: `${index * 100}ms`
                }}
              >
                {/* Status Badge */}
                <div className="absolute top-4 right-4">
                  {integration.status === 'available' && (
                    <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                  )}
                  {integration.status === 'coming-soon' && (
                    <div className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                      Soon
                    </div>
                  )}
                  {integration.status === 'request' && (
                    <div className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-full">
                      Request
                    </div>
                  )}
                </div>

                {/* Icon */}
                <div className="mb-4">
                  <div 
                    className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${integration.color} flex items-center justify-center shadow-lg transition-all duration-500 ${
                      isHovered ? 'scale-110 rotate-3' : 'group-hover:scale-105'
                    }`}
                  >
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h3 className={`text-lg font-bold mb-2 transition-colors duration-300 ${
                    isHovered ? 'text-gray-900' : 'text-gray-800'
                  }`}>
                    {integration.name}
                  </h3>
                  
                  <p className={`text-sm text-gray-600 leading-relaxed mb-4 transition-colors duration-300 ${
                    isHovered ? 'text-gray-700' : ''
                  }`}>
                    {integration.description}
                  </p>

                  {/* Category Tag */}
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded-lg">
                      {integration.category}
                    </span>

                    {/* Connect Button */}
                    <div className={`flex items-center space-x-1 text-sm font-semibold transition-all duration-300 ${
                      isHovered 
                        ? 'opacity-100 translate-x-0' 
                        : 'opacity-0 -translate-x-4'
                    }`}>
                      <span 
                        className="bg-gradient-to-r bg-clip-text text-transparent"
                        style={{
                          backgroundImage: `linear-gradient(to right, ${integration.color.split(' ')[1]}, ${integration.color.split(' ')[3]})`
                        }}
                      >
                        {integration.status === 'available' ? 'Connect' : 
                         integration.status === 'coming-soon' ? 'Notify me' : 'Request'}
                      </span>
                      <ArrowRight className="w-4 h-4" style={{
                        color: integration.color.includes('blue') ? '#3b82f6' : 
                               integration.color.includes('gray') ? '#6b7280' :
                               integration.color.includes('purple') ? '#8b5cf6' :
                               integration.color.includes('orange') ? '#f59e0b' :
                               integration.color.includes('pink') ? '#ec4899' :
                               '#6b7280'
                      }} />
                    </div>
                  </div>
                </div>

                {/* Glow Effect */}
                {isHovered && (
                  <div 
                    className="absolute inset-0 rounded-2xl opacity-20 blur-xl transition-opacity duration-500"
                    style={{
                      background: `linear-gradient(135deg, ${integration.color.split(' ')[1]}, ${integration.color.split(' ')[3]})`
                    }}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* API Section */}
        <div className="mt-20 text-center">
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 rounded-3xl p-12 text-white">
            <h3 className="text-3xl font-bold mb-4">Need a Custom Integration?</h3>
            <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
              Use our powerful API to build custom integrations or request new ones from our team
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button className="px-8 py-4 bg-white text-purple-600 rounded-2xl font-semibold text-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                View API Docs
              </button>
              <button className="px-8 py-4 bg-white/20 text-white rounded-2xl font-semibold text-lg border border-white/30 hover:bg-white/30 transition-all duration-300">
                Request Integration
              </button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16">
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-2">20+</div>
            <div className="text-gray-600">Available Integrations</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-2">99.9%</div>
            <div className="text-gray-600">API Uptime</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-2">5K+</div>
            <div className="text-gray-600">Connected Accounts</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Integrations;