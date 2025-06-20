const { calculateCost } = require('./tariffCalculator');

module.exports = (app) => {
  // New sensor data endpoint returning mock data with tariff-based cost calculation
  app.get('/api/sensor-data', (req, res) => {
    // Assume userType is residential for this example; can be extended to get from user profile
    const userType = 'residential';

    // Mock power data in watts and time interval in hours (assuming 1 hour intervals for simplicity)
    const timeIntervalHours = 1;

    const rawSensorData = {
      '1': {
        current: [0.5, 0.6, 0.55, 0.58, 0.6, 0.62, 0.6],
        voltage: [220, 221, 219, 220, 222, 221, 220],
        power: [110, 115, 112, 114, 116, 117, 115],
      },
      '2': {
        current: [0.7, 0.75, 0.72, 0.74, 0.76, 0.78, 0.75],
        voltage: [220, 219, 221, 220, 222, 220, 221],
        power: [154, 160, 158, 159, 161, 162, 160],
      },
      '3': {
        current: [0.6, 0.62, 0.61, 0.63, 0.65, 0.64, 0.63],
        voltage: [220, 220, 219, 221, 222, 220, 221],
        power: [132, 135, 134, 136, 138, 137, 136],
      },
    };

    const sensorDataWithCost = {};

    for (const applianceId in rawSensorData) {
      const powerArray = rawSensorData[applianceId].power;
      // Calculate total energy consumption in kWh (power in watts * hours / 1000)
      const totalEnergyKWh = powerArray.reduce((sum, p) => sum + p * timeIntervalHours / 1000, 0);

      // Calculate cost using tariff calculator
      const cost = calculateCost(totalEnergyKWh, userType);

      // Create amount array with cost repeated for each time point (simplified)
      const amountArray = powerArray.map(() => cost);

      sensorDataWithCost[applianceId] = {
        ...rawSensorData[applianceId],
        amount: amountArray,
      };
    }

    res.json(sensorDataWithCost);
  });

  // Add POST /api/sensor-data route to accept sensor data and write to Firestore
  const admin = require('firebase-admin');
  const serviceAccount = require('./path/to/serviceAccountKey.json'); // Provide your Firebase service account key path

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });
  }

  const db = admin.firestore();

  app.post('/api/sensor-data', async (req, res) => {
    let sensorData = req.body;

    try {
      // Clean and parse power value (remove any prefix like "LCD:P:")
      let powerValue = sensorData.power;
      if (typeof powerValue === 'string') {
        powerValue = powerValue.replace(/^[^0-9.-]+/, ''); // Remove non-numeric prefix
        powerValue = parseFloat(powerValue);
      }

      // Calculate energy (assuming power in watts and 1 hour interval, energy in Wh)
      const energy = powerValue; // If time interval is 1 hour, energy in Wh equals power in W

      // Add cleaned power, calculated energy, and units to sensorData
      sensorData = {
        ...sensorData,
        voltage: sensorData.voltage + ' V',
        current: sensorData.current + ' A',
        power: powerValue + ' W',
        energy: energy + ' Wh',
      };

      // Write sensor data to Firestore "readings" collection with timestamp
      const docRef = await db.collection('readings').add({
        ...sensorData,
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log('Sensor data written with ID:', docRef.id);
      res.status(200).json({ message: 'Sensor data received and stored successfully', id: docRef.id });
    } catch (error) {
      console.error('Error writing sensor data to Firestore:', error);
      res.status(500).json({ error: 'Failed to store sensor data' });
    }
  });
};
