import { useEffect, useState, useCallback } from "react";
import { useOutletContext } from "react-router-dom";
import { RefreshCw, ShoppingBag, Search } from "lucide-react";
import "./AdminLayout.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000";

export default function AdminOrders() {
  const { adminKey } = useOutletContext();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [status, setStatus] = useState("all");
  const [search, setSearch] = useState("");

  function formatMoney(value) {
    return new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
    }).format(Number(value) || 0);
  }

  function formatDate(value) {
    if (!value) return "—";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "—";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const loadOrders = useCallback(
    async function loadOrders() {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        if (status !== "all") params.set("status", status);
        if (search.trim()) params.set("search", search.trim());

        const response = await fetch(
          `${API_BASE}/api/admin/orders?${params.toString()}`,
          {
            headers: { "x-admin-key": adminKey },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Failed to load orders");
        }

        setOrders(Array.isArray(data.orders) ? data.orders : []);
      } catch (err) {
        console.error("Orders load error:", err);
        setError(err.message || "Orders load nahi ho paye.");
      } finally {
        setLoading(false);
      }
    },
    [adminKey, status, search]
  );

  useEffect(() => {
    if (adminKey) loadOrders();
  }, [adminKey, loadOrders]);

  return (
    <div className="admin-dashboard">
      <section className="admin-dashboard-welcome">
        <div>
          <span className="admin-dashboard-eyebrow">SALES</span>
          <h2>Orders</h2>
          <p>All purchases made on Disha The Academy.</p>
        </div>

        <button
          type="button"
          className="admin-dashboard-site-button"
          onClick={loadOrders}
          disabled={loading}
          style={{ cursor: "pointer" }}
        >
          <RefreshCw size={15} className={loading ? "admin-refresh-spin" : ""} />
          Refresh
        </button>
      </section>

      {error && (
        <div className="admin-dashboard-error">
          <div>
            <strong>Orders load nahi hue</strong>
            <span>{error}</span>
          </div>
          <button type="button" onClick={loadOrders}>
            Try Again
          </button>
        </div>
      )}

      <div
        className="admin-panel"
        style={{ padding: "16px 20px", marginBottom: 16 }}
      >
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ position: "relative", flex: 1, minWidth: 220 }}>
            <Search
              size={15}
              style={{
                position: "absolute",
                left: 10,
                top: "50%",
                transform: "translateY(-50%)",
                opacity: 0.5,
              }}
            />
            <input
              type="text"
              placeholder="Search by name, email, note, order ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "8px 10px 8px 32px",
                borderRadius: 8,
                border: "1px solid #e2e8f0",
                fontSize: 13,
                boxSizing: "border-box",
              }}
            />
          </div>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{
              padding: "8px 10px",
              borderRadius: 8,
              border: "1px solid #e2e8f0",
              fontSize: 13,
            }}
          >
            <option value="all">All Orders</option>
            <option value="paid">Paid Only</option>
            <option value="unpaid">Unpaid / Pending</option>
          </select>
        </div>
      </div>

      <div className="admin-panel">
        <div className="admin-panel-header">
          <div>
            <h3>All Orders</h3>
            <p>{orders.length} result{orders.length === 1 ? "" : "s"}</p>
          </div>
        </div>

        {loading ? (
          <div className="admin-empty-state">
            <RefreshCw size={24} className="admin-refresh-spin" />
            <strong style={{ marginTop: "10px" }}>Loading orders...</strong>
          </div>
        ) : orders.length === 0 ? (
          <div className="admin-empty-state">
            <div className="admin-empty-icon">
              <ShoppingBag size={25} />
            </div>
            <strong>No orders found</strong>
            <p>Try changing the search or filter above.</p>
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
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => (
                  <tr key={order.id || order.orderId}>
                    <td>
                      <div className="admin-order-user">
                        <div className="admin-order-avatar">
                          {(order.userName || "U").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{order.userName || "Unknown User"}</strong>
                          <span>{order.userEmail || "—"}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <strong className="admin-order-title">
                        {order.title || "Note"}
                      </strong>
                    </td>

                    <td>
                      <strong>₹{formatMoney(order.price)}</strong>
                    </td>

                    <td style={{ fontSize: 11, color: "#6b7280" }}>
                      {order.orderId || "—"}
                    </td>

                    <td>{formatDate(order.verifiedAt || order.createdAt)}</td>

                    <td>
                      {order.paid ? (
                        <span className="admin-paid-badge">Paid</span>
                      ) : (
                        <span
                          className="admin-paid-badge"
                          style={{
                            color: "#b45309",
                            background: "#fffbeb",
                            border: "1px solid #fde68a",
                          }}
                        >
                          Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}