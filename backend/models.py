
from sqlalchemy import (
    Column, Integer, String, DateTime, ForeignKey, Boolean, Text
)
from sqlalchemy.sql import func
from database import Base


class Lead(Base):
    __tablename__ = "leads"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=True)
    phone = Column(String(20), nullable=True)
    company = Column(String(150), nullable=True)
    status = Column(String(50), default="New")
    source = Column(String(100), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    source_lead_id = Column(
        Integer,
        ForeignKey("leads.id", ondelete="SET NULL"),
        unique=True,
        nullable=True
    )
    name = Column(String(100), nullable=False)
    email = Column(String(150), nullable=True)
    phone = Column(String(20), nullable=True)
    company = Column(String(150), nullable=True)
    customer_status = Column(String(50), default="Active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Call(Base):
    __tablename__ = "calls"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(
        Integer, ForeignKey("leads.id", ondelete="SET NULL"), nullable=True
    )
    customer_id = Column(
        Integer, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True
    )
    contact_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    call_type = Column(String(30), default="Outbound")
    duration_seconds = Column(Integer, default=0)
    outcome = Column(String(50), default="Answered")
    notes = Column(Text, nullable=True)
    called_at = Column(DateTime(timezone=True), server_default=func.now())


class FollowUp(Base):
    __tablename__ = "follow_ups"

    id = Column(Integer, primary_key=True, index=True)
    lead_id = Column(
        Integer, ForeignKey("leads.id", ondelete="SET NULL"), nullable=True
    )
    customer_id = Column(
        Integer, ForeignKey("customers.id", ondelete="SET NULL"), nullable=True
    )
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=False)
    priority = Column(String(30), default="Medium")
    status = Column(String(30), default="Pending")
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class WorkspaceSetting(Base):
    __tablename__ = "workspace_settings"

    id = Column(Integer, primary_key=True, index=True)
    workspace_name = Column(String(150), default="My Workspace")
    admin_name = Column(String(100), default="Workspace Admin")
    email = Column(String(150), nullable=True)
    notifications_enabled = Column(Boolean, default=True)
    updated_at = Column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now()
    )
