import { remark } from 'remark';
import remarkDirective from 'remark-directive'
import remarkGfm from 'remark-gfm'
import { visit } from 'unist-util-visit';
import { VFile } from 'vfile';
import path from 'node:path';
import fs from 'node:fs';
import YAML from 'yaml';
import {toHast} from 'mdast-util-to-hast'
import {toHtml} from 'hast-util-to-html'
import rehypeStringify from 'rehype-stringify'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'

const vfile = (value) =>
  new VFile({
    value,
    path: path.resolve('./test.md'),
  });

const file = remark()
  .use(remarkGfm)
  .use(remarkDirective)
  .use(yamlToGfmTable)
  .use(remarkRehype)
  .use(rehypeStringify)
  .process(`
  ::table{path=blah}
  `)

  //  .processSync(vfile(`
//::table{path=blah}
//`))

console.log(file)

function generateTableMdast(parsedData) {
  // Extract headers (assuming all rows have the same columns)
  const headers = Object.keys(parsedData[0]);

  // Create mdast nodes for table headers
  const thead = headers.map(header => ({
      type: 'tableCell',
      children: [{type: 'text', value: header}]
  }));

  // Create mdast nodes for table rows
  const tbody = parsedData.map(row => ({
      type: 'tableRow',
      children: headers.map(header => ({
          type: 'tableCell',
          children: [{type: 'text', value: row[header]}]
      }))
  }));

  // Combine headers and rows to create the table mdast node
  const table = {
      type: 'table',
      /*
      data: {
        hProperties: {
          width: 77
        }
      },
      */
      children: [{ type: 'tableRow', children: thead }, ...tbody]
  };

  console.log(JSON.stringify(table, null, 2));
  return table;
}

function yamlToGfmTable(options = {}) {
  const rootDir = options.rootDir || process.cwd();

  return function transformer(tree, vfile) {
    visit(tree, 'leafDirective', node => {
      //console.log(node);
      if (node.name === 'table' && node.attributes.path) {
        //const yamlContent = fs.readFileSync(node.attributes.path, 'utf8');
        const yamlContent = `
---
- col1: hi
  col2: hi
- col1: hi
  col2: hi
        `;
        const parsedData = YAML.parse(yamlContent);

        const tableHast = generateTableMdast(parsedData);

        Object.assign(node, tableHast); // Replace the directive node with our table hast node
      }
    });
  }
}
