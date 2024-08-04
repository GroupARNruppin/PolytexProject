const express = require("express");
const { startServer, getMostFrequentItem } = require("./DataBase");
const {
  generateTableHTML,
  generateTableData,
  createGraph,
  exportGraphAndTableToPDF,
  prepareChartData,
} = require("./PdfCreation");
const fs = require("fs");

const app = express();
const PORT = 3000;

// Define a route to fetch data from the database with parameters
app.get("/getPDFSuggestions/:AccountID/:SiteId/:AlertId/:startDate/:endDate", async (req, res) => {
  try {
    const resultQuery = await startServer(req.params);
    const hospitalName =
      resultQuery.length > 0 && resultQuery[0].Hospital_Name
        ? resultQuery[0].Hospital_Name
        : "Unknown";
    const chartData = await prepareChartData(resultQuery);
    await createGraph(chartData);
    const tableData = await generateTableData(resultQuery);

    const mostFrequentItem = await getMostFrequentItem();
    await generateTableHTML(tableData);
    await exportGraphAndTableToPDF(tableData, mostFrequentItem, hospitalName);
    res.json(resultQuery);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

async function menuallyStart() {
  const configPath = "./data.json";
  const resultQuery = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  const chartData = await prepareChartData(resultQuery);
  await createGraph(chartData);
  const tableData = await generateTableData(resultQuery);

  // Calculate the most frequent item manually
  const mostFrequentItemMap = resultQuery.reduce((acc, item) => {
    if (!acc[item.Item_name]) {
      acc[item.Item_name] = 0;
    }
    acc[item.Item_name] += item.Appearance_Count;
    return acc;
  }, {});

  const mostFrequentItemName = Object.keys(mostFrequentItemMap).reduce((a, b) =>
    mostFrequentItemMap[a] > mostFrequentItemMap[b] ? a : b
  );
  const mostFrequentItem = {
    Item_name: mostFrequentItemName,
    Appearance_Count: mostFrequentItemMap[mostFrequentItemName],
  };

  const hospitalName =
    resultQuery.length > 0 && resultQuery[0].Hospital_Name
      ? resultQuery[0].Hospital_Name
      : "Unknown";
  await generateTableHTML(tableData);
  await exportGraphAndTableToPDF(tableData, mostFrequentItem, hospitalName);
}

menuallyStart();
