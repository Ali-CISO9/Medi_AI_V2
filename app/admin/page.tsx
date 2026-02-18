"use client"

import React, { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { DashboardLayout } from "@/components/dashboard-layout"
import { AuthGuard } from "@/components/auth-guard"
import { useAuth, type UserPermissions } from "@/lib/auth-context"
import { apiFetch } from "@/lib/utils"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    BarChart3,
    Users,
    ClipboardList,
    Shield,
    Stethoscope,
    Activity,
    UserPlus,
    Pencil,
    Ban,
    Loader2,
    Check,
    Eye,
    EyeOff,
} from "lucide-react"
import { toast } from "sonner"

// ─────────────────────────────────────────────────────────
// Permission Groups for the Toggle UI
// ─────────────────────────────────────────────────────────
const PERMISSION_GROUPS = [
    {
        label: "General",
        icon: <Activity className="h-4 w-4 text-primary" />,
        permissions: [
            { key: "can_view_dashboard", label: "View Dashboard" },
        ],
    },
    {
        label: "Clinical",
        icon: <Stethoscope className="h-4 w-4 text-primary" />,
        permissions: [
            { key: "can_run_analysis", label: "Run AI Analysis" },
            { key: "can_use_chatbot", label: "Use Medical Chatbot" },
            { key: "can_view_reports", label: "View Reports" },
        ],
    },
    {
        label: "Patient Data",
        icon: <Users className="h-4 w-4 text-primary" />,
        permissions: [
            { key: "can_view_patients", label: "View Patients" },
            { key: "can_create_patients", label: "Create Patients" },
            { key: "can_edit_patients", label: "Edit Patients" },
            { key: "can_delete_patients", label: "Delete Patients" },
            { key: "can_view_records", label: "View Medical Records" },
        ],
    },
    {
        label: "Administration",
        icon: <Shield className="h-4 w-4 text-primary" />,
        permissions: [
            { key: "can_manage_users", label: "Manage Users" },
            { key: "can_view_audit_logs", label: "View Audit Logs" },
            { key: "can_access_admin", label: "Access Admin Panel" },
        ],
    },
]

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface AdminUser {
    id: number
    username: string
    email: string
    fullName: string | null
    role: string
    isActive: boolean
    permissions: Record<string, boolean>
    lastLogin: string | null
    createdAt: string | null
}

interface Stats {
    totalUsers: number
    activeUsers: number
    totalPatients: number
    totalAnalyses: number
    recentLogins: Array<{ username: string; timestamp: string; ip: string }>
}

interface AuditLogEntry {
    id: number
    userId: number
    username: string
    action: string
    resource: string | null
    resourceId: number | null
    details: string | null
    ipAddress: string | null
    createdAt: string | null
}

interface AdminPatient {
    id: number
    name: string
    patient_id: string
    status: string
    email: string | null
    phone: string | null
    doctor_id: number | null
    doctor_username: string | null
    doctor_full_name: string | null
    created_at: string | null
}

// ─────────────────────────────────────────────────────────
// Admin Page
// ─────────────────────────────────────────────────────────
export default function AdminPage() {
    return (
        <AuthGuard>
            <AdminPageContent />
        </AuthGuard>
    )
}

