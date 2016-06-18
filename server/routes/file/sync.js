(function () {
	'use strict';
	
	var http = require('http');
	var Promise = require('bluebird');
	
	module.exports = function (router, db) {
		var Songs = db.collection ('Songs');
		var Albums = db.collection ('Albums');
		var Artists = db.collection ('Artists');
		var Counters = db.collection ('Counters');

		function get (path) {
			var url = 'http://localhost:3000/db/' + path;
			return new Promise (function (resolve, reject) {
				var request = http.get(url, function (response) {
					if (response.statusCode != 200)
						reject (new Error ('Failed to load page, status code: ' + response.statusCode));

					var body = [];
					response.on ('data', function (chunk) {
						body.push (chunk);
					});
					
					response.on ('end', function () {
						resolve (JSON.parse (body.join('')));
					});
				});

				request.on ('error', function (error) {
					reject (error);
				});
			});
		}

		function updateCounter (type, value) {
			return Counters.update ({ _id: type }, { $set: { seq: value } });
		}

		function normalize (string) {
			return string.replace(/`/g, "'");
		}

		function syncArtist (artist) {
			return Artists.find (
				{ _id: artist.id })
			.toArray ()
			.then (function (docs) {
				if (docs.length === 0) {
					var name = normalize (artist.name);
					var nameNorm = normalize (artist.nameNorm).toLowerCase ();
					var nameNorm2 = name.replace (/\s+/g, '');
					var newArtist = {
						_id: artist.id,
						name: name,
						nameNorm: nameNorm,
					};

					if (name !== nameNorm2 && nameNorm !== nameNorm2)
						newArtist.chartName = [nameNorm2];

					if (artist.origin !== null)
						newArtist.origin = artist.origin;

					if (artist.type === 'Duet')
						artist.type = 'Duo';

					if (artist.type !== null)
						newArtist.type = artist.type;

					if (artist.gender !== null)
						newArtist.gender = artist.gender;

					return Artists.insert (newArtist);
				}
			});
		}

		function syncArtists () {
			return get ('artist')
			.then (function (artists) {
				var promises = [];
				var i, artist;
				var maxId = 0;

				for (i in artists) {
					artist = artists[i];
					promises.push (syncArtist (artist));
					if (maxId < artist.id)
						maxId = artist.id;
				}

				promises.push (updateCounter ('artist', maxId));

				return Promise.all (promises);
			});
		}

		function syncSong (song) {
			return Songs.find (
				{ _id: song._id })
			.toArray ()
			.then (function (docs) {
				if (docs.length === 0) {
					return Songs.insert (song);
				}
				else if (docs[0].plays < song.plays) {
					return Songs.update (
						{ _id: song._id },
						{ $set: { plays: song.plays, lastPlayed: song.lastPlayed } }
					);
				}
			});
		}

		function syncSongs () {
			var songs = [];

			return get ('song')
			.then (function (body) {
				for (var i in body) {
					var song = body[i];
					songs[song.id] = {
						_id: song.id,
						title: normalize (song.title),
						time: song.time,
						bitrate: song.bitrate,
						plays: song.plays,
						lastPlayed: song.lastPlayed
					};
				}

				return get ('songArtist');
			})
			.then (function (body) {
				var song;

				for (var i in body) {
					var songArtist = body[i];
					song = songs[songArtist.SongId];
					var order = songArtist.order;
					var artistId = songArtist.ArtistId;
					var isFeat = songArtist.feat;

					if (isFeat) {
						if (song.features === undefined)
							song.features = [];

						song.features[order] = artistId;
					}
					else {
						if (song.artists === undefined)
							song.artists = [];

						song.artists[order] = artistId;
					}
				}
				
				var promises = [];
				var maxId = 0;

				for (var j in songs) {
					song  = songs[j];

					if (song === undefined)
						continue;

					promises.push (syncSong (song));
					
					var id = song._id;
					if (maxId < id) {
						maxId = id;
					}
				}
				
				promises.push (updateCounter ('song', maxId));

			});
		}

		function getAlbums (albums) {
			return get ('album')
			.then (function (body) {
				for (var i in body) {
					var album = body[i];
					albums[album.id] = {
						_id: album.id,
						title: normalize (album.title),
						release: new Date (album.release),
						type: album.type,
						artists: [],
						discs: []			 
					};
				}
			});
		}

		function getAlbumArtists (albums) {
			return get ('albumArtist')
			.then (function (body) {
				for (var i in body) {
					var artist = body[i];
					var album = albums[artist.AlbumId];
					album.artists[artist.order] = artist.ArtistId;
				}
			});
		}

		function getAlbumSongs (albums) {
			return get ('albumSong')
			.then (function (body) {
				for (var i in body) {
					var song = body[i];
					var album = albums[song.AlbumId];
					var disc = song.disk > 0 ? song.disk : 1;
					var track = song.track;

					if (album.discs[disc] === undefined) {
						var tracks = [];
						tracks[track] = song.SongId;
						album.discs[disc] = {
							disc: disc,
							tracks: tracks
						};
					}
					else {
						album.discs[disc].tracks[track] = song.SongId;
					}
				}
			});
		}

		function syncAlbum (album) {
			return Albums.find (
				{ _id: album._id })
			.toArray ()
			.then (function (docs) {
				if (docs.length === 0) {
					return Albums.insert (album);
				}
			});
		}

		function syncAlbums () {
			var albums = [];

			return getAlbums (albums)
			.then (function () {
				return getAlbumArtists (albums);
			})
			.then (function () {
				return getAlbumSongs (albums);
			})
			.then (function () {
				var promises = [];
				var maxId = 0;

				for (var i in albums) {
					var album = albums[i];
					if (album === undefined || album.artists.length === 0)
						continue;

					promises.push (syncAlbum (album));

					var id = album._id;
					if (maxId < id)
						maxId = id;	
				}
				
				promises.push (updateCounter ('album', maxId));
			});
		}

		router.get ('/sync', function (req, res) {
			var promises = [];

			promises.push (syncArtists ());
			promises.push (syncSongs ());
			promises.push (syncAlbums ());

			Promise.all (promises)
			.then (function (body) {
				res.sendStatus (200);
			})
			.catch (function (error) {
				console.log (error);
				res.json (error.message);
			});
		});
	};
}());
