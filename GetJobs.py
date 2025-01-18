# Import necessary libraries
from flask import Flask, request, jsonify  # For the backend API
import pandas as pd  # For processing and storing job data
import requests  # For fetching job data from APIs
import openai  # For AI-driven résumé suggestions

# Flask app initialization
app = Flask(__name__)

###############################
# 1. Job Scraping Layer (via API)
###############################
def fetch_jobs(api_url, app_id, app_key, query, location):
    """
    Fetch jobs from a job API (e.g., Adzuna).
    Args:
        api_url (str): The API endpoint URL.
        app_id (str): The application ID for authentication.
        app_key (str): The application key for authentication.
        query (str): Job title or keywords to search for.
        location (str): Location for the job search.
    Returns:
        dict: JSON response containing job data.
    """
    params = {
        'app_id': app_id,
        'app_key': app_key,
        'what': query,  # Job title/keywords
        'where': location,  # Job location
        'results_per_page': 50,  # Number of jobs per request
        'content-type': 'application/json'
    }
    response = requests.get(api_url, params=params)
    if response.status_code == 200:
        return response.json()  # Return job data as a JSON object
    else:
        print(f"Error: {response.status_code}, {response.text}")
        return None

###############################
# 2. Data Processing & Storage
###############################
def process_and_save(jobs, output_file="jobs.csv"):
    """
    Processes and saves job data into a CSV file.
    Args:
        jobs (dict): The JSON object containing job data.
        output_file (str): The name of the output CSV file.
    """
    # Convert jobs to a DataFrame for easier processing
    df = pd.DataFrame(jobs.get("results", []))

    # Select only relevant columns
    selected_columns = ["title", "company", "location", "description", "redirect_url"]
    df = df[selected_columns]

    # Save the processed DataFrame to a CSV file
    df.to_csv(output_file, index=False)
    print(f"Saved {len(df)} jobs to {output_file}")

###############################
# 3. NLP/AI Layer
###############################
def generate_resume_recommendations(api_key, resume, job_description):
    """
    Uses OpenAI's GPT API to generate résumé suggestions.
    Args:
        api_key (str): Your OpenAI API key.
        resume (str): The user's current résumé text.
        job_description (str): Job description text to tailor the résumé to.
    Returns:
        str: AI-generated résumé suggestions.
    """
    openai.api_key = api_key

    # Prompt the AI model with a résumé and job description
    prompt = f"""
    Your task is to review the following résumé and job description. Suggest tailored bullet points or edits to better align the résumé with the job description.

    Résumé:
    {resume}

    Job Description:
    {job_description}

    Suggestions:
    """

    # Make the API call to OpenAI
    response = openai.Completion.create(
        engine="text-davinci-003",
        prompt=prompt,
        max_tokens=5,
        temperature=0.7
    )

    # Extract and return the generated suggestions
    return response.choices[0].text.strip()

###############################
# 4. Flask API Endpoints
###############################

# Endpoint to fetch job data
@app.route("/jobs", methods=["GET"])
def get_jobs():
    """
    Reads and returns job data from the saved CSV file.
    """
    df = pd.read_csv("jobs.csv")
    return jsonify(df.to_dict(orient="records"))

# Endpoint to generate résumé suggestions
@app.route("/generate", methods=["POST"])
def generate():
    """
    Takes in résumé and job description, and returns AI-generated suggestions.
    """
    data = request.json  # Get JSON input from the client
    resume = data.get("resume")  # Extract the résumé text
    job_description = data.get("job_description")  # Extract the job description text

    # Call the NLP function to generate suggestions
    suggestions = generate_resume_recommendations(api_key="your_openai_api_key", resume=resume, job_description=job_description)
    return jsonify({"suggestions": suggestions})

###############################
# Main Application Runner
###############################
if __name__ == "__main__":
    # Test fetching and processing job data
    api_url = "https://api.adzuna.com/v1/api/jobs/us/search/1"  # Replace with your API endpoint
    app_id = "your_adzuna_app_id"
    app_key = "your_adzuna_app_key"
    query = "software developer"
    location = "remote"

    # Fetch jobs using the API
    jobs = fetch_jobs(api_url, app_id, app_key, query, location)
    if jobs:
        # Process and save the job data
        process_and_save(jobs)

    # Run the Flask app
    app.run(debug=True)
