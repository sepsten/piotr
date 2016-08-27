/**
 * A basic undo button for the toolbar.
 *
 * @class
 */
class UndoButton {
  constructor() {
    /**
     * Contains the actual <button> element.
     *
     * @type {HTMLButtonElement}
     */
    this.dom = document.createElement("button");
    this.dom.textContent = "Undo";
    this.dom.disabled = true;

    /**
     * Reference to the parent toolbar.
     *
     * @type {Writer.Toolbar}
     */
    this.toolbar = null;

    var self = this;
    this.dom.addEventListener("click", function() {
      self.toolbar.editor.history.undo();
      self.toolbar.editor.selection.update();
    });
  }

  /**
   * Updates the button's state.
   */
  update() {
    this.dom.disabled = !(this.toolbar.editor.history.canUndo());
  }
}

/**
 * A basic redo button for the toolbar.
 *
 * @class
 */
class RedoButton {
  constructor() {
    /**
     * Contains the actual <button> element.
     *
     * @type {HTMLButtonElement}
     */
    this.dom = document.createElement("button");
    this.dom.textContent = "Redo";
    this.dom.disabled = true;

    /**
     * Reference to the parent toolbar.
     *
     * @type {Writer.Toolbar}
     */
    this.toolbar = null;

    var self = this;
    this.dom.addEventListener("click", function() {
      self.toolbar.editor.history.redo();
      self.toolbar.editor.selection.update();
    });
  }

  /**
   * Updates the button's state.
   */
  update() {
    this.dom.disabled = !(this.toolbar.editor.history.canRedo());
  }
}
