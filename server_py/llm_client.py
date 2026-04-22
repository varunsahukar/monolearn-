import os
from transformers import pipeline

def get_llm_response(prompt: str):
    """
    Generates a response to a prompt using a local transformer model.
    """
    try:
        generator = pipeline('text-generation', model='gpt2')
        result = generator(prompt, max_length=100, num_return_sequences=1)
        if result and isinstance(result, list) and "generated_text" in result[0]:
            return result[0]["generated_text"]
        else:
            raise ValueError(f"Unexpected response format from LLM: {result}")
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
    transcript_text = " 0".join([block.get("text", "") for block in transcript])
    prompt = f"""Summarize the key points of the following video transcript:

{transcript_text}"""
    return await get_llm_response(prompt)