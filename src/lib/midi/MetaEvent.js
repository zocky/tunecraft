import { translateTickTime } from "./Util";


/* ******************************************************************
 * MetaEvent class
 ****************************************************************** */

/**
 * Construct a meta event.
 *
 * Parameters include:
 *  - time [optional number] - Ticks since previous event.
 *  - type [required number] - Type of event.
 *  - data [optional array|string] - Event data.
 */
class MetaEvent {
  constructor({ time, type, data }) {
    this.setTime(time);
    this.setType(type);
    this.setData(data);
  };

  SEQUENCE = 0x00;
  TEXT = 0x01;
  COPYRIGHT = 0x02;
  TRACK_NAME = 0x03;
  INSTRUMENT = 0x04;
  LYRIC = 0x05;
  MARKER = 0x06;
  CUE_POINT = 0x07;
  CHANNEL_PREFIX = 0x20;
  END_OF_TRACK = 0x2f;
  TEMPO = 0x51;
  SMPTE = 0x54;
  TIME_SIG = 0x58;
  KEY_SIG = 0x59;
  SEQ_EVENT = 0x7f;

  /**
   * Set the time for the event in ticks since the previous event.
   *
   * @param {number} ticks - The number of ticks since the previous event. May
   * be zero.
   */
  setTime (ticks) {
    this.time = translateTickTime(ticks || 0);
  };

  /**
   * Set the type of the event. Must be one of the event codes on MetaEvent.
   *
   * @param {number} t - Event type.
   */
  setType (t) {
    this.type = t;
  };

  /**
   * Set the data associated with the event. May be a string or array of byte
   * values.
   *
   * @param {string|Array} d - Event data.
   */
  setData (d) {
    this.data = d;
  };

  /**
   * Serialize the event to an array of bytes.
   *
   * @returns {Array} The array of serialized bytes.
   */
  toBytes () {
    if (!this.type) {
      throw new Error("Type for meta-event not specified.");
    }

    var byteArray = [];
    byteArray.push.apply(byteArray, this.time);
    byteArray.push(0xFF, this.type);

    // If data is an array, we assume that it contains several bytes. We
    // apend them to byteArray.
    if (Array.isArray(this.data)) {
      byteArray.push(this.data.length);
      byteArray.push.apply(byteArray, this.data);
    } else if (typeof this.data == 'number') {
      byteArray.push(1, this.data);
    } else if (this.data !== null && this.data !== undefined) {
      // assume string; may be a bad assumption
      byteArray.push(this.data.length);
      var dataBytes = this.data.split('').map(function (x) { return x.charCodeAt(0) });
      byteArray.push.apply(byteArray, dataBytes);
    } else {
      byteArray.push(0);
    }

    return byteArray;
  }
}