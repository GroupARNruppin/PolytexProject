const express = require("express");
const fs = require("fs");
const { connectToDatabase, fetchData } = require("./query"); // Import fetchData function
const { router: queryRouter } = require("./query");
const { createGraph, exportGraphToPDF } = require("./graph");

const app = express();
const PORT = 3000;

const configPath = "./config.json";
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

// Middleware to parse JSON bodies
app.use(express.json());

// Connect to the database
connectToDatabase(config)
  .then(() => {
    console.log("Connected to the database");

    // Import routes from query.js after database connection is established
    app.use("/getPDFSuggestions", queryRouter);

    // Generate graph and export to PDF
    async function generateGraphAndPDF(AccountID, SiteId, AlertId) {
      const resultQuery = await fetchData(AccountID, SiteId, AlertId); // Use fetchData function
      const chartData = prepareChartData(resultQuery);
      createGraph(chartData);
      await exportGraphToPDF();
    }

    // Example usage to generate graph and PDF
    generateGraphAndPDF("exampleAccountID", "exampleSiteId", "exampleAlertId")
      .then(() => console.log("Graph and PDF generated successfully"))
      .catch((error) =>
        console.error("Error generating graph and PDF:", error)
      );
  })
  .catch((error) => {
    console.error("Error connecting to the database:", error.message);
    process.exit(1); // Exit the process if database connection fails
  });

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
