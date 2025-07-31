🚗 Car Price Predictor

This is a full-stack machine learning web application that predicts the price of a car based on its specifications. It uses a **Random Forest Regressor** model trained on real-world car data and provides a simple web interface to make predictions.

---

🧠 How It Works

1. The user enters car specifications on the web page (like horsepower, engine size, fuel type, etc.)
2. These inputs are sent to the backend server (Node.js + Express)
3. The backend loads a pre-trained **Random Forest Regression** model
4. The model predicts the car price and returns it to the frontend
5. The predicted price is displayed to the user

----

Folder Structure


car-price-predictor/
  backend/
    server.js              # Express backend server
    model.pkl              # Trained Random Forest model (saved with pickle)
    predict.py             # Python script to load model and predict
    requirements.txt       # Python dependencies

  frontend/
    index.html             # Main HTML UI form
    style.css              # Tailwind CSS styles

  dataset/
    best_car_price_data.csv  # Dataset used for training

  README.md                # Project documentation

----

📊 Features Used for Prediction

The machine learning model uses the following features from the dataset to predict price:

| Feature              | Description |
|----------------------|-------------|
| `Fuel Type`          | Type of fuel used by the car (e.g., Gas, Diesel) |
| `Car Body`           | Body style of the car (e.g., Sedan, Hatchback, Wagon) |
| `Engine Size`        | Total engine displacement in cubic centimeters (cc) |
| `Horsepower`         | Power output of the car in HP |
| `Curb Weight (lbs)`  | Weight of the car without passengers or cargo |
| `Number of Cylinders`| Number of engine cylinders (e.g., Four, Six, Eight) |
| `Highway MPG`        | Miles per gallon on highways (fuel efficiency) |

All categorical features are **one-hot encoded** before being passed into the model. Numerical features are **scaled or normalized** as needed during preprocessing.

The dataset is cleaned and prepared using Python (pandas), and the final model is trained using a **Random Forest Regressor** for better accuracy and robustness.

---

 🤖 Machine Learning Model

- **Algorithm:** Random Forest Regressor  
- **Library:** `scikit-learn`  
- **Language:** Python  
- **Evaluation Metric:** R² Score & Mean Squared Error

Random Forest is an ensemble model that combines multiple decision trees to improve prediction accuracy and control overfitting. It works well for non-linear relationships and high-dimensional data like car attributes.

The model is trained on a cleaned dataset and saved using `pickle`. It is later loaded by the Node.js backend via a Python child process or API.

---

🧾 Dataset

- Source: Modified version of the UCI "Automobile Data Set"
- File: `best_car_price_data.csv`
- Total Records: 205
- Format: CSV
- Includes: Categorical and numerical data about cars

---
 
  Tech Stack

 🖥️ Frontend
- HTML5
- Tailwind CSS
- JavaScript 
- ⚙️ Backend
- Node.js
- Express.js
- Python for model loading (`child_process` or API)
- 📦 Machine Learning
- Python 3.x
- scikit-learn
- pandas
- numpy
- pickle
