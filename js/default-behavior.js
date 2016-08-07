/**
 * Set of handlers for critical inputs.
 * The handlers name can be one of the values of `KeyboardEvent.code` or
 * `"Selection+" + KeyboardEvent.code"` when there is a (range) selection when
 * the event is fired.
 * They are always called with the `Surface` instance as context.
 */
Writer.DefaultBehavior = {
  "Selection+Enter": function(e) {
    e.preventDefault();
    return Writer.CF.compose(
      Writer.Transforms.removeRange(this, this.selection.state),
      this.selection.startNode.behavior["Enter"].call(this, e)
    );
  },

  "Selection+Backspace": function(e) {
    e.preventDefault();
    // Remove the selection
    var cmd = Writer.Transforms.removeRange(this, this.selection.state);
    this.selection.set(this.selection.state.startNode,
      this.selection.startOffset);
    return cmd;
  },

  "Selection+Input": function(e) {
    if(!this.selection.inSameNode) {
      var cmd = Writer.Transforms.removeRange(this, this.selection.state);
      this.selection.set(this.selection.state.startNode,
        this.selection.startOffset);
      return cmd;
    }
  },

  "Shift+Enter": function(e) {
    // Not handled for now
    // insert <br>
    // Can leave default, will trigger an input event.
  },

  "Delete": function(e) {
    e.preventDefault();
    // if at offset 0 of current node, remove node
    // else, default

    // For now, disable it altogether, as I noticed some weird behavior in
    // Chrome
  },

  "Tab": function(e) {
    // insert tab
    // or go to next node maybe ??
    e.preventDefault();
  },

  // Special
  "Paste": function(e) {
    e.preventDefault();
  }
};
