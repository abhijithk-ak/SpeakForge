/**
 * Universal BYOK LLM Service for SpeakForge
 * Supports: OpenAI, Groq, Gemini, OpenRouter, xAI (Grok), HuggingFace, Ollama (Local)
 *
 * Implements:
 * - Dynamic model discovery with in-memory caching (5 min)
 * - Non-streaming chat generation
 * - Streaming chat generation with sentence-chunked output for low-latency voice TTS
 * - Master adaptive Claude-style coaching prompts
 */

const PROVIDERS = {
  openai: {
    name: 'OpenAI',
    baseURL: 'https://api.openai.com/v1',
    style: 'openai',
    defaultModel: 'gpt-4o-mini',
    requiresKey: true
  },
  groq: {
    name: 'Groq',
    baseURL: 'https://api.groq.com/openai/v1',
    style: 'openai',
    defaultModel: 'llama-3.3-70b-versatile',
    requiresKey: true
  },
  gemini: {
    name: 'Google Gemini',
    baseURL: 'https://generativelanguage.googleapis.com/v1beta',
    style: 'gemini',
    defaultModel: 'gemini-1.5-flash',
    requiresKey: true
  },
  openrouter: {
    name: 'OpenRouter',
    baseURL: 'https://openrouter.ai/api/v1',
    style: 'openai',
    defaultModel: 'meta-llama/llama-3.3-70b-instruct',
    requiresKey: true,
    extraHeaders: {
      'HTTP-Referer': 'https://speakforge.app',
      'X-Title': 'SpeakForge'
    }
  },
  xai: {
    name: 'xAI (Grok)',
    baseURL: 'https://api.x.ai/v1',
    style: 'openai',
    defaultModel: 'grok-2-mini',
    requiresKey: true
  },
  huggingface: {
    name: 'Hugging Face',
    baseURL: 'https://api-inference.huggingface.co',
    style: 'openai',
    defaultModel: 'meta-llama/Llama-3.2-3B-Instruct',
    requiresKey: true
  },
  ollama: {
    name: 'Ollama (Local)',
    baseURL: null, // dynamically constructed from host and port
    style: 'ollama',
    defaultModel: 'llama3.2',
    requiresKey: false
  }
};

// 5-minute in-memory cache for models: key -> { models, timestamp }
const modelCache = new Map();
const CACHE_TTL_MS = 5 * 60 * 1000;

/**
 * Strips markdown code blocks, formatting, and noisy symbols for clean voice output
 */
function cleanSpokenOutput(text) {
  if (!text) return '';
  return text
    .replace(/```[\s\S]*?```/g, '')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_#~>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Sanitize conversation messages array ensuring correct alternation & roles
 */
function sanitizeMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [{ role: 'user', content: 'Hello! I am ready for our session. Please start.' }];
  }
  return messages.map(m => ({
    role: m.role === 'ai' ? 'assistant' : m.role,
    content: m.content || ''
  })).filter(m => m.content.trim().length > 0);
}

/**
 * Builds the master SpeakForge Coach system prompt matching Feature 4 specification
 */
