/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

/*
 * Copyright (c) 2014, Joyent, Inc.
 */

/*
 * ca.js: Cloud Analytics widget interface
 *
 * Rich widgets for Cloud Analytics data should support a number of features:
 *
 *   o Multiple widgets updated together, so that they're always in sync.
 *
 *   o Multiple widgets controlled together, so that updating the scale or
 *     selection of one automatically highlights others.
 *
 *   o Robust to backend failures and variable latency requests.
 *
 *   o Old data showing up later (perhaps due to backend slowness).
 *
 * Additionally, this mechanism should be modular so that widgets can be easily
 * dropped into fairly arbitrary contexts.
 *
 * For example usage, see app.js.
 */

/* jsl:import subr.js */
/* jsl:import color.js */
var Rickshaw; /* XXX */

var caUniqueId = 0;			/* unique widget identifier */
var caDefaultBarColor = '#E57F44';	/* default color for bar graphs */
var caDefaultHue = 22;			/* default hue for heat maps */

/*
 * We use a set of secondary colors to highlight individual components in bar
 * charts or heatmaps.
 */
var caColors = [
    '#4785cf',
    '#3bcfa6',
    '#f04567',
    '#6b99cf',
    '#63cf81',
    '#f0738b'
].map(function (rgb) { return (new caColor(rgb)); });

var jqClickLeft = 1;	/* left-click event code */
var jqClickRight = 3;	/* right-click event code */

/*
 * This object is created with parameters identifying the CA instance (including
 * hostname and port, and whether the target is the raw CA service or the
 * publicly accessible cloudapi service) and also provides methods for
 * retrieving individual values.
 */
function caBackendCreate(args)
{
	jsAssertObject(args, 'args');
	jsAssertString(args['type'], 'args.type');
	jsAssertEnum(args['type'], 'args.type', [ 'direct' ]);
	return (new caBackendDirect(args));
}

function caBackendDirect(args)
{
	jsAssertObject(args, 'args');
	jsAssertString(args['host'], 'args.host');
	jsAssertIntOptional(args['port'], 'args.port');

	this.cbd_host = args['host'];
	this.cbd_port = args['port'] || 23181;
    this.cbd_protocol = args['protocol'] || 'http';
	this.cbd_conf = undefined;
}

caBackendDirect.prototype.request = function (args, callback)
{
	var obj = Object.create(args);
	obj['host'] = this.cbd_host;
	obj['port'] = this.cbd_port;
    obj['protocol'] = this.cbd_protocol;

	jsRequestJson(obj, callback);
};

caBackendDirect.prototype.config = function (callback)
{
	this.request({ 'method': 'GET', 'uri': '/ca' }, callback);
};

/* backend operations */
caBackendDirect.prototype.instnsList = function (callback)
{
	var be = this;

	this.request({ 'method': 'GET', 'uri': '/ca/instrumentations' },
	    function (err, instns) {
		if (err) {
			callback(err);
			return;
		}

		callback(null, instns.map(function (instninfo) {
			return (new caInstn(instninfo, be.cbd_conf));
		}));
	    });
};

caBackendDirect.prototype.instnCreate = function (params, callback)
{
	var be = this;

	this.request({
	    'method': 'POST',
	    'uri': '/ca/instrumentations',
	    'body': params
	}, function (err, instninfo) {
		if (err) {
			callback(err);
			return;
		}

		if (!instninfo)
			jsFatal('no data from successful instn_json; ' +
			    'check browser JavaScript console for errors');

		callback(null, new caInstn(instninfo, be.cbd_conf));
	});
};

caBackendDirect.prototype.instnDelete = function (instn, callback)
{
	this.request({
	    'method': 'DELETE',
	    'uri': instn.ci_instn['uri']
	}, callback);
};

caBackendDirect.prototype.instnClone = function (instn, args, callback)
{
	var be = this;

	this.request({
	    'method': 'POST',
	    'uri': instn.ci_instn['uri'] + '/clone',
	    'body': args
	}, function (err, instninfo) {
		if (err) {
			callback(err);
			return;
		}

		if (!instninfo)
			jsFatal('no data from successful instn_json; ' +
			    'check browser JavaScript console for errors');

		callback(null, new caInstn(instninfo, be.cbd_conf));
	});
};

caBackendDirect.prototype.instnValue = function (instn, resource, rparams,
    start, duration, npoints, callback)
{
	var params, uri, i;

	params = Object.create(rparams);
	params['ndatapoints'] = npoints;
	params['duration'] = duration;

	if (start !== undefined)
		params['start_time'] = start;

	for (i = 0; i < instn.ci_instn['uris'].length; i++) {
		if (instn.ci_instn['uris'][i]['name'] == resource)
			break;
	}

	if (i == instn.ci_instn['uris'].length)
		jsFatal('value "%s" uri not found for instn %j',
		    resource, instn);

	uri = instn.ci_instn['uris'][i]['uri'] + '?' + jsQuerystring(params);

	this.request({
	    'method': 'GET',
	    'uri': uri
	}, callback);
};


/*
 * caConf represents a particular CA instance and keeps track of what metrics
 * are available.  This object defers to a caBackend implementation for
 * communicating with the backend instance.
 */
function caConf(args)
{
	/*
	 * XXX support implicit customer, hostname, or other scope, as well as
	 * profiles to limit the contained metrics.
	 */
	jsAssertObject(args, 'args');
	jsAssertObject(args['backend'], 'args.backend');

	this.cc_backend = args['backend'];
	this.cc_state = 'init';

	this.cc_fields = undefined;
	this.cc_metrics = undefined;
	this.cc_modules = undefined;
	this.cc_types = undefined;

	/* XXX refactor -- this is nasty */
	this.cc_backend.cbd_conf = this;
}

/* load all metrics and other static backend data */
caConf.prototype.load = function (callback)
{
	var conf = this;

	this.cc_backend.config(function (err, config) {
		if (err) {
			callback(err);
			return;
		}

		conf.cc_fields = config['fields'];
		conf.cc_metrics = config['metrics'];
		conf.cc_modules = config['modules'];
		conf.cc_types = config['types'];

		callback();
	});
};

caConf.prototype.fieldArity = function (fieldname)
{
	if (!this.cc_fields.hasOwnProperty(fieldname))
		/* assume scalar; pick another field with a scalar type */
		fieldname = 'hostname';

	var type = this.cc_fields[fieldname]['type'];
	if (!this.cc_types.hasOwnProperty(type))
		type = 'string';

	return (this.cc_types[type]['arity']);
};

caConf.prototype.fieldLabel = function (fieldname)
{
	return (this.cc_fields[fieldname]['label']);
};

caConf.prototype.fieldType = function (fieldname)
{
	return (this.cc_fields[fieldname]['type']);
};

caConf.prototype.typeInfo = function (type)
{
	return (this.cc_types[type]);
};

/* iterate available metrics (used to build initial selector) */
caConf.prototype.eachMetric = function (func)
{
	var conf = this;

	if (this.cc_metrics === undefined)
		jsFatal('metrics not loaded');

	this.cc_metrics.forEach(function (metric) {
		func({
		    'module': metric['module'],
		    'stat': metric['stat'],
		    'label': conf.cc_modules[metric['module']]['label'] + ': ' +
		        metric['label']
		});
	});
};

/* iterate fields for a given metric */
caConf.prototype.eachField = function (metric, func)
{
	var conf = this;
	var raw = this.metricRaw(metric['module'], metric['stat']);

	raw['fields'].forEach(function (fieldname) {
		func(metric, {
		    'field': fieldname,
		    'label': conf.cc_fields[fieldname]['label'],
		    'type': conf.cc_fields[fieldname]['type']
		});
	});
};

/* list metrics with the given fields */
caConf.prototype.pivots = function (field) {};

caConf.prototype.metric = function (module, stat)
{
	var raw = this.metricRaw(module, stat);

	if (raw === null)
		return (null);

	return ({
	    'module': module,
	    'stat': stat,
	    'label': this.cc_modules[module]['label'] + ': ' + raw['label']
	});
};

caConf.prototype.metricRaw = function (module, stat)
{
	for (var i = 0; i < this.cc_metrics.length; i++) {
		if (this.cc_metrics[i]['module'] == module &&
		    this.cc_metrics[i]['stat'] == stat)
			return (this.cc_metrics[i]);
	}

	return (null);
};

caConf.prototype.instnClone = function ()
{
	var args = Array.prototype.slice.call(arguments);
	return (this.cc_backend.instnClone.apply(this.cc_backend, args));
};


/*
 * A caInstn represents a particular instrumentation and provides methods for
 * presenting the instrumentation and accessing the underlying data.
 */
function caInstn(params, conf)
{
	this.ci_instn = params;
	this.ci_conf = conf;
	this.ci_gone = false;
}

/* Returns an appropriate English title for this metric. */
caInstn.prototype.title = function ()
{
	var conf = this.ci_conf;
	var metric = this.ci_conf.metric(
	    this.ci_instn['module'], this.ci_instn['stat']);

	if (metric === null)
		return ('Unknown stat');

	var label = metric['label'];

	if (this.ci_instn['predicate'] &&
	    !jsIsEmpty(this.ci_instn['predicate'])) {
		label += ' predicated on ' + caPredicateToEnglish(
		    this.ci_conf, this.ci_instn['predicate']);
	}

	if (this.ci_instn['decomposition'].length === 0)
		return (label);

	label += ' decomposed by ' +
	    this.ci_instn['decomposition'].map(function (fieldname) {
	        return (conf.fieldLabel(fieldname));
	    }).join(' and ');

	return (label);
};

caInstn.prototype.id = function ()
{
	return (this.ci_instn['uri']);
};

caInstn.prototype.granularity = function ()
{
	return (this.ci_instn['granularity']);
};

