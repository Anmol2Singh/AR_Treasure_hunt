export type LeaderboardEntry = {
  name: string;
  score: number;
  time: number; // in seconds
  date: string;
};

const LEADERBOARD_KEY = 'ar_treasure_hunt_leaderboard';

export const getLeaderboard = (): LeaderboardEntry[] => {
  const data = localStorage.getItem(LEADERBOARD_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data).sort((a: LeaderboardEntry, b: LeaderboardEntry) => b.score - a.score);
  } catch (e) {
    console.error('Failed to parse leaderboard', e);
    return [];
  }
};

export const saveScore = (entry: LeaderboardEntry) => {
  const leaderboard = getLeaderboard();
  leaderboard.push(entry);
  leaderboard.sort((a, b) => b.score - a.score);
  localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(leaderboard.slice(0, 10))); // Keep top 10
};
