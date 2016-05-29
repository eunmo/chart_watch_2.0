(function () {
	'use strict';
	
	var Promise = require('bluebird');
	var exec = Promise.promisify(require('child_process').exec);

	var path = require('path');
	var uploadDir = path.resolve('uploads/temp');
	var musicDir = path.resolve('uploads/music');
	var imageDir = path.resolve('uploads/img');
	
	module.exports = function (router, db) {
		var Songs = db.collection ('Songs');
		var Albums = db.collection ('Albums');
		var Artists = db.collection ('Artists');
		var Counters = db.collection ('Counters');
		
		router.get ('/clean',function (req, res) {
			Counters.update ({ seq: { $gt: 0 } }, { $set: { seq: 0 } }, { multi: true })
			.then (function (doc) {
				return Songs.remove ({});
			})
			.then (function (doc) {
				return Albums.remove ({});
			})
			.then (function (doc) {
				return Artists.remove ({});
			})
			.then (function (doc) {
				var promises = [];

				promises.push( exec('rm -f '+ uploadDir + '/*'));
				promises.push( exec('rm -f '+ musicDir + '/*'));
				promises.push( exec('rm -f '+ imageDir + '/*'));

				return Promise.all (promises);
			})
			.then (function (doc) {
				res.sendStatus (200);
			});
		});
	};
}());
