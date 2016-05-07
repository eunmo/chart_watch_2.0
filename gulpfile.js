(function() {
  'use strict';

  var gulp = require('gulp'),
    nodemon = require('gulp-nodemon'),
    watch = require('gulp-watch'),
    jshint = require('gulp-jshint'),
    _paths = ['server/**/*.js', 'client/js/*.js'];


  //register nodemon task
  gulp.task('nodemon', function() {
    nodemon({
      script: 'server/app.js',
      env: {
        'NODE_ENV': 'development'
      }
    })
      .on('restart');
  });

  // Rerun the task when a file changes
  gulp.task('watch', function() {
    gulp.watch(_paths, ['lint']);
  });

  //lint js files
  gulp.task('lint', function() {
    gulp.src(_paths)
      .pipe(jshint())
      .pipe(jshint.reporter('default'));
  });


  // The default task (called when you run `gulp` from cli)
  gulp.task('default', ['lint', 'nodemon', 'watch']);

}());
