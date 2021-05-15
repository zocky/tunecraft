import {
  trace,
  observable,
  computed,
  makeObservable,
  reaction,
  action,
  autorun,
  toJS,
} from "mobx";
import { compile } from "./tunecraft";

import { PlayerSoundfont } from "./PlayerSoundfont";
import { PlayerMidi } from "./PlayerMidi";
import { Tune } from "./Tune";
import { clamp, storageGet, storageSet } from "./utils";
import { ScrollerState } from "./ScrollerState";
import dayjs from "dayjs";
import { EditorState } from "./EditorState";

export class AppState {
  @observable.shallow highlightedNotes = [];
  @observable selectedNote = null;
  @observable playerMidi = new PlayerMidi(this);
  @observable playerSoundfont = new PlayerSoundfont(this);

  @computed get player() {
    if (this.midiOutputIndex==='soundfont') return this.playerSoundfont;
    else return this.playerMidi;
  }

  @observable scroller = new ScrollerState(this);
  @observable editor = new EditorState(this);
  @observable
  editorWidth = 500;

  @observable
  settings = {
    zoomX: 12,
    zoomY: 8,
    loopIn: 0,
    loopOut: 1,
    hasLoop: false,
    looping: false,
    snapping: true,
    following: true,
    viewBeginTime: 0,
    viewTop: 0,
    mutedTracks: {},
    soloTracks: {},
    midiOutputIndex: 0,
  };

  @action muteTrack(id) {
    this.settings.mutedTracks[id] = true;
  }
  @action unmuteTrack(id) {
    delete this.settings.mutedTracks[id];
  }
  @action toggleMuteTrack(id) {
    this.settings.mutedTracks[id] = !this.settings.mutedTracks[id];
  }
  @action unmuteAll() {
    this.settings.mutedTracks = {};
  }
  isTrackMuted(id) {
    return !!this.settings.mutedTracks[id];
  }
  @computed get mutedTracks() {
    return this.tracks.filter((track) => this.isTrackMuted(track.id));
  }

  @action soloTrack(id) {
    this.settings.soloTracks[id] = true;
  }
  @action unsoloTrack(id) {
    delete this.settings.soloTracks[id];
  }
  @action toggleSoloTrack(id) {
    this.settings.soloTracks[id] = !this.settings.soloTracks[id];
  }
  @action unsoloAll() {
    this.settings.soloTracks = {};
  }
  isTrackSolo(id) {
    return !!this.settings.soloTracks[id];
  }
  @computed get soloTracks() {
    return this.tracks.filter((track) => this.isTrackSolo(track.id));
  }

  @computed get looping() {
    return this.settings.looping;
  }
  set looping (value) {
    this.settings.looping = value;
  }
  @action.bound
  toggleLooping() {
    this.looping = !this.looping;
  }

  @computed get playingTracks() {
    let ret = {};
    for (const { id } of this.tracks) {
      if (
        (this.soloTracks.length && this.isTrackSolo(id)) ||
        (!this.soloTracks.length && !this.isTrackMuted(id))
      ) {
        ret[id] = true;
      }
    }
    return ret;
  }

  isTrackPlaying(id) {
    return !!this.playingTracks[id];
  }

  @observable trackViews = [];

  @computed get trackHeights() {
    return this.trackViews.map(it => it.height);
  }

  @observable
  viewWidth = 0;

  @observable
  scrollHeight = 0;

