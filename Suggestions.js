function generateSuggestions(tableData, mostFrequentItem) {
  const suggestions = [];

  // Helper function to get unique size keys from all rows
  const getUniqueSizes = () => {
    const sizes = new Set();
    tableData.forEach((row) => {
      Object.keys(row).forEach((size) => {
        if (size !== "Department" && size !== "Sum") {
          sizes.add(size);
        }
      });
    });
    return Array.from(sizes);
  };
  const uniqueSizes = getUniqueSizes();

  // Helper function to find missing sizes for each department
  const findMissingSizes = (row, uniqueSizes) => {
    return uniqueSizes.filter((size) => row[size] === undefined || row[size] === 0);
  };

  const getDepartmentWithMostStockItems = () => {
    let department = '';
    let sizesToFocus = [];
    let maxStockSum = -Infinity;
  
    tableData.forEach((row) => {
      if (row.Department !== "Grand Total") {
        // Extract size and stock pairs, excluding 'Department' and 'Sum'
        const sizeStockPairs = Object.entries(row)
          .filter(([size, _]) => size !== "Department" && size !== "Sum");
  
        // Find the two sizes with the highest stock values
        const topTwoSizes = sizeStockPairs
          .sort(([, stockA], [, stockB]) => stockB - stockA) // Sort by stock descending
          .slice(0, 2); // Get the top 2 sizes
  
        // Calculate the combined stock of the top two sizes
        const currentStockSum = topTwoSizes.reduce((sum, [, stock]) => sum + stock, 0);
  
        // Update the department and sizes if the current stock sum is greater
        if (currentStockSum > maxStockSum) {
          maxStockSum = currentStockSum;
          department = row.Department;
          sizesToFocus = topTwoSizes.map(([size, _]) => size);
        }
      }
    });
  
    return { department, sizesToFocus };
  };
  
  // Helper function to find the department with the most out-of-stock sizes for suggestion 2
  const getDepartmentWithMostOutOfStockSizes = () => {
    let maxOutOfStock = 0;
    let department = '';
    let outOfStockSizes = [];

    tableData.forEach((row) => {
      if (row.Department !== "Grand Total") {
        const outOfStockSizesInRow = findMissingSizes(row, uniqueSizes);

        const outOfStockCount = outOfStockSizesInRow.length;
        if (outOfStockCount > maxOutOfStock) {
          maxOutOfStock = outOfStockCount;
          department = row.Department;
          outOfStockSizes = outOfStockSizesInRow;
        }
      }
    });

    return { department, outOfStockSizes };
  };

  // Calculate the average appearance count for all items
  const getAverageAppearanceCount = () => {
    const totalAppearanceCount = tableData[0].Sum;
    const countSizes = Object.keys(tableData[0]).filter(
      (key) => key !== "Sum" && key !== "Department"
    ).length;
    return totalAppearanceCount / countSizes;
  };

  // Suggestion 1: Add more fill during the day focusing on specific sizes
  const { department: deptWithMostStock, sizesToFocus } = getDepartmentWithMostStockItems();
  suggestions.push(
    `The station <strong>${deptWithMostStock}</strong> has the highest stock for key items. We suggest adding <strong>1 more fill during the day</strong> focusing on the <strong>${sizesToFocus.join(" & ")}</strong> sizes.`
  );

  // Suggestion 2: Change cell configuration based on most out-of-stock sizes
  const { department: deptWithMostOutOfStock, outOfStockSizes } = getDepartmentWithMostOutOfStockSizes();
  suggestions.push(
    `Based on our analytics and knowledge of the station's location, we recommend changing the cell configuration of <strong>${deptWithMostOutOfStock}</strong> to not have any <strong>${outOfStockSizes.join(", ")}</strong> cells.`
  );

  // Suggestion 3: Increase stock for the most missed item
  const averageAppearanceCount = getAverageAppearanceCount();
  const increaseRatio = mostFrequentItem.Appearance_Count / averageAppearanceCount;
  const increasePercentage = Math.min(increaseRatio * 10, 20); // Cap the increase at 20%

  suggestions.push(
    `The <strong>${mostFrequentItem.Item_name}</strong> item is by far the most missed item across the hospital - we suggest increasing the stock by <strong>${Math.round(
      increasePercentage
    )}%</strong>.`
  );

  return suggestions;
}

module.exports = {
  generateSuggestions,
};
