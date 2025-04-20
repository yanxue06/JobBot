from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from aiSummary import stream_ai_summary
import json 
import time

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
            
            # Send final complete message with full summary
            print(f"Stream complete, sending summary: {summary[:100]}...")
            yield f"data: {json.dumps({'text': '', 'summary': summary, 'complete': True})}\n\n"
        except Exception as e:
            print(f"Error streaming response: {str(e)}")
            yield f"data: {json.dumps({'error': str(e)})}\n\n"
    
    return Response(generate(), content_type='text/event-stream', headers={
        'Cache-Control': 'no-cache',
        'X-Accel-Buffering': 'no',
        'Connection': 'keep-alive'
    })

if __name__ == '__main__':
    app.run(debug=True, port=5317)
