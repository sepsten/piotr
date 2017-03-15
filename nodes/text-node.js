var CF = require("./../commands/command-factory"),
    Transforms = require("./../commands/transforms"),
    Node = require("./node"),
    Range = require("./../range");

/**
 * Describes a node with pure textual content.
 * Each sub-class corresponds to a HTML element like `<p>` or `<blockquote>`.
 * Markup or annotations like bold or italics are not supported.
 *
 * The DOM has two possible states: either the model's textual content is empty
 * and the DOM node contains a single `<br>` or the model's textual content is
 * not empty and the DOM node contains a single text node with the said content.
 *
 * @abstract
 */
class TextNode extends Node {
  constructor() {
    super();

    /**
     * Reference to the constructor of the empty node class that should be
     * inserted after this one on enter.
     *
     * @abstract
     * @type {Function}
     */
    this.nextNodeConstructor = null;

    // !: All handlers are called with the surface as context.
    // Enter handler
    var self = this;
    this.behavior["Enter"] = function(r, e) {
      if(e) e.preventDefault();

      var cmd;

      // 1. For any start offset that is not the last possible one: we split
      // the node.
      if(r.startOffset !== Range.startNode(r).getLength()) {
        cmd = Transforms.splitTextNode(
          r.surface,
          r.startNodeIndex,
          r.startOffset
        );
      }
      // 2. For the last possible offset: we add a new node.
      else {
        cmd = CF.insertNode(
          r.surface,
          new self.nextNodeConstructor,
          r.startNodeIndex + 1
        );
      }

      // 3. Set the selection
      if(e) r.surface.selection.set(r.startNodeIndex + 1, 0);

      return cmd;
    };

    // Backspace handler
    this.behavior["Backspace"] = function(r, e) {
      // In general, keep default behavior

      // If the range is collapsed:
      if(Range.isCollapsed(r)) {
        // If we are directly dealing with the event and the caret is at 0:
        if(r.startOffset === 0 && e) {
          e.preventDefault();

          // If the node isn't the first one in the surface
          if(r.startNodeIndex !== 0) {
            let cmd;
            let previous = r.surface.nodes[r.startNodeIndex - 1],
                caretPos = previous.getLength();

            // If the previous node is a text node, merge the two nodes.
            if(previous instanceof TextNode)
              cmd = Transforms.mergeTextNodes(r.surface, previous.position);
            // Else if the node is empty and the previous one is an isolated n.
            else if(self.getLength() === 0)
              cmd = CF.removeNode(r.surface, r.startNodeIndex);
            // Else we do nothing.

            // Set selection at the point of merging
            r.surface.selection.set(previous.position, caretPos);

            return cmd;
          }
        }
        // Else either we let the native behavior happen, or we just do nothing
      }
      // If we are not dealing directly with the event, simulate the native
      // behavior.
      else if(!e) {
        return Transforms.removeTextSlice(Range.startNode(r), r.startOffset,
          r.endOffset);
      }
    };

    this.behavior["Paste"] = function(r, e) {
      var ParagraphNode = require("./paragraph-node");

      // Preliminary plain-text-only implementation
      if(e) e.preventDefault();

      // Text transformation
      var text = e.clipboardData.getData("text/plain");
      text = text.replace(/\r/g, "\n"); // Replace carriage returns by new lines

      // Split into paragraphs
      var paragraphs = text.split("\n");

      if(paragraphs.length === 0) return;

      var cmds = [];

      // For the last paragraph, just insert it into the current node
      cmds.push(Transforms.insertText(
        self,
        paragraphs[paragraphs.length - 1],
        r.startOffset
      ));

      // For the rest, insert new paragraphs
      for(var i = 0; i < paragraphs.length - 1; i++) {
        let node = new ParagraphNode;
        node.state.text = paragraphs[i];
        cmds.push(CF.insertNode(r.surface, node, r.startNodeIndex+i));
      }

      if(e) {
          // i is now the index of the last paragraph in the array.
          r.surface.selection.set(r.startNodeIndex + i,
            paragraphs[i].length);
      }

      return CF.composeArray(cmds);
    };
  }

  // From Node
  getInitialState() {
    return {
      text: ""
    };
  }

  // From Node
  getLength() {
    return this.state.text.length;
  }

  /**
   * Returns the tag name of the HTML element with which the node will render.
   *
   * @abstract
   * @returns {String}
   */
  getTagName() {
    throw new Error("Not implemented!");
  }

  // From Node
  createDOMRoot() {
    // Returns a new instance of the DOM element set in `TextNode#tagName`.
    var dom = document.createElement(this.getTagName());
    dom.id = this.id;
    // This prevents Firefox from messing with our white-spaces.
    // Plus it is recommended by the W3C (but we apply it onto each individual
    // text node rather than the whole editing host).
    dom.style.whiteSpace = "pre-wrap";
    return dom;
  }

  // From Node
  render() {
    this.clear();
    if(this.state.text === "")
      this.dom.appendChild(document.createElement("br"));
    else
      this.dom.appendChild(document.createTextNode(this.state.text));
  }

