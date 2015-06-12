'use strict';

var child_process = require('child_process');
var gulp = require('gulp');
var path = require('path');
var fs = require('fs-extra');
var exporter = require('gwt-api-exporter');

var pack = require('./package.json');
var packGPL = {};
for (var i in pack) {
    if (pack.hasOwnProperty(i))
        packGPL[i] = pack[i];
}
packGPL.license = 'GPL-3.0';

var argv = require('minimist')(process.argv.slice(2));

var verbose = argv.v;

var modules = require('./modules.json');
if(argv.m) {
    for (var i = 0; i < modules.length; i++) {
        if(modules[i].name === argv.m) {
            modules = [modules[i]];
            break;
        }
    }
    if (modules.length !== 1) {
        throw new Error('module ' + argv.m + ' not found');
    }
}

try {
    var config = require('./config.json');
} catch (e) {
    console.error('config.json not found. You can copy config.default.json to start from an example.');
    process.exit(1);
}

var classpath = ['src'];

if (config.classpath) {
    if (typeof config.classpath === 'string') {
        classpath.push(config.classpath);
    } else if (Array.isArray(config.classpath)) {
        classpath = classpath.concat(config.class);
    }
}

classpath.push(path.join(config.gwt, 'gwt-dev.jar'), path.join(config.gwt, 'gwt-user.jar'));

classpath = classpath.join(':');

gulp.task('compile:min', compile('min'));
gulp.task('compile:pretty', compile('pretty'));

gulp.task('build:pretty', ['compile:pretty'], build);
gulp.task('build:min', ['compile:min'], build);
gulp.task('export', build);

gulp.task('default', ['build:min']);

gulp.task('copy:openchemlib', copyOpenchemlib);
gulp.task('copy:datawarrior', copyDatawarrior);

function build(done) {
    var prom = [];
    for (var k = 0; k < modules.length; k++) {
        var mod = modules[k];
        log('Exporting module ' + mod.name);
        var warDir = path.join('war', mod.war);
        var files = fs.readdirSync(warDir);
        var file;
        for (var i = 0; i < files.length; i++) {
            if (files[i].indexOf('.cache.js') > 0) {
                file = path.join(warDir, files[i]);
                break;
            }
        }
        if (!file) {
            throw new Error('Could not find GWT file for module ' + mod.name);
        }

        var packageJSON = (mod.name === 'enhanced') ? packGPL : pack;

        prom.push(exporter({
            input: file,
            output: 'dist/openchemlib-' + mod.name + '.js',
            exports: 'OCL',
            fake: mod.fake,
            'package': packageJSON
        }));
    }
    Promise.all(prom).then(function () {
        done();
    }, function (e) {
        console.error(e);
        process.exit(1);
    })
}

function compile(mode) {
    return function () {
        for (var i = 0; i < modules.length; i++) {
            log('Compiling module ' + modules[i].name);
            var args = [
                '-Xmx512m',
                '-cp', classpath,
                'com.google.gwt.dev.Compiler',
                modules[i].entrypoint,
                '-optimize', '9',
                '-XnocheckCasts',
                '-XnoclassMetadata',
                '-nocheckAssertions',
                '-XjsInteropMode', 'JS',
                '-style'
            ];
            if (mode === 'min') {
                args.push('OBF');
            } else {
                args.push('PRETTY');
            }
            if (verbose) {
                args.push('-logLevel', 'DEBUG');
            }
            var result = child_process.execFileSync('java', args);
            if (verbose) {
                var name = 'compile-' + modules[i].name + '.log';
                log('Compilation log written to ' + name);
                fs.writeFileSync('./' + name, result);
            }
        }
    }
}

function copyOpenchemlib() {
    var chemlibDir = config.openchemlib;
    var outDir = './src/com/actelion/research/gwt/chemlib/';
    var modifiedDir = './openchemlib/modified/';

    var chemlibClasses = require('./openchemlib/classes');

    var toCopy = chemlibClasses.copy;
    log('Copying ' + toCopy.length + ' classes from openchemlib');
    for (var i = 0; i < toCopy.length; i++) {
        fs.copySync(path.join(chemlibDir, toCopy[i]), outDir + toCopy[i]);
    }

    var modified = chemlibClasses.modified;
    log('Copying ' + modified.length + ' modified classes');
    for (var i = 0; i < modified.length; i++) {
        fs.copySync(modifiedDir + modified[i], outDir + modified[i]);
    }
}

function copyDatawarrior() {
    var dwarDir = config.datawarrior;
    var outDir = './src/com/actelion/research/gwt/datawarrior/';
    var modifiedDir = './datawarrior/modified/';

    var dwarClasses = require('./datawarrior/classes');

    var toCopy = dwarClasses.copy;
    log('Copying ' + toCopy.length + ' classes from datawarrior');
    for (var i = 0; i < toCopy.length; i++) {
        fs.copySync(path.join(dwarDir, toCopy[i]), outDir + toCopy[i]);
    }

    var modified = dwarClasses.modified;
    log('Copying ' + modified.length + ' modified classes');
    for (var i = 0; i < modified.length; i++) {
        fs.copySync(modifiedDir + modified[i], outDir + modified[i]);
    }
}

function log(value) {
    if (verbose) {
        console.log(value);
    }
}
