const express = require("express");
const sql = require("mssql");
const fs = require("fs");

const app = express();
const PORT = 3000;

const configPath = "./config.json";
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

// Define a route to fetch data from the database with parameters
app.get("/getPDFSuggestions/:accountID/:SiteId/:AlertId", async (req, res) => {
  // Alert is 1360 (code: 0x0500)
  try {
    // Extract parameters from the request
    const { accountID, SiteId, AlertId } = req.params;

    // Connect to the database
    await sql.connect(config);

    // Update the SQL query to use parameters
    const result = await sql.query`
      SELECT
        IST.FullName AS ShirtSize,
        COUNT(AL.CreatedDate) AS ConsumptionCount,
        DATEPART(HOUR, AL.CreatedDate) AS HourOfDay
      FROM
        dbo.ItemSubTypes IST
      JOIN
        dbo.AlertsLog AL ON IST.Id = AL.ItemSubTypeId
      WHERE
        AL.AccountId = ${accountID} AND AL.SiteId = ${SiteId} AND AL.AlertId = ${AlertId}
      GROUP BY
        IST.FullName,
        DATEPART(HOUR, AL.CreatedDate)
      ORDER BY
        IST.FullName,
        HourOfDay;
    `;

    res.json(result.recordset);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  } finally {
    // Close the database connection
    await sql.close();
  }
});

// API endpoint to fetch data
app.get("/getAllOutOfStuckStations", async (req, res) => {
  try {
    await sql.connect(config);
    const outOfStuckAlert = 1360;
    const hospitalId = 322;
    const countryId = 1;

    const result = await sql.query`
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
          AL.AlertId = ${outOfStuckAlert} 
          AND AL.ItemSubTypeId IS NOT NULL 
          AND AL.AccountId = ${countryId}
          AND AL.SiteId = ${hospitalId}
      GROUP BY
          AL.SiteId,
          ST.Name,
          IT.FullName,
          IST.FullName
    `;

    const data = result.recordset;

    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  } finally {
    await sql.close();
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
