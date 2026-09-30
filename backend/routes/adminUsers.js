const express = require("express");
const mongoose = require("mongoose");

const User = require("../models/User");
const Order = require("../models/Order");

const router = express.Router();

// ======================================================
// ADMIN KEY SECURITY
// ======================================================

const requireAdmin = require("../middleware/requireAdmin");

// ======================================================
// HELPER
// Escape special RegExp characters in search
// ======================================================

function escapeRegex(value) {
  return String(value).replace(
    /[.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
}

// ======================================================
// GET ALL USERS
// GET /api/admin/users
// ======================================================

router.get(
  "/",
  requireAdmin,
  async (req, res) => {
    try {
      const search =
        String(
          req.query.search || ""
        ).trim();

      // ------------------------------------------
      // SEARCH FILTER
      // ------------------------------------------

      let filter = {};

      if (search) {
        const safeSearch =
          escapeRegex(search);

        const searchRegex =
          new RegExp(
            safeSearch,
            "i"
          );

        filter = {
          $or: [
            {
              fullName:
                searchRegex,
            },
            {
              email:
                searchRegex,
            },
            {
              mobile:
                searchRegex,
            },
          ],
        };
      }

      // ------------------------------------------
      // LOAD USERS
      // ------------------------------------------

      const userDocuments =
        await User.find(filter)
          .sort({
            createdAt: -1,
            _id: -1,
          })
          .select(
            "fullName email mobile createdAt"
          )
          .lean();

      // ------------------------------------------
      // FORMAT RESPONSE
      // Same shape as old SQL API
      // ------------------------------------------

      const users =
        userDocuments.map(
          (user) => ({
            id:
              user._id.toString(),

            name:
              user.fullName,

            email:
              user.email,

            mobile:
              user.mobile || "",

            createdAt:
              user.createdAt,
          })
        );

      return res.json({
        success: true,
        count: users.length,
        users,
      });
    } catch (error) {
      console.error(
        "Admin users MongoDB error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to load users",
        });
    }
  }
);

// ======================================================
// GET SINGLE USER
// GET /api/admin/users/:id
// ======================================================

router.get(
  "/:id",
  requireAdmin,
  async (req, res) => {
    try {
      const userId =
        String(
          req.params.id || ""
        ).trim();

      // ------------------------------------------
      // VALIDATE MONGODB OBJECT ID
      // ------------------------------------------

      if (
        !mongoose.isValidObjectId(
          userId
        )
      ) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Invalid user ID",
          });
      }

      // ------------------------------------------
      // USER DETAILS
      // ------------------------------------------

      const user =
        await User.findById(
          userId
        )
          .select(
            "fullName email mobile createdAt"
          )
          .lean();

      if (!user) {
        return res
          .status(404)
          .json({
            success: false,
            message:
              "User not found",
          });
      }

      // ------------------------------------------
      // USER ORDER SUMMARY
      // Paid orders + total spent
      // ------------------------------------------

      const orderStats =
        await Order.aggregate([
          {
            $match: {
              userId:
                new mongoose.Types.ObjectId(
                  userId
                ),

              paid: true,
            },
          },

          {
            $group: {
              _id: null,

              paidOrders: {
                $sum: 1,
              },

              totalSpent: {
                $sum: "$price",
              },
            },
          },
        ]);

      const stats =
        orderStats[0] || {};

      // ------------------------------------------
      // RESPONSE
      // ------------------------------------------

      return res.json({
        success: true,

        user: {
          id:
            user._id.toString(),

          name:
            user.fullName,

          email:
            user.email,

          mobile:
            user.mobile || "",

          createdAt:
            user.createdAt,

          paidOrders:
            Number(
              stats.paidOrders
            ) || 0,

          totalSpent:
            Number(
              stats.totalSpent
            ) || 0,
        },
      });
    } catch (error) {
      console.error(
        "Admin user details MongoDB error:",
        error
      );

      return res
        .status(500)
        .json({
          success: false,
          message:
            "Unable to load user details",
        });
    }
  }
);

module.exports = router;