/**
 * A possible toolbar implementation. I try to keep it as simple as possible.
 * Toolbars are external to the editor.
 *
 * @class
 * @param {Piotr.Editor} editor - The parent editor
 * @param {Element} dom - The toolbar's DOM root
 */
class Toolbar {
  constructor(editor, dom) {
    /**
     * Reference to the parent editor.
     *
     * @type {Piotr.Editor}
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
     * @type {Piotr.ToolbarComponent[]}
     */
    this.components = [];
  }

  /**
   * Adds a component to the toolbar.
   *
   * @param {Piotr.ToolbarComponent} component - The component to add.
   */
  add(component) {
    component.setParent(this);
    this.components.push(component);
    this.dom.appendChild(component.dom);
  }

  /**
   * Updates the state of all components.
   */
  update() {
    for(var i = 0; i < this.components.length; i++) {
      this.components[i].update();
    }
  }
};

module.exports = Toolbar;