caInstn.prototype.unit = function ()
{
	var metric, label;

	metric = this.ci_conf.metric(
	    this.ci_instn['module'], this.ci_instn['stat']);
	label = metric['label'];
	label = label.substr(label.indexOf(':') + 2);
	return (label);
};

/* Lists available decompositions, given the current metric. */
caInstn.prototype.availDecomps = function ()
{
	var decomps = this.ci_instn['decomposition'];

	if (decomps.length > 1)
		return ([]);

	var conf = this.ci_conf;
	var arity = decomps.length > 0 ? conf.fieldArity(decomps[0]) : null;
	var instn = this.ci_instn;
	var metric = this.ci_conf.metric(instn['module'], instn['stat']);
	var rv = [];

	conf.eachField(metric, function (_, field) {
		if (conf.fieldArity(field['field']) === arity)
			return;

		rv.push(field);
	});

	return (rv);
};

/* Lists related pivots, given the current metric. */
caInstn.prototype.availPivots = function () {};
/* Appropriate y-axis label for this instrumentation. */
caInstn.prototype.yLabel = function () {};

caInstn.prototype.isNumericDecomposition = function ()
{
	return (this.ci_instn['value-arity'] == 'numeric-decomposition');
};

caInstn.prototype.baseMetric = function ()
{
	return ({
	    'module': this.ci_instn['module'],
	    'stat': this.ci_instn['stat']
	});
};

caInstn.prototype.unitScale = function ()
{
	var decomps = this.ci_instn['decomposition'];
	var field, arity, type, metric;

	if (decomps.length > 0) {
		field = decomps[0];
		arity = this.ci_conf.fieldArity(field);

		if (arity != 'numeric' && decomps.length > 1) {
			field = decomps[1];
			arity = this.ci_conf.fieldArity(field);
		}

		if (arity == 'numeric')
			type = this.ci_conf.fieldType(field);
	}

	if (!arity || arity != 'numeric') {
		metric = this.ci_conf.metricRaw(
		    this.ci_instn['module'], this.ci_instn['stat']);
		type = metric['type'];
	}

	if (type === null)
		return (null);

	return (this.ci_conf.typeInfo(type));
};

/*
 * A caPanel represents several instrumentations that are updated and
 * manipulated together.  It's responsible for fetching and storing data for
 * each of the instrumentations, and takes care of making sure they're all
 * updated at the same time.
 *
 *
 * Data storage
 *
 * This design accommodates several different use cases:
 *
 *     o a simple line graph or heat map showing the raw value or heat map value
 *       of an instrumentation
 *
 *     o a widget showing one main line graph and one or more additional graphs
 *       showing different windows on the same data (e.g., a longer period)
 *
 *     o a widget showing a heat map with the Nth percentile line graph overlaid
 *       on top of the heat map
 *
 * We define a few abstractions to deal with these use cases:
 *
 *     o an instrumentation (caInstn) identifies the backend data source, which
 *       may support multiple views on the same data (e.g., heat map, average,
 *       Nth percentile, and so on)
 *
 *     o a widget (caWidget*) presents instrumentation data to users, often with
 *       controls that affect the range of data shown or how the data is
 *       presented
 *
 *     o a panel (caPanel) fetches and stores data for one or more
 *       instrumentations and updates one or more widgets associated with those
 *       instrumentations
 *
 *     o a view (caView) connects widgets and instrumentations: widgets create
 *       views on instrumentations whose data they want to present.  The view
 *       identifies an instrumentation, the resource (e.g., raw value, heat map,
 *       or percentile), and a range of data (e.g., 30 seconds starting at time
 *       T).  Widgets may create multiple views, either on different
 *       instrumentations (e.g., to overlay graphs) or on the same
 *       instrumentation (e.g., to show graphs for multiple time periods in the
 *       same widget).
 *
 * The panel is responsible for making sure that the data associated with each
 * view is available.  The panel also emits the following events:
 *
 *     paused		emitted when the user pauses all widgets in the panel
 *
 *     unpaused		emitted when the user unpauses all widgets in the panel.
 *
 * The panel periodically fetches any data that's not available but required for
 * the views.  A separate timer at the top-level should periodically update
 * widgets by pulling data from the panel.
 */
function caPanel(args)
{
	jsAssertObject(args, 'args');
	jsAssertObject(args['backend'], 'args.backend');

	this.cp_backend = args['backend'];
	this.cp_instns = {};		/* instns, by instn id */
	this.cp_views = [];		/* views */
	this.cp_listeners = {};		/* event listeners */
	this.cp_interval = undefined;	/* interval timer handle */
	this.cp_npending = 0;		/* nr of pending fetches */
	this.cp_wanted = false;		/* another update wanted */

	/*
	 * Data storage: data is stored in cp_data keyed by instn identifier,
	 * then by backend resource, then by start time.  Data points are always
	 * in units of the instrumentation's granularity.
	 */
	this.cp_data = {};		/* instn data */
}

/* Adds a new instrumentation to the panel. */
caPanel.prototype.instnAdd = function (instn)
{
	this.cp_instns[instn.id()] = instn;
};

/* Removes an instrumentation from the panel. */
caPanel.prototype.instnRemove = function (instn)
{
	/* XXX validate no views */
	delete (this.cp_instns[instn.id()]);
};

/* Pause and unpause updates for all instrumentations in this panel. */
caPanel.prototype.pause = function ()
{
	clearInterval(this.cp_interval);
	this.cp_interval = undefined;
	this.emit('paused');
};

caPanel.prototype.paused = function ()
{
	return (this.cp_interval === undefined);
};

caPanel.prototype.unpause = function ()
{
	if (this.cp_interval !== undefined)
		return;

	var panel = this;
	this.cp_interval = setInterval(function () { panel.tick(); }, 1000);
	this.tick();
	this.emit('unpaused');
};

/*
 * Views are defined by several properties:
 *
 *     instnId		instrumentation identifier
 *
 *     resourceName	backend value name (e.g., "raw", "heatmap/image")
 *
 *     [resourceParams]	backend value params (e.g., Nth percentile)
 *
 *     npoints		number of data points
 *
 *     [windowStart]	timestamp of first data point
 *
 * If windowStart is not specified, then the view describes the most recent
 * "npoints" data points.
 */
caPanel.prototype.viewAdd = function (options)
{
	var instnid = options['instnId'];

	if (!(this.cp_instns.hasOwnProperty(instnid)))
		jsFatal('no such instn: %s', instnid);

	var instn = this.cp_instns[instnid];
	var view = new caView(options, instn);
	this.cp_views.push(view);

	var resource = view.cv_resource_name;

	if (!this.cp_data.hasOwnProperty(instnid))
		this.cp_data[instnid] = {};

	if (!this.cp_data[instnid].hasOwnProperty(resource))
		this.cp_data[instnid][resource] = {};

	return (view);
};

caPanel.prototype.viewRemove = function (view)
{
	/*
	 * This view will be removed from cp_views when we next try to update
	 * it.
	 */
	view.cv_removed = true;
};

caPanel.prototype.widgetRemove = function (widget)
{
	/*
	 * TODO It's not clear that we should always remove instrumentations
	 * when the corresponding widgets are removed.  We certainly don't want
	 * to remove this instrumentation if there's another widget on the same
	 * page that refers to it.
	 */
	this.viewRemove(widget.view());
	this.instnRemove(widget.instn());
};

caPanel.prototype.tick = function (force)
{
	if (this.cp_npending > 0) {
		if (force)
			this.cp_wanted = true;

		return;
	}

	this.fetchNeeded();
};

caPanel.prototype.fetchNeeded = function ()
{
	var view, i;

	for (i = 0; i < this.cp_views.length; i++) {
		view = this.cp_views[i];

		if (view.cv_removed) {
			this.cp_views.splice(i--, 1);
			continue;
		}

		if (this.cp_instns[view.cv_instnid].ci_gone)
			continue;

		this.fetchView(view);
	}
};

