from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from aiSummary import stream_ai_summary
import json 

app = Flask(__name__)
CORS(app)

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
        try:
            ai_stream = stream_ai_summary(description)
            for chunk in ai_stream:
                delta = chunk.choices[0].delta.content
                if delta:
                    summary += delta
                    yield f"data: {json.dumps({'text': delta, 'complete': False})}\n\n"
            
            # Send final complete message with full summary
            yield f"data: {json.dumps({'text': '', 'summary': summary, 'complete': True})}\n\n"
        except Exception as e:
            print(f"Error streaming response: {str(e)}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return Response(generate(), mimetype='text/event-stream')

if __name__ == '__main__':
    app.run(debug=True, port=5317)
