composition = statements:statements { return {
  $:'composition',
  sub:statements,
  throw: error
}}


statements = _ h:statement? t:_statement* _ { 
  return [h].concat(t).filter(Boolean)
}

_statement = CR e:statement { return e }
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

bars = "[" _ h:bar t:_bar* _ "]" { return {$:'bars',sub:[h].concat(t), location:location() } }

bar = bars/repeat_bars/seq_bar/"" { return {$:'bar',sub:[]}}

seq_bar = seq:seq {
  return {...seq,$:'bar'}
}

repeat_bars 
= times:TIMES _ arg:bars {
	return {
    $:'repeat_bars',
    times:+times,
    arg,
    location: location()
  }
}

_bar = _ "|" _ e:bar { return e }
seq = h:seq2 t:_seq2* { return t.length ? {$:'seq',sub:[h].concat(t)} : h }

_seq2 = _ ";" _ e:seq2 { return e }
seq2 = h:expr t:_expr* { return {$:'seq',sub:[h].concat(t)} }

_expr = __ e:expr { return e }
expr = track/signature/tempo/velocity/key/shift/repeat/poly

repeat
= times:TIMES _ arg:poly {
	return {
    $:'repeat',
    times:+times,
    arg,
    location: location()
  }
}


tempo
= "T" tempo:$([0-9][0-9][0-9]?) {
	return {
    $:"tempo",
    tempo:+tempo,
    location: location()
  }
}

velocity
= "V" velocity:$([0-9][0-9]?[0-9]?) {
	return {
    $:"velocity",
    velocity:+velocity,
    location: location()
  }
}

track
= '"' track:$([^"]+) '"' {
	return {
    $:"track",
    track,
    location: location()
  }
}

key = o:octave note:KEY t:accidental mode:keymode {
  var trans = o *12 +t;
  return {
    $: 'key', 
    transpose: trans,
    note,
    mode: mode || 1,
    location: location()
  };
}

shift = o:octave note:ROMAN t:accidental mode:keymode {
  var trans =o*12+t;
  return {
    $: 'shift',
    transpose: trans,
    note,
    mode,
    location: location()
  };
}

keymode 
= "m" { return 6 }
/ "(" m:ROMAN ")" { return m }
/ "" {return}

KEY 
= "C" { return 1 } 
/ "D" { return 2 } 
/ "E" { return 3 } 
/ "F" { return 4 } 
/ "G" { return 5 } 
/ "A" { return 6 } 
/ "B" { return 7 } 


ROMAN 
= "III" { return 3 }
/ "II" { return 2 }
/ "IV" { return 4 }
/ "I" { return 1 }
/ "VII" { return 7 }
/ "VI" { return 6 }
/ "V" { return 5 }



poly = h:poly2 t:_poly2* { if(!t.length) return h; return {$:'poly',sub:[h].concat(t)}}
_poly2 = _ "&" _ p:poly2 { return p}
poly2 = dotted


dotted
= arg:length length:DOTTED {
  return {
  	$:'length',
    arg,
    length,
    location:location() 
  };
} / length

length 
= arg:transpose length:LENGTH {
  return {
  	$:'length',
    arg,
    length,
    location:location() 
  };
} / transpose



transpose = m:octave arg:atom n:accidental {
  if (!m && !n) return arg;
  var t = m*12+n;
  return { 
  	$:'transpose', 
    transpose:t, 
    arg,
    location:location()
  };
}

signature = nom:$([0-9] [0-9]?) "/" denom:$("1"/"2"/"4"/"8"/"16"/"32"/"64"/"128") {
  return {
    $: 'signature',
    nom: +nom,
    denom: denom,
    location: location()
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

var "macro expansion" = "$" i:ident !(_ "=") { return {
  $:'var',
  name:i,
  location:location()
}}

brackets = "(" _ s:seq _ ")" {return {
	$:'brackets',
    arg:s,
    location:location()
}}
note "note" = n:$[a-g] { return {
  $:'note',
  note:'cdefgab'.indexOf(n)+1,
  location:location()
}} 

tone "tone" = n:$[1-7] { return {
  $:'tone',
  tone:+n,
  location:location()
}}  
pause "pause" = ("p"/"0") { return {
  $:'pause',
  location:location()
}}

ident = $([a-z]i [a-z0-9]i*)

integer = chars:$([0-9]+) { return +chars}

_ident = __ i:ident { return i }


TIMES = times:$([0-9]+) _ [x×] {
  return +times;
}

DOTTED
= m:("."+) { return 2 - 0.5 ** m.length }


LENGTH
= m:(":"+) { return 2 ** m.length }
/ m:("'"+) { return 0.5 ** m.length }


WS = _WS/COMMENT2
WS2 = _WS2/COMMENT1/COMMENT2
_WS "whitespace" = [ \t\r]
_WS2 "whitespace" = [ \t\r\n]
COMMENT1 = "//" [^\n]*
COMMENT2 = "/*" ("*"!"/"/[^*])* "*/"
EOF "end of file"= !.
_ = (WS2)*
__ = (WS2)+

CR = __