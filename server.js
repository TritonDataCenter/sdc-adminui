var express = require('express');
var app = express.createServer();
var hbs = require('hbs');


app.configure(function () {
  app.use(express.logger('dev'));
  app.use(express.static(__dirname + '/public'));

  app.register('.html', hbs);

  app.set('views', __dirname + '/views');
  app.set('view engine', 'html');
  app.set('view options', { layout: false });
});


app.configure('development', function () {
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.get('/', function (req, res) {
  res.render('index');
});

app.listen(4000);
console.log('=== Server started on port %s', app.address().port);
