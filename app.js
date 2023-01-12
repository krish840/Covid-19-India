const express = require("express");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");

const databasePath = path.join(__dirname, "covid19India.db");

const app = express();

app.use(express.json());

let database = null;

const initializeDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (error) {
    console.log(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();
const convertMovieDbObjectToResponseObject = (dbObject) => {
  return {
    stateId: dbObject.state_id,
    stateName: dbObject.state_name,
    population: dbObject.population,
  };
};

app.get("/states/", async (request, response) => {
  const getStatesQuery = `SELECT * FROM state`;
  const allStates = await database.all(getStatesQuery);
  response.send(allStates);
});
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getstateQuery = `
    SELECT 
      *
    FROM 
      state 
    WHERE 
      state_id = ${stateId};`;
  const state = await database.get(getstateQuery);
  response.send(state);
});

app.post("/districts/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
  INSERT INTO
    district ( district_name,state_id, cases,cured,active,deaths)
  VALUES
    ('${districtName}', ${stateId}, ${cases},${cured},${active},${deaths});`;
  await database.run(postDistrictQuery);
  response.send("District Successfully Added");
});
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT 
      *
    FROM 
      district
    WHERE 
      district_id = ${districtId};`;
  const district = await database.get(getDistrictQuery);
  response.send(district);
});

app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
  DELETE FROM
    district
  WHERE
    district_id = ${districtId};`;
  await database.run(deleteDistrictQuery);
  response.send("District Removed");
});

app.put("/districts/:districtId/", async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const { districtId } = request.params;
  const updateDistrictQuery = `
            UPDATE
              district
            SET
             district_Name =' ${districtName}',
             state_id=${stateId},
              cases=${cases},
              cured=${cured},
              active=${active},
              deaths=${deaths},
            WHERE
              district_id = ${districtId};`;

  await database.run(updateDistrictQuery);
  response.send("District Details Updated");
});

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const totalsQuery = `
    SELECT
      sum(cases) as total_cases,
      sum(cured) as total_cured,
      sum(active) as total_active,
      sum(deaths) as total_deaths
    FROM
      district
    WHERE
      state_id=${stateId}
    GROUP BY
        state_id;`;
  const totalsArray = await database.all(totalsQuery);
  response.send(
    totalsArray.map((each) => ({
      totalCases: each.total_cases,
      totalCured: each.total_cured,
      totalActive: each.total_active,
      totalDeaths: each.total_deaths,
    }))
  );
});

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const statesQuery = `
    SELECT
     state_name
    FROM
      district inner join state on district.state_id =state.state_id
    WHERE
      district_id=${districtId};`;

  const statesArray = await database.all(statesQuery);
  response.send(statesArray[0]);
});

module.exports = app;
