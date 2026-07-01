import { QuestionBankService } from '../../backend/src/services/QuestionBankService.js';
import fs from 'fs';

async function test() {
  try {
    const raw = fs.readFileSync('sample_questions.json', 'utf8');
    const questions = JSON.parse(raw);
    console.log(`Parsed ${questions.length} questions from JSON`);
    
    // Add unique IDs to the questions so it resembles what frontend sends
    const qns = questions.map((q, i) => ({...q, id: `seed-${i}`}));
    
    await QuestionBankService.saveBank(qns);
    console.log("Save complete!");
    
    const saved = await QuestionBankService.getBank();
    console.log(`Saved successfully. Total in DB: ${saved.length}`);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
