chartwatchApp.controller('InitialCtrl', function ($rootScope, $scope, $http) {
 
  $scope.initials = [];

	$scope.initials.push.apply($scope.initials, '가나다라마바사아자차카타파하'.split(''));
	$scope.initials.push.apply($scope.initials, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split(''));
	$scope.initials.push('0-9');
});

chartwatchApp.controller('ArtistInitialCtrl', function ($rootScope, $scope, $routeParams, $http) {

	$scope.initial = $routeParams.initial;	
  $scope.albumArtists = [];
  $scope.singleArtists = [];
  $scope.chartedArtists = [];
	$scope.others = [];

	$http.get('artist/initial/' + $routeParams.initial).success(function (data) {
		console.log (data);
  	$scope.albumArtists = data.albumArtists;
	  $scope.singleArtists = data.singleArtists;
	  $scope.chartedArtists = data.chartedArtists;
		$scope.others = data.others;
	});
});

chartwatchApp.controller('ArtistCtrl', function ($rootScope, $scope, $routeParams, $http) {
	
	$scope.loaded = false;

	$http.get('artist/all_songs/' + $routeParams.id).success(function (doc) {
		$scope.artist = doc.artists[0];
		$scope.artists = doc.artists;
		$scope.albums = doc.albums;
		$scope.songs = doc.songs;
		$scope.loaded = true;

		console.log ($scope.songs);
	});

	$scope.showArtistArray = function (songId, album) {
		if (songId === null)
			return false;

		var song = $scope.songs[songId];

		if (song.artists.length !== album.artists.length)
			return true;

		for (var i in song.artists) {
			if (song.artists[i] !== album.artists[i])
				return true;
		}

		return false;
	};
});

chartwatchApp.controller('EditArtistCtrl', function ($rootScope, $scope, $routeParams, $http, $location) {

	$scope.artist = {};

	$http.get('artist/edit/' + $routeParams.id).success(function (artist) {
		console.log (artist);
		artist.newChartNames = [];

		for (var i in artist.chartName) {
			artist.newChartNames.push ({ name: artist.chartName[i] } );
		}

		$scope.artist = artist;
	});

	$scope.edit = function () {
		if ($scope.artist.newChartNames.length > 0) {
			$scope.artist.chartName = [];

			for (var i in $scope.artist.newChartNames) {
				if ($scope.artist.newChartNames[i].name !== '')
				$scope.artist.chartName.push ($scope.artist.newChartNames[i].name);
			}
		} else {
			delete $scope.artist.chartName;
		}

		$http.put('artist/edit', $scope.artist)
		.then(function (res) {
			$location.url('/artist/' + res.data);
		});
	};

	$scope.deleteChartName = function (index) {
		$scope.artist.newChartNames.splice (index, 1);
	};

	$scope.addChartName = function () {
		if ($scope.artist.newChartNames.length === 0 ||
				$scope.artist.newChartNames[$scope.artist.newChartNames.length - 1].name !== '')
			$scope.artist.newChartNames.push ({ name: '' });
	};
});

