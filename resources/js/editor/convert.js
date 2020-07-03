/**
 * 
 * @param {string} data 
 * @returns {object}
 */
export function configDecode(data) {
  const domParser = new DOMParser();
  const xmlConfig = domParser.parseFromString(data, "text/xml").querySelector('config');

  const board = {};

  const robotElement = xmlConfig.querySelector('block_set');
  board['name'] = robotElement.getAttribute('robottype');

  const components = {};
  const blocks = xmlConfig.querySelectorAll('instance');
  blocks.forEach((instance) => {
    const x = instance.getAttribute('x');
    const y = instance.getAttribute('y');

    const block = instance.querySelector('block');
    const id = block.getAttribute('id');
    const type = block.getAttribute('type');
    const name = block.querySelector('field[name=NAME]').innerHTML;

    const ports = [];
    block.querySelectorAll('field:not([name=NAME])').forEach(el => {
      const name = el.getAttribute('name');
      const connectedTo = el.innerHTML;
      ports.push({ name, connectedTo });
    });
    components[id] = { name, type, position: { x, y }, ports };
  });

  return { board, components };
}

/**
 * 
 * @param {object} config 
 * @returns {string}
 */
export function configEnconde({ board, components }) {
  let instances = '';
  for (let key in components) {
    const { name, position, ports, type } = components[key];
    console.log(position);
    instances += (`
      <instance x="${position.x}" y="${position.y}">
        <block type="${type}" id="${key}" intask="true">
          <field name="NAME">${name}</field>
          ${ports.map(port => `<field name="${port.name}">${port.connectedTo ?? ''}</field>`)}
        </block>
      </instance>
    `);
  }

  return (`
    <config>
      <block_set xmlns="http://de.fhg.iais.roberta.blockly" robottype="${board.name}" xmlversion="2.0" description="" tags="">
        ${instances}
      </block_set>
    </config>
  `);
}