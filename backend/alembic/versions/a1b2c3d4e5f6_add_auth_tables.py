"""add auth tables and permissions

Revision ID: a1b2c3d4e5f6
Revises: 728cf165a2dd
Create Date: 2026-02-17

Non-destructive migration:
- Adds columns to 'users' table (full_name, is_active, permissions, last_login, updated_at)
- Creates 'audit_logs' table
- Seeds a default admin user with ALL permissions
- NEVER touches patients, lab_tests, or medical_reports
"""
from alembic import op
import sqlalchemy as sa
import json

# revision identifiers, used by Alembic.
revision = 'a1b2c3d4e5f6'
down_revision = '728cf165a2dd'
branch_labels = None
depends_on = None

# All permissions granted (for admin seed)
ALL_PERMISSIONS = {
    "can_view_dashboard":  True,
    "can_run_analysis":    True,
    "can_use_chatbot":     True,
    "can_view_reports":    True,
    "can_view_patients":   True,
    "can_create_patients": True,
    "can_edit_patients":   True,
    "can_delete_patients": True,
    "can_view_records":    True,
    "can_manage_users":    True,
    "can_view_audit_logs": True,
    "can_access_admin":    True,
}

DEFAULT_PERMISSIONS = {
    "can_view_dashboard":  True,
    "can_run_analysis":    False,
    "can_use_chatbot":     True,
    "can_view_reports":    False,
    "can_view_patients":   True,
    "can_create_patients": False,
    "can_edit_patients":   False,
    "can_delete_patients": False,
    "can_view_records":    False,
    "can_manage_users":    False,
    "can_view_audit_logs": False,
    "can_access_admin":    False,
}


def _column_exists(table_name, column_name):
    """Check if a column already exists in a table (SQLite compatible)."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    columns = [col["name"] for col in inspector.get_columns(table_name)]
    return column_name in columns


def _table_exists(table_name):
    """Check if a table already exists."""
    bind = op.get_bind()
    inspector = sa.inspect(bind)
    return table_name in inspector.get_table_names()


def upgrade() -> None:
    # ── 0. Clean up leftover temp table from any previous crashed migration ──
    if _table_exists("_alembic_tmp_users"):
        op.execute(sa.text("DROP TABLE _alembic_tmp_users"))

    # ── 1. Add new columns to 'users' (only if they don't already exist) ──
    needed_columns = []
    all_column_defs = [
        ("full_name",    sa.Column("full_name", sa.String(255), nullable=True)),
        ("is_active",    sa.Column("is_active", sa.Integer(), nullable=False, server_default="1")),
        ("permissions",  sa.Column("permissions", sa.Text(), nullable=False,
                                    server_default=json.dumps(DEFAULT_PERMISSIONS))),
        ("last_login",   sa.Column("last_login", sa.DateTime(timezone=True), nullable=True)),
        ("updated_at",   sa.Column("updated_at", sa.DateTime(timezone=True),
                                    server_default=sa.text("CURRENT_TIMESTAMP"), nullable=True)),
    ]

    for col_name, col_obj in all_column_defs:
        if not _column_exists("users", col_name):
            needed_columns.append((col_name, col_obj))

    # Only open batch_alter_table if there are columns to add
    if needed_columns:
        with op.batch_alter_table("users", schema=None) as batch_op:
            for col_name, col_obj in needed_columns:
                batch_op.add_column(col_obj)

    # ── 2. Create 'audit_logs' table (only if it doesn't exist) ──
    if not _table_exists("audit_logs"):
        op.create_table(
            "audit_logs",
            sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
            sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),
            sa.Column("action", sa.String(100), nullable=False),
            sa.Column("resource", sa.String(100), nullable=True),
            sa.Column("resource_id", sa.Integer(), nullable=True),
            sa.Column("details", sa.Text(), nullable=True),
            sa.Column("ip_address", sa.String(45), nullable=True),
            sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("CURRENT_TIMESTAMP")),
        )
        op.create_index("ix_audit_logs_user_id", "audit_logs", ["user_id"])
        op.create_index("ix_audit_logs_action", "audit_logs", ["action"])

    # ── 3. Seed default admin user (INSERT OR IGNORE = safe to re-run) ──
    import bcrypt
    admin_hash = bcrypt.hashpw(b"Admin123!", bcrypt.gensalt(rounds=12)).decode("utf-8")

    op.execute(
        sa.text(
            "INSERT OR IGNORE INTO users (username, email, hashed_password, full_name, role, is_active, permissions) "
            "VALUES (:username, :email, :hashed_password, :full_name, :role, :is_active, :permissions)"
        ).bindparams(
            username="admin",
            email="admin@mediai.local",
            hashed_password=admin_hash,
            full_name="System Administrator",
            role="admin",
            is_active=1,
            permissions=json.dumps(ALL_PERMISSIONS),
        )
    )


def downgrade() -> None:
    # Drop audit_logs table
    if _table_exists("audit_logs"):
        op.drop_index("ix_audit_logs_action", table_name="audit_logs")
        op.drop_index("ix_audit_logs_user_id", table_name="audit_logs")
        op.drop_table("audit_logs")

    # Remove added columns from users (SQLite batch mode)
    with op.batch_alter_table("users", schema=None) as batch_op:
        for col_name in ["updated_at", "last_login", "permissions", "is_active", "full_name"]:
            if _column_exists("users", col_name):
                batch_op.drop_column(col_name)

