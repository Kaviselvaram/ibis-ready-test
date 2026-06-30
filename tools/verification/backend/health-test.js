async function test() {
  const h1 = await fetch('http://localhost:4000/api/health');
  console.log('health:', await h1.json());
  
  const h2 = await fetch('http://localhost:4000/api/health/ready');
  console.log('ready:', await h2.json());
}
test();
