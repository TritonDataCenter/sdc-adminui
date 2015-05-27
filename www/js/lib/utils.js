
var setOwnerData = function (data) {
    if (data.owner_uuids) {
        var User = require('../models/user');
        data.owners = [];
        _.each(data.owner_uuids, function (owner) {
            var user = new User({uuid: owner});
            user.fetch().done(function (u) {
                data.owners.push(u);
            });
        });
    }
    return data;
};

module.exports = {
    setOwnerData: setOwnerData
};