import { createReadStream, existsSync } from 'node:fs';
import { promises as fs } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { fetchTranscript } from 'youtube-transcript/dist/youtube-transcript.esm.js';
import { buildVideoAnalysis, extractYouTubeVideoId } from '../src/utils/videoIntelligence.js';
import SpeechModule from '@google-cloud/speech';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import {
  getLLMResponse,
  generateKnowledgeChatResponse,
  analyzeCode,
  generateQuizQuestions,
  answerVideoQuestion,
} from '../src/utils/llmClient.js';

const { SpeechClient } = SpeechModule;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distDir = path.resolve(__dirname, '../dist');
const PORT = Number(process.env.PORT || 8787);

// Google Cloud Speech-to-Text setup
const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID;
const keyFilePath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
let speechClient = null;

if (projectId && keyFilePath) {
  try {
    speechClient = new SpeechClient({
      projectId,
      keyFilename: keyFilePath,
    });
  } catch (error) {
    console.warn('Failed to initialize Google Cloud Speech-to-Text:', error.message);
  }
} else {
  console.warn('Google Cloud Speech-to-Text not configured. Videos with disabled captions will not be transcribed.');
}

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
};

const sendJson = (response, statusCode, payload) => {
  response.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  });
  response.end(JSON.stringify(payload));
};

// LLM API Handlers

const handleKnowledgeChat = async (body, response) => {
  try {
    const { query, context = [] } = JSON.parse(body);

    if (!query) {
      sendJson(response, 400, { error: 'Missing query parameter' });
      return;
    }

    response.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'no-store',
    });

    const answer = await generateKnowledgeChatResponse(query, context);
    const result = {
      answer,
      context: context.map((c) => ({ name: c.name, type: c.type })),
      timestamp: new Date().toISOString(),
    };

    response.end(JSON.stringify(result));
  } catch (error) {
    sendJson(response, 500, {
      error: `Knowledge chat failed: ${error.message}`,
    });
  }
};

const handleCodeAnalysis = async (body, response) => {
  try {
    const { code, language = 'python', analysisType = 'bugs' } = JSON.parse(body);

    if (!code) {
      sendJson(response, 400, { error: 'Missing code parameter' });
      return;
    }

    response.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });

    const analysis = await analyzeCode(code, language, analysisType);
    const result = {
      code: code.substring(0, 200) + '...', // Truncate for response
      language,
      analysisType,
      analysis,
      timestamp: new Date().toISOString(),
    };

    response.end(JSON.stringify(result));
  } catch (error) {
    sendJson(response, 500, {
      error: `Code analysis failed: ${error.message}`,
    });
  }
};

const handleQuizGeneration = async (body, response) => {
  try {
    const { context = '', count = 5, difficulty = 'medium', topic = '' } = JSON.parse(body);

    if (!context) {
      sendJson(response, 400, { error: 'Missing context parameter' });
      return;
    }

    response.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });

    const questions = await generateQuizQuestions(context, count, difficulty, topic);
    const result = {
      questions,
      count: questions.length,
      difficulty,
      topic,
      timestamp: new Date().toISOString(),
    };

    response.end(JSON.stringify(result));
  } catch (error) {
    sendJson(response, 500, {
      error: `Quiz generation failed: ${error.message}`,
    });
  }
};

const handleVideoChat = async (body, response) => {
  try {
    const { transcript = [], question } = JSON.parse(body);

    if (!question || !transcript.length) {
      sendJson(response, 400, { error: 'Missing question or transcript' });
      return;
    }

    response.writeHead(200, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });

    const result = await answerVideoQuestion(transcript, question);
    result.transcriptLength = transcript.length;

    response.end(JSON.stringify(result));
  } catch (error) {
    sendJson(response, 500, {
      error: `Video chat failed: ${error.message}`,
    });
  }
};

const fetchYouTubeMetadata = async (url) => {
  const response = await fetch(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
  );

  if (!response.ok) {
    throw new Error('Unable to retrieve YouTube metadata.');
  }

  return response.json();
};

