const express = require('express');
const cors = require('cors');
const csv = require('csv-parser');
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

// Global variables
let carsData = [];

// Load car data from CSV
function loadCarData() {
    const csvPath = path.join(__dirname, 'data', 'car_data.csv');
    
    if (!fs.existsSync(csvPath)) {
        console.log('CSV file not found, using sample data');
        carsData = getSampleData();
        return;
    }

    carsData = [];
    fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (row) => {
            // Normalize the data structure
            const car = {
                carName: row.CarName || row.carName || row['Car Name'] || 'Unknown',
                fueltype: row.fueltype || row.fuelType || row['Fuel Type'] || 'gas',
                carbody: row.carbody || row.carBody || row['Car Body'] || 'sedan',
                enginesize: parseFloat(row.enginesize || row.engineSize || row['Engine Size']) || 120,
                horsepower: parseFloat(row.horsepower || row.horsePower || row['Horse Power']) || 100,
                curbweight: parseFloat(row.curbweight || row.curbWeight || row['Curb Weight']) || 2500,
                cylindernumber: row.cylindernumber || row.cylinderNumber || row['Cylinder Number'] || 'four',
                highwaympg: parseFloat(row.highwaympg || row.highwayMPG || row['Highway MPG']) || 25,
                price: parseFloat(row.price || row.Price) || 15000
            };
            carsData.push(car);
        })
        .on('end', () => {
            console.log(`Loaded ${carsData.length} cars from CSV`);
        })
        .on('error', (error) => {
            console.error('Error reading CSV:', error);
            carsData = getSampleData();
        });
}

// Sample data fallback
function getSampleData() {
    return [
        {
            carName: "Toyota Camry",
            fueltype: "gas",
            carbody: "sedan",
            enginesize: 120,
            horsepower: 150,
            curbweight: 2800,
            cylindernumber: "four",
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
            cylindernumber: "four",
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
            cylindernumber: "four",
            highwaympg: 28,
            price: 28900
        },
        {
            carName: "Mercedes C-Class",
            fueltype: "gas",
            carbody: "sedan",
            enginesize: 155,
            horsepower: 200,
            curbweight: 3200,
            cylindernumber: "four",
            highwaympg: 30,
            price: 32000
        },
        {
            carName: "Ford Mustang",
            fueltype: "gas",
            carbody: "convertible",
            enginesize: 300,
            horsepower: 450,
            curbweight: 3500,
            cylindernumber: "eight",
            highwaympg: 25,
            price: 35000
        }
    ];
}

// API Routes

// Get all cars
app.get('/api/cars', (req, res) => {
    res.json(carsData);
});

// Get statistics
app.get('/api/stats', (req, res) => {
    if (carsData.length === 0) {
        return res.json({
            totalCars: 0,
            avgPrice: 0,
            minPrice: 0,
            maxPrice: 0
        });
    }

    const prices = carsData.map(car => car.price);
    const stats = {
        totalCars: carsData.length,
        avgPrice: Math.round(prices.reduce((a, b) => a + b, 0) / prices.length),
        minPrice: Math.min(...prices),
        maxPrice: Math.max(...prices)
    };

    res.json(stats);
});

// Make prediction
app.post('/api/predict', (req, res) => {
    const carData = req.body;
    
    // Validate input
    if (!carData.fueltype || !carData.carbody || !carData.enginesize || 
        !carData.horsepower || !carData.curbweight || !carData.cylindernumber || 
        !carData.highwaympg) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    try {
        // Try Python ML service first
        const python = spawn('python3', [path.join(__dirname, 'ml_service.py'), JSON.stringify(carData)]);
        
        let result = '';
        let error = '';

        python.stdout.on('data', (data) => {
            result += data.toString();
        });

        python.stderr.on('data', (data) => {
            error += data.toString();
        });

        python.on('close', (code) => {
            if (code === 0 && result) {
                try {
                    const prediction = JSON.parse(result);
                    res.json(prediction);
                } catch (parseError) {
                    // Fallback to JavaScript prediction
                    const fallbackPrediction = calculateJSPrediction(carData);
                    res.json(fallbackPrediction);
                }
            } else {
                // Fallback to JavaScript prediction
                const fallbackPrediction = calculateJSPrediction(carData);
                res.json(fallbackPrediction);
            }
        });

    } catch (error) {
        // Fallback to JavaScript prediction
        const fallbackPrediction = calculateJSPrediction(carData);
        res.json(fallbackPrediction);
    }
});

// JavaScript fallback prediction
function calculateJSPrediction(data) {
    // Simple prediction algorithm
    const basePrice = 5000;
    const engineFactor = data.enginesize * 50;
    const horsepowerFactor = data.horsepower * 80;
    const weightFactor = data.curbweight * 2;
    const mpgFactor = data.highwaympg * -100; // Better MPG = lower price

    let predictedPrice = basePrice + engineFactor + horsepowerFactor + (weightFactor * 0.5) + mpgFactor;

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

    // Adjust for cylinder count
    const cylinderMultipliers = {
        'two': 0.7,
        'three': 0.8,
        'four': 1.0,
        'five': 1.1,
        'six': 1.2,
        'eight': 1.4,
        'twelve': 1.8
    };

    predictedPrice *= (cylinderMultipliers[data.cylindernumber] || 1.0);

    return {
        predictedPrice: Math.round(Math.max(predictedPrice, 1000)), // Minimum $1000
        confidence: 0.85,
        method: 'JavaScript Fallback'
    };
}

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        carsLoaded: carsData.length 
    });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
    loadCarData();
});