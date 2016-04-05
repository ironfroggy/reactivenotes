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
var webserver = require('gulp-webserver');
var rsync = require('gulp-rsync');
var spawn = require('child_process').spawn;

var argv = require('yargs')
  .boolean('full')
  .alias('f', 'full')
  .boolean('watch')
  .alias('w', 'watch')
  .argv;

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
    return new Promise(function(resolve) {
      appBundler.bundle()
        .on('error', gutil.log)
        .pipe(source('main.jsx'))
        .pipe(gulpif(!options.development, streamify(uglify())))
        .pipe(rename('bundle.js'))
        .pipe(gulp.dest(options.dest))
        .pipe(gulpif(options.watch, livereload()))
        .pipe(notify(function () {
          console.log('APP bundle built in ' + (Date.now() - start) + 'ms');
          resolve();
        }));
    })
  };

  // Fire up Watchify when developing
  if (options.development && options.watch) {
    appBundler = watchify(appBundler);
    appBundler.on('update', rebundle);
  }

  var bundlePromise = rebundle();
  var vendorsPromise = bundleVendors(options);

  return Promise.all([vendorsPromise, bundlePromise]);
}

function bundleTests(options) {
  // var testFiles = glob.sync('./specs/**/*-spec.js');
  var testBundler = browserify({
    entries: ['test/main.js'],
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
    return new Promise(function(resolve) {
      testBundler.bundle()
      .on('error', gutil.log)
        .pipe(source('test/main.js'))
        .pipe(rename('testbundle.js'))
        .pipe(gulp.dest(options.dest))
        .pipe(gulpif(options.watch, livereload()))
        .pipe(notify(function () {
          console.log('TEST bundle built in ' + (Date.now() - start) + 'ms');
          resolve();
        }));
    });
  };

  var p = rebundleTests();
  if (options.watchify) {
    testBundler = watchify(testBundler);
    testBundler.on('update', rebundleTests);
    p.on = function(eventname, cb) {
      testBundler.on(eventname, cb);
    }
  }
  return p;
}

function bundleVendors(options) {
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
  return new Promise(function(resolve){
    vendorsBundler.bundle()
      .on('error', gutil.log)
      .pipe(source('vendors.js'))
      .pipe(gulpif(!options.development, streamify(uglify())))
      .pipe(gulp.dest(options.dest))
      .pipe(notify(function () {
        console.log('VENDORS bundle built in ' + (Date.now() - start) + 'ms');
        resolve();
      }));
  });
}

var cssTask = function (options) {
    if (options.development) {
      var promise;
      var run = function () {
        console.log(arguments);
        var start = new Date();
        console.log('Building CSS bundle');
        promise = gulp.src(options.src)
          .pipe(gulpif(options.watch, livereload()))
          .pipe(concat('main.less'))
          .pipe(less())
          .pipe(rename('main.css'))
          .pipe(gulp.dest(options.dest))
          .pipe(notify(function () {
            console.log('CSS bundle built in ' + (Date.now() - start) + 'ms');
          }));
      };
      run();
      if (options.watch) {
        gulp.watch(options.src, run);
      }
      return promise;
    } else {
      return gulp.src(options.src)
        .pipe(concat('main.less'))
        .pipe(less())
        .pipe(cssnano())
        .pipe(rename('main.css'))
        .pipe(gulp.dest(options.dest));
    }
}

function rebuild(options) {
  var options = options || {};

  return Promise.all([
    browserifyTask({
      development: options.development,
      watch: options.watch,
      src: './app/main.jsx',
      dest: './build/'
    }),
    cssTask({
      development: options.development,
      watch: options.watch,
      src: './styles/**/*.less',
      dest: './build'
    }),
  ]);
}

// Starts our development workflow
gulp.task('default', function () {
  rebuild({development: true});

  gulp.src('./build/')
    .pipe(webserver({
      port: 8889,
      livereload: true,
      fallback: 'index.html'
    })
  );

});

gulp.task('deploy', function () {

  var js = browserifyTask({
    development: false,
    src: './app/main.jsx',
    dest: './dist'
  });

  var css = cssTask({
    development: false,
    src: './styles/**/*.less',
    dest: './dist'
  });

  Promise.all([js, css]).then(()=>{
    console.log('Uploading...')
    gulp.src('dist/**')
      .pipe(rsync({
        root: 'dist',
        hostname: 'ash-alpha.ironfroggy.com',
        destination: '/var/www/reactivenotes.ironfroggy.com/',
        recursive: true,
      }))
  });

});

gulp.task('build', function(done) {
  rebuild({
    development: true,
    watch: argv.watch,
  }).then(function(){
    console.log("Build complete...");
    done();
  });
});


gulp.task('test', function(done) {
  var opts = {
    detect_browsers: argv.full,
    development: true,
    watchify: argv.watch,
    dest: "./build/",
  }
  var env = Object.assign(process.env);
  if (opts.detect_browsers) {
    env['KARMA_DETECT_BROWSERS'] = 'TRUE';
  }

  var vendorBuild = bundleVendors(opts);
  var testBuild = bundleTests(opts);

  function runTests() {
    console.log("Running test suite...");
    var test_runner = spawn("./node_modules/karma/bin/karma", ["start"], {
      stdio: "inherit",
      env: env,
    });
    test_runner.on('close', function(code) {
      if (code !== 0) {
        console.error('Tests exited with error code: ' + code);
      }
      done();
      done = function(){}
    });
  }

  Promise.all([vendorBuild, testBuild]).then(function() {
    runTests();
    testBuild.on('update', runTests);
  }, function(err) {
    console.error(err);
  });
});
