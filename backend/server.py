from flask import Flask, request, jsonify, Response, send_file
from flask_cors import CORS
from aiSummary import stream_ai_summary, get_ai_resume_suggestions
import json 
import time
import re
import io
import os
import pandas as pd
import mammoth
from PyPDF2 import PdfReader
from scraper import scrape_job_posting  # Import the scraper function

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# In-memory storage for job data (for small-scale use)
saved_jobs = []

def save_job_data(job_data):
    """Save job data to the in-memory storage and return its ID"""
    job_id = len(saved_jobs)
    job_data['id'] = job_id
    job_data['timestamp'] = time.strftime("%Y-%m-%d %H:%M:%S")
    saved_jobs.append(job_data)
    return job_id

@app.route('/export_excel', methods=['GET'])
def export_excel():
    """Export saved job data as an Excel file"""
    try:
        # If there are no saved jobs, return an error
        if not saved_jobs:
            return jsonify({"error": "No job data available to export"}), 404
        
        # Create a DataFrame from the saved jobs
        df = pd.DataFrame(saved_jobs)
        
        # Ensure requirements, responsibilities, and keywords are formatted properly for Excel
        for col in ['requirements', 'responsibilities', 'keywords']:
            if col in df.columns:
                df[col] = df[col].apply(lambda x: "\n• " + "\n• ".join(x) if isinstance(x, list) else x)
        
        # Create an in-memory Excel file
        output = io.BytesIO()
        with pd.ExcelWriter(output, engine='xlsxwriter') as writer:
            df.to_excel(writer, sheet_name='Job Postings', index=False)
            
            # Auto-adjust column widths
            worksheet = writer.sheets['Job Postings']
            for i, col in enumerate(df.columns):
                # Set column width based on content
                max_width = max(df[col].astype(str).map(len).max(), len(col)) + 2
                worksheet.set_column(i, i, min(max_width, 50))  # Cap at 50 characters width
        
        output.seek(0)
        
        return send_file(
            output,
            mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            as_attachment=True,
            download_name='job_postings.xlsx'
        )
    except Exception as e:
        print(f"Error exporting Excel: {str(e)}")
        return jsonify({"error": f"Failed to export Excel: {str(e)}"}), 500

@app.route('/save_job', methods=['POST'])
def save_job():
    """Save job data for future export"""
    try:
        job_data = request.json
        if not job_data:
            return jsonify({"error": "No job data provided"}), 400
        
        job_id = save_job_data(job_data)
        return jsonify({"success": True, "message": "Job saved successfully", "job_id": job_id}), 201
    except Exception as e:
        print(f"Error saving job: {str(e)}")
        return jsonify({"error": f"Failed to save job: {str(e)}"}), 500

@app.route('/get_saved_jobs', methods=['GET'])
def get_saved_jobs():
    """Get all saved jobs"""
    return jsonify(saved_jobs), 200

@app.route('/analyze_job_posting', methods=['POST', 'GET'])
def analyze_job_posting():
    print("Analyzing job posting")
    description = None
    
    # Handle both POST JSON data and query parameters
    if request.method == 'POST' and request.is_json:
        data = request.json
        description = data.get('description')
    else:
        description = request.args.get('description') # this is the job description from the frontend
    
    if not description:
        return jsonify({'error': 'Description is required'}), 400
    
    def generate():
        summary = ""
        # Initial event to establish connection
        yield "data: {\"text\": \"Starting analysis...\", \"complete\": false}\n\n"
        time.sleep(0.1)  # Small delay to ensure client receives initial message
        
        try:
            ai_stream = stream_ai_summary(description)
            for chunk in ai_stream:
                if hasattr(chunk.choices[0].delta, 'content') and chunk.choices[0].delta.content:
                    delta = chunk.choices[0].delta.content
                    summary += delta
                    print(f"Streaming chunk: {delta}")
                    yield f"data: {json.dumps({'text': delta, 'complete': False})}\n\n"
                    time.sleep(0.01)  # Small delay to prevent overwhelming the client
            
            # Clean up the summary response to ensure proper JSON
            try:
                # Extract JSON object if embedded in text
                json_match = re.search(r'(\{.*\})', summary, re.DOTALL)
                if json_match:
                    json_str = json_match.group(1)
                    # Parse and re-serialize to ensure valid JSON
                    json_obj = json.loads(json_str)
                    clean_summary = json_obj
                else:
                    # If no JSON object found, try to parse the entire summary
                    clean_summary = json.loads(summary)
                
                # Ensure each required field exists
                for field in ['title', 'company', 'requirements', 'responsibilities', 'keywords', 'location', 'salary']:
                    if field not in clean_summary:
                        if field in ['requirements', 'responsibilities', 'keywords']:
                            clean_summary[field] = []
                        else:
                            clean_summary[field] = ""
                
                # Send final complete message with cleaned summary
                print(f"Stream complete, sending cleaned summary")
                yield f"data: {json.dumps({'text': '', 'summary': clean_summary, 'complete': True})}\n\n"
            except json.JSONDecodeError as je:
                print(f"Error parsing JSON from summary: {je}")
                print(f"Raw summary: {summary}")
                # Send raw summary as fallback
                yield f"data: {json.dumps({'text': '', 'summary': summary, 'complete': True})}\n\n"
                
        except Exception as e:
            print(f"Error streaming response: {str(e)}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return Response(generate(), content_type='text/event-stream', headers={
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
        'Connection': 'keep-alive'
    })

