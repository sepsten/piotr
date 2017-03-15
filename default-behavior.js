var Transforms = require("./commands/transforms"),
    CF = require("./commands/command-factory"),
    Range = require("./range");

/**
 * Set of handlers for critical inputs.
 * The handlers name can be one of the values of `KeyboardEvent.code` or
 * `"Selection+" + KeyboardEvent.code"` when there is a (range) selection when
 * the event is fired.
 * They are always called with the `Surface` instance as context.
 */
var DefaultBehavior = {

  "Selection+Enter": function(r, e) {
    e.preventDefault();

    if(Range.startNode(r).behavior.hasOwnProperty("Enter"))
      return CF.compose(
        Transforms.removeRange(r),
        Range.startNode(r).behavior["Enter"].call(null, r, e)
      );
  },

  "Selection+Backspace": function(r, e) {
    e.preventDefault();
    var cmd = Transforms.removeRange(r);
    r.surface.selection.set(r.startNodeIndex, r.startOffset);
    return cmd;
  },

  "Selection+Keypress": function(r, e) {
    var cmd = Transforms.removeRange(r);
    r.surface.selection.set(r.startNodeIndex, r.startOffset);
    return cmd;
  },

  "Delete": function(r, e) {
    e.preventDefault();
    // if at offset 0 of current node, remove node
    // else, default

    // For now, disable it altogether, as I noticed some weird behavior in
    // Chrome
  },

  "Tab": function(r, e) {
    // insert tab
    // or go to next node maybe ??
    e.preventDefault();
  },

  // Special
  "Paste": function(r, e) {
    e.preventDefault();
   },

  "Selection+Paste": function(r, e) {
    e.preventDefault();

    if(Range.startNode(r).behavior.hasOwnProperty("Paste"))
      return CF.compose(
        Transforms.removeRange(r),
        Range.startNode(r).behavior["Paste"].call(null, r, e)
      );
  },

  "Cut": function(r, e) {
    e.preventDefault();
  },

  "Selection+Cut": function(r, e) {
    e.preventDefault();
  }

};

module.exports = DefaultBehavior;
