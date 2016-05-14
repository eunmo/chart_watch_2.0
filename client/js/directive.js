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
