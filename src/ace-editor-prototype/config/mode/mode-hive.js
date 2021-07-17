import * as ace from 'ace-builds';

// Загрузим подсветку синтаксиса
import './hive-highlight-rules'
// загрузим mode-text
import './text/mode-text-hive'
// загрузим sqlserver
import './folding/sqlserver'

ace.define(
  "ace/mode/hive",
  [
    "require", "exports", "module",
    "ace/lib/oop", "ace/mode/text_hive", "ace/mode/hive_highlight_rules"
  ],
  function (require, exports, module) {
  //"use strict";

var oop = require("../lib/oop");
var TextMode = require("./text").Mode;
var HiveHighlightRules = require("./hive_highlight_rules").HiveHighlightRules;
var FoldMode = require("./folding/sqlserver").FoldMode;

var Mode = function() {
    this.HighlightRules = HiveHighlightRules;
    this.foldingRules = new FoldMode();
};
oop.inherits(Mode, TextMode);

(function() {
    this.lineCommentStart = "--";
    this.$id = "ace/mode/hive"
    this.snippetFileId = "ace/snippets/hive";

    this.getCompletions = function(state, session, pos, prefix) {
        var keywords = this.$keywordList || this.$createKeywordList();
        return keywords.map(function (word) {
            return {
                ignoreCase: true,
                name: word,
                value: word,
                upperCaseValue: word.toUpperCase(),
                score: 1,
                meta: "keyword"
            };
        });
    };
}).call(Mode.prototype);

exports.Mode = Mode;
});