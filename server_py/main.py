import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import json
from llm_client import get_llm_response


# Load environment variables
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=dotenv_path)


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
                answer = await get_llm_response(prompt)

                return {
                    "answer": answer,
                    "context": [{"name": c.get("name"), "type": c.get("type")} for c in context],
                    "timestamp": "2026-04-20T00:00:00Z"
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
        response = await get_llm_response(prompt)
        return {"response": response}
    except Exception as e:
        return {"error": f"LLM chat failed: {str(e)}"}


@app.post("/api/code/analyze")
async def code_analysis(request: Request):
    try:
        body = await request.json()
        code = body.get("code")
        if not code:
            return {"error": "Missing code parameter"}
        prompt = f"Analyze the following code:\n\n{code}"
        response = await get_llm_response(prompt)
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
        response = await get_llm_response(prompt)
        return {"response": response}
    except Exception as e:
        return {"error": f"Video summarization failed: {str(e)}"}


if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8787))
    uvicorn.run(app, host="0.0.0.0", port=port)