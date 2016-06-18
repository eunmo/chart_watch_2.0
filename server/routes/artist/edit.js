(function () {
  'use strict';

  module.exports = function (router, db) {
		var Artists = db.collection ('Artists');

		router.get ('/artist/edit/:_id', function (req, res) {
			var id = Number(req.params._id);

			return Artists.find ({ _id: id })
				.toArray ()
				.then (function (docs) {
					if (docs.length > 0) {
						return docs[0];
					}
					else {
						return {};
					}
				})
				.then (function (artist) {
					res.json (artist);
				});
		});
		
		router.put ('/artist/edit/', function (req, res) {
			var input = req.body;
			var id = input._id;

			var set = { name: input.name, nameNorm: input.nameNorm };

			if (input.type)
				set.type = input.type;

			if (input.gender)
				set.gender = input.gender;

			if (input.origin)
				set.origin = input.origin;

			if (input.chartName)
				set.chartName = input.chartName;

			return Artists.update ({ _id: id }, { $set: set })
			.then (function (docs) {
				res.json (id);
			});
		});
	};
}());
