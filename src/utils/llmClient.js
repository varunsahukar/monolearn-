/**
 * LLM Client - Wrapper for Google Gemini API
 * Provides utilities for chat, code analysis, quiz generation, and more
 */

const GEMINI_API_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';
const DEFAULT_MODEL = 'gemini-2.0-flash';

const getGeminiApiKey = () => process.env.GEMINI_API_KEY || '';

/**
 * Get a complete LLM response using Gemini API
 * @param {string} prompt - The prompt to send
 * @param {number} maxTokens - Max tokens in response
 * @returns {Promise<string>} Response text
 */
export const getLLMResponse = async (prompt, maxTokens = 1000) => {
  const GEMINI_API_KEY = getGeminiApiKey()
  if (!GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY not configured');
  }

  try {
    const response = await fetch(
      `${GEMINI_API_BASE}/${DEFAULT_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.7,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(
        `Gemini API error: ${error.error?.message || 'Unknown error'}`
      );
    }

    const data = await response.json();
    return (
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      'No response generated'
    );
  } catch (error) {
    console.error('LLM error:', error);
    throw error;
  }
};

/**
 * Generate a knowledge chat response with vault context
 * @param {string} query - User question
 * @param {Array} contextDocs - Vault documents as context
 * @returns {Promise<string>} Answer with citations
 */
export const generateKnowledgeChatResponse = async (query, contextDocs = []) => {
  const contextText = contextDocs
    .map(
      (doc) =>
        `<document name="${doc.name}" type="${doc.type}">\n${doc.content}\n</document>`
    )
    .join('\n\n');

  const prompt = `You are an expert tutor. Answer the following question based on the provided materials.
If information from the materials is relevant, explicitly cite which material(s) you're using.

Materials:
${contextText}

Student question: ${query}

Provide a clear, comprehensive answer with specific references to the materials where applicable.`;

  return getLLMResponse(prompt, 1500);
};

/**
 * Analyze code and provide feedback
 * @param {string} code - Code to analyze
 * @param {string} language - Programming language
 * @param {string} analysisType - Type: 'explain', 'bugs', 'improve', 'comments'
 * @returns {Promise<string>} Analysis result
 */
export const analyzeCode = async (
  code,
  language = 'python',
  analysisType = 'bugs'
) => {
  const typePrompts = {
    explain: `Explain what this ${language} code does in simple terms. Break it down line by line.`,
    bugs: `Identify potential bugs, logic errors, or performance issues in this ${language} code. List each issue with severity (high/medium/low).`,
    improve: `Suggest optimizations and improvements for this ${language} code. Include time/space complexity analysis.`,
    comments: `Generate meaningful, clear comments for this ${language} code. Follow best practices for the language.`,
  };

  const prompt = `${typePrompts[analysisType] || typePrompts.explain}

\`\`\`${language}
${code}
\`\`\`

Provide actionable, specific feedback.`;

  return getLLMResponse(prompt, 2000);
};

/**
 * Generate quiz questions from context
 * @param {string} context - Material to generate questions from
 * @param {number} count - Number of questions
 * @param {string} difficulty - 'easy', 'medium', 'hard'
 * @param {string} topic - Optional specific topic
 * @returns {Promise<Array>} Array of questions with options and answers
 */
export const generateQuizQuestions = async (
  context,
  count = 5,
  difficulty = 'medium',
  topic = ''
) => {
  const prompt = `Generate ${count} multiple-choice questions at ${difficulty} difficulty level based on the following material.
${topic ? `Focus on the topic of: ${topic}` : ''}

Material:
${context}

Return a JSON array with this structure:
[
  {
    "question": "Question text?",
    "options": ["A", "B", "C", "D"],
    "correct": 0,
    "explanation": "Why this is correct"
  }
]

Return ONLY the JSON array, no other text.`;

  const response = await getLLMResponse(prompt, 3000);

  try {
    return JSON.parse(response);
  } catch {
    return [
      {
        question: 'Failed to generate questions',
        options: ['Error'],
        correct: 0,
        explanation: response,
      },
    ];
  }
};

/**
 * Answer a question about a video transcript
 * @param {Array} transcript - Video transcript blocks
 * @param {string} question - User question
 * @returns {Promise<object>} Answer with metadata
 */
export const answerVideoQuestion = async (transcript, question) => {
  const transcriptText = transcript
    .map((block) => `[${block.offset}ms] ${block.text}`)
    .join(' ');

  const prompt = `Based on this video transcript, answer the following question:

Transcript:
${transcriptText}

Question: ${question}

Provide a clear, concise answer with timestamps if relevant.`;

  const answer = await getLLMResponse(prompt, 1500);

  return {
    answer,
    questionAsked: question,
    timestamp: new Date().toISOString(),
  };
};

// Legacy export for backwards compatibility
export const streamLLMResponse = getLLMResponse;

export default {
  getLLMResponse,
  generateKnowledgeChatResponse,
  analyzeCode,
  generateQuizQuestions,
  answerVideoQuestion,
  streamLLMResponse,
};