const fetchPreferredTranscript = async (url) => {
  try {
    return await fetchTranscript(url, { lang: 'en' });
  } catch (error) {
    try {
      return await fetchTranscript(url);
    } catch (fallbackError) {
      const errorMessage = fallbackError?.message || String(fallbackError);
      if (
        errorMessage.includes('disabled') ||
        errorMessage.includes('not available') ||
        errorMessage.includes('No transcripts')
      ) {
        throw new Error('Transcripts are disabled on this video.');
      }
      throw fallbackError;
    }
  }
};

const downloadYouTubeAudio = async (url) => {
  const tmpDir = path.join(__dirname, '.tmp');

  // Create temp directory if it doesn't exist
  try {
    await fs.mkdir(tmpDir, { recursive: true });
  } catch {
    // Directory might already exist
  }

  const audioFilePath = path.join(tmpDir, `audio-${Date.now()}.mp3`);
  const execPromise = promisify(exec);

  try {
    // Download audio using youtube-dl
    const command = `yt-dlp -f 251 -x --audio-format mp3 --audio-quality 0 -o "${audioFilePath}" "${url}"`;
    await execPromise(command);

    // Verify file exists
    if (!existsSync(audioFilePath)) {
      throw new Error('Failed to download audio from YouTube');
    }

    return audioFilePath;
  } catch (error) {
    throw new Error(`Failed to download YouTube audio: ${error.message}`);
  }
};

const transcribeAudioWithGoogleCloud = async (audioFilePath) => {
  if (!speechClient) {
    throw new Error('Google Cloud Speech-to-Text is not configured');
  }

  try {
    // Read audio file
    const audioFile = await fs.readFile(audioFilePath);
    const audioBytes = audioFile.toString('base64');

    // Send to Google Cloud Speech-to-Text API
    const request = {
      audio: { content: audioBytes },
      config: {
        encoding: 'MP3',
        languageCode: 'en-US',
        enableAutomaticPunctuation: true,
        enableWordTimeOffsets: true,
      },
    };

    const [operation] = await speechClient.longRunningRecognize(request);
    const [response] = await operation.promise();

    // Convert Google Cloud format to YouTube-compatible format
    const transcript = [];
    let currentOffset = 0;

    for (const result of response.results) {
      for (const alternative of result.alternatives) {
        if (!alternative.words || alternative.words.length === 0) {
          // Handle case with no word timing
          if (alternative.transcript) {
            transcript.push({
              text: alternative.transcript,
              offset: currentOffset,
              duration: 1000, // Default 1 second
            });
          }
        } else {
          // Process words with timing
          for (const word of alternative.words) {
            const startTime = word.startTime?.seconds || 0;
            const startNanos = word.startTime?.nanos || 0;
            const endTime = word.endTime?.seconds || 0;
            const endNanos = word.endTime?.nanos || 0;

            const offset = startTime * 1000 + Math.floor(startNanos / 1000000);
            const endOffset = endTime * 1000 + Math.floor(endNanos / 1000000);
            const duration = Math.max(endOffset - offset, 100);

            transcript.push({
              text: word.word,
              offset,
              duration,
            });
          }
        }
      }
    }

    // Clean up temp file
    try {
      await fs.unlink(audioFilePath);
    } catch {
      // File already deleted or doesn't exist
    }

    if (transcript.length === 0) {
      throw new Error('No speech detected in audio');
    }

    return transcript;
  } catch (error) {
    // Clean up temp file on error
    try {
      await fs.unlink(audioFilePath);
    } catch {
      // Ignore cleanup errors
    }
    throw new Error(`Speech-to-text transcription failed: ${error.message}`);
  }
};

