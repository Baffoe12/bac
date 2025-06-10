-- Seed data for UsageRecord table with mock usage data for testing
DELETE FROM "UsageRecords";

INSERT INTO "UsageRecords" ("applianceId", "timestamp", "power", "cost") VALUES
(1, NOW() - INTERVAL '30 days', 5.0, 1.0),
(1, NOW() - INTERVAL '29 days', 5.5, 1.1),
(1, NOW() - INTERVAL '28 days', 6.0, 1.2),
(2, NOW() - INTERVAL '30 days', 2.0, 0.4),
(2, NOW() - INTERVAL '29 days', 2.2, 0.44),
(2, NOW() - INTERVAL '28 days', 2.5, 0.5),
(3, NOW() - INTERVAL '30 days', 3.0, 0.6),
(3, NOW() - INTERVAL '29 days', 3.1, 0.62),
(3, NOW() - INTERVAL '28 days', 3.3, 0.66),
(4, NOW() - INTERVAL '30 days', 1.5, 0.3),
(4, NOW() - INTERVAL '29 days', 1.6, 0.32),
(4, NOW() - INTERVAL '28 days', 1.7, 0.34),
(5, NOW() - INTERVAL '30 days', 2.5, 0.5),
