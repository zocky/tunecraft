const TPQ = 96;


export function scheduleTree({ tree, tracks, soundfonts, bars, signatures }) {
  const state = {
    measure: 1,
    nom: 4,
    denom: 4,
    bars: [],
    tempo: [],
    tracks: {},
    soundfonts: {},
    factor: 1,
    bar: 0,
    tick: 0,
    ticks: 0,
    scheduleEvent: (track, tick, event, args = {}) => {
      const e = { tick: Math.round(tick), event, ...args }
      state.tracks[track].events.push(e);
      return e;
    },
    setTick(track, t, d = 0) {
      state.tick = t;
      state.ticks = Math.max(state.ticks, Math.round(state.tick + d));
      if (track) state.tracks[track].ticks = Math.max(state.tracks[track].ticks, Math.round(state.tick + d));
    },
    incTick(track, t, d = 0) {
      state.setTick(track, state.tick + t, d);
    },
    getTicks: node => {
      if(!state.barTiming[node.bar]) {
        console.log(node,state.barTiming)
      };
      return node.length / state.factor * state.barTiming[node.bar].ticks;
    },
    barTiming: [],
  }

  let cur = {nom:4, denom:4, tick: 0, ticks: TPQ * 4, measure: 1} ;
    for (let i=0; i<bars; i++) {
    let sig = signatures[i];
    if (sig) {
      const measure = sig.nom / sig.denom;
      const ticks = measure * TPQ * 4;
      const tick = cur.tick;
      cur = { ...sig, tick, measure, ticks }
      state.tempo.push({
        event: 'S',
        tick: cur.tick,
        nom: sig.nom,
        denom: sig.denom
      })
    }
    state.barTiming[i] = {...cur};
    cur.tick += cur.ticks;
  }
  for (const id in tracks) state.tracks[id] = {
    ...tracks[id],
    ticks: 0,
    events: []
  }
  for (const id in soundfonts) state.soundfonts[id] = soundfonts[id];
  schedule(tree, state);

  for (const id in state.tracks) {
    state.tracks[id].events.sort(function (a, b) {
      return a.tick - b.tick;
    })
    state.tracks[id].events.push({
      event: 'EOT',
      tick: state.tracks[id].ticks
    })
  }
  return {
    tempo: state.tempo,
    tracks: state.tracks,
    soundfonts: state.soundfonts,
    tree,
    ticks: state.ticks,
    barTiming: state.barTiming,
    bars,
    signatures,
    TPQ
  };
  return state;
}

function schedule(node, state, extra = null) {
  const old = {};
  for (const i in extra) {
    [old[i], state[i]] = [state[i], extra[i]];
  }
  const scheduler = nodeScheduler[node.$$];
  if (!scheduler) console.log(node);
  scheduler && scheduler(node, state, extra);
  for (const i in old) state[i] = old[i];
}

const nodeScheduler = new class {

  bars(node, state) {
    const factor = state.factor;
    for (const s of node.sub) {
      schedule(s, state, { factor });
    }
  }
  bar(node, state) {
    if (node.divisions > 0) {
      state.scheduleEvent(node.track, state.tick, 'B')
    }
    const factor = state.factor * node.divisions / node.length;
    const measure = node.measure;
    node.sub.forEach(s => schedule(s, state, { factor, measure }));
  }
  seq(node, state) {
    const factor = state.factor * node.divisions / node.length;
    node.sub.forEach(s => schedule(s, state, { factor }));
  }
  poly(node, state) {
    var firstTick = state.tick, lastTick = state.tick;
    node.sub.forEach(function (s) {
      schedule(s, state);
      if (state.tick > lastTick) lastTick = state.tick;
      state.tick = firstTick;
    })
    state.setTick(null, lastTick);
  }
  tempo(node, state) {
    state.tempo.push({
      event: "T",
      tick: Math.round(state.tick),
      tempo: node.tempo
    });
  }
  note(node, state) {
    var ticks = state.getTicks(node);
    if (!ticks) debugger;

    state.scheduleEvent(node.track, state.tick, "N", {
      note: node.note,
      velocity: node.velocity,
      ticks: Math.round(ticks),
      location: node.location,
      bar: node.bar,
      position: node.location.start.offset
    });
    state.scheduleEvent(node.track, state.tick, "ON", {
      velocity: node.velocity,
      note: node.note,
      ticks: Math.round(ticks),
    });
    state.scheduleEvent(node.track, state.tick + ticks, "OFF", {
      velocity: node.velocity,
      note: node.note,
    });
    state.incTick(node.track, ticks);
  }
  pause(node, state) {
    var ticks = state.getTicks(node);
    state.scheduleEvent(node.track, state.tick, "P", {
      ticks: Math.round(ticks),
    });
    state.incTick(node.track, ticks);
  }
}

