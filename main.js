var http = require('http');
var fs = require('fs');
var url = require('url');
var qs = require('querystring');
 
function templateHTML(title, list, body, control){
  return `
  <!DOCTYPE html>
<html lang="ko">
    <head> 
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <!-- include libraries(jQuery, bootstrap) -->
    <link href="https://stackpath.bootstrapcdn.com/bootstrap/3.4.1/css/bootstrap.min.css" rel="stylesheet">
    <script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
    <script src="https://stackpath.bootstrapcdn.com/bootstrap/3.4.1/js/bootstrap.min.js"></script>

    <!-- include summernote css/js -->
    <link href="https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/summernote.min.css" rel="stylesheet">
    <script src="https://cdn.jsdelivr.net/npm/summernote@0.8.18/dist/summernote.min.js"></script>
    <script>
    $(document).ready(function() {
        $('#summernote').summernote({
          lang: 'ko-KR'
        });
      });
    </script>
        <title>${title}</title>
   
</head>
  <body>
    <h1><a href="/create">글쓰기</a></h1>
    ${list}
    ${control}
    ${body}
  </body>
  </html>
  `;
}
function templateList(filelist){
  var list = '<ul>';
  var i = 0;
  while(i < filelist.length){
    list = list + `<li><a href="/?id=${filelist[i]}">${filelist[i]}</a></li>`;
    i = i + 1;
  }
  list = list+'</ul>';
  return list;
}

 
var app = http.createServer(function(request,response){
    var _url = request.url;
    var queryData = url.parse(_url, true).query;
    var pathname = url.parse(_url, true).pathname;
    if(pathname === '/'){
      if(queryData.id === undefined){
        fs.readdir('./data', function(error, filelist){
          var title = 'Welcome';
          var description = 'Hello, Node.js';
          var list = templateList(filelist);
          var template = templateHTML(title, list, `<h2>${title}</h2>${description}`,`<a href="/create">create</a> <a href="/update?id=${title}">update</a>`);
          response.writeHead(200);
          response.end(template);
        })
      } else {
        fs.readdir('./data', function(error, filelist){
          fs.readFile(`data/${queryData.id}`, 'utf8', function(err, description){
            var title = queryData.id;
            var list = templateList(filelist);
            var template = templateHTML(title, list, `<h2>${title}</h2>${description}`,` <a href="/create">create</a>
            <a href="/update?id=${title}">update</a>
            <form action="delete_process" method="post">
              <input type="hidden" name="id" value="${title}">
              <input type="submit" value="delete">
            </form>`);
            response.writeHead(200);
            response.end(template);
          });
        });
      }
        } else if(pathname === '/create'){
        fs.readdir('./data', function(error, filelist){
        var title = 'WEB - create';
        var list = templateList(filelist);
        var template = templateHTML(title, list, `
            <form action="/create_process" method="post">
                <input type="text" name="title">
                <textarea id="summernote" name="description"></textarea>
                <input type="submit">
            </form> 
        `,'');
        response.writeHead(200);
        response.end(template);
        });
    }
        else if(pathname === '/create_process'){
            var body = '';
            request.on('data', function(data){
                body = body + data;
            });
            request.on('end', function(){
                var post = qs.parse(body);
                var title = post.title;
                var description = post.description
                fs.writeFile(`data/${title}`, description, 'utf8', function(err){
                    response.writeHead(302, {Location: encodeURI(`/?id=${title}`)});
                    response.end();
                })
            });
        } else if(pathname === '/update'){
            fs.readdir('./data', function(error, filelist){
              fs.readFile(`data/${queryData.id}`, 'utf8', function(err, description){
                var title = queryData.id;
                var list = templateList(filelist);
                var template = templateHTML(title, list,
                  `
                  <form action="/update_process" method="post">
                    <input type="hidden" name="id" value="${title}">
                    <p><input type="text" name="title" placeholder="title" value="${title}"></p>
                    <p>
                      <textarea name="description" placeholder="description">${description}</textarea>
                    </p>
                    <p>
                      <input type="submit">
                    </p>
                  </form>
                  `,
                  `<a href="/create">create</a> <a href="/update?id=${title}">update</a>`
                );
                response.writeHead(200);
                response.end(template);
              });
            });
        } else if(pathname === '/update_process'){
            var body = '';
            request.on('data', function(data){
                body = body + data;
            });
            request.on('end', function(){
                var post = qs.parse(body);
                var id = post.id;
                var title = post.title;
                var description = post.description;
                fs.rename(`data/${id}`, `data/${title}`, function(error){
                  fs.writeFile(`data/${title}`, description, 'utf8', function(err){
                    response.writeHead(302, {Location: `/?id=${title}`});
                    response.end();
                  })
                });
            });  
        } else if(pathname === '/delete_process'){
            var body = '';
            request.on('data', function(data){
                body = body + data;
            });
            request.on('end', function(){
                var post = qs.parse(body);
                var id = post.id;
                fs.unlink(`data/${id}`, function(error){
                  response.writeHead(302, {Location: `/`});
                  response.end();
                })
            });   
    } else {
      response.writeHead(404);
      response.end('Not found');
    }
 
 
 
});
app.listen(8080);