/**
 * Executes and stores all the commands that modify the editor's model.
 * Allows to cancel and re-execute commands.
 *
 * @class
 */
Writer.History = class History {
  constructor() {
    /**
     * The stack of commands. Lower the index, earlier the command.
     *
     * @private
     * @type {Writer.Command[]}
     */
    this.stack = [];

    /**
     * Points to the last stacked commands.
     *
     * @private
     * @type {Number}
     */
    this.cursor = -1;
  }

  /**
   * Stacks an already-executed command in the history.
   *
   * @param {Writer.Command} cmd - The command to store
   */
  push(cmd) {
    this.cursor++;                      // Move to the next index
    this.stack[this.cursor] = cmd;      // Add the new command
    this.stack.splice(this.cursor + 1); // Erase all subsequent commands
  }

  /**
   * Cancels the last command if possible.
   */
  undo() {
    if(this.canUndo()) {
      this.stack[this.cursor].cancel();
      this.cursor--;
    }
  }

  /**
   * Re-executes the last command if it was canceled.
   */
  redo() {
    if(this.canRedo()) {
      this.cursor++;
      this.stack[this.cursor].execute();
    }
  }

  /**
   * Returns true if it is possible to undo.
   *
   * @returns {Boolean}
   */
  canUndo() {
    return this.cursor >= 0;
  }

  /**
   * Returns true if it is possible to redo.
   *
   * @returns {Boolean}
   */
  canRedo() {
    return this.cursor < (this.stack.length - 1);
  }
};
