from scraper import scrape_static, scrape_dynamic
import json 

def main():
    print("Welcome to the Web Scraper!")
    print("1. Scrape Static Page")
    print("2. Scrape Dynamic Page")

    try:
        choice = int(input("Enter your choice (1 for Static, 2 for Dynamic): "))
        
        # Scrape multiple URLs, let the user input them as a comma-separated list
        urls = input("Enter the URL(s) to scrape, separated by commas: ")
        url_list = [u.strip() for u in urls.split(",")]

        # Ask the user for keywords to search for (want to make this automatic from uploading resume later on)
        kw_input = input("Enter keywords to match (comma-separated), or press Enter to skip: ")
        keywords = [k.strip() for k in kw_input.split(",")] if kw_input else None

        if choice == 1:
            print("\nPerforming static scraping on all URLs...")
            for url in url_list:
                print(f"\nScraping URL: {url}")
                result = scrape_static(url)
                print(json.dumps(result, indent=2))

        elif choice == 2:
            print("\nPerforming dynamic scraping on all URLs...")
            for url in url_list:
                print(f"\nScraping URL: {url}")
                result = scrape_dynamic(url, keywords=keywords)
                print(json.dumps(result, indent=2))

        else:
            print("Invalid choice. Please enter 1 or 2.")

    except ValueError:
        print("Invalid input. Please enter a number.")
    except Exception as e:
        print("An unexpected error occurred:", str(e))


if __name__ == "__main__":
    main()
