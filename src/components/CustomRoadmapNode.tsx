import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { RoadmapNode, CategoryTheme } from '../types';
import { ChefHat, MapPin, Briefcase, Dumbbell, Sparkles, Target, CheckCircle, Calendar } from 'lucide-react';

interface CustomNodeData extends RoadmapNode {
  index?: number;
  theme: CategoryTheme;
  onNodeClick: (node: RoadmapNode) => void;
}

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
    default:
      return Sparkles;
  }
};

const CustomRoadmapNode: React.FC<NodeProps<CustomNodeData>> = ({ data }) => {
  const IconComponent = getCategoryIcon(data.category);
  const isPhase = data.isPhase;
  const isStep = data.isStep;
  const isTravel = data.category === 'travel_planner';

  const handleClick = () => {
    data.onNodeClick(data);
  };

  if (isPhase) {
    // Phase Node (Main trunk node) - with travel-specific labels
    const phaseLabel = isTravel ? 'Day' : 'Phase';
    
    return (
      <div className="relative group">
        {/* Input Handle - Top (only for non-first phases) */}
        {data.phaseNumber && data.phaseNumber > 1 && (
          <Handle
            type="target"
            position={Position.Top}
            style={{
              background: data.theme.primary,
              width: 20,
              height: 20,
              border: `4px solid white`,
              boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
            }}
          />
        )}

        {/* Left Handle for left-side steps */}
        <Handle
          type="source"
          position={Position.Left}
          id="left"
          style={{
            background: data.theme.secondary,
            width: 16,
            height: 16,
            border: `3px solid white`,
            boxShadow: '0 3px 12px rgba(0,0,0,0.2)',
            left: -8,
          }}
        />

        {/* Right Handle for right-side steps */}
        <Handle
          type="source"
          position={Position.Right}
          id="right"
          style={{
            background: data.theme.secondary,
            width: 16,
            height: 16,
            border: `3px solid white`,
            boxShadow: '0 3px 12px rgba(0,0,0,0.2)',
            right: -8,
          }}
        />

        {/* Phase Container */}
        <div
          onClick={handleClick}
          className="relative bg-white rounded-2xl shadow-2xl border-4 hover:shadow-3xl transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-3 w-80 h-36"
          style={{
            borderColor: data.theme.primary,
            background: `linear-gradient(135deg, ${data.theme.primary} 0%, ${data.theme.secondary} 100%)`,
          }}
          title="Click to explore"
        >
          {/* Phase Content */}
          <div className="p-6 h-full flex items-center justify-center text-white">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                {isTravel ? (
                  <Calendar className="w-8 h-8" />
                ) : (
                  <Target className="w-8 h-8" />
                )}
              </div>
              <div className="text-center">
                {/* Show "Day X:" or "Phase X:" as small text */}
                <p className="text-white/80 text-sm font-medium mb-1">
                  {phaseLabel} {data.phaseNumber}:
                </p>
                {/* Large phase name - this is the main focus */}
                <h3 className="font-bold text-2xl leading-tight">
                  {data.title}
                </h3>
              </div>
            </div>
          </div>

          {/* Enhanced glow effect */}
          <div 
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-40 transition-opacity duration-300 pointer-events-none blur-2xl"
            style={{
              background: `linear-gradient(135deg, ${data.theme.primary} 0%, ${data.theme.secondary} 100%)`,
              transform: 'scale(1.15)',
              zIndex: -1,
            }}
          />

          {/* Hover tooltip */}
          <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            Click to explore
          </div>
        </div>

        {/* Output Handle - Bottom (for next phase) */}
        <Handle
          type="source"
          position={Position.Bottom}
          id="bottom"
          style={{
            background: data.theme.primary,
            width: 20,
            height: 20,
            border: `4px solid white`,
            boxShadow: '0 4px 16px rgba(0,0,0,0.25)',
          }}
        />
      </div>
    );
  }

  if (isStep) {
    // Step Node (Branch node) - with travel-specific labels
    const stepLabel = isTravel ? 'Activity' : 'Step';
    
    return (
      <div className="relative group">
        {/* Input Handle - Side (connects to phase) */}
        <Handle
          type="target"
          position={data.isLeft ? Position.Right : Position.Left}
          style={{
            background: data.theme.secondary,
            width: 14,
            height: 14,
            border: `3px solid white`,
            boxShadow: '0 3px 10px rgba(0,0,0,0.2)',
            [data.isLeft ? 'right' : 'left']: -7,
          }}
        />

        {/* Step Container */}
        <div
          onClick={handleClick}
          className="relative bg-white rounded-xl shadow-lg border-2 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:scale-105 w-56 h-32"
          style={{
            borderColor: data.theme.secondary + '60',
            background: `linear-gradient(135deg, white 0%, ${data.theme.background}80 100%)`,
          }}
          title="Click to explore"
        >
          {/* Header */}
          <div 
            className="flex items-center justify-between p-3 rounded-t-xl text-white h-10"
            style={{
              background: `linear-gradient(135deg, ${data.theme.secondary}90 0%, ${data.theme.primary}90 100%)`,
            }}
          >
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-4 h-4" />
              <span className="font-semibold text-sm">{stepLabel} {data.stepNumber}</span>
            </div>
            <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center">
              <span className="text-xs font-bold">{data.stepNumber}</span>
            </div>
          </div>

          {/* Content - IMPROVED: Only show title, no description */}
          <div className="p-3 h-22 flex flex-col justify-center">
            <h4 className="font-semibold text-slate-800 text-sm leading-tight text-center">
              {data.title}
            </h4>
          </div>

          {/* Hover Effect Overlay */}
          <div 
            className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-10 transition-opacity duration-300 pointer-events-none"
            style={{
              background: `linear-gradient(135deg, ${data.theme.secondary} 0%, ${data.theme.primary} 100%)`,
            }}
          />

          {/* Hover tooltip */}
          <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
            Click to explore
          </div>
        </div>
      </div>
    );
  }

  // Fallback to original node design
  return (
    <div className="relative group">
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: data.theme.primary,
          width: 14,
          height: 14,
          border: `3px solid white`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}
      />

      <div
        onClick={handleClick}
        className="relative bg-white rounded-xl shadow-xl border-2 hover:shadow-2xl transition-all duration-300 cursor-pointer transform hover:scale-105 hover:-translate-y-2 w-64 h-48"
        style={{
          borderColor: data.theme.primary,
          background: `linear-gradient(135deg, white 0%, ${data.theme.background}60 100%)`,
        }}
        title="Click to explore"
      >
        <div 
          className="flex items-center justify-between p-4 rounded-t-xl text-white h-16"
          style={{
            background: `linear-gradient(135deg, ${data.theme.primary} 0%, ${data.theme.secondary} 100%)`,
          }}
        >
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
              <IconComponent className="w-5 h-5" />
            </div>
            <span className="font-bold text-lg">Step {data.index}</span>
          </div>
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border-2 border-white/30">
            <span className="text-sm font-bold">{data.index}</span>
          </div>
        </div>

        <div className="p-4 h-32 flex flex-col justify-between">
          <div>
            <h3 className="font-bold text-slate-800 text-base mb-2 leading-tight line-clamp-2">
              {data.title}
            </h3>
            <p className="text-slate-600 text-sm leading-relaxed line-clamp-3">
              {data.description}
            </p>
          </div>

          {data.resources && (
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2 text-xs text-slate-500">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: data.theme.primary }}></div>
                <span>Resources</span>
              </div>
              <div className="text-xs text-slate-400">
                Click to explore
              </div>
            </div>
          )}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: data.theme.primary,
          width: 14,
          height: 14,
          border: `3px solid white`,
          boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        }}
      />

      {/* Hover tooltip */}
      <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-3 py-1 rounded-lg text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap">
        Click to explore
      </div>
    </div>
  );
};

export default memo(CustomRoadmapNode);