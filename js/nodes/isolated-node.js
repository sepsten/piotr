/**
 * A node that does not represent text and whose behavior is isolated from the
 * global textual behavior.
 *
 * @class
 * @abstract
 */
Writer.IsolatedNode = class IsolatedNode extends Writer.Node {
  constructor() {
    super();

    this.behavior["Backspace"] = function(e) {
      e.preventDefault();

      // Turn the isolated node into an empty text node.
      var pos = this.selection.state.startNode;
      var cmd = Writer.CF.compose(
        Writer.CF.removeNode(this, pos),
        Writer.CF.insertNode(this, new Writer.ParagraphNode, pos)
      );

      // Place the cursor at the beginning of the new text node
      this.selection.set(pos, 0);

      return cmd;
    };

    this.behavior["Enter"] = function(e) {
      e.preventDefault();
      // We do nothing...
    };
  }

  // From Node
  selectionStart() {
    this.dom.classList.add("selected");
  }

  // From Node
  selectionEnd() {
    this.dom.classList.remove("selected");
  }

  // From Node
  getLength() {
    return 0;
  }

  // From Node
  boundaryPointToOffset() {
    return 0;
  }

  // From Node
  offsetToBoundaryPoint() {
    return [this.dom, 0];
  }
};
