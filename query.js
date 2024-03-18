const express = require("express");
const sql = require("mssql");
const fs = require("fs");
const { prepareChartData } = require("./graph");

const router = express.Router();

// Connect to the database
async function connectToDatabase(config) {
  try {
    await sql.connect(config);
    console.log("Connected to the database");
  } catch (error) {
    console.error("Error connecting to the database:", error.message);
  }
}

// SQL query using parameters
async function fetchData(AccountID, SiteId, AlertId) {
  try {
    const queryResult = await sql.query`
       SELECT
           AL.SiteId AS Hospital_Id,
           ST.Name AS Station_Name,
           IT.FullName AS Item_name,
           MAX(IST.FullName) AS Item_Size,
           COUNT(*) AS Appearance_Count
       FROM
           AlertsLog AL
       JOIN
           Stations ST ON ST.Id = AL.SiteId
       JOIN
           ItemSubTypes IST ON IST.Id = AL.ItemSubTypeId
       JOIN
           ItemTypes IT ON IT.Id = IST.ItemTypeId
       WHERE
           AL.AlertId = ${AlertId}
           AND AL.ItemSubTypeId IS NOT NULL
           AND AL.AccountId = ${AccountID}
           AND AL.SiteId = ${SiteId}
       GROUP BY
           AL.SiteId,
           ST.Name,
           IT.FullName,
           IST.FullName
     `;
    return queryResult.recordset;
  } catch (error) {
    console.error("Error executing SQL query:", error.message);
    throw error;
  }
}

// Define a route to fetch data from the database with parameters
router.get("/:AccountID/:SiteId/:AlertId", async (req, res) => {
  const { AccountID, SiteId, AlertId } = req.params;

  try {
    const resultQuery = await fetchData(AccountID, SiteId, AlertId);
    res.json(resultQuery);
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
});

module.exports = { router, connectToDatabase, fetchData };
