import Port from './port';
import { createRobotBlock } from './robot_block';
import WireDrawer from './wires';
import injectCSS from './css';
import fixPortValue from './fix_port_value';

export default class CircuitVisualization {

  static domToWorkspace(dom, workspace){
    if(workspace.device !== 'arduino'){
      throw Error('Not device suported');
    }

    injectCSS();

    
    new CircuitVisualization(workspace, dom);
  }

  constructor(workspace, dom) {
    if (!Blockly) {
      throw new Error('Blockly required');
    }

    this.components_ = {};

    this.connections_ = [];

    this.workspace_ = workspace;

    this.dom_ = dom;

    const robotName = `${workspace.device}_${workspace.subDevice}`;

    Blockly.Blocks['robot'] = createRobotBlock(robotName);

    this.workspace_.addChangeListener(this.onChangeListener_);

    this.wireGroup_ = Blockly.createSvgElement('g', {}, this.workspace_.svgGroup_);

    this.injectRobotBoard_();

    document.addEventListener('mousemove', () => {
      if(Blockly.dragMode_ == Blockly.DRAG_FREE || workspace.isScrolling){
        this.renderConnections_();
      }
    }); 
  }

  injectRobotBoard_() {
    const robotXml = `<instance x="250" y="250"><block type="robot" id="robot"></block></instance>`;
    const oParser = new DOMParser();
    const robotElement = oParser.parseFromString(robotXml, 'text/xml').firstChild;

    this.dom_.appendChild(robotElement);
    Blockly.Xml.domToWorkspace(this.dom_, this.workspace_);

    this.robot_ = this.workspace_.getBlockById('robot');
  }

  onChangeListener_ = (event) => {
    this.renderConnections_();
    if (!event.blockId) {
      return;
    }
    const block = this.workspace_.getBlockById(event.blockId);

    if(event.type !== Blockly.Events.UI)
      this.renderBlockBackground_(block);

    switch (event.type) {
      case Blockly.Events.CREATE:
        this.createBlockPorts_(block);
        break;
      case Blockly.Events.CHANGE:
        this.updateBlockPorts_(block);
        this.updateConnections_(block);
        break;
      case Blockly.Events.DELETE:
        this.deleteConnections_(event.blockId);
        break;
    }
  }

  renderConnections_ = () => {
    if (this.connections_.length === 0) return;

    const robotPosition = this.robot_.getRelativeToSurfaceXY();

    const { matrix } = this.workspace_.getCanvas().transform.baseVal.getItem(0);

    this.connections_.forEach(({ blockId, position, connectedTo, wireSvg }) => {
      const block = this.workspace_.getBlockById(blockId);
      if (!block) return;

      const blockPosition = block.getRelativeToSurfaceXY();

      const origin = {
        x: blockPosition.x + position.x + matrix.e + 2.5,
        y: blockPosition.y + position.y + matrix.f + 2.5,
      }

      const robotConnection = this.robot_.getPortByName(connectedTo)
      if (!robotConnection) return;

      const destination = {
        x: robotPosition.x + robotConnection.position.x + matrix.e + 2.5,
        y: robotPosition.y + robotConnection.position.y + matrix.f + 2.5,
      }

      const drawer = new WireDrawer(origin, destination);

      wireSvg.setAttribute('d', drawer.path);
    });
  }

  updateBlockPorts_ = (block) => {
    const blockSvg = block.getSvgRoot();

    const blockWidth = blockSvg.firstChild.getBoundingClientRect().width;

    block.ports.forEach(port => {
      const position = port.position;
      port.moveTo({...position, x: blockWidth - 14});
    }); 

    this.connections_ = this.connections_.map(({position, ...others}) => ({
      position: {...position, x: blockWidth - 14},
      ...others,
    }));
  }

  createBlockPorts_ = (block) => {

    const width = block.svgGroup_.getBoundingClientRect().width;

    const ports = [];

    block.inputList.forEach((input, index) => {

      if (index === 0) return;

      input.fieldRow.forEach(({ fieldGroup_, name, value_ }) => {
        name = name ?? value_

        if (name) {
          const { matrix } = fieldGroup_.transform.baseVal.getItem(0);

          const position = { x: width - 14, y: matrix.f + 6 };

          const port = new Port(block.getSvgRoot(), name, position);

          ports.push(port);

          const wireSvg = Blockly.createSvgElement('path', {
            'fill': 'none',
            'stroke': '#40B942',
            'stroke-width': 1.8,
            'stroke-linecap': 'round',
            'stroke-linejoin': 'round',
          }, this.wireGroup_);

          this.connections_.push({
            blockId: block.id,
            connectedTo: fixPortValue(block.getFieldValue(name) ?? value_),
            name,
            position,
            wireSvg,
          });

        };
      });
    });

    block.ports = ports;
  }

  updateConnections_ = (block) => {
    let connections = this.connections_
      .filter(connection => connection.blockId === block.id);

    connections = connections.map(({ name, ...others }) => ({
      name,
      ...others,
      connectedTo: fixPortValue(block.getFieldValue(name) ?? others.connectedTo),
    }));

    this.connections_ = this.connections_
      .filter(connection => connection.blockId !== block.id);

    this.connections_ = [...this.connections_, ...connections];

    this.renderConnections_();
  }

  deleteConnections_ = (blockId) => {
    this.connections_ = this.connections_
      .filter(connection => {
        if (connection.blockId === blockId) {
          connection.wireSvg.remove();
          return false;
        }
        return true;
      });
  }

  renderBlockBackground_ = (block) => {
    if (!block) return;

    let path = block.svgPath_.getAttribute('d');
    const width = parseFloat(path.substring(
      path.indexOf("H") + 2,
      path.indexOf("v") - 1
    ));
    const newWidth = width + 16
    path = path.replace(width.toString(), newWidth.toString());
    block.svgPath_.setAttribute('d', path);
  }
}