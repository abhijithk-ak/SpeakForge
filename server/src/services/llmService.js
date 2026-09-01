/**
 * Unified LLM service — supports Groq, Google Gemini, and OpenAI.
 * All providers share the same interface: generateResponse(provider, apiKey, messages, model)
 *
 * message format: [{ role: 'user'|'assistant'|'system', content: string }]
 */

const VOICE_CONVERSATIONAL_RULES = `
CRITICAL REAL-TIME VOICE RULES:
- You are in a LIVE SPOKEN VOICE INTERVIEW / CONVERSATION.
- NEVER write code blocks (\`\`\`...\`\`\`), markdown tables, long bullet lists, or ASCII formatting.
- Respond in natural, spoken conversational English in 2 to 3 short sentences maximum.
- Ask ONE question at a time and speak as a human interviewer in a real call.`;

const SYSTEM_PROMPTS = {
  interview: (role, difficulty, coach) =>
    `You are ${COACH_PERSONAS[coach] || COACH_PERSONAS.professional}, an expert AI interview coach at SpeakForge.
You are conducting a ${difficulty} difficulty mock ${role || 'software engineering'} interview.
${VOICE_CONVERSATIONAL_RULES}

Rules:
- Ask ONE question at a time. Never ask multiple questions in one message.
- After the candidate answers, give 1-2 sentences of brief, specific spoken feedback, then ask the next question.
- If the candidate gives a weak or incomplete answer, probe with a follow-up.
- Keep your tone aligned with your persona.
- Do NOT break character. You are the interviewer, not an AI assistant.
- Start by greeting the candidate naturally and asking them to introduce themselves.`,

  speech: (topic, coach) =>
    `You are ${COACH_PERSONAS[coach] || COACH_PERSONAS.professional}, a speech coach at SpeakForge.
The user is practicing a 2-minute speech on: "${topic || 'a topic of their choice'}".
${VOICE_CONVERSATIONAL_RULES}

Rules:
- First, ask them to introduce their speech topic and what they want to achieve.
- After each speech segment, give brief spoken feedback on Clarity, Structure, and Confidence in 2 short sentences.
- Suggest one concrete improvement per round.
- Encourage them to try again with your feedback incorporated.`,

  client: (scenario, clientPersonality, coach) =>
    `You are ${COACH_PERSONAS[coach] || COACH_PERSONAS.professional}, a client communication coach at SpeakForge.
Scenario: ${CLIENT_SCENARIOS[scenario] || scenario || 'A challenging client conversation.'}
Your role: Play the client (${clientPersonality || 'professional but demanding'}) AND coach the user after each exchange.
${VOICE_CONVERSATIONAL_RULES}

Structure:
1. Start by setting the scene as the client.
2. After the user responds as themselves, step out of character and give 1-2 sentences of coaching feedback.
3. Then respond as the client again.`
};

const COACH_PERSONAS = {
  professional: 'an expert, precise, professional coach who gives direct and actionable feedback',
  friendly:     'an encouraging, warm, and supportive coach who celebrates progress while being honest',
  challenging:  'a tough but fair coach who pushes you hard and challenges vague or weak answers',
  mentor:       'a wise mentor who teaches through questions and helps you discover the right answers yourself'
};

const CLIENT_SCENARIOS = {
  deadline:    'A client is upset that you missed a project deadline by one week and is threatening to cancel.',
  feature:     'A client is requesting a last-minute feature that was not in the original scope.',
  bug:         'A client has discovered a critical bug in production affecting their customers.',
  outage:      'Your service has been down for 2 hours and the client is on the phone demanding answers.'
};

const DEFAULT_MODELS = {
  groq:   'llama-3.1-8b-instant',
  gemini: 'gemini-1.5-flash',
  openai: 'gpt-4o-mini'
};

/**
 * Ensures the messages array passed to LLM providers satisfies strict role requirements
 * (e.g. Groq requires that the last message has role: 'user').
 */
function sanitizeMessages(messages) {
  if (!Array.isArray(messages) || messages.length === 0) {
    return [{ role: 'user', content: 'Hello! Please start our session.' }];
  }
  const copy = [...messages];
  const last = copy[copy.length - 1];
  if (!last || last.role !== 'user') {
    copy.push({ role: 'user', content: 'Hello! I am ready for our session. Please greet me and start.' });
  }
  return copy;
}

