(function () {
  'use strict';

  var express = require ('express');
  var path = require ('path');
  var fs = require ('fs');

  var router = express.Router ();

	var Promise = require ('bluebird');
	var mongodb = require ('mongodb');
	var MongoClient = mongodb.MongoClient;
  var	assert = require ('assert');
  var url = 'mongodb://localhost:27017/chartwatch';
  
	var dirs = [];
	dirs.push (path.resolve ('server/routes/chart'));
	dirs.push (path.resolve ('server/routes/file'));

	Promise.promisifyAll(mongodb);

	var addRoutes = function (dir, db) {
		fs.readdirSync (dir)
			.filter (function (file) {
				return (file.indexOf ('.') !== 0);
			})
			.forEach (function (file) {
				require (path.join (dir, file)) (router, db);
			});
	};

	MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);
		console.log("Connected succesfully to mongoDB server");

		for (var i in dirs) {
			addRoutes (dirs[i], db);
		}
	});

  /* GET home page. */
  router.get ('/', function (req, res) {
    res.render ('index');
  });

  module.exports = router;
}());
