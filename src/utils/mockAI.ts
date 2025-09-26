import { RoadmapNode, Category } from '../types';

export const generateMockRoadmap = (query: string, category: Category): RoadmapNode[] => {
  const roadmaps: Record<Category, (query: string) => RoadmapNode[]> = {
    kitchen_recipe: generateKitchenRoadmap,
    travel_planner: generateTravelRoadmap,
    project: generateProjectRoadmap,
    fitness_planner: generateFitnessRoadmap
  };

  return roadmaps[category](query);
};

const generateKitchenRoadmap = (query: string): RoadmapNode[] => {
  return [
    {
      id: '1',
      title: 'Gather Ingredients',
      description: 'Collect all necessary ingredients and check their freshness',
      x: 600,
      y: 50,
      level: 0,
      category: 'kitchen_recipe',
      connections: ['2'],
      resources: {
        youtubeVideos: [
          { title: 'How to Choose Fresh Ingredients', url: 'https://youtube.com', thumbnail: '' },
          { title: 'Kitchen Prep Basics', url: 'https://youtube.com', thumbnail: '' }
        ],
        aiSummary: 'Start by gathering all ingredients listed in your recipe. Check expiration dates and ensure vegetables are fresh. Organize ingredients by cooking order to streamline the process.',
        searchResults: [
          { title: 'Fresh Ingredient Selection Guide', url: 'https://example.com', description: 'Learn how to select the freshest ingredients for your recipes' },
          { title: 'Kitchen Organization Tips', url: 'https://example.com', description: 'Organize your kitchen for efficient cooking' }
        ]
      }
    },
    {
      id: '2',
      title: 'Prep Work',
      description: 'Wash, chop, and prepare all ingredients',
      x: 600,
      y: 250,
      level: 1,
      category: 'kitchen_recipe',
      connections: ['3'],
      resources: {
        youtubeVideos: [
          { title: 'Knife Skills for Beginners', url: 'https://youtube.com', thumbnail: '' },
          { title: 'Mise en Place Techniques', url: 'https://youtube.com', thumbnail: '' }
        ],
        aiSummary: 'Proper preparation is key to successful cooking. Wash all produce, chop vegetables to uniform sizes, and measure out spices and liquids.',
        searchResults: [
          { title: 'Basic Knife Techniques', url: 'https://example.com', description: 'Master fundamental cutting techniques' },
          { title: 'Food Safety in Prep', url: 'https://example.com', description: 'Keep your prep work safe and sanitary' }
        ]
      }
    },
    {
      id: '3',
      title: 'Cooking Process',
      description: 'Follow recipe steps and cooking techniques',
      x: 600,
      y: 450,
      level: 2,
      category: 'kitchen_recipe',
      connections: ['4'],
      resources: {
        youtubeVideos: [
          { title: 'Understanding Heat Levels', url: 'https://youtube.com', thumbnail: '' },
          { title: 'Timing in Cooking', url: 'https://youtube.com', thumbnail: '' }
        ],
        aiSummary: 'Execute the recipe step by step. Pay attention to cooking times, temperatures, and visual cues. Taste and adjust seasonings as needed.',
        searchResults: [
          { title: 'Cooking Temperature Guide', url: 'https://example.com', description: 'Master temperature control for perfect results' },
          { title: 'Recipe Troubleshooting', url: 'https://example.com', description: 'Fix common cooking mistakes' }
        ]
      }
    },
    {
      id: '4',
      title: 'Plating & Serving',
      description: 'Present your dish beautifully and serve',
      x: 600,
      y: 650,
      level: 3,
      category: 'kitchen_recipe',
      connections: [],
      resources: {
        youtubeVideos: [
          { title: 'Food Plating Techniques', url: 'https://youtube.com', thumbnail: '' },
          { title: 'Restaurant-Style Presentation', url: 'https://youtube.com', thumbnail: '' }
        ],
        aiSummary: 'The final step is presentation. Use appropriate serving dishes, garnish thoughtfully, and serve at the right temperature for the best dining experience.',
        searchResults: [
          { title: 'Plating Like a Pro', url: 'https://example.com', description: 'Professional plating techniques for home cooks' },
          { title: 'Food Photography Tips', url: 'https://example.com', description: 'Make your dishes Instagram-worthy' }
        ]
      }
    }
  ];
};

