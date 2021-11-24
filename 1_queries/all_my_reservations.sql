SELECT
  properties.id AS id,
  title,
  cost_per_night,
  start_date,
  avg(rating)
FROM reservations
JOIN properties ON reservations.property_id = properties.id
JOIN property_reviews ON properties.id = property_reviews.property_id
WHERE end_date < NOW()::DATE AND
  reservations.guest_id = 1
GROUP BY properties.id, reservations.id
ORDER BY reservations.start_date
limit 10 ;