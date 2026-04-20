import os
import httpx
import json
from huggingface_hub import InferenceClient

def get_huggingface_api_key():
    return os.environ.get('HUGGINGFACE_API_KEY', '')

async def get_llm_response(prompt: str, max_tokens: int = 1000):
    HUGGINGFACE_API_KEY = get_huggingface_api_key()
    if not HUGGINGFACE_API_KEY:
        raise ValueError('HUGGINGFACE_API_KEY not configured')

    client = InferenceClient(token=HUGGINGFACE_API_KEY)
    try:
        response = client.text_generation(
            prompt=prompt,
            model="mistralai/Mistral-7B-Instruct-v0.1",
            max_new_tokens=max_tokens,
        )
        return response
    except Exception as e:
        print(f'LLM error: {e}')
        raise

async def generate_knowledge_chat_response(query: str, context_docs: list | None = None):
    if context_docs is None:
        context_docs = []
    context_text = "\n\n".join(
        [f'<document name="{doc.get("name")}" type="{doc.get("type")}">\n{doc.get("content")}\n</document>' for doc in context_docs]
    )
    prompt = f"""You are an expert tutor. Answer the following question based on the provided materials.
If information from the materials is relevant, explicitly cite which material(s) you're using.

Materials:
{context_text}

Student question: {query}

Provide a clear, comprehensive answer with specific references to the materials where applicable."""
    return await get_llm_response(prompt, 1500)

async def analyze_code(code: str, language: str = 'python', analysis_type: str = 'bugs'):
    type_prompts = {
        'explain': f'Explain what this {language} code does in simple terms. Break it down line by line.',
        'bugs': f'Identify potential bugs, logic errors, or performance issues in this {language} code. List each issue with severity (high/medium/low).',
        'improve': f'Suggest optimizations and improvements for this {language} code. Include time/space complexity analysis.',
        'comments': f'Generate meaningful, clear comments for this {language} code. Follow best practices for the language.',
    }
    prompt = f"""{type_prompts.get(analysis_type, type_prompts['explain'])}

```{language}
{code}
```

Provide actionable, specific feedback."""
    return await get_llm_response(prompt, 2000)

async def generate_quiz_questions(context: str, count: int = 5, difficulty: str = 'medium', topic: str = ''):
    topic_prompt = f'Focus on the topic of: {topic}' if topic else ''
    prompt = f"""Generate {count} multiple-choice questions at {difficulty} difficulty level based on the following material.
{topic_prompt}

Material:
{context}

Return a JSON array with this structure:
[
  {{
    "question": "Question text?",
    "options": ["A", "B", "C", "D"],
    "correct": 0,
    "explanation": "Why this is correct"
  }}
]

Return ONLY the JSON array, no other text."""
    response = await get_llm_response(prompt, 3000)
    try:
        return json.loads(response)
    except json.JSONDecodeError:
        return [
            {
                'question': 'Failed to generate questions',
                'options': ['Error'],
                'correct': 0,
                'explanation': response,
            }
        ]

async def answer_video_question(transcript: list, question: str):
    transcript_text = " ".join([f'[{block.get("offset")}ms] {block.get("text")}' for block in transcript])
    prompt = f"""Based on this video transcript, answer the following question:

Transcript:
{transcript_text}

Question: {question}

Provide a clear, concise answer with timestamps if relevant."""
    answer = await get_llm_response(prompt, 1500)
    return {
        'answer': answer,
        'questionAsked': question,
        'timestamp': '2026-04-20T00:00:00Z',
    }