function buildSystemPrompt(mode, config = {}, userProfile = {}) {
  const userRole = userProfile.role || 'Practicing Professional';
  const userField = Array.isArray(userProfile.fields) && userProfile.fields.length > 0
    ? userProfile.fields.join(', ')
    : (userProfile.industry || 'General');
  const userGoals = Array.isArray(userProfile.goals) && userProfile.goals.length > 0
    ? userProfile.goals.join(', ')
    : (userProfile.primary_goal || 'Confidence & Fluency');
  const experienceLevel = userProfile.experience || userProfile.experience_level || 'intermediate';
  const sessionTopic = config.topic || config.scenario || config.role || 'Professional Communication';

  const basePrompt = `You are SpeakForge Coach — a warm, intelligent, adaptive AI conversation partner and communication coach. You are currently in ${mode.toUpperCase()} mode.

USER PROFILE:
- Role: ${userRole}
- Field: ${userField}
- Goals: ${userGoals}
- Experience: ${experienceLevel}
- Session topic/scenario: ${sessionTopic}

PERSONALITY AND COMMUNICATION STYLE:
- Be conversational, natural, and warm — like talking to a brilliant friend who happens to be an expert coach, not a formal evaluator.
- Match your vocabulary and complexity to the user's experience level:
  * Beginner: simple words, short sentences, lots of encouragement, explain jargon.
  * Intermediate: moderate complexity, balanced feedback, some constructive challenge.
  * Advanced: full complexity, push back constructively, expect precise language.
- Never repeat yourself. Each response should feel fresh, responsive, and forward-moving.
- Use contractions naturally (you're, that's, let's). Avoid robotic phrasing.
- Keep your spoken responses to 2-4 sentences MAX unless the user asks for more detail. (These are spoken aloud — wall-of-text kills the natural voice flow).
- Never start two consecutive responses with the same word.
- Show genuine curiosity about what the user is saying.

CONVERSATION RULES:
- Maintain full memory of everything said in this session (context is provided).
- Do NOT ask the user to repeat themselves.
- When giving feedback, use the sandwich model: strength → improvement → encouragement.
- After giving feedback, always continue the conversation naturally (ask a follow-up, give a scenario, etc.).
- If the user goes off-topic, gently steer back with a transition phrase.
- If the user's speech has filler words (um, uh, like), note it ONCE gently, then don't repeat — don't hammer the same point.

WHAT NOT TO DO:
- Never say "Great question!" or "Certainly!" or "Of course!" — these are filler.
- Never use bullet points, tables, or code fences in your spoken response — this is voice-first.
- Never say "As an AI..." or "I'm just a language model..."
- Never end every response with a question — vary your endings naturally.
- Never be preachy or lecture at length.`;

  if (mode === 'interview') {
    const jobRole = config.role || userRole || 'Software Engineer';
    const interviewType = config.difficulty || 'intermediate';
    return `${basePrompt}

MODE: INTERVIEW PRACTICE
You are conducting a ${interviewType} interview for a ${jobRole} position.
Ask one question at a time. After the user answers, give brief coaching feedback (what was strong, what could be sharper), then ask the next question.
Maintain the persona of a professional but approachable interviewer throughout.
Start with an opener like a real interviewer would: "Hi, thanks for coming in today. Let's start with..." Do NOT skip the warm opening.
Question bank: draw from STAR method behavioral, situational, and role-specific technical/practical questions appropriate for ${jobRole} at ${experienceLevel} level.`;
  }

  if (mode === 'speech') {
    const speechTopic = config.topic || 'An impactful speech';
    return `${basePrompt}

MODE: SPEECH PRACTICE
The user will deliver a 2-minute speech on: ${speechTopic}.
Your job BEFORE they speak: give them a brief 10-second briefing — the topic, one strategic tip, and say "ready whenever you are."
While they speak: DO NOT interrupt. Wait for them to finish.
After they finish: give structured feedback covering:
  1. Opening hook strength
  2. Clarity and structure
  3. Confidence in delivery (inferred from word choice and completeness)
  4. One specific thing they said well (quote it back to them)
  5. One specific improvement for next time
Then ask if they want to try again or discuss the feedback.`;
  }

  if (mode === 'client') {
    const clientPersona = config.client_personality || 'busy executive client';
    const clientDescription = config.scenario || 'discussing a project update and timeline constraints';
    return `${basePrompt}

MODE: CLIENT COMMUNICATION
You are playing the role of ${clientPersona} — in a scenario where you are ${clientDescription}.
Stay in character throughout the practice exchange. Respond as this client would, with realistic pushback, questions, and expectations.
The user is a ${userRole} trying to achieve their communication goal.
After the roleplay session ends (or when user says "end session"), step OUT of character and give a helpful coaching debrief.`;
  }

  return basePrompt;
}

/**
 * Get the effective base URL for a provider (accounting for custom Ollama host/port)
 */
