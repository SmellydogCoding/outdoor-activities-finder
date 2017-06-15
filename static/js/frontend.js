new Vue({
  el: '#app',
  data: {
    state: 'zip',
    noGeolocation: false,
    geoLocationError: false,
    userCoordsObtained: false,
    userCoords: {}
  },
  methods: {
    switchState(item) {
      this.state = item;
    },
    getLocation() {
      // reset error message if use changes browser settings and tries again
      this.noGeolocation = false;
      this.geoLocationError = false;

      if (!navigator.geolocation){
        return this.noGeolocation = true;
      } else {

        const error = () => {
          this.geoLocationError = true;
        }

        const success = (position) => {
          this.userCoords = { lattitude: position.coords.latitude, longitude: position.coords.longitude };
          this.userCoordsObtained = true;
        }

        navigator.geolocation.getCurrentPosition(success,error);
      }
    }
    // getPlaces: function() {
    //   this.places = [];
    //   let vm = this;
    //   let formData = {address: this.address, city: this.city, state: this.state, zip: this.zip, radius: this.radius, activity: this.activity};
    //   this.$http.post('/', formData).then(function (response) {
    //       for (let p = 0; p < response.data.length; p++) {
    //         vm.places.push(response.data[p]);
    //         console.log(response.data[p]);
    //       }
    //       vm.results = true;
    //   });
    // },
    // getAddress(event) {
    //   this.address = event.target.value
    // },
    // getCity(event) {
    //   this.city = event.target.value
    // },
    // getZip(event) {
    //   this.zip = event.target.value
    // }
  }
})