caPanel.prototype.fetchView = function (view)
{
	var panel = this;
	var instn = this.cp_instns[view.cv_instnid];
	var resource = view.cv_resource_name;
	var now, data, start, rparams, npoints;

	now = Date.now();

	/*
	 * There are basically three cases here:
	 *
	 *    o If cv_start is set, then the view covers a fixed interval in the
	 *      past starting at cv_start.
	 *
	 *    o Otherwise, the view covers a sliding window up to the present.
	 *      If we don't know what the "present" is, then we make a first
	 *      request for one data point, which we use only to fetch the
	 *      current time.  Then we "tick" again.
	 *
	 *    o Once we know what "now" is on the server, we specify a starting
	 *      timestamp in subsequent requests to avoid issues with
	 *      local/remote clock skew.
	 */
	if (view.cv_start !== undefined) {
		start = view.cv_start;
	} else if (view.cv_window_start !== undefined &&
	    view.cv_offset !== undefined) {
		/*
		 * We want to increment the existing window start by the time
		 * since the last update, NOT the granularity of the
		 * instrumentation.  The result should be normalized to the
		 * granularity (and rounded down), and unnecessary updates
		 * should be skipped.
		 */
		start = view.cv_window_start + Math.floor((now -
		    1000 * view.cv_window_start - view.cv_offset) / 1000) -
		    view.cv_npoints * view.cv_duration;
	}

	if (start === undefined) {
		/*
		 * XXX This is a workaround for the fact that CA assumes
		 * "ndatapoints" refers to points *after* the start_time, and
		 * infers "start_time" when unspecified without considering the
		 * number of data points.  The result is that a request with
		 * only a "ndatapoints" parameter > 1 results fails with "such
		 * data points would be in the future".  We work around this by
		 * making a request for only one data point that's only used to
		 * fetch the current start_time, from which we can compute what
		 * start_time to specify in a subsequent request to get the data
		 * points we really want.
		 */
		npoints = 1;
	} else {
		npoints = view.cv_npoints;
		rparams = JSON.stringify(view.cv_resource_params);

		if (!this.cp_data[view.cv_instnid][
		    resource].hasOwnProperty([rparams]))
			this.cp_data[view.cv_instnid][resource][rparams] = {};

		data = this.cp_data[view.cv_instnid][resource][rparams];

		while (data[start] && npoints > 0) {
			start += view.cv_duration;
			npoints--;
		}

		if (npoints === 0) {
			view.onUpdate();
			return;
		}
	}

	// console.log('fetching for ' + view.cv_instnid + ' from ' +
	//     start + ' ' + npoints);

	this.cp_npending++;
	this.cp_backend.instnValue(instn, resource, view.cv_resource_params,
	    start, view.cv_duration, npoints, function (err, newdata) {
		panel.cp_npending--;

		if (err) {
			if (err.httpStatus == 404) {
				console.error('instn %s was deleted',
				    instn.ci_instn['uri']);
				instn.ci_gone = true;
				panel.emit('error', new Error(
				    'Instrumentation "' +
				    instn.ci_instn['uri'] + '" (' +
				    instn.title() + ') has been ' +
				    'deleted by another user.'));
				return;
			}

			/* XXX */
			jsFatalError(err);
		}

		if (newdata === null) {
			console.error('warning: NULL data point for %j',
			    instn.id());
			return;
		}

		if (!Array.isArray(newdata))
			jsFatal('expected array of points, but got %j',
			    newdata);

		if (view.cv_offset === undefined)
			view.cv_offset = now - newdata[0]['end_time'] * 1000;

		var lastpoint = newdata[newdata.length - 1];

		if (view.cv_start === undefined) {
			/* Update the start of sliding window. */
			view.cv_window_start = lastpoint['start_time'] -
			    (view.cv_npoints - 1) * view.cv_duration;
		}

		if (view.cv_latest_start === undefined ||
		    lastpoint['end_time'] > view.cv_latest_start)
			view.cv_latest_start = lastpoint['end_time'];

		if (start !== undefined) {
			panel.onData(view.cv_instnid, resource, rparams,
			    newdata);
			view.onUpdate();
		} else {
			panel.fetchView(view);
		}

		if (panel.cp_wanted && panel.cp_npending === 0) {
			panel.cp_wanted = false;
			panel.tick();
		}
	});
};

caPanel.prototype.onData = function (instnid, resource, rparams, data)
{
	var instn, points, point;

	instn = this.cp_instns[instnid];
	if (!instn)
		/* Already removed. */
		return;

	if (!this.cp_data.hasOwnProperty(instnid))
		this.cp_data[instnid] = {};

	if (!this.cp_data[instnid].hasOwnProperty(resource))
		this.cp_data[instnid][resource] = {};

	if (!this.cp_data[instnid][resource].hasOwnProperty(rparams))
		this.cp_data[instnid][resource][rparams] = {};

	points = this.cp_data[instnid][resource][rparams];

	data.forEach(function (datum) {
		point = {
		    'isComplete': datum['nsources'] > 0 &&
		        datum['minreporting'] === datum['nsources']
		};

		points[datum['start_time']] = point;

		if (instn.isNumericDecomposition()) {
			point['image'] = datum['image'];
			point['ymax'] = datum['ymax'];
			point['ymin'] = datum['ymin'];
			point['present'] = datum['present'];
			return;
		}

		point['value'] = datum['value'];
		if (typeof (datum['value']) == 'number') {
			point['total'] = datum['value'];
			return;
		}

		jsAssertObject(datum['value']);

		var sum = 0, count = 0;
		for (var component in datum['value']) {
			sum += datum['value'][component];
			count++;
		}

		point['total'] = sum;
		point['count'] = count;
	});
};

caPanel.prototype.data = function (view)
{
	var ostart, paramkey, instn, data, rv, complete;
	var i, start, value, sum, count, sumby;

	ostart = view.cv_start || view.cv_window_start;
	if (ostart === undefined)
		return (null);

	paramkey = JSON.stringify(view.cv_resource_params);
	instn = this.cp_instns[view.cv_instnid];

	if (!this.cp_data[view.cv_instnid][
	    view.cv_resource_name].hasOwnProperty(paramkey))
		this.cp_data[view.cv_instnid][view.cv_resource_name][
		    paramkey] = {};

	data = this.cp_data[view.cv_instnid][view.cv_resource_name][
	    paramkey];
	rv = new Array(view.cv_npoints);
	complete = true;
	sum = 0;
	count = 0;
	sumby = {};

	for (i = 0; i < rv.length; i++) {
		start = ostart + i * view.cv_duration;

		if (data[start]) {
			complete = complete && data[start]['isComplete'];

			if (instn.isNumericDecomposition()) {
				value = {
				    'image': data[start]['image'],
				    'present': data[start]['present'],
				    'ymin': data[start]['ymin'],
				    'ymax': data[start]['ymax']
				};
			} else {
				value = data[start]['value'];

				if (data[start]['isComplete']) {
					sum += data[start]['total'];
					count++;
				}

				if (typeof (value) != 'number') {
					for (var key in value) {
						if (!sumby.hasOwnProperty(key))
							sumby[key] = 0;

						sumby[key] += value[key];
					}
				}
			}
		} else {
			value = 0; /* XXX might be an object or heat map */
			complete = false;
		}

		rv[i] = { 'x': start, 'y': value };
	}

	for (key in sumby)
		sumby[key] = count === 0 ? 0 :
		    sumby[key] / (count * view.cv_duration);

	return ({
	    'points': rv,
	    'rangeAverage': count === 0 ? 0 :
	        sum / (count * view.cv_duration),
	    'isComplete': complete,
	    'componentAverages': sumby
	});
};

/* XXX should be generic */
caPanel.prototype.on = function (eventname, callback)
{
	if (!this.cp_listeners.hasOwnProperty(eventname))
		this.cp_listeners[eventname] = [];

	this.cp_listeners[eventname].push(callback);
};

caPanel.prototype.emit = function (eventname)
{
	if (!this.cp_listeners.hasOwnProperty(eventname))
		return;

	var args = Array.prototype.slice.call(arguments, 1);

	this.cp_listeners[eventname].forEach(function (callback) {
		callback.apply(null, args.slice());
	});
};


function caView(options, instn)
{
	jsAssertObject(options, 'view');
	jsAssertString(options['instnId'], 'view.instnId');
	jsAssertString(options['resourceName'], 'view.resourceName');

	if (options.hasOwnProperty('resourceParams'))
		jsAssertObject(options['resourceParams'],
		    'view.resourceParams');

	jsAssertInt(options['npoints'], 'view.npoints');
	jsAssertIntOptional(options['windowStart'], 'view.windowStart');

	this.cv_instn = instn;
	this.cv_instnid = options['instnId'];
	this.cv_resource_name = options['resourceName'];
	this.cv_resource_params = options['resourceParams'] || {};
	this.cv_npoints = options['npoints'];
	this.cv_duration = options['duration'];
	this.cv_latest_start = undefined;
	this.cv_offset = undefined;

	if (options.hasOwnProperty('windowStart')) {
		this.cv_start = options['windowStart'];
		this.cv_window_start = options['windowStart'];
	} else {
		this.cv_window_start = undefined;
	}
}

caView.prototype.pause = function ()
{
	if (this.cv_start !== undefined)
		return;

	this.cv_start = this.cv_window_start;
};

caView.prototype.catchUp = function ()
{
	this.cv_start = undefined;
	this.cv_window_start = undefined;
};

caView.prototype.isCurrent = function ()
{
	if (this.cv_start === undefined)
		/* Not paused => must be current */
		return (true);

	if (this.cv_latest_start === undefined)
		/*
		 * We don't actually know, because we don't have a window yet.
		 * Assume that we are current.
		 */
		return (true);

	return (this.cv_start +
	    this.cv_npoints * this.cv_duration > this.cv_latest_start);
};

caView.prototype.scroll = function (shift)
{
	this.cv_window_start += shift * this.cv_instn.granularity();

	if (this.cv_start !== undefined)
		this.cv_start += shift * this.cv_instn.granularity();

	this.checkCurrent();
};

caView.prototype.setNPoints = function (npoints)
{
	var oldnpoints = this.cv_npoints;

	this.cv_npoints = npoints;

	if (this.cv_start !== undefined) {
		this.cv_start += (oldnpoints - npoints) * this.cv_duration;
		this.checkCurrent();
		return;
	}

	if (this.cv_window_start === undefined) {
		/* uninitialized sliding window -- no change */
		return;
	}

	this.cv_window_start += (oldnpoints - npoints) * this.cv_duration;
	this.checkCurrent();
};

caView.prototype.checkCurrent = function ()
{
	if (this.isCurrent() && this.cv_start !== undefined) {
		this.catchUp();
	} else if (!this.isCurrent()) {
		this.pause();
	}
};

caView.prototype.setDuration = function (duration)
{
	var oldduration = this.cv_duration;
	this.cv_duration = duration;

	if (this.cv_start !== undefined) {
		this.cv_start += (oldduration - duration) * this.cv_npoints;
		this.checkCurrent();
		return;
	}

	if (this.cv_window_start === undefined) {
		/* uninitialized sliding window -- no change */
		return;
	}

	/* sliding window: start changes */
	this.cv_window_start += (oldduration - duration) * this.cv_npoints;
	this.checkCurrent();
};

/* XXX should use a proper event listener class */
caView.prototype.onUpdate = function ()
{
	if (!this.cv_removed && this.cv_onupdate)
		this.cv_onupdate();
};


