// ═══════════════════════════════════════════════════════════════
// FINSHALA AI — Hugging Face LLM Service
// Routes financial tasks to the best-suited models
// ═══════════════════════════════════════════════════════════════

// ═══════════════════════════════════════════════════════════════
// MODEL REGISTRY
// ═══════════════════════════════════════════════════════════════

const MODELS = {
  // Tax math, Indian language support, numerical reasoning
  TAX_MATH: 'Qwen/Qwen2.5-72B-Instruct',
  // Fast logic, structured advice generation
  ADVICE: 'mistralai/Mixtral-8x22B-Instruct-v0.1',
  // Code/regex for Form16 parsing fallback
  PARSER: 'Qwen/Qwen2.5-Coder-7B-Instruct',
  // Long context for full portfolio reports
  REPORT: 'Qwen/Qwen3-235B-A22B',
  // Step-by-step action plans
  PLANNER: 'CohereForAI/c4ai-command-r-plus',
} as const;

// Fallback chain — if primary model is down/slow, try these
const FALLBACK_MODELS: Record<string, string[]> = {
  [MODELS.TAX_MATH]: ['Qwen/Qwen2.5-7B-Instruct', 'mistralai/Mixtral-8x22B-Instruct-v0.1'],
  [MODELS.ADVICE]: ['Qwen/Qwen2.5-72B-Instruct', 'Qwen/Qwen2.5-7B-Instruct'],
  [MODELS.PARSER]: ['Qwen/Qwen2.5-72B-Instruct'],
  [MODELS.REPORT]: ['Qwen/Qwen2.5-72B-Instruct', 'mistralai/Mixtral-8x22B-Instruct-v0.1'],
  [MODELS.PLANNER]: ['mistralai/Mixtral-8x22B-Instruct-v0.1', 'Qwen/Qwen2.5-72B-Instruct'],
};

// ═══════════════════════════════════════════════════════════════
// SYSTEM PROMPTS
// ═══════════════════════════════════════════════════════════════

const SYSTEM_PROMPTS = {
  TAX_EXPERT: `You are Finshala Tax Expert — an AI specialized in Indian Income Tax (FY 2024-25 / AY 2025-26).
Rules:
- Always cite the relevant Section (80C, 80D, 24b, etc.)
- Use current slab rates for Old and New regime
- Format numbers in Indian style (₹1,50,000 / ₹1.5L / ₹2.7Cr)
- Be specific with amounts, not vague
- If asked in Hindi/Hinglish, respond in the same language
- Keep answers concise — max 200 words unless asked for detail`,

  HEALTH_ADVISOR: `You are Finshala Health Score Advisor — an AI financial wellness coach for Indian users.
Rules:
- Base advice on the user's actual scores and data provided in context
- Prioritize actions by impact (critical > high > medium > low)
- Use Indian financial products (PPF, ELSS, NPS, FDs, SIPs, etc.)
- Reference specific amounts (e.g., "Increase SIP by ₹5K/month")
- Be motivational but honest — don't sugarcoat bad scores
- Keep each advice card to 2-3 sentences max`,

  FIRE_PLANNER: `You are Finshala FIRE Planner — an AI that creates personalized Financial Independence roadmaps for Indians.
Rules:
- Reference the user's actual FIRE numbers, ages, and SIP amounts
- Include year-by-year milestones
- Factor in Indian market assumptions (12% equity, 7% debt, 6% inflation)
- Mention specific fund types (flexi-cap, large-cap, ELSS, etc.)
- Be realistic about feasibility
- Use a motivational but grounded tone`,

  FORM16_PARSER: `You are a Form 16 data extraction engine. Given raw text from an Indian Form 16 PDF, extract these fields as JSON:
{
  "employer_name": "", "employee_name": "", "employee_pan": "",
  "financial_year": "", "assessment_year": "",
  "basic_salary": 0, "hra_received": 0, "special_allowance": 0,
  "gross_salary": 0, "total_gross": 0,
  "standard_deduction": 0, "professional_tax": 0, "hra_exemption": 0,
  "sec_80c": 0, "sec_80d": 0, "sec_80ccd_1b": 0, "sec_80ccd_2": 0,
  "sec_24b": 0, "sec_80e": 0, "sec_80g": 0, "sec_80tta": 0,
  "total_taxable_income": 0, "tax_on_income": 0,
  "cess": 0, "total_tax": 0, "tds_deducted": 0,
  "regime_used": "old"
}
Return ONLY valid JSON. No explanation. If a field is missing, use 0 or empty string.`,

  REPORT_WRITER: `You are Finshala Report Writer — generate comprehensive financial health reports for Indian users.
Rules:
- Structure: Executive Summary → Key Metrics → Dimension Analysis → Action Plan → Projections
- Use Indian financial context (tax sections, mutual fund categories)
- Include specific numbers from the user's data
- Format with markdown headers and bullet points
- Keep the total report under 800 words`,
};

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface AIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIResponse {
  text: string;
  model_used: string;
  tokens_used?: number;
  latency_ms: number;
  fallback_used: boolean;
}

