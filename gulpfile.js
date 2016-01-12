var gulp = require('gulp');
var source = require('vinyl-source-stream'); // Used to stream bundle for further handling
var browserify = require('browserify');
var watchify = require('watchify');
var babelify = require('babelify');
var gulpif = require('gulp-if');
var uglify = require('gulp-uglify');
var streamify = require('gulp-streamify');
var notify = require('gulp-notify');
var concat = require('gulp-concat');
var cssnano = require('gulp-cssnano');
var gutil = require('gulp-util');
var rename = require("gulp-rename");
var less = require('gulp-less');
var glob = require('glob');
var path = require('path');
var livereload = require('gulp-livereload');
var jasminePhantomJs = require('gulp-jasmine2-phantomjs');
var webserver = require('gulp-webserver');

// External dependencies you do not want to rebundle while developing,
// but include in your application deployment
var dependencies = [
  'react',
  'react/addons'
];

var browserifyTask = function (options) {

  // Our app bundler
  var appBundler = browserify({
    entries: [options.src], // Only need initial file, browserify finds the rest
     transform: [babelify], // We want to convert JSX to normal javascript
    debug: options.development, // Gives us sourcemapping
    cache: {}, packageCache: {}, fullPaths: options.development // Requirement of watchify
  });

  // We set our dependencies as externals on our app bundler when developing
  (options.development ? dependencies : []).forEach(function (dep) {
    appBundler.external(dep);
  });

  // The rebundle process
  var rebundle = function () {
    var start = Date.now();
    console.log('Building APP bundle');
    appBundler.bundle()
      .on('error', gutil.log)
      .pipe(source('main.jsx'))
      .pipe(gulpif(!options.development, streamify(uglify())))
      .pipe(rename('main.js'))
      .pipe(gulp.dest(options.dest))
      .pipe(gulpif(options.development, livereload()))
      .pipe(notify(function () {
        console.log('APP bundle built in ' + (Date.now() - start) + 'ms');
      }));
  };

  // Fire up Watchify when developing
  if (options.development) {
    appBundler = watchify(appBundler);
    appBundler.on('update', rebundle);
  }

  rebundle();

  // We create a separate bundle for our dependencies as they
  // should not rebundle on file changes. This only happens when
  // we develop. When deploying the dependencies will be included
  // in the application bundle
  if (options.development) {

    var testFiles = glob.sync('./specs/**/*-spec.js');
    var testBundler = browserify({
      entries: testFiles,
      debug: true, // Gives us sourcemapping
      transform: [babelify],
      cache: {}, packageCache: {}, fullPaths: true // Requirement of watchify
    });

    dependencies.forEach(function (dep) {
      testBundler.external(dep);
    });

    var rebundleTests = function () {
      var start = Date.now();
      console.log('Building TEST bundle');
      testBundler.bundle()
      .on('error', gutil.log)
        .pipe(source('specs.js'))
        .pipe(gulp.dest(options.dest))
        .pipe(livereload())
        .pipe(notify(function () {
          console.log('TEST bundle built in ' + (Date.now() - start) + 'ms');
        }));
    };

    testBundler = watchify(testBundler);
    testBundler.on('update', rebundleTests);
    rebundleTests();

    // Remove react-addons when deploying, as it is only for
    // testing
    if (!options.development) {
      dependencies.splice(dependencies.indexOf('react-addons'), 1);
    }

    var vendorsBundler = browserify({
      debug: true,
      require: dependencies
    });

    // Run the vendor bundle
    var start = new Date();
    console.log('Building VENDORS bundle');
    vendorsBundler.bundle()
      .on('error', gutil.log)
      .pipe(source('vendors.js'))
      .pipe(gulpif(!options.development, streamify(uglify())))
      .pipe(gulp.dest(options.dest))
      .pipe(notify(function () {
        console.log('VENDORS bundle built in ' + (Date.now() - start) + 'ms');
      }));

  }

}

var cssTask = function (options) {
    if (options.development) {
      var run = function () {
        console.log(arguments);
        var start = new Date();
        console.log('Building CSS bundle');
        gulp.src(options.src)
          .pipe(gulpif(options.development, livereload()))
          .pipe(concat('main.less'))
          .pipe(less())
          .pipe(rename('main.css'))
          .pipe(gulp.dest(options.dest))
          .pipe(notify(function () {
            console.log('CSS bundle built in ' + (Date.now() - start) + 'ms');
          }));
      };
      run();
      gulp.watch(options.src, run);
    } else {
      gulp.src(options.src)
        .pipe(concat('main.less'))
        .pipe(less())
        .pipe(cssnano())
        .pipe(rename('main.css'))
        .pipe(gulp.dest(options.dest));
    }
}

// Starts our development workflow
gulp.task('default', function () {
  browserifyTask({
    development: true,
    src: './app/main.jsx',
    dest: './build'
  });

  cssTask({
    development: true,
    src: './styles/**/*.less',
    dest: './build'
  });

  gulp.src('./build/')
    .pipe(webserver({
      port: 8889,
      livereload: true,
      fallback: 'index.html'
    })
  );

});

gulp.task('deploy', function () {

  browserifyTask({
    development: false,
    src: './app/main.jsx',
    dest: './dist'
  });

  cssTask({
    development: false,
    src: './styles/**/*.less',
    dest: './dist'
  });

});

gulp.task('test', function () {
    return gulp.src('./build/testrunner-phantomjs.html').pipe(jasminePhantomJs());
});
