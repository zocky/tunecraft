import { makeObservable, computed, observable } from "mobx";
import { TempoTrack } from "./TempoTrack";
import { Track } from "./Track";

import Midi from "jsmidgen";

export class Tune {
  @observable
  tracksById = {};

  @computed get
    tracks() {
    return Object.values(this.tracksById);
  }

  @observable tempoTrack = null;

  timeAtTick(tick) {
    return this.tempoTrack.timeAtTick(tick);
  }
  @computed get
    events() {
    let events = this.tracks
      .flatMap(t => t.events)
      .sort((a, b) => a.tick - b.tick);
    return events;
  }

  @observable ticks = 0;

  snapTime(time) {
    let mt = 0;
    const {events} = this;
    let lower = 0;
    let upper =events.length;
    let counter = 100;
    while (lower!==upper) {
      if (counter-- < 1) break;
      let mid = Math.floor((lower+upper)/2);
      mt= events[mid].at;
      if (mt > time) {
        upper=mid;
        continue;
      } else if (mt<time) {
        lower= mid;
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

  downloadMidiFile() {
    var blob = new Blob([this.toMidiBuffer], { type: "audio/midi" });
    var link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = 'tune.mid';
    link.click();
    URL.revokeObjectURL(url);
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
    for (const id in tracks) {
      this.tracksById[id] = new Track(this, tracks[id]);
    }
  }
}