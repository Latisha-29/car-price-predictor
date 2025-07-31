// Car Price Prediction Frontend JavaScript

// Global variables
let carsData = [];
let statsData = {};
let currentPage = 1;
const itemsPerPage = 10;
let filteredCars = [];

// API base URL
const API_BASE_URL = 'http://localhost:3000/api';

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
});

async function initializeApp() {
    try {
        showLoadingSpinner();
        await Promise.all([
            loadCarsData(),
            loadStatsData()
        ]);
        
        renderStatsCards();
        renderCharts();
        renderDataTable();
        hideLoadingSpinner();
        
        showNotification('Dashboard loaded successfully!', 'success');
    } catch (error) {
        console.error('Error initializing app:', error);
        showNotification('Failed to load dashboard data', 'error');
        hideLoadingSpinner();
    }
}

// Event listeners
function setupEventListeners() {
    // Prediction form
    document.getElementById('predictionForm').addEventListener('submit', handlePrediction);
    
    // Search functionality
    document.getElementById('searchInput').addEventListener('input', handleSearch);
    
    // Navigation smooth scroll
    document.querySelectorAll('nav a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });
}

// Load cars data from API
async function loadCarsData() {
    try {
        const response = await fetch(`${API_BASE_URL}/cars`);
        if (!response.ok) throw new Error('Failed to fetch cars data');
        carsData = await response.json();
        filteredCars = [...carsData];
    } catch (error) {
        console.error('Error loading cars data:', error);
        // Fallback to sample data if API fails
        carsData = getSampleCarsData();
        filteredCars = [...carsData];
    }
}

// Load statistics data from API
async function loadStatsData() {
    try {
        const response = await fetch(`${API_BASE_URL}/stats`);
        if (!response.ok) throw new Error('Failed to fetch stats data');
        statsData = await response.json();
    } catch (error) {
        console.error('Error loading stats data:', error);
        // Calculate basic stats from cars data
        statsData = calculateStatsFromCars();
    }
}

// Handle prediction form submission
async function handlePrediction(e) {
    e.preventDefault();
    
    const formData = {
        fueltype: document.getElementById('fueltype').value,
        carbody: document.getElementById('carbody').value,
        enginesize: parseInt(document.getElementById('enginesize').value),
        horsepower: parseInt(document.getElementById('horsepower').value),
        curbweight: parseInt(document.getElementById('curbweight').value),
        cylindernumber: document.getElementById('cylindernumber').value,
        highwaympg: parseInt(document.getElementById('highwaympg').value)
    };
    
    // Validate form data
    if (!validatePredictionForm(formData)) {
        showNotification('Please fill in all required fields', 'error');
        return;
    }
    
    try {
        showLoadingSpinner();
        const prediction = await makePrediction(formData);
        displayPredictionResult(prediction);
        showNotification('Prediction completed successfully!', 'success');
    } catch (error) {
        console.error('Prediction error:', error);
        showNotification('Failed to make prediction. Please try again.', 'error');
    } finally {
        hideLoadingSpinner();
    }
}

// Make prediction API call
async function makePrediction(data) {
    try {
        const response = await fetch(`${API_BASE_URL}/predict`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) throw new Error('Prediction failed');
        return await response.json();
    } catch (error) {
        // Fallback prediction calculation
        return calculateFallbackPrediction(data);
    }
}

// Validate prediction form
function validatePredictionForm(data) {
    return data.fueltype && data.carbody && data.enginesize && 
           data.horsepower && data.curbweight && data.cylindernumber && 
           data.highwaympg;
}

// Display prediction result
function displayPredictionResult(prediction) {
    const resultDiv = document.getElementById('predictionResult');
    const priceSpan = document.getElementById('predictedPrice');
    const confidenceSpan = document.getElementById('confidence');
    
    priceSpan.textContent = formatCurrency(prediction.predictedPrice || prediction.price);
    confidenceSpan.textContent = `${((prediction.confidence || 0.85) * 100).toFixed(1)}%`;
    
    resultDiv.classList.remove('hidden');
    resultDiv.classList.add('prediction-result');
}

// Render statistics cards
function renderStatsCards() {
    const container = document.getElementById('statsCards');
    const stats = [
        {
            title: 'Total Cars',
            value: statsData.totalCars || carsData.length,
            icon: 'fas fa-database',
            color: 'yellow'
        },
    
    ];
    
    container.innerHTML = stats.map(stat => `
        <div class="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 stats-card">
            <div class="flex items-center">
                <div class="p-3 rounded-full bg-${stat.color}-500/20">
                    <i class="${stat.icon} text-${stat.color}-400 text-xl"></i>
                </div>
                <div class="ml-4">
                    <p class="text-gray-400 text-sm">${stat.title}</p>
                    <p class="text-white text-2xl font-bold">${stat.value}</p>
                </div>
            </div>
        </div>
    `).join('');
}

// Render charts
function renderCharts() {
    renderPriceChart();
    renderCorrelationChart();
}

// Render price distribution chart
function renderPriceChart() {
    const ctx = document.getElementById('priceChart').getContext('2d');
    const priceDistribution = calculatePriceDistribution();
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: priceDistribution.map(d => d.range),
            datasets: [{
                label: 'Number of Cars',
                data: priceDistribution.map(d => d.count),
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: 'rgba(59, 130, 246, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#D1D5DB'
                    }
                }
            },
            scales: {
                y: {
                    ticks: {
                        color: '#D1D5DB'
                    },
                    grid: {
                        color: '#374151'
                    }
                },
                x: {
                    ticks: {
                        color: '#D1D5DB'
                    },
                    grid: {
                        color: '#374151'
                    }
                }
            }
        }
    });
}

