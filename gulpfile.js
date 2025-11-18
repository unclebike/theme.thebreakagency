const {src, dest} = require('gulp');
const gulpZip = require('gulp-zip');

function zipper() {
    const filename = require('./package.json').name + '.zip';

    return src([
        '**',
        '!node_modules', '!node_modules/**',
        '!dist', '!dist/**',
        '!.git', '!.git/**',
        '!.github', '!.github/**',
        '!yarn-error.log',
        '!deploy.sh',
        '!gulpfile.js',
        '!.DS_Store',
        '!*.zip'
    ])
    .pipe(gulpZip(filename))
    .pipe(dest('dist/'));
}

exports.zip = zipper;
exports.default = zipper;
