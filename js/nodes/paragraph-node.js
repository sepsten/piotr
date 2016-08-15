/**
 * Basic paragraph node. Technically a wrapper around the `<p>` tag.
 * Does not support mark up yet.
 *
 * @class
 */
Writer.ParagraphNode = class ParagraphNode extends Writer.TextNode {
  constructor() {
    super();
  }

  getTagName() {
    return "p";
  }
};

Writer.ParagraphNode.id = "paragraph";

// Add to registry
Writer.nodeReg.add(Writer.ParagraphNode);
