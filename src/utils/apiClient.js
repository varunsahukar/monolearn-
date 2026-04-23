/**
 * API Client for communicating with the backend server
 * Uses the Grok-powered endpoints from server/index.js
 */

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Make a request to the backend API
 * @param {string} endpoint - API endpoint (e.g., '/api/llm/chat')
 * @param {object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<object>} API response
 */
const makeRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`;
  console.log(`[API Request] ${options.method || 'GET'} ${url}`, { options });

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      console.error(`[API Error] ${options.method || 'GET'} ${url}`, { status: response.status, error });
      throw new Error(error.error || `API Error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`[API Response] ${options.method || 'GET'} ${url}`, { status: response.status, data });
    return data;
  } catch (error) {
    console.error(`API request failed (${endpoint}):`, error);
    throw error;
  }
};

/**
 * Get a response from the LLM chat.
 * @param {string} prompt - The user's prompt.
 * @returns {Promise<string>} The LLM's response.
 */
export const getChatResponse = async (prompt) => {
  const response = await makeRequest('/api/llm/chat', {
    method: 'POST',
    body: JSON.stringify({ prompt }),
  });
  return response.response || '';
};

export const getKnowledgeChatResponse = async (query, context) => {
  return makeRequest('/api/chat/knowledge', {
    method: 'POST',
    body: JSON.stringify({ query, context }),
  });
};

/**
 * Analyze code.
 * @param {string} code - The code to analyze.
 * @returns {Promise<string>} The analysis of the code.
 */
export const analyzeCode = async (code) => {
  const response = await makeRequest('/api/code/analyze', {
    method: 'POST',
    body: JSON.stringify({ code }),
  });
  return response.response || '';
};

/**
 * Summarize a video from its transcript.
 * @param {string} transcript - The video transcript.
 * @returns {Promise<string>} The summary of the video.
 */
export const summarizeVideo = async (transcript) => {
  const response = await makeRequest('/api/video/summarize', {
    method: 'POST',
    body: JSON.stringify({ transcript }),
  });
  return response.response || '';
};

export default {
  getChatResponse,
  analyzeCode,
  summarizeVideo,
};