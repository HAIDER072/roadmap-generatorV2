import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import RoadmapCanvas from '../components/RoadmapCanvas';
import MessageInput from '../components/MessageInput';
import StepsPanel from '../components/StepsPanel';
import { RoadmapNode, Category } from '../types';
import { ApiService } from '../services/api';
import { RoadmapService } from '../services/roadmapService';
import { TokenService } from '../services/tokenService';
import { getCategoryTheme } from '../utils/themes';
import { AlertCircle, Plus, Download, ArrowLeft, Play } from 'lucide-react';
import jsPDF from 'jspdf';
import { clearAllAIInstructions } from '../components/NodeDetail';
import { useAuth } from '../contexts/AuthContext';
import InsufficientTokensModal from '../components/tokens/InsufficientTokensModal';
import TokenRechargeModal from '../components/tokens/TokenRechargeModal';

interface TravelFormData {
  destination: string;
  startingLocation: string;
  duration: number;
  travelers: number;
  budget: number;
}

const CreateRoadmapPage: React.FC = () => {
  const [currentRoadmap, setCurrentRoadmap] = useState<RoadmapNode[]>([]);
  const [currentPhases, setCurrentPhases] = useState<any[]>([]);
  const [projectName, setProjectName] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSteps, setShowSteps] = useState(true);
  const [showCompactInput, setShowCompactInput] = useState(false);
  const [videoRecommendations, setVideoRecommendations] = useState<any[]>([]);
  const [originalPrompt, setOriginalPrompt] = useState<string>('');

  // Token-related state
  const [showInsufficientTokens, setShowInsufficientTokens] = useState(false);
  const [showRecharge, setShowRecharge] = useState(false);
  const [tokensRemaining, setTokensRemaining] = useState(0);
  const tokensRequired = 1; // 1 token per roadmap as per requirement
  
  const navigate = useNavigate();
  const { user } = useAuth();

  // Auto-save functionality
  useEffect(() => {
    if (projectName && selectedCategory && currentPhases.length > 0) {
      const autoSave = async () => {
        try {
          await RoadmapService.createRoadmap(
            projectName,
            selectedCategory,
            currentPhases,
            currentRoadmap
          );
          console.log('✅ Roadmap auto-saved successfully');
        } catch (error) {
          console.error('❌ Auto-save failed:', error);
        }
      };

      const timeoutId = setTimeout(autoSave, 2000);
      return () => clearTimeout(timeoutId);
    }
  }, [projectName, selectedCategory, currentPhases, currentRoadmap]);

  const handleGenerateRoadmap = async (text: string, category: Category, travelData?: TravelFormData) => {
    // Check token balance before generating
    if (!user) {
      setError('You must be logged in to generate roadmaps');
      return;
    }

    try {
      const profile = await TokenService.getUserProfile(user.id);
      const remaining = profile?.tokens ?? 0;
      setTokensRemaining(remaining);

      if (remaining < tokensRequired) {
        setShowInsufficientTokens(true);
        return;
      }
    } catch (err) {
      console.error('Error checking token balance:', err);
      setError('Failed to verify token balance');
      return;
    }
    setSelectedCategory(category);
    setIsGenerating(true);
    setHasGenerated(true);
    setError(null);
    
    setCurrentPhases([]);
    setCurrentRoadmap([]);
    setProjectName('');
    setShowCompactInput(false);
    
    clearAllAIInstructions();
    window.dispatchEvent(new CustomEvent('clearAIInstructions'));
    window.dispatchEvent(new CustomEvent('clearCanvas'));

    try {
      let prompt = text;
      
      if (category === 'travel_planner' && travelData) {
        prompt = `Plan a ${text} trip from ${travelData.startingLocation} to ${travelData.destination} for ${travelData.duration} ${travelData.duration === 1 ? 'day' : 'days'} with ${travelData.travelers} ${travelData.travelers === 1 ? 'traveler' : 'travelers'} and a budget of $${travelData.budget}`;
      }

      const response = await ApiService.generateRoadmap({
        prompt,
        category,
        travelData,
        userId: user.id
      });

      if (response.success && response.roadmapNodes) {
        setCurrentRoadmap(response.roadmapNodes);
        setCurrentPhases(response.phases || []);
        
        const projectTitle = category === 'travel_planner' && travelData 
          ? `Journey to ${travelData.destination}` 
          : response.projectName || 'Learning Journey';
        
        setProjectName(projectTitle);
        setShowCompactInput(true);
        
        // Store video recommendations for later use (disabled auto-navigation to allow saving)
        // TODO: Add manual "View with Videos" button to navigate with video recommendations
        // Store video recommendations and original prompt
        if (response.videoRecommendations && response.videoRecommendations.length > 0) {
          console.log(`🎥 Generated ${response.videoRecommendations.length} video recommendations`);
          setVideoRecommendations(response.videoRecommendations);
        }
        setOriginalPrompt(text);
        
        if (response.note) {
          console.log('API Note:', response.note);
        }
      } else {
        throw new Error(response.error || 'Failed to generate roadmap');
      }
    } catch (error) {
      console.error('Error generating roadmap:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate roadmap');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleNewRoadmap = () => {
    setCurrentRoadmap([]);
    setCurrentPhases([]);
    setProjectName('');
    setSelectedCategory(null);
    setHasGenerated(false);
    setShowCompactInput(false);
    setShowSteps(true);
    setError(null);
    setIsGenerating(false);
    setVideoRecommendations([]);
    setOriginalPrompt('');
    
    clearAllAIInstructions();
    window.dispatchEvent(new CustomEvent('clearAIInstructions'));
    window.dispatchEvent(new CustomEvent('clearCanvas'));
  };

  const handleBackToDashboard = () => {
    navigate('/dashboard');
  };

  const handleDownloadPDF = () => {
    if (!projectName || currentPhases.length === 0) return;

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const margin = 20;
    let yPosition = margin;

    const primaryColor = selectedCategory ? getCategoryTheme(selectedCategory).primary : '#8b5cf6';
    const secondaryColor = selectedCategory ? getCategoryTheme(selectedCategory).secondary : '#7c3aed';

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

    pdf.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
    pdf.rect(0, 0, pageWidth, 40, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(24);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SmartLearn.io', margin, 25);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'normal');
    pdf.text('AI-Powered Roadmap Generator', margin, 35);
    
    yPosition = 60;

    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(22);
    pdf.setFont('helvetica', 'bold');
    const titleLines = pdf.splitTextToSize(projectName, pageWidth - 2 * margin);
    pdf.text(titleLines, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += titleLines.length * 8 + 10;

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
    pdf.text(`Total ${selectedCategory === 'travel_planner' ? 'Days' : 'Phases'}: ${currentPhases.length}`, pageWidth - margin - 10, yPosition + 10, { align: 'right' });
    pdf.text(`Total ${selectedCategory === 'travel_planner' ? 'Activities' : 'Steps'}: ${currentPhases.reduce((total, phase) => total + phase.steps.length, 0)}`, pageWidth - margin - 10, yPosition + 20, { align: 'right' });
    
    yPosition += 40;

    currentPhases.forEach((phase, phaseIndex) => {
      if (yPosition > pageHeight - 80) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      pdf.rect(margin, yPosition, pageWidth - 2 * margin, 20, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      const phaseLabel = selectedCategory === 'travel_planner' ? 'Day' : 'Phase';
      const phaseTitle = `${phaseLabel} ${phase.number}: ${phase.name}`;
      pdf.text(phaseTitle, margin + 10, yPosition + 13);
      yPosition += 30;

      pdf.setTextColor(0, 0, 0);
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      
      phase.steps.forEach((step: any, stepIndex: number) => {
        if (yPosition > pageHeight - 50) {
          pdf.addPage();
          yPosition = margin;
        }

        pdf.setFillColor(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b);
        pdf.circle(margin + 15, yPosition + 3, 2, 'F');
        
        const stepText = step.description;
        const maxWidth = pageWidth - 2 * margin - 25;
        const lines = pdf.splitTextToSize(stepText, maxWidth);
        
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

    const totalPages = pdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      pdf.setPage(i);
      pdf.setFillColor(primaryRgb.r, primaryRgb.g, primaryRgb.b);
      pdf.rect(0, pageHeight - 15, pageWidth, 15, 'F');
      
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text('Generated by SmartLearn.io - AI-Powered Roadmap Generator', margin, pageHeight - 5);
      pdf.text(`Page ${i} of ${totalPages}`, pageWidth - margin, pageHeight - 5, { align: 'right' });
    }

    const fileName = `SmartLearn_${projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_roadmap.pdf`;
    pdf.save(fileName);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 relative">
      {/* Compact Project Title Bar with Download and Back Button */}
      {projectName && selectedCategory && (
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
              onClick={handleBackToDashboard}
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
                {projectName}
              </h2>
              <p className="text-xs text-slate-600 capitalize">
                {selectedCategory?.replace('_', ' ')} • {currentPhases.length} {selectedCategory === 'travel_planner' ? 'Days' : 'Phases'}
              </p>
            </div>
            
            {/* View with Videos Button */}
            {videoRecommendations.length > 0 && (
              <button
                onClick={() => navigate('/roadmap', {
                  state: {
                    roadmap: {
                      title: projectName,
                      category: selectedCategory,
                      phases: currentPhases,
                      roadmapNodes: currentRoadmap,
                      videoRecommendations: videoRecommendations,
                      originalPrompt: originalPrompt
                    }
                  }
                })}
                className="p-2 rounded-lg hover:bg-white/50 transition-colors duration-200 relative"
                style={{ color: selectedCategory ? getCategoryTheme(selectedCategory).primary : '#64748b' }}
                title="View with Learning Videos"
              >
                <Play className="w-4 h-4" />
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                  {videoRecommendations.length}
                </span>
              </button>
            )}
            
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
      )}

      {/* Error Banner */}
      {error && (
        <div className="fixed top-32 left-4 right-4 z-40">
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3 max-w-2xl mx-auto">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-600 text-sm">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-600 hover:text-red-800"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="pt-20 h-screen flex">
        {/* Steps Panel */}
        {showSteps && currentPhases.length > 0 && (
          <div className="fixed top-20 left-0 bottom-0 w-80 bg-white/95 backdrop-blur-md border-r border-slate-200 z-30 shadow-xl">
            <StepsPanel 
              phases={currentPhases} 
              category={selectedCategory} 
              showSteps={showSteps}
              setShowSteps={setShowSteps}
              isTravel={selectedCategory === 'travel_planner'}
            />
          </div>
        )}

        {/* Canvas */}
        <div className="flex-1 w-full">
          <RoadmapCanvas
            nodes={currentRoadmap}
            category={selectedCategory || 'project'}
            isGenerating={isGenerating}
            hasGenerated={hasGenerated}
          />
        </div>
      </div>

      {/* Message Input */}
      <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-40">
        {showCompactInput ? (
          <button
            onClick={handleNewRoadmap}
            className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 hover:scale-105 shadow-lg flex items-center space-x-2"
            title="Create new roadmap"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">New</span>
          </button>
        ) : (
          <MessageInput
            onSendMessage={handleGenerateRoadmap}
            isGenerating={isGenerating}
            selectedCategory={selectedCategory}
          />
        )}
      </div>
      
      {/* Token Modals */}
      <InsufficientTokensModal 
        isOpen={showInsufficientTokens}
        onClose={() => setShowInsufficientTokens(false)}
        onRecharge={() => {
          setShowInsufficientTokens(false);
          setShowRecharge(true);
        }}
        tokensRemaining={tokensRemaining}
        tokensRequired={tokensRequired}
      />
      
      <TokenRechargeModal 
        isOpen={showRecharge}
        onClose={() => setShowRecharge(false)}
        onSuccess={(tokens) => {
          console.log(`Successfully recharged ${tokens} tokens`);
          setTokensRemaining(prev => prev + tokens);
        }}
      />
    </div>
  );
};

export default CreateRoadmapPage;
