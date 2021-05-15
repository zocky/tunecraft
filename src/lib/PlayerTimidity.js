
import { action, observable, computed, makeObservable, flow, reaction } from "mobx";

import Timidity from "timidity";

export class PlayerState {

  timidity=new Timidity('/assets/timidity');

  @observable ready = true;
  @observable playbackTime = 0;
  @observable duration = 0;
  @observable playing = false;

  offsetTime = 0;

  constructor(app) {
    console.log('player')
    this.app = app;
    const {timidity} = this;
    app.tune && timidity.load(app.tune.toMidiBuffer)
    reaction(()=>app.tune,async tune=>{
      console.log('loading tune')
      await timidity.load(tune.toMidiBuffer);
      console.log('loaded');
    })
    timidity.on('playing',action(()=>{
      this.playing=true
    }));
    timidity.on('ended',action(()=>{
      if (this.app.looping) {
        this.seek(0);
        this.start();
      } else {
        this.playing=false
      }
    }));
    timidity.on('paused',action(()=>{
      this.playing=false;
    }));
    timidity.on('timeupdate',action(time=>{
      this.playbackTime=time;
    }));
    makeObservable(this);
  }

  @observable holding = false;
  @action.bound
  hold() {
  }

  @action.bound
  unhold() {
  }
  

  @action.bound
  async start() {
    this.timidity.play();
  }

  @action.bound
  pause() {
    this.timidity.pause()
  }

  @action.bound
  seek(time) {
    this.timidity.seek(time)
  }

  @action.bound
  stop(reset = true) {
    this.timidity.pause();
    if (reset) this.seek(0);
  }

  @action.bound
  toggle() {
    if (this.playing) this.pause();
    else this.start();
  }

  get currentTime() {
    return this.playbackTime;
  }
}
