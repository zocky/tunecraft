import { computed, makeObservable, observable } from "mobx";

import instrumentNames from "./instruments.json";
import { findClosest } from "./utils";

export class BaseTrack {
  @observable.shallow
  _events;

  get events() {
    return this._events;
  }

  get isMidiTrack() {
    return false;
  }

  constructor(tune, { events, channel }) {
    this.channel = channel;
    this._events = events;
    //makeObservable(this)
  }

  isMidiEvent = (event) => false;

  diffEvents(events) {
    let lastTick = 0;
    for (const event of events) {
      event.wait = event.tick - lastTick;
      lastTick = event.tick;
    }
    return events;
  }

  @computed get eventsForMidi() {
    let events = this.events.filter(this.isMidiEvent);
    return this.diffEvents(events);
  }

  @computed get toMidi() {
    const { channel } = this;
    const midi = [];
    for (const {
      event,
      velocity,
      note: noteNumber,
      wait: delta = 0,
      ...rest
    } of this.eventsForMidi) {
      switch (event) {
        case "ON":
          midi.push({ noteOn: { noteNumber, velocity }, channel, delta });
          break;
        case "OFF":
          midi.push({ noteOff: { noteNumber, velocity }, channel, delta });
          break;
        case "I":
          midi.push({
            programChange: { programNumber: rest.instrument },
            channel, delta,
          });
          break;
        case "T":
          const mspq = Math.round(60e6 / rest.tempo)
          midi.push({
            setTempo: { "microsecondsPerQuarter": mspq },
            channel, delta,
          });
          break;
        case "ID":
          midi.push({
            trackName: rest.id+'\u0000',
            delta,
          });
          break;
        default:
        //ignore others
      }
    }
    return midi;
  }
}

export class Track extends BaseTrack {
  makeEvents() {
    this._events = [
      {
        event: "ID",
        tick: 0,
        id: this.id,
      },
      {
        event: "I",
        tick: 0,
        instrument: this.midiInstrument || 0,
      },
      ...this.tune.tempoTrack.events,
      ...this._events,
    ]
      .map((event) => {
        const ret = { ...event };
        const { tick, ticks = 0 } = event;
        ret.track = this.id;
        ret.at = this.tune.timeAtTick(tick);
        if (ticks > 0) {
          ret.duration = this.tune.timeAtTick(tick + ticks) - ret.at;
        }
        return ret;
      })
      .sort((a, b) => a.tick - b.tick);
  }

  @computed({ keepAlive: true })
  get uniqueTimes() {
    let ret = new Set();
    for (const e of this.events) ret.add(e.at);
    return [...ret];
  }

  @computed({ keepAlive: true })
  get notes() {
    return this.events.filter((e) => e.event === "N");
  }

  @computed({ keepAlive: true })
  get _notesAtTime() {
    console.log("notes");
    const ret = {};
    const notes = this.notes;
    for (const at of this.uniqueTimes) {
      ret[at] = notes.filter((n) => n.at == at || n.at + n.duration == at);
    }
    return ret;
  }

  notesAtTime(time) {
    const t = findClosest(time, this.uniqueTimes);
    return this._notesAtTime[t] || [];
  }

  @computed get midiInstrument() {
    return Math.max(0, instrumentNames.indexOf(this.instrument));
  }

  @computed get isMidiCompatible() {
    return this.midiInstrument >= 0;
  }

  constructor(tune, { id, instrument, font, ...rest }) {
    super(tune, { ...rest });
    this.tune = tune;
    this.id = id;
    this.font = font;
    this.instrument = instrument;
    this.makeEvents();
    makeObservable(this);
  }

  isMidiEvent = (event) => {
    switch (event.event) {
      case "I":
      case 'ID':
      case 'T':
      case "ON":
      case "OFF":
        return true;
    }
    return false;
  };
}
