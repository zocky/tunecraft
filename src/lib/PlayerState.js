
import { action, observable, computed, makeObservable, flow } from "mobx";
import Soundfont from "soundfont-player";

export class PlayerState {
  @observable ready = true;
  @observable playbackTime = 0;
  @observable playing = false;

  @observable looping = true;

  offsetTime = 0;

  constructor(app) {
    makeObservable(this);
    this.ac = app.context;
    this.app = app;
  }

  timerID = null;
  queueTime = 0;

  @action.bound
  loop() {
    const { events } = this.app.parsed;
    const now = this.currentTime;
    const time = now - this.offsetTime;
    const doneTime = time + 1;
    const rest = events.filter(e => {
      if (e.at < this.queueTime) return false;
      if (e.at + e.duration < time) return false;
      if (e.at < e.time) return true;
      if (e.at > doneTime) return true;
      const off = e.at - time;

      switch (e.event) {
        case 'ON':
          this.app.instruments[e.instrument].play(e.note, now + off, {
            duration: e.duration,
            gain: e.velocity / 100
          })
          break;
        default: {
        }
      }
      return false;
    })

    this.playbackTime = time;
    this.queueTime = doneTime;
    if (time>=this.app.parsed.length) {
      if (this.looping) {
        this.seek(0);
      } else {
        this.stop(true);
      }
    }
  }

  @observable holding = false;
  @action.bound
  hold() {
    if (this.playing) {
      console.log('holding');
      this.holding = true;
      this.stop(false);
    } else {
      console.log('not holding');
      this.holding = false;
    }
  }

  @action.bound
  unhold() {
    if (this.holding) {
      console.log('unholding');
      this.start();
      this.holding = false;
    } else {
      console.log('not unholding');
    }
  }
  

  @action.bound
  async start() {
    if (!this.ready) return;
    if(this.playing) return;
    if (this.timerID) return;
    await this.app.context.resume();
    this.offsetTime = this.currentTime - this.playbackTime;
    this.queueTime = 0;
    this.playing = true;
    this.holding = false;
    this.loop();
    this.timerID = setInterval(this.loop, 50);
  }

  @action.bound
  pause() {
    this.stop(false);
  }

  @action.bound
  seek(time) {
    if (this.playing) {
      this.stop(false);
      this.playbackTime = time;
      this.start();
    } else {
      this.playbackTime = time;
    }
  }

  @action.bound
  stop(reset = true) {
    if (this.timerID) {
      clearInterval(this.timerID);
      this.timerID = null;
    }
    for (const id in this.app.instruments) this.app.instruments[id].stop();
    this.playing = false;
    //this.holding = false;
    
    this.queueTime = 0;
    if (reset) this.playbackTime = 0;
  }

  @action.bound
  toggle() {
    if (this.playing) this.pause();
    else this.start();
  }

  get currentTime() {
    return this.ac.currentTime;
  }

}
