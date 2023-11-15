import fs from 'node:fs';
import path from 'node:path';
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

// Based on code from:
// https://github.com/kevin940726/remark-code-import
function yamlToGfmTable(options = {}) {
  const rootDir = process.cwd();

  if (!path.isAbsolute(rootDir)) {
    throw new Error(`"rootDir" has to be an absolute path`);
  }

  return function transformer(tree, file) {
    const nodes = [];

    // directives remark plugin includes an `attributes` key
    visit(tree, 'leafDirective', node => {
      nodes.push(node);
    });

    for(const node of nodes) {
      let parsedData = [];
      let yamlContent = `---`;

      // directive name, for example:
      // ::table{file=my.yaml}
      if(node.name !== 'table') continue;
      if(!node.attributes['file']) throw new Error(`file= attribute missing`);

      if (!file.dirname) {
        throw new Error('"file" should be an instance of VFile');
      }

      const filePath = node.attributes.file;
      const normalizedFilePath = filePath
        .replace(/^\[rootDir\]/, rootDir)
        .replace(/\\ /g, ' ');
      const fileAbsPath = path.resolve(file.dirname, normalizedFilePath);

      if (!options.allowImportingFromOutside) {
        const relativePathFromRootDir = path.relative(rootDir, fileAbsPath);
        if (
          !rootDir ||
          relativePathFromRootDir.startsWith(`..${path.sep}`) ||
          path.isAbsolute(relativePathFromRootDir)
        ) {
          throw new Error(
            `Attempted to import code from "${fileAbsPath}", which is outside from the rootDir "${rootDir}"`
          );
        }
      }

      try {
        yamlContent = fs.readFileSync(fileAbsPath, 'utf8');
      }
      catch(err) {
        throw new Error(`Cannot open '${fileAbsPath}'`);
      }

      try {
        parsedData = YAML.parse(yamlContent);
       }
      catch(err) {
        throw new Error(`Cannot parse YAML: ${err.message}`);
      }

      //console.log(YAML.stringify(parsedData, null, 2));
      const tableHast = generateTableMdast(parsedData);

      // Replace the directive node with our table hast node
      Object.assign(node, tableHast);

    }
  }
}

export { yamlToGfmTable };
export default yamlToGfmTable;
