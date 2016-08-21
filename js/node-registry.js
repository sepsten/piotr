/**
 * Registers all available node types.
 *
 * @class
 */
Writer.NodeRegistry = class NodeRegistry {
  constructor() {
    /**
     * Internal map used to store everything.
     *
     * @type {Map}
     */
    this.map = new Map;
  }

  /**
   * Adds a node class to the registry.
   *
   * @param {Function} nodeClass - The node class to add.
   */
  add(nodeClass) {
    if(!this.map.has(nodeClass.id))
      this.map.set(nodeClass.id, nodeClass);
    else
      throw new Error("Node class with id `" + nodeClass.id + "` cannot be "
      + "defined twice.");
  }

  /**
   * Returns the class associated to the given ID.
   *
   * @param {String} id - The node class ID
   * @returns {Function} The node class.
   */
  get(id) {
    var r = this.map.get(id);
    if(r)
      return r;
    else
      throw new Error("Node class with id `" + nodeClass.id + "` does not "
      + "exist.");
  }
};

/**
 * The library's global node registry.
 *
 * @type {Writer.NodeRegistry}
 */
Writer.nodeReg = new Writer.NodeRegistry;
