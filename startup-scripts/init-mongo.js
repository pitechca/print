db = db.getSiblingDB(process.env.MONGO_DB_NAME);

db.createUser({
  user: process.env.MONGO_DB_USER,
  pwd: process.env.MONGO_DB_PASS,
  roles: [{ role: "readWrite", db: process.env.MONGO_DB_NAME }],
});

print("✅ MongoDB user created!");
