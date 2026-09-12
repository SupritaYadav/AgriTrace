import express from "express";
import { getCurrentUser, requireRole } from "../core/deps.js";
import { Role } from "../core/roles.js";
import {
  createListing,
  listListings,
  getListingById,
  buyListing,
  getListingsByFarmer,
  getPurchasesByBuyer,
} from "../services/marketplaceService.js";
import { success, error as errorRes } from "../utils/apiResponse.js";

const router = express.Router();
const marketplaceReadRoles = [Role.FARMER, Role.TRANSPORTER, Role.WAREHOUSE, Role.RETAILER, Role.ADMIN];
const buyerRoles = [Role.WAREHOUSE, Role.RETAILER, Role.ADMIN];

router.post("/", getCurrentUser, requireRole(Role.FARMER, Role.ADMIN), async (req, res) => {
  try {
    const listing = await createListing(req.body, req.user.uid);
    return success(res, listing, "Listing created successfully");
  } catch (err) {
    if (err.code === "INVALID_LISTING") {
      return errorRes(res, 400, err.message, err.code);
    }
    console.error("Create listing error:", err);
    return errorRes(res, 500, "Failed to create listing");
  }
});

router.get("/", getCurrentUser, requireRole(...marketplaceReadRoles), async (req, res) => {
  try {
    const { product, status, location, sellerId } = req.query;
    const listings = await listListings({ product, status, location, sellerId });
    return success(res, listings, "Listings retrieved successfully");
  } catch (err) {
    console.error("List listings error:", err);
    return errorRes(res, 500, "Failed to retrieve listings");
  }
});

router.get("/my-listings", getCurrentUser, requireRole(Role.FARMER, Role.ADMIN), async (req, res) => {
  try {
    const listings = await getListingsByFarmer(req.user.uid);
    return success(res, listings, "Your listings retrieved successfully");
  } catch (err) {
    console.error("My listings error:", err);
    return errorRes(res, 500, "Failed to retrieve your listings");
  }
});

router.get("/my-purchases", getCurrentUser, requireRole(...buyerRoles), async (req, res) => {
  try {
    const purchases = await getPurchasesByBuyer(req.user.uid);
    return success(res, purchases, "Your purchases retrieved successfully");
  } catch (err) {
    console.error("My purchases error:", err);
    return errorRes(res, 500, "Failed to retrieve your purchases");
  }
});

router.get("/:listingId", getCurrentUser, requireRole(...marketplaceReadRoles), async (req, res) => {
  try {
    const listing = await getListingById(req.params.listingId);
    if (!listing) {
      return errorRes(res, 404, "Listing not found");
    }
    return success(res, listing, "Listing retrieved successfully");
  } catch (err) {
    console.error("Get listing error:", err);
    return errorRes(res, 500, "Failed to retrieve listing");
  }
});

router.post("/:listingId/buy", getCurrentUser, requireRole(...buyerRoles), async (req, res) => {
  try {
    const listing = await buyListing(req.params.listingId, req.user.uid);
    return success(res, listing, "Listing purchased successfully");
  } catch (err) {
    if (err.code === "LISTING_NOT_FOUND") {
      return errorRes(res, 404, err.message, err.code);
    }
    if (err.code === "LISTING_ALREADY_SOLD") {
      return errorRes(res, 409, err.message, err.code);
    }
    console.error("Buy listing error:", err);
    return errorRes(res, 500, "Failed to purchase listing");
  }
});

export default router;
