import Soundfont from "soundfont-player";

export class SoundfontInstrument {
  static _instruments = {};
  static create(context, font, name, options) {
    return new this(context, font, name, options);
  }

  static async loadInstrument(context, font, name) {
    const id = font + '\n' + name
    if (!this._instruments[id]) {
      console.log('loading',id)
      try {
        this._instruments[id] = await Soundfont.instrument(context, name, {
          soundfont: font,
          nameToUrl: (name, sf, format = 'mp3') => {
            if (!sf.match(/^https?:/)) {
              if (name === 'percussion') {
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
    const id = font + '\n' + name;
    this.instrument=this.constructor._instruments[id];
    if (!this.instrument) {this.load()};

  }
  async load() {
    this.instrument = await this.constructor.loadInstrument(this.context, this.font, this.name);
  }

  play(note, at, options = {}) {
//    if(!this.instrument) console.log('no',this.name)
    this.instrument?.play(note, at, { ...this.options, ...options });
  }

  stop() {
    this.instrument?.stop();
  }
}
