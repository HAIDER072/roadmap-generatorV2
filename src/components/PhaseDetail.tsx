import React, { useEffect, useRef } from 'react';
import { X, Target, ArrowRight, CheckCircle, ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { RoadmapNode } from '../types';
import { getCategoryTheme } from '../utils/themes';

interface PhaseDetailProps {
  phase: RoadmapNode;
  allNodes: RoadmapNode[];
  onClose: () => void;
  onStepClick: (step: RoadmapNode) => void;
  onPhaseNavigate?: (direction: 'prev' | 'next') => void;
}

const PhaseDetail: React.FC<PhaseDetailProps> = ({ 
  phase, 
  allNodes, 
  onClose, 
  onStepClick,
  onPhaseNavigate 
}) => {
  const theme = getCategoryTheme(phase.category);
  const modalRef = useRef<HTMLDivElement>(null);

  // Get all phases to determine navigation availability
  const allPhases = allNodes.filter(node => node.isPhase).sort((a, b) => (a.phaseNumber || 0) - (b.phaseNumber || 0));
  const currentPhaseIndex = allPhases.findIndex(p => p.phaseNumber === phase.phaseNumber);
  const canGoPrev = currentPhaseIndex > 0;
  const canGoNext = currentPhaseIndex < allPhases.length - 1;

  // Get all steps for this phase
  const phaseSteps = allNodes.filter(node => 
    node.isStep && node.phaseNumber === phase.phaseNumber
  ).sort((a, b) => (a.stepNumber || 0) - (b.stepNumber || 0));

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      } else if (event.key === 'ArrowLeft' && canGoPrev && onPhaseNavigate) {
        event.preventDefault();
        onPhaseNavigate('prev');
      } else if (event.key === 'ArrowRight' && canGoNext && onPhaseNavigate) {
        event.preventDefault();
        onPhaseNavigate('next');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onPhaseNavigate, canGoPrev, canGoNext]);

  // Handle click outside to close - IMPROVED: Exclude navigation buttons
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      
      // Don't close if clicking on navigation buttons
      if (target.closest('[data-navigation-button]')) {
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
  }, [onClose]);

  const handlePhaseNavigation = (direction: 'prev' | 'next') => {
    if (onPhaseNavigate) {
      onPhaseNavigate(direction);
    }
  };

  const isTravel = phase.category === 'travel_planner';
  const phaseLabel = isTravel ? 'Day' : 'Phase';
  const stepLabel = isTravel ? 'Activity' : 'Step';

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* IMPROVED: Navigation Arrows - Closer to modal and with data attribute */}
      {canGoPrev && (
        <button
          data-navigation-button
          onClick={() => handlePhaseNavigation('prev')}
          className="absolute z-60 w-12 h-12 bg-white/95 backdrop-blur-md rounded-full shadow-xl border-2 flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200 group"
          style={{ 
            borderColor: `${theme.primary}60`,
            left: 'calc(50% - 520px)',
            top: '50%',
            transform: 'translateY(-50%)'
          }}
          title={`Previous ${phaseLabel} (← Arrow Key)`}
        >
          <ChevronLeft className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" style={{ color: theme.primary }} />
        </button>
      )}

      {canGoNext && (
        <button
          data-navigation-button
          onClick={() => handlePhaseNavigation('next')}
          className="absolute z-60 w-12 h-12 bg-white/95 backdrop-blur-md rounded-full shadow-xl border-2 flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200 group"
          style={{ 
            borderColor: `${theme.primary}60`,
            right: 'calc(50% - 520px)',
            top: '50%',
            transform: 'translateY(-50%)'
          }}
          title={`Next ${phaseLabel} (→ Arrow Key)`}
        >
          <ChevronRight className="w-6 h-6 group-hover:scale-110 transition-transform duration-200" style={{ color: theme.primary }} />
        </button>
      )}

      <div 
        ref={modalRef}
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] relative mx-8"
        style={{
          // IMPROVED: Custom scrollbar styling
          scrollbarWidth: 'thin',
          scrollbarColor: `${theme.primary}40 transparent`,
        }}
      >
        {/* IMPROVED: Custom scrollbar styles */}
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
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                  {isTravel ? (
                    <Calendar className="w-8 h-8" />
                  ) : (
                    <Target className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <p className="text-white/80 text-sm font-medium mb-1">
                    {phaseLabel} {phase.phaseNumber}
                  </p>
                  <h2 className="text-3xl font-bold">{phase.title}</h2>
                  <p className="opacity-90 mt-2">{phase.description}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center hover:bg-white/30 transition-colors duration-200"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="p-6">
            {/* Phase Overview */}
            <section className="mb-8">
              <h3 className="text-xl font-semibold text-slate-800 mb-4">{phaseLabel} Overview</h3>
              <div 
                className="rounded-xl p-4 border"
                style={{
                  backgroundColor: `${theme.background}60`,
                  borderColor: `${theme.primary}30`
                }}
              >
                <p className="text-slate-700 leading-relaxed">
                  This {phaseLabel.toLowerCase()} focuses on {phase.title.toLowerCase()} and includes {phaseSteps.length} essential {stepLabel.toLowerCase()}s 
                  to help you progress in your {isTravel ? 'journey' : 'learning journey'}.
                </p>
              </div>
            </section>

            {/* Phase Steps */}
            <section>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-slate-800">{phaseLabel} {stepLabel}s</h3>
                <div className="text-sm text-slate-600">
                  {phaseSteps.length} {stepLabel.toLowerCase()}s in this {phaseLabel.toLowerCase()}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {phaseSteps.map((step, index) => (
                  <div
                    key={step.id}
                    onClick={() => onStepClick(step)}
                    className="bg-white border-2 rounded-xl p-4 hover:shadow-lg transition-all duration-200 cursor-pointer group hover:scale-[1.02]"
                    style={{
                      borderColor: `${theme.secondary}30`,
                      background: `linear-gradient(135deg, white 0%, ${theme.background}20 100%)`,
                    }}
                  >
                    {/* Step Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div 
                          className="w-8 h-8 rounded-lg flex items-center justify-center"
                          style={{ backgroundColor: `${theme.secondary}20` }}
                        >
                          <CheckCircle className="w-4 h-4" style={{ color: theme.secondary }} />
                        </div>
                        <span className="font-semibold text-sm" style={{ color: theme.text }}>
                          {stepLabel} {step.stepNumber}
                        </span>
                      </div>
                      <ArrowRight 
                        className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity duration-200" 
                        style={{ color: theme.primary }}
                      />
                    </div>

                    {/* Step Content */}
                    <div>
                      <h4 className="font-semibold text-slate-800 mb-2 leading-tight">
                        {step.title}
                      </h4>
                      <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
                        {step.description}
                      </p>
                    </div>

                    {/* Step Footer */}
                    <div className="mt-3 pt-3 border-t border-slate-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-1 text-xs text-slate-500">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.secondary }}></div>
                          <span>Resources available</span>
                        </div>
                        <div className="text-xs text-slate-400">
                          Click to explore
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Phase Resources */}
            {phase.resources && (
              <section className="mt-8">
                <h3 className="text-xl font-semibold text-slate-800 mb-4">{phaseLabel} Resources</h3>
                <div 
                  className="rounded-xl p-4 border"
                  style={{
                    backgroundColor: `${theme.background}40`,
                    borderColor: `${theme.primary}20`
                  }}
                >
                  <p className="text-slate-700 leading-relaxed">
                    {phase.resources.aiSummary}
                  </p>
                </div>
              </section>
            )}

            {/* Navigation Instructions */}
            <section className="mt-6 pt-6 border-t border-slate-200">
              <div className="flex items-center justify-between text-sm text-slate-600">
                <div>
                  {phaseLabel} {phase.phaseNumber} of {allPhases.length}
                </div>
                <div className="flex items-center space-x-6">
                  {canGoPrev && (
                    <span className="flex items-center space-x-1">
                      <ChevronLeft className="w-4 h-4" />
                      <span>Previous {phaseLabel}</span>
                    </span>
                  )}
                  {canGoNext && (
                    <span className="flex items-center space-x-1">
                      <span>Next {phaseLabel}</span>
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs text-slate-500 mt-2 text-center">
                Use ← → arrow keys to navigate between {phaseLabel.toLowerCase()}s
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PhaseDetail;