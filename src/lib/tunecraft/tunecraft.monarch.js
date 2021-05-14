// Difficulty: "Moderate"
// This is the JavaScript tokenizer that is actually used to highlight
// all code in the syntax definition editor and the documentation!
//
// This definition takes special care to highlight regular
// expressions correctly, which is convenient when writing
// syntax highlighter specifications.
export const tokenizer = {
	// Set defaultToken to invalid to see what you do not tokenize yet
	defaultToken: 'invalid',
	tokenPostfix: '.js',



	// we include these common regular expressions
	assign:	/[$][A-Za-z][\w]*\s*=\s*/, 
	var:	/[$][A-Za-z][\w]*/,

	defaultToken: "invalid",

	// The main tokenizer for our languages
	tokenizer: {
		root: [
			//[/[\[\{\(\)\}\]]/, '@brackets'],
			[/\[/, 'delimiter.bars', '@bars'],
			[/\{/, 'delimiter', '@scope'],
			[/\]/, 'invalid'],
			[/\}/, 'invalid'],
			[/@assign/, 'identifier.macro', '@macro_assign'],
			{ include: '@whitespace' },
		],
		scope: [
			[/\}/, 'delimiter', '@pop'],
			{include:'@root'}
		],
		macro_assign: [
			[/\s*\[/, {token:'delimiter.bars', switchTo:'bars'}],
			[/\s*\{/, {token:'delimiter.scrope', switchTo:'scope'}],
			[/[\]\}]/, 'invalid.my'],
			//[/(?=(?:@assign))/, 'identifier', '@pop'],
			[/(?=.)/,{token:'',switchTo:'macro_seq'}]
		],
		macro_seq: [
			[/(?=[\[\{])/, 'delimiter', '@pop'],
			[/(?=(?:@assign))/, 'identifier', '@pop'],
			[/[\]\}]/, 'invalid'],
			{ include: '@seq' }
		],
		bars: [
			[/\[/, 'delimiter.bars', '@bars'],
			[/\]/, 'delimiter.bars', '@pop'],
			{ include: '@seq' }
		],
		seq: [
			[/@var/, 'identifier.macro'],
			// whitespace
			{ include: '@whitespace' },
			[/[|;]/, 'delimiter.bars'],

			[/\d\d?[/]\d\d?/, 'keyword.meta.time'],


			// notes
			[/[-+]*[1-7](?:[#b♭♯]+|\b)/, 'keyword.note.numbered'],
			[/[-+]*[a-g](?:[#b♭♯]+|\b)/, 'keyword.note.named'],
			[/[-+]*[0p](?:[#b♭♯]+|\b)/, 'keyword.note.pause'],
	
			// keys
			[/[-+]*[A-G](?:[#b♭♯]*)(?:m|\(IV|[VI]I?I?\)|\b)/, 'keyword.keys.key'],
			[/[-+]*(?:IV|[VI]I?I?)\b/, 'keyword.keys.shift'],

			//repeat
			[/\d+[×x]/, 'delimiter.bars'],

			[/[VT]\d+/, 'keyword.meta'],

			[/[;:.'&()+\-]/, 'delimiter'],
	
			// strings
			[/"([^"\\]|\\.)*$/, 'invalid'],  // non-teminated string
			[/"/, 'string', '@string_double'],
		],


		whitespace: [
			[/[ \t]+/, ''],
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
			[/"/, 'string', '@pop']
		],


		bracketCounting: [
			[/\{/, 'delimiter.bracket', '@bracketCounting'],
			[/\}/, 'delimiter.bracket', '@pop'],
			[/\[/, 'delimiter.bracket', '@bracketCounting'],
			[/\]/, 'delimiter.bracket', '@pop'],
			[/\(/, 'delimiter.bracket', '@bracketCounting'],
			[/\)/, 'delimiter.bracket', '@pop'],
			//{ include: 'bars' }
		],
	},
};
