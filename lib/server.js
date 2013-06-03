var http = require('http');
var url = require('url');
var fs = require('fs');
var path = require('path');
 
module.exports = function(branch) {
  var PORT = 80;
  var MIME = {
   'css': 'text/css',
   'js': 'text/javascript',
   'gif': 'image/gif',
   'ico': 'image/x-icon',
   'jpeg': 'image/jpeg',
   'jpg': 'image/jpeg',
   'png': 'image/png',
   'swf': 'application/x-shockwave-flash'
  };
  var server = http.createServer(function(request, response) {
     var pathname = url.parse(request.url).pathname.slice(1);
     var ext = path.extname(pathname);
     ext = ext ? ext.slice(1) : 'unknown';
     var contentType = MIME[ext] || 'text/plain';
     // 映射到本地静态文件
     pathname = pathname.replace('/public/', '/');
     var localpath = branch ? path.join(branch, pathname) : pathname;
     fs.exists(localpath, function(exists) {
       if (!exists) {
         console.log('404 LocaPath = ' + localpath);
         response.writeHead(404, {'Content-Type': 'text/plain'});
         response.write('Not found');
         response.end();
       }
       else {
         fs.readFile(localpath, 'binary', function(err, file) {
           if (err) {
             console.log('500 LocaPath = ' + localpath);
             response.writeHead(500, {'Content-Type': 'text/plain'});
             response.end(err);
           }
          else {
            response.writeHead(200, {'Content-Type': contentType});
            if (ext === 'css') {
              // 替换css文件中的php变量
              console.log('Replace php variables in css, see build.json');
              var host = 'http://s2.vipshop.com/';
              file = file.replace(/\{\$staticImg\}/gm, host + 'css')
                .replace(/\{\$imgDomain\}/gm, host + 'img')
                .replace(/\{\$.*?\}/gm, '1.0');
            }
            response.write(file, 'binary');
            response.end();
          }
        });
       }
     });
  });
  server.listen(PORT);
  console.log('Server running at port: ' + PORT + '.');
}