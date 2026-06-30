const fs = require('fs');

let mainStr = fs.readFileSync('frontend/src/main.jsx', 'utf-8');
let wrapStr = fs.readFileSync('frontend/src/components/layout/ScaleRotateWrapper.jsx', 'utf-8');

const startStr = ') {\n  const [scale, setScale] = useState(1);';
let startIdx = mainStr.indexOf(startStr);
let endIdx = mainStr.indexOf('function App() {');

if (startIdx !== -1 && endIdx !== -1) {
    // Extract the remaining function body
    let remainingBody = mainStr.substring(startIdx, endIdx);
    
    // Append to wrapper
    wrapStr += remainingBody;
    fs.writeFileSync('frontend/src/components/layout/ScaleRotateWrapper.jsx', wrapStr);
    
    // Remove from main
    mainStr = mainStr.substring(0, startIdx) + mainStr.substring(endIdx);
    fs.writeFileSync('frontend/src/main.jsx', mainStr);
    
    console.log("Fixed ScaleRotateWrapper!");
} else {
    console.log("Could not find boundaries.");
}
