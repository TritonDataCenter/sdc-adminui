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
            if (validateProperty.required && !modelProperty && !validation.disableRequiredValidation) {
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
    },
    getReadableSize: function (bytes, base) {
        var result = {value: 0, measure: 'bytes'};
        if (bytes > 0) {
            var sizes = ['bytes', 'KB', 'MB', 'GB', 'TB'];
            base = base || 1024;
            var i = parseInt(Math.floor(Math.log(bytes) / Math.log(base)), 10);
            result.value = parseFloat((bytes / Math.pow(base, i)).toFixed(1));
            result.measure = sizes[i];
        }
        return result;
    },
    getVmSearchParams: function (params) {
        params = params || {};
        var searchParams = params;
        Object.keys(params).forEach(function (key) {
            if (!params[key]) {
                delete searchParams[key];
            }
        });
        return searchParams;
    },
    ip2long: function (ip) {
        var iplong = 0;
        if (typeof ip === 'string') {
            var components = ip.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
            if (components) {
                var power = 1;
                for (var i = 4; i >= 1; i--) {
                    iplong += power * parseInt(components[i], 10);
                    power *= 256;
                }
            }
        }
        return iplong;
    },
    getRange: function (addresses) {
        var firstAddress = addresses.first().id;
        var lastAddress = addresses.last().id;
        var firstAddressComponents = firstAddress.split('.');
        var lastAddressComponents = lastAddress.split('.');
        var range = {
            start: '',
            end: '',
            commonPart: firstAddressComponents[0] + '.',
            startIpLong: this.ip2long(firstAddress),
            endIpLong: this.ip2long(lastAddress)
        };
        for (var i = 1; i < 4; i++) {
            var first = firstAddressComponents[i] + (i === 3 ? '' : '.');
            var last = lastAddressComponents[i] + (i === 3 ? '' : '.');
            if (first === last && !range.start.length) {
                range.commonPart += first;
            } else {
                range.start += first;
                range.end += last;
            }
        }
        return range;
    },
    allNetworkIps: function (addresses, network_uuid) {
        var range = this.getRange(addresses);
        var ips = {};
        var allProvisionIps = [];
        addresses.toJSON().forEach(function (address) {
            ips[address.ip] = address;
        });
        var start = '0x' + Number(range.startIpLong).toString(16);
        var end = '0x' + Number(range.endIpLong).toString(16);

        for (var i = start; i <= end; i++) {
            var components = [(i>>24) & 0xff, (i>>16) & 0xff, (i>>8) & 0xff, i & 0xff];
            var ip = components.join('.');
            allProvisionIps.push(ips[ip] || {
                    ip: ip,
                    network_uuid: network_uuid,
                    free: true,
                    reserved: false
                });
        }
        return allProvisionIps;
    }
};
