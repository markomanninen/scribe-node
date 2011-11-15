root = exports ? this

root.getWidgets = (widgets) ->
  for widget in widgets
    root.widget = require('widgets/'+widget).widget