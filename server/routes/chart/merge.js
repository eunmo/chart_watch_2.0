(function () {
  'use strict';

	var Promise = require ('bluebird');

  module.exports = function (router, db) {
		var SingleCharts = db.collection('SingleCharts');
		var SingleChartEntries = db.collection('SingleChartEntries');

		router.get ('/chart/merge/single/:_chart', function (req, res) {
			var chartName = req.params._chart;

			var f_year = req.query.f_year;
			var f_month = req.query.f_month;
			var f_day = req.query.f_day;
			var f_rank = req.query.f_rank;
			var f_date = new Date (Date.UTC (f_year, f_month - 1, f_day));

			var t_year = req.query.t_year;
			var t_month = req.query.t_month;
			var t_day = req.query.t_day;
			var t_rank = req.query.t_rank;
			var t_date = new Date (Date.UTC (t_year, t_month - 1, t_day));
				
			var f_chart, t_chart;
			var f_entry_id, t_entry_id;
			
			SingleCharts.find ({ chart: chartName, week: { $in : [ f_date, t_date ]  } }).toArrayAsync ()
			.then (function (docs) {

				for (var i in docs) {
					var doc = docs[i];

					if (doc.week.toString () === f_date.toString ()) {
						f_chart = doc;
						f_entry_id = f_chart.entries[f_rank - 1];
					}
					else if (doc.week.toString () === t_date.toString ()) {
						t_chart = doc;
						t_entry_id = t_chart.entries[t_rank - 1];
					}
				}

				if (f_entry_id.equals(t_entry_id)) {
					res.json ([f_entry_id]);
				} else {
					SingleChartEntries.find ({ _id: f_entry_id }).toArrayAsync ()
					.then (function (docs) {

						var rank = docs[0].rank;

						return SingleChartEntries.update ({ _id: t_entry_id }, { $push: { rank: { $each: rank } } });
					}).then (function (docs) {

						return SingleCharts.update ({ _id: f_chart._id, entries: f_entry_id }, { $set: { "entries.$": t_entry_id } });
					}).then	(function (docs) {

						return res.json ([f_entry_id, t_entry_id]);
					});
				}
			});
		});
	};
}());