/*
 * General-purpose widget for allowing the user to create a new instrumentation.
 * Users first select a base metric (e.g., "Network: bytes sent/received"), then
 * are given options to select a primary and/or secondary decomposition.  In the
 * future, this may support predicates, granularity, saving data to disk
 * persistently, and so on.
 *
 * Arguments include:
 *
 *     conf		Initialized caConf object
 *
 *     oncreate		Function to be invoked when the user actually creates an
 *     			instrumentation.  Invoked as oncreate(params), where
 *     			"params" may contain any instrumentation-creation
 *     			parameters, including "module", "stat", and
 *     			"decomposition".
 */
function caWidgetCreateInstn(args)
{
	jsAssertObject(args, 'args');
	jsAssertObject(args['conf'], 'args.conf');
	jsAssertFunction(args['oncreate'], 'args.oncreate');

	this.wci_conf = args['conf'];
	this.wci_oncreate = args['oncreate'];

	this.caElement = $([
	    '<div class="caWidgetCreateInstn">',
	    '<table class="caConfigTable">',
	    '<tr>',
	    '  <td class="caConfigLabel">Instrument</td>',
	    '  <td><select class="caWidgetCreateSelectMetric"></select></td>',
	    '</tr>',
	    '<tr>',
	    '  <td class="caConfigLabel">Decompose by</td>',
	    '  <td>',
	    '    <select class="caWidgetCreateSelectDecomp"></select> and ',
	    '    <select class="caWidgetCreateSelectDecomp"></select>',
	    '  </td>',
	    '</tr>',
	    '<tr class="caHidden">',
	    '  <td class="caConfigLabel">Keep</td>',
	    '  <td>',
	    '    <input type="text" value="10 minutes" size="15" ',
	    '        disabled="disabled"></input> ',
	    '    of data',
	    '  </td>',
	    '</tr>',
	    '<tr class="caHidden">',
	    '  <td class="caConfigLabel">at a resolution of</td>',
	    '  <td>',
	    '    <input type="text" value="1 second" size="15"',
	    '        disabled="disabled"></input> ',
	    '  </td>',
	    '</tr>',
	    '<tr class="caHidden">',
	    '  <td class="caConfigLabel">Stop after</td>',
	    '  <td>',
	    '    <input type="text" value="1 hour" size="15"',
	    '        disabled="disabled"></input> ',
	    '    of inactivity',
	    '  </td>',
	    '</tr>',
	    '<tr class="caHidden">',
	    '  <td class="caConfigLabel">Persist data to disk</td>',
	    '  <td>',
	    '    <input type="checkbox" disabled="disabled"></input>',
	    '  </td>',
	    '</tr>',
	    '<tr>',
	    '<td><div class="caWidgetExpandButton">More options</div></td>',
	    '<td><div class="caWidgetCreateButton">Create</div></td>',
	    '</tr>',
	    '</table>',
	    '</div>'
	].join('\n'))[0];

	var widget = this;
	var options = [];
	var expanded = false;
	var expandbutton, extras, createbutton, selectors;

	extras = this.caElement.getElementsByClassName('caHidden');
	expandbutton = this.caElement.getElementsByClassName(
	    'caWidgetExpandButton')[0];
	$(expandbutton).button({
	    'icons': {
	        'secondary': 'ui-icon-triangle-1-s'
	    }
	});
	$(expandbutton).click(function () {
		if (!expanded) {
			// $(extras).slideDown(250);
			$(extras).show();
			$(expandbutton).button('destroy');
			$(expandbutton).text('Fewer options');
			$(expandbutton).button({
			    'icons': {
				'secondary': 'ui-icon-triangle-1-n'
			    }
			});
		} else {
			$(extras).hide();
			$(expandbutton).button('destroy');
			$(expandbutton).text('More options');
			$(expandbutton).button({
			    'icons': {
				'secondary': 'ui-icon-triangle-1-s'
			    }
			});
		}

		expanded = !expanded;
	});

	createbutton = this.caElement.getElementsByClassName(
	    'caWidgetCreateButton')[0];
	$(createbutton).button().click(function () { widget.created(); });

	selectors = this.caElement.getElementsByTagName('select');
	this.wci_metric = selectors[0];
	this.wci_decomp1 = selectors[1];
	this.wci_decomp2 = selectors[2];

	this.wci_conf.eachMetric(function (metric) {
		options.push([
		    metric['module'] + '.' + metric['stat'],
		    metric['label']
		]);
	});

	jsSelectSetOptions(this.wci_metric, options);
	if (options.length === 0) {
		$(createbutton).attr('disabled', true);
		$(this.wci_decomp1).attr('disabled', true);
		$(this.wci_decomp2).attr('disabled', true);
	}

	this.metricSelected();
	$(this.wci_metric).on('change',
	    function () { widget.metricSelected(); });
	$(this.wci_decomp1).on('change',
	    function () { widget.decompSelected(); });
}

caWidgetCreateInstn.prototype.baseMetric = function ()
{
	var metric_encoded = $(this.wci_metric).val();
	var dot = metric_encoded.indexOf('.');
	var module = metric_encoded.substr(0, dot);
	var stat = metric_encoded.substr(dot + 1);

	return ({ 'module': module, 'stat': stat });
};

caWidgetCreateInstn.prototype.metricSelected = function ()
{
	var options = [];

	options.push([ '', '<none>' ]);
	this.wci_conf.eachField(this.baseMetric(), function (_, fieldinfo) {
		options.push([ fieldinfo['field'], fieldinfo['label'] ]);
	});

	jsSelectSetOptions(this.wci_decomp1, options);
	this.decompSelected();
};

caWidgetCreateInstn.prototype.decompSelected = function ()
{
	var field = $(this.wci_decomp1).val();
	var options = [];
	var conf = this.wci_conf;
	var arity;

	options.push([ '', '<none>' ]);

	if (field !== '') {
		arity = this.wci_conf.fieldArity(field);
		conf.eachField(this.baseMetric(), function (_, fieldinfo) {
			if (arity == conf.fieldArity(fieldinfo['field']))
				return;

			options.push(
			    [ fieldinfo['field'], fieldinfo['label'] ]);
		});
	}

	jsSelectSetOptions(this.wci_decomp2, options);
	$(this.wci_decomp2).attr('disabled', options.length == 1);
};

caWidgetCreateInstn.prototype.created = function ()
{
	var metric, value;

	metric = this.baseMetric();
	metric['decomposition'] = [];

	value = $(this.wci_decomp1).val();
	if (value !== '') {
		metric['decomposition'].push(value);

		value = $(this.wci_decomp2).val();
		if (value !== '')
			metric['decomposition'].push(value);
	}

	this.wci_oncreate(metric);
};


/*
 * Base class for chart-like widgets, which display both a toolbar, a chart
 * (which may be a Rickshaw-based line graph or a heat map), and a legend.
 *
 * Future options will include:
 *
 *    showLegend [true]		Display a legend at left showing present values
 *    				of the optional decomposition.
 *
 *    showToolbar [true]	Show panning and zooming tools.
 *
 *    showTitle [true]		Show titlebar with "close" widget.
 *
 *    showXAxisLabel [true]	Show label for the x-axis
 *    showYAxisLabel [true]	Show label for the y-axis
 *
 *    showPredicateBar [true]	Show subwidget for adding a new predicate
 *
 *    panel			Panel containing each of the source
 *    				instrumentations.  All sources must be contained
 *    				in the same panel.
 *
 *    pxHeight			Height (in pixels) of the widget's data window.
 *
 *    pxWidth			Width (in pixels) of the widget's data window.
 *    				Besides being used to style the widget, this is
 *    				used to determine whether individual data points
 *    				should be aggregated (i.e. if the range covers
 *    				600 data points on an image only 200 pixels
 *    				wide).
 *
 *    title			Human-readable title for widget
 *
 *    onremove			Callback to be invoked when the widget is
 *    				removed.
 *
 * This widget also keeps track of the currently selected values.
 */
function caWidgetChart(args)
{
	var widget = this;

	this.cc_id = caUniqueId++;
	this.caElement = caWidgetGenericGraph(args);
	this.caElement.id = 'caGraph' + this.cc_id;

	this.cc_args = args;
	this.cc_oninstn = args['oninstn'];
	this.cc_graph = this.caElement.getElementsByClassName('caGraphData')[0];
	this.cc_warning = this.caElement.getElementsByClassName(
	    'caGraphWarning')[0];
	this.cc_legend = this.caElement.getElementsByClassName(
	    'caGraphLegend')[0];
	this.cc_table = undefined;
	this.cc_components = this.cc_legend.appendChild(
	    jsCreateElement('table', 'caGraphLegendTable'));
	this.cc_zoomranges = [ 30, 60, 120, 300, 600, 900, 1800, 3600 ];

	/* panel interaction */
	this.cc_panel = args['panel'];
	this.cc_panel.on('paused', function () { widget.onPause(); });
	this.cc_panel.on('unpaused', function () { widget.onUnpause(); });

	/* selection management */
	this.cc_hues = [];
	this.cc_nhues = 0;
	this.cc_selected = {};

	/* toolbar creation */
	var toolbar = this.caElement.getElementsByClassName(
	    'caGraphToolbar')[0];

	this.cc_button_pause = {
	    'name': 'pause',
	    'icon': 'ui-icon-pause',
	    'action': 'actionPause'
	};

	this.cc_button_unpause = {
	    'icon': 'ui-icon-play',
	    'action': 'actionUnpause'
	};

	this.cc_buttons = {};

	this.cc_button_zoomout = {
	    'icon': 'ui-icon-zoomout',
	    'action': 'actionZoomOut'
	};

	this.cc_button_zoomin = {
	    'icon': 'ui-icon-zoomin',
	    'action': 'actionZoomIn'
	};

	var buttons = [
	    this.cc_button_pause,
	    this.cc_button_zoomout,
	    this.cc_button_zoomin,
	    {
	        'icon': 'ui-icon-seek-prev',
		'action': 'actionScrollLeft'
	    }, {
	        'icon': 'ui-icon-seek-next',
		'action': 'actionScrollRight'
	    }, {
	        'icon': 'ui-icon-seek-end',
		'action': 'actionScrollCurrent'
	    }, {
		'name': 'clone',
		'id': 'caGraphButtonClone' + this.cc_id,
	        'icon': 'ui-icon-wrench'
	    }
	];

	buttons.forEach(function (conf) {
		var button = jsCreateElement('div',
		    'caGraphButton caGraphButton');

		toolbar.appendChild(button);
		widget.initButton(button, conf);

		if (conf['name'])
			widget.cc_buttons[conf['name']] = button;

		if (conf['id'])
			button.id = conf['id'];
	});

	$(this.cc_components).on('mousedown', function (event) {
		widget.legendClicked(event);
	});

	$(this.cc_components).on('contextmenu', function (event) {
		event.preventDefault();
	});

	$.contextMenu({
	    'selector': '#caGraph' + this.cc_id + ' .caGraphLegendTable',
	    'build': function (e) {
		return (widget.legendMenu(e));
	    }
	});
}

