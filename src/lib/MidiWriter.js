import JZZ from "jzz";
import SMF from "jzz-midi-smf";
import { pitchToNoteName, pitchToText } from "./utils";
SMF(JZZ);

const handlers = {
  ID: (trk, { tick, id }) => {
    trk.add(tick, JZZ.MIDI.smfSeqName(id))
  },
  ON: (trk, { channel, tick, note, velocity }) => {
    trk.add(tick, JZZ.MIDI.noteOn(channel, note, velocity))
  },
  OFF: (trk, { channel, tick, note }) => {
    trk.add(tick, JZZ.MIDI.noteOff(channel, note))
  },
  T: (trk, { tick, tempo }) => {
    trk.add(tick, JZZ.MIDI.smfBPM(tempo))
  },
  I: (trk, { tick, channel, instrument }) => {
    trk.add(tick, JZZ.MIDI.program(channel, instrument||0))
  },
  EOT: (trk, { tick }) => {
    trk.add(tick, JZZ.MIDI.smfEndOfTrack())
  }
};

export const MidiWriter = new class {
  toSmf(tune) {
    const smf = new JZZ.MIDI.SMF(1, tune.TPQ);
    for (const track of tune.tracks) {
      const events = track.eventsForMidi;
      var trk = new JZZ.MIDI.SMF.MTrk();
      smf.push(trk);
      for (const {event, ...e} of events) {
        const handler = handlers[event];
        handler && handler(trk,e);
      }
    }
    return smf
  }

  toArrayBuffer(tune) {
    this.toSmf(tune);
    const str = smf.dump();
    var buf = new ArrayBuffer(str.length); // 2 bytes for each char
    var bufView = new Uint8Array(buf);
    for (var i=0, strLen=str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
    return buf;
  }
}