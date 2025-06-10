require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const sequelize = require('./sequelize');
const UsageRecord = require('./models/UsageRecord');
const sensorDataEndpoint = require('./sensorDataEndpoint');

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(bodyParser.json());

sensorDataEndpoint(app);

// Connect to PostgreSQL
sequelize.authenticate()
  .then(() => console.log('PostgreSQL connected'))
  .catch(err => console.error('PostgreSQL connection error:', err));

// Sync models
sequelize.sync();



















app.listen(port, '0.0.0.0', () => {
  console.log(`Backend server running on port ${port}`);
});

// New endpoint: Get total consumption and estimated cost for current month
app.get('/api/usage/summary', async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const now = new Date();

    // Current month range
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    // Previous month range
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch usage records for current month
    const currentMonthRecords = await UsageRecord.findAll({
      where: {
        timestamp: {
          [Op.gte]: startOfMonth,
          [Op.lt]: endOfMonth,
        },
      },
    });

    // Fetch usage records for previous month
    const prevMonthRecords = await UsageRecord.findAll({
      where: {
        timestamp: {
          [Op.gte]: startOfPrevMonth,
          [Op.lt]: endOfPrevMonth,
        },
      },
    });

    const totalPowerCurrent = currentMonthRecords.reduce((sum, record) => sum + record.power, 0);
    const totalPowerPrev = prevMonthRecords.reduce((sum, record) => sum + record.power, 0);

    // Calculate cost using tariffCalculator
    const { calculateCost } = require('./tariffCalculator');
    const estimatedCost = calculateCost(totalPowerCurrent, 'residential');

    // Calculate percentage change from last month
    const percentageChange = totalPowerPrev === 0 ? 0 : ((totalPowerCurrent - totalPowerPrev) / totalPowerPrev) * 100;

    res.json({
      totalConsumption: totalPowerCurrent,
      estimatedCost: estimatedCost,
      unitsUsed: totalPowerCurrent,
      percentageChange: percentageChange.toFixed(2),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch usage summary' });
  }
});

// Helper function to aggregate usage by day/week/month
const aggregateUsage = (records, period) => {
  const grouped = {};
  records.forEach(record => {
    let key;
    const date = new Date(record.timestamp);
    if (period === 'day') {
      key = date.toISOString().slice(0, 10); // YYYY-MM-DD
    } else if (period === 'week') {
      const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
      const pastDaysOfYear = (date - firstDayOfYear) / 86400000;
      const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
      key = `${date.getFullYear()}-W${weekNumber}`;
    } else if (period === 'month') {
      key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    }
    if (!grouped[key]) {
      grouped[key] = { power: 0, cost: 0 };
    }
    grouped[key].power += record.power;
    grouped[key].cost += record.cost;
  });
  return grouped;
};

// New endpoint: Get usage data aggregated by day/week/month
app.get('/api/usage/data', async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const period = req.query.period || 'day'; // default to day
    const now = new Date();

    // Define start date based on period
    let startDate;
    if (period === 'day') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    } else if (period === 'week') {
      // Start of current week (Monday)
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      startDate = new Date(now.getFullYear(), now.getMonth(), diff);
    } else if (period === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else {
      startDate = new Date(0); // fallback to epoch start
    }

    // Fetch usage records from startDate to now
    const usageRecords = await UsageRecord.findAll({
      where: {
        timestamp: {
          [Op.gte]: startDate,
          [Op.lte]: now,
        },
      },
    });

    const aggregated = aggregateUsage(usageRecords, period);

    // Format aggregated data for frontend graph
    // For 'week' period, map keys to days of week Mon-Sun with power values
    if (period === 'week') {
      const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      const weekData = {};
      daysOfWeek.forEach(day => {
        weekData[day] = 0;
      });

      Object.keys(aggregated).forEach(key => {
        // key format: YYYY-WweekNumber
        // We need to map to day of week by parsing usageRecords timestamps
        usageRecords.forEach(record => {
          const date = new Date(record.timestamp);
          const dayName = daysOfWeek[date.getDay() === 0 ? 6 : date.getDay() - 1]; // Sunday=0, map to 6
          weekData[dayName] += record.power;
        });
      });

      res.json(weekData);
      return;
    }

    // For 'day' and 'month', return aggregated as is
    res.json(aggregated);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch usage data' });
  }
});

 // New endpoint: Get usage insights
app.get('/api/usage/insights', async (req, res) => {
  try {
    const { Op } = require('sequelize');
    const now = new Date();

    // Calculate start of current week (Monday)
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diff);

    // Calculate start of previous week
    const startOfPrevWeek = new Date(startOfWeek);
    startOfPrevWeek.setDate(startOfPrevWeek.getDate() - 7);

    // Fetch usage records for current week
    const currentWeekRecords = await UsageRecord.findAll({
      where: {
        timestamp: {
          [Op.gte]: startOfWeek,
          [Op.lte]: now,
        },
      },
    });

    // Fetch usage records for previous week
    const prevWeekRecords = await UsageRecord.findAll({
      where: {
        timestamp: {
          [Op.gte]: startOfPrevWeek,
          [Op.lt]: startOfWeek,
        },
      },
    });

    const totalPowerCurrentWeek = currentWeekRecords.reduce((sum, record) => sum + record.power, 0);
    const totalPowerPrevWeek = prevWeekRecords.reduce((sum, record) => sum + record.power, 0);

    // Calculate percentage increase from last week
    const percentageIncrease = totalPowerPrevWeek === 0 ? 0 : ((totalPowerCurrentWeek - totalPowerPrevWeek) / totalPowerPrevWeek) * 100;

    // Calculate peak usage hours (mocked for now, can be improved)
    const peakUsageHours = '9-11 PM';

    // Tip message
    const tip = 'Consider unplugging idle devices.';

    res.json({
      percentageIncrease: percentageIncrease.toFixed(2),
      peakUsageHours,
      tip,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch usage insights' });
  }
});
