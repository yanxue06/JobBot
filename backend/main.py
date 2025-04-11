from jobbot.backend.GetJobs import *

def main():
    user_input = (input)("enter the job link: ") 
    scrape(user_input)
    
if __name__ == "__main__":
    main()