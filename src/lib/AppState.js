import React from "react";
import { render } from "react-dom";
import { trace,observable, computed, makeObservable, reaction, action } from "mobx";
import { parse } from "./tunecraft.pegjs";

import { PlayerState } from "./PlayerState";

export class AppState {
  context = new AudioContext();
  player = new PlayerState(this);

  @observable 
  zoomX = 64;
  @observable 
  zoomY = 2;

  @action 
  zoomInY() {
    if (this.zoomY<8) this.zoomY++;
  }

  @action 
  zoomOutY() {
    if (this.zoomY>1) this.zoomY--;
  }

  @observable viewerMode = "tracks";

  @observable source = "";


  @computed get result() {
    console.log('getting result')

    try {
      return { result: parse(this.source) };
    } catch (error) {
      console.error(error);
      return { error: error }
    }
  }

  @computed get error() {
    return this.result.error;
  }

  @observable parsed = {};

  @computed get tracks() {
    const ret = [];
    if (!this.parsed) return ret;
    for (let id in this.parsed.tracks) {
      const track=this.parsed.tracks[id];
      if (track.length===0) continue;
      ret.push({
        id,
        events: track
      })
    }
    return ret;
  }

  @computed.struct get trackKeys() {
    return Object.keys(this.tracks);
  }

  @computed get soundfonts() {
    trace();
    if (!this.parsed) return {};
    return { default: "MusyngKite", ...this.parsed.soundfonts }
  }

  @computed get instruments() {
    trace();
    const result = this.parsed;
    if (!result) return {};
    const ret = {};
    for (const name in result.instruments) {
      const { font, id, ...rest } = result.instruments[name];
      const options = {}
      if (rest.attack) options.attack = rest.attack / 1000;
      if (rest.decay) options.decay = rest.decay / 1000;
      if (rest.sustain) options.sustain = rest.sustain / 100;
      if (rest.release) options.release = rest.release / 1000;
      ret[name] = InstrumentState.create(this.context, this.soundfonts[font], id, options);
    }
    return ret;
  }

  constructor() {
    makeObservable(this);
    let lastResult;
    reaction(() => { this.instruments; return this.result} , ({ result, error }) => {
      if (result ===lastResult) return;
      lastResult = result;
      localStorage.tunecraft_save = this.source;
      if (result) {
        this.parsed = result; 
      }
    })
    this.init();
  }
  @action init() {
    this.source = localStorage.tunecraft_save || ""
  }
}

class InstrumentState {
  static _instruments = {};
  static create(context, font, name, options) {
    return new InstrumentState(context, font, name, options);
  }

  static async loadInstrument(context, font, name) {
    const id = font + "\n" + name;
    if (!this._instruments[id]) {
      try {
        this._instruments[id] = await Soundfont.instrument(context, name, {
          soundfont: font,
          nameToUrl: (name, sf, format = 'mp3') => {
            if (!sf.match(/^https?:/)) {
              sf = "https://gleitz.github.io/midi-js-soundfonts/" + sf;
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
    this.load();
  }
  async load() {
    this.instrument = await this.constructor.loadInstrument(this.context,this.font, this.name);
  }

  play(note, at, options = {}) {
    this.instrument?.play(note, at, { ...this.options, ...options });
  }

  stop() {
    this.instrument?.stop();
  }
}

