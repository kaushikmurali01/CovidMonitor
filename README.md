[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-f059dc9a6f8d3a56e377f745f24479a46679e63a5d9fe6f495e02850cd0d8118.svg)](https://classroom.github.com/online_ide?assignment_repo_id=6245364&assignment_repo_type=AssignmentRepo)

# Assignment 2

## Pair Programming
- Kaushik Murali (driver), Hyeon Jeong Byeon(navigator)
    - Feature: `Uploading files using middleware such as multer, as well as parsing the CSV data`
        - I (Kaushik Murali) worked as the driver for uploading files using middleware such as multer, as well as parsing the CSV data into the database
        - Most of the pair programming process went pretty well. It was good to have someone to discuss with about the solution.
        When I did not know how to implement a certain part of the feature, I would start working it out on the code and my partner would give me her thoughts
        and ideas
        - A part of the pair programming process that did not work too well was during some parts of testing the feature.
        When the feature did not work as expected, my partner would try and help me solve it but sometimes conveying it in words was not enough was not enough
        to make me understand. It would have been better if my partner coded it herself.
        - In all, I thought pair programming was quite productive. It was definitely better than working alone.

- Hyeon Jeong Byeon (driver), Kaushik Murali (navigator)
    - Feature: `Writing unit test cases using jest and supertest`
        - I (Hyeon Jeong Byeon) was the driver for writing unit test cases using jest and supertest.
        - The pair programming process progressed well. Testing was not that difficult.
        With the help of my partner we managed to identify a variety test suites and tests. 
        - Having my partner review my code was good since I could proceed with writing the other tests while my partner was examining the older tests to check
        if they were detailed enough.
        - Pair programming was a little difficult since I'm used to working on my own. But overall, I think it definitely optimized the process.

## Program Design and Functionality
We decided to create this REST API using Node JS and Express. We chose to use Express because it makes Node.js web application development fast and easy as well as easy to configure and customize. For the database, we used NeDB which is a lightweight database written entirely in Javascript, and implements the MongoDB API. It is packaged as a Node module that be used with a simple require and can be used as an in-memory only or persistent datastore.

We chose a to split parts of the code into separate sections for this application. There is a part of the program which handles the storage for uploading a CSV file when making a POST request. There is also another part that takes care of the parsing of the CSV data. We also use a modular design for this application as we have a module called app.js that takes care of the functionality of the API and exports the express app, and another module called index.js which imports the express app and is used to bind and listen the connections on a port.

We decided to only have two endpoints /time_series and /daily_reports. These two endpoints were sufficient as we only needed to query on two types of resources, either time series data or daily reports data. 

* We are able to add/update files by making a POST request on either /time_series or /daily_reports and setting a query parameter called "type". When making this request we need to upload a new file and set its key value to 'file' in order to ensure that we get a 200 status status code.
    * In the case of /time_series, we set the value of type to either "confirmed", "deaths" or "recovered". Doing this indicates what type of time series data we are passing. If we do not provide this data, we will be unable to add or update a file and will get a failed response. In the case that the new file we upload contains different data(confirmed/deaths/recovered) for the same keys (country/region,province/state,lat,long), then it automatically only updates those entries in the database, otherwise the entries are inserted at the end if the keys don't match. This is why we do not have a PUT request i.e., update is also carried out by the same POST request itself.
  
    * In the case of /daily_reports, we set the value of type to the date of the file. The date has to be of the form m/d/y with no preceeding zeros (Ex:  5/7/20 or 10/24/21). If we do not provide this data, we will be unable to add or update a file and will get a failed response. In the case that the new file we upload contains different data(confirmed/deaths/recovered) for the same keys (country/region,province/state,lat,long), then it automatically only updates those entries in the database, otherwise the entries are inserted at the end if the keys don't match. This is why we do not have a PUT request i.e., update is also carried out by the same POST request itself.


* We are able to query data by making a GET request on either /time_series or /daily_reports and providing a variety of query parameters. We utilise AND logic when querying the data on multiple query parameters.
    * In the case of /time_series, we can query for countries by setting the query parameter "countries=<country1>,<country2>...". The country names just need to be separated by a comma (,) with no spacing in between. We can similarly query for provinces by setting the query parameter "provinces=<province1>,<province2>...". The province names just need to be separated by a comma (,) with no spacing in between. We can also query for a period of time or any one day by setting the query parameter "dates=<date1>-<date2>". Here, date1 and date2 are of the form m/d/y with no preceeding zeros (Ex:  5/7/20 or 10/24/21). They need to be separated by a hyphen (-). We also still need the type query parameter like in the POST request for /time_series in order to retrieve either the "confirmed", "deaths", "recovered" or "active" data. We also have another parameter that we can set called "format". If we do "format=json", the API returns data in JSON format. If we do "format=csv", the API returns data in CSV format. If this parameter is not provided, then the API returns in JSON format by default
  
    * In the case of /daily_reports, in order to query based on countries, provinces or time period/day, we do the same as we do for time_series except we do not need the type parameter since we return confirmed, deaths, recovered and active data all at once. The format of the returned data is also given by the query parameter "format" just like it was in the case of time_series.
   
Here are some examples of requests we made through POSTMAN on our localhost which can be used as reference for how it is expected to make POST/GET requests for our API:
   <img width="1025" alt="Screen Shot 2021-11-10 at 2 07 03 PM" src="https://user-images.githubusercontent.com/90944374/141179067-ec2450e0-cca7-4389-bc19-659296f5afdc.png">

   <img width="1146" alt="Screen Shot 2021-11-10 at 2 08 19 PM" src="https://user-images.githubusercontent.com/90944374/141179066-85a67f2f-a4c7-47d4-9582-2ed1291348fc.png">
   
   <img width="1128" alt="Screen Shot 2021-11-10 at 2 09 05 PM" src="https://user-images.githubusercontent.com/90944374/141179063-1cdb9d3c-ac21-43be-ae74-87b2d8ebf07a.png">
   
   <img width="1035" alt="Screen Shot 2021-11-10 at 2 09 58 PM" src="https://user-images.githubusercontent.com/90944374/141179061-c91c9ee6-26bb-4252-87b3-484ce4b76304.png">
   
   <img width="1030" alt="Screen Shot 2021-11-10 at 2 10 29 PM" src="https://user-images.githubusercontent.com/90944374/141179058-c434d3e3-aae5-4dc6-b62d-e7584797da25.png">
   
   <img width="979" alt="Screen Shot 2021-11-10 at 2 10 53 PM" src="https://user-images.githubusercontent.com/90944374/141179055-dc097f31-55df-433e-97f1-603b91d6fc83.png">
   
   <img width="1055" alt="Screen Shot 2021-11-10 at 2 12 21 PM" src="https://user-images.githubusercontent.com/90944374/141179053-52d60532-5d1a-412b-97ee-8185d543bedc.png">
   
   <img width="1155" alt="Screen Shot 2021-11-10 at 2 16 00 PM" src="https://user-images.githubusercontent.com/90944374/141179049-6b8cc3f8-0c57-4344-a022-9c4fb6bbfe14.png">
   
   <img width="1031" alt="Screen Shot 2021-11-10 at 2 17 20 PM" src="https://user-images.githubusercontent.com/90944374/141179045-9239dd6c-7af7-433d-aa14-95ad3eefaa5d.png">
   
   
## Setup
We have deployed our application on the production server: https://covid-monitor-final.herokuapp.com/
We also have another test server which we use: https://covid-monitor-csc-301.herokuapp.com/

However, when heroku hosts an application, the data tends to sometime not persist after a while, so we also recommend that you test our API locally using tools such as POSTMAN.
Follow the command below in sequence to test our assignment:
* git clone https://github.com/csc301-fall-2021/assignment-2-56-kaushikmurali01-hyeonjeongbyeon.git
* cd assignment-2-56-kaushikmurali01-hyeonjeongbyeon
* npm install express
* npm install fast-csv
* npm install fs
* npm install json-2-csv
* npm install nedb
* npm install --save multer
* npm i express-fileupload
* node index.js


## Testing

We used jest and supertest to do our testing. We also POSTMAN to test on our testing server and on our localhost. All our tests are given in the app.test.js file. The screenshot below shows that our coding coverage exceeds 75%.
<img width="1105" alt="Screen Shot 2021-11-09 at 3 29 27 PM" src="https://user-images.githubusercontent.com/90944374/141023001-a9d94918-8ec1-4bbd-b4d0-b4abbc9c5d81.png">

We have automated our tests by setting up CI actions to run app.test.js when we make a change to our app.
We have made detailed tests suites and tests that check a variety of the API functionality (given in app.test.js).
