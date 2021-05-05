
import { MidiEvent } from "./MidiEvent";
import { MetaEvent } from "./MetaEvent";
import { ensureMidiPitch, mpqnFromBpm, str2Bytes } from "./Util";

  /* ******************************************************************
   * Track class
   ****************************************************************** */

  /**
   * Construct a MIDI track.
   *
   * Parameters include:
   *  - events [optional array] - Array of events for the track.
   */
  

export class Track {
  constructor(config = {}) {
    this.events = config.events || [];
  };

  static START_BYTES = [0x4d, 0x54, 0x72, 0x6b];
  static END_BYTES = [0x00, 0xFF, 0x2F, 0x00];

  /**
   * Add an event to the track.
   *
   * @param {MidiEvent|MetaEvent} event - The event to add.
   * @returns {Track} The current track.
   */
  addEvent(event) {
    this.events.push(event);
    return this;
  };

  /**
   * Add a note-on event to the track.
   *
   * @param {number} channel - The channel to add the event to.
   * @param {number|string} pitch - The pitch of the note, either numeric or
   * symbolic.
   * @param {number} [time=0] - The number of ticks since the previous event,
   * defaults to 0.
   * @param {number} [velocity=90] - The volume for the note, defaults to
   * DEFAULT_VOLUME.
   * @returns {Track} The current track.
   */
  addNoteOn(channel, pitch, time, velocity) {
    this.events.push(new MidiEvent({
      type: MidiEvent.NOTE_ON,
      channel: channel,
      param1: ensureMidiPitch(pitch),
      param2: velocity || DEFAULT_VOLUME,
      time: time || 0,
    }));
    return this;
  };
  noteOn(...args) {
    return this.addNoteOn(...args);
  }

  /**
   * Add a note-off event to the track.
   *
   * @param {number} channel - The channel to add the event to.
   * @param {number|string} pitch - The pitch of the note, either numeric or
   * symbolic.
   * @param {number} [time=0] - The number of ticks since the previous event,
   * defaults to 0.
   * @param {number} [velocity=90] - The velocity the note was released,
   * defaults to DEFAULT_VOLUME.
   * @returns {Track} The current track.
   */
  addNoteOff(channel, pitch, time, velocity) {
    this.events.push(new MidiEvent({
      type: MidiEvent.NOTE_OFF,
      channel: channel,
      param1: ensureMidiPitch(pitch),
      param2: velocity || DEFAULT_VOLUME,
      time: time || 0,
    }));
    return this;
  };
  noteOff(...args) {
    return this.addNoteOff(...args);
  }

  /**
   * Add a note-on and -off event to the track.
   *
   * @param {number} channel - The channel to add the event to.
   * @param {number|string} pitch - The pitch of the note, either numeric or
   * symbolic.
   * @param {number} dur - The duration of the note, in ticks.
   * @param {number} [time=0] - The number of ticks since the previous event,
   * defaults to 0.
   * @param {number} [velocity=90] - The velocity the note was released,
   * defaults to DEFAULT_VOLUME.
   * @returns {Track} The current track.
   */
  addNote (channel, pitch, dur, time, velocity) {
    this.noteOn(channel, pitch, time, velocity);
    if (dur) {
      this.noteOff(channel, pitch, dur, velocity);
    }
    return this;
  };
  note(...args) {
    return this.addNote(...args);
  }

  /**
   * Set instrument for the track.
   *
   * @param {number} channel - The channel to set the instrument on.
   * @param {number} instrument - The instrument to set it to.
   * @param {number} [time=0] - The number of ticks since the previous event,
   * defaults to 0.
   * @returns {Track} The current track.
   */
  setInstrument(channel, instrument, time) {
    this.events.push(new MidiEvent({
      type: MidiEvent.PROGRAM_CHANGE,
      channel: channel,
      param1: instrument,
      time: time || 0,
    }));
    return this;
  };
  instrument(...args) {
    return this.setInstrument(...args);
  }

  /**
   * Set the tempo for the track.
   *
   * @param {number} bpm - The new number of beats per minute.
   * @param {number} [time=0] - The number of ticks since the previous event,
   * defaults to 0.
   * @returns {Track} The current track.
   */
  setTempo(bpm, time) {
    this.events.push(new MetaEvent({
      type: MetaEvent.TEMPO,
      data: mpqnFromBpm(bpm),
      time: time || 0,
    }));
    return this;
  };

  tempo(...args) {
    return this.setTempo(...args);
  }
  /**
   * Serialize the track to an array of bytes.
   *
   * @returns {Array} The array of serialized bytes.
   */
  toBytes () {
    var trackLength = 0;
    var eventBytes = [];
    var startBytes = Track.START_BYTES;
    var endBytes = Track.END_BYTES;

    var addEventBytes = function (event) {
      var bytes = event.toBytes();
      trackLength += bytes.length;
      eventBytes.push.apply(eventBytes, bytes);
    };

    this.events.forEach(addEventBytes);

    // Add the end-of-track bytes to the sum of bytes for the track, since
    // they are counted (unlike the start-of-track ones).
    trackLength += endBytes.length;

    // Makes sure that track length will fill up 4 bytes with 0s in case
    // the length is less than that (the usual case).
    var lengthBytes = str2Bytes(trackLength.toString(16), 4);

    return startBytes.concat(lengthBytes, eventBytes, endBytes);
  }
}