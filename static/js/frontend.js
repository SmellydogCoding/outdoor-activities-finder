new Vue({
  el: '#places',
  data: {
    places: [],
    results: false,
    address: 'address',
    city: 'city',
    state: '',
    zip: '',
    radius: '',
    activity: ''
  },
  methods: {
    getPlaces: function() {
      this.places = [];
      let vm = this;
      let formData = {address: this.address, city: this.city, state: this.state, zip: this.zip, radius: this.radius, activity: this.activity};
      this.$http.post('/', formData).then(function (response) {
          for (let p = 0; p < response.data.length; p++) {
            vm.places.push(response.data[p]);
            console.log(response.data[p]);
          }
          vm.results = true;
      });
    },
    getAddress(event) {
      this.address = event.target.value
    },
    getCity(event) {
      this.city = event.target.value
    },
    getZip(event) {
      this.zip = event.target.value
    }
  }
})