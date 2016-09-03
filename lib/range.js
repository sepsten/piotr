/**
 * A range describes a continuous portion of the document model.
 *
 * @typedef {Object} Writer.Range
 * @property {Number} startNodeIndex - Index of the start node
 * @property {Number} endNodeIndex - Index of the end node
 * @property {Number} startOffset - Offset of the start point in the start node
 * @property {Number} endOffset - Offset of the end point in the end node
 * @property {Writer.Surface} surface - The surface which contains the range
 * @property {Boolean} [caret] - Indicates if the range is collapsed
 */

var Range = {};

/**
 * Returns true if the range is collapsed.
 *
 * @static
 * @param {Writer.Range} r - The range to examine
 * @returns {Boolean}
 */
Range.isCollapsed = function(r) {
    return r.caret || (r.startNodeIndex === r.endNodeIndex &&
      r.startOffset === r.endOffset);
};

/**
 * Returns true if the selection is located exclusively in one node.
 *
 * @static
 * @param {Writer.Range} r - The range to examine
 * @returns {Boolean}
 */
Range.isInSameNode = function(r) {
  return r.startNodeIndex === r.endNodeIndex;
};

/**
 * Returns true if the given node is in the range (even partially).
 *
 * @static
 * @param {Writer.Range} r - The range to examine
 * @param {Number} index - The node's index
 * @returns {Boolean}
 */
Range.containsNode = function(r, index) {
  return index >= r.startNodeIndex && index <= r.endNodeIndex;
};

/**
 * Returns the range's start node instance.
 *
 * @static
 * @param {Writer.Range} r - The range to examine
 * @returns {Writer.Node}
 */
Range.startNode = function(r) {
  return r.surface.nodes[r.startNodeIndex];
};

/**
 * Returns the range's end node instance.
 *
 * @static
 * @param {Writer.Range} r - The range to examine
 * @returns {Writer.Node}
 */
Range.endNode = function(r) {
  return r.surface.nodes[r.endNodeIndex];
};

module.exports = Range;
