var Transforms = require("./../commands/transforms"),
    TextNode = require("./../nodes/text-node"),
    ParagraphNode = require("./../nodes/paragraph-node"),
    HeadingNode = require("./../nodes/heading-node"),
    Range = require("./../range"),
    ToolbarComponent = require("./toolbar-component");

class HeadingButton extends ToolbarComponent {
  constructor() {
    super();

    /**
     * Contains the actual <button> element.
     *
     * @type {HTMLButtonElement}
     */
    this.dom = document.createElement("button");

    /**
     * The current state's ID.
     *
     * @type {Number}
     */
    this.state = 0;
    this.setState(0);

    /**
     * Reference to the surface in which the current selection sits.
     *
     * @type {Piotr.Surface}
     */
    this.surface = null;
  }

  // From ToolbarComponent
  setParent(toolbar) {
    super.setParent(toolbar);

    var self = this;

    // Subscribe to DOM events
    this.dom.addEventListener("click", function() {
      if(self.state === 0)
        return;

      toolbar.editor.execute(HeadingButton.clickHandler, self.state);
    });

    // Update on selection events
    toolbar.editor.selection.on("update", function() {
      self.update();
    });
  }

  /**
   * Sets the state of the button.
   *
   * @param {Number} state - The state ID
   * @param {Number} level - The header level if the state is HEADER
   */
  setState(state, level) {
    this.state = state;
    switch(state) {
      case 0: // Disabled
        this.dom.disabled = true;
        this.dom.textContent = "H";
        break;
      case 1: // Header
        this.dom.disabled = false;
        this.dom.textContent = "H" + level;
        break;
      case 2: // Other
        this.dom.disabled = false;
        this.dom.textContent = "H";
    }
  }

  /**
   * Updates the button's state.
   */
  update() {
    var sel = this.toolbar.editor.selection.state;

    // Disable the button if selection is outside the editor
    if(!sel.inside)
      return this.setState(0);

    var surface = sel.surface;

    // Disable the button if the selection is over multiple nodes
    if(!Range.isInSameNode(sel))
      return this.setState(0);

    var node = Range.startNode(sel);

    // If node is not a text node, disable the button
    if(!(node instanceof TextNode))
      return this.setState(0);

    this.surface = surface;

    // Set state accordingly
    if(node instanceof HeadingNode)
      return this.setState(1, node.level);
    else
      return this.setState(2);
  }
}

/**
 * Handler for click events on the button.
 * It is actually the transformation function that is called with the surface
 * as context by the direct handler function.
 *
 * @type {Function}
 * @static
 */
HeadingButton.clickHandler = function(r, state) {
  r.surface.selection.save();
  var cmd,
      node = Range.startNode(r),
      newNode;

  if(state === 1) {
    if(node.level === 6)
      newNode = new ParagraphNode;
    else
      newNode = new HeadingNode(node.level + 1);
  }

  else if(state === 2) {
    newNode = new HeadingNode(1);
  }

  cmd = Transforms.changeTextNodeType(
    r.surface,
    node.position,
    newNode
  );

  r.surface.selection.restore();
  return cmd;
};

/**
 * Useless object that describes the different possible states of the button.
 *
 * @type {Object}
 * @static
 */
HeadingButton.STATES = {
  DISABLED: 0,
  HEADER: 1,
  OTHER: 2
};

module.exports = HeadingButton;