const generateTravelRoadmap = (query: string): RoadmapNode[] => {
  return [
    {
      id: '1',
      title: 'Research Destination',
      description: 'Learn about your destination\'s culture, weather, and attractions',
      x: 600,
      y: 50,
      level: 0,
      category: 'travel_planner',
      connections: ['2', '3'],
      resources: {
        youtubeVideos: [
          { title: 'Travel Research Tips', url: 'https://youtube.com', thumbnail: '' },
          { title: 'Cultural Etiquette Guide', url: 'https://youtube.com', thumbnail: '' }
        ],
        aiSummary: 'Start your travel planning by researching your destination thoroughly. Learn about local customs, weather patterns, must-see attractions, and cultural norms.',
        searchResults: [
          { title: 'Destination Travel Guides', url: 'https://example.com', description: 'Comprehensive guides for popular destinations' },
          { title: 'Weather Planning Tools', url: 'https://example.com', description: 'Plan your trip based on weather patterns' }
        ]
      }
    },
    {
      id: '2',
      title: 'Budget Planning',
      description: 'Set your travel budget and track expenses',
      x: 350,
      y: 250,
      level: 1,
      category: 'travel_planner',
      connections: ['4'],
      resources: {
        youtubeVideos: [
          { title: 'Travel Budget Breakdown', url: 'https://youtube.com', thumbnail: '' },
          { title: 'Money-Saving Travel Tips', url: 'https://youtube.com', thumbnail: '' }
        ],
        aiSummary: 'Create a realistic budget that covers transportation, accommodation, food, activities, and emergency funds. Track your spending to stay on budget.',
        searchResults: [
          { title: 'Travel Budget Calculator', url: 'https://example.com', description: 'Calculate your travel costs accurately' },
          { title: 'Budget Travel Strategies', url: 'https://example.com', description: 'Travel more for less money' }
        ]
      }
    },
    {
      id: '3',
      title: 'Book Transportation',
      description: 'Secure flights, trains, or other transportation',
      x: 850,
      y: 250,
      level: 1,
      category: 'travel_planner',
      connections: ['4'],
      resources: {
        youtubeVideos: [
          { title: 'Flight Booking Strategies', url: 'https://youtube.com', thumbnail: '' },
          { title: 'Transportation Options Guide', url: 'https://youtube.com', thumbnail: '' }
        ],
        aiSummary: 'Book your transportation early for better prices. Compare different options and consider factors like travel time, comfort, and cost.',
        searchResults: [
          { title: 'Flight Comparison Sites', url: 'https://example.com', description: 'Find the best flight deals' },
          { title: 'Travel Insurance Guide', url: 'https://example.com', description: 'Protect your travel investment' }
        ]
      }
    },
    {
      id: '4',
      title: 'Plan Itinerary',
      description: 'Create a detailed day-by-day itinerary',
      x: 600,
      y: 450,
      level: 2,
      category: 'travel_planner',
      connections: ['5'],
      resources: {
        youtubeVideos: [
          { title: 'Itinerary Planning Tips', url: 'https://youtube.com', thumbnail: '' },
          { title: 'Must-See Attractions Guide', url: 'https://youtube.com', thumbnail: '' }
        ],
        aiSummary: 'Plan your activities day by day, but leave room for spontaneity. Book popular attractions in advance and consider travel time between locations.',
        searchResults: [
          { title: 'Itinerary Templates', url: 'https://example.com', description: 'Ready-made itinerary templates' },
          { title: 'Local Experience Booking', url: 'https://example.com', description: 'Book unique local experiences' }
        ]
      }
    },
    {
      id: '5',
      title: 'Pack & Prepare',
      description: 'Pack efficiently and prepare travel documents',
      x: 600,
      y: 650,
      level: 3,
      category: 'travel_planner',
      connections: [],
      resources: {
        youtubeVideos: [
          { title: 'Packing Strategies', url: 'https://youtube.com', thumbnail: '' },
          { title: 'Travel Document Checklist', url: 'https://youtube.com', thumbnail: '' }
        ],
        aiSummary: 'Pack smart with a detailed checklist. Ensure all travel documents are valid and easily accessible. Prepare for different weather conditions.',
        searchResults: [
          { title: 'Packing Checklists', url: 'https://example.com', description: 'Never forget important items again' },
          { title: 'Travel Safety Tips', url: 'https://example.com', description: 'Stay safe while traveling' }
        ]
      }
    }
  ];
};

