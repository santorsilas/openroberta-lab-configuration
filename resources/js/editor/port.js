import { svg, getPositionRelative } from './utils.js';
import ChangeNotifier from './change_notifier.js';

class Port extends ChangeNotifier {
  constructor({ name, position, connectedTo }) {
    super();

    this.name = name;

    this.position = position;

    this.connectedTo = connectedTo;

    this.element = svg('rect', {
      'width': 5,
      'height': 5,
      'fill': 'red',
      'stroke': 'black',
      'stroke-width': 1,
      'x': position.x,
      'y': position.y,
      'r': 3,
      'opacity': 0,
    });

    this.element.addEventListener('mousedown', () => editor.wire.create(this));

    this.element.addEventListener('mouseover', () => this.element.setAttribute('opacity', '1'));

    this.element.addEventListener('mouseout', () => this.element.setAttribute('opacity', '0'));

    //TODO: refactor to use vanilla js
    $(this.element).popover({ content: name, trigger: 'hover', placement: 'bottom' });
  }

  get center() {
    const position = getPositionRelative(this.editor.container, this.element)
    return {
      x: position.x + 3,
      y: position.y + 3,
    };
  }

}

export default Port;
