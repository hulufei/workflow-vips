/*global module:false*/
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
			isEmpty: function () {
				return !this.getAll().length;
			},
		},
		// 保存输出信息
		_output: {
			// 文件状态列表
			st: {}
		},

		// Task configuration.
		branch_src: 'static-te',
		branch_dest: 'static-te-test',

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
				globals: {
					jQuery: true
				}
			},
			gruntfile: {
				options: {
					// @see http://goo.gl/Oxp5z
					loopfunc: true,
					browser: false,
					globals: false,
					node: true,
					es5: true
				},
				src: 'Gruntfile.js'
			},
			test: {
				options: {
					browser: false,
					globals: false,
					node: true,
					es5: true
				},
				src: ['test/**/*.js']
			}
		},
		watch: {
			gruntfile: {
				files: '<%= jshint.gruntfile.src %>',
				tasks: ['jshint:gruntfile']
			},
			test: {
				files: '<%= jshint.test.src %>',
				tasks: ['jshint:test', 'nodeunit']
			},
			dev: {
				files: ['vipstatic'],
				tasks: ['build']
			}
		},
		copy: {
			vips: {
				files: [
					{
						expand: true,
						cwd: '<%= branch_src %>/img',
						src: ['**/*', '!**/*.{jpg,jpeg,png}'],
						dest: '<%= branch_dest %>/img/'
					},
					{
						expand: true,
						cwd: '<%= branch_src %>/views',
						src: ['**/*'],
						dest: '<%= branch_dest %>/views/'
					}
				]
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
				dest: '<%= branch_dest %>/js/'
			}
		},
		cssmin: {
			vips: {
				expand: true,
				cwd: '<%= branch_src %>/css',
				src: ['**/*.css'],
				dest: '<%= branch_dest %>/css/'
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
			},
			test: {
				// src: '<%= branch_dest %>/css'
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
				command: 'svn commit -m "' + grunt.option('m') + '" ' + (grunt.option('branch') || '<%= branch_dest %>'),
				options: {
					stdout: true,
					callback: function (err, stdout, stderr, cb) {
						grunt.log.ok(grunt.config('shell.commit.command').green);
						if (!grunt.option('no-changelog')) {
							ChangeLog.generate(stdout, err);
						}
						cb();
					}
				}
			},
			update: {
				command: 'svn update ' + (grunt.option('branch') || '<%= branch_dest %>'),
				options: {
					stderr: true,
					callback: function (err, stdout, stderr, cb) {
						grunt.log.ok(grunt.config('shell.update.command').green);
						if (err) {
							grunt.fatal(err);
						}
						cb();
					}
				}
			},
			st: {
				command: 'svn st ' + (grunt.option('branch') || '<%= branch_dest %>'),
				options: {
					callback: function (err, stdout, stderr, cb) {
						grunt.log.ok(grunt.config('shell.st.command').green);
						if (err) {
							grunt.fatal(err);
						}
						var lines = stdout.split(grunt.util.linefeed),
							branch = grunt.config('branch_dest'),
							st_data = grunt.config('_output.st');
						st_data[branch] = st_data[branch] || {};
						if (lines.length > 1) {
							lines.map(function (line) {
								['M', 'C', 'D', '\\?'].map(function (st) {
									// Note: match filepath pattern: /.*\s(.*)/
									var pattern = new RegExp('^' + st + '.*');
									var matches = line.match(pattern);
									if (matches) {
										// 未纳入版本控制'?'用'X'表示
										st = st === '\\?' ? 'X' : st;
										grunt.log.debug('line: ' + line);
										grunt.log.debug('status pattern: ' + pattern);
										grunt.log.debug('status matches: ' + matches);
										st_data[branch][st] = st_data[branch][st] || [];
										st_data[branch][st].push(matches[0]);
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
		nodeunit: {
			tests: ['test/*_test.js']
		},

		// TODO
		// 映射dev-test，任何在dev中删除文件的操作都映射到test中
		mirror: {},
		// 根据修改的图片文件自动更新版本号
		updateVer: {}
	});

	// These plugins provide necessary tasks.
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-imagemin');
	grunt.loadNpmTasks('grunt-contrib-clean');
	grunt.loadNpmTasks('grunt-shell');
	//grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-contrib-nodeunit');
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-contrib-watch');
	// load all grunt tasks
	//require('matchdep').filterDev('grunt-*').forEach(grunt.loadNpmTasks);


	/*
	 * 自动生成更改文件列表: projectname-changelog
	 * revData: svn提交返回的信息
	 * err: svn返回的错误信息
	 */
	var ChangeLog = {
		project: {},
		branch: '',
		generate: function (revData, err) {
			var branch = this.branch || grunt.option('branch'),
					project = this.project;
			grunt.log.debug('Begin generate change log for: ' + project.name);
			if (err) {
				grunt.fatal(err);
			}
			if (!branch) {
				grunt.fatal('需要指定提交的branch');
			}
			var changelog = project.name + '-CHANGELOG',
					filepath = '',
					json = {};
			grunt.log.debug('Branch: ' + branch);
			if (grunt.file.exists(changelog)) {
				grunt.log.debug('File: ' + changelog + ' exists');
				json = grunt.file.readJSON(changelog);
			}
			else {
				// 关于项目的说明，可以配置在<%= project.description %>
				json['description'] = project.description || '';
			}
			var lines = revData.trim().split(grunt.util.linefeed),
					rev = 'r' + lines[lines.length - 1].match(/\d+/),
					filePattern = /.*\s(.*\/.*\..+)/;
			grunt.log.debug('lines: ' + lines);
			grunt.log.debug('last line: ' + lines[lines.length - 1]);
			grunt.log.debug('rev: ' + rev);
			filePattern.compile(filePattern);
			lines.map(function (line) {
				// 兼容windows文件路径
				line = line.replace(/\\/g, '/');
				var match = line.match(filePattern);
				if (match) {
					grunt.log.debug('file matches: ' + match);
					filepath = match[1].replace(branch + '/', '').trim();
					json[branch] = json[branch] || {};
					json[branch][filepath] = rev;
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
			//grunt.log.writeln('Changelog generated: ' + changelog);
		}
	};

	/* 在push之前做一些预处理
	 * Check project config
	 * Set internal configs
	 */
	function preprocess(project) {
		project = project ? grunt.config(project) : grunt.config('project');
		// 检查配置
		['name', 'branches'].map(function (name) {
			if (!project.hasOwnProperty(name)) {
				grunt.log.error(project);
				grunt.fatal('缺失配置：' + name);
			}
		});
		if (project.name.trim() === '') {
			grunt.fatal('请指定要构建的项目名');
		}

		// join branches
		var path = require('path');
		var joined_branches = {},
				base = project.branches['base'];
		if (base) {
			['static', 'tpl'].forEach(function (k) {
				var bs = project.branches[k];
				joined_branches[k] = joined_branches[k] || {};
				for (var dev in bs) {
					joined_branches[k][path.join(base, dev)] = path.join(base, bs[dev]);
				}
			});
			project.branches = joined_branches;
		}

		// 保存所有相关的分支名
		var branches = grunt.config('_branches'),
				branch_src = '',
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

	// 发布提交
	grunt.registerTask('publish', ['updateall:dev', 'statuslog:dev', 'build', 'statuslog:test', 'push', 'finish']);
	// 不依赖网络，可供预览更改
	grunt.registerTask('taste', ['statuslog:dev', 'build', 'statuslog:test', 'finish']);
	// 测试流程
	grunt.registerTask('test', ['test_setup', 'updateall:dev', 'statuslog:dev', 'build', 'statuslog:test', 'nodeunit', 'clean:test']);

	// set for testing the workflow
	grunt.registerTask('test_setup', function () {
		var project = grunt.file.readJSON('test/project.json');
		grunt.config('project', project);
		var branches = preprocess('project');
		grunt.config('clean.test', branches.getAll('test'));
	});

	// build task
	grunt.registerTask('build', function() {
		var branches = grunt.config('_branches');
		branches = branches.isEmpty() ? preprocess('project') : branches;

		var project = grunt.config('_project');
		var static_branches = project.branches['static'] || {},
				tpl_branches = project.branches['tpl'] || {},
				branch_src = '',
				branch_dest = '';

		// 对应静态资源分支的处理
		for (branch_src in static_branches) {
			grunt.log.debug('Building ' + branch_src);
			branch_dest = static_branches[branch_src];
			['uglify', 'cssmin', 'processCss', 'imagemin'].forEach(function (task) {
				// 生成对应的配置段
				grunt.task.run(['apply', task, branch_src, branch_dest].join(':'));
			}); 
			// 同步静态目录中非jpg，png等其他资源
			grunt.task.run('cp:' + branch_src + ':' + branch_dest);
		}

		// 对应模板页面分支的处理
		for (var tpl_src in tpl_branches) {
			var tpl_dest = tpl_branches[tpl_src];
			// 同步模板页
			grunt.task.run('cp:' + tpl_src + ':' + tpl_dest);
		}
	});

	// TODO: 建立watch任务，对应分支做jshint，csslint等等
	// 甚至在项目开始前svn copy新建分支
	grunt.registerTask('setup', function () {
		// var branches = preprocess('project');
	});

	/*
	 * CSS变量替换
	 */
	grunt.registerMultiTask('processCss', 'replace variables in CSS', function () {
		var options =  this.options({
			imgDomain: '',
			version: grunt.config('buildConfig')
		});
		var imgDomain = options.imgDomain,
				version = options.version;
		var variablePattern = /\{\$.*?\}/;
		variablePattern.compile(variablePattern);
		function process(filepath) {
			if (grunt.file.exists(filepath) && grunt.file.isFile(filepath)) {
				var css = grunt.file.read(filepath)
					.replace(/\{\$imgDomain\}|\{\$staticImg\}/gm, imgDomain)
					.replace(/\{\$staticVer\}/gm, version.staticVer)
					.replace(/\{\$shopImgVer\}/gm, version.shopImgVer)
					.replace(/\{\$dayImgVer\}/gm, version.dayImgVer)
					.replace(/\{\$luxImgVer\}/gm, version.luxImgVer)
					.replace(/\{\$tourImgVer\}/gm, version.tourImgVer)
					.replace(/\{\$goodsImgVer\}/gm, version.goodsImgVer)
					.replace(/\{\$mallImgVer\}/gm, version.mallImgVer)
					.replace(/\{\$cardImgVer\}/gm, version.cardImgVer);
					//.replace(/\{\$.*?Ver\}/gm, version);

				// check if all variables are replaced
				if (variablePattern.test(css)) {
					grunt.fatal('File ' + filepath +
						'\nVariables does not be replaced all:' + css.match(variablePattern));
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

		var st_data = grunt.config('_output.st');
		var st = st_data[branch_src];
		grunt.log.debug(st);
		// Process whole branch files
		if (grunt.option('all')) {
			grunt.task.run(task);
		}
		else if(st && (st.X || st.M)) {
			// Only process the changed or the new files
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
			var filepaths = (st['X'] || []).concat(st.M || []).map(function (st) {
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
	grunt.registerTask('cp', function (branch_src, branch_dest) {
		grunt.config('branch_src', branch_src);
		grunt.config('branch_dest', branch_dest);
		grunt.task.run('copy:vips');
	});

	// Commit all test branches
	grunt.registerTask('push', function () {
		grunt.task.requires('build');
		var project = grunt.config('_project');
		var branches = grunt.config('_branches');
		if (!project) {
			grunt.log.warn('没有指定项目，默认项目名设置为default');
			project = {name: 'default'};
		}
		ChangeLog.project = project;
		branches.getAll('test').map(function (branch) {
			grunt.task.run('commit:' + branch);
		});
	});

	// Update all specified branches(dev/test)
	grunt.registerTask('updateall', function (name) {
		var branches = grunt.config('_branches');
		branches = branches.isEmpty() ? preprocess('project') : branches;
		branches.getAll(name).map(function (branch) {
			grunt.task.run('update:' + branch);
		});
	});

	// Log file status of specified branches(dev/test)
	grunt.registerTask('statuslog', function (name) {
		var branches = grunt.config('_branches');
		branches = branches.isEmpty() ? preprocess('project') : branches;
		branches.getAll(name).map(function (branch) {
			grunt.task.run('st:' + branch);
		});
	});

	// svn update, push之前发现冲突
	grunt.registerTask('update', function (branch) {
		grunt.config('branch_dest', branch);
		grunt.task.run('shell:update');
	});

	// svn commit，生成Changelog文件
	grunt.registerTask('commit', function(branch) {
		if (!branch) {
			grunt.fatal('没有指定要提交的分支');
		}
		// 配置changelog
		ChangeLog.branch = branch;
		grunt.config('branch_dest', branch);
		//grunt.task.run('shell:update');
		grunt.task.run(['shell:commit']);
	});

	// svn st, 检查遗漏文件
	grunt.registerTask('st', function (branch) {
		grunt.config('branch_dest', branch);
		grunt.task.run('shell:st');
	});

	// finish: 所有任务都结束后，用来汇总输出一些结果信息
	grunt.registerTask('finish', function () {
		// grunt.task.requires('build');
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

		var st_data = grunt.config('_output.st');
		// X: new files, M: modified files
		var st_X = [], st_M = [];
		var test_branches = branches.getAll('test');
		for (var branch in st_data) {
			if (test_branches.indexOf(branch) > -1) {
				st_X = st_X.concat(st_data[branch].X || []);
				st_M = st_M.concat(st_data[branch].M || []);
			}
		}
		if (st_M.length > 0) {
			grunt.log.warn('M _ M 更改的文件：');
			grunt.log.writeln(st_M.join(grunt.util.linefeed));
		}
		if (st_X.length > 0) {
			grunt.log.warn('◉︵◉ 你可能还遗漏了这些文件:');
			grunt.log.writeln(st_X.join(grunt.util.linefeed));
		}
	});

	// for debug
	grunt.registerTask('debug', function () {
		var path = require('path');
		console.log(path.join('', 'static-te'));
		console.log(path.join('branches/', 'static-te'));
		console.log(path.join('branches', '/static-te'));
		console.log(path.join('branches/', '/static-te/'));
		//console.log('msg: ' + grunt.option('m'));
		//grunt.file.write('changelog', JSON.stringify(json, ' ', 4));
		//grunt.log.writeln('Write to File changelog');
		//console.log(grunt.config('processCss').options.imgDomain);
	});
};