export interface AIAdviceCard {
  title: string;
  advice: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  icon: string;
}

// ═══════════════════════════════════════════════════════════════
// CORE API CLIENT
// ═══════════════════════════════════════════════════════════════

class HFClient {
  private apiKey: string;
  private baseUrl = 'https://router.huggingface.co/novita/v3/openai';

  constructor() {
    this.apiKey = import.meta.env.VITE_HF_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[FinshalaAI] No HF API key found — AI features will use mock responses');
    }
  }

  async chat(
    model: string,
    messages: AIMessage[],
    options: { maxTokens?: number; temperature?: number; timeout?: number } = {},
  ): Promise<{ text: string; tokens?: number }> {
    const { maxTokens = 1024, temperature = 0.7, timeout = 30000 } = options;

    if (!this.apiKey) {
      return { text: this.getMockResponse(messages), tokens: 0 };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature,
          stream: false,
        }),
        signal: controller.signal,
      });

      clearTimeout(timer);

      if (!res.ok) {
        const errText = await res.text().catch(() => 'Unknown error');
        throw new Error(`HF API ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const choice = data.choices?.[0];
      return {
        text: choice?.message?.content?.trim() || '',
        tokens: data.usage?.total_tokens,
      };
    } catch (err: any) {
      clearTimeout(timer);
      if (err.name === 'AbortError') throw new Error('Request timed out');
      throw err;
    }
  }

  private getMockResponse(messages: AIMessage[]): string {
    const lastMsg = messages[messages.length - 1]?.content || '';
    if (lastMsg.includes('tax') || lastMsg.includes('Tax')) {
      return 'Based on your income of ₹18L, the **Old Regime** saves you ₹44K more annually. Key reasons:\n1. Your 80C investments (₹1.1L) + HRA exemption give significant deductions\n2. New regime only offers ₹75K standard deduction\n\n**Action**: Invest ₹40K more in ELSS to max out 80C, saving an additional ₹12.5K in tax.';
    }
    if (lastMsg.includes('health') || lastMsg.includes('score')) {
      return '🎯 **Your Score: 546/900 (Fair)**\n\nTop 3 actions to improve:\n1. **🚨 Get Term Insurance** — ₹1Cr cover costs just ₹8K/yr. Your family has zero protection.\n2. **💊 Add Critical Illness Cover** — ₹25L cover for ₹4K/yr. Cancer treatment costs ₹15-30L.\n3. **📈 Fill 80C Gap** — Invest ₹40K in ELSS to save ₹12.5K in tax while building wealth.';
    }
    if (lastMsg.includes('FIRE') || lastMsg.includes('retire')) {
      return '## Your FIRE Roadmap (Regular FIRE — ₹3.7Cr by Age 44)\n\n**Year 1-3 (Now → Age 35)**: Build emergency fund to ₹5.9L, start ₹1.1L/mo SIP\n**Year 4-6 (Age 35-38)**: Cross ₹1Cr net worth milestone, step up SIP 10% annually\n**Year 7-9 (Age 38-41)**: Hit Coast FIRE — even if you stop saving, you\'ll retire by 60\n**Year 10-12 (Age 41-44)**: 🔥 Regular FIRE achieved! Portfolio: ₹3.7Cr\n\n**Key Risk**: Your savings rate needs to be 83% — this is a stretch. Consider Lean FIRE (₹1.4Cr by 38) as a safer target.';
    }
    return 'I can help you with tax optimization, investment advice, insurance planning, and FIRE calculations. What would you like to know?';
  }
}


// ═══════════════════════════════════════════════════════════════
// FINSHALA AI — PUBLIC API
// ═══════════════════════════════════════════════════════════════

export class FinshalaAI {
  private client: HFClient;

  constructor() {
    this.client = new HFClient();
  }

  // ────────── TAX Q&A ──────────

  async askTaxQuestion(
    question: string,
    context: { income?: number; regime?: string; deductions?: Record<string, number> } = {},
  ): Promise<AIResponse> {
    const start = Date.now();
    const contextStr = Object.keys(context).length > 0
      ? `\nUser's financial context: Income ₹${((context.income || 0) / 100000).toFixed(1)}L, Regime: ${context.regime || 'unknown'}, Deductions: ${JSON.stringify(context.deductions || {})}`
      : '';

    const messages: AIMessage[] = [
      { role: 'system', content: SYSTEM_PROMPTS.TAX_EXPERT },
      { role: 'user', content: `${question}${contextStr}` },
    ];

    return this.callWithFallback(MODELS.TAX_MATH, messages, { maxTokens: 512, temperature: 0.3 }, start);
  }

  // ────────── HEALTH SCORE ADVICE ──────────

  async generateHealthAdvice(
    scoreData: {
      overall_score: number;
      overall_grade: string;
      dimensions: Array<{ name: string; score: number; grade: string; findings: string[]; recommendations: string[] }>;
      meta: { monthly_income: number; current_age: number; net_worth: number };
    },
  ): Promise<AIResponse> {
    const start = Date.now();
    const dimSummary = scoreData.dimensions
      .map((d) => `${d.name}: ${d.score}/100 (${d.grade}) — ${d.findings.slice(0, 2).join('; ')}`)
      .join('\n');

    const messages: AIMessage[] = [
      { role: 'system', content: SYSTEM_PROMPTS.HEALTH_ADVISOR },
      {
        role: 'user',
        content: `Generate 3 personalized advice cards for this user.

Score: ${scoreData.overall_score}/900 (Grade ${scoreData.overall_grade})
Age: ${scoreData.meta.current_age}, Monthly Income: ₹${Math.round(scoreData.meta.monthly_income / 1000)}K
Net Worth: ₹${Math.round(scoreData.meta.net_worth / 100000)}L

Dimension Scores:
${dimSummary}

Format each card as:
**[ICON] Title** (priority: critical/high/medium/low)
Advice text (2-3 sentences)
---`,
      },
    ];

    return this.callWithFallback(MODELS.ADVICE, messages, { maxTokens: 600, temperature: 0.5 }, start);
  }

  // ────────── FIRE ROADMAP ──────────

  async generateFIRERoadmap(
    planData: {
      variant: string;
      fire_number: number;
      fire_age: number;
      years_to_fire: number;
      current_age: number;
      current_net_worth: number;
      monthly_sip: number;
      savings_rate: number;
      feasibility: string;
      milestones: Array<{ name: string; target_date: string; amount: number }>;
    },
  ): Promise<AIResponse> {
    const start = Date.now();
    const milestoneStr = planData.milestones
      .slice(0, 6)
      .map((m) => `• ${m.name} — ${m.target_date} (₹${Math.round(m.amount / 100000)}L)`)
      .join('\n');

    const messages: AIMessage[] = [
      { role: 'system', content: SYSTEM_PROMPTS.FIRE_PLANNER },
      {
        role: 'user',
        content: `Generate a year-by-year FIRE roadmap narrative for this user:

Variant: ${planData.variant}
FIRE Number: ₹${(planData.fire_number / 10000000).toFixed(2)}Cr
FIRE Age: ${planData.fire_age} (${planData.years_to_fire} years from now)
Current Age: ${planData.current_age}
Current Net Worth: ₹${Math.round(planData.current_net_worth / 100000)}L
Required Monthly SIP: ₹${Math.round(planData.monthly_sip / 1000)}K
Savings Rate Needed: ${planData.savings_rate}%
Feasibility: ${planData.feasibility}

Key Milestones:
${milestoneStr}

Write a motivational but realistic 3-phase roadmap (Foundation → Growth → Achievement). Max 300 words.`,
      },
    ];

    return this.callWithFallback(MODELS.PLANNER, messages, { maxTokens: 800, temperature: 0.6 }, start);
  }

  // ────────── FORM 16 AI PARSING ──────────

  async parseForm16WithAI(rawText: string): Promise<AIResponse> {
    const start = Date.now();
    const truncated = rawText.slice(0, 8000); // Stay within token limits

    const messages: AIMessage[] = [
      { role: 'system', content: SYSTEM_PROMPTS.FORM16_PARSER },
      { role: 'user', content: `Extract data from this Form 16 text:\n\n${truncated}` },
    ];

    return this.callWithFallback(MODELS.PARSER, messages, { maxTokens: 1024, temperature: 0.1 }, start);
  }

  // ────────── WHAT-IF SCENARIO ──────────

  async analyzeWhatIf(
    scenario: string,
    currentData: { fire_number: number; fire_age: number; monthly_sip: number; net_worth: number },
  ): Promise<AIResponse> {
    const start = Date.now();
    const messages: AIMessage[] = [
      { role: 'system', content: SYSTEM_PROMPTS.FIRE_PLANNER },
      {
        role: 'user',
        content: `Analyze this what-if scenario:
"${scenario}"

Current situation:
- FIRE Number: ₹${(currentData.fire_number / 10000000).toFixed(2)}Cr
- FIRE Age: ${currentData.fire_age}
- Monthly SIP: ₹${Math.round(currentData.monthly_sip / 1000)}K
- Net Worth: ₹${Math.round(currentData.net_worth / 100000)}L

Calculate the impact and explain in 3-4 sentences. Use specific numbers.`,
      },
    ];

    return this.callWithFallback(MODELS.TAX_MATH, messages, { maxTokens: 400, temperature: 0.4 }, start);
  }

  // ────────── DIMENSION EXPLAINER ──────────

  async explainDimension(
    dimension: { name: string; score: number; grade: string; description: string; findings: string[]; recommendations: string[] },
    userAge: number,
    monthlyIncome: number,
  ): Promise<AIResponse> {
    const start = Date.now();
    const messages: AIMessage[] = [
      { role: 'system', content: SYSTEM_PROMPTS.HEALTH_ADVISOR },
      {
        role: 'user',
        content: `Explain what this dimension score means for a ${userAge}-year-old earning ₹${Math.round(monthlyIncome / 1000)}K/month:

Dimension: ${dimension.name}
Score: ${dimension.score}/100 (Grade: ${dimension.grade})
Summary: ${dimension.description}
Findings: ${dimension.findings.join('; ')}
Recommendations: ${dimension.recommendations.join('; ')}

Write a 3-4 sentence personalized explanation. Be direct about what's good and what needs work.`,
      },
    ];

    return this.callWithFallback(MODELS.ADVICE, messages, { maxTokens: 300, temperature: 0.5 }, start);
  }

  // ────────── REGIME EXPLANATION ──────────

  async explainRegimeChoice(
    oldTax: number,
    newTax: number,
    recommended: string,
    deductions: Array<{ section: string; amount: number; max: number }>,
    income: number,
  ): Promise<AIResponse> {
    const start = Date.now();
    const dedStr = deductions
      .filter((d) => d.amount > 0)
      .map((d) => `${d.section}: ₹${Math.round(d.amount / 1000)}K / ₹${Math.round(d.max / 1000)}K`)
      .join(', ');

    const messages: AIMessage[] = [
      { role: 'system', content: SYSTEM_PROMPTS.TAX_EXPERT },
      {
        role: 'user',
        content: `Explain in 3-4 sentences why the ${recommended.toUpperCase()} regime is better for this person:

Income: ₹${(income / 100000).toFixed(1)}L
Old Regime Tax: ₹${Math.round(oldTax / 1000)}K
New Regime Tax: ₹${Math.round(newTax / 1000)}K
Savings: ₹${Math.round(Math.abs(oldTax - newTax) / 1000)}K
Active Deductions: ${dedStr}

Be specific about which deductions make the difference.`,
      },
    ];

    return this.callWithFallback(MODELS.TAX_MATH, messages, { maxTokens: 300, temperature: 0.3 }, start);
  }

  // ═══════════════════════════════════════════════════════════════
  // INTERNAL — CALL WITH FALLBACK
  // ═══════════════════════════════════════════════════════════════

  private async callWithFallback(
    primaryModel: string,
    messages: AIMessage[],
    options: { maxTokens?: number; temperature?: number },
    startTime: number,
  ): Promise<AIResponse> {
    const models = [primaryModel, ...(FALLBACK_MODELS[primaryModel] || [])];

    for (let i = 0; i < models.length; i++) {
      try {
        const result = await this.client.chat(models[i], messages, {
          ...options,
          timeout: i === 0 ? 30000 : 20000, // Shorter timeout for fallbacks
        });

        return {
          text: result.text,
          model_used: models[i],
          tokens_used: result.tokens,
          latency_ms: Date.now() - startTime,
          fallback_used: i > 0,
        };
      } catch (err: any) {
        console.warn(`[FinshalaAI] Model ${models[i]} failed: ${err.message}. ${i < models.length - 1 ? 'Trying fallback...' : 'All models failed.'}`);
        if (i === models.length - 1) {
          // All models failed — return mock response
          const mockResult = await this.client.chat('mock', messages, options);
          return {
            text: mockResult.text,
            model_used: 'mock-fallback',
            latency_ms: Date.now() - startTime,
            fallback_used: true,
          };
        }
      }
    }

    // Should never reach here, but TypeScript needs it
    return { text: '', model_used: 'none', latency_ms: 0, fallback_used: true };
  }
}


// ═══════════════════════════════════════════════════════════════
// SINGLETON INSTANCE
// ═══════════════════════════════════════════════════════════════

export const finshalaAI = new FinshalaAI();
