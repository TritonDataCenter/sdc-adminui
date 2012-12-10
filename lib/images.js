module.exports = {
  list: list,
  get: get,
  activateImage: activateImage,
  action: action
};

var restify = require('restify');

function action(req, res, next) {
    var action = actions[req.params.action];
    if (action == 'activate') {
      return activateImage(req, res, next);
    } else {
      return next(restify.InteralError('Action not supported'));
    }
}

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

function activateImage(req, res, next) {
  req.sdc[req.dc].imgapi.activateImage(req.params.uuid, function(err, image, getImagesRes) {
    if (err) {
      req.log.fatal(err);
      return next(err);
    } else {
      res.send(image);
    }
  });
}