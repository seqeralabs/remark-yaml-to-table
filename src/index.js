import fs from 'node:fs';
//import path from 'node:path';
import { visit } from 'unist-util-visit';
import { fromMarkdown } from 'mdast-util-from-markdown'
import YAML from 'yaml';

// This supports Markdown in YAML

function generateTableMdast(parsedData = []) {
  // Extract headers (assuming all rows have the same columns)
  const headers = Object.keys(parsedData[0] || {});

  // Create mdast nodes for table headers
  const thead = headers.map(header => ({
      type: 'tableCell',
      // Handle possible null
      children: [...(header ? fromMarkdown(header).children : [])]
  }));

  // Create mdast nodes for table rows
  const tbody = parsedData.map(row => ({
      type: 'tableRow',
      children: headers.map(header => ({
          type: 'tableCell',
          // Handle possible null
          children: [ ...(row[header] ? fromMarkdown(row[header]).children : []) ]
      }))
  }));

  // Combine headers and rows to create the table mdast node
  const table = {
      type: 'table',
      children: [{ type: 'tableRow', children: thead }, ...tbody]
  };

  //console.log(JSON.stringify(table, null, 2));
  return table;
}

function yamlToGfmTable(options = {}) {
  const rootDir = process.cwd();

  return function transformer(tree, file) {

    visit(tree, 'leafDirective', node => {
      let parsedData = [];
      const path = node.attributes.path;

      if(node.name !== 'table') return;
      if(!path) throw new Error(`path= attribute missing`);
      if(!fs.existsSync(path)) throw new Error(`Cannot open ${path}`);

      const yamlContent = fs.readFileSync(node.attributes.path, 'utf8');

      try {
        parsedData = YAML.parse(yamlContent);
       }
      catch(e) {
        throw(e);
      }

      //console.log(YAML.stringify(parsedData, null, 2));
      const tableHast = generateTableMdast(parsedData);

      // Replace the directive node with our table hast node
      Object.assign(node, tableHast);

    });
  }
}

export { yamlToGfmTable };
export default yamlToGfmTable;
