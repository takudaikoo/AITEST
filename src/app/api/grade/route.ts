
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const apiKey = process.env.GEMINI_API_KEY;

export async function POST(req: Request) {
    if (!apiKey) {
        return NextResponse.json({ error: "API Key not configured" }, { status: 500 });
    }

    try {
        const { questionText, userAnswer, gradingPrompt, explanation } = await req.json();

        if (!questionText || !userAnswer) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({
            model: "gemini-1.5-flash",
            generationConfig: {
                maxOutputTokens: 300, // Limit max output tokens for cost efficiency
            }
        });

        const prompt = `
あなたは試験の採点官です。以下の情報をもとに、ユーザーの回答を採点してください。

【問題文】
${questionText}

【正解・解説】
${explanation || "特になし"}

【採点基準・指示】
${gradingPrompt || "一般的な常識と問題文の意図に基づいて判断してください。"}

【ユーザーの回答】
${userAnswer}

---
以下の形式のJSONで出力してください（マークダウンのコードブロックは不要です。純粋なJSONのみを返してください）。
フィードバックは**非常に簡潔に**（200文字以内）でお願いします。長文は避けてください。

{
  "isCorrect": boolean, // 正解ならtrue、不正解ならfalse
  "score": number, // 0〜10点
  "feedback": "string" // ユーザーへのフィードバック（200文字以内。簡潔に。）
}
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // simple cleaning in case markdown is included
        const cleanedText = text.replace(/```json/g, "").replace(/```/g, "").trim();

        const jsonResponse = JSON.parse(cleanedText);

        return NextResponse.json(jsonResponse);

    } catch (error: any) {
        console.error("AI Grading Error:", error);
        return NextResponse.json({ error: "AI grading failed", details: error.message }, { status: 500 });
    }
}
