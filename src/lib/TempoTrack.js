import { computed, makeObservable, observable } from "mobx";
import { BaseTrack } from "./Track";

export class TempoTrack extends BaseTrack {

  @computed({keepAlive:true}) get
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

  @computed({keepAlive:true}) get
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

  timeCache = {};
  hits = 0;
  misses = 0;
  timeAtTick = tick => {
    //return this.ticksToSeconds(120,tick)
    if (!(tick in this.timeCache)) {
      const offsets = this.tickOffsets;
      let ret = 0;
      for (const { tick: t, time, TPS } of offsets) {
        if (tick >= t) {
          ret = time + (tick - t) / TPS;
        };
      }
      this.timeCache[tick]=ret;
    }
    return this.timeCache[tick];
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