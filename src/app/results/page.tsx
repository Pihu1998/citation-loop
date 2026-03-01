"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Copy, TrendingUp, CheckCircle2, ChevronRight, Zap, Target, Search, BarChart3, Bot, Trophy } from "lucide-react";

export default function ResultsPage() {
    const { brandName, auditData, agentData } = useAppContext();
    const router = useRouter();

    useEffect(() => {
        if (!brandName || !agentData) {
            router.push("/");
        }
    }, [brandName, agentData, router]);

    if (!agentData || !auditData) return null;

    const { winningVariant } = agentData;

    const handleCopy = () => {
        navigator.clipboard.writeText(winningVariant?.text || "");
        alert("Copied to clipboard!");
    };

    return (
        <div className="min-h-screen p-8 bg-zinc-950 text-white">
            <div className="max-w-5xl mx-auto space-y-12">
                <header className="flex flex-col md:flex-row justify-between items-start md:items-end border-b border-zinc-800 pb-6">
                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold tracking-tight">Visibility Optimization Complete</h1>
                        <p className="text-zinc-400">Successfully engineered content to maximize AI citation for <span className="text-white font-medium">{brandName}</span></p>
                    </div>
                    <Button variant="outline" className="mt-4 md:mt-0" onClick={() => router.push("/")}>Run New Audit</Button>
                </header>

                {/* The Closed Loop Architecture Diagram */}
                <section className="bg-zinc-900 border border-zinc-800 p-6 rounded-2xl">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-medium text-zinc-200">The CitationLoop Architecture</h3>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Autonomous Loop</Badge>
                    </div>

                    <div className="hidden md:flex items-center justify-between gap-2 overflow-x-auto pb-4">
                        <FlowStep icon={<Target className="w-5 h-5 text-indigo-400" />} label="Brand Brief" />
                        <FlowArrow />
                        <FlowStep icon={<Search className="w-5 h-5 text-blue-400" />} label="Audit" />
                        <FlowArrow />
                        <FlowStep icon={<Bot className="w-5 h-5 text-purple-400" />} label="Pattern Extractor" />
                        <FlowArrow />
                        <FlowStep icon={<Zap className="w-5 h-5 text-yellow-400" />} label="Generation" />
                        <FlowArrow />
                        <FlowStep icon={<BarChart3 className="w-5 h-5 text-orange-400" />} label="Simulation" />
                        <FlowArrow />
                        <FlowStep icon={<Trophy className="w-5 h-5 text-green-400" />} label="Winner" />
                    </div>

                    <div className="mt-4 space-y-2 text-sm text-zinc-400 max-w-3xl">
                        <p><strong>Why is this special?</strong> Most SEO products just <span className="text-zinc-300 underline underline-offset-4 decoration-zinc-700">track</span> visibility. CitationLoop autonomously <span className="text-white font-medium underline underline-offset-4 decoration-primary">fixes it</span>.</p>
                        <p>Our agent uses Mistral models to simultaneously <strong>generate targeted content</strong> AND <strong>judge its likelihood to be cited</strong> in a private, closed feedback loop until it finds the optimal variant.</p>
                    </div>
                </section>

                <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">

                    <Card className="col-span-1 lg:col-span-5 bg-zinc-900 border border-zinc-800 flex flex-col justify-between shadow-2xl">
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <TrendingUp className="text-primary w-5 h-5" />
                                Visibility Impact
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-8 flex-1 flex flex-col justify-center">
                            <div className="flex justify-between items-center bg-zinc-950 p-6 rounded-xl border border-zinc-800/50">
                                <div className="text-center space-y-1">
                                    <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider">Before</p>
                                    <p className="text-4xl font-bold text-zinc-300">{winningVariant?.scoreBefore}</p>
                                    <p className="text-xs text-zinc-500">Score</p>
                                </div>

                                <ChevronRight className="w-8 h-8 text-zinc-700" />

                                <div className="text-center space-y-1 relative">
                                    <div className="absolute -inset-4 bg-primary/20 blur-xl rounded-full opacity-50"></div>
                                    <p className="text-zinc-500 text-sm font-medium uppercase tracking-wider relative z-10 text-primary">Expected</p>
                                    <p className="text-5xl font-bold text-white relative z-10">{winningVariant?.scoreAfter}</p>
                                    <p className="text-xs text-zinc-400 relative z-10">Score</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="col-span-1 lg:col-span-7 bg-zinc-900 border border-zinc-800 shadow-2xl relative overflow-hidden">
                        {/* Decorative gradient corner */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 blur-[100px] rounded-full pointer-events-none"></div>

                        <CardHeader>
                            <Badge className="w-fit mb-2 bg-green-500/20 text-green-400 hover:bg-green-500/30">Winning Variant</Badge>
                            <CardTitle className="text-2xl font-bold">Deploy This Content</CardTitle>
                            <p className="text-sm text-zinc-400">Add this optimized blurb to your website, PR assets, or product descriptions to maximize your chances of AI citation.</p>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="bg-zinc-950 border border-zinc-800/80 p-6 rounded-xl relative group">
                                <p className="text-lg text-zinc-200 indent-2 leading-relaxed">
                                    {winningVariant?.text}
                                </p>
                                <Button
                                    size="icon"
                                    variant="secondary"
                                    className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-zinc-800 hover:bg-zinc-700"
                                    onClick={handleCopy}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-2">
                                    <CheckCircle2 className="w-4 h-4" /> Agent's Reasoning
                                </h4>
                                <div className="bg-zinc-800/50 rounded-lg p-5">
                                    <p className="text-sm text-zinc-300 leading-relaxed italic border-l-2 border-primary pl-4">
                                        {winningVariant?.explanation}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                </section>

            </div>
        </div>
    );
}

function FlowStep({ icon, label }: { icon: React.ReactNode, label: string }) {
    return (
        <div className="flex flex-col items-center gap-3">
            <div className="w-14 h-14 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-center shadow-lg">
                {icon}
            </div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-widest">{label}</span>
        </div>
    );
}

function FlowArrow() {
    return (
        <div className="flex-1 flex items-center h-[2px] bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 relative min-w-[30px] -mt-6">
            <ChevronRight className="absolute right-0 w-4 h-4 text-zinc-600 translate-x-1/2 bg-zinc-900 rounded-full" />
        </div>
    );
}
