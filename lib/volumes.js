/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2016, Joyent, Inc.
 */

var sprintf = require('util').format;

var getVolumeParams = function (params) {
    var query = params.query || [];

    if (params.type && params.type.length) {
        query.push(sprintf('(type=*%s*)', params.type));
        delete params.type;
    }

    if (params.state && params.state.length) {
        query.push(sprintf('(state=%s)', params.state));
        delete params.state;
    }

    if (params.tag && params.tag.length) {
        query.push(sprintf('(tag=%s)', params.tag));
        delete params.tag;
    }

    if (query.length) {
        params.filter = '(&' + query.join('') + ')';
    }

    return params;
};

function list(req, res, next) {
    var params = getVolumeParams(req.params);
    var opts = {
        path: '/volumes',
        query: params
    };
    req.sdc[req.dc].volapi.get(opts, function (err, _req, _res, volumes) {
        if (err) {
            req.log.error(err, 'Error retrieving volumes');
            return next(err);
        }
        if (params.uuid && params.uuid.length === 36) {
            volumes = volumes.filter(function (volume) {
               return volume.uuid === params.uuid;
            });
        }
        res.send(volumes);
        return next();
    });
}

function get(req, res, next) {
   req.sdc[req.dc].volapi.get('/volumes/' + req.params.uuid, function (err, _req, _res, volume) {
        if (err) {
            req.log.error(err, 'Error retrieving volume');
            return next(err);
        }
        res.send(volume);
        return next();
    });
}

function create(req, res, next) {
    req.log.info(req.body, 'VOLAPI Create Request');
    req.sdc[req.dc].volapi.post('/volumes', req.body, function (err, _req, _res, volume) {
        if (err) {
            req.log.error(err, 'Error creating volume');
            return next(err);
        }
        res.send(volume);
        return next();
    });
}

function del(req, res, next) {
    req.sdc[req.dc].volapi.del('/volumes/' + req.params.uuid, function (err, _req, _res, volume) {
        if (err) {
            req.log.error(err, 'Error deleting volume');
            return next(err);
        }
        res.send(volume);
        return next();
    });
}

module.exports =  {
        list: list,
        get: get,
        create: create,
        del: del
};