// Helper to strip markdown code blocks before returning response
function cleanSpokenOutput(text) {
  if (!text) return '';
  return text
    .replace(/```[\s\S]*?```/g, ' [code omitted for voice conversation] ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/[*_#~>]/g, '')
    .trim();
}

// ─────────────────────────────────────────────────────────────
// GROQ
// ─────────────────────────────────────────────────────────────
async function callGroq(apiKey, messages, model) {
  const selectedModel = model || DEFAULT_MODELS.groq;
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model:       selectedModel,
      messages,
      max_tokens:  300,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return cleanSpokenOutput(data.choices[0].message.content);
}

// ─────────────────────────────────────────────────────────────
// GOOGLE GEMINI
// ─────────────────────────────────────────────────────────────
async function callGemini(apiKey, messages, model) {
  const selectedModel = model || DEFAULT_MODELS.gemini;
  const systemMsg = messages.find(m => m.role === 'system');
  const chatMsgs  = messages.filter(m => m.role !== 'system');

  const geminiContents = chatMsgs.map(m => ({
    role:  m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const body = {
    contents: geminiContents,
    generationConfig: { maxOutputTokens: 300, temperature: 0.7 }
  };

  if (systemMsg) {
    body.systemInstruction = { parts: [{ text: systemMsg.content }] };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${selectedModel}:generateContent?key=${apiKey}`,
    {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body)
    }
  );

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Gemini API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return cleanSpokenOutput(data.candidates[0].content.parts[0].text);
}

// ─────────────────────────────────────────────────────────────
// OPENAI
// ─────────────────────────────────────────────────────────────
async function callOpenAI(apiKey, messages, model) {
  const selectedModel = model || DEFAULT_MODELS.openai;
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method:  'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model:       selectedModel,
      messages,
      max_tokens:  300,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`OpenAI API error ${response.status}: ${err}`);
  }

  const data = await response.json();
  return cleanSpokenOutput(data.choices[0].message.content);
}

// ─────────────────────────────────────────────────────────────
// EVALUATION PROMPT — structured JSON output
// ─────────────────────────────────────────────────────────────
const EVALUATION_PROMPT = `You are an expert communication and interview evaluator.
Analyze the following conversation transcript and return ONLY a valid JSON object (no markdown, no code blocks, just raw JSON).

JSON Schema:
{
  "overall_score": <number 0-100>,
  "clarity_score": <number 0-100>,
  "fluency_score": <number 0-100>,
  "confidence_score": <number 0-100>,
  "structure_score": <number 0-100>,
  "vocabulary_score": <number 0-100>,
  "relevance_score": <number 0-100>,
  "filler_word_count": <integer>,
  "filler_word_score": <number 0-100, 100 = no fillers>,
  "strengths": ["strength 1", "strength 2"],
  "improvements": ["improvement 1", "improvement 2"],
  "specific_feedback": "<2-3 sentence personalized summary>"
}`;

// ─────────────────────────────────────────────────────────────
// FETCH AVAILABLE MODELS BY PROVIDER
// ─────────────────────────────────────────────────────────────
async function fetchAvailableModels(provider, apiKey) {
  try {
    if (provider === 'groq') {
      const res = await fetch('https://api.groq.com/openai/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();

      const priorityModels = [
        'llama-3.3-70b-versatile',
        'llama-3.1-8b-instant',
        'llama-3.2-3b-preview',
        'llama-3.2-1b-preview',
        'llama3-70b-8192',
        'mixtral-8x7b-32768',
        'gemma2-9b-it',
        'deepseek-r1-distill-llama-70b',
        'qwen-2.5-32b'
      ];

      const rawModels = (data.data || []).map(m => m.id);

      const validModels = rawModels.filter(id => {
        const lower = id.toLowerCase();
        return !lower.startsWith('allam') &&
               !lower.startsWith('canopylabs') &&
               !lower.includes('whisper') &&
               !lower.includes('guard') &&
               !lower.includes('arabic') &&
               !lower.includes('compound') &&
               !lower.includes('orpheus') &&
               !lower.includes('gpt-oss') &&
               !lower.includes('tool');
      });

      validModels.sort((a, b) => {
        const aIdx = priorityModels.indexOf(a);
        const bIdx = priorityModels.indexOf(b);
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;
        return a.localeCompare(b);
      });

      return validModels.length > 0 ? validModels : priorityModels;
    }

    if (provider === 'gemini') {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();

      const priorityModels = [
        'gemini-1.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-pro',
        'gemini-2.0-flash-lite',
        'gemini-1.5-flash-8b'
      ];

      const rawModels = (data.models || [])
        .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
        .map(m => m.name.replace(/^models\//, ''))
        .filter(name => name.startsWith('gemini'));

      rawModels.sort((a, b) => {
        const aIdx = priorityModels.indexOf(a);
        const bIdx = priorityModels.indexOf(b);
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;
        return a.localeCompare(b);
      });

      return rawModels.length > 0 ? rawModels : priorityModels;
    }

    if (provider === 'openai') {
      const res = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const data = await res.json();

      const priorityModels = [
        'gpt-4o-mini',
        'gpt-4o',
        'gpt-4-turbo',
        'o3-mini',
        'gpt-3.5-turbo'
      ];

      const rawModels = (data.data || [])
        .map(m => m.id)
        .filter(id => id.startsWith('gpt-4') || id.startsWith('gpt-3.5') || id.startsWith('o3'));

      rawModels.sort((a, b) => {
        const aIdx = priorityModels.indexOf(a);
        const bIdx = priorityModels.indexOf(b);
        if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
        if (aIdx !== -1) return -1;
        if (bIdx !== -1) return 1;
        return a.localeCompare(b);
      });

      return rawModels.length > 0 ? rawModels : priorityModels;
    }
  } catch (err) {
    console.warn(`Failed to fetch live models for ${provider}:`, err.message);
  }

  // Fallback defaults if fetch fails
  if (provider === 'groq') {
    return ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'llama3-70b-8192', 'mixtral-8x7b-32768', 'gemma2-9b-it'];
  } else if (provider === 'gemini') {
    return ['gemini-1.5-flash', 'gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-2.0-flash-lite'];
  } else {
    return ['gpt-4o-mini', 'gpt-4o', 'gpt-3.5-turbo', 'o3-mini'];
  }
}

// ─────────────────────────────────────────────────────────────
// PUBLIC API
// ─────────────────────────────────────────────────────────────

/**
 * Generate a coach response for a conversation turn.
 * @param {string} provider - 'groq' | 'gemini' | 'openai'
 * @param {string} apiKey   - Decrypted API key
 * @param {Array}  messages - Full conversation history (OpenAI format)
 * @param {string} [model]  - Specific model ID to use
 * @returns {Promise<string>} - AI response text
 */
async function generateResponse(provider, apiKey, messages, model) {
  const safeMessages = sanitizeMessages(messages);
  switch (provider) {
    case 'groq':   return callGroq(apiKey, safeMessages, model);
    case 'gemini': return callGemini(apiKey, safeMessages, model);
    case 'openai': return callOpenAI(apiKey, safeMessages, model);
    default: throw new Error(`Unknown provider: ${provider}`);
  }
}

/**
 * Generate a structured evaluation JSON from a full transcript.
 * @param {string} provider  - 'groq' | 'gemini' | 'openai'
 * @param {string} apiKey    - Decrypted API key
 * @param {string} transcript - Full conversation as a string
 * @param {string} [model]   - Specific model ID
 * @returns {Promise<object>} - Parsed evaluation object
 */
async function generateEvaluation(provider, apiKey, transcript, model) {
  const messages = [
    { role: 'system', content: EVALUATION_PROMPT },
    { role: 'user',   content: `Transcript:\n\n${transcript}` }
  ];

  const raw = await generateResponse(provider, apiKey, messages, model);

  // Strip any accidental markdown code fences
  const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    throw new Error(`LLM returned invalid JSON for evaluation: ${cleaned.slice(0, 200)}`);
  }
}

/**
 * Build a system prompt for a given mode and config.
 */
function buildSystemPrompt(mode, config) {
  switch (mode) {
    case 'interview':
      return SYSTEM_PROMPTS.interview(config.role, config.difficulty, config.coach_personality);
    case 'speech':
      return SYSTEM_PROMPTS.speech(config.topic, config.coach_personality);
    case 'client':
      return SYSTEM_PROMPTS.client(config.scenario, config.client_personality, config.coach_personality);
    default:
      return SYSTEM_PROMPTS.interview('software engineering', 'intermediate', 'professional');
  }
}

module.exports = {
  generateResponse,
  generateEvaluation,
  buildSystemPrompt,
  fetchAvailableModels,
  DEFAULT_MODELS
};
