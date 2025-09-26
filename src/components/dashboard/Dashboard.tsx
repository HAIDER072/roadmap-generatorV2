import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { RoadmapService, RoadmapRow } from '../../services/roadmapService';
import { getCategoryTheme } from '../../utils/themes';
import { Plus, Calendar, ChefHat, MapPin, Briefcase, Dumbbell, BookOpen, Trash2, AlertCircle, Search, Filter, ChevronDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { Category } from '../../types';

const Dashboard: React.FC = () => {
  const [roadmaps, setRoadmaps] = useState<RoadmapRow[]>([]);
  const [filteredRoadmaps, setFilteredRoadmaps] = useState<RoadmapRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'category'>('newest');
  const [showFilters, setShowFilters] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;
  
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadRoadmaps();
    }
  }, [user]);

  // Filter and search roadmaps
  useEffect(() => {
    let filtered = [...roadmaps];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(roadmap =>
        roadmap.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        roadmap.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(roadmap => roadmap.category === selectedCategory);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'category':
          return a.category.localeCompare(b.category);
        default:
          return 0;
      }
    });

    setFilteredRoadmaps(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }, [roadmaps, searchTerm, selectedCategory, sortBy]);

  const loadRoadmaps = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data, error } = await RoadmapService.getUserRoadmaps();
      
      if (error) {
        setError(error.message);
      } else {
        setRoadmaps(data || []);
      }
    } catch (err) {
      setError('Failed to load roadmaps');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRoadmap = async (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!confirm('Are you sure you want to delete this roadmap?')) {
      return;
    }

    try {
      setDeletingId(id);
      const { error } = await RoadmapService.deleteRoadmap(id);
      
      if (error) {
        setError(error.message);
      } else {
        setRoadmaps(prev => prev.filter(roadmap => roadmap.id !== id));
      }
    } catch (err) {
      setError('Failed to delete roadmap');
    } finally {
      setDeletingId(null);
    }
  };

  const handleViewRoadmap = (roadmap: RoadmapRow) => {
    navigate('/roadmap', { 
      state: { 
        roadmap: {
          id: roadmap.id,
          title: roadmap.title,
          category: roadmap.category,
          phases: roadmap.phases,
          roadmapNodes: roadmap.roadmap_nodes
        }
      }
    });
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'kitchen_recipe':
        return ChefHat;
      case 'travel_planner':
        return MapPin;
      case 'project':
        return Briefcase;
      case 'fitness_planner':
        return Dumbbell;
      case 'subject':
        return BookOpen;
      default:
        return Briefcase;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Pagination calculations
  const totalPages = Math.ceil(filteredRoadmaps.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentRoadmaps = filteredRoadmaps.slice(startIndex, endIndex);

  const categories = [
    { value: 'all', label: 'All Categories' },
    { value: 'kitchen_recipe', label: 'Kitchen Recipe', icon: ChefHat },
    { value: 'travel_planner', label: 'Travel Planner', icon: MapPin },
    { value: 'project', label: 'Project', icon: Briefcase },
    { value: 'fitness_planner', label: 'Fitness Planner', icon: Dumbbell },
    { value: 'subject', label: 'Subject Learning', icon: BookOpen },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600">Loading your roadmaps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="pt-24 pb-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-slate-800 mb-2">
              Welcome back, {user?.email?.split('@')[0]}!
            </h1>
            <p className="text-slate-600 text-lg">
              {roadmaps.length === 0 
                ? 'Create your first AI-powered roadmap to get started'
                : `You have ${roadmaps.length} roadmap${roadmaps.length === 1 ? '' : 's'}`
              }
            </p>
          </div>

          {/* Search and Filters */}
          {roadmaps.length > 0 && (
            <div className="mb-8 space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search roadmaps..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors duration-200"
                >
                  <Filter className="w-4 h-4" />
                  <span>Filters</span>
                  <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
                </button>

                {showFilters && (
                  <div className="flex flex-wrap items-center gap-4">
                    {/* Category Filter */}
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      {categories.map(category => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>

                    {/* Sort Filter */}
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest' | 'category')}
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="newest">Newest First</option>
                      <option value="oldest">Oldest First</option>
                      <option value="category">By Category</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Results Info */}
              <div className="text-sm text-slate-600">
                Showing {filteredRoadmaps.length} of {roadmaps.length} roadmaps
                {searchTerm && ` for "${searchTerm}"`}
                {selectedCategory !== 'all' && ` in ${categories.find(c => c.value === selectedCategory)?.label}`}
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-red-800">{error}</p>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            </div>
          )}

          {/* Roadmaps Grid */}
          {filteredRoadmaps.length === 0 ? (
            // Empty State
            <div className="text-center py-16">
              <div className="w-24 h-24 mx-auto mb-6 bg-white rounded-3xl flex items-center justify-center shadow-lg border border-slate-200 overflow-hidden">
                <img 
                  src="/chartly_logo.png" 
                  alt="SmartLearn.io Logo" 
                  className="w-16 h-16 object-contain"
                />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 mb-4">
                {roadmaps.length === 0 ? 'Create Your First Roadmap' : 'No roadmaps found'}
              </h3>
              <p className="text-slate-600 text-lg mb-8 max-w-md mx-auto">
                {roadmaps.length === 0 
                  ? 'Transform your goals into clear, visual learning paths with AI assistance'
                  : 'Try adjusting your search or filters to find what you\'re looking for'
                }
              </p>
              <button
                onClick={() => navigate('/create')}
                className="inline-flex items-center space-x-3 px-8 py-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-lg text-lg font-medium"
              >
                <Plus className="w-6 h-6" />
                <span>Create Roadmap</span>
              </button>
            </div>
          ) : (
            <>
              {/* Roadmaps Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Create New Roadmap Card */}
                <div
                  onClick={() => navigate('/create')}
                  className="bg-white rounded-2xl shadow-lg border-2 border-dashed border-slate-300 hover:border-indigo-400 transition-all duration-200 hover:scale-105 cursor-pointer group p-8"
                >
                  <div className="text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                      <Plus className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-800 mb-2">Create New Roadmap</h3>
                    <p className="text-slate-600 text-sm">Start building your next learning journey</p>
                  </div>
                </div>

                {/* Existing Roadmaps */}
                {currentRoadmaps.map((roadmap) => {
                  const theme = getCategoryTheme(roadmap.category as Category);
                  const IconComponent = getCategoryIcon(roadmap.category);
                  
                  return (
                    <div
                      key={roadmap.id}
                      onClick={() => handleViewRoadmap(roadmap)}
                      className="bg-white rounded-2xl shadow-lg border border-slate-200 hover:shadow-xl transition-all duration-200 hover:scale-105 overflow-hidden group cursor-pointer"
                    >
                      {/* Header */}
                      <div 
                        className="p-6 text-white"
                        style={{
                          background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                            <IconComponent className="w-6 h-6" />
                          </div>
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-4 h-4 opacity-80" />
                            <span className="text-sm opacity-80">{formatDate(roadmap.created_at)}</span>
                          </div>
                        </div>
                        <h3 className="text-xl font-bold mb-2 line-clamp-2">{roadmap.title}</h3>
                        <p className="text-white/80 text-sm capitalize">
                          {roadmap.category.replace('_', ' ')} • {roadmap.phases.length} phases
                        </p>
                      </div>

                      {/* Content */}
                      <div className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-slate-600">
                            {roadmap.phases.reduce((total: number, phase: any) => total + (phase.steps?.length || 0), 0)} total steps
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={(e) => handleDeleteRoadmap(roadmap.id, e)}
                              disabled={deletingId === roadmap.id}
                              className="p-2 bg-red-100 rounded-lg hover:bg-red-200 transition-colors duration-200 disabled:opacity-50"
                              title="Delete Roadmap"
                            >
                              {deletingId === roadmap.id ? (
                                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                <Trash2 className="w-4 h-4 text-red-600" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center space-x-4">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`w-10 h-10 rounded-lg font-medium transition-colors duration-200 ${
                          currentPage === page
                            ? 'bg-indigo-500 text-white'
                            : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="flex items-center space-x-2 px-4 py-2 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    <span>Next</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;