@app.route('/scrape_job_url', methods=['POST'])
def scrape_job_url():
    """
    Scrape a job posting URL and return structured data
    """
    try:
        data = request.json
        url = data.get('url')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        try:
            # First, make a simple validation check on the URL
            if not url.startswith(('http://', 'https://')):
                url = 'https://' + url
            
            print(f"Starting to scrape URL: {url}")
            
            # Try to scrape the job posting
            job_data = scrape_job_posting(url)
            print(f"Scraped job data: {job_data.keys()}")
            
            # Always enhance with Gemini API if we have a description
            if job_data.get("description"):
                print("Enhancing scraped data with Gemini API...")
                
                # Use Gemini to analyze the description
                ai_stream = stream_ai_summary(job_data["description"])
                summary = ""
                for chunk in ai_stream:
                    if hasattr(chunk.choices[0].delta, 'content') and chunk.choices[0].delta.content:
                        delta = chunk.choices[0].delta.content
                        summary += delta
                
                # Try to parse the AI-generated summary
                try:
                    # Extract JSON object if embedded in text
                    json_match = re.search(r'(\{.*\})', summary, re.DOTALL)
                    if json_match:
                        json_str = json_match.group(1)
                        ai_data = json.loads(json_str)
                    else:
                        ai_data = json.loads(summary)
                    
                    print("AI data from Gemini:", ai_data.keys() if isinstance(ai_data, dict) else "Not a dictionary")
                    
                    # Merge AI data with scraped data, but keep scraped data if it's already populated
                    if isinstance(ai_data, dict):
                        for key in ai_data:
                            # Only use AI data if the field is empty or minimal
                            if key in job_data:
                                if isinstance(job_data[key], list) and len(job_data[key]) == 0:
                                    # Empty lists (requirements, responsibilities, keywords)
                                    job_data[key] = ai_data[key]
                                elif isinstance(job_data[key], str) and (not job_data[key] or job_data[key] in ["Unknown Title", "Unknown Company", "Unknown Location", "Not specified"]):
                                    # Empty or default string values
                                    job_data[key] = ai_data[key]
                except Exception as e:
                    print(f"Error processing AI data: {str(e)}")
                    # If we can't get structured data from the AI, but still have an unstructured description,
                    # try one more time with a more explicit prompt
                    if not job_data["requirements"] or not job_data["responsibilities"]:
                        try:
                            print("Trying more explicit prompt for requirements/responsibilities...")
                            # Create a more explicit prompt
                            explicit_prompt = f"Extract the following information from this job posting:\n\n{job_data['description']}\n\nPlease return ONLY a JSON object with these keys: title, company, requirements (array), responsibilities (array), keywords (array), location, salary."
                            
                            # Call the AI again with this explicit prompt
                            from aiSummary import client
                            response = client.chat.completions.create(
                                model="google/gemini-2.0-flash-lite-001",
                                messages=[
                                    {"role": "system", "content": "You are an expert job posting analyzer."},
                                    {"role": "user", "content": explicit_prompt},
                                ],
                                response_format={"type": "json_object"},
                            )
                            
                            ai_json = json.loads(response.choices[0].message.content)
                            print("Got structured data from explicit prompt")
                            
                            # Fill in missing data
                            for key in ai_json:
                                if key in job_data:
                                    if isinstance(job_data[key], list) and len(job_data[key]) == 0:
                                        job_data[key] = ai_json[key]
                                    elif isinstance(job_data[key], str) and (not job_data[key] or job_data[key] in ["Unknown Title", "Unknown Company", "Unknown Location", "Not specified"]):
                                        job_data[key] = ai_json[key]
                        except Exception as e2:
                            print(f"Error in secondary AI attempt: {str(e2)}")
            
            # Final verification to ensure we have some minimum data
            if not job_data.get("requirements") or len(job_data["requirements"]) == 0:
                job_data["requirements"] = ["No specific requirements found. Please review the full job description."]
            
            if not job_data.get("responsibilities") or len(job_data["responsibilities"]) == 0:
                job_data["responsibilities"] = ["No specific responsibilities found. Please review the full job description."]
            
            if not job_data.get("keywords") or len(job_data["keywords"]) == 0:
                job_data["keywords"] = ["Skills", "Experience", "Communication"]
            
            # Add source URL to the job data
            job_data["url"] = url
            
            print("Job analysis complete, returning data")
            return jsonify(job_data), 200
        except Exception as scrape_error:
            print(f"Error during scraping process: {str(scrape_error)}")
            
            # Try a direct Gemini analysis as a last resort
            try:
                from aiSummary import client
                
                print("Attempting direct URL analysis with Gemini")
                response = client.chat.completions.create(
                    model="google/gemini-2.0-flash-lite-001",
                    messages=[
                        {"role": "system", "content": "You are an expert job posting analyzer."},
                        {"role": "user", "content": f"Analyze this job posting URL: {url}\n\nExtract and return a JSON object with these keys: title, company, requirements (array), responsibilities (array), keywords (array), location, salary. If you can't access the URL directly, make educated guesses based on the URL itself."},
                    ],
                    response_format={"type": "json_object"},
                )
                
                result = json.loads(response.choices[0].message.content)
                # Add source URL to the result
                result["url"] = url
                print("Successfully got direct analysis from Gemini")
                return jsonify(result), 200
            except Exception as ai_error:
                print(f"Final fallback also failed: {str(ai_error)}")
                return jsonify({
                    'error': f'Failed to scrape job posting: {str(scrape_error)}. Additional error: {str(ai_error)}'
                }), 500
    except Exception as e:
        print(f"Unhandled error in scrape_job_url endpoint: {str(e)}")
        return jsonify({'error': f'An unexpected error occurred: {str(e)}'}), 500

