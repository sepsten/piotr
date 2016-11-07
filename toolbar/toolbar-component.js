/**
 * Toolbar component class.
 *
 * @class
 */
class ToolbarComponent {
  constructor() {
    /**
     * Reference to the parent toolbar.
     *
     * @type {Piotr.Toolbar}
     */
    this.toolbar = null;
  }

  /**
   * Registers a reference to the parent toolbar. Called by the Toolbar
   * instance.
   *
   * @param {Piotr.Toolbar} toolbar - The parent toolbar instance
   */
  setParent(toolbar) {
    this.toolbar = toolbar;
  }
}

module.exports = ToolbarComponent;
