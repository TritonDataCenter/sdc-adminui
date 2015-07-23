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
    },
    validate: function (model, validation, cb) {
        var errors = [];
        if (typeof validation === 'function') {
            cb = validation;
            validation = model.validation;
            model = model.attributes || model.toJSON;
        }
        var addErrors = function (field, msg, code) {
            errors.push({
                field: field,
                code: code || 'Invalid parameter',
                message: msg || 'This field is not valid '
            });
        };
        Object.keys(validation).forEach(function (field) {
            var error;
            var validateProperty = validation[field];
            var modelProperty = model[field];
            if (validateProperty.required && !modelProperty) {
                addErrors(field, 'This field is required', 'Missing');
            } else if (modelProperty) {
                var minLength = validateProperty.minLength;
                var maxLength = validateProperty.maxLength;
                var pattern = validateProperty.pattern;

                if (minLength && modelProperty.length < minLength) {
                    addErrors(field, 'This field is too short (must have at least ' + minLength + ' characters)');
                }
                if (maxLength && modelProperty.length > maxLength) {
                    addErrors(field, 'This field is too long (must have less than ' + maxLength + ' characters)');
                }
                if (pattern && !pattern.regex.test(modelProperty)) {
                    addErrors(field, pattern.msg || 'This field contains invalid characters');
                }
            }

        });
        return cb(errors.length ? errors : null);
    }
};