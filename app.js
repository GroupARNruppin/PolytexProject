const express = require("express");
const sql = require("mssql");
const fs = require("fs");
const create_pdf = require("./create_pdf");

const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const app = express();

const configPath = "./config.json";
const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));

// Start the Express server
const port = 3001;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

// Define a route to fetch data from the database with parameters
app.get("/getPDFSuggestions/:AccountID/:SiteId/:AlertId", async (req, res) => {
  try {
    const { AccountID, SiteId, AlertId } = req.params;
    const data = await fetchDataBySiteIdAndAlertId(AccountID, SiteId, AlertId);
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Function to fetch data from the database
async function fetchDataBySiteIdAndAlertId(AccountID, SiteId, AlertId) {
  try {
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
    return result.recordset;
  } catch (error) {
    throw error;
  } finally {
    await sql.close();
  }
}

async function CreateAndExportData(AccountID, SiteId, AlertId) {
  try {
    const data = await fetchDataBySiteIdAndAlertId(AccountID, SiteId, AlertId);
    const chartData = prepareChartData(data);
    createGraph(chartData);
    await create_pdf.renderPDF();
  } catch (error) {
    console.error(error);
  }
}

// Function to prepare Chart.js data
function prepareChartData(data) {
  const chartData = {
    labels: [],
    datasets: [],
  };

  const groupedData = data.reduce((acc, item) => {
    const key = item.Item_name;

    if (!acc[key]) {
      acc[key] = [];
    }

    acc[key].push(item);

    return acc;
  }, {});

  chartData.labels = Object.keys(groupedData);

  chartData.labels.forEach((shirtName, index) => {
    const shirtData = groupedData[shirtName];

    const sizes = Array.from(new Set(shirtData.map((item) => item.Item_Size)));

    sizes.forEach((size, sizeIndex) => {
      const sizeData = shirtData.filter((item) => item.Item_Size === size);
      const appearances = sizeData.map((item) => item.Appearance_Count);

      if (!chartData.datasets[sizeIndex]) {
        chartData.datasets[sizeIndex] = {
          label: size,
          data: [],
          backgroundColor: getRandomColor(),
          width: 20,
          borderWidth: 1,
        };
      }

      chartData.datasets[sizeIndex].data[index] = appearances[0] || 0;
    });
  });

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

// Call the CreateAndExportData function with actual parameters
const AccountID = 1; // Replace with actual AccountID
const SiteId = 322; // Replace with actual SiteId
const AlertId = 1360; // Replace with actual AlertId
CreateAndExportData(AccountID, SiteId, AlertId);
