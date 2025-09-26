import React from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer } from '@xyflow/react';
import { CategoryTheme } from '../types';

interface CustomEdgeData {
  theme: CategoryTheme;
  isBranch?: boolean;
  isTrunk?: boolean;
  isLeftBranch?: boolean;
}

const CustomEdge: React.FC<EdgeProps<CustomEdgeData>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}) => {
  const isBranch = data?.isBranch;
  const isTrunk = data?.isTrunk;
  const isLeftBranch = data?.isLeftBranch;
  
  let edgePath: string;
  let labelX: number;
  let labelY: number;
  
  if (isBranch) {
    // For branch connections: proper curved path from phase side to step side
    if (isLeftBranch) {
      // Left branch: phase left side to step right side
      const controlX1 = sourceX - 80; // Control point closer to source
      const controlX2 = targetX + 80; // Control point closer to target
      edgePath = `M ${sourceX} ${sourceY} C ${controlX1} ${sourceY}, ${controlX2} ${targetY}, ${targetX} ${targetY}`;
    } else {
      // Right branch: phase right side to step left side
      const controlX1 = sourceX + 80; // Control point closer to source
      const controlX2 = targetX - 80; // Control point closer to target
      edgePath = `M ${sourceX} ${sourceY} C ${controlX1} ${sourceY}, ${controlX2} ${targetY}, ${targetX} ${targetY}`;
    }
    labelX = sourceX + (targetX - sourceX) * 0.5;
    labelY = sourceY + (targetY - sourceY) * 0.5;
  } else if (isTrunk) {
    // For trunk connections: smooth vertical bezier path
    [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  } else {
    // Default bezier path
    [edgePath, labelX, labelY] = getBezierPath({
      sourceX,
      sourceY,
      sourcePosition,
      targetX,
      targetY,
      targetPosition,
    });
  }

  const strokeWidth = isTrunk ? 6 : 4;
  const glowWidth = strokeWidth + 4;
  const primaryColor = data?.theme?.primary || '#8b5cf6';
  const secondaryColor = data?.theme?.secondary || '#7c3aed';
  const edgeColor = isTrunk ? primaryColor : secondaryColor;

  return (
    <>
      {/* Gradient and glow definitions */}
      <defs>
        <linearGradient id={`gradient-${id}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={edgeColor} stopOpacity="0.9" />
          <stop offset="100%" stopColor={edgeColor} stopOpacity="0.7" />
        </linearGradient>
        <filter id={`glow-${id}`}>
          <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
          <feMerge> 
            <feMergeNode in="coloredBlur"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
      </defs>
      
      {/* Glow effect */}
      <path
        id={`${id}-glow`}
        style={{
          stroke: edgeColor,
          strokeWidth: glowWidth,
          fill: 'none',
          opacity: 0.4,
          filter: `url(#glow-${id})`,
        }}
        d={edgePath}
      />
      
      {/* Main edge path */}
      <path
        id={id}
        style={{
          stroke: `url(#gradient-${id})`,
          strokeWidth: strokeWidth,
          fill: 'none',
          filter: 'drop-shadow(0 3px 12px rgba(0,0,0,0.2))',
        }}
        className="react-flow__edge-path"
        d={edgePath}
        markerEnd={markerEnd}
      />
      
      {/* Animated flow dots for trunk connections */}
      {isTrunk && (
        <path
          style={{
            stroke: secondaryColor,
            strokeWidth: 3,
            fill: 'none',
            strokeDasharray: '12,18',
            opacity: 0.8,
          }}
          className="animate-pulse"
          d={edgePath}
        />
      )}

      {/* Animated moving dot for branch connections */}
      {isBranch && (
        <circle
          r="4"
          fill={edgeColor}
          opacity="0.9"
        >
          <animateMotion
            dur="2.5s"
            repeatCount="indefinite"
            path={edgePath}
          />
        </circle>
      )}

      {/* Animated moving dot for trunk connections */}
      {isTrunk && (
        <circle
          r="6"
          fill={primaryColor}
          opacity="0.8"
        >
          <animateMotion
            dur="4s"
            repeatCount="indefinite"
            path={edgePath}
          />
        </circle>
      )}

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          {/* Optional: Add edge labels here */}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

export default CustomEdge;