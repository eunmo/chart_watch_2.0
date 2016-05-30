(function () {
	'use strict';

	var Promise = require('bluebird');
	var exec = require('child_process').exec;
	var stat = Promise.promisify(require('fs').stat);
	
	var path = require('path');
	var imageDir = path.resolve('uploads/img');
	var musicDir = path.resolve('uploads/music');
	
	module.exports = function (router, db) {
		var Songs = db.collection ('Songs');
		var Albums = db.collection ('Albums');

		function copy (str) {
			var child = exec (str);

			return new Promise (function (resolve, reject) {
				child.addListener ('error', reject);
				child.addListener ('exit', resolve);
			});
		}

		function copyAlbum (id) {
			var imgPath = path.resolve (imageDir, id + '.jpg');
			return stat (imgPath)
			.catch (function (error) {
				var srcPath = path.resolve ('../chart_watch/uploads/img', id + '.*');
				var execStr = 'cp ' + srcPath + ' ' + imageDir;
				return copy (execStr);
			});
		}

		function copyAlbums () {
			return Albums.find ({}, { _id: 1 })
			.toArray ()
			.then (function (docs) {
				return Promise.map (docs, function (doc) {
					return copyAlbum (doc._id);
				}, { concurrency: 1});
			});
		}

		function copySong (id) {
			var songPath = path.resolve (musicDir, id + '.mp3');
		 	return stat (songPath)
			.catch (function (error) {
				var srcPath = path.resolve ('../chart_watch/uploads/music', id + '.mp3');
				var execStr = 'cp ' + srcPath + ' ' + musicDir;
				return copy (execStr);
			});	
		}

		function copySongs () {
			var count = 0;
			return Songs.find ({}, { _id: 1 })
			.toArray ()
			.then (function (docs) {
				return Promise.map (docs, function (doc) {
					return copySong (doc._id);
				}, { concurrency: 1});
			});
		}

		router.get ('/copy', function (req, res) {
			var promises = [];

			promises.push (copySongs ());
			promises.push (copyAlbums ());

			Promise.all (promises)
			.then (function () {
				res.sendStatus (200);
			});
		});
	};
}());

