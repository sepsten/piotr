var TextNode = require("./text-node"),
    nodeReg = require("./../node-registry");

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
     * The header's level.
     *
     * @type {Number}
     */
    this.level = level;
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
    var h = new HeadingNode(json.level);
    h.updateState(json.state);
    return h;
  }
};

HeadingNode.id = "heading";

// Add to registry
nodeReg.add(HeadingNode);

module.exports = HeadingNode;
