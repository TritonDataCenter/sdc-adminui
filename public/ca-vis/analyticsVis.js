/*jsl:import caRawDataStore.js*/
/*jsl:import create.js*/
/*jsl:import metrics.js*/

function Visualization() {}
Visualization.gId = 0;
Visualization.visualizations = [];
Visualization.timer = undefined;
Visualization.renderFreq = 1000;

Visualization.add = function(vis) {
  if (!vis.render) vis.initRender();
  Visualization.visualizations.push(vis);
  if (Visualization.visualizations.length == 1) {
    Visualization.start();
  }
};
Visualization.renderTick = function() {
  // Visualization.timer = setTimeout(Visualization.renderTick, Visualization.renderFreq);
  Visualization.visualizations.forEach(function(vis) {
    vis.render();
  });
};
Visualization.start = function() {
  if (!Visualization.timer) {
    Visualization.timer = setInterval(Visualization.renderTick, Visualization.renderFreq);
  }
};
Visualization.stop = function() {
  if (Visualization.timer) {
    clearInterval(Visualization.timer);
    delete Visualization.timer;
  }
};
Visualization.remove = function(vis) {
  Visualization.visualizations = Visualization.visualizations.filter(function(v) {
    return vis.g_id != v.g_id;
  });
};

Visualization.prototype.init = function(inst, updater, newInstCb) {
  this.g_id = Visualization.gId++;
  this.inst = inst;
  this.updater = updater;
  this.newInstCb = newInstCb;

  this.paused = false;
  this.pauseTime = 0;
  this.offset = 0;
  this.predInputCount = 0;
  // TODO: nee
  this.defaults = {
    width : 624,
    height : 281
  };

  this.inst.metric = Metrics.getByModuleAndStat(this.inst.module, this.inst.stat);
  this.inst.module = Modules.getByName(inst.module);

  for (var i = 0; i < this.inst.decomposition.length; i++) {
    this.inst.decomposition[i] = Fields.getByName(inst.decomposition[i]);
  }


  this.initParams();
	this.el = this.initDom();

  this.initUpdate();
};

Visualization.prototype.destroy = function() {
  var vis = this;

  // Pro-activaly Delete This makes the interface feel more snappy.cd
  Visualization.remove(vis);
  vis.updater.remove(vis.inst);
  $(vis.el).remove();

  // how to get the uri of the inst:
  var cleanup = function(data,textStatus,request) {};

  var createURI = visConfig.uriGenerator || function(inst) { return visConfig.proxyPath + inst.id; };

  // vis.pauseInternal();
  vis.pause();
  // attempt to delete the instrumentation
  $.ajax({
    url : createURI(vis.inst),
    type : "DELETE",
    dataType : 'json',
    traditional : true,
    success : cleanup,
    headers : visConfig.requestHeaders,
    error : function(jqXHR, textStatus, errorThrown) {
      // alert?
      console.log(textStatus);
    }
  });
};

Visualization.prototype.initDom = function () {
	var vis = this;
	var div;

	div = document.createElement('div');
	div.className = 'gGraphContainer';
	div.id = 'graphID_' + vis.g_id;

  this.headbar = this.createHeadbar();
  div.appendChild(this.headbar);

  div.appendChild(this.createPredicatebar());
  this.gEltToolbar = document.createElement('DIV');
  this.gEltToolbar.className = "ToolbarContainer";

  var lc = document.createElement('DIV');
  lc.className = "ledgendControl";
  lc.innerHTML = "<span class='lc_name'>-</span><span lc_value></span>";
  this.gEltToolbar.appendChild(lc);
  this.gEltToolbar.appendChild(this.createToolbar());

  div.appendChild(this.gEltToolbar);

  this.gEltLegend = this.createLegend();
  this.gEltGraph = this.createGraph();
  this.gEltContent = document.createElement('div');
  this.gEltContent.className = 'contentWindow';
  this.gEltContent.appendChild(this.gEltLegend);
  this.gEltContent.appendChild(this.gEltGraph);

  // Scale. Should always be there.
  this.gEltScaleText = document.createElement('span');
	this.gEltScaleText.className = 'gRangeText';
	this.gEltScaleText.innerHTML = this.rangeText();


  div.appendChild(this.gEltContent);
  div.appendChild(this.footerToolbar(this.gEltScaleText));
  div.appendChild(this.createDistribution());

	$(vis.g_elt_graph).click(function (event) { vis.heatmapRowClicked(event); });

  // attach vis-specific controls.
  this.initControls();

	return div;
};

Visualization.prototype.createHeadbar = function (){
	var vis = this;

  // Title bar
  var head = document.createElement('div');
	head.className = 'gGraphHeader';
	var titleSize = '13px';

	var title = this.constructTitle();
  if (title.length >= 110) {
    titleSize = '11px';
  }

  head.innerHTML = "<p style='font-size:"+titleSize+"'>"+title+"</p>";

  // delete stat.
	head.appendChild(this.createButton({
		text: false,
		label: 'delete',
		className: 'ui-delete',
		icons: { primary: '' }
	}, function () { vis.destroy(); }));

	return head;
};

// REVIEW: maybe an Instrumentation object would be a better home for this.
// FIXME use new inst objects
Visualization.prototype.constructTitle = function constructTitle() {

  var title = this.inst.metric.module.label + ": " + this.inst.metric.label;

  if (this.inst.decomposition.length) {
    title += " decomposed by " + this.inst.decomposition.map(function(d) {
      return d.label;
    }).join(' and ');
  }

  // Predicate?
  if (Object.keys(this.inst.predicate).length) {
    title += " predicated by " + this.constructPredName();
  }
  return title;
};

Visualization.prototype.createPredicatebar = function() {
  var container = document.createElement('div');
  container.className = "gPredicateBar";
  var ul = document.createElement('UL');

  // Add existing Predicates
  // for (p in this.inst.predicate) {
  //   ul.appendChild(this.addPredicateRow(p, this.inst.predicate[p]));
  // }

  // Add new create
  ul.appendChild(this.createPredicateRow("additional"));
  container.appendChild(ul);
  return container;
};
// var predInputCount = 0;
var predIndex = 0;

Visualization.prototype.addPredicateRow = function(type, details) {
  var vis = this;
  var li = document.createElement('LI');

  li.innerHTML = details[0] + ' ' + type + ' '+ details[1];
  li.style.paddingLeft = '7px';

  var in2 = document.createElement('INPUT');
  in2.type = "submit";
  in2.name = "predInputSubmitRemove" + predIndex;
  in2.value = "Remove";

  $(in2).bind('click',[predIndex],function(e){
    var ind = 0;
    for (var i in vis.inst.predicate) {
      if (ind == predIndex) {
        delete vis.inst.predicate[i];
      }
      ind++;
    }
    vis.clone({});
  });

  li.appendChild(in2);

  return li;
};


