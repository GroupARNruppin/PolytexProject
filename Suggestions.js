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
  suggestions.push(
    `The most frequently out-of-stock item is <strong>${mostFrequentItem.Item_name}</strong>, which has been out of stock <strong>${mostFrequentItem.Appearance_Count}</strong> times. We recommend increasing the stock level for this item by at least 20% to prevent future shortages and ensure continuous availability. This will help in meeting the demand consistently and avoiding disruptions.`
  );

  // Suggestion 4: Optimizing stock levels based on usage patterns
  suggestions.push(
    `Based on the current usage patterns, we suggest conducting a detailed review of the stock levels across all departments. Focus on high-demand items and adjust the reorder points to better match consumption rates. This can help in maintaining optimal stock levels, reducing the chances of stockouts, and improving the overall inventory management process.`
  );

  // Suggestion 5: Implementing an automated inventory management system
  suggestions.push(
    `Consider implementing an automated inventory management system to continuously monitor stock levels and automatically trigger replenishment orders. This system can help in maintaining consistent stock levels, reducing manual errors, and improving overall efficiency. By leveraging automation, you can ensure timely restocking and better inventory control.`
  );

  return suggestions;
}

module.exports = {
  generateSuggestions,
};
