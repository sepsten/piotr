var HButtons = require("./history-buttons"),
    HeadingButton = require("./heading-button"),
    Toolbar = require("./toolbar");

module.exports = {
  Toolbar,
  HeadingButton,
  UndoButton: HButtons.UndoButton,
  RedoButton: HButtons.RedoButton
};
