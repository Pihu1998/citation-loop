import { NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";

const MOCK_MISTRAL = process.env.MOCK_MISTRAL === "true";
const apiKey = process.env.MISTRAL_API_KEY || "dummy";
const client = new Mistral({ apiKey });

export async function POST(req: Request) {
    const { brandName, description, query } = await req.json();

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            function send(data: any) {
                controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
            }

            try {
                if (MOCK_MISTRAL || !process.env.MISTRAL_API_KEY) {
                    send({ step: "Extracting patterns from top competitors...", type: "log" });
                    await new Promise(r => setTimeout(r, 1500));

                    send({ step: "Found patterns: precise feature comparisons, avoiding fluff, strong domain-specific terminology.", type: "log" });
                    await new Promise(r => setTimeout(r, 1500));

                    send({ step: "Generating 3 optimized content variants based on extracted patterns...", type: "log" });
                    await new Promise(r => setTimeout(r, 1500));

                    const variants = [
                        { text: `${brandName} is a next-generation platform for startups offering unique integrations and specialized tools.`, type: "Positioning Statement" },
                        { text: `Unlike generic tools, ${brandName} specifically targets high-growth startups with an API-first approach that developers love.`, type: "Comparison Blurb" },
                        { text: `${brandName} features instant deployment, deep analytics, and real-time collaboration that competitors like HubSpot lack.`, type: "Feature List" }
                    ];

                    send({ step: "Simulating citation impact for Variant 1...", type: "log" });
                    await new Promise(r => setTimeout(r, 800));

                    send({ step: "Simulating citation impact for Variant 2...", type: "log" });
                    await new Promise(r => setTimeout(r, 800));

                    send({ step: "Simulating citation impact for Variant 3...", type: "log" });
                    await new Promise(r => setTimeout(r, 800));

                    send({ step: "Simulation complete. Selecting the best performer.", type: "log" });
                    await new Promise(r => setTimeout(r, 1000));

                    send({
                        type: "final",
                        variants,
                        winningVariant: {
                            text: variants[1].text,
                            explanation: "Variant 2 performed exceptionally well because it directly addresses the user's intent to compare alternatives and uses contrasting framing ('Unlike generic tools') which AI models love citing to provide balanced answers.",
                            scoreBefore: 20,
                            scoreAfter: 85
                        }
                    });

                    controller.close();
                    return;
                }

                // Live Mode (Simplified Agent Loop)
                // 1. Ask Mistral what makes top brands cited for this query
                send({ step: "Extracting patterns from top competitors...", type: "log" });
                const analysisReq = await client.chat.complete({
                    model: "mistral-large-latest",
                    messages: [{ role: "user", content: `For the query "${query}", analyze why top brands get cited in AI responses. What tone, specificity, and format do successful brands use? Keep it structured.` }],
                });
                const rawPatterns = analysisReq.choices?.[0]?.message?.content;
                const patterns = typeof rawPatterns === "string" ? rawPatterns : "Focus on deep technical specs and direct comparisons.";
                send({ step: `Extracted Patterns: ${patterns.substring(0, 100)}...`, type: "log" });

                // 2. Generate 3 variants
                send({ step: "Generating 3 optimized content variants based on patterns...", type: "log" });
                const variantsReq = await client.chat.complete({
                    model: "mistral-large-latest",
                    responseFormat: { type: "json_object" },
                    messages: [{ role: "user", content: `You are an expert marketer. Given this brand: "${brandName}", description: "${description}" and these patterns for the query "${query}": "${patterns}". Combine to generate 3 diverse snippets (a positioning statement, a comparison blurb, a feature list). Output JSON format: { "variants": [{ "text": "...", "type": "..." }] }` }],
                });
                const rawVariants = variantsReq.choices?.[0]?.message?.content;
                const variantsData = JSON.parse(typeof rawVariants === "string" ? rawVariants : '{ "variants": [] }');
                const variants = variantsData.variants;

                // 3. Simulate and score variants
                let bestVariant = variants[0];
                let bestScore = -1;
                let bestExplanation = "";

                for (let i = 0; i < variants.length; i++) {
                    send({ step: `Simulating citation impact for Variant ${i + 1}: ${variants[i].type}...`, type: "log" });
                    const simReq = await client.chat.complete({
                        model: "mistral-small-latest",
                        responseFormat: { type: "json_object" },
                        messages: [{ role: "user", content: `Evaluate this text snippet for getting cited in an AI response to the query "${query}". Text: "${variants[i].text}". Score it from 0 to 100 based on its likelihood to be cited. Provide reasoning. Output JSON: { "score": number, "reasoning": "string" }` }]
                    });
                    const rawResult = simReq.choices?.[0]?.message?.content;
                    const result = JSON.parse(typeof rawResult === "string" ? rawResult : '{"score": 50, "reasoning": "Average evaluation"}');

                    if (result.score > bestScore) {
                        bestScore = result.score;
                        bestVariant = variants[i];
                        bestExplanation = result.reasoning;
                    }
                }

                send({ step: "Simulation complete. Selected the best performer based on confidence score.", type: "log" });

                send({
                    type: "final",
                    variants,
                    winningVariant: {
                        text: bestVariant.text,
                        explanation: bestExplanation,
                        scoreBefore: 20, // Example placeholder
                        scoreAfter: bestScore
                    }
                });

            } catch (error) {
                send({ step: "Agent Loop Error: " + (error as Error).message, type: "log" });
                send({ type: "error", message: "Failed to run agent loop." });
            } finally {
                controller.close();
            }
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "application/x-ndjson",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
        },
    });
}
