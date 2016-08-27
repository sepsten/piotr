/**
 * Document node class. Its descendants must also reproduce all of its static
 * members (methods or properties).
 * A node constructor's first argument must always be the parent document.
 *
 * @abstract
 */
Writer.Node = class Node {
  constructor() {
    /**
     * A reference to the surface which is handling this node, or `null` if
     * the node isn't displayed anywhere (but kept in the history for example).
     * Set by the `Surface` instance.
     *
     * @type {Writer.Surface|null}
     */
    this.surface = null;

    /**
     * The node's position in the surface.
     *
     * @type {Number}
     */
    this.position = -1;

    /**
     * Contains the node's DOM representation.
     *
     * @type {Element}
     */
    this.dom = null;

    /**
     * The node's state object.
     * It must not be updated directly but only through `UpdateNode` commands.
     *
     * @type {Object}
     */
    this.state = this.getInitialState();

    /**
     * The node's previous state (in real time, not on the history's timeline).
     *
     * @type {Object}
     */
    this.previousState = null;

    /**
     * Custom critical input handling for a given node.
     * Its functions are always called with the parent surface as context.
     *
     * @type {Object}
     */
    this.behavior = {};
  }

  /**
   * Binds the node to a given surface.
   *
   * @param {Writer.Surface} surface - The parent surface
   */
  attach(surface) {
    this.surface = surface;
    this.dom = this.createDOMRoot();
    this.render();
  }

  /**
   * Removes all references to the parent surface and to the DOM.
   */
  detach() {
    this.surface = null;
    this.dom = null;
  }

  /**
   * Returns the node's initial state.
   * Called once by the constructor.
   *
   * @returns {Object}
   */
  getInitialState() {
    throw new Error("Abstract method!");
  }

  /**
   * Returns an abstract length that should be related to model offsets provided
   * by `boundaryPointToOffset`.
   *
   * @returns {Number}
   */
  getLength() {
    throw new Error("Abstract method!");
  }

  /**
   * Creates and returns the node's DOM root. This root must not change even
   * when re-rendering: only its contents should change.
   *
   * @abstract
   * @returns {Element}
   */
  createDOMRoot() {
    throw new Error("Abstract method!");
  }

  /**
   * Renders the node in its current state as content of the DOM root.
   * It can modify the DOM root's content but the root element cannot be
   * replaced.
   *
   * @abstract
   */
  render() {
    throw new Error("Abstract method!");
  }

  /**
   * Called by the surface managing the node to notify it of its new position.
   *
   * @private
   * @param {Number} pos - The new position
   */
  setPosition(pos) {
    this.position = pos;
  }

  /**
   * Returns true if a given DOM node is inside the node or is the node itself.
   *
   * @param {Element} node - A DOM node.
   * @returns {Boolean}
   */
  contains(node) {
    return this.dom === node || this.dom.contains(node);
  }

  /**
   * Removes the root's children DOM nodes.
   */
  clear() {
    while(this.dom.firstChild) {
      this.dom.removeChild(this.dom.firstChild);
    }
  }

  /**
   * Translates a DOM boundary point (a `(node, offset)` tuple, cf. the DOM
   * spec) to an offset which represents a unique position in the node's
   * contents.
   * This is especially needed for text nodes. Isolated nodes can simply return
   * `-1` to indicate that their contents must be considered as a whole.
   * N.B.: Offsets are positions between the nodes and not character indexes;
   * hence, there is an offset after the last character whose value is equal
   * to the string's length.
   *
   * @abstract
   * @param {Text} destNode - The text node to locate
   * @param {Number} partialOffset - The offset given by the DOM
   * @returns {Number}
   */
  boundaryPointToOffset() {
    throw new Error("Abstract method!");
  }

  /**
   * Returns the DOM boundary point (a `(node, offset)` tuple, cf. the DOM spec)
   * corresponding to the given offset.
   * Please read `.boundaryPointToOffset()` description in complement.
   *
   * @abstract
   * @param {Number} offset
   * @returns {Array} Index 0 is a DOM node, index 1 is the offset.
   */
  offsetToBoundaryPoint() {
    throw new Error("Abstract method!");
  }

  /**
   * Called by the surface's `SurfaceSelection` instance when the node is
   * selected.
   *
   * @abstract
   */
  selectionStart() {}

  /**
   * Called by the surface's `SurfaceSelection` instance when the node leaves
   * selection.
   *
   * @abstract
   */
  selectionEnd() {}

  /**
   * Returns a copy of the current state, which can be fed back to
   * `Node#updateState()`.
   * The default implementation does not perform a deep copy.
   *
   * @returns {Object} A copy of the current state.
   */
  copyState() {
    return Object.assign({}, this.state);
  }

  /**
   * Performs an update on the current state using the `update` object.
   * The default implementation just copies the properties of the update object
   * onto the current state after having saved the previous state.
   *
   * @param {Object} update - The update object
   */
  updateState(update) {
    this.previousState = this.copyState();
    Object.assign(this.state, update);
  }

  /**
   * Exports the node as a JSON object.
   *
   * @returns {Object}
   */
  toJSON() {
    return {
      type: this.constructor.id,
      state: this.copyState()
    };
  }

  /**
   * Instantiates a node from its JSON representation.
   *
   * @param {Object} json - The JSON representation
   * @returns {Writer.Node}
   */
  static fromJSON(json) {
    var newNode = new this;
    newNode.updateState(json.state);
    return newNode;
  }
};

/**
 * This string must be unique: it identifies the class when nodes are
 * serialized.
 *
 * @static
 * @type {String}
 */
Writer.Node.id = "node";
