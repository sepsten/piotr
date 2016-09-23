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

    this.behavior["Backspace"] = function(r, e) {
      if(e) e.preventDefault();

      // Turn the isolated node into an empty text node.
      var pos = r.startNodeIndex;
      var cmd = CF.compose(
        CF.removeNode(r.surface, pos),
        CF.insertNode(r.surface, new ParagraphNode, pos)
      );

      // Place the cursor at the beginning of the new text node
      if(e) r.surface.selection.set(pos, 0);

      return cmd;
    };

    this.behavior["Enter"] = function(r, e) {
      e.preventDefault();
      // We do nothing...
    };
  }

  // From Node
  attach(surface) {
    super.attach(surface);
    this.dom.contentEditable = false;
    this.dom.spellcheck = false;
    this.dom.classList.add("piotr-isolated-node");
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
