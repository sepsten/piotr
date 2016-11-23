var TextNode = require("./text-node"),
    ParagraphNode = require("./paragraph-node"),
    nodeReg = require("./../node-registry"),
    shortid = require("shortid");

/**
 * Wrapper-node for heading tags like `<h1>`, `<h2>`, etc.
 * Does not support mark up yet.
 *
 * @class
 * @param {Number} level - The header's level, from 1 to 6.
 */
class HeadingNode extends TextNode {
  constructor(level) {
    super();

    /**
     * The header's level. From 1 to 6.
     *
     * @type {Number}
     */
    this.level = level;

    // From TextNode
    this.nextNodeConstructor = ParagraphNode;
  }

  // From TextNode
  getTagName() {
    return "h"+this.level;
  }

  // From TextNode
  clone() {
    return new HeadingNode(this.level);
  }

  // From Node
  toJSON() {
    var o = super.toJSON();
    o.level = this.level;
    return o;
  }

  // From Node
  static fromJSON(json) {
    var h = super.fromJSON(json);
    h.level = json.level;
    return h;
  }
};

HeadingNode.id = "heading";

// Add to registry
nodeReg.add(HeadingNode);

module.exports = HeadingNode;
