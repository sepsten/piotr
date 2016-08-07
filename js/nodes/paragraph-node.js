Writer.ParagraphNode = class ParagraphNode extends Writer.TextNode {
  constructor() {
    super();
  }

  getTagName() {
    return "p";
  }
};

Writer.ParagraphNode.id = "p";
