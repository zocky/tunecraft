import { makeObservable, computed, observable } from "mobx";
import { TempoTrack } from "./TempoTrack";
import { Track } from "./Track";

import Midi from "jsmidgen";
import { findClosest } from "./utils";

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

  @computed get toMidi() {
    const midi = new Midi.File({ ticks: this.TPQ });
    midi.addTrack(this.tempoTrack.toMidi);
    for (const track of this.tracks) {
      midi.addTrack(track.toMidi);
    }
    return midi;
  }

  @computed get toMidiBuffer() {
    const midi = this.toMidi.toBytes();
    const bytes = new Uint8Array(midi.length);
    for (var i = 0; i < midi.length; i++) {
      bytes[i] = midi.charCodeAt(i);
    }
    return bytes;
  }

  @computed get length() {
    return this.tempoTrack.timeAtTick(this.ticks);
  }

  constructor({ tracks, tempo, length, soundfonts, ticks, TPQ }) {
    makeObservable(this);
    top.tune = this;
    this.ticks = ticks;
    this.soundfonts = { default: "MusyngKite", ...soundfonts };
    this.TPQ = TPQ;
    this.tempoTrack = new TempoTrack(this, { events: tempo, TPQ });

    let channel = 0;
    for (const id in tracks) {
      tracks[id].channel = (channel++) % 16;
      this.tracksById[id] = new Track(this, tracks[id]);
    }
  }
}