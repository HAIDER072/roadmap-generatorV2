import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const PDF_PATH = 'C:\\Users\\abbas\\OneDrive\\Desktop\\CollegeCV.pdf';

if (!GEMINI_API_KEY) {
  console.error('❌ GEMINI_API_KEY not found in .env file');
  process.exit(1);
}

console.log('🔑 Gemini API Key found');
console.log('📄 Testing PDF parsing with Gemini...\n');
console.log('📂 PDF Path:', PDF_PATH);

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function testPDFParsing() {
  try {
    // Read PDF file
    console.log('\n📖 Reading PDF file...');
    const pdfBuffer = fs.readFileSync(PDF_PATH);
    const base64Pdf = pdfBuffer.toString('base64');
    console.log('✅ PDF loaded, size:', (pdfBuffer.length / 1024).toFixed(2), 'KB');
    
    // Try multiple models in order of preference
    const modelsToTry = [
      { name: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
      { name: "gemini-2.0-flash-exp", label: "Gemini 2.0 Flash" },
      { name: "gemini-1.5-pro", label: "Gemini 1.5 Pro" }
    ];
    
    let extractedText = null;
    let usedModel = null;
    
    for (const modelConfig of modelsToTry) {
      try {
        console.log(`\n🤖 Trying ${modelConfig.label}...`);
        
        const model = genAI.getGenerativeModel({ model: modelConfig.name });
        
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
        extractedText = response.text();
        usedModel = modelConfig.label;
        break; // Success! Stop trying other models
        
      } catch (modelError) {
        if (modelError.message.includes('503') || modelError.message.includes('overloaded')) {
          console.log(`⚠️ ${modelConfig.label} is overloaded, trying next model...`);
        } else if (modelError.message.includes('404') || modelError.message.includes('not found')) {
          console.log(`⚠️ ${modelConfig.label} not available, trying next model...`);
        } else {
          console.log(`⚠️ ${modelConfig.label} error: ${modelError.message}`);
        }
      }
    }
    
    if (!extractedText) {
      throw new Error('All models failed or are unavailable. Please try again later.');
    }
    
    console.log(`\n✅ PDF text extracted successfully using ${usedModel}!\n`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄 RESUME PARSING CONFIRMED - GEMINI EXTRACTED:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📌 File: CollegeCV.pdf');
    console.log('🤖 Model used:', usedModel);
    console.log('📏 Length:', extractedText.length, 'characters');
    console.log('🔍 Extracted text:\n');
    console.log(extractedText);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ PDF parsing works perfectly!');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    
    if (error.message.includes('ENOENT')) {
      console.error('\n💡 PDF file not found at:', PDF_PATH);
    } else {
      console.error('\nFull error:', error);
    }
  }
}

testPDFParsing();
