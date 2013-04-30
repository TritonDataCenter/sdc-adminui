module.exports = {
    list: list,
    get: get,
    activateImage: activateImage,
    action: action,
    update: update,
    uploadImage: uploadImage
};


var restify = require('restify');
var IMGAPI = require('sdc-clients/lib/imgapi');

function action(req, res, next) {

    var act = req.params.action;

    if (act === 'upload') {
        return uploadImage(req, res, next);
    }

    if (act === 'activate') {
        return activateImage(req, res, next);
    }

    if (act === 'disable') {
        return disableImage(req, res, next);
    }

    if (act === 'enable') {
        return enableImage(req, res, next);
    }

    if (act === 'import') {
        return importImage(req, res, next);
    }

    return next(new restify.ConflictError('Action not supported'));
}

function update(req, res, next) {
    req.sdc[req.dc].imgapi.updateImage(req.params.uuid, req.body, function(err, image) {
        if (err) {
            req.log.fatal(err);
            return next(err);
        } else {
            res.send(image);
            return next();
        }
    });
}

function list(req, res, next) {
    req.sdc[req.dc].imgapi.listImages(req.params, function(err, images, listImagesRes) {
        if (err) {
            req.log.fatal(err);
            return next(err);
        } else {
            res.send(images);
            return next();
        }
    });
}

function get(req, res, next) {
    req.sdc[req.dc].imgapi.getImage(req.params.uuid, function(err, image, getImagesRes) {
        if(err) {
            req.log.fatal(err);
            return next(err);
        } else {
            res.send(image);
            return next();
        }
    });
}

function disableImage(req, res, next) {
    req.sdc[req.dc].imgapi.disableImage(req.params.uuid, function(err, image) {
        if(err) {
            req.log.fatal(err);
            return next(err);
        } else {
            res.send(image);
            return next();
        }
    });
}

function enableImage(req, res, next) {
    req.sdc[req.dc].imgapi.enableImage(req.params.uuid, function(err, image) {
        if(err) {
            req.log.fatal(err);
            return next(err);
        } else {
            res.send(image);
            return next();
        }
    });
}

function importImage(req, res, next) {
    req.sdc[req.dc].imgapi.adminImportImage(req.body, function(err, image, importImagesRes) {
        if(err) {
            req.log.fatal(err);
            return next(err);
        } else {
            res.send(image);
            return next();
        }
    });
}

function activateImage(req, res, next) {
    req.sdc[req.dc].imgapi.activateImage(req.params.uuid, function(err, image, getImagesRes) {
        if(err) {
            req.log.fatal(err);
            return next(err);
        } else {
            res.send(image);
            return next();
        }
    });
}

function uploadImage(req, res, next) {
    var uploadOpts = {
        uuid: req.params.uuid,
        file: req,
        size: Number(req.headers['content-length']),
        compression: req.headers['x-file-compression']
    };

    var chunks = 0;

    req.on('data', function(chunk) {
        chunks += chunk.length;
    });

    req.on('end', function() {
        req.log.info('finished uploading ', {bytes: chunks });
    });

    req.sdc[req.dc].imgapi.addImageFile(uploadOpts, function(err, image, uploadRes) {
        if (err) {
            req.log.fatal(err);
            return next(err);
        }
        req.log.info('addImageFile Complete');
        res.send(image);
        return next();
    });
}
