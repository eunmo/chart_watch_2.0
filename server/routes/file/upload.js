(function () {
	'use strict';
  
	var formidable = require('formidable');
	var path = require('path');
	var fs = require('fs');
	var Promise = require('bluebird');
	var exec = Promise.promisify(require('child_process').exec);

	var uploadDir = path.resolve('uploads/temp');
	var musicDir = path.resolve('uploads/music');
	var imageDir = path.resolve('uploads/img');
	var tagScript = path.resolve('perl/tag.pl');
	var imgScript = path.resolve('perl/img.pl');

	module.exports = function (router, db) {
		var Songs = db.collection ('Songs');
		var Albums = db.collection ('Albums');
		var Artists = db.collection ('Artists');
		
		router.post ('/upload',function (req, res) {
			var form = new formidable.IncomingForm ();
			var files = [];
			var albumArtistArray = [];

			form.uploadDir = uploadDir;

			form
			.on ('file', function (field, file) {
				if (file.size > 0)
					files.push(file);
			})
			.on ('end', function () {
				if (files.length === 0) {
					res.json (null);
				} else {
					console.log('-> upload done ' + files.length);
					Promise.map (files, function (file) {
						return handleUpload (file, albumArtistArray);
					}, {concurrency: 1})
					.then (function () {
						res.redirect ('/#/');
					});
				}
			});
			form.parse (req);
		});

		function updateArtistSet (set, array, name, nameNorm) {
			if (set[name] === undefined) {
				var artistTag = { name: name, nameNorm: nameNorm, index: array.length };
				set[name] = array.length;
				array.push (artistTag);
			}
		}

		function getNextSequence (name) {
			return db.collection ('Counters')
				.findAndModify (
						{ _id: name }, // query
						[['_id', 1]], // sort
						{ $inc: { seq: 1 } }, //doc
						{ new: true } // options
				);
		}

		function findArtists (tag, artists,
													albumArtistArray, songArtistArray, featArtistArray) {
			var artistSet = {};
			var name, nameNorm;
			var i;

			for (i in tag.albumArtist) {
				name = tag.albumArtist[i];
				nameNorm = tag.albumArtistNorm[i];
				updateArtistSet (artistSet, artists, name, nameNorm);
				albumArtistArray[i] = artistSet[name];
			}

			for (i in tag.artist) {
				name = tag.artist[i];
				nameNorm = tag.artistNorm[i];
				updateArtistSet (artistSet, artists, name, nameNorm);
				songArtistArray[i] = artistSet[name];
			}

			for (i in tag.feat) {
				name = tag.feat[i];
				nameNorm = tag.featNorm[i];
				updateArtistSet (artistSet, artists, name, nameNorm);
				featArtistArray[i] = artistSet[name];
			}

			return Promise.map (artists, function (artistTag) {
				name = artistTag.name;
				nameNorm = artistTag.nameNorm;
				return Artists.find (
					{ $or: [ { name: name }, { nameNorm: nameNorm } ] },
					{ _id: 1})
				.toArray ()
				.then (function (docs) {
					if (docs.length === 0) {
						return getNextSequence ('Artist')
						.then (function (doc) {
							var newId = doc.value.seq;
							artists[artistSet[name]].id = newId;
							return Artists.insert ({ _id: newId, name: name, nameNorm: nameNorm });
						});
					} else {
						artists[artistSet[name]].id = docs[0]._id;
					}
				});
			}, {concurrency: 1});
		}

		function findAlbum (tag, artists, albumArtistArray) {
			var artistIdArray = [];

			for (var i in albumArtistArray) {
				artistIdArray.push (artists[albumArtistArray[i]].id);
			}

			return Albums.find ({ title: tag.album, artists: { $in: artistIdArray } })
			.toArray ()
			.then (function (docs) {
				if (docs.length === 0) {
					return getNextSequence ('Album')
					.then (function (doc) {
						var newId = doc.value.seq;
						var releaseDate = new Date(Date.UTC(tag.year, tag.month, tag.day));

						tag.albumId = newId;
						return Albums.insert ({
							_id: newId,
							title: tag.album,
							artists: artistIdArray,
							release: releaseDate,
							discs: []
						});
					}).then (function () {
						var imgPath = path.resolve(imageDir, tag.albumId + '.jpg');
						var execImgStr = 'perl ' + imgScript + ' ' + tag.file + ' ' + imgPath;
						return exec(execImgStr);
					});
				}
				else {
					tag.albumId = docs[0]._id;
				}
			});
		}

		function addSong (tag, artists, songArtistArray, featArtistArray) {
			var artistIds = [];
			var featArtistIds = [];
			var i;

			for (i in songArtistArray) {
				artistIds.push (artists[songArtistArray[i]].id);
			}

			for (i in featArtistArray) {
				featArtistIds.push (artists[featArtistArray[i]].id);
			}

			return getNextSequence ('Song')
			.then (function (doc) {
				var newId = doc.value.seq;
				tag.songId = newId;

				var song = {
					_id: newId,
					title: tag.title,
					artists: artistIds,
					time: tag.time,
					bitrate: tag.bitrate,
					plays: 0,
				};
				
				if (featArtistIds.length > 0)
					song.features = featArtistIds;

				return Songs.insert (song);
			}).then (function (doc) {
				var newPath = path.resolve(musicDir, tag.songId.toString() + '.mp3');
				fs.renameSync(tag.file, newPath);
			});
		}

		function addTrack (tag) {
			return Albums.find ({ _id: tag.albumId })
			.toArray ()
			.then (function (docs) {
				var album = docs[0];
				var tracks = [];
				var disc;
				var found = false;

				for (var i in album.discs) {
					disc = album.discs[i];

					if (disc.disc === tag.disc) {
						found = true;
						break;
					}
				}

				if (found) {
					tracks = disc.tracks;
					tracks[tag.track] = tag.songId;
					return Albums.update (
						{ _id: tag.albumId, 'discs.disc': tag.disc },
						{ $set: { 'discs.$.tracks': tracks } }
					);
				} else {
					tracks[tag.track] = tag.songId;
					return Albums.update (
						{ _id: tag.albumId },
						{ $push: { discs: { disc: tag.disc, tracks: tracks } } }
					);
				}
			});
		}
		
		function handleUpload (file, albumArtistArray) {
			
			var execTagStr = 'perl ' + tagScript + ' ' + file.path;
			var artists = [];

			var songArtistArray = [];
			var featArtistArray = [];
			var tag;

			return exec (execTagStr)
			.then (function (stdout) {
				tag = JSON.parse (stdout);
				return findArtists (tag, artists, albumArtistArray, songArtistArray, featArtistArray);
			}).then (function () {
				tag.file = file.path;
				return findAlbum (tag, artists, albumArtistArray);
			}).then (function () {
				return addSong (tag, artists, songArtistArray, featArtistArray);
			}).then (function () {
				return addTrack (tag);
			});
		}
	};
}());
