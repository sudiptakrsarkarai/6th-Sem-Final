// ========== CONFIG ==========
const API_BASE = 'https://goload-backend.onrender.com/api';
let authToken = localStorage.getItem('admin_token');
let currentPage = 'overview';

// ========== API HELPERS ==========
async function apiGet(url) {
  const res = await fetch(`${API_BASE}${url}`, {
    headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' }
  });
  return res.json();
}

async function apiPost(url, body) {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function apiPut(url, body) {
  const res = await fetch(`${API_BASE}${url}`, {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

// ========== AUTH ==========
function checkAuth() {
  if (authToken) {
    document.getElementById('loginScreen').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    loadPage('overview');
  }
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  const errEl = document.getElementById('loginError');
  
  try {
    const data = await apiPost('/admin/login', { email, password });
    if (data.success) {
      authToken = data.data.token;
      localStorage.setItem('admin_token', authToken);
      document.getElementById('adminName').textContent = data.data.admin.name;
      document.getElementById('loginScreen').classList.add('hidden');
      document.getElementById('dashboard').classList.remove('hidden');
      loadPage('overview');
    } else {
      errEl.textContent = data.message || 'Login failed';
    }
  } catch {
    errEl.textContent = 'Connection error';
  }
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  authToken = null;
  localStorage.removeItem('admin_token');
  document.getElementById('dashboard').classList.add('hidden');
  document.getElementById('loginScreen').classList.remove('hidden');
});

// Sidebar nav
document.querySelectorAll('.nav-item').forEach(item => {
  item.addEventListener('click', (e) => {
    e.preventDefault();
    const page = item.dataset.page;
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    item.classList.add('active');
    loadPage(page);
    // Close mobile sidebar
    document.querySelector('.sidebar').classList.remove('open');
  });
});

// Mobile menu toggle
document.getElementById('menuToggle').addEventListener('click', () => {
  document.querySelector('.sidebar').classList.toggle('open');
});

// ========== PAGE LOADER ==========
function loadPage(page) {
  currentPage = page;
  const titles = { overview: 'Dashboard', orders: 'Orders', drivers: 'Drivers', users: 'Customers', pricing: 'Pricing Math', settings: 'Settings' };
  document.getElementById('pageTitle').textContent = titles[page] || 'Dashboard';

  switch(page) {
    case 'overview': loadDashboard(); break;
    case 'orders': loadOrders(); break;
    case 'drivers': loadDrivers(); break;
    case 'users': loadUsers(); break;
    case 'pricing': loadPricing(); break;
    case 'settings': loadSettings(); break;
  }
}

// ========== DASHBOARD ==========
async function loadDashboard() {
  const content = document.getElementById('contentArea');
  content.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i><p>Loading...</p></div>';
  
  try {
    const data = await apiGet('/admin/dashboard');
    if (!data.success) { content.innerHTML = '<p>Failed to load</p>'; return; }
    
    const s = data.data.stats;
    const recent = data.data.recentOrders || [];

    content.innerHTML = `
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-card-header">
            <div class="stat-icon orange"><i class="fas fa-boxes-stacked"></i></div>
          </div>
          <div class="stat-value">${s.totalOrders}</div>
          <div class="stat-label">Total Orders</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header">
            <div class="stat-icon green"><i class="fas fa-indian-rupee-sign"></i></div>
          </div>
          <div class="stat-value">₹${(s.totalRevenue || 0).toLocaleString('en-IN')}</div>
          <div class="stat-label">Total Revenue</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header">
            <div class="stat-icon blue"><i class="fas fa-users"></i></div>
          </div>
          <div class="stat-value">${s.totalUsers}</div>
          <div class="stat-label">Customers</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header">
            <div class="stat-icon yellow"><i class="fas fa-id-card"></i></div>
          </div>
          <div class="stat-value">${s.totalDrivers}</div>
          <div class="stat-label">Drivers</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header">
            <div class="stat-icon orange"><i class="fas fa-spinner"></i></div>
          </div>
          <div class="stat-value">${s.activeOrders}</div>
          <div class="stat-label">Active Orders</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header">
            <div class="stat-icon green"><i class="fas fa-check-circle"></i></div>
          </div>
          <div class="stat-value">${s.completedOrders}</div>
          <div class="stat-label">Completed</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header">
            <div class="stat-icon red"><i class="fas fa-times-circle"></i></div>
          </div>
          <div class="stat-value">${s.cancelledOrders}</div>
          <div class="stat-label">Cancelled</div>
        </div>
        <div class="stat-card">
          <div class="stat-card-header">
            <div class="stat-icon blue"><i class="fas fa-rupee-sign"></i></div>
          </div>
          <div class="stat-value">₹${(s.todayRevenue || 0).toLocaleString('en-IN')}</div>
          <div class="stat-label">Today's Revenue</div>
        </div>
      </div>

      <div class="section-card">
        <div class="section-header">
          <h2>Recent Orders</h2>
          <button class="btn-refresh" onclick="loadDashboard()"><i class="fas fa-sync-alt"></i></button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Driver</th>
              <th>Vehicle</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${recent.map(o => `
              <tr>
                <td><strong>${o.orderNumber || '-'}</strong></td>
                <td>${o.customer?.name || '-'}</td>
                <td>${o.driver?.name || '<span style="color:var(--text-muted)">Unassigned</span>'}</td>
                <td>${o.vehicleType?.name || '-'}</td>
                <td><strong>₹${o.pricing?.totalAmount || 0}</strong></td>
                <td><span class="badge badge-${o.status}">${formatStatus(o.status)}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${recent.length === 0 ? '<div class="empty-state"><i class="fas fa-inbox"></i><p>No orders yet</p></div>' : ''}
      </div>
    `;
  } catch (err) {
    content.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Error loading dashboard: ${err.message}</p></div>`;
  }
}

// ========== ORDERS ==========
async function loadOrders(status = 'all', search = '') {
  const content = document.getElementById('contentArea');
  content.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i><p>Loading orders...</p></div>';

  try {
    let url = `/admin/orders?limit=50`;
    if (status !== 'all') url += `&status=${status}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    
    const data = await apiGet(url);
    if (!data.success) { content.innerHTML = '<p>Failed to load</p>'; return; }

    const orders = data.data || [];

    content.innerHTML = `
      <div class="section-card">
        <div class="section-header">
          <h2>All Orders (${data.total || 0})</h2>
          <div class="section-tools">
            <div class="search-wrapper">
              <i class="fas fa-search"></i>
              <input type="text" class="search-input" placeholder="Search order..." id="orderSearch" value="${search}">
            </div>
            <select class="filter-select" id="orderFilter" onchange="loadOrders(this.value, document.getElementById('orderSearch').value)">
              <option value="all" ${status==='all'?'selected':''}>All Status</option>
              <option value="pending" ${status==='pending'?'selected':''}>Pending</option>
              <option value="confirmed" ${status==='confirmed'?'selected':''}>Confirmed</option>
              <option value="driver_assigned" ${status==='driver_assigned'?'selected':''}>Driver Assigned</option>
              <option value="picked_up" ${status==='picked_up'?'selected':''}>Picked Up</option>
              <option value="in_transit" ${status==='in_transit'?'selected':''}>In Transit</option>
              <option value="delivered" ${status==='delivered'?'selected':''}>Delivered</option>
              <option value="cancelled" ${status==='cancelled'?'selected':''}>Cancelled</option>
            </select>
            <button class="btn-refresh" onclick="loadOrders()"><i class="fas fa-sync-alt"></i></button>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Order #</th>
              <th>Customer</th>
              <th>Pickup</th>
              <th>Drop</th>
              <th>Driver</th>
              <th>Amount</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${orders.map(o => `
              <tr>
                <td><strong>${o.orderNumber}</strong></td>
                <td>${o.customer?.name || '-'}<br><small style="color:var(--text-muted)">${o.customer?.phone || ''}</small></td>
                <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${o.pickup?.address || '-'}</td>
                <td style="max-width:140px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${o.dropoff?.address || '-'}</td>
                <td>${o.driver?.name || '<span style="color:var(--text-muted)">-</span>'}</td>
                <td><strong>₹${o.pricing?.totalAmount || 0}</strong></td>
                <td><span class="badge badge-${o.status}">${formatStatus(o.status)}</span></td>
                <td>
                  <button class="btn-action blue" onclick="showUpdateStatusModal('${o._id}', '${o.status}')">
                    <i class="fas fa-edit"></i>
                  </button>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${orders.length === 0 ? '<div class="empty-state"><i class="fas fa-inbox"></i><p>No orders found</p></div>' : ''}
      </div>
    `;

    // Search handler
    const searchEl = document.getElementById('orderSearch');
    if (searchEl) {
      let timeout;
      searchEl.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          loadOrders(document.getElementById('orderFilter').value, searchEl.value);
        }, 500);
      });
    }
  } catch (err) {
    content.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-triangle"></i><p>Error: ${err.message}</p></div>`;
  }
}

// ========== DRIVERS ==========
async function loadDrivers(search = '') {
  const content = document.getElementById('contentArea');
  content.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i><p>Loading drivers...</p></div>';

  try {
    let url = `/admin/drivers?limit=50`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    
    const data = await apiGet(url);
    if (!data.success) return;

    const drivers = data.data || [];

    content.innerHTML = `
      <div class="section-card">
        <div class="section-header">
          <h2>All Drivers (${data.total || 0})</h2>
          <div class="section-tools">
            <div class="search-wrapper">
              <i class="fas fa-search"></i>
              <input type="text" class="search-input" placeholder="Search driver..." id="driverSearch" value="${search}">
            </div>
            <button class="btn-refresh" onclick="loadDrivers()"><i class="fas fa-sync-alt"></i></button>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Phone</th>
              <th>Vehicle</th>
              <th>Vehicle No.</th>
              <th>Rating</th>
              <th>Trips</th>
              <th>Earnings</th>
              <th>Status</th>
              <th>Verified</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            ${drivers.map(d => `
              <tr>
                <td><strong>${d.name}</strong></td>
                <td>${d.phone}</td>
                <td>${d.vehicleType?.name || '-'}</td>
                <td>${d.vehicleNumber}</td>
                <td>⭐ ${(d.rating || 0).toFixed(1)}</td>
                <td>${d.totalTrips || 0}</td>
                <td>₹${(d.totalEarnings || 0).toLocaleString('en-IN')}</td>
                <td><span class="badge badge-${d.isAvailable ? 'online' : 'offline'}">${d.isAvailable ? 'Online' : 'Offline'}</span></td>
                <td><span class="badge badge-${d.isVerified ? 'verified' : 'unverified'}">${d.isVerified ? 'Verified' : 'Pending'}</span></td>
                <td>
                  <button class="btn-action ${d.isActive ? 'red' : 'green'}" onclick="toggleDriver('${d._id}')">
                    ${d.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  ${!d.isVerified ? `<button class="btn-action green" onclick="verifyDriver('${d._id}')" style="margin-left:6px">Verify</button>` : ''}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${drivers.length === 0 ? '<div class="empty-state"><i class="fas fa-id-card"></i><p>No drivers registered</p></div>' : ''}
      </div>
    `;

    const searchEl = document.getElementById('driverSearch');
    if (searchEl) {
      let timeout;
      searchEl.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => loadDrivers(searchEl.value), 500);
      });
    }
  } catch (err) {
    content.innerHTML = `<div class="empty-state"><p>Error: ${err.message}</p></div>`;
  }
}

// ========== USERS ==========
async function loadUsers(search = '') {
  const content = document.getElementById('contentArea');
  content.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i><p>Loading customers...</p></div>';

  try {
    let url = `/admin/users?limit=50`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    
    const data = await apiGet(url);
    if (!data.success) return;

    const users = data.data || [];

    content.innerHTML = `
      <div class="section-card">
        <div class="section-header">
          <h2>All Customers (${data.total || 0})</h2>
          <div class="section-tools">
            <div class="search-wrapper">
              <i class="fas fa-search"></i>
              <input type="text" class="search-input" placeholder="Search customer..." id="userSearch" value="${search}">
            </div>
            <button class="btn-refresh" onclick="loadUsers()"><i class="fas fa-sync-alt"></i></button>
          </div>
        </div>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Orders</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td><strong>${u.name}</strong></td>
                <td>${u.email}</td>
                <td>${u.phone}</td>
                <td>${u.orderCount || 0}</td>
                <td>${new Date(u.createdAt).toLocaleDateString('en-IN')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${users.length === 0 ? '<div class="empty-state"><i class="fas fa-users"></i><p>No customers registered</p></div>' : ''}
      </div>
    `;

    const searchEl = document.getElementById('userSearch');
    if (searchEl) {
      let timeout;
      searchEl.addEventListener('input', () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => loadUsers(searchEl.value), 500);
      });
    }
  } catch (err) {
    content.innerHTML = `<div class="empty-state"><p>Error: ${err.message}</p></div>`;
  }
}

// ========== ACTIONS ==========
function showUpdateStatusModal(orderId, currentStatus) {
  const statuses = ['pending', 'confirmed', 'driver_assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled'];
  
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <h3>Update Order Status</h3>
      <div class="form-group">
        <label>Current Status</label>
        <p><span class="badge badge-${currentStatus}">${formatStatus(currentStatus)}</span></p>
      </div>
      <div class="form-group">
        <label>New Status</label>
        <select id="newStatus" class="filter-select" style="width:100%">
          ${statuses.map(s => `<option value="${s}" ${s===currentStatus?'selected':''}>${formatStatus(s)}</option>`).join('')}
        </select>
      </div>
      <div class="modal-actions">
        <button class="btn-cancel" onclick="this.closest('.modal-overlay').remove()">Cancel</button>
        <button class="btn-submit" onclick="updateOrderStatus('${orderId}')">Update</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });
}

async function updateOrderStatus(orderId) {
  const status = document.getElementById('newStatus').value;
  const data = await apiPut(`/admin/orders/${orderId}/status`, { status });
  document.querySelector('.modal-overlay')?.remove();
  if (data.success) {
    loadOrders();
  } else {
    alert(data.message || 'Failed to update');
  }
}

async function toggleDriver(id) {
  const data = await apiPut(`/admin/drivers/${id}/toggle`, {});
  if (data.success) {
    loadDrivers();
  }
}

async function verifyDriver(id) {
  const data = await apiPut(`/admin/drivers/${id}/verify`, {});
  if (data.success) {
    loadDrivers();
  }
}

// ========== HELPERS ==========
function formatStatus(s) {
  if (!s) return '-';
  return s.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

// ========== INIT ==========
checkAuth();

// ========== SETTINGS ==========
async function loadSettings() {
  const content = document.getElementById('contentArea');
  content.innerHTML = '<div class="loading"><i class="fas fa-spinner"></i><p>Loading settings...</p></div>';

  try {
    const data = await apiGet('/admin/config');
    const config = data.success ? data.data : {};

    const radiusKm = config.orderRadiusKm?.value ?? 15;
    const platformFee = config.platformFeePercent?.value ?? 5;
    const maxOrders = config.maxOrdersPerDriver?.value ?? 1;
    const isCommissionEnabled = config.isCommissionEnabled?.value ?? true;

    content.innerHTML = `
      <div class="section-card">
        <div class="section-header">
          <h2><i class="fas fa-cog" style="margin-right:8px;color:var(--primary)"></i> Platform Settings</h2>
        </div>
        <div class="settings-grid">
          <div class="setting-card">
            <div class="setting-card-header">
              <div class="setting-icon">
                <i class="fas fa-map-marker-alt"></i>
              </div>
              <div>
                <h3>Order Radius</h3>
                <p>Maximum distance for drivers to see orders</p>
              </div>
            </div>
            <div class="setting-control">
              <input type="range" id="radiusSlider" min="1" max="50" value="${radiusKm}" class="slider">
              <div class="slider-labels">
                <span>1 km</span>
                <span class="slider-value" id="radiusValue">${radiusKm} km</span>
                <span>50 km</span>
              </div>
            </div>
          </div>

          <div class="setting-card">
            <div class="setting-card-header">
              <div class="setting-icon" style="background:var(--yellow);color:white;">
                <i class="fas fa-wallet"></i>
              </div>
              <div>
                <h3>Require Recharge</h3>
                <p>Toggle if drivers need balance to accept orders</p>
              </div>
            </div>
            <div class="setting-control" style="padding-top:10px;">
              <select id="commissionToggle" class="filter-select" style="width:100%;font-size:16px;padding:8px;">
                <option value="true" ${isCommissionEnabled ? 'selected' : ''}>Enabled (Require Recharge)</option>
                <option value="false" ${!isCommissionEnabled ? 'selected' : ''}>Disabled (No Recharge Needed)</option>
              </select>
            </div>
          </div>

          <div class="setting-card">
            <div class="setting-card-header">
              <div class="setting-icon">
                <i class="fas fa-percentage"></i>
              </div>
              <div>
                <h3>Platform Fee</h3>
                <p>Commission percentage on each order</p>
              </div>
            </div>
            <div class="setting-control">
              <input type="range" id="feeSlider" min="0" max="30" value="${platformFee}" class="slider">
              <div class="slider-labels">
                <span>0%</span>
                <span class="slider-value" id="feeValue">${platformFee}%</span>
                <span>30%</span>
              </div>
            </div>
          </div>

          <div class="setting-card">
            <div class="setting-card-header">
              <div class="setting-icon">
                <i class="fas fa-truck"></i>
              </div>
              <div>
                <h3>Max Orders/Driver</h3>
                <p>Maximum concurrent orders per driver</p>
              </div>
            </div>
            <div class="setting-control">
              <input type="range" id="maxOrdersSlider" min="1" max="5" value="${maxOrders}" class="slider">
              <div class="slider-labels">
                <span>1</span>
                <span class="slider-value" id="maxOrdersValue">${maxOrders}</span>
                <span>5</span>
              </div>
            </div>
          </div>
        </div>

        <div style="margin-top:24px;text-align:right">
          <button class="btn-primary" id="saveSettingsBtn" onclick="saveSettings()">
            <i class="fas fa-save" style="margin-right:6px"></i>Save Settings
          </button>
        </div>
      </div>
    `;

    // Slider live updates
    document.getElementById('radiusSlider').addEventListener('input', (e) => {
      document.getElementById('radiusValue').textContent = e.target.value + ' km';
    });
    document.getElementById('feeSlider').addEventListener('input', (e) => {
      document.getElementById('feeValue').textContent = e.target.value + '%';
    });
    document.getElementById('maxOrdersSlider').addEventListener('input', (e) => {
      document.getElementById('maxOrdersValue').textContent = e.target.value;
    });
  } catch (err) {
    content.innerHTML = `<div class="empty-state"><p>Error loading settings: ${err.message}</p></div>`;
  }
}

async function saveSettings() {
  const btn = document.getElementById('saveSettingsBtn');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

  try {
    const updates = {
      orderRadiusKm: parseInt(document.getElementById('radiusSlider').value),
      platformFeePercent: parseInt(document.getElementById('feeSlider').value),
      maxOrdersPerDriver: parseInt(document.getElementById('maxOrdersSlider').value),
      isCommissionEnabled: document.getElementById('commissionToggle').value === 'true',
    };

    const data = await apiPut('/admin/config', updates);
    if (data.success) {
      btn.innerHTML = '<i class="fas fa-check" style="margin-right:6px"></i>Saved!';
      btn.style.backgroundColor = 'var(--success)';
      setTimeout(() => {
        btn.disabled = false;
        btn.innerHTML = '<i class="fas fa-save" style="margin-right:6px"></i>Save Settings';
        btn.style.backgroundColor = '';
      }, 2000);
    } else {
      alert('Failed to save: ' + (data.message || 'Unknown error'));
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-save" style="margin-right:6px"></i>Save Settings';
    }
  } catch (err) {
    alert('Error saving settings: ' + err.message);
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-save" style="margin-right:6px"></i>Save Settings';
  }
}

// ========== PRICING ALGORITHM PAGE ==========
function loadPricing() {
  const content = document.getElementById('contentArea');
  content.innerHTML = `
    <div class="pricing-card" style="background:#fff; border-radius:12px; padding:2rem; box-shadow:0 4px 15px rgba(0,0,0,0.05);">
      <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #eee; padding-bottom:1rem; margin-bottom:1.5rem;">
        <h2 style="font-size:1.5rem; color:#333; margin:0;"><i class="fas fa-calculator" style="color:var(--primary); margin-right:10px;"></i>LoadGo Fare Calculation</h2>
        <span style="background:rgba(9, 132, 227, 0.1); color:var(--blue); padding:5px 12px; border-radius:20px; font-weight:600; font-size:0.85rem;">Live Mathematics</span>
      </div>
      <div>
        <p style="color:#666; font-size:1.05rem; line-height:1.6; margin-bottom:2rem;">
          LoadGo uses a dynamic pricing model based on great-circle geographic distance and vehicle-specific configurations.
        </p>
        
        <div style="margin-bottom:2.5rem;">
          <h3 style="color:#2d3436; font-size:1.2rem; margin-bottom:1rem;">1. Distance Calculation (Haversine Formula)</h3>
          <p style="color:#666; margin-bottom:1rem;">Calculates absolute distance between latitude/longitude pickup and dropoff points.</p>
          <div style="background:#f8f9fa; padding:1.2rem; border-radius:8px; font-family:monospace; color:#e056fd; border-left:4px solid #a29bfe; font-size:0.95rem; overflow-x:auto;">
const R = 6371; // Earth's radius in km<br>
const dLat = (lat2 - lat1) * (PI / 180);<br>
const dLon = (lon2 - lon1) * (PI / 180);<br>
const a = sin²(dLat/2) + cos(lat1) * cos(lat2) * sin²(dLon/2);<br>
const c = 2 * atan2(√a, √(1-a));<br>
distance = R * c; // Absolute km
          </div>
        </div>

        <div style="margin-bottom:2.5rem;">
          <h3 style="color:#2d3436; font-size:1.2rem; margin-bottom:1rem;">2. Base & Logic Charging</h3>
          <p style="color:#666; margin-bottom:1rem;">Computes fare per vehicle metrics (stored in MongoDB):</p>
          <ul style="color:#666; line-height:1.8; margin-bottom:1.5rem;">
            <li><strong>Base Fare</strong>: Unique starting rate (e.g., ₹250 for Mini Truck)</li>
            <li><strong>Distance Charge</strong>: <code>round(distance * vehicle.perKmRate)</code></li>
            <li><strong>Loading Charge</strong>: Fixed physical effort fee based on capacity</li>
          </ul>
          <div style="background:rgba(0, 184, 148, 0.08); padding:1rem; border-radius:8px; text-align:center; color:#00b894; font-weight:600; font-size:1.1rem; border:1px solid rgba(0, 184, 148, 0.2);">
            Subtotal = Base Fare + Distance Charge + Loading Charge
          </div>
        </div>

        <div>
          <h3 style="color:#2d3436; font-size:1.2rem; margin-bottom:1rem;">3. Taxes & Minimum Fare Envelope</h3>
          <ul style="color:#666; line-height:1.8; margin-bottom:1.5rem;">
            <li><strong>GST (5%)</strong>: <code>round(Subtotal * 0.05)</code> standard logistics tax</li>
            <li><strong>Total Amount</strong>: <code>Subtotal + GST</code></li>
            <li><strong>Minimum Constraint</strong>: Guaranteeing drivers minimum reasonable payout even for ultra-short trips</li>
          </ul>
          <div style="background:rgba(255, 107, 53, 0.08); padding:1.2rem; border-radius:8px; text-align:center; color:var(--primary); font-weight:700; font-size:1.3rem; border:1px solid rgba(255, 107, 53, 0.3);">
            Final Quote = Math.max(Total Amount, vehicle.minimumFare)
          </div>
        </div>
      </div>
    </div>
  `;
}
