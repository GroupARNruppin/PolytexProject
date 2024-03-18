const puppeteer = require("puppeteer");
const fs = require("fs");

async function renderPDF() {
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

module.exports = { renderPDF };
