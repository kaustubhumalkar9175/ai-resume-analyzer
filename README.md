# 🤖 AI Resume Analyzer

An AI-powered resume analysis application that evaluates resumes against a selected target job role.

## 🚀 Features

- PDF resume upload
- PDF text extraction
- AI-powered resume analysis
- ATS score
- Keyword score
- Skills match score
- Technical skills detection
- Soft skills detection
- Resume strengths
- Missing skills
- Missing ATS keywords
- Job role suitability
- AI-powered improvement suggestions
- Overall resume assessment

## 🛠️ Tech Stack

### Frontend

- HTML5
- CSS3
- JavaScript
- PDF.js

### Backend

- Python
- FastAPI
- Pydantic
- pypdf

### AI

- Google Gemini API

## 🏗️ Architecture

Frontend → FastAPI → PDF Extraction → Gemini AI → JSON Analysis → Frontend

## 📁 Project Structure

```text
ai-resume-analyzer/
├── backend/
│   ├── main.py
│   ├── requirements.txt
│   └── .env
│
├── frontend/
│   ├── index.html
│   ├── script.js
│   └── style.css
│
├── .env.example
├── .gitignore
└── README.md