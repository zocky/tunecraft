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
    looping: false,
    snapping: true,
    scrollTime: 0,
  }

  @observable
  scrollWidth = 0;

  @observable
  scrollHeight = 0;

  @observable
  scrollerWidth = 0;

  @computed 
  get scrollerZoom() {
    return this.scrollerWidth / this.tune?.length
  }


  @computed
  get snapping() {
    return this.settings.snapping;
  }
  set snapping(value) {
    this.settings.snapping = !!value;
  }

  @action.bound
  toggleSnapping() {
    this.snapping = !this.snapping;
  }

  @computed get scrollTime() {
    return this.settings.scrollTime;
  }


  @computed get scrollDuration() {
    return this.scrollWidth/this.zoomX;
  }

  @computed get scrollX() {
    return Math.round(this.settings.scrollTime * this.zoomX)
  }
  set scrollX(value) {
    this.settings.scrollTime = Math.max(0,value) / this.zoomX;
  }
  @action
  moveScrollX(value) {
    this.scrollX += value;
  }

  @observable
  _mouseX = 0;

  @observable
  _mouseOver = false;

  @computed 
  get mouseX() {
    if (!this._mouseOver) return null;
    return this._mouseX+this.scrollX;
  }
  set mouseX(value) {
    this._mouseOver = true;
    this._mouseX = value-this.scrollX;
  }
  @action mouseLeave() {
    this._mouseOver = false;
  }

  @computed get mouseTime() {
    if (!this._mouseOver) return null;
    if (this.snapping) return this.tune?.snapTime(this.mouseX / this.zoomX);
    return +(this.mouseX / this.zoomX).toFixed(6);
  }

  @computed
  get zoomX() {
    return 2 ** (this.settings.zoomX / 2)
  }

  @computed get
    zoomY() {
    return this.settings.zoomY;
  }

  @action.bound
  zoomInY() {
    if (this.settings.zoomY < 8) this.settings.zoomY++;
  }

  @action.bound
  zoomOutY() {
    if (this.settings.zoomY > 1) this.settings.zoomY--;
  }

  @action.bound
  zoomInX() {
    if (this.settings.zoomX < 16) this.settings.zoomX++;
  }

  @action.bound
  zoomOutX() {
    if (this.settings.zoomX > 1) this.settings.zoomX--;
  }

  @computed
  get loopIn() {
    return this.settings.hasLoop ? this.tune?.snapTime(this.settings.loopIn) : null;
  };
  set loopIn(value) {
    this.settings.loopIn = clamp(value, 0, this.settings.loopOut - 0.25);
  }
  @action
  moveLoopIn(value) {
    this.settings.loopIn = clamp(this.settings.loopIn + value, 0, this.settings.loopOut - 0.25);
  }

  @computed
  get loopOut() {
    return this.settings.hasLoop ? this.tune?.snapTime(this.settings.loopOut) : null;
  };
  set loopOut(value) {
    this.settings.loopOut = clamp(value, this.settings.loopIn + 0.25, Infinity);
  }

  @action.bound
  moveLoopOut = value => {
    this.settings.loopOut = clamp(this.settings.loopOut + value, this.settings.loopIn + 0.25, Infinity);
  }
  @computed get hasLoop() {
    return this.settings.hasLoop;
  }
  @action.bound
  showLoop() {
    this.settings.hasLoop = true;
  }
  @action.bound
  hideLoop() {
    this.settings.hasLoop = false;
  }
  @action.bound
  toggleLoop() {
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
