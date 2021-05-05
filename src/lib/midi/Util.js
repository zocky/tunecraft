
export function assert(a,b) {
  if (!a) throw new Error(b);
}

export const midi_letter_pitches = { a: 21, b: 23, c: 12, d: 14, e: 16, f: 17, g: 19 };

/**
 * Convert a symbolic note name (e.g. "c4") to a numeric MIDI pitch (e.g.
 * 60, middle C).
 *
 * @param {string} n - The symbolic note name to parse.
 * @returns {number} The MIDI pitch that corresponds to the symbolic note
 * name.
 */
export function midiPitchFromNote(n) {
  var matches = /([a-g])(#+|b+)?([0-9]+)$/i.exec(n);
  var note = matches[1].toLowerCase(), accidental = matches[2] || '', octave = parseInt(matches[3], 10);
  return (12 * octave) + midi_letter_pitches[note] + (accidental.substr(0, 1) == '#' ? 1 : -1) * accidental.length;
};

/**
 * Ensure that the given argument is converted to a MIDI pitch. Note that
 * it may already be one (including a purely numeric string).
 *
 * @param {string|number} p - The pitch to convert.
 * @returns {number} The resulting numeric MIDI pitch.
 */
export function ensureMidiPitch(p) {
  if (typeof p == 'number' || !/[^0-9]/.test(p)) {
    // numeric pitch
    return parseInt(p, 10);
  } else {
    // assume it's a note name
    return midiPitchFromNote(p);
  }
};

export const midi_pitches_letter = { '12': 'c', '13': 'c#', '14': 'd', '15': 'd#', '16': 'e', '17': 'f', '18': 'f#', '19': 'g', '20': 'g#', '21': 'a', '22': 'a#', '23': 'b' };
export const midi_flattened_notes = { 'a#': 'bb', 'c#': 'db', 'd#': 'eb', 'f#': 'gb', 'g#': 'ab' };

/**
 * Convert a numeric MIDI pitch value (e.g. 60) to a symbolic note name
 * (e.g. "c4").
 *
 * @param {number} n - The numeric MIDI pitch value to convert.
 * @param {boolean} [returnFlattened=false] - Whether to prefer flattened
 * notes to sharpened ones. Optional, default false.
 * @returns {string} The resulting symbolic note name.
 */
export function noteFromMidiPitch (n, returnFlattened) {
  var octave = 0, noteNum = n, noteName, returnFlattened = returnFlattened || false;
  if (n > 23) {
    // noteNum is on octave 1 or more
    octave = Math.floor(n / 12) - 1;
    // subtract number of octaves from noteNum
    noteNum = n - octave * 12;
  }

  // get note name (c#, d, f# etc)
  noteName = midi_pitches_letter[noteNum];
  // Use flattened notes if requested (e.g. f# should be output as gb)
  if (returnFlattened && noteName.indexOf('#') > 0) {
    noteName = midi_flattened_notes[noteName];
  }
  return noteName + octave;
};

/**
 * Convert beats per minute (BPM) to microseconds per quarter note (MPQN).
 *
 * @param {number} bpm - A number in beats per minute.
 * @returns {number} The number of microseconds per quarter note.
 */
export function mpqnFromBpm (bpm) {
  var mpqn = Math.floor(60000000 / bpm);
  var ret = [];
  do {
    ret.unshift(mpqn & 0xFF);
    mpqn >>= 8;
  } while (mpqn);
  while (ret.length < 3) {
    ret.push(0);
  }
  return ret;
};

/**
 * Convert microseconds per quarter note (MPQN) to beats per minute (BPM).
 *
 * @param {number} mpqn - The number of microseconds per quarter note.
 * @returns {number} A number in beats per minute.
 */
export function bpmFromMpqn (mpqn) {
  var m = mpqn;
  if (typeof mpqn[0] != 'undefined') {
    m = 0;
    for (var i = 0, l = mpqn.length - 1; l >= 0; ++i, --l) {
      m |= mpqn[i] << l;
    }
  }
  return Math.floor(60000000 / mpqn);
};

/**
 * Converts an array of bytes to a string of hexadecimal characters. Prepares
 * it to be converted into a base64 string.
 *
 * @param {Array} byteArray - Array of bytes to be converted.
 * @returns {string} Hexadecimal string, e.g. "097B8A".
 */
export function codes2Str (byteArray) {
  return String.fromCharCode.apply(null, byteArray);
}

/**
 * Converts a string of hexadecimal values to an array of bytes. It can also
 * add remaining "0" nibbles in order to have enough bytes in the array as the
 * `finalBytes` parameter.
 *
 * @param {string} str - string of hexadecimal values e.g. "097B8A"
 * @param {number} [finalBytes] - Optional. The desired number of bytes
 * (not nibbles) that the returned array should contain.
 * @returns {Array} An array of nibbles.
 */
export function str2Bytes (str, finalBytes) {
  if (finalBytes) {
    while ((str.length / 2) < finalBytes) { str = "0" + str; }
  }

  var bytes = [];
  for (var i = str.length - 1; i >= 0; i = i - 2) {
    var chars = i === 0 ? str[i] : str[i - 1] + str[i];
    bytes.unshift(parseInt(chars, 16));
  }

  return bytes;
}

/**
 * Translates number of ticks to MIDI timestamp format, returning an array
 * of bytes with the time values. MIDI has a very particular way to express
 * time; take a good look at the spec before ever touching this function.
 *
 * @param {number} ticks - Number of ticks to be translated.
 * @returns {number} Array of bytes that form the MIDI time value.
 */
export function translateTickTime (ticks) {
  var buffer = ticks & 0x7F;

  while (ticks = ticks >> 7) {
    buffer <<= 8;
    buffer |= ((ticks & 0x7F) | 0x80);
  }

  var bList = [];
  while (true) {
    bList.push(buffer & 0xff);

    if (buffer & 0x80) { buffer >>= 8; }
    else { break; }
  }
  return bList;
}
