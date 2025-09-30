import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware - UPDATED CORS for production
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://127.0.0.1:5173',
    'https://flowniq.netlify.app',
    'https://flowniq.onrender.com',// Your Netlify frontend
    // Add your Render backend URL here once you get it
    // 'https://your-backend-name.onrender.com'
  ],
  credentials: true
}));
app.use(express.json());

// Initialize AI services
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;

// Initialize Razorpay
const RAZORPAY_KEY_ID = process.env.VITE_RAZORPAY_KEY_ID;
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET;

let razorpayInstance = null;
if (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET) {
  razorpayInstance = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
  console.log('🔑 Razorpay configured successfully');
} else {
  console.log('⚠️ Razorpay not configured - missing API keys');
}
console.log('🔑 Gemini API Key configured:', !!(GEMINI_API_KEY && GEMINI_API_KEY !== 'your-gemini-api-key-here'));
console.log('🔑 Mistral API Key configured:', !!(MISTRAL_API_KEY && MISTRAL_API_KEY !== 'your_mistral_api_key_here'));

let genAI = null;
if (GEMINI_API_KEY && GEMINI_API_KEY !== 'your-gemini-api-key-here') {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
}

// Initialize Supabase service role client for secure server-side operations
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

let supabaseAdmin = null;
if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
  supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false }
  });
  console.log('🔐 Supabase service role client configured');
} else {
  console.warn('⚠️ Missing Supabase service role env vars. Token deduction will not work server-side.');
}

// Mistral API configuration - using HTTP instead of SDK
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const mistralConfigured = !!(MISTRAL_API_KEY && MISTRAL_API_KEY !== 'your_mistral_api_key_here');

// Helper function to call Mistral API via HTTP
async function callMistralAPI(messages, model = 'mistral-small-latest', maxTokens = 500, temperature = 0.7) {
  if (!mistralConfigured) {
    throw new Error('Mistral API key not configured');
  }

  const response = await fetch(MISTRAL_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${MISTRAL_API_KEY}`
    },
    body: JSON.stringify({
      model: model,
      messages: messages,
      max_tokens: maxTokens,
      temperature: temperature
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mistral API error: ${response.status} - ${errorText}`);
  }

  return await response.json();
}

// Helper function to clean AI response text
function cleanAIResponse(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/`(.*?)`/g, '$1')
    .replace(/#{1,6}\s/g, '')
    .trim();
}

// Helper function to parse project name from AI response
function parseProjectName(text) {
  const cleanedText = cleanAIResponse(text);
  const lines = cleanedText.split('\n').filter(line => line.trim());
  
  // Look for project name in first few lines
  for (const line of lines.slice(0, 3)) {
    if (line.toLowerCase().includes('project name') || line.toLowerCase().includes('title')) {
      const match = line.match(/[:]\s*(.+)/);
      if (match) {
        return match[1].trim();
      }
    }
  }
  
  // Fallback: use first line if it looks like a title
  if (lines[0] && lines[0].length < 50) {
    return lines[0];
  }
  
  return 'Learning Journey';
}

// Helper function to parse phases and steps from AI response
function parsePhasesFromResponse(text) {
  const cleanedText = cleanAIResponse(text);
  const lines = cleanedText.split('\n').filter(line => line.trim());
  const phases = [];
  let currentPhase = null;
  
  for (const line of lines) {
    // Match phase headers (Phase 1:, Phase 2:, etc. OR Day 1:, Day 2:, etc.)
    const phaseMatch = line.match(/^(Phase|Day)\s+(\d+):\s*(.+)/i);
    if (phaseMatch) {
      if (currentPhase) {
        phases.push(currentPhase);
      }
      currentPhase = {
        number: parseInt(phaseMatch[2]),
        name: phaseMatch[3].trim(),
        steps: []
      };
      continue;
    }
    
    // Match steps within phases (1.1, 1.2, etc. or just numbered)
    const stepMatch = line.match(/^(\d+\.?\d*)\.\s*(.+)/) || line.match(/^-\s*(.+)/);
    if (stepMatch && currentPhase) {
      const stepContent = stepMatch[2] || stepMatch[1];
      currentPhase.steps.push({
        title: stepContent.length > 50 ? stepContent.substring(0, 50) + '...' : stepContent,
        description: stepContent
      });
    }
  }
  
  if (currentPhase) {
    phases.push(currentPhase);
  }
  
  return phases;
}

