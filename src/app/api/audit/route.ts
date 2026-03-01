import { NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";
import { OpenAI } from "openai";

const MOCK_MISTRAL = process.env.MOCK_MISTRAL === "true";
const mistralKey = process.env.MISTRAL_API_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

const mistralClient = mistralKey && mistralKey !== "dummy" ? new Mistral({ apiKey: mistralKey }) : null;
const openaiClient = openaiKey && openaiKey !== "dummy" ? new OpenAI({ apiKey: openaiKey }) : null;

export async function POST(req: Request) {
    try {
        const { brandName, description, query } = await req.json();

        // 1. Mock Mode Check
        if (MOCK_MISTRAL || (!mistralClient && !openaiClient)) {
            await new Promise((resolve) => setTimeout(resolve, 1500));
            const isCodingQuery = /coding|developer|agent|programming|software/i.test(query);
            const mockCompetitors = isCodingQuery
                ? ["Cursor", "GitHub Copilot", "Replit Ghostwriter", "Codeium", "Tabnine", "Anysphere"]
                : ["Salesforce", "HubSpot", "Zendesk", "Pipedrive", "Monday.com", "ClickUp"];
            const mentioned = Math.random() > 0.6;
            return NextResponse.json({
                mentioned,
                reasoning: mentioned
                    ? `${brandName} was cited as a leading choice because its specialized developer-first approach directly addresses the query's focus on automation.`
                    : `${brandName} was overlooked in this specific instance. The AI model preferred established players like ${mockCompetitors[0]} who have high general visibility.`,
                competitors: mockCompetitors.sort(() => 0.5 - Math.random()).slice(0, 3)
            });
        }

        let aiAnswer = "";
        let result: any = null;

        // 2. OpenAI implementation (Priority)
        if (openaiClient) {
            const chatResponse = await openaiClient.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [{ role: "user", content: query }],
            });
            aiAnswer = chatResponse.choices[0].message.content || "";

            const extractResponse = await openaiClient.chat.completions.create({
                model: "gpt-4o-mini",
                response_format: { type: "json_object" },
                messages: [
                    { role: "system", content: "You are an analyzer. Extract JSON: { 'mentioned': boolean, 'reasoning': string, 'competitors': string[] }" },
                    { role: "user", content: `Brand: "${brandName}". Answer: "${aiAnswer}". Extract JSON.` }
                ]
            });
            result = JSON.parse(extractResponse.choices[0].message.content || "{}");
        }
        // 3. Mistral implementation (Fallback)
        else if (mistralClient) {
            const chatResponse = await mistralClient.chat.complete({
                model: "mistral-small-latest",
                messages: [{ role: "user", content: query }],
            });
            aiAnswer = typeof chatResponse.choices?.[0]?.message?.content === "string" ? chatResponse.choices[0].message.content : "";

            const extractResponse = await mistralClient.chat.complete({
                model: "mistral-small-latest",
                responseFormat: { type: "json_object" },
                messages: [
                    { role: "system", content: "You are an analyzer. Extract JSON: { 'mentioned': boolean, 'reasoning': string, 'competitors': string[] }" },
                    { role: "user", content: `Brand: "${brandName}". Answer: "${aiAnswer}". Extract JSON.` }
                ]
            });
            const resultStr = typeof extractResponse.choices?.[0]?.message?.content === "string" ? extractResponse.choices[0].message.content : "{}";
            result = JSON.parse(resultStr);
        }

        return NextResponse.json({
            mentioned: result.mentioned || false,
            reasoning: result.reasoning || `${brandName} visibility checked.`,
            competitors: result.competitors || []
        });

    } catch (error: any) {
        console.error("Audit API Error:", error);
        if (error.status === 401 || error.statusCode === 401) {
            return NextResponse.json(
                { error: "AI Provider Authentication failed. Check your API keys in .env.local." },
                { status: 401 }
            );
        }
        return NextResponse.json(
            { error: "Internal Server Error during audit: " + error.message },
            { status: 500 }
        );
    }
}
