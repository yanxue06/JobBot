from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from aiSummary import stream_ai_summary, get_ai_resume_suggestions
import json 
import time
import re
import io
import mammoth
from PyPDF2 import PdfReader

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

@app.route('/analyze_job_posting', methods=['POST', 'GET'])
def analyze_job_posting():
    print("Analyzing job posting")
    description = None
    
    # Handle both POST JSON data and query parameters
    if request.method == 'POST' and request.is_json:
        data = request.json
        description = data.get('description')
    else:
        description = request.args.get('description')
    
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
