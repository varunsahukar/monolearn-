/**
 * API Client for communicating with the backend server
 * Uses the Grok-powered endpoints from server/index.js
 */

const API_BASE = import.meta.env.VITE_API_BASE || `${window.location.origin}/api`

/**
 * Make a request to the backend API
 * @param {string} endpoint - API endpoint (e.g., '/chat/knowledge')
 * @param {object} options - Fetch options (method, body, headers, etc.)
 * @returns {Promise<object>} API response
 */
const makeRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE}${endpoint}`

  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    })

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }))
      throw new Error(error.error || `API Error: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error(`API request failed (${endpoint}):`, error)
    throw error
  }
}

/**
 * Generate quiz questions from context
 * @param {string} context - Material to generate questions from
 * @param {number} count - Number of questions
 * @param {string} difficulty - 'easy', 'medium', 'hard'
 * @param {string} topic - Optional specific topic
 * @returns {Promise<Array>} Array of quiz questions
 */
export const generateQuiz = async (context, count = 5, difficulty = 'medium', topic = '') => {
  const response = await makeRequest('/quiz/generate', {
    method: 'POST',
    body: JSON.stringify({
      context,
      count,
      difficulty,
      topic,
    }),
  })
  return response.questions || []
}

/**
 * Get knowledge chat response with vault context
 * @param {string} query - User question
 * @param {Array} context - Vault documents as context
 * @returns {Promise<string>} Answer with citations
 */
export const getKnowledgeChat = async (query, context = []) => {
  const response = await makeRequest('/chat/knowledge', {
    method: 'POST',
    body: JSON.stringify({
      query,
      context,
    }),
  })
  return response.answer || ''
}

/**
 * Analyze code with Grok
 * @param {string} code - Code to analyze
 * @param {string} language - Programming language
 * @param {string} analysisType - Type: 'explain', 'bugs', 'improve', 'comments'
 * @returns {Promise<string>} Analysis result
 */
export const analyzeCode = async (code, language = 'python', analysisType = 'bugs') => {
  const response = await makeRequest('/chat/code', {
    method: 'POST',
    body: JSON.stringify({
      code,
      language,
      analysisType,
    }),
  })
  return response.analysis || ''
}

/**
 * Get video Q&A response based on transcript
 * @param {Array} transcript - Transcript blocks
 * @param {string} question - User question
 * @returns {Promise<object>} Answer with metadata
 */
export const getVideoChat = async (transcript, question) => {
  const response = await makeRequest('/video/chat', {
    method: 'POST',
    body: JSON.stringify({
      transcript,
      question,
    }),
  })
  return response
}

/**
 * Analyze YouTube video
 * @param {string} url - YouTube URL
 * @returns {Promise<object>} Video analysis with transcript and insights
 */
export const analyzeYouTubeVideo = async (url) => {
  const response = await makeRequest(`/youtube/analyze?url=${encodeURIComponent(url)}`)
  return response.analysis || {}
}

/**
 * Health check the API
 * @returns {Promise<boolean>} Whether API is healthy
 */
export const checkApiHealth = async () => {
  try {
    const response = await makeRequest('/health')
    return response.ok === true
  } catch {
    return false
  }
}

export default {
  generateQuiz,
  getKnowledgeChat,
  analyzeCode,
  getVideoChat,
  analyzeYouTubeVideo,
  checkApiHealth,
}
