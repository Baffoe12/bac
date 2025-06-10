require('dotenv').config();
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DATABASE_URL || 'postgresql://bac_d389_user:CgBVrsecQEmjB55ud3fixU9YtT7Ez4xt@dpg-d1463pnfte5s73e13ohg-a.oregon-postgres.render.com/bac_d389', {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: false,
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false
    }
  }
});

module.exports = sequelize;
