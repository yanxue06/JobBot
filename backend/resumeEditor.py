"""
Resume Editor Backend API

This file contains the backend routes and functionality for the resume editor feature.
It handles DOCX parsing, AI suggestion generation, and document export.
"""

import os
import io
import json
from flask import request, jsonify, send_file
from docx import Document
import mammoth
from PyPDF2 import PdfReader
from aiSummary import client

# Add these routes to your Flask app in server.py

def parse_docx_content(file_data):
    """
    Parse a DOCX file and return its content as HTML
    """
    try:
        # Parse DOCX content
        result = mammoth.convert_to_html(file_data)
        html = result.value

        print(f"file data in HTML: {html}")

        # You may want to apply additional transformations to the HTML here
        
        return {
            "success": True,
            "html": html,
            "messages": result.messages
        }
    except Exception as e:
        print(f"Error parsing DOCX: {str(e)}")
        return {
            "success": False,
            "error": f"Failed to parse DOCX: {str(e)}"
        }

def generate_suggestions(resume_html, job_data=None):
    """
    Generate AI-powered suggestions for the resume based on the job data
    """
    try:
        # Create a prompt for the AI
        prompt = f"""
        Analyze this resume content and provide specific improvement suggestions:
        
        {resume_html}
        """
        
        # Add job data if provided
        if job_data:
            prompt += f"""
            The resume should be optimized for this job:
            Title: {job_data.get('title', 'Not specified')}
            Requirements: {', '.join(job_data.get('requirements', []))}
            Keywords: {', '.join(job_data.get('keywords', []))}
            """
        
        # Call the AI service
        response = client.chat.completions.create(
            model="mistralai/mixtral-8x7b-instruct",  # Use default model
            messages=[
                {"role": "system", "content": "You are an expert resume reviewer. Provide specific, actionable suggestions to improve the resume content. Focus on identifying weak phrases, missing keywords, and opportunities to quantify achievements."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"}
        )
        
        # Process response
        suggestions_json = json.loads(response.choices[0].message.content)
        
        # Format suggestions in a structured way for the frontend
        formatted_suggestions = []
        
        for suggestion in suggestions_json.get("suggestions", []):
            formatted_suggestions.append({
                "id": len(formatted_suggestions) + 1,
                "type": suggestion.get("type", "improvement"),
                "section": suggestion.get("section", "general"),
                "original": suggestion.get("original", ""),
                "suggestion": suggestion.get("suggestion", ""),
                "position": suggestion.get("position", {"line": 0, "ch": 0}),
                "applied": False
            })
        
        return {
            "success": True,
            "suggestions": formatted_suggestions
        }
    except Exception as e:
        print(f"Error generating suggestions: {str(e)}")
        return {
            "success": False,
            "error": f"Failed to generate suggestions: {str(e)}"
        }

def generate_docx_from_html(html_content):
    """
    Generate a DOCX file from HTML content
    """
    try:
        # Create a new document
        doc = Document()
        
        # This is where you would convert the HTML back to DOCX
        # This is a simplified example and would need proper HTML parsing
        # and conversion to DOCX elements with styles
        
        # Add a sample paragraph (you would replace this with HTML conversion)
        doc.add_paragraph(html_content)
        
        # Save to a BytesIO object
        output = io.BytesIO()
        doc.save(output)
        output.seek(0)
        
        return output
    except Exception as e:
        print(f"Error generating DOCX: {str(e)}")
        return None

# Routes to add to your Flask app

def route_parse_resume():
    """
    Route: /parse_resume
    Method: POST
    Parse a resume file and return its content as HTML
    """
    try:
        if 'resume' not in request.files:
            return jsonify({"error": "No resume file provided"}), 400
        
        file = request.files['resume']
        
        if file.filename == '':
            return jsonify({"error": "No file selected"}), 400
        
        if file and file.filename.endswith('.docx'):
            result = parse_docx_content(file)
            if result["success"]:
                return jsonify({
                    "html": result["html"],
                    "messages": result["messages"]
                }), 200
            else:
                return jsonify({"error": result["error"]}), 500
        else:
            return jsonify({"error": "Unsupported file format. Please upload a DOCX file."}), 400
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

def route_generate_suggestions():
    """
    Route: /generate_resume_suggestions
    Method: POST
    Generate AI-powered suggestions for the resume
    """
    try:
        data = request.json
        
        if not data or 'resumeHtml' not in data:
            return jsonify({"error": "Resume HTML content is required"}), 400
        
        resume_html = data['resumeHtml']
        job_data = data.get('jobData')
        
        result = generate_suggestions(resume_html, job_data)
        
        if result["success"]:
            return jsonify({"suggestions": result["suggestions"]}), 200
        else:
            return jsonify({"error": result["error"]}), 500
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500

def route_export_resume():
    """
    Route: /export_resume
    Method: POST
    Export the resume as DOCX or PDF
    """
    try:
        data = request.json
        
        if not data or 'resumeHtml' not in data:
            return jsonify({"error": "Resume HTML content is required"}), 400
        
        resume_html = data['resumeHtml']
        export_format = data.get('format', 'docx').lower()
        
        if export_format == 'docx':
            output = generate_docx_from_html(resume_html)
            if output:
                return send_file(
                    output,
                    mimetype='application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                    as_attachment=True,
                    download_name='resume.docx'
                )
        elif export_format == 'pdf':
            # PDF export would require additional libraries like ReportLab
            # This is a placeholder for PDF generation functionality
            return jsonify({"error": "PDF export not yet implemented"}), 501
        else:
            return jsonify({"error": "Unsupported export format"}), 400
            
        return jsonify({"error": "Failed to export resume"}), 500
    except Exception as e:
        return jsonify({"error": f"An error occurred: {str(e)}"}), 500



