'use strict';

const MongoClient = require('mongodb').MongoClient

MongoClient.connect('mongodb://localhost:27017/outdoor-activity-finder', (error,db) => {
  if (error) {
    console.log(error)
  } else {
    console.log('Database Connection Successful');
    const users = db.collection('users');
    const places = db.collection('places');

    users.drop();
    places.drop();

    users.insert({username: 'smellydog',email: 'smellydogcoding@gmail.com',password: '$2a$10$K7T3ncZyeGdDGRFXrdV4TeX71HuRwvedoaZ9UlojeOzCZylX3Vrm.',type: 'admin',joined_on: new Date(),favorites: [{name: 'Seven Springs',city: 'Somerset',state: 'Pennslyvania',link: '/place?lat=40.01509&lon=-79.30127'}]},(error,result) => {
      if (error) {
        console.log(error);
      } else if (result) {
        console.log('user collection created');
        users.createIndex({username: 1},{unique: true},(error,result) => {
          if (error) {
            console.log(error);
          } else if (result) {
            console.log('username index created');
          }
        });
        users.createIndex({email: 1},{unique: true},(error,result) => {
          if (error) {
            console.log(error);
          } else if (result) {
            console.log('email index created');
          }
        });
      }
    });
    
    places.insert({_id: 3218,name: 'Seven Springs',link: '/place?lat=40.01509&lng=-79.30127',reviews:[{username: 'smellydog',rating: 5,comment: 'The zip lines are really fun!', posted_on: new Date()}]},(error,result) => {
      if (error) {
        console.log(error);
      } else if (result) {
        console.log('reviews collection created');
        places.createIndex({'reviews.username': 1},{unique: false},(error,result) => {
           if (error) {
            console.log(error);
          } else if (result) {
            console.log('reviews.username index created');
          }
        });
      }
    });
  }
});