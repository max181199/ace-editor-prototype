function moveBySubWords(editor, direction, extend) {
  var selection = editor.selection;
  var row = selection.lead.row;
  var column = selection.lead.column;
  var line = editor.session.getLine(row);

  if (!line[column + direction]) {
    var method = (extend ? "selectWord" : "moveCursorShortWord")
      + (direction === 1 ? "Right" : "Left");
    return editor.selection[method]();
  }
  if (direction === -1) column--;
  while (line[column]) {
    var type = getType(line[column]) + getType(line[column + direction]);
    column += direction;
    if (direction === 1) {
      if (type === "WW" && getType(line[column + 1]) === "w")
        break;
    }
    else {
      if (type === "wW") {
        if (getType(line[column - 1]) === "W") {
          column -= 1;
          break;
        } else {
          continue;
        }
      }
      if (type === "Ww")
        break;
    }
    if (/w[s_oW]|_[sWo]|o[s_wW]|s[W]|W[so]/.test(type))
      break;
  }
  if (direction === -1) column++;
  if (extend)
    editor.selection.moveCursorTo(row, column);
  else
    editor.selection.moveTo(row, column);

  function getType(x) {
    if (!x) return "-";
    if (/\s/.test(x)) return "s";
    if (x === "_") return "_";
    if (x.toUpperCase() === x && x.toLowerCase() !== x) return "W";
    if (x.toUpperCase() !== x && x.toLowerCase() === x) return "w";
    return "o";
  }
}

const find_all_under = (editor) => {
  if (editor.selection.isEmpty())
    editor.selection.selectWord();
  editor.findAll();
}

const find_under = (editor) => {
  if (editor.selection.isEmpty())
    editor.selection.selectWord();
  editor.findNext();
}

const find_under_prev = (editor) => {
  if (editor.selection.isEmpty())
    editor.selection.selectWord();
  editor.findPrevious();
}

const find_under_expand = (editor) => {
  editor.selectMore(1, false, true);
}

const find_under_expand_skip = (editor) => {
  editor.selectMore(1, true, true);
}

const delete_to_hard_bol = function (editor) {
  var pos = editor.selection.getCursor();
  editor.session.remove({
    start: { row: pos.row, column: 0 },
    end: pos
  });
}

const delete_to_hard_eol = function (editor) {
  var pos = editor.selection.getCursor();
  editor.session.remove({
    start: pos,
    end: { row: pos.row, column: Infinity }
  });
}

const moveToWordStartLeft = function (editor) {
  editor.selection.moveCursorLongWordLeft();
  editor.clearSelection();
}

const moveToWordEndRight = function (editor) {
  editor.selection.moveCursorLongWordRight();
  editor.clearSelection();
}

const selectToWordStartLeft = function (editor) {
  var sel = editor.selection;
  sel.$moveSelection(sel.moveCursorLongWordLeft);
}

const selectToWordEndRight = function (editor) {
  var sel = editor.selection;
  sel.$moveSelection(sel.moveCursorLongWordRight);
}

const selectSubWordRight = function (editor) {
  moveBySubWords(editor, 1, true);
}

const selectSubWordLeft = function (editor) {
  moveBySubWords(editor, -1, true);
}

const moveSubWordRight = function (editor) {
  moveBySubWords(editor, 1);
}

const moveSubWordLeft = function (editor) {
  moveBySubWords(editor, -1);
}

export default {
  moveBySubWords,
  find_all_under,
  find_under,
  find_under_prev,
  moveSubWordLeft,
  moveSubWordRight,
  selectSubWordLeft,
  selectSubWordRight,
  selectToWordEndRight,
  selectToWordStartLeft,
  moveToWordEndRight,
  moveToWordStartLeft,
  delete_to_hard_eol,
  delete_to_hard_bol,
  find_under_expand,
  find_under_expand_skip,
}