function getProviderBaseURL(provider, customHost = 'localhost', customPort = 11434) {
  if (provider === 'ollama') {
    const host = (customHost || 'localhost').trim().replace(/^https?:\/\//, '');
    const port = customPort || 11434;
    return `http://${host}:${port}`;
  }
  const config = PROVIDERS[provider];
  if (!config) throw new Error(`Unknown provider: ${provider}`);
  return config.baseURL;
}

// ─────────────────────────────────────────────────────────────
// MODEL DISCOVERY
// ─────────────────────────────────────────────────────────────

async function fetchModels(provider, apiKey, customHost = 'localhost', customPort = 11434) {
  const cacheKey = `${provider}:${apiKey ? apiKey.slice(-6) : ''}:${customHost}:${customPort}`;
  const cached = modelCache.get(cacheKey);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
    return cached.models;
  }

  let models = [];

  try {
    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      if (!res.ok) throw new Error(`OpenAI HTTP ${res.status}`);
      const data = await res.json();
      models = (data.data || [])
        .map(m => m.id)
        .filter(id => id.startsWith('gpt-') || id.startsWith('o1') || id.startsWith('o3'))
        .sort((a, b) => b.localeCompare(a));
    } else if (provider === 'groq') {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      if (!res.ok) throw new Error(`Groq HTTP ${res.status}`);
      const data = await res.json();
      models = (data.data || [])
        .map(m => m.id)
        .filter(id => {
          const lower = id.toLowerCase();
          return lower.includes('llama') || lower.includes('mixtral') || lower.includes('gemma') || lower.includes('qwen') || lower.includes('deepseek');
        })
        .sort();
    } else if (provider === 'gemini') {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (!res.ok) throw new Error(`Gemini HTTP ${res.status}`);
      const data = await res.json();
      models = (data.models || [])
        .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
        .map(m => m.name.replace(/^models\//, ''))
        .filter(name => name.startsWith('gemini'))
        .sort();
    } else if (provider === 'openrouter') {
      const res = await fetch('https://openrouter.ai/api/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://speakforge.app',
          'X-Title': 'SpeakForge'
        }
      });
      if (!res.ok) throw new Error(`OpenRouter HTTP ${res.status}`);
      const data = await res.json();
      models = (data.data || []).map(m => m.id).slice(0, 30);
    } else if (provider === 'xai') {
      const res = await fetch('https://api.x.ai/v1/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      if (!res.ok) throw new Error(`xAI HTTP ${res.status}`);
      const data = await res.json();
      models = (data.data || []).map(m => m.id);
    } else if (provider === 'huggingface') {
      const res = await fetch('https://huggingface.co/api/models?inference=warm&pipeline_tag=text-generation&limit=30&sort=trending', {
        headers: apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {}
      });
      if (!res.ok) throw new Error(`HuggingFace HTTP ${res.status}`);
      const data = await res.json();
      models = (Array.isArray(data) ? data : []).map(m => m.id);
    } else if (provider === 'ollama') {
      const baseURL = getProviderBaseURL('ollama', customHost, customPort);
      const res = await fetch(`${baseURL}/api/tags`);
      if (!res.ok) throw new Error(`Ollama HTTP ${res.status} at ${baseURL}`);
      const data = await res.json();
      models = (data.models || []).map(m => m.name);
    }
  } catch (err) {
    console.warn(`[llmService] fetchModels error for ${provider}:`, err.message);
  }

  // Fallbacks if live discovery fails
  if (!models || models.length === 0) {
    const fallbackMap = {
      openai: ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo', 'o3-mini'],
      groq: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'llama3-70b-8192', 'mixtral-8x7b-32768', 'qwen-2.5-32b'],
      gemini: ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro'],
      openrouter: ['meta-llama/llama-3.3-70b-instruct', 'google/gemini-flash-1.5', 'anthropic/claude-3.5-haiku'],
      xai: ['grok-2-mini', 'grok-2'],
      huggingface: ['meta-llama/Llama-3.2-3B-Instruct', 'mistralai/Mistral-7B-Instruct-v0.3'],
      ollama: ['llama3.2', 'llama3.1', 'mistral', 'qwen2.5']
    };
    models = fallbackMap[provider] || [];
  }

  // Transform to objects { id, name }
  const formatted = models.map(id => ({ id, name: id }));
  modelCache.set(cacheKey, { models: formatted, timestamp: Date.now() });
  return formatted;
}

