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

  @computed get ticks() {
    let ticks = this.events[this.events.length - 1]?.tick ?? 0;
    return ticks;
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

  constructor({ tracks, tempo, length, soundfonts, TPQ }) {
    top.tune = this;
    this.soundfonts = { default: "MusyngKite", ...soundfonts };
    this.TPQ = TPQ;
    this.tempoTrack = new TempoTrack(this, { events: tempo, TPQ });
    for (const id in tracks) {
      this.tracksById[id] = new Track(this, tracks[id]);
    }

    makeObservable(this);
  }
}