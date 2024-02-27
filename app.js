const express = require('express');
const sql = require('mssql');
const fs = require('fs');

const app = express();
const PORT = 3000;

const configPath = './config.json';
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

// Define a route to fetch data from the database with parameters
app.get('/getPDFSuggestions/:accountID/:SiteId/:AlertId', async (req, res) => {
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
    res.status(500).send('Internal Server Error');
  } finally {
    // Close the database connection
    await sql.close();
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
