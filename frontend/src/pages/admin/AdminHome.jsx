import { useEffect, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";

import {
  Users,
  BookOpen,
  ClipboardList,
  ShoppingBag,
  IndianRupee,
  Plus,
  Newspaper,
  PenLine,
  ArrowRight,
  TrendingUp,
  CircleCheck,
  Clock3,
  RefreshCw,
  AlertCircle,
} from "lucide-react";

import "./AdminLayout.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "http://localhost:5000";

export default function AdminHome() {
  const { adminKey } = useOutletContext();

  const [stats, setStats] = useState({
    totalUsers: 0,
    totalNotes: 0,
    totalTests: 0,
    paidOrders: 0,
    totalRevenue: 0,
  });

  const [recentOrders, setRecentOrders] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =====================================================
     LOAD DASHBOARD DATA
  ===================================================== */

  async function loadDashboard() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${API_BASE}/api/admin/dashboard`,
        {
          method: "GET",

          headers: {
            "x-admin-key": adminKey,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
            "Failed to load dashboard"
        );
      }

      setStats({
        totalUsers:
          Number(data.stats?.totalUsers) || 0,

        totalNotes:
          Number(data.stats?.totalNotes) || 0,

        totalTests:
          Number(data.stats?.totalTests) || 0,

        paidOrders:
          Number(data.stats?.paidOrders) || 0,

        totalRevenue:
          Number(data.stats?.totalRevenue) || 0,
      });

      setRecentOrders(
        Array.isArray(data.recentOrders)
          ? data.recentOrders
          : []
      );
    } catch (err) {
      console.error(
        "Dashboard load error:",
        err
      );

      setError(
        err.message ||
          "Dashboard data load nahi ho paya."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (adminKey) {
      loadDashboard();
    }
  }, [adminKey]);

  /* =====================================================
     HELPERS
  ===================================================== */

  function formatMoney(value) {
    return new Intl.NumberFormat(
      "en-IN",
      {
        maximumFractionDigits: 0,
      }
    ).format(Number(value) || 0);
  }

  function formatDate(value) {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  /* =====================================================
     UI
  ===================================================== */

  return (
    <div className="admin-dashboard">

      {/* =====================================
          WELCOME
      ====================================== */}

      <section className="admin-dashboard-welcome">

        <div>
          <span className="admin-dashboard-eyebrow">
            OVERVIEW
          </span>

          <h2>
            Welcome back, Admin
          </h2>

          <p>
            Manage Disha The Academy from
            one place.
          </p>
        </div>


        <div
          style={{
            display: "flex",
            gap: "8px",
          }}
        >

          <button
            type="button"
            className="admin-dashboard-site-button"
            onClick={loadDashboard}
            disabled={loading}
            style={{
              cursor: "pointer",
            }}
          >
            <RefreshCw
              size={15}
              className={
                loading
                  ? "admin-refresh-spin"
                  : ""
              }
            />

            Refresh
          </button>


          <Link
            to="/"
            target="_blank"
            className="admin-dashboard-site-button"
          >
            View Website

            <ArrowRight size={16} />
          </Link>

        </div>

      </section>


      {/* =====================================
          ERROR
      ====================================== */}

      {error && (
        <div className="admin-dashboard-error">

          <AlertCircle size={18} />

          <div>
            <strong>
              Dashboard data load nahi hua
            </strong>

            <span>
              {error}
            </span>
          </div>

          <button
            type="button"
            onClick={loadDashboard}
          >
            Try Again
          </button>

        </div>
      )}


      {/* =====================================
          STAT CARDS
      ====================================== */}

      <section className="admin-stats-grid">

        {/* USERS */}

        <div className="admin-stat-card">

          <div className="admin-stat-top">

            <div className="admin-stat-icon">
              <Users size={21} />
            </div>

            <span className="admin-stat-badge">
              <TrendingUp size={12} />
              Users
            </span>

          </div>

          <div className="admin-stat-content">

            <span>
              Total Users
            </span>

            <strong>
              {loading
                ? "—"
                : stats.totalUsers}
            </strong>

            <small>
              Registered accounts
            </small>

          </div>

        </div>


        {/* NOTES */}

        <div className="admin-stat-card">

          <div className="admin-stat-top">

            <div className="admin-stat-icon">
              <BookOpen size={21} />
            </div>

            <span className="admin-stat-badge">
              Content
            </span>

          </div>

          <div className="admin-stat-content">

            <span>
              Total Notes
            </span>

            <strong>
              {loading
                ? "—"
                : stats.totalNotes}
            </strong>

            <small>
              Published study notes
            </small>

          </div>

        </div>


        {/* TESTS */}

        <div className="admin-stat-card">

          <div className="admin-stat-top">

            <div className="admin-stat-icon">
              <ClipboardList size={21} />
            </div>

            <span className="admin-stat-badge">
              Exams
            </span>

          </div>

          <div className="admin-stat-content">

            <span>
              Mock Tests
            </span>

            <strong>
              {loading
                ? "—"
                : stats.totalTests}
            </strong>

            <small>
              Available tests
            </small>

          </div>

        </div>


        {/* ORDERS */}

        <div className="admin-stat-card">

          <div className="admin-stat-top">

            <div className="admin-stat-icon">
              <ShoppingBag size={21} />
            </div>

            <span className="admin-stat-badge">
              Sales
            </span>

          </div>

          <div className="admin-stat-content">

            <span>
              Paid Orders
            </span>

            <strong>
              {loading
                ? "—"
                : stats.paidOrders}
            </strong>

            <small>
              Successful purchases
            </small>

          </div>

        </div>


        {/* REVENUE */}

        <div className="admin-stat-card admin-stat-revenue">

          <div className="admin-stat-top">

            <div className="admin-stat-icon">
              <IndianRupee size={21} />
            </div>

            <span className="admin-stat-badge">
              Revenue
            </span>

          </div>

          <div className="admin-stat-content">

            <span>
              Total Revenue
            </span>

            <strong>
              {loading
                ? "₹—"
                : `₹${formatMoney(
                    stats.totalRevenue
                  )}`}
            </strong>

            <small>
              From paid orders
            </small>

          </div>

        </div>

      </section>


      {/* =====================================
          DASHBOARD BODY
      ====================================== */}

      <section className="admin-dashboard-grid">

        {/* RECENT ORDERS */}

        <div className="admin-panel admin-recent-orders">

          <div className="admin-panel-header">

            <div>
              <h3>
                Recent Orders
              </h3>

              <p>
                Latest purchases from students
              </p>
            </div>

            <Link to="/admin/orders">
              View all

              <ArrowRight size={14} />
            </Link>

          </div>


          {loading ? (

            <div className="admin-empty-state">

              <RefreshCw
                size={24}
                className="admin-refresh-spin"
              />

              <strong
                style={{
                  marginTop: "10px",
                }}
              >
                Loading orders...
              </strong>

            </div>

          ) : recentOrders.length === 0 ? (

            <div className="admin-empty-state">

              <div className="admin-empty-icon">
                <ShoppingBag size={25} />
              </div>

              <strong>
                No paid orders yet
              </strong>

              <p>
                Student purchases will appear
                here after successful payment.
              </p>

            </div>

          ) : (

            <div className="admin-orders-table-wrap">

              <table className="admin-orders-table">

                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Note</th>
                    <th>Amount</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>

                  {recentOrders.map(
                    (order) => (

                      <tr
                        key={
                          order.id ||
                          order.orderId
                        }
                      >

                        <td>

                          <div className="admin-order-user">

                            <div className="admin-order-avatar">
                              {(
                                order.userName ||
                                "U"
                              )
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {order.userName ||
                                  "Unknown User"}
                              </strong>

                              <span>
                                {order.userEmail ||
                                  "—"}
                              </span>
                            </div>

                          </div>

                        </td>


                        <td>
                          <strong className="admin-order-title">
                            {order.title ||
                              "Note"}
                          </strong>
                        </td>


                        <td>
                          <strong>
                            ₹
                            {formatMoney(
                              order.price
                            )}
                          </strong>
                        </td>


                        <td>
                          {formatDate(
                            order.verifiedAt ||
                              order.createdAt
                          )}
                        </td>


                        <td>
                          <span className="admin-paid-badge">
                            Paid
                          </span>
                        </td>

                      </tr>

                    )
                  )}

                </tbody>

              </table>

            </div>

          )}

        </div>


        {/* QUICK ACTIONS */}

        <div className="admin-panel admin-quick-panel">

          <div className="admin-panel-header">

            <div>
              <h3>
                Quick Actions
              </h3>

              <p>
                Frequently used controls
              </p>
            </div>

          </div>


          <div className="admin-quick-actions">

            <Link
              to="/admin/notes"
              className="admin-quick-action"
            >

              <span className="admin-quick-icon">
                <Plus size={18} />
              </span>

              <span>
                <strong>
                  Add Note
                </strong>

                <small>
                  Upload study material
                </small>
              </span>

              <ArrowRight size={16} />

            </Link>


            <Link
              to="/admin/tests"
              className="admin-quick-action"
            >

              <span className="admin-quick-icon">
                <ClipboardList size={18} />
              </span>

              <span>
                <strong>
                  Create Test
                </strong>

                <small>
                  Add mock test
                </small>
              </span>

              <ArrowRight size={16} />

            </Link>


            <Link
              to="/admin/current-affairs"
              className="admin-quick-action"
            >

              <span className="admin-quick-icon">
                <Newspaper size={18} />
              </span>

              <span>
                <strong>
                  Current Affairs
                </strong>

                <small>
                  Publish new update
                </small>
              </span>

              <ArrowRight size={16} />

            </Link>


            <Link
              to="/admin/blog"
              className="admin-quick-action"
            >

              <span className="admin-quick-icon">
                <PenLine size={18} />
              </span>

              <span>
                <strong>
                  Write Blog
                </strong>

                <small>
                  Create new article
                </small>
              </span>

              <ArrowRight size={16} />

            </Link>

          </div>

        </div>

      </section>


      {/* =====================================
          BOTTOM SECTION
      ====================================== */}

      <section className="admin-bottom-grid">

        {/* CONTENT MANAGEMENT */}

        <div className="admin-panel">

          <div className="admin-panel-header">

            <div>
              <h3>
                Content Management
              </h3>

              <p>
                Manage your learning platform
              </p>
            </div>

          </div>


          <div className="admin-content-links">

            <Link to="/admin/notes">

              <div className="admin-content-link-icon">
                <BookOpen size={19} />
              </div>

              <div>
                <strong>
                  Notes
                </strong>

                <small>
                  Study material & PDFs
                </small>
              </div>

              <ArrowRight size={16} />

            </Link>


            <Link to="/admin/tests">

              <div className="admin-content-link-icon">
                <ClipboardList size={19} />
              </div>

              <div>
                <strong>
                  Mock Tests
                </strong>

                <small>
                  Tests & questions
                </small>
              </div>

              <ArrowRight size={16} />

            </Link>


            <Link to="/admin/current-affairs">

              <div className="admin-content-link-icon">
                <Newspaper size={19} />
              </div>

              <div>
                <strong>
                  Current Affairs
                </strong>

                <small>
                  Daily exam updates
                </small>
              </div>

              <ArrowRight size={16} />

            </Link>

          </div>

        </div>


        {/* SYSTEM STATUS */}

        <div className="admin-panel">

          <div className="admin-panel-header">

            <div>
              <h3>
                System Status
              </h3>

              <p>
                Platform overview
              </p>
            </div>

          </div>


          <div className="admin-system-list">

            <div>
              <span>
                <CircleCheck size={17} />
                Website
              </span>

              <strong className="admin-system-online">
                Online
              </strong>
            </div>


            <div>
              <span>
                <CircleCheck size={17} />
                Admin Panel
              </span>

              <strong className="admin-system-online">
                Active
              </strong>
            </div>


            <div>
              <span>
                {error ? (
                  <AlertCircle size={17} />
                ) : (
                  <CircleCheck size={17} />
                )}

                Dashboard Data
              </span>

              <strong
                className={
                  error
                    ? "admin-system-pending"
                    : "admin-system-online"
                }
              >
                {loading
                  ? "Loading"
                  : error
                  ? "Error"
                  : "Connected"}
              </strong>
            </div>

          </div>

        </div>

      </section>

    </div>
  );
}