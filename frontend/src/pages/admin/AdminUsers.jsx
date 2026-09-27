import { useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Search,
  Users,
  User,
  Mail,
  Phone,
  CalendarDays,
  ShoppingBag,
  IndianRupee,
  X,
} from "lucide-react";
import "./AdminUsers.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  "https://disha-the-academy.onrender.com";

export default function AdminUsers() {
  const { adminKey } = useOutletContext();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const [selectedUser, setSelectedUser] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  async function loadUsers(searchValue = "") {
    try {
      setLoading(true);
      setMessage("");

      const query = searchValue.trim()
        ? `?search=${encodeURIComponent(searchValue.trim())}`
        : "";

      const response = await fetch(
        `${API_BASE}/api/admin/users${query}`,
        {
          headers: {
            "x-admin-key": adminKey,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to load users");
      }

      setUsers(Array.isArray(data.users) ? data.users : []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (adminKey) {
      loadUsers();
    }
  }, [adminKey]);

  async function handleSearch(event) {
    event.preventDefault();
    await loadUsers(search);
  }

  async function viewUser(userId) {
    try {
      setDetailsLoading(true);
      setMessage("");

      const response = await fetch(
        `${API_BASE}/api/admin/users/${userId}`,
        {
          headers: {
            "x-admin-key": adminKey,
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Unable to load user details"
        );
      }

      setSelectedUser(data.user);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setDetailsLoading(false);
    }
  }

  function formatDate(value) {
    if (!value) return "—";

    return new Date(value).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  return (
    <div className="admin-users-page">
      <div className="admin-users-header">
        <div>
          <span className="admin-users-label">
            USERS & SALES
          </span>

          <h1>Users Management</h1>

          <p>
            View registered users and their purchase summary.
          </p>
        </div>

        <div className="admin-users-total">
          <Users size={22} />

          <div>
            <strong>{users.length}</strong>
            <span>Users</span>
          </div>
        </div>
      </div>

      <form
        className="admin-users-search"
        onSubmit={handleSearch}
      >
        <Search size={19} />

        <input
          type="text"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          placeholder="Search name, email or mobile..."
        />

        <button type="submit">
          Search
        </button>

        {search && (
          <button
            type="button"
            className="admin-users-clear"
            onClick={() => {
              setSearch("");
              loadUsers("");
            }}
          >
            Clear
          </button>
        )}
      </form>

      {message && (
        <div className="admin-users-message">
          {message}
        </div>
      )}

      <div className="admin-users-table-card">
        {loading ? (
          <div className="admin-users-empty">
            Loading users...
          </div>
        ) : users.length === 0 ? (
          <div className="admin-users-empty">
            No users found.
          </div>
        ) : (
          <div className="admin-users-table-wrap">
            <table className="admin-users-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Mobile</th>
                  <th>Joined</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <div className="admin-user-name">
                        <div className="admin-user-avatar">
                          {String(
                            user.name || "U"
                          )
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div>
                          <strong>
                            {user.name || "User"}
                          </strong>
                          <span>ID #{user.id}</span>
                        </div>
                      </div>
                    </td>

                    <td>{user.email || "—"}</td>

                    <td>{user.mobile || "—"}</td>

                    <td>
                      {formatDate(user.createdAt)}
                    </td>

                    <td>
                      <button
                        type="button"
                        className="admin-user-view"
                        onClick={() =>
                          viewUser(user.id)
                        }
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {(selectedUser || detailsLoading) && (
        <div
          className="admin-user-modal-backdrop"
          onClick={() => {
            if (!detailsLoading) {
              setSelectedUser(null);
            }
          }}
        >
          <div
            className="admin-user-modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >
            <button
              type="button"
              className="admin-user-modal-close"
              onClick={() =>
                setSelectedUser(null)
              }
            >
              <X size={20} />
            </button>

            {detailsLoading ? (
              <div className="admin-user-modal-loading">
                Loading user details...
              </div>
            ) : (
              selectedUser && (
                <>
                  <div className="admin-user-modal-head">
                    <div className="admin-user-modal-avatar">
                      {String(
                        selectedUser.name || "U"
                      )
                        .charAt(0)
                        .toUpperCase()}
                    </div>

                    <div>
                      <span>REGISTERED USER</span>
                      <h2>
                        {selectedUser.name}
                      </h2>
                      <p>
                        User ID #{selectedUser.id}
                      </p>
                    </div>
                  </div>

                  <div className="admin-user-info-list">
                    <div>
                      <Mail size={18} />
                      <span>
                        <small>Email</small>
                        <strong>
                          {selectedUser.email || "—"}
                        </strong>
                      </span>
                    </div>

                    <div>
                      <Phone size={18} />
                      <span>
                        <small>Mobile</small>
                        <strong>
                          {selectedUser.mobile || "—"}
                        </strong>
                      </span>
                    </div>

                    <div>
                      <CalendarDays size={18} />
                      <span>
                        <small>Joined</small>
                        <strong>
                          {formatDate(
                            selectedUser.createdAt
                          )}
                        </strong>
                      </span>
                    </div>
                  </div>

                  <div className="admin-user-stats">
                    <div>
                      <ShoppingBag size={20} />

                      <span>
                        <strong>
                          {selectedUser.paidOrders}
                        </strong>
                        <small>Paid Orders</small>
                      </span>
                    </div>

                    <div>
                      <IndianRupee size={20} />

                      <span>
                        <strong>
                          ₹
                          {Number(
                            selectedUser.totalSpent || 0
                          ).toLocaleString("en-IN")}
                        </strong>
                        <small>Total Spent</small>
                      </span>
                    </div>
                  </div>
                </>
              )
            )}
          </div>
        </div>
      )}
    </div>
  );
}