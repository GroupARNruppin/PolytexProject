const fs = require("fs");
const puppeteer = require("puppeteer");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");

// Function to prepare Chart.js data
function prepareChartData(data) {
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
          text: "", //Distribution Of Items & Size Across All Stations
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

async function exportGraphAndTableToPDF() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Read the image file and convert it to a base64 data URL
  const imageData = fs.readFileSync("chart.png", "base64");
  const imageSrc = `data:image/png;base64,${imageData}`;
  const imageTable = fs.readFileSync("table.png", "base64");
  const imageTableSrc = `data:image/png;base64,${imageTable}`;

  // Set the HTML content for the PDF
  const htmlContent = `
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Out Of Stock Analysis</title>
        <style>
          body {
            font-family: 'Arial', sans-serif;
            margin: 20px;
          }
  
          h1 {
            color: #333;
          }
  
          span {
            display: block;
            margin-bottom: 20px;
            color: #555;
          }
  
          h2 {
            color: #333;
          }
  
          img {
            max-width: 100%;
            height: auto;
          }
  
          table {
            border-collapse: collapse;
            width: 100%;
          }
  
          th, td {
            padding: 8px;
            text-align: center;
          }
  
          th {
            background-color: #f2f2f2;
          }

   
          
        </style>
      </head>
      <body>
      <div>
      <h1>Out Of Stock Analysis - Hospital Name - Date</h1>
      </div>  
        <div>
        <h3>General</h3>
        <span>
          As the vendor for the automatic garment dispensing units at Hospital Name, Polytex has unique insight into the inventory management practices and supply chain operations of the hospital. <br>
          In this <strong>"out of stock"</strong> analysis, Polytex will leverage this expertise to provide a comprehensive overview of the factors that contributed to the shortages experienced by the hospital in Date. This analysis will draw on data collected from the automatic garments dispensing units to identify areas of inefficiency or mismanagement that may have contributed to the shortages. Additionally, Polytex will provide recommendations for how the hospital can improve its inventory management practices and supply chain operations to ensure that critical equipment and supplies are always available when they are needed. <br>
          Through this report, Polytex hopes to help Hospital Name optimize their operations and improve patient outcomes.
        </span>
  
        </div>
        <div> 
        <h3>Distribution Of Items & Size Across All Stations</h3>
        <div style="height: 25%;"><img src="${imageSrc}" alt="Graph Image" /><div>
        </div>
          <div>
          <div style="height: 25%;"><img src="${imageTableSrc}"alt="Table Image" /></div>
          </div>
      </body>
      </html>
      `;

  // Set the HTML content of the page
  await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });

  // Generate PDF
  await page.pdf({ path: "report.pdf", format: "A4" });

  // Close the browser
  await browser.close();

  console.log("PDF generated successfully at: report.pdf");
}

// Function to generate the table HTML content with color scale
async function generateTableHTML(tableData) {
  let tableHtml = `
          <h2 style="text-align: center;">Distribution Of Sizes Per Dispense Unit</h2>
          <table border="1" style="width: 100%; border-collapse: collapse;">
            <thead style="background-color: #f2f2f2;">
              <tr>
                <th style="padding: 8px; text-align: left;">Department</th>
                <th style="padding: 8px; text-align: center;">Y</th>
                <th style="padding: 8px; text-align: center;">S</th>
                <th style="padding: 8px; text-align: center;">M</th>
                <th style="padding: 8px; text-align: center;">L</th>
                <th style="padding: 8px; text-align: center;">XL</th>
                <th style="padding: 8px; text-align: center;">2XL</th>
                <th style="padding: 8px; text-align: center;">3XL</th>
                <th style="padding: 8px; text-align: center;">Sum</th>
              </tr>
            </thead>
            <tbody>
        `;

  // Populate the table with data and apply color scale
  tableData.forEach((row) => {
    tableHtml += `
              <tr>
                <td style="padding: 8px; text-align: left;">${row.Department
      }</td>
                <td style="padding: 8px; text-align: center; background-color: ${getColor(
        row.Y
      )}">${row.Y}</td>
                <td style="padding: 8px; text-align: center; background-color: ${getColor(
        row.S
      )}">${row.S}</td>
                <td style="padding: 8px; text-align: center; background-color: ${getColor(
        row.M
      )}">${row.M}</td>
                <td style="padding: 8px; text-align: center; background-color: ${getColor(
        row.L
      )}">${row.L}</td>
                <td style="padding: 8px; text-align: center; background-color: ${getColor(
        row.XL
      )}">${row.XL}</td>
                <td style="padding: 8px; text-align: center; background-color: ${getColor(
        row["2XL"]
      )}">${row["2XL"]}</td>
                <td style="padding: 8px; text-align: center; background-color: ${getColor(
        row["3XL"]
      )}">${row["3XL"]}</td>
                <td style="padding: 8px; text-align: center; background-color : ${getColor(row.sum)}">${row.Sum}</td>
              </tr>
            `;
  });

  tableHtml += `
            </tbody>
          </table>
        `;

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Set the HTML content for the page
  await page.setContent(tableHtml, { waitUntil: "domcontentloaded" });

  // Capture a screenshot of the table
  await page.screenshot({ path: "table.png" });

  // Close the browser
  await browser.close();

  console.log("Table image created and saved as table.png");
}

