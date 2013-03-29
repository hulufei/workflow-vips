/*global module:false*/
var path = require('path');
module.exports = function(grunt) {
	// Project configuration.
	grunt.initConfig({
		// Metadata.
		pkg: grunt.file.readJSON('package.json'),
		buildConfig: grunt.file.readJSON('build.json'),
		project: grunt.file.readJSON('project.json'),

		// internal config variables
		// 项目配置
		_project: {
			name: 'default'
		},
		// 分支信息
		_branches: {
			dev: {
				'tpl': [],
				'static': []
			},
			test: {
				'tpl': [],
				'static': []
			},
			getAll: function (name) { 
				var arr = [], branches, that = this;
				branches = name ? [name] : ['dev', 'test'];
				branches.forEach(function (branch) {
					var bs = that[branch];
					for (var k in bs) {
						arr = arr.concat(bs[k]);
					}
				});
				return arr;
			},
			clean: function () {
				this.dev.tpl = this.dev.static = this.test.tpl = this.test.static = [];
			},
			isEmpty: function () {
				return !this.getAll().length;
			},
		},
		// 保存输出信息
		_output: {
			// 文件状态列表
			st: { }
		},

		// Task configuration.
		branch_src: 'branch-dev',
		branch_dest: 'branch-dev-test',

		jshint: {
			options: {
				curly: true,
				eqeqeq: true,
				immed: true,
				indent: 4,
				latedef: true,
				newcap: true,
				noarg: true,
				sub: true,
				undef: true,
				unused: true,
				boss: true,
				eqnull: true,
				browser: true,
				jquery: true
			},
			gruntfile: {
				options: {
					// @see http://goo.gl/Oxp5z
					loopfunc: true,
					browser: false,
					node: true,
					es5: true
				},
				src: 'Gruntfile.js'
			},
			vips: '<%= uglify.vips %>',
			tests: {
				options: {
					browser: false,
					node: true,
					es5: true
				},
				src: ['test/*.js']
			}
		},
		csslint: {
			vips: '<%= cssmin.vips %>'
		},
		watch: {
			gruntfile: {
				files: '<%= jshint.gruntfile.src %>',
				tasks: ['jshint:gruntfile']
			},
			tests: {
				files: '<%= jshint.tests.src %>',
				tasks: ['jshint:tests', 'test']
			}
		},
		copy: {
			vips: {
				expand: true,
				cwd: '<%= branch_src %>/img',
				src: ['**/*', '!**/*.{jpg,jpeg,png,db}'],
				dest: '<%= branch_dest %>/img/'
			},
			tpl: {
				expand: true,
				cwd: '<%= branch_src %>/views',
				src: ['**/*'],
				dest: '<%= branch_dest %>/views/'
			}
		},
		uglify: {
			options: {
				mangle: true
			},
			vips: {
				expand: true,
				cwd: '<%= branch_src %>/js/',
				src: ['**/*.js'],
				dest: '<%= branch_dest %>/js/public/'
			}
		},
		closurecompiler: {
			options: {
				'compilation_level': 'WHITESPACE_ONLY'
			},
			vips: '<%= uglify.vips %>'
		},
		cssmin: {
			vips: {
				expand: true,
				cwd: '<%= branch_src %>/css',
				src: ['**/*.css'],
				dest: '<%= branch_dest %>/css/public/'
			}
		},
		processCss: {
			options: {
				imgDomain: '<%= buildConfig.imgDomain %>'
			},
			vips: {
				expand: true,
				cwd: '<%= cssmin.vips.dest %>',
				src: ['**/*.css']
			}
		},
		imagemin: {
			options: {
				optimizationLevel: 3
			},
			vips: {
				expand: true,
				cwd: '<%= branch_src %>/img/',
				src: ['**/*.{jpg,jpeg,png}'],
				dest: '<%= branch_dest %>/img/'
			}
		},
		shell: {
			commit: {
				command: 'svn commit -m "' + grunt.option('m') + '" <%= branch_dest %>',
				options: {
					stdout: true,
					callback: function (err, stdout, stderr, cb) {
						grunt.log.ok(grunt.config('shell.commit.command').green);
						if (err) {
							grunt.fatal(err, 1);
						}
						ChangeLog.generate(stdout);
						cb();
					}
				}
			},
			update: {
				command: 'svn update ' + '<%= branch_dest %>',
				options: {
					stderr: true,
					callback: function (err, stdout, stderr, cb) {
						grunt.log.ok(grunt.config('shell.update.command').green);
						if (err) {
							grunt.fatal(err, 1);
						}
						cb();
					}
				}
			},
			st: {
				command: 'svn st ' + '<%= branch_dest %>',
				options: {
					callback: function (err, stdout, stderr, cb) {
						grunt.log.ok(grunt.config('shell.st.command').green);
						if (err) {
							grunt.fatal(err, 1);
						}
						var lines = stdout.split(grunt.util.linefeed),
							branch = grunt.config('branch_dest'),
							st_data = grunt.config('_output.st');
						var cwd = grunt.option('cwd');
						st_data[branch] = st_data[branch] || {};
						if (lines.length > 1) {
							lines.map(function (line) {
								['A', 'M', 'C', 'D', '\\?'].map(function (st) {
									// Note: match filepath pattern: /.*\s(.*)/
									var pattern = new RegExp('^' + st + '.*');
									var matches = line.match(pattern);
									if (matches) {
										// 未纳入版本控制'?'用'X'表示
										st = st === '\\?' ? 'X' : st;
										grunt.log.debug('line: ' + line);
										grunt.log.debug('status pattern: ' + pattern);
										grunt.log.debug('status matches: ' + matches);
										grunt.log.debug('replaced cwd: ' + cwd);
										st_data[branch][st] = st_data[branch][st] || [];
										st_data[branch][st].push(matches[0].replace(cwd, ''));
									}
								});
							});
						}
						grunt.config('_output.st', st_data);
						cb();
					}
				}
			}
		},
		clean: {
			picked: 'picked-dist'
		},
		nodeunit: {
			build: ['test/build_test.js'],
			deploy: ['test/deploy_test.js']
		},

		// TODO
		// 映射dev-test，任何在dev中删除文件的操作都映射到test中
		mirror: {},
		// 根据修改的图片文件自动更新版本号
		updateVer: {}
	});

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-copy');
	// grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-imagemin');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-closurecompiler');
	grunt.loadNpmTasks('grunt-shell');
	//grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-nodeunit');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-csslint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	// load all grunt tasks
	//require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);


	/*
	 * 自动生成更改文件列表: projectname-changelog
	 * revData: svn提交返回的信息
	 * err: svn返回的错误信息
	 */
	var ChangeLog = {
		// must be normalized project config
		project: '', 
		branch: '',
		disabled: false,
		extractStatus: function () {
			var st_data = grunt.option('_output.st') || {};
			if (Object.keys(st_data).length > 0) {
				return st_data;
			}
			var project = this.project || grunt.config('_project');
			var name = project.name + '-CHANGELOG';
			if (!grunt.file.exists(name)) {
				grunt.warn(name + ' does not exist!'.red);
			}
			else {
				var changelog = grunt.file.readJSON(name);
				var dev_branches = grunt.config('_branches').getAll('dev');
				var files = [], v, branch;
				for (branch in changelog) {
					if (dev_branches.indexOf(branch) === -1) {
						// ignore test branch
						continue;
					}
					v = changelog[branch];
					if (typeof  v === 'object') {
						files = files.concat(
							Object.keys(v).map(function (item) {
								return 'M ' + path.join(branch, item);
							})
						);
						st_data[branch] = st_data[branch] || {};
						st_data[branch]['M'] = files;
					}
				}
			}
			grunt.config('_output.st', st_data);
			return st_data;
		},
		generate: function (revData, rev) {
			if (this.disabled) {
				return;
			}
			var branch = this.branch || grunt.option('branch'),
				project = this.project;
			grunt.log.debug('Begin generate change log for: ' + project.name);
			if (!branch) {
				grunt.fatal('需要指定提交的branch', 1);
			}
			var cwd = grunt.option('cwd');
			// 兼容windows路径
			cwd = cwd ? cwd.replace(/\\/g, '/') : '';
			branch = branch.replace(/\\/g, '/');
			var changelog = project.name + '-CHANGELOG';
			var lines = revData.trim().split(grunt.util.linefeed);
			var filepath = '', filePattern, json = {};
			grunt.log.debug('Cwd: ' + cwd);
			grunt.log.debug('Branch: ' + branch);
			if (grunt.file.exists(changelog)) {
				grunt.log.debug('File: ' + changelog + ' exists');
				json = grunt.file.readJSON(changelog);
			}
			else {
				// 关于项目的说明，可以配置在<%= project.description %>
				json['description'] = project.description || '';
			}
			if (rev) {
				// revData read from hook
				filePattern = /(.*\/.*\..+)/;
			}
			else {
				// revData from command line
				filePattern = /.*\s(.*\/.*\..+)/;
				if (lines.length > 0) {
					rev = lines[lines.length - 1].match(/\d+/);
				}
			}
			grunt.log.debug('lines: ' + lines);
			grunt.log.debug('last line: ' + lines[lines.length - 1]);
			grunt.log.debug('rev: ' + rev);
			filePattern.compile(filePattern);
			lines.map(function (line) {
				// 兼容windows文件路径
				line = line.replace(cwd, '').replace(/\\/g, '/');
				var match = line.match(filePattern);
				if (match) {
					grunt.log.debug('file matches: ' + match);
					filepath = match[1].replace(branch + '/', '').trim();
					json[branch] = json[branch] || {};
					json[branch][filepath] = 'r' + rev;
				}
			});
			// 如果有删除的文件更改，标注为'D'
			var st_data = grunt.config('_output.st');
			if (st_data.D) {
				st_data.D.map(function (line) {
					filepath = line.match(filePattern)[1].replace(branch + '/', '').trim();
					grunt.log.debug('Deleted file: ' + filepath);
					json[branch][filepath] = 'D';
				});
			}
			grunt.file.write(changelog, JSON.stringify(json, null, 4));
			grunt.config('_output.changelog', json);
			//grunt.log.writeln('Changelog generated: ' + changelog);
		}
	};

	/* 在push之前做一些预处理
	 * Check project config
	 * Set internal configs
	 */
	function preprocess(project) {
		var branches = grunt.config('_branches');
		if (!branches.isEmpty()) {
			return branches;
		}
		project = project ? grunt.config(project) : grunt.config('project');
		// 检查配置
		['name', 'branches'].map(function (name) {
			if (!project.hasOwnProperty(name)) {
				grunt.log.error(project);
				grunt.fatal('缺失配置：' + name, 1);
			}
		});
		if (project.name.trim() === '') {
			grunt.fatal('请指定要构建的项目名', 1);
		}

		// join branches
		var joined_branches = {},
				base = project.branches['base'];
		if (base) {
			['static', 'tpl'].forEach(function (k) {
				var bs = project.branches[k];
				joined_branches[k] = joined_branches[k] || {};
				for (var dev in bs) {
					// remove last slash
					dev = dev.replace(/[\/\\]$/, '');
					// compatible with windows
					var src = path.join(base, dev).replace(/\\/g, '/');
					var des = path.join(base, bs[dev]).replace(/\\/g, '/');
					joined_branches[k][src] = des;
				}
			});
			project.branches = joined_branches;
		}

		// 保存所有相关的分支名
		var branch_src = '',
				static_branches = project.branches['static'] || {},
				tpl_branches = project.branches['tpl'] || {};
		for (branch_src in static_branches) {
			branches.dev.static.push(branch_src);
			branches.test.static.push(static_branches[branch_src]);
		}
		for (branch_src in tpl_branches) {
			branches.dev.tpl.push(branch_src);
			branches.test.tpl.push(tpl_branches[branch_src]);
		}
		// 设置到内部，共享使用
		grunt.config('_project', project);
		grunt.config('_branches', branches);
		return branches;
	}

	// 提交到测试分支
	grunt.registerTask('push', [
		'upall:dev', 
		'statuslog:dev', 
		'build', 
		'statuslog:test', 
		'commitall:test', 
		'commitall:dev', 
		'finish'
	]);
	// 发布, NOTE: BASED ON CHANGELOG
	grunt.registerTask('deploy', [
		'upall:dev', 
		'rever',
		'build:changelog',
		'pick',
		'finish'
	]);
	// 不依赖网络，可供预览更改
	grunt.registerTask('taste', [
		'statuslog:dev', 
		'build', 
		'statuslog:test', 
		'finish'
	]);
	// 监听文件更改，做csslint和jshint
	grunt.registerTask('monitor', ['watch_setup', 'watch:vips']);
	// unit test
	grunt.registerTask('test', [
		'test_setup', 
		'clean:test',
		'statuslog:dev', 
		'build', 
		'nodeunit:build', 
		'clean:test',
		'deploy',
		'nodeunit:deploy',
		'clean'
	]);

	// set for testing the workflow
	grunt.registerTask('test_setup', function () {
		var project = grunt.file.readJSON('test/project.json');
		var build = grunt.file.readJSON('test/build.json');
		var changelog = project.name + '-CHANGELOG';
		grunt.config('project', project);
		grunt.config('build', build);
		grunt.file.copy('test/' + changelog, changelog);
		var branches = preprocess('project');
		grunt.config('clean.test', branches.getAll('test'));
		grunt.config('clean.config', [changelog]);
		grunt.option('test', true);
	});

	// 建立watch任务，对应分支做jshint，csslint
	// TODO: 甚至在项目开始前svn copy新建分支
	grunt.registerTask('watch_setup', function () {
		var branches = preprocess('project');
		var vips = {
			files: [],
			tasks: ['lint']
		};
		branches.getAll('dev').forEach(function (branch) {
			vips.files.push(path.join(branch, '**/*.js'));
			vips.files.push(path.join(branch, '**/*.css'));
		});
		grunt.config('watch.vips', vips);
	});

	// lint added/modified js and css
	grunt.registerTask('lint', function () {
		var branches = preprocess('project');
		grunt.task.run('statuslog:dev');
		branches.getAll('dev').forEach(function (branch) {
			grunt.task.run(['apply', 'jshint', branch].join(':'));
			grunt.task.run(['apply', 'csslint', branch].join(':'));
		});
	});

	/**
	 * build task
	 * @param {String} target
	 *	"all": build all branches in project.json(default)
	 *	"noimage": build all except images
	 *	"changelog": build files in changelog file
	 */
	grunt.registerTask('build', function (target) {
		preprocess('project');
		var project = grunt.config('_project');
		var static_branches = project.branches['static'] || {},
				tpl_branches = project.branches['tpl'] || {},
				branch_src = '',
				branch_dest = '';
		var build_tasks = ['closurecompiler', 'cssmin', 'processCss', 'imagemin', 'copy'];

		if (target === 'changelog') {
			ChangeLog.project = project;
			ChangeLog.extractStatus();
		}
		else if (target === 'noimage') {
			grunt.option('all', true);
			// exclude imagemin task(too many images)
			build_tasks = build_tasks.filter(function (t) {
				return (t !== 'imagemin' && t !== 'copy');
			});
		}

		// 对应静态资源分支的处理
		for (branch_src in static_branches) {
			grunt.log.debug('Building ' + branch_src);
			branch_dest = static_branches[branch_src];
			build_tasks.forEach(function (task) {
				// 生成对应的配置段
				grunt.task.run(['apply', task, branch_src, branch_dest].join(':'));
			}); 
		}

		// 对应模板页面分支的处理
		for (var tpl_src in tpl_branches) {
			var tpl_dest = tpl_branches[tpl_src];
			// 同步模板页
			grunt.task.run('copytpl:' + tpl_src + ':' + tpl_dest);
		}
	});

	// CSS变量替换
	grunt.registerMultiTask('processCss', 'replace variables in CSS', function () {
		var options =  this.options({
			imgDomain: '',
			versions: grunt.config('buildConfig')
		});
		var imgDomain = options.imgDomain,
				versions = options.versions;
		var variablePattern = /\{\$.*?\}/;
		variablePattern.compile(variablePattern);
		function process(filepath) {
			if (grunt.file.exists(filepath) && grunt.file.isFile(filepath)) {
				var css = grunt.file.read(filepath).replace(/\{\$imgDomain\}|\{\$staticImg\}/gm, imgDomain);
				for (var param in versions) {
					var pattern = new RegExp('\\{\\$' + param + '\\}', 'gm');
					css = css.replace(pattern, versions[param]);
				}

				// check if all variables are replaced
				if (variablePattern.test(css)) {
					grunt.fatal('File ' + filepath +
						'\nVariables does not be replaced all:' + css.match(variablePattern), 1);
				}
				grunt.file.write(filepath, css);
				grunt.log.ok('Replace ' + filepath + ' Done!');
			}
			else if (grunt.file.isDir(filepath)) {
				grunt.log.warn('Process a directory: ' + filepath);
				grunt.file.recurse(filepath, process);
			}
			else {
				grunt.log.warn('Soure file ' + filepath + ' not found');
			}
		}

		this.filesSrc.forEach(process);
	});

	// task wrapper，keep config values per task.
	grunt.registerTask('apply', function (task, branch_src, branch_dest) {
		grunt.config('branch_src', branch_src);
		grunt.config('branch_dest', branch_dest);

		// var st_data = ChangeLog.getStData();
		var st_data = grunt.config('_output.st');
		var st = st_data[branch_src];
		grunt.log.debug(st);
<<<<<<< HEAD
		// Process whole branch
		if (grunt.option('all')) {
=======
		// Process whole branch files, except imagemin task
		if (grunt.option('all') && (task !== 'imagemin')) {
>>>>>>> de3ffcb652ecef2c21d34ef55d3b88b57651d594
			grunt.task.run(task);
		}
		else if(st && (st.X || st.M || st.A)) {
			// Only process the added, changed or the new files(X, M, A)
			// 复制一个新target，防止原配置被覆盖
			grunt.config(task + '.vips_clone', grunt.config(task + '.vips'));
			var patterns = grunt.config(task).vips.src;
			var cwd = grunt.config(task).vips.cwd;
			// FIXME: it's dirty, but works
			if (task === 'processCss') {
				cwd = grunt.config('cssmin.vips.cwd');
			}
			cwd = cwd ? cwd.replace(/\\/g, '/') : '';
			grunt.log.debug('replace cwd:' + cwd);
			var filePattern = /\s+(.+)/;
			var st_list = (st['X'] || []).concat(st.M || []).concat(st.A || []);
			var filepaths = st_list.map(function (st) {
				var match = st.match(filePattern);
				if (match) {
					// 兼容windows文件路径，删除文件路径开头的斜杠
					return match[1].replace(/\\/g, '/').replace(cwd, '').replace(/^\//, '');
				}
			});
			grunt.log.debug('filepaths:');
			grunt.log.debug(filepaths);
			grunt.log.debug('patterns:');
			grunt.log.debug(patterns);
			grunt.log.debug('matches:');
			grunt.log.debug(grunt.file.match(patterns, filepaths));

			grunt.config(task + '.vips_clone.src', grunt.file.match(patterns, filepaths));
			grunt.log.debug(grunt.config(task).vips_clone);
			grunt.task.run(task + ':vips_clone');
		}
	});

	// copy wrapper
	grunt.registerTask('copytpl', function (branch_src, branch_dest) {
		grunt.config('branch_src', branch_src);
		grunt.config('branch_dest', branch_dest);
		grunt.task.run('copy:tpl');
	});

	// Commit all branches(dev/test)
	grunt.registerTask('commitall', function (name) {
		grunt.task.requires('build');
		var project = grunt.config('_project');
		var branches = grunt.config('_branches');
		if (!project) {
			grunt.log.warn('没有指定项目，默认项目名设置为default');
			project = {name: 'default'};
		}
		ChangeLog.project = project;
		// log both dev and test branches
		ChangeLog.disabled = false;
		branches.getAll(name).map(function (branch) {
			grunt.task.run('commit:' + branch);
		});
	});

	// Update all specified branches(dev/test)
	grunt.registerTask('upall', function (name) {
		var branches = preprocess('project');
		branches.getAll(name).map(function (branch) {
			grunt.task.run('update:' + branch);
		});
	});

	// Log file status of specified branches(dev/test)
	grunt.registerTask('statuslog', function (name) {
		var branches = preprocess('project');
		branches.getAll(name).map(function (branch) {
			grunt.task.run('st:' + branch);
		});
	});

	// svn update, commit之前发现冲突
	grunt.registerTask('update', function (branch) {
		grunt.config('branch_dest', branch);
		grunt.task.run('shell:update');
	});

	// svn commit，生成Changelog文件
	grunt.registerTask('commit', function (branch) {
		if (!branch) {
			grunt.fatal('没有指定要提交的分支', 1);
		}
		// 配置changelog
		ChangeLog.branch = branch;
		grunt.config('branch_dest', branch);
		//grunt.task.run('shell:update');
		grunt.task.run(['shell:commit']);
	});

	// svn st, 获取更改文件
	grunt.registerTask('st', function (branch) {
		grunt.config('branch_dest', branch);
		grunt.task.run('shell:st');
	});

	/* update versions
	 * 如果有更改(M)的图片，并且更改的css里引用了图片
	 * 对应build.json字段版本号+0.1
	 */
	grunt.registerTask('rever', function () {
		var st_data = ChangeLog.extractStatus();
		var st_M = [], imgfiles, cssfiles;
		// keys to be re-version
		var dict_rev = {};
		for (var branch in st_data) {
			st_M = st_M.concat(st_data[branch].M || []).map(function (st) {
				return st.match(/\s+(.+)/)[1];
			});
		}
		imgfiles = grunt.file.match(['**/*.{jpg,jpeg,png,gif}'], st_M);
		if (imgfiles.length > 0) {
			cssfiles = grunt.file.match(['**/*.css'], st_M);
			imgfiles.forEach(function (filename) {
				var imgfile = path.basename(filename);
				cssfiles.forEach(function (cssfile) {
					var pattern = new RegExp(imgfile + '\\?\\{\\$(.+)\\}');
					var matches = grunt.file.read(cssfile).match(pattern);
					if (matches) {
						dict_rev[matches[1]] = true;
						grunt.log.writeln('Find ' + imgfile.green + ' in ' + cssfile.green);
						grunt.log.writeln('-------> ' + matches[1]).green;
					}
				});
			});
			var buildConfig = grunt.config('buildConfig');
			var revs_log = [];
			for (var k in dict_rev) {
				var ver = buildConfig[k];
				var v = parseFloat(ver);
				if (v) {
					buildConfig[k] = (v + 0.1).toFixed(2);
					revs_log.push(k + ': ' + ver.green + ' -> ' + buildConfig[k].green);
				}
			}
			grunt.config('_output.revs', revs_log);
			grunt.config('buildConfig', buildConfig);
			// don't write to file when run in unit test
			if (!grunt.option('test')) {
				grunt.file.write('build.json', buildConfig);
				ChangeLog.disabled = true;
				grunt.task.run('commit:build.json');
			}
		}
	});

	/*
	 * 挑选出发布的文件
	 * 文件列表来源于changelog文件
	 */
	grunt.registerTask('pick', function () {
		var dist = grunt.config('clean.picked');
		var project = grunt.config('_project');
		var dev_branches = grunt.config('_branches').getAll('dev');
		var changelog = project.name + '-CHANGELOG';
		if (grunt.file.exists(changelog)) {
			var st_data = grunt.file.readJSON(changelog);
			for (var branch in st_data) {
				if (dev_branches.indexOf(branch) > -1) {
					// ignore the dev branch
					continue;
				}
				var filelist = st_data[branch];
				if (typeof filelist === 'object') {
					for (var filepath in filelist) {
						grunt.log.debug('src:' + path.join(branch, filepath));
						var filename = path.basename(filepath);
						var src = path.join(branch, filepath);
						var dest = path.join(dist, filename);
						grunt.file.copy(src, dest);
					}
				}
			}
		}
		else {
			grunt.fatal(changelog + ' does not found!', 1);
		}
		grunt.config('_output.picked_dist', dist);
	});

	// finish: 所有任务都结束后，用来汇总输出一些结果信息
	grunt.registerTask('finish', function () {
		var project = grunt.config('_project');
		var branches = grunt.config('_branches');
		var changelog = project.name + '-CHANGELOG';
		if (grunt.file.exists(changelog)) {
			grunt.log.ok('CHANGELOG Generated, See: ' + changelog);
			grunt.log.writeln(grunt.file.read(changelog));
		}
		else {
			grunt.log.warn(changelog + ' not found! You may run push first.');
		}

		var output = grunt.config('_output');
		var st_data = output.st;
		// X: new files, M: modified files, A: added files
		var st_X = [], st_M = [], st_A = [];
		var test_branches = branches.getAll('test');
		for (var branch in st_data) {
			if (test_branches.indexOf(branch) > -1) {
				st_X = st_X.concat(st_data[branch].X || []);
				st_M = st_M.concat(st_data[branch].M || []);
				st_A = st_A.concat(st_data[branch].A || []);
			}
		}
		if (st_M.length > 0 && !grunt.file.exists(changelog)) {
			grunt.log.warn('M _ M 更改的文件：');
			grunt.log.writeln(st_M.join(grunt.util.linefeed));
		}
		if (st_A.length > 0 && !grunt.file.exists(changelog)) {
			grunt.log.warn('A _ A 新增的文件：');
			grunt.log.writeln(st_A.join(grunt.util.linefeed));
		}
		if (st_X.length > 0) {
			grunt.log.warn('? _ ? 你可能还遗漏了这些文件:');
			grunt.log.writeln(st_X.join(grunt.util.linefeed));
		}
		if (output.revs) {
			grunt.log.warn('B _ B 版本号更新:');
			grunt.log.writeln(output.revs.join(grunt.util.linefeed));
		}
		if (output.picked_dist) {
			grunt.log.warn('你可以在' + output.picked_dist.green + '找到需要发布的文件');
		}
	});

	// hook TortoiseSVN
	grunt.registerTask('hook', function (action) {
		var branches = preprocess('project');
		var project = grunt.config('_project');
		var branch = grunt.option('branch');
		var cwd = grunt.option('cwd');
		var rev = grunt.option('rev');
		grunt.log.debug('branch: ' + branch);
		grunt.log.debug('cwd: ' + cwd);
		// trim absolute path
		branch = branch.replace(cwd, '').replace(/\\/g, '/').replace(/^\//, '');
		grunt.log.debug('trimed branch: ' + branch);
		grunt.log.debug('original project: ');
		grunt.log.debug(project);

		// search branch, if found then reset project configuration to the branch
		var reset_branch = {}, isDev;
		function search(name) {
			var bs = project.branches[name] || {};
			var branch_src, branch_test;
			for (branch_src in bs) {
				// TortoiseSVN is annoyed when commit only one file, 
				// the committed branch passed to hook will be the committed file's 
				// parent directory, like `branches/demo/js` but not `branches/demo`, so
				// slice the string to compare. But `branches/demo-test/js` will match
				// `branches/demo`, so add a slash in the end.
				branch_test = bs[branch_src];
				// search the test branch first, for the tweak dev/test have same name to set
				// correct `isDev` value.
				if ((branch_test + '/') === (branch + '/').slice(0, branch_test.length + 1)) {
					// branch is a test branch
					isDev = false;
					branch = branch_test;
					grunt.log.debug('branch is a test branch, set branch: ' + branch);
					reset_branch[branch_src] = branch_test;
					break;
				}
				else if ((branch_src + '/') === (branch + '/').slice(0, branch_src.length + 1)) {
					//branch is a dev branch
					isDev = true;
					branch = branch_src;
					grunt.log.debug('branch is a dev branch, set branch: ' + branch);
					reset_branch[branch_src] = branch_test;
					break;
				}
			}
			if (Object.keys(reset_branch).length > 0) {
				project.branches = {};
				project.branches[name] = reset_branch;
				grunt.config('project', project);
				branches.clean();
				grunt.config('_branch', branches);
				grunt.log.debug('====resetted project====');
				grunt.log.debug(project);
				grunt.log.debug('resetted branch is empty: ' + branches.isEmpty());
			}
		}

		search('static');
		if (Object.keys(reset_branch).length === 0) {
			search('tpl');
		}
		if (Object.keys(reset_branch).length === 0) {
			grunt.fatal('Please confirm the project.json and the hook script configured correctly, branch not found: ' + branch, 1);
		}

		if (action === 'startcommit') {
			grunt.task.run(['statuslog:dev', 'build']);
		}
		else if (action === 'postcommit') {
			var messagefile = grunt.option('messagefile');
			var revData = grunt.file.read(messagefile);
			revData = revData.split(grunt.util.linefeed).map(function (line) {
				return line.replace(cwd, '');
			}).join(grunt.util.linefeed);
			grunt.log.debug('committed data: ');
			grunt.log.debug(revData);
			ChangeLog.project = project;
			ChangeLog.branch = branch;
			grunt.log.debug('changelog branch: ' + branch);
			ChangeLog.disabled = false;
			ChangeLog.generate(revData, rev);
		}
	});

	// for debug
	grunt.registerTask('debug', function () {
		var st_M = ['M test/test-branches/static-a/css/added.png'];
		var imgfiles = grunt.file.match(['**/*.{jpg,jpeg,png,gif}'], st_M);
		console.log(imgfiles);
	});
};
