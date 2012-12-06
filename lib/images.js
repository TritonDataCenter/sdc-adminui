module.exports = {
  list: list,
  get: get
};

var restify = require('restify');

function list(req, res, next) {
  req.sdc[req.dc].imgapi.listImages({}, function(err, images, listImagesRes) {
    if (err) {
      req.log.fatal(err);
      return next(err);
    } else {
      return res.send(images);
    }
  });
}

function get(req, res, next) {
  req.sdc[req.dc].imgapi.getImage(req.params.uuid, function(err, image, getImagesRes) {
    if (err) {
      req.log.fatal(err);
      return next(err);
    } else {
      return res.send(image);
    }
  });
}