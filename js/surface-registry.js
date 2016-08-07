/**
 * Stores all the surfaces used by the editor.
 * The constructor instantiates a mother surface (which always has ID 0).
 *
 * @class
 * @extends Writer.Registry
 * @param {Writer.Node[]} nodes - A node list for the mother surface.
 * @param {Element} dom - A DOM node for the mother surface.
 * @param {Writer.History} history - The history that will be used for edits.
 */
Writer.SurfaceRegistry = class SurfaceRegistry extends Writer.Registry {
  constructor(nodes, dom, history) {
    super();

    /**
     * Counts the number of surfaces added to the registry.
     * Used for ID generation.
     *
     * @private
     * @type {Number}
     */
    this.idCount = -1;

    /**
     * Points to the mother surface. Short-cut for `SurfaceRegistry#get(0)`.
     *
     * @type {Surface}
     */
    this.mother = null;

    // Mother surface creation
    this.mother = this.new(nodes, dom, history);
  }

  /**
   * @name Writer.SurfaceRegistry#new
   * @method
   * @param {Node[]} nodes - The node list to edit.
   * @param {HTMLElement} dom - The DOM node which will contain the editor's
   * editing surface.
   * @param {Writer.History} history - The history that will be used for edits.
   * @returns {Writer.Surface} The created surface.
   */

  /**
   * Internal function that generates a new unique ID.
   *
   * @returns {Number} The generated ID.
   */
  generateID() {
    this.idCount++;
    return this.idCount;
  }

  /**
   * Instantiates a new surface and returns it.
   *
   * @returns {Writer.Surface} The generated object.
   */
  generateObject() {
    return new Writer.Surface(...arguments, this.mother);
  }
};
