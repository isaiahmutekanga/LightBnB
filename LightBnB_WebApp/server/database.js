// const properties = require("./json/properties.json");
// const users = require("./json/users.json");
const db = require("../db");

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function (email) {
  return db
    .query(
      `
    SELECT * FROM users
    WHERE email = $1;
  `,
      [email],
      (res) => { //callback function
        if (res) return res.rows[0];
        return null;
      }
    )
    .then((res) => {
      if (res) {
        return res;
      } else {
        return null;
      }
    })
    .catch((err) => console.error("query error", err.stack));
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function (id) {
  return db
    .query(
      `
    SELECT * FROM users
    WHERE name = $1;
  `,
      [id],
      res => {
        if (res) return res.rows[0];
        return null;
      }
    )
    .then((res) => {
      if (res) {
        return res;
      } else {
        return null;
      }
    })
    .catch((err) => console.error("query error", err.stack));
  // return Promise.resolve(users[id]);
};
exports.getUserWithId = getUserWithId;

/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser = function (user) {
  return db
    .query(
      `
    INSERT INTO users(name, email, password)
    VALUES($1 ,$2, $3)
    RETURNING *;
  `,
      [user.name, user.email, user.password]
    )
    .then((res) => res.rows)
    .catch((err) => console.error("query error", err.stack));
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function (guest_id, limit = 10) {
  return db
    .query(
      `
    SELECT
      properties.id AS id,
      title,
      cost_per_night,
      start_date,
      end_date,
      avg(rating) as rating,
      cover_photo_url,
      thumbnail_photo_url
    FROM reservations
    JOIN properties ON reservations.property_id = properties.id
    JOIN property_reviews ON property_reviews.property_id = properties.id
    WHERE end_date < NOW()::DATE AND
      reservations.guest_id = $1
    GROUP BY properties.id, reservations.id
    ORDER BY reservations.start_date
    limit $2;
  `,
      [guest_id, limit]
    )
    .then((res) => res.rows)
    .catch((err) => console.error("query error", err.stack));
  // return getAllProperties(null, 2);
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function (options, limit = 10) {
  // const limitedProperties = {};
  const queryParams = [];
  const base = 10;
  let counter = 0;
  let queryString = `
  SELECT properties.*,
    avg(property_reviews.rating) as average_rating
  FROM properties
  JOIN property_reviews ON properties.id = property_reviews.property_id  
  `;

  if (options.city) {
    counter++;
    queryParams.push(`%${options.city}%`);
    queryString += `WHERE city ILIKE $${queryParams.length} 
    `;
  }

  if (options.owner_id) {
    counter++;
    queryParams.push(options.owner_id);
    if (counter === 2) {
      queryString += `AND owner_id = $${queryParams.length} 
      `;
      console.log("Got here!");
    } else if (counter === 1) {
      queryString += `WHERE owner_id = $${queryParams.length} 
      `;
    }
  }

  if (options.minimum_price_per_night && options.maximum_price_per_night) {
    counter += 2;
    console.log("string ?", Number.isInteger(options.maximum_price_per_night));
    const min = parseInt(options.minimum_price_per_night, base);
    const max = parseInt(options.maximum_price_per_night, base);
    queryParams.push(min);
    queryString += `AND cost_per_night >= $${queryParams.length} 
    `;
    queryParams.push(max);
    queryString += `AND cost_per_night <= $${queryParams.length} 
    `;
  }

  queryString += `GROUP BY properties.id
  `;

  if (options.minimum_rating) {
    counter++;
    queryParams.push(options.minimum_rating);
    queryString += `HAVING AVG(property_reviews.rating) >= $${queryParams.length} 
    `;
  }

  queryParams.push(limit);
  queryString += `ORDER BY cost_per_night
  LIMIT $${queryParams.length};
  `;

  // 5
  console.log(queryString, queryParams);

  // 6
  return db.query(queryString, queryParams, (res) => res.rows);
};
exports.getAllProperties = getAllProperties;

/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function (property) {
  const queryString = `
  INSERT INTO properties (owner_id, title, description, thumbnail_photo_url,
    cover_photo_url, cost_per_night, parking_spaces, number_of_bathrooms, number_of_bedrooms,
    country, street, city, province, post_code)
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
  RETURNING * ;`;

  const values = [
    property.owner_id,
    property.title,
    property.description,
    property.thumbnail_photo_url,
    property.cover_photo_url,
    property.cost_per_night,
    property.parking_spaces,
    property.number_of_bathrooms,
    property.number_of_bedrooms,
    property.country,
    property.street,
    property.city,
    property.province,
    property.post_code,
  ];

  return db.query(queryString, values).then((res) => res.rows[0]);
};
exports.addProperty = addProperty;
