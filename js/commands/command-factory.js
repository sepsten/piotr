/**
 * A reified operation that can be executed and canceled.
 * The `cancel()` method presupposes that at the moment of its execution, the
 * state of the object the command modifies is the same as directly after the
 * execution of `execute()`. The `History` instance is in charge of this.
 *
 * @typedef {Object} Writer.Command
 * @property {String} type - The command type
 * @property {Function} execute - Executes the command
 * @property {Function} cancel - Restores the state prior to the execution
 */

/**
 * `UpdateNode`, `InsertNode` and `RemoveNode` are the the only three commands
 * that can modify the model. Every other command is built out of these.
 * For the sake of simplicity, each command is executed  when it is created:
 * this way, when creating a sequence of commands, there is no need to worry
 * about the proper way of retrieving state at the moment of execution in
 * dedicated functions, etc.
 */
Writer.CommandFactory = Writer.CF = {
  /**
   * Makes one command out of a number of them.
   *
   * @param {Writer.Command[]} cmds... - The commands to compose
   * @returns {Writer.Command} A composed command
   */
  compose(...cmds) {
    return {
      type: "Compound",
      commands: cmds,
      execute() {
        for(var i = 0; i < cmds.length; i++) {
          cmds[i].execute();
        }
      },

      cancel() {
        // Cancel them in reverse order
        for(var i = cmds.length - 1; i >= 0; i--) {
          cmds[i].cancel();
        }
      }
    };
  },

  /**
   * Makes one command out of a number of them (in an array).
   *
   * @param {Writer.Command[]} cmds - The commands to compose
   * @returns {Writer.Command} A composed command
   */
  composeArray(cmds) {
    return Writer.CF.compose.apply(null, cmds);
  },

  /**
   * Creates a new `UpdateNode` command.
   * It supports partial updates (with only a subset of the state's properties).
   * Cancellation always triggers a re-rendering.
   *
   * @param {Writer.Node} node - The node to update.
   * @param {Object} update - A set of properties to update.
   * @param {Boolean} [rerender=true] - If true, the execution will trigger a
   * re-rendering.
   * @returns {Writer.Command}
   */
  updateNode(node, update, rerender=true) {
    var cmd = {
      type: "UpdateNode",
      execute() {
        // Save a copy of the old state
        this.oldState = Object.assign({}, node.state);

        // Update the state and
        Object.assign(node.state, update);
        if(rerender) node.render();
      },

      cancel() {
        node.state = this.oldState;
        node.render();
      }
    };

    cmd.execute();
    return cmd;
  },

  /**
   * Creates a new `InsertNode` command.
   *
   * @param {Writer.Surface} surface - The surface in which the node will be
   * inserted.
   * @param {Writer.Node} node - The node to insert.
   * @param {Number} pos - The position at which it will be inserted.
   * @returns {Writer.Command}
   */
  insertNode(surface, node, pos) {
    var cmd = {
      type: "InsertNode",
      execute() {
        surface.insertNode(node, pos);
      },

      cancel() {
        surface.removeNode(pos);
      }
    };

    cmd.execute();
    return cmd;
  },

  /**
   * Creates a new `RemoveNode` command.
   *
   * @param {Writer.Surface} surface - The surface from which the node will be
   * removed.
   * @param {Number} id - The node's ID.
   * @returns {Writer.Command}
   */
  removeNode(surface, id) {
    var node = surface.nodes[id];

    var cmd = {
      type: "RemoveNode",
      execute() {
        surface.removeNode(id);
      },

      cancel() {
        surface.insertNode(node, id);
      }
    };

    cmd.execute();
    return cmd;
  }
};
