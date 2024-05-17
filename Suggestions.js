function generateSuggestions(tableData, mostFrequentItem) {
  const suggestions = [];

  // Suggestion 1: Adding more fill during the day focusing on the most missing size
  tableData.forEach((row) => {
    if (row.Department !== "Grand Total") {
      const maxSize = Object.keys(row).reduce((max, size) => {
        if (
          size !== "Department" &&
          size !== "Sum" &&
          row[size] > (row[max] || 0)
        ) {
          return size;
        }
        return max;
      }, "");

      suggestions.push(
        `The <strong>station ${row.Department}</strong> is the leader in missing items - we suggest <strong>adding 1</strong> more fill during the day focusing on the <strong>‘${maxSize}’ size.</strong>`
      );
    }
  });

  // Suggestion 2: Remove unused sizes from departments
  tableData.forEach((row) => {
    if (row.Department !== "Grand Total") {
      const unusedSizes = Object.keys(row).filter(
        (size) => size !== "Department" && size !== "Sum" && row[size] === 0
      );
      if (unusedSizes.length > 0) {
        suggestions.push(
          `Based on our analytics, we recommend removing the following unused size(s) from the <strong>${
            row.Department
          }</strong> department: <strong>${unusedSizes.join(", ")}</strong>.`
        );
      }
    }
  });

  // Suggestion 3: Increasing stock for the most frequently appearing item
  suggestions.push(
    `We recommend increasing the stock for the most frequently appearing item: <strong>${mostFrequentItem.Item_name}</strong> with <strong>${mostFrequentItem.Appearance_Count} Out of stuck appearances!</strong>`
  );

  return suggestions;
}

module.exports = {
  generateSuggestions,
};
