import { GoogleGenerativeAI } from '@google/generative-ai';

async function test() {
  try {
    const key = 'YOUR_GEMINI_API_KEY_HERE';
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
