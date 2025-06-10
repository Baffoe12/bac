/**
 * Tariff Calculator Module
 * Calculates electricity cost based on consumption (kWh) and tariff slabs.
 * Supports residential and non-residential tariffs as per the provided tariff table effective 1st June 2023.
 */

const residentialTariffs = [
  { maxUnits: 1, rate: 2.13 },
  { maxUnits: 2, rate: 3.57 },
  { maxUnits: 3, rate: 5.00 },
  { maxUnits: 4, rate: 6.44 },
  { maxUnits: 5, rate: 7.88 },
  { maxUnits: 10, rate: 16.51 },
  { maxUnits: 20, rate: 30.89 },
  { maxUnits: 25, rate: 38.08 },
  { maxUnits: 30, rate: 45.27 },
  { maxUnits: 31, rate: 55.31 },
  { maxUnits: 35, rate: 61.07 },
  { maxUnits: 40, rate: 68.26 },
  { maxUnits: 45, rate: 75.45 },
  { maxUnits: 50, rate: 82.64 },
  { maxUnits: 51, rate: 84.08 },
  { maxUnits: 55, rate: 89.83 },
  { maxUnits: 60, rate: 97.02 },
  { maxUnits: 65, rate: 104.21 },
  { maxUnits: 70, rate: 111.41 },
  { maxUnits: 75, rate: 118.59 },
  { maxUnits: 80, rate: 125.79 },
  { maxUnits: 100, rate: 154.55 },
  { maxUnits: 110, rate: 168.93 },
  { maxUnits: 120, rate: 183.31 },
  { maxUnits: 130, rate: 197.69 },
  { maxUnits: 140, rate: 212.08 },
  { maxUnits: 150, rate: 226.46 },
  { maxUnits: 151, rate: 227.89 },
  { maxUnits: 160, rate: 240.83 },
  { maxUnits: 170, rate: 255.23 },
  { maxUnits: 180, rate: 269.61 },
  { maxUnits: 190, rate: 283.98 },
  { maxUnits: 200, rate: 298.37 },
  { maxUnits: 210, rate: 312.75 },
  { maxUnits: 220, rate: 327.13 },
  { maxUnits: 230, rate: 341.51 },
  { maxUnits: 240, rate: 355.89 },
  { maxUnits: 250, rate: 370.28 },
  { maxUnits: 260, rate: 384.65 },
  { maxUnits: 270, rate: 399.04 },
  { maxUnits: 280, rate: 413.43 },
  { maxUnits: 290, rate: 427.80 },
  { maxUnits: 300, rate: 442.19 },
  { maxUnits: 301, rate: 444.05 },
  { maxUnits: 310, rate: 460.85 },
  { maxUnits: 320, rate: 479.51 },
  { maxUnits: 330, rate: 498.18 },
  { maxUnits: 340, rate: 516.84 },
  { maxUnits: 350, rate: 535.51 },
  { maxUnits: 550, rate: 908.81 },
  { maxUnits: 600, rate: 1002.13 },
  { maxUnits: 601, rate: 1004.21 },
  { maxUnits: 650, rate: 1105.83 },
  { maxUnits: 700, rate: 1209.51 },
  { maxUnits: 750, rate: 1313.21 },
  { maxUnits: 800, rate: 1416.90 },
  { maxUnits: 850, rate: 1520.60 },
  { maxUnits: 900, rate: 1624.28 },
  { maxUnits: 950, rate: 1727.98 },
  { maxUnits: 1000, rate: 1831.67 },
  { maxUnits: 1050, rate: 1935.37 },
  { maxUnits: 1100, rate: 2039.05 },
  { maxUnits: 1200, rate: 2246.45 },
  { maxUnits: 1300, rate: 2453.83 },
  { maxUnits: 1400, rate: 2661.22 },
  { maxUnits: 1500, rate: 2868.60 },
  { maxUnits: 2000, rate: 3905.53 },
  { maxUnits: 2500, rate: 4942.46 },
  { maxUnits: 3000, rate: 5979.38 },
  { maxUnits: 3500, rate: 7016.31 },
  { maxUnits: 4000, rate: 8053.24 },
  { maxUnits: 4500, rate: 9109.16 },
  { maxUnits: 5000, rate: 10272.96 },
  { maxUnits: 10000, rate: 20496.36 },
];

