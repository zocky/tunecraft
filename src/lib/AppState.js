import { trace, observable, computed, makeObservable, reaction, action } from "mobx";
import { compile } from "./tunecraft";

import Soundfont from "soundfont-player";
import { PlayerState } from "./PlayerState";
import { Tune } from "./Tune";
import { clamp } from "./utils";
import { ScrollerState } from "./ScrollerState";
import dayjs from "dayjs";

export class AppState {
  context = new AudioContext();

  @observable player =null;
  @observable scroller = null;

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
    viewBeginTime: 0,
  }

  @observable trackHeights = [];

  @observable
  viewWidth = 0;

  @observable
  scrollHeight = 0;

  getTime(x) {
    return x/this.zoomX;
  }
  getX(time) {
    return time * this.zoomX;
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

  @computed 
  get maxViewBeginTime() {
    const totalTime = this.tune?.length || 0;
    const time = totalTime-this.viewDuration;
    return Math.max(0,time)
  }

  clampViewBeginTime(time) {
    return clamp(time, 0,this.maxViewBeginTime)
  }

  @computed get viewBeginTime() {
    return this.clampViewBeginTime(this.settings.viewBeginTime);
  }

  set viewBeginTime(time) {
    this.settings.viewBeginTime = this.clampViewBeginTime(time);
  }

  @computed get viewCenterTime() {
    return (this.viewBeginTime+this.viewEndTime)/2;
  }

  set viewCenterTime(time) {
    this.viewBeginTime = time - this.viewDuration/2;
  }


  @computed get viewDuration() {
    return this.viewWidth/this.zoomX;
  }

  @computed get viewEndTime() {
    return this.viewBeginTime + this.viewDuration;
  }

  @computed get viewLeft() {
    return this.getX(this.viewBeginTime)
  }
  set viewLeft(value) {
    this.viewBeginTime = this.getTime(value);
  }

  @action
  moveViewLeft(value) {
    this.viewLeft += value;
  }

  @action
  moveViewTime(time) {
    this.viewBeginTime += time;
  }

  @observable
  _mouseX = 0;

  @observable
  _mouseOver = false;

  @computed 
  get mouseX() {
    if (!this._mouseOver) return null;
    return this._mouseX+this.viewLeft;
  }
  set mouseX(value) {
    this._mouseOver = true;
    this._mouseX = value-this.viewLeft;
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
    if (this.settings.zoomX < 16) {
      let x = this.mouseX - this.viewLeft;
      let time = this.mouseTime;
      this.settings.zoomX++;
      this.viewLeft = this.getX(time)-x;
    }
  }

  @action.bound
  zoomOutX() {
    if (this.settings.zoomX > 1) {
      let x = this.mouseX - this.viewLeft;
      let time = this.mouseTime;
      this.settings.zoomX--;
      this.viewLeft = this.getX(time)-x;

    }
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

  @observable fileName = "tune";

  @observable editor = null;
  exportMidi() {
    var blob = new Blob([this.tune.toMidiBuffer], { type: "audio/midi" });
    var link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;

    link.download = this.fileName+dayjs().format('-YYYY-MM-DD-HH-MM')+".mid";
    link.click();
    URL.revokeObjectURL(url);
  }

  saveTune() {
    var blob = new Blob([this.source], { type: "text/plain" });
    var link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;

    link.download = this.fileName+dayjs().format(' YYYY-MM-DD-HH-MM')+".tune";
    link.click();
    URL.revokeObjectURL(url);
  }

  openTune(file) {
    var fr = new FileReader();
    fr.onload=action(()=>{
      //this.source = fr.result;
      this.fileName=file.name.replace(/[0-9\-]+\..*$/,'');
      this.editor.getModel().setValue(fr.result);
    })
    fr.readAsText(file);
  }


  constructor() {
    top.app = this;
    let lastResult;
    makeObservable(this);
    this.player = new PlayerState(this);
    this.scroller = new ScrollerState(this);

    reaction(() => {
      this.tune; return this.result }, ({ result, error }) => {
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
