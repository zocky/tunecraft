
import { action, observable, computed, makeObservable, flow, reaction, when, autorun } from "mobx";

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
    return this.app.tuneTotalTime ?? 0;
  }

  @observable playing = false;

  @observable
  offsetTime = 0;

  @computed get tune() {
    return this.app.tune;
  }

  constructor(app) {
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

  playSingleNote(...args) {
    if (this.playing) return;
    this.playNote(...args);
  }

  @computed({keepAlive:true})
  get events() {
    const notes = this.app.tune.events.filter(e => {
      if (!this.app.isTrackPlaying(e.track)) return false;
      if (e.at + (e.duration||0) < this.beginTime) return false;
      if (e.at > this.endTime) return false;
      return true;
    })
    //.map(e => ({ ...e }));
    return notes;
  }

  dispatchEvent(e,at=this.currentTime) {
  }

 

  @action.bound
  loop() {
    const now = this.currentTime;
    const time = now - this.offsetTime;
    const doneTime = time + 1;
    for (const e of this.events) {
      const { event, at, duration=0 } = e;
      if (at < this.queueTime) continue;
      //if (at + duration < time) continue;
      //if (at < time) continue;
      if (at > doneTime) continue;
      const offset = at - time;

      this.dispatchEvent(e, now + offset)
      continue;
    }

    this.queueTime = doneTime; //this.beginTime + (doneTime - this.beginTime) % this.loopTime;
    if (time >= this.endTime) {
      if (this.app.looping) {
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

  play = async () => {
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
