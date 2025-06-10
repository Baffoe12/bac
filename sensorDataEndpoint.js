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
};