const generateProjectRoadmap = (query: string): RoadmapNode[] => {
  return [
    {
      id: '1',
      title: 'Define Requirements',
      description: 'Clearly outline project goals and requirements',
      x: 600,
      y: 50,
      level: 0,
      category: 'project',
      connections: ['2'],
      resources: {
        youtubeVideos: [
          { title: 'Requirements Gathering', url: 'https://youtube.com', thumbnail: '' },
          { title: 'Project Scope Definition', url: 'https://youtube.com', thumbnail: '' }
        ],
        aiSummary: 'Start by clearly defining what you want to achieve. Write down specific, measurable goals and identify all stakeholders and their needs.',
        searchResults: [
          { title: 'Requirements Template', url: 'https://example.com', description: 'Professional requirements documentation templates' },
          { title: 'Stakeholder Analysis Guide', url: 'https://example.com', description: 'Identify and manage project stakeholders' }
        ]
      }
    },
    {
      id: '2',
      title: 'Create Project Plan',
      description: 'Develop timeline, milestones, and resource allocation',
      x: 600,
      y: 250,
      level: 1,
      category: 'project',
      connections: ['3', '4'],
      resources: {
        youtubeVideos: [
          { title: 'Project Planning Basics', url: 'https://youtube.com', thumbnail: '' },
          { title: 'Gantt Chart Creation', url: 'https://youtube.com', thumbnail: '' }
        ],
        aiSummary: 'Create a detailed project plan with timelines, milestones, and resource requirements. Break down large tasks into manageable components.',
        searchResults: [
          { title: 'Project Management Tools', url: 'https://example.com', description: 'Compare popular project management software' },
          { title: 'Timeline Planning Templates', url: 'https://example.com', description: 'Professional project timeline templates' }
        ]
      }
    },
    {
      id: '3',
      title: 'Execute Tasks',
      description: 'Implement the project according to your plan',
      x: 350,
      y: 450,
      level: 2,
      category: 'project',
      connections: ['5'],
      resources: {
        youtubeVideos: [
          { title: 'Task Management Tips', url: 'https://youtube.com', thumbnail: '' },
          { title: 'Productivity Techniques', url: 'https://youtube.com', thumbnail: '' }
        ],
        aiSummary: 'Execute your project plan systematically. Focus on one task at a time and track progress regularly. Adjust plans as needed.',
        searchResults: [
          { title: 'Productivity Methods', url: 'https://example.com', description: 'Proven methods to boost productivity' },
          { title: 'Task Prioritization', url: 'https://example.com', description: 'Prioritize tasks effectively' }
        ]
      }
    },
    {
      id: '4',
      title: 'Monitor Progress',
      description: 'Track progress and adjust plans as needed',
      x: 850,
      y: 450,
      level: 2,
      category: 'project',
      connections: ['5'],
      resources: {
        youtubeVideos: [
          { title: 'Progress Tracking Methods', url: 'https://youtube.com', thumbnail: '' },
          { title: 'Project Metrics Dashboard', url: 'https://youtube.com', thumbnail: '' }
        ],
        aiSummary: 'Regularly monitor your progress against the plan. Use metrics and key performance indicators to track success and identify issues early.',
        searchResults: [
          { title: 'Project Tracking Tools', url: 'https://example.com', description: 'Tools to monitor project progress' },
          { title: 'Performance Metrics Guide', url: 'https://example.com', description: 'Essential project performance indicators' }
        ]
      }
    },
    {
      id: '5',
      title: 'Review & Optimize',
      description: 'Evaluate results and optimize for future projects',
      x: 600,
      y: 650,
      level: 3,
      category: 'project',
      connections: [],
      resources: {
        youtubeVideos: [
          { title: 'Project Review Process', url: 'https://youtube.com', thumbnail: '' },
          { title: 'Lessons Learned Documentation', url: 'https://youtube.com', thumbnail: '' }
        ],
        aiSummary: 'Conduct a thorough project review to identify what worked well and what could be improved. Document lessons learned for future projects.',
        searchResults: [
          { title: 'Project Retrospective Guide', url: 'https://example.com', description: 'Conduct effective project retrospectives' },
          { title: 'Continuous Improvement', url: 'https://example.com', description: 'Build a culture of continuous improvement' }
        ]
      }
    }
  ];
};

