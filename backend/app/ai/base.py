from openai import AsyncOpenAI
from app.config import settings


class AIBase:
    def __init__(self, api_key: str = settings.OPENAI_API_KEY):
        self.client = AsyncOpenAI(api_key=api_key)

    async def generate_completion(
        self,
        prompt: str,
        model: str = "gpt-4-turbo-preview",
        max_tokens: int = 1000,
        temperature: float = 0.7,
    ) -> str:
        response = await self.client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
            temperature=temperature,
        )
        return response.choices[0].message.content or ""


ai_service = AIBase()
