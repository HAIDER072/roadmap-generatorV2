import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
async function test() {
  try {
    const key = GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(key);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent("Hello!");
    console.log("SUCCESS:", await result.response.text());
  } catch (error) {
    console.error("ERROR:");
    console.error(error);
  }
}

test();