@app.route('/analyze_resume', methods=['POST'])
def analyze_resume():
    print("Analyzing resume")
    
    resume_file = request.files.get('resume')
    analysis_data_json = request.form.get('analysisData')

    if not resume_file or not analysis_data_json:
        return jsonify({"error": "Missing required files or data"}), 400
    
    try:
        analysis_data = json.loads(analysis_data_json)
    except json.JSONDecodeError:
        return jsonify({"error": "Invalid analysis data format"}), 400
    
    filename = resume_file.filename
    extracted_text = ""
    
    # Extract text from the resume file
    try: 
        if filename.endswith('.docx'):
            result = mammoth.extract_text(resume_file)
            extracted_text = result.value
            print(f"Extracted text from DOCX (first 100 chars): {extracted_text[:100]}...")
        elif filename.endswith('.pdf'):
            reader = PdfReader(resume_file)
            for page in reader.pages:
                extracted_text += page.extract_text()
            print(f"Extracted text from PDF (first 100 chars): {extracted_text[:100]}...")
        else: 
            return jsonify({"error": "Unsupported file format. Please upload a PDF or DOCX file."}), 400
    except Exception as e: 
        print(f"Error extracting text: {str(e)}")
        return jsonify({"error": f"Error processing file: {str(e)}"}), 500
    
    if not extracted_text.strip():
        return jsonify({"error": "Could not extract text from the resume file."}), 400
    
    # Get AI suggestions with the improved function
    try:
        result = get_ai_resume_suggestions(analysis_data, extracted_text)
        return jsonify(result), 200
    except Exception as e:
        print(f"Error generating suggestions: {str(e)}")
        return jsonify({"error": f"Error analyzing resume: {str(e)}"}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5317)
