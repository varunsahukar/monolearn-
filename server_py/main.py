import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import json
from datetime import datetime
from .llm_client import get_llm_response

# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=dotenv_path)


# Diagnostic check for Grok API key
if grok_api_key := os.environ.get("GROK_API_KEY"):
    print("✅ Grok API key is configured.")
else:
    print("❌ Grok API key is NOT configured. Please set GROK_API_KEY in your environment.")
    print("ℹ️  The system will fall back to local GPT-2 model if Grok API is unavailable.")


app = FastAPI()


# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://monolearn.vercel.app", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/api/health")
async def health_check():
    print("Health check endpoint called")
    return {"ok": True}


# Knowledge chat endpoint
@app.post("/api/chat/knowledge")
async def knowledge_chat(request: Request):
            try:
                body = await request.json()
                query = body.get("query")
                context = body.get("context", [])

                if not query:
                    return {"error": "Missing query parameter"}

                context_str = "\n".join([f"- {c.get('name')}: {c.get('content', '')}" for c in context])
                prompt = f"Answer the following question based on the provided context:\n\nContext:\n{context_str}\n\nQuestion: {query}"
                answer = get_llm_response(prompt)

                return {
                    "answer": answer,
                    "context": [{"name": c.get("name"), "type": c.get("type")} for c in context],
                    "timestamp": datetime.now().isoformat()
                }
            except Exception as e:
                return {"error": f"Knowledge chat failed: {str(e)}"}


@app.post("/api/llm/chat")
async def llm_chat(request: Request):
    try:
        body = await request.json()
        prompt = body.get("prompt")
        if not prompt:
            return {"error": "Missing prompt parameter"}
        response = get_llm_response(prompt)
        return {"response": response}
    except Exception as e:
        return {"error": f"LLM chat failed: {e}"}


@app.get("/api/test-llm")
def test_llm():
    try:
        response = get_llm_response("Hello, world!")
        return {"response": response}
    except Exception as e:
        return {"error": f"LLM test failed: {str(e)}"}


@app.post("/api/code/analyze")
async def code_analysis(request: Request):
    try:
        body = await request.json()
        code = body.get("code")
        if not code:
            return {"error": "Missing code parameter"}
        prompt = f"Analyze the following code:\n\n{code}"
        response = get_llm_response(prompt)
        return {"response": response}
    except Exception as e:
        return {"error": f"Code analysis failed: {str(e)}"}


@app.post("/api/video/summarize")
async def video_summarization(request: Request):
    try:
        body = await request.json()
        transcript = body.get("transcript")
        if not transcript:
            return {"error": "Missing transcript parameter"}
        prompt = f"Summarize the following video transcript:\n\n{transcript}"
        response = get_llm_response(prompt)
        return {"response": response}
    except Exception as e:
        return {"error": f"Video summarization failed: {str(e)}"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8787))
    uvicorn.run(app, host="0.0.0.0", port=port)