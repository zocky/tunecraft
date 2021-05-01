{
  var scales = {
    dur: [0,2,4,5,7,9,11],
    mol: [0,2,4,6,7,9,11],
    1: [0,2,4,5,7,9,11],
    2: [0,2,3,5,7,9,10],
    3: [0,1,3,5,7,8,10],
    4: [0,2,4,6,7,9,11],
    5: [0,2,4,5,7,9,10],
    6: [0,2,3,5,7,8,10],
    7: [0,1,3,5,6,8,10],
  }
  
  var lines = {
      // c  d  e  f  g  a  b
   	C: [ 0, 0, 0, 0, 0, 0, 0], // C
  	G: [ 0, 0, 0, 1, 0, 0, 0], // G
  	D: [ 1, 0, 0, 1, 0, 0, 0], // D
  	A: [ 1, 0, 0, 1, 1, 0, 0], // A
  	E: [ 1, 1, 0, 1, 1, 0, 0], // E
    B: [ 1, 1, 0, 1, 1, 1, 0], // B
 'F#': [ 1, 1, 1, 1, 1, 1, 0], // F#
 'C#': [ 1, 1, 1, 1, 1, 1, 1], // C#
    F: [ 0, 0, 0, 0, 0, 0,-1], // F
 'Bb': [ 0, 0,-1, 0, 0, 0,-1], // Bb
 'Eb': [ 0, 0,-1, 0, 0,-1,-1], // Eb
 'Ab': [ 0,-1,-1, 0, 0,-1,-1], // Ab
 'Db': [ 0,-1,-1, 0,-1,-1,-1], // Db
 'Gb': [-1,-1,-1, 0,-1,-1,-1], // Gb
 'Cb': [-1,-1,-1,-1,-1,-1,-1], // Cb
}
  
  var named = {};
  var soundfonts = {};
  var instruments = {};
  
  function process(node,state) {
    var old;
    if (!state) {
      state = {
        mode:1,
        length: 1,
        base:60,
        keybase:60,
        key:'C',
        transpose: 0,
        tempo: 120,
        velocity: 100,
        instrument:"acoustic_grand_piano"
      }
    }
    switch(node.$) {
    case 'seq':
      var ret = [];
      var sublength = 0;
      node.sub.forEach(function(s) {
        var ss = process(s,state);
        if (!ss) return;
        ret.push(ss);
        sublength += ss.length;
      })
      return {
      	$$:'seq',
        sublength:sublength,
        length:state.length,
        sub: ret,
      };
    case 'repeat':
      var ret = [];
      var sublength = 0;
      let ss = process(node.arg,state);
      for (let i=0; i<node.times; i++) {
        ret.push(ss);
      }
      return {
      	$$:'seq',
        sublength:ss.length*node.times,
        length:state.length*node.times,
        sub: ret,
      };
    case 'bars':
      var ret = [];
      var sublength = 0;
      node.sub.forEach(function(s) {
        var ss = process(s,state);
        if (!ss) return;
        ret.push(ss);
        sublength += ss.length;
      })
      return {
      	$$:'bars',
        sublength:1,
        length:state.length,
        sub: ret,
      };         	   
    case 'poly':
      var ret = [];
      var sublength = 0;
      node.sub.forEach(function(s) {
        var ss = process(s,state);
        if (!ss) return;
        ret.push(ss);
        if (ss.length > sublength) sublength = ss.length;
      })
      return {
      	$$:'poly',
        sublength:sublength,
        length:sublength,
        sub: ret,
      };
	case 'length':
      old = state.length;
 	  state.length *= node.length;
      var ret = process(node.arg,state);
 	  state.length = old;   
      return ret;
    case 'transpose':
      old = state.transpose;
 	  state.transpose += node.transpose;
      var ret= process(node.arg,state);
 	  state.transpose = old;   
      return ret;
    case 'tone':
      var note = scales[state.mode][node.tone-1]
        + state.transpose
        + state.base;
      return {
      	$$: 'note',
        note: note,
        length:state.length,
        tempo: state.tempo,
        instrument: state.instrument,
        velocity: state.velocity
      }
    case 'note':
      var note = scales.dur[node.note-1] +lines[state.key][node.note-1] + 60 + state.transpose;
      return {
      	$$: 'note',
        note: note,
        length:state.length,
        tempo: state.tempo,
        instrument: state.instrument,
        velocity: state.velocity
      }
    case 'pause':
      return {
      	$$: 'pause',
        length:state.length,
        tempo: state.tempo
      }
    case 'skip': 
      return {
      	$$: 'skip',
        length: node.skip,
        tempo: state.tempo
      }
      
    case 'modulation': 
      state.base = scales[state.keymode][node.note-1]+node.transpose+state.keybase;
      state.mode = node.mode;
      return;
    
    case 'key':
      state.base = scales.dur[node.note-1]+node.transpose+60;
      state.keybase = state.base;
      state.key = node.key;
      state.keymode = node.mode;
      state.mode = node.mode;
      return;
    case 'tempo': 
      state.tempo = node.tempo;
      return;
    case 'velocity': 
      state.velocity = node.velocity;
      return;
    case 'scope':
      var old = named;
      named = {...old};
      var ret = process(node.sub,state);
      named = old;
      return ret;
    case 'brackets': 
      var ret = process(node.arg,{...state});
      return ret;
    case 'assign':
      named[node.name]=node.value;
      return;
    case 'var':
      if(!named[node.name]) error('no such var '+node.name);
      return process(named[node.name],state);
    case 'def_soundfont': 
      soundfonts[node.name]=node.url;
      return;
    case 'def_instrument':
      instruments[node.name]={
      	...node
      }
      delete instruments[node.name].$;
      return
      
    case 'instrument': 
      state.instrument = node.instrument;
      if (!instruments[node.instrument]) {
        instruments[node.instrument]={
        	font: 'default',
          id: node.instrument,
        }
      }
      return;
    }
    
  }
  function sched(node,state) {
    var old;
    if (!state) {
      state = {
        ret:[],
        tracks:{},
        at: 0,
        factor: 1,
      }
      for (const id in instruments) state.tracks[id]=[];
    }
    switch(node.$$) {
    case 'bars':
    case 'seq':
      var old = state.factor;
      state.factor *= node.sublength/node.length;
      node.sub.forEach(function(s) {
        sched(s,state);
      })
      state.factor = old;
      break;
    case 'poly':
      var old = state.factor;
      state.factor *= 1; node.sublength;
      var start = state.at, end=state.at;
      node.sub.forEach(function(s) {
        sched(s,state);
        if (state.at > end) end = state.at;
        state.at = start;
      })
      state.at = end;
      state.factor = old;
      break;
    case 'skip':
      state.at-=node.length * 240 / node.tempo;
      break;
    case 'note':
      var t = node.length / state.factor * 240 / node.tempo;
      if (state.at>=0) {
        state.ret.push({at:state.at,event:"ON",note:node.note,duration:t,instrument:node.instrument,velocity:node.velocity});
        state.tracks[node.instrument].push({at:state.at,note:node.note,duration:t,velocity:node.velocity});
        //state.ret.push({at:state.at,event:"OFF",note:node.note,instrument:node.instrument});
      }
      state.at += t;
      break;
    case 'pause':
      var t = node.length / state.factor * 240 / node.tempo;
      state.at += t;
    }
    return state;
  }
  function compile(node) {
    var {ret:events,tracks} = sched(process(node));
    events.sort(function(a,b) {
      return a.at-b.at;
    })
    for (const id in tracks) tracks[id].sort(function(a,b) {
      return a.at-b.at;
    })
    const last = events[events.length-1];
    
    return {
     length:  last ? last.at + last.duration: 0,
     tracks,
     soundfonts,
     instruments,
     events
    };
  }
}