const generateFitnessRoadmap = (query: string): RoadmapNode[] => {
  return [
    {
      id: '1',
      title: 'Assessment',
      description: 'Evaluate your current fitness level and health status',
      x: 600,
      y: 50,
      level: 0,
      category: 'fitness_planner',
      connections: ['2'],
      resources: {
        youtubeVideos: [
          { title: 'Fitness Assessment at Home', url: 'https://youtube.com', thumbnail: '' },
          { title: 'Body Composition Analysis', url: 'https://youtube.com', thumbnail: '' }
        ],
        aiSummary: 'Start with a comprehensive fitness assessment. Measure your current strength, endurance, flexibility, and overall health metrics.',
        searchResults: [
          { title: 'Fitness Testing Guide', url: 'https://example.com', description: 'Comprehensive fitness assessment protocols' },
          { title: 'Health Screening Basics', url: 'https://example.com', description: 'Essential health checks before starting fitness' }
        ]
      }
    },
    {
      id: '2',
      title: 'Set Goals',
      description: 'Define specific, measurable fitness objectives',
      x: 600,
      y: 250,
      level: 1,
      category: 'fitness_planner',
      connections: ['3', '4'],
      resources: {
        youtubeVideos: [
          { title: 'SMART Fitness Goals', url: 'https://youtube.com', thumbnail: '' },
          { title: 'Goal Setting for Athletes', url: 'https://youtube.com', thumbnail: '' }
        ],
        aiSummary: 'Set specific, measurable, achievable, relevant, and time-bound fitness goals. Make them challenging but realistic based on your assessment.',
        searchResults: [
          { title: 'Fitness Goal Templates', url: 'https://example.com', description: 'Ready-to-use fitness goal setting templates' },
          { title: 'Motivation Strategies', url: 'https://example.com', description: 'Stay motivated on your fitness journey' }
        ]
      }
    },
    {
      id: '3',
      title: 'Create Workout Plan',
      description: 'Design a structured exercise routine',
      x: 350,
      y: 450,
      level: 2,
      category: 'fitness_planner',
      connections: ['5'],
      resources: {
        youtubeVideos: [
          { title: 'Workout Program Design', url: 'https://youtube.com', thumbnail: '' },
          { title: 'Exercise Selection Guide', url: 'https://youtube.com', thumbnail: '' }
        ],
        aiSummary: 'Create a balanced workout plan that includes cardiovascular exercise, strength training, and flexibility work. Progress gradually to avoid injury.',
        searchResults: [
          { title: 'Workout Templates', url: 'https://example.com', description: 'Professional workout program templates' },
          { title: 'Exercise Database', url: 'https://example.com', description: 'Comprehensive exercise library with instructions' }
        ]
      }
    },
    {
      id: '4',
      title: 'Nutrition Plan',
      description: 'Develop a healthy eating strategy',
      x: 850,
      y: 450,
      level: 2,
      category: 'fitness_planner',
      connections: ['5'],
      resources: {
        youtubeVideos: [
          { title: 'Nutrition for Fitness', url: 'https://youtube.com', thumbnail: '' },
          { title: 'Meal Prep Strategies', url: 'https://youtube.com', thumbnail: '' }
        ],
        aiSummary: 'Develop a nutrition plan that supports your fitness goals. Focus on whole foods, proper hydration, and timing of meals around workouts.',
        searchResults: [
          { title: 'Nutrition Calculator', url: 'https://example.com', description: 'Calculate your daily nutritional needs' },
          { title: 'Healthy Recipe Database', url: 'https://example.com', description: 'Fitness-focused meal ideas and recipes' }
        ]
      }
    },
    {
      id: '5',
      title: 'Track & Adjust',
      description: 'Monitor progress and make necessary adjustments',
      x: 600,
      y: 650,
      level: 3,
      category: 'fitness_planner',
      connections: [],
      resources: {
        youtubeVideos: [
          { title: 'Fitness Progress Tracking', url: 'https://youtube.com', thumbnail: '' },
          { title: 'Program Adjustment Strategies', url: 'https://youtube.com', thumbnail: '' }
        ],
        aiSummary: 'Regularly track your progress using various metrics. Adjust your workout and nutrition plans based on results and how your body responds.',
        searchResults: [
          { title: 'Fitness Tracking Apps', url: 'https://example.com', description: 'Best apps for tracking fitness progress' },
          { title: 'Plateau Breaking Tips', url: 'https://example.com', description: 'Overcome fitness plateaus effectively' }
        ]
      }
    }
  ];
};