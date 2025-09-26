import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Connection,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  BackgroundVariant,
  NodeTypes,
  EdgeTypes,
  MarkerType,
  ReactFlowInstance,
  Position,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { RoadmapNode as RoadmapNodeType, Category } from '../types';
import NodeDetail from './NodeDetail';
import PhaseDetail from './PhaseDetail';
import { getCategoryTheme } from '../utils/themes';
import { Sparkles, Target } from 'lucide-react';
import CustomRoadmapNode from './CustomRoadmapNode';
import CustomEdge from './CustomEdge';

interface RoadmapCanvasProps {
  nodes: RoadmapNodeType[];
  category: Category;
  isGenerating?: boolean;
  hasGenerated?: boolean;
  isViewMode?: boolean;
}

const RoadmapCanvas: React.FC<RoadmapCanvasProps> = ({ 
  nodes: roadmapNodes, 
  category, 
  isGenerating = false,
  hasGenerated = false,
  isViewMode = false
}) => {
  const [selectedNode, setSelectedNode] = useState<RoadmapNodeType | null>(null);
  const [selectedPhase, setSelectedPhase] = useState<RoadmapNodeType | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [hasInitialCentered, setHasInitialCentered] = useState(false);
  const theme = getCategoryTheme(category);
  const prevRoadmapNodesRef = useRef<RoadmapNodeType[]>([]);

  // Get all phases and steps for navigation
  const allPhases = useMemo(() => 
    roadmapNodes.filter(node => node.isPhase).sort((a, b) => (a.phaseNumber || 0) - (b.phaseNumber || 0)),
    [roadmapNodes]
  );

  // Center to Phase 1 function with animation
  const centerToPhaseOne = useCallback(() => {
    if (reactFlowInstance && roadmapNodes.length > 0) {
      const firstPhase = roadmapNodes.find(node => node.isPhase && node.phaseNumber === 1);
      if (firstPhase) {
        // Animate to center with zoom
        reactFlowInstance.setCenter(firstPhase.x, firstPhase.y, { 
          zoom: 0.7,
          duration: 200 // Faster animation
        });
        
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
      }
    }
  }, [reactFlowInstance, roadmapNodes]);

  // Listen for clear canvas event
  useEffect(() => {
    const handleClearCanvas = () => {
      console.log('🧹 Clearing canvas completely');
      setSelectedNode(null);
      setSelectedPhase(null);
      setShowToast(false);
      setIsBlocked(false);
      setHasInitialCentered(false);
      
      setNodes([]);
      setEdges([]);
      
      prevRoadmapNodesRef.current = [];
    };

    window.addEventListener('clearCanvas', handleClearCanvas);
    return () => {
      window.removeEventListener('clearCanvas', handleClearCanvas);
    };
  }, []);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!selectedNode && !selectedPhase) return;
      
      if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
        event.preventDefault();
        
        if (selectedPhase) {
          if (event.key === 'ArrowLeft') {
            handlePhaseNavigation('prev');
          } else if (event.key === 'ArrowRight') {
            handlePhaseNavigation('next');
          }
        } else if (selectedNode && selectedNode.isStep) {
          if (event.key === 'ArrowLeft') {
            handleStepNavigation('prev');
          } else if (event.key === 'ArrowRight') {
            handleStepNavigation('next');
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [selectedNode, selectedPhase]);

  // Convert roadmap nodes to React Flow format
  const convertToFlowNodes = useCallback((roadmapNodes: RoadmapNodeType[]): Node[] => {
    return roadmapNodes.map((node, index) => ({
      id: node.id,
      type: 'customRoadmap',
      position: { x: node.x - (node.isPhase ? 160 : 128), y: node.y - (node.isPhase ? 66 : 100) },
      data: {
        ...node,
        index: node.isStep ? node.stepNumber : node.phaseNumber,
        theme,
        onNodeClick: (nodeData: RoadmapNodeType) => {
          if (nodeData.isPhase) {
            setSelectedPhase(nodeData);
          } else {
            setSelectedNode(nodeData);
          }
        },
      },
      draggable: false,
    }));
  }, [theme]);

  // Convert connections to React Flow edges
  const convertToFlowEdges = useCallback((roadmapNodes: RoadmapNodeType[]): Edge[] => {
    const edges: Edge[] = [];
    
    roadmapNodes.forEach((node) => {
      if (node.isPhase && node.connections) {
        node.connections.forEach((connectionId, connectionIndex) => {
          const targetStep = roadmapNodes.find(n => n.id === connectionId);
          
          if (targetStep) {
            const isLeftBranch = targetStep.isLeft;
            const sourceHandleId = isLeftBranch ? 'left' : 'right';
            
            edges.push({
              id: `${node.id}-${connectionId}`,
              source: node.id,
              target: connectionId,
              sourceHandle: sourceHandleId,
              type: 'customEdge',
              animated: true,
              sourcePosition: isLeftBranch ? Position.Left : Position.Right,
              targetPosition: isLeftBranch ? Position.Right : Position.Left,
              markerEnd: {
                type: MarkerType.ArrowClosed,
                width: 20,
                height: 20,
                color: theme.secondary,
              },
              style: {
                stroke: theme.secondary,
                strokeWidth: 4,
              },
              data: { 
                theme, 
                isBranch: true,
                isLeftBranch: isLeftBranch
              },
            });
          }
        });
      }
      
      if (node.isPhase) {
        const nextPhase = roadmapNodes.find(n => 
          n.isPhase && n.phaseNumber === (node.phaseNumber || 0) + 1
        );
        
        if (nextPhase) {
          edges.push({
            id: `phase-${node.phaseNumber}-${nextPhase.phaseNumber}`,
            source: node.id,
            target: nextPhase.id,
            sourceHandle: 'bottom',
            type: 'customEdge',
            animated: true,
            sourcePosition: Position.Bottom,
            targetPosition: Position.Top,
            markerEnd: {
              type: MarkerType.ArrowClosed,
              width: 26,
              height: 26,
              color: theme.primary,
            },
            style: {
              stroke: theme.primary,
              strokeWidth: 6,
            },
            data: { theme, isTrunk: true },
          });
        }
      }
    });

    return edges;
  }, [theme]);

  const flowNodes = useMemo(() => {
    if (roadmapNodes.length > 0) {
      return convertToFlowNodes(roadmapNodes);
    }
    return [];
  }, [roadmapNodes, convertToFlowNodes]);

  const flowEdges = useMemo(() => {
    if (roadmapNodes.length > 0) {
      return convertToFlowEdges(roadmapNodes);
    }
    return [];
  }, [roadmapNodes, convertToFlowEdges]);

  const [nodes, setNodes, onNodesChange] = useNodesState(flowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(flowEdges);

  // Update nodes and edges when roadmapNodes change
  useEffect(() => {
    const hasChanged = JSON.stringify(roadmapNodes) !== JSON.stringify(prevRoadmapNodesRef.current);
    
    if (hasChanged) {
      if (roadmapNodes.length === 0) {
        console.log('🧹 Roadmap nodes cleared, clearing canvas');
        setNodes([]);
        setEdges([]);
        setSelectedNode(null);
        setSelectedPhase(null);
        setShowToast(false);
        setHasInitialCentered(false);
        prevRoadmapNodesRef.current = [];
      } else {
        console.log('Roadmap nodes changed, updating flow:', roadmapNodes.length);
        
        const newNodes = convertToFlowNodes(roadmapNodes);
        const newEdges = convertToFlowEdges(roadmapNodes);
        
        setNodes(newNodes);
        setEdges(newEdges);
        
        prevRoadmapNodesRef.current = [...roadmapNodes];
        
        // Auto-center immediately when nodes are ready
        if (reactFlowInstance && newNodes.length > 0 && !hasInitialCentered) {
          // Use requestAnimationFrame to ensure DOM is updated
          requestAnimationFrame(() => {
            centerToPhaseOne();
            setHasInitialCentered(true);
          });
        }
      }
    }
  }, [roadmapNodes, convertToFlowNodes, convertToFlowEdges, setNodes, setEdges, reactFlowInstance, hasInitialCentered, centerToPhaseOne]);

  // Auto-center for view mode when ReactFlow instance is ready
  useEffect(() => {
    if (isViewMode && reactFlowInstance && roadmapNodes.length > 0 && !hasInitialCentered) {
      // Immediate centering for view mode
      requestAnimationFrame(() => {
        centerToPhaseOne();
        setHasInitialCentered(true);
      });
    }
  }, [isViewMode, reactFlowInstance, roadmapNodes.length, hasInitialCentered, centerToPhaseOne]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  const onInit = useCallback((instance: ReactFlowInstance) => {
    console.log('ReactFlow initialized');
    setReactFlowInstance(instance);
  }, []);

  // Navigation handlers
  const handlePhaseNavigation = useCallback((direction: 'prev' | 'next') => {
    if (!selectedPhase) return;
    
    const currentIndex = allPhases.findIndex(p => p.phaseNumber === selectedPhase.phaseNumber);
    let newIndex;
    
    if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'next' && currentIndex < allPhases.length - 1) {
      newIndex = currentIndex + 1;
    } else {
      return;
    }
    
    setSelectedPhase(allPhases[newIndex]);
  }, [selectedPhase, allPhases]);

  const handleStepNavigation = useCallback((direction: 'prev' | 'next') => {
    if (!selectedNode || !selectedNode.isStep) return;
    
    const phaseSteps = roadmapNodes.filter(n => 
      n.isStep && n.phaseNumber === selectedNode.phaseNumber
    ).sort((a, b) => (a.stepNumber || 0) - (b.stepNumber || 0));
    
    const currentIndex = phaseSteps.findIndex(step => step.id === selectedNode.id);
    let newIndex;
    
    if (direction === 'prev' && currentIndex > 0) {
      newIndex = currentIndex - 1;
    } else if (direction === 'next' && currentIndex < phaseSteps.length - 1) {
      newIndex = currentIndex + 1;
    } else {
      return;
    }
    
    setSelectedNode(phaseSteps[newIndex]);
  }, [selectedNode, roadmapNodes]);

  const handleBackToPhase = useCallback(() => {
    if (selectedNode && selectedNode.phaseNumber) {
      const phase = roadmapNodes.find(n => n.isPhase && n.phaseNumber === selectedNode.phaseNumber);
      if (phase) {
        setSelectedNode(null);
        setSelectedPhase(phase);
      }
    }
  }, [selectedNode, roadmapNodes]);

  const nodeTypes: NodeTypes = useMemo(
    () => ({
      customRoadmap: CustomRoadmapNode,
    }),
    []
  );

  const edgeTypes: EdgeTypes = useMemo(
    () => ({
      customEdge: CustomEdge,
    }),
    []
  );

  const renderEmptyState = () => {
    if (isGenerating) {
      return (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-gradient-to-br from-white/90 to-slate-50/90 backdrop-blur-sm">
          <div className="text-center max-w-md">
            <div className="w-24 h-24 mx-auto mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
              <Sparkles className="w-12 h-12 text-white animate-spin" />
            </div>
            <h3 className="text-3xl font-bold text-slate-800 mb-4">Crafting Your Roadmap</h3>
            <p className="text-slate-600 text-lg mb-6">AI is designing a personalized roadmap...</p>
            <div className="flex justify-center space-x-2">
              <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce"></div>
              <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-3 h-3 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      );
    }

    if (!hasGenerated) {
      return (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center max-w-2xl px-8">
            <div className="w-32 h-32 mx-auto mb-8 bg-white rounded-3xl flex items-center justify-center shadow-xl border border-slate-200 overflow-hidden">
              <img 
                src="/chartly_logo.png" 
                alt="Flowniq Logo" 
                className="w-20 h-20 object-contain"
              />
            </div>
            <h3 className="text-4xl font-bold text-slate-800 mb-6">Welcome to Flowniq</h3>
            <p className="text-slate-600 text-xl mb-4">Your AI-powered roadmap generator</p>
            <p className="text-slate-500 text-lg mb-8">Transform your goals into clear, tree-structured visual roadmaps</p>
            </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="w-full h-full relative">
      {/* Center to Phase 1 Button */}
      {roadmapNodes.length > 0 && !isGenerating && (
        <div className="absolute top-4 right-4 z-40">
          <button
            onClick={centerToPhaseOne}
            className="flex items-center justify-center space-x-2 px-4 py-3 bg-white/95 backdrop-blur-md rounded-xl shadow-lg border border-slate-200 hover:bg-white hover:shadow-xl transition-all duration-200 text-sm font-medium hover:scale-105"
            style={{ 
              color: theme.primary,
              borderColor: `${theme.primary}40`,
            }}
            title="Center to Phase 1"
          >
            <Target className="w-4 h-4" />
            <span>Center to Phase 1</span>
          </button>
        </div>
      )}

      {/* Blocking overlay when generating AI content */}
      {isBlocked && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white animate-spin" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Generating AI Content</h3>
            <p className="text-slate-600">Please wait while we fetch detailed information...</p>
          </div>
        </div>
      )}

      {/* Empty State or Loading */}
      {(roadmapNodes.length === 0 || isGenerating) && renderEmptyState()}

      {/* Toast Message */}
      {showToast && (
        <div 
          className="absolute top-32 left-1/2 transform -translate-x-1/2 z-40 px-6 py-3 rounded-xl shadow-xl backdrop-blur-md text-white font-medium animate-pulse"
          style={{
            background: `linear-gradient(135deg, ${theme.primary} 0%, ${theme.secondary} 100%)`,
          }}
        >
          <div className="flex items-center space-x-2">
            <div 
              className="w-2 h-2 rounded-full animate-ping"
              style={{ backgroundColor: 'rgba(255, 255, 255, 0.8)' }}
            ></div>
            <span className="text-sm">Centered on Phase 1 • Scroll to explore • Click nodes for details</span>
          </div>
        </div>
      )}

      {/* React Flow Canvas */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onInit={onInit}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView={false}
        minZoom={0.1}
        maxZoom={1.5}
        defaultViewport={{ x: 0, y: 0, zoom: 0.4 }}
        style={{
          background: `radial-gradient(ellipse at center, ${theme.background}40 0%, ${theme.secondary}10 70%, transparent 100%)`,
        }}
        proOptions={{ hideAttribution: true }}
        nodesDraggable={false}
        nodesConnectable={false}
        elementsSelectable={true}
      >
        <Background 
          variant={BackgroundVariant.Dots} 
          gap={32} 
          size={2} 
          color={theme.primary + '15'}
        />
        
        <Controls 
          position="bottom-right"
          style={{
            bottom: 32,
            right: 32,
          }}
          showZoom={true}
          showFitView={true}
          showInteractive={false}
        />
      </ReactFlow>

      {/* Step Detail Modal */}
      {selectedNode && (
        <NodeDetail
          node={selectedNode}
          allNodes={roadmapNodes}
          onClose={() => setSelectedNode(null)}
          onStepNavigate={handleStepNavigation}
          onBackToPhase={handleBackToPhase}
          isBlocked={isBlocked}
          setIsBlocked={setIsBlocked}
        />
      )}

      {/* Phase Detail Modal */}
      {selectedPhase && (
        <PhaseDetail
          phase={selectedPhase}
          allNodes={roadmapNodes}
          onClose={() => setSelectedPhase(null)}
          onStepClick={(step) => {
            setSelectedPhase(null);
            setSelectedNode(step);
          }}
          onPhaseNavigate={handlePhaseNavigation}
        />
      )}
    </div>
  );
};

export default RoadmapCanvas;