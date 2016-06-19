(function () {
  'use strict';

	var ObjectID = require('mongodb').ObjectID;

  module.exports = function (router, db) {
		var Songs = db.collection ('Songs');
		var SingleChartEntries = db.collection('SingleChartEntries');

		router.get ('/chart/edit/single/:_id', function (req, res) {

			var id = new ObjectID (req.params._id);
			SingleChartEntries.find ({ _id: id }).toArray ()
			.then (function (docs) {
				if (docs.length > 0)
					res.json (docs[0]);
				else
					res.json ({});
			});
		});
		
		router.put ('/chart/edit/single', function (req, res) {
			var input = req.body;
			var id = new ObjectID (input._id);

			SingleChartEntries.update ({ _id: id }, { $set: { songs: input.songs } })
			.then (function () {
				res.sendStatus (200);
			});
		});
	};
}());
