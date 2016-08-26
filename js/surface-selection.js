/**
 * Handles selection for a given surface.
 * It is basically in charge of notifying each selected node that it is being
 * selected and the Surface itself that it must handle critical inputs.
 *
 * @class
 * @param {Surface} surface - The editing surface
 */
Writer.SurfaceSelection = class SurfaceSelection {
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
     * @property {Number} startNode - The start node of the selection in
     * document's order.
     * @property {Number} startOffset - The model offset of the start point.
     * @property {Number} endNode - The end node of the selection in document's
     * order.
     * @property {Number} endOffset - The model offset of the end point.
     */
    this.state = {
      inside: false,
      caret: false,
      startNode: -1,
      startOffset: -1,
      endNode: -1,
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

    // Useful short-hand getters
    Object.defineProperties(this, {
      /**
       * The node containing the current selection's start.
       *
       * @property {Writer.Node}
       * @readonly
       * @name Writer.SurfaceSelection#startNode
       */
      "startNode": {
        enumerable: true,
        get: function() {
          return this.surface.nodes[this.state.startNode];
        }
      },

      /**
       * The node containing the current selection's starendt.
       *
       * @property {Writer.Node}
       * @readonly
       * @name Writer.SurfaceSelection#endNode
       */
      "endNode": {
        enumerable: true,
        get: function() {
          return this.surface.nodes[this.state.endNode];
        }
      },

      /**
       * The current selection's start offset.
       *
       * @property {Number}
       * @readonly
       * @name Writer.SurfaceSelection#startOffset
       */
      "startOffset": {
        enumerable: true,
        get: function() {
          return this.state.startOffset;
        }
      },

      /**
       * The current selection's end offset.
       *
       * @property {Number}
       * @readonly
       * @name Writer.SurfaceSelection#endOffset
       */
      "endOffset": {
        enumerable: true,
        get: function() {
          return this.state.endOffset;
        }
      },

      /**
       * True if the current selection is collapsed.
       *
       * @property {Boolean}
       * @readonly
       * @name Writer.SurfaceSelection#caret
       */
      "caret": {
        enumerable: true,
        get: function() {
          return this.state.caret;
        }
      },

      /**
       * True if the selection is located exclusively in one node.
       *
       * @property {Boolean}
       * @readonly
       * @name Writer.SurfaceSelection#inSameNode
       */
      "inSameNode": {
        enumerable: true,
        get: function() {
          return this.state.startNode === this.state.endNode;
        }
      }
    });
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
    this.state.startNode = sid;
    this.state.startOffset = sOffset;
    this.state.endNode = eid;
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
      if(this.isInSelection(i) && !this.wasInSelection(i))
        this.surface.nodes[i].selectionStart();
    }
  }

  /**
   * Returns true if the node is currently in the selection.
   *
   * @private
   * @param {Number} id - The node's ID
   * @returns {Boolean}
   */
  isInSelection(id) {
    if(!this.state.inside)
      return false;

    if(this.state.caret)
      return id === this.state.startNode;
    else
      return id >= this.state.startNode && id <= this.state.endNode;
  }

  /**
   * Returns true if the node was in the selection in the previous state.
   *
   * @private
   * @param {Number} id - The node's ID
   * @returns {Boolean}
   */
  wasInSelection(id) {
    if(!this.previousState.inside)
      return false;

    if(this.previousState.caret)
      return id === this.previousState.startNode;
    else
      return id >= this.previousState.startNode &&
             id <= this.previousState.endNode;
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
      this.set(this.saved.startNode, this.saved.startOffset);
    else
      this.set(this.saved.startNode, this.saved.startOffset,
        this.saved.endNode, this.saved.endOffset);
  }

  /**
   * Modifies the current selection.
   * If the end point isn't provided, the selection will be set as a caret on
   * the start point.
   *
   * @param {Number} startNodeID - The start node's ID
   * @param {Number} startOffset - An offset in the start node
   * @param {Number} [endNodeID] - The end node's ID
   * @param {Number} [endOffset] - An offset in the end node
   */
  set(startNodeID, startOffset, endNodeID, endOffset) {
    if(!this.enabled)
      return;

    var r = document.createRange(),
        startNode = this.surface.nodes[startNodeID],
        sbp = startNode.offsetToBoundaryPoint(startOffset);

    if(endNodeID && endOffset) {
      var endNode = this.surface.nodes[endNodeID],
          ebp = endNode.offsetToBoundaryPoint(endOffset);
    }

    // In Chrome (as of version 49.0.2623.112 (64-bit)), editing the current
    // range doesn't work for an unknown reason
    // after using `document.execCommand` (at least sometimes).
    // In Firefox, the same setup worked fine.
    r.setStart(sbp[0], sbp[1]);
    if(endNodeID && endOffset)
      r.setEnd(ebp[0], ebp[1]);
    else
      r.collapse(true); // Collapse on start point
    this.docsel.removeAllRanges();
    this.docsel.addRange(r);
  }
};