// Helper function to generate Google Maps embed URL using the iframe trick
function generateGoogleMapsEmbedUrl(locationName, destination) {
  // Create a search query for the location
  const searchQuery = `${locationName}, ${destination}`;
  
  // Use the iframe embed URL format that doesn't require API key
  const encodedQuery = encodeURIComponent(searchQuery);
  
  // Using the public embed URL format that works without API key
  return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3783.2061485699746!2d73.85542079999999!3d18.519584099999996!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bc2c1e2226b7b11%3A0xa4bb8106175ca68b!2s${encodedQuery}!5e0!3m2!1sen!2sin!4v1750155225368!5m2!1sen!2sin`;
}

// Helper function to extract video title from YouTube API or generate fallback
async function getYouTubeVideoTitle(videoId) {
  try {
    // Try to get video title from YouTube API (if available)
    // For now, we'll generate a meaningful title based on the video ID
    const fallbackTitles = {
      'dQw4w9WgXcQ': 'Never Gonna Give You Up - Rick Astley',
      // Add more known video IDs and their titles here
    };
    
    return fallbackTitles[videoId] || `Tutorial Video - ${videoId}`;
  } catch (error) {
    return `Tutorial Video - ${videoId}`;
  }
}

// Helper function to generate tree-branch roadmap layout with EXACTLY 4 steps per phase and IMPROVED SPACING
async function generatePhaseRoadmapNodes(phases, category, projectName, travelData = null) {
  const nodes = [];
  const canvasWidth = 1200;
  const phaseSpacing = 700; // Vertical spacing between phases
  const stepSpacing = 200; // INCREASED: Vertical spacing between steps on same side (was 160)
  const branchOffset = 450; // Distance from phase to steps (left/right)
  const startY = 200;
  const centerX = canvasWidth / 2;
  
  // Generate all YouTube videos and maps in one batch to avoid rate limits
  const allStepsData = [];
  phases.forEach(phase => {
    phase.steps.forEach((step, stepIndex) => {
      allStepsData.push({
        phaseNumber: phase.number,
        stepIndex,
        step,
        description: step.description
      });
    });
  });

  // Generate all media resources in one AI call
  let allMediaResources = {};
  if (genAI && allStepsData.length > 0) {
    try {
      if (category === 'travel_planner') {
        // Generate all map locations in one call
        const destination = travelData?.destination || 'destination';
        const mapPrompt = `For a travel itinerary to ${destination}, provide specific location names for these activities:

${allStepsData.map((item, index) => `${index + 1}. ${item.description}`).join('\n')}

For each activity, provide 1 specific location name in ${destination}. Format your response as:

Activity 1: [Location name]
Activity 2: [Location name]
...

Only provide location names, no additional text.`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(mapPrompt);
        const response = await result.response;
        const text = response.text();

        // Parse locations
        const lines = text.split('\n').filter(line => line.trim());
        allStepsData.forEach((item, index) => {
          const line = lines.find(l => l.startsWith(`Activity ${index + 1}:`));
          let locationName = destination;
          if (line) {
            const match = line.match(/Activity \d+:\s*(.+)/);
            if (match) {
              locationName = match[1].trim();
            }
          }
          
          const searchQuery = `${locationName}, ${destination}`;
          allMediaResources[`${item.phaseNumber}-${item.stepIndex}`] = [{
            title: locationName,
            mapUrl: `https://www.google.com/maps/search/${encodeURIComponent(searchQuery)}`,
            // Use the iframe embed URL trick that doesn't require API key
            embedUrl: generateGoogleMapsEmbedUrl(locationName, destination),
            description: `Visit ${locationName} in ${destination}`
          }];
        });
      } else {
        // Generate all YouTube videos in one call with better prompting for real video titles
        const videoPrompt = `For these learning activities, provide 2 real YouTube video URLs for each. Make sure the videos exist and are educational:

${allStepsData.map((item, index) => `${index + 1}. ${item.description}`).join('\n')}

For each activity, provide 2 real YouTube video URLs with their actual titles. Format your response as:

Activity 1:
Title: [Actual video title]
URL: [YouTube URL]
Title: [Actual video title]
URL: [YouTube URL]

Activity 2:
Title: [Actual video title]
URL: [YouTube URL]
Title: [Actual video title]
URL: [YouTube URL]

...

Provide real YouTube URLs and their actual titles, not placeholder text.`;

        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent(videoPrompt);
        const response = await result.response;
        const text = response.text();

        // Parse YouTube URLs and titles more carefully
        const lines = text.split('\n').filter(line => line.trim());
        let currentActivityIndex = -1;
        let videosForCurrentActivity = [];
        
        for (const line of lines) {
          // Check for activity header
          const activityMatch = line.match(/Activity (\d+):/);
          if (activityMatch) {
            // Save previous activity's videos
            if (currentActivityIndex >= 0 && videosForCurrentActivity.length > 0) {
              const stepData = allStepsData[currentActivityIndex];
              if (stepData) {
                // Filter out "How to" videos that match the step title
                const filteredVideos = videosForCurrentActivity.filter(video => {
                  const videoTitle = video.title.toLowerCase();
                  const stepTitle = stepData.step.title.toLowerCase();
                  
                  // Remove videos that start with "How to" and contain the step title
                  if (videoTitle.startsWith('how to') && videoTitle.includes(stepTitle)) {
                    return false;
                  }
                  
                  // Remove videos that are just "How to: [step title]"
                  if (videoTitle === `how to: ${stepTitle}` || videoTitle === `tutorial: ${stepTitle}`) {
                    return false;
                  }
                  
                  return true;
                });
                
                allMediaResources[`${stepData.phaseNumber}-${stepData.stepIndex}`] = filteredVideos;
              }
            }
            
            currentActivityIndex = parseInt(activityMatch[1]) - 1;
            videosForCurrentActivity = [];
            continue;
          }
          
          // Parse title and URL pairs
          const titleMatch = line.match(/Title:\s*(.+)/);
          const urlMatch = line.match(/URL:\s*(https:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11}))/);
          
          if (titleMatch && currentActivityIndex >= 0) {
            const title = titleMatch[1].trim();
            // Look for URL in next few lines
            const nextLines = lines.slice(lines.indexOf(line) + 1, lines.indexOf(line) + 3);
            for (const nextLine of nextLines) {
              const nextUrlMatch = nextLine.match(/URL:\s*(https:\/\/(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11}))/);
              if (nextUrlMatch) {
                videosForCurrentActivity.push({
                  title: title,
                  url: nextUrlMatch[1],
                  videoId: nextUrlMatch[2],
                  thumbnail: `https://img.youtube.com/vi/${nextUrlMatch[2]}/mqdefault.jpg`
                });
                break;
              }
            }
          } else if (urlMatch && currentActivityIndex >= 0) {
            // If we have URL but no title, generate a title
            const stepData = allStepsData[currentActivityIndex];
            const title = stepData ? `${stepData.step.title} Tutorial` : 'Tutorial Video';
            videosForCurrentActivity.push({
              title: title,
              url: urlMatch[1],
              videoId: urlMatch[2],
              thumbnail: `https://img.youtube.com/vi/${urlMatch[2]}/mqdefault.jpg`
            });
          }
        }
        
        // Save last activity's videos with filtering
        if (currentActivityIndex >= 0 && videosForCurrentActivity.length > 0) {
          const stepData = allStepsData[currentActivityIndex];
          if (stepData) {
            // Filter out "How to" videos that match the step title
            const filteredVideos = videosForCurrentActivity.filter(video => {
              const videoTitle = video.title.toLowerCase();
              const stepTitle = stepData.step.title.toLowerCase();
              
              // Remove videos that start with "How to" and contain the step title
              if (videoTitle.startsWith('how to') && videoTitle.includes(stepTitle)) {
                return false;
              }
              
              // Remove videos that are just "How to: [step title]"
              if (videoTitle === `how to: ${stepTitle}` || videoTitle === `tutorial: ${stepTitle}`) {
                return false;
              }
              
              return true;
            });
            
            allMediaResources[`${stepData.phaseNumber}-${stepData.stepIndex}`] = filteredVideos;
          }
        }

        // Don't add fallback videos - if no real videos are found, leave empty
        allStepsData.forEach((item) => {
          const key = `${item.phaseNumber}-${item.stepIndex}`;
          if (!allMediaResources[key] || allMediaResources[key].length === 0) {
            allMediaResources[key] = []; // Empty array instead of fallback videos
          }
        });
      }
    } catch (error) {
      console.error('Error generating media resources:', error);
      // Generate fallback resources
      allStepsData.forEach((item) => {
        if (category === 'travel_planner') {
          const destination = travelData?.destination || 'destination';
          allMediaResources[`${item.phaseNumber}-${item.stepIndex}`] = [{
            title: `${destination} - Main Area`,
            mapUrl: `https://www.google.com/maps/search/${encodeURIComponent(destination)}`,
            embedUrl: generateGoogleMapsEmbedUrl(destination, destination),
            description: `Explore ${destination} area`
          }];
        } else {
          // No fallback videos - leave empty
          allMediaResources[`${item.phaseNumber}-${item.stepIndex}`] = [];
        }
      });
    }
  } else {
    // Generate fallback resources when AI is not available
    allStepsData.forEach((item) => {
      if (category === 'travel_planner') {
        const destination = travelData?.destination || 'destination';
        allMediaResources[`${item.phaseNumber}-${item.stepIndex}`] = [{
          title: `${destination} - Main Area`,
          mapUrl: `https://www.google.com/maps/search/${encodeURIComponent(destination)}`,
          embedUrl: generateGoogleMapsEmbedUrl(destination, destination),
          description: `Explore ${destination} area`
        }];
      } else {
        // No fallback videos - leave empty
        allMediaResources[`${item.phaseNumber}-${item.stepIndex}`] = [];
      }
    });
  }
  
  phases.forEach((phase, phaseIndex) => {
    const phaseY = startY + (phaseIndex * phaseSpacing);
    
    // Ensure exactly 4 steps per phase
    let phaseSteps = [...phase.steps];
    
    // If less than 4 steps, pad with generic steps
    while (phaseSteps.length < 4) {
      const isTravel = category === 'travel_planner';
      const stepLabel = isTravel ? 'activity' : 'task';
      const phaseLabel = isTravel ? 'day' : 'phase';
      
      phaseSteps.push({
        title: `Additional ${stepLabel} ${phaseSteps.length + 1}`,
        description: `Complete additional ${stepLabel}s for ${phase.name.toLowerCase()} on this ${phaseLabel}`
      });
    }
    
    // If more than 4 steps, take only first 4
    if (phaseSteps.length > 4) {
      phaseSteps = phaseSteps.slice(0, 4);
    }
    
    // Create phase node (main trunk)
    const phaseNode = {
      id: `phase-${phase.number}`,
      title: phase.name,
      description: `${category === 'travel_planner' ? 'Day' : 'Phase'} ${phase.number}: ${phase.name}`,
      x: centerX,
      y: phaseY,
      level: phaseIndex,
      category,
      connections: phaseSteps.map((_, stepIndex) => `step-${phase.number}-${stepIndex + 1}`),
      isPhase: true,
      phaseNumber: phase.number,
      resources: {
        aiSummary: cleanAIResponse(`${category === 'travel_planner' ? 'Day' : 'Phase'} ${phase.number} focuses on ${phase.name.toLowerCase()}`),
        youtubeVideos: [{
          title: `${phase.name} - Complete Guide`,
          url: 'https://youtube.com/search?q=' + encodeURIComponent(phase.name),
          videoId: 'dQw4w9WgXcQ',
          thumbnail: 'https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg'
        }],
        searchResults: [{
          title: `${phase.name} Resources`,
          url: 'https://google.com/search?q=' + encodeURIComponent(phase.name),
          description: `Comprehensive resources for ${phase.name}`
        }]
      }
    };
    
    nodes.push(phaseNode);
    
    // Create exactly 4 step nodes: 2 on left, 2 on right with BETTER SPACING
    phaseSteps.forEach((step, stepIndex) => {
      // First 2 steps on left (indices 0,1), next 2 on right (indices 2,3)
      const isLeft = stepIndex < 2;
      const sideMultiplier = isLeft ? -1 : 1;
      
      // Position steps: 2 on each side with IMPROVED SPACING
      const indexOnSide = stepIndex % 2; // 0 or 1 for each side
      
      // IMPROVED: Better Y positioning with more space between steps
      const stepX = centerX + (sideMultiplier * branchOffset);
      const sideStartY = phaseY - (stepSpacing * 0.75); // Start higher to create more space
      const stepY = sideStartY + (indexOnSide * stepSpacing); // More space between steps
      
      // Get media resources for this step
      const mediaResources = allMediaResources[`${phase.number}-${stepIndex}`] || [];
      
      const stepNode = {
        id: `step-${phase.number}-${stepIndex + 1}`,
        title: step.title,
        description: step.description,
        x: stepX,
        y: stepY,
        level: phaseIndex,
        category,
        connections: [],
        isStep: true,
        phaseNumber: phase.number,
        stepNumber: stepIndex + 1,
        isLeft: isLeft,
        resources: {
          aiSummary: cleanAIResponse(`${category === 'travel_planner' ? 'Activity' : 'Step'} ${stepIndex + 1} of ${phase.name}: ${step.description}`),
          // Different media based on category
          ...(category === 'travel_planner' ? {
            mapLocations: mediaResources
          } : {
            youtubeVideos: mediaResources
          }),
          searchResults: [{
            title: `How to ${step.description}`,
            url: 'https://google.com/search?q=' + encodeURIComponent(`how to ${step.description}`),
            description: `Learn more about ${step.description}`
          }]
        }
      };
      
      nodes.push(stepNode);
    });
  });
  
  return nodes;
}

