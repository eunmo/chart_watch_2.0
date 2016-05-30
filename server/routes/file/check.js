(function () {
	'use strict';

	var Promise = require('bluebird');
	var exec = require('child_process').exec;
  var fs = require ('fs');
	
	var path = require('path');
	var imageDir = path.resolve('uploads/img');
	var musicDir = path.resolve('uploads/music');
	
	module.exports = function (router, db) {
		var Songs = db.collection ('Songs');
		
		function execPromise (str) {
			var child = exec (str);

			return new Promise (function (resolve, reject) {
				child.addListener ('error', reject);
				child.addListener ('exit', resolve);
			});
		}
		
		router.get ('/check', function (req, res) {
			var ids = [];

			fs.readdirSync (musicDir)
			.filter (function (file) {
				return (file.indexOf ('.') !== 0);
			})
			.forEach (function (file) {
				var id = file.replace ('.mp3', '');
				ids.push (parseInt(id));
			});

			Promise.map (ids, function (id) {
				return Songs.find ({ _id: id })
				.toArray ()
				.then (function (docs) {
					if (docs.length === 0) {
						var songPath = path.resolve (musicDir, id + '.mp3');
						var execStr = 'rm ' + songPath;
						return execPromise (execStr);
					}
				});
			}, { concurrency: 1 })
			.then (function () {
				res.sendStatus (200);
			});				
		});
	};
}());
