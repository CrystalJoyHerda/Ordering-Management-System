document.addEventListener('DOMContentLoaded', function() {
    // API base URL
    const API_BASE_URL = 'http://localhost/SOURCE_CODE/Employee/public/api';
    
    // Load current Philippine date and time first
    loadCurrentDate();
    
    // Initialize date inputs with current dates
    const today = new Date();
    const lastWeek = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));
    
    document.getElementById('start-date').value = formatDate(lastWeek);
    document.getElementById('end-date').value = formatDate(today);    // Chart filter buttons functionality
    const chartFilters = document.querySelectorAll('.chart-filters button');
    chartFilters.forEach(button => {
        button.addEventListener('click', function() {
            chartFilters.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            const timeframe = this.textContent.toLowerCase();
            loadSalesTrends(timeframe);
        });
    });

    // Apply date filter
    document.querySelector('.apply-btn').addEventListener('click', function() {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        updateSalesData(startDate, endDate);
    });

    // Store current chart data
    let currentChartData = {
        daily: [],
        weekly: [],
        monthly: []
    };    // Fetch and display sales overview data
    async function loadSalesOverview() {
        const overviewCards = document.querySelector('.overview-cards');
        showLoading(overviewCards);
        
        try {
            const response = await fetch(`${API_BASE_URL}/sales.php?action=overview`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            if (data.status === 'success') {
                updateOverviewCards(data.data);
                showSuccess('Sales data loaded successfully', document.querySelector('.main-content'));
            } else {
                console.error('API Error:', data.message);
                showFallbackData();
                showError('Failed to load sales data: ' + data.message, document.querySelector('.main-content'));
            }
        } catch (error) {
            console.error('Error fetching sales overview:', error);
            showFallbackData();
            showError('Connection error. Showing demo data.', document.querySelector('.main-content'));
        } finally {
            hideLoading(overviewCards);
        }
    }

    // Update overview cards with real data
    function updateOverviewCards(data) {
        const cards = document.querySelectorAll('.overview-cards .card');
        
        // Today's sales
        if (cards[0]) {
            const todayAmount = cards[0].querySelector('.amount');
            const todayTrend = cards[0].querySelector('.trend');
            const todayIcon = todayTrend.querySelector('i');
            
            todayAmount.textContent = `₱${Number(data.today.total).toLocaleString()}`;
            todayTrend.textContent = `${data.today.change >= 0 ? '+' : ''}${data.today.change}% `;
            todayTrend.className = `trend ${data.today.change >= 0 ? 'positive' : 'negative'}`;
            todayIcon.className = `fas fa-arrow-${data.today.change >= 0 ? 'up' : 'down'}`;
            todayTrend.appendChild(todayIcon);
        }
        
        // Weekly sales
        if (cards[1]) {
            const weeklyAmount = cards[1].querySelector('.amount');
            const weeklyTrend = cards[1].querySelector('.trend');
            const weeklyIcon = weeklyTrend.querySelector('i');
            
            weeklyAmount.textContent = `₱${Number(data.weekly.total).toLocaleString()}`;
            weeklyTrend.textContent = `${data.weekly.change >= 0 ? '+' : ''}${data.weekly.change}% `;
            weeklyTrend.className = `trend ${data.weekly.change >= 0 ? 'positive' : 'negative'}`;
            weeklyIcon.className = `fas fa-arrow-${data.weekly.change >= 0 ? 'up' : 'down'}`;
            weeklyTrend.appendChild(weeklyIcon);
        }
        
        // Monthly sales
        if (cards[2]) {
            const monthlyAmount = cards[2].querySelector('.amount');
            const monthlyTrend = cards[2].querySelector('.trend');
            const monthlyIcon = monthlyTrend.querySelector('i');
            
            monthlyAmount.textContent = `₱${Number(data.monthly.total).toLocaleString()}`;
            monthlyTrend.textContent = `${data.monthly.change >= 0 ? '+' : ''}${data.monthly.change}% `;
            monthlyTrend.className = `trend ${data.monthly.change >= 0 ? 'positive' : 'negative'}`;
            monthlyIcon.className = `fas fa-arrow-${data.monthly.change >= 0 ? 'up' : 'down'}`;
            monthlyTrend.appendChild(monthlyIcon);
        }
    }    // Fetch sales trends for charts
    async function loadSalesTrends(timeframe = 'daily') {
        const chartContainer = document.querySelector('.chart-container');
        showLoading(chartContainer);
        
        try {
            const response = await fetch(`${API_BASE_URL}/sales.php?action=trends&timeframe=${timeframe}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }            const result = await response.json();
            debugAPIResponse('trends', result);
            
            if (result.status === 'success') {
                // Validate that data is an array
                if (result.data && Array.isArray(result.data)) {
                    currentChartData[timeframe] = result.data;
                    updateChart(timeframe);
                    updateChartLabels(timeframe, result.data);
                } else {
                    console.error('Invalid data format received:', result.data);
                    currentChartData[timeframe] = [];
                    updateChart(timeframe);
                    showError('Invalid data format received from server', chartContainer);
                }
            } else {
                console.error('API Error:', result.message);
                currentChartData[timeframe] = [];
                updateChart(timeframe);
                showError('Failed to load chart data: ' + result.message, chartContainer);
            }
        } catch (error) {
            console.error('Error fetching sales trends:', error);
            currentChartData[timeframe] = [];
            updateChart(timeframe);
            showError('Failed to load chart data. Using demo data.', chartContainer);
        } finally {
            hideLoading(chartContainer);
        }
    }// Update chart based on filter
    function updateChart(timeframe) {
        const bars = document.querySelectorAll('.bar');
        const data = currentChartData[timeframe];
        
        // Validate data is an array
        if (!data || !Array.isArray(data) || data.length === 0) {
            console.log('No valid data available for timeframe:', timeframe, 'Using fallback data');
            // Use fallback data if no real data available
            const fallbackData = [60, 80, 40, 70, 90, 55, 75];
            bars.forEach((bar, index) => {
                if (fallbackData[index] !== undefined) {
                    bar.style.height = `${fallbackData[index]}%`;
                    bar.style.transition = 'height 0.5s ease';
                }
            });
            return;
        }
        
        // Calculate max value for scaling - ensure all items have valid totals
        const validTotals = data
            .filter(item => item && item.total !== undefined && item.total !== null)
            .map(item => parseFloat(item.total) || 0);
            
        if (validTotals.length === 0) {
            console.log('No valid totals found in data');
            return;
        }
        
        const maxValue = Math.max(...validTotals);
        
        bars.forEach((bar, index) => {
            if (data[index] && data[index].total !== undefined) {
                const total = parseFloat(data[index].total) || 0;
                const percentage = maxValue > 0 ? (total / maxValue) * 100 : 0;
                bar.style.height = `${Math.max(percentage, 5)}%`; // Minimum 5% height for visibility
                bar.style.transition = 'height 0.5s ease';
                bar.setAttribute('data-value', `₱${Number(total).toLocaleString()}`);
                bar.setAttribute('title', `${data[index].label || 'Unknown'}: ₱${Number(total).toLocaleString()}`);
            } else {
                // Set empty bar if no data
                bar.style.height = '5%';
                bar.setAttribute('data-value', '₱0');
                bar.setAttribute('title', 'No data');
            }
        });
    }    // Update chart labels based on timeframe
    function updateChartLabels(timeframe, data) {
        const xAxisLabels = document.querySelectorAll('.x-axis span');
        const chartDescription = document.querySelector('.chart-description p');
        const avgElement = document.querySelector('.legend-avg');
        
        // Validate data is an array
        if (!data || !Array.isArray(data) || data.length === 0) {
            console.log('No valid data for chart labels');
            // Set default labels
            if (chartDescription) {
                const descriptions = {
                    daily: 'Daily revenue trends for the current week',
                    weekly: 'Weekly revenue trends for recent weeks',
                    monthly: 'Monthly revenue trends for recent months'
                };
                chartDescription.textContent = descriptions[timeframe] || descriptions.daily;
            }
            if (avgElement) {
                avgElement.textContent = 'Average: ₱0';
            }
            return;
        }
        
        // Update x-axis labels
        xAxisLabels.forEach((label, index) => {
            if (data[index] && data[index].label) {
                label.textContent = data[index].label;
            }
        });
        
        // Calculate and display average
        const validTotals = data
            .filter(item => item && item.total !== undefined && item.total !== null)
            .map(item => parseFloat(item.total) || 0);
            
        if (validTotals.length > 0) {
            const total = validTotals.reduce((sum, value) => sum + value, 0);
            const average = total / validTotals.length;
            if (avgElement) {
                avgElement.textContent = `Average: ₱${Number(average).toLocaleString()}`;
            }
        } else {
            if (avgElement) {
                avgElement.textContent = 'Average: ₱0';
            }
        }
        
        // Update description
        if (chartDescription) {
            const descriptions = {
                daily: 'Daily revenue trends for the current week',
                weekly: 'Weekly revenue trends for recent weeks',
                monthly: 'Monthly revenue trends for recent months'
            };
            chartDescription.textContent = descriptions[timeframe] || descriptions.daily;
        }
    }// Load top selling products
    async function loadTopProducts() {
        const productsTable = document.querySelector('.products-table');
        showLoading(productsTable);
        
        try {
            const response = await fetch(`${API_BASE_URL}/sales.php?action=top_products&limit=5`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            if (data.status === 'success') {
                updateProductsTable(data.data);
            } else {
                console.error('API Error:', data.message);
                showError('Failed to load product data: ' + data.message, productsTable);
            }
        } catch (error) {
            console.error('Error fetching top products:', error);
            showError('Failed to load product data. Check connection.', productsTable);
        } finally {
            hideLoading(productsTable);
        }
    }    // Update products table with real data
    function updateProductsTable(products) {
        const tbody = document.querySelector('.products-table tbody');
        tbody.innerHTML = ''; // Clear existing rows
        
        products.forEach(product => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${product.product_name || product.name || 'Unknown Product'}</td>
                <td>${product.total_quantity || 0}</td>
                <td>₱${Number(product.total_revenue || 0).toLocaleString()}</td>
                <td><span class="trend ${product.trend >= 0 ? 'positive' : 'negative'}">${product.trend >= 0 ? '+' : ''}${product.trend || 0}%</span></td>
            `;
            tbody.appendChild(row);
        });
    }// Update sales data based on date range
    async function updateSalesData(startDate, endDate) {
        console.log(`Fetching sales data from ${startDate} to ${endDate}`);
        
        // Show loading state
        const cards = document.querySelectorAll('.card');
        cards.forEach(card => {
            card.style.opacity = '0.7';
        });
        
        try {
            // Get the actual date objects
            const startDateObj = new Date(startDate + 'T00:00:00');
            const endDateObj = new Date(endDate + 'T00:00:00');
            
            // Validate dates
            if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
                showError('Invalid date range selected', document.querySelector('.main-content'));
                return;
            }
            
            const response = await fetch(`${API_BASE_URL}/sales.php?action=date_range&start_date=${startDate}&end_date=${endDate}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            if (data.status === 'success') {
                updateDateRangeData(data.data, startDateObj, endDateObj);
            } else {
                console.error('API Error:', data.message);
                // If API fails, show demo data for the selected date range
                generateDemoDataForDateRange(startDateObj, endDateObj);
            }
        } catch (error) {
            console.error('Error fetching date range data:', error);
            // If fetch fails, show demo data for the selected date range
            const startDateObj = new Date(startDate + 'T00:00:00');
            const endDateObj = new Date(endDate + 'T00:00:00');
            generateDemoDataForDateRange(startDateObj, endDateObj);
        } finally {
            // Remove loading state
            cards.forEach(card => {
                card.style.opacity = '1';
            });
        }
    }    // Generate demo data for a specific date range when API fails
    function generateDemoDataForDateRange(startDate, endDate) {
        // Calculate number of days in range
        const daysDiff = Math.floor((endDate - startDate) / (24 * 60 * 60 * 1000)) + 1;
        
        // Create demo data structure
        const demoData = {
            total_sales: 0,
            daily_breakdown: []
        };
        
        // Generate data for each day
        for (let i = 0; i < Math.min(daysDiff, 7); i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + i);
            
            // Random sales between 10000 and 50000
            const dailyTotal = Math.floor(Math.random() * 40000) + 10000;
            demoData.total_sales += dailyTotal;
            
            demoData.daily_breakdown.push({
                date: formatDate(currentDate),
                daily_total: dailyTotal
            });
        }
        
        // Update chart with demo data
        updateDateRangeData(demoData, startDate, endDate);
    }

    // Update dashboard with date range data
    function updateDateRangeData(data, startDate, endDate) {
        // Get elements
        const bars = document.querySelectorAll('.bar');
        const xAxisLabels = document.querySelectorAll('.x-axis span');
        const chartDescription = document.querySelector('.chart-description p');
        const avgElement = document.querySelector('.legend-avg');
        
        console.log('Data for date range:', data);
        console.log('Date range:', startDate, 'to', endDate);
        
        // Calculate dates in the range
        const datesInRange = getDatesInRange(startDate, endDate);
        console.log('Dates in range:', datesInRange.map(d => formatDate(d)));
        
        // Reset all bars and labels first
        bars.forEach((bar, index) => {
            bar.style.height = '5%';
            bar.setAttribute('title', 'No data');
            bar.setAttribute('data-date', '');
            if (index < xAxisLabels.length) {
                xAxisLabels[index].textContent = '';
            }
        });
        
        // Update x-axis labels with dates
        datesInRange.forEach((date, index) => {
            if (index < xAxisLabels.length) {
                // Format date as "May 15" for x-axis
                const formattedDate = date.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric'
                });
                xAxisLabels[index].textContent = formattedDate;
            }
        });
        
        // If we have daily breakdown data, update the bars
        if (data.daily_breakdown && data.daily_breakdown.length > 0) {
            // Calculate maximum value for scaling
            const maxValue = Math.max(...data.daily_breakdown.map(item => parseFloat(item.daily_total || item.total || 0)));
            
            // Map data points to dates in our range
            data.daily_breakdown.forEach(dayData => {
                const dataDate = new Date(dayData.date + 'T00:00:00');
                
                // Find which index this date corresponds to
                const dateIndex = datesInRange.findIndex(date => 
                    date.getFullYear() === dataDate.getFullYear() &&
                    date.getMonth() === dataDate.getMonth() &&
                    date.getDate() === dataDate.getDate()
                );
                
                if (dateIndex !== -1 && dateIndex < bars.length) {
                    const total = parseFloat(dayData.daily_total || dayData.total || 0);
                    const percentage = maxValue > 0 ? (total / maxValue) * 100 : 0;
                    
                    // Update bar
                    bars[dateIndex].style.height = `${Math.max(percentage, 5)}%`;
                    bars[dateIndex].style.transition = 'height 0.5s ease';
                    bars[dateIndex].setAttribute('data-date', dayData.date);
                    
                    // Format tooltip with day name: "Mon, May 15: ₱25,000"
                    const tooltipDate = dataDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                    });
                    bars[dateIndex].setAttribute('title', `${tooltipDate}: ₱${Number(total).toLocaleString()}`);
                }
            });
        }
        
        // Update chart description and average
        const startFormatted = startDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric' 
        });
        
        const endFormatted = endDate.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric' 
        });
        
        if (chartDescription) {
            chartDescription.textContent = `Revenue trends from ${startFormatted} to ${endFormatted}`;
        }
        
        if (avgElement && data.daily_breakdown && data.daily_breakdown.length > 0) {
            // Calculate average from actual data points
            const total = data.daily_breakdown.reduce((sum, item) => {
                return sum + parseFloat(item.daily_total || item.total || 0);
            }, 0);
            
            const average = total / data.daily_breakdown.length;
            avgElement.textContent = `Average: ₱${Number(average).toLocaleString()}`;
        } else if (avgElement) {
            avgElement.textContent = 'Average: ₱0';
        }
    }

    // Helper function to get an array of dates between startDate and endDate (inclusive)
    function getDatesInRange(startDate, endDate) {
        const dates = [];
        // Limit to maximum of 7 days to match our 7 bars
        const maxDays = 7;
        
        // Calculate the actual number of days
        const totalDays = Math.floor((endDate - startDate) / (24 * 60 * 60 * 1000)) + 1;
        const daysToShow = Math.min(totalDays, maxDays);
        
        // If more than 7 days selected, skip some days to show a representative sample
        const skipFactor = totalDays > maxDays ? Math.floor(totalDays / maxDays) : 1;
        
        for (let i = 0; i < daysToShow; i++) {
            const currentDate = new Date(startDate);
            currentDate.setDate(startDate.getDate() + (i * skipFactor));
            
            // Don't go past end date
            if (currentDate <= endDate) {
                dates.push(currentDate);
            }
        }
        
        // If we have room for the end date and it's not already included, add it
        const lastDate = dates[dates.length - 1];
        if (dates.length < maxDays && 
            !(lastDate.getFullYear() === endDate.getFullYear() && 
              lastDate.getMonth() === endDate.getMonth() && 
              lastDate.getDate() === endDate.getDate())) {
            dates.push(endDate);
        }
        
        return dates;
    }

    // Show fallback data when API fails
    function showFallbackData() {
        const cards = document.querySelectorAll('.overview-cards .card');
        cards.forEach(card => {
            const amount = card.querySelector('.amount');
            if (amount.textContent.includes('Today')) {
                amount.textContent = '₱1,250';
            } else if (amount.textContent.includes('Weekly')) {
                amount.textContent = '₱8,940';
            } else if (amount.textContent.includes('Monthly')) {
                amount.textContent = '₱32,460';
            }
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
    });    // Add click handlers for table rows (using event delegation)
    document.querySelector('.products-table tbody').addEventListener('click', function(e) {
        const row = e.target.closest('tr');
        if (row) {
            const product = row.cells[0].textContent;
            const revenue = row.cells[2].textContent;
            console.log(`Showing details for ${product} with revenue ${revenue}`);
            // Here you would typically show a modal or navigate to product details
        }
    });

    // Initialize dashboard with real data
    async function initializeDashboard() {
        await loadSalesOverview();
        await loadSalesTrends('daily');
        await loadTopProducts();
    }

    // Initialize with real data
    initializeDashboard();
    
    // Show loading state
    function showLoading(element) {
        if (element) {
            element.classList.add('loading');
        }
    }

    // Hide loading state
    function hideLoading(element) {
        if (element) {
            element.classList.remove('loading');
        }
    }

    // Show error message
    function showError(message, container) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        if (container) {
            container.appendChild(errorDiv);
            setTimeout(() => {
                if (errorDiv.parentNode) {
                    errorDiv.parentNode.removeChild(errorDiv);
                }
            }, 5000);
        }
    }

    // Show success message
    function showSuccess(message, container) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        if (container) {
            container.appendChild(successDiv);
            setTimeout(() => {
                if (successDiv.parentNode) {
                    successDiv.parentNode.removeChild(successDiv);
                }
            }, 3000);
        }
    }

    // Debug function to log API responses
    function debugAPIResponse(endpoint, data) {
        console.log(`=== API Response Debug: ${endpoint} ===`);
        console.log('Raw response:', data);
        console.log('Data type:', typeof data);
        console.log('Is array:', Array.isArray(data));
        if (data && data.data) {
            console.log('Data.data type:', typeof data.data);
            console.log('Data.data is array:', Array.isArray(data.data));
            console.log('Data.data content:', data.data);
        }
        console.log('=== End Debug ===');
    }

    // Load and display current Philippine date from server
    async function loadCurrentDate() {
        try {
            const response = await fetch(`${API_BASE_URL}/sales.php?action=debug_timezone`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            if (data.status === 'success') {
                // Display the corrected Philippine date
                const dateDisplay = document.getElementById('date-display');
                const timezoneDisplay = document.getElementById('timezone-display');
                
                if (dateDisplay) {
                    dateDisplay.textContent = data.corrected_formatted_date || data.formatted_date;
                }
                
                if (timezoneDisplay) {
                    timezoneDisplay.textContent = `${data.timezone} (UTC+8)`;
                }
                
                console.log('Current Philippine date loaded:', data.corrected_formatted_date);
            } else {
                console.error('Failed to load current date:', data.message);
                // Fallback to browser date
                setFallbackDate();
            }
        } catch (error) {
            console.error('Error loading current date:', error);
            // Fallback to browser date
            setFallbackDate();
        }
    }

    // Fallback date display using browser time
    function setFallbackDate() {
        const dateDisplay = document.getElementById('date-display');
        const timezoneDisplay = document.getElementById('timezone-display');
        
        if (dateDisplay) {
            const today = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                timeZone: 'Asia/Manila'
            };
            dateDisplay.textContent = today.toLocaleDateString('en-US', options);
        }
        
        if (timezoneDisplay) {
            timezoneDisplay.textContent = 'Asia/Manila (UTC+8)';
        }
    }
});
