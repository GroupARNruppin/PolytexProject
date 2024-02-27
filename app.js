const express = require("express");
const sql = require("mssql");
const fs = require("fs");
const puppeteer = require("puppeteer");
const Chart = require("chart.js");
const { CanvasRenderService } = require("chartjs-node-canvas");

const app = express();
const PORT = 3000;

const configPath = "./config.json";
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));


// Define a route to fetch data from the database with parameters
app.get("/getPDFSuggestions/:AccountID/:SiteId/:AlertId", async (req, res) => {
  // Alert is 1360 (code: 0x0500)
  try {
    // Extract parameters from the request
    const { AccountID, SiteId, AlertId } = req.params;

    // Connect to the database
    await sql.connect(config);

    // SQL query using parameters
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
    const resultQuery = result.recordset;

    // Create the graph
    const chartData = prepareChartData(resultQuery);
    createGraph(chartData);

    // Export the graph to PDF
    await exportGraphToPDF();

    res.json(resultQuery);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  } finally {
    // Close the database connection
    await sql.close();
  }
});

async function CreateAndExportData() {
  const dataPath = "./data.json";
  const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  // Create the graph
  const chartData = prepareChartData(data);
  createGraph(chartData);

  // Export the graph to PDF
  await exportGraphToPDF();
}

// Function to prepare Chart.js data
function prepareChartData(data) {
  // console.log('Original Data:', data);
  const chartData = {
    labels: [],
    datasets: [],
  };

  // Group data by shirt name
  const groupedData = data.reduce((acc, item) => {
    const key = item.Item_name;

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(item);

    return acc;
  }, {});

  // Extract unique shirt names
  chartData.labels = Object.keys(groupedData);

  // Create a dataset for each size within each shirt group
  chartData.labels.forEach((shirtName, index) => {
    const shirtData = groupedData[shirtName];

    const sizes = Array.from(new Set(shirtData.map((item) => item.Item_Size)));

    sizes.forEach((size, sizeIndex) => {
      // Filter data for the current size
      const sizeData = shirtData.filter((item) => item.Item_Size === size);
      // Map the appearances for the current size
      const appearances = sizeData.map((item) => item.Appearance_Count);

      if (!chartData.datasets[sizeIndex]) {
        chartData.datasets[sizeIndex] = {
          label: size, // Y-axis
          data: [],
          backgroundColor: getRandomColor(),
          borderColor: getRandomColor(0.8),
          borderWidth: 1,
        };
      }

      chartData.datasets[sizeIndex].data[index] = appearances[0] || 0;
    });
  });
  // console.log('Updated Chart Data:', chartData);

  return chartData;
}

// Function to generate a random color
function getRandomColor(alpha = 1) {
  const randomColor = () => Math.floor(Math.random() * 256);
  return `rgba(${randomColor()}, ${randomColor()}, ${randomColor()}, ${alpha})`;
}


// Function to create a Chart.js graph
function createGraph(data) {
  const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
  const canvasRenderService = new ChartJSNodeCanvas({ width: 800, height: 600 });
  const configuration = {
    type: "bar",
    data: data,
    options: {
      scales: {
        x: {
          beginAtZero: true,
        },
      },
    },
  };
  const image = canvasRenderService.renderToBufferSync(configuration);
  fs.writeFileSync("chart.png", image);
  console.log("Chart created and saved as chart.png");
}

// Function to export the graph to PDF using Puppeteer
async function exportGraphToPDF() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Read the image file and convert it to a base64 data URL
  const imageData = fs.readFileSync('chart.png', 'base64');
  const imageSrc = `data:image/png;base64,${imageData}`;

  // Set the HTML content for the PDF
  const htmlContent = `
    <html>
      <head>
        <title>Chart PDF</title>
      </head>
      <body>
        <img src="${imageSrc}" />
      </body>
    </html>
  `;

  // Set the HTML content of the page
  await page.setContent(htmlContent, { waitUntil: 'domcontentloaded' });

  // Generate PDF
  await page.pdf({ path: 'chart.pdf', format: 'A4' });

  // Close the browser
  await browser.close();

  console.log('PDF generated successfully at: chart.pdf');
}

CreateAndExportData()
// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
