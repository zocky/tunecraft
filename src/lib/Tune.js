import { makeObservable, computed, observable } from "mobx";
import { TempoTrack } from "./TempoTrack";
import { Track } from "./Track";

import { findClosest } from "./utils";
import { encode } from "json-midi-encoder";

export class Tune {
  @observable
  tracksById = {};

  @computed({ keepAlive: true })
  get tracks() {
    //console.log('tracks')
    return Object.values(this.tracksById);
  }

  @observable tempoTrack = null;

  timeAtTick(tick) {
    return this.tempoTrack.timeAtTick(tick);
  }

  @computed({ keepAlive: true })
  get events() {
    //console.log('events');
    console.time('events');
    let events = this.tracks
      .flatMap(t => t.events)
      .sort((a, b) => a.tick - b.tick);
    console.timeEnd('events');
    return events;
  }

  @computed({ keepAlive: true })
  get uniqueTimes() {
    let ret = new Set();
    for (const e of this.events) ret.add(e.at);
    return [...ret];
  }

  @computed({ keepAlive: true })
  get _eventsAtOffset() {
    const ret = {};

    for (const e of this.events) {
      if (!e.location) continue;
      let start = ret[e.location.start.offset] ||= [];
      let end = ret[e.location.end.offset] ||= [];
      start.push(e)
      //end.push(e);
    }
    return ret;
  }

  eventsAtOffset(offset) {
    return this._eventsAtOffset[offset] || [];
  }

  eventsBetweenOffsets(start, end) {
    return Object.keys(this._eventsAtOffset)
    .filter(i => i >= start && i <= end)
    .flatMap(i => this._eventsAtOffset[i])
  }

  @observable ticks = 0;

  snapTime(time) {
    return findClosest(time, this.uniqueTimes);
    let mt = 0;
    const { events } = this;
    let lower = 0;
    let upper = events.length;
    let counter = 100;
    while (lower !== upper) {
      if (counter-- < 1) break;
      let mid = Math.floor((lower + upper) / 2);
      mt = events[mid].at;
      if (mt > time) {
        upper = mid;
        continue;
      } else if (mt < time) {
        lower = mid;
        continue;
      }
      break;
    }
    return mt;
  }

  get toMidi() {
    const midi = { division: this.TPQ, format: 1, tracks: [] }
    midi.tracks.push(this.tempoTrack.toMidi);
    for (const track of this.tracks) {
      midi.tracks.push(track.toMidi);
    }
    return midi;
  }

  async toMidiBuffer() {
    
    const buffer = await encode(this.toMidi)
    return buffer;
  }

  @computed get length() {
    return this.tempoTrack.timeAtTick(this.ticks);
  }

  @computed get bars() {
    return this.barTiming.map(b=>{
      return {...b, at:this.tempoTrack.timeAtTick(b.tick)}
    })
  }

  @computed get beats() {
    const ret = [];
    for (const t in this.barTiming) {
      const bar = this.barTiming[t];
      for (let beat = 0; beat<bar.nom; beat++) {
        const tick = bar.tick + bar.ticks / bar.nom * beat;
        ret.push({
          bar: +t,
          beat: beat,
          tick: tick,
          at: this.timeAtTick(tick)
        })
      }
    }
    return ret;
  }

  constructor({ tracks, tempo, barTiming, soundfonts, ticks, TPQ }) {
    makeObservable(this);
    top.tune = this;
    this.ticks = ticks;
    this.soundfonts = { default: "FatBoy", ...soundfonts };
    this.TPQ = TPQ;
    this.tempoTrack = new TempoTrack(this, { events: tempo, TPQ });
    this.barTiming = barTiming;
    let channel = 0;
    for (const id in tracks) {
      if (id === 'percussion') {
        tracks[id].channel = 9;
      } else {
        if (channel%16===9) channel++;
        tracks[id].channel = channel%16;
      }
      channel++;
      
      this.tracksById[id] = new Track(this, tracks[id]);
    }
  }
}