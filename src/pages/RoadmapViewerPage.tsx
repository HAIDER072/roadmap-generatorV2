import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import RoadmapCanvas from '../components/RoadmapCanvas';
import StepsPanel from '../components/StepsPanel';
import VideoSidebar from '../components/VideoSidebar';
import { RoadmapNode, Category } from '../types';
import { getCategoryTheme } from '../utils/themes';
import { ArrowLeft, Download, Menu, Play, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';

interface VideoRecommendation {
  title: string;
  url: string;
  videoId: string;
  thumbnail: string;
  source?: string;
}

const RoadmapViewerPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showSteps, setShowSteps] = useState(true);
  const [showVideoSidebar, setShowVideoSidebar] = useState(false);
  const [isLoadingVideos, setIsLoadingVideos] = useState(false);
  const [dynamicVideoRecommendations, setDynamicVideoRecommendations] = useState<VideoRecommendation[]>([]);
  const [canRefreshVideos, setCanRefreshVideos] = useState(false);

  // Get roadmap data from navigation state
  const roadmapData = location.state?.roadmap;

  useEffect(() => {
    // If no roadmap data, redirect to dashboard
    if (!roadmapData) {
      navigate('/dashboard');
    }
  }, [roadmapData, navigate]);

  if (!roadmapData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-slate-600">Loading roadmap...</p>
        </div>
      </div>
    );
  }

  const { title, category, phases, roadmapNodes, videoRecommendations = [], originalPrompt } = roadmapData;
  const selectedCategory = category as Category;
  
  // Extract topic from original prompt for video sidebar
  const extractMainTopic = (prompt: string) => {
    if (!prompt) return 'programming';
    return prompt
      .toLowerCase()
      .replace(/^(create|generate|make|build)\s+(a\s+)?(roadmap\s+)?for\s+/i, '')
      .replace(/\s+(roadmap|plan|guide|tutorial)$/i, '')
      .trim() || 'programming';
  };
  
  const topic = extractMainTopic(originalPrompt || title);
  
  const fetchVideoRecommendations = async (forceRefresh = false) => {
    if (!topic) return;
    
    setIsLoadingVideos(true);
    try {
      console.log(`🎥 ${forceRefresh ? 'Refreshing' : 'Fetching'} FILTERED videos for: ${topic}`);
      console.log('📏 Applying filters: >= 2 hours, no YouTube Shorts, quality tutorials only');
      
      const response = await fetch('/api/get-video-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userInput: originalPrompt || title,
          minDurationMinutes: 120,  // Enforce 2+ hour minimum
          maxVideos: 10
        })
      });
      const data = await response.json();
      
      if (data.success && data.videos) {
        setDynamicVideoRecommendations(data.videos);
        console.log(`✅ ${forceRefresh ? 'Refreshed' : 'Fetched'} ${data.videos.length} FILTERED videos for: ${topic}`);
        if (data.filter) {
          console.log(`📏 Filter applied: ${data.filter.appliedFiltering}`);
        }
      } else {
        console.warn('No filtered videos found or API error:', data.error);
      }
    } catch (err) {
      console.error('Failed to fetch video recommendations:', err);
    } finally {
      setIsLoadingVideos(false);
    }
  };

  // If videos weren't provided (e.g., opened from dashboard), fetch them dynamically
  useEffect(() => {
    const initialVideos = (roadmapData.videoRecommendations || []) as VideoRecommendation[];
    if (!initialVideos.length && topic) {
      fetchVideoRecommendations();
      setCanRefreshVideos(true); // Enable refresh button for saved roadmaps
    } else if (initialVideos.length > 0) {
      setCanRefreshVideos(false); // Disable refresh for newly generated roadmaps
    }
  }, [topic, originalPrompt, title]);

  const handleDownloadPDF = () => {
    if (!title || phases.length === 0) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    const primaryColor = selectedCategory ? getCategoryTheme(selectedCategory).primary : '#8b5cf6';
    const secondaryColor = selectedCategory ? getCategoryTheme(selectedCategory).secondary : '#7c3aed';

    // Helper function to convert hex to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 139, g: 92, b: 246 };
    };

    const primaryRgb = hexToRgb(primaryColor);
    const secondaryRgb = hexToRgb(secondaryColor);

    // Header with app name and logo placeholder
    pdf.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    pdf.rect(0, 0, pageWidth, 40, 'F');
    
    // App name
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Flowniq', margin, 25);
    
    // Subtitle
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('AI-Powered Roadmap Generator', margin, 35);
    
    yPosition = 60;

    // Project title with styling
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    const titleLines = pdf.splitTextToSize(title, pageWidth - 2 * margin);
    pdf.text(titleLines, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += titleLines.length * 8 + 10;

    // Category and timestamp info box
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, yPosition, pageWidth - 2 * margin, 25, 'F');
    
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'normal');
    const categoryLabel = selectedCategory?.replace('_', ' ').toUpperCase() || 'ROADMAP';
    const timestamp = new Date().toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
    
    pdf.text(`Category: ${categoryLabel}`, margin + 10, yPosition + 10);
    pdf.text(`Generated: ${timestamp}`, margin + 10, yPosition + 20);
    pdf.text(`Total ${selectedCategory === 'travel_planner' ? 'Days' : 'Phases'}: ${phases.length}`, pageWidth - margin - 10, yPosition + 10, { align: 'right' });
    pdf.text(`Total ${selectedCategory === 'travel_planner' ? 'Activities' : 'Steps'}: ${phases.reduce((total: any, phase: any) => total + phase.steps.length, 0)}`, pageWidth - margin - 10, yPosition + 20, { align: 'right' });
    
    yPosition += 40;

    // Phases with better styling
    phases.forEach((phase: any, phaseIndex: number) => {
      // Check if we need a new page
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = margin;
      }

      // Phase header with colored background
      pdf.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      pdf.rect(margin, yPosition, pageWidth - 2 * margin, 20, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      const phaseLabel = selectedCategory === 'travel_planner' ? 'Day' : 'Phase';
      const phaseTitle = `${phaseLabel} ${phase.number}: ${phase.name}`;
      pdf.text(phaseTitle, margin + 10, yPosition + 13);
      yPosition += 30;

      // Steps with better formatting and icons
      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      
      phase.steps.forEach((step: any, stepIndex: number) => {
        // Check if we need a new page for this step
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = margin;
        }

        // Step with colored bullet and better spacing
        pdf.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
        pdf.circle(margin + 15, yPosition + 3, 2, 'F');
        
        // Use only description, properly wrapped with better formatting
        const stepText = step.description;
        const maxWidth = pageWidth - 2 * margin - 25;
        const lines = pdf.splitTextToSize(stepText, maxWidth);
        
        // Check if lines will fit on current page
        const linesHeight = lines.length * 6;
        if (yPosition + linesHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = margin;
        }
        
        pdf.text(lines, margin + 25, yPosition + 5);
        yPosition += linesHeight + 8;
      });

      yPosition += 15;
    });

    // Footer with app info
    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Generated by Flowniq - AI-Powered Roadmap Generator', margin, pageHeight - 5);
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
    }

    // Download with better filename
    const fileName = `Flowniq_${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_roadmap.pdf`;
    pdf.save(fileName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 relative">
      {/* Header Bar */}
      <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-40">
        <div 
          className="bg-white/95 backdrop-blur-md rounded-lg shadow-lg border px-4 py-2 text-center flex items-center space-x-3"
          style={{ 
            borderColor: selectedCategory ? getCategoryTheme(selectedCategory).primary + '30' : '#e2e8f0',
            background: `linear-gradient(135deg, white 0%, ${selectedCategory ? getCategoryTheme(selectedCategory).background : '#f8fafc'}40 100%)`,
            minWidth: '320px',
            maxWidth: '500px'
          }}
        >
          {/* Back Button */}
          <button
            onClick={() => navigate('/dashboard')}
            className="p-2 rounded-lg hover:bg-white/50 transition-colors duration-200"
            style={{ color: selectedCategory ? getCategoryTheme(selectedCategory).primary : '#64748b' }}
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className="flex-1">
            <h2 
              className="text-base font-bold mb-0.5"
              style={{ color: selectedCategory ? getCategoryTheme(selectedCategory).primary : '#64748b' }}
            >
              {title}
            </h2>
            <p className="text-xs text-slate-600 capitalize">
              {selectedCategory?.replace('_', ' ')} • {phases.length} {selectedCategory === 'travel_planner' ? 'Days' : 'Phases'}
            </p>
          </div>
          
          {/* Video Button - Show if we have videos or are loading them */}
          {(() => {
            const allVideos = [...(videoRecommendations || []), ...dynamicVideoRecommendations];
            const hasVideos = allVideos.length > 0;
            
            // Show button if we have videos, are loading, or could potentially load videos
            const shouldShowButton = hasVideos || isLoadingVideos || (!videoRecommendations?.length && topic && selectedCategory !== 'travel_planner');
            
            if (shouldShowButton) {
              return (
                <button
                  onClick={() => setShowVideoSidebar(true)}
                  disabled={isLoadingVideos}
                  className="p-2 rounded-lg hover:bg-white/50 transition-colors duration-200 relative disabled:opacity-50"
                  style={{ color: selectedCategory ? getCategoryTheme(selectedCategory).primary : '#64748b' }}
                  title={isLoadingVideos ? "Loading Videos..." : "Watch Learning Videos"}
                >
                  <Play className="w-4 h-4" />
                  {hasVideos && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {allVideos.length}
                    </span>
                  )}
                  {isLoadingVideos && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded">
                      <div className="w-3 h-3 border border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                </button>
              );
            }
            return null;
          })()}
          
          {/* Refresh Videos Button - Only show for saved roadmaps */}
          {canRefreshVideos && selectedCategory !== 'travel_planner' && (
            <button
              onClick={() => fetchVideoRecommendations(true)}
              disabled={isLoadingVideos}
              className="p-2 rounded-lg hover:bg-white/50 transition-colors duration-200 disabled:opacity-50"
              style={{ color: selectedCategory ? getCategoryTheme(selectedCategory).primary : '#64748b' }}
              title="Refresh Learning Videos"
            >
              <RefreshCw className={`w-4 h-4 ${isLoadingVideos ? 'animate-spin' : ''}`} />
            </button>
          )}
          
          {/* Download Button */}
          <button
            onClick={handleDownloadPDF}
            className="p-2 rounded-lg hover:bg-white/50 transition-colors duration-200"
            style={{ color: selectedCategory ? getCategoryTheme(selectedCategory).primary : '#64748b' }}
            title="Download PDF"
          >
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Hamburger Menu */}
      {!showSteps && phases.length > 0 && (
        <div className="fixed top-20 left-4 z-40">
          <button
            onClick={() => setShowSteps(true)}
            className="p-3 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 hover:bg-white hover:shadow-xl transition-all duration-200"
            style={{ 
              borderColor: selectedCategory ? getCategoryTheme(selectedCategory).primary + '40' : '#e2e8f0'
            }}
          >
            <Menu className="w-6 h-6" style={{ 
              color: selectedCategory ? getCategoryTheme(selectedCategory).primary : '#64748b'
            }} />
          </button>
        </div>
      )}

      {/* Main Content */}
      <div className="pt-20 h-screen flex">
        {/* Steps Panel */}
        {showSteps && phases.length > 0 && (
          <div className="fixed top-20 left-0 bottom-0 w-80 bg-white/95 backdrop-blur-md border-r border-slate-200 z-30 shadow-xl">
            <StepsPanel 
              phases={phases} 
              category={selectedCategory} 
              showSteps={showSteps}
              setShowSteps={setShowSteps}
              isTravel={selectedCategory === 'travel_planner'}
            />
          </div>
        )}

        {/* Canvas - IMPROVED: Pass isViewMode prop */}
        <div className="flex-1 w-full">
          <RoadmapCanvas
            nodes={roadmapNodes}
            category={selectedCategory || 'project'}
            isGenerating={false}
            hasGenerated={true}
            isViewMode={true}
          />
        </div>
      </div>
      
      {/* Video Sidebar */}
      <VideoSidebar 
        videos={[...((videoRecommendations as VideoRecommendation[]) || []), ...dynamicVideoRecommendations]}
        isOpen={showVideoSidebar}
        onClose={() => setShowVideoSidebar(false)}
        topic={topic}
        category={selectedCategory}
        theme={getCategoryTheme(selectedCategory || 'project')}
      />
    </div>
  );
};

export default RoadmapViewerPage;
