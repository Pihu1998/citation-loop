import { NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";

const MOCK_MISTRAL = process.env.MOCK_MISTRAL === "true";
const apiKey = process.env.MISTRAL_API_KEY || "dummy";
const client = new Mistral({ apiKey });

export async function POST(req: Request) {
    try {
        const { brandName, description, query } = await req.json();

        if (MOCK_MISTRAL || !process.env.MISTRAL_API_KEY) {
            // Mock behaviour
            await new Promise((resolve) => setTimeout(resolve, 1500));

            const mentioned = Math.random() > 0.5;
            return NextResponse.json({
                mentioned,
                reasoning: mentioned
                    ? `${brandName} was cited due to its specific market positioning and strong feature descriptions matching the query.`
                    : `${brandName} was not mentioned. The model favored established competitors with broader domain authority.`,
                competitors: ["Salesforce", "HubSpot", "Zendesk", "Pipedrive"].sort(() => 0.5 - Math.random()).slice(0, 3)
            });
        }

        // Step 1: Generate AI response to the query
        const chatResponse = await client.chat.complete({
            model: "mistral-small-latest",
            messages: [{ role: "user", content: query }],
        });

        const aiAnswer = chatResponse.choices?.[0]?.message?.content || "";

        // Step 2: Extract details
        const extractResponse = await client.chat.complete({
            model: "mistral-small-latest",
            responseFormat: { type: "json_object" },
            messages: [
                {
                    role: "system",
                    content: "You are an analyzer. Given an AI's text response to a user query, extract the requested information in JSON format with keys: 'mentioned' (boolean), 'reasoning' (string explaining why the brand was or wasn't mentioned), and 'competitors' (array of strings for other brands mentioned)."
                },
                {
                    role: "user",
                    content: `Brand to check: "${brandName}".\nAI Response: "${aiAnswer}"\n\nDid the AI mention the brand? Who else was mentioned? Provide valid JSON.`
                }
            ]
        });

        const resultStr = typeof extractResponse.choices?.[0]?.message?.content === "string"
            ? extractResponse.choices[0].message.content
            : "{}";
        const result = JSON.parse(resultStr);

        return NextResponse.json({
            mentioned: result.mentioned || false,
            reasoning: result.reasoning || `${brandName} visibility checked.`,
            competitors: result.competitors || []
        });

    } catch (error) {
        console.error("Audit API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
