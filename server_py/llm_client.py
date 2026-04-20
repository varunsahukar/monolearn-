import os
import httpx

# Configuration for the Hugging Face Inference API
HF_API_URL = "https://api-inference.huggingface.co/models/google/gemma-7b"
HF_API_KEY = os.environ.get('HUGGINGFACE_API_KEY')

async def get_llm_response(prompt: str):
    """
    Sends a prompt to the Hugging Face Inference API and gets a response.
    """
    if not HF_API_KEY:
        raise ValueError('HUGGINGFACE_API_KEY not configured')

    headers = {
        "Authorization": f"Bearer {HF_API_KEY}",
        "Content-Type": "application/json",
    }
    payload = {"inputs": prompt}

    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(HF_API_URL, headers=headers, json=payload, timeout=30.0)
            response.raise_for_status()  # Raise an exception for bad status codes
            result = response.json()
            # Extract the generated text from the response
            if result and isinstance(result, list) and "generated_text" in result[0]:
                return result[0]["generated_text"]
            else:
                raise ValueError("Unexpected response format from LLM API")
        except httpx.HTTPStatusError as e:
            print(f"LLM API request failed with status {e.response.status_code}: {e.response.text}")
            raise
        except Exception as e:
            print(f'LLM error: {e}')
            raise

async def generate_chat_response(prompt: str):
    """
    Generates a direct response to a user's prompt.
    """
    # For a simple chat, we can directly use the user's prompt.
    # For more complex scenarios, you might add a system prompt here.
    return await get_llm_response(prompt)

async def analyze_code(code: str, language: str = 'python', analysis_type: str = 'bugs'):
    """
    Analyzes a code snippet for bugs, improvements, or explanations.
    """
    type_prompts = {
        'explain': f'Explain what this {language} code does in simple terms.',
        'bugs': f'Identify potential bugs or logic errors in this {language} code.',
        'improve': f'Suggest improvements for this {language} code.',
    }
    prompt = f"""{type_prompts.get(analysis_type, type_prompts['explain'])}

```{language}
{code}
```"""
    return await get_llm_response(prompt)

async def summarize_video(transcript: list):
    """
    Summarizes the content of a video based on its transcript.
    """
    transcript_text = " ".join([block.get("text", "") for block in transcript])
    prompt = f"""Summarize the key points of the following video transcript:

{transcript_text}"""
    return await get_llm_response(prompt)