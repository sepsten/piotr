/**
 * Locates the surface that should handle selection. It allows to update the
 * state of selection in the model editor-wise.
 * It is updated by the editor instance before every change; it also updates
 * itself on some non-critical events.
 *
 * @class
 * @param {Writer.Editor} editor - The parent editor
 */
Writer.Selection = class Selection {
  constructor(editor) {
    /**
     * The parent editor.
     *
     * @private
     * @type {Surface}
     */
    this.editor = editor;

    /**
     * The `Selection` instance returned by `document.getSelection()`.
     *
     * @type {Selection}
     */
    this.docsel = document.getSelection();

    /**
     * Stores the current state of selection. These information determines the
     * handling of selection.
     *
     * @private
     * @type {Object}
     * @property {Boolean} inside - Indicates if the current selection (on the
     * whole page) is exclusively located inside the editor's main surface.
     * @property {Writer.Surface} surface - The surface to which the handling
     * is delegated.
     */
    this.state = {
      inside: false,
      surface: null
    };

    /**
     * Stores the previous value of `Selection#state`.
     *
     * @private
     * @type {Object}
     */
    this.previousState = {};

    /**
     * An array of functions called on selection updates.
     *
     * @type {Function[]}
     */
    this.subscribers = [];

    this.bind(); // Listen to selection events
  }

  /**
   * Listens to every mouse or keyboard event that could update the selection.
   * Eventually, the `selectstart` and `selectionchange` events of the Selection
   * API should be used, but they are not implemented everywhere yet.
   * Called by the constructor.
   * These listeners are only needed for handling the allowed default content-
   * editable behaviors and they could add more UI reactivity if selection must
   * be displayed in some non-default way.
   *
   * @private
   */
  bind() {
    var self = this;

    // The selection is changing during the mouse click, but we only need its
    // state at the end of the click, when another action is possible for the
    // user.
    // Also, clicks not only on the surface but on the whole page can affect the
    // selection inside the surface: inside, they modify it, outside, they can
    // discard it.
    document.addEventListener("mouseup", function(e) {
      self.update();
    });

    // Same remark for keyboard events.
    document.addEventListener("keyup", function(e) {
      self.update();
    });
  }

  /**
   * Adds a subscribe callback that will be called each time the selection is
   * updated.
   *
   * @param {Function} fn - The callback
   */
  subscribe(fn) {
    this.subscribers.push(fn);
  }

  /**
   * Removes a subscriber function.
   *
   * @param {Function} fn - The callback to remove
   */
  unsubscribe(fn) {
    var index = this.subscribers.indexOf(fn);
    if(index >= 0)
      this.subscribers.splice(index, 1);
  }

  /**
   * Updates the state of the selection inside the surface.
   * Called by the event listeners set up by `bind()`.
   *
   * @private
   */
  update() {
    Object.assign(this.previousState, this.state); // Save the previous state
    this.checkScope(); // Update the current "inside" state parameter

    // If the selection is outside the editor's scope, just notify the previous
    // surface and stop.
    if(!this.state.inside && this.previousState.inside)
      this.previousState.surface.selection.end();

    // Stop the update if the selection is outside the editor.
    if(!this.state.inside)
      return;

    this.findDelegatee(); // Update the current "surface" state parameter

    // If the handling surface changes, notify the previous one.
    if(this.previousState.inside &&
       this.previousState.surface !== this.state.surface)
      this.previousState.surface.selection.end();

    // Update the surface-level selection
    this.state.surface.selection.handle(this.docsel);
    // Bring it to global level by copying it in the global selection state
    Object.assign(this.state, this.state.surface.selection.state);

    // Call subscribers.
    for(var i = 0; i < this.subscribers.length; i++) {
      this.subscribers[i](this);
    }
  }

  /**
   * Updates `Selection#inside`.
   *
   * @private
   */
  checkScope() {
    if(this.editor.mother.contains(this.docsel.anchorNode) &&
       this.editor.mother.contains(this.docsel.focusNode))
      this.state.inside = true;
    else
      this.state.inside = false;
  }

  /**
   * Finds the Surface that should handle the current selection.
   * For more informations, see the read-me, "Surface hierarchy".
   *
   * @private
   */
  findDelegatee() {
    // We don't care about the selection if it is outside the editor.
    if(!this.state.inside)
      return;

    // Finds the first node in the DOM tree (going upwards), starting from the
    // given one, that indicates which Surface is responsible for this region.
    // One other method to achieve that could be to query each Surface in the
    // surface registry with the `.contains` DOM method going from the lowest
    // in the tree to the highest.
    function findSurfaceID(node) {
      var paramName = Writer.prefix + "SurfaceId";
      while(node) {
        if(node.dataset && node.dataset[paramName])
          return parseInt(node.dataset[paramName]);
        else
          node = node.parentNode;
      }

      // If no surface has been found, throw an error.
      // But this shouldn't happen. Ever.
      throw new Error("No surface node found for " + node);
    }

    var asid = findSurfaceID(this.docsel.anchorNode), // Anchor Surface ID
        fsid = findSurfaceID(this.docsel.focusNode); // Focus Surface ID

    // If they're not the same, use the lowest common parent, aka. the mother
    // surface.
    if(asid !== fsid)
      this.state.surface = this.editor.mother;
    else
      this.state.surface = Writer.surfaceReg.get(asid);
  }

  /**
   * Sets the state of selection globally.
   *
   * @type {Object} newState - A state of selection
   */
  set(newState) {
    if(newState.caret)
      newState.surface.selection.set(
        newState.startNode,
        newState.startOffset
      );
    else
      newState.surface.selection.set(
        newState.startNode,
        newState.startOffset,
        newState.endNode,
        newState.endOffset
      );
  }
};
