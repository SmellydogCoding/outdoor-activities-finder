# Outdoor Activity Locator
---
### Full Stack JavaScript Techdegree Capstone Project

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

This project is deployed at: [https://outdoor-activities-locator.herokuapp.com/](https://outdoor-activities-locator.herokuapp.com/)

For any questions or comments send email to [smellydogcoding@gmail.com](mailto:smellydogcoding@gmail.com)
For bug reports please go to [https://github.com/SmellydogCoding/outdoor-activities-finder/issues](https://github.com/SmellydogCoding/outdoor-activities-finder/issues)

#### How to Contribute to this Project

##### Download this project

```
git clone "https://github.com/SmellydogCoding/outdoor-activities-finder.git"
```

##### API Keys
you will need to obtain your own api keys for the following:

- [Google Geolocation API](https://developers.google.com/maps/documentation/geolocation/intro)
- [Google Maps API](https://developers.google.com/maps/)
- [TrailAPI](https://market.mashape.com/trailapi/trailapi)
- [OpenWeather API](https://openweathermap.org/api)

##### create ENV file

You need to create a env.js file in the node directory of the project (this will be the same directory as the app.js file.)  The env.js file should contain the following:

```
process.env.googleAPIKey = 'your key';
process.env.googleMapsAPIKey = 'your key';
process.env.trailAPIKey = 'your key';
process.env.openWeatherAPIKey = 'your key';
process.env.state = 'development';
```

##### Set up Dev Environment

Download and install [Node.js](https://nodejs.org/) and [MongoDB](https://www.mongodb.com/).
Make sure that the node and mongod commands are added to your PATH.

Install Bower

```
npm install bower -g
```

Once you have the above prerequisites installed run:

```
bower install
npm install
```

Open an new tab in your terminal/powershell and run:

```
mongod
```

next seed the local database:

```
node seed.js
```

once the database seeding is finished (collections and indexes successfully created) press `CTRL+C` to exit

now you should be able to build the project and start the express server by running:

```
gulp
```

once the server starts and you have a database connection navigate to

```
localhost:3000
```