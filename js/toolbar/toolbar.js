/**
 * A possible toolbar implementation. I try to keep it as simple as possible.
 * Toolbars are external to the editor.
 *
 * @class
 * @param {Writer.Editor} editor - The parent editor
 * @param {Element} dom - The toolbar's DOM root
 */
class Toolbar {
  constructor(editor, dom) {
    /**
     * Reference to the parent editor.
     *
     * @type {Writer.Editor}
     */
    this.editor = editor;

    /**
     * The toolbar's DOM root.
     *
     * @type {Element}
     */
    this.dom = dom;

    /**
     * The toolbar's component list.
     *
     * @type {Writer.ToolbarComponent[]}
     */
    this.components = [];

    // Subscribe to selection
    var self = this;
    this.editor.selection.subscribe(function() {
      self.update();
    });
  }

  /**
   * Adds a component to the toolbar.
   *
   * @param {Writer.ToolbarComponent} component - The component to add.
   */
  add(component) {
    component.toolbar = this;
    this.components.push(component);
    this.dom.appendChild(component.dom);
  }

  /**
   * Updates the state of components.
   */
  update() {
    for(var i = 0; i < this.components.length; i++) {
      this.components[i].update();
    }
  }
};

module.exports = Toolbar;
