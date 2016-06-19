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

chartwatchApp.directive('rankBadge', function () {
  return {
    restrict: 'E',
    scope: {
      rank: '=rank',
    },
    compile: function() {
      return {
        pre: function (scope, element, attrs) {
							 console.log (scope.rank);
					var colors = ["#9ecae1","#6baed6","#4292c6","#2171b5","#ef6548"];
					var min = scope.rank.min;
					scope.min = min;

					switch (scope.rank.chart) {
						case 'billboard':
							scope.prefix = 'US';
							break;

						case 'oricon':
							scope.prefix = 'オ';
							break;

						case 'deutsche':
							scope.prefix = 'D';
							break;

						case 'uk':
							scope.prefix = 'UK';
							break;

						case 'francais':
							scope.prefix = 'F';
							break;

						case 'melon':
							scope.prefix = 'M';
							break;

						case 'gaon':
							scope.prefix = 'G';
							break;

						default:
							scope.prefix = null;
							break;
					}
          
					if (min <= 10)
						scope.show = true;
					else
						scope.show = false;

					if (min < 6)
						scope.style = { "background-color" : colors[5 - min] };
					else {
						scope.style = { "background-color" : "#c6dbef" };
					}
        }
      };
    },
    templateUrl: 'partials/rank-badge.html'
  };
});
