import os
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import json
from .llm_client import (
    generate_knowledge_chat_response,
    analyze_code,
    generate_quiz_questions,
    answer_video_question,
)
#
dotenv_path = os.path.join(os.path.dirname(__file__), '..', '.env')
load_dotenv(dotenv_path=dotenv_path)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/health")
async def health_check():
    return {"ok": True}

@app.post("/api/chat/knowledge")
async def knowledge_chat(request: Request):
    try:
        body = await request.json()
        query = body.get("query")
        context = body.get("context", [])

        if not query:
            raise HTTPException(status_code=400, detail="Missing query parameter")

        answer = await generate_knowledge_chat_response(query, context)
        return {
            "answer": answer,
            "context": [{"name": c.get("name"), "type": c.get("type")} for c in context],
            "timestamp": "2026-04-20T00:00:00Z"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Knowledge chat failed: {str(e)}") from e

@app.post("/api/chat/code")
async def code_analysis(request: Request):
    try:
        body = await request.json()
        code = body.get("code")
        language = body.get("language", "python")
        analysis_type = body.get("analysisType", "bugs")

        if not code:
            raise HTTPException(status_code=400, detail="Missing code parameter")

        analysis = await analyze_code(code, language, analysis_type)
        return {
            "code": f'{code[:200]}...',
            "language": language,
            "analysisType": analysis_type,
            "analysis": analysis,
            "timestamp": "2026-04-20T00:00:00Z"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Code analysis failed: {str(e)}") from e

@app.post("/api/quiz/generate")
async def quiz_generation(request: Request):
    try:
        body = await request.json()
        context = body.get("context", "")
        count = body.get("count", 5)
        difficulty = body.get("difficulty", "medium")
        topic = body.get("topic", "")

        if not context:
            raise HTTPException(status_code=400, detail="Missing context parameter")

        questions = await generate_quiz_questions(context, count, difficulty, topic)
        return {
            "questions": questions,
            "count": len(questions),
            "difficulty": difficulty,
            "topic": topic,
            "timestamp": "2026-04-20T00:00:00Z"
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}") from e

@app.post("/api/video/chat")
async def video_chat(request: Request):
    try:
        body = await request.json()
        transcript = body.get("transcript", [])
        question = body.get("question")

        if not question or not transcript:
            raise HTTPException(status_code=400, detail="Missing question or transcript")

        result = await answer_video_question(transcript, question)
        result["transcriptLength"] = len(transcript)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Video chat failed: {str(e)}") from e

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8787))
    uvicorn.run(app, host="0.0.0.0", port=port)