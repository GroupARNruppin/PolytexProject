// Required imports
const fs = require("fs");
const puppeteer = require("puppeteer");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");
const { generateSuggestions } = require("./Suggestions"); // Import the suggestions module

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

    // Extract unique sizes, ensuring consistent capitalization
    const sizes = Array.from(
      new Set(data.map((item) => item.Item_Size.toUpperCase()))
    ).sort();

    sizes.forEach((size, sizeIndex) => {
      // Filter data for the current size
      const sizeData = shirtData.filter(
        (item) => item.Item_Size.toUpperCase() === size
      );
      // Map the appearances for the current size
      const appearances = sizeData.map((item) => item.Appearance_Count);

      if (!chartData.datasets[sizeIndex]) {
        chartData.datasets[sizeIndex] = {
          label: size, // Y-axis
          data: [],
          backgroundColor: getRandomColor(),
          width: "60px",
          borderWidth: "1px",
        };
      }

      chartData.datasets[sizeIndex].data[index] = appearances[0] || 0;
    });
  });

  return chartData;
}

const usedColors = []; // Array to store used colors

// Function to generate a random color
function getRandomColor(alpha = 1) {
  const randomColor = () => Math.floor(Math.random() * 256);
  let color;
  do {
    color = `rgba(${randomColor()}, ${randomColor()}, ${randomColor()}, ${alpha})`;
  } while (usedColors.includes(color)); // Check if color already exists
  usedColors.push(color); // Add the new color to the list of used colors
  return color;
}

// Function to create a Chart.js graph
function createGraph(data) {
  const canvasRenderService = new ChartJSNodeCanvas({
    width: 850,
    height: 650,
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
          font: {
            size: 24,
            weight: "bold",
          },
        },
      },
      scales: {
        x: {
          beginAtZero: true,
        },
        y: {
          barPercentage: 0.5,
          categoryPercentage: 0.5,
        },
      },
    },
  };
  const image = canvasRenderService.renderToBufferSync(configuration);
  fs.writeFileSync("chart.png", image);
  console.log("Chart created and saved as chart.png");
}

