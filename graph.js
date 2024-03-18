const fs = require("fs");
const puppeteer = require("puppeteer");
const { ChartJSNodeCanvas } = require("chartjs-node-canvas");

// Function to prepare Chart.js data
function prepareChartData(data) {
  // Function implementation remains the same
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
      // Chart options
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
  const imageData = fs.readFileSync("chart.png", "base64");
  const imageSrc = `data:image/png;base64,${imageData}`;

  // Set the HTML content for the PDF
  const htmlContent = `
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Chart PDF</title>
  </head>
  <body>
    <h1>Chart Image</h1>
    <img src="${imageSrc}" alt="Chart Image" />
  </body>
  </html>
    `;

  // Set the HTML content of the page
  await page.setContent(htmlContent, { waitUntil: "domcontentloaded" });

  // Generate PDF
  await page.pdf({ path: "chart.pdf", format: "A4" });

  // Close the browser
  await browser.close();

  console.log("PDF generated successfully at: chart.pdf");
}

module.exports = { prepareChartData, createGraph, exportGraphToPDF };
