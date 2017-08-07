var getRequestHeaders = require('../get-request-headers');
var async = require('async');

function getPageVmData(req, res, next) {
    var data = {};

    req.sdc[req.dc].vmapi.getVm(
        {uuid: req.query.uuid},
        {headers: getRequestHeaders(req) },
        function (err, vm)
    {
        if (err) {
            return next(err);
        }
        if (vm.tags.JPC_tag === 'DockerHost') {
            vm.docker = true;
        }

        data.vm = vm;
        var imageUuid;
        req.log.info(vm);
        if (vm.image_uuid) {
            imageUuid = vm.image_uuid;
        } else {
            imageUuid = vm.disks && vm.disks.length && vm.disks[0].image_uuid ? vm.disks[0].image_uuid : '';
        }

        return async.parallel([
            function getPackage(cb) {
                req.sdc[req.dc].papi.get(vm.billing_id, {}, function getPackageCb(getImageErr, pkg) {
                    data.package = pkg;
                    cb(null);
                });
            },
            function getImage(cb) {
                req.sdc[req.dc].imgapi.getImage(imageUuid, function getImageCb(getImageErr, img) {
                    if (!getImageErr && img) {
                        data.image = img;
                    }
                    cb(null);
                });
            },
            function getServer(cb) {
                if (vm.server_uuid) {
                    req.sdc[req.dc].cnapi.getServer(vm.server_uuid, function getServerCb(getServerErr, server) {
                        data.server = server;
                        cb(null);
                    });
                } else {
                    cb(null);
                }
            }
        ], function asyncCb(asyncErr, asyncRes) {
            res.send(data);
            return next();
        });
    });
}

module.exports = {
    mount: function mount(app, pre) {
        app.get({ path: '/api/page/vm', name: 'GetPageVmData'}, pre, getPageVmData);
    }
};
