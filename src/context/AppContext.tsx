"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";

export type AuditQuery = {
  query: string;
  mentioned: boolean;
  reasoning: string;
  competitors: string[];
};

export type AuditResult = {
  score: number;
  queryResults: AuditQuery[];
  competitorMentions: Record<string, number>;
};

export type AgentLog = {
  step: string;
  content: string;
};

export type AgentVariant = {
  text: string;
  type: string;
};

export type AgentResult = {
  logs: AgentLog[];
  variants: AgentVariant[];
  winningVariant: {
    text: string;
    explanation: string;
    scoreBefore: number;
    scoreAfter: number;
  } | null;
};

interface AppContextType {
  brandName: string;
  description: string;
  queries: string[];
  setBrandData: (name: string, desc: string, qs: string[]) => void;

  auditData: AuditResult | null;
  setAuditData: (data: AuditResult) => void;

  agentData: AgentResult | null;
  setAgentData: (data: AgentResult | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [brandName, setBrandName] = useState("");
  const [description, setDescription] = useState("");
  const [queries, setQueries] = useState<string[]>([]);

  const [auditData, setAuditData] = useState<AuditResult | null>(null);
  const [agentData, setAgentData] = useState<AgentResult | null>(null);

  const setBrandData = (name: string, desc: string, qs: string[]) => {
    setBrandName(name);
    setDescription(desc);
    setQueries(qs);
  };

  return (
    <AppContext.Provider
      value={{
        brandName,
        description,
        queries,
        setBrandData,
        auditData,
        setAuditData,
        agentData,
        setAgentData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useAppContext must be used within an AppProvider");
  }
  return context;
}
