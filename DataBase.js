const sql = require("mssql");
const fs = require("fs");

const configPath = "./config.json";
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

async function startServer(params) {
  await sql.connect(config);
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
           AL.AlertId = ${params.AlertId}
           AND AL.ItemSubTypeId IS NOT NULL
           AND AL.AccountId = ${params.AccountID}
           AND AL.SiteId = ${params.SiteId}
       GROUP BY
           AL.SiteId,
           ST.Name,
           IT.FullName,
           IST.FullName
     `;
  await sql.close();
  return result.recordset;
}

module.exports = { startServer };
