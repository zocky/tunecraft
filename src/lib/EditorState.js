
import { action, observable, computed, makeObservable, flow, reaction, when, autorun } from "mobx";
import { debounce, storageGet } from "./utils";
import { tokenizer } from "./tunecraft/tunecraft.monarch"

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
      insertText: name
    }))

    monaco.languages.registerCompletionItemProvider('tunecraft', {
      provideCompletionItems: function (model, position) {
        // find out if we are completing a property in the 'dependencies' object.
        var textUntilPosition = model.getValueInRange({
          startLineNumber: 1,
          startColumn: 1,
          endLineNumber:
            position.lineNumber,
          endColumn: position.column
        });
        var match = textUntilPosition.match(/"\w*$/);
        if (!match) return { suggestions: [] };
        var word = model.getWordUntilPosition(position);
        var range = {
          startLineNumber: position.lineNumber,
          endLineNumber: position.lineNumber,
          startColumn: word.startColumn,
          endColumn: word.endColumn
        };
        return {
          suggestions: instrumentSuggestions.map(s => ({ ...s, range }))
        };
      },
      triggerCharacters: ['"']
    });
  }

  @action.bound
  didMount(editor, monaco) {
    //console.log('did mount',editor)
    this.instance = editor;
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
      run: function (ed) {
        app.player.toggle();
        return null;
      }
    });
  }

  onChange = debounce(action(value => {
    app.source = value
  }), 300)


  decorations = []

  clearMarkers() {
    if (!this.instance) return;
    this.instanceDecorations = this.instance.deltaDecorations(this.decorations, []);
    this.monaco?.editor.setModelMarkers(this.instance.getModel(), "tunecraft", []);
  }

  setErrorMarkers(error) {
    if (!this.instance) return;
    this.decorations = this.instance.deltaDecorations(this.decorations, [{
      range: this.range(error.location),
      options: {
        isWholeLine: false,
        inlineClassName: "tc error inline",
        marginClassName: "tc error margin",
      },
    }]);

    this.monaco.editor.setModelMarkers(this.instance.getModel(), "tunecraft", [
      {
        ...this.rangeProps(error.location),
        owner: "tc",
        code: "?Syntax error",
        message: error?.message,
        severity: 8,
      },
    ]);
  }

  range({ start, end }) {
    return new monaco.Range(
      start.line, start.column,
      end.line, end.column
    )
  }

  rangeProps({ start, end }) {
    return {
      startLineNumber: start.line,
      startColumn: start.column,
      endLineNumber: end.line,
      endColumn: end.column,
    }
  }

  get value() {
    return this.instance.getModel().getValue();
  }
  set value(code) {
    return this.instance.getModel().setValue(code);
  }

  @observable tabs = [];
  @observable activeTab = null;

  @action.bound
  openTab(filename, source) {
    const tab = this.tabs[filename] = new EditorTabState(this, filename, source);
    this.tabs.push(tab);
    this.activateTab(tab);
  }

  @action.bound
  closeTab(tab) {
    this.tabs = this.tabs.filter(t => t != tab);
  }

  @action.bound
  activateTab(tab) {
    if (this.activeTab) this.activeTab.save();
    tab.restore();
    this.activeTab = tab;
  }

  isTabActive(tab) {
    return tab === this.activeTab;
  }

  autoload() {
    const stored = storageGet('tunecraft_tabs',null);
    if (!stored) {
      this.openTab('tune',"// type your music here");
      return;
    }
    let {active,tabs} = stored;
    for (const id of tabs) {
      const source = storageGet('tunecraft_tab_'+id,"");
    }
  }
}

class EditorTabState {
  @observable filename = "tune";

  constructor(editor, filename, source) {
    this.editor = editor;
    this.filename = filename;
    this.model = this.editor.instance.createModel(source, 'tunecraft');
  }

  get value() {
    return this.getModel().getValue();
  }
  set value(code) {
    return this.getModel().setValue(code);
  }

  save() {
    this.viewState = this.editor.instance.saveViewState();
  }

  restore() {
    this.editor.instance.setModel(this.model);
    if (this.viewState) this.editor.instance.restoreViewState(this.viewState);
  }

  close() {
    this.editor.closeTab(this);
  }
  activate() {
    this.editor.activateTab(this);
  }
  isActive() {
    return this.editor.isTabActive(this);
  }
}