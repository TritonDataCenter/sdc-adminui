module.exports = {
    list: function(req, res, next) {
        req.sdc[req.dc].cnapi.get('/platforms', function (err, obj, _req, _res) {
            if (err) {
                req.log.fatal(err, 'CNAPI Error retrieving platforms');
                return next(err, _res.statusCode);
            }

            res.send(obj);
            return next();
        });
    }
}