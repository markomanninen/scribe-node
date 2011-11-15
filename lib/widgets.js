(function() {
  var root;

  root = typeof exports !== "undefined" && exports !== null ? exports : this;

  root.getWidgets = function(widgets) {
    var widget, _i, _len, _results;
    _results = [];
    for (_i = 0, _len = widgets.length; _i < _len; _i++) {
      widget = widgets[_i];
      _results.push(root.widget = require('widgets/' + widget).widget);
    }
    return _results;
  };

}).call(this);