Visualization.prototype.createPredicateRow = function(type) {
  var vis = this;

  var li = document.createElement('LI');

  var selField = document.createElement('SELECT');
  selField.id = "selPredField" + this.predInputCount;
  for (var i = 0;i < this.inst.metric.fields.length;i++) {
    selField.appendChild(this.inst.metric.fields[i].toOption());
  }

  var logicContainer = document.createElement('SPAN');
  logicContainer.className = 'logicContainer';


    $(selField).bind('change',[this.predInputCount],function(event) {
    logicContainer.innerHTML = "";
    var selectedFieldName = $(selField).val();
    var field = Fields.getByName(selectedFieldName);

    var h = field.type.operatorsToOptions('selOperatorPredField' + event.data[0]);
    logicContainer.appendChild(h);

  });
  $(selField).change();

  li.appendChild(selField);
  li.appendChild(logicContainer);

  var in1 = document.createElement('INPUT');
  in1.type = "text";

  in1.name = "predInput" + this.predInputCount;
  in1.id = "predInput" + this.predInputCount;
  li.appendChild(in1);

  var complex = document.createElement('INPUT');
  complex.type = "submit";
  complex.name = "complex" + this.predInputCount;
  complex.className = 'secondary_action';
  complex.value = "New Clause";
  $(complex).bind('click',[this.predInputCount], function(e) {
    $("#and" + e.data[0], $('#graphID_' + vis.g_id)).show();
    $("#or" + e.data[0], $('#graphID_' + vis.g_id)).show();
    $("#submit" + e.data[0], $('#graphID_' + vis.g_id)).hide();
    $(e.target).hide();
    $(inAnd).trigger('click',[this.predInputCount]);

  });
  li.appendChild(complex);

  var inAnd = document.createElement('INPUT');
  inAnd.id = 'and' + this.predInputCount;
  inAnd.type = "submit";
  inAnd.style.display = 'none';
  inAnd.name = "And" + this.predInputCount;
  inAnd.className = 'secondary_action';
  inAnd.value = "and";
  $(inAnd).bind('click',[this.predInputCount], handleAndOR.bind(vis));
  li.appendChild(inAnd);

  var inOR = document.createElement('INPUT');
  inOR.id = 'or' + this.predInputCount;
  inOR.type = "submit";
  inOR.style.display = 'none';
  inOR.name = "OR" + this.predInputCount;
  inOR.className = 'secondary_action';
  inOR.value = "or";
  $(inOR).bind('click',[this.predInputCount], handleAndOR.bind(vis));
  li.appendChild(inOR);

  var hid = document.createElement('INPUT');
  hid.id = 'predComplexType' + this.predInputCount;
  hid.type = "hidden";
  li.appendChild(hid);

  if (type == "additional") {
    var in2 = document.createElement('INPUT');
    in2.id = "submit" + this.predInputCount;
    in2.type = "submit";
    in2.name = "predInputSubmit" + this.predInputCount;
    in2.className = 'button primary_action';
    in2.value = "Create Predicate";
    $(in2).bind('click',[this.predInputCount],handleNewPred.bind(vis));
    li.appendChild(in2);
  }

  this.predInputCount++;
  return li;
};
var handleAndOR = function(event) {
  var count = event.data[0];
  var vis = this;

  var alreadySet = ($('#predComplexType' + count, $('#graphID_' + vis.g_id)).val().length != 0) ? true : false;
  $('#or' + count, $('#graphID_' + vis.g_id)).removeClass('button primary_action secondary_action');
  $('#and' + count, $('#graphID_' + vis.g_id)).removeClass('button primary_action secondary_action');

  $(event.target).addClass('button primary_action');
  $('#predComplexType' + count, $('#graphID_' + vis.g_id)).val($(event.target).val());

  if (!alreadySet) {
    var ul = $(".gPredicateBar UL", $('#graphID_' + vis.g_id)).get(0);
    ul.appendChild(this.createPredicateRow("additional"));
  }
};

var handleNewPred = function(event) {
  var count = event.data[0];

  var vis = this;
  var predInput = $('#predInput' + count, $('#graphID_' + vis.g_id)).val();
  var predicate, trailingPredicate, pa = false, complexTypeCount = 0, simplePredicate;
  var operator;

  if (predInput === "") {
    alert("You need to have a valid predicate filter value.");
  } else {
    // Single or complex predicate?
    if (count === 0) {
      predicate = $('#selPredField'+ count, $('#graphID_' + vis.g_id)).val();
      operator = $('#selOperatorPredField' + count, $('#graphID_' + vis.g_id)).val();
      simplePredicate = vis.predicateConstruct(predicate, predInput, operator);

    } else {
      var complexPredicate = {};
      var i = this.predInputCount - 1;
      trailingPredicate = null;
      while(i >= 0) {
        predicate = $('#selPredField'+ i, $('#graphID_' + vis.g_id)).val();
        operator = $('#selOperatorPredField' + i, $('#graphID_' + vis.g_id)).val();
        predInput = $('#predInput' + i, $('#graphID_' + vis.g_id)).val();
        var complexType = $('#predComplexType' + i, $('#graphID_' + vis.g_id)).val();

        if (complexType != "") {

          if (complexTypeCount != 0) {
            var prev = complexPredicate;
            complexPredicate = {};
            complexPredicate[complexType] = [];

            predicate = vis.predicateConstruct(predicate, predInput, operator);
            complexPredicate[complexType].push(predicate);
            complexPredicate[complexType].push(prev);

          } else {
            complexPredicate[complexType] = [];
            predicate = vis.predicateConstruct(predicate, predInput, operator);
            complexPredicate[complexType].push(predicate);
            if (pa === false) {
              complexPredicate[complexType].push(trailingPredicate);
              pa = true;
            }
          }

          complexTypeCount++;
        } else {
          trailingPredicate = vis.predicateConstruct(predicate, predInput, operator);
        }
        i--;
      }
    }

    var params = {};
    params['predicate'] = JSON.stringify((simplePredicate) ? simplePredicate : complexPredicate);
    vis.clone(params);
  }
};


// Takes field, constant, key and looks up field name, and arity type
Visualization.prototype.predicateConstruct = function(field, constant, key) {
  var newPredicate = {};
  var f = Fields.getByName(field);

  /* Allow the user to use an arbitrary radix using a prefix like "0x" */
  /*jsl:ignore*/
  constant = (f.type.arity == "numeric") ? parseInt(constant) : constant;
  /*jsl:end*/
  newPredicate[key] = [field,constant];
  return newPredicate;
};

Visualization.prototype.predicateToJSON = function(field, constant, key) {
  var newPredicate = {}, pred = {};
  var f = Fields.getByName(field);

  var predKeys = Object.keys(predKeyMap);
  var existingPredicate = false;

  for (key in this.inst.predicate) {
    if ($.inArray(key,predKeys) >= 0) {
      existingPredicate = true;
    }
  }

  /* Allow the user to use an arbitrary radix using a prefix like "0x" */
  /*jsl:ignore*/
  constant = (f.type.arity == "numeric") ? parseInt(constant) : constant;
  /*jsl:end*/
  newPredicate[key] = [field,constant];

  if (existingPredicate) {
    // if (this.inst.predicate['and']) {
    //   pred = this.inst.predicate['and'];
    //   pred.push(newPredicate)
    // } else {
      pred = {};
      pred['and'] = [];
      pred['and'].push(this.inst.predicate);
      pred['and'].push(newPredicate);
    // }
  }

  return JSON.stringify((existingPredicate) ? pred : newPredicate);
};

Visualization.prototype.addPredicateAndClone = function(field, constant, key) {
  var vis = this;


  var params = {};
  var predicate = vis.predicateToJSON(field, constant, key);
  params['predicate'] = predicate;
  vis.clone(params);
};

Visualization.prototype.clone = function(params) {
  var vis = this;
  var createURI = visConfig.uriGenerator || function(inst) { return visConfig.proxyPath + inst.id; };

  var target = $(visConfig.visualizationContainerSelector);
  target.prepend(addThrober());
  $.ajax({
    url : createURI(vis.inst) + "/clone",
    type : 'POST',
    dataType : "json",
    data: params,
    headers : visConfig.requestHeaders,
    success : function(d) {
      vis.newInstCb(d);
    }
  });
};

