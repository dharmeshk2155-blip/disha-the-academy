import { useEffect, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import {
  RefreshCw,
  ShoppingBag,
  Search,
  IndianRupee,
  CircleCheckBig,
  Clock3,
  Eye,
  X,
  User,
  Mail,
  FileText,
  CreditCard,
  CalendarDays,
  Hash,
} from "lucide-react";

import "./AdminLayout.css";
import "./AdminOrders.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://disha-the-academy.onrender.com";

const EMPTY_SUMMARY = {
  totalOrders: 0,
  paidOrders: 0,
  pendingOrders: 0,
  totalRevenue: 0,
};

export default function AdminOrders() {
  const { adminToken } = useOutletContext();

  const [orders, setOrders] = useState([]);
  const [summary, setSummary] = useState(EMPTY_SUMMARY);

  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(true);
  const [error, setError] = useState("");

  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  const [selectedOrder, setSelectedOrder] = useState(null);

  function formatMoney(value) {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  }

  function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  function formatDateTime(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  /* =====================================================
     LOAD ORDER SUMMARY
  ===================================================== */

  const loadSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);

      const response = await fetch(
        `${API_BASE}/api/admin/orders-summary`,
        {
          headers: {
            Authorization: `Bearer ${adminToken}`,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load order summary"
        );
      }

      setSummary({
        totalOrders:
          Number(data.summary?.totalOrders) || 0,

        paidOrders:
          Number(data.summary?.paidOrders) || 0,

        pendingOrders:
          Number(data.summary?.pendingOrders) || 0,

        totalRevenue:
          Number(data.summary?.totalRevenue) || 0,
      });
    } catch (err) {
      console.error("Order summary error:", err);
    } finally {
      setSummaryLoading(false);
    }
  }, [adminToken]);

  /* =====================================================
     LOAD ORDERS
  ===================================================== */

  const loadOrders = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();

      if (status !== "all") {
        params.set("status", status);
      }

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const query = params.toString();

      const url = query
        ? `${API_BASE}/api/admin/orders?${query}`
        : `${API_BASE}/api/admin/orders`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${adminToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load orders"
        );
      }

      setOrders(
        Array.isArray(data.orders)
          ? data.orders
          : []
      );
    } catch (err) {
      console.error("Orders load error:", err);

      setError(
        err.message || "Unable to load orders."
      );
    } finally {
      setLoading(false);
    }
  }, [adminToken, status, search]);

  useEffect(() => {
    if (!adminToken) return;

    loadOrders();
    loadSummary();
  }, [adminToken, loadOrders, loadSummary]);

  function refreshEverything() {
    loadOrders();
    loadSummary();
  }

  return (
    <div className="admin-dashboard admin-orders-page">

      {/* =============================================
          HEADER
      ============================================= */}

      <section className="admin-dashboard-welcome">
        <div>
          <span className="admin-dashboard-eyebrow">
            USERS & SALES
          </span>

          <h2>Orders Management</h2>

          <p>
            Track purchases, payments and revenue on
            Disha The Academy.
          </p>
        </div>

        <button
          type="button"
          className="admin-dashboard-site-button"
          onClick={refreshEverything}
          disabled={loading || summaryLoading}
        >
          <RefreshCw
            size={15}
            className={
              loading || summaryLoading
                ? "admin-refresh-spin"
                : ""
            }
          />

          Refresh
        </button>
      </section>

      {/* =============================================
          SUMMARY CARDS
      ============================================= */}

      <section className="admin-order-summary-grid">

        <article className="admin-order-summary-card">
          <div className="admin-order-summary-icon">
            <ShoppingBag size={21} />
          </div>

          <div>
            <span>Total Orders</span>

            <strong>
              {summaryLoading
                ? "..."
                : summary.totalOrders}
            </strong>

            <small>All purchase attempts</small>
          </div>
        </article>

        <article className="admin-order-summary-card">
          <div className="admin-order-summary-icon">
            <CircleCheckBig size={21} />
          </div>

          <div>
            <span>Paid Orders</span>

            <strong>
              {summaryLoading
                ? "..."
                : summary.paidOrders}
            </strong>

            <small>Successfully paid</small>
          </div>
        </article>

        <article className="admin-order-summary-card">
          <div className="admin-order-summary-icon">
            <Clock3 size={21} />
          </div>

          <div>
            <span>Pending Orders</span>

            <strong>
              {summaryLoading
                ? "..."
                : summary.pendingOrders}
            </strong>

            <small>Payment not completed</small>
          </div>
        </article>

        <article className="admin-order-summary-card admin-order-revenue-card">
          <div className="admin-order-summary-icon">
            <IndianRupee size={21} />
          </div>

          <div>
            <span>Total Revenue</span>

            <strong>
              {summaryLoading
                ? "..."
                : `₹${formatMoney(
                    summary.totalRevenue
                  )}`}
            </strong>

            <small>Paid orders only</small>
          </div>
        </article>

      </section>

      {/* =============================================
          ERROR
      ============================================= */}

      {error && (
        <div className="admin-dashboard-error">
          <div>
            <strong>Orders could not be loaded</strong>
            <span>{error}</span>
          </div>

          <button
            type="button"
            onClick={refreshEverything}
          >
            Try Again
          </button>
        </div>
      )}

      {/* =============================================
          SEARCH + FILTER
      ============================================= */}

      <section className="admin-order-tools">

        <div className="admin-order-search">
          <Search size={17} />

          <input
            type="text"
            placeholder="Search name, email, note or order ID..."
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              className="admin-order-search-clear"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <div className="admin-order-filter-buttons">

          <button
            type="button"
            className={
              status === "all"
                ? "active"
                : ""
            }
            onClick={() => setStatus("all")}
          >
            All
          </button>

          <button
            type="button"
            className={
              status === "paid"
                ? "active"
                : ""
            }
            onClick={() => setStatus("paid")}
          >
            Paid
          </button>

          <button
            type="button"
            className={
              status === "unpaid"
                ? "active"
                : ""
            }
            onClick={() => setStatus("unpaid")}
          >
            Pending
          </button>

        </div>

      </section>

      {/* =============================================
          ORDERS TABLE
      ============================================= */}

      <section className="admin-panel">

        <div className="admin-panel-header">
          <div>
            <h3>
              {status === "paid"
                ? "Paid Orders"
                : status === "unpaid"
                ? "Pending Orders"
                : "All Orders"}
            </h3>

            <p>
              {orders.length} result
              {orders.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="admin-empty-state">

            <RefreshCw
              size={24}
              className="admin-refresh-spin"
            />

            <strong style={{ marginTop: 10 }}>
              Loading orders...
            </strong>

          </div>
        ) : orders.length === 0 ? (
          <div className="admin-empty-state">

            <div className="admin-empty-icon">
              <ShoppingBag size={25} />
            </div>

            <strong>No orders found</strong>

            <p>
              Try changing your search or filter.
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
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {orders.map((order) => (
                  <tr
                    key={
                      order.id ||
                      order.orderId
                    }
                  >

                    <td>
                      <div className="admin-order-user">

                        <div className="admin-order-avatar">
                          {(order.userName || "U")
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {order.userName ||
                              "Unknown User"}
                          </strong>

                          <span>
                            {order.userEmail || "—"}
                          </span>
                        </div>

                      </div>
                    </td>

                    <td>
                      <strong className="admin-order-title">
                        {order.title || "Note"}
                      </strong>
                    </td>

                    <td>
                      <strong>
                        ₹{formatMoney(order.price)}
                      </strong>
                    </td>

                    <td>
                      <span className="admin-order-id">
                        {order.orderId || "—"}
                      </span>
                    </td>

                    <td>
                      {formatDate(
                        order.verifiedAt ||
                          order.createdAt
                      )}
                    </td>

                    <td>
                      {order.paid ? (
                        <span className="admin-order-status paid">
                          Paid
                        </span>
                      ) : (
                        <span className="admin-order-status pending">
                          Pending
                        </span>
                      )}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="admin-order-view-button"
                        onClick={() =>
                          setSelectedOrder(order)
                        }
                      >
                        <Eye size={15} />
                        View
                      </button>
                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>
        )}

      </section>

      {/* =============================================
          ORDER DETAILS MODAL
      ============================================= */}

      {selectedOrder && (
        <div
          className="admin-order-modal-backdrop"
          onClick={() =>
            setSelectedOrder(null)
          }
        >

          <div
            className="admin-order-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <button
              type="button"
              className="admin-order-modal-close"
              onClick={() =>
                setSelectedOrder(null)
              }
            >
              <X size={20} />
            </button>

            <div className="admin-order-modal-heading">

              <div className="admin-order-modal-icon">
                <ShoppingBag size={24} />
              </div>

              <div>
                <span>ORDER DETAILS</span>

                <h2>
                  {selectedOrder.title ||
                    "Order"}
                </h2>

                <p>
                  {selectedOrder.paid
                    ? "Payment completed"
                    : "Payment pending"}
                </p>
              </div>

            </div>

            <div className="admin-order-detail-grid">

              <OrderDetail
                icon={<User size={17} />}
                label="Customer"
                value={
                  selectedOrder.userName ||
                  "Unknown User"
                }
              />

              <OrderDetail
                icon={<Mail size={17} />}
                label="Email"
                value={
                  selectedOrder.userEmail ||
                  "—"
                }
              />

              <OrderDetail
                icon={<FileText size={17} />}
                label="Purchased Note"
                value={
                  selectedOrder.title ||
                  "—"
                }
              />

              <OrderDetail
                icon={<IndianRupee size={17} />}
                label="Amount"
                value={`₹${formatMoney(
                  selectedOrder.price
                )}`}
              />

              <OrderDetail
                icon={<Hash size={17} />}
                label="Order ID"
                value={
                  selectedOrder.orderId ||
                  "—"
                }
              />

              <OrderDetail
                icon={<CreditCard size={17} />}
                label="Payment ID"
                value={
                  selectedOrder.paymentId ||
                  (selectedOrder.paid
                    ? "—"
                    : "Not paid")
                }
              />

              <OrderDetail
                icon={<CalendarDays size={17} />}
                label="Created"
                value={formatDateTime(
                  selectedOrder.createdAt
                )}
              />

              <OrderDetail
                icon={<CircleCheckBig size={17} />}
                label="Status"
                value={
                  selectedOrder.paid
                    ? "Paid"
                    : "Pending"
                }
              />

            </div>

            {selectedOrder.verifiedAt && (
              <div className="admin-order-verified">

                <CircleCheckBig size={17} />

                <div>
                  <small>
                    PAYMENT VERIFIED
                  </small>

                  <strong>
                    {formatDateTime(
                      selectedOrder.verifiedAt
                    )}
                  </strong>
                </div>

              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}

function OrderDetail({
  icon,
  label,
  value,
}) {
  return (
    <div className="admin-order-detail-item">

      <div className="admin-order-detail-icon">
        {icon}
      </div>

      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>

    </div>
  );
}