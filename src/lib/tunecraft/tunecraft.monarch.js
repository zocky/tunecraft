export const tokenizer = {
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
}