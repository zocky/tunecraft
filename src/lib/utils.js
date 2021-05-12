import classNames from "classnames";
import { action } from "mobx";
export const classes = classNames;

export const debounce = (func, wait, immediate) => {
  var timeout;
  return function () {
    var context = this, args = arguments;
    var later = function () {
      timeout = null;
      if (!immediate) func.apply(context, args);
    };
    var callNow = immediate && !timeout;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
    if (callNow) func.apply(context, args);
  };
};

export const throttle = (func, limit) => {
  let lastFunc
  let lastRan
  return function () {
    const context = this
    const args = arguments
    if (!lastRan) {
      func.apply(context, args)
      lastRan = Date.now()
    } else {
      clearTimeout(lastFunc)
      lastFunc = setTimeout(function () {
        if ((Date.now() - lastRan) >= limit) {
          func.apply(context, args)
          lastRan = Date.now()
        }
      }, limit - (Date.now() - lastRan))
    }
  }
}

export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function findClosest(needle, haystack) {

  const getClosest = (val1, val2, target) => {
    if (target - val1 >= val2 - target)
      return val2;
    else
      return val1;
  }

  let n = haystack.length;

  // Corner cases
  if (needle <= haystack[0])
    return haystack[0];
  if (needle >= haystack[n - 1])
    return haystack[n - 1];

  // Doing binary search
  let i = 0, j = n, mid = 0;
  while (i < j) {
    mid = Math.floor((i + j) / 2);

    if (haystack[mid] == needle)
      return haystack[mid];

    // If target is less than array
    // element,then search in left
    if (needle < haystack[mid]) {

      // If target is greater than previous
      // to mid, return closest of two
      if (mid > 0 && needle > haystack[mid - 1])
        return getClosest(haystack[mid - 1],
          haystack[mid], needle);

      // Repeat for left half
      j = mid;
    }

    // If target is greater than mid
    else {
      if (mid < n - 1 && needle < haystack[mid + 1])
        return getClosest(haystack[mid],
          haystack[mid + 1],
          needle);
      i = mid + 1; // update i
    }
  }

  // Only single element left after search
  return haystack[mid];

  
}


export function storageGet(name, def = null) {
  try {
    return JSON.parse(localStorage[name]);
  } catch (error) {
    return def;
  }
}

export function storageSet(name, value, def = null) {
  try {
    localStorage[name] = JSON.stringify(value);
  } catch (error) {
    localStorage[name] = JSON.stringify(def);
  }
}

export function pitchToText(pitch) {
  const tone = pitch % 12;
  const octave = (pitch-tone)/12+1;
  return ['C','C♯','D','D♯','E','F','F♯','G','G♯','A','A♯','B'][tone]+octave.toFixed(0);
}

export function handleMouse(handlers) {
  return action(e=>{
    if (handlers.before) handlers.before(e);
    let id = e.buttons % 8;
    if (e.ctrlKey) id+=MOUSE.CTRL;
    if (e.shiftKey) id+=MOUSE.SHIFT;
    if (handlers[id]) handlers[id](e)
    if (handlers.after) handlers.after(e);
  })
}

export const MOUSE = {
  NONE: 0,
  LEFT: 1,
  RIGHT: 2,
  MIDDLE: 4,
  CTRL: 8,
  SHIFT: 16,
  CTRL_LEFT: 1 | 8,
  SHIFT_LEFT: 1 | 16,
  CTRL_SHIFT_LEFT: 1 | 8 | 16,
  CTRL_RIGHT: 2 | 8,
  SHIFT_RIGHT: 2 | 16,
  CTRL_SHIFT_RIGHT: 2 | 8 | 16,
  CTRL_MIDDLE: 4 | 8,
  SHIFT_MIDDLE: 4 | 16,
  CTRL_SHIFT_MIDDLE: 4 | 8 | 16,
  
}