// Render correlation chart
function renderCorrelationChart() {
    const ctx = document.getElementById('correlationChart').getContext('2d');
    const scatterData = carsData.slice(0, 50).map(car => ({
        x: car.horsepower || 100,
        y: car.price || 10000
    }));
    
    new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Price vs Horsepower',
                data: scatterData,
                backgroundColor: 'rgba(7, 111, 76, 0.6)',
                borderColor: 'rgba(11, 223, 153, 1)',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#D1D5DB'
                    }
                }
            },
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Price ($)',
                        color: '#D1D5DB'
                    },
                    ticks: {
                        color: '#D1D5DB'
                    },
                    grid: {
                        color: '#374151'
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Horsepower',
                        color: '#D1D5DB'
                    },
                    ticks: {
                        color: '#D1D5DB'
                    },
                    grid: {
                        color: '#374151'
                    }
                }
            }
        }
    });
}

// Render data table
function renderDataTable() {
    const tbody = document.getElementById('tableBody');
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredCars.slice(startIndex, endIndex);
    
    tbody.innerHTML = pageData.map(car => `
        <tr class="border-b border-gray-700/50 hover:bg-gray-700/20 transition-colors">
            <td class="py-3 text-white">${car.carName || car.CarName || 'Unknown'}</td>
            <td class="py-3 text-gray-300 capitalize">${car.fueltype || car.fuelType || 'N/A'}</td>
            <td class="py-3 text-gray-300 capitalize">${car.carbody || car.carBody || 'N/A'}</td>
            <td class="py-3 text-gray-300">${car.enginesize || car.engineSize || 'N/A'}</td>
            <td class="py-3 text-gray-300">${car.horsepower || 'N/A'}</td>
            <td class="py-3 text-gray-300">${(car.curbweight || car.curbWeight || 0).toLocaleString()}</td>
            <td class="py-3 text-gray-300">${car.highwaympg || car.highwayMPG || 'N/A'}</td>
            <td class="py-3 text-green-400 font-semibold">${formatCurrency(car.price || 0)}</td>
        </tr>
    `).join('');
    
    renderPagination();
}

// Handle search
function handleSearch(e) {
    const searchTerm = e.target.value.toLowerCase();
    filteredCars = carsData.filter(car => {
        const carName = (car.carName || car.CarName || '').toLowerCase();
        const fuelType = (car.fueltype || car.fuelType || '').toLowerCase();
        const carBody = (car.carbody || car.carBody || '').toLowerCase();
        
        return carName.includes(searchTerm) || 
               fuelType.includes(searchTerm) || 
               carBody.includes(searchTerm);
    });
    
    currentPage = 1;
    renderDataTable();
}

