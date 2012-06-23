module.exports = {
  list: list,
  get: get
};


var restify = require('restify');
var client = restify.createJsonClient({ url: 'https://datasets.joyent.com' });

function list(req, res, next) {
  client.get('/datasets', function (err, _req, _res, obj) {
    res.send(obj);
  });
}

function get(req, res, next) {
  client.get('/datasets/'+req.params.uuid, function (err, _req, _res, obj) {
    return res.send(obj);
  });
}
