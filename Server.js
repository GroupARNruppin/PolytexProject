const express = require("express");
const { startServer } = require("./DataBase");
const {
  generateTableHTML,
  getMaxCount,
  generateTableData,
  createGraph,
  exportGraphAndTableToPDF,
  prepareChartData,
} = require("./PdfCreation");

const app = express();
const PORT = 3000;

// Define a route to fetch data from the database with parameters
app.get("/getPDFSuggestions/:AccountID/:SiteId/:AlertId", async (req, res) => {
  try {
    const resultQuery = await startServer(req.params);
    const chartData = await prepareChartData(resultQuery);
    await createGraph(chartData);
    const tableData = await generateTableData(resultQuery);
    //const maxCount = await getMaxCount(resultQuery);
    await generateTableHTML(tableData);
    await exportGraphAndTableToPDF();
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


const fs = require("fs");

async function menuallyStart(){
  const configPath = "./data.json";
  const resultQuery = JSON.parse(fs.readFileSync(configPath, "utf-8"));

  const chartData = await prepareChartData(resultQuery);
  await createGraph(chartData);
  const tableData = await generateTableData(resultQuery);
  //const maxCount = await getMaxCount(resultQuery);
  await generateTableHTML(tableData);
  await exportGraphAndTableToPDF();
}

menuallyStart()