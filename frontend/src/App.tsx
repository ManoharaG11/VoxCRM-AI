import VoiceAgent from "./VoiceAgent";
import { useEffect, useState, type FormEvent } from "react";
import "./App.css";

const API = "http://127.0.0.1:8000";

interface Lead {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  status: string;
  source: string | null;
}

interface Customer {
  id: number;
  source_lead_id: number | null;
  name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  customer_status: string;
  created_at: string | null;
}

interface Call {
  id: number;
  lead_id: number | null;
  customer_id: number | null;
  contact_name: string;
  phone: string | null;
  call_type: string;
  duration_seconds: number;
  outcome: string;
  notes: string | null;
  called_at: string;
}

interface FollowUp {
  id: number;
  lead_id: number | null;
  customer_id: number | null;
  title: string;
  description: string | null;
  due_date: string;
  priority: string;
  status: string;
}

interface Settings {
  workspace_name: string;
  admin_name: string;
  email: string;
  notifications_enabled: boolean;
}

const stages = ["New", "Contacted", "Qualified", "Lost"];

const emptyLead = {
  name: "",
  email: "",
  phone: "",
  company: "",
  status: "New",
  source: "Website",
};

const emptyCustomer = {
  name: "",
  email: "",
  phone: "",
  company: "",
  customer_status: "Active",
};

const emptyCall = {
  lead_id: "",
  customer_id: "",
  contact_name: "",
  phone: "",
  call_type: "Outbound",
  duration_seconds: "0",
  outcome: "Answered",
  notes: "",
};

const emptyFollowUp = {
  lead_id: "",
  customer_id: "",
  title: "",
  description: "",
  due_date: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
  priority: "Medium",
  status: "Pending",
};

async function api<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = Array.isArray(data.detail)
      ? data.detail.map((item: any) => item.msg).join(", ")
      : data.detail;

    throw new Error(detail || "The request could not be completed.");
  }

  return data as T;
}

