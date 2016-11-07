var ToolbarComponent = require("./toolbar-component");

/**
 * A basic undo button for the toolbar.
 *
 * @class
 */
class UndoButton extends ToolbarComponent {
  constructor() {
    super();

    /**
     * Contains the actual <button> element.
     *
     * @type {HTMLButtonElement}
     */
    this.dom = document.createElement("button");
    this.dom.textContent = "Undo";
    this.dom.disabled = true;
  }

  // From ToolbarComponent
  setParent(toolbar) {
    super.setParent(toolbar);

    var self = this;

    // Subscribe to DOM events
    this.dom.addEventListener("click", function() {
      toolbar.editor.history.undo();
      toolbar.editor.selection.update();
    });

    // Update on history events
    toolbar.editor.history.on("update", function() {
      self.update();
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
class RedoButton extends ToolbarComponent {
  constructor() {
    super();

    /**
     * Contains the actual <button> element.
     *
     * @type {HTMLButtonElement}
     */
    this.dom = document.createElement("button");
    this.dom.textContent = "Redo";
    this.dom.disabled = true
  }

  // From ToolbarComponent
  setParent(toolbar) {
    super.setParent(toolbar);

    this.dom.addEventListener("click", function() {
      toolbar.editor.history.redo();
      toolbar.editor.selection.update();
    });
  }

  /**
   * Updates the button's state.
   */
  update() {
    this.dom.disabled = !(this.toolbar.editor.history.canRedo());
  }
}

exports.UndoButton = UndoButton;
exports.RedoButton = RedoButton;
