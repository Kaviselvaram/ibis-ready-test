import fs from 'fs';
import { parse } from '@babel/parser';
import _traverse from '@babel/traverse';
import _generate from '@babel/generator';
import * as t from '@babel/types';

const traverse = _traverse.default || _traverse;
const generate = _generate.default || _generate;

const code = fs.readFileSync('src/main.jsx', 'utf8');
const ast = parse(code, { sourceType: 'module', plugins: ['jsx'] });

const toExtract = ['Brand', 'Button', 'GlassButton', 'Pill', 'ShinyButton', 'AnimatedLayerButton'];
let extractedNodes = [];

traverse(ast, {
  FunctionDeclaration(path) {
    if (path.node.id && toExtract.includes(path.node.id.name)) {
      extractedNodes.push(t.exportNamedDeclaration(path.node));
      path.remove();
    }
  }
});

const { code: newMainCode } = generate(ast);
const astExtract = t.file(t.program(extractedNodes));
const { code: extractedCode } = generate(astExtract);

const finalExtractedCode = `import React, { useState, useMemo, useRef, useEffect } from "react";\n\n` + extractedCode;
fs.writeFileSync('src/components/ui/LegacyUI.jsx', finalExtractedCode);

const importStatement = `import { Brand, Button, GlassButton, Pill, ShinyButton, AnimatedLayerButton } from "./components/ui/LegacyUI.jsx";\n`;
let finalMainCode = newMainCode;

if (finalMainCode.includes('import "./styles.css";')) {
  finalMainCode = finalMainCode.replace(
    'import "./styles.css";',
    'import "./styles.css";\n' + importStatement
  );
} else {
  finalMainCode = importStatement + finalMainCode;
}

fs.writeFileSync('src/main.jsx', finalMainCode);
console.log("Successfully extracted components.");
