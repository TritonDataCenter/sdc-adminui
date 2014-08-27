/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

/*
 * subr.js: miscellaneous helper routines
 */

/*
 * Stripped down version of s[n]printf(3c).  We make a best effort to throw an
 * exception when given a format string we don't understand, rather than
 * ignoring it, so that we won't break existing programs if/when we go implement
 * the rest of this.
 *
 * This implementation currently supports specifying
 *  - field alignment ('-' flag),
 *  - zero-pad ('0' flag)
 *  - always show numeric sign ('+' flag),
 *  - field width
 *  - conversions for strings, decimal integers, and floats (numbers).
 *  - argument size specifiers.  These are all accepted but ignored, since
 *    Javascript has no notion of the physical size of an argument.
 *
 * Everything else is currently unsupported, most notably precision, unsigned
 * numbers, non-decimal numbers, and characters.
 */
function jsSprintf(fmt)
{
    var regex = [
        '([^%]*)',              /* normal text */
        '%',                /* start of format */
        '([\'\\-+ #0]*?)',          /* flags (optional) */
        '([1-9]\\d*)?',         /* width (optional) */
        '(\\.([1-9]\\d*))?',        /* precision (optional) */
        '[lhjztL]*?',           /* length mods (ignored) */
        '([diouxXfFeEgGaAcCsSp%jr])'    /* conversion */
    ].join('');

    var re = new RegExp(regex);
    var args = Array.prototype.slice.call(arguments, 1);
    var flags, width, precision, conversion;
    var left, pad, sign, arg, match;
    var ret = '';
    var argn = 1;

    jsAssertString(fmt, 'fmt');

    while ((match = re.exec(fmt)) !== null) {
        ret += match[1];
        fmt = fmt.substring(match[0].length);

        flags = match[2] || '';
        width = match[3] || 0;
        precision = match[4] || '';
        conversion = match[6];
        left = false;
        sign = false;
        pad = ' ';

        if (conversion == '%') {
            ret += '%';
            continue;
        }

        if (args.length === 0)
            throw (new Error('too few args to sprintf'));

        arg = args.shift();
        argn++;

        if (flags.match(/[\' #]/))
            throw (new Error(
                'unsupported flags: ' + flags));

        if (precision.length > 0)
            throw (new Error(
                'non-zero precision not supported'));

        if (flags.match(/-/))
            left = true;

        if (flags.match(/0/))
            pad = '0';

        if (flags.match(/\+/))
            sign = true;

        switch (conversion) {
        case 's':
            if (arg === undefined || arg === null)
                throw (new Error('argument ' + argn +
                    ': attempted to print undefined or null ' +
                    'as a string'));
            ret += doPad(pad, width, left, arg.toString());
            break;

        case 'd':
            arg = Math.floor(arg);
            /*jsl:fallthru*/
        case 'f':
            sign = sign && arg > 0 ? '+' : '';
            ret += sign + doPad(pad, width, left,
                arg.toString());
            break;

        case 'j': /* non-standard */
            if (width === 0)
                width = 10;
            ret += JSON.stringify(arg, false, width);
            break;

        case 'r': /* non-standard */
            ret += dumpException(arg);
            break;

        default:
            throw (new Error('unsupported conversion: ' +
                conversion));
        }
    }

    ret += fmt;
    return (ret);
}

function doPad(chr, width, left, str)
{
    var ret = str;

    while (ret.length < width) {
        if (left)
            ret += chr;
        else
            ret = chr + ret;
    }

    return (ret);
}

/*
 * This function dumps long stack traces for exceptions having a cause() method.
 * See node-verror for an example.
 */
function dumpException(ex)
{
    var ret;

    if (!(ex instanceof Error))
        throw (new Error(jsSprintf('invalid type for %%r: %j', ex)));

    /* Note that V8 prepends "ex.stack" with ex.toString(). */
    ret = 'EXCEPTION: ' + ex.constructor.name + ': ' + ex.stack;

    if (!ex.cause)
        return (ret);

    for (ex = ex.cause(); ex; ex = ex.cause ? ex.cause() : null)
        ret += '\nCaused by: ' + dumpException(ex);

    return (ret);
}

/*
 * Report a fatal error, invoked with an Error object.
 */
function jsFatalError(err)
{
    console.error('FATAL ERROR: ' + err.message);
    console.error(err);
    alert(err.message);
    throw (err);
}

/*
 * Report a fatal error, invoked with a sprintf-style string for the message.
 */
function jsFatal(/* fmt, ... */)
{
    var str = jsSprintf.apply(null, Array.prototype.slice.call(arguments));
    jsFatalError(new Error(str));
}

/*
 * Assertions
 */

function jsAssertType(arg, label, expected)
{
    if (typeof (arg) != expected)
        jsFatal('"%s": expected %s, but found %s',
            label, expected, typeof (arg));
}

function jsAssertInt(arg, label)
{
    jsAssertType(arg, label, 'number');

    if (Math.floor(arg) != arg)
        jsFatal('"%s": expected integer, but found number', label);
}

function jsAssertIntOptional(arg, label)
{
    if (arg === undefined)
        return;

    jsAssertInt(arg, label);
}

function jsAssertString(arg, label)
{
    jsAssertType(arg, label, 'string');
}

function jsAssertObject(arg, label)
{
    jsAssertType(arg, label, 'object');
}

function jsAssertFunction(arg, label)
{
    jsAssertType(arg, label, 'function');
}

function jsAssertEnum(arg, label, options)
{
    if (options.indexOf(arg) == -1)
        jsFatal('"%s": expected one of %s, but found "%j"',
            label, options.map(
            function (o) { return ('"' + o + '"'); }).join(', '),
            arg);
}

/*
 * Make an asynchronous request to a JSON API.  Arguments:
 *
 *     host     remote service hostname
 *
 *     port     remote service port
 *
 *     method       HTTP method to use
 *
 *     uri      HTTP URL
 *
 *     [body]       JavaScript object to be stringified and sent in the body
 *              of the request as JSON.
 *
 * "callback" is invoked with an error or the parsed JSON response.
 */
function jsRequestJson(args, callback)
{
    var ajax;

    ajax = {
        'type': args['method'],
        'url': jsSprintf('%s://%s:%d%s', args['protocol'], args['host'], args['port'], args['uri']),
        'dataType': 'json',
        'error': function (xhr, text, err) {
        var reason = '';

        reason = text ? text : 'unknown error';

        if (err && err.message)
            reason += ' (' + err.message + ')';

        if (xhr.responseText)
            reason += ': ' + xhr.responseText;

        var summary = jsSprintf('%s %s failed: %s', args['method'],
            args['uri'], reason);
        var error = new Error(summary);
        error.httpStatus = xhr.status;
        callback(error);
        },
        'success': function (data) {
        callback(null, data);
        }
    };

    if (args['body']) {
        ajax['data'] = JSON.stringify(args['body']);
        ajax['contentType'] = 'application/json';
        ajax['processData'] = false;
    }

    $.ajax(ajax);
}

/*
 * Convenience function for creating a DOM element with the given CSS classes.
 */
function jsCreateElement(tag, classes)
{
    var elt = document.createElement(tag);

    if (classes)
        elt.className = classes;

    return (elt);
}

/*
 * Convenience function for creating a DOM text node.
 */
function jsCreateText(text)
{
    return (document.createTextNode(text));
}

/*
 * Adds the given CSS classes to the given DOM node.
 */
function jsCssAppend(elt, classes)
{
    elt.className += ' ' + classes;
}

/*
 * Given a DOM select element and a set of options as [ value, label ] tuples,
 * replace any existing options on the selector with the new options.
 */
function jsSelectSetOptions(selector, options)
{
    while (selector.options.length > 0)
        selector.remove(selector.options[0]);

    options.forEach(function (optionspec) {
        var option = selector.appendChild(jsCreateElement('option'));
        option.value = optionspec[0];
        option.appendChild(jsCreateText(optionspec[1]));
    });

    selector.selectedIndex = 0;
}

/*
 * Given a plain JavaScript object, serialize it as an encoded querystring.
 */
function jsQuerystring(obj)
{
    var pieces = [];
    var key, value;

    for (key in obj) {
        value = obj[key];
        if (Array.isArray(value)) {
            value.forEach(function (val) {
                pieces.push(encodeURIComponent(key) + '=' +
                    encodeURIComponent(val));
            });
        } else {
            pieces.push(encodeURIComponent(key) + '=' +
                encodeURIComponent(value));
        }
    }

    return (pieces.join('&'));
}

/*
 * Returns true iff the given object has no properties.
 */
function jsIsEmpty(obj)
{
    /* jsl:ignore */
    for (var prop in obj)
        return (false);
    return (true);
    /* jsl:end */
}

/*
 * Simple class-extension mechanism based on the technique used in Node.js and
 * other environments.
 */
function jsExtends(baseclass, superclass)
{
    baseclass.prototype = Object.create(superclass.prototype, {
        'constructor': {
        'value': baseclass,
        'enumerable': false,
        'writable': true,
        'configurable': true
        }
    });
}
