"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAppContext, AuditQuery } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, XCircle, ArrowRight, Loader2, BarChart2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

export default function AuditPage() {
    const { brandName, description, queries, setAuditData } = useAppContext();
    const router = useRouter();

    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<AuditQuery[]>([]);
    const [competitorsMap, setCompetitorsMap] = useState<Record<string, number>>({});
    const [isAuditing, setIsAuditing] = useState(true);
    const startAuditTriggered = useRef(false);

    useEffect(() => {
        if (!brandName || queries.length === 0) {
            router.push("/");
            return;
        }

        const runAudit = async () => {
            setIsAuditing(true);
            const newResults: AuditQuery[] = [];
            const tempCompetitors: Record<string, number> = {};

            for (let i = 0; i < queries.length; i++) {
                const query = queries[i];

                try {
                    const res = await fetch("/api/audit", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ brandName, description, query }),
                    });
                    const data = await res.json();
                    const auditResult: AuditQuery = {
                        query,
                        mentioned: data.mentioned,
                        reasoning: data.reasoning,
                        competitors: data.competitors || [],
                    };
                    newResults.push(auditResult);

                    auditResult.competitors.forEach((comp) => {
                        if (comp.toLowerCase() !== brandName.toLowerCase()) {
                            tempCompetitors[comp] = (tempCompetitors[comp] || 0) + 1;
                        }
                    });

                } catch (error) {
                    console.error("Audit error for query:", query, error);
                    newResults.push({
                        query,
                        mentioned: false,
                        reasoning: "Error running audit.",
                        competitors: [],
                    });
                }

                setResults([...newResults]);
                setCompetitorsMap({ ...tempCompetitors });
                setProgress(((i + 1) / queries.length) * 100);
            }

            setIsAuditing(false);

            const mentionedCount = newResults.filter(r => r.mentioned).length;
            const score = Math.round((mentionedCount / queries.length) * 100);

            setAuditData({
                score,
                queryResults: newResults,
                competitorMentions: tempCompetitors,
            });
        };

        if (!startAuditTriggered.current) {
            startAuditTriggered.current = true;
            runAudit();
        }
    }, [brandName, description, queries, router, setAuditData]);

    const score = results.length > 0
        ? Math.round((results.filter(r => r.mentioned).length / results.length) * 100)
        : 0;

    const chartData = Object.entries(competitorsMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({
            name,
            Mentions: count
        }));

    return (
        <div className="min-h-screen p-8 bg-zinc-950 text-white">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Audit Phase</h1>
                    <p className="text-zinc-400">Testing actual visibility for <span className="text-white font-semibold">{brandName}</span> across {queries.length} critical queries.</p>
                </div>

                {isAuditing && (
                    <div className="space-y-4 bg-zinc-900 border border-zinc-800 p-6 rounded-xl">
                        <div className="flex items-center justify-between text-sm text-zinc-400">
                            <span className="flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Scanning AI Models...</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="col-span-1 border-zinc-800 bg-zinc-900 shadow-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-400">Visibility Score</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col items-center justify-center p-4">
                                <div className="relative w-32 h-32 flex items-center justify-center">
                                    <svg className="w-full h-full transform -rotate-90">
                                        <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-zinc-800" />
                                        <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent"
                                            strokeDasharray={377}
                                            strokeDashoffset={377 - (377 * score) / 100}
                                            className="text-primary transition-all duration-1000 ease-out"
                                        />
                                    </svg>
                                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                                        <span className="text-4xl font-bold">{score}</span>
                                        <span className="text-xs text-zinc-500">/ 100</span>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="col-span-1 md:col-span-2 border-zinc-800 bg-zinc-900 shadow-xl">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                <BarChart2 className="w-4 h-4" /> Competitor Mentions
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="h-48 pt-4">
                            {chartData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 0, left: 30, bottom: 0 }}>
                                        <XAxis type="number" hide />
                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#a1a1aa', fontSize: 12 }} />
                                        <Tooltip cursor={{ fill: '#27272a' }} contentStyle={{ backgroundColor: '#18181b', border: '1px solid #3f3f46' }} />
                                        <Bar dataKey="Mentions" radius={[0, 4, 4, 0]}>
                                            {chartData.map((entry, index) => (
                                                <Cell key={index} fill="hsl(var(--primary))" />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-zinc-500 text-sm">
                                    {isAuditing ? "Analyzing competitors..." : "No competitors identified"}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                <div className="space-y-4">
                    <h3 className="text-lg font-medium">Query Results</h3>
                    <div className="space-y-3">
                        {results.map((r, i) => (
                            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-lg p-4 flex gap-4">
                                <div className="pt-1">
                                    {r.mentioned ? <CheckCircle2 className="text-green-500 w-5 h-5 flex-shrink-0" /> : <XCircle className="text-red-500 w-5 h-5 flex-shrink-0" />}
                                </div>
                                <div className="space-y-2 w-full">
                                    <div className="flex justify-between items-start">
                                        <p className="font-semibold text-lg">{r.query}</p>
                                        <Badge variant={r.mentioned ? "default" : "secondary"} className={r.mentioned ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : "bg-red-500/10 text-red-500 hover:bg-red-500/20"}>
                                            {r.mentioned ? "Cited" : "Missed"}
                                        </Badge>
                                    </div>
                                    <p className="text-zinc-400 text-sm">{r.reasoning}</p>

                                    {r.competitors.length > 0 && (
                                        <div className="flex flex-wrap gap-2 pt-2">
                                            <span className="text-xs text-zinc-500">Mentions:</span>
                                            {r.competitors.map((c, idx) => (
                                                <Badge key={idx} variant="outline" className="text-xs text-zinc-400 border-zinc-700">{c}</Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {isAuditing && results.length < queries.length && (
                            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-lg p-6 flex gap-4 justify-center items-center animate-pulse">
                                <Loader2 className="w-5 h-5 animate-spin text-zinc-500" />
                                <span className="text-zinc-500 text-sm">Testing "{queries[results.length]}"...</span>
                            </div>
                        )}
                    </div>
                </div>

                {!isAuditing && (
                    <div className="flex justify-end pt-4">
                        <Button onClick={() => router.push("/agent")} size="lg" className="w-full sm:w-auto relative group overflow-hidden">
                            <span className="relative z-10 flex items-center">
                                Launch Agent Loop <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                            </span>
                            <div className="absolute inset-0 bg-primary/20 scale-x-0 group-hover:scale-x-100 origin-left transition-transform ease-out duration-300"></div>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
