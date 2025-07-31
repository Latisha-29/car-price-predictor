#!/usr/bin/env python3
import json
import sys
import numpy as np
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import LabelEncoder
import warnings
warnings.filterwarnings('ignore')

def train_model():
    """Train a simple model with sample data"""
    # Sample training data (expanded dataset)
    training_data = [
        ['gas', 'sedan', 120, 150, 2800, 'four', 32, 18500],
        ['gas', 'hatchback', 92, 110, 2200, 'four', 35, 15200],
        ['gas', 'sedan', 140, 180, 3100, 'four', 28, 28900],
        ['gas', 'sedan', 155, 200, 3200, 'four', 30, 32000],
        ['gas', 'convertible', 300, 450, 3500, 'eight', 25, 35000],
        ['diesel', 'sedan', 134, 143, 2890, 'four', 37, 22000],
        ['gas', 'wagon', 109, 102, 2658, 'four', 32, 16500],
        ['gas', 'hatchback', 88, 76, 2094, 'four', 40, 12000],
        ['gas', 'sedan', 164, 121, 2818, 'four', 32, 19500],
        ['gas', 'hardtop', 194, 207, 3217, 'six', 26, 31000],
        ['diesel', 'wagon', 183, 123, 3062, 'five', 36, 24500],
        ['gas', 'convertible', 226, 288, 3515, 'six', 23, 42000],
        ['gas', 'sedan', 171, 145, 3031, 'six', 28, 26000],
        ['gas', 'hatchback', 97, 90, 2304, 'four', 38, 14000],
        ['diesel', 'sedan', 145, 106, 2921, 'four', 42, 21500]
    ]
    
    # Prepare features and target
    features = []
    target = []
    
    # Label encoders
    fuel_encoder = LabelEncoder()
    body_encoder = LabelEncoder()
    cylinder_encoder = LabelEncoder()
    
    # Extract and encode categorical features
    fuel_types = [row[0] for row in training_data]
    body_types = [row[1] for row in training_data]
    cylinder_types = [row[5] for row in training_data]
    
    fuel_encoder.fit(fuel_types)
    body_encoder.fit(body_types)
    cylinder_encoder.fit(cylinder_types)
    
    for row in training_data:
        fueltype, carbody, enginesize, horsepower, curbweight, cylindernumber, highwaympg, price = row
        
        # Encode categorical variables
        fuel_encoded = fuel_encoder.transform([fueltype])[0]
        body_encoded = body_encoder.transform([carbody])[0]
        cylinder_encoded = cylinder_encoder.transform([cylindernumber])[0]
        
        features.append([
            fuel_encoded, body_encoded, enginesize, horsepower, 
            curbweight, cylinder_encoded, highwaympg
        ])
        target.append(price)
    
    # Train model
    model = RandomForestRegressor(n_estimators=50, random_state=42)
    model.fit(features, target)
    
    return model, fuel_encoder, body_encoder, cylinder_encoder

def predict_price(car_data, model, fuel_encoder, body_encoder, cylinder_encoder):
    """Make price prediction for given car data"""
    try:
        # Extract features
        fueltype = car_data['fueltype']
        carbody = car_data['carbody']
        enginesize = float(car_data['enginesize'])
        horsepower = float(car_data['horsepower'])
        curbweight = float(car_data['curbweight'])
        cylindernumber = car_data['cylindernumber']
        highwaympg = float(car_data['highwaympg'])
        
        # Handle unknown categories
        try:
            fuel_encoded = fuel_encoder.transform([fueltype])[0]
        except ValueError:
            fuel_encoded = 0  # Default to first category
        
        try:
            body_encoded = body_encoder.transform([carbody])[0]
        except ValueError:
            body_encoded = 0  # Default to first category
        
        try:
            cylinder_encoded = cylinder_encoder.transform([cylindernumber])[0]
        except ValueError:
            cylinder_encoded = 0  # Default to first category
        
        # Prepare feature vector
        features = np.array([[
            fuel_encoded, body_encoded, enginesize, horsepower,
            curbweight, cylinder_encoded, highwaympg
        ]])
        
        # Make prediction
        prediction = model.predict(features)[0]
        
        # Calculate confidence (simplified)
        confidence = min(0.95, max(0.75, 0.9 - abs(prediction - 20000) / 100000))
        
        return {
            'predictedPrice': max(1000, int(prediction)),  # Minimum $1000
            'confidence': round(confidence, 3),
            'method': 'Random Forest ML'
        }
        
    except Exception as e:
        # Fallback calculation
        base_price = 5000
        engine_factor = enginesize * 50
        horsepower_factor = horsepower * 80
        weight_factor = curbweight * 2
        
        predicted_price = base_price + engine_factor + horsepower_factor + (weight_factor * 0.5)
        
        if fueltype == 'diesel':
            predicted_price *= 1.1
        
        body_multipliers = {
            'convertible': 1.3,
            'sedan': 1.0,
            'hatchback': 0.9,
            'wagon': 1.1,
            'hardtop': 1.2
        }
        predicted_price *= body_multipliers.get(carbody, 1.0)
        
        return {
            'predictedPrice': max(1000, int(predicted_price)),
            'confidence': 0.75,
            'method': 'Fallback Calculation'
        }

def main():
    try:
        # Get input data
        if len(sys.argv) < 2:
            raise ValueError("No input data provided")
        
        car_data = json.loads(sys.argv[1])
        
        # Train model
        model, fuel_encoder, body_encoder, cylinder_encoder = train_model()
        
        # Make prediction
        result = predict_price(car_data, model, fuel_encoder, body_encoder, cylinder_encoder)
        
        # Output result
        print(json.dumps(result))
        
    except Exception as e:
        # Output error as JSON
        print(json.dumps({
            'error': str(e),
            'predictedPrice': 15000,
            'confidence': 0.5,
            'method': 'Error Fallback'
        }))

if __name__ == "__main__":
    main()