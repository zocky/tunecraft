
import { action, observable, computed, makeObservable, flow } from "mobx";
import Soundfont from "soundfont-player";

export class PlayerState {
  @observable ready = true;
  @observable playbackTime = 0;

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

  offsetTime = 0;

  constructor(app) {
    makeObservable(this);
    this.ac = app.context;
    this.app = app;
  }

  timerID = null;
  queueTime = 0;

  @computed get notes() {
    const notes = this.app.tune.events.filter(e => {
      if (e.event !== 'N') return false;
      if (e.at + e.duration <= this.beginTime) return false;
      if (e.at >= this.endTime) return false;
      return true;
    })
    
    .map(e => ({ ...e }));
    for (const e of notes) {
      if (e.at + e.duration > this.endTime) e.duration = this.endTime - e.at;
    }
    
    for (const e of notes) {
      if (e.at - this.beginTime < 1) notes.push({
        ...e,
        at: e.at + this.loopTime
      })
    }
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
      if (at < this.beginTime) continue;
      if (at > this.endTime) continue;
      if (at < this.queueTime) continue;
      if (at + duration < time) continue;
      if (at < time) continue;
      if (at > doneTime) continue;
      const offset = at - time;

      this.app.instruments[track].play(note, now + offset, {
        duration: duration,
        gain: velocity / 100
      })

    }

    this.queueTime = doneTime; //this.beginTime + (doneTime - this.beginTime) % this.loopTime;
    if (time >= this.endTime) {
      if (this.looping) {
        this.seek(this.beginTime + (time - this.beginTime) % this.loopTime);
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
    if (!this.timerID) {
      this.loop();
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
      this.silence();
      this.playbackTime = time;
      this.playing = false;
      this.start();
    } else {
      this.playbackTime = time;
    }
  }

  @action.bound
  silence() {
    for (const id in this.app.instruments) this.app.instruments[id].stop();
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

}