  // From Node
  boundaryPointToOffset(destNode, partialOffset) {
    var offset = 0,
        stack = [this.dom];

    while(stack.length > 0) {
      let node = stack.pop();

      if(node === destNode) {
        if(node instanceof Text)
          // With Text nodes, the length prop is equal to the text's length...
          return offset + partialOffset; // ...so we can just return the offset.
        else {
          // Or, if the designated node has children; in this case, its
          // length is equal to its child count and offsets point to
          // these children.

          if(partialOffset === node.childNodes.length)
            // The given offset points to the end of the last child, so we add
            // the node's full text length to our returned offset.
            return offset + node.textContent.length;
          else if(partialOffset === 0)
            // If it points to the very beginning of the first child, we have
            // nothing to add to our offset.
            return offset; // + 0
          else {
            // If the node designated by the given offset is just a random
            // child, we re-set our goal as its offset 0; like that, every one
            // of its previous sibling will be treated normally.
            // However, I don't think this case has ever happened.
            // Firefox only uses boundary points on non-text nodes when the full
            // node is selected, a case which is completely handled by the two
            // previous conditions.
            destNode = destNode.childNodes[partialOffset];
            partialOffset = 0;
          }
        }
      }
      else if(node instanceof Text)
        offset += node.length; // Not found yet; increment the offset, continue.

      // Tree walking logic
      if(node !== this.dom && node.nextSibling)
        // We will go to the next sibling...
        stack.push(node.nextSibling);

      if(node.firstChild)
        // ... but our priority is to go as deep as possible.
        stack.push(node.firstChild);
    }

    throw new Error("Index not found...");
  }

  offsetToBoundaryPoint(offset) {
    // Special case: empty text node
    if(this.getLength() === 0) {
      return [this.dom, 0];
    }

    var tmpOffset = 0,
        stack = [this.dom];

    while(stack.length > 0) {
      let node = stack.pop();

      if(node instanceof Text) {
        if(stack.length === 0 && offset >= tmpOffset &&
           offset <= (tmpOffset + node.length))
          // If the text node is the last possible one the index must be between
          // the text's start and its length (and not its last index which is
          // equal to length - 1 because offsets are between characters
          // positions; thus it can be after the last character.
          return [node, offset - tmpOffset];
        else if(offset >= tmpOffset && offset < (tmpOffset + node.length))
          return [node, offset - tmpOffset];
        else
          tmpOffset += node.length;
      }

      // Tree walking logic
      if(node !== this.dom && node.nextSibling)
        // We will go to the next sibling...
        stack.push(node.nextSibling);

      if(node.firstChild)
        // ... but our priority is to go as deep as possible.
        stack.push(node.firstChild);
    }

    throw new Error("Boundary point not found...");
  }

  /**
   * Forces the selection's anchor and focus to behave visually consistently
   * by reducing the number of possible DOM positions for a given visual
   * position.
   */
  coerceSelection() {
    // Not implemented yet.
  }

  /**
   * Walks the associated DOM tree "left to right": it always goes to the
   * deepest point possible, going from first to last child.
   *
   * @private
   * @param {Function} cb - Called with the current node. If it returns `true`,
   * the loop is stopped.
   */
  walkDOM(cb) {
    if(this.dom.childNodes.length === 0)
      return; // No DOM nodes to explore...

    // We start with the first child node because there is no need to iterate
    // over the root node.
    var stack = [this.dom.childNodes[0]];

    while(stack.length > 0) {
      let node = stack.pop();

      let ret = cb.call(this, node);

      if(ret)
        break;

      // Tree walking logic
      if(node.nextSibling)
        // We will go to the next sibling...
        stack.push(node.nextSibling);

      if(node.firstChild)
        // ... but our priority is to go as deep as possible.
        stack.push(node.firstChild);
    }
  }

  /**
   * A function that "reads" the DOM and translates the changes found in an
   * operation passed to the operation pipeline.
   *
   * @todo Optimize conditions.
   * @returns {Piotr.Command} An update command
   */
  modelUpdateFromDOM() {
    var rerender = false,
        text = "";

    // First possibility: empty node with just a <br>.
    if(this.dom.childNodes.length === 0 ||
       (this.dom.childNodes.length === 1 &&
        this.dom.childNodes[0] instanceof HTMLBRElement))
      text = "";

    // Second possibility: actual new content.
    else {


      this.walkDOM(function(node) {
        if(node instanceof Text) {
          text += node.data;
        }
        else if(node instanceof HTMLBRElement) {
          // We don't want to acknowledge a <br> without anything after it,
          // because that could be the one from the empty node rendering.
          if(node.nextSibling)
            text += "\n";
          else
            // Chrome deletes the placeholder <br> automatically but Firefox
            // doesn't, so we have to trigger a rerender.
            rerender = true;
        } else
          rerender = true; // Invalid nodes trigger re-rendering.
      });
    }

    // We save the selection in case of rerender
    if(rerender)
      this.surface.selection.save();

    var cmd = CF.updateNode(this, {text}, rerender)

    if(rerender)
      this.surface.selection.restore();

    return cmd;
  }

  /**
   * Clones the nodes and its parameters but NOT its state.
   *
   * @returns {TextNode}
   */
  clone() {
    return new this.constructor;
  }
}

module.exports = TextNode;
