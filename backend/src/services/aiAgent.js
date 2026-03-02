// ============================================================
// Deeplix AI Agent Service
// Supports Gemini (Google) and Anthropic (Claude)
// ============================================================
const fetch = require('node-fetch');

// Gemini: use GEMINI_API_KEY (Google AI key starting with AIza)
// Anthropic: use ANTHROPIC_API_KEY
function getProvider() {
  if (process.env.GEMINI_API_KEY?.trim()) return 'gemini';
  if (process.env.ANTHROPIC_API_KEY?.trim()) return 'anthropic';
  return null;
}

class NexusAIAgent {
  constructor() {
    this.provider = getProvider();
    this.apiKey = this.provider === 'gemini' ? process.env.GEMINI_API_KEY : process.env.ANTHROPIC_API_KEY;
    this.model = this.provider === 'gemini'
      ? (process.env.GEMINI_MODEL || 'gemini-2.0-flash')
      : 'claude-sonnet-4-6';
    this.geminiApiVersion = process.env.GEMINI_API_VERSION || 'v1beta';
    this.maxTokens = 2048;
  }

  async _geminiGenerate(prompt, maxTokens = 2048, retryCount = 0, useFallbackModel = false) {
    const modelToUse = useFallbackModel
      ? (process.env.GEMINI_FALLBACK_MODEL || 'gemini-1.5-flash')
      : this.model;
    const modelName = modelToUse.startsWith('models/') ? modelToUse : `models/${modelToUse}`;
    const version = this.geminiApiVersion || 'v1beta';
    const url = `https://generativelanguage.googleapis.com/${version}/${modelName}:generateContent?key=${this.apiKey}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens }
      })
    });
    const errBody = await res.json().catch(() => ({}));
    const errMsg = errBody.error?.message || `Gemini API error: ${res.status}`;

    if (!res.ok) {
      const isQuotaError = res.status === 429 || /quota|rate limit|retry in/i.test(errMsg);
      if (isQuotaError && retryCount < 1) {
        const match = errMsg.match(/retry in (\d+(?:\.\d+)?)s/i);
        const waitMs = match ? Math.ceil(parseFloat(match[1]) * 1000) + 1000 : 60000;
        console.log(`⏳ Gemini quota exceeded (${modelToUse}), retrying in ${Math.round(waitMs / 1000)}s...`);
        await new Promise(r => setTimeout(r, waitMs));
        return this._geminiGenerate(prompt, maxTokens, retryCount + 1, useFallbackModel);
      }
      if (isQuotaError && !useFallbackModel) {
        const fallback = process.env.GEMINI_FALLBACK_MODEL || 'gemini-1.5-flash';
        if (fallback !== modelToUse) {
          console.log(`⏳ Trying fallback model: ${fallback}`);
          return this._geminiGenerate(prompt, maxTokens, 0, true);
        }
      }
      throw new Error(errMsg);
    }
    return errBody.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || '';
  }

  /**
   * Build a dynamic system prompt based on user preferences and context
   */
  buildSystemPrompt(user, context = {}) {
    const personality = user?.preferences?.aiPersonality || 'friendly';

    const personalityGuides = {
      professional: 'Communicate in a professional, precise, and business-oriented manner. Use formal language and focus on actionable insights.',
      friendly: 'Communicate in a warm, encouraging, and supportive manner. Be approachable while still being highly competent.',
      concise: 'Be extremely brief and direct. No fluff. Bullet points when possible. Maximum efficiency.'
    };

    const currentDate = new Date().toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    return `You are Deeplix, an elite AI productivity assistant integrated into the Deeplix AI platform. Today is ${currentDate}.

PERSONALITY: ${personalityGuides[personality]}

CORE CAPABILITIES:
1. Task Management: Help users create, prioritize, and organize tasks. When users mention tasks, extract and suggest structured task entries.
2. Strategic Planning: Break down complex goals into actionable steps with timelines.
3. Analysis & Insights: Analyze user's productivity patterns and provide smart recommendations.
4. Writing & Communication: Draft emails, reports, summaries, and other content.
5. Problem Solving: Think through challenges systematically and suggest creative solutions.
6. Research Synthesis: Summarize and explain complex topics clearly.

SMART BEHAVIORS:
- When users mention a task or goal, proactively offer to create a structured task for them
- Detect intent: are they asking a question, requesting a task, seeking advice, or venting?
- If the user seems stressed or overwhelmed, acknowledge it and help them prioritize
- Suggest follow-up actions when relevant
- If a request is ambiguous, make a smart assumption and proceed, noting what you assumed
- Always end complex task breakdowns with a "Quick Win" - one immediate small action

RESPONSE FORMAT GUIDELINES:
- Use markdown formatting for structure (headers, bullets, code blocks)
- For task suggestions, use this format: **[TASK SUGGESTION]** title | priority | category
- Keep responses focused and valuable - quality over quantity
- Use emojis sparingly but effectively for visual hierarchy

${context.taskCount !== undefined ? `USER CONTEXT: They currently have ${context.taskCount} active tasks.` : ''}
${context.recentTopics ? `RECENT TOPICS: ${context.recentTopics.join(', ')}` : ''}

Remember: You are Deeplix - intelligent, proactive, and genuinely helpful. Make every interaction valuable.`;
  }

  /**
   * Detect the intent of a user message for analytics
   */
  detectIntent(message) {
    const lower = message.toLowerCase();
    if (lower.match(/create|add|make|build|new task|remind/)) return 'task_creation';
    if (lower.match(/how|what|why|when|who|explain|tell me/)) return 'question';
    if (lower.match(/analyze|review|check|assess|evaluate/)) return 'analysis';
    if (lower.match(/write|draft|compose|generate|create.*email|create.*report/)) return 'writing';
    if (lower.match(/plan|schedule|organize|prioritize|roadmap/)) return 'planning';
    if (lower.match(/help|stuck|problem|issue|challenge/)) return 'support';
    return 'general';
  }

  /**
   * Extract task suggestions from AI response
   */
  extractTaskSuggestions(content) {
    const tasks = [];
    const taskPattern = /\*\*\[TASK SUGGESTION\]\*\*\s*([^|]+)\|\s*(\w+)\|\s*([^\n]+)/g;
    let match;
    while ((match = taskPattern.exec(content)) !== null) {
      tasks.push({
        title: match[1].trim(),
        priority: match[2].trim().toLowerCase(),
        category: match[3].trim()
      });
    }
    return tasks;
  }

  /**
   * Main chat method - uses Gemini or Anthropic based on .env
   */
  async chat(messages, user, context = {}) {
    if (!this.provider || !this.apiKey) {
      throw new Error(
        'No AI API key configured. Add GEMINI_API_KEY (Google) or ANTHROPIC_API_KEY to backend/.env'
      );
    }
    if (this.provider === 'gemini') {
      return this._chatGemini(messages, user, context);
    }
    return this._chatAnthropic(messages, user, context);
  }

  async _chatGemini(messages, user, context = {}) {
    const systemPrompt = this.buildSystemPrompt(user, context);
    const startTime = Date.now();
    const formatted = messages.filter(m => m.role !== 'system').map(m => ({ role: m.role, content: m.content }));
    let fullPrompt = systemPrompt + '\n\n---\nConversation:\n';
    formatted.forEach(m => {
      fullPrompt += (m.role === 'user' ? 'User: ' : 'Assistant: ') + m.content + '\n';
    });
    fullPrompt += 'Assistant: ';

    const content = await this._geminiGenerate(fullPrompt, this.maxTokens);
    if (!content) throw new Error('Gemini returned no text');
    const processingTime = Date.now() - startTime;
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';

    return {
      content,
      model: this.model,
      processingTime,
      inputTokens: 0,
      outputTokens: 0,
      intent: this.detectIntent(lastUserMessage),
      suggestedTasks: this.extractTaskSuggestions(content)
    };
  }

  async _chatAnthropic(messages, user, context = {}) {
    const systemPrompt = this.buildSystemPrompt(user, context);
    const startTime = Date.now();
    const formattedMessages = messages
      .filter(m => m.role !== 'system')
      .map(m => ({ role: m.role, content: m.content }));

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: this.maxTokens,
        system: systemPrompt,
        messages: formattedMessages
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `API error: ${response.status}`);
    }

    const data = await response.json();
    const processingTime = Date.now() - startTime;
    const content = data.content[0]?.text || '';
    const lastUserMessage = messages.filter(m => m.role === 'user').pop()?.content || '';

    return {
      content,
      model: this.model,
      processingTime,
      inputTokens: data.usage?.input_tokens || 0,
      outputTokens: data.usage?.output_tokens || 0,
      intent: this.detectIntent(lastUserMessage),
      suggestedTasks: this.extractTaskSuggestions(content)
    };
  }

  /**
   * Generate a title for a conversation based on first message
   */
  async generateTitle(firstMessage) {
    if (!this.provider || !this.apiKey) return 'New Conversation';

    try {
      if (this.provider === 'gemini') {
        const prompt = 'Generate a short, catchy conversation title (max 5 words, no quotes) based on this message. Just the title, nothing else.\n\n' + firstMessage.substring(0, 200);
        const text = await this._geminiGenerate(prompt, 50);
        return text || 'New Conversation';
      }
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: this.model,
          max_tokens: 50,
          system: 'Generate a short, catchy conversation title (max 5 words, no quotes) based on the user message. Just the title, nothing else.',
          messages: [{ role: 'user', content: firstMessage.substring(0, 200) }]
        })
      });
      if (response.ok) {
        const data = await response.json();
        return data.content[0]?.text?.trim() || 'New Conversation';
      }
    } catch (e) {
      console.error('Title generation failed:', e.message);
    }
    return 'New Conversation';
  }

  /**
   * Analyze tasks and provide productivity insights
   */
  async analyzeProductivity(tasks, user) {
    if (!this.provider || !this.apiKey) throw new Error('API key not configured');

    const taskSummary = {
      total: tasks.length,
      completed: tasks.filter(t => t.status === 'completed').length,
      overdue: tasks.filter(t => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length,
      byPriority: tasks.reduce((acc, t) => {
        acc[t.priority] = (acc[t.priority] || 0) + 1;
        return acc;
      }, {}),
      byCategory: tasks.reduce((acc, t) => {
        acc[t.category || 'General'] = (acc[t.category || 'General'] || 0) + 1;
        return acc;
      }, {})
    };

    const prompt = `Analyze this task data and give me 3 key insights and 2 recommendations. Use markdown. Keep it under 250 words.\n${JSON.stringify(taskSummary, null, 2)}`;

    if (this.provider === 'gemini') {
      const text = await this._geminiGenerate(prompt, 600);
      return text || 'Unable to generate analysis';
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 600,
        system: 'You are a productivity analyst. Provide brief, actionable insights based on task data. Use markdown. Keep it under 250 words.',
        messages: [{ role: 'user', content: prompt }]
      })
    });
    if (!response.ok) throw new Error('Analysis failed');
    const data = await response.json();
    return data.content[0]?.text || 'Unable to generate analysis';
  }
}

// Export singleton instance
module.exports = new NexusAIAgent();
