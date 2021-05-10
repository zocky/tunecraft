
import { action, observable, computed, makeObservable, flow, reaction, when, autorun } from "mobx";
import Soundfont from "soundfont-player";

export class PlayerState {
  @observable ready = true;
  @observable playbackTime = 0;
  @observable app = null;
  @computed get beginTime() {
    return this.app.loopIn ?? 0;
  }

  @computed get endTime() {
    return this.app.loopOut ?? this.totalTime;
  }

  @computed get loopTime() {
    return this.endTime - this.beginTime;
  }

  @computed get totalTime() {
    return this.app.tune?.length ?? 0;
  }

  @observable playing = false;

  @observable looping = true;

  @observable
  offsetTime = 0;

  @computed get tune() {
    return this.app.tune;
  }

  constructor(app) {
    this.ac = app.context;
    this.app = app;
    makeObservable(this);
    reaction(()=>this.tune,tune=>this.instruments);
    reaction(()=>app.playingTracks,tracks => {
      for (const i in this.instruments) {
        if (!tracks[i]) this.instruments[i].stop();
      }
    });
  }

  timerID = null;
  queueTime = 0;

  @computed({keepAlive:true})
  get notes() {
    const notes = this.app.tune.events.filter(e => {
      if (!this.app.isTrackPlaying(e.track)) return false;
      if (e.event !== 'N') return false;
      if (e.at + e.duration <= this.beginTime) return false;
      if (e.at >= this.endTime) return false;
      return true;
    })
    .map(e => ({ ...e }));
    /*
    for (const e of notes) {
      if (e.at + e.duration > this.endTime) e.duration = this.endTime - e.at;
    }
    /*
    for (const e of notes) {
      
      if (e.at > this.beginTime + 1) break;
      notes.push({
        ...e,
        at: e.at + this.loopTime
      })
    }*/
    return notes;
  }

  @action.bound
  loop() {

    const now = this.currentTime;
    const time = now - this.offsetTime;
    const doneTime = time + 1;
    for (const e of this.notes) {
      const { event, at, duration, track, note, velocity } = e;
      if (event !== 'N') continue;
      //if (at < this.beginTime) continue;
      //if (at > this.endTime) continue;
      if (at < this.queueTime) continue;
      if (at + duration < time) continue;
      if (at < time) continue;
      if (at > doneTime) continue;
      const offset = at - time;
      this.instruments[track].play(note, now + offset, {
        duration: duration,
        gain: velocity / 100
      })

    }

    this.queueTime = doneTime; //this.beginTime + (doneTime - this.beginTime) % this.loopTime;
    if (time >= this.endTime) {
      if (this.looping) {
        this.seek(this.beginTime);
      } else {
        this.stop(true);
      }
    } else {
      this.playbackTime = time;
    }
  }

  @observable holding = false;
  @action.bound
  hold() {
    if (this.playing) {
      this.holding = true;
      this.stop(false);
    } else {
      this.holding = false;
    }
  }

  @action.bound
  unhold() {
    if (this.holding) {
      this.start();
      this.holding = false;
    } else {
    }
  }

  @action.bound
  async play() {
    await this.app.context.resume();
    this.start();
  }


  @action.bound
  start() {
    if (!this.ready) return;
    if (this.playing) return;
    this.offsetTime = this.currentTime - this.playbackTime;
    this.queueTime = 0;
    this.playing = true;
    this.holding = false;
    this.loop();
    if (!this.timerID) {
      this.timerID = setInterval(this.loop, 50);
    }
  }

  @action.bound
  pause() {
    this.stop(false);
  }

  @action.bound
  seek(time) {
    if (this.playing) {
      //this.silence();
      this.playbackTime = time;
      this.playing = false;
      this.start();
    } else {
      this.playbackTime = time;
    }
  }

  @action.bound
  silence() {
    for (const id in this.instruments) this.instruments[id].stop();
  }

  @action.bound
  stop(reset = true) {
    clearInterval(this.timerID);
    this.timerID = null;
    this.playing = false;
    this.silence();

    this.queueTime = 0;
    if (reset) this.playbackTime = this.beginTime;
  }

  @action.bound
  toggle() {
    if (this.playing) this.pause();
    else this.play();
  }

  get currentTime() {
    return this.ac.currentTime;
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
    console.log('get instruments');
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
      ret[id] = InstrumentState.create(this.app.context, this.soundfonts[font], instrument, options);
    }
    return ret;
  }
}

class InstrumentState {
  static _instruments = {};
  static create(context, font, name, options) {
    return new InstrumentState(context, font, name, options);
  }

  static async loadInstrument(context, font, name) {
    const id = font + '\n' + name
    if (!this._instruments[id]) {
      console.log('loading',id)
      try {
        this._instruments[id] = await Soundfont.instrument(context, name, {
          soundfont: font,
          nameToUrl: (name, sf, format = 'mp3') => {
            if (!sf.match(/^https?:/)) {
              if (name === 'percussion') {
                sf = "https://cdn.jsdelivr.net/gh/dave4mpls/midi-js-soundfonts-with-drums/FluidR3_GM"
              } else {
                sf = "https://gleitz.github.io/midi-js-soundfonts/" + sf;
              }
            }
            return sf + '/' + name + '-' + format + '.js'
          }
        });
      } catch (error) {
        console.log(error);
      }
    }
    return this._instruments[id];
  }
  instrument = null;
  constructor(context, font, name, options) {
    this.context = context;
    this.font = font;
    this.name = name;
    this.options = options;
    const id = font + '\n' + name;
    this.instrument=this.constructor._instruments[id];
    if (!this.instrument) {this.load()};

  }
  async load() {
    this.instrument = await this.constructor.loadInstrument(this.context, this.font, this.name);
  }

  play(note, at, options = {}) {
//    if(!this.instrument) console.log('no',this.name)
    this.instrument?.play(note, at, { ...this.options, ...options });
  }

  stop() {
    this.instrument?.stop();
  }
}
