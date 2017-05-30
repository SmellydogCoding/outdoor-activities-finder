'use strict';

import plugins  from 'gulp-load-plugins';
import yargs    from 'yargs';
import gulp     from 'gulp';
import rimraf   from 'rimraf';
import yaml     from 'js-yaml';
import fs       from 'fs';
import nodemon  from 'gulp-nodemon';

// Load all Gulp plugins into one variable
const $ = plugins();

// Check for --production flag
const PRODUCTION = !!(yargs.argv.production);

// Load settings from settings.yml
const { COMPATIBILITY, PORT, UNCSS_OPTIONS, PATHS } = loadConfig();

function loadConfig() {
  let ymlFile = fs.readFileSync('config.yml', 'utf8');
  return yaml.load(ymlFile);
}

// Build the "dist" folder by running all of the below tasks
gulp.task('build',
 gulp.series(clean, gulp.parallel(sass, javascript, images, copyBackend, copyViews,copyFonts))
);

// Build the site, run the server, and watch for file changes
gulp.task('default',
  gulp.series('build', server, watch));

// Delete the "dist" folder
// This happens every time a build starts
function clean(done) {
  rimraf(PATHS.dist, done);
}

// Copy application .js files, views, and fonts folder
// These tasks skip over the "static" and "scss" folders, which are parsed separately
function copyBackend() {
  return gulp.src(PATHS.nodejs)
    .pipe(gulp.dest(PATHS.dist));
}

function copyViews() {
  return gulp.src(PATHS.views)
    .pipe(gulp.dest(PATHS.dist + '/views'));
}

function copyFonts() {
  return gulp.src('static/fonts/**/*')
    .pipe(gulp.dest(PATHS.dist + '/public/fonts'));
}

// Compile Sass into CSS
// In production, the CSS is compressed
function sass() {
  return gulp.src('scss/app.scss')
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      includePaths: PATHS.sass
    })
      .on('error', $.sass.logError))
    .pipe($.autoprefixer({
      browsers: COMPATIBILITY
    }))
    .pipe($.if(PRODUCTION, $.cssnano()))
    .pipe($.if(!PRODUCTION, $.sourcemaps.write()))
    .pipe(gulp.dest(PATHS.dist + '/public/css'));
}

// Combine JavaScript into one file
// In production, the file is minified
function javascript() {
  return gulp.src(PATHS.javascript)
    .pipe($.sourcemaps.init())
    .pipe($.babel({ignore: ['vue.js','vue-resource.min.js']}))
    .pipe($.concat('app.js'))
    .pipe($.if(PRODUCTION, $.uglify()
      .on('error', e => { console.log(e); })
    ))
    .pipe($.if(!PRODUCTION, $.sourcemaps.write()))
    .pipe(gulp.dest(PATHS.dist + '/public/js'));
}

// Copy images to the "dist" folder
// In production, the images are compressed
function images() {
  return gulp.src('static/img/**/*')
    .pipe($.if(PRODUCTION, $.imagemin({
      progressive: true
    })))
    .pipe(gulp.dest(PATHS.dist + '/public/img'));
}

// Start the Node server
function server(done) {
  nodemon({
    script: 'dist/app.js'
  , ext: 'js'
  , env: { 'NODE_ENV': 'development' }
  })
  done();
}

// Watch for changes to static assets, pages, Sass, and JavaScript
function watch() {
  gulp.watch(PATHS.nodejs, copyBackend);
  gulp.watch(PATHS.views, copyViews);
  gulp.watch('static/fonts/**/*', copyFonts);
  gulp.watch('scss/**/*.scss').on('all', gulp.series(sass));
  gulp.watch('static/js/**/*.js').on('all', gulp.series(javascript));
  gulp.watch('static/img/**/*').on('all', gulp.series(images));
}