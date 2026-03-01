# CitationLoop | Autonomous AI Visibility Agent

CitationLoop helps brands get cited inside AI-generated answers (ChatGPT, Perplexity, Mistral, etc.) by autonomously auditing visibility and engineering optimized content.

## 🚀 Getting Started

### 1. Installation
```bash
npm install
```

### 2. Configuration
Create a `.env.local` file:
```env
MISTRAL_API_KEY=your_key_here
```
*If you leave this blank, the app runs in **Mock Mode** for demo purposes.*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000).

## 🧠 Core User Flow
1. **Input**: Enter brand name, description, and 3-5 target queries.
2. **Audit**: Real-time scan of AI models to establish a visibility baseline and map competitor gaps.
3. **Agent Loop**: A ReAct-style reasoning terminal where the AI extracts patterns from winners and generates optimized content.
4. **Results**: Before/After visibility impact maps and a winning content snippet ready for deployment.

### 🧪 Sample Test Data (For Quick Demo)
- **Brand Name**: `Antigravity AI`
- **Description**: `An autonomous AI developer tool that automates complex coding tasks, bug fixes, and system migrations with specialized reasoning loops that outperform standard LLM wrappers.`
- **Target Queries**: `best AI coding assistant, top agentic AI tools, autonomous developer agents`

## 🛠 Tech Stack
- **Frontend**: Next.js 15, Tailwind CSS, shadcn/ui, Recharts, Framer Motion
- **AI**: Mistral AI (Large for reasoning, Small for bulk testing)
- **Agent Architecture**: ReAct-style loop with Tool Calling / Function Calling

## 📄 License
MIT
