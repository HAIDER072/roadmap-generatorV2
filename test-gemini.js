import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

console.log('🔍 Testing Gemini API Configuration...');
console.log('API Key configured:', !!GEMINI_API_KEY);
console.log('API Key length:', GEMINI_API_KEY?.length || 0);

if (!GEMINI_API_KEY || GEMINI_API_KEY === 'your-gemini-api-key-here') {
  console.error('❌ Gemini API key not configured properly');
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function testGeminiAPI() {
  try {
    console.log('🤖 Testing Gemini API with gemini-2.0-flash model...');
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
    
    const prompt = "Say hello in one word";
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini API test successful!');
    console.log('Response:', text);
    process.exit(0);
  } catch (error) {
    console.error('❌ Gemini API test failed!');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error details:', error);
    
    // Check for common errors
    if (error.message?.includes('API_KEY_INVALID')) {
      console.error('\n🔑 Solution: Your API key is invalid. Please check:');
      console.error('   1. Visit https://makersuite.google.com/app/apikey');
      console.error('   2. Generate a new API key');
      console.error('   3. Update GEMINI_API_KEY in your .env file');
    } else if (error.message?.includes('RESOURCE_EXHAUSTED')) {
      console.error('\n⚠️ Solution: API quota exceeded. Please:');
      console.error('   1. Wait for quota to reset');
      console.error('   2. Or create a new API key');
    } else if (error.message?.includes('model')) {
      console.error('\n🤖 Solution: Model issue. Try:');
      console.error('   1. Using "gemini-pro" instead of "gemini-2.0-flash"');
      console.error('   2. Or "gemini-1.5-flash"');
    } else if (error.message?.includes('blocked') || error.message?.includes('SERVICE_DISABLED')) {
      console.error('\n🚫 Solution: API service is blocked or disabled. Please:');
      console.error('   1. Check if Generative Language API is enabled in Google Cloud Console');
      console.error('   2. Visit: https://console.cloud.google.com/apis/library/generativelanguage.googleapis.com');
      console.error('   3. Enable the API for your project');
    }
    
    process.exit(1);
  }
}

testGeminiAPI();
