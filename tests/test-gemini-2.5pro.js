import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env file');
  process.exit(1);
}

console.log('🔑 Gemini API Key found');
console.log('🧪 Testing Gemini 2.5 Pro...\n');

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function testGemini25Pro() {
  try {
    console.log('📤 Sending test message to Gemini 2.5 Pro...');
    
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });
    
    const result = await model.generateContent("Say 'Hello! I am Gemini 2.5 Pro and I'm working correctly!' in a friendly way.");
    
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ SUCCESS! Gemini 2.5 Pro responded:\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(text);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ Gemini 2.5 Pro is working perfectly!');
    
  } catch (error) {
    console.error('❌ ERROR testing Gemini 2.5 Pro:');
    console.error(error.message);
    
    if (error.message.includes('API_KEY')) {
      console.error('\n💡 Check your GEMINI_API_KEY in .env file');
    }
    if (error.message.includes('404') || error.message.includes('not found')) {
      console.error('\n💡 The model "gemini-2.5-pro" might not be available yet.');
      console.error('   Trying gemini-2.0-flash-exp as fallback...\n');
      
      try {
        const fallbackModel = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
        const fallbackResult = await fallbackModel.generateContent("Say hello!");
        const fallbackResponse = await fallbackResult.response;
        console.log('✅ Fallback model works:', fallbackResponse.text());
        console.log('\n⚠️ Use "gemini-2.0-flash-exp" instead of "gemini-2.5-pro"');
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError.message);
      }
    }
  }
}

testGemini25Pro();
