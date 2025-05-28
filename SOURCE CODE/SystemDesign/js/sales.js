document.addEventListener('DOMContentLoaded', function() {
    // API base URL
    const API_BASE_URL = 'http://localhost/SOURCE_CODE/Employee/public/api';
    
    // Load current local date and time first
    loadCurrentDate();
    
    // Set up automatic date updates
    setupAutoDateUpdate();
    
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
            // Get current local date and ensure it's properly formatted
            const today = new Date();
            const currentDate = formatDateForAPI(today);
            
            console.log('=== Date Debug Info ===');
            console.log('Browser local date:', today.toString());
            console.log('Formatted date for API:', currentDate);
            console.log('Display date:', today.toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
            }));
            console.log('======================');
            
            const response = await fetch(`${API_BASE_URL}/sales.php?action=overview&current_date=${currentDate}&debug=1`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            
            // Log the API response for debugging
            console.log('API Response for date', currentDate, ':', data);
            
            if (data.status === 'success') {
                updateOverviewCards(data.data, currentDate);
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
    function updateOverviewCards(data, currentDate) {
        const cards = document.querySelectorAll('.overview-cards .card');
        
        // Today's sales - get from chart data that matches today's date
        if (cards[0]) {
            const todayAmount = cards[0].querySelector('.amount');
            const todayTrend = cards[0].querySelector('.trend');
            const todayIcon = todayTrend.querySelector('i');
            
            // First, try to get today's sales from the daily chart data
            const todaysSalesFromChart = getTodaysSalesFromChart(currentDate);
            
            if (todaysSalesFromChart !== null) {
                // Use chart data if available
                console.log('Using today\'s sales from chart data:', todaysSalesFromChart);
                todayAmount.textContent = `₱${Number(todaysSalesFromChart).toLocaleString()}`;
                
                // Calculate trend based on previous day if available
                const yesterdayDate = new Date();
                yesterdayDate.setDate(yesterdayDate.getDate() - 1);
                const yesterdaysSales = getTodaysSalesFromChart(formatDateForAPI(yesterdayDate));
                
                let trendPercentage = 0;
                if (yesterdaysSales && yesterdaysSales > 0) {
                    trendPercentage = Math.round(((todaysSalesFromChart - yesterdaysSales) / yesterdaysSales) * 100);
                }
                
                todayTrend.textContent = `${trendPercentage >= 0 ? '+' : ''}${trendPercentage}% `;
                todayTrend.className = `trend ${trendPercentage >= 0 ? 'positive' : 'negative'}`;
                todayIcon.className = `fas fa-arrow-${trendPercentage >= 0 ? 'up' : 'down'}`;
                todayTrend.appendChild(todayIcon);
            } else {
                // Fallback to API data if chart data not available
                console.log('Using today\'s sales from API data:', data.today.total);
                todayAmount.textContent = `₱${Number(data.today.total).toLocaleString()}`;
                todayTrend.textContent = `${data.today.change >= 0 ? '+' : ''}${data.today.change}% `;
                todayTrend.className = `trend ${data.today.change >= 0 ? 'positive' : 'negative'}`;
                todayIcon.className = `fas fa-arrow-${data.today.change >= 0 ? 'up' : 'down'}`;
                todayTrend.appendChild(todayIcon);
            }
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
    }

    // Function to get today's sales from chart data
    function getTodaysSalesFromChart(targetDate) {
        console.log('Looking for sales data for date:', targetDate);
        
        // Check daily chart data first
        const dailyData = currentChartData.daily;
        if (dailyData && Array.isArray(dailyData) && dailyData.length > 0) {
            for (let dayData of dailyData) {
                if (dayData.date === targetDate || dayData.label === targetDate) {
                    console.log('Found sales in daily data:', dayData.total || dayData.daily_total);
                    return parseFloat(dayData.total || dayData.daily_total || 0);
                }
            }
        }
        
        // Check if we have date range data that includes today
        const bars = document.querySelectorAll('.bar');
        const xAxisLabels = document.querySelectorAll('.x-axis span');
        
        // Convert target date to display format for comparison
        const targetDateObj = new Date(targetDate + 'T00:00:00');
        const targetDisplay = targetDateObj.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
        
        console.log('Looking for x-axis label matching:', targetDisplay);
        
        // Find matching x-axis label
        for (let i = 0; i < xAxisLabels.length; i++) {
            const labelText = xAxisLabels[i].textContent.trim();
            console.log('Checking x-axis label:', labelText);
            
            if (labelText === targetDisplay) {
                // Found matching label, get corresponding bar data
                if (bars[i]) {
                    const barDataValue = bars[i].getAttribute('data-value');
                    if (barDataValue) {
                        // Extract numeric value from "₱1,234" format
                        const numericValue = parseFloat(barDataValue.replace(/[₱,]/g, '')) || 0;
                        console.log('Found sales from bar data:', numericValue);
                        return numericValue;
                    }
                    
                    // Try to get from title attribute
                    const titleValue = bars[i].getAttribute('title');
                    if (titleValue && titleValue.includes('₱')) {
                        const match = titleValue.match(/₱([\d,]+)/);
                        if (match) {
                            const numericValue = parseFloat(match[1].replace(/,/g, '')) || 0;
                            console.log('Found sales from bar title:', numericValue);
                            return numericValue;
                        }
                    }
                }
            }
        }
        
        console.log('No sales data found for date:', targetDate);
        return null;
    }    // Fetch sales trends for charts
    async function loadSalesTrends(timeframe = 'daily') {
        const chartContainer = document.querySelector('.chart-container');
        showLoading(chartContainer);
        
        try {
            const response = await fetch(`${API_BASE_URL}/sales.php?action=trends&timeframe=${timeframe}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }            
            const result = await response.json();
            debugAPIResponse('trends', result);
            
            if (result.status === 'success') {
                // Validate that data is an array
                if (result.data && Array.isArray(result.data)) {
                    currentChartData[timeframe] = result.data;
                    updateChart(timeframe);
                    updateChartLabels(timeframe, result.data);
                    
                    // Update today's sales after chart data is loaded
                    if (timeframe === 'daily') {
                        updateTodaysSalesFromChart();
                    }
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
    }

    // Update today's sales from chart data
    function updateTodaysSalesFromChart() {
        const today = new Date();
        const currentDate = formatDateForAPI(today);
        const todaysSales = getTodaysSalesFromChart(currentDate);
        
        if (todaysSales !== null) {
            const todayCard = document.querySelector('.overview-cards .card:first-child');
            if (todayCard) {
                const todayAmount = todayCard.querySelector('.amount');
                const todayTrend = todayCard.querySelector('.trend');
                const todayIcon = todayTrend.querySelector('i');
                
                console.log('Updating Today\'s Sales card with chart data:', todaysSales);
                todayAmount.textContent = `₱${Number(todaysSales).toLocaleString()}`;
                
                // Calculate trend based on previous day if available
                const yesterdayDate = new Date();
                yesterdayDate.setDate(yesterdayDate.getDate() - 1);
                const yesterdaysSales = getTodaysSalesFromChart(formatDateForAPI(yesterdayDate));
                
                let trendPercentage = 0;
                if (yesterdaysSales && yesterdaysSales > 0) {
                    trendPercentage = Math.round(((todaysSales - yesterdaysSales) / yesterdaysSales) * 100);
                }
                
                todayTrend.textContent = `${trendPercentage >= 0 ? '+' : ''}${trendPercentage}% `;
                todayTrend.className = `trend ${trendPercentage >= 0 ? 'positive' : 'negative'}`;
                todayIcon.className = `fas fa-arrow-${trendPercentage >= 0 ? 'up' : 'down'}`;
                todayTrend.appendChild(todayIcon);
                
                // Add visual indicator that this is synced with chart
                todayCard.setAttribute('data-synced', 'true');
                todayCard.setAttribute('data-date', currentDate);
            }
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
            bar.setAttribute('data-value', '₱0');
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
                    bars[dateIndex].setAttribute('data-value', `₱${Number(total).toLocaleString()}`);
                    
                    // Format tooltip with day name: "Mon, May 15: ₱25,000"
                    const tooltipDate = dataDate.toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                    });
                    bars[dateIndex].setAttribute('title', `${tooltipDate}: ₱${Number(total).toLocaleString()}`);
                }
            });
            
            // After updating chart, update today's sales from the new chart data
            updateTodaysSalesFromChart();
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

    // Format date for API calls (ensures YYYY-MM-DD format in local timezone)
    function formatDateForAPI(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // Format date for input fields (same as formatDateForAPI but kept separate for clarity)
    function formatDate(date) {
        return formatDateForAPI(date);
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

    // Load and display current local date and time
    function loadCurrentDate() {
        const dateDisplay = document.getElementById('date-display');
        const timezoneDisplay = document.getElementById('timezone-display');
        
        if (dateDisplay) {
            const today = new Date();
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric'
            };
            dateDisplay.textContent = today.toLocaleDateString('en-US', options);
            
            // Store the current date for comparison using the same format as API
            window.lastDisplayedDate = formatDateForAPI(today);
            
            // Debug: Show what date we're storing
            console.log('Current display date stored as:', window.lastDisplayedDate);
        }
        
        if (timezoneDisplay) {
            // Get the user's timezone
            const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
            const now = new Date();
            const offset = -now.getTimezoneOffset() / 60;
            const offsetStr = offset >= 0 ? `+${offset}` : `${offset}`;
            timezoneDisplay.textContent = `${timezone} (UTC${offsetStr})`;
        }
        
        console.log('Current local date loaded and formatted for API');
    }

    // Set up automatic date updates
    function setupAutoDateUpdate() {
        // Update date every minute to catch day changes
        setInterval(() => {
            const previousDate = window.lastDisplayedDate;
            loadCurrentDate();
            
            // Get current formatted date
            const currentDate = formatDateForAPI(new Date());
            
            if (previousDate && previousDate !== currentDate) {
                console.log('=== Date Change Detected ===');
                console.log('Previous date:', previousDate);
                console.log('Current date:', currentDate);
                console.log('Refreshing sales data...');
                console.log('===========================');
                
                // Refresh today's sales for the new date
                loadSalesOverview();
                
                // Also refresh other time-based data
                loadSalesTrends('daily');
            }
            
            window.lastDisplayedDate = currentDate;
        }, 60000); // Check every minute
        
        // Also update when the page becomes visible (in case user left it open overnight)
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                console.log('Page became visible, refreshing data...');
                loadCurrentDate();
                // Refresh sales data when page becomes visible to ensure accuracy
                loadSalesOverview();
            }
        });
    }
});
