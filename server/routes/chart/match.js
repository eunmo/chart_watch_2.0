(function () {
  'use strict';

  module.exports = function (router, db) {
		var Songs = db.collection ('Songs');
		var Albums = db.collection ('Albums');
		var Artists = db.collection ('Artists');
		var SingleCharts = db.collection('SingleCharts');
		var SingleChartEntries = db.collection('SingleChartEntries');

		function normalizeArtist (entry, toLowerCase) {
			var nameNorm = entry.artist;
			var chart = entry.chart;

			if (toLowerCase)
				nameNorm = nameNorm.toLowerCase ();

      nameNorm = nameNorm.replace(/\(.*\)/g, '');

      if (chart === 'gaon') {
        nameNorm = nameNorm.replace(/[,&＆].*$/, '');
      } else if (chart === 'melon') {
        nameNorm = nameNorm.replace(/[,&＆].*$/, '');
        nameNorm = nameNorm.replace(/\swith\s.*$/i, '');
      } else if (chart === 'billboard') {
        nameNorm = nameNorm.replace(/[,&＆].*$/, '');
        nameNorm = nameNorm.replace(/\sfeaturing\s.*$/i, '');
        nameNorm = nameNorm.replace(/\sduet\swith\s.*$/i, '');
        nameNorm = nameNorm.replace(/\sand\s.*$/i, '');
        nameNorm = nameNorm.replace(/\sfeat\..*$/i, '');
        nameNorm = nameNorm.replace(/\sx\s.*$/i, '');
        nameNorm = nameNorm.replace(/\s\+\s.*$/, '');
      } else if (chart === 'oricon') {
        nameNorm = nameNorm.replace(/\sfeat\..*$/i, '');
        nameNorm = nameNorm.replace(/\sfeaturing\s.*$/i, '');
        nameNorm = nameNorm.replace(/\swith\s.*$/i, '');
        nameNorm = nameNorm.replace(/\svs\s.*$/i, '');
        nameNorm = nameNorm.replace(/\s\+\s.*$/, '');
        nameNorm = nameNorm.replace(/〜.*〜$/, '');
        nameNorm = nameNorm.replace(/\/.*$/, '');
        nameNorm = nameNorm.replace(/[&＆].*$/, '');
      } else if (chart === 'deutsche') {
        nameNorm = nameNorm.replace(/[,&＆].*$/, '');
        nameNorm = nameNorm.replace(/\sfeat\..*$/i, '');
        nameNorm = nameNorm.replace(/\sand\s.*$/i, '');
        nameNorm = nameNorm.replace(/\s\+\s.*$/, '');
      } else if (chart === 'uk') {
        nameNorm = nameNorm.replace(/[&＆].*$/, '');
        nameNorm = nameNorm.replace(/\sft\s.*$/i, '');
        nameNorm = nameNorm.replace(/\swith\s.*$/i, '');
        nameNorm = nameNorm.replace(/\svs\s.*$/i, '');
        nameNorm = nameNorm.replace(/\/.*$/, '');
      } else if (chart === 'francais') {
        nameNorm = nameNorm.replace(/[,&＆].*$/, '');
        nameNorm = nameNorm.replace(/\sfeat\..*$/i, '');
        nameNorm = nameNorm.replace(/\sand\s.*$/i, '');
        nameNorm = nameNorm.replace(/\svs\.\s.*$/i, '');
        nameNorm = nameNorm.replace(/\/.*$/, '');
      }

      nameNorm = nameNorm.trim();

			return nameNorm;		
		}

		function invertArtist (entry) {
			var nameNorm = entry.artist;
			var chart = entry.chart;

			if (chart === 'gaon' || chart === 'melon') {
				nameNorm = nameNorm.replace(/.*?\(/, '');
				nameNorm = nameNorm.replace(/\).*/, '');
			}

			nameNorm = nameNorm.trim();

			return nameNorm;

		}

		function findArtistInternal (entry, depth) {
			
			entry.artistMatchDepth = depth;
			
			switch (depth) {
				case 0:
					return Artists.find ({ $or: [ { name: entry.artist },
																				{ chartName: entry.artist },
																				{ nameNorm: entry.artist.toLowerCase () } ] }).toArray ();

				
				case 1:
					var name = normalizeArtist (entry, false);
					var nameNorm = normalizeArtist (entry, true);
					var or = [];
					if (name !== entry.artist)
						or.push ({ name: name }, { chartName: name });
					if (nameNorm !== entry.artist.toLowerCase ())
						or.push ({ nameNorm: nameNorm });
					if (or.length > 0)
						return Artists.find ({ $or: or }).toArray ();
					throw new Error ('unknown depth');

				case 2:
					var nameInv = invertArtist (entry);
					if (nameInv !== entry.artist) {
						console.log (nameInv);
						return Artists.find ({ $or: [ { name: nameInv },
																				  { chartName: nameInv },
																					{ nameNorm: nameInv.toLowerCase () } ] }).toArray ();
					}
					throw new Error ('unknown depth');

				default:
					entry.artistMatchDepth = depth;
					throw new Error ('unknown depth');
			}
		}

		function findArtist (entry, depth) {
			var artist;

			return findArtistInternal (entry, depth)
			.then (function (docs) {
				if (docs.length > 0) {
					artist = docs[0];
					entry.matchedArtist = artist;
					entry.artistMatchDepth = depth;
					throw new Error ('match successful');
				} else {
					return findArtist (entry, depth + 1);
				}
			})
			.catch (function (error) {
				if (error.message !== 'match successful' && error.message !== 'unknown depth')
					throw error;
				else
					return artist;
			});	
		}

		function compareTitles (a, b) {
			if (a === b || a.toLowerCase () === b.toLowerCase () ||
					a.replace (/[\'.,?!]/g, '').toLowerCase () === b.replace (/[\'.,?!]/g, '').toLowerCase ())
				return true;

			return false;
		}

		function findOneSong (title, songs, print) {
			var matchedSong;
			var song, i, songTitle;

			for (i in songs) {
				song = songs[i];

				if (compareTitles (song.title, title))
					return song;
			}

			for (i in songs) {
				song = songs[i];
				songTitle = song.title.replace (/\(.*\)/g, '').trim ();

				if (compareTitles (songTitle, title))
					return song;
			}
		}

		function findSong (entry) {
			return Songs.find ({ artists: entry.matchedArtist._id }).toArray ()
			.then (function (songs) {
				var song, matchedSongs;
			  var	title, titles, i;
			 
				title = entry.title;
				song = findOneSong (entry.title, songs);
				if (song) {
					entry.matchedSongs = [song];
					return;
				}

				title = entry.title.replace (/\(.*\)/g, '').trim ();
				if (title !== entry.title) {
					song = findOneSong (title, songs, entry.matchedArtist._id === 3258);
					if (song) {
						entry.matchedSongs = [song];
						return;
					}
				}
				
				var matched = false;

				if (entry.title.match (/\//)) {
					matchedSongs = [];
					if (entry.title.match (/\(.*\//)) {
						titles = entry.title.replace (/.*\(/, '').replace (/\).*/, '').split ('\/');
					}
					else {
						titles = entry.title.split ('\/');
					}
						
					for (i in titles) {
						song = findOneSong (titles[i], songs);
						if (song)
							matched = true;
						matchedSongs[i] = song;
					}

					if (matched)
						entry.matchedSongs = matchedSongs;
				}
			});
		}

		function matchChart (entry) {
			return findArtist (entry, 0)
			.then (function (artist) {
				if (entry.matchedArtist) {
					return findSong (entry);
				}
			});
		}

		router.get ('/chart/single/match/:_chart', function (req, res) {
			var chartName = req.params._chart;
			var year = req.query.year;
			var month = req.query.month;
			var day = req.query.day;
			var date = new Date (Date.UTC (year, month - 1, day));
			var prevWeek = new Date (Date.UTC (year, month - 1, day - 7));
			
			SingleCharts.find ({ chart: chartName, week: date }).toArrayAsync ()
		  .then (function (docs) {
				if (docs.length === 0) {
					throw new Error('No Chart Found');
				} else {
					return SingleChartEntries.find ({ _id: { $in: docs[0].entries } }, { artist: 1, title: 1, rank: 1 }).toArrayAsync ();
				}
			})
		  .then (function (doc) {
				var entries = [];
				var promises = [];

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
						},
						chart: chartName
					};

					promises.push (matchChart (entries[curRank - 1]));
				}

				return Promise.all (promises)
					.then (function () {
						return entries;
					});
			})
			.then (function (entries) {
				res.json (entries);
			})
			.catch (function (error) {
				console.log (error);
				res.json (error.message);
			});
		});
	};
}());

