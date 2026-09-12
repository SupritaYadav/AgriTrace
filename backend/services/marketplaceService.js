import { randomUUID } from "crypto";
import { getCollection } from "../core/mongo.js";

function validateListing(data) {
  if (!data || typeof data !== "object") {
    throw new Error("Listing data is required");
  }

  const { product, quantity, pricePerUnit, location } = data;

  if (!product || typeof product !== "string" || product.trim() === "") {
    const error = new Error("product is required and must be non-empty");
    error.code = "INVALID_LISTING";
    throw error;
  }

  if (quantity === undefined || quantity === null || Number.isNaN(Number(quantity)) || Number(quantity) <= 0) {
    const error = new Error("quantity must be a positive number");
    error.code = "INVALID_LISTING";
    throw error;
  }

  if (pricePerUnit === undefined || pricePerUnit === null || Number.isNaN(Number(pricePerUnit)) || Number(pricePerUnit) <= 0) {
    const error = new Error("pricePerUnit must be a positive number");
    error.code = "INVALID_LISTING";
    throw error;
  }

  if (!location || typeof location !== "string" || location.trim() === "") {
    const error = new Error("location is required and must be non-empty");
    error.code = "INVALID_LISTING";
    throw error;
  }
}

export async function createListing(data, farmerId) {
  validateListing(data);

  const listingId = randomUUID();
  const now = new Date().toISOString();

  const listing = {
    listingId,
    farmerId,
    product: data.product.trim(),
    quantity: Number(data.quantity),
    pricePerUnit: Number(data.pricePerUnit),
    location: data.location.trim(),
    status: "AVAILABLE",
    createdAt: now,
    updatedAt: now,
  };

  await getCollection("listings").insertOne(listing);
  return listing;
}

export async function listListings(filters = {}) {
  const { product, status, location, sellerId } = filters;

  const query = {};

  if (product) {
    query.product = { $regex: product, $options: "i" };
  }

  query.status = status || "AVAILABLE";

  if (location) {
    query.location = { $regex: location, $options: "i" };
  }

  if (sellerId) {
    query.farmerId = sellerId;
  }

  return getCollection("listings")
    .find(query)
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getListingById(listingId) {
  const doc = await getCollection("listings").findOne({ listingId });
  if (!doc) return null;
  const { _id, ...rest } = doc;
  return rest;
}

export async function buyListing(listingId, buyerId) {
  const now = new Date().toISOString();

  const listing = await getCollection("listings").findOneAndUpdate(
    { listingId, status: "AVAILABLE" },
    {
      $set: {
        status: "SOLD",
        buyerId,
        soldAt: now,
        updatedAt: now,
      },
    },
    { returnDocument: "after" }
  );

  if (!listing) {
    const existing = await getCollection("listings").findOne({ listingId });
    if (!existing) {
      const error = new Error("Listing not found");
      error.code = "LISTING_NOT_FOUND";
      error.status = 404;
      throw error;
    }

    const error = new Error("Listing already sold");
    error.code = "LISTING_ALREADY_SOLD";
    error.status = 409;
    throw error;
  }

  const { _id, ...doc } = listing;
  return doc;
}

export async function getListingsByFarmer(farmerId) {
  return getCollection("listings")
    .find({ farmerId })
    .sort({ createdAt: -1 })
    .toArray();
}

export async function getPurchasesByBuyer(buyerId) {
  return getCollection("listings")
    .find({ buyerId })
    .sort({ soldAt: -1 })
    .toArray();
}
