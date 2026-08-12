import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
dotenv.config({ path: "./backend/.env" });

async function testAllModels() {
  const apiKey = process.env.GEMINI_API_KEY;
  const genAI = new GoogleGenerativeAI(apiKey);
  
  // List of standard flash models to try
  const models = [
    "gemini-2.0-flash", 
    "gemini-2.5-flash", 
    "gemini-1.5-pro", 
    "gemini-1.5-flash",
    "gemini-pro-latest",
    "gemini-3-flash-preview",
    "gemini-3.1-flash-lite-preview"
  ];
  
  for (const name of models) {
    try {
      const model = genAI.getGenerativeModel({ model: name });
      const res = await model.generateContent("test");
      console.log(`PASS: ${name}`);
      return name;
    } catch (err) {
      console.log(`FAIL: ${name} (${err.message})`);
    }
  }
}

testAllModels();
