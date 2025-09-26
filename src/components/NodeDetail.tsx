import React, { useEffect, useRef, useState } from 'react';
import { X, ExternalLink, Sparkles, ChevronLeft, ChevronRight, ArrowLeft, Zap, Copy, Check, MapPin, ExternalLinkIcon } from 'lucide-react';
import { RoadmapNode } from '../types';
import { getCategoryTheme } from '../utils/themes';
import { ApiService } from '../services/api';

interface NodeDetailProps {
  node: RoadmapNode;
  allNodes: RoadmapNode[];
  onClose: () => void;
  onStepNavigate?: (direction: 'prev' | 'next') => void;
  onBackToPhase?: () => void;
  isBlocked: boolean;
  setIsBlocked: (blocked: boolean) => void;
}

// Store AI instructions per specific node ID to prevent sharing
const aiInstructionsStore: { [key: string]: string[] } = {};

// Function to clear all AI instructions
export const clearAllAIInstructions = () => {
  Object.keys(aiInstructionsStore).forEach(key => {
    delete aiInstructionsStore[key];
  });
};

const NodeDetail: React.FC<NodeDetailProps> = ({ 
  node, 
  allNodes, 
  onClose, 
  onStepNavigate,
  onBackToPhase,
  isBlocked,
  setIsBlocked
}) => {
  const theme = getCategoryTheme(node.category);
  const modalRef = useRef<HTMLDivElement>(null);
  const [aiInstructions, setAiInstructions] = useState<string[]>([]);
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);
  const [hasGeneratedAI, setHasGeneratedAI] = useState(false);
  const [copied, setCopied] = useState(false);

  // Listen for clear instructions event
  useEffect(() => {
    const handleClearInstructions = () => {
      clearAllAIInstructions();
      setAiInstructions([]);
      setHasGeneratedAI(false);
    };

    window.addEventListener('clearAIInstructions', handleClearInstructions);
    return () => {
      window.removeEventListener('clearAIInstructions', handleClearInstructions);
    };
  }, []);

  // Check if we have stored instructions for this SPECIFIC node
  useEffect(() => {
    const storedInstructions = aiInstructionsStore[node.id];
    if (storedInstructions && storedInstructions.length > 0) {
      setAiInstructions(storedInstructions);
      setHasGeneratedAI(true);
    } else {
      setAiInstructions([]);
      setHasGeneratedAI(false);
    }
  }, [node.id]);

  // Get all steps in the same phase for navigation
  const phaseSteps = allNodes.filter(n => 
    n.isStep && n.phaseNumber === node.phaseNumber
  ).sort((a, b) => (a.stepNumber || 0) - (b.stepNumber || 0));

  const currentStepIndex = phaseSteps.findIndex(step => step.id === node.id);
  const canGoPrev = currentStepIndex > 0;
  const canGoNext = currentStepIndex < phaseSteps.length - 1;

  // Handle keyboard navigation - disabled during AI generation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (isGeneratingAI || isBlocked) {
        return;
      }
      
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowLeft' && canGoPrev && onStepNavigate) {
        event.preventDefault();
        onStepNavigate('prev');
      } else if (event.key === 'ArrowRight' && canGoNext && onStepNavigate) {
        event.preventDefault();
        onStepNavigate('next');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onStepNavigate, canGoPrev, canGoNext, isGeneratingAI, isBlocked]);

  // Handle click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isGeneratingAI || isBlocked) {
        return;
      }
      
      const target = event.target as Element;
      
      if (target.closest('[data-navigation-button]') || target.closest('[data-video-modal]')) {
        return;
      }
      
      if (modalRef.current && !modalRef.current.contains(target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose, isGeneratingAI, isBlocked]);

  const handleStepNavigation = (direction: 'prev' | 'next') => {
    if (isGeneratingAI || isBlocked) {
      return;
    }
    
    if (onStepNavigate) {
      onStepNavigate(direction);
    }
  };

  const generateAIInstructions = async () => {
    if (isGeneratingAI || hasGeneratedAI) return;

    setIsGeneratingAI(true);
    setIsBlocked(true);

    let instructions: string[] = [];

    try {
      instructions = await ApiService.generateInstructions(node.description);
      
      aiInstructionsStore[node.id] = instructions;
      
      setAiInstructions([]);
      for (let i = 0; i < instructions.length; i++) {
        setTimeout(() => {
          setAiInstructions(prev => [...prev, instructions[i]]);
        }, i * 500);
      }
      
      setHasGeneratedAI(true);
    } catch (error) {
      console.error('Failed to generate AI instructions:', error);
    } finally {
      setIsGeneratingAI(false);
      setTimeout(() => setIsBlocked(false), instructions.length * 500 + 1000);
    }
  };

  const handleCopyInstructions = async () => {
    if (aiInstructions.length === 0) return;

    try {
      const instructionsText = aiInstructions
        .map((instruction, index) => `${index + 1}. ${cleanAIText(instruction)}`)
        .join('\n\n');
      
      await navigator.clipboard.writeText(instructionsText);
      setCopied(true);
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
    }
  };

  // Helper function to clean AI text
  const cleanAIText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`(.*?)`/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .trim();
  };

  // Handle map click - open in new tab
  const handleMapClick = (location: any) => {
    window.open(location.mapUrl, '_blank');
  };

  const isTravel = node.category === 'travel_planner';
  const phaseLabel = isTravel ? 'Day' : 'Phase';
  const stepLabel = isTravel ? 'Activity' : 'Step';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Navigation Arrows */}
      {node.isStep && canGoPrev && !isGeneratingAI && !isBlocked && (
        <button
          data-navigation-button
          onClick={() => handleStepNavigation('prev')}
          className="absolute z-60 w-12 h-12 bg-white/95 backdrop-blur-md rounded-full shadow-xl border-2 flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200 group"
          style={{ 
            borderColor: `${theme.secondary}60`,
            left: 'calc(50% - 520px)',
            top: '50%',
            transform: 'translateY(-50%)'
          }}
          title="Previous Step (← Arrow Key)"
        >
          <ChevronLeft className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" style={{ color: theme.secondary }} />
        </button>
      )}

      {node.isStep && canGoNext && !isGeneratingAI && !isBlocked && (
        <button
          data-navigation-button
          onClick={() => handleStepNavigation('next')}
          className="absolute z-60 w-12 h-12 bg-white/95 backdrop-blur-md rounded-full shadow-xl border-2 flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200 group"
          style={{ 
            borderColor: `${theme.secondary}60`,
            right: 'calc(50% - 520px)',
            top: '50%',
            transform: 'translateY(-50%)'
          }}
          title="Next Step (→ Arrow Key)"
        >
          <ChevronRight className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" style={{ color: theme.secondary }} />
        </button>
      )}

      <div 
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] relative mx-8"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: `${theme.primary}40 transparent`,
        }}
      >
        <style jsx>{`
          .modal-content::-webkit-scrollbar {
            width: 8px;
          }
          .modal-content::-webkit-scrollbar-track {
            background: transparent;
            border-radius: 10px;
          }
          .modal-content::-webkit-scrollbar-thumb {
            background: ${theme.primary}40;
            border-radius: 10px;
          }
          .modal-content::-webkit-scrollbar-thumb:hover {
            background: ${theme.primary}60;
          }
        `}</style>

        <div className="modal-content overflow-y-auto max-h-[90vh] rounded-2xl">
          {/* Header */}
          <div 
            className="p-6 text-white rounded-t-2xl"
            style={{
              background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h2 className="text-2xl font-bold mb-2">
                  {phaseLabel} {node.phaseNumber} {stepLabel} {node.stepNumber}
                </h2>
              </div>
              <div className="flex items-center space-x-2">
                {onBackToPhase && !isGeneratingAI && !isBlocked && (
                  <button
                    onClick={onBackToPhase}
                    className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
                    title={`Back to ${phaseLabel}`}
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-8">
            {/* Instructions Section */}
            <section>
              <div className="flex items-center space-x-2 mb-4">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h3 className="text-lg font-semibold text-slate-800">Instructions</h3>
              </div>
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100">
                <p className="text-slate-700 leading-relaxed">{node.description}</p>
              </div>
            </section>

            {/* AI Summary with Generate/Copy Button */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-purple-600" />
                  <h3 className="text-lg font-semibold text-slate-800">AI-Powered Instructions</h3>
                </div>
                <div className="flex items-center space-x-2">
                  {hasGeneratedAI && aiInstructions.length > 0 && (
                    <button
                      onClick={handleCopyInstructions}
                      className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg hover:from-green-600 hover:to-emerald-700 transition-all duration-200 flex items-center space-x-2"
                      title="Copy all instructions to clipboard"
                    >
                      {copied ? (
                        <>
                          <Check className="w-4 h-4" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>Copy</span>
                        </>
                      )}
                    </button>
                  )}
                  {!hasGeneratedAI && (
                    <button
                      onClick={generateAIInstructions}
                      disabled={isGeneratingAI}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 disabled:opacity-50 transition-all duration-200 flex items-center space-x-2"
                    >
                      {isGeneratingAI ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          <span>Generate</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100 min-h-[120px]">
                {!hasGeneratedAI && !isGeneratingAI && (
                  <div className="text-center py-8">
                    <p className="text-slate-600 mb-4">Get AI-powered detailed instructions</p>
                    <p className="text-sm text-slate-500">Click "Generate" to get step-by-step guidance</p>
                  </div>
                )}
                
                {isGeneratingAI && (
                  <div className="text-center py-8">
                    <div className="w-8 h-8 mx-auto mb-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-slate-600">Generating detailed instructions...</p>
                  </div>
                )}
                
                {aiInstructions.length > 0 && (
                  <div className="space-y-3">
                    {aiInstructions.map((instruction, index) => (
                      <div 
                        key={index} 
                        className="flex items-start space-x-3 animate-in slide-in-from-left-4 duration-500"
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center text-white text-sm font-bold mt-0.5 flex-shrink-0"
                          style={{ backgroundColor: theme.primary }}
                        >
                          •
                        </div>
                        <p className="text-slate-700 leading-relaxed flex-1">
                          {cleanAIText(instruction)}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            {/* Maps for Travel Category */}
            {isTravel && node.resources?.mapLocations && node.resources.mapLocations.length > 0 && (
              <section>
                <div className="flex items-center space-x-2 mb-4">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-slate-800">Related Maps</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {node.resources.mapLocations.slice(0, 2).map((location, index) => (
                    <div
                      key={index}
                      onClick={() => handleMapClick(location)}
                      className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:scale-[1.02] group cursor-pointer"
                    >
                      <div className="aspect-video bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg mb-3 flex items-center justify-center">
                        <MapPin className="w-8 h-8 text-blue-600 group-hover:scale-110 transition-transform duration-200" />
                      </div>
                      <h4 className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors duration-200">
                        {location.title}
                      </h4>
                      <p className="text-sm text-slate-600 mt-1">{location.description}</p>
                      <div className="mt-2 flex items-center text-xs text-blue-600">
                        <ExternalLinkIcon className="w-3 h-3 mr-1" />
                        <span>Click to open in Google Maps</span>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Additional Resources */}
            {node.resources?.searchResults && node.resources.searchResults.length > 0 && (
              <section>
                <div className="flex items-center space-x-2 mb-4">
                  <ExternalLink className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-semibold text-slate-800">Additional Resources</h3>
                </div>
                <div className="space-y-3">
                  {node.resources.searchResults.map((result, index) => (
                    <a
                      key={index}
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all duration-200 hover:scale-[1.01] group"
                    >
                      <h4 className="font-medium text-slate-800 group-hover:text-blue-600 transition-colors duration-200 mb-2">
                        {result.title}
                      </h4>
                      <p className="text-sm text-slate-600 line-clamp-2">{result.description}</p>
                    </a>
                  ))}
                </div>
              </section>
            )}

            {/* Step Navigation Info */}
            {node.isStep && !isGeneratingAI && (
              <section className="mt-6 pt-6 border-t border-slate-200">
                <div className="flex items-center justify-between text-sm text-slate-600">
                  <div>
                    {stepLabel} {node.stepNumber} of {phaseSteps.length} in {phaseLabel} {node.phaseNumber}
                  </div>
                  <div className="flex items-center space-x-6">
                    {canGoPrev && (
                      <button
                        onClick={() => handleStepNavigation('prev')}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors duration-200 cursor-pointer"
                        disabled={isBlocked}
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Previous {stepLabel}</span>
                      </button>
                    )}
                    {canGoNext && (
                      <button
                        onClick={() => handleStepNavigation('next')}
                        className="flex items-center space-x-1 text-blue-600 hover:text-blue-800 transition-colors duration-200 cursor-pointer"
                        disabled={isBlocked}
                      >
                        <span>Next {stepLabel}</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-xs text-slate-500 mt-2 text-center">
                  Use ← → arrow keys to navigate between {stepLabel.toLowerCase()}s
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default NodeDetail;