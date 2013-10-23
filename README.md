workflow-vips
=============

Automate front-end workflow for vipshop

project.json

```javascript
{
	// 当前开发项目名称，用来生成name-CHANGELOG文件
	"name": "project-name",
	"description": "about project",
	"branches": {
		// 分支放置目录
		"base": "branches",
		// 模板分支(可以指定多个，value留空)
		"tpl": {
			"tpl-branch-demo": ""
		},
		// 静态资源分支(可以指定多个, 开发分支:测试分支)
		"static": {
			"static-branch-demo": "static-branch-demo-test"
		}
	},
	// 开发服务器配置(optional)
	"server": {
		"tpl": {
			// 服务器地址
			"server": "xx.xx.xx.xx",
			"username": "server's login name",
			"password": "server's login password",
			// 映射到开发服务器上的目录
			"dest": "remote/dir",
			// 指定要同步上传的模板分支，默认为配置的第一个tpl分支
			"branch": ""
		},
		"static": {
			"server": "xx.xx.xx.xx",
			"username": "server's login name",
			"password": "server's login password",
			// 映射到开发服务器上的目录
			"dest": "remote/dir",
			// 指定要同步上传的静态资源分支，默认为配置的第一个static-test分支
			"branch": ""
		}
	},
	// svn配置段, 用于grunt init创建以及checkout配置的分支
	"svn": {
		"static": {
			"branch": "https://10.100.90.28/svn/vipstatic/branches/",
			"trunk": "https://10.100.90.28/svn/vipstatic/trunk/"
		},
		"tpl": {
			"branch": "https://10.100.90.28/svn/{{ channel }}/branches/",
			"trunk": "https://10.100.90.28/svn/{{ channel }}/trunk/"
		}
	}
}
```

Commands List:

	 grunt init                 初始化项目，创建配置的分支，以及checkout创建的分支
	 grunt init -m "comment"    `-m`指定创建分支的log信息，默认为`project.description`

	 grunt taste                构建更改的文件，但是不提交

	 grunt build:all            构建整个开发分支, 不提交
	 grunt build:noimage        构建整个开发分支，除了图片, 不提交
	 grunt build:changelog      构建CHANGELOG内的文件, 不提交

	 grunt push -m 'comment'    构建分支并提交，更改文件写入CHANGELOG

	 grunt sync -m 'comment'    push，最后同步更改的文件到开发服务器
	 grunt sync:tpl             同步所有模板文件到开发服务器
	 grunt sync:s2              同步所有静态文件到开发服务器
	 grunt sync:changelog       同步CHANGELOG记录的对应分支的文件到开发服务器

	 grunt vipserver            映射s2静态资源到本地, 监控模板文件更改自动同步到开发服务器

	 grunt switch:name          切换指定hosts
	 grunt co                   svn checkout配置的所有静态资源分支
	 grunt lint                 lint更改的css/js文件
	 grunt monitor              监听文件更改，自动lint对应的文件
	 grunt tcl                  生成一个CHANGELOG文件的模板

	 grunt deploy               Build for deploy
	  - 更新开发分支
	  - 更新build.json
	  - 更新css内部引用的有更改的图片版本号
	  - build:changelog
	  - 复制编译后的文件到指定目录

Develop:

	grunt test                 运行测试用例