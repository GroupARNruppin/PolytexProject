const sql = require("mssql");
const fs = require("fs");

const configPath = "./config.json";
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

// יצירת קונפיגורציות נפרדות לכל מסד נתונים
//נטו בשביל להשיג את שם בית החולים
const configPrimary = { ...config, database: "db-pm8-pmbrusting-qa" };
const configSecondary = { ...config, database: "db-pm8-pmIdentity-qa" };

async function startServer(params) {
  // התחברות למסד הנתונים הראשי
  await sql.connect(configPrimary);

  // ביצוע השאילתא למסד הנתונים הראשי
  const mainDataResult = await sql.query`
   SELECT
  AL.SiteId AS Hospital_Id,
  ST.Name AS Station_Name,
  IT.FullName AS Item_name,
  IST.FullName AS Item_Size,
  COUNT(AL.Id) AS Appearance_Count
FROM
  AlertsLog AL
JOIN
  Stations ST ON ST.Id = AL.StationId
JOIN
  ItemSubTypes IST ON IST.Id = AL.ItemSubTypeId
JOIN
  ItemTypes IT ON IT.Id = IST.ItemTypeId
WHERE
  AL.AlertId = ${params.AlertId}
  AND AL.ItemSubTypeId IS NOT NULL
  AND AL.StationId IS NOT NULL
  AND AL.AccountId = ${params.AccountID}
  AND AL.SiteId = ${params.SiteId}
GROUP BY
  AL.SiteId,
  ST.Name,
  IT.FullName,
  IST.FullName
  `;
  const mainData = mainDataResult.recordset;

  // ניתוק החיבור למסד הנתונים הראשי
  await sql.close();

  // התחברות למסד הנתונים המשני
  await sql.connect(configSecondary);

  // ביצוע השאילתא למסד הנתונים המשני
  const hospitalNamesResult = await sql.query`
    SELECT Id, Name FROM [dbo].[AppSites]
  `;
  const hospitalNames = hospitalNamesResult.recordset;

  // ניתוק החיבור למסד הנתונים המשני
  await sql.close();

  // שילוב התוצאות
  const resultWithHospitalNames = mainData.map((record) => {
    const hospital = hospitalNames.find((h) => h.Id === record.Hospital_Id);
    return { ...record, Hospital_Name: hospital ? hospital.Name : "Unknown" };
  });

  return resultWithHospitalNames;
}

async function getMostFrequentItem() {
  await sql.connect(config);
  const result = await sql.query`
      SELECT TOP 1
          IT.FullName AS Item_name,
          COUNT(*) AS Appearance_Count
      FROM
          AlertsLog AL
      JOIN
          ItemSubTypes IST ON IST.Id = AL.ItemSubTypeId
      JOIN
          ItemTypes IT ON IT.Id = IST.ItemTypeId
      GROUP BY
          IT.FullName
      ORDER BY
          Appearance_Count DESC
    `;
  await sql.close();
  return result.recordset[0];
}

module.exports = { startServer, getMostFrequentItem };
