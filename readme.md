# Outdoor Activity Locator
---
## Full Stack JavaScript Techdegree Capstone Project

Web application designed to demonstrate my knowledge in the following areas:

- HTML and CSS
- Using JavaScript to modify the DOM
- JavaScript frontend libraries like jQuery
- Using a styling framework like Bootstrap or Foundation
- The module pattern in JavaScript
- Using NodeJS and Express
- Using a task runner like Gulp
- Using a SQL or no-SQL database
- Using a frontend Framework like Angular or Vue
- Connecting to an API
- Authentication and Sessions
- Unit Testing

This project is deployed at: [https://outdoor-activities-locator.herokuapp.com/](https://outdoor-activities-locator.herokuapp.com/ "Outdoor Activities Locator")

For any questions or comments send email to [smellydogcoding@gmail.com](mailto:smellydogcoding@gmail.com "email me")  
For bug reports please go to [https://github.com/SmellydogCoding/outdoor-activities-finder/issues](https://github.com/SmellydogCoding/outdoor-activities-finder/issues "bug reports")

### How to Contribute to this Project

#### Download this project

```PowerShell
git clone "https://github.com/SmellydogCoding/outdoor-activities-finder.git"
```

#### API Keys
you will need to obtain your own api keys for the following:

- [Google Geolocation API](https://developers.google.com/maps/documentation/geolocation/intro "Google Geolocation API")
- [Google Maps API](https://developers.google.com/maps/ "Google Maps API")
- [TrailAPI](https://market.mashape.com/trailapi/trailapi "Trail API")
- [OpenWeather API](https://openweathermap.org/api "Open Weather API")

#### create ENV file

You need to create a **env.js** file in the **node** directory of the project (this will be the same directory as the app.js file.)  
Don't add the **env.js** to the **dist** directory (it will be overwritten anyway).  

The **env.js** file should contain the following:

```JavaScript
process.env.googleAPIKey = 'your key';
process.env.googleMapsAPIKey = 'your key';
process.env.trailAPIKey = 'your key';
process.env.openWeatherAPIKey = 'your key';
process.env.state = 'development';
```

#### Set up Dev Environment

If you don't already have them on your local machine, download and install [Node.js](https://nodejs.org/ "NodeJS") and [MongoDB](https://www.mongodb.com/ "MongoDB").  
Make sure that the `node`, `npm` and `mongod` commands have been added to your `PATH` (you may have to do this manually, depending on your OS).

Now open your terminal of choice and navigate to the folder where you cloned the project:  
```PowerShell
>c:\your\path\to\the\outdoor-activities-locator
```

Install Bower by typing (you may need to put `sudo` in front of it depending on your OS):

```PowerShell
>npm install bower -g
```

Install project dependencies by typing:

```PowerShell
>bower install
```
then
```PowerShell
>npm install
```

Open an new tab in your terminal and start the Mongo Daemon by typing:

```PowerShell
>mongod
```

Now go back to your project directory and seed the local database by typing:

```PowerShell
>node seed.js
```

once the database seeding is finished (you will see messages in the terminal saying that collections and indexes were successfully created), press `CTRL+C` to exit the process

now you should be able to build the project and start the express server by typing:

```PowerShell
>npm start
```

once the server starts and you have a database connection (you will see messages in the console), navigate to [localhost:3000]("http://localhost:3000")