function AdminPageContent() {
    const { hasPermission } = useAuth()
    const router = useRouter()

    // Redirect if no admin access (only runs AFTER AuthGuard confirms user is loaded)
    useEffect(() => {
        if (!hasPermission("can_access_admin")) {
            router.push("/")
        }
    }, [hasPermission, router])

    if (!hasPermission("can_access_admin")) return null

    return (
        <DashboardLayout>
            <div className="h-full flex flex-col">
                <div className="mb-4">
                    <h1 className="text-2xl font-bold gradient-text">Admin Dashboard</h1>
                    <p className="text-sm text-muted-foreground">Manage users, permissions, and system activity</p>
                </div>

                <Tabs defaultValue="overview" className="flex-1 flex flex-col">
                    <TabsList className="grid w-full grid-cols-4 rounded-2xl bg-white/60 backdrop-blur-xl border border-white/30 p-1.5 shadow-lg">
                        <TabsTrigger value="overview" className="rounded-xl flex items-center gap-1.5 text-xs px-3 py-2.5 data-[state=active]:bg-gradient-to-br data-[state=active]:from-blue-500 data-[state=active]:to-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                            <BarChart3 className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline font-medium">Overview</span>
                        </TabsTrigger>
                        <TabsTrigger value="users" className="rounded-xl flex items-center gap-1.5 text-xs px-3 py-2.5 data-[state=active]:bg-gradient-to-br data-[state=active]:from-emerald-500 data-[state=active]:to-green-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                            <Users className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline font-medium">User Management</span>
                        </TabsTrigger>
                        <TabsTrigger value="patients" className="rounded-xl flex items-center gap-1.5 text-xs px-3 py-2.5 data-[state=active]:bg-gradient-to-br data-[state=active]:from-cyan-500 data-[state=active]:to-teal-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                            <Stethoscope className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline font-medium">Patients</span>
                        </TabsTrigger>
                        <TabsTrigger value="audit" className="rounded-xl flex items-center gap-1.5 text-xs px-3 py-2.5 data-[state=active]:bg-gradient-to-br data-[state=active]:from-purple-500 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all">
                            <ClipboardList className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline font-medium">Audit Logs</span>
                        </TabsTrigger>
                    </TabsList>

                    <div className="flex-1 mt-4">
                        <TabsContent value="overview"><OverviewTab /></TabsContent>
                        <TabsContent value="users"><UsersTab /></TabsContent>
                        <TabsContent value="patients"><PatientsTab /></TabsContent>
                        <TabsContent value="audit"><AuditTab /></TabsContent>
                    </div>
                </Tabs>
            </div>
        </DashboardLayout>
    )
}

