var _ = require('underscore');

module.exports = {
    filterTraits: function (params, items) {
        var parameters = params.split(/:/).map(function (value) {
            /* JSSTYLED */
            return value.replace(/"|'/gi, '');
        });

        var searchKey = parameters[0] && parameters[0].trim().toLowerCase();
        var searchValue = parameters[1] && parameters[1].trim().toLowerCase();

        return items = _.filter(items, function (item) {
            var traits = item.traits;
            var result = [];
            if (traits) {
                result = _.filter(Object.keys(traits), function (key) {
                    return key && key.toLowerCase().indexOf(searchKey) !== -1 &&
                        (!searchValue ||
                         traits[key].toLowerCase().indexOf(searchValue) !== -1);
                });
            }
            return result.length;
        });
    }
};