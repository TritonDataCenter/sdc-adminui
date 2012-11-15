/*jsl:import visConfig.js.sample */

var Modules = {
  modules : [],
  add : function(f) {
    for (var name in f) {
      this.modules.push(new Module(name, f[name].label));
    }
  },
  getByName: function(name){
    for(var i = 0; i < this.modules.length;i++) {
      if (this.modules[i].name == name) {
        return this.modules[i];
      }
    }      
  }
};

var Module = function(name, label) {
  this.name = name;
  this.label = label;
};

var Types = {
  types : [],
  add : function(f) {
    for (var name in f) {
      this.types.push(new Type(name,f[name]));
    }    
  },
  
  getByName : function(name) {
    for(var i = 0; i < this.types.length;i++) {
      if (this.types[i].name == name) {
        return this.types[i];
      }
    }
  } 
};

var TypeLog = [{ and:'&&'}, {or:'||'}];
var StringTypeRelational = [{'Equal': 'eq'}, {'Not Equal': 'ne'}];
var NumericTypeRelational = [{ 'Less Than' : 'lt'},{'Greater Than' : 'gt'}, { 'Less Than or Equal' : 'le'}, {'Greater Than or Equal': 'ge'},{'Equal': 'eq'}, {'Not Equal': 'ne'}];

var specialUnits = {
  'seconds' : [ 
    { mag : -9, prefix : 'n'}, 
    { mag : -6, prefix : 'µ' }, 
    { mag : -3, prefix : 'm' }, 
    { mag : 0, prefix : ''} 
  ],
  'bytes' : [
    { mag : 0, prefix : ''},
    { mag : 10, prefix : 'k' },
    { mag : 20, prefix : 'M' },
    { mag : 30, prefix : 'G' },
    { mag : 40, prefix : 'T' }
  ]
};

var logBaseN = function(value, base) {
  var mag = Math.log(value) / Math.log(base);
  if ((Math.abs(Math.round(mag) - mag)) < 0.000000001) mag = Math.round(mag);
  return mag;
};

// take the base, create the log function.
var Type = function(name,params) {
  this.name = name;
  this.arity = params.arity;
  this.params = params;

  this.operators = (this.arity === "numeric") ? NumericTypeRelational : StringTypeRelational;
};

Type.prototype.unitString = function(value) {
  var amount, mag, unit = '';
  var prefix = '';
  var power = this.params.power || 0;
  
  if (this.params.base) {
    mag = logBaseN(value, this.params.base) + power;
    
    if (specialUnits[this.params.unit]) {
      var desired = specialUnits[this.params.unit].reduce(function(acc, x) {
        return (x.mag <= mag) ? x : acc;
      });
      mag = desired.mag;
      prefix = desired.prefix;
      unit = this.params.abbr || " " + this.params.unit;
    } else {
      amount = value.toPrescision(3);
    }
    
    // adjust raw value with the difference between current, desired magnitudes
    amount = value / Math.pow(this.params.base, mag - power);
    amount = amount.toPrecision(3);
  } else {
    amount = value;
    unit = this.abbr || '';
  }
  
  return amount + " " + prefix + unit;
};

Type.prototype.operatorsToOptions = function(id) {
  var sel = document.createElement("SELECT");
  sel.id = id || "operatorField";
  for (var i = 0; i < this.operators.length;i++) {
    var opt = document.createElement("OPTION");
    var op = this.operators[i];
    var key =  Object.keys(op)[0];
    opt.innerHTML = key;
    opt.value = op[key];
    sel.appendChild(opt);
  }
  return sel;
};


var Fields = {
  fields : [],
  
  add : function(f) {
    for (var name in f) {
      this.fields.push(new Field(name, f[name].label, f[name].type ));
    }
  },
  
  getByName : function(name) {
    for(var i = 0; i < this.fields.length;i++) {
      if (this.fields[i].name == name) {
        return this.fields[i];
      }
    }
  } 
};  

var Field = function(name, label, type) {
  this.name = name;
  this.label = label;
  this.type = Types.getByName(type);
};

Field.prototype.toString = function() {
  return this.label;
};

Field.prototype.toOption = function() {
  var opt = document.createElement("OPTION");
  opt.innerHTML = this.label;
  opt.value = this.name;
  return opt;
};

