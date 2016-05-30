chartwatchApp.directive('navi', function () {
  return {
    restrict: 'E',
    templateUrl: 'partials/navi.html'
  };
});

chartwatchApp.directive('lastWeek', function () {
	return {
		restrict: 'E',
		scope: {
			rank: '=rank'
		},
		templateUrl: 'partials/last-week.html'
	};
});

chartwatchApp.directive('artistLink', function () {
  return {
    restrict: 'E',
    scope: {
      artist: '=artist',
      suffix: '=suffix'
    },
    templateUrl: 'partials/artist-link.html'
  };
});

chartwatchApp.directive('artistRows', function () {
  return {
    restrict: 'E',
    scope: {
      artists: '=artists',
      desc: '=desc'
    },
    templateUrl: 'partials/artist-rows.html'
  };
});