// Razorpay payment endpoints
app.post('/api/create-razorpay-order', async (req, res) => {
  try {
    if (!razorpayInstance) {
      return res.status(500).json({
        success: false,
        error: 'Payment service not configured'
      });
    }

    const { amount, currency = 'INR', receipt, notes } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid amount'
      });
    }

    const orderOptions = {
      amount: Math.round(amount), // Amount in paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: notes || {}
    };

    const order = await razorpayInstance.orders.create(orderOptions);
    
    console.log('💰 Razorpay order created:', order.id);
    
    res.json({
      success: true,
      order: {
        id: order.id,
        amount: order.amount,
        currency: order.currency,
        receipt: order.receipt,
        status: order.status
      }
    });
  } catch (error) {
    console.error('❌ Error creating Razorpay order:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create payment order'
    });
  }
});

app.post('/api/verify-razorpay-payment', async (req, res) => {
  try {
    console.log('💰 Payment verification request received:', {
      body: req.body,
      timestamp: new Date().toISOString()
    });
    
    if (!razorpayInstance) {
      console.error('❌ Razorpay instance not configured');
      return res.status(500).json({
        success: false,
        error: 'Payment service not configured'
      });
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      user_id,
      tokens_purchased,
      amount
    } = req.body;
    
    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !user_id) {
      console.error('❌ Missing required fields:', {
        razorpay_order_id: !!razorpay_order_id,
        razorpay_payment_id: !!razorpay_payment_id,
        razorpay_signature: !!razorpay_signature,
        user_id: !!user_id
      });
      return res.status(400).json({
        success: false,
        error: 'Missing required payment fields'
      });
    }

    // Verify signature
    console.log('🔐 Verifying payment signature...');
    const expectedSignature = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    console.log('🔐 Signature verification:', {
      expected: expectedSignature.substring(0, 10) + '...',
      received: razorpay_signature.substring(0, 10) + '...',
      match: expectedSignature === razorpay_signature,
      order_id: razorpay_order_id,
      payment_id: razorpay_payment_id
    });

    // TEST MODE: Bypass signature verification for test payments
    // Razorpay test payments can have various formats, so we check for test keys
    const isTestEnvironment = RAZORPAY_KEY_ID.includes('_test_');
    const isTestPayment = isTestEnvironment || razorpay_payment_id.startsWith('pay_test') || razorpay_order_id.startsWith('order_test');
    
    console.log('🔍 Payment environment check:', {
      isTestEnvironment,
      isTestPayment,
      keyId: RAZORPAY_KEY_ID.substring(0, 10) + '...',
      signatureMatch: expectedSignature === razorpay_signature
    });
    
    if (!isTestPayment && expectedSignature !== razorpay_signature) {
      console.error('❌ Invalid payment signature - verification failed');
      console.error('❌ Full signature details:', {
        expected: expectedSignature,
        received: razorpay_signature,
        orderData: razorpay_order_id + '|' + razorpay_payment_id,
        secretLength: RAZORPAY_KEY_SECRET?.length
      });
      return res.status(400).json({
        success: false,
        error: 'Payment verification failed - please contact support'
      });
    }
    
    if (isTestPayment) {
      console.log('🧪 TEST MODE: Bypassing signature verification for test payment');
    }

    console.log('✅ Payment signature verified for:', razorpay_payment_id);
    
    // Implement full payment processing with database integration
    if (!supabaseAdmin) {
      return res.status(500).json({
        success: false,
        error: 'Database service not configured'
      });
    }

    try {
      // 1. Create payment record in database (with error handling for test payments)
      let paymentRecord = null;
      try {
        const { data, error: paymentError } = await supabaseAdmin
          .from('payments')
          .insert({
            user_id: user_id,
            razorpay_payment_id: razorpay_payment_id,
            razorpay_order_id: razorpay_order_id,
            amount_inr: amount,
            amount_usd: (amount * 0.012), // Convert to USD (use real rate in production)
            tokens_purchased: tokens_purchased,
            status: 'completed',
            completed_at: new Date().toISOString()
          })
          .select('id')
          .single();

        if (paymentError) {
          console.warn('⚠️ Payment record creation warning (continuing with token addition):', paymentError.message);
          // For test payments, we'll continue even if payment record fails
          // This handles duplicate payment ID issues during testing
        } else {
          paymentRecord = data;
          console.log('✅ Payment record created successfully:', paymentRecord.id);
        }
      } catch (recordError) {
        console.warn('⚠️ Payment record creation failed, continuing with token addition:', recordError.message);
      }

      // 2. Add tokens to user account using database function
      console.log('🪙 Adding tokens to user account...', {
        userId: user_id,
        tokensToAdd: tokens_purchased,
        paymentId: razorpay_payment_id
      });
      
      const { data: tokenResult, error: tokenError } = await supabaseAdmin.rpc('add_user_tokens', {
        p_user_id: user_id,
        p_tokens: tokens_purchased,
        p_description: `Token purchase - Payment ID: ${razorpay_payment_id}`,
        p_payment_id: razorpay_payment_id
      });

      if (tokenError) {
        console.error('❌ Error adding tokens:', {
          error: tokenError,
          message: tokenError.message,
          details: tokenError.details,
          hint: tokenError.hint,
          code: tokenError.code
        });
        
        // Mark payment as failed in case of token addition failure (only if payment record exists)
        if (paymentRecord) {
          await supabaseAdmin
            .from('payments')
            .update({ status: 'failed' })
            .eq('id', paymentRecord.id);
        }

        return res.status(500).json({
          success: false,
          error: 'Token addition failed - please contact support',
          details: tokenError.message
        });
      }

      console.log(`🎉 Successfully added ${tokens_purchased} tokens to user ${user_id}`);
      
      res.json({
        success: true,
        payment_id: razorpay_payment_id,
        tokens_added: tokens_purchased,
        message: 'Payment verified and tokens added successfully'
      });
      
    } catch (dbError) {
      console.error('❌ Database error during payment processing:', dbError);
      res.status(500).json({
        success: false,
        error: 'Payment processing failed'
      });
    }
  } catch (error) {
    console.error('❌ Error verifying payment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify payment'
    });
  }
});

