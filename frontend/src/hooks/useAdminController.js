import { useEffect } from "react";
import { useAdminContext } from "../contexts/AdminContext";
import { loadBank, saveBank } from "../repositories/QuestionBankRepository";
import { StudentRepository } from "../repositories/StudentRepository";
import { BatchRepository } from "../repositories/BatchRepository";

export const useAdminController = () => {
  const { questionBank, setQuestionBank, students, setStudents, batches, setBatches } = useAdminContext();

  useEffect(() => {
    let active = true;
    const initializers = [];

    if (!questionBank) {
      initializers.push(
        loadBank().then(bank => {
          console.log("loadBank success:", bank, "active:", active);
          if (active) setQuestionBank(bank || []);
        }).catch(err => {
          console.error("loadBank failed:", err);
          if (active) setQuestionBank([]);
        })
      );
    }
    if (students.length === 0) {
      initializers.push(
        StudentRepository.getStudents().then(data => {
          if (active) setStudents(data);
        })
      );
    }
    if (batches.length === 0) {
      initializers.push(
        BatchRepository.getBatches().then(data => {
          if (active) setBatches(data);
        })
      );
    }

    if (initializers.length > 0) {
      Promise.allSettled(initializers);
    }

    return () => { active = false; };
  }, [questionBank, students.length, batches.length, setQuestionBank, setStudents, setBatches]);

  const updateQuestionBank = async (newBank) => {
    try {
      setQuestionBank(newBank);
      await saveBank(newBank);
    } catch (e) { console.error(e); }
  };

  const updateStudents = async (newStudents) => {
    try {
      await StudentRepository.saveStudents(newStudents);
      setStudents(newStudents);
    } catch (e) { console.error(e); }
  };
  const updateBatches = async (newBatches) => {
    try {
      await BatchRepository.saveBatches(newBatches);
      setBatches(newBatches);
    } catch (e) { console.error(e); }
  };

  return { questionBank, updateQuestionBank, students, updateStudents, batches, updateBatches };
};
