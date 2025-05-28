document.addEventListener('DOMContentLoaded', function() {
    // Set default date range (current week)
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    
    const endOfWeek = new Date(today);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    
    // Format dates for input fields
    document.getElementById('start-date').value = formatDate(startOfWeek);
    document.getElementById('end-date').value = formatDate(endOfWeek);
    
    // Initial render with default dates
    updateChartWithDateRange(startOfWeek, endOfWeek);
    
    // Add event listener to the apply button
    document.getElementById('apply-date-range').addEventListener('click', function() {
        const startDate = new Date(document.getElementById('start-date').value);
        const endDate = new Date(document.getElementById('end-date').value);
        
        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            alert('Please select valid dates');
            return;
        }
        
        if (startDate > endDate) {
            alert('Start date cannot be after end date');
            return;
        }
        
        updateChartWithDateRange(startDate, endDate);
    });
    
    // Helper function to format date as YYYY-MM-DD
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // Helper function to format date for display in x-axis
    function formatDateForDisplay(date) {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    }
    
    // Function to update chart based on date range
    function updateChartWithDateRange(startDate, endDate) {
        // Calculate the number of days in the range
        const daysDiff = Math.floor((endDate - startDate) / (24 * 60 * 60 * 1000)) + 1;
        
        // Get references to chart elements
        const barGraph = document.getElementById('sales-bar-graph');
        const dateAxis = document.getElementById('date-axis');
        
        // Clear existing bars and date labels
        barGraph.innerHTML = '';
        dateAxis.innerHTML = '';
        
        // Generate sample data (in a real app, you would fetch this from a server)
        // For this example, we'll create random data for each day in the range
        for (let i = 0; i < daysDiff; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            // Create date label for x-axis
            const dateLabel = document.createElement('span');
            dateLabel.textContent = formatDateForDisplay(currentDate);
            dateAxis.appendChild(dateLabel);
            
            // Create bar for this date with random height
            const randomHeight = Math.floor(Math.random() * 91) + 10; // 10% to 100%
            const bar = document.createElement('div');
            bar.className = 'bar';
            bar.style.height = `${randomHeight}%`;
            bar.dataset.date = formatDate(currentDate);
            barGraph.appendChild(bar);
        }
        
        // Update chart description to reflect the date range
        const chartDescription = document.querySelector('.chart-description p');
        chartDescription.textContent = `Revenue trends from ${formatDateForDisplay(startDate)} to ${formatDateForDisplay(endDate)}`;
    }
});
