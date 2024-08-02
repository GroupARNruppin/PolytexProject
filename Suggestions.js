function generateSuggestions(tableData, mostFrequentItem) {
  const suggestions = [];

  // Helper function to find the most missing size
  const getMaxSize = (row) => {
    return Object.keys(row).reduce((max, size) => {
      if (
        size !== "Department" &&
        size !== "Sum" &&
        row[size] > (row[max] || 0)
      ) {
        return size;
      }
      return max;
    }, "");
  };

  // Helper function to find unused sizes
  const getUnusedSizes = (row) => {
    return Object.keys(row).filter(
      (size) => size !== "Department" && size !== "Sum" && row[size] === 0
    );
  };

  const countItemSizes = () => {
    // Filter the keys to exclude 'Sum' and 'Department'
    const keys = Object.keys(tableData[0]).filter(
      (key) => key !== 'Sum' && key !== 'Department'
    );
    // Return the number of keys
    return keys.length;
  }
  
  // Calculate the average appearance count for all items
  const getAverageAppearanceCount = () => {
    const totalAppearanceCount = tableData[0].Sum;
    const countSizes = countItemSizes()
    return totalAppearanceCount / countSizes;
  };

  // Suggestion 1: Adding more fill during the day focusing on the most missing size
  tableData.forEach((row) => {
    if (row.Department !== "Grand Total") {
      const maxSize = getMaxSize(row);
      suggestions.push(
        `The <strong>station ${row.Department}</strong> has frequent shortages, particularly in the <strong>${maxSize}</strong> size. To address this, we recommend adding an additional fill during peak hours to ensure availability and reduce potential disruptions. This proactive approach will help maintain optimal stock levels and improve overall efficiency.`
      );
    }
  });

  // Suggestion 2: Remove unused sizes from departments
  tableData.forEach((row) => {
    if (row.Department !== "Grand Total") {
      const unusedSizes = getUnusedSizes(row);
      if (unusedSizes.length > 0) {
        suggestions.push(
          `Our analysis shows that the <strong>${
            row.Department
          }</strong> department has the following unused sizes: <strong>${unusedSizes.join(
            ", "
          )}</strong>. We suggest removing these sizes to streamline inventory, reduce waste, and focus on stocking more frequently used items. This will help in optimizing storage space and ensuring better inventory management.`
        );
      }
    }
  });

  // Suggestion 3: Increasing stock for the most frequently appearing item
  const averageAppearanceCount = getAverageAppearanceCount();
  // console.info(averageAppearanceCount)
  // Calculate increase based on the ratio of the item's appearance count to the average
  const increaseRatio = mostFrequentItem.Appearance_Count / averageAppearanceCount;
  const increasePercentage = Math.min(increaseRatio * 10); // Cap the increase at 20%
  suggestions.push(
    `The most frequently out-of-stock item is <strong>${mostFrequentItem.Item_name}</strong>, which has been out of stock <strong>${mostFrequentItem.Appearance_Count}</strong> times.
     We recommend increasing the stock level for this item by at least <strong>${Math.round(increasePercentage, 4)}%</strong> to prevent future shortages and ensure continuous availability.
    This will help in meeting the demand consistently and avoiding disruptions.`
  );

  return suggestions;
}

module.exports = {
  generateSuggestions,
};
