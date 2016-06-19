chartwatchApp = angular.module('chartwatchApp', ['ngRoute'])
.config(function ($routeProvider) {
	$routeProvider
	.when('/', {
		templateUrl: '/partials/initials.html',
		controller: 'InitialCtrl'
	})
	.when('/initial/:initial', {
		templateUrl: '/partials/artist-list.html',
		controller: 'ArtistInitialCtrl'
	})
	.when('/artist/edit/:id', {
		templateUrl: '/partials/edit-artist.html',
		controller: 'EditArtistCtrl'
	})
	.when('/artist/:id', {
		templateUrl: '/partials/artist.html',
		controller: 'ArtistCtrl'
	})
	.when('/chart/single/edit/:id', {
		templateUrl: '/partials/edit-chart-single.html',
		controller: 'SingleChartEditCtrl'
	})
	.when('/chart/single/:name', {
		templateUrl: '/partials/chart.html',
		controller: 'SingleChartCtrl'
	})
	.when('/chart/single/:name/:date', {
		templateUrl: '/partials/chart.html',
		controller: 'SingleChartCtrl'
	})
	.when('/chart/missing/:rank', {
		templateUrl: '/partials/missing.html',
		controller: 'ChartMissingCtrl'
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

