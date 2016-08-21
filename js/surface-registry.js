/**
 * Stores a reference to all the surfaces created in the page (even if their
 * DOM is not live on the page).
 * New surfaces automatically add themselves to this registry.
 *
 * @class
 */
Writer.SurfaceRegistry = class SurfaceRegistry {
  constructor() {
    /**
     * Internal map used for storage.
     *
     * @type {Map}
     */
    this.map = new Map;

    /**
     * Counts the number of surfaces added to the registry.
     * Used for ID generation.
     *
     * @private
     * @type {Number}
     */
    this.idCount = -1;
  }

  /**
   * Adds a surface to the registry and gives it a unique ID (unique on the
   * page).
   *
   * @param {Writer.Surface} surface - The surface to add
   */
  add(surface) {
    this.idCount++;
    surface.setID(this.idCount);
    this.map.set(this.idCount, surface);
  }

  /**
   * Removes a surface from the registry.
   *
   * @param {Number} id - The surface's ID
   * @throws When the surface was not found.
   */
  remove(id) {
    if(!this.map.delete(id))
      throw new Error("Surface with ID "+id+" is not in the registry!");
  }

  /**
   * Retrieves a surface from the registry.
   *
   * @param {Number} id - The surface's ID
   * @throws When the surface was not found.
   * @returns {Writer.Surface} The surface instance.
   */
  get(id) {
    var s = this.map.get(id);
    if(!s)
      throw new Error("Surface with ID "+id+" is not in the registry!");
    return s;
  }
};

/**
 * Global surface registry.
 *
 * @type {Writer.SurfaceRegistry}
 */
Writer.surfaceReg = new Writer.SurfaceRegistry;
