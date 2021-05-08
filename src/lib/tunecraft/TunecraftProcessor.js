
  var scales = {
    dur: [0,2,4,5,7,9,11],
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

  function scale(note,mode) {
    let rel = note % 12;
    let base = note - rel;
    let ret = [];
    let modeScale = scales[mode]
    for (let i=0; i<7; i++) { ret.push(
      (modeScale[i] + rel ) % 12 + base
    ) }
    return ret.sort();
  }


export function processTree(tree) {
    const state = {
      macros:{},
      tracks : {
        default: {
          "id": "default",
          "font": "default",
          "instrument": "acoustic_grand_piano"
        }
      },
      soundfonts: {},
      mode: 1,
      length: 1,
      base: 60,
      keybase: 60,
      keymode: 1,
      key: 'C',
      nom: 4,
      denom: 4,
      measure: 1,
      transpose: 0,
      tempo: 120,
      velocity: 100,
      track: "default",
      scale: scale(60, 1)
    }
    const tree2 = process(tree,state);
    return {
      tree: tree2,
      tracks: state.tracks,
      soundfonts: state.soundfonts
    }
  }
  
  function process(node, state, extra=null) {
    const old = {};
    for (const i in extra) {
      [old[i],state[i]]=[state[i],extra[i]];
    }
    const ret = nodeProcessor[node.$](node, state,extra);
    for (const i in old) state[i] = old[i];
    return ret; 
  }
  
  const nodeProcessor = new class {
    seq(node, state) {
      let sub = node.sub.map(node => process(node, state)).filter(Boolean);
      let divisions = sub.reduce((a, b) => a + (b.length || 0), 0);
      let { length } = state;
  
      return { $$: 'seq', divisions, length, sub };
    }
  
    bar(node, state) {
      let sub = node.sub.map(node => process(node, state)).filter(Boolean);
      let divisions = sub.reduce((a, b) => a + (b.length || 0), 0);
      let { length, track, measure } = state;
      
      return { $$: 'bar', divisions, length, sub, measure, track };
    }
  
    repeat(node, state) {
      const ret = [];
      const ss = process(node.arg, state);
      for (let i = 0; i < node.times; i++) {
        ret.push(ss);
      }
      return {
        $$: 'seq',
        divisions: ss.length * node.times,
        length: state.length * node.times,
        sub: ret,
      };
    }
  
    bars(node, state) {
      let sub = node.sub.map(node => process(node, state)).filter(Boolean);
      let divisions = 1// sub.reduce((a, b) => a + (b.length || 0), 0);
      let { length } = state;
      return { $$: 'bars', divisions, length, sub };
    }
  
    poly(node, state) {
      let sub = node.sub.map(node => process(node, state)).filter(Boolean);
      let divisions = sub.reduce((a, b) => Math.max(a, b.length || 0), 0);
      let length = divisions;
      return { $$: 'poly', divisions, length, sub };
    }
  
    composition(node, state) {
      let sub = node.sub.map(node => process(node, state)).filter(Boolean);
      let divisions = sub.reduce((a, b) => Math.max(a, b.length || 0), 0);
      let length = divisions;
      return { $$: 'poly', divisions, length, sub };
    }
    length(node, state) {
      return process(node.arg, state,{
        length: state.length * node.length
      });
    }
    transpose(node, state) {
      return process(node.arg, state,{
        transpose: state.transpose + node.transpose
      });
    }
    tone(node, state) {
      let { mode, length, track, velocity, transpose, base } = state;
      let note = base + scales[mode][node.tone - 1] + transpose;
      return { $$: 'note', track, note, length, velocity }
    }
  
    note(node, state) {
      let { length, track, velocity, transpose, scale } = state;
      let note = scale[node.note - 1] + transpose;
      return { $$: 'note', track, note, length, velocity }
    }
  
    pause(node, state) {
      let { length, track } = state;
      return { $$: 'pause', length, track }
    }
  
    shift(node, state) {
      state.base = scales[state.keymode][node.note - 1] + node.transpose + state.keybase;
      state.mode = (state.keymode + node.note + 5) % 7 + 1;
    }
  
    key(node, state) {
      state.base = scales.dur[node.note - 1] + node.transpose + 60;
      state.keybase = state.base;
      state.key = node.key;
      state.keymode = node.mode;
      state.mode = node.mode;
      state.scale = scale(state.base, state.mode)
    }
    tempo(node, state) {
      const { tempo } = node;
      return { $$: 'tempo', tempo }
    }
  
    signature(node, state) {
      const { nom, denom } = node;
      const { track } = state;
      const measure = nom / denom;
      return { $$: 'signature', nom, denom, measure, track }
    }
    velocity(node, state) {
      state.velocity = node.velocity;
    }
    scope(node,state) {
      const {macros} = state;
      state.macros = { ...macros };
      const ret = process(node.sub, state);
      state.macros = macros;
      return ret;    
    }
    brackets(node,state) {
      var ret = process(node.arg, { ...state });
      return ret;
    }
    assign(node,state) {
      state.macros[node.name] = node.value;
    }
    var(node,state) {
      if (!state.macros[node.name]) {
        console.log(node,state)
        error('no such var ' + node.name);
      }
      return process(state.macros[node.name], state);
    }
    def_soundfont(node,state) {
      state.soundfonts[node.name] = node.url;
    }
    def_track(node,state) {
      state.soundfonts[node.name] = node.url;
      state.tracks[node.id] = {
        ...node
      }
      delete state.tracks[node.id].$;
    }
    track(node,state) {
      state.track = node.track;
      if (!state.tracks[node.track]) {
        state.tracks[node.track] = {
          font: 'default',
          id: node.track,
          instrument: node.track
        }
      }
    }
  }
  