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
   
    # Run the Flask app
    app.run(debug=True)
