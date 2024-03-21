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

async function exportGraphAndTableToPDF(tableData) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Read the image file and convert it to a base64 data URL
  const imageData = fs.readFileSync("chart.png", "base64");
  const imageSrc = `data:image/png;base64,${imageData}`;

  // Generate the table HTML content with color scale
  let tableHtml = `
    <h2>Heatmap Table</h2>
    <table border="1">
      <thead>
        <tr>
          <th>Department</th>
          <th>Y</th>
          <th>S</th>
          <th>M</th>
          <th>L</th>
          <th>XL</th>
          <th>2XL</th>
          <th>3XL</th>
          <th>Sum</th>
        </tr>
      </thead>
      <tbody>
  `;

  // Populate the table with data and apply color scale
  tableData.forEach((row) => {
    tableHtml += `
        <tr>
          <td>${row.Department}</td>
          <td style="color: ${getColor(row.Y)}">${row.Y}</td>
          <td style="color: ${getColor(row.S)}">${row.S}</td>
          <td style="color: ${getColor(row.M)}">${row.M}</td>
          <td style="color: ${getColor(row.L)}">${row.L}</td>
          <td style="color: ${getColor(row.XL)}">${row.XL}</td>
          <td style="color: ${getColor(row["2XL"])}">${row["2XL"]}</td>
          <td style="color: ${getColor(row["3XL"])}">${row["3XL"]}</td>
          <td>${row.Sum}</td>
        </tr>
      `;
  });

  tableHtml += `
      </tbody>
    </table>
  `;

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
        <h1>Out Of Stock Analysis - Hospital Name - Date</h1>
        
        <span>
          As the vendor for the automatic garment dispensing units at Hospital Name, Polytex has unique insight into the inventory management practices and supply chain operations of the hospital. <br>
          In this <strong>"out of stock"</strong> analysis, Polytex will leverage this expertise to provide a comprehensive overview of the factors that contributed to the shortages experienced by the hospital in Date. This analysis will draw on data collected from the automatic garments dispensing units to identify areas of inefficiency or mismanagement that may have contributed to the shortages. Additionally, Polytex will provide recommendations for how the hospital can improve its inventory management practices and supply chain operations to ensure that critical equipment and supplies are always available when they are needed. Through this report, Polytex hopes to help Hospital Name optimize their operations and improve patient outcomes.
        </span>
  
        <h2>Graph</h2>
        <img src="${imageSrc}" alt="Graph Image" />
  
        ${tableHtml}
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

// Function to get color based on value for color scale
function getColor(value) {
  if (value >= 0 && value <= 100) {
    return "white";
  } else if (value > 100 && value <= 300) {
    return "lightyellow";
  } else if (value > 300 && value <= 500) {
    return "yellow";
  } else if (value > 500 && value <= 800) {
    return "lightorange";
  } else if (value > 800 && value <= 1100) {
    return "orange";
  } else if (value > 1100 && value <= 1300) {
    return "lightred";
  } else if (value > 1300 && value <= 1500) {
    return "red";
  } else {
    return "darkred";
  }
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
  getMaxCount,
  generateTableData,
  createGraph,
  exportGraphAndTableToPDF,
  prepareChartData,
};