// Collection of Metrics
var Metrics = {
  metrics : [],
  selectedMetric: null,
  selectedField1: null,
  selectedField2: null,
  
  add : function(data) {
    for(var i = 0; i < data.length; i++ ) {
      this.metrics.push(new Metric(data[i]));
    }
  },
  
  getMetricsByIndexId: function(index) {
    return this.metrics[index];    
  },
  
  getByModuleAndStat: function(module, stat) {
    var filtered = this.metrics.filter(function(metric) {
      return metric.module.name == module && metric.stat == stat;
    });
    return filtered[0];
  },
  
  // id to bind click handle to.
  // callback returns the current selected leaf nodes
  getSelectedMetric: function(selector,callback){
    var el = $(selector).get(0);
    var wrap = function(){
      $('#decomposition').remove();
      $('#metric').change();      
      return callback(Metrics.selectedMetric,Metrics.selectedField1,Metrics.selectedField2);
    };
    $(el).click(wrap);
  },  

  createLeafList: function(selector) {
    
    var el = $(selector).get(0);
    var selModuleMetric = document.createElement("SELECT");
    selModuleMetric.name = "metric";    
    selModuleMetric.id = "metric";
    
    for (var i = 0; i < this.metrics.length;i++) {
      var opt = document.createElement("OPTION");
      opt.innerHTML = this.metrics[i].toString();
      opt.value = i;
      selModuleMetric.appendChild(opt);
    }
    
    $(selModuleMetric).change(function() {
      $('#decomposition2').remove();      
      var selectedMetric = parseInt($(selModuleMetric).val(), 10);
      var currentMetric = Metrics.selectedMetric = Metrics.getMetricsByIndexId(selectedMetric);

      var selField = document.getElementById("decomposition") || document.createElement("SELECT");
      $(selField).unbind('change');
      $(selField).empty();
            
      selField.id = "decomposition";
      
      var option = document.createElement("OPTION");
      option.innerHTML= "None";
      option.value = "";
      selField.appendChild(option);
      
      for(var j = 0; j < currentMetric.fields.length;j++) {
        selField.appendChild(currentMetric.fields[j].toOption());
      }
      
      $(selField).change(function() {
        var selectedFieldName = $(selField).val();

        if (selectedFieldName != "") {
          var field = Metrics.selectedField1 = Fields.getByName(selectedFieldName);
          var selField2 = document.getElementById("decomposition2") || document.createElement("SELECT");
          $(selField2).empty();
          $(selField2).unbind('change');

          selField2.id = "decomposition2";

          var fields = currentMetric.getFieldsByInverseArity(field.type.arity);
          
          if (fields.length != 0) {
                      
            var optelt = document.createElement("OPTION");
            optelt.innerHTML= "None";
            optelt.value = "";
            selField2.appendChild(optelt);          

            for(var k = 0; k < fields.length;k++) {
              selField2.appendChild(fields[k].toOption()); 
            }

            $(selField2).change(function(){
              var selectedFieldName2 = $(selField2).val();
              if (selectedFieldName2 != "") {
                Metrics.selectedField2 = Fields.getByName(selectedFieldName2);
              } else {
                Metrics.selectedField2 = null;
              }
            });

            el.appendChild(selField2);
            $(selField2).change();
          }
        } 
      });
      el.appendChild(selField);
      $(selField).change();
    });
    
    el.appendChild(selModuleMetric);
    $(selModuleMetric).change();
  }
};

// Single Metrics
var Metric = function(options) {
  this.label = options.label;
  this.module = Modules.getByName(options.module);
  this.stat = options.stat;
  
  // can have either a unit or a type.
  if (options.unit) {
    this.unit = options.unit;
  } else if (options.type) {
    this.type = Types.getByName(options.type);
  }
  
  this.fields = [];
  
  for(var i = 0; i < options.fields.length; i++){
    this.fields.push(Fields.getByName(options.fields[i]));
  }
};

// Combind the name / module to form a string.
Metric.prototype.toString = function() {
  return this.module.label + ": " + this.label;
};

Metric.prototype.getFieldsByInverseArity = function(fieldArity) {
  var fields = [];
  for (var i = 0; i < this.fields.length;i++) {
    if (fieldArity != this.fields[i].type.arity) {
      fields.push(this.fields[i]);
    }
  }
  return fields;
};

/**
 * Kicks off the GET request for metric data and init's the objects
 */
var initMetrics = function(path, callback) {
  // TODO: to config.
  $.ajax({
    url : path,
    type : 'GET',
    dataType : "json",
    headers : visConfig.requestHeaders,
    success : function(data) { 
      console.log(typeof(data));
      Modules.add(data.modules);
      Types.add(data.types);
      Fields.add(data.fields);
      Metrics.add(data.metrics);

      callback();
    }
  });
};
