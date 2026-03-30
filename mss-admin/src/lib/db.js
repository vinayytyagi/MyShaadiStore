import { MongoClient } from "mongodb";

const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/myshaadistore";
let client = null;
let db = null;

export async function connectDB() {
  if (db) return db;
  client = new MongoClient(uri);
  await client.connect();
  db = client.db();
  return db;
}

export function getDB() {
  return db;
}

export async function getVendorCollection() {
  const database = await connectDB();
  return database.collection("vendors");
}

export async function getCategoriesCollection() {
  const database = await connectDB();
  return database.collection("categories");
}

export async function getItemsCollection() {
  const database = await connectDB();
  return database.collection("items");
}

export async function getVariantsCollection() {
  const database = await connectDB();
  return database.collection("variants");
}

export async function getJourneyStepsCollection() {
  const database = await connectDB();
  return database.collection("journey_steps");
}

export async function getOrdersCollection() {
  const database = await connectDB();
  return database.collection("orders");
}

export async function getUsersCollection() {
  const database = await connectDB();
  return database.collection("users");
}

export async function getQuotationRequestsCollection() {
  const database = await connectDB();
  return database.collection("quotation_requests");
}

export async function getSiteSettingsCollection() {
  const database = await connectDB();
  return database.collection("site_settings");
}
