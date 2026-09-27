const express = require("express");
const { sql, connectDB } = require("../db");

const router = express.Router();

// ======================================================
// ADMIN KEY SECURITY
// ======================================================

function requireAdminKey(req, res, next) {
  const adminKey = req.header("x-admin-key");

  if (!adminKey || adminKey !== process.env.ADMIN_KEY) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized",
    });
  }

  next();
}

// ======================================================
// GET ALL USERS
// GET /api/admin/users
// ======================================================

router.get("/", requireAdminKey, async (req, res) => {
  try {
    const pool = await connectDB();

    const search = String(req.query.search || "").trim();

    const request = pool.request();

    let whereClause = "";

    if (search) {
      request.input(
        "Search",
        sql.NVarChar(200),
        `%${search}%`
      );

      whereClause = `
        WHERE
          Name LIKE @Search
          OR Email LIKE @Search
          OR Mobile LIKE @Search
      `;
    }

    const result = await request.query(`
      SELECT
        Id,
        Name,
        Email,
        Mobile,
        CreatedAt
      FROM dbo.Users
      ${whereClause}
      ORDER BY CreatedAt DESC, Id DESC
    `);

    const users = result.recordset.map((user) => ({
      id: user.Id,
      name: user.Name,
      email: user.Email,
      mobile: user.Mobile,
      createdAt: user.CreatedAt,
    }));

    return res.json({
      success: true,
      count: users.length,
      users,
    });
  } catch (error) {
    console.error("Admin users error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load users",
    });
  }
});

// ======================================================
// GET SINGLE USER
// GET /api/admin/users/:id
// ======================================================

router.get("/:id", requireAdminKey, async (req, res) => {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID",
      });
    }

    const pool = await connectDB();

    // ----------------------------------------------
    // USER DETAILS
    // ----------------------------------------------

    const userResult = await pool
      .request()
      .input("UserId", sql.Int, userId)
      .query(`
        SELECT
          Id,
          Name,
          Email,
          Mobile,
          CreatedAt
        FROM dbo.Users
        WHERE Id = @UserId
      `);

    if (userResult.recordset.length === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const user = userResult.recordset[0];

    // ----------------------------------------------
    // USER ORDER SUMMARY
    // ----------------------------------------------

    const orderResult = await pool
      .request()
      .input("UserId", sql.Int, userId)
      .query(`
        SELECT
          COUNT(CASE WHEN Paid = 1 THEN 1 END) AS PaidOrders,
          ISNULL(
            SUM(
              CASE
                WHEN Paid = 1 THEN Price
                ELSE 0
              END
            ),
            0
          ) AS TotalSpent
        FROM dbo.Orders
        WHERE UserId = @UserId
      `);

    const orderStats = orderResult.recordset[0];

    return res.json({
      success: true,

      user: {
        id: user.Id,
        name: user.Name,
        email: user.Email,
        mobile: user.Mobile,
        createdAt: user.CreatedAt,

        paidOrders:
          Number(orderStats?.PaidOrders) || 0,

        totalSpent:
          Number(orderStats?.TotalSpent) || 0,
      },
    });
  } catch (error) {
    console.error("Admin user details error:", error);

    return res.status(500).json({
      success: false,
      message: "Unable to load user details",
    });
  }
});

module.exports = router;