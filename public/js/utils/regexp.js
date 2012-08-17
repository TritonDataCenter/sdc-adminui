/*
 * RegExp Module
 */
module.exports = {

  escape: function(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
  }

}
