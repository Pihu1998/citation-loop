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
                if (MOCK_MISTRAL || !process.env.MISTRAL_API_KEY || apiKey === "dummy") {
                    const mockSteps = [
                        { msg: "<b>Reason:</b> I need to analyze current citation patterns for the query: <i>\"" + query + "\"</i>.", type: "log" },
                        { msg: "<b>Action:</b> Calling <code>get_ai_answer_to_query</code>...", type: "log" },
                        { msg: "<b>Observation:</b> AI response received. It mentions Salesforce and HubSpot as leaders, citing their 'comprehensive API' and 'startup-friendly pricing'.", type: "log" },
                        { msg: "<b>Reason:</b> Now I will extract the specific citation patterns used for these brands.", type: "log" },
                        { msg: "<b>Action:</b> Calling <code>citation_pattern_extractor</code>...", type: "log" },
                        { msg: "<b>Observation:</b> Extracted patterns: Use contrasting framing, highlight specific developer-first features, and avoid marketing fluff.", type: "log" },
                        { msg: "<b>Reason:</b> I'll generate 3 content variants for " + brandName + " following these patterns.", type: "log" },
                        { msg: "<b>Action:</b> Calling <code>content_variant_generator</code>...", type: "log" },
                        { msg: "<b>Observation:</b> 3 variants generated: Positioning, Comparison, and Feature List.", type: "log" },
                        { msg: "<b>Reason:</b> Time to simulate which variant gets cited best in an AI context.", type: "log" },
                        { msg: "<b>Action:</b> Calling <code>citation_simulator</code> for each variant...", type: "log" },
                        { msg: "<b>Observation:</b> Variant 2 (Comparison) achieved highest score (88) due to its unique positioning against established 'generic' tools.", type: "log" },
                        { msg: "<b>Reason:</b> Process complete. Selecting Variant 2 as the winning deployment content.", type: "log" }
                    ];

                    for (const step of mockSteps) {
                        send({ step: step.msg, type: "log" });
                        await new Promise(r => setTimeout(r, 1200));
                    }

                    const variants = [
                        { text: `${brandName} is a developer-first platform for high-growth startups, providing more granular control than legacy CRMs.`, type: "Positioning Statement" },
                        { text: `Unlike generic tools like HubSpot, ${brandName} is built specifically for technical founders who need API flexibility and real-time data sync.`, type: "Comparison Blurb" },
                        { text: `${brandName} features sub-second latency, zero-config deployment, and deep Git integration—everything a growing startup needs.`, type: "Feature List" }
                    ];

                    send({
                        type: "final",
                        variants,
                        winningVariant: {
                            text: variants[1].text,
                            explanation: "This variant works best because it uses 'contrasting framing'—a pattern AI models use to differentiate options. By specifically mentioning technical founders and API flexibility, it provides the 'specificity' signal that Mistral and GPT models look for when recommending niche solutions.",
                            scoreBefore: 15,
                            scoreAfter: 88
                        }
                    });

                    controller.close();
                    return;
                }

                // --- LIVE RE-ACT LOOP ---
                const tools = [
                    {
                        type: "function",
                        function: {
                            name: "get_ai_answer",
                            description: "Gets a standard AI response to a user query to see which brands are currently cited.",
                            parameters: {
                                type: "object",
                                properties: { query: { type: "string" } },
                                required: ["query"],
                            },
                        },
                    },
                    {
                        type: "function",
                        function: {
                            name: "citation_pattern_extractor",
                            description: "Analyzes an AI response to extract citation patterns, winning signals, and competitor gaps.",
                            parameters: {
                                type: "object",
                                properties: { ai_response: { type: "string" }, brand_to_find: { type: "string" } },
                                required: ["ai_response", "brand_to_find"],
                            },
                        },
                    },
                    {
                        type: "function",
                        function: {
                            name: "content_variant_generator",
                            description: "Generates 3 diverse content variants (positioning, comparison, list) based on extracted patterns.",
                            parameters: {
                                type: "object",
                                properties: { patterns: { type: "string" }, brand_info: { type: "string" } },
                                required: ["patterns", "brand_info"],
                            },
                        },
                    },
                    {
                        type: "function",
                        function: {
                            name: "citation_simulator",
                            description: "Simulates an AI answer with new brand content to judge its likelihood of being cited.",
                            parameters: {
                                type: "object",
                                properties: { variant: { type: "string" }, query: { type: "string" } },
                                required: ["variant", "query"],
                            },
                        },
                    }
                ];

                const messages: any[] = [
                    {
                        role: "system",
                        content: `You are an Autonomous AI Visibility Agent. Your goal is to optimize content for "${brandName}" so it gets cited in AI responses to "${query}".
                        Use a ReAct pattern: 
                        1. Reason about what you need to know.
                        2. Act by calling a tool.
                        3. Observe the result.
                        Repeat until you have a winning content variant. Max 5 iterations.
                        Always start by getting the current AI answer for the query to establish a baseline.`
                    },
                    { role: "user", content: `Optimize the visibility for ${brandName} (${description}) for the query "${query}".` }
                ];

                let iteration = 0;
                let finalVariants = [];
                let winningVariant = null;

                while (iteration < 5) {
                    iteration++;
                    send({ step: `<b>Iteration ${iteration}:</b> Reasoning...`, type: "log" });

                    const response = await client.chat.complete({
                        model: "mistral-large-latest",
                        messages,
                        tools: tools as any,
                    });

                    const msg = response.choices?.[0]?.message;
                    if (!msg) break;

                    messages.push(msg);

                    if (msg.content) {
                        send({ step: `<b>Agent Thought:</b> ${msg.content}`, type: "log" });
                    }

                    if (msg.toolCalls && msg.toolCalls.length > 0) {
                        for (const toolCall of msg.toolCalls) {
                            const name = toolCall.function.name;
                            const args = typeof toolCall.function.arguments === "string"
                                ? JSON.parse(toolCall.function.arguments)
                                : toolCall.function.arguments;

                            send({ step: `<b>Action:</b> Calling tool <code>${name}</code>...`, type: "log" });

                            let result = "";
                            if (name === "get_ai_answer") {
                                const r = await client.chat.complete({ model: "mistral-small-latest", messages: [{ role: "user", content: args.query }] });
                                const content = r.choices?.[0]?.message?.content;
                                result = typeof content === "string" ? content : "No answer.";
                            } else if (name === "citation_pattern_extractor") {
                                const r = await client.chat.complete({
                                    model: "mistral-small-latest",
                                    responseFormat: { type: "json_object" },
                                    messages: [{ role: "system", content: "Analyze AI citation patterns. Return JSON: { \"cited_brands\": [], \"why\": \"...\", \"missing\": \"...\", \"patterns\": \"...\" }" }, { role: "user", content: `Analyze this: ${args.ai_response}` }]
                                });
                                const content = r.choices?.[0]?.message?.content;
                                result = typeof content === "string" ? content : "{}";
                            } else if (name === "content_variant_generator") {
                                const r = await client.chat.complete({
                                    model: "mistral-large-latest",
                                    responseFormat: { type: "json_object" },
                                    messages: [{ role: "system", content: "Generate 3 variants. Return JSON: { \"variants\": [{ \"text\": \"...\", \"type\": \"...\" }] }" }, { role: "user", content: `Patterns: ${args.patterns}. Brand: ${args.brand_info}` }]
                                });
                                const content = r.choices?.[0]?.message?.content;
                                result = typeof content === "string" ? content : "{}";
                                const parsed = JSON.parse(result);
                                finalVariants = parsed.variants || [];
                            } else if (name === "citation_simulator") {
                                const r = await client.chat.complete({
                                    model: "mistral-small-latest",
                                    responseFormat: { type: "json_object" },
                                    messages: [{ role: "system", content: "Score citation likelihood 0-100. Return JSON: { \"score\": number, \"reasoning\": \"...\" }" }, { role: "user", content: `Test variant: ${args.variant} for query: ${args.query}` }]
                                });
                                const content = r.choices?.[0]?.message?.content;
                                result = typeof content === "string" ? content : "{}";
                                const parsed = JSON.parse(result);
                                if (!winningVariant || parsed.score > (winningVariant as any).scoreAfter) {
                                    winningVariant = {
                                        text: args.variant,
                                        explanation: parsed.reasoning,
                                        scoreBefore: 20,
                                        scoreAfter: parsed.score
                                    } as any;
                                }
                            }

                            send({ step: `<b>Observation:</b> Result received from ${name}.`, type: "log" });
                            messages.push({
                                role: "tool",
                                name,
                                toolCallId: toolCall.id,
                                content: result
                            });
                        }
                    } else {
                        // Agent finished reasoning
                        break;
                    }

                    await new Promise(r => setTimeout(r, 1000)); // Pacing for better visualization
                }

                send({
                    type: "final",
                    variants: finalVariants,
                    winningVariant: winningVariant || {
                        text: finalVariants[0]?.text || "Optimized content.",
                        explanation: "Selected as best match.",
                        scoreBefore: 20,
                        scoreAfter: 75
                    }
                });

            } catch (error) {
                console.error("Agent Error:", error);
                send({ step: "<b>Error:</b> " + (error as Error).message, type: "log" });
                send({ type: "error", message: "Loop failed." });
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

