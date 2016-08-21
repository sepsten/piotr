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
Writer.TextNode = class TextNode extends Writer.Node {
  constructor() {
    super();

    // !: All handlers are called with the surface as context.
    // Enter handler
    this.behavior["Enter"] = function(e) {
      e.preventDefault();

      var cmd;

      // 1. For any start offset that is not the last possible one: we split
      // the node.
      if(this.selection.startOffset !==
         this.selection.startNode.getLength()) {
        cmd = Writer.Transforms.splitTextNode(
          this,
          this.selection.state.startNode, // start node id
          this.selection.startOffset
        );
      }
      // 2. For the last possible offset: we add a new node.
      else {
        cmd = Writer.CF.insertNode(
          this,
          new Writer.ParagraphNode,
          this.selection.state.startNode + 1
        );
      }

      // 3. Set the selection
      this.selection.set(this.selection.state.startNode + 1, 0);

      return cmd;
    };

    // Backspace handler
    this.behavior["Backspace"] = function(e) {
      // In general, keep default behavior

      if(this.selection.caret && this.selection.startOffset === 0) {
        e.preventDefault();
        if(this.selection.startNode.position !== 0) {
          let cmd;
          let previous = this.nodes[this.selection.startNode.position - 1],
              caretPos = previous.getLength();

          // If the previous node is a text node, merge the two nodes.
          if(previous instanceof Writer.TextNode)
            cmd = Writer.Transforms.mergeTextNodes(this, previous.position);
          // Else we do nothing.

          // Set selection at the point of merging
          this.selection.set(previous.position, caretPos);

          return cmd;
        }
      }
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
   */
  updateModelFromDOM() {
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

    this.surface.history.push(
      Writer.CF.updateNode(this, {text}, rerender)
    );

    if(rerender)
      this.surface.selection.restore();
  }
};

// Inherited from Writer.Node
Writer.TextNode.id = "text";
