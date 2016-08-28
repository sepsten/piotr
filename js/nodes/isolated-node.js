var CF = require("./../commands/command-factory"),
    Node = require("./node"),
    ParagraphNode = require("./paragraph-node");

/**
 * A node that does not represent text and whose behavior is isolated from the
 * global textual behavior.
 *
 * @class
 * @abstract
 */
class IsolatedNode extends Node {
  constructor() {
    super();

    this.behavior["Backspace"] = function(e) {
      e.preventDefault();

      // Turn the isolated node into an empty text node.
      var pos = this.selection.state.startNode;
      var cmd = CF.compose(
        CF.removeNode(this, pos),
        CF.insertNode(this, new ParagraphNode, pos)
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

module.exports = IsolatedNode;
