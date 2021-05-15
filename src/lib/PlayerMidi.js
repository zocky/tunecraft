import { action, observable, computed, makeObservable, flow, reaction, when, autorun } from "mobx";
import { PlayerState } from "./PlayerState";

export class PlayerMidi extends PlayerState {
  constructor(app) {
    super(app);
    makeObservable(this);
  }

  dispatchEvent(e, at) {
    const { event, duration, channel, note, velocity } = e;
    switch (e.event) {
      case 'N':
        this.send([0x90 + channel, note, velocity], at)
        this.send([0x80 + channel, note, velocity], at+duration)
        return;
      case 'I':
        this.send([0xC0 + channel, e.instrument], at)
        return;
    }
  }

  @action.bound
  silence() {
    for (let channel = 0; channel<16; channel++) {
      this.send([0xB0+channel, 0x7b, 0 ],0)
      this.send([0xB0+channel, 0x7b, 0 ],150)
      this.send([0xB0+channel, 0x7b, 0 ],300)
      this.send([0xB0+channel, 0x7b, 0 ],450)
      this.send([0xB0+channel, 0x7b, 0 ],600)
      this.send([0xB0+channel, 0x7b, 0 ],750)
      this.send([0xB0+channel, 0x7b, 0 ],900)
      this.send([0xB0+channel, 0x7b, 0 ],1200)
      this.send([0xB0+channel, 0x7b, 0 ],1500)
    };
    //this.app.midiOutput.clear();
  }

  send(bytes,at) {
    this.app.midiOutput.send(bytes,at*1000);
  }

  playNote(e, at = this.currentTime) {
    const { event, duration, channel, note, velocity } = e;
    if (event !== 'N') return;
    this.send([0x90 + channel, note, velocity], at)
    this.send([0x80 + channel, note, 1], at + duration)
  }

  setInstrument(e, at = this.currentTime) {
    this.send([0xC0 + channel, e.instrument, 0], at)
  }

  get currentTime() {
    return performance.now() / 1000;
  }
}