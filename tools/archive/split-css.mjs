import fs from 'fs';

let css = fs.readFileSync('src/styles.css', 'utf8');

// Extract :root block
const rootRegex = /:root\s*\{[\s\S]*?\}/;
const rootMatch = css.match(rootRegex);
let variablesCss = '';
if (rootMatch) {
  variablesCss = rootMatch[0];
  css = css.replace(rootRegex, '');
}

// Extract reset / body basics
// We'll just grab everything up to "main {"
const mainIndex = css.indexOf('main {');
let globalCss = '';
if (mainIndex !== -1) {
  globalCss = css.substring(0, mainIndex).trim();
  css = css.substring(mainIndex);
}

// Save variables
fs.writeFileSync('src/styles/variables.css', variablesCss);
// Save global
fs.writeFileSync('src/styles/global.css', globalCss);

// Leave the rest as components.css for now (incremental)
fs.writeFileSync('src/styles/components.css', css);

// Rewrite styles.css to import them
const newStylesContent = `@import "./styles/variables.css";
@import "./styles/global.css";
@import "./styles/components.css";
`;

fs.writeFileSync('src/styles.css', newStylesContent);
console.log('CSS split completed.');
