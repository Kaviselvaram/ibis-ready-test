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

  // Permanently delete a student (auth user + profile) via the backend, then
  // drop them from local state. Returns true on success so the UI can react.
  const removeStudent = async (id) => {
    try {
      await StudentRepository.deleteStudent(id);
      setStudents(students.filter((s) => s.id !== id));
      return true;
    } catch (e) { console.error("Delete student failed:", e); return false; }
  };
  const updateBatches = async (newBatches) => {
    try {
      await BatchRepository.saveBatches(newBatches);
      // Refetch so freshly-created batches carry their DB-generated id (and
      // accurate student counts) — needed for later delete/status-by-id calls.
      const fresh = await BatchRepository.getBatches();
      setBatches(fresh || newBatches);
    } catch (e) { console.error(e); }
  };
  const removeBatch = async (id) => {
    try {
      await BatchRepository.deleteBatch(id);
      setBatches(batches.filter((b) => b.id !== id));
      return true;
    } catch (e) { console.error("Delete batch failed:", e); return false; }
  };
  const refreshStudentsAndBatches = async () => {
    try {
      const [s, b] = await Promise.all([StudentRepository.getStudents(), BatchRepository.getBatches()]);
      if (s) setStudents(s);
      if (b) setBatches(b);
    } catch (e) { console.error("Refresh failed:", e); }
  };

  // Re-pull the student list from the backend (reflects DB tier/status changes
  // made outside the app). Called on focus so the admin view stays in sync.
  const refreshStudents = async () => {
    try {
      const data = await StudentRepository.getStudents();
      if (data) setStudents(data);
    } catch (e) { console.error("Refresh students failed:", e); }
  };

  return { questionBank, updateQuestionBank, students, updateStudents, removeStudent, batches, updateBatches, removeBatch, refreshStudents, refreshStudentsAndBatches };
};
