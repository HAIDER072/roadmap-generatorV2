import React, { useState } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronRight, X, Target, List, Calendar } from 'lucide-react';
import { Category } from '../types';
import { getCategoryTheme } from '../utils/themes';

interface Step {
  title: string;
  description: string;
}

interface Phase {
  number: number;
  name: string;
  steps: Step[];
}

interface StepsPanelProps {
  phases: Phase[];
  category?: Category | null;
  showSteps: boolean;
  setShowSteps: (show: boolean) => void;
  isTravel?: boolean;
}

const StepsPanel: React.FC<StepsPanelProps> = ({ phases, category, showSteps, setShowSteps, isTravel = false }) => {
  const [expandedPhase, setExpandedPhase] = useState<number | null>(1); // Only one phase expanded at a time
  const [completedSteps, setCompletedSteps] = useState<Set<string>>(new Set());

  const theme = category ? getCategoryTheme(category) : {
    primary: '#8b5cf6',
    secondary: '#7c3aed',
    accent: '#ddd6fe',
    background: '#f5f3ff',
    text: '#6d28d9'
  };

  // IMPROVED: Click on phase block to expand/collapse
  const togglePhaseExpanded = (phaseNumber: number) => {
    // If clicking on already expanded phase, collapse it
    if (expandedPhase === phaseNumber) {
      setExpandedPhase(null);
    } else {
      // Otherwise, expand this phase (and auto-collapse others)
      setExpandedPhase(phaseNumber);
    }
  };

  const toggleStepCompleted = (phaseNumber: number, stepIndex: number) => {
    const stepId = `${phaseNumber}-${stepIndex}`;
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId);
    } else {
      newCompleted.add(stepId);
    }
    setCompletedSteps(newCompleted);
  };

  const getTotalSteps = () => phases.reduce((total, phase) => total + phase.steps.length, 0);
  const getCompletedStepsCount = () => completedSteps.size;
  const progressPercentage = getTotalSteps() > 0 ? (getCompletedStepsCount() / getTotalSteps()) * 100 : 0;

  const phaseLabel = isTravel ? 'Day' : 'Phase';
  const phasesLabel = isTravel ? 'Days' : 'Phases';
  const headerTitle = isTravel ? 'Travel Itinerary' : 'Learning Phases';

  return (
    <div className="h-full flex flex-col">
      {/* Header with Close Button */}
      <div className="p-6 border-b border-slate-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-slate-800">{headerTitle}</h2>
          <button
            onClick={() => setShowSteps(!showSteps)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors duration-200"
            style={{ color: theme.primary }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-slate-600">
            <span>Overall Progress</span>
            <span>{getCompletedStepsCount()} of {getTotalSteps()} {isTravel ? 'activities' : 'steps'} completed</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div 
              className="h-2 rounded-full transition-all duration-300"
              style={{ 
                width: `${progressPercentage}%`,
                background: `linear-gradient(90deg, ${theme.primary} 0%, ${theme.secondary} 100%)`
              }}
            />
          </div>
        </div>
      </div>

      {/* Phases List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {phases.map((phase) => {
          const isExpanded = expandedPhase === phase.number;
          const phaseCompletedSteps = phase.steps.filter((_, stepIndex) => 
            completedSteps.has(`${phase.number}-${stepIndex}`)
          ).length;
          const phaseProgress = phase.steps.length > 0 ? (phaseCompletedSteps / phase.steps.length) * 100 : 0;

          return (
            <div
              key={phase.number}
              className="rounded-xl border-2 transition-all duration-200 hover:shadow-md"
              style={{
                backgroundColor: `${theme.primary}08`,
                borderColor: `${theme.primary}30`,
              }}
            >
              {/* Phase Header - IMPROVED: Clickable to expand/collapse */}
              <div 
                className="p-4 rounded-t-xl cursor-pointer transition-all duration-200 hover:bg-opacity-80"
                style={{
                  background: `linear-gradient(135deg, ${theme.primary}15 0%, ${theme.secondary}10 100%)`
                }}
                onClick={() => togglePhaseExpanded(phase.number)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-200"
                      style={{ 
                        backgroundColor: isExpanded ? `${theme.primary}30` : `${theme.primary}20`
                      }}
                    >
                      {isTravel ? (
                        <Calendar className="w-5 h-5" style={{ color: theme.primary }} />
                      ) : (
                        <Target className="w-5 h-5" style={{ color: theme.primary }} />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-lg" style={{ color: theme.text }}>
                        {phaseLabel} {phase.number}
                      </h3>
                      <p className="text-sm font-medium" style={{ color: theme.text + 'CC' }}>
                        {phase.name}
                      </p>
                    </div>
                  </div>
                  
                  {/* Expansion Indicator */}
                  <div
                    className="p-2 rounded-lg transition-all duration-200"
                    style={{ 
                      color: theme.primary,
                      backgroundColor: isExpanded ? `${theme.primary}20` : 'transparent',
                      transform: isExpanded ? 'scale(1.1)' : 'scale(1)'
                    }}
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5" />
                    ) : (
                      <ChevronRight className="w-5 h-5" />
                    )}
                  </div>
                </div>

                {/* Phase Progress */}
                <div className="mt-3 space-y-1">
                  <div className="flex justify-between text-xs" style={{ color: theme.text + 'AA' }}>
                    <span>{phaseCompletedSteps} of {phase.steps.length} {isTravel ? 'activities' : 'steps'}</span>
                    <span>{Math.round(phaseProgress)}%</span>
                  </div>
                  <div className="w-full bg-white/50 rounded-full h-1.5">
                    <div 
                      className="h-1.5 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${phaseProgress}%`,
                        backgroundColor: theme.primary
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Phase Steps - IMPROVED: Only show when expanded */}
              {isExpanded && (
                <div className="p-4 pt-0 space-y-3 animate-in slide-in-from-top-2 duration-300">
                  {phase.steps.map((step, stepIndex) => {
                    const stepId = `${phase.number}-${stepIndex}`;
                    const isCompleted = completedSteps.has(stepId);

                    return (
                      <div
                        key={stepIndex}
                        className="flex items-start space-x-3 p-3 rounded-lg transition-all duration-200 hover:shadow-sm"
                        style={{
                          backgroundColor: isCompleted ? `${theme.primary}10` : 'white',
                          border: `1px solid ${theme.primary}20`
                        }}
                      >
                        {/* Completion Checkbox */}
                        <button
                          onClick={() => toggleStepCompleted(phase.number, stepIndex)}
                          className="mt-1 flex-shrink-0 hover:scale-110 transition-transform duration-200"
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5" style={{ color: theme.primary }} />
                          ) : (
                            <Circle className="w-5 h-5 hover:opacity-70 transition-colors duration-200" style={{ color: `${theme.primary}60` }} />
                          )}
                        </button>

                        {/* Step Content */}
                        <div className="flex-1 min-w-0">
                          <h4 className={`font-medium text-sm leading-tight mb-1 transition-all duration-200 ${
                            isCompleted ? 'line-through opacity-70' : ''
                          }`} style={{ color: theme.text }}>
                            {step.title}
                          </h4>
                          <p className={`text-xs leading-relaxed transition-all duration-200 ${
                            isCompleted ? 'opacity-70' : ''
                          }`} style={{ color: theme.text + 'BB' }}>
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer */}
      {phases.length > 0 && (
        <div 
          className="p-4 border-t"
          style={{ 
            backgroundColor: `${theme.background}60`,
            borderTopColor: `${theme.primary}30`
          }}
        >
          <div className="text-center">
            {getCompletedStepsCount() === getTotalSteps() ? (
              <div className="font-semibold" style={{ color: theme.primary }}>
                🎉 {isTravel ? 'Trip completed!' : 'All phases completed!'}
              </div>
            ) : (
              <div className="text-sm" style={{ color: theme.text + 'AA' }}>
                {phases.length} {phasesLabel.toLowerCase()} • {getTotalSteps() - getCompletedStepsCount()} {isTravel ? 'activities' : 'steps'} remaining
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StepsPanel;