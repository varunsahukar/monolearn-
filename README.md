# SOLO TUTOR (LearnVault)

An AI-powered personal learning OS for 2026. SOLO TUTOR is a local-first interactive prototype focused on deep work, premium knowledge tooling, and live video transcript intelligence.

## Features

- **Neural Vault**: Secure, local storage for all your study materials (PDFs, Videos, Code).
- **Knowledge Chat**: Context-aware AI tutor with RAG-style citations.
- **Video Intelligence**: AI-generated timestamped summaries and insights from educational videos.
- **Code Mentor**: Real-time code analysis, debugging, and neural fixes.
- **Adaptive Quiz Lab**: Personalized testing based on your vault content to master any subject.
- **Global Neural Tutor**: A persistent AI assistant that cross-references your entire knowledge base.

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS v4
- **Backend**: Python, FastAPI
- **LLM API**: Hugging Face
- **Icons**: Lucide React
- **Animations**: Tailwind CSS Animate
- **Persistence**: Local browser storage (localStorage/IndexedDB)
- **Theme**: "Black Claude" (High-contrast, focused aesthetic)

## Privacy & Security

Solo Tutor operates on a local-first philosophy. Vault data stays in local browser storage, while features like YouTube transcript analysis make live external requests only when you trigger them.

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/varunsahukar/monolearn-.git
cd monolearn-
```

### 2. Set Up Environment Variables

- Create a `.env` file in the root of the project.
- Add your Hugging Face API key to the `.env` file:
  ```
  HUGGINGFACE_API_KEY='your_hugging_face_api_key'
  ```

### 3. Backend Setup (Python/FastAPI)

- Navigate to the Python server directory:
  ```bash
  cd server_py
  ```
- Install the required Python packages:
  ```bash
  pip install -r requirements.txt
  ```
- Start the FastAPI server:
  ```bash
  uvicorn main:app --reload --port 8787
  ```
  The backend will be running at `http://localhost:8787`.

### 4. Frontend Setup (React/Vite)

- In a new terminal, from the project root, install the npm dependencies:
  ```bash
  npm install
  ```
- Start the Vite development server:
  ```bash
  npm run dev
  ```
  The frontend will be running at `http://localhost:5173` (or another port if 5173 is busy).

### 5. Launch the App

- Open your browser and navigate to the frontend URL (e.g., `http://localhost:5173`).
- Launch the Neural Vault and start building your knowledge base.

---

Built with for the next generation of learners.
