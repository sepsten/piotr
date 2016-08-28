var TextNode = require("./text-node"),
    nodeReg = require("./../node-registry");

/**
 * Basic paragraph node. Technically a wrapper around the `<p>` tag.
 * Does not support mark up yet.
 *
 * @class
 */
ParagraphNode = class ParagraphNode extends TextNode {
  constructor() {
    super();
  }

  getTagName() {
    return "p";
  }
};

ParagraphNode.id = "paragraph";

// Add to registry
nodeReg.add(ParagraphNode);

module.exports = ParagraphNode;
