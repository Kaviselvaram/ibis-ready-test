import { QuestionBankRepository } from './backend/src/repositories/QuestionBankRepository.js';
async function test() {
  try {
    const data = await QuestionBankRepository.getTopicsData();
    console.log("Success:", data);
  } catch (e) {
    console.error("Error:", e);
  }
}
test();