compile = b:composition { return compile(b) }
process = b:composition { return process(b) }

composition = _ h:statement t:_statement* _ { return {$:'poly',sub:[h].concat(t)} }

_statement = cr e:statement { return e }
statement = def_soundfont/def_instrument/scope/bars/assign

def_soundfont = "@soundfont" __ name:ident _ "=" _ url:$([^ \n\t]+) {
  return {
  	$: 'def_soundfont',
    name,
    url
  }
}

def_instrument = "@instrument" __ name:ident _ "=" _ font:ident _ "/" _ id:$([^ \n\t]+) adsr:instr_ADSR {
  return {
  	$: 'def_instrument',
    name,
    font,
    id,
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

bar = bars/repeat_bars/seq

repeat_bars 
= times:$([0-9]+) [x×] _ arg:bars {
	return { $:'repeat',times,arg }
}

_bar = _ "|" _ e:bar { return e }
seq = h:seq2 t:_seq2* { return t.length ? {$:'seq',sub:[h].concat(t)} : h }

_seq2 = _ ";" _ e:seq2 { return e }
seq2 = h:expr t:_expr* { return {$:'seq',sub:[h].concat(t)} }

_expr = __ e:expr { return e }
expr = instrument/tempo/skip/velocity/key/modulation/repeat/poly

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


instrument
= '"' instrument:$([^"]+) '"' {
	return {$:"instrument",instrument}
}

key = o:octave k:$([A-G]) t:accidental m:keymode {
  var trans = 0;
  trans+=o*12+t;
  return {$:'key', transpose:trans, key:k,note:'CDEFGAB'.indexOf(k[0])+1, mode:m||1};
}

modulation = o:octave k:modulation_key t:accidental m:keymode {
  var trans =o*12+t;
  const {note,mode} = k;
  return {$:'modulation', transpose:trans, note, mode:m||note};
}

modulation_key
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
  if (m && m[0] == ".") return {$:'length', length:Math.pow(1.5,m.length), arg:a};
  return a;
}

length = a:transpose m:(":"+/"'"+)? {
  if (m && m[0] == ":") return {$:'length', length:Math.pow(2,m.length), arg:a};
  if (m && m[0] == "'") return {$:'length', length:Math.pow(2,-m.length), arg:a}
  return a;
}

transpose = m:octave a:atom n:accidental {
  if (!m && !n) return a;
  var t = m*12+n;
  return {$:'transpose', transpose:t, arg:a};
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

WS = [ \t]
WS2 = [ \t\n]
comment1 = "//" [^\n]*
comment2 = "/*" ("*"!"/"/[^*])* "*/"
ws "whitespace" = WS/comment2
ws2 "whitespace2" = WS2/comment1/comment2
EOF "end of file" = !.
_ = (ws2)*
__ = (ws2)+

cr = __