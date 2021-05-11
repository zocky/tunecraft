import { computed, makeObservable, observable } from "mobx";

import instrumentNames from "./instruments.json";
import Midi from "jsmidgen";

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


  isMidiEvent = event => false;

  diffEvents(events) {
    let lastTick = 0;
    for (const event of events) {
      event.wait = event.tick - lastTick;
      lastTick = event.tick;
    }
    return events;
  }

  @computed get
    eventsForMidi() {
    let events = this.events.filter(this.isMidiEvent);
    return this.diffEvents(events);
  }

  @computed get toMidi() {
    const midi = new Midi.Track();
    for (const event of this.eventsForMidi) {
      switch (event.event) {
        case 'ON':
          midi.addNoteOn(this.channel, event.note, event.wait | 0, event.velocity);
          break;
        case 'OFF':
          midi.addNoteOff(this.channel, event.note, event.wait | 0, event.velocity);
          break;
        case 'I':
          midi.setInstrument(this.channel, event.instrument, event.wait | 0);
          break;
        case 'T':
          midi.setTempo(event.tempo, event.wait | 0);
          break;
        case 'ID':
          midi.addEvent(new Midi.MetaEvent({
            type: Midi.MetaEvent.TRACK_NAME,
            time: event.wait | 0,
            data: event.id
          }));
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
    this._events = ([{
      event: 'ID',
      tick: 0,
      data: this.id
    }, {
      event: 'I',
      tick: 0,
      instrument: this.midiInstrument || 0
    },
    //...this.tune.tempoTrack.events,
    ...this._events,
    ]
      .map(event => {
        const ret = { ...event };
        const { tick, ticks = 0 } = event;
        ret.track = this.id;
        ret.at = this.tune.timeAtTick(tick);
        if (ticks > 0) {
          ret.duration = this.tune.timeAtTick(tick + ticks) - ret.at
        }
        return ret;
      })
      .sort((a, b) => a.tick - b.tick)
    );
  }

  @computed get _notesAtTime() {
    const ret = {};
    for (const e of events) {
      if (e.event!=='N') continue;
      ret[e.at]||=[];
      ret[e.at].push(e);
    }
    return ret;
  }

  notesAtTime(time) {
    return this._notesAtTime[time] || [];
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
    makeObservable(this)
  }

  isMidiEvent = event => {
    switch (event.event) {
      case 'I':
      //case 'ID':
      case 'ON':
      case 'OFF':
        return true
    }
    return false;
  }
}