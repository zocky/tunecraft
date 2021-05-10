
import { action, observable, computed, makeObservable, flow, reaction, when, autorun } from "mobx";
import { debounce } from "./utils";
import {tokenizer} from "./tunecraft/tunecraft.monarch"

import instrumentNames from "./instruments.json"

export class EditorState {
  app = null;
  @observable monaco = null;
  @observable editor = null;
  @computed get ready() {
    return this.monaco && this.ready;
  }

  constructor(app) {
    this.app = this;
    makeObservable(this);
  }

  @action.bound
  willMount(monaco) {
    if (!monaco) return;
    this.monaco = monaco;
    monaco.languages?.register({ id: 'tunecraft' });
    monaco.languages?.setMonarchTokensProvider('tunecraft', tokenizer);
    const instrumentSuggestions = instrumentNames.map(name => ({
      label: name,
      kind: monaco.languages.CompletionItemKind.Function,
      insertText:name
    }))
    
    monaco.languages.registerCompletionItemProvider('tunecraft', {
    provideCompletionItems: function(model, position) {
        // find out if we are completing a property in the 'dependencies' object.
        var textUntilPosition = model.getValueInRange({
            startLineNumber: 1, 
            startColumn: 1, 
            endLineNumber: 
            position.lineNumber, 
            endColumn: position.column
        });
        var match = textUntilPosition.match(/"\w*$/);
        if(!match) return {suggenstions:[]};
        var word = model.getWordUntilPosition(position);
        var range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn
        };
        return {
            suggestions: instrumentSuggestions.map(s=>({...s,range}))
        };
    },
    triggerCharacters:['"']
  });
}

  @action.bound
  didMount(editor,monaco) {
    //console.log('did mount',editor)
    this.editor = editor;
    editor.addAction({
			id: 'my-play',
			label: 'Play',
			keybindings: [
				monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter
			],
			precondition: null,
			keybindingContext: null,
			contextMenuGroupId: 'transport',
			contextMenuOrder: 1.5,
			run: function(ed) {
				app.player.toggle();
				return null;
			}
		});
  }
  
  onChange = debounce(action(value=>{
    app.source = value
  }),300)


  decorations = []

  clearMarkers() {
    if (!this.editor) return;
    this.editorDecorations = this.editor.deltaDecorations(this.decorations, []);
    this.monaco?.editor.setModelMarkers(this.editor.getModel(), "tunecraft", []);
  }

  setErrorMarkers(error) {
    if (!this.editor) return;
    this.decorations = this.editor.deltaDecorations(this.decorations, [{
      range: this.range(error.location),
      options: {
        isWholeLine: false,
        inlineClassName: "tc error inline",
        marginClassName: "tc error margin",
      },
    }]);

    this.monaco.editor.setModelMarkers(this.editor.getModel(), "tunecraft", [
      {
        ...this.rangeProps(error.location),
        owner: "tc",
        code: "?Syntax error",
        message: error?.message,
        severity: 8,
      },
    ]);
  }

  range({start,end}) {
    return new monaco.Range(
      start.line, start.column,
      end.line, end.column
    )
  }

  rangeProps({start,end}) {
    return {
      startLineNumber: start.line,
      startColumn: start.column,
      endLineNumber: end.line,
      endColumn: end.column,
    }
  }

  get value() {
    return this.editor.getModel().getValue();
  }
  set value(code) {
    return this.editor.getModel().setValue();
  }
}
