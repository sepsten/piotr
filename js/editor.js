/**
 * Sets up an editor with a main surface.
 *
 * @class
 * @param {Writer.ComponentRegistry} componentReg - A component registry
 * @param {Element} dom - The node that will become the editor's main surface
 * @param {Writer.Document} doc - The document to edit
 */
Writer.Editor = class Editor {
  constructor(dom, doc) {
    /**
     * The document that is being edited.
     *
     * @type {Writer.Document}
     */
    this.document = doc;

    /**
     * Manages all the operations that are executed on the edited document.
     *
     * @type {Writer.History}
     */
    this.history = new Writer.History;

    /**
     * Surface registry, which manages all surfaces.
     *
     * @type {Writer.SurfaceRegistry}
     */
    this.surfaceReg = new Writer.SurfaceRegistry(doc.nodes, dom, this);

    /**
     * The global selection handler.
     *
     * @type {Writer.Selection}
     */
    this.selection = new Writer.Selection(this);

    // Listens to DOM events.
    this.bind();
  }

  /**
   * Handles an event.
   * It ensures that the selection is up to date before applying any change to
   * the model.
   */
  handle() {
    // Update global selection state to find delegatee surface
    // The surface's selection state is also updated.
    this.selection.update();

    // Call surface's behavior
    if(this.selection.state.inside) {
      this.selection.state.surface.handle.apply(
        this.selection.state.surface,
        arguments
      );
    }
  }

  /**
   * Listens to keyboard, paste and input events and defers their handling to
   * the relevant surface.
   *
   * @private
   */
  bind() {
    var self = this,
        dom = this.surfaceReg.mother.dom;

    dom.addEventListener("keydown", function(e) {
      var name = e.code;
      self.handle(name, e);
    });

    dom.addEventListener("keypress", function(e) {
      self.handle("Keypress", e);
    });

    dom.addEventListener("paste", function(e) {
      self.handle("Paste", e);
    });

    dom.addEventListener("input", function(e) {
      // Only single-node changes on text nodes should end up here.
      // Indeed, "input" events are non-cancellable and not very explicit as to
      // the actual changes that were made.
      // They are the result of the browser's contentEditable default handling.
      // In this respect, their handling here is a bit less simplistic.

      // (Also, as long as subsquent changes are on the same node, they may be
      // accumulated.)

      // N.B.: We rely on the previous state of selection.
      var selection = self.selection.state.surface.selection;
      if(selection.inSameNode) {
        let node = selection.startNode;
        if(node instanceof Writer.TextNode)
          node.updateModelFromDOM();
        else
          throw new Error("Unhandeld input event on non-text node!");
      } else
        throw new Error("Unhandeld input event on multiple nodes!");
    });
  }
}