function dateText(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function App() {
  const [page, setPage] = useState("Dashboard");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const [leads, setLeads] = useState<Lead[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [calls, setCalls] = useState<Call[]>([]);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [settings, setSettings] = useState<Settings>({
    workspace_name: "My Workspace",
    admin_name: "Workspace Admin",
    email: "",
    notifications_enabled: true,
  });

  const [leadForm, setLeadForm] = useState(emptyLead);
  const [editingLead, setEditingLead] = useState<number | null>(null);
  const [leadSearch, setLeadSearch] = useState("");

  const [customerForm, setCustomerForm] = useState(emptyCustomer);
  const [editingCustomer, setEditingCustomer] = useState<number | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");

  const [callForm, setCallForm] = useState(emptyCall);
  const [editingCall, setEditingCall] = useState<number | null>(null);
  const [callSearch, setCallSearch] = useState("");

  const [followForm, setFollowForm] = useState(emptyFollowUp);
  const [editingFollow, setEditingFollow] = useState<number | null>(null);
  const [followFilter, setFollowFilter] = useState("All");

  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<number | null>(null);

  // DATA LOADING

  async function loadLeads() {
    const data = await api<{ leads: Lead[] }>("/api/leads");
    setLeads(data.leads);
  }

  async function loadCustomers() {
    const data = await api<{ customers: Customer[] }>("/api/customers");
    setCustomers(data.customers);
  }

  async function loadCalls() {
    const data = await api<{ calls: Call[] }>("/api/calls");
    setCalls(data.calls);
  }

  async function loadFollowUps() {
    const data = await api<{ follow_ups: FollowUp[] }>("/api/follow-ups");
    setFollowUps(data.follow_ups);
  }

  async function loadSettings() {
    const data = await api<Settings>("/api/settings");
    setSettings(data);
  }

  async function refreshAll() {
    setLoading(true);
    setError("");

    try {
      await Promise.all([
        loadLeads(),
        loadCustomers(),
        loadCalls(),
        loadFollowUps(),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load CRM data.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refreshAll();
    void loadSettings().catch((err) => {
      setError(err instanceof Error ? err.message : "Unable to load settings.");
    });
  }, []);

  function notify(message: string) {
    setSuccess(message);
    setError("");
  }

  function showError(err: unknown) {
    setError(err instanceof Error ? err.message : "Something went wrong.");
    setSuccess("");
  }

  // LEADS

  async function saveLead(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      await api(
        editingLead ? `/api/leads/${editingLead}` : "/api/leads",
        {
          method: editingLead ? "PATCH" : "POST",
          body: JSON.stringify(leadForm),
        }
      );

      setLeadForm(emptyLead);
      setEditingLead(null);
      await loadLeads();
      notify(editingLead ? "Lead updated successfully." : "Lead created successfully.");
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  }

  function editLead(lead: Lead) {
    setEditingLead(lead.id);
    setLeadForm({
      name: lead.name,
      email: lead.email || "",
      phone: lead.phone || "",
      company: lead.company || "",
      status: lead.status,
      source: lead.source || "Website",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteLead(id: number) {
    if (!window.confirm("Delete this lead?")) return;

    try {
      await api(`/api/leads/${id}`, { method: "DELETE" });
      await Promise.all([loadLeads(), loadCustomers()]);
      notify("Lead deleted successfully.");
    } catch (err) {
      showError(err);
    }
  }

  async function convertLead(id: number) {
    setBusyId(id);

    try {
      await api(`/api/customers/convert/${id}`, { method: "POST" });
      await Promise.all([loadLeads(), loadCustomers()]);
      notify("Qualified lead converted into a customer!");
    } catch (err) {
      showError(err);
      await loadCustomers().catch(() => undefined);
    } finally {
      setBusyId(null);
    }
  }

  async function changeLeadStage(id: number, status: string) {
    try {
      await api(`/api/leads/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadLeads();
      notify(`Lead moved to ${status}.`);
    } catch (err) {
      showError(err);
    }
  }

  // CUSTOMERS

  function editCustomer(customer: Customer) {
    setEditingCustomer(customer.id);
    setCustomerForm({
      name: customer.name,
      email: customer.email || "",
      phone: customer.phone || "",
      company: customer.company || "",
      customer_status: customer.customer_status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function saveCustomer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingCustomer) return;

    setSaving(true);

    try {
      await api(`/api/customers/${editingCustomer}`, {
        method: "PATCH",
        body: JSON.stringify(customerForm),
      });

      setEditingCustomer(null);
      setCustomerForm(emptyCustomer);
      await loadCustomers();
      notify("Customer updated successfully.");
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  }

  async function deleteCustomer(id: number) {
    if (!window.confirm("Delete this customer?")) return;

    try {
      await api(`/api/customers/${id}`, { method: "DELETE" });
      await loadCustomers();
      notify("Customer deleted successfully.");
    } catch (err) {
      showError(err);
    }
  }

  // CALL HISTORY

  async function saveCall(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const payload = {
      ...callForm,
      lead_id: callForm.lead_id ? Number(callForm.lead_id) : null,
      customer_id: callForm.customer_id ? Number(callForm.customer_id) : null,
      duration_seconds: Number(callForm.duration_seconds),
    };

    try {
      await api(
        editingCall ? `/api/calls/${editingCall}` : "/api/calls",
        {
          method: editingCall ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );

      setCallForm(emptyCall);
      setEditingCall(null);
      await loadCalls();
      notify(editingCall ? "Call record updated." : "Call recorded successfully.");
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  }

  function editCall(call: Call) {
    setEditingCall(call.id);
    setCallForm({
      lead_id: call.lead_id ? String(call.lead_id) : "",
      customer_id: call.customer_id ? String(call.customer_id) : "",
      contact_name: call.contact_name,
      phone: call.phone || "",
      call_type: call.call_type,
      duration_seconds: String(call.duration_seconds),
      outcome: call.outcome,
      notes: call.notes || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteCall(id: number) {
    if (!window.confirm("Delete this call record?")) return;

    try {
      await api(`/api/calls/${id}`, { method: "DELETE" });
      await loadCalls();
      notify("Call record deleted.");
    } catch (err) {
      showError(err);
    }
  }

  // FOLLOW-UPS

  async function saveFollowUp(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    const payload = {
      ...followForm,
      lead_id: followForm.lead_id ? Number(followForm.lead_id) : null,
      customer_id: followForm.customer_id ? Number(followForm.customer_id) : null,
      due_date: new Date(followForm.due_date).toISOString(),
    };

    try {
      await api(
        editingFollow ? `/api/follow-ups/${editingFollow}` : "/api/follow-ups",
        {
          method: editingFollow ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        }
      );

      setFollowForm(emptyFollowUp);
      setEditingFollow(null);
      await loadFollowUps();
      notify(editingFollow ? "Follow-up updated." : "Follow-up created successfully.");
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  }

  function editFollowUp(task: FollowUp) {
    setEditingFollow(task.id);
    setFollowForm({
      lead_id: task.lead_id ? String(task.lead_id) : "",
      customer_id: task.customer_id ? String(task.customer_id) : "",
      title: task.title,
      description: task.description || "",
      due_date: new Date(task.due_date).toISOString().slice(0, 16),
      priority: task.priority,
      status: task.status,
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function updateFollowStatus(task: FollowUp, status: string) {
    try {
      await api(`/api/follow-ups/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadFollowUps();
      notify(`Follow-up marked ${status.toLowerCase()}.`);
    } catch (err) {
      showError(err);
    }
  }

  async function deleteFollowUp(id: number) {
    if (!window.confirm("Delete this follow-up?")) return;

    try {
      await api(`/api/follow-ups/${id}`, { method: "DELETE" });
      await loadFollowUps();
      notify("Follow-up deleted.");
    } catch (err) {
      showError(err);
    }
  }

  // SETTINGS

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);

    try {
      const data = await api<Settings>("/api/settings", {
        method: "PATCH",
        body: JSON.stringify(settings),
      });
      setSettings(data);
      notify("Workspace settings saved.");
    } catch (err) {
      showError(err);
    } finally {
      setSaving(false);
    }
  }

  // DERIVED DATA

  const qualifiedLeads = leads.filter(
    (lead) => lead.status.toLowerCase() === "qualified"
  );

  const convertedLeadIds = new Set(
    customers.map((customer) => customer.source_lead_id).filter(Boolean)
  );

  const activeCustomers = customers.filter(
    (customer) => customer.customer_status === "Active"
  ).length;

  const pendingFollowUps = followUps.filter(
    (task) => task.status !== "Completed"
  );

  const today = new Date().toDateString();

  const callsToday = calls.filter(
    (call) => new Date(call.called_at).toDateString() === today
  ).length;

  const filteredLeads = leads.filter((lead) =>
    `${lead.name} ${lead.email || ""} ${lead.company || ""} ${lead.status}`
      .toLowerCase()
      .includes(leadSearch.toLowerCase())
  );

  const filteredCustomers = customers.filter((customer) =>
    `${customer.name} ${customer.email || ""} ${customer.company || ""} ${customer.phone || ""}`
      .toLowerCase()
      .includes(customerSearch.toLowerCase())
  );

  const filteredCalls = calls.filter((call) =>
    `${call.contact_name} ${call.phone || ""} ${call.outcome} ${call.call_type}`
      .toLowerCase()
      .includes(callSearch.toLowerCase())
  );

  const visibleFollowUps = followUps.filter((task) =>
    followFilter === "All" ? true : task.status === followFilter
  );

  const stats = [
    ["Total Leads", leads.length, "♙"],
    ["Qualified Leads", qualifiedLeads.length, "✧"],
    ["Calls Today", callsToday, "☎"],
    ["Pending Follow-ups", pendingFollowUps.length, "◷"],
  ];

  // COMMON FORM FIELD HELPERS

  const field = (
    label: string,
    name: string,
    value: string,
    onChange: (value: string) => void,
    type = "text",
    required = false
  ) => (
    <label>
      {label}
      <input
        type={type}
        value={value}
        required={required}
        onChange={(event) => onChange(event.target.value)}
      />
    </label>
  );

  // APPLICATION

  return (
    <div className="app-container">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">V</div>
          <div>
            <h2>VoxCRM <span>AI</span></h2>
            <p>INTELLIGENT CRM</p>
          </div>
        </div>

        <div className="workspace">
          <span className="workspace-dot" />
          {settings.workspace_name}
        </div>

        <p className="menu-heading">WORKSPACE</p>

        <nav className="navigation">
          {[
            ["▦", "Dashboard"],
            ["◉", "AI Voice Agent"],
            ["♙", "Leads"],
            ["▥", "Sales Pipeline"],
            ["♧", "Customers"],
            ["◷", "Call History"],
            ["✓", "Follow-ups"],
          ].map(([icon, label]) => (
            <button
              key={label}
              className={`nav-item ${page === label ? "active" : ""}`}
              onClick={() => {
                setPage(label);
                setError("");
                setSuccess("");
              }}
            >
              <span className="nav-icon">{icon}</span>
              {label}
              {label === "Follow-ups" && (
                <span className="nav-count">{pendingFollowUps.length}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button
            className={`nav-item ${page === "Settings" ? "active" : ""}`}
            onClick={() => setPage("Settings")}
          >
            <span className="nav-icon">⚙</span>
            Settings
          </button>

          <div className="profile">
            <div className="avatar">GM</div>
            <div>
              <strong>{settings.admin_name}</strong>
              <p>Administrator</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="breadcrumb">Workspace / {page}</p>
            <h1>{page}</h1>
          </div>
          <div className="topbar-actions">
            <div className="system-status"><span /> All systems operational</div>
            <div className="top-avatar">GM</div>
          </div>
        </header>

        {(error || success) && (
          <div className={error ? "error-message" : "success-message"}>
            {error || success}
          </div>
        )}

        {loading && <p className="empty-activity">Refreshing CRM data...</p>}

        {/* DASHBOARD */}

        {page === "Dashboard" && (
          <>
            <section className="welcome-section">
              <div>
                <p className="eyebrow">YOUR WORKSPACE IS READY</p>
                <h2>Welcome to VoxCRM AI 👋</h2>
                <p className="welcome-description">
                  Manage leads, customers, calls and follow-ups from one intelligent workspace.
                </p>
              </div>
              <button className="primary-button" onClick={() => setPage("Leads")}>
                + Create New Lead
              </button>
            </section>

            <section className="stats-grid">
              {stats.map(([label, value, icon]) => (
                <div className="stat-card" key={String(label)}>
                  <div className="stat-top">
                    <span>{label}</span>
                    <div className="stat-icon">{icon}</div>
                  </div>
                  <h2>{value}</h2>
                  <p className="stat-change">Live database data</p>
                </div>
              ))}
            </section>

            <section className="content-grid">
              <div className="panel activity-panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">CONVERSION OPPORTUNITIES</p>
                    <h2>Qualified Leads ({qualifiedLeads.length})</h2>
                  </div>
                  <button className="text-button" onClick={() => setPage("Leads")}>
                    View all →
                  </button>
                </div>

                {qualifiedLeads.length === 0 ? (
                  <p className="empty-activity">No qualified leads available yet.</p>
                ) : (
                  <div className="recent-leads">
                    {qualifiedLeads.map((lead) => {
                      const converted = convertedLeadIds.has(lead.id);
                      return (
                        <div className="recent-lead" key={lead.id}>
                          <div>
                            <strong>{lead.name}</strong>
                            <p>{lead.company || "No company"} · #{lead.id}</p>
                          </div>
                          {converted ? (
                            <span className="lead-status">Customer</span>
                          ) : (
                            <button
                              className="action-button edit-button"
                              disabled={busyId === lead.id}
                              onClick={() => void convertLead(lead.id)}
                            >
                              {busyId === lead.id ? "Converting..." : "Convert"}
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="panel activity-panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">CUSTOMER OVERVIEW</p>
                    <h2>Customers</h2>
                  </div>
                  <button className="text-button" onClick={() => setPage("Customers")}>
                    View all →
                  </button>
                </div>
                <h2>{customers.length} Total Customers</h2>
                <p className="welcome-description">{activeCustomers} active customers</p>
                <button className="primary-button" onClick={() => setPage("Customers")}>
                  Open Customer Directory
                </button>
              </div>
            </section>

            <section className="panel activity-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">RECENT ACTIVITY</p>
                  <h2>Recent Calls</h2>
                </div>
                <button className="text-button" onClick={() => setPage("Call History")}>
                  View calls →
                </button>
              </div>
              {calls.slice(0, 4).map((call) => (
                <div className="recent-lead" key={call.id}>
                  <div>
                    <strong>{call.contact_name}</strong>
                    <p>{call.call_type} · {call.outcome}</p>
                  </div>
                  <span>{dateText(call.called_at)}</span>
                </div>
              ))}
              {calls.length === 0 && <p className="empty-activity">No calls recorded yet.</p>}
            </section>
          </>
        )}

        {/* LEADS */}

        {page === "Leads" && (
          <section className="leads-page">
            <div className="leads-heading">
              <div>
                <p className="eyebrow">LEAD MANAGEMENT</p>
                <h2>Manage Your Leads</h2>
              </div>
              <button className="refresh-button" onClick={() => void loadLeads()}>
                ↻ Refresh Leads
              </button>
            </div>

            <div className="panel lead-form-panel">
              <h3>{editingLead ? `Edit Lead #${editingLead}` : "+ Add New Lead"}</h3>
              <form className="lead-form" onSubmit={saveLead}>
                {field("Full Name *", "name", leadForm.name, (v) => setLeadForm({ ...leadForm, name: v }), "text", true)}
                {field("Email", "email", leadForm.email, (v) => setLeadForm({ ...leadForm, email: v }), "email")}
                {field("Phone", "phone", leadForm.phone, (v) => setLeadForm({ ...leadForm, phone: v }))}
                {field("Company", "company", leadForm.company, (v) => setLeadForm({ ...leadForm, company: v }))}
                <label>Status
                  <select value={leadForm.status} onChange={(e) => setLeadForm({ ...leadForm, status: e.target.value })}>
                    {stages.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </label>
                <label>Source
                  <select value={leadForm.source} onChange={(e) => setLeadForm({ ...leadForm, source: e.target.value })}>
                    {["Website", "LinkedIn", "Referral", "Other"].map((s) => <option key={s}>{s}</option>)}
                  </select>
                </label>
                <button className="primary-button form-submit" disabled={saving}>
                  {saving ? "Saving..." : editingLead ? "Update Lead" : "Save Lead"}
                </button>
                {editingLead && (
                  <button type="button" className="cancel-button" onClick={() => { setEditingLead(null); setLeadForm(emptyLead); }}>
                    Cancel
                  </button>
                )}
              </form>
            </div>

            <div className="panel lead-list-panel">
              <div className="panel-header"><h2>All Leads ({leads.length})</h2></div>
              <input className="search-input" placeholder="Search leads..." value={leadSearch} onChange={(e) => setLeadSearch(e.target.value)} />
              <div className="table-wrapper">
                <table className="leads-table">
                  <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Company</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredLeads.map((lead) => {
                      const converted = convertedLeadIds.has(lead.id);
                      return (
                        <tr key={lead.id}>
                          <td>{lead.id}</td><td>{lead.name}</td><td>{lead.email || "—"}</td><td>{lead.company || "—"}</td>
                          <td>
                            <select value={lead.status} onChange={(e) => void changeLeadStage(lead.id, e.target.value)}>
                              {stages.map((s) => <option key={s}>{s}</option>)}
                            </select>
                          </td>
                          <td>
                            <div className="lead-actions">
                              <button className="action-button edit-button" onClick={() => editLead(lead)}>Edit</button>
                              {lead.status === "Qualified" && !converted && (
                                <button className="action-button edit-button" onClick={() => void convertLead(lead.id)} disabled={busyId === lead.id}>
                                  {busyId === lead.id ? "..." : "Convert"}
                                </button>
                              )}
                              {converted && <span className="lead-status">Customer</span>}
                              <button className="action-button delete-button" onClick={() => void deleteLead(lead.id)}>Delete</button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredLeads.length === 0 && <p className="empty-activity">No matching leads.</p>}
              </div>
            </div>
          </section>
        )}

        {/* SALES PIPELINE */}

        {page === "Sales Pipeline" && (
          <section className="pipeline-page">
            <div className="leads-heading">
              <div><p className="eyebrow">SALES MANAGEMENT</p><h2>Sales Pipeline</h2></div>
              <button className="refresh-button" onClick={() => void loadLeads()}>↻ Refresh Pipeline</button>
            </div>
            <div className="pipeline-grid">
              {stages.map((stage) => {
                const items = leads.filter((lead) => lead.status === stage);
                return (
                  <div className="pipeline-column" key={stage}>
                    <div className="pipeline-column-header"><h3>{stage}</h3><span>{items.length}</span></div>
                    {items.map((lead) => (
                      <div className="pipeline-card" key={lead.id}>
                        <span className="pipeline-lead-id">LEAD #{lead.id}</span>
                        <h4>{lead.name}</h4>
                        <p>{lead.company || "No company"}</p>
                        <label className="pipeline-stage-label">Move to stage
                          <select value={lead.status} onChange={(e) => void changeLeadStage(lead.id, e.target.value)}>
                            {stages.map((s) => <option key={s}>{s}</option>)}
                          </select>
                        </label>
                        {stage === "Qualified" && !convertedLeadIds.has(lead.id) && (
                          <button className="primary-button" onClick={() => void convertLead(lead.id)}>Convert to Customer</button>
                        )}
                      </div>
                    ))}
                    {items.length === 0 && <div className="pipeline-empty">No leads in this stage</div>}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* CUSTOMERS */}

        {page === "Customers" && (
          <section className="leads-page">
            <div className="leads-heading">
              <div><p className="eyebrow">CUSTOMER RELATIONSHIP MANAGEMENT</p><h2>Customer Directory</h2></div>
              <button className="refresh-button" onClick={() => void loadCustomers()}>↻ Refresh Customers</button>
            </div>

            <section className="stats-grid">
              <div className="stat-card"><span>Total Customers</span><h2>{customers.length}</h2></div>
              <div className="stat-card"><span>Active</span><h2>{activeCustomers}</h2></div>
              <div className="stat-card"><span>Inactive</span><h2>{customers.length - activeCustomers}</h2></div>
            </section>

            {editingCustomer && (
              <div className="panel lead-form-panel">
                <h3>Edit Customer #{editingCustomer}</h3>
                <form className="lead-form" onSubmit={saveCustomer}>
                  {field("Name", "name", customerForm.name, (v) => setCustomerForm({ ...customerForm, name: v }), "text", true)}
                  {field("Email", "email", customerForm.email, (v) => setCustomerForm({ ...customerForm, email: v }), "email")}
                  {field("Phone", "phone", customerForm.phone, (v) => setCustomerForm({ ...customerForm, phone: v }))}
                  {field("Company", "company", customerForm.company, (v) => setCustomerForm({ ...customerForm, company: v }))}
                  <label>Status
                    <select value={customerForm.customer_status} onChange={(e) => setCustomerForm({ ...customerForm, customer_status: e.target.value })}>
                      <option>Active</option><option>Inactive</option>
                    </select>
                  </label>
                  <button className="primary-button form-submit" disabled={saving}>Save Changes</button>
                  <button type="button" className="cancel-button" onClick={() => setEditingCustomer(null)}>Cancel</button>
                </form>
              </div>
            )}

            <div className="panel lead-list-panel">
              <h2>All Customers ({customers.length})</h2>
              <input className="search-input" placeholder="Search customers..." value={customerSearch} onChange={(e) => setCustomerSearch(e.target.value)} />
              <div className="table-wrapper">
                <table className="leads-table">
                  <thead><tr><th>ID</th><th>Name</th><th>Email</th><th>Phone</th><th>Company</th><th>Source Lead</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredCustomers.map((c) => (
                      <tr key={c.id}>
                        <td>{c.id}</td><td>{c.name}</td><td>{c.email || "—"}</td><td>{c.phone || "—"}</td><td>{c.company || "—"}</td><td>{c.source_lead_id ? `#${c.source_lead_id}` : "Manual"}</td><td>{c.customer_status}</td>
                        <td><div className="lead-actions">
                          <button className="action-button edit-button" onClick={() => editCustomer(c)}>Edit</button>
                          <button className="action-button delete-button" onClick={() => void deleteCustomer(c.id)}>Delete</button>
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredCustomers.length === 0 && <p className="empty-activity">No matching customers.</p>}
              </div>
            </div>
          </section>
        )}

        {/* CALL HISTORY */}

        {page === "Call History" && (
          <section className="leads-page">
            <div className="leads-heading">
              <div><p className="eyebrow">COMMUNICATION MANAGEMENT</p><h2>Call History</h2><p className="welcome-description">Record and manage customer calls.</p></div>
              <button className="refresh-button" onClick={() => void loadCalls()}>↻ Refresh Calls</button>
            </div>

            <div className="stats-grid">
              <div className="stat-card"><span>Total Calls</span><h2>{calls.length}</h2></div>
              <div className="stat-card"><span>Calls Today</span><h2>{callsToday}</h2></div>
              <div className="stat-card"><span>Answered</span><h2>{calls.filter((c) => c.outcome === "Answered").length}</h2></div>
            </div>

            <div className="panel lead-form-panel">
              <h3>{editingCall ? `Edit Call #${editingCall}` : "+ Record a Call"}</h3>
              <form className="lead-form" onSubmit={saveCall}>
                {field("Contact Name *", "contact_name", callForm.contact_name, (v) => setCallForm({ ...callForm, contact_name: v }), "text", true)}
                {field("Phone", "phone", callForm.phone, (v) => setCallForm({ ...callForm, phone: v }))}
                <label>Related Lead
                  <select value={callForm.lead_id} onChange={(e) => setCallForm({ ...callForm, lead_id: e.target.value, customer_id: "" })}>
                    <option value="">None</option>
                    {leads.map((l) => <option key={l.id} value={l.id}>{l.name} (#{l.id})</option>)}
                  </select>
                </label>
                <label>Related Customer
                  <select value={callForm.customer_id} onChange={(e) => setCallForm({ ...callForm, customer_id: e.target.value, lead_id: "" })}>
                    <option value="">None</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name} (#{c.id})</option>)}
                  </select>
                </label>
                <label>Call Type
                  <select value={callForm.call_type} onChange={(e) => setCallForm({ ...callForm, call_type: e.target.value })}><option>Outbound</option><option>Inbound</option></select>
                </label>
                <label>Outcome
                  <select value={callForm.outcome} onChange={(e) => setCallForm({ ...callForm, outcome: e.target.value })}>
                    {["Answered", "No Answer", "Busy", "Voicemail"].map((v) => <option key={v}>{v}</option>)}
                  </select>
                </label>
                {field("Duration (seconds)", "duration_seconds", callForm.duration_seconds, (v) => setCallForm({ ...callForm, duration_seconds: v }), "number")}
                <label>Notes
                  <textarea value={callForm.notes} onChange={(e) => setCallForm({ ...callForm, notes: e.target.value })} />
                </label>
                <button className="primary-button form-submit" disabled={saving}>{saving ? "Saving..." : editingCall ? "Update Call" : "Save Call"}</button>
                {editingCall && <button type="button" className="cancel-button" onClick={() => { setEditingCall(null); setCallForm(emptyCall); }}>Cancel</button>}
              </form>
            </div>

            <div className="panel lead-list-panel">
              <h2>Call Records</h2>
              <input className="search-input" placeholder="Search calls..." value={callSearch} onChange={(e) => setCallSearch(e.target.value)} />
              <div className="table-wrapper">
                <table className="leads-table">
                  <thead><tr><th>ID</th><th>Contact</th><th>Phone</th><th>Type</th><th>Duration</th><th>Outcome</th><th>Date</th><th>Actions</th></tr></thead>
                  <tbody>
                    {filteredCalls.map((c) => (
                      <tr key={c.id}>
                        <td>{c.id}</td><td>{c.contact_name}</td><td>{c.phone || "—"}</td><td>{c.call_type}</td><td>{c.duration_seconds}s</td><td>{c.outcome}</td><td>{dateText(c.called_at)}</td>
                        <td><div className="lead-actions">
                          <button className="action-button edit-button" onClick={() => editCall(c)}>Edit</button>
                          <button className="action-button delete-button" onClick={() => void deleteCall(c.id)}>Delete</button>
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {filteredCalls.length === 0 && <p className="empty-activity">No call records yet. Record your first call above.</p>}
              </div>
            </div>
          </section>
        )}

        {/* FOLLOW-UPS */}

        {page === "Follow-ups" && (
          <section className="leads-page">
            <div className="leads-heading">
              <div><p className="eyebrow">TASK MANAGEMENT</p><h2>Follow-ups</h2><p className="welcome-description">Never miss an important customer interaction.</p></div>
              <button className="refresh-button" onClick={() => void loadFollowUps()}>↻ Refresh Tasks</button>
            </div>

            <div className="stats-grid">
              <div className="stat-card"><span>Total Tasks</span><h2>{followUps.length}</h2></div>
              <div className="stat-card"><span>Pending</span><h2>{followUps.filter((f) => f.status === "Pending").length}</h2></div>
              <div className="stat-card"><span>Completed</span><h2>{followUps.filter((f) => f.status === "Completed").length}</h2></div>
            </div>

            <div className="panel lead-form-panel">
              <h3>{editingFollow ? `Edit Follow-up #${editingFollow}` : "+ Create Follow-up"}</h3>
              <form className="lead-form" onSubmit={saveFollowUp}>
                {field("Task Title *", "title", followForm.title, (v) => setFollowForm({ ...followForm, title: v }), "text", true)}
                <label>Description
                  <textarea value={followForm.description} onChange={(e) => setFollowForm({ ...followForm, description: e.target.value })} />
                </label>
                <label>Related Lead
                  <select value={followForm.lead_id} onChange={(e) => setFollowForm({ ...followForm, lead_id: e.target.value, customer_id: "" })}>
                    <option value="">None</option>
                    {leads.map((l) => <option key={l.id} value={l.id}>{l.name} (#{l.id})</option>)}
                  </select>
                </label>
                <label>Related Customer
                  <select value={followForm.customer_id} onChange={(e) => setFollowForm({ ...followForm, customer_id: e.target.value, lead_id: "" })}>
                    <option value="">None</option>
                    {customers.map((c) => <option key={c.id} value={c.id}>{c.name} (#{c.id})</option>)}
                  </select>
                </label>
                <label>Due Date
                  <input type="datetime-local" required value={followForm.due_date} onChange={(e) => setFollowForm({ ...followForm, due_date: e.target.value })} />
                </label>
                <label>Priority
                  <select value={followForm.priority} onChange={(e) => setFollowForm({ ...followForm, priority: e.target.value })}><option>Low</option><option>Medium</option><option>High</option></select>
                </label>
                <label>Status
                  <select value={followForm.status} onChange={(e) => setFollowForm({ ...followForm, status: e.target.value })}><option>Pending</option><option>In Progress</option><option>Completed</option></select>
                </label>
                <button className="primary-button form-submit" disabled={saving}>{saving ? "Saving..." : editingFollow ? "Update Follow-up" : "Create Follow-up"}</button>
                {editingFollow && <button type="button" className="cancel-button" onClick={() => { setEditingFollow(null); setFollowForm(emptyFollowUp); }}>Cancel</button>}
              </form>
            </div>

            <div className="panel lead-list-panel">
              <div className="panel-header"><h2>Follow-up Tasks</h2>
                <select value={followFilter} onChange={(e) => setFollowFilter(e.target.value)}>
                  <option>All</option><option>Pending</option><option>In Progress</option><option>Completed</option>
                </select>
              </div>
              <div className="table-wrapper">
                <table className="leads-table">
                  <thead><tr><th>Task</th><th>Due Date</th><th>Priority</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>
                    {visibleFollowUps.map((task) => (
                      <tr key={task.id}>
                        <td><strong>{task.title}</strong><br />{task.description || ""}</td>
                        <td>{dateText(task.due_date)}</td><td>{task.priority}</td>
                        <td>
                          <select value={task.status} onChange={(e) => void updateFollowStatus(task, e.target.value)}>
                            <option>Pending</option><option>In Progress</option><option>Completed</option>
                          </select>
                        </td>
                        <td><div className="lead-actions">
                          <button className="action-button edit-button" onClick={() => editFollowUp(task)}>Edit</button>
                          <button className="action-button delete-button" onClick={() => void deleteFollowUp(task.id)}>Delete</button>
                        </div></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {visibleFollowUps.length === 0 && <p className="empty-activity">No follow-up tasks in this view.</p>}
              </div>
            </div>
          </section>
        )}

        {/* SETTINGS */}

        {page === "Settings" && (
          <section className="leads-page">
            <div className="leads-heading">
              <div><p className="eyebrow">WORKSPACE CONFIGURATION</p><h2>Settings</h2><p className="welcome-description">Manage your workspace information and preferences.</p></div>
              <button className="refresh-button" onClick={() => void loadSettings()}>↻ Reload Settings</button>
            </div>

            <div className="panel lead-form-panel">
              <h3>Workspace Preferences</h3>
              <form className="lead-form" onSubmit={saveSettings}>
                {field("Workspace Name", "workspace_name", settings.workspace_name, (v) => setSettings({ ...settings, workspace_name: v }), "text", true)}
                {field("Administrator Name", "admin_name", settings.admin_name, (v) => setSettings({ ...settings, admin_name: v }), "text", true)}
                {field("Email Address", "email", settings.email, (v) => setSettings({ ...settings, email: v }), "email")}
                <label className="settings-toggle">
                  <input type="checkbox" checked={settings.notifications_enabled} onChange={(e) => setSettings({ ...settings, notifications_enabled: e.target.checked })} />
                  Enable workspace notifications
                </label>
                <button className="primary-button form-submit" disabled={saving}>{saving ? "Saving..." : "Save Settings"}</button>
              </form>
            </div>
          </section>
        )}

        {/* AI VOICE AGENT */}

{page === "AI Voice Agent" && (
  <VoiceAgent />
)}

        <footer className="footer">
          <span>© 2026 VoxCRM AI. All rights reserved.</span>
          <span>Built with intelligence ✧</span>
        </footer>
      </main>
    </div>
  );
}

export default App;
