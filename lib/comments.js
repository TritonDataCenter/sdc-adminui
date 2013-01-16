var makeuuid = require('uuid');

function createBucket() {
    var cfg = {
    index: {
        itemuuid: {
            type: "string",
            unique: false 
        },
        owner: {
            type: "string",
            unique: true
        },
        ismanager: {
            type: "boolean"
        }
    },
    pre: [
        function enforceEmail(req, cb) {
            if (!req.value.email)
                return (cb(new Error('email is required')));

            return (cb());
        },
        function setUID(req, cb) {
            req.value.userid = Math.floor(Math.random() * 100001);
            cb();
        }
    ]
};

client.createBucket('foo', cfg, function (err) {
    assert.ifError(err);
});

}

module.exports = {
    create: function(req, res, next) {
        var cid = makeuuid();
        var uuid = req.params.uuid;
        var comment = req.body.comment;
        var owner = req.user.uuid;

        req.sdc[req.dc].moray.putObject(cid, {
            itemuuid: uuid,
            owner: owner,
            comment: comment,
            created: new Date()
        }, function() {

        });
    }
}