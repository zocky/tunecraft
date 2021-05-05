import { translateTickTime } from "./Util";


/* ******************************************************************
  * Event class
  ****************************************************************** */

/**
 * Construct a MIDI event.
 *
 * Parameters include:
 *  - time [optional number] - Ticks since previous event.
 *  - type [required number] - Type of event.
 *  - channel [required number] - Channel for the event.
 *  - param1 [required number] - First event parameter.
 *  - param2 [optional number] - Second event parameter.
 */


export class MidiEvent {
  constructor({ type, time, channel = 1, param1, param2 = null }) {
    this.setTime(time);
    this.setType(type);
    this.setChannel(channel);
    this.setParam1(param1);
    this.setParam2(param2);
  }

  // event codes
  NOTE_OFF = 0x80;
  NOTE_ON = 0x90;
  AFTER_TOUCH = 0xA0;
  CONTROLLER = 0xB0;
  PROGRAM_CHANGE = 0xC0;
  CHANNEL_AFTERTOUCH = 0xD0;
  PITCH_BEND = 0xE0;

  /**
   * Set the time for the event in ticks since the previous event.
   *
   * @param {number} ticks - The number of ticks since the previous event. May
   * be zero.
   */
  setTime(ticks) {
    this.time = translateTickTime(ticks || 0);
  };

  /**
   * Set the type of the event. Must be one of the event codes on MidiEvent.
   *
   * @param {number} type - Event type.
   */
  setType(type) {
    if (type < MidiEvent.NOTE_OFF || type > MidiEvent.PITCH_BEND) {
      throw new Error("Trying to set an unknown event: " + type);
    }
    this.type = type;
  };

  /**
   * Set the channel for the event. Must be between 0 and 15, inclusive.
   *
   * @param {number} channel - The event channel.
   */
  setChannel(channel) {
    if (channel < 0 || channel > 15) {
      throw new Error("Channel is out of bounds.");
    }
    this.channel = channel;
  };

  /**
   * Set the first parameter for the event. Must be between 0 and 255,
   * inclusive.
   *
   * @param {number} p - The first event parameter value.
   */
  setParam1(p) {
    this.param1 = p;
  };

  /**
   * Set the second parameter for the event. Must be between 0 and 255,
   * inclusive.
   *
   * @param {number} p - The second event parameter value.
   */
  setParam2(p) {
    this.param2 = p;
  };

  /**
   * Serialize the event to an array of bytes.
   *
   * @returns {Array} The array of serialized bytes.
   */
  toBytes() {
    var byteArray = [];

    var typeChannelByte = this.type | (this.channel & 0xF);

    byteArray.push.apply(byteArray, this.time);
    byteArray.push(typeChannelByte);
    byteArray.push(this.param1);

    // Some events don't have a second parameter
    if (this.param2 !== undefined && this.param2 !== null) {
      byteArray.push(this.param2);
    }
    return byteArray;
  };
}