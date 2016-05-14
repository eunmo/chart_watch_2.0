chartwatchApp = angular.module('chartwatchApp', ['ngRoute'])
.config(function ($routeProvider) {
	$routeProvider
	.when('/', {
		templateUrl: '/partials/blank.html',
	})
	.when('/chart/single/:name', {
		templateUrl: '/partials/chart.html',
		controller: 'SingleChartCtrl'
	})
	.when('/chart/single/:name/:date', {
		templateUrl: '/partials/chart.html',
		controller: 'SingleChartCtrl'
	})
	.otherwise({
		redirectTo: '/'
	});
});

chartwatchApp.config(['$httpProvider', function($httpProvider) {
    //initialize get if not there
    if (!$httpProvider.defaults.headers.get) {
        $httpProvider.defaults.headers.get = {};    
    }    

    //disable IE ajax request caching
    $httpProvider.defaults.headers.get['If-Modified-Since'] = 'Mon, 26 Jul 1997 05:00:00 GMT';
    // extra
    $httpProvider.defaults.headers.get['Cache-Control'] = 'no-cache';
    $httpProvider.defaults.headers.Pragma = 'no-cache';
}]);

