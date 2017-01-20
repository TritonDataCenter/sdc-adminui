var _ = require('underscore');
var format = require('util').format;

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
                         (typeof (traits[key]) === 'boolean' && !traits[key] && searchValue === 'false') ||
                         (typeof (traits[key]) === 'boolean' && traits[key] && searchValue === 'true') ||
                         (typeof (traits[key]) === 'number' && traits[key].toString() === searchValue) ||
                         (typeof (traits[key]) !== 'boolean' && typeof (traits[key]) !== 'number' &&
                         traits[key].toLowerCase().indexOf(searchValue) !== -1));
                });
            }
            return result.length;
        });
    },

    /**
     * Convert a boolean or string representation into a boolean, or
     * raise TypeError trying.
     *
     * @param value {Boolean|String} The input value to convert.
     * @param default_ {Boolean} The default value is `false` if undefined.
     * @param errName {String} The context to quote in the possibly
     *      raised TypeError.
     */
    boolFromString: function (value, default_, errName) {
        if (value === undefined) {
            return default_;
        } else if (value === 'false' || value === '0') {
            return false;
        } else if (value === 'true' || value === '1') {
            return true;
        } else if (typeof (value) === 'boolean') {
            return value;
        } else {
            var errmsg = format('invalid boolean value: %j', value);
            if (errName) {
                errmsg = format('invalid boolean value for %s: %j', errName, value);
            }
            throw new TypeError(errmsg);
        }
    }
};