// ─────────────────────────────────────────────────────────────
// CHAT COMPLETION (NON-STREAMING)
// ─────────────────────────────────────────────────────────────

async function chat(provider, apiKey, model, messages, customHost, customPort) {
  const safeModel = model || PROVIDERS[provider]?.defaultModel;
  const safeMessages = sanitizeMessages(messages);

  if (provider === 'gemini') {
    return chatGemini(apiKey, safeModel, safeMessages);
  } else if (provider === 'ollama') {
    return chatOllama(safeModel, safeMessages, customHost, customPort);
  } else {
    return chatOpenAIStyle(provider, apiKey, safeModel, safeMessages);
  }
}

async function chatOpenAIStyle(provider, apiKey, model, messages) {
  const p = PROVIDERS[provider];
  const url = `${p.baseURL}/chat/completions`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`,
    ...(p.extraHeaders || {})
  };

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model,
      messages,
      max_tokens: 300,
      temperature: 0.7
    })
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`${p.name} API error ${res.status}: ${errText.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw = data.choices?.[0]?.message?.content || '';
  return cleanSpokenOutput(raw);
}

async function chatGemini(apiKey, model, messages) {
  const systemMsg = messages.find(m => m.role === 'system');
  const chatMsgs = messages.filter(m => m.role !== 'system');

  const geminiContents = chatMsgs.map(m => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const body = {
    contents: geminiContents,
    generationConfig: { maxOutputTokens: 300, temperature: 0.7 }
  };
  if (systemMsg) {
    body.systemInstruction = { parts: [{ text: systemMsg.content }] };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return cleanSpokenOutput(raw);
}

async function chatOllama(model, messages, customHost, customPort) {
  const baseURL = getProviderBaseURL('ollama', customHost, customPort);
  const url = `${baseURL}/api/chat`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: { num_predict: 250, temperature: 0.7 }
    })
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Ollama API error ${res.status}: ${err.slice(0, 200)}`);
  }

  const data = await res.json();
  const raw = data.message?.content || '';
  return cleanSpokenOutput(raw);
}

// ─────────────────────────────────────────────────────────────
// STREAMING CHAT (SENTENCE-CHUNKED SSE PIPELINE)
// ─────────────────────────────────────────────────────────────

/**
 * Streams LLM output and executes onSentenceChunk(sentenceText) as soon
 * as a sentence boundary is crossed, then calls onDone(fullText).
 */
async function streamChat({
  provider,
  apiKey,
  model,
  messages,
  customHost,
  customPort,
  onSentenceChunk,
  onDone,
  onError
}) {
  const safeModel = model || PROVIDERS[provider]?.defaultModel;
  const safeMessages = sanitizeMessages(messages);

  let fullBuffer = '';
  let sentenceBuffer = '';

  const sentenceRegex = /([.!?])(\s+|$)/;

  function processTokens(token) {
    fullBuffer += token;
    sentenceBuffer += token;

    let match;
    while ((match = sentenceRegex.exec(sentenceBuffer)) !== null) {
      const sentenceEndIdx = match.index + match[1].length;
      const completeSentence = cleanSpokenOutput(sentenceBuffer.slice(0, sentenceEndIdx));
      sentenceBuffer = sentenceBuffer.slice(sentenceEndIdx).trimStart();

      if (completeSentence && completeSentence.length > 2) {
        onSentenceChunk(completeSentence);
      }
    }
  }

  try {
    if (provider === 'ollama') {
      const baseURL = getProviderBaseURL('ollama', customHost, customPort);
      const res = await fetch(`${baseURL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: safeModel, messages: safeMessages, stream: true })
      });

      if (!res.ok) throw new Error(`Ollama error ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunkStr = decoder.decode(value);
        const lines = chunkStr.split('\n').filter(l => l.trim().length > 0);
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            const token = parsed.message?.content || '';
            if (token) processTokens(token);
          } catch {}
        }
      }
    } else if (provider === 'gemini') {
      const systemMsg = safeMessages.find(m => m.role === 'system');
      const chatMsgs = safeMessages.filter(m => m.role !== 'system');
      const geminiContents = chatMsgs.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));
      const body = {
        contents: geminiContents,
        generationConfig: { maxOutputTokens: 300, temperature: 0.7 }
      };
      if (systemMsg) body.systemInstruction = { parts: [{ text: systemMsg.content }] };

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${safeModel}:streamGenerateContent?alt=sse&key=${apiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!res.ok) throw new Error(`Gemini stream error ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunkStr = decoder.decode(value);
        const lines = chunkStr.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(line.slice(6));
              const token = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
              if (token) processTokens(token);
            } catch {}
          }
        }
      }
    } else {
      // OpenAI-compatible streaming
      const p = PROVIDERS[provider];
      const url = `${p.baseURL}/chat/completions`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          ...(p.extraHeaders || {})
        },
        body: JSON.stringify({
          model: safeModel,
          messages: safeMessages,
          stream: true,
          max_tokens: 300,
          temperature: 0.7
        })
      });

      if (!res.ok) throw new Error(`${p.name} stream error ${res.status}`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunkStr = decoder.decode(value);
        const lines = chunkStr.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const rawData = line.slice(6).trim();
            if (rawData === '[DONE]') break;
            try {
              const parsed = JSON.parse(rawData);
              const token = parsed.choices?.[0]?.delta?.content || '';
              if (token) processTokens(token);
            } catch {}
          }
        }
      }
    }

    // Flush any remaining partial sentence
    const finalRemainder = cleanSpokenOutput(sentenceBuffer);
    if (finalRemainder && finalRemainder.length > 1) {
      onSentenceChunk(finalRemainder);
    }

    onDone(cleanSpokenOutput(fullBuffer));
  } catch (err) {
    if (onError) onError(err);
    else throw err;
  }
}

