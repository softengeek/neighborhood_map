//Locations for the map
const initialLocations = [
  {
    title: 'Blue Hole',
    location: {lat: 18.373684, lng: -77.050958}
  },
  {
    title: 'Blue Mountains',
    location: {lat: 18.124638, lng: -76.678629 }
  },
  {
    title: 'Frenchman\'s Cove Beach',
    location: {lat: 18.175548, lng: -76.400217}
  },
  {
    title: 'Blue Lagoon',
    location: {lat: 18.170065, lng: -76.386337}
  },
  {
    title: 'Ocho Rios Bay Beach',
    location: {lat: 18.408302, lng: -77.107076}
  },
  {
    title: 'Winnifred Beach',
    location: {lat: 18.170102, lng: -76.375778}
  }
]

//ViewModel to load model data to the view
const ViewModel = function() {
  var self = this;

  this.term = ko.observable("");

  //Foursquare Credentials
  var clientID = 'VCVLYR2XGEYKBZMS0ULRZNBTCYIJTKIZC0LYZEQCXU14U1RS';
  var clientSecret = 'LVVQ1D3YQHLHYVQPP2EZJND4ZZWU1HXYR1IVBUJNIPNLDAJB';

  //Used to show markers on the map when the map is clicked
  this.showMarker = function(data) {
    let searchListings = [data];
    for (const marker of self.markers())  {
      if (marker.title === data ) {
        populateInfoWindow(marker, self.largeInfoWindow);
      }
    }
    showListings(searchListings);
    HideListings(searchListings);
  };

  //Setting up the map from google API
  this.map = new google.maps.Map(document.getElementById('map'), {
    center: {lat: 18.017874, lng: -76.809904},
    zoom: 12
  });

  this.largeInfoWindow = new google.maps.InfoWindow();
  this.bounds = new google.maps.LatLngBounds();

  //Variable to store markers
  this.markers = ko.observableArray([]);

  //Adding locations to the markers to display on start
  var i = 0;
  for (const location of initialLocations) {
    this.marker = new google.maps.Marker({
      map: self.map,
      position: location.location,
      title: location.title,
      id: i
    });

    i++;

    self.markers.push( this.marker);

    this.bounds.extend(this.marker.position);

    this.marker.addListener('click', function() {
      toggleBounce(this);
      populateInfoWindow(this, self.largeInfoWindow);
    });
    self.map.fitBounds(self.bounds);

  }

  //used to filter out the locations to show on the map
  this.filter = ko.computed( function() {
    this.list = ko.observableArray([]);
    if (self.term().toLowerCase() !== "") {
      for (const marker of self.markers())  {
        if (marker.title.toLowerCase().indexOf(self.term()) >= 0 ) {
          this.list.push(marker.title);
        }
      }
    } else {
      for (const marker of self.markers())  {
          this.list.push(marker.title);
      }
    }
    return this.list();
  });

  //Adds animation to the map
  function toggleBounce(marker) {
    if (marker.getAnimation() !== undefined) {
      marker.setAnimation(undefined);
    } else {
      marker.setAnimation(google.maps.Animation.BOUNCE);
    }
  }

  //Populate window on click with data from the foursquare api
  function populateInfoWindow(marker, infoWindow) {
    if (infoWindow.marker != marker) {
      infoWindow.marker = marker;
      let type = '', checkins = '';
      const lat = marker.position.lat();
      const lng = marker.position.lng();

	     $.ajax({
         url:'https://api.foursquare.com/v2/venues/search',
         dataType: 'json',
         data: `limit=1&ll=${lat},${lng}&client_id=${clientID}&client_secret=${clientSecret}&v=20181210&query=${marker.title}`
       }).done(function(data) {
         const response = data.response.venues[0]
         this.address = ko.computed(function() {
           const address1 = response.location.formattedAddress[0] || "";
           const address2 = response.location.formattedAddress[1] || "No Address Found";
           return `${address1}, ${address2}`;
         }, self);
      	 type = response.categories[0].name;
         checkins = response.stats.checkinsCount;

         infoWindow.setContent(`<div><p>Retrieved From Foursquare</p><p>Name: ${marker.title}</p><p>Address: ${this.address()}</p><p>Category: ${type}</p><p>Checkins: ${checkins}</p></div>`);

         infoWindow.open(self.map, marker);
         toggleBounce(marker);
       }).fail(function(data) {
         swal(`Failed to retrieve data from Foursquare: ${data.responseText}`, 'danger');
       });


       infoWindow.addListener('closeclick', function() {
        infoWindow.setMarker(null);
      });
    }
  }

  //Used to show the listings on the map when one is clicked or when the results are shown in the filter
  function showListings(locations){
    self.bounds = new google.maps.LatLngBounds();

    for (const marker of self.markers()) {
      if (locations.includes(marker.title)) {
        marker.setMap(self.map);
        self.bounds.extend(marker.position);
      }
    }

    self.map.fitBounds(self.bounds);
  }

  //Used to hide the other listings not needed
  function HideListings(locations) {
    for (const marker of self.markers()) {
      if (!locations.includes(marker.title)) {
        marker.setMap(null);
      }
    }
  }

  //Used to filter the items based on the search term
  this.searchFilter = ko.computed(function() {
    var searchTerm = self.term().toLowerCase();

    if (!searchTerm) {
        return null;
    } else {
        showListings(self.filter());
        HideListings(self.filter());
        return 0;
    }
  });

}

//used to initialize app and search for media queries to enable and disable classes
function initMap() {
    ko.applyBindings(new ViewModel());
    const mediaQuery = window.matchMedia( "(min-width: 768px)" );

    if (mediaQuery.matches) {
      $('.side-menu').addClass('menu-show');
    } else {
      $('.search').addClass('hide');
    }

    $(document).on('click', '.header i', function() {
      $('.side-menu').toggleClass('menu-show');
      $('.search').toggleClass('hide');
    })
}

//Error function to deal with
mapError = function() {
  swal('Error','Google Maps Has Failed to Load! Please try again later.', 'error');
}
