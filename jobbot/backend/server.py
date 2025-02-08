from flask import Flask, request, jsonify  # For the backend API
from GetJobs import scrape
from flask_cors import CORS  # Import CORS


# Flask app initialization
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes



@app.route('/scrape', methods=['POST'])
def scrape_links():
    data = request.get_json()
    if not data or 'links' not in data:
        return jsonify({"error": "Invalid input, expected 'links' key in JSON"}), 400

    links = data['links']
    scraped_data = []

    for url in links:
        try:
            print(f"Scraping: {url}")
            job_data = scrape(url)
            scraped_data.append(job_data)
        except Exception as e:
            print(f"Error scraping {url}: {e}")

    return jsonify({"message": "Scraping completed successfully"}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5001) #or any port other than one already used