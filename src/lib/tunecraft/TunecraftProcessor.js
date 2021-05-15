
var scales = {
  dur: [0, 2, 4, 5, 7, 9, 11],
  1: [0, 2, 4, 5, 7, 9, 11],
  2: [0, 2, 3, 5, 7, 9, 10],
  3: [0, 1, 3, 5, 7, 8, 10],
  4: [0, 2, 4, 6, 7, 9, 11],
  5: [0, 2, 4, 5, 7, 9, 10],
  6: [0, 2, 3, 5, 7, 8, 10],
  7: [0, 1, 3, 5, 6, 8, 10],
}

var lines = {
  // c  d  e  f  g  a  b
  C: [0, 0, 0, 0, 0, 0, 0], // C
  G: [0, 0, 0, 1, 0, 0, 0], // G
  D: [1, 0, 0, 1, 0, 0, 0], // D
  A: [1, 0, 0, 1, 1, 0, 0], // A
  E: [1, 1, 0, 1, 1, 0, 0], // E
  B: [1, 1, 0, 1, 1, 1, 0], // B
  'F#': [1, 1, 1, 1, 1, 1, 0], // F#
  'C#': [1, 1, 1, 1, 1, 1, 1], // C#
  F: [0, 0, 0, 0, 0, 0, -1], // F
  'Bb': [0, 0, -1, 0, 0, 0, -1], // Bb
  'Eb': [0, 0, -1, 0, 0, -1, -1], // Eb
  'Ab': [0, -1, -1, 0, 0, -1, -1], // Ab
  'Db': [0, -1, -1, 0, -1, -1, -1], // Db
  'Gb': [-1, -1, -1, 0, -1, -1, -1], // Gb
  'Cb': [-1, -1, -1, -1, -1, -1, -1], // Cb
}

function noteScale(note = 60, mode = 1) {
  let rel = note % 12;
  let base = note - rel;

  let ret = [];
  let modeScale = scales[mode]
  for (let i = 0; i < 7; i++) {
    ret.push(
      (modeScale[i] + rel) % 12 + base
    )
  }
  return ret.sort();
}

function toneScale(note = 60, mode = 1) {
  if (!scales[mode]) debugger;
  return scales[mode].map(n => note + n);
  let ret = [];
  let modeScale = scales[mode]
  for (let i = 0; i < 7; i++) {
    ret.push(
      (modeScale[i] + rel) % 12 + base
    )
  }
  return ret.sort();
}


export function processTree(tree) {
  const state = {
    throw: tree.throw,
    macros: {},
    tracks: {
      default: {
        id: "default",
        font: "default",
        instrument: "acoustic_grand_piano"
      }
    },
    _bars: {
      track: 'default',
      noteScale: noteScale(60, 1),
      toneScale: noteScale(60, 1),
      keyToneScale: noteScale(60, 1),
      velocity: 100,
      keymode : 1,
      keybase: 60,
      tempo: 120
    },
    soundfonts: {},
    length: 1,
    nom: 4,
    denom: 4,
    measure: 1,
    transpose: 0,
    tempo: 120,
    signatures:{
      0: {nom: 4, denom: 4}
    },
    advanced: false,
    bar:0,
    bars:0
  }
  const tree2 = process(tree, state);
  return {
    bars: state.bars,
    signatures: state.signatures,
    tree: tree2,
    tracks: state.tracks,
    soundfonts: state.soundfonts
  }
}

