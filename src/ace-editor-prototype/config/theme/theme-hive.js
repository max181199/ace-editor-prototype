import * as ace from 'ace-builds'
// Для удобства написания прототипа в 
// webpack config был добавлен правило для расширения .aep.css
// оно позволит считывать css как строку
import styles from './theme-hive.aep.css'
// здесь styles - строка 

ace.define(
  "ace/theme/hive",
  ["require","exports","module","ace/lib/dom"],
  function(require, exports, module) {
  exports.isDark = false;
  exports.cssClass = "ace-hive";
  exports.cssText = styles
  
  var dom = require("../lib/dom");
  dom.importCssString(exports.cssText, exports.cssClass);
  });                
  
(function() {
  ace.require(
    ["ace/theme/hive"],
    function(m) {
      if (typeof module == "object" && typeof exports == "object" && module) {
        module.exports = m; 
      }
    });
 })();
              