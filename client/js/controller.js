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
		$http.get('chart/fetch/single/' + $scope.chart,
							{ params: { 
								year: $scope.date.getFullYear(),
								month: $scope.date.getMonth() + 1,
								day: $scope.date.getDate()
							} })
		.success(function (chartRows) {
			$scope.getChart ();
		});		
	};
});
