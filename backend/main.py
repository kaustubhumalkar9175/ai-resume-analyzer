from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from dotenv import load_dotenv
from google import genai
from google.genai import types

from pydantic import BaseModel, Field

from pypdf import PdfReader

import os
import io


# =========================================================
# ENVIRONMENT
# =========================================================

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")

if not API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is missing from environment variables."
    )


# =========================================================
# CONFIGURATION
# =========================================================

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB

ALLOWED_ROLES = {
    "Software Developer",
    "Frontend Developer",
    "React Developer",
    "Full Stack Developer",
    "Backend Developer",
    "Python Developer",
    "Data Analyst",
    "Machine Learning Engineer",
    "AI Engineer",
}


# =========================================================
# GEMINI CLIENT
# =========================================================

client = genai.Client(
    api_key=API_KEY
)


# =========================================================
# FASTAPI
# =========================================================

app = FastAPI(
    title="AI Resume Analyzer API",
    description="AI-powered resume analysis API using Gemini",
    version="1.0.0"
)


# =========================================================
# CORS
# =========================================================

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://127.0.0.1:5500"
)

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        FRONTEND_URL
    ],

    allow_credentials=False,

    allow_methods=[
        "GET",
        "POST"
    ],

    allow_headers=[
        "Content-Type"
    ],
)


# =========================================================
# RESPONSE SCHEMA
# =========================================================

class JobRoleMatch(BaseModel):

    role: str

    match_percentage: int = Field(
        ge=0,
        le=100
    )

    explanation: str


class ResumeAnalysis(BaseModel):

    ats_score: int = Field(
        ge=0,
        le=100
    )

    keyword_score: int = Field(
        ge=0,
        le=100
    )

    skills_match_score: int = Field(
        ge=0,
        le=100
    )

    technical_skills: list[str]

    soft_skills: list[str]

    strengths: list[str]

    missing_skills: list[str]

    missing_keywords: list[str]

    job_role_match: JobRoleMatch

    suggestions: list[str]

    overall_summary: str


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():

    return {
        "success": True,
        "message": "AI Resume Analyzer Backend is running."
    }


# =========================================================
# HEALTH CHECK
# =========================================================

@app.get("/health")
def health():

    return {
        "status": "healthy"
    }


# =========================================================
# ANALYZE RESUME
# =========================================================

@app.post("/analyze")
async def analyze_resume(

    file: UploadFile = File(...),

    target_role: str = Form(
        "Software Developer"
    )

):

    try:

        # =================================================
        # 1. VALIDATE TARGET ROLE
        # =================================================

        if target_role not in ALLOWED_ROLES:

            raise HTTPException(
                status_code=400,
                detail="Invalid target job role."
            )


        # =================================================
        # 2. VALIDATE FILE NAME
        # =================================================

        filename = file.filename or ""

        if not filename.lower().endswith(".pdf"):

            raise HTTPException(
                status_code=400,
                detail="Only PDF files are allowed."
            )


        # =================================================
        # 3. VALIDATE CONTENT TYPE
        # =================================================

        if file.content_type != "application/pdf":

            raise HTTPException(
                status_code=400,
                detail="Invalid file type. Please upload a PDF."
            )


        # =================================================
        # 4. READ FILE WITH SIZE LIMIT
        # =================================================

        file_data = await file.read(
            MAX_FILE_SIZE + 1
        )


        # =================================================
        # 5. CHECK FILE SIZE
        # =================================================

        if len(file_data) > MAX_FILE_SIZE:

            raise HTTPException(
                status_code=413,
                detail="File is too large. Maximum size is 10 MB."
            )


        # =================================================
        # 6. CHECK PDF SIGNATURE
        # =================================================

        if not file_data.startswith(b"%PDF"):

            raise HTTPException(
                status_code=400,
                detail="The uploaded file is not a valid PDF."
            )


        # =================================================
        # 7. READ PDF
        # =================================================

        try:

            pdf = PdfReader(
                io.BytesIO(file_data)
            )

        except Exception:

            raise HTTPException(
                status_code=400,
                detail="Could not read this PDF."
            )


        # =================================================
        # 8. EXTRACT TEXT
        # =================================================

        resume_text_parts = []

        for page in pdf.pages:

            page_text = page.extract_text()

            if page_text:

                resume_text_parts.append(
                    page_text
                )


        resume_text = "\n".join(
            resume_text_parts
        ).strip()


        # =================================================
        # 9. CHECK TEXT
        # =================================================

        if not resume_text:

            raise HTTPException(
                status_code=400,
                detail=(
                    "Could not extract readable text "
                    "from this PDF. If this is a scanned "
                    "resume, OCR support will be required."
                )
            )


        # =================================================
        # 10. LIMIT TEXT SIZE
        # =================================================

        # Prevent unnecessarily huge prompts.

        MAX_TEXT_LENGTH = 30000

        resume_text = resume_text[
            :MAX_TEXT_LENGTH
        ]


        # =================================================
        # 11. AI PROMPT
        # =================================================

        prompt = f"""
You are an expert resume analyzer,
ATS evaluator and technical career advisor.

Analyze the resume for the target job role:

TARGET ROLE:
{target_role}

RESUME:
{resume_text}

Evaluate:

1. ATS compatibility
2. Keyword relevance
3. Skills match
4. Technical skills
5. Soft skills
6. Resume strengths
7. Missing skills
8. Missing ATS keywords
9. Job role suitability
10. Resume improvement suggestions
11. Overall assessment

SCORING:

ATS SCORE:
Evaluate resume structure, clarity,
ATS friendliness, experience relevance
and keyword usage.

KEYWORD SCORE:
Evaluate how well the resume contains
keywords relevant to the target role.

SKILLS MATCH SCORE:
Evaluate how well the candidate's skills
match the target role.

JOB ROLE MATCH:
Return a percentage from 0 to 100.

Be realistic.

Do not invent skills that are not supported
by the resume.

Suggestions should be practical and specific.
"""


        # =================================================
        # 12. GEMINI
        # =================================================

        response = client.models.generate_content(

            model="gemini-3.6-flash",

            contents=prompt,

            config=types.GenerateContentConfig(

                response_mime_type="application/json",

                response_schema=ResumeAnalysis,

                temperature=0.2,

            )
        )


        # =================================================
        # 13. GET STRUCTURED RESPONSE
        # =================================================

        if not response.text:

            raise RuntimeError(
                "Gemini returned an empty response."
            )


        # =================================================
        # 14. PARSE RESPONSE
        # =================================================

        analysis = ResumeAnalysis.model_validate_json(
            response.text
        )


        # =================================================
        # 15. RETURN
        # =================================================

        return {

            "success": True,

            "target_role": target_role,

            "analysis": analysis.model_dump()

        }


    # =====================================================
    # EXPECTED HTTP ERRORS
    # =====================================================

    except HTTPException:

        raise


    # =====================================================
    # GEMINI / OTHER ERRORS
    # =====================================================

    except Exception as error:

        print(
            "Resume analysis error:",
            repr(error)
        )

        return {

            "success": False,

            "error": (
                "Unable to analyze the resume right now. "
                "Please try again later."
            )

        }