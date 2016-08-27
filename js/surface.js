/**
 * Handles the rendering and editing of a sequence of nodes.
 *
 * @class
 * @param {Node[]} nodes - The node list to edit.
 * @param {HTMLElement} dom - The DOM node which will contain the editor's
 * editing surface.
 */
Writer.Surface = class Surface {
  constructor(nodes) {
    /**
     * ID provided by the surface registry.
     *
     * @type {Number}
     */
    this.id = null;

    /**
     * The parent surface if there is one.
     *
     * @type {Writer.Surface}
     */
    this.parent = null;

    /**
     * The editor to which the surface is attached.
     *
     * @type {Writer.Editor}
     */
    this.editor = null;

    /**
     * The `History` instance that will be used to pipeline and execute edits.
     *
     * @type {Writer.History}
     */
    this.history = null;

    /**
     * The editable DOM node.
     *
     * @type {HTMLElement}
     */
    this.dom = null;

    /**
     * The surface's selection handler.
     *
     * @type {Writer.SurfaceSelection}
     */
    this.selection = new Writer.SurfaceSelection(this);

    /**
     * The array of nodes rendered and updated by the surface.
     * It is usually a reference to a document's node list.
     *
     * @private
     * @type {Node[]}
     */
    this.nodes = nodes;

    /**
     * Behavior for handling of critical inputs.
     */
    this.behavior = Writer.DefaultBehavior;

    // Add the surface to the registry.
    Writer.surfaceReg.add(this);
  }

  /**
   * Sets the element that the surface will use as its DOM root.
   *
   * @param {HTMLElement} dom - The DOM node which will contain the editor's
   * editing surface.
   */
  setDOMRoot(dom) {
    this.dom = dom;
    // Set the ID as a data attribute
    this.dom.dataset[Writer.prefix + "SurfaceId"] = this.id;
  }

  /**
   * Sets the surface's parent editor. Only for the mother surface.
   *
   * @param {Writer.Editor} editor - The parent editor
   */
  setEditor(editor) {
    this.editor = editor;
    this.history = editor.history;
  }

  /**
   * Sets the surface's parent surface.
   *
   * @param {Writer.Surface} surface - The parent surface
   */
  setParentSurface(surface) {
    if(!this.parent) {
      this.parent = surface;

      // The parent surface is necessarily the mother surface, so its editor
      // and history attributes are always set.
      this.editor = surface.editor;
      this.history = surface.history;

      // The code below would be used if the surface hierarchy was not limited
      // to only one level below the mother surface.
      /*
      delete this.editor;
      delete this.history;

      Object.defineProperties(this, {
        "editor": {
          enumerable: true,
          get: function() {
            return surface.editor;
          }
        },

        "history": {
          enumerable: true,
          get: function() {
            return surface.history;
          }
        }
      });
      */
    }
  }

  /**
   * Sets the surface ID. Called by the surface registry.
   *
   * @type {Number} id - The surface's ID.
   */
  setID(id) {
    this.id = id;
  }

  /**
   * Attaches to itself all the nodes (which will render them).
   */
  attachNodes() {
    // Add all the document's node to the DOM
    for(var i = 0; i < this.nodes.length; i++) {
      this.nodes[i].attach(this);
      this.dom.appendChild(this.nodes[i].dom);
    }

    this.updatePositions();
  }

  /**
   * Detaches all the nodes. They are kept in the array but removed from the DOM
   * as they remove any reference to their DOM.
   * This allows to reduce the memory footprint of the surface if it is not
   * rendered on the page anymore but must be stored in the history.
   */
  detachNodes() {
    // Remove all nodes from the DOM and detach them
    for(var i = 0; i < this.nodes.length; i++) {
      this.dom.removeChild(this.nodes[i].dom);
      this.nodes[i].detach();
    }
  }

  /**
   * Returns true if a given DOM node is inside the surface or is the surface
   * itself.
   *
   * @param {Element} node - A DOM node.
   * @returns {Boolean}
   */
  contains(node) {
    return this.dom === node || this.dom.contains(node);
  }

  /**
   * Internal function that calls the proper handler for an event, whether its
   * default or its overriden implementation.
   *
   * @private
   * @param {String} name - The name of the event.
   * @param {Event} event - The DOM event object.
   * @returns {Boolean} True if a handler was found.
   */
  handle(name, event) {
    var cmd; // Will store the returned command.

    // Separate the handling of events according to the state of selection.
    if(!this.selection.caret)
      name = "Selection+" + name;

    // If the selection is restrained to a single node, directly use the node's
    // handler.
    if(this.selection.inSameNode &&
       this.selection.startNode.behavior.hasOwnProperty(name)) {
      this.execute(this.selection.startNode.behavior[name], event);
    }

    // Else, use the surface's handler.
    else if(this.behavior.hasOwnProperty(name)) {
      this.execute(this.behavior[name], event);
    }

    else
      return false;

    return true;
  }

  /**
   * Executes a given transformation function with the surface as context.
   * The function should return an operation object.
   * Updates the selection if an operation was executed.
   *
   * @param {Function} fn - The function to execute
   * @param {*} [...args] - Additionnal arguments to pass to the function
   * @returns {Boolean} True if the transform returned an operation.
   */
  execute(fn, ...args) {
    // Save the selection before execution
    var selection = Object.assign({}, this.editor.selection.state);

    // Execute...
    var cmd = fn.apply(this, args);
    cmd.selection = selection;

    if(cmd) {
      this.history.push(cmd); // Save the operation to make it undoable
      this.editor.selection.update(); // Update global selection
      return true;
    } else
      return false
  }

  /**
   * Inserts a node in the surface. Should not be called directly but only
   * through the `InsertNode` command.
   *
   * @private
   * @param {Writer.Node} node - The node to insert.
   * @param {Number} pos - The position at which it will be inserted.
   */
  insertNode(node, pos) {
    // assert(pos > 0)
    // assert(pos <= this.nodes.length)

    node.attach(this);

    // Insert in the DOM
    if(pos === this.nodes.length) // Insert after the current last node
      this.dom.appendChild(node.dom);
    else // Insert before another node
      this.dom.insertBefore(node.dom, this.nodes[pos].dom);

    this.nodes.splice(pos, 0, node); // Insert into array.
    this.updatePositions();
  }

  /**
   * Removes a node from the surface. Should not be called directly but only
   * through the `RemoveNode` command.
   *
   * @private
   * @param {Number} id - The node's ID.
   */
  removeNode(id) {
    // assert(pos > 0)
    // assert(pos < this.nodes.length)

    var node = this.nodes.splice(id, 1)[0];
    this.dom.removeChild(node.dom);
    node.detach();
    this.updatePositions();
  }

  /**
   * Notifies the nodes of their new position.
   *
   * @private
   */
  updatePositions() {
    for(var i = 0; i < this.nodes.length; i++) {
      this.nodes[i].setPosition(i);
    }
  }
};
