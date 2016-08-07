/**
 * A document model. A document is simply a list of nodes with a title, an
 * author and metadata.
 * It must always be associated to a node registry.
 *
 * @class
 * @param {String} title - The document's title.
 * @param {Writer.NodeRegistry} nodeReg - A node registry.
 */
Writer.Document = class Document {
  constructor(title, nodeReg) {
    /**
     * The document's title, which is not considered as a node.
     *
     * @type {String}
     */
    this.title = title;

    /**
     * The component registry used by the document instance.
     *
     * @type {Writer.NodeRegistry}
     */
    this.nodeReg = nodeReg;

    /**
     * An array of nodes.
     *
     * @type {Node[]}
     */
    this.nodes = [];
  }

  /**
   * Adds a node of a certain type to the document.
   *
   * @param {String} type - The node's type (aka. class ID)
   * @returns {Writer.Node} - The node instance
   */
  add(type) {
    var clazz = this.nodeReg.get(type);
    this.nodes.push(new clazz(this));
  }
};
