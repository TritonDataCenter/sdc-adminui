module.exports = {
    setOwnerData: function (data) {
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
    },
    setFilterOptions: function (options) {
        Object.keys(options).forEach(function (key) {
            var value = options[key];
            if (key === 'traits') {
                value = decodeURIComponent(value);
            }
            var input = $('input[name="' + key + '"]');
            
            if (input.length) {
                input.val(value);
            } else {
                if (key === 'active') {
                    value = value === 'true' ? true :
                        (value === 'false' ? false : '');
                }
                var option = $('select[name="' + key + '"] option[value="' + value + '"]');
                if (option.length) {
                    option.attr('selected', 'true');
                }
            }
        });
    }
};