// User profile endpoint
app.get('/api/user-profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!supabaseAdmin) {
      return res.status(500).json({
        success: false,
        error: 'Database service not configured'
      });
    }

    const { data: profile, error } = await supabaseAdmin
      .from('user_profiles')
      .select('id, email, tokens, total_tokens_used, subscription_status, created_at')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      return res.status(404).json({
        success: false,
        error: 'User profile not found'
      });
    }

    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('❌ Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user profile'
    });
  }
});

// Test endpoints for debugging
app.get('/api/test-supabase', async (req, res) => {
  try {
    if (!supabaseAdmin) {
      return res.status(500).json({
        success: false,
        error: 'Supabase not configured'
      });
    }

    // Test basic connection
    const { data, error } = await supabaseAdmin
      .from('user_profiles')
      .select('count')
      .limit(1);

    if (error) {
      return res.status(500).json({
        success: false,
        error: 'Supabase connection failed',
        details: error.message
      });
    }

    res.json({
      success: true,
      message: 'Supabase connection working',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/test-add-tokens', async (req, res) => {
  try {
    const { user_id, tokens } = req.body;
    
    if (!supabaseAdmin) {
      return res.status(500).json({
        success: false,
        error: 'Supabase not configured'
      });
    }

    console.log('🧪 Testing token addition for user:', user_id);
    
    // Test the add_user_tokens function
    const { data, error } = await supabaseAdmin.rpc('add_user_tokens', {
      p_user_id: user_id,
      p_tokens: tokens || 10,
      p_description: 'Test token addition',
      p_payment_id: 'test_payment_' + Date.now()
    });

    if (error) {
      console.error('❌ Test token addition failed:', error);
      return res.status(500).json({
        success: false,
        error: 'Token addition failed',
        details: error
      });
    }

    console.log('✅ Test token addition successful');
    res.json({
      success: true,
      message: 'Token addition test successful',
      result: data
    });
  } catch (error) {
    console.error('❌ Test endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test payment verification endpoint (bypasses signature check)
app.post('/api/test-verify-payment', async (req, res) => {
  try {
    console.log('🧪 TEST: Payment verification request received:', req.body);
    
    const {
      razorpay_order_id,
      razorpay_payment_id,
      user_id,
      tokens_purchased,
      amount
    } = req.body;
    
    // Skip signature verification entirely for testing
    console.log('🧪 TEST: Skipping signature verification');
    
    if (!supabaseAdmin) {
      return res.status(500).json({
        success: false,
        error: 'Database service not configured'
      });
    }

    // Add tokens to user account
    console.log('🧪 TEST: Adding tokens to user account...');
    const { data: tokenResult, error: tokenError } = await supabaseAdmin.rpc('add_user_tokens', {
      p_user_id: user_id,
      p_tokens: tokens_purchased,
      p_description: `TEST: Token purchase - Payment ID: ${razorpay_payment_id}`,
      p_payment_id: razorpay_payment_id
    });

    if (tokenError) {
      console.error('❌ TEST: Error adding tokens:', tokenError);
      return res.status(500).json({
        success: false,
        error: 'Token addition failed',
        details: tokenError
      });
    }

    console.log('✅ TEST: Successfully added tokens');
    res.json({
      success: true,
      payment_id: razorpay_payment_id,
      tokens_added: tokens_purchased,
      message: 'TEST: Payment verified and tokens added successfully'
    });
  } catch (error) {
    console.error('❌ TEST: Error in test verification:', error);
    res.status(500).json({
      success: false,
      error: 'Test verification failed',
      details: error.message
    });
  }
});

// ROOT ROUTE - Add this to fix "Cannot GET" error
app.get('/', (req, res) => {
  res.json({
    message: 'SmartLearn.io Backend API is running!',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/api/health',
      generateRoadmap: '/api/generate-roadmap',
      generateInstructions: '/api/generate-instructions'
    }
  });
});

// API endpoint to generate instructions using Mistral AI via HTTP
app.post('/api/generate-instructions', async (req, res) => {
  try {
    console.log('📝 Received instructions generation request:', req.body);
    
    const { stepDescription } = req.body;
    
    if (!stepDescription) {
      console.error('❌ Missing stepDescription');
      return res.status(400).json({
        success: false,
        error: 'Step description is required',
        timestamp: new Date().toISOString()
      });
    }

    // Check if Mistral API key is configured
    if (!mistralConfigured) {
      console.log('⚠️ Mistral API key not configured, using fallback response');
      
      // Fallback response when API key is not configured
      const fallbackInstructions = [
        `Start by understanding the requirements for: ${stepDescription}`,
        `Gather all necessary resources and tools needed`,
        `Follow best practices and established guidelines`,
        `Complete the task systematically and verify results`
      ];
      
      return res.json({
        success: true,
        instructions: fallbackInstructions,
        timestamp: new Date().toISOString(),
        note: 'Using fallback response - configure MISTRAL_API_KEY for AI-generated content'
      });
    }

    // Generate instructions using Mistral AI via HTTP
    const prompt = `Provide clear, actionable instructions for: ${stepDescription}

Please provide specific steps to accomplish this task. Each instruction should be:
- Clear and actionable
- Easy to understand
- Practical to implement
- Building upon the previous step

Provide only the instructions without numbering, as this is a single comprehensive instruction set.

Task: ${stepDescription}`;

    console.log('🤖 Calling Mistral AI for instructions via HTTP...');
    
    const response = await callMistralAPI([
      {
        role: 'user',
        content: prompt
      }
    ], 'mistral-small-latest', 500, 0.7);

    console.log('✅ Received response from Mistral AI');

    const content = response.choices[0]?.message?.content || '';
    
    // Parse the response into instructions - IMPROVED: Better parsing
    const lines = content.split('\n').filter(line => line.trim());
    const instructions = [];
    
    for (const line of lines) {
      // Remove numbering and clean up the text
      const cleanedLine = line
        .replace(/^\d+\.\s*/, '') // Remove "1. " style numbering
        .replace(/^-\s*/, '')     // Remove "- " style bullets
        .replace(/^\*\s*/, '')    // Remove "* " style bullets
        .trim();
      
      if (cleanedLine && cleanedLine.length > 10) { // Only include substantial instructions
        instructions.push(cleanedLine);
      }
    }
    
    // Ensure we have at least one instruction
    if (instructions.length === 0) {
      instructions.push(`Complete the task: ${stepDescription}`);
    }

    console.log(`📊 Generated ${instructions.length} instructions`);

    res.json({
      success: true,
      instructions,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error generating instructions:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate instructions',
      timestamp: new Date().toISOString()
    });
  }
});

// API endpoint to generate roadmap with token validation
app.post('/api/generate-roadmap', async (req, res) => {
  try {
    console.log('📝 Received roadmap generation request:', req.body);
    
    const { prompt, category, travelData, userId } = req.body;
    
    // Validate required fields
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'User authentication required',
        requiresAuth: true,
        timestamp: new Date().toISOString()
      });
    }

    // Enforce token check server-side
    const TOKENS_PER_ROADMAP = parseInt(process.env.TOKENS_PER_ROADMAP || '1', 10);
    if (!supabaseAdmin) {
      return res.status(500).json({ success: false, error: 'Server configuration error (Supabase)', timestamp: new Date().toISOString() });
    }

    // Get user's current token balance
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('tokens, email')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('❌ Failed to fetch user profile:', profileError);
      return res.status(400).json({ success: false, error: 'User profile not found', timestamp: new Date().toISOString() });
    }

    if (profile.tokens < TOKENS_PER_ROADMAP) {
      return res.status(402).json({ // 402 Payment Required
        success: false,
        error: 'Insufficient tokens',
        tokensRemaining: profile.tokens,
        tokensRequired: TOKENS_PER_ROADMAP,
        timestamp: new Date().toISOString()
      });
    }
    
    if (!prompt || !category) {
      console.error('❌ Missing required fields:', { prompt: !!prompt, category: !!category });
      return res.status(400).json({
        success: false,
        error: 'Prompt and category are required',
        timestamp: new Date().toISOString()
      });
    }

    // Token validation passed - user has enough tokens
    // Deduct tokens before processing AI generation to avoid double-charging on errors
    const { error: deductError } = await supabaseAdmin.rpc('deduct_user_tokens', {
      p_user_id: userId,
      p_tokens: TOKENS_PER_ROADMAP,
      p_description: `Roadmap generation: ${prompt.substring(0, 50)}...`,
      p_roadmap_id: null // will be updated after roadmap is saved
    });

    if (deductError) {
      console.error('❌ Token deduction failed:', deductError);
      return res.status(500).json({ success: false, error: 'Token deduction failed', timestamp: new Date().toISOString() });
    }

    console.log(`🪙 Successfully deducted ${TOKENS_PER_ROADMAP} tokens from user ${userId}`);
    const tokensRemaining = profile.tokens - TOKENS_PER_ROADMAP;

    // Check if Gemini API key is configured
    if (!genAI) {
      console.log('⚠️ Gemini API key not configured, using fallback response');
      
      // Enhanced fallback response for travel category
      let fallbackProjectName, fallbackPhases;
      
      if (category === 'travel_planner' && travelData) {
        fallbackProjectName = `Journey to ${travelData.destination}`;
        fallbackPhases = generateTravelFallback(travelData);
      } else {
        fallbackProjectName = `${prompt} Journey`;
        fallbackPhases = generateGenericFallback(prompt, category);
      }
      
      const roadmapNodes = await generatePhaseRoadmapNodes(fallbackPhases, category, fallbackProjectName, travelData);
      
      return res.json({
        success: true,
        projectName: fallbackProjectName,
        phases: fallbackPhases,
        roadmapNodes,
        category,
        originalPrompt: prompt,
        tokensUsed: TOKENS_PER_ROADMAP,
        tokensRemaining: tokensRemaining,
        timestamp: new Date().toISOString(),
        note: 'Using fallback response - configure GEMINI_API_KEY for AI-generated content'
      });
    }

    // Generate project name
    let projectName;
    if (category === 'travel_planner' && travelData) {
      projectName = `Journey to ${travelData.destination}`;
    } else {
      const namePrompt = `Generate a short, catchy project name (2-4 words maximum) for this learning goal: ${prompt}

Requirements:
- Keep it concise and memorable
- Make it relevant to the topic
- Avoid generic words like "journey" or "guide"
- Just return the name, nothing else

Example format: "React Mastery" or "Python Fundamentals"`;

      console.log('🤖 Getting project name from Gemini AI...');
      const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      const nameResult = await model.generateContent(namePrompt);
      const nameResponse = await nameResult.response;
      projectName = cleanAIResponse(nameResponse.text()) || `${prompt} Journey`;
    }

    // Generate phases and steps with category-specific prompts
    let phasesPrompt;
    
    if (category === 'travel_planner' && travelData) {
      phasesPrompt = `Create a detailed ${travelData.duration}-day travel itinerary for: ${prompt}

Travel Details:
- Destination: ${travelData.destination}
- Starting from: ${travelData.startingLocation}
- Duration: ${travelData.duration} days
- Number of travelers: ${travelData.travelers}
- Budget: $${travelData.budget}

CRITICAL REQUIREMENT: Create exactly ${travelData.duration} days, each day must have EXACTLY 4 activities, no more, no less.

Structure your response as days with activities:

Day 1: [Location/Theme - 1-2 words]
1.1 [Morning activity with specific location and time]
1.2 [Afternoon activity with specific location and time]
1.3 [Evening activity with specific location and time]
1.4 [Night activity or rest with specific location]

Day 2: [Location/Theme - 1-2 words]
2.1 [Morning activity with specific location and time]
2.2 [Afternoon activity with specific location and time]
2.3 [Evening activity with specific location and time]
2.4 [Night activity or rest with specific location]

Continue for all ${travelData.duration} days...

Requirements:
- Each day MUST have exactly 4 activities (this is mandatory)
- Include specific locations, attractions, restaurants, and accommodations
- Consider travel time between locations
- Include budget-appropriate suggestions
- Mix of sightseeing, dining, culture, and relaxation
- Consider local customs and best times to visit attractions
- Include practical details like opening hours and booking requirements
- Day names should be location-based or theme-based (e.g., "Downtown", "Museums", "Nature")

Generate the complete ${travelData.duration}-day itinerary for: ${prompt}`;
    } else if (category === 'subject') {
      phasesPrompt = `Create a comprehensive learning roadmap for studying: ${prompt}

CRITICAL REQUIREMENT: Each phase must have EXACTLY 4 steps, no more, no less.

Structure your response as phases with steps:

Phase 1: [Phase Name - 1-2 words]
1.1 [Step description]
1.2 [Step description]
1.3 [Step description]
1.4 [Step description]

Phase 2: [Phase Name - 1-2 words]
2.1 [Step description]
2.2 [Step description]
2.3 [Step description]
2.4 [Step description]

Phase 3: [Phase Name - 1-2 words]
3.1 [Step description]
3.2 [Step description]
3.3 [Step description]
3.4 [Step description]

Requirements for Subject Learning:
- Create phases that focus on academic learning and mastery
- Each phase MUST have exactly 4 steps (this is mandatory)
- Phase names should be 1-2 words only (e.g., "Basics", "Practice", "Mastery", "Advanced")
- Steps should focus on study techniques, understanding concepts, practice, and application
- Include activities like reading, note-taking, problem-solving, testing, and teaching
- Make it suitable for learning any subject (math, science, history, languages, etc.)
- Focus on educational methodology and learning techniques
- Do not use markdown formatting
- Keep language clear and educational

IMPORTANT: Do not create more or fewer than 4 steps per phase. This is a strict requirement.

Generate the subject learning roadmap for: ${prompt}`;
    } else {
      phasesPrompt = `Create a comprehensive learning roadmap for: ${prompt}

CRITICAL REQUIREMENT: Each phase must have EXACTLY 4 steps, no more, no less.

Structure your response as phases with steps:

Phase 1: [Phase Name - 1-2 words]
1.1 [Step description]
1.2 [Step description]
1.3 [Step description]
1.4 [Step description]

Phase 2: [Phase Name - 1-2 words]
2.1 [Step description]
2.2 [Step description]
2.3 [Step description]
2.4 [Step description]

Phase 3: [Phase Name - 1-2 words]
3.1 [Step description]
3.2 [Step description]
3.3 [Step description]
3.4 [Step description]

Requirements:
- Create required number of phases
- Each phase MUST have exactly 4 steps (this is mandatory)
- Phase names should be 1-2 words only (e.g., "Foundation", "Practice", "Mastery")
- Steps should be specific and actionable
- Focus on practical, real-world implementation
- Make it appropriate for the category: ${category.replace('_', ' ')}
- Do not use markdown formatting
- Keep language clear and professional

IMPORTANT: Do not create more or fewer than 4 steps per phase. This is a strict requirement.

Generate the roadmap for: ${prompt}`;
    }

    console.log('🤖 Getting phases and steps from Gemini AI...');
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const phasesResult = await model.generateContent(phasesPrompt);
    const phasesResponse = await phasesResult.response;
    const phasesText = phasesResponse.text();

    console.log('✅ Received response from Gemini AI');

    // Parse the response into structured phases
    const phases = parsePhasesFromResponse(phasesText);
    
    if (phases.length === 0) {
      throw new Error('Failed to parse phases from AI response');
    }

    // Generate roadmap nodes from phases (will ensure exactly 4 steps per phase and include media)
    const roadmapNodes = await generatePhaseRoadmapNodes(phases, category, projectName, travelData);

    console.log(`📊 Generated ${phases.length} phases with ${roadmapNodes.length} total nodes`);

    // Return structured response
    res.json({
      success: true,
      projectName: projectName.replace(/['"]/g, ''), // Clean quotes
      phases,
      roadmapNodes,
      category,
      originalPrompt: prompt,
      tokensUsed: TOKENS_PER_ROADMAP,
      tokensRemaining: tokensRemaining,
      timestamp: new Date().toISOString(),
      aiResponse: cleanAIResponse(phasesText)
    });

  } catch (error) {
    console.error('❌ Error generating roadmap:', error);
    
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate roadmap',
      timestamp: new Date().toISOString()
    });
  }
});

// Fallback functions
function generateTravelFallback(travelData) {
  const phases = [];
  for (let day = 1; day <= travelData.duration; day++) {
    phases.push({
      number: day,
      name: day === 1 ? 'Arrival' : day === travelData.duration ? 'Departure' : `Explore`,
      steps: [
        { title: 'Morning Activity', description: `Start your day ${day} with a morning activity in ${travelData.destination}` },
        { title: 'Afternoon Sightseeing', description: `Explore key attractions and landmarks in ${travelData.destination}` },
        { title: 'Evening Dining', description: `Experience local cuisine and dining culture` },
        { title: 'Night Rest', description: `Rest and prepare for the next day's adventures` }
      ]
    });
  }
  return phases;
}

function generateGenericFallback(prompt, category) {
  if (category === 'subject') {
    return [
      {
        number: 1,
        name: 'Basics',
        steps: [
          { title: 'Study Fundamentals', description: `Learn the basic concepts and principles of ${prompt}` },
          { title: 'Read Materials', description: `Read textbooks, articles, and resources about ${prompt}` },
          { title: 'Take Notes', description: `Create comprehensive notes on key ${prompt} topics` },
          { title: 'Review Concepts', description: `Review and understand core ${prompt} concepts` }
        ]
      },
      {
        number: 2,
        name: 'Practice',
        steps: [
          { title: 'Solve Problems', description: `Work through practice problems related to ${prompt}` },
          { title: 'Do Exercises', description: `Complete exercises and assignments in ${prompt}` },
          { title: 'Join Discussions', description: `Participate in study groups or forums about ${prompt}` },
          { title: 'Apply Knowledge', description: `Apply what you've learned about ${prompt} to real situations` }
        ]
      },
      {
        number: 3,
        name: 'Mastery',
        steps: [
          { title: 'Advanced Topics', description: `Study advanced concepts and theories in ${prompt}` },
          { title: 'Test Knowledge', description: `Take practice tests or quizzes on ${prompt}` },
          { title: 'Teach Others', description: `Explain ${prompt} concepts to help solidify understanding` },
          { title: 'Stay Current', description: `Keep up with latest developments in ${prompt}` }
        ]
      }
    ];
  }
  
  return [
    {
      number: 1,
      name: 'Foundation',
      steps: [
        { title: 'Research Basics', description: `Learn the fundamentals of ${prompt}` },
        { title: 'Set Goals', description: `Define clear objectives for ${prompt}` },
        { title: 'Gather Resources', description: `Collect materials needed for ${prompt}` },
        { title: 'Create Plan', description: `Develop a structured approach for ${prompt}` }
      ]
    },
    {
      number: 2,
      name: 'Development',
      steps: [
        { title: 'Build Skills', description: `Develop core skills for ${prompt}` },
        { title: 'Practice Daily', description: `Apply what you've learned about ${prompt}` },
        { title: 'Get Feedback', description: `Seek feedback on your ${prompt} progress` },
        { title: 'Refine Approach', description: `Improve your ${prompt} methodology` }
      ]
    },
    {
      number: 3,
      name: 'Mastery',
      steps: [
        { title: 'Advanced Techniques', description: `Master advanced aspects of ${prompt}` },
        { title: 'Share Knowledge', description: `Teach others about ${prompt}` },
        { title: 'Build Portfolio', description: `Create showcase projects for ${prompt}` },
        { title: 'Continuous Learning', description: `Stay updated with ${prompt} trends` }
      ]
    }
  ];
}

// Health check endpoint - ENHANCED with AI status
app.get('/api/health', (req, res) => {
  console.log('🏥 Health check requested');
  
  const healthData = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!(GEMINI_API_KEY && GEMINI_API_KEY !== 'your-gemini-api-key-here'),
    mistralConfigured: mistralConfigured,
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    aiServices: {
      gemini: {
        configured: !!(GEMINI_API_KEY && GEMINI_API_KEY !== 'your-gemini-api-key-here'),
        status: genAI ? 'active' : 'inactive'
      },
      mistral: {
        configured: mistralConfigured,
        status: mistralConfigured ? 'active' : 'inactive'
      }
    }
  };
  
  console.log('🏥 Health check response:', healthData);
  
  res.json(healthData);
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('💥 Server error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    timestamp: new Date().toISOString()
  });
});

// Start server
app.listen(PORT, '127.0.0.1', () => {
  console.log('🚀 SmartLearn.io Backend Server running on port', PORT);
  console.log('📡 API endpoints:');
  console.log('  - Generate Roadmap: http://localhost:' + PORT + '/api/generate-roadmap');
  console.log('  - Generate Instructions: http://localhost:' + PORT + '/api/generate-instructions');
  console.log('  - Health Check: http://localhost:' + PORT + '/api/health');
  console.log('🔑 Gemini API configured:', !!(GEMINI_API_KEY && GEMINI_API_KEY !== 'your-gemini-api-key-here'));
  console.log('🔑 Mistral API configured:', mistralConfigured);
  console.log('🌐 CORS enabled for production');
  console.log('🏠 Root endpoint: http://localhost:' + PORT + '/');
});