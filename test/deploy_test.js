'use strict';

var grunt = require('grunt');
var fs = require('fs');

var dev_static = 'test/test-branches/static-a/',
		test_static = 'test/test-branches/static-a-test/',
		dev_tpl = 'test/test-branches/tpl-a/',
		test_tpl = 'test/test-branches/tpl-a-test/';

exports.deploy = {
	extractStatus: function (test) {
		var expected = {
			"test/test-branches/static-a": {
				"M": [
					"M test/test-branches/static-a/css/added.css",
					"M test/test-branches/static-a/js/added.js",
					"M test/test-branches/static-a/css/unchanged.css",
					"M test/test-branches/static-a/js/unchanged.js"
				]
			}
		};
		var actual = grunt.config('_output.st');
		test.deepEqual(actual, expected, 'extract status data from changelog as expected');
		test.done();
	},
	buildChangelog: function (test) {
		test.ok(grunt.file.exists(test_static + 'js/public/unchanged.js'), 'unchanged js file in changelog should be minified');
		test.ok(grunt.file.exists(test_static + 'css/public/unchanged.css'), 'unchanged css file in changelog should not be minified');
		test.done();
	},
	pick: function (test) {
		var dist = grunt.config('clean.picked');
		test.ok(grunt.file.exists(dist + '/unchanged.js'), 'should pick the added js');
		test.ok(grunt.file.exists(dist + '/unchanged.css'), 'should pick the unchanged css in changelog');
		test.done();
	}
};
