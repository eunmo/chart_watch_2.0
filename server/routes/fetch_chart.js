(function () {
  'use strict';

	var path = require('path');
	var exec = require('child_process').exec;

  module.exports = function (router, db) {
		var SingleCharts = db.collection('SingleCharts');
		var SingleChartEntries = db.collection('SingleChartEntries');

		router.get ('/fetch_chart/single/:_chart', function (req, res) {
			var chartName = req.params._chart;
			var year = req.query.year;
			var month = req.query.month;
			var day = req.query.day;
			var date = new Date (Date.UTC (year, month - 1, day));

			var execStr = 'perl ' + path.resolve ('perl/' + chartName + '.pl') + ' ' + year + ' ' + month + ' ' + day;

			SingleCharts.find ({ chart: chartName, week: date }).toArray (function (err, doc) {
				if (doc.length === 0) {
					exec (execStr, function (error, stdout, stderr) {
						var chartData = JSON.parse (stdout);

						if (chartData.length === 0) {
							res.sendStatus (200);
							return;
						}

						var bulk = SingleChartEntries.initializeOrderedBulkOp ();

						for (var i in chartData) {
							var entry = chartData[i];
							var rank = { week: date, rank: entry.rank };
				
							bulk
							.find({ chart: chartName, artist: entry.artist, title: entry.title })
						  .upsert()
						  .update({
							  $setOnInsert: { chart: chartName, artist: entry.artist, title: entry.title },
							  $push: { rank: rank }
							});
						}

						bulk.execute (function (err, r) {
							SingleChartEntries.find (
								{ chart: chartName, rank: { $elemMatch: { week: date } } },
								{ rank: { $elemMatch: { week: date } } 
							}).toArray (function (err, doc) {
								var entries = [];
								
								for (var i in doc) {
									var entry = doc[i];
									var rankElem = entry.rank[0];
									
									entries[rankElem.rank - 1] = entry._id;
								}

								SingleCharts.insert ({ chart: chartName, week: date, entries: entries }, function (err, doc) {
									res.sendStatus (200);
								});
							});
						});
					});
				} else if (doc[0].entries.length <= 10 ) {
					exec (execStr, function (error, stdout, stderr) {
						var chartData = JSON.parse (stdout);

						if (chartData.length <= doc[0].entries.length) {
							res.sendStatus (200);
							return;
						}

						var bulk = SingleChartEntries.initializeOrderedBulkOp ();

						for (var i = doc[0].entries.length; i < chartData.length; i++) {
							var entry = chartData[i];
							var rank = { week: date, rank: entry.rank };
				
							bulk
							.find({ chart: chartName, artist: entry.artist, title: entry.title })
						  .upsert()
						  .update({
							  $setOnInsert: { chart: chartName, artist: entry.artist, title: entry.title },
							  $push: { rank: rank }
							});
						}

						bulk.execute (function (err, r) {
							SingleChartEntries.find (
								{ chart: chartName, rank: { $elemMatch: { week: date } } },
								{ rank: { $elemMatch: { week: date } } 
							}).toArray (function (err, doc) {
								var entries = [];
								
								for (var i in doc) {
									var entry = doc[i];
									var rankElem = entry.rank[0];
									
									entries[rankElem.rank - 1] = entry._id;
								}

								SingleCharts.update ({ chart: chartName, week: date }, { $set: { entries: entries } }, function (err, doc) {
									res.sendStatus (200);
								});
							});
						});
					});
				} else {
					res.sendStatus (200);
				}
			});
		});
	};
}());