const generateTranscriptWithFallback = async (url) => {
  // First, try to get YouTube captions
  try {
    return await fetchPreferredTranscript(url);
  } catch (youtubeError) {
    // If YouTube captions are disabled and we have Google Cloud configured, try STT
    if (speechClient) {
      try {
        console.log('YouTube captions unavailable. Attempting audio transcription...');
        const audioPath = await downloadYouTubeAudio(url);
        return await transcribeAudioWithGoogleCloud(audioPath);
      } catch (sttError) {
        // If STT also fails, throw the original YouTube error for better UX
        throw youtubeError;
      }
    } else {
      // No fallback available
      throw youtubeError;
    }
  }
};

const handleAnalyze = async (requestUrl, response) => {
  const sourceUrl = requestUrl.searchParams.get('url');

  if (!sourceUrl) {
    sendJson(response, 400, { error: 'Missing YouTube URL.' });
    return;
  }

  const videoId = extractYouTubeVideoId(sourceUrl);

  if (!videoId) {
    sendJson(response, 400, { error: 'Invalid YouTube URL.' });
    return;
  }

  try {
    const [metadata, transcript] = await Promise.all([
      fetchYouTubeMetadata(sourceUrl),
      generateTranscriptWithFallback(sourceUrl),
    ]);

    if (!Array.isArray(transcript) || transcript.length === 0) {
      throw new Error('No transcript available for this video.');
    }

    const analysis = buildVideoAnalysis({
      url: sourceUrl,
      metadata,
      transcript,
    });

    sendJson(response, 200, { analysis });
  } catch (error) {
    sendJson(response, 500, {
      error:
        error instanceof Error
          ? error.message
          : 'YouTube analysis failed. Please try another public video with captions.',
    });
  }
};

const serveStaticAsset = async (pathname, response) => {
  const safePath = pathname === '/' ? '/index.html' : pathname;
  const filePath = path.join(distDir, safePath);
  const resolvedPath = path.resolve(filePath);

  if (!resolvedPath.startsWith(distDir) || !existsSync(resolvedPath)) {
    return false;
  }

  const extension = path.extname(resolvedPath);
  response.writeHead(200, {
    'Content-Type': MIME_TYPES[extension] || 'application/octet-stream',
    'Access-Control-Allow-Origin': '*',
  });
  createReadStream(resolvedPath).pipe(response);
  return true;
};

const serveIndex = async (response) => {
  const indexPath = path.join(distDir, 'index.html');
  const html = await fs.readFile(indexPath);

  response.writeHead(200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  });
  response.end(html);
};

const server = http.createServer(async (request, response) => {
  const requestUrl = new URL(request.url, `http://${request.headers.host}`);

  if (requestUrl.pathname === '/api/health') {
    sendJson(response, 200, { ok: true });
    return;
  }

  // LLM Chat Endpoints
  if (request.method === 'POST' && requestUrl.pathname === '/api/chat/knowledge') {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      handleKnowledgeChat(body, response);
    });
    return;
  }

  if (request.method === 'POST' && requestUrl.pathname === '/api/chat/code') {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      handleCodeAnalysis(body, response);
    });
    return;
  }

  if (request.method === 'POST' && requestUrl.pathname === '/api/quiz/generate') {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      handleQuizGeneration(body, response);
    });
    return;
  }

  if (request.method === 'POST' && requestUrl.pathname === '/api/video/chat') {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
    });
    request.on('end', () => {
      handleVideoChat(body, response);
    });
    return;
  }

  if (request.method === 'GET' && requestUrl.pathname === '/api/youtube/analyze') {
    await handleAnalyze(requestUrl, response);
    return;
  }

  if (process.env.NODE_ENV === 'production') {
    const served = await serveStaticAsset(requestUrl.pathname, response);

    if (served) {
      return;
    }

    await serveIndex(response);
    return;
  }

  sendJson(response, 404, { error: 'Not found.' });
});

server.on('error', (error) => {
  if (error && error.code === 'EADDRINUSE') {
    console.error(
      `Port ${PORT} is already in use. Set PORT to another value or use "npm run dev" to auto-select an open port.`,
    );
    process.exit(1);
    return;
  }

  console.error(error);
  process.exit(1);
});

server.listen(PORT, () => {
  console.log(`SOLO TUTOR API ready on http://localhost:${PORT}`);
});
