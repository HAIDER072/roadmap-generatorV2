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
console.log('📄 Testing PDF parsing with Gemini 2.5 Pro...\n');
console.log('📂 PDF Path:', PDF_PATH);

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

async function testPDFParsing() {
  try {
    // Read PDF file
    console.log('\n📖 Reading PDF file...');
    const pdfBuffer = fs.readFileSync(PDF_PATH);
    const base64Pdf = pdfBuffer.toString('base64');
    console.log('✅ PDF loaded, size:', (pdfBuffer.length / 1024).toFixed(2), 'KB');
    
    // Send to Gemini 2.5 Pro
    console.log('\n🤖 Sending PDF to Gemini 2.5 Pro for text extraction...');
    
    // Try gemini-2.5-pro first, fallback to gemini-2.0-flash-exp if overloaded
    let model;
    let modelName = "gemini-2.5-pro";
    
    try {
      model = genAI.getGenerativeModel({ model: modelName });
    } catch (err) {
      console.log('⚠️ Gemini 2.5 Pro unavailable, trying gemini-2.0-flash-exp...');
      modelName = "gemini-2.0-flash-exp";
      model = genAI.getGenerativeModel({ model: modelName });
    }
    
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
    const extractedText = response.text();
    
    console.log('✅ PDF text extracted successfully!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📄 RESUME PARSING CONFIRMED - GEMINI EXTRACTED:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('📌 File: CollegeCV.pdf');
    console.log('📏 Length:', extractedText.length, 'characters');
    console.log('🔍 Extracted text:\n');
    console.log(extractedText);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ PDF parsing with Gemini 2.5 Pro works perfectly!');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    
    if (error.message.includes('ENOENT')) {
      console.error('\n💡 PDF file not found at:', PDF_PATH);
    } else if (error.message.includes('404') || error.message.includes('not found')) {
      console.error('\n💡 Model might not support PDFs or not available');
    } else {
      console.error('\nFull error:', error);
    }
  }
}

testPDFParsing();
