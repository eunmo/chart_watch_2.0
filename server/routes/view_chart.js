(function () {
  'use strict';

  module.exports = function (router, db) {
		var SingleCharts = db.collection('SingleCharts');
		var SingleChartEntries = db.collection('SingleChartEntries');

		router.get ('/chart/single/:_chart', function (req, res) {
			var chartName = req.params._chart;
			var year = req.query.year;
			var month = req.query.month;
			var day = req.query.day;
			var date = new Date (Date.UTC (year, month - 1, day));

			SingleCharts.find ({ chart: chartName, week: date }).toArray (function (err, doc) {
				var chart = doc[0];
				SingleChartEntries.find ({ _id: { $in: chart.entries } }, { artist: 1, title: 1, rank: { $elemMatch: { week: date } } })
				.toArray (function (err, doc) {
					var entries = [];

					for (var i in doc) {
						var entry = doc[i];
						var rankElem = entry.rank[0];

						entries[rankElem.rank - 1] = { artist: entry.artist, title: entry.title };
					}
					
					res.json (entries);
				});
			});
		});	
	};
}());
