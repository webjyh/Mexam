var gulp = require('gulp'),
    jshint = require('gulp-jshint'),
    concat = require('gulp-concat'),
    uglify = require('gulp-uglify');

// 语法检查
gulp.task('jshint', function () {
    return gulp.src('js/Mexam.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

// 合并文件之后压缩代码
gulp.task('minify', function (){
    return gulp.src(['js/Mexam.js'])
               .pipe(concat('Mexam.min.js'))
               .pipe(gulp.dest('js'))
               .pipe(uglify())
               .pipe(gulp.dest('js'));
});

gulp.task('default', ['jshint', 'minify']);