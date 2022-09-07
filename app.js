const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());
const dbPath = path.join(__dirname, "cricketMatchDetails.db");
let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

//API 1
const gettingObj = (player) => {
  return {
    playerId: player.player_id,
    playerName: player.player_name,
  };
};
app.get("/players/", async (request, response) => {
  const playersQuery = `
    SELECT * FROM player_details;`;
  const playersArray = await db.all(playersQuery);
  const player = playersArray.map((eachPlayer) => gettingObj(eachPlayer));
  response.send(player);
});

//API 2
app.get("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerByIdQuery = `
    SELECT * FROM player_details WHERE player_id = ${playerId};`;
  const result = await db.get(getPlayerByIdQuery);
  response.send(gettingObj(result));
});

//API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const updateQuery = `
    UPDATE player_details 
    SET player_name = "${playerName}"
    WHERE player_id = ${playerId};`;
  const result = await db.run(updateQuery);
  response.send("Player Details Updated");
});

//API 4
const getMatchObj = (match) => {
  return {
    matchId: match.match_id,
    match: match.match,
    year: match.year,
  };
};
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerByIdQuery = `
    SELECT * FROM match_details
    WHERE match_id = ${matchId};`;
  const matchDetails = await db.get(getPlayerByIdQuery);
  const result = getMatchObj(matchDetails);

  response.send(result);
});

//API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerQuery = `
    SELECT 
    match1.match_id as matchId,
    match1.match as match,
    match1.year as year

    FROM (match_details
     INNER JOIN
     player_match_score ON
       player_match_score.match_id = match_details.match_id) AS match1 INNER JOIN player_details ON match1.player_id = player_details.player_id
     WHERE player_details.player_id = ${playerId};`;
  const result = await db.all(getPlayerQuery);
  response.send(result);
});

// API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const getPlayerQuery = `
    SELECT 
    match.player_id as playerId,
    match.player_name as playerName
    FROM (player_details INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id) AS match
     WHERE player_match_score.match_id = ${matchId};`;
  const result = await db.all(getPlayerQuery);
  response.send(result);
});

//API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const getPlayerScore = `
    SELECT 
    match.player_id as playerId,
    match.player_name as playerName,
    SUM(match.score),
    SUM(match.fours),
    SUM(match.sixes) 
    FROM (player_details INNER JOIN player_match_score ON player_details.player_id = player_match_score.player_id) AS match
     WHERE player_details.player_id = ${playerId};`;
  const stats = await db.get(getPlayerScore);
  response.send({
    playerId: stats.playerId,
    playerName: stats.playerName,
    totalScore: stats["SUM(match.score)"],
    totalFours: stats["SUM(match.fours)"],
    totalSixes: stats["SUM(match.sixes)"],
  });
});

module.exports = app;
