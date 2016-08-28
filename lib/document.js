var nodeReg = require("./node-registry");

/**
 * A document model.
 * It has metadata and can extract meaningful information from the sequence of
 * nodes which is its body.
 *
 * @class
 */
class Document {
  constructor() {
    /**
     * An array of nodes.
     *
     * @type {Node[]}
     */
    this.nodes = [];
  }

  /**
   * Makes a JSON object out of the document.
   *
   * @returns {Object}
   */
  toJSON() {
    return {
      nodes: this.nodesToJSON()
    };
  }

  /**
   * Creates an array of its nodes JSON representations.
   *
   * @private
   * @returns {Object[]}
   */
  nodesToJSON() {
    var a = [];
    for(var i = 0; i < this.nodes.length; i++) {
      a.push(this.nodes[i].toJSON());
    }

    return a;
  }

  /**
   * Instantiates a document from its JSON representation.
   *
   * @static
   * @param {Object} json - The document's JSON representation
   * @returns {Writer.Document}
   */
  static fromJSON(json) {
    // Checks
    if(!json.hasOwnProperty("nodes"))
      throw new Error("A `nodes` property is required.");
    if(typeof json.nodes !== "array" && !(json.nodes instanceof Array))
      throw new Error("The `nodes` property must be an array.");

    var doc = new Document;
    for(var i = 0; i < json.nodes.length; i++) {
      let clazz = nodeReg.get(json.nodes[i].type);
      doc.nodes[i] = clazz.fromJSON(json.nodes[i]);
    }

    return doc;
  }
};

module.exports = Document;
