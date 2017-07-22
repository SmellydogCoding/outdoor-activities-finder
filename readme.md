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
you will need to obtain your own api for the following:

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

The project requires [Node.js](https://nodejs.org/) and [MongoDB](https://www.mongodb.com/).

This project also requires Bower

```
npm install bower -g
```

Once you have the prerequisites installed run:

```
bower install
npm install
```

to set up the database first start a mongodb instance

```
mongod
```

and then to seed the database

```
node seed.js
```

now you should be able to build the project and start the express server by typing

```
gulp
```

once the server starts and you have a database connection navigate to

```
localhost:3000
```