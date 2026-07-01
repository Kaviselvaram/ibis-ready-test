import { QuestionBankRepository } from '../../backend/src/repositories/QuestionBankRepository.js';
async function test() {
  const data = await QuestionBankRepository.getBank();
  console.log("getBank length:", data.length);
}
test();
