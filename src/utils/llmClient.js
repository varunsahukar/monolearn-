import apiClient from './apiClient.js';

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

  return apiClient.getChatResponse(prompt);
};

/**
 * Analyze code and provide feedback
 * @param {string} code - Code to analyze
 * @param {string} language - Programming language
 * @param {string} analysisType - Type: 'explain', 'bugs', 'improve', 'comments'
 * @returns {Promise<string>} Analysis result
 */
export const analyzeCode = async (code, language = 'javascript', analysisType = 'explain') => {
  return apiClient.analyzeCode(code, language, analysisType);
};

/**
 * Generate quiz questions from a given context
 * @param {string} context - The source material for the quiz
 * @param {number} count - Number of questions to generate
 * @param {string} difficulty - 'easy', 'medium', or 'hard'
 * @param {string} topic - Optional topic to focus on
 * @returns {Promise<Array>} Array of quiz questions
 */
export const generateQuizQuestions = async (context, count = 5, difficulty = 'medium', topic = '') => {
  const prompt = `You are a quiz generation expert. Create a ${difficulty} quiz with ${count} questions about "${topic || 'the provided text'}".
Each question should be multiple choice with 4 options, and only one correct answer.
Format the output as a JSON array of objects, where each object has "question", "options" (an array of 4 strings), and "answer" (the correct option string).

Context:
${context}`;

  const response = await apiClient.getChatResponse(prompt);
  try {
    return JSON.parse(response);
  } catch (error) {
    console.error('Failed to parse quiz questions:', error);
    throw new Error('Could not generate a valid quiz from the response.');
  }
};

/**
 * Answer a question about a video based on its transcript
 * @param {Array} transcript - Array of transcript objects
 * @param {string} question - The user's question
 * @returns {Promise<object>} Answer and related transcript parts
 */
export const answerVideoQuestion = async (transcript, question) => {
  return apiClient.summarizeVideo(transcript, question);
};