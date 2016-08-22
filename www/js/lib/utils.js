function hexCarryOver(value, index, result) {
    if (value.length === 2) {
        result[index + 1] = value[0];
        value = value[1];
    }
    if (result[index]) {
        var sum = (parseInt(result[index] || '0', 16) + parseInt(value, 16)).toString(16);
        if (sum.length > 1) {
            hexCarryOver(sum[0], index + 1, result);
            sum = sum[1];
        }
        result[index] = sum;
    } else {
        result[index] = value;
    }
}

function hexIncrement(value) {
    var result = ['0'];
    var singleResult = parseInt(value[value.length - 1], 16) + 1;
    hexCarryOver(singleResult.toString(16), 0, result);
    for (var i = value.length - 2; i >= 0; i--) {
        hexCarryOver(parseInt(value[i], 16).toString(16), value.length - i - 1, result);
    }
    return result.reverse().join('');
}

function hexAddition(firstValue, secondValue) {
    var result = ['0'];
    var singleResult = '';
    if (firstValue.length < secondValue.length) {
        var value = firstValue;
        firstValue = secondValue;
        secondValue = value;
    }

    for (var i = firstValue.length - 1, j = 1; i >= 0; i--, j++) {
        singleResult = secondValue[secondValue.length - j] ?
            parseInt(firstValue[i], 16) + parseInt(secondValue[secondValue.length - j], 16) : firstValue[i];
        hexCarryOver(singleResult.toString(16), firstValue.length - i - 1, result);
    }

    return result.reverse().join('');
}

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
    isIPv4: function (ip) {
        return /^\d{1,3}(\.\d{1,3}){3}$/.test(ip);
    },
    isIPv6: function (ip) {
        var regexp = new RegExp('^(([\\da-f]{1,4}:){7,7}[\\da-f]{1,4}|([\\da-f]{1,4}:){1,7}:|' +
            '([\\da-f]{1,4}:){1,6}:[\\da-f]{1,4}|([\\da-f]{1,4}:){1,5}(:[\\da-f]{1,4}){1,2}|' +
            '([\\da-f]{1,4}:){1,4}(:[\\da-f]{1,4}){1,3}|([\\da-f]{1,4}:){1,3}(:[\\da-f]{1,4}){1,4}|' +
            '([\\da-f]{1,4}:){1,2}(:[\\da-f]{1,4}){1,5}|[\\da-f]{1,4}:((:[\\da-f]{1,4}){1,6})|' +
            ':((:[\\da-f]{1,4}){1,7}|:))$', 'i');
        return regexp.test(ip);
    },
    ip2long: function (ip) {
        var iplong = 0;
        var isIPv4 = this.isIPv4(ip);
        var IPv4ParsingRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
        var IPv6ParsingRegex = new RegExp('^([\\da-f]{1,4})(:{1,2}(?!:))([\\da-f]{0,4})(:{0,2}(?!:))([\\da-f]{0,4})' +
            '(:{0,2}(?!:))([\\da-f]{0,4})(:{0,2}(?!:))([\\da-f]{0,4})(:{0,2}(?!:))([\\da-f]{0,4})' +
            '(:{0,2}(?!:))([\\da-f]{0,4})(:{0,2}(?!:))([\\da-f]{0,4})$', 'i');
        if (typeof ip === 'string') {
            var SEGMENT_MULTIPLIER = 256;
            var components = ip.match(isIPv4 ? IPv4ParsingRegex : IPv6ParsingRegex);
            if (components) {
                var componentIndex = null;
                var power = 1;
                if (isIPv4) {
                    for (componentIndex = 4; componentIndex >= 1; componentIndex--) {
                        iplong += power * parseInt(components[componentIndex], 10);
                        power *= SEGMENT_MULTIPLIER;
                    }
                } else {
                    var DEFAULT_SIGMENTS_NUMBER = 8;
                    iplong = '';
                    components.filter(function (component) {
                        return component && /^([\da-fA-F]+|::)$/.test(component);
                    }).forEach(function (component, index, array) {
                        if (component !== '::') {
                            while (component.length < 4) {
                                component = '0' + component;
                            }
                            iplong += component;
                            return;
                        }
                        for (var i = 0; i < DEFAULT_SIGMENTS_NUMBER - array.length + 1; i++) {
                            iplong += '0000';
                        }
                    });
                }
            }
        }
        return iplong;
    },
    getRange: function (addresses, provStart, provEnd) {
        var firstAddress = provStart || addresses.first().id;
        var lastAddress = provEnd || addresses.last().id;
        var isIPv4 = this.isIPv4(firstAddress);
        var separator = isIPv4 ? '.' : ':';
        var startIpLong = this.ip2long(firstAddress);
        var endIpLong = this.ip2long(lastAddress);
        var firstAddressComponents = isIPv4 ? firstAddress.split(separator) : this.getNetworkIPv6Components(startIpLong);
        var lastAddressComponents = isIPv4 ? lastAddress.split(separator) : this.getNetworkIPv6Components(endIpLong);
        var range = {
            start: '',
            end: '',
            commonPart: firstAddressComponents[0] + separator,
            startIpLong: startIpLong,
            endIpLong: endIpLong
        };

        var maxComponentsCount = firstAddressComponents.length > lastAddressComponents.length ?
            firstAddressComponents.length : lastAddressComponents.length;
        for (var i = 1; i < maxComponentsCount; i++) {
            var first = firstAddressComponents[i] || '';
            var last = lastAddressComponents[i] || '';
            if (isIPv4) {
                first += i === 3 ? '' : '.';
                last += i === 3 ? '' : '.';
            } else {
                if (firstAddressComponents.length > i) {
                    first += i === firstAddressComponents.length - 1 ? '' : ':';
                }
                if (lastAddressComponents.length > i) {
                    last += i === lastAddressComponents.length - 1 ? '' : ':';
                }
            }
            if (first === last && !range.start.length) {
                range.commonPart += first;
            } else {
                range.start += first;
                range.end += last;
            }
        }
        range.startIp =  range.commonPart + range.start;
        range.endIp =  range.commonPart + range.end;
        return range;
    },
    getNetworkIpList: function (addresses, network_uuid, provision_start_ip, count, notProvisioned) {
        addresses = addresses.fullCollection || addresses;
        var ips = {};
        var self = this;
        var allProvisionIps = [];
        var range = this.getRange(addresses, provision_start_ip);
        var isIPv4 = this.isIPv4(provision_start_ip || addresses.first().id);
        var endIpLong = isIPv4 ? count : hexAddition(range.startIpLong, Number(count).toString(16));
        addresses.toJSON().forEach(function (address) {
            var ip = isIPv4 ? address.ip : self.ip2long(address.ip);
            ips[ip] = address;
        });
        var start = range.startIpLong;
        var end = endIpLong;
        var separator = isIPv4 ? '.' : ':';
        var ip;
        var components;
        for (var i = start; i < end;) {
            if (isIPv4) {
                components = [(i >> 24) & 0xff, (i >> 16) & 0xff, (i >> 8) & 0xff, i & 0xff];
                ip = components.join(separator);
            } else {
                components = this.getNetworkIPv6Components(i);
                ip = components.join(separator);
            }
            if (notProvisioned && ips[ip]) {
                continue;
            }
            allProvisionIps.push(ips[ip] || {
                ip: ip,
                network_uuid: network_uuid,
                free: true,
                reserved: false
            });
            i = isIPv4 ? i + 1 : hexIncrement(i);
        }
        return allProvisionIps;
    },
    getNetworkIPv6Components: function (ip) {
        var componentIndex = 0;
        var componentsArray = ['', '', '', '', '', '', '', ''];
        ip.split('').forEach(function (number, index) {
            if (componentsArray[componentIndex] || number !== '0') {
                componentsArray[componentIndex] += number;
            }
            if (index !== 0 && (index + 1) % 4 === 0) {
                componentsArray[componentIndex] = componentsArray[componentIndex] || '0';
                componentIndex++;
            }
        });
        return componentsArray;
    }
};
