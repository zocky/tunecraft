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
      action(onEndDrag)(e,dd);
      e.stopPropagation();
    })
    window.addEventListener('mousemove', onMove, true);
    window.addEventListener('mouseup', onUp, true);
    draggingClass && this.ref.classList.add(draggingClass);
    action(onBeginDrag)(e,dd);
    e.stopPropagation();
  }
  render() {
    const { children, as: As = 'div', buttons, ctrl, shift, onBeginDrag, onEndDrag, onDrag, draggingClass, ...attr } = this.props;
    return (<As ref={ref => this.ref = ref} {...attr} onMouseDown={this.onMouseDown}>
      {children}
    </As>
    )
  }
}

