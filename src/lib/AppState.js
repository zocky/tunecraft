import { trace, observable, computed, makeObservable, reaction, action } from "mobx";
import { parse } from "./tunecraft.pegjs";

import Soundfont from "soundfont-player";
import { PlayerState } from "./PlayerState";
import { Tune } from "./Tune";
import { clamp } from "./utils";

export class AppState {
  context = new AudioContext();
  player = new PlayerState(this);

  @observable
  editorWidth = 500;

  @observable
  settings = {
    zoomX: 12,
    zoomY: 2,
    loopIn: null,
    loopOut: null,
    looping: false
  }

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

  @observable
  loopIn = null;

  @observable
  loopOut = null;


  @observable viewerMode = "tracks";

  @observable source = "";


  @computed get result() {
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

  @computed get instruments() {
    trace();
    const tune = this.tune;
    const ret = {};
    if (!tune) return {};
    for (const track of tune.tracks) {
      const { font, instrument, id, ...rest } = track;
      const options = {}
      if (rest.attack) options.attack = rest.attack / 1000;
      if (rest.decay) options.decay = rest.decay / 1000;
      if (rest.sustain) options.sustain = rest.sustain / 100;
      if (rest.release) options.release = rest.release / 1000;
      ret[id] = InstrumentState.create(this.context, this.soundfonts[font], instrument, options);
    }
    return ret;
  }


  constructor() {
    top.app = this;
    let lastResult;
    makeObservable(this);
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

class InstrumentState {
  static _instruments = {};
  static create(context, font, name, options) {
    return new InstrumentState(context, font, name, options);
  }

  static async loadInstrument(context, font, name) {
    const id = font+'\n'+name
    if (!this._instruments[id]) {
      try {
        this._instruments[id] = await Soundfont.instrument(context, name, {
          soundfont: font,
          nameToUrl: (name, sf, format = 'mp3') => {
            if (!sf.match(/^https?:/)) {
              if (name==='percussion') {
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
    this.load();
  }
  async load() {
    this.instrument = await this.constructor.loadInstrument(this.context, this.font, this.name);
  }

  play(note, at, options = {}) {
    this.instrument?.play(note, at, { ...this.options, ...options });
  }

  stop() {
    this.instrument?.stop();
  }
}
