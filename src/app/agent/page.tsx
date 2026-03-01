"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppContext, AgentLog, AgentVariant } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Terminal, ChevronRight, Loader2, Sparkles } from "lucide-react";

export default function AgentPage() {
    const { brandName, description, queries, auditData, setAgentData } = useAppContext();
    const router = useRouter();

    const [logs, setLogs] = useState<AgentLog[]>([]);
    const [isProcessing, setIsProcessing] = useState(true);
    const [variantsGenerated, setVariantsGenerated] = useState<AgentVariant[]>([]);
    const startAgentTriggered = useRef(false);

    useEffect(() => {
        if (!brandName || queries.length === 0) {
            router.push("/");
            return;
        }

        const runAgent = async () => {
            setIsProcessing(true);
            const queryToOptimize = queries[0] || "product comparisons";

            try {
                const res = await fetch("/api/agent", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ brandName, description, query: queryToOptimize }),
                });

                if (!res.body) {
                    throw new Error("No response body");
                }

                const reader = res.body.getReader();
                const decoder = new TextDecoder("utf-8");
                let done = false;

                const finalLogs: AgentLog[] = [];
                let finalVariants: AgentVariant[] = [];
                let finalWinner = null;

                while (!done) {
                    const { value, done: readerDone } = await reader.read();
                    done = readerDone;

                    if (value) {
                        const chunk = decoder.decode(value, { stream: true });
                        const lines = chunk.split("\n").filter(line => line.trim() !== "");

                        for (const line of lines) {
                            try {
                                const data = JSON.parse(line);

                                if (data.type === "log") {
                                    const newLog = { step: data.step, content: "" };
                                    setLogs((prev) => [...prev, newLog]);
                                    finalLogs.push(newLog);
                                } else if (data.type === "final") {
                                    setVariantsGenerated(data.variants);
                                    finalVariants = data.variants;
                                    finalWinner = data.winningVariant;
                                    setIsProcessing(false);
                                } else if (data.type === "error") {
                                    console.error("Agent error:", data.message);
                                    setIsProcessing(false);
                                }
                            } catch (e) {
                                console.error("Failed to parse chunk:", line);
                            }
                        }
                    }
                }

                setAgentData({
                    logs: finalLogs,
                    variants: finalVariants,
                    winningVariant: finalWinner ? {
                        ...finalWinner,
                        scoreBefore: auditData?.score || 20,
                    } : null
                });

            } catch (error) {
                console.error("Failed to run agent loop:", error);
                setIsProcessing(false);
            }
        };

        if (!startAgentTriggered.current) {
            startAgentTriggered.current = true;
            runAgent();
        }
    }, [brandName, description, queries, auditData, router, setAgentData]);

    return (
        <div className="min-h-screen p-8 bg-zinc-950 text-white flex flex-col items-center justify-center">
            <div className="max-w-3xl w-full space-y-8">

                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center p-3 rounded-full bg-blue-500/10 text-blue-400 mb-2">
                        <Terminal className="w-8 h-8" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight">Agent reasoning loop</h1>
                    <p className="text-zinc-400">Autonomously engineering content for maximal AI visibility.</p>
                </div>

                <Card className="border-zinc-800 bg-zinc-900 shadow-2xl overflow-hidden font-mono text-sm">
                    <div className="bg-zinc-800 border-b border-zinc-700 px-4 py-2 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="ml-2 text-zinc-400 text-xs text-center flex-1 pr-12">mistral-large-agent</span>
                    </div>
                    <CardContent className="p-6 h-80 overflow-y-auto space-y-3 flex flex-col justify-end">
                        {logs.map((log, index) => (
                            <div key={index} className="flex gap-3 text-zinc-300 animate-in fade-in slide-in-from-bottom-2">
                                <ChevronRight className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                                <span dangerouslySetInnerHTML={{ __html: log.step }} />
                            </div>
                        ))}
                        {isProcessing && (
                            <div className="flex gap-3 items-center text-zinc-500 mt-4">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span className="animate-pulse">Thinking...</span>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {!isProcessing && variantsGenerated.length > 0 && (
                    <div className="space-y-6 pt-4 animate-in fade-in zoom-in duration-500">
                        <h3 className="text-xl font-medium text-center flex items-center justify-center gap-2 text-white">
                            <Sparkles className="text-primary w-5 h-5" /> Optimized Variants Generated
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {variantsGenerated.map((v, i) => (
                                <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-5 hover:border-primary/50 transition-colors">
                                    <Badge className="mb-3 bg-zinc-800 text-zinc-300 hover:bg-zinc-700">{v.type || `Variant ${i + 1}`}</Badge>
                                    <p className="text-zinc-400 text-sm italic">"{v.text}"</p>
                                </div>
                            ))}
                        </div>

                        <div className="flex justify-center pt-8">
                            <Button onClick={() => router.push("/results")} size="lg" className="w-full sm:w-auto text-lg px-8 py-6 bg-white text-zinc-900 hover:bg-zinc-200">
                                View Final Dashboard
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
