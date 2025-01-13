import requests 
from bs4 import BeautifulSoup 

from selenium import webdriver
from selenium.webdriver.chrome.service import Service

def scrape_dynamic(url): 
    DRIVER_PATH = '/Users/yammy/Desktop/driver/chromedriver' 
    service = Service(DRIVER_PATH)
    driver = webdriver.Chrome(service=service) #creates a webdriver instance for chrome and you can find that in the defined path
    driver.get(url) 
      
    #converting contetnt to beautiful soup object
    content = BeautifulSoup(driver.page_source, "html.parser") 

    driver.quit() 

    title_tag = content.find('title')
    page_title = title_tag.get_text(strip=True) if title_tag else None

    # Example 2: Extract meta keywords (just a try) 
    meta_keywords_tags = content.find_all("meta", attrs={"name": "keywords"}) 

    # Now 'meta_keywords_tags' is a list, so we want to extract content from each one. 
    all_meta_keywords = [
        tag["content"] for tag in meta_keywords_tags      
        if tag and "content" in tag.attrs
    ]

    # Example 3: Extract meta description
    meta_description_tag = content.find("meta", attrs={"name": "description"})
    meta_description = meta_description_tag["content"] if meta_description_tag else None

    # Example 4: Extract all headings
    h1_texts = [h1.get_text(strip=True) for h1 in content.find_all('h1')]


    # Example 5: Extract text from a specific section by class or id
    # E.g., <div class="article-content"> ... </div>
    # article_div = content.find("div", {"class": "article-content"})
    # if article_div:
    #     article_text = article_div.get_text(strip=True)

    # Pack all results in a dictionary (or whatever structure you prefer)
    result = {
        "title": page_title,
        "keywords": all_meta_keywords, 
        "description": meta_description,
        "h1_list": h1_texts
        # "article_text": article_text,  # if used above
    }

    return result



def scrape_static(url): 
    try: 
        # use for static HTML files 
        headers = { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        response = requests.get(url, headers=headers)
        if response.status_code == 200: 
            content = BeautifulSoup(response.content, "html.parser")
            title = content.find("h1").get_text() 
            return title
    except Exception as e: 
        print("there was an error", str(e)) 
        return; 

    
#use selenium if rendering dyanmic files 
def main():
    print("Welcome to the Web Scraper!")
    print("1. Scrape Static Page")
    print("2. Scrape Dynamic Page")

    try:
        # Get user choice
        choice = int(input("Enter your choice (1 for Static, 2 for Dynamic): "))
        # Get URL input from the user
        url = input("Enter the URL to scrape: ")

        if choice == 1:
            print("\nPerforming static scraping...")
            print(scrape_static(url)) 
        elif choice == 2:
            print("\nPerforming dynamic scraping...")
            print(scrape_dynamic(url))
        else:            
            print("Invalid choice. Please enter 1 or 2.") 
    except ValueError:
        print("Invalid input. Please enter a number.")
    except Exception as e:
        print("An unexpected error occurred:", str(e))


# Run the script
if __name__ == "__main__":
    main()