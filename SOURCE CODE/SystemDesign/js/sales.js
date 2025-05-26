document.addEventListener('DOMContentLoaded', function() {
    // Initialize date inputs with current dates
    const today = new Date();
    const lastWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    document.getElementById('start-date').value = formatDate(lastWeek);
    document.getElementById('end-date').value = formatDate(today);

    // Chart filter buttons functionality
    const chartFilters = document.querySelectorAll('.chart-filters button');
    chartFilters.forEach(button => {
        button.addEventListener('click', function() {
            chartFilters.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            updateChart(this.textContent.toLowerCase());
        });
    });

    // Apply date filter
    document.querySelector('.apply-btn').addEventListener('click', function() {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        updateSalesData(startDate, endDate);
    });

    // Sample data for demonstration
    const salesData = {
        daily: [60, 80, 40, 70, 90, 55, 75],
        weekly: [75, 65, 80, 90, 85, 70, 60],
        monthly: [65, 70, 75, 80, 85, 90, 95]
    };

    // Update chart based on filter
    function updateChart(timeframe) {
        const bars = document.querySelectorAll('.bar');
        const data = salesData[timeframe];
        
        bars.forEach((bar, index) => {
            if (data[index]) {
                bar.style.height = `${data[index]}%`;
                bar.style.transition = 'height 0.5s ease';
            }
        });
    }

    // Update sales data based on date range
    function updateSalesData(startDate, endDate) {
        // Here you would typically make an API call to get the data
        console.log(`Fetching sales data from ${startDate} to ${endDate}`);
        
        // For demonstration, just show loading state
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.style.opacity = '0.7';
            setTimeout(() => {
                card.style.opacity = '1';
            }, 1000);
        });
    }

    // Format date for input fields
    function formatDate(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Add hover effects for interactive elements
    const cards = document.querySelectorAll('.card');
    cards.forEach(card => {
        card.addEventListener('mouseover', function() {
            this.style.transform = 'translateY(-5px)';
        });
        card.addEventListener('mouseout', function() {
            this.style.transform = 'translateY(0)';
        });
    });

    // Add click handlers for table rows
    const tableRows = document.querySelectorAll('.products-table tbody tr');
    tableRows.forEach(row => {
        row.addEventListener('click', function() {
            const product = this.cells[0].textContent;
            const revenue = this.cells[2].textContent;
            console.log(`Showing details for ${product} with revenue ${revenue}`);
            // Here you would typically show a modal or navigate to product details
        });
    });

    // Initialize with daily view
    updateChart('daily');
});