// Render pagination
function renderPagination() {
    const totalPages = Math.ceil(filteredCars.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, filteredCars.length);
    
    // Update pagination info
    document.getElementById('paginationInfo').textContent = 
        `Showing ${startIndex + 1} to ${endIndex} of ${filteredCars.length} entries`;
    
    // Update pagination controls
    const controls = document.getElementById('paginationControls');
    controls.innerHTML = `
        <button onclick="changePage(${currentPage - 1})" 
                ${currentPage === 1 ? 'disabled' : ''} 
                class="px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
            Previous
        </button>
        ${generatePageNumbers(currentPage, totalPages)}
        <button onclick="changePage(${currentPage + 1})" 
                ${currentPage === totalPages ? 'disabled' : ''} 
                class="px-3 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">
            Next
        </button>
    `;
}

// Generate page numbers
function generatePageNumbers(current, total) {
    let pages = '';
    const start = Math.max(1, current - 2);
    const end = Math.min(total, current + 2);
    
    for (let i = start; i <= end; i++) {
        pages += `
            <button onclick="changePage(${i})" 
                    class="px-3 py-1 rounded ${i === current ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}">
                ${i}
            </button>
        `;
    }
    
    return pages;
}

// Change page
function changePage(page) {
    const totalPages = Math.ceil(filteredCars.length / itemsPerPage);
    if (page < 1 || page > totalPages) return;
    
    currentPage = page;
    renderDataTable();
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        maximumFractionDigits: 0
    }).format(amount);
}

function showLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.remove('hidden');
}

function hideLoadingSpinner() {
    document.getElementById('loadingSpinner').classList.add('hidden');
}

function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'} mr-2"></i>
        ${message}
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Calculate statistics from cars data
function calculateStatsFromCars() {
    if (!carsData.length) return {};
    
    const totalCars = carsData.length;
    const avgPrice = carsData.reduce((sum, car) => sum + (car.price || 0), 0) / totalCars;
    
    return {
        totalCars,
        avgPrice: Math.round(avgPrice)
    };
}

function calculateAveragePrice() {
    if (!carsData.length) return 0;
    return carsData.reduce((sum, car) => sum + (car.price || 0), 0) / carsData.length;
}

function calculatePriceDistribution() {
    const ranges = [
        { min: 0, max: 5000, range: '$0-5k' },
        { min: 5000, max: 10000, range: '$5-10k' },
        { min: 10000, max: 15000, range: '$10-15k' },
        { min: 15000, max: 20000, range: '$15-20k' },
        { min: 20000, max: 25000, range: '$20-25k' },
        { min: 25000, max: 30000, range: '$25-30k' },
        { min: 30000, max: Infinity, range: '$30k+' }
    ];
    
    return ranges.map(range => ({
        range: range.range,
        count: carsData.filter(car => {
            const price = car.price || 0;
            return price >= range.min && price < range.max;
        }).length
    }));
}

// Fallback prediction calculation
function calculateFallbackPrediction(data) {
    // Simple prediction based on engine size and horsepower
    const basePrice = 5000;
    const engineFactor = data.enginesize * 50;
    const horsepowerFactor = data.horsepower * 80;
    const weightFactor = data.curbweight * 2;
    
    let predictedPrice = basePrice + engineFactor + horsepowerFactor + (weightFactor * 0.5);
    
    // Adjust for fuel type
    if (data.fueltype === 'diesel') {
        predictedPrice *= 1.1;
    }
    
    // Adjust for body type
    const bodyMultipliers = {
        'convertible': 1.3,
        'sedan': 1.0,
        'hatchback': 0.9,
        'wagon': 1.1,
        'hardtop': 1.2
    };
    
    predictedPrice *= (bodyMultipliers[data.carbody] || 1.0);
    
    return {
        predictedPrice: Math.round(predictedPrice),
        confidence: 0.85
    };
}

// Sample data fallback
function getSampleCarsData() {
    return [
        {
            carName: "Toyota Camry",
            fueltype: "gas",
            carbody: "sedan",
            enginesize: 120,
            horsepower: 150,
            curbweight: 2800,
            highwaympg: 32,
            price: 18500
        },
        {
            carName: "Honda Civic",
            fueltype: "gas",
            carbody: "hatchback",
            enginesize: 92,
            horsepower: 110,
            curbweight: 2200,
            highwaympg: 35,
            price: 15200
        },
        {
            carName: "BMW 320i",
            fueltype: "gas",
            carbody: "sedan",
            enginesize: 140,
            horsepower: 180,
            curbweight: 3100,
            highwaympg: 28,
            price: 28900
        }
    ];
}