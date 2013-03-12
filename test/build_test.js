'use strict';

var grunt = require('grunt');
var fs = require('fs');

var dev_static = 'test/test-branches/static-a/',
		test_static = 'test/test-branches/static-a-test/',
		dev_tpl = 'test/test-branches/tpl-a/',
		test_tpl = 'test/test-branches/tpl-a-test/';

exports.isEmptyBranches = {
	main: function (test) {
		test.expect(1);
		var branches = grunt.config('_branches');
		test.ok(!branches.isEmpty(), 'branches is not empty after preprocess');
		test.done();
	}
};

exports.build = {
	minifyJs: function (test) {
		var original = fs.statSync(dev_static + 'js/new.js').size;
		var actual = fs.statSync(test_static + 'js/public/new.js').size;
		test.ok(actual < original, 'should minify new js file');

		original = fs.statSync(dev_static + 'js/modified.js').size;
		actual = fs.statSync(test_static + 'js/public/modified.js').size;
		test.ok(actual < original, 'should minify modified js file');

		test.ok(!grunt.file.exists(test_static + 'js/public/unchanged.js'), 'unchanged js file should not be minified');

		test.done();
	},
	minifyCss: function (test) {
		var original = fs.statSync(dev_static + 'css/new.css').size;
		var actual = fs.statSync(test_static + 'css/public/new.css').size;
		test.ok(actual < original, 'should minify new css file');

		original = fs.statSync(dev_static + 'css/modified.css').size;
		actual = fs.statSync(test_static + 'css/public/modified.css').size;
		test.ok(actual < original, 'should minify modified css file');

		test.ok(!grunt.file.exists(test_static + 'css/public/unchanged.css'), 'unchanged css file should not be minified');

		test.done();
	},
	processCss: function (test) {
		var expect = grunt.file.read('test/expected/vars.css');
		var result = grunt.file.read(test_static + 'css/public/vars.css');
		test.equal(expect, result, 'should replace all the variables with build.json');
		test.done();
	},
	minifyJpg: function (test) {
		var actual = fs.statSync(dev_static + 'img/optimize-jpg-test.jpg').size;
		var original = fs.statSync(test_static + 'img/optimize-jpg-test.jpg').size;
		test.ok(actual > original, 'should minify JPEG images');
		test.done();
	},
	minifyPng: function (test) {
		var actual = fs.statSync(dev_static + 'img/optimize-png-test.png').size;
		var original = fs.statSync(test_static + 'img/optimize-png-test.png').size;
		test.ok(actual > original, 'should minify PNG images');
		test.ok(!grunt.file.exists(test_static + 'img/unchanged.png'), 'unchanged img file should not be minified');

		test.done();
	},
	otherImgs: function (test) {
		var actual = fs.statSync(dev_static + 'img/loading.gif').size;
		var original = fs.statSync(test_static + 'img/loading.gif').size;
		test.ok(actual === original, 'should just copy the gif images');

		actual = fs.statSync(dev_static + 'img/res/october.swf').size;
		original = fs.statSync(test_static + 'img/res/october.swf').size;
		test.ok(actual === original, 'should just copy other resources');

		test.done();
	},
	tpl: function (test) {
		var actual = fs.statSync(dev_tpl + 'views/new.html').size;
		var original = fs.statSync(test_tpl + 'views/new.html').size;
		test.ok(actual === original, 'should just copy the html to test branch');
		// TODO
		// test.ok(!grunt.file.exists(test_tpl + 'views/unchanged.html'), 'should not process the unchanged html file');
		test.done();
	}
};

console.log(grunt.config('_output.st'));
// backup st data
// var st = { 'test/test-branches/tpl-a': { X: [ '?       test/test-branches/tpl-a/views/new.html' ] },
  // 'test/test-branches/static-a': 
   // { X: 
      // [ '?       test/test-branches/static-a/css/public/new.css',
        // '?       test/test-branches/static-a/css/public/vars.css',
        // '?       test/test-branches/static-a/js/public/new.js',
        // '?       test/test-branches/static-a/img/loading.gif',
        // '?       test/test-branches/static-a/img/optimize-png-test.png',
        // '?       test/test-branches/static-a/img/res/october.swf',
        // '?       test/test-branches/static-a/img/optimize-jpg-test.jpg' ],
     // M: 
      // [ 'M       test/test-branches/static-a/css/public/modified.css',
        // 'M       test/test-branches/static-a/js/public/modified.js' ] } };
