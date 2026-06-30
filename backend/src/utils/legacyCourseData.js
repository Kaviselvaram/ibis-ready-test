const assetBase = "/ibis-assets/hero-section-morphing-images/";
const chapterAssetVersion = "20260626-webp";

const chapterSeed = [
  ["Electric Charges and Fields", "ch01_electric_charges_and_fields_48837919.png"],
  ["Electrostatic Potential and Capacitance", "ch02_electrostatic_potential_and_capacitance_390148e1.png"],
  ["Current Electricity", "ch03_current_electricity_820757da.png"],
  ["Moving Charges and Magnetism", "ch04_moving_charges_and_magnetism_473c230b.png"],
  ["Magnetism and Matter", "ch05_magnetism_and_matter_1537fa81.png"],
  ["Electromagnetic Induction", "ch06_electromagnetic_induction_4e4d7cfe.png"],
  ["Alternating Current", "ch07_alternating_current_f6a9a19c.png"],
  ["Electromagnetic Waves", "ch08_electromagnetic_waves_51e1e7f1.png"],
  ["Ray Optics and Optical Instruments", "ch09_ray_optics_44fe5bb9.png"],
  ["Wave Optics", "ch10_wave_optics_ac864eca.png"],
  ["Dual Nature of Radiation and Matter", "ch11_dual_nature_radiation_matter_b49ee0da.png"],
  ["Atoms", "ch12_atoms_1bc9a982.png"],
  ["Nuclei", "ch13_nuclei_497a4db2.png"],
  ["Semiconductor Electronics", "ch14_semiconductors_9a28fd51.png"]
];

const topicNames = {
  1: ["Coulomb's Law", "Electric Field Lines", "Gauss Law"],
  2: ["Potential Energy", "Capacitors", "Dielectrics"],
  3: ["Drift Velocity", "Kirchhoff Rules", "Wheatstone Bridge"],
  4: ["Lorentz Force", "Biot Savart Law", "Ampere's Circuital Law"],
  5: ["Bar Magnets", "Earth's Magnetism", "Magnetic Materials"],
  6: ["Faraday's Law", "Lenz's Law", "AC Generator"],
  7: ["RMS Values", "LCR Circuits", "Power Factor"],
  8: ["Displacement Current", "EM Spectrum", "Wave Propagation"],
  9: ["Refraction", "Lens Maker Formula", "Optical Instruments"],
  10: ["Huygens Principle", "Interference", "Diffraction"],
  11: ["Photoelectric Effect", "de Broglie Waves", "Matter Waves"],
  12: ["Bohr Model", "Hydrogen Spectrum", "Energy Levels"],
  13: ["Nuclear Size", "Binding Energy", "Radioactivity"],
  14: ["Energy Bands", "PN Junction", "Logic Gates"]
};

const buildTopic = (chapterId, topic, index) => ({
  id: `${chapterId}-${index + 1}`,
  name: topic,
  isFree: chapterId <= 2 && index < 1,
  videos: [
    {
      id: `v-${chapterId}-${index}-1`,
      label: "Concept Core",
      title: `${topic}: board-first explanation`,
      url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      duration: `${18 + index * 4} min`
    },
    {
      id: `v-${chapterId}-${index}-2`,
      label: "Numerical Sprint",
      title: `Solving ${topic} in CBSE format`,
      url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      duration: `${13 + index * 3} min`
    }
  ],
  examples: index % 2 === 0 ? [
    {
      id: `e-${chapterId}-${index}-1`,
      label: "Worked Example",
      title: `${topic}: one exam-style derivation`,
      url: "https://youtube.com/watch?v=dQw4w9WgXcQ",
      duration: "11 min"
    }
  ] : [],
  notes: [
    {
      id: `n-${chapterId}-${index}-1`,
      title: `${topic} formula sheet`,
      type: "latex",
      content: "\\section*{Key Relation}\\[ E = \\frac{kq}{r^2} \\]\nAlways write direction, unit, and final substitution."
    }
  ],
  testReady: false
});

export const legacyChapters = chapterSeed.map(([name, image], index) => ({
  id: index + 1,
  name,
  image: `${assetBase}${image.replace(".png", ".webp")}?v=${chapterAssetVersion}`,
  progress: [82, 66, 58, 41, 37, 29, 22, 18, 53, 47, 33, 24, 19, 14][index],
  topics: topicNames[index + 1].map((topic, topicIndex) => buildTopic(index + 1, topic, topicIndex))
}));