caWidgetChart.prototype.initMenu = function ()
{
	/*
	 * Determine the available decompositions and build an appropriate
	 * context menu.  For now, we look only at the first source
	 * instrumentation.
	 */
	var widget = this;
	var menu = {};
	var decomps = {};
	var instn = this.instn();

	instn.availDecomps().forEach(function (field) {
		decomps[field['field']] = {
		    'name': field['label'],
		    'callback': function () { widget.actionDecompose(field); }
		};
	});

	if (!jsIsEmpty(decomps)) {
		menu['decompose'] = {
		    'name': 'Decompose ' +
		        (instn.ci_instn['decomposition'].length > 0 ?
			'again ': '') + 'by ',
		    'items': decomps
		};
	}

	if (!jsIsEmpty(menu)) {
		$.contextMenu({
		    'selector': '#caGraphButtonClone' + this.cc_id,
		    'className': 'caGraphCloneMenu',
		    'trigger': 'left',
		    'items': menu
		});
	}
};

caWidgetChart.prototype.initButton = function (elt, conf)
{
	var widget = this;
	var button;

	button = $(elt).button({
	    'icons': {
	        'primary': conf['icon']
	    }
	});

	if (conf['action']) {
		button.click(function () {
			widget[conf['action']]();
		});
	}
};

caWidgetChart.prototype.actionPause = function ()
{
	this.cc_panel.pause();
};

caWidgetChart.prototype.actionUnpause = function ()
{
	this.cc_panel.unpause();
};

caWidgetChart.prototype.actionZoomOut = function ()
{
	var zoom = this.getZoom();
	var i;

	for (i = 0; i < this.cc_zoomranges.length; i++) {
		if (this.cc_zoomranges[i] > zoom)
			break;
	}

	if (i == this.cc_zoomranges.length)
		return;

	this.setZoom(this.cc_zoomranges[i]);
	this.update();

	/* We may need to fetch more data. */
	this.panel().tick(true);
};

caWidgetChart.prototype.actionZoomIn = function ()
{
	var zoom = this.getZoom();
	var i;

	for (i = 0; i < this.cc_zoomranges.length; i++) {
		if (this.cc_zoomranges[i] >= zoom)
			break;
	}

	if (i === 0)
		return;

	this.setZoom(this.cc_zoomranges[i - 1]);
	this.update();
};

caWidgetChart.prototype.actionScrollLeft = function ()
{
	var view = this.view();

	this.scroll(- 1 / 3);
	view.pause();
	this.update();

	/* We may need to fetch more data. */
	this.panel().tick(true);
};

caWidgetChart.prototype.actionScrollRight = function ()
{
	var view = this.view();

	if (view.isCurrent())
		return;

	this.scroll(1 / 3);

	if (view.isCurrent())
		view.catchUp();

	this.update();

	/* We may need to fetch more data. */
	this.panel().tick(true);
};

caWidgetChart.prototype.actionScrollCurrent = function ()
{
	var view = this.view();

	view.catchUp();
	this.update();
};

caWidgetChart.prototype.actionDecompose = function (field)
{
	var widget = this;
	var instn = this.instn();
	var decomps = instn.ci_instn['decomposition'].slice(0);

	decomps.push(field['field']);

	instn.ci_conf.instnClone(instn,
	    { 'decomposition': decomps }, function (err, newinstn) {
	        if (err) {
			/* XXX */
			jsFatalError(err);
		}

		widget.cc_oninstn(newinstn);
	    });
};

caWidgetChart.prototype.onPause = function ()
{
	this.initButton(this.cc_buttons['pause'], this.cc_button_unpause);
	this.view().pause();
};

caWidgetChart.prototype.onUnpause = function ()
{
	this.initButton(this.cc_buttons['pause'], this.cc_button_pause);
	this.view().catchUp();
};

caWidgetChart.prototype.colorAlloc = function ()
{
	if (this.cc_hues.length > 0)
		return (this.cc_hues.pop());

	return (caColors[this.cc_nhues++ % caColors.length]);
};

caWidgetChart.prototype.colorFree = function (color)
{
	this.cc_hues.push(color);
};

caWidgetChart.prototype.legendClicked = function (event)
{
	var target = event.target.tagName == 'DIV' ?
	    event.target.parentNode.parentNode :
	    event.target.parentNode;
	var row = this.cc_table.fnGetData(target);
	var component;

	if (row === null)
		return;

	if (!row[2])
		return;

	/*
	 * We always toggle on a left-click.  We always *select* on a
	 * right-click.
	 */
	component = $(row[0]).text();
	if (event.which == jqClickLeft ||
	    !this.cc_selected.hasOwnProperty(component))
		this.toggleSelected($(row[0]).text());
};

caWidgetChart.prototype.toggleSelected = function (component)
{
	var color;

	if (this.cc_selected.hasOwnProperty(component)) {
		color = this.cc_selected[component];
		delete (this.cc_selected[component]);
		this.colorFree(color);
	} else {
		color = this.colorAlloc();
		this.cc_selected[component] = color;
	}

	this.onSelectionChange();
};

caWidgetChart.prototype.onSelectionChange = function ()
{
};

caWidgetChart.prototype.legendMenu = function (target)
{
	var widget = this;
	var menu = {};
	var fields = {};
	var instn, field, components, label;

	/*
	 * All of the menu actions invoke this function to create a new
	 * instrumentaiton based on the current one.  "dopredicate" indicates
	 * whether the new instrumentation should have a predicate on the
	 * selected values, and "decompfield" indicates which *additional* field
	 * to decompose by, if any.
	 */
	var docreate = function (dopredicate, decompfields) {
		var predfield, conds, params, newpred;

		/*
		 * There should be exactly one discrete decomposition if the
		 * user had a value selected.
		 */
		params = {};
		if (dopredicate) {
			predfield = instn.ci_instn['decomposition'].filter(
			    function (f) {
				return (instn.ci_conf.fieldArity(f) ==
				    'discrete');
			    })[0];

			conds = components.map(function (comp) {
				return ({ 'eq': [ predfield, comp ] });
			});

			if (conds.length == 1)
				newpred = conds[0];
			else
				newpred = { 'or': conds };

			if (instn.ci_instn['predicate'] &&
			    !jsIsEmpty(instn.ci_instn['predicate'])) {
				params['predicate'] = { 'and': [
				    newpred,
				    instn.ci_instn['predicate'] ] };
			} else {
				params['predicate'] = newpred;
			}
		}

		params['decomposition'] = decompfields;
		console.log(params);
		instn.ci_conf.instnClone(instn, params,
		    function (err, newinstn) {
			if (err) {
				/* XXX */
				jsFatalError(err);
			}

			widget.cc_oninstn(newinstn);
		    });
	};

	instn = this.instn();
	instn.availDecomps().forEach(function (fieldinfo) {
		menu['decompose.' + fieldinfo['field']] = {
		    'name': 'Decompose ' +
		        (instn.ci_instn['decomposition'].length > 0 ?
			'again ' : '') + 'by ' + fieldinfo['label'],
		    'callback': function () {
		        docreate(false, instn.ci_instn['decomposition'].concat(
			    [ fieldinfo['field'] ]));
		    }
		};
	});

	if (!jsIsEmpty(menu))
		menu['sepl'] = '---------';

	instn.ci_conf.eachField(instn.baseMetric(), function (_, fieldinfo) {
		fields[fieldinfo['field']] = fieldinfo['label'];
	});

	components = Object.keys(this.cc_selected);
	if (components.length > 0) {
		if (components.length == 1)
			label = '"' + components[0] + '"';
		else
			label = 'selected values';

		menu['predicate.raw'] = {
		    'name': 'Predicate on ' + label + ' as a raw statistic',
		    'callback': function () { docreate(true, []); }
		};

		for (field in fields) {
			menu['predicate.' + field] = {
			    'name': 'Predicate on ' + label +
			        ' decomposed by ' + fields[field],
			    'callback': docreate.bind(null, true, [ field ])
			};
		}
	}

	return ({
	    'items': menu
	});
};

caWidgetChart.prototype.args = function ()
{
	return (this.cc_args);
};

caWidgetChart.prototype.id = function ()
{
	return (this.cc_id);
};

caWidgetChart.prototype.panel = function ()
{
	return (this.cc_panel);
};

caWidgetChart.prototype.title = function ()
{
	return (this.cc_args['title']);
};

caWidgetChart.prototype.graph = function ()
{
	return (this.cc_graph);
};

caWidgetChart.prototype.eachSelected = function (func)
{
	var component, i;

	i = 0;
	for (component in this.cc_selected)
		func(component, this.selectedColor(component), i++);
};

caWidgetChart.prototype.isSelected = function (component)
{
	return (this.cc_selected.hasOwnProperty(component));
};

