Writer.Transforms = {
  /**
   * Splits a text node in two.
   *
   * @param {Writer.Surface} surface - The surface to which the node belongs.
   * @param {Number} nodeid - The node's ID.
   * @param {Number} offset - The offset at which the node will be splitted.
   * @returns {Writer.Command}
   */
  splitTextNode(surface, nodeid, offset) {
    var node = surface.nodes[nodeid],
        newnode = new node.constructor,
        text1 = node.state.text.substring(0, offset),
        text2 = node.state.text.substring(offset);

    newnode.state.text = text2;

    return Writer.CF.compose(
      Writer.CF.updateNode(node, {text: text1}),
      Writer.CF.insertNode(surface, newnode, nodeid + 1)
    );
  },

  /**
   * Removes a slice from a text node.
   * The slice is expressed in offsets (between characters) and not indexes.
   *
   * @param {Writer.TextNode} node - The node to update
   * @param {Number} start - The start offset
   * @param {Number} end - The end offset
   * @returns {Writer.Command}
   */
  removeTextSlice(node, start, end) {
    var text = node.state.text.substring(0, start) +
               node.state.text.substring(end);

    return Writer.CF.updateNode(node, {text});
  },

  /**
   * Simulates backspace behavior on a node: removes a slice of content.
   * Must always result in a text node at the given position.
   *
   * @param {Writer.Surface} surface - The surface to which the node belongs
   * @param {Number} pos - The node's position
   * @param {Number} start - The start offset
   * @param {Number} end - The end offset
   * @returns {Writer.Command}
   */
  backspace(surface, pos, start, end) {
    if(surface.nodes[pos] instanceof Writer.TextNode)
      return Writer.Transforms.removeTextSlice(surface.nodes[pos], start, end);
    else // Isolated node
      return Writer.CF.compose(
        Writer.CF.removeNode(surface, pos),
        Writer.CF.insertNode(surface, new Writer.ParagraphNode, pos)
      );
  },

  /**
   * Merges two text nodes: the given one and the following one.
   * Doesn't perform any checks!
   *
   * @param {Writer.Surface} surface - The surface to which the nodes belong
   * @param {Number} pos - The first node's position
   * @returns {Writer.Command}
   */
  mergeTextNodes(surface, pos) {
    var appendState = surface.nodes[pos + 1].state;
    return Writer.CF.compose(
      Writer.Transforms.appendText(surface.nodes[pos], appendState),
      Writer.CF.removeNode(surface, pos + 1)
    );
  },

  /**
   * Appends a state object to a text node.
   *
   * @param {Writer.TextNode} node - The node to which data will be appended
   * @param {Object} appendState - The data to append
   */
  appendText(node, appendState) {
    var text = node.state.text + appendState.text;
    return Writer.CF.updateNode(node, {text});
  },

  /**
   * Removes a range of nodes.
   *
   * @param {Writer.Surface} surface - The surface in which we will operate
   * @param {Object} range - Range object (similar to a selection state)
   * @param {Number} range.startNode - The start node's index
   * @param {Number} range.startOffset - Offset of the start point
   * @param {Number} range.endNode - The end node's index
   * @param {Number} range.endOffset - Offset of the end point
   * @returns {Writer.Command}
   */
  removeRange(surface, range) {
    var cmds = [],
        endNodeID = range.endNode;

    // 1. Remove nodes from startNode + 1 to endNode - 1
    for(var i = range.startNode + 1; i < range.endNode; i++) {
      // Each time we remove a node, the positions are re-assignated, so we can
      // just delete a certain number of time the node at the same position.
      cmds.push(
        Writer.CF.removeNode(surface, range.startNode + 1)
      );

      endNodeID--;
    }

    // 2. Partial removal or custom behavior for start and end nodes
    if(endNodeID !== range.startNode) {
      cmds.push(Writer.Transforms.backspace(
        surface, range.startNode, range.startOffset,
        surface.nodes[range.startNode].getLength()
      ));

      cmds.push(Writer.Transforms.backspace(
        surface, range.startNode + 1, 0, range.endOffset
      ));

      // 3. Merge the two resulting text nodes
      cmds.push(Writer.Transforms.mergeTextNodes(surface, range.startNode));
    }
    else {
      // 2bis. If the range is in one node, ...
      cmds.push(Writer.Transforms.backspace(
        surface, range.startNode, range.startOffset, range.endOffset
      ));
    }

    return Writer.CF.composeArray(cmds);
  }
};
