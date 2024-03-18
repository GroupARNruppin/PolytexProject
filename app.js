const express = require("express");
const sql = require("mssql");
const fs = require("fs");
const server_init = require("./server");
const create_pdf = require("./create_pdf");

const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
server_init.server_init();
const app = express();

const configPath = "./config.json";
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

// Define a route to fetch data from the database with parameters
async function fetchDataBySiteIdAndAlertId(AccountID, SiteId, AlertId) {
  app.get(
    "/getPDFSuggestions/:AccountID/:SiteId/:AlertId",
    async (req, res) => {
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

        res.json(resultQuery);
      } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
      } finally {
        // Close the database connection
        await sql.close();
      }
    }
  );
}

async function CreateAndExportData() {
  const dataPath = "./data.json";
  const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  // Create the graph
  const chartData = prepareChartData(data);
  createGraph(chartData);

  // Export the graph to PDF
  await create_pdf.renderPDF();
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
          width: 20,
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
  const canvasRenderService = new ChartJSNodeCanvas({
    width: 800,
    height: 600,
  });
  const configuration = {
    type: "bar",
    data: data,
    options: {
      elements: {
        bar: {
          borderWidth: 5,
        },
      },
      indexAxis: "y",
      responsive: true,
      plugins: {
        legend: {
          position: "right",
        },
        title: {
          display: true,
          text: "Distribution Of Items & Size Across All Stations",
        },
      },
      scales: {
        x: {
          beginAtZero: true,
        },
        y: {
          barPercentage: 50,
          categoryPercentage: 50,
        },
      },
    },
  };
  const image = canvasRenderService.renderToBufferSync(configuration);
  fs.writeFileSync("chart.png", image);
  console.log("Chart created and saved as chart.png");
}

fetchDataBySiteIdAndAlertId();
CreateAndExportData();