Visualization.prototype.createToolbar = function () {
	var vis = this;
	var subdiv;

	subdiv = document.createElement('div');
	subdiv.className = 'gToolbar';

	subdiv.appendChild(this.createButton({
		text: false,
		className:'ui-seek-prev',
		icons: { primary: 'ui-icon-seek-prev' }
	}, function () { vis.scrollBack(); }));

  this.g_pausebutton = this.createToggleButton('paused', [{
    onclick: function () {
      vis.pause();
    },
    value: true,
    label:'pause',
    options: {
      text: false,
      className:'ui-pause',
      icons: { primary: 'ui-icon-pause' }
    }
  }, {
    onclick: function () {
      vis.resume();
    },
    label: 'resume',
    value: false,
    options: {
      text: false,
      className:'ui-resume',
      icons: { primary: 'ui-icon-play' }
    }
  }]);

	subdiv.appendChild(this.g_pausebutton);

	subdiv.appendChild(this.createButton({
		text: false,
		className:'ui-seek-next',
		icons: { primary: 'ui-icon-seek-next' }
	}, function () { vis.scrollForward(); }));

	subdiv.appendChild(this.createButton({
		text: false,
		className:'ui-zoom-out',
		icons: { primary: 'ui-icon-zoomout' }
	}, function () { vis.zoomOut(); }));

	subdiv.appendChild(this.createButton({
		text: false,
		className:'ui-zoom-in',
		icons: { primary: 'ui-icon-zoomin' }
	}, function () { vis.zoomIn(); }));


  // if this is scalar or discrete decomp, we're done.
  if (this.inst['value-arity'] != 'numeric-decomposition') {
    subdiv.className += ' gDiscrete';
  } else {
	  subdiv.className += ' gNumeric';
  }
  return subdiv;
};

Visualization.prototype.createDistribution = function() {
	var vis = this,
	container, head, body;

  container = document.createElement('div');
  container.className = 'gGraphDist';

  // Title bar
  head = document.createElement('div');
	head.className = 'gGraphHeader';
  head.innerHTML = "<p><b>Details:</b> -- </p>";

	head.appendChild(this.createButton({
		text: false,
		label: 'delete',
		className: 'ui-delete',
		icons: { primary: '' }
	}, function () { $('.gGraphDist', $('#graphID_' + vis.g_id)).slideUp('slow'); }));
  container.appendChild(head);

  body = document.createElement('div');
  body.className = 'distBody';

  container.appendChild(body);
	return container;
};

/*
 * Creates a button that toggles the given "field", whose state is stored in a
 * member of this graph called 'g_$field'.  Each of exactly two choices must
 * specify a label and a value.
 */
Visualization.prototype.createToggleButton = function(field, choices) {
	var vis = this;
	var button = document.createElement('button');
	var label = choices[0].label;

	if (label)
		button.appendChild(document.createTextNode(label));

	if (!choices[0].options)
		choices[0].options = { label: choices[0].label };

  if (!choices[1].options)
    choices[1].options = { label: choices[1].label };

	if (choices[0].options.className)
	  $(button).addClass(choices[0].options.className);

	button.caToggle = function () {
		vis.toggle(field, choices, button);
	};

  $(button).button(choices[0].options).click(function () {
        button.caToggle();
      });

	return button;
};

Visualization.prototype.createToggleInput = function (field, choices,callback) {
	var div = document.createElement('div');
	div.className = field;
  div.innerHTML = "<input type='checkbox' name='"+field+"' value='" + choices.value + "' /><span>"+ choices.label +"</span>";
  $(div).click(callback);
  return div;
};

/*
 * Invoked when a toolbar toggle button has been clicked to update the graph's
 * value for this property and update the button's state.
 */
Visualization.prototype.toggle = function(field, choices, button) {
	var options, callback, fieldval;

	if ($(button).text() == choices[0]['label']) {
		options = choices[1]['options'];
		options.label = choices[1]['label'];
		fieldval = choices[0]['value'];
		callback = choices[0]['onclick'];

    if (options.className) {
      $(button).removeClass(choices[0].options.className);
      $(button).addClass(choices[1].options.className);
    }
	} else {
		options = choices[0]['options'];
		options.label = choices[0]['label'];
		fieldval = choices[1]['value'];
		callback = choices[1]['onclick'];

		if (options.className) {
      $(button).removeClass(choices[1].options.className);
      $(button).addClass(choices[0].options.className);
    }
	}

	$(button).button('option', options);

  this['g_' + field] = fieldval;

  if (callback)
    callback();
};

/*
 * Creates a non-toggle button that invokes the specified callback when clicked.
 * 'Options' represents the JQuery button options and usually contains either
 * 'label' or 'icons'.
 */
Visualization.prototype.createButton = function(options, callback) {
	var button = document.createElement('button');
	if (options.label)
		button.appendChild(document.createTextNode(options.label));

	if (options.className)
	  $(button).addClass(options.className);

  $(button).button(options).click(callback);
	return (button);
};

Visualization.prototype.createLegend = function() {
  var div = document.createElement('div');
  div.className = 'GraphLegend';

  var legend = document.createElement('ul');
  legend.id = 'legend' + this.g_id;
  div.appendChild(legend);

  return div;
};

Visualization.prototype.createGraph = function() {
  var div = document.createElement('div');
  div.className = 'Graph';
  div.id = 'graph' + this.g_id;
  div.style.width = this.defaults.width + 'px';
  div.style.height = this.defaults.height + 'px';

  return div;
};

Visualization.prototype.refresh = function() {
  this.updater.refresh(this.inst, this.render.bind(this));
};

Visualization.prototype.getLegendTitle = function() {
  var title = "-";
  if (this.inst.decomposition.length) {
    var t = this.inst.decomposition.map(function(d) {
      return d.label;
    });
    title = t[0];
  }

  return title;
};

Visualization.prototype.pause = function() {
  // pause time should be time of currently displayed data.
  if (!this.pauseTime) {
    this.pauseTime = this.displayTime();
  }
};

// resumes, jumps to latest data.
Visualization.prototype.resume = function() {
  if (this.pauseTime) {
    // At the moment we prefer to jump to the front when unpausing,
    // but we could adjust the offset to resume where we are.
    // this.offset += this.latestTime - this.pauseTime;
    this.offset = 0;
    this.pauseTime = 0;
  }
};

Visualization.prototype.scrub = function(delta) {
  if (this.offset + delta > 0) {
    this.offset += delta;
  } else {
    this.offset = 0;
  }
  this.refresh();
};

Visualization.prototype.scrollForward = function() {
  if (!this.pauseTime) {
    this.g_pausebutton.caToggle();
  }
  var offset = parseInt(this.zoom() / 4, 10);
  this.scrub(-offset);
};

Visualization.prototype.scrollBack = function() {
  if (!this.pauseTime) {
    this.g_pausebutton.caToggle();
  }
  var offset = parseInt(this.zoom() / 4, 10);
  this.scrub(offset);
};

var predKeyMap = {
  and: '&&',
  or: '||',
  lt: '<',
  le: '<=',
  ge: '>=',
  gt: '>',
  ne: '!=',
  eq: '=='
};

// Not being used atm
Visualization.prototype.constructPredName = function(p) {
  var pred = p || this.inst.predicate;
  var key, pname;
  var ret = '';
  var vis = this;
  var elts;

  /*
  * With the way predicates are currently constructed there should only
  * ever be one key in the object.
  */
  key = Object.keys(pred)[0];
  if (!key) return ret;

  switch (key) {
  case 'and':
  case 'or':
    elts = pred[key].map(function (x, loc) {
      return (vis.constructPredName(x));
    });
    ret = elts.join(' ' + predKeyMap[key] + ' ');
    break;
  default:
    pname = Fields.getByName(pred[key][0]).label;
    ret += pname + ' ' + predKeyMap[key] + ' ' + pred[key][1];
    break;
  }

  return ret;
};

function Heatmap(inst, updater, cb) {
  this.init(inst, updater, cb);
}
Heatmap.prototype = new Visualization();

