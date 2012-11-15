/**
 * Anything that modifys the built-in prototypes or pollyfills should go in here.
 *
 */
 
// Function#bind polyfill, courtesy MDC.
if ( !Function.prototype.bind ) {
  Function.prototype.bind = function( obj ) {
    var slice = [].slice,
        args = slice.call(arguments, 1), 
        self = this, 
        nop = function () {}, 
        bound = function () {
          return self.apply( this instanceof nop ? this : ( obj || {} ), 
                              args.concat( slice.call(arguments) ) );    
        };

    nop.prototype = self.prototype;
    bound.prototype = new nop();
    return bound;
  };
}

Array.prototype.unique = function() {
    var a = [];
    var l = this.length;
    for(var i=0; i<l; i++) {
      for(var j=i+1; j<l; j++) {
        if (this[i] === this[j])
          j = ++i;
      }
      a.push(this[i]);
    }
    return a;
  };
  
if(!Object.keys) {
  Object.keys = function(o){
    var ret=[],p;
    for(p in o) {
      if(Object.prototype.hasOwnProperty.call(o,p))
        ret.push(p);
    }
    return ret;
  };
}

Array.prototype.sum = function() {
  return (! this.length) ? 0 : this.slice(1).sum() + ((typeof this[0] == 'number') ? this[0] : 0);
};
