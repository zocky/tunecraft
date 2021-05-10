
import React from "react";
import {observer} from "mobx-react";
import {action} from "mobx";
import Monaco from "@monaco-editor/react";
import {debounce} from "../lib/utils";
import "./Editor.less"

export class Editor extends React.Component {
  
  handleEditorWillMount(monaco) {
    if(!monaco) return;
    // here is the monaco instance
    // do something before editor is mounted
    monaco.languages?.register({ id: 'tunecraft' });
    monaco.languages?.setMonarchTokensProvider('tunecraft',tokenizer());
  }

  handleEditorDidMount = (editor, monaco) => {
		const {app} = this.props;
		app.editor = editor;
		app.monaco = monaco;
    // here is another way to get monaco instance
    // you can also store it in `useRef` for further usage
    //  monacoRef.current = editor;
		editor.addAction({
			// An unique identifier of the contributed action.
			id: 'my-play',
		
			// A label of the action that will be presented to the user.
			label: 'Play',
		
			// An optional array of keybindings for the action.
			keybindings: [
				monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter
			],
		
			// A precondition for this action.
			precondition: null,
		
			// A rule to evaluate on top of the precondition in order to dispatch the keybindings.
			keybindingContext: null,
		
			contextMenuGroupId: 'transport',
		
			contextMenuOrder: 1.5,
		
			// Method that will be executed when the action is triggered.
			// @param editor The editor instance is passed in as a convinience
			run: function(ed) {
				app.player.toggle();
				return null;
			}
		});
	 
  }
  render() {
    const {app} = this.props;
    return (
        <Monaco
          height="100%"
          theme="vs-dark"
          defaultValue={app.source}
          defaultLanguage="tunecraft"
          onChange={debounce(action(value=>app.source = value),300)}
          beforeMount={this.handleEditorWillMount}
          onMount={this.handleEditorDidMount}
					options={{minimap:{enabled:false}}}
          />
    )
  }
}

function tokenizer(){ return  {
	keywords: [
		'soundfont', 'instrument'
	],

	verifyKeywords: [
		'requires', 'modifies', 'ensures', 'otherwise', 'satisfies', 'witness', 'invariant',
	],

	typeKeywords: [
		'bool', 'byte', 'char', 'decimal', 'double', 'fixed', 'float',
		'int', 'long', 'object', 'sbyte', 'short', 'string', 'uint', 'ulong',
		'ushort', 'void'
	],

	keywordInType: [
		'struct', 'new', 'where', 'class'
	],

	typeFollows: [
		'as', 'class', 'interface', 'struct', 'enum', 'new', 'where',
		':',
	],

	namespaceFollows: [
		'namespace', 'using',
	],

	operators: [
		'??', '||', '&&', '|', '^', '&', '==', '!=', '<=', '>=', '<<',
		'+', '-', '*', '/', '%', '!', '~', '++', '--', '+=',
		'-=', '*=', '/=', '%=', '&=', '|=', '^=', '<<=', '>>=', '>>', '=>'
	],
	variable: /[$][A-Za-z]\w*/,
	assign: /[$][A-Za-z]\w*\s*=\s*/,

	symbols: /[=><!~?:&|+\-*\/\^%]+/,

	// escape sequences
	escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,

	// The main tokenizer for our languages
	tokenizer: {
		root: [
			[/([@])([a-zA-Z]\w*)/, ['keyword', {
				cases: {
					'@keywords': 'keyword',
					'@default': 'string.invalid'
				}
			}]],
			[/@assign/, 'regexp', '@sequence'],

			// whitespace
			{ include: '@whitespace' },

			/*
			// delimiters and operators
			[/[{}()\[\]]/, '@brackets'],
			[/[<>](?!@symbols)/, '@brackets'],
			[/@symbols/, {
			  cases: {
				'@operators': 'operator',
				'@default': ''
			  }
			}],
	  
			// literal string
			[/@"/, { token: 'string.quote', bracket: '@open', next: '@litstring' }],
	  
			// numbers
			[/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
			[/0[xX][0-9a-fA-F]+/, 'number.hex'],
			[/\d+/, 'number'],
	  
			// delimiter: after number because of .\d floats
			[/[;,.]/, 'delimiter'],
	  
			// strings
			[/"([^"\\]|\\.)*$/, 'string.invalid'],  // non-teminated string
			[/"/, { token: 'string.quote', bracket: '@open', next: '@string' }],
	  
			// characters
			[/'[^\\']'/, 'string'],
			[/(')(@escapes)(')/, ['string', 'string.escape', 'string']],
			[/'/, 'string.invalid']
			*/
		],
		sequence: [
			{ include: '@whitespace' },
			[/(?=@assign)/, '', '@pop'],
			[/["][^"]+["]/,'string'],
			[/@variable/, 'regexp'],
			[/[TV]\d+/, 'keyword'],
			[/[-+]*(?:II?I?|IV|VI?I?|[A-G])([#b]*)/, 'keyword'],
			[/[-+]*[1-7a-g]{2;}[#b]*/, 'invalid'],
			[/[-+]*[1-7a-g][#b]*/, 'string'],
			
		],
		
		comment: [
			[/[^\/*]+/, 'comment'],
			// [/\/\*/,    'comment', '@push' ],    // no nested comments :-(
			["\\*/", 'comment', '@pop'],
			[/[\/*]/, 'comment']
		],
		
		whitespace: [
			[/^[ \t\v\f]*#\w.*$/, 'namespace.cpp'],
			[/[ \t\v\f\r\n]+/, 'white'],
			[/\/\*/, 'comment', '@comment'],
			[/\/\/.*$/, 'comment'],
		],
	},
}}