// ─────────────────────────────────────────────────────────
// Overview Tab
// ─────────────────────────────────────────────────────────
function OverviewTab() {
    const [stats, setStats] = useState<Stats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        apiFetch("/admin/stats")
            .then((r) => r.json())
            .then((d) => { if (d.success) setStats(d.stats) })
            .catch(() => toast.error("Failed to load stats"))
            .finally(() => setLoading(false))
    }, [])

    if (loading) return <LoadingSpinner />
    if (!stats) return <p className="text-muted-foreground">Failed to load statistics.</p>

    const cards = [
        { label: "Total Users", value: stats.totalUsers, icon: <Users className="h-6 w-6" />, color: "from-blue-500 to-indigo-600" },
        { label: "Active Users", value: stats.activeUsers, icon: <Check className="h-6 w-6" />, color: "from-emerald-500 to-green-600" },
        { label: "Patients", value: stats.totalPatients, icon: <Stethoscope className="h-6 w-6" />, color: "from-cyan-500 to-teal-600" },
        { label: "Analyses", value: stats.totalAnalyses, icon: <Activity className="h-6 w-6" />, color: "from-purple-500 to-violet-600" },
    ]

    return (
        <div className="space-y-6">
            {/* Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((c) => (
                    <div key={c.label} className="gradient-card rounded-xl p-5 border border-border/30">
                        <div className="flex items-center justify-between mb-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${c.color} text-white shadow-lg`}>
                                {c.icon}
                            </div>
                        </div>
                        <p className="text-2xl font-bold text-foreground">{c.value}</p>
                        <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
                    </div>
                ))}
            </div>

            {/* Recent Logins */}
            <div className="gradient-card rounded-xl p-5 border border-border/30">
                <h3 className="font-semibold text-foreground mb-3">Recent Logins</h3>
                <div className="space-y-2">
                    {stats.recentLogins.length === 0 && (
                        <p className="text-sm text-muted-foreground">No recent login activity.</p>
                    )}
                    {stats.recentLogins.map((login, i) => (
                        <div key={i} className="flex items-center justify-between text-sm py-2 border-b border-border/20 last:border-0">
                            <span className="font-medium text-foreground">{login.username}</span>
                            <div className="flex items-center gap-3 text-muted-foreground">
                                <span className="text-xs">{login.ip || "–"}</span>
                                <span className="text-xs">{login.timestamp ? new Date(login.timestamp).toLocaleString() : "–"}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────
// Users Tab
// ─────────────────────────────────────────────────────────
function UsersTab() {
    const [users, setUsers] = useState<AdminUser[]>([])
    const [loading, setLoading] = useState(true)
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null)
    const [showCreateModal, setShowCreateModal] = useState(false)

    const fetchUsers = useCallback(async () => {
        setLoading(true)
        try {
            const r = await apiFetch("/admin/users")
            const d = await r.json()
            if (d.success) setUsers(d.users)
        } catch {
            toast.error("Failed to load users")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchUsers() }, [fetchUsers])

    const handleDeactivate = async (userId: number) => {
        try {
            const r = await apiFetch(`/admin/users/${userId}`, { method: "DELETE" })
            const d = await r.json()
            if (d.success) {
                toast.success(d.message)
                fetchUsers()
            } else {
                toast.error(d.detail || "Failed")
            }
        } catch {
            toast.error("Failed to deactivate user")
        }
    }

    if (loading) return <LoadingSpinner />

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">All Users ({users.length})</h3>
                <Button
                    className="gradient-primary text-white shadow-md hover:shadow-lg transition-all"
                    onClick={() => setShowCreateModal(true)}
                >
                    <UserPlus className="mr-2 h-4 w-4" /> New User
                </Button>
            </div>

            {/* Users Table */}
            <div className="gradient-card rounded-xl border border-border/30 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/30 bg-muted/30">
                                <th className="text-left p-3 font-medium text-muted-foreground">User</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Role</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                                <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Last Login</th>
                                <th className="text-right p-3 font-medium text-muted-foreground">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u) => (
                                <tr key={u.id} className="border-b border-border/10 hover:bg-muted/10 transition-colors">
                                    <td className="p-3">
                                        <p className="font-medium text-foreground">{u.fullName || u.username}</p>
                                        <p className="text-xs text-muted-foreground">{u.email}</p>
                                    </td>
                                    <td className="p-3">
                                        <Badge variant={u.role === "admin" ? "default" : "secondary"} className="capitalize">
                                            {u.role}
                                        </Badge>
                                    </td>
                                    <td className="p-3">
                                        <Badge variant={u.isActive ? "default" : "destructive"} className="text-xs">
                                            {u.isActive ? "Active" : "Disabled"}
                                        </Badge>
                                    </td>
                                    <td className="p-3 hidden md:table-cell text-xs text-muted-foreground">
                                        {u.lastLogin ? new Date(u.lastLogin).toLocaleString() : "Never"}
                                    </td>
                                    <td className="p-3 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button size="sm" variant="ghost" onClick={() => setEditingUser(u)} title="Edit">
                                                <Pencil className="h-3.5 w-3.5" />
                                            </Button>
                                            {u.isActive && (
                                                <Button size="sm" variant="ghost" className="text-red-500 hover:text-red-700" onClick={() => handleDeactivate(u.id)} title="Deactivate">
                                                    <Ban className="h-3.5 w-3.5" />
                                                </Button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Create Modal */}
            {showCreateModal && (
                <UserFormModal
                    mode="create"
                    onClose={() => setShowCreateModal(false)}
                    onSuccess={() => { setShowCreateModal(false); fetchUsers() }}
                />
            )}

            {/* Edit Modal */}
            {editingUser && (
                <UserFormModal
                    mode="edit"
                    user={editingUser}
                    onClose={() => setEditingUser(null)}
                    onSuccess={() => { setEditingUser(null); fetchUsers() }}
                />
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────
// User Create/Edit Modal with Permission Toggles
// ─────────────────────────────────────────────────────────
interface UserFormModalProps {
    mode: "create" | "edit"
    user?: AdminUser
    onClose: () => void
    onSuccess: () => void
}

function UserFormModal({ mode, user, onClose, onSuccess }: UserFormModalProps) {
    const [username, setUsername] = useState(user?.username || "")
    const [email, setEmail] = useState(user?.email || "")
    const [fullName, setFullName] = useState(user?.fullName || "")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [role, setRole] = useState(user?.role || "user")
    const [isActive, setIsActive] = useState(user?.isActive ?? true)
    const [perms, setPerms] = useState<Record<string, boolean>>(user?.permissions || getDefaultPerms())
    const [saving, setSaving] = useState(false)
    const [presets, setPresets] = useState<Record<string, Record<string, boolean>> | null>(null)

    // Fetch presets
    useEffect(() => {
        apiFetch("/admin/permission-presets")
            .then(r => r.json())
            .then(d => { if (d.success) setPresets(d.presets) })
            .catch(() => { })
    }, [])

    function getDefaultPerms(): Record<string, boolean> {
        const p: Record<string, boolean> = {}
        PERMISSION_GROUPS.forEach(g => g.permissions.forEach(perm => { p[perm.key] = false }))
        p.can_view_dashboard = true
        p.can_use_chatbot = true
        p.can_view_patients = true
        return p
    }

    const applyPreset = (presetName: string) => {
        if (presets && presets[presetName]) {
            setPerms({ ...presets[presetName] })
            if (presetName === "admin") setRole("admin")
            else if (presetName === "doctor") setRole("doctor")
            else setRole("user")
            toast.info(`Applied "${presetName}" preset`)
        }
    }

    const grantAll = () => {
        const p = { ...perms }
        Object.keys(p).forEach(k => { p[k] = true })
        setPerms(p)
    }

    const revokeAll = () => {
        const p = { ...perms }
        Object.keys(p).forEach(k => { p[k] = false })
        setPerms(p)
    }

    const handleSubmit = async () => {
        setSaving(true)
        try {
            if (mode === "create") {
                if (!username || !email || !password) {
                    toast.error("Username, email and password are required")
                    return
                }
                const r = await apiFetch("/auth/register", {
                    method: "POST",
                    body: JSON.stringify({ username, email, password, full_name: fullName || null, role, permissions: perms }),
                })
                const d = await r.json()
                if (d.success) {
                    toast.success("User created successfully")
                    onSuccess()
                } else {
                    toast.error(d.detail || "Failed to create user")
                }
            } else {
                const body: Record<string, any> = { full_name: fullName, email, role, is_active: isActive, permissions: perms }
                if (password) body.password = password
                const r = await apiFetch(`/admin/users/${user!.id}`, {
                    method: "PUT",
                    body: JSON.stringify(body),
                })
                const d = await r.json()
                if (d.success) {
                    toast.success("User updated successfully")
                    onSuccess()
                } else {
                    toast.error(d.detail || "Failed to update user")
                }
            }
        } catch {
            toast.error("An error occurred")
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto gradient-card border-border/30">
                <DialogHeader>
                    <DialogTitle className="gradient-text text-lg">
                        {mode === "create" ? "Create New User" : `Edit: ${user?.username}`}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === "create"
                            ? "Set up a new user account with granular permissions."
                            : "Update user profile and permissions."}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-2">
                    {/* Basic Info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-username" className="text-xs font-medium">Username</Label>
                            <Input id="edit-username" value={username} onChange={(e) => setUsername(e.target.value)} disabled={mode === "edit"} className="h-9 bg-white/50" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-email" className="text-xs font-medium">Email</Label>
                            <Input id="edit-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-9 bg-white/50" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-fullname" className="text-xs font-medium">Full Name</Label>
                            <Input id="edit-fullname" value={fullName} onChange={(e) => setFullName(e.target.value)} className="h-9 bg-white/50" />
                        </div>
                        <div className="space-y-1.5">
                            <Label htmlFor="edit-password" className="text-xs font-medium">
                                {mode === "create" ? "Password" : "New Password (leave blank to keep)"}
                            </Label>
                            <div className="relative">
                                <Input
                                    id="edit-password"
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="h-9 bg-white/50 pr-9"
                                    required={mode === "create"}
                                />
                                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                                    {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Role & Status */}
                    <div className="flex items-center gap-4">
                        <div className="space-y-1.5">
                            <Label className="text-xs font-medium">Role Label</Label>
                            <select value={role} onChange={(e) => setRole(e.target.value)} className="h-9 rounded-md border border-border bg-white/50 px-3 text-sm w-32">
                                <option value="admin">Admin</option>
                                <option value="doctor">Doctor</option>
                                <option value="user">User</option>
                            </select>
                        </div>
                        {mode === "edit" && (
                            <div className="flex items-center gap-2">
                                <Label className="text-xs font-medium">Active</Label>
                                <Switch checked={isActive} onCheckedChange={setIsActive} />
                            </div>
                        )}
                    </div>

                    {/* Permission Toggles */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="font-semibold text-sm text-foreground">Permissions</h4>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" className="text-xs h-7" onClick={grantAll}>
                                    Grant All
                                </Button>
                                <Button size="sm" variant="outline" className="text-xs h-7" onClick={revokeAll}>
                                    Revoke All
                                </Button>
                                {presets?.doctor && (
                                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => applyPreset("doctor")}>
                                        Doctor Preset
                                    </Button>
                                )}
                                {presets?.admin && (
                                    <Button size="sm" variant="outline" className="text-xs h-7" onClick={() => applyPreset("admin")}>
                                        Admin Preset
                                    </Button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {PERMISSION_GROUPS.map((group) => (
                                <div key={group.label} className="rounded-xl border border-border/40 bg-white/40 backdrop-blur-sm p-4">
                                    <div className="flex items-center gap-2 mb-3">
                                        {group.icon}
                                        <h5 className="font-semibold text-xs text-foreground uppercase tracking-wider">{group.label}</h5>
                                    </div>
                                    <div className="space-y-2.5">
                                        {group.permissions.map((p) => (
                                            <div key={p.key} className="flex items-center justify-between">
                                                <Label className="text-xs text-foreground cursor-pointer" htmlFor={`perm-${p.key}`}>{p.label}</Label>
                                                <Switch
                                                    id={`perm-${p.key}`}
                                                    checked={!!perms[p.key]}
                                                    onCheckedChange={(v) => setPerms({ ...perms, [p.key]: v })}
                                                    className="data-[state=checked]:bg-primary"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                    <Button
                        className="gradient-primary text-white"
                        onClick={handleSubmit}
                        disabled={saving}
                    >
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                        {mode === "create" ? "Create User" : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ─────────────────────────────────────────────────────────
// Audit Log Tab
// ─────────────────────────────────────────────────────────
function AuditTab() {
    const { hasPermission } = useAuth()
    const [logs, setLogs] = useState<AuditLogEntry[]>([])
    const [loading, setLoading] = useState(true)
    const [page, setPage] = useState(1)
    const [total, setTotal] = useState(0)
    const perPage = 20

    const fetchLogs = useCallback(async () => {
        setLoading(true)
        try {
            const r = await apiFetch(`/admin/audit-logs?page=${page}&per_page=${perPage}`)
            const d = await r.json()
            if (d.success) {
                setLogs(d.logs)
                setTotal(d.total)
            }
        } catch {
            toast.error("Failed to load audit logs")
        } finally {
            setLoading(false)
        }
    }, [page])

    useEffect(() => { fetchLogs() }, [fetchLogs])

    if (!hasPermission("can_view_audit_logs")) {
        return <p className="text-muted-foreground">You do not have permission to view audit logs.</p>
    }

    if (loading) return <LoadingSpinner />

    const totalPages = Math.ceil(total / perPage)

    return (
        <div className="space-y-4">
            <h3 className="font-semibold text-foreground">System Audit Log ({total} entries)</h3>

            <div className="gradient-card rounded-xl border border-border/30 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/30 bg-muted/30">
                                <th className="text-left p-3 font-medium text-muted-foreground">User</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Action</th>
                                <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Resource</th>
                                <th className="text-left p-3 font-medium text-muted-foreground hidden lg:table-cell">IP</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Time</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log) => (
                                <tr key={log.id} className="border-b border-border/10 hover:bg-muted/10 transition-colors">
                                    <td className="p-3 font-medium text-foreground">{log.username}</td>
                                    <td className="p-3">
                                        <Badge variant="secondary" className="text-xs">{log.action}</Badge>
                                    </td>
                                    <td className="p-3 text-muted-foreground text-xs hidden md:table-cell">{log.resource || "–"}</td>
                                    <td className="p-3 text-muted-foreground text-xs hidden lg:table-cell">{log.ipAddress || "–"}</td>
                                    <td className="p-3 text-xs text-muted-foreground">
                                        {log.createdAt ? new Date(log.createdAt).toLocaleString() : "–"}
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-muted-foreground">No audit log entries found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                    <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                    </span>
                    <Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                        Next
                    </Button>
                </div>
            )}
        </div>
    )
}

// ─────────────────────────────────────────────────────────
// Patients Tab – Assign patients to doctors
// ─────────────────────────────────────────────────────────
function PatientsTab() {
    const [patients, setPatients] = useState<AdminPatient[]>([])
    const [doctors, setDoctors] = useState<AdminUser[]>([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState<number | null>(null)

    const fetchData = useCallback(async () => {
        setLoading(true)
        try {
            const [pRes, uRes] = await Promise.all([
                apiFetch("/admin/patients"),
                apiFetch("/admin/users"),
            ])
            const pData = await pRes.json()
            const uData = await uRes.json()
            if (pData.success) setPatients(pData.patients)
            if (uData.success) setDoctors(uData.users.filter((u: AdminUser) => u.isActive))
        } catch {
            toast.error("Failed to load data")
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => { fetchData() }, [fetchData])

    const handleAssign = async (patientId: number, doctorId: number | null) => {
        setSaving(patientId)
        try {
            const r = await apiFetch(`/admin/patients/${patientId}/assign`, {
                method: "PUT",
                body: JSON.stringify({ doctor_id: doctorId }),
            })
            const d = await r.json()
            if (d.success) {
                toast.success(d.message)
                fetchData()
            } else {
                toast.error(d.error || "Failed to assign")
            }
        } catch {
            toast.error("Failed to assign patient")
        } finally {
            setSaving(null)
        }
    }

    if (loading) return <LoadingSpinner />

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-foreground">All Patients ({patients.length})</h3>
                <p className="text-xs text-muted-foreground">Assign patients to doctor accounts</p>
            </div>

            <div className="gradient-card rounded-xl border border-border/30 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-border/30 bg-muted/30">
                                <th className="text-left p-3 font-medium text-muted-foreground">Patient</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">ID</th>
                                <th className="text-left p-3 font-medium text-muted-foreground hidden md:table-cell">Contact</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
                                <th className="text-left p-3 font-medium text-muted-foreground">Assigned Doctor</th>
                            </tr>
                        </thead>
                        <tbody>
                            {patients.map((p) => (
                                <tr key={p.id} className="border-b border-border/10 hover:bg-muted/10 transition-colors">
                                    <td className="p-3 font-medium text-foreground">{p.name}</td>
                                    <td className="p-3 text-muted-foreground text-xs">{p.patient_id}</td>
                                    <td className="p-3 text-muted-foreground text-xs hidden md:table-cell">
                                        {p.email || p.phone ? (
                                            <div>
                                                {p.email && <div>{p.email}</div>}
                                                {p.phone && <div>{p.phone}</div>}
                                            </div>
                                        ) : "–"}
                                    </td>
                                    <td className="p-3">
                                        <Badge variant={p.status === "active" ? "default" : "secondary"} className="text-xs capitalize">
                                            {p.status}
                                        </Badge>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex items-center gap-2">
                                            <select
                                                value={p.doctor_id ?? ""}
                                                onChange={(e) => {
                                                    const val = e.target.value
                                                    handleAssign(p.id, val ? Number(val) : null)
                                                }}
                                                disabled={saving === p.id}
                                                className="h-8 rounded-md border border-border bg-white/50 px-2 text-xs w-44"
                                            >
                                                <option value="">Unassigned</option>
                                                {doctors.map((d) => (
                                                    <option key={d.id} value={d.id}>
                                                        {d.fullName || d.username} ({d.role})
                                                    </option>
                                                ))}
                                            </select>
                                            {saving === p.id && <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {patients.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-6 text-center text-muted-foreground">No patients found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}

// ─────────────────────────────────────────────────────────
// Shared Loading Spinner
// ─────────────────────────────────────────────────────────
function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
    )
}
