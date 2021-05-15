
import { action, observable, computed, makeObservable, flow, reaction, when, autorun, toJS } from "mobx";
import { debounce, pitchToText, storageGet, storageSet } from "./utils";
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
    this.app = app;
    makeObservable(this);
  }


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
        ...this.range(error.location),
        owner: "tc",
        code: "?Syntax error",
        message: error?.message,
        severity: 8,
      },
    ]);
  }

  setSelectedMarkers(notes) {
    if (!this.instance) return;
    const deco = notes.map(note => ({
      range: this.range(note.location),
      options: {
        isWholeLine: false,
        inlineClassName: "tc selected inline",
        marginClassName: "tc selected margin",
      }
    }))

    const markers = notes.map(note => ({
      ...this.range(note.location),
      owner: "tc",
      code: "Selected Note",
      message: pitchToText(note.note),
      severity: 4,
    }))

    this.decorations = this.instance.deltaDecorations(this.decorations, deco);
    this.monaco.editor.setModelMarkers(this.instance.getModel(), "tunecraft", markers);

    let last = notes[notes.length - 1];
    if (!last) return;
    this.instance.revealRangeInCenter(this.range(last.location))
  }

  range(first, ...rest) {
    if (typeof first === 'object') {
      const { start, end } = first;
      return new monaco.Range(
        start.line, start.column,
        end.line, end.column
      )
    }
    return new this.monaco.Range(first, ...rest)
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

  autosave() {
    storageSet('tunecraft_tabs')
  }

  autoload() {
    const stored = storageGet('tunecraft_tabs', null);
    if (!stored) {
      this.openTab('tune', "// type your music here");
      return;
    }
    let { active, tabs } = stored;
    for (const id of tabs) {
      const source = storageGet('tunecraft_tab_' + id, "");
    }
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
      provideCompletionItems: (model, position) => {
        // find out if we are completing a property in the 'dependencies' object.
        var textUntilPosition = model.getValueInRange(this.range(
          1, 1,
          position.lineNumber, position.column
        ));
        var match = textUntilPosition.match(/"\w*$/);
        if (!match) return { suggestions: [] };
        var word = model.getWordUntilPosition(position);
        return {
          suggestions: instrumentSuggestions.map(s => ({ ...s, word }))
        };
      },
      triggerCharacters: ['"']
    });


    monaco.editor.defineTheme('myTheme', {
      base: 'vs',
      inherit: true,
      rules: [{
        token: 'invalid.my',
        background: 'ff0000',
        fontStyle:"bold italic"
      },{
        token: 'delimiter.bars',
        foreground: '000000',
        fontStyle:"bold"
      },{
        token: 'keyword.note',
        foreground: '008040',
        fontStyle:"bold"
      },{
        token: 'keyword.keys',
        foreground: '800080',
        fontStyle:"bold"
      },{
        token: 'identifier.macro',
        foreground: '004080',
        fontStyle:"bold",
      },{
        token: 'keyword.meta',
        foreground: '999999',
        fontStyle:"bold",
      },{
        token: 'string',
        foreground: 'c06000',
        fontStyle:"bold italic",
      }
    ],
    });
  }

  @action.bound
  didMount(instance, monaco) {
    //console.log('did mount',editor)
    monaco.editor.setTheme('myTheme');
    this.instance = instance;
    instance.addAction({
      id: 'my-play',
      label: 'Play',
      keybindings: [
        monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter
      ],
      precondition: null,
      keybindingContext: null,
      contextMenuGroupId: 'transport',
      contextMenuOrder: 1.5,
      run: e => {
        const {app} = this;
        app.player.toggle();
        return null;
      }
    });
    instance.addAction({
      id: 'my-highlight',
      label: 'highlight',
      keybindings: [
        monaco.KeyCode.F3
      ],
      precondition: null,
      keybindingContext: null,
      contextMenuGroupId: 'transport',
      contextMenuOrder: 1.5,
        run: action(e => {
          const {app} = this;
          const position = instance.getPosition();
          console.log(position);
        })
    });

    instance.onDidChangeCursorPosition(action(e => {
      const offset = instance.getModel().getOffsetAt(e.position);
      const {app}=this;
      app.highlightedNotes = app.tune.eventsAtOffset(offset).filter(e=>e.event==='N');
      return;
    }));

    instance.onDidChangeCursorSelection(action(e => {
      const start = instance.getModel().getOffsetAt({
        lineNumber: e.selection.startLineNumber,
        column: e.selection.startColumn,
      })
      const end = instance.getModel().getOffsetAt({
        lineNumber: e.selection.endLineNumber,
        column: e.selection.endColumn,
      })
      const {app}=this;
      app.highlightedNotes = app.tune.eventsBetweenOffsets(start,end).filter(e=>e.event==='N');
      return;
    }));

    document.fonts.ready.then(()=> monaco.editor.remeasureFonts());

    autorun(() => this.setSelectedMarkers([this.app.selectedNote].filter(Boolean)))
  }

  onChange = debounce(action(value => {
    this.app.source = value
  }), 300)

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