async function exportGraphAndTableToPDF(
  tableData,
  mostFrequentItem,
  hospitalName
) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Read the image file and convert it to a base64 data URL
  const imageData = fs.readFileSync("chart.png", "base64");
  const imageSrc = `data:image/png;base64,${imageData}`;
  const imageTable = fs.readFileSync("table.png", "base64");
  const imageTableSrc = `data:image/png;base64,${imageTable}`;

  // Generate suggestions
  const suggestions = generateSuggestions(tableData, mostFrequentItem);

  // Create suggestions HTML
  const suggestionsHtml = `
  <h2 style="margin-top: 30px;">Analytics Results & Suggestions</h2>
  <ol>
    ${suggestions.map((suggestion) => `<li>${suggestion}</li>`).join("")}
  </ol>
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
            font-size: 26px;
            font-weight: bold;
            text-align: center;
          }
  
          span {
            display: block;
            margin-bottom: 20px;
            color: #555;
          }
  
          h2 {
            color: #333;
            font-size: 22px;
            font-weight: bold;
            margin-bottom: 20px;
          }
  
          img {
            max-width: 100%;
            height: auto;
          }
  
          table {
            border-collapse: collapse;
            width: 100%;
            margin-bottom: 50px; /* Ensure there is space after the table */
          }
  
          th, td {
            padding: 8px;
            text-align: center;
            font-size: 14px;
          }
  
          th {
            background-color: #f2f2f2;
            font-weight: bold;
          }

          ol {
            margin-top: 20px; /* Margin above the suggestions list */
          }
          
          /* Page break */
          @media print {
            .page-break {
              page-break-before: always;
            }
          }
          
        </style>
      </head>
      <body>
      <div>
      <h1>Out Of Stock Analysis - <strong>${hospitalName}</strong> - ${new Date().getFullYear()}</h1>
      </div>  
        <div>
          <h3>General</h3>
          <span>
            As the vendor for the automatic garment dispensing units at <strong>${hospitalName}</strong>, Polytex has unique insight into the inventory management practices and supply chain operations of the hospital. <br>
            In this <strong>"out of stock"</strong> analysis, Polytex will leverage this expertise to provide a comprehensive overview of the factors that contributed to the shortages experienced by the hospital in Date. This analysis will draw on data collected from the automatic garments dispensing units to identify areas of inefficiency or mismanagement that may have contributed to the shortages. Additionally, Polytex will provide recommendations for how the hospital can improve its inventory management practices and supply chain operations to ensure that critical equipment and supplies are always available when they are needed.
            <br> <br>
            Through this report, Polytex hopes to help <strong>${hospitalName}</strong> optimize their operations and improve patient outcomes.
          </span>  
        </div>  
        <br> <br>
        <div> 
          <h3><u>Distribution Of Items & Size Across All Stations</u></h3>
          <div style="height: 25%;"><img src="${imageSrc}" alt="Graph Image" /></div>
          <br> <br> <br> <br> <br> <br> <br>
          <br> <br> <br> <br> <br> <br> <br>
        </div>
          <div>
            <div style="height: 25%;"><img src="${imageTableSrc}" alt="Table Image" /></div>
          </div>
        <br> <br> <br> <br> <br> <br> <br>
        ${suggestionsHtml}
        <div>
          This report by Polytex provides <strong>data-driven insights</strong> into inventory management and supply chain optimization at <strong>${hospitalName}</strong>.
          Based on the data, the hospital can consider adjusting inventory levels, optimizing supply chain operations, improving forecasting accuracy, and implementing automated inventory management solutions.
          Follow-through on these recommendations can help improve personal outcomes and operational efficiency.
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

// Function to generate table HTML content with dynamic size columns
async function generateTableHTML(tableData) {
  let tableHtml = `
    <h2 style="text-align: center;">Distribution Of Sizes Per Dispense Unit</h2>
    <table border="1" style="width: 100%; border-collapse: collapse;">
      <thead style="background-color: #f2f2f2;">
        <tr>
          <th style="padding: 8px; text-align: left;">Station</th>
  `;

  // Extract unique sizes from the table data, ensuring consistent capitalization
  const sizes = Array.from(
    new Set(
      tableData.flatMap((row) =>
        Object.keys(row).filter((key) => key !== "Department" && key !== "Sum")
      )
    )
  ).sort((a, b) => {
    // Sort sizes based on a more comprehensive logic
    const sizeOrder = {
      XS: 1,
      S: 2,
      M: 3,
      L: 4,
      XL: 5,
      XXL: 6,
      "3XL": 7,
      "4XL": 8,
      "5XL": 9,
    };

    const numRegex = /^\d+$/;
    const isNumA = numRegex.test(a);
    const isNumB = numRegex.test(b);

    if (isNumA && isNumB) {
      return parseInt(a) - parseInt(b);
    }

    if (isNumA) return 1;
    if (isNumB) return -1;

    return (sizeOrder[a] || 10) - (sizeOrder[b] || 10);
  });

  // Dynamically create size columns
  sizes.forEach((size) => {
    tableHtml += `<th style="padding: 8px; text-align: center;">${size}</th>`;
  });

  // Add a column for the sum of each department
  tableHtml += `<th style="padding: 8px; text-align: center;">Sum</th>`;

  tableHtml += `</tr></thead><tbody>`;

  // Find the maximum value in the table data, excluding "Grand Total"
  const maxValue = Math.max(
    ...tableData
      .filter((row) => row.Department !== "Grand Total")
      .flatMap((row) => sizes.map((size) => row[size] || 0))
  );

  // Populate the table with data
  tableData.forEach((row) => {
    tableHtml += `
      <tr>
        <td style="padding: 8px; text-align: left;">${row.Department}</td>
    `;

    // Populate size columns dynamically
    sizes.forEach((size) => {
      // Check if the current row is "Grand Total" and apply no color if so
      const backgroundColor =
        row.Department === "Grand Total"
          ? "#ffffff"
          : getColor(row[size] || 0, maxValue);
      tableHtml += `<td style="padding: 8px; text-align: center; background-color: ${backgroundColor}">${
        row[size] || 0
      }</td>`;
    });

    // Add a cell for the department's sum
    tableHtml += `<td style="padding: 8px; text-align: center; font-weight: bold;">${row.Sum}</td>`;

    tableHtml += `</tr>`;
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
function getColor(value, maxValue) {
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

  // Define color thresholds and corresponding colors for a better gradient
  const colors = [
    { threshold: 0, color: "#fff7ec" }, // Cream
    { threshold: 0.2, color: "#fee8c8" }, // Light Peach
    { threshold: 0.4, color: "#fdbb84" }, // Light Orange
    { threshold: 0.6, color: "#fc8d59" }, // Soft Orange
    { threshold: 0.8, color: "#e34a33" }, // Bright Red
    { threshold: 1, color: "#b30000" }, // Dark Red
  ];

  // Calculate the interpolation factor
  const factor = Math.min(value / maxValue, 1); // Ensure factor is between 0 and 1

  // Find the two closest thresholds
  let lowerThreshold = colors[0];
  let upperThreshold = colors[colors.length - 1];

  for (let i = 0; i < colors.length - 1; i++) {
    if (factor >= colors[i].threshold && factor < colors[i + 1].threshold) {
      lowerThreshold = colors[i];
      upperThreshold = colors[i + 1];
      break;
    }
  }

  // Calculate the interpolation factor for the color
  const localFactor =
    (factor - lowerThreshold.threshold) /
    (upperThreshold.threshold - lowerThreshold.threshold);

  // Interpolate the color
  return interpolateColor(
    lowerThreshold.color,
    upperThreshold.color,
    localFactor
  );
}

// Function to generate table data from database data with dynamic size columns
function generateTableData(queryData) {
  const tableData = [];

  // Extract unique sizes from the data
  const sizesSet = new Set();
  queryData.forEach((item) => {
    sizesSet.add(item.Item_Size.toUpperCase()); // Convert size to uppercase for consistency
  });
  const sizes = Array.from(sizesSet).sort();

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
      ...groupedData[department], // Spread size counts dynamically
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
    ...sizes.reduce((acc, size) => {
      acc[size] = tableData.reduce((sum, row) => sum + (row[size] || 0), 0);
      return acc;
    }, {}), // Calculate totals dynamically
    Sum: tableData.reduce((sum, row) => sum + row.Sum, 0),
  };

  tableData.push(totals);

  return tableData;
}

module.exports = {
  generateTableHTML,
  generateTableData,
  createGraph,
  exportGraphAndTableToPDF,
  prepareChartData,
};
