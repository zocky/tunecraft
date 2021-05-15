import { action, observable, computed, makeObservable, flow, reaction, when, autorun } from "mobx";
import { SoundfontInstrument } from "./SoundfontInstrument";
import { PlayerState } from "./PlayerState";

export class PlayerSoundfont extends PlayerState {
  constructor(app) {
    super(app);
    this.context = new AudioContext();
    makeObservable(this);
    reaction(()=>this.tune,tune=>this.instruments);
  }

  @action.bound
  silence() {
    for (const id in this.instruments) this.instruments[id].stop();
  }


  play = async () => {
    this.context.resume();
    this.start();
  }

  dispatchEvent(e,at=this.currentTime) {
    if (e.event==='N') this.playNote(e,at);
  }

  playNote(e, at=this.currentTime) {
    const { event, duration, track, note, velocity } = e;
    if (event !== 'N') return;
    this.instruments[track].play(note, at, {
      duration: duration,
      gain: velocity / 100
    })
  }

  get currentTime() {
    return this.context.currentTime;
  }

  @computed({keepAlive:true})
  get soundfonts() {
    if (!this.app.tune) return {};
    return {
      default: "FatBoy",
      ...this.app.tune.soundfonts
    }
  }

  @computed({keepAlive:true})
  get instruments() {
    const tune = this.app.tune;
    const ret = {};
    if (!tune) return {};
    for (const track of tune.tracks) {
      const { font, instrument, id, ...rest } = track;
      const options = {}
      if (rest.attack) options.attack = rest.attack / 1000;
      if (rest.decay) options.decay = rest.decay / 1000;
      if (rest.sustain) options.sustain = rest.sustain / 100;
      if (rest.release) options.release = rest.release / 1000;
      ret[id] = SoundfontInstrument.create(this.context, this.soundfonts[font], instrument, options);
    }
    return ret;
  }
}