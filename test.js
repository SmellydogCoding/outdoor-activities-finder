'use strict';

const expect = require('chai').expect;
const geospacial = require('./node/geospacial.js');

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

  it('should return an object when calling the getGPSData function', () => {
    geospacial.getGPSData('address=15351').then((coords) => {
      expect(coords).to.be.a('object');
    });
  });

});