Heatmap.prototype.initParams = function() {
  var vis = this;
  var zoomOptions = [ 15, 30, 60, 150, 300, 600, 1200 ];
  var zoomLevel = 1;

  this.detailsHeatmapURI = null;
  this.valueHeatmapURI = null;

	this.scaleChanging = false;

  // TODO: merge to below?
  this.g_selected = {};
  this.g_hues = [];

	this.g_ncreated = 0;

  this.params = {
    duration : zoomOptions[zoomLevel],
    coloring : 'rank',
    weights : 'count',
    height : vis.defaults.height,
    width : vis.defaults.width,
    ymin : 0,
    ymax : 100000,
    nbuckets : 50,
    // hues : [],
    // selected : [],
    isolate : false,
    exclude : false,
    decompose_all : false
  };

  this.zoomIn = function() {
    if (zoomLevel-1 >= 0) {
      zoomLevel--;
      vis.params.duration = zoomOptions[zoomLevel];
      vis.refresh();
    }
  };

  this.zoomOut = function() {
    if (zoomLevel+1 < zoomOptions.length) {
      zoomLevel++;
      vis.params.duration = zoomOptions[zoomLevel];
      vis.refresh();
    }
  };

  this.zoom = function() {
    return vis.params.duration;
  };
};

Heatmap.prototype.footerToolbar = function(n) {
  var vis = this;
  var footer = document.createElement('div');
  footer.className = 'footerToolbar';

  var controls = document.createElement('div');
  controls.className = 'footerControls';

  // TODO - These 2 callback handles should be the same
  controls.appendChild(this.createToggleInput('isolate',
    { label: 'Isolate selected', value: true },
    function(e){
      e.stopPropagation();

      var el = null;
      if (e.target.nodeName != "DIV") {
        el = e.target.parentNode;
      } else {
        el = e.target;
      }

      if (el != null) {

        var selectCount = Object.keys(vis.g_selected).length;

        if (vis.params.isolate) {
          vis.params.isolate = false;
        } else {
          if (!vis.params.exclude && selectCount != 0) {
            vis.params.isolate = true;
          } else {
            if (selectCount === 0) {
              alert("Select an item to isolate first.");
            } else {
              alert("You can not isolate and exclude at the same time.");
            }

            return;
          }
        }

        if (e.target.nodeName === "SPAN") {
          if ($(el).find('INPUT').is(':checked')) {
            $(el).find('INPUT').attr('checked',false);
          } else {
            $(el).find('INPUT').attr('checked',true);
          }
        }

        vis.refresh();
      }
    }
  ));

    // TODO: same as above!
  controls.appendChild(this.createToggleInput('exclude',
    { label: 'Exclude selected', value: true },
    function(e){
      e.stopPropagation();

      var el = null;
      if (e.target.nodeName != "DIV") {
        el = e.target.parentNode;
      } else {
        el = e.target;
      }

      var selectCount = Object.keys(vis.g_selected).length;

      if (el != null) {
        if (vis.params.exclude) {
          vis.params.exclude = false;
        } else {
          if (!vis.params.isolate && selectCount != 0) {
            vis.params.exclude = true;
          } else {
            if (selectCount === 0) {
              alert("Select an item to exclude first.");
            } else {
              alert("You can not exclude and isolate at the same time.");
            }

            return;
          }
        }

        if (e.target.nodeName === "SPAN") {
          if ($(el).find('INPUT').is(':checked')) {
            $(el).find('INPUT').attr('checked',false);
          } else {
            $(el).find('INPUT').attr('checked',true);
          }
        }
        vis.refresh();
      }
    }
  ));

  footer.appendChild(controls);

  var display = document.createElement('div');
  display.className = "controlDisplay";

  var copy = document.createElement('SPAN');
  copy.className = 'xaxisLabelCopy';
  copy.innerHTML = 'X-axis: Time, in 1 second increments';

  display.appendChild(copy);

  if (n)
    display.appendChild(n);

  footer.appendChild(display);

  return footer;
};

Heatmap.prototype.initControls = function() {
  var vis = this;

  // rank/linear coloring control.
  var coloring = document.createElement('DIV');
  coloring.className = 'colorContainer';
  coloring.innerHTML = '<span class="colorText">Color by:</span><div class="colorButton rank"></div>';
  $('.gToolbar', $(vis.gEltToolbar)).append(coloring);
  // this.gEltToolbar.appendChild(coloring);

  $('.colorButton','#graphID_' + vis.g_id).live('click',function(event){
    $(event.target).toggleClass('linear').toggleClass('rank');
    vis.params.coloring = (vis.params.coloring == 'rank') ? 'linear' : 'rank';
    vis.refresh();
  });

  // attach bucket slider
  this.gEltToolbar.appendChild(this.createBucketSlider());

  // Add button in to show decomp menu
  // This has to go AFTER the slider...
	var predBar = document.createElement("DIV");
	predBar.className = "more";
	predBar.innerHTML = '&nbsp;';
  $(predBar).click(function(e){
    $('.gPredicateBar', $('#graphID_' + vis.g_id)).toggle('fast');
  });
	this.gEltToolbar.appendChild(predBar);

  // attach scale slider
  this.gEltContent.appendChild(this.createScaleSlider());
};

Heatmap.prototype.createBucketSlider = function() {
  var minBuckets = 2;
  var maxBuckets = 100;
  var vis = this;
  var sliderContainer = document.createElement('div');
  sliderContainer.className = 'sliderContainer';

  var sliderLabel = document.createElement('div');
  sliderLabel.className = 'sliderLabel';
  sliderLabel.innerHTML = 'Granularity';

  var sliderTrack = document.createElement('div');
  sliderTrack.className = 'hsliderTrack';

	var slider = document.createElement('div');
	slider.className = 'ghRange';

	$(slider).slider({
    min: minBuckets,
    max: maxBuckets,
    value: vis.params.nbuckets,
    stop: function (event, ui) {
     vis.params.nbuckets = ui.value;
     vis.refresh();
    }
	});

	sliderTrack.appendChild(slider);

  sliderContainer.appendChild(sliderLabel);
  sliderContainer.appendChild(sliderTrack);
  return sliderContainer;
};

Heatmap.prototype.createScaleSlider = function() {
  var vis = this;
  var sliderContainer = document.createElement('div');
  sliderContainer.className = 'sliderContainer';

  var sliderTrack = document.createElement('div');
  sliderTrack.className = 'sliderTrack';

  var slider = document.createElement('div');
  slider.className = 'gRange';

  $(slider).slider({
    orientation: 'vertical',
    range: true,
    min: vis.params.ymin,
    max: vis.params.ymax,
    values: [ vis.params.ymin, vis.params.ymax ],
    stop: function (event, ui) {
      vis.scaleChanging = false;
      vis.params.ymin = ui.values[0];
      vis.params.ymax = ui.values[1];
      vis.gEltScaleText.innerHTML = vis.rangeText();
      vis.refresh();
    },
    start: function(event, ui) {
      vis.scaleChanging = true;
    }
  });

  sliderTrack.appendChild(slider);
  sliderContainer.appendChild(sliderTrack);
  return sliderContainer;
};

Heatmap.prototype.rangeText = function() {
  var legend;
  var field = this.inst.decomposition.filter(function(eachfield) {
    return eachfield.type.arity == "numeric";
  }).pop();

  legend = 'Displaying ' + field.label;
  if (this.params.ymax < 0) {
    return legend;
  }

  if (this.params.ymin === 0) {
    legend += ' up to ' + field.type.unitString(this.params.ymax);
  } else {
    legend += ' from ' + field.type.unitString(this.params.ymin) + ' to ' + field.type.unitString(this.params.ymax);
  }
  return legend;
};

