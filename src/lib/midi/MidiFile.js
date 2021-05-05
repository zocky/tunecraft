import { Track } from "./Track";

const { codes2Str, assert, str2Bytes } = require("./Util");

export var DEFAULT_VOLUME = 90;
export var DEFAULT_DURATION = 128;
export var DEFAULT_TICKS = 96;
export var DEFAULT_CHANNEL = DEFAULT_CHANNEL = 1;

/* ******************************************************************
 * File class
 ****************************************************************** */

/**
 * Construct a file object.
 *
 * Parameters include:
 *  - ticks [optional number] - Number of ticks per beat, defaults to 96.
 *    Must be 1-32767.
 *  - tracks [optional array] - Track data.
 */
export class MidiFile {
  constructor({ ticks = DEFAULT_TICKS }={}) {
    assert(!isNaN(ticks),'Ticks per beat must be a number!');
    assert(c.ticks %1 === 0 && c.ticks >= 1 && c.ticks <= 32767,
      'Ticks per beat must be an integer between 1 and 32767!'
    );
    this.ticks = ticks;
  };
  tracks = [];

  static HDR_CHUNKID = "MThd";             // File magic cookie
  static HDR_CHUNK_SIZE = "\x00\x00\x00\x06"; // Header length for SMF
  static HDR_TYPE0 = "\x00\x00";         // Midi Type 0 id
  static HDR_TYPE1 = "\x00\x01";         // Midi Type 1 id

  /**
   * Add a track to the file.
   *
   * @param {Track} track - The track to add.
   */
  addTrack(track) {
    if (track) {
      this.tracks.push(track);
      return this;
    } else {
      track = new Track();
      this.tracks.push(track);
      return track;
    }
  };

  /**
   * Serialize the MIDI file to an array of bytes.
   *
   * @returns {Array} The array of serialized bytes.
   */
  toBytes() {
    var trackCount = this.tracks.length.toString(16);

    // prepare the file header
    var bytes = MidiFile.HDR_CHUNKID + MidiFile.HDR_CHUNK_SIZE;

    // set Midi type based on number of tracks
    if (parseInt(trackCount, 16) > 1) {
      bytes += MidiFile.HDR_TYPE1;
    } else {
      bytes += MidiFile.HDR_TYPE0;
    }

    // add the number of tracks (2 bytes)
    bytes += codes2Str(str2Bytes(trackCount, 2));
    // add the number of ticks per beat (currently hardcoded???? doesn't seem to be)
    bytes += String.fromCharCode((this.ticks / 256), this.ticks % 256);;

    // iterate over the tracks, converting to bytes too
    this.tracks.forEach(function (track) {
      bytes += codes2Str(track.toBytes());
    });
    return bytes;
  };
}