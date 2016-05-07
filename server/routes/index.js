(function () {
  'use strict';

  var express = require ('express');
  var path = require ('path');
  var fs = require ('fs');

  var router = express.Router ();

	var MongoClient = require('mongodb').MongoClient, assert = require('assert');
  var url = 'mongodb://localhost:27017/chartwatch';
  
	var routeDir = path.resolve ('server/routes');

	MongoClient.connect(url, function(err, db) {
		assert.equal(null, err);
		console.log("Connected succesfully to mongoDB server");

		fs.readdirSync (routeDir)
		  .filter (function (file) {
				return (file.indexOf ('.') !== 0) && (file !== 'index.js');
			})
			.forEach (function (file) {
				require (path.join (routeDir, file)) (router, db);
			});
	});

  /* GET home page. */
  router.get ('/', function (req, res) {
    res.render ('index');
  });

  module.exports = router;
}());