Heatmap.prototype.initUpdate = function() {
  var vis = this;

  this.currentData = null;
  this.latestTime = 0;
  this.nextData = null;

  vis.valueHeatmapURI = this.inst.uris.filter(function(uri)  {
    return uri.name == "value_heatmap";
  }).pop().uri;

  vis.detailsHeatmapURI = this.inst.uris.filter(function(uri)  {
    return uri.name == "details_heatmap";
  }).pop().uri;

  this.latestIndex = -1;
  // TODO: success should return data and *request time* (which is ordinal).
  function success(index, data) {
    // if start_time is greater than current start time, swap it.
    // TODO: how to handle going back in time? Clear it?
    if (index >= vis.latestIndex) {
      vis.latestIndex = index;
      vis.nextData = data;
    }
  }

  // TODO: what's a good error interface?
  // Need the status, possibly the ECODE and/or message (if any) from CA via
  // portal.
  function error(jqXHR, textStatus, errorThrown) {
    // TODO: how to handle errors on client-side fetch.
  }

  // TODO: use end_time. Probably simpler.
  function paramHook(timestamp) {
    // dump falsy params
    // Is this really necessary?
    var data = Object.keys(vis.params).reduce(function(acc, key) {
      if (vis.params[key]) {
        acc[key] = vis.params[key];
      }
      return acc;
    }, {});

    // PORTAL-443 adjust start_time here for pausing.
    //
    if (timestamp) {
      vis.latestTime = timestamp;
      data.end_time = timestamp - vis.offset;
    }

    // override with paused time if we're paused.
    if (vis.pauseTime) {
      data.end_time = vis.pauseTime - vis.offset;
    }

    var sldr = $(".gRange", $('#graphID_' + vis.g_id) );
    var max = sldr.slider("option", "max");
    var current = sldr.slider("option", "values")[1];

    // PORTAL-799 - ensure ymin < ymax.
    if (data.ymin >= data.ymax) data.ymax = data.ymin + 1;

    if (current == max && !vis.scaleChanging) {
      delete data.ymax;
    }

    var selected = [];
    var hues = [];

    for (var value in vis.g_selected) {
      selected.push(value);
      hues.push(vis.g_selected[value]);
    }

    if (vis.params.isolate && selected.length != 0) {
      hues = hues.filter(function(i){
        return (i != 21);
      });
    } else {
      hues.unshift(21);
    }

    data.hues = hues;
    if (selected.length) data.selected = selected;

    var params = {
      url : vis.valueHeatmapURI,
      data : data
    };

    return params;
  }

  this.updater.bindVisualization(this.inst, success, error, paramHook);
};

Heatmap.prototype.displayTime = function() {
  // INTRO-474, would prefer end_time, but it's not present.
  return this.currentData.start_time + this.currentData.duration - this.offset;
};

Heatmap.prototype.initRender = function() {

  this.render = function() {

    var vis = this;
    var data = vis.nextData;

    var div = vis.gEltGraph;
    if (!data) return; // nothing to update with.

    var img = div.childNodes[0];

    if (!img && data.image) {
      img = div.appendChild(document.createElement('img'));

      $(img).click(function(event) {
        vis.heatmapCellClicked(event);
      });
    }

    if (data.image) {
      img.src = 'data:image/png;base64,' + data.image;
      vis.currentData = data;
    }

    // get the slider to check for auto-scale.
    // TODO: make helper method to check for autoscale. Expose slider as var?
    var sldr = $(".gRange", $('#graphID_' + vis.g_id) );
    var max = sldr.slider("option", "max");
    var current = sldr.slider("option", "values")[1];

    if (current == max && !vis.scaleChanging) {
      vis.params.ymax = data.ymax;

      sldr.slider({ max : data.ymax, min : 0}).slider("values", 1, data.ymax);
      $(".gRangeText",$('#graphID_' + vis.g_id)).text(vis.rangeText());
    }

    // TODO: this should never be undefined Race condition.
    if (data.present != undefined) {
      vis.updateTable(data.present.map(function (elt) {
        return ({ key: elt, val: [ elt ] });
      }));
    }
  };
};

Heatmap.prototype.heatmapCellClicked = function(event) {
  var vis = this;
  var params = {};

  params.x = event.offsetX;
  params.y = event.offsetY;
  params.ymin = vis.currentData.ymin;
  params.ymax = vis.currentData.ymax;
  params.duration = vis.currentData.duration;
  params.start_time = vis.currentData.start_time;

  // TODO: for best responsiveness, might be best to encode these params
  // directly into the callback when the image listener is created.
  // Also: depends on INTRO-418: should use nbuckets from the most-recent data,
  // but that isn't supplied yet.
  params.nbuckets = vis.params.nbuckets;
  params.height = vis.params.height;
  params.width = vis.params.width;

  $.ajax({
    url : vis.detailsHeatmapURI,
    data: params,
    dataType : 'json',
    headers : visConfig.requestHeaders,
    success : vis.updateDistribution.bind(vis)
  });
};

Heatmap.prototype.updateDistribution = function(entries) {
  var vis = this, items = [], el, time, title, x;
  time = (entries.bucket_time) ? entries.bucket_time : entries.start_time;

  title = "<b>Distribution details</b> at " + new Date(time * 1000).toTimeString();


  if (this.inst['value-arity'] == 'numeric-decomposition') {
    var field = this.inst.decomposition.filter(function(eachfield) {
      return eachfield.type.arity == 'numeric';
    }).pop();

    title += ' ' + field.type.unitString(entries.bucket_ymin) + ' - ' + field.type.unitString(entries.bucket_ymax);
  }

  var elTitle = $('.gGraphDist .gGraphHeader P',$('#graphID_' + vis.g_id))[0];
  elTitle.innerHTML = title;

  // create or clear the list.
  var distList = $("#distList_"+this.g_id);
  if (!distList.length) {
    $("#graphID_"+this.g_id+" .distBody").prepend("<ul id='distList_"+this.g_id+"'></ul>");
    distList = $("#distList_"+this.g_id);
  } else {
    distList.empty();
  }


  if (Array.isArray(entries.present)) {
    for (var i = 0; i < entries.present.length; i++) {
      x = entries.present[i];
      // Where did the value go?
      items.push({key:x, value:0});
    }
  } else {
    for (var itemName in entries.present) {
      items.push({key:itemName,value:entries.present[itemName]});
    }
  }

  function sortByValue(a, b) {
    var p = a.value;
    var q = b.value;
    return q - p;
  }

  items.sort(sortByValue);

  for (x = 0;x < items.length; x++) {
    var key = gDecompNameToId(items[x].key);
    var li = document.createElement('LI');
    li.id = 'li_d_' + key;
    li.innerHTML = "<input type='checkbox' /><div class='entryName'>"+items[x].key+"</div><div class='entryValue'>"+items[x].value+"</div>";

    distList.append(li);

    $(li).click(function(event){
      if (event.target.nodeName == "INPUT" || event.target.nodeName == "DIV") {
        el = event.target.parentNode;
        var id = (el).id.replace('_d_','');
        vis.heatmapRowSelect($("#" + id)[0]);

        if (event.target.nodeName == "DIV") {
          var input = $(event.target.parentNode).find("input");
          if (input.is(':checked')) {
            input.attr('checked',false);
          } else {
            input.attr('checked',true);
          }
        }

      }
    });
  }

  /* insert the total and a message about adding a decomposition if none exist. */
  var liTotal = document.createElement('LI');
  liTotal.innerHTML = "<input type='checkbox' style='visibility: hidden'/><div class='entryName distTotal'>Total</div><div class='entryValue'>"+entries.total+"</div>";
  distList.append(liTotal);

  if ($('.gGraphDist', $('#graphID_' + vis.g_id)).css('display') !== 'block') {
    $('.gGraphDist', $('#graphID_' + vis.g_id)).slideDown();
  }
};

Heatmap.prototype.heatmapRowSelect = function (target) {
	var hue, value, already;

  value = $(target).attr('data-decomplabel');
  already = value in this.g_selected;

	if (!already) {
		$(target).addClass('row_selected');
		$(target).find('input').attr('checked',true);
		hue = this.allocateHue();
		this.g_selected[value] = hue;
		target.style.backgroundColor = new gColor([ hue, 0.9, 0.95 ], 'hsv').css();
	} else {
    $(target).find('input').attr('checked',false);
    target.style.backgroundColor = 'transparent';
    this.deallocateHue(this.g_selected[value]);
    $(target).removeClass('row_selected');
    delete (this.g_selected[value]);
	}

  target.focus();
  this.refresh();
};

