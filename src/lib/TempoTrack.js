import { computed, makeObservable, observable } from "mobx";
import { BaseTrack } from "./Track";
import Midi from "jsmidgen";

export class TempoTrack extends BaseTrack {
  @computed get
    events() {
    return ([{
      event: 'T',
      tick: 0,
      tempo: 120
    }, ...this._events
    ].sort((a, b) => a.tick - b.tick)
    );
  }

  ticksPerSecond(tempo) {
    return tempo * this.TPQ / 60
  }

  ticksToSeconds(tempo, ticks) {
    return ticks / this.ticksPerSecond(tempo);
  }

  @computed get
    tickOffsets() {
    const ret = [{
      tick: 0,
      time: 0,
      tempo: 120,
      TPS: this.ticksPerSecond(120)
    }];
    let lastTick = 0;
    let lastTime = 0;
    let lastTempo = 120;

    for (const { event, tick, tempo } of this.events) {
      if (event !== 'T') continue;
      const ticks = tick - lastTick;
      const time = this.ticksToSeconds(lastTempo, ticks);
      if (time === 0) ret.shift();
      lastTick = tick;
      lastTime += time;
      lastTempo = tempo;
      ret.unshift({
        tick,
        time: lastTime,
        tempo,
        TPS: this.ticksPerSecond(tempo)
      })
    }
    return ret;
  }

  timeAtTick = tick => {
    //return this.ticksToSeconds(120,tick)
    const offsets = this.tickOffsets
    for (const { tick: t, time, TPS } of offsets) {
      if (tick >= t) {
        return time + (tick - t) / TPS;
      };
    }
    return 0;
  }

  constructor(tune, { events, TPQ }) {
    super(tune, { events });
    this.TPQ = TPQ;
    this._events = events;
    makeObservable(this)
  }

  isMidiEvent = event => {
    return ({
      'T': true,
    })[event.event] || false
  }


}