caWidgetChart.prototype.selectedHue = function (component)
{
	return (this.cc_selected[component].hue());
};

caWidgetChart.prototype.selectedColor = function (component)
{
	if (!this.cc_selected.hasOwnProperty(component))
		return (null);

	return (this.cc_selected[component]);
};

caWidgetChart.prototype.tick = function ()
{
	if (this.cc_panel.paused())
		return;

	this.update();
};

caWidgetChart.prototype.tickFormat = function ()
{
	var instn = this.instn();
	var scale = instn.unitScale();
	return (caTickFormat.bind(null, scale));
};

/*
 * Update the legend to display the given rows.  The legend is intended to
 * display a set of components representing a breakdown of the metric in the
 * chart.  For example, for the metric "system calls decomposed by application
 * name", the rows in the legend represent individual application names like
 * "node" or "mysqld".
 *
 * There may be a value associated with each component.  For bar charts, this
 * value typically denotes the average over the whole interval.  For heat maps,
 * when a bucket is selected, the value may denote the number of data points in
 * each bucket.  For heat maps when no bucket is selected, there is no value at
 * all.
 *
 * Each component may be selectable or not, and each selectable component may be
 * selected or not.  Selected components are highlighted.
 *
 * Each row is represented with an array of
 *
 *     [ label, value, selectable, color ]
 *
 * where:
 *
 *     label		The label for the component (e.g., "mysqld")
 *
 *     value		A numeric value (e.g., a number of system calls)
 *
 *     selectable	Boolean indicating whether this component is selectable
 *
 *     color		If a non-empty string, indicates that this component is
 *     			selected and should be highlighted with the given color
 *
 * If the row is selectable, the label should include a <div>.  The mechanism we
 * use to highlight rows doesn't work on labels which are just text nodes.
 *
 * Additional options are available:
 *
 *     trim		If true, values should be present, and only the top rows
 *     			by value should be shown.  Non-selectable rows will
 *     			always be shown (as these usually indicate special or
 *     			summary rows).
 */