Heatmap.prototype.allocateHue = function() {
	var which;

	if (this.g_hues.length > 0) {
		return (this.g_hues.pop());
	}

	which = this.g_ncreated++ % gColors.length;
	return (gColors[which].hue());

};

Heatmap.prototype.deallocateHue = function (hue) {
	this.g_hues.push(hue);
};

Heatmap.prototype.updateTable = function(entries, clear) {
  var vis = this;

  var contextHandle = function(key,option) {
    var type = key.split('__');

    var pred;
    var stringDecomp = null;
    var numericDecmp = null;

    for(var i = 0; i < vis.inst.decomposition.length;i++) {
      if (vis.inst.decomposition[i].type.arity == "discrete") {
        stringDecomp = vis.inst.decomposition[i];
      }
      if (vis.inst.decomposition[i].type.arity == "numeric") {
        numericDecmp = vis.inst.decomposition[i];
      }
    }

    if (type[0] == "drill") {
      var field1 = Fields.getByName(type[1]);
      pred = vis.predicateToJSON(stringDecomp.name,type[2],'eq');
      createInstrumentation(vis.inst.metric,field1,numericDecmp,pred);
    } else if (type[0] == "convert") {
      var field = (stringDecomp) ? stringDecomp : numericDecmp;
      var predValue = $(this).attr('data-decomplabel');
      pred = vis.predicateToJSON(stringDecomp.name,predValue,'eq');
      createInstrumentation(vis.inst.metric,field,null,pred);
    } else {
      $('.gPredicateBar', $('#graphID_' + vis.g_id)).show('fast');
    }
  };

  $('.lc_name', $('#graphID_' + this.g_id)).text(this.getLegendTitle());

  var focused = document.activeElement;

  if (clear || !this.g_legend_rows) {
    this.g_legend_rows = {};
     $('#legend' + this.g_id, $('#graphID_' + this.g_id)).empty();
  }

  // sortedEntries = entries.sort(function(a,b) {
  //   if (a.key == b.key) return 0;
  //   return a.key < b.key ? -1 : 1;
  // });

  // rows = this.g_legend_rows;

  var legend = d3.select('#legend' + this.g_id).selectAll('li')
    .data(entries, function(d) {
      return gDecompNameToId(d.key);
    });

  legend.enter()
    .append('li')
    .attr('id', function(d) { return 'li' + gDecompNameToId(d.key); })
    .attr('data-decomplabel', function(d) { return d.key; })
    .html(function(d) {
      return "<input type='checkbox' />" + d.val;
    })
    .each(function(d) {
      var id = gDecompNameToId(d.key);
      $('#li'+ id, $('#graphID_' + vis.g_id)).click(function(event){
        // This list gets rendered for both types. Flot and Heatmaps
        vis.heatmapKeyPressed(event);
      });

      // disabled per PORTAL-945
      // idea was to create a predicated clone of the metric, but double-click
      // to do so is likely inappropriate.
      // $('#li'+ id, $('#graphID_' + vis.g_id)).dblclick(function(event){
      //   var value = $(event.target).attr('data-decomplabel');
      //   var field_name = vis.inst.decomposition[0].name;
      //   vis.addPredicateAndClone(field_name,value,'eq');
      // });

      var met = vis.inst.metric.fields.filter(function(x){
        return (x.name != vis.inst.decomposition[0].name);
      });
      var items = {};

      for (var i = 0; i < met.length; i++) {
        var item = {};
        item['name'] = met[i].label;
        item['callback'] = contextHandle;
        items['drill__' + met[i].name + '__' + d.key] = item;
      }

      $.contextMenu({
        selector: '#graphID_' + vis.g_id + ' #li'+ id,
        items: {
          drilldown: {name: "Futher decompose by...", items: items },
          predicate: {name: "Predicate by...", callback: contextHandle },
          convert :  {name: "Convert to Barchart", callback: contextHandle}
        }
      });
    });

  legend.exit().remove();
  legend.sort(function(a,b) {
    if (a.key == b.key) return 0;
    return a.key < b.key ? -1 : 1;
  });

  focused.focus();
};

Heatmap.prototype.heatmapKeyPressed = function (event) {

  if (event.target.tagName === "INPUT") {
    event.target = event.target.parentNode;
  }

	this.heatmapRowSelect(event.target);
};

function BarChart (inst, updater, cb) {
  this.init(inst, updater, cb);
}

BarChart.prototype = new Visualization();

BarChart.prototype.initParams = function() {
  var vis = this;

  var zoomOptions = [ 15, 30, 60, 150, 300, 600, 1200 ];
  var zoomLevel = 1;
  vis.visible = zoomOptions[zoomLevel];


  this.params = {
    width : vis.defaults.width,
    height : vis.defaults.height
  };

  this.zoomIn = function() {
    if (zoomLevel-1 >= 0) {
      zoomLevel--;
      vis.visible = zoomOptions[zoomLevel];
      vis.render();
    }
  };

  this.zoomOut = function() {
    if (zoomLevel+1 < zoomOptions.length) {
      zoomLevel++;
      vis.visible = zoomOptions[zoomLevel];
      vis.render();
    }
  };

  this.zoom = function() {
    return vis.visible;
  };
};

BarChart.prototype.footerToolbar = function(n) {
  var footer = document.createElement('div');
  footer.className = 'footerToolbar';

  var controls = document.createElement('div');
  controls.className = 'footerControls';

  // TODO: include/exclude. Needs wiring to D3.

  footer.appendChild(controls);

  var display = document.createElement('div');
  display.className = "controlDisplay";

  var copy = document.createElement('div');
  copy.className = 'xaxisLabelCopy';
  copy.innerHTML = 'X-axis: Time, in 1 second increments';

  display.appendChild(copy);

  if (n) display.appendChild(n);

  footer.appendChild(display);

  return footer;
};

BarChart.prototype.initControls = function() {
};

BarChart.prototype.rangeText = function() {

  var str = "";
  if (this.inst.metric.unit) {
    str = 'Displaying total ' + this.inst.metric.unit;
  } else {
    str = 'Displaying total ' + this.inst.metric.type.params.unit;
  }

  return str;
};

BarChart.prototype.initUpdate = function() {
  var vis = this;

  vis.currentTime = 0;
  vis.latestTime = 0;

  vis.valueRawURI = this.inst.uris.filter(function(uri) {
    return uri.name == "value_raw";
  }).pop().uri;

  vis.dataStore = new RawDataStore(vis.updater, this.inst);

  function success(index, data) {
    vis.dataStore.add(data);
  }

  function error(jqXHR, textStatus, errorThrown) {
  }

  function paramHook(timestamp) {
    var data = {};

    // PORTAL-443: adjust start_time here.
    if (timestamp) {
      data.start_time = timestamp;
      if (timestamp > vis.latestTime) vis.latestTime = timestamp;
    }

    var params = {
      url : vis.valueRawURI,
      data : data
    };

    return params;
  }

  this.updater.bindVisualization(this.inst, success, error, paramHook);
};

var scalarStackTransform = function(d) {
  var label = this.inst.metric.label;
  Object.keys(d).forEach(function(ts) {
    d[ts].label = label;
  });
  var result = {};
  result[label] = d;
  return result; // that was easy.
};

