import gulp from 'gulp';
import babel from 'gulp-babel';
import run from 'gulp-run';
import runSequence from 'run-sequence';

gulp.task('build', () => {
  return gulp.src('src/index.js')
    .pipe(babel())
    .pipe(gulp.dest('build'));
});

gulp.task('link', () => {
  run('npm link').exec();
});

gulp.task('watch', runSequence('build', 'link'), () => {
  gulp.watch('./src/**/*.js', () => {
    runSequence('build', 'link');
  });
});