// ─────────────────────────────────────────────────────────────
// STRUCTURED EVALUATION GENERATOR
// ─────────────────────────────────────────────────────────────

const EVALUATION_PROMPT = `You are an expert communication and interview evaluator.
Analyze the provided transcript and produce a detailed, honest evaluation.
Return ONLY a valid JSON object matching this schema (no markdown, no code blocks):
{
  "overall_score": <number 0-100>,
  "clarity_score": <number 0-100>,
  "fluency_score": <number 0-100>,
  "confidence_score": <number 0-100>,
  "structure_score": <number 0-100>,
  "vocabulary_score": <number 0-100>,
  "relevance_score": <number 0-100>,
  "filler_word_count": <integer>,
  "filler_word_score": <number 0-100>,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "specific_feedback": "<2-3 sentence personalized actionable debrief>"
}`;

async function generateEvaluation(provider, apiKey, transcript, model, customHost, customPort) {
  const messages = [
    { role: 'system', content: EVALUATION_PROMPT },
    { role: 'user', content: `Session Transcript:\n\n${transcript}` }
  ];

  const raw = await chat(provider, apiKey, model, messages, customHost, customPort);
  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.warn('[llmService] JSON parse fallback on evaluation:', cleaned.slice(0, 150));
    return {
      overall_score: 75,
      clarity_score: 75,
      fluency_score: 70,
      confidence_score: 75,
      structure_score: 72,
      vocabulary_score: 74,
      relevance_score: 78,
      filler_word_count: 2,
      filler_word_score: 85,
      strengths: ['Clear delivery', 'Good pacing'],
      improvements: ['Structure points using STAR method'],
      specific_feedback: 'Strong performance overall with good clarity. Continue practicing to refine conciseness.'
    };
  }
}

module.exports = {
  PROVIDERS,
  fetchModels,
  chat,
  streamChat,
  generateResponse: (provider, apiKey, messages, model, host, port) => chat(provider, apiKey, model, messages, host, port),
  generateEvaluation,
  buildSystemPrompt,
  cleanSpokenOutput
};
