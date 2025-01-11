import requests 
from bs4 import BeautifulSoup 

headers = { 
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
}

url = "https://www.linkedin.com/jobs/search/?currentJobId=4117977629"
response = requests.get(url, headers=headers)

if response.status_code == 200: 
    soup = BeautifulSoup(response.content, "html.parser")

    articles = soup.select('a.post-card')

    


# if "software" in soup.get_text().lower(): 
#     print("The word 'software' was found!")
# else: 
#     print("word 'software' was not found") 