  getTime(x) {
    return x / this.zoomX;
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
  get following() {
    return this.settings.following;
  }
  set following(value) {
    this.settings.following = !!value;
  }

  @action.bound
  toggleFollowing() {
    this.following = !this.following;
  }

  @computed
  get maxViewBeginTime() {
    const totalTime = this.tuneTotalTime || 0;
    const time = totalTime - this.viewDuration;
    return Math.max(0, time) + 1;
  }

  clampViewBeginTime(time) {
    const totalTime = this.tuneTotalTime || 0;
    return clamp(time, -this.viewDuration + 1, totalTime - 1);
  }

  @computed get viewBeginTime() {
    return this.clampViewBeginTime(this.settings.viewBeginTime);
  }

  set viewBeginTime(time) {
    this.settings.viewBeginTime = this.clampViewBeginTime(time);
  }

  @computed get
  viewTotalTime() {
    return this.tuneTotalTime;
  }

  @computed get
  tuneTotalTime() {
    return this.tune ? this.tune.length : 0;
  }

  @computed get
    viewTotalWidth() {
    return this.viewTotalTime * this.zoomX;
  }

  @computed get viewCenterTime() {
    return (this.viewBeginTime + this.viewEndTime) / 2;
  }

  set viewCenterTime(time) {
    this.viewBeginTime = time - this.viewDuration / 2;
  }

  @computed get viewDuration() {
    return this.viewWidth / this.zoomX;
  }

  @computed get viewEndTime() {
    return this.viewBeginTime + this.viewDuration;
  }

  @computed get viewLeft() {
    return this.getX(this.viewBeginTime);
  }
  set viewLeft(value) {
    this.viewBeginTime = this.getTime(value);
  }
  @computed get totalTrackSpan() {
    return this.trackViews.reduce((a, b) => a + b.span, 0);
  };

  @computed get totalTrackHeight() {
    return this.totalTrackSpan * this.zoomY;
  };

  @computed get viewTop() {
    return this.clampViewTop(this.settings.viewTop);
  }
  clampViewTop(y) {
    return clamp(y, 0, this.totalTrackHeight - 100);
  }
  set viewTop(value) {
    this.settings.viewTop = this.clampViewTop(value);
  }
  moveViewTop(value) {
    this.viewTop += value;
  }

  @action
  moveViewLeft(value, instant) {
    if (instant) document.body.classList.add('zooming');
    this.viewLeft += value;
    if (instant) requestIdleCallback(() => document.body.classList.remove('zooming'));

  }

  @action
  moveViewTime(time, instant) {
    if (instant) document.body.classList.add('zooming');
    this.viewBeginTime += time;
    if (instant) requestIdleCallback(() => document.body.classList.remove('zooming'));
  }

  @observable
  _mouseX = 0;

  @observable
  _mouseY = 0;

  @observable
  _mouseOver = false;

  @computed
  get mouseTrackIndex() {
    const y = this.mouseY;
    const bottoms = this.trackBottoms;
    for (const i in bottoms) if (bottoms[i] > y) return i;
    return null;
    return bottoms.findIndex(b => b > y)
  }

  @computed
  get mouseTrack() { return this.tracks[this.mouseTrackIndex] }

  @computed
  get mouseNote() {
    console.log
    const pitch = this.mouseTrackPitch;
    const t = this.mouseTrack
    const at = this.mouseTime;

    const d = e=> {
      return Math.max(0, e.note-pitch-1, pitch-e.note)*this.zoomY;
      return Math.hypot(
        Math.max(0, e.at-at,at-e.at-e.duration)*this.zoomX,
        Math.max(0, e.note-pitch-1, pitch-e.note)*this.zoomY,
      );
    }

    if (!t) return null;
    return t.notesAtTime(this.mouseTime)
    .filter(e => d(e) < 12 )
    .sort((a,b)=>d(a)-d(b))[0]
  }

  @computed get trackBottoms() {
    let a = 0;
    return this.trackHeights.map(h => a += h)
  }


  @computed
  get mouseTrackY() {
    const b = this.trackBottoms[this.mouseTrackIndex - 1] ?? 0;
    return this.mouseY - b;
  }

  @computed
  get mouseTrackPitch() {
    if (!this.mouseTrackIndex) return null;
    const trackComponent = this.trackViews[this.mouseTrackIndex];
    if (!trackComponent) {
      return;
    }
    return trackComponent.max - Math.floor(this.mouseTrackY / this.zoomY)
  }

  @computed
  get mouseX() {
    if (!this._mouseOver) return null;
    return this._mouseX + this.viewLeft;
  }
  set mouseX(value) {
    this._mouseOver = true;
    this._mouseX = value - this.viewLeft;
  }

  @computed
  get mouseY() {
    if (!this._mouseOver) return null;
    return Math.round(this._mouseY + this.viewTop);
  }
  set mouseY(value) {
    this._mouseOver = true;
    this._mouseY = Math.round(value);
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
    return 2 ** (this.settings.zoomX / 2);
  }

  @computed get zoomY() {
    return this.settings.zoomY;
  }

  @action.bound
  zoomInY() {
    if (this.settings.zoomY < 16) {
      let y = this.mouseY - this.viewTop;
      let t = this.mouseY / this.zoomY;
      this.settings.zoomY++;
      this.viewTop = t * this.zoomY - y;
    }
  }

  @action.bound
  zoomOutY() {
    if (this.settings.zoomY > 1) {
      let y = this.mouseY - this.viewTop;
      let t = this.mouseY / this.zoomY;
      this.settings.zoomY--;
      this.viewTop = t * this.zoomY - y;
    }
  }

  @action.bound
  zoomInX() {
    if (this.settings.zoomX < 16) {
      document.body.classList.add("zooming");
      let x = this.mouseX - this.viewLeft;
      let time = this.mouseTime;
      this.settings.zoomX++;
      this.viewLeft = this.getX(time) - x;
      //document.body.classList.remove('zooming');
    }
  }

  @action.bound
  zoomOutX() {
    if (this.settings.zoomX > 1) {
      document.body.classList.add("zooming");
      let x = this.mouseX - this.viewLeft;
      let time = this.mouseTime;
      this.settings.zoomX--;
      this.viewLeft = this.getX(time) - x;
    }
  }

  @computed
  get loopIn() {
    return this.settings.hasLoop
      ? this.tune?.snapTime(this.settings.loopIn)
      : null;
  }
  set loopIn(value) {
    this.settings.loopIn = clamp(value, 0, this.settings.loopOut - 0.25);
  }
  @action
  moveLoopIn(value) {
    this.settings.loopIn = clamp(
      this.settings.loopIn + value,
      0,
      this.settings.loopOut - 0.25
    );
  }

  @computed
  get loopOut() {
    return this.settings.hasLoop
      ? this.tune?.snapTime(this.settings.loopOut)
      : null;
  }
  set loopOut(value) {
    this.settings.loopOut = clamp(value, this.settings.loopIn + 0.25, Infinity);
  }

  @action.bound
  moveLoopOut = (value) => {
    this.settings.loopOut = clamp(
      this.settings.loopOut + value,
      this.settings.loopIn + 0.25,
      Infinity
    );
  };
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

  @observable source = "";

  @computed get result() {
    try {
      this.editor.clearMarkers();
      return { result: compile(this.source) };
    } catch (error) {
      console.error(error);
      this.editor.setErrorMarkers(error);
      return { error: error };
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

  async exportMidi() {
    var blob = new Blob([await this.tune.toMidiBuffer()], { type: "audio/midi" });
    var link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;

    link.download =
      this.fileName + dayjs().format(" YYYY-MM-DD-HH-mm") + ".mid";
    link.click();
    URL.revokeObjectURL(url);
  }

  saveTune() {
    var blob = new Blob([this.source], { type: "text/plain" });
    var link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;

    link.download =
      this.fileName + dayjs().format(" YYYY-MM-DD-HH-mm") + ".tune";
    link.click();
    URL.revokeObjectURL(url);
  }

  openTune(file) {
    var fr = new FileReader();
    fr.onload = action(() => {
      //this.source = fr.result;
      this.fileName = file.name.replace(/[0-9\-]+\..*$/, "");
      this.editor.value = fr.result
    });
    fr.readAsText(file);
  }

  @computed get midiOutputIndex() {
    return this.settings.midiOutputIndex;
  }

  set midiOutputIndex(value) {
    this.player?.stop();
    this.settings.midiOutputIndex = value;
  }

  @observable midi = null;
  @observable midiOutputs = []
  @computed get midiOutput() {
    return this.midiOutputs[this.midiOutputIndex]
  }

  constructor() {
    top.tc = this;
    let lastResult;
    navigator.requestMIDIAccess().then(action(midi=>{
      this.midi = midi;
      this.midiOutputs = Array.from(midi.outputs.values());
    }));
    Object.assign(this.settings, storageGet('tunecraft_settings', {}))
    makeObservable(this);
    autorun(()=>storageSet('tunecraft_settings',toJS(this.settings)));
    reaction(
      () => {
        this.tune;
        return this.result;
      },
      ({ result, error }) => {
        if (result === lastResult) return;
        lastResult = result;
        storageSet('tunecraft_save', this.source)
        if (result) {
          console.time("new tune");
          this.tune = new Tune(result);
          console.timeEnd("new tune");
        }
      }
    );

    reaction(
      () => this.player.playing && this.following && this.player.playbackTime,
      (time) => {
        if (typeof time !== "number") return;
        const b = this.viewBeginTime;
        if (time < b + 1) {
          this.viewBeginTime = time - 1;
          return;
        }
        const e = this.viewEndTime;

        if (time > e - 1) this.viewBeginTime = time - 1;
      }
    );

    this.init();
  }
  @action init() {
    this.source = storageGet("tunecraft_save", "")
  }
}
