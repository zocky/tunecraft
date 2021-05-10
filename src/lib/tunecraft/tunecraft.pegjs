composition = _ h:statement t:_statement* _ { return {$:'composition',sub:[h].concat(t)} }

_statement = cr e:statement { return e }
statement = def_soundfont/def_track/scope/bars/assign

def_soundfont = "@soundfont" __ name:ident _ "=" _ url:$([^ \r\n\t]+) {
  return {
  	$: 'def_soundfont',
    name,
    url
  }
}

def_track = "@track" __ id:ident _ "=" _ font:ident _ "/" _ instrument:$([^ \r\n\t]+) adsr:instr_ADSR {
  return {
  	$: 'def_track',
    id,
    font,
    instrument,
    ...adsr
  }
}

instr_ADSR = attack:instr_A? decay:instr_D? sustain:instr_S? release: instr_R? {
	const ret = {};
    if (attack) Object.assign(ret,attack);
    if (decay) Object.assign(ret,decay);
    if (sustain) Object.assign(ret,sustain);
    if (release) Object.assign(ret,release);
    return ret;
} / "" { return {} }

instr_A = [ \t]+ "A" attack:integer { return {attack} }
instr_D = [ \t]+ "D" decay:integer { return {decay} }
instr_S = [ \t]+ "S" sustain:integer { return {sustain} }
instr_R = [ \t]+ "R" release:integer { return {release} }


assign = "$" i:ident _ "=" _ s:(scope/bars/seq) { return {$:'assign',name:i,value:s} }

scope = "{" _ sub:composition _ "}" {
	return {$:'scope',sub}
}

bars = "[" _ h:bar t:_bar* _ "]" { return {$:'bars',sub:[h].concat(t)} }

bar = bars/repeat_bars/seq_bar/"" { return {$:'bar',sub:[]}}

seq_bar = seq:seq {
  return {...seq,$:'bar'}
}

repeat_bars 
= times:$([0-9]+) [x×] _ arg:bars {
	return { $:'repeat',times,arg }
}

_bar = _ "|" _ e:bar { return e }
seq = h:seq2 t:_seq2* { return t.length ? {$:'seq',sub:[h].concat(t)} : h }

_seq2 = _ ";" _ e:seq2 { return e }
seq2 = h:expr t:_expr* { return {$:'seq',sub:[h].concat(t)} }

_expr = __ e:expr { return e }
expr = track/signature/tempo/skip/velocity/key/shift/repeat/poly

repeat
= times:$([0-9]+) [x×] _ arg:poly {
	return { $:'repeat',times,arg }
}

tempo
= "T" tempo:$([0-9][0-9][0-9]?) {
	return {$:"tempo",tempo}
}

velocity
= "V" velocity:$([0-9][0-9]?[0-9]?) {
	return {$:"velocity",velocity:+velocity}
}

skip
= "S" skip:$([0-9][0-9]?[0-9]?) {
	return {$:"skip",skip:+skip}
}


track
= '"' track:$([^"]+) '"' {
	return {$:"track",track}
}

key = o:octave k:$([A-G]) t:accidental m:keymode {
  var trans = 0;
  trans+=o*12+t;
  return {$:'key', transpose:trans, key:k,note:'CDEFGAB'.indexOf(k[0])+1, mode:m||1};
}

shift = o:octave k:shift_key t:accidental m:keymode {
  var trans =o*12+t;
  const {note,mode} = k;
  return {$:'shift', transpose:trans, note, mode:m};
}

shift_key
= note:roman_uc {
	return {note,mode:1}
}
/ note:roman_lc {
	return {note,mode:6}
}

keymode 
= "m" { return 6 }
/ "(" m:roman_uc ")" { return m }
/ "" {return}

letter_uc 
= "C" { return 1 } 
/ "D" { return 2 } 
/ "E" { return 3 } 
/ "F" { return 4 } 
/ "G" { return 5 } 
/ "A" { return 6 } 
/ "B" { return 7 } 


roman_uc 
= "III" { return 3 }
/ "II" { return 2 }
/ "IV" { return 4 }
/ "I" { return 1 }
/ "VII" { return 7 }
/ "VI" { return 6 }
/ "V" { return 5 }

roman_lc 
= "iii" { return 3 }
/ "ii" { return 2 }
/ "iv" { return 4 }
/ "i" { return 1 }
/ "vii" { return 7 }
/ "vi" { return 6 }
/ "v" { return 5 }


poly = h:poly2 t:_poly2* { if(!t.length) return h; return {$:'poly',sub:[h].concat(t)}}
_poly2 = _ "&" _ p:poly2 { return p}
poly2 = dotted


dotted = a:length m:("."+)? {
  if (m && m[0] == ".") return {$:'length', length:2-0.5 ** m.length , arg:a};
  return a;
}

length = a:transpose m:(":"+/"'"+)? {
  if (m && m[0] == ":") return {$:'length', length: 2 ** m.length, arg:a};
  if (m && m[0] == "'") return {$:'length', length: 2 ** -m.length, arg:a}
  return a;
}

transpose = m:octave a:atom n:accidental {
  if (!m && !n) return a;
  var t = m*12+n;
  return {$:'transpose', transpose:t, arg:a};
}

signature = nom:$([0-9] [0-9]?) "/" denom:$("1"/"2"/"4"/"8"/"16"/"32"/"64"/"128") {
  return {
    $: 'signature',
    nom: +nom,
    denom: denom,
  }
}

octave 
= m:"+"+ { return m.length} 
/ m:"-"+ { return -m.length} 
/ "" { return 0 }

accidental
= m:[#♯]+ { return m.length} 
/ m:[b♭]+ { return -m.length} 
/ "" { return 0 }


atom = var/brackets/tone/note/pause

var = "$" i:ident !(_ "=") { return {$:'var',name:i} }

brackets = "(" _ s:seq _ ")" {return {
	$:'brackets',arg:s
}}
note "note" = n:$[a-g] {return {$:'note',note:'cdefgab'.indexOf(n)+1}; }
tone "tone" = n:$[1-7] {return {$:'tone',tone:+n}; }
pause "pause" = ("p"/"0") {return {$:'pause'}; }

ident = $([a-z]i [a-z0-9]i*)

integer = chars:$([0-9]+) { return +chars}

_ident = __ i:ident { return i }

WS = [ \t\r]
WS2 = [ \t\r\n]
comment1 = "//" [^\n]*
comment2 = "/*" ("*"!"/"/[^*])* "*/"
ws "whitespace" = WS/comment2
ws2 "whitespace2" = WS2/comment1/comment2
EOF "end of file" = !.
_ = (ws2)*
__ = (ws2)+

cr = __