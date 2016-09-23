var History = require("./commands/history"),
    Surface = require("./surface"),
    Selection = require("./selection"),
    TextNode = require("./nodes/text-node"),
    Range = require("./range");

/**
 * Sets up an editor with a main surface.
 *
 * @class
 * @param {Piotr.ComponentRegistry} componentReg - A component registry
 * @param {Element} dom - The node that will become the editor's main surface
 * @param {Piotr.Document} doc - The document to edit
 */
class Editor {
  constructor(dom, doc) {
    /**
     * The document that is being edited.
     *
     * @type {Piotr.Document}
     */
    this.document = doc;

    /**
     * Manages all the operations that are executed on the edited document.
     *
     * @type {Piotr.History}
     */
    this.history = new History(this);

    /**
     * The editor's main or "mother" surface.
     *
     * @type {Piotr.Surface}
     */
    this.mother = new Surface(doc.nodes);
    this.mother.setEditor(this);
    this.mother.setDOMRoot(dom);
    this.mother.attachNodes();

    /**
     * The global selection handler.
     *
     * @type {Piotr.Selection}
     */
    this.selection = new Selection(this);

    // Listens to DOM events.
    this.bind();
  }

  /**
   * Handles an event by calling the surface's behavior function.
   */
  handle() {
    if(this.selection.state.inside)
      this.selection.state.surface.handle.apply(
        this.selection.state.surface,
        arguments
      );
  }

  /**
   * Executes a given behavior function with the surface as context.
   * The function should return an operation object.
   * Updates the selection if an operation was executed.
   *
   * @param {Function} fn - The function to execute
   * @param {*} [...args] - Additionnal arguments to pass to the function
   * @returns {Boolean} True if the transform returned an operation.
   */
  execute(fn, ...args) {
    // Save the selection before execution
    var selBefore = this.selection.copyState();

    // Execute...
    var cmd = fn.call(this, selBefore, ...args);

    // If the function didn't return any command, abort.
    if(!cmd)
      return false;

    this.history.push(cmd); // Save the operation to make it undoable

    // Save selection after execution.
    this.selection.update(); // Update global selection
    var selAfter = this.selection.copyState();

    cmd.selBefore = selBefore;
    cmd.selAfter = selAfter;

    return true;
  }

  /**
   * Listens to keyboard, paste and input events and defers their handling to
   * the relevant surface.
   *
   * @private
   */
  bind() {
    var self = this,
        dom = this.mother.dom;

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
      var sel = self.selection.state;
      if(Range.isInSameNode(sel)) {
        let node = Range.startNode(sel);
        if(node instanceof TextNode)
          self.execute(function() {return node.modelUpdateFromDOM();});
        else
          throw new Error("Unhandeld input event on non-text node!");
      } else
        throw new Error("Unhandeld input event on multiple nodes!");
    });
  }
}

module.exports = Editor;
