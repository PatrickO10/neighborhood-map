'use strict';

var gulp = require('gulp'),
    uglify = require('gulp-uglify'),
    cssshrink = require('gulp-cssshrink'),
    imagemin = require('gulp-imagemin'),
    imageop = require('gulp-image-optimization'),
    uncss = require('gulp-uncss'),
    concatCss = require('gulp-concat-css'),
    minifyHTML = require('gulp-minify-html'),
    browserSync = require('browser-sync'),
    reload = browserSync.reload,
    pagespeed = require('psi'),
    jshint = require('gulp-jshint'),
    csslint = require('gulp-csslint');

// Images Task
// Optimize Images

gulp.task('image', function () {
    gulp.src('img/*')
        .pipe(imagemin({
          progressive: true,
          interlaced: true
        }))
        .pipe(gulp.dest('build/imgopt'));
});

// Uncss Task
// Remove unused CSS

gulp.task('uncss', function() {
    gulp.src('build/build.min.css')
        .pipe(uncss({
            html: ['index.html']
        }))
        .pipe(gulp.dest('build/uncss'));
});

// Minify HTML Task
// Minify HTML

gulp.task('minify-html', function() {
    var opts = {comments:true,spare:true};

  gulp.src('*.html')
    .pipe(minifyHTML(opts))
    .pipe(gulp.dest('build'))
});

// JS Task
// Minify JS

gulp.task('uglify-js', function(){
  gulp.src('js/*.js')
    .pipe(uglify())
    .pipe(gulp.dest('build/js'))
});

// JS lint Task
// Lint JS

gulp.task('jslint', function() {
    gulp.src('js/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'))
});

// CSS Lint Task
// Lint CSS

gulp.task('csslint', function() {
    gulp.src('css/*.css')
        .pipe(csslint())
        .pipe(csslint.reporter('default'))
});

// CSS Task
// Concatenate And Minify CSS

gulp.task('css', function() {
    gulp.src('css/*.css')
        .pipe(concatCss("bundle.min.css"))
        .pipe(cssshrink())
        .pipe(gulp.dest('build/css'));
});

// PageSpeed Task
// Run PageSpeed Insights

gulp.task('pagespeed', pagespeed.bind(null, {
  url: 'https://patricko10.github.io/neighborhood-map',
  strategy: 'mobile'
}));


