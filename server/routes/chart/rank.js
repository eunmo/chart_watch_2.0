(function () {
  'use strict';

  module.exports = function (router, db) {
		var SingleChartEntries = db.collection('SingleChartEntries');
		
		router.get ('/chart/single/missing/:_rank', function (req, res) {
			var rank = req.params._rank;

			SingleChartEntries.find ({
				rank: { $elemMatch: { rank: { $lte: Number (rank) } } },
				songs: { $exists: false }	}).toArray ()
			.then (function (docs) {
				res.json (docs);
			});
		});
	};
}());