function process(node, state, extra = null) {
  const old = {};
  for (const i in extra) {
    [old[i], state[i]] = [state[i], extra[i]];
  }
  if (!nodeProcessor[node.$]) console.error(node, state)
  const ret = nodeProcessor[node.$](node, state, extra);
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
    state.advanced = false;
    let sub = node.sub.map(node => process(node, state)).filter(Boolean);
    let divisions = sub.reduce((a, b) => a + (b.length || 0), 0);
    if (state.advanced) {
      state.bar++;
      state.bars = Math.max(state.bar+1,state.bars)
    }
    state.advanced = false;
    let { length, measure } = state;
    let { track } = state._bars;

    return { $$: 'bar', divisions, length, sub, measure, track };
  }

  repeat_bars(node, state) {
    const ret = [];
    let length = 0;
    for (let i = 0; i < node.times; i++) {
      const ss = process(node.arg, state);
      ret.push(ss);
      length+=ss.length;
    }
    return {
      $$: 'seq',
      divisions: length,
      length: state.length * node.times,
      sub: ret,
    };
    /*

    const sub = [];
    let length = 0;
    for (let i = 0; i < node.times; i++) {
      let ss = sub.push(process(node.arg,state));
      length+=ss.length|0;
    }
    return {
      $$: 'seq',
      divisions: length,
      length: state.length * node.times,
      sub
    };
    */
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
    if (state.advanced) state.throw('Cannot include bars here',node.location);
    const _bars = { ...state._bars };
    const bar = state.bar;
    let sub = node.sub.map(node => process(node, state)).filter(Boolean);
    state._bars = _bars;
    let divisions = 1// sub.reduce((a, b) => a + (b.length || 0), 0);
    let { length } = state;
    return { $$: 'bars', divisions, length, sub, bars: state.bar - bar };
  }

  poly(node, state) {

    // this might not be necessary here, is/should poly (&) even be allowed between bars?
    let bar = state.bar;
    let last = bar;

    let sub = node.sub.map(node => {
      state.bar = bar;
      const ret = process(node, state);
      if (state.bar > last) last = state.bar;
      return ret;
    }).filter(Boolean);
    state.bar = last;

    let divisions = sub.reduce((a, b) => Math.max(a, b.length || 0), 0);
    let length = divisions;
    return { $$: 'poly', divisions, length, sub };
  }

  composition(node, state) {

    let bar = state.bar;
    let last = bar;

    let sub = node.sub.map(node => {
      state.bar = bar;
      const ret = process(node, state);
      if (state.bar > last) last = state.bar;
      return ret;
    }).filter(Boolean);
    state.bar = bar;

    let divisions = sub.reduce((a, b) => Math.max(a, b.length || 0), 0);
    let length = divisions;
    return { $$: 'poly', divisions, length, sub };
  }

  length(node, state) {
    return process(node.arg, state, {
      length: state.length * node.length
    });
  }
  transpose(node, state) {
    return process(node.arg, state, {
      transpose: state.transpose + node.transpose
    });
  }
  tone(node, state) {
    let { length, transpose } = state;
    let { track, velocity, toneScale } = state._bars;
    let { tone, location } = node;
    state.advanced = true;
    //let note = base + scales[mode][tone - 1] + transpose;
    let note = toneScale[tone - 1] + transpose;
    
    return { $$: 'note', track, note, length, velocity, location, bar: state.bar }
  }

  note(node, state) {
    let { length, transpose } = state;
    let { track, velocity, noteScale } = state._bars;
    let { note: _note, location } = node;
    let note = noteScale[_note - 1] + transpose;
    state.advanced = true;
    return { $$: 'note', track, note, length, velocity, location, bar: state.bar }
  }

  pause(node, state) {
    let { length, bar } = state;
    let { track } = state._bars;
    state.advanced = true;
    return { $$: 'pause', length, track, bar }
  }

  shift(node, state) {
    const { keymode, keyToneScale } = state._bars;
    const { note, transpose } = node;
    const base = state._bars.base = keyToneScale[note-1] + transpose;
    const mode = state._bars.mode = (keymode + note + 5) % 7 + 1;
    state._bars.toneScale =toneScale(base,mode);
  }

  key(node, state) {
    const {note,mode,key} = node;
    const base = toneScale(60 + node.transpose)[node.note - 1];
    Object.assign(state._bars, {
      base,
      keybase: base,
      key,
      mode,
      keymode: mode,
      noteScale: noteScale(base, mode),
      toneScale: toneScale(base,mode),
      keyToneScale: toneScale(base,mode),
    })
  }
  tempo(node, state) {
    
    const { tempo } = node;
    return { $$: 'tempo', tempo }
  }

  signature(node, state) {
    const { nom, denom } = node;
    const { signatures, bar, advanced } = state;
    if (advanced) state.throw("Time signature can only be changed at the beginning of a bar", node.location)
    const measure = nom / denom;
    const old = state.signatures[state.bar];
    if (old && (old.nom !== nom && old.denom!=denom )) {
      state.throw("Conflicting time signatures", node.location)
    }
    state._bars.signature = {nom:nom,denom:+denom}
    state.signatures[state.bar] = {nom,denom:+denom}
    return { $$: 'signature', nom, denom, measure, track: state._bars.track }
  }
  velocity(node, state) {
    state._bars.velocity = node.velocity;
  }
  scope(node, state) {
    const { macros } = state;
    state.macros = { ...macros };
    const ret = process(node.sub, state);
    state.macros = macros;
    return ret;
  }
  brackets(node, state) {
    var ret = process(node.arg, { ...state });
    return ret;
  }
  assign(node, state) {
    state.macros[node.name] = node.value;
  }
  var(node, state) {
    if (!state.macros[node.name]) {
      throw { message: 'No such macro ' + node.name, location: node.location };
    }
    return process(state.macros[node.name], state);
  }
  def_soundfont(node, state) {
    state.soundfonts[node.name] = node.url;
  }
  def_track(node, state) {
    state.tracks[node.id] = {
      ...node
    }
    delete state.tracks[node.id].$;
  }
  track(node, state) {
    const { track } = node;
    state._bars.track = node.track;
    if (!state.tracks[node.track]) {
      state.tracks[node.track] = {
        font: 'default',
        id: node.track,
        instrument: node.track
      }
    }
  }
}
