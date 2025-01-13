import requests 
from bs4 import BeautifulSoup 

from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from selenium.common.exceptions import WebDriverException

def scrape_dynamic(url): 
    DRIVER_PATH = '/Users/yammy/Desktop/driver/chromedriver' 
    service = Service(DRIVER_PATH)
    driver = webdriver.Chrome(service = service) #creates a webdriver instance for chrome and you can find that in the defined path
    driver.get(url)
    print("Page Title:", driver.title)

def scrape_static(url): 
    try: 
        # use for static HTML files 
        headers = { 
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        url = "C"
        response = requests.get(url, headers=headers)
        if response.status_code == 200: 
            soup = BeautifulSoup(response.content, "html.parser")
            title = soup.find("h1").get_text() 
    except Exception as e: 
        print("there was an error", str(e)) 
    
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
            scrape_static(url)
        elif choice == 2:
            print("\nPerforming dynamic scraping...")
            scrape_dynamic(url)
        else:            print("Invalid choice. Please enter 1 or 2.") 
    except ValueError:
        print("Invalid input. Please enter a number.")
    except Exception as e:
        print("An unexpected error occurred:", str(e))


# Run the script
if __name__ == "__main__":
    main()