const { DataTypes } = require('sequelize');
const sequelize = require('../sequelize');

const UsageRecord = sequelize.define('UsageRecord', {
  applianceId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
  },
  power: {
    type: DataTypes.FLOAT, // in kWh
    allowNull: false,
  },
  cost: {
    type: DataTypes.FLOAT, // cost for the power consumed
    allowNull: false,
  },
}, {
  timestamps: false,
});

module.exports = UsageRecord;
