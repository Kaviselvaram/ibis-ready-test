const fs = require('fs');

const chapters = [
  "Electric Charges and Fields",
  "Electrostatic Potential and Capacitance",
  "Current Electricity",
  "Moving Charges and Magnetism",
  "Magnetism and Matter",
  "Electromagnetic Induction",
  "Alternating Current",
  "Electromagnetic Waves",
  "Ray Optics and Optical Instruments",
  "Wave Optics"
];

const topicsByChapter = {
  "Electric Charges and Fields": ["Coulomb's Law", "Electric Field Lines", "Gauss Law"],
  "Electrostatic Potential and Capacitance": ["Electrostatic Potential", "Capacitors and Capacitance", "Dielectrics"],
  "Current Electricity": ["Ohm's Law", "Kirchhoff's Laws", "Wheatstone Bridge"],
  "Moving Charges and Magnetism": ["Magnetic Force", "Biot-Savart Law", "Ampere's Circuital Law"],
  "Magnetism and Matter": ["The Bar Magnet", "Earth's Magnetism", "Magnetic Properties of Materials"],
  "Electromagnetic Induction": ["Faraday's Law", "Lenz's Law", "Self and Mutual Induction"],
  "Alternating Current": ["AC Voltage Applied to a Resistor", "AC Voltage Applied to an Inductor", "AC Voltage Applied to a Capacitor"],
  "Electromagnetic Waves": ["Displacement Current", "Electromagnetic Spectrum"],
  "Ray Optics and Optical Instruments": ["Reflection of Light", "Refraction", "Optical Instruments"],
  "Wave Optics": ["Huygens Principle", "Interference of Light Waves", "Diffraction"]
};

const bloomLevels = ["Remember", "Understand", "Apply", "Analyze", "Evaluate", "Create"];
const difficulties = ["Easy", "Medium", "Hard"];

const generateQuestion = (id) => {
  const chapter = chapters[Math.floor(Math.random() * chapters.length)];
  const topics = topicsByChapter[chapter];
  const topic = topics[Math.floor(Math.random() * topics.length)];
  const bloomLevel = bloomLevels[Math.floor(Math.random() * bloomLevels.length)];
  const difficulty = difficulties[Math.floor(Math.random() * difficulties.length)];

  const values = [Math.floor(Math.random() * 10) + 1, Math.floor(Math.random() * 20) + 10];

  let questionText = "";
  let options = [];
  let answer = "";
  let explanation = "";

  if (difficulty === "Easy") {
    questionText = `What is a fundamental characteristic of ${topic} in the context of ${chapter}?`;
    options = [
      `It relies solely on temperature (Variant ${values[0]}).`,
      `It is an inverse square relationship.`,
      `It is directly proportional to mass.`,
      `It remains constant under all conditions.`
    ];
    answer = "B";
    explanation = `For ${topic}, the core principle generally follows an inverse square relationship or similar foundational rule.`;
  } else if (difficulty === "Medium") {
    questionText = `A system has a parameter X = ${values[0]} units. If another parameter Y is ${values[1]} units, which formula best describes their interaction in ${topic}?`;
    options = [
      `X + Y = ${values[0] + values[1]}`,
      `X * Y = ${values[0] * values[1]}`,
      `X / Y = ${(values[0] / values[1]).toFixed(2)}`,
      `X^2 + Y = ${values[0]*values[0] + values[1]}`
    ];
    answer = "B";
    explanation = `The product of X and Y (${values[0]} * ${values[1]} = ${values[0] * values[1]}) is typically the derived quantity for ${topic}.`;
  } else {
    questionText = `Consider a complex scenario involving ${topic}. If the initial state has a magnitude of ${values[1]} and it decreases by a factor of ${values[0]}, what is the conceptual outcome?`;
    options = [
      `The system collapses.`,
      `The new magnitude becomes ${(values[1] / values[0]).toFixed(2)}.`,
      `The energy is dissipated as heat.`,
      `It creates an electromagnetic wave.`
    ];
    answer = "B";
    explanation = `By dividing the initial state ${values[1]} by the factor ${values[0]}, we arrive at ${(values[1] / values[0]).toFixed(2)}, demonstrating the application of ${topic} principles.`;
  }

  return {
    chapter,
    topic,
    questionType: "MCQ",
    bloomLevel,
    difficulty,
    question: questionText,
    options,
    answer,
    explanation,
    source: "Generated Test Bank"
  };
};

const questions = [];
for (let i = 0; i < 50; i++) {
  questions.push(generateQuestion(i));
}

fs.writeFileSync(require('path').join(__dirname, 'sample_questions.json'), JSON.stringify(questions, null, 2));
console.log(`Generated 50 questions and wrote to sample_questions.json`);
