import * as ace from 'ace-builds';
import keyShortcuts from './key-shortcut.json'
import customCommands from './customCommand'

ace.define(
  "ace/keyboard/keybinding-hive",
  ["require", "exports", "module", "ace/keyboard/hash_handler"],
  function (require, exports, module) {

    var HashHandler = require("../keyboard/hash_handler").HashHandler;

    exports.handler = new HashHandler();

    exports.handler.addCommands([{
      name: "find_all_under",
      exec: customCommands.find_all_under,
      readOnly: true
    }, {
      name: "find_under",
      exec: customCommands.find_under,
      readOnly: true
    }, {
      name: "find_under_prev",
      exec: customCommands.find_under_prev,
      readOnly: true
    }, {
      name: "find_under_expand",
      exec: customCommands.find_under_expand,
      scrollIntoView: "animate",
      readOnly: true
    }, {
      name: "find_under_expand_skip",
      exec: customCommands.find_under_expand_skip,
      scrollIntoView: "animate",
      readOnly: true
    }, {
      name: "delete_to_hard_bol",
      exec: customCommands.delete_to_hard_bol,
      multiSelectAction: "forEach",
      scrollIntoView: "cursor"
    }, {
      name: "delete_to_hard_eol",
      exec: customCommands.delete_to_hard_eol,
      multiSelectAction: "forEach",
      scrollIntoView: "cursor"
    }, {
      name: "moveToWordStartLeft",
      exec: customCommands.moveToWordStartLeft,
      multiSelectAction: "forEach",
      scrollIntoView: "cursor"
    }, {
      name: "moveToWordEndRight",
      exec: customCommands.selectToWordEndRight,
      multiSelectAction: "forEach",
      scrollIntoView: "cursor"
    }, {
      name: "selectToWordStartLeft",
      exec: customCommands.selectToWordStartLeft,
      multiSelectAction: "forEach",
      scrollIntoView: "cursor"
    }, {
      name: "selectToWordEndRight",
      exec: customCommands.selectToWordEndRight,
      multiSelectAction: "forEach",
      scrollIntoView: "cursor"
    }, {
      name: "selectSubWordRight",
      exec: customCommands.selectSubWordRight,
      multiSelectAction: "forEach",
      scrollIntoView: "cursor",
      readOnly: true
    }, {
      name: "selectSubWordLeft",
      exec: customCommands.selectSubWordLeft,
      multiSelectAction: "forEach",
      scrollIntoView: "cursor",
      readOnly: true
    }, {
      name: "moveSubWordRight",
      exec: customCommands.moveSubWordRight,
      multiSelectAction: "forEach",
      scrollIntoView: "cursor",
      readOnly: true
    }, {
      name: "moveSubWordLeft",
      exec: customCommands.moveSubWordLeft,
      multiSelectAction: "forEach",
      scrollIntoView: "cursor",
      readOnly: true
    }]);

    keyShortcuts.forEach(function (binding) {
      var command = exports.handler.commands[binding.name];
      if (command)
        command.bindKey = binding.bindKey;
      exports.handler.bindKey(binding.bindKey, command || binding.name);
    });

  }); (function () {
    ace.require(["ace/keyboard/keybinding-hive"], function (m) {
      if (typeof module === "object" && typeof exports === "object" && module) {
        module.exports = m;
      }
    });
  })();

