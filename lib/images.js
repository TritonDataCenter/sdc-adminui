/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

module.exports = {
    list: list,
    get: get,
    activateImage: activateImage,
    action: action,
    update: update,
    uploadImage: uploadImage,
    importImage: importImage,
    aclAction: aclAction
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

    if (act === 'importRemote') {
        return importRemote(req, res, next);
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
    var client = req.sdc[req.dc].imgapi;

    if (req.query.repository) {
        var repository = req.query.repository;
        delete req.query.repository;
        client = IMGAPI.createClient({ url: repository });
    }

    client.listImages(req.params, function(err, images, listImagesRes) {
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

function importRemote(req, res, next) {
    var uuid = req.params.uuid;
    var source = req.body.source;

    if (typeof(uuid) !== 'string') {
        return next(new restify.ConflictError('uuid required'));
    }

    if (typeof(source) !== 'string') {
        return next(new restify.ConflictError('source required'));
    }

    var options = {};
    options.skipOwnerCheck = req.body.skipOwnerCheck || true;

    req.sdc[req.dc].imgapi.adminImportRemoteImage(
        uuid,
        source,
        options,
        function(err, job, imgapiRes) {

        if (err) {
            req.log.fatal({
                uuid: uuid,
                source: source,
                options: options
            }, 'Error importing image.', err);
            return next(err);
        }

        res.send(job);
        return next();
    });
}

function aclAction(req, res, next) {
    if (req.query.action === 'add') {
        req.sdc[req.dc].imgapi.addImageAcl(req.params.uuid, req.body, function(err, img) {
            if (err) {
                return next(err);
            }
            res.send(img);
            return next();
        });
    }
    if (req.query.action === 'remove') {
        req.sdc[req.dc].imgapi.removeImageAcl(req.params.uuid, req.body, function(err, img) {
            if (err) {
                return next(err);
            }
            res.send(img);
            return next();
        });
    }
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
