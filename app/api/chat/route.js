import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    // 1. Read the message sent from the Frontend
    const { message, history } = await req.json();

    // 2. Setup Google Gemini
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error(
        "GEMINI_API_KEY is not defined in the environment variables.",
      );
    }
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-flash-latest",
    });

    // 3. Translate your history for Gemini
    const chatHistory = history.map(function (msg) {
      return {
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      };
    });

    // --- THE FIX STARTS HERE ---
    // Gemini CRASHES if the history starts with a 'model' message.
    // We check if the first message is from the model, and if so, we remove it.
    if (chatHistory.length > 0 && chatHistory[0].role === "model") {
      chatHistory.shift(); // .shift() removes the first item in the array
    }
    // --- THE FIX ENDS HERE ---

    // 4. Start the Chat with the clean history
    const chat = model.startChat({
      history: chatHistory,
    });

    // 5. Send the new message
    const result = await chat.sendMessage(message);
    const response = await result.response;
    const text = response.text();

    return NextResponse.json({ text });
  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred." },
      { status: 500 },
    );
  }
}