caWidgetChart.prototype.updateLegend = function (urows, uopts)
{
	var max = 100;
	var options = uopts || {};
	var rcomponents, rsummary, rows;
	var restsum;

	/*
	 * Partition the rows into those which we may trim (the components) and
	 * those which we won't (the summary rows).
	 */
	rcomponents = [];
	rsummary = [];
	urows.forEach(function (row) {
		if (row[2])
			rcomponents.push(row);
		else
			rsummary.push(row);
	});

	/*
	 * Sort the components by value, then by label.  This is the order we
	 * will display them in the table, and we'll also use this to trim the
	 * list to show only the top values.
	 */
	rcomponents.sort(function (a, b) {
		if (a[1] != b[1])
			return (b[1] - a[1]);

		return (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
	});

	if (options['trim'] &&
	    rcomponents.length + rsummary.length > max) {
		restsum = rcomponents.slice(max - rsummary.length).reduce(
		    function (p, elt) { return (p + elt[1]); }, 0);
		rcomponents = rcomponents.slice(0, max - rsummary.length);
		rsummary.unshift([ '...', restsum, false, '' ]);
	} else if (rcomponents.length > 0) {
		rsummary.unshift([ '&nbsp;', '&nbsp;', false, '' ]);
	}

	rows = rcomponents.concat(rsummary);

	if (this.cc_table)
		this.cc_table.fnDestroy();

	this.cc_table = $(this.cc_components).dataTable({
	    'aaData': rows,
	    'bAutoWidth': false,
	    'bDestroy': true,
	    'bFilter': false,
	    'bInfo': false,
	    'bPaginate': false,
	    'bSort': false,
	    'aoColumns': [ {
	        'sTitle': '',
		'sClass': 'caGraphLegendComponent'
	    }, {
		'sTitle': '',
		'sClass': 'caGraphLegendValue'
	    }, {
		/* selectable (boolean) */
		'bVisible': false
	    }, {
		/* color (string) */
		'bVisible': false
	    } ],
	    'oLanguage': {
		'sEmptyTable': '',
		'sZeroRecords': ''
	    },
	    'fnRowCallback': function (node, data) {
	        if (data[3])
			node.style.backgroundColor = data[3];
	    }
	});
};

caWidgetChart.prototype.updateWarning = function (show)
{
	if (show)
		$(this.cc_warning).show();
	else
		$(this.cc_warning).hide();
};

/*
 * A line graph widget displays a line graph of one or more instrumentations
 * on the same panel.  It supports several options:
 *
 *    showRangeAverage [true]	Display the range average.
 *
 *    allowDetails [true]	Allow users to click individual values to show
 *    				details.
 *
 *    sources			Array of data sources, each being an entry with:
 *
 *		instn		    Instrumentation
 *
 *		value		    Type of value to present, either 'raw' an
 *				    object like "{ pctile: 99 }".  For simple
 *				    instrumentations having no numeric
 *				    decomposition, the default is the raw metric
 *				    value.  For instrumentations supporting a
 *				    heatmap, the default is the median (50th
 *				    percentile).
 *
 *    yMinMax [auto]		The minimum value for the top of the y-axis.
 *    				For example, instrumentations showing a
 *    				percentage may prefer to always show up to at
 *    				least 100%.  The default is automatically
 *    				computed based on the maximum value, which means
 *    				the graph may rescale as values change.
 *
 * The following properties may also be specified at create-time but may be
 * changed dynamically:
 *
 *    duration [60]		The length (in seconds) of the time window whose
 *    				data is displayed.
 *
 *    startTime [auto]		The start time (in seconds past the epoch) of
 *    				the time window whose data is displayed.  The
 *    				default is computed based on the current
 *    				server-side time.
 *
 *    selectedValues		Array of decomposition values that are selected.
 *    				Selected values are highlighted in the graph.
 */
function caWidgetLineGraph(args)
{
	var widget = this;

	caWidgetChart.call(this, args);
	jsCssAppend(this.caElement, 'caGraphLineGraph');

	/* line-graph specific data and controls */
	this.cl_series = [];		/* raw data */
	this.cl_rickshaw = undefined;	/* rickshaw objects */
	this.cl_yaxis = undefined;
	this.cl_xaxis = undefined;
	this.cl_hover = undefined;

	/* window size parameters */
	this.cl_point_duration = 1;
	this.cl_npoints = Math.floor((args['duration'] || 60) /
	    this.cl_point_duration);
	this.cl_duration = this.cl_npoints * this.cl_point_duration;

	/* instrumentation and view objects */
	this.cl_instn = args['sources'][0]['instn'];
	this.cl_view = this.panel().viewAdd({
	    'instnId': this.cl_instn.id(),
	    'resourceName': 'value_raw',
	    'npoints': this.cl_npoints,
	    'duration': this.cl_point_duration
	});

	this.initMenu();

	/*
	 * Add line graph-specific controls to the toolbar.
	 */
	var id = this.id();
	var toolbar = this.caElement.getElementsByClassName(
	    'caGraphToolbar')[0];
	var stylebuttons = $('<span class="caGraphToolbarButtons">' +
	    '<input type="radio" name="style' + id + '" ' +
	    'id="style' + id + 'bar" ' + 'checked="checked"/>' +
	    '<label for="style' + id + 'bar">Bars</label>' +
	    '<input type="radio" name="style' + id + '" ' +
	    'id="style' + id + 'line"/>' +
	    '<label for="style' + id + 'line">Lines</label></span>');
	stylebuttons.buttonset();
	stylebuttons.appendTo(toolbar);
	stylebuttons.click(function () { widget.styleUpdated(); });
	this.cl_barbutton = toolbar.getElementsByTagName('input')[0];

	this.cl_view.cv_onupdate = function () { widget.update(); };
}

jsExtends(caWidgetLineGraph, caWidgetChart);

caWidgetLineGraph.prototype.initGraph = function ()
{
	var args = this.args();

	var graph_opts = {
	    'element': this.graph(),
	    'width': args['pxWidth'],
	    'height': args['pxHeight'],
	    'series': this.cl_series
	};

	if (this.cl_barbutton.checked) {
		graph_opts['renderer'] = 'bar';
	} else {
		graph_opts['renderer'] = 'area';
		graph_opts['stroke'] = true;
	}

	this.cl_rickshaw = new Rickshaw.Graph(graph_opts);

	this.cl_rickshaw.render();

	this.cl_yaxis = new Rickshaw.Graph.Axis.Y({
	    'graph': this.cl_rickshaw,
	    'ticks': 5,
	    'tickFormat': this.tickFormat()
	});

	this.cl_yaxis.render();

	var unit = new Rickshaw.Fixtures.Time().unit('minute');

	this.cl_xaxis = new Rickshaw.Graph.Axis.Time({
	    'graph': this.cl_rickshaw,
	    'timeUnit': unit
	});

	this.cl_xaxis.render();

	this.cl_hover = new Rickshaw.Graph.HoverDetail({
	    'graph': this.cl_rickshaw
	});
};

caWidgetLineGraph.prototype.onSelectionChange = function ()
{
	this.update();
};

caWidgetLineGraph.prototype.styleUpdated = function ()
{
	if (this.cl_barbutton.checked)
		this.cl_rickshaw.setRenderer('bar');
	else
		this.cl_rickshaw.setRenderer('area', { 'stroke': true });

	this.cl_rickshaw.update();
};

caWidgetLineGraph.prototype.getZoom = function ()
{
	return (this.cl_duration);
};

caWidgetLineGraph.prototype.setZoom = function (npoints)
{
	this.cl_npoints = Math.floor(npoints / this.cl_point_duration);
	this.cl_duration = this.cl_npoints * this.cl_point_duration;
	this.cl_view.setNPoints(this.cl_npoints);
};

caWidgetLineGraph.prototype.view = function ()
{
	return (this.cl_view);
};

caWidgetLineGraph.prototype.instn = function ()
{
	return (this.cl_instn);
};

caWidgetLineGraph.prototype.scroll = function (amt)
{
	return (this.cl_view.scroll(Math.floor(amt * this.cl_npoints)));
};

caWidgetLineGraph.prototype.update = function ()
{
	var widget = this;
	var panel, value;
	var rawpoints, series;

	panel = this.panel();
	value = panel.data(this.cl_view);

	if (value === null)
		return;

	rawpoints = value['points'];
	series = [];

	if (this.cl_instn.ci_instn['decomposition'].length === 0) {
		series.push({
		    'name': this.cl_instn.unit(),
		    'color': caDefaultBarColor,
		    'data': rawpoints
		});
	} else {
		this.eachSelected(function (component, color) {
			series.push({
			    'name': component,
			    'color': color,
			    'data': new Array(rawpoints.length)
			});
		});

		var sum, valsbycomp, key, i;

		series.push({
		    'name': series.length > 0 ? 'Others' : 'Total',
		    'color': caDefaultBarColor,
		    'data': new Array(rawpoints.length)
		});

		for (i = 0; i < rawpoints.length; i++) {
			sum = 0;
			valsbycomp = {};

			for (key in rawpoints[i].y) {
				if (this.isSelected(key))
					valsbycomp[key] = rawpoints[i].y[key];
				else
					sum += rawpoints[i].y[key];
			}

			series[series.length - 1]['data'][i] = {
			    'x': rawpoints[i].x,
			    'y': sum
			};

			this.eachSelected(function (component, _, j) {
				series[j]['data'][i] = {
				    'x': rawpoints[i].x,
				    'y': valsbycomp[component] || 0
				};
			});
		}
	}

	/*
	 * We replace all of the graph's series each time we get here to avoid
	 * dealing with complexities around incremental changes in the face of
	 * scrolling, zooming, pausing, and so on.  But the only obvious
	 * interface for modifying a Rickshaw graph's data is to update the
	 * contents of the array used when the graph was created.  As a result,
	 * we're forced to remove all elements of that array, then add all the
	 * new elements.  XXX Is there a better way?
	 */
	this.cl_series.splice(0, this.cl_series.length);
	this.cl_series.push.apply(this.cl_series, series);

	if (this.cl_value === undefined) {
		this.initGraph();
	} else {
		this.cl_rickshaw.update();
	}

	this.cl_value = value;

	var tabledata = [];
	for (key in value['componentAverages']) {
		var ccolor = widget.selectedColor(key);
		tabledata.push([
		    '<div>' + key + '</div>',
		    Math.round(value['componentAverages'][key]),
		    true,
		    ccolor === null ? '' : ccolor.css()
		]);
	}

	tabledata.push([
	    'Range average', Math.round(value['rangeAverage']), false, '' ]);
	this.updateLegend(tabledata, { 'trim': true });
	this.updateWarning(!value['isComplete']);
};


/*
 * Displays a heat map for a single instrumentation.  This widget supports
 * several options:
 *
 *    showYAxisSlider [true]	Show a control to manipulate the y-axis range.
 *
 *    showXAxisLabel [true]	Show label for the x-axis
 *
 *    showYAxisLabel [true]	Show label for the y-axis
 *
 *    allowDetails [true]	Allow users to click individual values to show
 *    				details.
 *
 *    source			A single instrumentation object
 *
 *    yMinMax [auto]		The minimum value for the top of the y-axis.
 *    				See description under caWidgetLineGraph.
 *
 *    yMaxMax [auto]		The maximum value for the top of the y-axis.
 *    				If this is unspecified, the widget is
 *    				auto-scaled to be larger than the containing
 *    				data, but this can be used to set the height
 *    				precisely.
 *
 *    duration [60]		The length (in seconds) of the time window whose
 *    				data is displayed.
 *
 *    startTime [auto]		The start time (in seconds past the epoch) of
 *    				the time window whose data is displayed.  The
 *    				default is computed based on the current
 *    				server-side time.
 *
 *    isolationMode		One of 'highlight', 'isolate', or 'exclude'.
 *    ['highlight']		Indicates whether the selected values should be
 *    				shown highlighted on top of everything else
 *    				('highlight'), highlighted on a blank canvas
 *    				('isolate'), or excluded from the underlying
 *    				dataset ('exclude').
 *
 *    selectedValues		Array of decomposition values that are currently
 *    				selected.  Selected values may be highlighted,
 *    				isolated, or excluded, based on the setting of
 *    				isolationMode.
 *
 *    coloringMode ['rank']	Controls whether bucket color saturation is
 *    				determined by the rank of the bucket in the
 *    				overall graph ('rank') or the absolute value
 *    				('linear').
 *
 *    bucketHeight		Controls the height of each individual heat map
 *    				bucket.
 */
function caWidgetHeatMap(uargs)
{
	var args = Object.create(uargs);
	args['sources'] = [ { 'instn': uargs['source'] } ];

	caWidgetChart.call(this, args);
	jsCssAppend(this.caElement, 'caGraphHeatMap');

	/* we use an empty rickshaw graph for tick marks and hover info */
	this.cm_series = [ { 'data': [] } ];
	this.cm_rickshaw = undefined;
	this.cm_xaxis = undefined;
	this.cm_yaxis = undefined;
	this.cm_hover = undefined;

	/* heatmap-specific data and controls */
	this.cm_overlay = this.graph().appendChild(
	    jsCreateElement('div', 'caOverlaid'));
	$(this.cm_overlay).click(this.onHeatMapClick.bind(this));
	this.cm_img = this.cm_overlay.appendChild(jsCreateElement('img'));
	this.cm_legend_default = undefined;
	this.cm_legend_override = false;
	this.cm_details = undefined;
	this.cm_slider_width = 50;
	this.cm_scale_ymin = 0;
	this.cm_scale_ymax = 10000000000;
	this.cm_slider = this.graph().appendChild(
	    jsCreateElement('div', 'caSlider'));
	this.cm_ymax = undefined;	/* ymax of last heat map value */

	/* window size parameters */
	this.cm_point_duration = args['duration'] || 60;
	this.cm_npoints = 1;
	this.cm_duration = this.cm_npoints * this.cm_point_duration;

	/* instrumentation and view objects */
	this.cm_instn = args['source'];
	this.cm_params = {
	    'nbuckets': 25,
	    'height': args['pxHeight'],
	    'width': args['pxWidth'],
	    'ymin': this.cm_scale_ymin
	};
	this.cm_view = this.panel().viewAdd({
	    'instnId': this.cm_instn.id(),
	    'resourceName': 'value_heatmap',
	    'resourceParams': this.cm_params,
	    'npoints': this.cm_npoints,
	    'duration': this.cm_point_duration
	});

	this.cm_view.cv_onupdate = function () { widget.update(); };

	this.initMenu();

	/*
	 * Add heat map-specific controls to the toolbar.
	 */
	var widget = this;
	var id = this.id();
	var toolbar = this.caElement.getElementsByClassName(
	    'caGraphToolbar')[0];
	var colorbuttons = $([
	    '<span class="caGraphToolbarButtons">',
	    '<input type="radio" name="color' + id + '" ',
	    '       id="color' + id + 'rank" checked="checked"/>',
	    '<label for="color' + id + 'rank">Color by rank</label>',
	    '<input type="radio" name="color' + id + '" ',
	    '       id="color' + id + 'linear"/>',
	    '<label for="color' + id + 'linear">Color linearly</label>',
	    '</span>'
	].join(''));
	colorbuttons.buttonset();
	colorbuttons.appendTo(toolbar);
	colorbuttons.click(function () { widget.coloringUpdated(); });
	this.cm_rankbutton = toolbar.getElementsByTagName('input')[0];

	var valuebuttons = $([
	    '<span class="caGraphToolbarButtons">',
	    '<input type="radio" name="values' + id + '" ',
	    '       id="values' + id + 'count" checked="checked"/>',
	    '<label for="values' + id + 'count">Values by count</label>',
	    '<input type="radio" name="values' + id + '" ',
	    '       id="values' + id + 'weight"/>',
	    '<label for="values' + id + 'weight">Values by weight</label>',
	    '</span>'
	].join(''));
	valuebuttons.buttonset();
	valuebuttons.appendTo(toolbar);
	valuebuttons.click(function () { widget.valueMethodUpdated(); });
	this.cm_bycountbutton = toolbar.getElementsByTagName('input')[2];

	var isolatecontrol = $([
	    '<select id="isolateMode' + id + '" name="isolateMode' + id + '">',
	    '<option value="none">Show all, highlight selected</option>',
	    '<option value="isolate">Isolate selected</option>',
	    '<option value="exclude">Exclude selected</option>',
	    '<option value="decompose_all">Highlight all</option>',
	    '</select>'
	].join(''));
	isolatecontrol.appendTo(toolbar);
	this.cm_isolatemode = toolbar.getElementsByTagName('select')[0];
	$(this.cm_isolatemode).change(function () { widget.isolateUpdated(); });
}

jsExtends(caWidgetHeatMap, caWidgetChart);

caWidgetHeatMap.prototype.initGraph = function ()
{
	var args = this.args();
	var elt = this.cm_overlay.appendChild(jsCreateElement('div'));
	this.cm_rickshaw = new Rickshaw.Graph({
	    'element': elt,
	    'width': args['pxWidth'],
	    'height': args['pxHeight'],
	    'series': this.cm_series
	});
	this.cm_rickshaw.render();
	this.cm_yaxis = new Rickshaw.Graph.Axis.Y({
	    'graph': this.cm_rickshaw,
	    'ticks': 5,
	    'tickFormat': this.tickFormat()
	});
	this.cm_yaxis.render();
	var unit = new Rickshaw.Fixtures.Time().unit('minute');
	this.cm_xaxis = new Rickshaw.Graph.Axis.Time({
	    'graph': this.cm_rickshaw,
	    'timeUnit': unit
	});
	this.cm_xaxis.render();
	this.cm_hover = new Rickshaw.Graph.HoverDetail({
	    'graph': this.cm_rickshaw
	});
};

caWidgetHeatMap.prototype.coloringUpdated = function ()
{
	if (this.cm_rankbutton.checked)
		this.cm_params['coloring'] = 'rank';
	else
		this.cm_params['coloring'] = 'linear';

	this.panel().tick();
};

caWidgetHeatMap.prototype.valueMethodUpdated = function ()
{
	if (this.cm_bycountbutton.checked)
		this.cm_params['weights'] = 'count';
	else
		this.cm_params['weights'] = 'weight';

	this.panel().tick();
};

caWidgetHeatMap.prototype.isolateUpdated = function ()
{
	var i = this.cm_isolatemode.selectedIndex;
	var option = this.cm_isolatemode.options[i];

	delete (this.cm_params['isolate']);
	delete (this.cm_params['exclude']);
	delete (this.cm_params['decompose_all']);

	switch (option.value) {
	case 'isolate':
		this.cm_params['isolate'] = true;
		break;

	case 'exclude':
		this.cm_params['exclude'] = true;
		break;

	case 'decompose_all':
		this.cm_params['decompose_all'] = true;
		break;
	}

	this.onSelectionChange();
};

caWidgetHeatMap.prototype.scaleUpdated = function (ymin, ymax)
{
	if (ymax < ymin) {
		this.scaleUpdated(ymax, ymin);
		return;
	}

	/*
	 * Work around INTRO-583.
	 */
	if (ymax == ymin)
		ymax = ymin + 1;

	this.cm_params['ymin'] = ymin;

	if (ymax == this.cm_scale_ymax)
		delete (this.cm_params['ymax']);
	else
		this.cm_params['ymax'] = ymax;
};

caWidgetHeatMap.prototype.onSelectionChange = function ()
{
	var widget = this;
	var hues = [];
	var selected = [];

	if (!this.cm_params['decompose_all']) {
		if (!this.cm_params['isolate'])
			hues.push(caDefaultHue);

		this.eachSelected(function (name) {
			hues.push(widget.selectedHue(name));
			selected.push(name);
		});
	}

	this.cm_params['hues'] = hues;
	this.cm_params['selected'] = selected;

	this.panel().tick();
};

caWidgetHeatMap.prototype.onHeatMapClick = function (event)
{
	var widget = this;
	var offset = $(event.target).offset();
	var x = event.pageX - offset.left;
	var y = event.pageY - offset.top;
	var params = Object.create(this.cm_params);

	params['x'] = x;
	params['y'] = y;
	params['ymax'] = this.cm_params['ymax'] || this.cm_ymax;

	this.panel().cp_backend.instnValue(this.cm_instn,
	    'details_heatmap', params,
	    this.cm_view.cv_window_start - 1, this.cm_view.cv_duration,
	    this.cm_npoints,
	    function (err, details) {
		if (err) {
			/* XXX */
			jsFatalError(err);
		}

		widget.showHeatmapDetails(details[0]);
	    });
};

caWidgetHeatMap.prototype.showHeatmapDetails = function (details)
{
	var widget = this;
	var tabledata = [];
	var keys = Object.keys(details['present']);
	var total = 0;

	this.cm_details = details;

	keys.forEach(function (key) {
		if (details['present'][key] === 0)
			return;

		var color = widget.selectedColor(key);
		tabledata.push([ '<div>' + key + '</div>',
		    details['present'][key], true,
		    color === null ? '' : color.css() ]);
		total += details['present'][key];
	});

	if (tabledata.length === 0) {
		this.cm_legend_override = false;
		tabledata = this.cm_legend_default;
	} else {
		this.cm_legend_override = true;
		tabledata.push([ 'Total', total, false, '' ]);
	}

	this.updateLegend(tabledata, { 'trim': this.cm_legend_override });
};

caWidgetHeatMap.prototype.getZoom = function ()
{
	return (this.cm_duration);
};

caWidgetHeatMap.prototype.setZoom = function (duration)
{
	this.cm_point_duration = Math.floor(duration);
	this.cm_duration = this.cm_npoints * this.cm_point_duration;
	this.cm_view.setDuration(this.cm_point_duration);
};

caWidgetHeatMap.prototype.view = function ()
{
	return (this.cm_view);
};

caWidgetHeatMap.prototype.scroll = function (amt)
{
	this.cm_view.scroll(Math.floor(amt * this.cm_point_duration));
};

caWidgetHeatMap.prototype.instn = function ()
{
	return (this.cm_instn);
};

caWidgetHeatMap.prototype.update = function ()
{
	var panel, value, point;

	panel = this.panel();
	value = panel.data(this.cm_view);
	if (value === null)
		return;

	point = value['points'][0];
	if (!point['y'])
		return;

	this.cm_img.src = 'data:image/png;base64,' + point['y']['image'];
	this.updateWarning(!value['isComplete']);

	var start = point['x'];
	this.cm_series[0]['data'] = new Array(this.cm_duration);
	for (var i = 0; i < this.cm_duration; i++) {
		this.cm_series[0]['data'][i] = {
		    'x': start + i * this.cm_instn.granularity(),
		    'y': 0
		};
	}

	if (this.cm_rickshaw === undefined)
		this.initGraph();

	this.cm_ymax = point['y']['ymax'];
	this.cm_rickshaw.configure({ 'max': this.cm_ymax });
	this.cm_rickshaw.update();

	if (this.cm_params['ymax'] === undefined &&
	    this.cm_ymax != this.cm_scale_ymax)
		this.cm_scale_ymax = this.cm_ymax;

	$(this.cm_slider).slider({
	    'orientation': 'vertical',
	    'range': true,
	    'min': this.cm_scale_ymin,
	    'max': this.cm_scale_ymax,
	    'step': 1,
	    'values': [
	        this.cm_params['ymin'],
	        this.cm_params['ymax'] || this.cm_scale_ymax
	    ],
	    'stop': function (_, ui) {
		widget.scaleUpdated(ui.values[0], ui.values[1]);
	    }
	});

	var widget = this;
	this.cm_legend_default = (point['y']['present'] || []).sort().map(
	    function (p) {
		var color = widget.selectedColor(p);
		return ([
		    '<div>' + p + '</div>',
		    '',
		    true,
		    color === null ? '' : color.css()
		]);
	    });

	if (!this.cm_legend_override) {
		this.updateLegend(this.cm_legend_default, { 'trim': false });
	} else {
		this.showHeatmapDetails(this.cm_details);
	}
};


function caWidgetGenericGraph(args)
{
	var div, subdiv, subsub;

	div = jsCreateElement('div', 'caGraph');

	subdiv = jsCreateElement('div', 'caGraphHeader');
	div.appendChild(subdiv);

	subsub = jsCreateElement('div', 'caGraphHeaderTitle');
	subsub.appendChild(jsCreateText(args['title']));
	subdiv.appendChild(subsub);

	subsub = jsCreateElement('div', 'caGraphButtonClose');
	subdiv.appendChild(subsub);

	$(subsub).button({
	    'icons': {
	        'primary': 'ui-icon-closethick'
	    }
	}).click(function () {
		if (args['onremove'])
			args['onremove']();
	});

	subsub = jsCreateElement('div', 'caGraphWarning ui-icon ui-icon-alert');
	subsub.title = 'Some data for the selected time interval is not ' +
	    'available.';
	subdiv.appendChild(subsub);

	subdiv = jsCreateElement('div', 'caGraphToolbar');
	div.appendChild(subdiv);

	subdiv = jsCreateElement('div', 'caGraphBody');
	div.appendChild(subdiv);

	subdiv.appendChild(jsCreateElement('div', 'caGraphData'));
	subdiv.appendChild(jsCreateElement('div', 'caGraphLegend'));

	return (div);
}


var caOperatorToEnglish = {
    'lt': '<',
    'le': '<=',
    'ge': '>=',
    'gt': '>',
    'ne': '!=',
    'eq': '=='
};

function caPredicateToEnglish(conf, pred, parenthesize)
{
	var k, operator, pieces, rv;

	for (k in pred)
		operator = k;

	if (operator == 'and' || operator == 'or') {
		pieces = pred[operator].map(function (piece) {
		    return (caPredicateToEnglish(conf, piece, true));
		});
		rv = pieces.join(' ' + operator + ' ');
		if (parenthesize)
			rv = '(' + rv + ')';
	} else {
		rv = jsSprintf('%s %s %s',
		    conf.fieldLabel(pred[operator][0]),
		    caOperatorToEnglish[operator],
		    pred[operator][1]);
	}

	return (rv);
}

function caTickFormat(scale, y)
{
	if (scale && scale['base'] == 2) {
		if (y < 1024)
			return (y + scale['abbr']);
		if (y < 1024 * 1024)
			return (Math.floor(y / 1024) + 'K' + scale['abbr']);
		if (y < 1024 * 1024 * 1024)
			return (Math.floor(y / 1024 / 1024) +
			    'M' + scale['abbr']);
		return (Math.floor(y / 1024 / 1024 / 1024) + 'G' +
		    scale['abbr']);
	}

	if (scale && scale['power'] == -9) {
		/* something measured in nanoX (e.g., nanoseconds) */
		if (y < 1000)
			return (y + 'n' + scale['abbr']);
		if (y < 1000000)
			return (Math.floor(y / 1000) + 'u' + scale['abbr']);
		if (y < 1000000000)
			return (Math.floor(y / 1000000) + 'm' + scale['abbr']);
		return (Math.floor(y / 1000000000) + scale['abbr']);
	}

	return (y);
}