chartwatchApp.controller('SingleChartCtrl', function ($rootScope, $scope, $routeParams, $http, $location) {

	function toUTCDate (date) {
		return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
	}
	
	function getMaxDate (chart) {
		var date = toUTCDate(new Date());

		if ((chart === 'gaon' && date.getDay() < 4) ||
				(chart === 'melon' && date.getDay() < 1) ||
				(chart === 'billboard' && date.getDay() < 3) ||
				(chart === 'oricon' && date.getDay() < 2))
			date.setDate(date.getDate() - 7);

		if ((chart === 'deutsche' && date.getDay() === 6) ||
		    (chart === 'uk' && date.getDay() === 6) ||
			  (chart === 'francais' && date.getDay() === 6))
			date.setDate(date.getDate() + 7);
		
		date.setDate(date.getDate() - date.getDay() - 1);

		return date;
	}

	function getMinDate (chart) {
		if (chart === 'gaon') {
			return new Date(Date.UTC(2010, 0, 2)); // Jan 2nd, 2010
		} else {
			return new Date(Date.UTC(2000, 0, 1)); // Jan 1st, 2000
		}
	}

	$scope.adjustDate = function () {
		var time = $scope.date.getTime();
		if ($scope.max < time) {
			$scope.date = new Date($scope.max);
		} else if (time < $scope.min) {
			$scope.date = new Date($scope.min);
		} else {
			$scope.date = new Date($scope.date);
		}
	};

	$scope.chart = $routeParams.name;
	$scope.maxDate = getMaxDate($scope.chart);
	$scope.minDate = getMinDate($scope.chart);
	
	$scope.max = $scope.maxDate.getTime();
	$scope.min = $scope.minDate.getTime();
	$scope.rows = [];

	if ($routeParams.date) {
		$scope.date = toUTCDate(new Date($routeParams.date));
		$scope.adjustDate();
		var dateString = $scope.date.toISOString().substr(0, 10);
		if ($routeParams.date !== dateString) {
			$location.url('/chart/single/' + $scope.chart + '/'  + dateString);
		}
	} else {
		$scope.date = $scope.maxDate;
	} 

	$scope.getChart = function () {
		$scope.rows = [];
		$http.get('chart/single/' + $scope.chart,
							{ params: { 
								year: $scope.date.getFullYear(),
								month: $scope.date.getMonth() + 1,
								day: $scope.date.getDate()
							} })
		.success(function (chartRows) {
			console.log (chartRows);
			$scope.rows = chartRows;
		});
	};

	$scope.getChart();

	$scope.updateDate = function (offset) {
		$scope.date.setDate($scope.date.getDate() + offset);
		$scope.adjustDate();
		var dateString = $scope.date.toISOString().substr(0, 10);
		$location.url('/chart/single/' + $scope.chart + '/'  + dateString);
	};

	$scope.go = function () {
		$scope.updateDate(6 - $scope.date.getDay());
	};
	
	$scope.prev = function () {
		$scope.updateDate(-7);
	};
	
	$scope.next = function () {
		$scope.updateDate(7);
	};

	$scope.fetch = function () {
		$http.get('chart/single/fetch/' + $scope.chart,
							{ params: { 
								year: $scope.date.getFullYear(),
								month: $scope.date.getMonth() + 1,
								day: $scope.date.getDate()
							} })
		.success(function (chartRows) {
			$scope.getChart ();
		});		
	};

	$scope.match = function () {
		$http.get('chart/single/match/' + $scope.chart,
							{ params: { 
								year: $scope.date.getFullYear(),
								month: $scope.date.getMonth() + 1,
								day: $scope.date.getDate()
							} })
		.success(function (chartRows) {
			$scope.getChart ();
		});		
	};

	$scope.edit = function (row) {
		$location.url('/chart/single/edit/' + row._id);
	};
});

chartwatchApp.controller('SingleChartEditCtrl', function ($rootScope, $scope, $routeParams, $http, $location) {
	
	$scope.entry = {};
	$scope.songs = [];

	$http.get('chart/edit/single/' + $routeParams.id).success (function (entry) {
		$scope.entry = entry;
		$scope.songs = [];

		for (var i in entry.songs) {
			$scope.songs.push ({ _id: entry.songs[i] });
		}

		console.log (entry);
	});
	
	$scope.edit = function () {
		var songs = [];

		for (var i in $scope.songs) {
			songs.push ($scope.songs[i]._id);
		}

		$scope.entry.songs = songs;
		$http.put('chart/edit/single', $scope.entry)
		.then(function (res) {
			$location.url('/chart/single/' + $scope.entry.chart + '/' +
										$scope.entry.rank[0].week.substring (0, 10));
		});
	};

	$scope.deleteSong = function (index) {
		$scope.songs.splice (index, 1);
	};

	$scope.addSong = function () {
		if ($scope.songs.length === 0 ||
				$scope.songs[$scope.songs.length - 1 ]._id > 0)
			$scope.songs.push ({ _id: 0 });
	};
});

chartwatchApp.controller('ChartMissingCtrl', function ($rootScope, $scope, $routeParams, $http, $location) {
	$scope.entries = [];

	$http.get('chart/single/missing/' + $routeParams.rank).success (function (entries) {
		$scope.entries = entries;
	});
	
	$scope.edit = function (entry) {
		$location.url('/chart/single/edit/' + entry._id);
	};
});
