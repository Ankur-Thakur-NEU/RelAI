import fs from 'fs';
import path from 'path';

// Load local leaderboard JSON
export const fetchAllHelmScores = async () => {
  try {
    const filePath = path.resolve('./stats.json'); //fetched data from HELM Capabilities Leaderboard by Stanford (https://crfm.stanford.edu/helm/capabilities/latest/#/leaderboard)
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

    const repScore = {};
    data.forEach(entry => {
      repScore[entry.model] = entry.score;
    });

    return repScore;
  } catch (error) {
    console.error("Error reading local HELM JSON:", error);
    return null;
  }
};