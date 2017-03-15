var CF = require("./command-factory"),
    Range = require("./../range");

/**
 * A collection of useful document model transforms.
 */
var Transforms = {
  /**
   * Changes the type of a text node.
   *
   * @param {Piotr.Surface} surface - The surface containing the node
   * @param {Number} pos - The node's position in the surface
   * @param {Piotr.TextNode} newNode - A new virgin text node
   */
  changeTextNodeType(surface, pos, newNode) {
    Object.assign(newNode.state, surface.nodes[pos].state);

    return CF.compose(
      CF.removeNode(surface, pos),
      CF.insertNode(surface, newNode, pos)
    );
  },

  /**
   * Splits a text node in two.
   *
   * @param {Piotr.Surface} surface - The surface to which the node belongs.
   * @param {Number} nodeid - The node's ID.
   * @param {Number} offset - The offset at which the node will be splitted.
   * @returns {Piotr.Command}
   */
  splitTextNode(surface, nodeid, offset) {
    var node = surface.nodes[nodeid],
        newnode = node.clone(),
        text1 = node.state.text.substring(0, offset),
        text2 = node.state.text.substring(offset);

    newnode.state.text = text2;

    return CF.compose(
      CF.updateNode(node, {text: text1}),
      CF.insertNode(surface, newnode, nodeid + 1)
    );
  },

  /**
   * Removes a slice from a text node.
   * The slice is expressed in offsets (between characters) and not indexes.
   *
   * @param {Piotr.TextNode} node - The node to update
   * @param {Number} start - The start offset
   * @param {Number} end - The end offset
   * @returns {Piotr.Command}
   */
  removeTextSlice(node, start, end) {
    var text = node.state.text.substring(0, start) +
               node.state.text.substring(end);

    return CF.updateNode(node, {text});
  },

  /**
   * Merges two text nodes: the given one and the following one.
   * Doesn't perform any checks!
   *
   * @param {Piotr.Surface} surface - The surface to which the nodes belong
   * @param {Number} pos - The first node's position
   * @returns {Piotr.Command}
   */
  mergeTextNodes(surface, pos) {
    var appendState = surface.nodes[pos + 1].state;
    return CF.compose(
      Transforms.appendText(surface.nodes[pos], appendState),
      CF.removeNode(surface, pos + 1)
    );
  },

  /**
   * Appends a state object to a text node.
   *
   * @param {Piotr.TextNode} node - The node to which data will be appended
   * @param {Object} appendState - The data to append
   */
  appendText(node, appendState) {
    var text = node.state.text + appendState.text;
    return CF.updateNode(node, {text});
  },

  /**
   * Inserts text in a text node.
   *
   * @param {Piotr.TextNode} node - The node to in which text will be inserted
   * @param {String} text - The text to insert
   * @param {Number} offset - The position at which the text will be inserted
   */
  insertText(node, text, offset) {
    var text = node.state.text.slice(0, offset) + text
      + node.state.text.slice(offset);
    return CF.updateNode(node, {text});
  },

  /**
   * Removes a model range of nodes.
   *
   * @param {Piotr.Range} r - The Range object
   * @returns {Piotr.Command}
   */
  removeRange(r) {
    var cmds = [],
        endNodeIndex = r.endNodeIndex;

    // 1. Remove nodes from startNode + 1 to endNode - 1
    for(var i = r.startNodeIndex + 1; i < r.endNodeIndex; i++) {
      // Each time we remove a node, the positions are re-assignated, so we can
      // just delete a certain number of time the node at the same position.
      cmds.push(
        CF.removeNode(r.surface, r.startNodeIndex + 1)
      );

      endNodeIndex--;
    }

    // 2. Partial removal or custom behavior for start and end nodes
    // 2a. If the start and end nodes are different
    if(endNodeIndex !== r.startNodeIndex) {
      // Remove the start node's end portion
      // It will always return a command.
      cmds.push(Range.startNode(r).behavior["Backspace"].call(null, {
        surface: r.surface,
        startNodeIndex: r.startNodeIndex,
        startOffset: r.startOffset,
        endNodeIndex: r.startNodeIndex,
        endOffset: Range.startNode(r).getLength()
      }));

      // Remove the end node's start portion
      let endNodeCmd = r.surface.nodes[endNodeIndex].behavior["Backspace"]
      .call(null, {
        surface: r.surface,
        startNodeIndex: endNodeIndex,
        startOffset: 0,
        endNodeIndex: endNodeIndex,
        endOffset: r.endOffset
      });

      // It may not return a command...
      if(endNodeCmd) cmds.push(endNodeCmd);

      // 3. Merge the two resulting text nodes
      cmds.push(Transforms.mergeTextNodes(r.surface, r.startNodeIndex));
    }

    // 2b. If the range is in one node, ...
    else {
      cmds.push(Range.startNode(r).behavior["Backspace"].call(null, {
        surface: r.surface,
        startNodeIndex: r.startNodeIndex,
        startOffset: r.startOffset,
        endNodeIndex: r.startNodeIndex,
        endOffset: r.endOffset
      }));
    }

    return CF.compose(...cmds);
  }
};

module.exports = Transforms;
