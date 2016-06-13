(function () {
  'use strict';

  module.exports = function (router, db) {
		var Songs = db.collection ('Songs');
		var Albums = db.collection ('Albums');
		var Artists = db.collection ('Artists');

		function getQuery (initial) {
			var query;

			if (initial.match(/[가나다라마바사아자차카타파하]/)) {
				// korean
				var krnInitials = '가나다라마바사아자차카타파하';
				var index = krnInitials.indexOf(initial);

				query += "nameNorm >= '" + krnInitials[index] + "' ";

				if (index < 13) {
					query = { nameNorm: { $gte: krnInitials[index], $lt: krnInitials[index+1] } };
				}
				else {
					query = { nameNorm: { $gte: krnInitials[index] } };
				}
			} else if (initial.match(/0-9/)) {
				// numbers
				query = { nameNorm: { $lt: 'A' } };
			} else {
				// alphabet
				var regex = new RegExp('^' + initial, 'i');
				query = { nameNorm: { $regex: regex } };
			}

			return query;
		}

		function getAlbumsByArtist (artist) {
			return Albums.find ({ artists: artist._id }, { _id: 1, artists: 1, type: 1, release: 1 })
			.toArray ()
			.then (function (docs) {
				var recentAlbum = 0;
				var maxRelease = new Date (0, 0, 0);
				if (docs.length > 0)
					artist.albums = {};
				for (var i in docs) {
					var album = docs[i];

					if (album.type !== undefined && album.type !== null) {
						if (artist.albums[album.type] === undefined)
							artist.albums[album.type] = 0;
						artist.albums[album.type]++;
					}

					if (maxRelease.toISOString () < album.release.toISOString ()) {
						maxRelease = album.release;
						recentAlbum = album._id;
					}
				}

				if (recentAlbum !== 0)
					artist.albums.recent = recentAlbum;
			});
		}

		function getAlbums (artists) {
			var promises = [];

			for (var i in artists) {
				promises.push (getAlbumsByArtist (artists[i]));
			}

			return Promise.all (promises);
		}
		
		router.get('/artist/initial/:_initial', function (req, res) {
			var initial = req.params._initial;
			var artists = [];

			Artists.find (getQuery (initial), { _id: 1, name: 1, nameNorm: 1 })
			.toArray ()
			.then (function (docs) {
				for (var i in docs) {
					var artist = docs[i];
					artists[artist._id] = artist;
				}
				return getAlbums (artists);
			})
			.then (function () {
				var albumArtists = [];
				var singleArtists = [];
				var chartedArtists = [];
				var others = [];

				for (var i in artists) {
					var artist = artists[i];

					if (artist === undefined)
						continue;

					if (artist.albums) {
						if (artist.albums.EP || artist.albums.Studio || artist.albums.Compilation)
							albumArtists.push (artist);
						else if (artist.albums.Single)
							singleArtists.push (artist);
					}
					else
						others.push (artist);
				}
				res.json ({
					albumArtists: albumArtists,
					singleArtists: singleArtists,
					chartedArtists: chartedArtists,
					others: others
				});
			})
			.catch (function (error) {
				console.error (error);
			});
		});
	};
}());
