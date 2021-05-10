// Difficulty: "Moderate"
// This is the JavaScript tokenizer that is actually used to highlight
// all code in the syntax definition editor and the documentation!
//
// This definition takes special care to highlight regular
// expressions correctly, which is convenient when writing
// syntax highlighter specifications.
export const tokenizer =  {
	// Set defaultToken to invalid to see what you do not tokenize yet
	defaultToken: 'invalid',
	tokenPostfix: '.js',



	// we include these common regular expressions
	symbols: /[=><!~?:&|+\-*\/\^%]+/,
	escapes: /\\(?:[abfnrtv\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
	digits: /\d+(_+\d+)*/,
	octaldigits: /[0-7]+(_+[0-7]+)*/,
	binarydigits: /[0-1]+(_+[0-1]+)*/,
	hexdigits: /[[0-9a-fA-F]+(_+[0-9a-fA-F]+)*/,

	regexpctl: /[(){}\[\]\$\^|\-*+?\.]/,
	regexpesc: /\\(?:[bBdDfnrstvwWn0\\\/]|@regexpctl|c[A-Z]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4})/,

	// The main tokenizer for our languages
	tokenizer: {
		root: [
			[/[{}]/, 'delimiter.bracket'],
			{ include: 'common' }
		],

		common: [
			// identifiers and keywords
			[/[$][a-z_$][\w$]*/, {
				cases: {
					'@default': 'type.identifier'
				}
			}],
			// whitespace
			{ include: '@whitespace' },

			// delimiters and operators
			[/[()\[\]\{\}]/, '@brackets'],
			

			// notes
			[/[-+]*\b[1-7a-g](?:[#b]+|\b)/, 'keyword'],
			
			// delimiter: after number because of .\d floats
			[/[;:.'& =]/, 'delimiter'],

			// strings
			[/"([^"\\]|\\.)*$/, 'invalid'],  // non-teminated string
			[/"/, 'string', '@string_double'],
		],

		whitespace: [
			[/[ \t\r\n]+/, ''],
			[/\/\*\*(?!\/)/, 'comment.doc', '@jsdoc'],
			[/\/\*/, 'comment', '@comment'],
			[/\/\/.*$/, 'comment'],
		],

		comment: [
			[/[^\/*]+/, 'comment'],
			[/\*\//, 'comment', '@pop'],
			[/[\/*]/, 'comment']
		],

		jsdoc: [
			[/[^\/*]+/, 'comment.doc'],
			[/\*\//, 'comment.doc', '@pop'],
			[/[\/*]/, 'comment.doc']
		],
		string_double: [
			[/[^\\"]+/, 'string'],
			[/@escapes/, 'string.escape'],
			[/\\./, 'string.escape.invalid'],
			[/"/, 'string', '@pop']
		],


		bracketCounting: [
			[/\{/, 'delimiter.bracket', '@bracketCounting'],
			[/\}/, 'delimiter.bracket', '@pop'],
			[/\[/, 'delimiter.bracket', '@bracketCounting'],
			[/\]/, 'delimiter.bracket', '@pop'],
			[/\(/, 'delimiter.bracket', '@bracketCounting'],
			[/\)/, 'delimiter.bracket', '@pop'],
			{ include: 'common' }
		],
	},
};
