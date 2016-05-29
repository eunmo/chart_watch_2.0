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
			var prevWeek = new Date (Date.UTC (year, month - 1, day - 7));

			SingleCharts.find ({ chart: chartName, week: date }).toArrayAsync ()
		  .then (function (docs) {
				if (docs.length === 0) {
					res.json ([]);
				} else {
					var chart = docs[0];

					SingleChartEntries.find ({ _id: { $in: chart.entries } }, { artist: 1, title: 1, rank: 1 }).toArrayAsync ()
					.then (function (doc) {
						var entries = [];

						for (var i in doc) {
							var entry = doc[i];
							var curRank = 100;
							var prevRank = null;
							var rankMin = 1000;
							var rankRun = 0;

							for (var j in entry.rank) {
								var rankElem = entry.rank[j];

								if (rankElem.week <= date) {
									if (rankElem.week >= date) { /* equality */
										curRank = rankElem.rank;
									}
									else if (rankElem.week >= prevWeek) {
										prevRank = rankElem.rank;
									}
									rankRun++;

									if (rankElem.rank < rankMin) {
										rankMin = rankElem.rank;
									}
								}
							}

							entries[curRank - 1] = { 
								artist: entry.artist, 
								title: entry.title,
								rank: {
									cur: curRank,
									run: rankRun,
									min: rankMin,
									prev: prevRank
								}
							};
						}

						res.json (entries);
					});
				}
			});
		});	
	};
}());
