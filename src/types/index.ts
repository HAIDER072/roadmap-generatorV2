export type Category = 'kitchen_recipe' | 'travel_planner' | 'project' | 'fitness_planner' | 'subject';

export interface ChatMessage {
  id: string;
  text: string;
  isBot: boolean;
  timestamp: Date;
  category?: Category;
}

export interface RoadmapNode {
  id: string;
  title: string;
  description: string;
  x: number;
  y: number;
  level: number;
  category: Category;
  connections: string[];
  isPhase?: boolean;
  isStep?: boolean;
  phaseNumber?: number;
  stepNumber?: number;
  isLeft?: boolean; // For tree branch positioning
  resources?: {
    youtubeVideos?: Array<{
      title: string;
      url: string;
      videoId: string;
      thumbnail: string;
    }>;
    mapLocations?: Array<{
      title: string;
      mapUrl: string;
      embedUrl: string;
      description: string;
    }>;
    aiSummary: string;
    searchResults: Array<{
      title: string;
      url: string;
      description: string;
    }>;
  };
}

export interface CategoryTheme {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
}