// Function to get color based on value for color scale
function getColor(value) {
  // Helper function to interpolate between two colors
  function interpolateColor(color1, color2, factor) {
    const hexToRgb = (hex) => {
      const bigint = parseInt(hex.slice(1), 16);
      return [bigint >> 16, (bigint >> 8) & 255, bigint & 255];
    };

    const rgbToHex = (r, g, b) => {
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    };

    const [r1, g1, b1] = hexToRgb(color1);
    const [r2, g2, b2] = hexToRgb(color2);

    const r = Math.round(r1 + factor * (r2 - r1));
    const g = Math.round(g1 + factor * (g2 - g1));
    const b = Math.round(b1 + factor * (b2 - b1));

    return rgbToHex(r, g, b);
  }

  // Define color thresholds and corresponding colors
  const colorThresholds = [
    { threshold: 0, color: "#FFFFCC" },    // Light yellow
    { threshold: 2500, color: "#E8E8E8" }, // Light gray
    { threshold: 5000, color: "#FFFF99" }, // Light yellow
    { threshold: 7500, color: "#FFCC99" }, // Light orange
    { threshold: 10000, color: "#FFCC66" } // Light orange
  ];

  // Find the two closest thresholds
  let lowerThreshold = { threshold: -Infinity, color: "white" };
  let upperThreshold = { threshold: Infinity, color: "white" };

  for (let i = 0; i < colorThresholds.length; i++) {
    if (colorThresholds[i].threshold <= value && colorThresholds[i].threshold > lowerThreshold.threshold) {
      lowerThreshold = colorThresholds[i];
    }
    if (colorThresholds[i].threshold >= value && colorThresholds[i].threshold < upperThreshold.threshold) {
      upperThreshold = colorThresholds[i];
    }
  }

  // Calculate the interpolation factor
  const factor = (value - lowerThreshold.threshold) / (upperThreshold.threshold - lowerThreshold.threshold);

  // Interpolate the color
  return interpolateColor(lowerThreshold.color, upperThreshold.color, factor);
}



function getMaxCount(queryData) {
  let maxCount = 0; // Initialize maxCount variable
  queryData.reduce((acc, item) => {
    const department = item.Station_Name;
    const size = item.Item_Size.toUpperCase(); // Convert size to uppercase for consistency

    // Calculate maxCount
    if (!acc[department]) {
      acc[department] = {};
    }

    if (!acc[department][size]) {
      acc[department][size] = 0;
    }

    acc[department][size] += item.Appearance_Count;

    if (acc[department][size] > maxCount) {
      maxCount = acc[department][size];
    }

    return acc;
  }, {});
  return maxCount;
}

// Function to generate table data from database data
function generateTableData(queryData) {
  const tableData = [];

  // Group data by department and size
  const groupedData = queryData.reduce((acc, item) => {
    const department = item.Station_Name;
    const size = item.Item_Size.toUpperCase(); // Convert size to uppercase for consistency

    if (!acc[department]) {
      acc[department] = {};
    }

    if (!acc[department][size]) {
      acc[department][size] = 0;
    }

    acc[department][size] += item.Appearance_Count;

    return acc;
  }, {});

  // Convert grouped data into table format
  for (const department in groupedData) {
    const row = {
      Department: department,
      Y: groupedData[department]["Y"] || 0,
      S: groupedData[department]["S"] || 0,
      M: groupedData[department]["M"] || 0,
      L: groupedData[department]["L"] || 0,
      XL: groupedData[department]["XL"] || 0,
      "2XL": groupedData[department]["2XL"] || 0,
      "3XL": groupedData[department]["3XL"] || 0,
      Sum: Object.values(groupedData[department]).reduce(
        (sum, value) => sum + value,
        0
      ),
    };

    tableData.push(row);
  }

  // Calculate totals
  const totals = {
    Department: "Grand Total",
    Y: tableData.reduce((sum, row) => sum + row.Y, 0),
    S: tableData.reduce((sum, row) => sum + row.S, 0),
    M: tableData.reduce((sum, row) => sum + row.M, 0),
    L: tableData.reduce((sum, row) => sum + row.L, 0),
    XL: tableData.reduce((sum, row) => sum + row.XL, 0),
    "2XL": tableData.reduce((sum, row) => sum + row["2XL"], 0),
    "3XL": tableData.reduce((sum, row) => sum + row["3XL"], 0),
    Sum: tableData.reduce((sum, row) => sum + row.Sum, 0),
  };

  tableData.push(totals);

  return tableData;
}

module.exports = {
  generateTableHTML,
  getMaxCount,
  generateTableData,
  createGraph,
  exportGraphAndTableToPDF,
  prepareChartData,
};
