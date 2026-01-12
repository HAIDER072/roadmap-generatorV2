import express from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import multer from 'multer';
// PDF parsing is optional - only needed for resume upload feature
let pdfParse = null;
try {
  // Try to import pdf-parse if available
  const pdfParseModule = await import('pdf-parse');
  // The new pdf-parse exports as { parse }
  pdfParse = pdfParseModule.parse || pdfParseModule.default || pdfParseModule;
  console.log('✅ PDF parsing enabled');
} catch (error) {
  console.log('⚠️ PDF parsing not available - resume upload will be disabled');
  console.log('Error:', error.message);
}
import { extractMainTopic, getVideoRecommendations, createModifiedPythonScripts } from './mlService.js';

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
app.use(express.json({ limit: '5mb' }));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

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

// Helper function for exponential backoff retries
async function retryWithBackoff(fn, retries = 3, delay = 2000) {
  try {
    return await fn();
  } catch (error) {
    // Check for 429 or "Too Many Requests" or "Quota Exceeded"
    const isRateLimit = error.status === 429 ||
      (error.message && (
        error.message.includes('429') ||
        error.message.includes('Too Many Requests') ||
        error.message.includes('Quota exceeded') ||
        error.message.includes('resource exhausted')
      ));

    if (retries === 0 || !isRateLimit) {
      throw error;
    }

    console.log(`⚠️ Rate limit hit. Retrying in ${delay / 1000}s... (Attempts left: ${retries})`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return retryWithBackoff(fn, retries - 1, delay * 2);
  }
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

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await retryWithBackoff(() => model.generateContent(mapPrompt));
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

        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
        const result = await retryWithBackoff(() => model.generateContent(videoPrompt));
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

// PDF parsing endpoint - Send PDF directly to Gemini
app.post('/api/parse-resume', upload.single('resume'), async (req, res) => {
  try {
    console.log('📄 Received resume parsing request');

    if (!genAI) {
      return res.status(503).json({
        success: false,
        error: 'Gemini API not configured. Please add GEMINI_API_KEY to .env file.',
        timestamp: new Date().toISOString()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const file = req.file;
    console.log('File info:', { name: file.originalname, type: file.mimetype, size: file.size });

    let extractedText = '';

    // Handle PDF files - Send directly to Gemini
    if (file.mimetype === 'application/pdf') {
      console.log('🤖 Sending PDF directly to Gemini 2.5 Pro for text extraction...');

      try {
        // Convert PDF buffer to base64 for Gemini
        const base64Pdf = file.buffer.toString('base64');

        // Use Gemini 2.5 Pro model with PDF support
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

        // Send PDF to Gemini with extraction prompt
        const result = await model.generateContent([
          {
            inlineData: {
              mimeType: "application/pdf",
              data: base64Pdf
            }
          },
          {
            text: "Extract all text content from this resume PDF. Return ONLY the extracted text with proper formatting, preserving sections like personal info, experience, education, and skills. Do not add any commentary or additional text."
          }
        ]);

        const response = await result.response;
        extractedText = response.text().trim();
        console.log('✅ PDF text extracted by Gemini:', extractedText.length, 'characters');

      } catch (geminiError) {
        console.error('❌ Gemini PDF extraction error:', geminiError);
        return res.status(500).json({
          success: false,
          error: 'Failed to extract text from PDF using Gemini: ' + geminiError.message
        });
      }
    }
    // Handle text files
    else if (file.mimetype === 'text/plain' || file.originalname.endsWith('.txt')) {
      console.log('Reading text file...');
      extractedText = file.buffer.toString('utf-8');
    }
    // Handle other formats
    else {
      return res.status(400).json({
        success: false,
        error: 'Unsupported file type. Please upload a PDF or TXT file.'
      });
    }

    // Clean up the text
    extractedText = extractedText
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();

    // Validate
    if (extractedText.length < 50) {
      return res.status(400).json({
        success: false,
        error: 'Resume text is too short. Please upload a proper resume.'
      });
    }

    console.log('✅ Resume parsed successfully using Gemini');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄 RESUME PARSING CONFIRMED - GEMINI EXTRACTED:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📌 File:', file.originalname);
    console.log('📏 Length:', extractedText.length, 'characters');
    console.log('🔍 Full extracted text:');
    console.log(extractedText);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    res.json({
      success: true,
      text: extractedText,
      filename: file.originalname,
      length: extractedText.length,
      parsingConfirmed: true,
      message: 'Resume successfully extracted using Gemini API'
    });

  } catch (error) {
    console.error('❌ Error parsing resume:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to parse resume'
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


    // Combine Project Name and Phases generation into ONE call to optimize API key usage and avoid 429 errors
    console.log('🤖 Generating roadmap content (Project Name + Phases) from Gemini AI...');

    let combinedPrompt;

    if (category === 'travel_planner' && travelData) {
      combinedPrompt = `Create a detailed ${travelData.duration}-day travel itinerary for: ${prompt}
      
Travel Details:
- Destination: ${travelData.destination}
- Starting from: ${travelData.startingLocation}
- Duration: ${travelData.duration} days
- Number of travelers: ${travelData.travelers}
- Budget: $${travelData.budget}

CRITICAL REQUIREMENT: Create exactly ${travelData.duration} days, each day must have EXACTLY 4 activities.

Return a JSON object with this EXACT structure:
{
  "projectName": "Short catchy name for the trip (e.g. 'Paris Adventure')",
  "phases": [
    {
      "number": 1,
      "name": "Location/Theme (1-2 words)",
      "steps": [
        { "title": "Morning Activity", "description": "Specific details with location/time" },
        { "title": "Afternoon Activity", "description": "Specific details with location/time" },
        { "title": "Evening Activity", "description": "Specific details with location/time" },
        { "title": "Night Activity", "description": "Specific details with location/time" }
      ]
    }
  ]
}

Requirements:
- JSON must be valid
- "projectName": 2-4 words maximum
- "phases": Array of days
- Each day MUST have exactly 4 steps (activities)
- Day names should be 1-2 words
`;
    } else {
      combinedPrompt = `Create a comprehensive learning roadmap for: ${prompt}

CRITICAL REQUIREMENT: Each phase must have EXACTLY 4 steps.

Return a JSON object with this EXACT structure:
{
  "projectName": "Short catchy name for the roadmap (e.g. 'React Mastery')",
  "phases": [
    {
      "number": 1,
      "name": "Phase Name (1-2 words)",
      "steps": [
        { "title": "Step Title", "description": "Specific and actionable instruction" },
        { "title": "Step Title", "description": "Specific and actionable instruction" },
        { "title": "Step Title", "description": "Specific and actionable instruction" },
        { "title": "Step Title", "description": "Specific and actionable instruction" }
      ]
    }
  ]
}

Requirements:
- JSON must be valid
- "projectName": 2-4 words maximum
- "phases": Array of phases
- Each phase MUST have exactly 4 steps
- Phase names should be 1-2 words (e.g., "Foundation", "Practice")
- Make it appropriate for category: ${category.replace('_', ' ')}
`;
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await retryWithBackoff(() => model.generateContent(combinedPrompt));
    const response = await result.response;
    const text = response.text();

    console.log('✅ Received combined response from Gemini AI');

    let parsedData;
    try {
      parsedData = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse JSON response:', text.substring(0, 200));
      // Fallback to text parsing if JSON fails (unlikely with responseMimeType)
      const cleaned = cleanAIResponse(text);
      const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('Invalid JSON response from AI');
      }
    }

    const projectName = parsedData.projectName || `${prompt} Journey`;
    const phases = parsedData.phases || [];

    if (phases.length === 0) {
      throw new Error('No phases found in AI response');
    }

    // Generate roadmap nodes from phases (will ensure exactly 4 steps per phase and include media)
    const roadmapNodes = await generatePhaseRoadmapNodes(phases, category, projectName, travelData);


    console.log(`📊 Generated ${phases.length} phases with ${roadmapNodes.length} total nodes`);

    // Generate FILTERED video recommendations using ML pipeline for non-travel categories
    let videoRecommendations = [];
    if (category === 'subject') {
      try {
        console.log('🎥 Generating FILTERED ML video recommendations...');
        console.log('📏 Applying consistent filters: >=2 hours, no shorts, quality tutorials');
        await createModifiedPythonScripts();
        const topic = extractMainTopic(prompt);
        // Use same filtering as the standalone endpoint (2+ hours, max 5 videos)
        videoRecommendations = await getVideoRecommendations(topic, 5, 120);
        console.log(`✅ Generated ${videoRecommendations.length} FILTERED video recommendations for: ${topic}`);
      } catch (error) {
        console.error('⚠️ ML video recommendations failed, continuing without them:', error.message);
      }
    }

    // Return structured response
    res.json({
      success: true,
      projectName: projectName.replace(/['"]/g, ''), // Clean quotes
      phases,
      roadmapNodes,
      category,
      originalPrompt: prompt,
      videoRecommendations, // Include ML video recommendations
      tokensUsed: TOKENS_PER_ROADMAP,
      tokensRemaining: tokensRemaining,
      timestamp: new Date().toISOString(),
      aiResponse: cleanAIResponse(text)
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

// Mock Interview endpoints
app.post('/api/mock-interview/start', async (req, res) => {
  try {
    console.log('🎤 Received mock interview start request:', req.body);

    const { userId, resumeText, position, questionCount = 5 } = req.body;

    // Validate required fields
    if (!userId || !resumeText || !position) {
      return res.status(400).json({
        success: false,
        error: 'User ID, resume text, and position are required',
        timestamp: new Date().toISOString()
      });
    }

    // Validate question count
    if (![5, 10, 15, 20].includes(questionCount)) {
      return res.status(400).json({
        success: false,
        error: 'Question count must be 5, 10, 15, or 20',
        timestamp: new Date().toISOString()
      });
    }

    // Check token balance
    const TOKENS_PER_INTERVIEW = parseInt(process.env.TOKENS_PER_INTERVIEW || '5', 10);
    if (!supabaseAdmin) {
      return res.status(500).json({
        success: false,
        error: 'Server configuration error (Supabase)',
        timestamp: new Date().toISOString()
      });
    }

    // Get user's current token balance
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('tokens, email')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      console.error('❌ Failed to fetch user profile:', profileError);
      return res.status(400).json({
        success: false,
        error: 'User profile not found',
        timestamp: new Date().toISOString()
      });
    }

    if (profile.tokens < TOKENS_PER_INTERVIEW) {
      return res.status(402).json({
        success: false,
        error: 'Insufficient tokens',
        tokensRemaining: profile.tokens,
        tokensRequired: TOKENS_PER_INTERVIEW,
        timestamp: new Date().toISOString()
      });
    }

    // Deduct tokens
    const { error: deductError } = await supabaseAdmin.rpc('deduct_user_tokens', {
      p_user_id: userId,
      p_tokens: TOKENS_PER_INTERVIEW,
      p_description: `Mock interview for ${position} position`,
      p_roadmap_id: null
    });

    if (deductError) {
      console.error('❌ Token deduction failed:', deductError);
      return res.status(500).json({
        success: false,
        error: 'Token deduction failed',
        timestamp: new Date().toISOString()
      });
    }

    console.log(`🪙 Successfully deducted ${TOKENS_PER_INTERVIEW} tokens from user ${userId}`);

    // Generate interview questions using Gemini AI
    if (!genAI) {
      return res.status(500).json({
        success: false,
        error: 'AI service not configured',
        timestamp: new Date().toISOString()
      });
    }

    const questionPrompt = `You are an expert interviewer for a ${position} position. Based on the following resume that was extracted using OpenAI, generate exactly ${questionCount} interview questions.

**RESUME CONTENT (Extracted from candidate's PDF):**
${resumeText}

**POSITION:** ${position}

**INSTRUCTIONS:**
Generate interview questions that are:
1. **DIRECTLY based on specific details from the candidate's resume** (projects, technologies, experiences mentioned)
2. A mix of technical questions about skills/technologies they claim to know
3. Behavioral questions about specific experiences they've listed
4. Questions that verify and probe deeper into their resume claims
5. Challenging but fair questions appropriate for the ${position} role

**IMPORTANT:** Reference specific items from their resume in your questions (e.g., "I see you worked on [project name]", "You mentioned [technology]")

Provide exactly ${questionCount} questions, one per line, without numbering or additional formatting.

Example format:
I see you worked on [specific project from resume]. Tell me about the challenges you faced?
You mentioned [specific technology]. How would you approach [technical scenario]?
Describe your role in [specific experience from resume]?
I noticed you have experience with [skill from resume]. How do you apply this in...?`;

    console.log('🤖 Generating interview questions with Gemini AI...');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(questionPrompt);
    const response = await result.response;
    const text = response.text();

    // Parse questions from response
    const questions = text
      .split('\n')
      .filter(line => line.trim())
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(q => q.length > 10)
      .slice(0, questionCount);

    if (questions.length < questionCount) {
      // Generate fallback questions if AI didn't provide enough
      const fallbackQuestions = [
        `Tell me about your experience relevant to the ${position} role.`,
        `What are your key strengths that make you suitable for this position?`,
        `Describe a challenging project you worked on and how you handled it.`,
        `How do you stay updated with the latest technologies and trends in your field?`,
        `Where do you see yourself in the next 3-5 years in this career path?`,
        `What is your greatest professional achievement?`,
        `How do you handle working under pressure and tight deadlines?`,
        `Describe your approach to problem-solving.`,
        `What motivates you in your work?`,
        `How do you handle conflicts with team members?`,
        `What technical skills are you most proficient in?`,
        `Tell me about a time you failed and what you learned.`,
        `How do you prioritize tasks when managing multiple projects?`,
        `What tools and methodologies do you prefer?`,
        `Why are you interested in this ${position} position?`,
        `How do you ensure code quality and best practices?`,
        `Describe your experience with team collaboration.`,
        `What emerging technologies interest you most?`,
        `How do you handle feedback and criticism?`,
        `What makes you a good fit for our team?`
      ];
      while (questions.length < questionCount) {
        questions.push(fallbackQuestions[questions.length]);
      }
    }

    console.log(`✅ Generated ${questions.length} interview questions`);

    res.json({
      success: true,
      questions,
      tokensUsed: TOKENS_PER_INTERVIEW,
      tokensRemaining: profile.tokens - TOKENS_PER_INTERVIEW,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error starting mock interview:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to start interview',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/mock-interview/report', async (req, res) => {
  try {
    console.log('📊 Received interview report generation request');

    const { userId, questions, position, resumeText, speechAnalysis } = req.body;

    if (!userId || !questions || !position) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        timestamp: new Date().toISOString()
      });
    }

    // Generate report using Gemini AI
    if (!genAI) {
      return res.status(500).json({
        success: false,
        error: 'AI service not configured',
        timestamp: new Date().toISOString()
      });
    }

    const speechAnalysisText = speechAnalysis ? `

Speech Analysis:
- Filler Words Used: ${speechAnalysis.fillerWords}
- Speaking Pace: ${speechAnalysis.pace} words per minute (ideal: 120-150 wpm)
- Speech Clarity: ${speechAnalysis.clarity}% (based on voice recognition confidence)
` : '';

    const reportPrompt = `You are an expert interviewer evaluating a candidate for a ${position} position.

Candidate's Resume Summary:
${resumeText.substring(0, 500)}...

Interview Questions and Answers:
${questions.map((q, i) => `
Q${i + 1}: ${q.question}
A${i + 1}: ${q.answer}`).join('\n')}
${speechAnalysisText}

Provide a comprehensive interview evaluation in the following JSON format:
{
  "overallScore": <number 0-100>,
  "strengths": ["strength 1", "strength 2", "strength 3"],
  "improvements": ["improvement 1", "improvement 2", "improvement 3"],
  "detailedFeedback": [
    {
      "id": 1,
      "question": "<question text>",
      "answer": "<answer text>",
      "feedback": "<specific feedback for this answer>"
    }
  ],
  "recommendation": "<overall recommendation and next steps>"
}

Evaluate based on:
- Technical knowledge and accuracy
- Communication skills
- Problem-solving approach
- Cultural fit and soft skills
- Relevance to the ${position} role

Provide ONLY the JSON object, no additional text.`;

    console.log('🤖 Generating interview report with Gemini AI...');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await retryWithBackoff(() => model.generateContent(reportPrompt));
    const response = await result.response;


    let text = response.text();

    // Clean up response to extract JSON
    text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    let report;
    try {
      report = JSON.parse(text);
    } catch (parseError) {
      console.error('Failed to parse AI response, generating fallback report');
      // Fallback report if parsing fails
      report = {
        overallScore: 70,
        strengths: [
          'Demonstrated relevant experience',
          'Good communication skills',
          'Showed enthusiasm for the role'
        ],
        improvements: [
          'Could provide more specific examples',
          'Technical depth could be improved',
          'Consider elaborating on problem-solving approaches'
        ],
        detailedFeedback: questions.map(q => ({
          id: q.id,
          question: q.question,
          answer: q.answer,
          feedback: 'Good response, consider adding more specific examples.'
        })),
        recommendation: `The candidate shows promise for the ${position} role. With some additional preparation and focus on technical depth, they could be a strong fit. Recommend further technical assessment.`
      };
    }

    console.log('✅ Interview report generated successfully');

    res.json({
      success: true,
      report,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error generating interview report:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate report',
      timestamp: new Date().toISOString()
    });
  }
});

// Voice-only interview response endpoint
app.post('/api/mock-interview/voice-response', async (req, res) => {
  try {
    console.log('🎙️ Received voice interview response request');

    const { conversationHistory, position, resumeText } = req.body;

    if (!conversationHistory || !position) {
      return res.status(400).json({
        success: false,
        error: 'Conversation history and position are required',
        timestamp: new Date().toISOString()
      });
    }

    // Generate AI response using Gemini
    if (!genAI) {
      return res.status(500).json({
        success: false,
        error: 'AI service not configured',
        timestamp: new Date().toISOString()
      });
    }

    // Build conversation context
    const conversationContext = conversationHistory
      .map(msg => `${msg.role === 'user' ? 'Candidate' : 'AI Interviewer'}: ${msg.content}`)
      .join('\n\n');

    const voicePrompt = `You are an AI interviewer conducting a voice-only interview for a ${position} position.

**CANDIDATE'S RESUME (Extracted using OpenAI from their PDF):**
${resumeText ? resumeText.substring(0, 1000) + '...' : 'Not provided'}

**CONVERSATION HISTORY:**
${conversationContext}

**INSTRUCTIONS:**
Respond naturally as an interviewer would in a real conversation. Your response should:
1. **Reference specific details from their resume** (projects, technologies, experiences they mentioned)
2. Ask relevant follow-up questions based on their previous answers AND their resume
3. Probe deeper into their claimed experience and skills from the resume
4. Be conversational and engaging (this is voice-only, so keep it natural)
5. Ask both technical questions about resume technologies and behavioral questions about resume experiences
6. Keep responses concise (2-4 sentences max) since this is a spoken conversation
7. Verify and explore the details they've written in their resume
8. After 8-10 exchanges, consider wrapping up the interview gracefully

**EXAMPLE QUESTIONS:**
- "I see from your resume you worked on [project]. Tell me about that."
- "You mentioned experience with [technology]. How have you used it?"
- "In your previous role at [company from resume], what was your biggest achievement?"

Provide ONLY your next response as the interviewer, nothing else.`;

    console.log('🤖 Generating AI interviewer response with Gemini AI...');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(voicePrompt);
    const response = await result.response;
    const aiResponse = response.text().trim();

    // Check if interview should end (after 10-12 exchanges)
    const shouldEnd = conversationHistory.length >= 20;

    console.log('✅ Generated AI interviewer response');

    res.json({
      success: true,
      aiResponse,
      shouldEnd,
      exchangeCount: Math.floor(conversationHistory.length / 2),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error generating voice interview response:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate response',
      timestamp: new Date().toISOString()
    });
  }
});

// AI Interview endpoints
app.post('/api/ai-interview/introduction', async (req, res) => {
  try {
    console.log('🎤 Received AI interview introduction request:', req.body);

    const { jobContext } = req.body;

    if (!genAI) {
      return res.status(500).json({
        success: false,
        error: 'AI service not configured',
        timestamp: new Date().toISOString()
      });
    }

    const systemPrompt = `You are an AI interviewer conducting a professional interview. Create a warm, welcoming introduction.

Job Data:
- Role: ${jobContext?.position || 'the position'}
- Skills Focus: ${jobContext?.skills?.slice(0, 3).join(', ') || 'professional skills'}
- Total Questions: ${jobContext?.totalQuestions || 5}

Create an introduction that:
1. Introduces yourself as an AI interviewer
2. States the specific job title
3. Mentions the skills focus areas
4. Asks for their brief introduction

Be warm, professional, and encouraging. Use actual job data, never placeholders.`;

    console.log('🤖 Generating interview introduction with Gemini AI...');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text();

    console.log('✅ Interview introduction generated successfully');

    res.json({
      success: true,
      message: text.trim(),
      phase: {
        current: 'introduction',
        questionIndex: 0,
        totalQuestions: jobContext?.totalQuestions || 5,
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error generating interview introduction:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate introduction',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/ai-interview/response', async (req, res) => {
  try {
    console.log('🎤 Received AI interview response request');

    const { conversationHistory, userResponse, jobContext, currentPhase } = req.body;

    if (!userResponse || !jobContext) {
      return res.status(400).json({
        success: false,
        error: 'User response and job context are required',
        timestamp: new Date().toISOString()
      });
    }

    if (!genAI) {
      return res.status(500).json({
        success: false,
        error: 'AI service not configured',
        timestamp: new Date().toISOString()
      });
    }

    // Build conversation context
    const conversationContext = conversationHistory
      .map(msg => `${msg.role}: ${msg.content}`)
      .join('\n');

    // Determine phase
    const totalQuestions = jobContext?.totalQuestions || 5;
    const currentQuestionIndex = currentPhase?.questionIndex || 0;
    const phase = currentPhase?.current || 'candidate_intro';

    let phaseInstructions = '';
    let nextPhase = {
      current: phase,
      questionIndex: currentQuestionIndex,
      totalQuestions,
    };

    if (phase === 'candidate_intro' || phase === 'introduction') {
      phaseInstructions = `The candidate just provided their introduction. Give warm acknowledgment (2-3 sentences) and ask the first interview question about their experience with ${jobContext?.skills?.[0] || 'relevant skills'}.`;
      nextPhase = {
        current: 'questions',
        questionIndex: 1,
        totalQuestions,
      };
    } else if (phase === 'questions') {
      if (currentQuestionIndex >= totalQuestions) {
        phaseInstructions = `All ${totalQuestions} questions complete. Thank the candidate warmly, acknowledge their qualifications, and conclude the interview professionally.`;
        nextPhase = {
          current: 'closing',
          questionIndex: totalQuestions,
          totalQuestions,
        };
      } else {
        phaseInstructions = `Question ${currentQuestionIndex} of ${totalQuestions}. Give brief feedback (1-2 sentences) and ask next question about ${jobContext?.skills?.[currentQuestionIndex % jobContext?.skills?.length] || 'their experience'}.`;
        nextPhase = {
          current: 'questions',
          questionIndex: currentQuestionIndex + 1,
          totalQuestions,
        };
      }
    } else if (phase === 'closing') {
      phaseInstructions = `The interview is complete. Provide a final warm closing message.`;
    }

    const systemPrompt = `You are an AI interviewer for the ${jobContext?.position || 'position'}.

${phaseInstructions}

Job Context:
- Role: ${jobContext?.position || 'Position'}
- Skills: ${jobContext?.skills?.join(', ') || 'Professional skills'}
- Questions: ${currentPhase?.questionIndex || 1} of ${totalQuestions}

Conversation History:
${conversationContext}

Latest Response: "${userResponse}"

Respond in JSON:
{
  "feedback": "Brief acknowledgment/feedback",
  "nextQuestion": "Your next question${phase === 'closing' ? ' (empty for closing)' : ''}"
}`;

    console.log('🤖 Generating AI interviewer response with Gemini AI...');
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    let text = response.text();

    // Parse JSON response
    let parsedResponse;
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedResponse = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.warn('Failed to parse AI response, using fallback');
      const isClosing = phase === 'closing' || currentQuestionIndex >= totalQuestions;
      parsedResponse = {
        feedback: isClosing
          ? `Thank you so much for your time today. Your insights have been valuable.`
          : 'Thank you for sharing that.',
        nextQuestion: isClosing
          ? ''
          : `Can you tell me about your experience with ${jobContext?.skills?.[0] || 'this skill'}?`,
      };
    }

    console.log('✅ AI interviewer response generated successfully');

    res.json({
      success: true,
      feedback: parsedResponse.feedback,
      nextQuestion: parsedResponse.nextQuestion,
      phase: nextPhase,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error generating AI interview response:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate response',
      timestamp: new Date().toISOString()
    });
  }
});

app.post('/api/ai-interview/save', async (req, res) => {
  try {
    console.log('💾 Received interview conversation save request');

    const { interviewId, messages } = req.body;

    // Here you would save to your database
    // For now, just return success

    res.json({
      success: true,
      message: 'Conversation saved successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error saving interview conversation:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to save conversation',
      timestamp: new Date().toISOString()
    });
  }
});

// Video recommendation endpoint with consistent filtering
app.post('/api/get-video-recommendations', async (req, res) => {
  try {
    console.log('🎥 Received FILTERED video recommendation request:', req.body);

    const { topic, userInput, minDurationMinutes = 120, maxVideos = 10 } = req.body;

    if (!topic && !userInput) {
      return res.status(400).json({
        success: false,
        error: 'Either topic or userInput is required',
        timestamp: new Date().toISOString()
      });
    }

    // Extract main topic if userInput is provided
    const finalTopic = topic || extractMainTopic(userInput);
    console.log(`🔍 Processing FILTERED video recommendations for topic: ${finalTopic}`);
    console.log(`📏 Filter settings: Min ${minDurationMinutes}min duration, Max ${maxVideos} videos`);

    // Initialize ML scripts if not done already
    await createModifiedPythonScripts();

    // Get FILTERED video recommendations from ML pipeline
    const videoRecommendations = await getVideoRecommendations(finalTopic, maxVideos, minDurationMinutes);

    console.log(`✅ Generated ${videoRecommendations.length} FILTERED video recommendations`);
    console.log('📏 All videos should be >= 2 hours and exclude YouTube Shorts');

    res.json({
      success: true,
      topic: finalTopic,
      videos: videoRecommendations,
      filter: {
        minDurationMinutes,
        maxVideos,
        appliedFiltering: 'Duration >= 2h, No Shorts, Quality tutorials only'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Error getting video recommendations:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to get video recommendations',
      timestamp: new Date().toISOString()
    });
  }
});

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
  console.log('  - Get Video Recommendations: http://localhost:' + PORT + '/api/get-video-recommendations');
  console.log('  - Health Check: http://localhost:' + PORT + '/api/health');
  console.log('🔑 Gemini API configured:', !!(GEMINI_API_KEY && GEMINI_API_KEY !== 'your-gemini-api-key-here'));
  console.log('🔑 Mistral API configured:', mistralConfigured);
  console.log('🌐 CORS enabled for production');
  console.log('🏠 Root endpoint: http://localhost:' + PORT + '/');
});