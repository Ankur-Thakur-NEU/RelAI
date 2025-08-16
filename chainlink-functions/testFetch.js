import { fetchAllHelmScores } from './functions.js';

const runTest = async () => {
  try {
    const result = await fetchAllHelmScores();
    console.log("Result from local HELM JSON:", result);
  } catch (error) {
    console.error("Error in runTest:", error);
  }
};

runTest();