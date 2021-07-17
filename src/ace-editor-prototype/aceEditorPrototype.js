import React, { useEffect, useRef, useState } from 'react';
import AceEditor from 'react-ace';
import getSuggests from './autocomplete/suggester/suggests';
import {groupSuggests, sortSuggests, getPrefix, filterSuggests} from './autocomplete/suggester/suggestsUtils'
import Autocompleter from './autocomplete/autocomplete'

// Импортируем тему hive
import './config/theme/theme-hive'
// Импортируем настройку сочетания клавиш
import './config/keybinding/keybinding-hive'
// Импортируем mode (mode отвечает за подсветку синтаксиса)
import './config/mode/mode-hive' 

const AceEditorPrototype = () => {
  const aceEditorRef = useRef();
  const [text,setText] = useState('');
  const [autocomplete, setAutocomplete] = useState({
    open : false,
    position : {
      left : 0,
      top : 0,
    }
  })
  const [suggestNumber,setSuggestNumber] = useState(0)
  const focusOnEditor = () => {
    aceEditorRef.current.editor.focus()
  }
  const blurListener = (e) => {
    if (!e.relatedTarget){
      setAutocomplete((el)=>{return{...el,open:false}})
      dispatch()
      focusOnEditor()  
    } else if (e.relatedTarget.id.startsWith('autocomplete_menu_item_')) {
      let editor = aceEditorRef.current.editor
      let number = e.relatedTarget.id.match(/\d+/)[0]
      insertWord(editor,editor.completers[0][number])
      setSuggestNumber(0)
      focusOnEditor()
    }
  }
  const insertWord = (editor,sugest) => {
    let prefix = getPrefix(editor);
    let ranges = editor.selection.getAllRanges();
    for (let i = 0, range; range = ranges[i]; i++) {
      range.start.column -= prefix.length;
      editor.session.remove(range);
    }
    if (sugest){
      if (sugest.category ==  'JOIN'){
        editor.execCommand("insertstring", sugest.meta.reduce((pr,cr)=>{
          return pr + cr.value
        },""));
      } else if (sugest.category ==  'FUNCTION'){
        editor.execCommand("insertstring", sugest.meta.draggable);
      } else {
        editor.execCommand("insertstring", sugest.value);
      }
    }
    setAutocomplete((pr)=>({...pr,open:false}));
    disableAutocompleteKey(editor); 
  }
  const enableAutocompleteKey = (editor) => {
    //Esc
    editor.commands.commandKeyBinding['esc'] = {
      bindKey: { "mac": "esc", "win": "esc" },
      name: "close_autocomplete",
      exec : (editor)=>{setAutocomplete((pr)=>({...pr,open:false}));disableAutocompleteKey(editor)}
    }
    //Up
    editor.commands.commandKeyBinding['up'] = {
      bindKey: { "mac": "up", "win": "up" },
      name: "up_item_autocomplete",
      exec : (editor)=>{
        if (editor.completers[1] > 0) editor.completers[1] -= 1;
        setSuggestNumber(editor.completers[1])
      }
    }
    //Down
    editor.commands.commandKeyBinding['down'] = {
      bindKey: { "mac": "down", "win": "down" },
      name: "down_item_autocomplete",
      exec : (editor)=>{
        if (editor.completers[1] < editor.completers[0].length - 1 ) editor.completers[1] += 1;
        setSuggestNumber(editor.completers[1])
      }
    }
    //Ctrl-up
    editor.commands.commandKeyBinding['ctrl-up'] = {
      bindKey: { "mac": "Command-Up", "win": "Ctrl-Up" },
      name: "start_item_autocomplete_one",
      exec : (editor)=>{
        editor.completers[1] = 0
        setSuggestNumber(editor.completers[1])
      }
    }
    //ctrl-home
    editor.commands.commandKeyBinding['ctrl-home'] = {
      bindKey: { "mac": "Command-Home", "win": "Ctrl-Home" },
      name: "start_item_autocomplete_two",
      exec : (editor)=>{
        editor.completers[1] = 0
        setSuggestNumber(editor.completers[1])
      }
    }
    //Ctrl-down
    editor.commands.commandKeyBinding['ctrl-down'] = {
      bindKey: { "mac": "Command-Down", "win": "Ctrl-Down" },
      name: "end_item_autocomplete_one",
      exec : (editor)=>{
        editor.completers[1] = editor.completers[0].length - 1
        setSuggestNumber(editor.completers[1])
      }
    }
    //ctrl-end
    editor.commands.commandKeyBinding['ctrl-end'] = {
      bindKey: { "mac": "Command-End", "win": "Ctrl-End" },
      name: "end_item_autocomplete_two",
      exec : (editor)=>{
        editor.completers[1] = editor.completers[0].length - 1
        setSuggestNumber(editor.completers[1])
      }
    }
    // return 
    editor.commands.commandKeyBinding['return'] = {
      bindKey: { "mac": "return", "win": "return" },
      name: "insert_item_autocomplete",
      exec : (editor)=>{
        insertWord(editor,editor.completers[0][editor.completers[1]])
        setSuggestNumber(0)
      }
    }
    // shift-return
    editor.commands.commandKeyBinding['shift-return'] = {
      bindKey: { "mac": "Shift-Return", "win": "Shift-Return" },
      name: "on_new_autocomplete",
      exec : (editor)=>{
        editor.execCommand("insertstring", '\n');
        setAutocomplete((pr)=>({...pr,open:false}));
        disableAutocompleteKey(editor); 
      }
    } 
  }
  const dispatch = () => {
    disableAutocompleteKey(aceEditorRef.current.editor)
  }
  const disableAutocompleteKey = (editor) => {
    delete editor.commands.commandKeyBinding["up"];
    delete editor.commands.commandKeyBinding["down"];
    delete editor.commands.commandKeyBinding["ctrl-up"];
    delete editor.commands.commandKeyBinding["ctrl-home"];
    delete editor.commands.commandKeyBinding["ctrl-down"];
    delete editor.commands.commandKeyBinding["ctrl-end"];
    delete editor.commands.commandKeyBinding["esc"];
    delete editor.commands.commandKeyBinding["return"];
    delete editor.commands.commandKeyBinding["shift-return"];
    if (editor.commands.oldCommandKeyBinding["up"]) editor.commands.commandKeyBinding["up"] = editor.commands.oldCommandKeyBinding["up"]
    if (editor.commands.oldCommandKeyBinding["down"]) editor.commands.commandKeyBinding["down"] = editor.commands.oldCommandKeyBinding["down"]
    if (editor.commands.oldCommandKeyBinding["ctrl-up"]) editor.commands.commandKeyBinding["ctrl-up"] = editor.commands.oldCommandKeyBinding["ctrl-up"]
    if (editor.commands.oldCommandKeyBinding["ctrl-home"]) editor.commands.commandKeyBinding["ctrl-home"] = editor.commands.oldCommandKeyBinding["ctrl-home"]
    if (editor.commands.oldCommandKeyBinding["ctrl-down"]) editor.commands.commandKeyBinding["ctrl-down"] = editor.commands.oldCommandKeyBinding["ctrl-down"]
    if (editor.commands.oldCommandKeyBinding["ctrl-end"]) editor.commands.commandKeyBinding["ctrl-end"] = editor.commands.oldCommandKeyBinding["ctrl-end"]
    if (editor.commands.oldCommandKeyBinding["esc"]) editor.commands.commandKeyBinding["esc"] = editor.commands.oldCommandKeyBinding["esc"]
    if (editor.commands.oldCommandKeyBinding["return"]) editor.commands.commandKeyBinding["return"] = editor.commands.oldCommandKeyBinding["return"]
    if (editor.commands.oldCommandKeyBinding["shift-return"]) editor.commands.commandKeyBinding["shift-return"] = editor.commands.oldCommandKeyBinding["shift-return"]
  }
  useEffect(()=>{
    let editor = aceEditorRef.current.editor;
    // Copy base commands action
    editor.commands.oldCommandKeyBinding = {
      "up" : editor.commands.commandKeyBinding["up"] ? editor.commands.commandKeyBinding["up"] : null,
      "down" : editor.commands.commandKeyBinding["down"] ? editor.commands.commandKeyBinding["down"] : null,
      "ctrl-up" : editor.commands.commandKeyBinding["ctrl-up"] ? editor.commands.commandKeyBinding["ctrl-up"] : null,
      "ctrl-home" : editor.commands.commandKeyBinding["ctrl-home"] ? editor.commands.commandKeyBinding["ctrl-home"] : null,
      "ctrl-down" : editor.commands.commandKeyBinding["ctrl-down"] ? editor.commands.commandKeyBinding["ctrl-down"] : null,
      "ctrl-end" : editor.commands.commandKeyBinding["ctrl-end"] ? editor.commands.commandKeyBinding["ctrl-end"] : null,
      "esc" : editor.commands.commandKeyBinding["esc"] ? editor.commands.commandKeyBinding["esc"] : null,
      "return" : editor.commands.commandKeyBinding["return"] ? editor.commands.commandKeyBinding["return"] : null,
      "shift-return" : editor.commands.commandKeyBinding["shift-return"] ? editor.commands.commandKeyBinding["shift-return"] : null,
    }
    // Enable LiveAutocomplete & UpdateCompleters
    editor.commands.on('afterExec', (e)=>{
      let editor = e.editor;
      // Comands changes text;
      if (e.command.name === "insertstring"){ 
        let editorPosition = window.document.getElementsByClassName('ace_content')[0].getBoundingClientRect()
        let lineHeight = window.document.getElementsByClassName('ace_line')[0].getBoundingClientRect().height;
        let left = editorPosition.x + editor.renderer.$cursorLayer.$pixelPos.left
        let top = editorPosition.y + lineHeight * (editor.getCursorPosition().row + 1);
        editor.completers = [sortSuggests(filterSuggests(editor,(groupSuggests(getSuggests(editor,true))))),0]
        setSuggestNumber(0)
        if (editor.completers[0].length && editor.getCursorPosition().column != 0){
          //Enable close autocomplete event
          editor.on("blur", blurListener);
          //Enable Autocomplete Key
          enableAutocompleteKey(editor);
          //Open menu
          setAutocomplete({
            open : true,
            position : {
              left,
              top
            }
          })
        } else {
          //Disable close autocomplete event
          editor.off("blur", blurListener);
          //Disable Autocomplete Key
          disableAutocompleteKey(editor);
          setAutocomplete({
            open : false,
            position : {
              left,
              top
            }
          })
        } 
      } else if (// Ignore Our Controll menu commands
        e.command.name !== 'close_autocomplete' &&
        e.command.name !== 'up_item_autocomplete' &&
        e.command.name !== 'down_item_autocomplete' &&
        e.command.name !== 'start_item_autocomplete_one' &&
        e.command.name !== 'start_item_autocomplete_two' &&
        e.command.name !== 'end_item_autocomplete_one' &&
        e.command.name !== 'end_item_autocomplete_two' &&
        e.command.name !== 'insert_item_autocomplete' &&
        e.command.name !== 'on_new_autocomplete' &&
        e.command.name !== 'open/close_autocomplete'
      ){
        setAutocomplete((pr) => {
          if (!pr.open){
            return pr
          } else {
            //Disable close autocomplete event
            editor.off("blur", blurListener);
            //Disable Autocomplete Key
            disableAutocompleteKey(editor);
            return({
              open : false,
              position : pr.position,
            })
          }
        })
      }
    });
    // Enable (Open/Close)Autocomplete KeyShortcut
    editor.commands.commandKeyBinding['alt-space'] = {
      bindKey: { "mac": "alt-space", "win": "ctrl-space" },
      name: "open/close_autocomplete",
      exec : (editor)=>{
        let editorPosition = window.document.getElementsByClassName('ace_content')[0].getBoundingClientRect()
        let lineHeight = window.document.getElementsByClassName('ace_line')[0].getBoundingClientRect().height;
        let left = editorPosition.x + editor.renderer.$cursorLayer.$pixelPos.left
        let top = editorPosition.y + lineHeight * (editor.getCursorPosition().row + 1);
        editor.completers = [sortSuggests(filterSuggests(editor,(groupSuggests(getSuggests(editor,true))))),0]
        setSuggestNumber(0)
        setAutocomplete((st)=>{
          if (st.open) {editor.off("blur", blurListener);disableAutocompleteKey(editor);}
          if (!st.open) {editor.on("blur", blurListener);enableAutocompleteKey(editor);}
          return {
            open : !st.open,
            position : {
              left,
              top
            }
          }
        })
      }
    }
    // Init Autocomplete
    let editorPosition = window.document.getElementsByClassName('ace_content')[0].getBoundingClientRect()
    let lineHeight = window.document.getElementsByClassName('ace_line')[0].getBoundingClientRect().height;
    let left = editorPosition.x + editor.renderer.$cursorLayer.$pixelPos.left
    let top = editorPosition.y + lineHeight * (editor.getCursorPosition().row + 1);
    editor.completers = [sortSuggests(groupSuggests(getSuggests(editor,false))),0]
    setSuggestNumber(0)
    setAutocomplete({
      open : false,
      position : {
        left,
        top
      }
    })
  },[])
  return(
    <React.Fragment>
      <AceEditor 
        // Refs
        ref = {aceEditorRef}
        // Styles
        height = '100%'
        width = '100%'
        tabSize = {2}
        fontSize = '18px'
        placeholder = 'Введите запрос или нажмите ctrl + space'
        value={text.data}
        onChange = {(val)=>setText(val)}
        // Theme Config ./config/theme/
        theme = 'hive'
        // Keybynding Config ./config/key-binding
        keyboardHandler = 'keybinding-hive'
        // Mode Config ./config/mode
        mode = 'hive'
        setOptions={{
          enableBasicAutocompletion: true,
          enableLiveAutocompletion: true,
          enableSnippets: false,
        }}
      />
      <Autocompleter 
        open={autocomplete.open}
        position = {autocomplete.position}
        suggests = {aceEditorRef.current ? aceEditorRef.current.editor.completers[0] : null }
        suggestNumber={suggestNumber}
        fucusOnEditor = {focusOnEditor}
      />
    </React.Fragment>
  )
}

export default AceEditorPrototype