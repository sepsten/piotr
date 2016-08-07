/**
 * Registers all available node types.
 *
 * @class
 */
Writer.NodeRegistry = class NodeRegistry extends Writer.Registry {
  constructor() {
    super();
  }

  /**
   * Cannot create new node classes. Don't use this method.
   */
  new() {
    throw new Error("The node registry cannot create new node classes!");
  }

  /**
   * Adds a node class to the registry.
   *
   * @name Writer.NodeRegistry#add
   * @param {Function} nodeClass - The node class to add.
   */

  /**
   * Returns the classe's ID.
   *
   * @private
   * @param {Function} obj - The class to add.
   * @returns {String}
   */
  generateID(obj) {
    return obj.id;
  }
};
