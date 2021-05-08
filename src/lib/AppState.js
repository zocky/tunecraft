import { trace, observable, computed, makeObservable, reaction, action } from "mobx";
import { compile } from "./tunecraft";

import Soundfont from "soundfont-player";
import { PlayerState } from "./PlayerState";
import { Tune } from "./Tune";
import { clamp } from "./utils";

export class AppState {
  context = new AudioContext();

  @observable
  editorWidth = 500;

  @observable
  settings = {
    zoomX: 12,
    zoomY: 2,
    loopIn: 0,
    loopOut: 1,
    hasLoop: false,
    looping: false
  }

  @observable mouseTime = 0;

  @computed get
    zoomX() {
    return 2 ** (this.settings.zoomX / 2)
  }

  @computed get
    zoomY() {
    return this.settings.zoomY;
  }

  @action
  zoomInY() {
    if (this.settings.zoomY < 8) this.settings.zoomY++;
  }

  @action
  zoomOutY() {
    if (this.settings.zoomY > 1) this.settings.zoomY--;
  }

  @action
  zoomInX() {
    if (this.settings.zoomX < 16) this.settings.zoomX++;
  }

  @action
  zoomOutX() {
    if (this.settings.zoomX > 1) this.settings.zoomX--;
  }

  @computed
  get loopIn() { 
    return this.settings.hasLoop ? this.tune?.snapTime(this.settings.loopIn): null;
  };
  set loopIn(value) {
    this.settings.loopIn = clamp(value,0,this.settings.loopOut-0.25);
  }
  @action
  moveLoopIn(value) {
    this.settings.loopIn = clamp(this.settings.loopIn+value,0,this.settings.loopOut-0.25);
  }

  @computed
  get loopOut() { 
    return this.settings.hasLoop ? this.tune?.snapTime(this.settings.loopOut) : null;
  };
  set loopOut(value) {
    this.settings.loopOut = clamp(value,this.settings.loopIn+0.25,Infinity);
  }

  @action
  moveLoopOut = value => {
    this.settings.loopOut = clamp(this.settings.loopOut+value,this.settings.loopIn+0.25,Infinity);
  }
  @computed get hasLoop() {
    return this.settings.hasLoop;
  }
  @action showLoop() {
    this.settings.hasLoop = true;
  }
  @action hideLoop() {
    this.settings.hasLoop = false;
  }
  @action toggleLoop() {
    this.settings.hasLoop = !this.settings.hasLoop;
  }

  @observable viewerMode = "tracks";

  @observable source = "";


  @computed get result() {
    try {
      return { result: compile(this.source) };
    } catch (error) {
      console.error(error);
      return { error: error }
    }
  }

  @computed get error() {
    return this.result.error;
  }

  @observable tune = null;

  @computed get tracks() {
    return Object.values(this.tune?.tracks || []);
  }

  @computed.struct get trackKeys() {
    return Object.keys(this.tracks);
  }

  @computed get soundfonts() {
    trace();
    if (!this.tune) return {};
    return {
      default: "FatBoy",
      ...this.tune.soundfonts
    }
  }

  constructor() {
    top.app = this;
    let lastResult;
    makeObservable(this);
    this.player = new PlayerState(this);

    reaction(() => { this.instruments; this.tune; return this.result }, ({ result, error }) => {
      if (result === lastResult) return;
      lastResult = result;
      localStorage.tunecraft_save = this.source;
      if (result) {
        this.tune = new Tune(result);
      }
    })
    this.init();
  }
  @action init() {
    this.source = localStorage.tunecraft_save || ""
  }
}
