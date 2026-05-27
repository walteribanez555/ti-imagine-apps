/**
 * mongo-init.js
 * Runs once when the MongoDB container is first created.
 * Creates a dedicated application user with least-privilege access.
 */
db = db.getSiblingDB('delivery_db');

db.createUser({
  user: 'delivery_user',
  pwd: 'delivery_pass',
  roles: [{ role: 'readWrite', db: 'delivery_db' }],
});

// Seed collection so Mongoose can pick it up right away
db.createCollection('orders');

print('✅  delivery_db initialised — user delivery_user created');
