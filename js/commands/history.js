/**
 * Executes and stores all the commands that modify the editor's model.
 * Allows to cancel and re-execute commands.
 *
 * @class
 * @param {Writer.Editor} editor - The parent editor
 */
class History {
  constructor(editor) {
    /**
     * Reference to the parent editor.
     *
     * @type {Writer.Editor}
     */
    this.editor = editor;

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
   * @param {Object} sel - The state of selection before command execution
   */
  push(cmd, sel) {
    cmd.selection = sel;
    this.cursor++;                      // Move to the next index
    this.stack[this.cursor] = cmd;      // Add the new command
    this.stack.splice(this.cursor + 1); // Erase all subsequent commands
  }

  /**
   * Cancels the last command if possible and restores the previous state of
   * selection.
   */
  undo() {
    if(this.canUndo()) {
      this.stack[this.cursor].cancel();
      this.editor.selection.set(this.stack[this.cursor].selBefore);
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
      this.editor.selection.set(this.stack[this.cursor].selAfter);
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

module.exports = History;
