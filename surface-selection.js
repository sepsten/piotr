var Range = require("./range");

/**
 * Handles selection for a given surface.
 * It is basically in charge of notifying each selected node that it is being
 * selected and the Surface itself that it must handle critical inputs.
 *
 * @class
 * @param {Piotr.Surface} surface - The editing surface
 */
class SurfaceSelection {
  constructor(surface) {
    /**
     * True if selection-watching is enabled.
     *
     * @private
     * @type {Boolean}
     */
    this.enabled = true;

    /**
     * The parent editing surface.
     *
     * @private
     * @type {Surface}
     */
    this.surface = surface;

    /**
     * The `Selection` instance returned by `document.getSelection()`.
     *
     * @type {Selection}
     */
    this.docsel = document.getSelection();

    /**
     * Represents the selection's current state inside the surface.
     * If `inside` is set to false, all other state parameters are to be
     * disregarded as not up to date or invalid.
     *
     * @type {Object}
     * @property {Boolean} inside - True if selection inside the surface.
     * @property {Boolean} caret - True if the selection is a caret.
     * @property {Number} startNodeIndex - The start node of the selection in
     * document's order.
     * @property {Number} startOffset - The model offset of the start point.
     * @property {Number} endNodeIndex - The end node of the selection in
     * document's order.
     * @property {Number} endOffset - The model offset of the end point.
     */
    this.state = {
      inside: false,
      caret: false,
      startNodeIndex: -1,
      startOffset: -1,
      endNodeIndex: -1,
      endOffset: -1
    }

    /**
     * Stores the previous value of `SurfaceSelection#state`.
     *
     * @private
     * @type {Object}
     */
    this.previousState = {};

    /**
     * Saved informations about the current selection used to restore it.
     *
     * @private
     * @type {Object}
     */
    this.saved = {};
  }

  /**
   * Enables selection-watching.
   */
  enable() {
    this.enabled = true;
  }

  /**
   * Disables selection-watching.
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Tells the instance to handle the current selection: it will compute the
   * selection's range, notify every concerned node and start handling critical
   * inputs.
   * May be called multiple times in a row, without calls to `.end()`.
   * Only called by the editor's `Selection` instance.
   */
  handle() {
    if(!this.enabled)
      return;

    Object.assign(this.previousState, this.state); // Save the previous state
    this.update(); // Update the current state
    this.notify();
  }

  /**
   * Tells the instance that it is not in charge of handling the selection
   * anymore. It will stop handling critical inputs and notify every concerned
   * node.
   * Only called by the editor's `Selection` instance.
   */
  end() {
    Object.assign(this.previousState, this.state); // Save the previous state
    this.state.inside = false;

    // Notify the nodes
    this.notify();
  }

  /**
   * Finds in which nodes are located the anchor and the focus.
   *
   * @private
   */
  update() {
    // When this is called, the selection is always inside the surface.
    this.state.inside = true;

    var range = this.docsel.getRangeAt(0);

    // 0. Check if the selection is inside a node and not in-between
    var startDirty = (range.startContainer === this.surface.dom),
        endDirty = (range.endContainer === this.surface.dom);
    if(startDirty || endDirty) {
      // Dirty solution: we reset the selection
      console.log("Dirty selection!");

      // We try to find the nearest node
      let nodePos;
      if(endDirty)
        nodePos = range.endOffset === 0 ? 0 : range.endOffset - 1;

      else if(startDirty)
        nodePos = range.endOffset === 0 ? 0 : range.endOffset - 1;

      this.set(nodePos, 0);
      this.surface.editor.selection.update();
      return;
    }

    // 1. Duplicate the `docsel.isCollapsed`.
    this.state.caret = this.docsel.isCollapsed;

    // 2. Find in which nodes are the selection's start and end points
    var sid, eid;
    for(var i = 0; i < this.surface.nodes.length; i++) {
      if(this.surface.nodes[i].contains(range.startContainer)) {
        sid = i;
        if(this.state.caret)
          eid = sid;
      }

      // Only check if the selection is a range: if not, anchor == focus
      if(!this.state.caret &&
         this.surface.nodes[i].contains(range.endContainer))
        eid = i;

      // Short-circuit the loop if everything we wanted was found
      if(sid && eid)
        break;
    }

    // 3. Get the offsets.
    var sOffset = this.surface.nodes[sid].boundaryPointToOffset(
      range.startContainer, range.startOffset
    );

    if(!this.state.caret) {
      var eOffset = this.surface.nodes[eid].boundaryPointToOffset(
        range.endContainer, range.endOffset
      );
    } else
      eOffset = sOffset;

    // 4. Store the values.
    this.state.startNodeIndex = sid;
    this.state.startOffset = sOffset;
    this.state.endNodeIndex = eid;
    this.state.endOffset = eOffset;

    // We re-compute this value because it is possible that even for a DOM
    // selection that is not collapsed, the resulting model offsets be the same.
    // In this case (which most of the time will be caused by an isolated node)
    // we want the model selection to be considered as collapsed.
    this.state.caret = (sOffset === eOffset && sid === eid);
  }

