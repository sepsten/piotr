var nodeReg = require("./node-registry"),
    ParagraphNode = require("./nodes/paragraph-node"),
    HeadingNode = require("./nodes/heading-node");

/**
 * A document model.
 * It has metadata and can extract meaningful information from the sequence of
 * nodes which is its body.
 *
 * @class
 * @param {Boolean} init - If true, will initialize the empty document
 */
class Document {
  constructor(init) {
    /**
     * An array of nodes.
     *
     * @type {Node[]}
     */
    this.nodes = [];

    /**
     * The document's title if there is one.
     *
     * @type {String|null}
     */
    this.title = null;

    if(init)
      this.initEmptyDocument();
  }

  /**
   * Initializes an empty document by creating an empty paragraph node.
   */
  initEmptyDocument() {
    this.nodes.push(new ParagraphNode);
  }

  /**
   * Finds the title of the document.
   */
  updateTitle() {
    var t = null;
    for(var i = 0; i < this.nodes.length; i++) {
      let node = this.nodes[i];

      if(node instanceof HeadingNode && node.level === 1) {
        t = node.state.text;
        break;
      }
    }

    this.title = t;
  }

  /**
   * Makes a JSON object out of the document.
   *
   * @returns {Object}
   */
  toJSON() {
    var obj = {
      nodes: Document.nodesToJSON(this.nodes)
    };

    this.updateTitle();
    if(this.title !== null)
      obj.title = this.title;

    return obj;
  }

  /**
   * Creates an array of nodes JSON representations.
   *
   * @param {Node[]}
   * @returns {Object[]}
   */
  static nodesToJSON(nodes) {
    var a = [];
    for(var i = 0; i < nodes.length; i++) {
      a.push(nodes[i].toJSON());
    }

    return a;
  }

  /**
   * Instantiates an arary of nodes from their JSON representation.
   *
   * @param {Object[]}
   * @returns {Node[]}
   */
  static nodesFromJSON(json) {
    var a = [];
    for(var i = 0; i < json.length; i++) {
      let clazz = nodeReg.get(json[i].type);
      a[i] = clazz.fromJSON(json[i]);
    }

    return a;
  }

  /**
   * Instantiates a document from its JSON representation.
   *
   * @static
   * @param {Object} json - The document's JSON representation
   * @returns {Piotr.Document}
   */
  static fromJSON(json) {
    // Checks
    if(!json.hasOwnProperty("nodes"))
      throw new Error("A `nodes` property is required.");
    if(typeof json.nodes !== "array" && !(json.nodes instanceof Array))
      throw new Error("The `nodes` property must be an array.");

    var doc = new Document;
    doc.nodes = Document.nodesFromJSON(json.nodes);
    if(json.title)
      doc.title = json.title;

    return doc;
  }
};

module.exports = Document;
