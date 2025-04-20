import os
from typing import List
from openai import OpenAI
import dotenv

dotenv.load_dotenv()

# initialize OpenRouter client (Gemini models)
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

def stream_ai_summary(job_description: str) -> str:
    """
    Ask Gemini to distill a job description down to its key points.
    Returns the plain‐text summary.
    """
    response = client.chat.completions.create(
        model="google/gemini-2.0-flash-lite-001",
        messages=[
            {"role": "system", "content": "You are an expert recruiter."},
            {"role": "user", "content": (
                "Please summarize the following job description into a few concise "
                "sentences highlighting title, key responsibilities, requirements, "
                "location, and salary if present:\n\n"
                f"{job_description}"
            )},
        ],
        stream=True,
    )
    return response # iterable of chunks


def get_ai_resume_suggestions(
    job_description: str,
    resume_text: str
) -> List[str]:
    """
    Given a job description and a candidate's resume text,
    return a list of bullet‐pointed, actionable suggestions
    for optimizing the resume to that specific role.
    """
    prompt = (
        f"Job Description:\n{job_description}\n\n"
        f"Current Resume:\n{resume_text}\n\n"
        "Please provide 5–8 clear, bullet‐pointed suggestions for how "
        "the candidate could tweak or add to their resume to match this role. "
        "Be specific (e.g. emphasize X skill, rephrase Y bullet to highlight Z)."
    )

    response = client.chat.completions.create(
        model="gemini-2.0-flash-lite",
        messages=[
            {"role": "system", "content": "You are a professional career coach."},
            {"role": "user", "content": prompt},
        ],
    )

    # split the returned text into a list of suggestions
    text = response.choices[0].message.content.strip()
    suggestions = [
        line.lstrip("–- ").strip()
        for line in text.splitlines()
        if line.strip().startswith(("•", "-", "–"))
    ]
    # fallback if bullets weren't detected
    if not suggestions:
        suggestions = [s.strip() for s in text.split("\n") if s.strip()]

    return suggestions
