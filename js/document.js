/**
 * A document model. A document is simply a list of nodes with a title, an
 * author and metadata.
 *
 * @class
 */
Writer.Document = class Document {
  constructor() {
    /**
     * An array of nodes.
     *
     * @type {Node[]}
     */
    this.nodes = [];
  }
};