  /**
   * Notifies the nodes that are in the selection if they weren't before, and
   * the ones that aren't in it anymore.
   *
   * @private
   */
  notify() {
    for(var i = 0; i < this.surface.nodes.length; i++) {
      // The node is not in the selection anymore
      if(!this.isInSelection(i) && this.wasInSelection(i))
        this.surface.nodes[i].selectionEnd();

      // The node entered the selection
      if(this.isInSelection(i)) // && !this.wasInSelection(i))
        this.surface.nodes[i].selectionStart();
    }
  }

  /**
   * Returns true if the node is currently in the selection.
   *
   * @private
   * @param {Number} index - The node's index
   * @returns {Boolean}
   */
  isInSelection(index) {
    if(!this.state.inside)
      return false;

    return Range.containsNode(this.state, index);
  }

  /**
   * Returns true if the node was in the selection in the previous state.
   *
   * @private
   * @param {Number} index - The node's index
   * @returns {Boolean}
   */
  wasInSelection(index) {
    if(!this.previousState.inside)
      return false;

    return Range.containsNode(this.previousState, index);
  }

  /**
   * Saves the current selection.
   */
  save() {
    // // Update the global selection before saving anything.
    this.surface.editor.selection.update();
    Object.assign(this.saved, this.state);
  }

  /**
   * Restores the saved selection.
   * Its exact restoration is not guaranteed: the save is lossy; plus, the
   * caller must ensure that the model's state is the same between save and
   * restore as these methods do not perform any check.
   */
  restore() {
    if(this.saved.caret)
      this.set(this.saved.startNodeIndex, this.saved.startOffset);
    else
      this.set(this.saved.startNodeIndex, this.saved.startOffset,
        this.saved.endNodeIndex, this.saved.endOffset);
  }

  /**
   * Modifies the current selection.
   * If the end point isn't provided, the selection will be set as a caret on
   * the start point.
   *
   * @param {Number} startNodeIndex - The start node's index
   * @param {Number} startOffset - An offset in the start node
   * @param {Number} [endNodeIndex] - The end node's ID
   * @param {Number} [endOffset] - An offset in the end node
   */
  set(startNodeIndex, startOffset, endNodeIndex, endOffset) {
    if(!this.enabled)
      return;

    // Add focus to the content-editable
    this.surface.dom.focus();

    var r = document.createRange(),
        startNode = this.surface.nodes[startNodeIndex],
        sbp = startNode.offsetToBoundaryPoint(startOffset);

    if(typeof endNodeIndex !== "undefined"
       && typeof endOffset !== "undefined") {
      var endNode = this.surface.nodes[endNodeIndex],
          ebp = endNode.offsetToBoundaryPoint(endOffset);
    }

    // In Chrome (as of version 49.0.2623.112 (64-bit)), editing the current
    // range doesn't work for an unknown reason
    // after using `document.execCommand` (at least sometimes).
    // In Firefox, the same setup worked fine.
    r.setStart(sbp[0], sbp[1]);
    if(endNode)
      r.setEnd(ebp[0], ebp[1]);
    else
      r.collapse(true); // Collapse on start point
    this.docsel.removeAllRanges();
    this.docsel.addRange(r);
  }
};

module.exports = SurfaceSelection;