// Used to create a normalised 2D array for plotting on the following model:
// { seriesKey : [ { start_time, key, count }, ... ] }
// data should contain all periods required (which is the datastore contract)
var discreteStackTransform = function(d) {
  var timestamps = Object.keys(d).map(function(x) { return parseInt(x, 10); }).sort();

  // step 1: iterate the timestamps, adding to the series as req'd.
  var seriesData = timestamps.reduce(function(acc, t) {
    var datum = d[t];
    Object.keys(datum.value).forEach(function(label) {
      if (!(label in acc)) acc[label] = {};
      var point = {
        label : label,
        value : datum.value[label],
        start_time : datum.start_time,
        start_time_requested : datum.start_time_requested,
        duration : datum.duration,
        nsources : datum.nsources,
        minreporting : datum.minreporting
      };
      acc[label][datum.start_time] = point;
    });
    return acc;
  }, {});

  // step 2: interpolate each series to 0 counts where they don't have
  Object.keys(seriesData).forEach(function(label) {
    // each series is time-stamp keyed. Insert missing ones.
    // if there's an error in the data for this second, deal
    // with it here.
    var series = seriesData[label];
    timestamps.forEach(function(t) {
      if (!(t in series)) {
        var datum = d[t];
        var point = {
          status : 'synthetic',
          label : label,
          start_time : t,
          value : 0,
          duration : datum.duration,
          nsources : datum.nsources,
          minreporting : datum.minreporting
        };
        series[t] = point;
      }
    });
  });

  return seriesData;
};

var stackTransform = {
  'discrete-decomposition' : discreteStackTransform,
  'scalar' : scalarStackTransform
};

BarChart.prototype.displayTime = function() {
  return this.currentTime;
};

BarChart.prototype.initRender = function renderBars() {
  var vis = this;
  var height = this.params.height;
  var width = this.params.width;

  var xScale = d3.scale.linear().range([-1, width])
    .interpolate(d3.interpolateRound);
  var barWidth = function(d) {
    var scaled = xScale(d.start_time + d.duration) - xScale(d.start_time);
    return scaled;
  };
  var barX = function(d) {
    var scaled = xScale(d.start_time) +0.5;
    return scaled;
  };

  // y-scale and related
  var yScale = d3.scale.linear().range([height-1, 0]);
  // .interpolate(d3.interpolateRound)
  var barHeight = function(d) {
    var scaled = Math.ceil(yScale(d.y));
    return scaled;
  };
  var barY = function(d) {
    // scale the value(s)
    var scaled = Math.floor(yScale(d.y + d.y0));
    return height - scaled + 0.5;
  };

  // stack transformation.
  var stack = d3.layout.stack()
    .values(function(s) { return d3.values(s.value).sort(function(d1, d2) {
        return d1.start_time - d2.start_time;
      });
    })
    .x(function(d) { return d.start_time; })
    .y(function(d) { return d.value; })
    .out(function(d, y0, y) { d.y = y; d.y0 = y0; d.y1 = y+y0 })
    .order('default')
    .offset('zero');

  var color = d3.scale.category20();

  // sets up the svg element for the visualisation, with a group sub-element
  // containing the transform to make the.
  var chart = d3.select(this.gEltGraph)
    .append("svg:svg")
      .attr("width", this.defaults.width)
      .attr("height", this.defaults.height)
      .style("shape-rendering", "geometricPrecision");

  var scale = chart.append("svg:g").attr('class', 'scale');

  var legend = d3.select(this.gEltLegend).select('ul');

  var renderScale = function(renderTime, n, stackable) {
    // stackable might be empty.
    if (!stackable.length || !stackable[stackable.length-1].value) return;

    // update the scales.
    xScale.domain([renderTime-n, renderTime]);

    // we want the highest point in 'stackable' - it'll always be in the last
    // item, == y0 + y.
    var maxY = Object.keys(stackable[stackable.length-1].value).reduce(function(max, ts) {
      var crnt = stackable[stackable.length-1].value[ts];
      var top = crnt.y + crnt.y0; // top of this bar.
      return top > max ? top : max;
    }, 0);

    var dy = Math.pow(10, Math.floor(Math.log(maxY) / Math.log(10))) / 2;
    yScale.domain([0, Math.ceil(maxY / dy) * dy]);

    var ticks = yScale.ticks(5);

    // drop 0 and highest tick if it's at the top of range.
    ticks.shift();
    if (ticks[ticks.length-1] == yScale.domain()[1]) ticks.pop();
    // draw the lines.

    var lines = scale.selectAll('line').data(ticks);

    lines.enter().append('svg:line')
      .style('stroke', '#493F2D')
      .attr('x1', 0)
      .attr('x2', width)
      .attr('y1', -1)
      .attr('y2', -1)
      .transition().duration(100).ease('linear')
      .attr('y1', function(d) { return /*height -*/ Math.floor(yScale(d)) - 0.5; })
      .attr('y2', function(d) { return /*height -*/ Math.floor(yScale(d)) - 0.5; });

    lines.transition().duration(100).ease('linear')
      .attr('y1', function(d) { return /*height -*/ Math.ceil(yScale(d)) + 0.5; })
      .attr('y2', function(d) { return /*height -*/ Math.ceil(yScale(d)) + 0.5; });

    lines.exit().transition().duration(100).ease('linear')
      .attr('y1', -1)
      .attr('y2', -1)
      .remove();

    var text = scale.selectAll('text').data(ticks);
    text.enter().append('svg:text')
      .attr('y', 0)
      .style('fill', '#493F2D')
      .style('font-size', '10px')
      .style('font-family', '"Lucida Grande","Lucida Sans Unicode",arial,sans-serif')
      .attr('x', 6)
      .attr('dy', '-0.3em')
      .text(function(d) { return d + ''; })
      .transition().duration(100).ease('linear')
      .attr('y', function(d) { return /*height - */Math.floor(yScale(d)) - 0.5; });

    text.transition().duration(100).ease('linear')
      .attr('y', function(d) { return /*height - */Math.floor(yScale(d)) - 0.5; })
      .text(function(d) { return d + ''; });

    text.exit().transition().duration(100).ease('linear')
        .attr('y1', -1)
        .attr('y2', -1)
        .remove();
  };

  var contextHandle = function(key,option) {
    var type = key.split('__');

    var pred;
    var stringDecomp = null;
    var numericDecmp = null;

    for(var i = 0; i < vis.inst.decomposition.length;i++) {
      if (vis.inst.decomposition[i].type.arity == "discrete") {
        stringDecomp = vis.inst.decomposition[i];
      }
      if (vis.inst.decomposition[i].type.arity == "numeric") {
        numericDecmp = vis.inst.decomposition[i];
      }
    }

    if (type[0] == "drill") {
      var field1 = Fields.getByName(type[1]);
      pred = vis.predicateToJSON(stringDecomp.name,type[2],'eq');
      createInstrumentation(vis.inst.metric,field1,numericDecmp,pred);
    } else if (type[0] == "convert") {
      var field = (stringDecomp) ? stringDecomp : numericDecmp;
      var predValue = $(this).attr('data-decomplabel');
      pred = vis.predicateToJSON(stringDecomp.name,predValue,'eq');

      var fields = vis.inst.metric.getFieldsByInverseArity(field.type.arity);

      if (fields.length === 0) {
        alert("This Metric can not be coerced into a Heatmap");
      } else {
        for(i = 0; i < fields.length;i++) {
          createInstrumentation(vis.inst.metric,field,fields[i],pred);
        }
      }
    }
  };

  var renderLegend = function(data) {
    var keys = legend.selectAll('li')
      .data(data, function(d) { return d.key; });

    keys.enter().append('li')
      .attr('id', function(d) { return 'li' + gDecompNameToId(d.key); })
      .attr('data-decomplabel', function(d) { return d.key; })
      .style('background-color', function(d) { return color(d.key); })
      .style('color', function(d) {
        var c = d3.hsl(color(d.key));
        // lighten/darken text in the same hue. Aren't we fancy?
        c.l = c.l < 0.5 ? 0.8 : 0.2;
        return c.toString();
      })
      .append('span').text(function(d) { return d.key; })
      .on('click', function(d) { })
      .each(function(legendItems) {
        if (!vis.inst.decomposition[0]) return; // skip for scalar.
        var key = gDecompNameToId(legendItems.key);

        var met = vis.inst.metric.fields.filter(function(x){
          return (x.name != vis.inst.decomposition[0].name);
        });

        var items = {};

        for (var i = 0; i < met.length; i++) {
          var item = {};
          item['name'] = met[i].label;
          item['callback'] = contextHandle;
          items['drill__' + met[i].name + '__' + legendItems.key] = item;
        }


        $.contextMenu({
          selector: '#graphID_' + vis.g_id + ' #li'+ key,
          items: {
            drilldown: {name: "Futher decompose by...", items: items },
            convert :  {name: "Convert to Heatmap", callback: contextHandle}
          }
        });
      });

    keys.exit().remove();

    // ensure sorted
    keys.sort(function(a,b) {
      if (a.key == b.key) return 0;
      return a.key < b.key? -1 : 1;
    })
  };

  function renderBars(stackable) {
    // append a group for each series, which defines its color. We define a
    // key function based on the label of each.
    var series = chart.selectAll('g.series')
      .data(stackable, function(d, i) { return d.key; });

    series.enter()
      .insert('svg:g', '.scale').attr('class','series')
        .style('fill', function(d, i) { return color(d.key); })
        .style('stroke', function(d) { return d3.hsl(color(d.key)).darker().rgb().toString(); });

    // Now render the bars in each series.
    var bars = series.selectAll('rect')
      .data(function(d) {
        return d3.values(d.value);
      }, function(d) {
        return d.start_time + '';
      });

    bars.enter().insert('svg:rect', '.scale')
      .filter(function(d) { return d.y > 0; })
      .attr('x', barX)
      .attr('width', barWidth)
      .attr('y', barY)
      .attr('height', barHeight)
      .on('click', function(d) {
        vis.updateDistribution(stackable.map(function(cat) { return cat.value[d.start_time]}));
      })
      // .transition().duration(60).ease('linear')
      // .attr('x', barX)
      // .attr('width', barWidth);

    bars//.transition().duration(100).ease('linear')
      .attr('width', barWidth)
      .attr('x', barX)
      .attr('y', barY)
      .attr('height', barHeight);

    bars.exit()
      .each(function(d) {
        // can exit either by falling off the left (moving fwd in time),
        // in which case it's relatively safe to trim, or by falling off
        // the right (backward in time), in which case we should keep it,
        // since we'll likely use it later.  This condition checks that it's
        // not the former, and relies on d3.exit() to ensure the latter is correct.
        if (d.start_time < vis.displayTime()) {
          vis.dataStore.trim(d.start_time);
        }
      })
      // .transition().duration(100).ease('linear')
      // .attr('x', 0)
      // .attr('width', 0)
      .remove();

    // series.exit().transition().delay(100).remove();
    series.exit().remove();
  };

  var areaGen = d3.svg.area()
    .x(function(d) { return xScale(d.start_time); })
    .y(function(d) { return yScale(d.y1); })
    .y0(function(d) { return yScale(d.y0); })
    .interpolate('linear');

  function renderLines(stackable) {
    var areas = chart.selectAll('path.area')
      .data(stackable, function(d) { return d.key });

    // need a new one every tick to close over the right data.
    var updateDistrib = function(stckbl) {
      return function(d) {
        var timeStamp = Math.round(xScale.invert(d3.event.offsetX));
        vis.updateDistribution(stckbl.map(function(cat) { return cat.value[timeStamp]}));
      }
    }
    chart.on('click', updateDistrib(stackable));

    areas.enter()
      .insert('svg:path', '.scale').attr('class', 'area')
        .style('fill', function(d) { return color(d.key); })
        .style('stroke', function(d) { return d3.hsl(color(d.key)).darker().rgb().toString(); });

    areas.exit().remove();

    areas.attr('d', function(d) { return areaGen(d3.values(d.value).sort(function(a, b) { return b.start_time - a.start_time })); })


  };

  this.render = function() {

    // If paused, render from that time, otherwise, render latest.
    var renderTime = this.pauseTime || this.dataStore.latestData;
    renderTime -= this.offset;

    if (!renderTime) return; // nothing to render yet.

    this.currentTime = renderTime;

    var n = this.zoom();
    var data = this.dataStore.getRange(renderTime, n+2, vis.valueRawURI);
    var seriesData = stackTransform[this.inst['value-arity']].call(this, data);

    // filter to top-n. Gets all categories, finds the total, then sorts by
    // that total.
    var catTotals = Object.keys(seriesData).map(function(cat) {
      return {
        name : cat,
        total : Object.keys(seriesData[cat]).reduce(function(acc, ts) {
          return seriesData[cat][ts].value + acc
        }, 0)
      }
    }).sort(function(a, b) { return b.total - a.total })
      .filter(function(a) { return a.total > 0 }); // remove cats with no values.

    // PORTAL-649 needs generalization.
    var topN = 10;
    var topNCat = catTotals.slice(0, topN);
    var otherCat = catTotals.slice(topN);

    // now need to make new obj from interseciton of seriesData topN, and...
    // now need to make a single series from 'other', put on series data.

    var topNSeries = topNCat.reduce(function(acc, cat) {
      acc[cat.name] = seriesData[cat.name];
      return acc;
    }, {});

    var otherSeries;

    if (otherCat.length) {
      otherSeries = otherCat.reduce(function(acc, cat) {
        // should appear as one series:
        for (timestamp in seriesData[cat.name]) {
          if (!acc[timestamp]) {
            acc[timestamp] = {
              label : "other",
              duration : seriesData[cat.name][timestamp].duration,
              start_time : seriesData[cat.name][timestamp].start_time,
              value : seriesData[cat.name][timestamp].value
            };
          } else {
            acc[timestamp].value += seriesData[cat.name][timestamp].value;
          }
        }
        return acc;
      }, {});
    }

    var stackable = d3.entries(topNSeries).sort(function(a, b) {
      if (a.key === b.key) return 0;
      return a.key < b.key ? -1 : 1;
    });
    if (otherSeries) stackable.push({ key : 'other', value : otherSeries});

    if (!stackable.length) return;
    stack(stackable);

    renderScale(renderTime, n, stackable);

    renderLegend(stackable);

    // renderBars(stackable);
    renderLines(stackable);
  };
};



