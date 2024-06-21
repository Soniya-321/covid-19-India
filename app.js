const express = require('express')
const path = require('path')

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const app = express()
app.use(express.json())

const dbPath = path.join(__dirname, 'covid19India.db')
let db = null

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

initializeDBAndServer()

//Get States API
app.get('/states/', async (request, response) => {
  const getStatesQuery = `
        SELECT * FROM state 
        ORDER BY state_id;
    `
  const statesArray = await db.all(getStatesQuery)
  response.send(
    statesArray.map(each => ({
      stateId: each.state_id,
      stateName: each.state_name,
      population: each.population,
    })),
  )
})

//Get State API
app.get('/states/:stateId/', async (request, response) => {
  const {stateId} = request.params
  const getStateQuery = `
    SELECT * 
    FROM state 
    WHERE state_id = ${stateId};
  `
  const stateArray = await db.all(getStateQuery)
  response.send(
    ...stateArray.map(each => ({
      stateId: each.state_id,
      stateName: each.state_name,
      population: each.population,
    })),
  )
})

//Add District API
app.post('/districts/', async (request, response) => {
  const districtDetails = request.body
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails

  const addDistrictQuery = `
    INSERT INTO district 
    (district_name, state_id, cases, cured, active, deaths) 
    VALUES 
    ( 
      '${districtName}',
      ${stateId},
      ${cases},
      ${cured},
      ${active},
      ${deaths}
    );
  `
  await db.run(addDistrictQuery)
  response.send('District Successfully Added')
})

//Get District API
app.get('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const getDistrictQuery = `
    SELECT * 
    FROM district 
    WHERE district_id = ${districtId};
  `
  const district = await db.all(getDistrictQuery)
  response.send(
    ...district.map(each => ({
      districtId: each.district_id,
      districtName: each.district_name,
      stateId: each.state_id,
      cases: each.cases,
      cured: each.cured,
      active: each.active,
      deaths: each.deaths,
    })),
  )
})

//Delete District API
app.delete('/districts/:districtId/', async (request, response) => {
  const {districtId} = request.params
  const deleteDistrictQuery = `
    DELETE FROM
     district 
    WHERE district_id = ${districtId};
  `;
  await db.run(deleteDistrictQuery)
  response.send('District Removed')
})

//Update District API
app.put('/districts/:districtId/', async (request, response) => {
  const districtDetails = request.body
  const {districtId} = request.params
  const {districtName, stateId, cases, cured, active, deaths} = districtDetails
  const updateDistrictQuery = `
    UPDATE district 
    SET 
    district_name = '${districtName}',
    state_id = ${stateId},
    cases = ${cases},
    cured = ${cured},
    active = ${active},
    deaths = ${deaths}
    WHERE district_id = ${districtId}; 
  `
  await db.run(updateDistrictQuery)
  response.send('District Details Updated')
})

//Get Statistics of all cases
app.get('/states/:stateId/stats/', async (request, response) => {
  const {stateId} = request.params
  const getStatsQuery = ` 
    SELECT sum(cases) as totalCases,
    sum(cured) AS totalCured,
    sum(active) AS totalActive,
    sum(deaths) AS totalDeaths
    FROM district 
    WHERE state_id = ${stateId};
  `
  const dbResponse = await db.all(getStatsQuery)
  response.send(...dbResponse)
})

//Get StateName API
app.get('/districts/:districtId/details/', async (request, response) => {
  const {districtId} = request.params
  const getStatenameQuery = `
    SELECT state_name AS stateName
    FROM district inner join state on district.state_id = state.state_id
    WHERE district_id = ${districtId}
  `
  const stateName = await db.all(getStatenameQuery)
  response.send(...stateName)
})

module.exports = app