const nonResidentialTariffs = [
  { maxUnits: 1, rate: 14.92 },
  { maxUnits: 2, rate: 16.53 },
  { maxUnits: 3, rate: 18.14 },
  { maxUnits: 4, rate: 19.76 },
  { maxUnits: 5, rate: 21.36 },
  { maxUnits: 10, rate: 31.03 },
  { maxUnits: 20, rate: 47.14 },
  { maxUnits: 25, rate: 55.19 },
  { maxUnits: 30, rate: 63.24 },
  { maxUnits: 31, rate: 64.86 },
  { maxUnits: 35, rate: 71.30 },
  { maxUnits: 40, rate: 79.36 },
  { maxUnits: 45, rate: 87.42 },
  { maxUnits: 50, rate: 95.46 },
  { maxUnits: 51, rate: 97.07 },
  { maxUnits: 55, rate: 103.52 },
  { maxUnits: 60, rate: 111.58 },
  { maxUnits: 65, rate: 119.63 },
  { maxUnits: 70, rate: 127.69 },
  { maxUnits: 75, rate: 135.74 },
  { maxUnits: 80, rate: 143.79 },
  { maxUnits: 100, rate: 176.02 },
  { maxUnits: 110, rate: 192.13 },
  { maxUnits: 120, rate: 208.24 },
  { maxUnits: 130, rate: 224.34 },
  { maxUnits: 140, rate: 240.45 },
  { maxUnits: 150, rate: 256.57 },
  { maxUnits: 151, rate: 258.18 },
  { maxUnits: 160, rate: 272.68 },
  { maxUnits: 170, rate: 288.79 },
  { maxUnits: 180, rate: 304.89 },
  { maxUnits: 190, rate: 321.01 },
  { maxUnits: 200, rate: 337.12 },
  { maxUnits: 210, rate: 353.23 },
  { maxUnits: 220, rate: 369.34 },
  { maxUnits: 230, rate: 385.44 },
  { maxUnits: 240, rate: 401.56 },
  { maxUnits: 250, rate: 417.67 },
  { maxUnits: 260, rate: 433.77 },
  { maxUnits: 270, rate: 449.89 },
  { maxUnits: 280, rate: 466.00 },
  { maxUnits: 290, rate: 482.11 },
  { maxUnits: 300, rate: 498.21 },
  { maxUnits: 301, rate: 499.93 },
  { maxUnits: 310, rate: 515.36 },
  { maxUnits: 320, rate: 532.50 },
  { maxUnits: 330, rate: 549.64 },
  { maxUnits: 340, rate: 566.80 },
  { maxUnits: 350, rate: 583.93 },
  { maxUnits: 550, rate: 926.77 },
  { maxUnits: 600, rate: 1012.49 },
  { maxUnits: 601, rate: 1015.05 },
  { maxUnits: 650, rate: 1140.45 },
  { maxUnits: 700, rate: 1284.00 },
  { maxUnits: 750, rate: 1396.36 },
  { maxUnits: 800, rate: 1531.24 },
  { maxUnits: 850, rate: 1652.28 },
  { maxUnits: 900, rate: 1780.24 },
  { maxUnits: 950, rate: 1908.19 },
  { maxUnits: 1000, rate: 2036.14 },
  { maxUnits: 1050, rate: 2164.11 },
  { maxUnits: 1100, rate: 2292.05 },
  { maxUnits: 1200, rate: 2547.96 },
  { maxUnits: 1300, rate: 2803.88 },
  { maxUnits: 1400, rate: 3153.70 },
  { maxUnits: 1500, rate: 3509.35 },
  { maxUnits: 2000, rate: 4595.27 },
  { maxUnits: 2500, rate: 5874.83 },
  { maxUnits: 3000, rate: 7154.39 },
  { maxUnits: 3500, rate: 8433.95 },
  { maxUnits: 4000, rate: 9713.52 },
  { maxUnits: 4500, rate: 10903.08 },
  { maxUnits: 5000, rate: 12272.64 },
  { maxUnits: 10000, rate: 25068.26 },
];

/**
 * Calculate electricity cost based on units consumed and user type.
 * @param {number} units - Units consumed in kWh.
 * @param {'residential'|'non-residential'} userType - User type.
 * @returns {number} - Calculated cost.
 */
function calculateCost(units, userType = 'residential') {
  if (units <= 0) return 0;

  const tariffs = userType === 'residential' ? residentialTariffs : nonResidentialTariffs;

  // Find the slab for the units consumed
  for (let i = 0; i < tariffs.length; i++) {
    if (units <= tariffs[i].maxUnits) {
      return tariffs[i].rate;
    }
  }

  // If units exceed max slab, calculate proportionally based on last slab rate
  const lastTariff = tariffs[tariffs.length - 1];
  const extraUnits = units - lastTariff.maxUnits;
  return lastTariff.rate + extraUnits * (lastTariff.rate / lastTariff.maxUnits);
}

module.exports = {
  calculateCost,
};
