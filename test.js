'use strict';

const chai = require('chai');
const expect = chai.expect;
const chaiAsPromised = require('chai-as-promised');
chai.use(chaiAsPromised);
const httpMocks = require('node-mocks-http');

const geospacial = require('./node/geospacial.js');
const trailapi = require('./node/trailapi.js');
const weatherapi = require('./node/weather.js');
const mid = require('./node/middleware.js');

describe('testing test styles', () => {
  it('should say that an object with an array of objects has a property of name', () => {
    expect( {"places": [ {"city": "nemacolin"} ] } ).to.have.nested.property("places[0].city");
  });
});

// geospacial test suite

describe('test functions in the geospacial module', () => {
  let distance = geospacial.getDistance({latitude: 39.72122192, longitude: -80.51956177},{latitude: 40.02198029, longitude: -79.90330505});

  // getDistance function

  it('should return an integer when calling the getDistance function', () => {
    expect(distance).to.be.a('number');
  });
  it('should equal 39 when you pass in the coords in the distance variable to the getDistance function', () => {
    expect(distance).to.equal(39);
  });

  // getGPSData function

  let getTestCoords = geospacial.getGPSData('address=15351');

  it('should return an object when calling the getGPSData function', () => {
    return expect(getTestCoords).to.eventually.be.an('object');
  });
  it('should return an object with a coords key when calling the getGPSData function', () => {
    return expect(getTestCoords).to.eventually.have.property('coords');
  });
  it('should have property lat and lng (which are numbers) on the coords key', () => {
    expect(getTestCoords).to.eventually.have.property('coords').with.property('lat').to.be.a('number');
    return expect(getTestCoords).to.eventually.have.property('coords').with.property('lng').to.be.a('number');
  });

});

// trail api test suite

describe('test functions in the trailapi module', () => {

  // getplaces function
  
  let getTestPlaces = trailapi.getPlaces({lat: '39.80001161', lng: '-80.22746854', activity: 'hiking', radius: '19'});

  it('should return an object when calling the getplaces function', () => {
    return expect(getTestPlaces).to.eventually.be.an('object');
  });
  it('should return an object with an array of objects called places', () => {
    return expect(getTestPlaces).to.eventually.have.property('places').to.be.an('array').to.have.lengthOf.above(0);
  });
  it('should return an object with an array of objects with a name property', () => {
    return expect(getTestPlaces).to.eventually.have.nested.property("places[0].name");
  });

  //cleanDescription function

  it('should change br tags, less than tags, and greater than tags to a blank space', () =>{
    expect(trailapi.cleanDescription('<br />')).to.equal('');
    expect(trailapi.cleanDescription('<br /><br />')).to.equal('');
    expect(trailapi.cleanDescription('br /')).to.equal('');
    expect(trailapi.cleanDescription('&lt;')).to.equal('');
    expect(trailapi.cleanDescription('&gt;')).to.equal('');
  });

  it('should replace the space between a period and a word (or if there is no space between a period and a word) with unicode for 2 spaces', () => {
    expect(trailapi.cleanDescription('.word')).to.equal('.\xa0\xa0word');
    expect(trailapi.cleanDescription('. word')).to.equal('.\xa0\xa0word');
    expect(trailapi.cleanDescription('.  word')).to.equal('.\xa0\xa0word');
  });

});

// openweather api test suite

describe('test functions in the openweather api module', () => {
  let getTestWeather = weatherapi.getWeather('39.80001161','-80.22746854');

  // getweather function

  it('should return an object when calling the getweather function', () => {
    return expect(getTestWeather).to.eventually.be.an('object');
  });
  it('should return an object with a properties of main and wind', () => {
    expect(getTestWeather).to.eventually.have.property('main');
    return expect(getTestWeather).to.eventually.have.property('wind');
  });
  it('should return an object with a property of main that has a property of temperature', () => {
    return expect(getTestWeather).to.eventually.have.nested.property('main.temp');
  });
  it('should return an object with a property of wind that has a property of speed', () => {
    return expect(getTestWeather).to.eventually.have.nested.property('wind.speed');
  });

  // convertToDirection function
  it('should return the direction of ESE when you pass in 90', () => {
    expect(weatherapi.convertToDirection(90)).to.equal('ESE');
  });
});

// middleware test suite

describe('test functions in the middleware module', () => {

  let req1 = {};
  let req2 = {};
  let res = {};

  beforeEach((done) => {
    req1 = httpMocks.createRequest({ url: '/user' });
    req2 = httpMocks.createRequest({ url: '/user' });
    res = httpMocks.createResponse();
    req1.session = {};
    req2.session = {username: 'woof'};
    done();
  })

  it('should not return an error message when you do pass in a session user name', (done) => {
    mid.loginRequired(req2,res, function next(error) {
      if (error) { throw new Error('login is requried'); }
      else { console.log('you are logged in'); }
      done();
    });
  });
  it('should return an error message when you do not pass in a session user name', (done) => {
    expect(mid.loginRequired(req1,res, function next(error) {
      // if (error) { throw new Error('login is requried'); }
      // else { console.log('you are logged in'); }
      // done();
    })).to.throw(Error('login is requried'));
  });

});