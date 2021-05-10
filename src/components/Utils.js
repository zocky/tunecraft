import React from "react";
import { observer } from "mobx-react";
import { action, computed, makeObservable } from "mobx";

@observer
export class Draggable extends React.Component {
  onMouseDown = e => {
    const {
      buttons = 1,
      ctrl = false,
      shift = false,
      onBeginDrag = e => { },
      onDrag = e => { },
      onEndDrag = e => { },
      draggingClass = 'dragging'
    } = this.props;
    if (e.buttons != buttons) return;
    if (e.ctrlKey != ctrl) return;
    if (e.shiftKey != shift) return;
    console.log('drag')

    const { draggable } = this.ref;
    const dd = { draggable, nativeEvent: e.nativeEvent };
    const onMove = action(e => {
      onDrag(e, dd);
      e.stopPropagation();
    });

    const onUp = action(e => {
      window.removeEventListener('mousemove', onMove, true)
      window.removeEventListener('mouseup', onUp, true)
      draggingClass && this.ref.classList.remove(draggingClass);
      action(onEndDrag)(e, dd);
      e.stopPropagation();
    })
    window.addEventListener('mousemove', onMove, true);
    window.addEventListener('mouseup', onUp, true);
    draggingClass && this.ref.classList.add(draggingClass);
    action(onBeginDrag)(e, dd);
    e.stopPropagation();
  }
  render() {
    const { children, as: As = 'div', buttons, ctrl, shift, onBeginDrag, onEndDrag, onDrag, draggingClass, ...attr } = this.props;
    return (<As ref={ref => this.ref = ref} {...attr} onMouseMove={this.onMouseDown}>
      {children}
    </As>
    )
  }
}


@observer
export class Wheelable extends React.Component {
  onWheel = e => {
    const {
      ctrl,
      shift,
      onWheel = e => { },
    } = this.props;
    if (ctrl !== undefined && e.ctrlKey != ctrl) return;
    if (shift !== undefined && e.shiftKey != shift) return;

    const wheelable = this.ref;
    action(onWheel)(e);
  }
  render() {
    const { children, as: As = 'div', ctrl, shift, onWheel, ...attr } = this.props;
    return (
      <As {...attr}
        ref={el => el?.addEventListener('wheel', this.onWheel, { passive: false })}
      >
        {children}
      </As>
    )
  }
}




@observer
export class Resizable extends React.Component {
  componentDidMount() {
    const onResize = action(this.props.onResize);
    this.observer = new ResizeObserver(action(entries => {
      for (let entry of entries) {
        onResize( entry.contentRect);
      }
    }));
    this.observer.observe(this.ref);
  }
  componentWillMount() {
    this.observer.disconnect();
  }
  render() {
    const { children, as: As = 'div', onResize, ...attr } = this.props;
    return (<As ref={ref => this.ref = ref} {...attr}>
      {children}
    </As>
    )
  }
}


export function onResize(element,handler) {
  if(!element) return;
  const onResize = action(handler);
  const observer = new ResizeObserver(action(entries => {
    for (let entry of entries) {
      onResize( entry.contentRect);
    }
  }));
  observer.observe(element);
}


export function onWheel(element,handler) {
  const onWheel = action(handler);
  element.addEventListener('wheel',onWheel,{passive:false});
}

export function formatTime(time) {
   return `${0 | (time / 60)}:${(time % 60).toFixed(1).padStart(4, "0")}`;
}
