module.exports = {
  mount: mount
};


var PREFIX = '/imglib';

var restify = require('restify');
var client = restify.createJsonClient({ url: 'https://datasets.joyent.com' });

function mount(app) {

  app.get(PREFIX + '/datasets', function (req, res, next) {
    return client.get('/datasets', function (err, _req, _res, obj) {
      return res.send(_res.body,
                      {'content-type':'application/json'},
                      _res.statusCode);
    });
  });

  app.get(PREFIX + '/datasets/:id', function (req, res, next) {
    return client.get('/datasets/'+req.params.id,
                      function (err, _req, _res, obj) {
                        return res.json(_res.body,
                                        {'content-type':'application/json'},
                                        _res.statusCode);
                      });
  });
}
