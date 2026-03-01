"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAppContext } from "@/context/AppContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Target, Search, Sparkles } from "lucide-react";

export default function Home() {
  const { setBrandData } = useAppContext();
  const router = useRouter();

  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [queryInput, setQueryInput] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const queries = queryInput
      .split(",")
      .map((q) => q.trim())
      .filter((q) => q.length > 0);

    if (queries.length < 1) {
      alert("Please enter at least one target query.");
      return;
    }

    setBrandData(name, desc, queries);
    router.push("/audit");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-background to-zinc-900">
      <div className="max-w-xl w-full space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 text-primary mb-2">
            <Sparkles className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-white">
            CitationLoop
          </h1>
          <p className="text-zinc-400 text-lg">
            Autonomous AI visibility agent that helps brands get cited inside AI-generated answers.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-800 p-8 rounded-2xl shadow-xl space-y-6">
          <div className="space-y-2">
            <Label htmlFor="brandName" className="text-zinc-300">Brand Name</Label>
            <Input
              id="brandName"
              placeholder="e.g. Acme Corp"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-zinc-300">Product Description</Label>
            <Textarea
              id="description"
              placeholder="What does your product do? What makes it special?"
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              required
              className="min-h-[100px] bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="queries" className="text-zinc-300">Target Queries (comma separated)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
              <Input
                id="queries"
                placeholder="e.g. best CRM for startups, top project management tools"
                value={queryInput}
                onChange={(e) => setQueryInput(e.target.value)}
                required
                className="pl-9 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
            <p className="text-xs text-zinc-500 mt-1">Enter 3-5 queries where you want your brand to appear.</p>
          </div>

          <Button type="submit" className="w-full text-md py-6" size="lg">
            <Target className="mr-2 h-5 w-5" />
            Start Audit
          </Button>
        </form>
      </div>
    </div>
  );
}
