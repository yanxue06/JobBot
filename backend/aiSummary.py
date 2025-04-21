import os
from typing import List
from openai import OpenAI
import dotenv
import json

dotenv.load_dotenv()

# initialize OpenRouter client (Gemini models)
client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=os.getenv("OPENROUTER_API_KEY"),
)

SYSTEM = {
    "role": "system",
    "content": (
        "You are an expert recruiter.  When you answer, respond only with "
        "a single JSON object (no surrounding text) with exactly these keys: "
        "`title`, `company`, `requirements`, `responsibilities`, "
        "`keywords`, `location`, `salary`.  Each key must map to a string "
        "(for title/company/location/salary) or an array of strings "
        "(for requirements/responsibilities/keywords)."
    )
}


def stream_ai_summary(job_description: str) -> str:
    """
    Ask Gemini to distill a job description down to its key points.
    Returns the plain‐text summary.
    """

    USER = {
        "role": "user",
        "content": (
            "Here is the job description to analyze:\n\n"
            f"{job_description}"
        )
    }
    
    response = client.chat.completions.create(
        model="google/gemini-2.0-flash-lite-001",
        messages=[
            SYSTEM,
            USER,
        ],
        stream=True,
    )
    

    return response # iterable of chunks


def get_ai_resume_suggestions(
    job_details,
    resume_text
) -> dict:
    """
    Given a job description and a candidate's resume text,
    return structured, categorized suggestions for improving the resume
    along with matched and missing keywords.
    """
    # Create a more structured system prompt
    system_prompt = """
    You are an expert resume consultant and job application coach. Analyze the resume 
    against the job details and provide structured feedback in JSON format.
    
    Your response MUST be a valid JSON object with the following structure:
    {
      "compatibilityScore": <number 0-100>,
      "missingKeywords": [<array of important keywords from job not found in resume>],
      "matchedKeywords": [<array of important keywords found in both>],
      "suggestions": [
        {
          "category": "<category name>",
          "suggestions": [<array of specific suggestions>]
        },
        ...more categories
      ]
    }
    
    Categories should include at least:
    - "Skills & Keywords" (technical and soft skills suggestions)
    - "Experience & Achievements" (how to better present experience)
    - "Resume Structure & Formatting" (organization suggestions)
    
    Each suggestion should be specific, actionable, and directly tied to the job requirements.
    """
    
    # Extract key details from job details JSON
    title = job_details.get('title', '')
    company = job_details.get('company', '')
    requirements = job_details.get('requirements', [])
    responsibilities = job_details.get('responsibilities', [])
    keywords = job_details.get('keywords', [])
    
    # Create a more specific user prompt with the job details
    user_prompt = f"""
    JOB DETAILS:
    Title: {title}
    Company: {company}
    
    Requirements:
    {", ".join(requirements) if requirements else "Not specified"}
    
    Responsibilities:
    {", ".join(responsibilities) if responsibilities else "Not specified"}
    
    Key Skills/Keywords:
    {", ".join(keywords) if keywords else "Not specified"}
    
    CANDIDATE'S RESUME:
    {resume_text}
    
    Please analyze how well this resume matches the job requirements and provide specific, 
    actionable suggestions to improve it. Format your response ONLY as the JSON structure specified.
    """

    response = client.chat.completions.create(
        model="google/gemini-2.0-flash-lite-001",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        response_format={ "type": "json_object" },
    )

    # Parse the response
    try:
        result_text = response.choices[0].message.content.strip()
        result = json.loads(result_text)
        print(f"AI Resume Analysis: {result}")
        return result
    except json.JSONDecodeError:
        # Fallback in case of parsing error
        text = response.choices[0].message.content.strip()
        print(f"Error parsing JSON from AI. Raw response: {text}")
        
        # Return a basic structure with just the suggestions as plain text
        fallback_suggestions = [
            line.lstrip("–- ").strip()
            for line in text.splitlines()
            if line.strip().startswith(("•", "-", "–"))
        ]
        
        # If no bullet points were found, split by newlines
        if not fallback_suggestions:
            fallback_suggestions = [s.strip() for s in text.split("\n") if s.strip()]
        
        return {
            "compatibilityScore": 50,
            "missingKeywords": [],
            "matchedKeywords": [],
            "suggestions": [
                {
                    "category": "General Improvements",
                    "suggestions": fallback_suggestions
                }
            ]
        }