BarChart.prototype.updateDistribution = function(datum) {
  var vis = this;

  var time = datum[0].start_time;

  var title = "<b>Distribution details</b> at " + new Date(time * 1000).toTimeString();

  var elTitle = $('.gGraphDist .gGraphHeader P',$('#graphID_' + vis.g_id))[0];
  elTitle.innerHTML = title;

  var distBody = d3.select("#graphID_"+this.g_id+" .distBody");
  var distList = distBody.selectAll('ul').data([datum.filter(function(d) {
    return d.value > 0;
  })]);
  distList.enter().append('ul');

  var distItems = distBody.select('ul').selectAll('li').data(function(d) {
    return d;
  }, function(d) {
    return d.label;
  });

  // enter
  var newItems = distItems.enter().append('li');
  newItems.append('div').classed('entryName', true)
    .text(function(d) { return d.label; });
  newItems.append('div').classed('entryValue', true)
    .text(function(d) { return d.value; });

  // update.
  distItems.select('li div.entryValue').text(function(d) { return d.value; });

  // exit.
  distItems.exit().remove();

  distItems.sort(function(a,b) { return b.value - a.value; });

  // sort and add total.
  // distBody.selectAll('li').sort(function(a,b) { return b.value - a.value; });

  var total = datum.reduce(function(acc, x) { return acc + x.value }, 0);
  var totalItem = distBody.select('ul').append('li');
  totalItem.append('div').attr('class', 'entryName distTotal').text('Total');
  totalItem.append('div').classed('entryValue', true).text(total);

  if ($('.gGraphDist', $('#graphID_' + vis.g_id)).css('display') !== 'block') {
    $('.gGraphDist', $('#graphID_' + vis.g_id)).slideDown();
  }
};

// Helper
function gDecompNameToId(decomp) {
	if (typeof decomp === "number" || decomp == undefined) return (undefined);
  return decomp.replace(/\W/g, '_');
}
