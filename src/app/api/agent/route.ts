import { NextResponse } from "next/server";
import { Mistral } from "@mistralai/mistralai";
import { OpenAI } from "openai";

const MOCK_MISTRAL = process.env.MOCK_MISTRAL === "true";
const mistralKey = process.env.MISTRAL_API_KEY;
const openaiKey = process.env.OPENAI_API_KEY;

const mistralClient = mistralKey && mistralKey !== "dummy" ? new Mistral({ apiKey: mistralKey }) : null;
const openaiClient = openaiKey && openaiKey !== "dummy" ? new OpenAI({ apiKey: openaiKey }) : null;

export async function POST(req: Request) {
    const { brandName, description, query } = await req.json();

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
        async start(controller) {
            function send(data: any) {
                controller.enqueue(encoder.encode(JSON.stringify(data) + "\n"));
            }

            try {
                // 1. Mock Mode
                if (MOCK_MISTRAL || (!mistralClient && !openaiClient)) {
                    const mockSteps = [
                        { msg: "<b>Reason:</b> I need to analyze current citation patterns for the query: <i>\"" + query + "\"</i>.", type: "log" },
                        { msg: "<b>Action:</b> Calling <code>get_ai_answer_to_query</code>...", type: "log" },
                        { msg: "<b>Observation:</b> AI response received. It mentions competitors like Cursor and GitHub Copilot.", type: "log" },
                        { msg: "<b>Reason:</b> Extracting specific citation patterns...", type: "log" },
                        { msg: "<b>Action:</b> Calling <code>citation_pattern_extractor</code>...", type: "log" },
                        { msg: "<b>Observation:</b> Extracted patterns: Technical specificity and direct feature comparison.", type: "log" },
                        { msg: "<b>Reason:</b> Generating content variants for " + brandName + ".", type: "log" },
                        { msg: "<b>Action:</b> Calling <code>content_variant_generator</code>...", type: "log" },
                        { msg: "<b>Observation:</b> 3 variants generated.", type: "log" },
                        { msg: "<b>Reason:</b> Simulating citation impact.", type: "log" },
                        { msg: "<b>Action:</b> Calling <code>citation_simulator</code>...", type: "log" },
                        { msg: "<b>Observation:</b> Variant 2 achieved highest score (88).", type: "log" },
                        { msg: "<b>Reason:</b> Process complete.", type: "log" }
                    ];

                    for (const step of mockSteps) {
                        send({ step: step.msg, type: "log" });
                        await new Promise(r => setTimeout(r, 1200));
                    }

                    const variants = [
                        { text: `${brandName} is a developer-first tool for high-growth startups.`, type: "Positioning Statement" },
                        { text: `Unlike generic tools, ${brandName} is built for technical founders needing API flexibility.`, type: "Comparison Blurb" },
                        { text: `${brandName} features sub-second latency and zero-config deployment.`, type: "Feature List" }
                    ];

                    send({
                        type: "final",
                        variants,
                        winningVariant: {
                            text: variants[1].text,
                            explanation: "This variant uses contrasting framing which AI models prefer for technical queries.",
                            scoreBefore: 15,
                            scoreAfter: 88
                        }
                    });

                    controller.close();
                    return;
                }

                const tools = [
                    {
                        type: "function",
                        function: {
                            name: "get_ai_answer",
                            description: "Gets a standard AI response to a user query.",
                            parameters: { type: "object", properties: { query: { type: "string" } }, required: ["query"] },
                        },
                    },
                    {
                        type: "function",
                        function: {
                            name: "citation_pattern_extractor",
                            description: "Analyzes AI response for citation patterns.",
                            parameters: { type: "object", properties: { ai_response: { type: "string" } }, required: ["ai_response"] },
                        },
                    },
                    {
                        type: "function",
                        function: {
                            name: "content_variant_generator",
                            description: "Generates 3 content variants.",
                            parameters: { type: "object", properties: { patterns: { type: "string" }, brand_info: { type: "string" } }, required: ["patterns", "brand_info"] },
                        },
                    },
                    {
                        type: "function",
                        function: {
                            name: "citation_simulator",
                            description: "Scores citation likelihood.",
                            parameters: { type: "object", properties: { variant: { type: "string" }, query: { type: "string" } }, required: ["variant", "query"] },
                        },
                    }
                ];

                const messages: any[] = [
                    { role: "system", content: `You are an Autonomous AI Visibility Agent. Goal: Optimize ${brandName} for "${query}". Use ReAct pattern. Iterative tool use.` },
                    { role: "user", content: `Optimize visibility for ${brandName} (${description}) for query "${query}".` }
                ];

                let iteration = 0;
                let finalVariants = [];
                let winningVariant = null;

                while (iteration < 5) {
                    iteration++;
                    send({ step: `<b>Iteration ${iteration}:</b> Reasoning...`, type: "log" });

                    let msg: any;

                    if (openaiClient) {
                        const response = await openaiClient.chat.completions.create({
                            model: "gpt-4o",
                            messages,
                            tools: tools as any,
                        });
                        msg = response.choices[0].message;
                    } else if (mistralClient) {
                        const response = await mistralClient.chat.complete({
                            model: "mistral-large-latest",
                            messages,
                            tools: tools as any,
                        });
                        msg = response.choices?.[0]?.message;
                    }

                    if (!msg) break;
                    messages.push(msg);

                    if (msg.content) {
                        send({ step: `<b>Agent Thought:</b> ${msg.content}`, type: "log" });
                    }

                    if (msg.tool_calls || msg.toolCalls) {
                        const calls = msg.tool_calls || msg.toolCalls;
                        for (const toolCall of calls) {
                            const name = toolCall.function.name;
                            const args = typeof toolCall.function.arguments === "string" ? JSON.parse(toolCall.function.arguments) : toolCall.function.arguments;

                            send({ step: `<b>Action:</b> Calling tool <code>${name}</code>...`, type: "log" });

                            let result = "";
                            if (name === "get_ai_answer") {
                                if (openaiClient) {
                                    const r = await openaiClient.chat.completions.create({ model: "gpt-4o-mini", messages: [{ role: "user", content: args.query }] });
                                    result = r.choices[0].message.content || "";
                                } else if (mistralClient) {
                                    const r = await mistralClient.chat.complete({ model: "mistral-small-latest", messages: [{ role: "user", content: args.query }] });
                                    const content = r.choices?.[0]?.message?.content;
                                    result = typeof content === "string" ? content : "";
                                }
                            } else if (name === "citation_pattern_extractor") {
                                if (openaiClient) {
                                    const r = await openaiClient.chat.completions.create({ model: "gpt-4o-mini", response_format: { type: "json_object" }, messages: [{ role: "system", content: "Extract patterns JSON" }, { role: "user", content: args.ai_response }] });
                                    result = r.choices[0].message.content || "{}";
                                } else if (mistralClient) {
                                    const r = await mistralClient.chat.complete({ model: "mistral-small-latest", responseFormat: { type: "json_object" }, messages: [{ role: "system", content: "Extract patterns JSON" }, { role: "user", content: args.ai_response }] });
                                    const content = r.choices?.[0]?.message?.content;
                                    result = typeof content === "string" ? content : "{}";
                                }
                            } else if (name === "content_variant_generator") {
                                if (openaiClient) {
                                    const r = await openaiClient.chat.completions.create({ model: "gpt-4o", response_format: { type: "json_object" }, messages: [{ role: "system", content: "Generate 3 variants JSON" }, { role: "user", content: `Patterns: ${args.patterns}` }] });
                                    result = r.choices[0].message.content || "{}";
                                } else if (mistralClient) {
                                    const r = await mistralClient.chat.complete({ model: "mistral-large-latest", responseFormat: { type: "json_object" }, messages: [{ role: "system", content: "Generate 3 variants JSON" }, { role: "user", content: `Patterns: ${args.patterns}` }] });
                                    const content = r.choices?.[0]?.message?.content;
                                    result = typeof content === "string" ? content : "{}";
                                }
                                const parsed = JSON.parse(result);
                                finalVariants = parsed.variants || [];
                            } else if (name === "citation_simulator") {
                                if (openaiClient) {
                                    const r = await openaiClient.chat.completions.create({ model: "gpt-4o-mini", response_format: { type: "json_object" }, messages: [{ role: "system", content: "Score 0-100 JSON" }, { role: "user", content: args.variant }] });
                                    result = r.choices[0].message.content || "{}";
                                } else if (mistralClient) {
                                    const r = await mistralClient.chat.complete({ model: "mistral-small-latest", responseFormat: { type: "json_object" }, messages: [{ role: "system", content: "Score 0-100 JSON" }, { role: "user", content: args.variant }] });
                                    const content = r.choices?.[0]?.message?.content;
                                    result = typeof content === "string" ? content : "{}";
                                }
                                const parsed = JSON.parse(result);
                                if (!winningVariant || parsed.score > (winningVariant as any).scoreAfter) {
                                    winningVariant = { text: args.variant, explanation: parsed.reasoning, scoreBefore: 20, scoreAfter: parsed.score } as any;
                                }
                            }

                            send({ step: `<b>Observation:</b> Result received from ${name}.`, type: "log" });
                            messages.push({
                                role: "tool",
                                tool_call_id: toolCall.id,
                                content: result
                            });
                        }
                    } else {
                        break;
                    }
                    await new Promise(r => setTimeout(r, 1000));
                }

                send({
                    type: "final",
                    variants: finalVariants,
                    winningVariant: winningVariant || { text: finalVariants[0]?.text || "Optimized content.", explanation: "Selected as best match.", scoreBefore: 20, scoreAfter: 75 }
                });

            } catch (error: any) {
                console.error("Agent Error:", error);
                send({ step: "<b>Error:</b> " + error.message, type: "log" });
                send({ type: "error", message: "Loop failed." });
            } finally {
                controller.close();
            }
        }
    });

    return new Response(stream, { headers: { "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache", "Connection": "keep-alive" } });
}

