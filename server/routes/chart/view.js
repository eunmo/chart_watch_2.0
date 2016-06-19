(function () {
  'use strict';

  module.exports = function (router, db) {
		var Songs = db.collection ('Songs');
		var Albums = db.collection ('Albums');
		var Artists = db.collection ('Artists');
		var SingleCharts = db.collection('SingleCharts');
		var SingleChartEntries = db.collection('SingleChartEntries');

		function getArtists (entry) {
			var artistIds = [];
			var song;
			var i, j, k;
			
			for (i in entry.songs) {
				song = entry.songs[i];

				for (j in song.artists) {
					artistIds.push (song.artists[j]);
				}

				for (j in song.features) {
					artistIds.push (song.features[j]);
				}
			}

			return Artists.find ({ _id: { $in : artistIds } }, { _id: 1, name: 1 }).toArray()
			.then (function (docs) {
				for (i in entry.songs) {
					song = entry.songs[i];

					for (j in song.artists) {
						for (k in docs) {
							if (song.artists[j] === docs[k]._id)
								song.artists[j] = docs[k];
						}
					}

					for (j in song.features) {
						for (k in docs) {
							if (song.features[j] === docs[k]._id)
								song.features[j] = docs[k];
						}
					}
				}
			});
		}

		function getAlbums (entry) {
			var songIds = [];
			var albums = [];

			for (var i in entry.songs) {
				if (entry.songs[i])
					songIds.push (entry.songs[i]._id);
			}

			return Albums.find ({ discs: { $elemMatch: { tracks: { $in: songIds } } } }, { _id: 1 })
			.sort({ release: 1 }).limit (1).toArray()
			.then (function (docs) {
				entry.album = docs[0]._id;
				return getArtists (entry);
			});
		}

		function getSongs (entry, songIds) {
			var songs = [];

			return Songs.find ({ _id: { $in: songIds } }).toArray ()
			.then (function (docs) {
				var i, j;

				for (i in songIds) {
					for (j in docs) {
						if (songIds[i] === docs[j]._id) {
							songs[i] = docs[j];
							break;
						}
					}
				}

				entry.songs = songs;
				return getAlbums (entry, songIds);
			});
		}

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

					SingleChartEntries.find ({ _id: { $in: chart.entries } }, { artist: 1, title: 1, rank: 1, songs: 1 }).toArrayAsync ()
					.then (function (doc) {
						var entries = [];
						var promises = [];

						for (var i in doc) {
							var entry = doc[i];
							var curRank = 100;
							var prevRank = null;
							var rankMin = 1000;
							var rankRun = 0;
							var newEntry;

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

							newEntry = {
							 	_id: entry._id,	
								artist: entry.artist, 
								title: entry.title,
								rank: {
									cur: curRank,
									run: rankRun,
									min: rankMin,
									prev: prevRank
								}
							};

							if (entry.songs) {
								promises.push (getSongs (newEntry, entry.songs));
							}

							entries[curRank - 1] = newEntry;
						}

						Promise.all (promises)
						.then (function () {
							res.json (entries);
						});
					});
				}
			});
		});	
	};
}());
