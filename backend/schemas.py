
from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# LEADS

class LeadCreate(BaseModel):
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    status: str = "New"
    source: Optional[str] = None


class LeadUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    status: Optional[str] = None
    source: Optional[str] = None


# CUSTOMERS

class CustomerCreate(BaseModel):
    source_lead_id: Optional[int] = None
    name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    customer_status: str = "Active"


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    company: Optional[str] = None
    customer_status: Optional[str] = None


# CALL HISTORY

class CallCreate(BaseModel):
    lead_id: Optional[int] = None
    customer_id: Optional[int] = None
    contact_name: str
    phone: Optional[str] = None
    call_type: str = "Outbound"
    duration_seconds: int = 0
    outcome: str = "Answered"
    notes: Optional[str] = None
    called_at: Optional[datetime] = None


class CallUpdate(BaseModel):
    lead_id: Optional[int] = None
    customer_id: Optional[int] = None
    contact_name: Optional[str] = None
    phone: Optional[str] = None
    call_type: Optional[str] = None
    duration_seconds: Optional[int] = None
    outcome: Optional[str] = None
    notes: Optional[str] = None
    called_at: Optional[datetime] = None


# FOLLOW-UPS

class FollowUpCreate(BaseModel):
    lead_id: Optional[int] = None
    customer_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    due_date: datetime
    priority: str = "Medium"
    status: str = "Pending"


class FollowUpUpdate(BaseModel):
    lead_id: Optional[int] = None
    customer_id: Optional[int] = None
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[str] = None
    status: Optional[str] = None


# SETTINGS

class WorkspaceSettingUpdate(BaseModel):
    workspace_name: Optional[str] = None
    admin_name: Optional[str] = None
    email: Optional[str] = None
    notifications_enabled: Optional[bool] = None

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# CALL SCHEMAS

class CallCreate(BaseModel):
    lead_id: Optional[int] = None
    customer_id: Optional[int] = None
    contact_name: str
    phone: Optional[str] = None
    call_type: str = "Outbound"
    duration_seconds: int = 0
    outcome: str = "Answered"
    notes: Optional[str] = None


class CallResponse(CallCreate):
    id: int
    called_at: datetime

    class Config:
        from_attributes = True


# FOLLOW-UP SCHEMAS

class FollowUpCreate(BaseModel):
    lead_id: Optional[int] = None
    customer_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    due_date: datetime
    priority: str = "Medium"
    status: str = "Pending"


class FollowUpUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    due_date: Optional[datetime] = None
    priority: Optional[str] = None
    status: Optional[str] = None


class FollowUpResponse(FollowUpCreate):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


# WORKSPACE SETTINGS SCHEMAS

class WorkspaceSettingUpdate(BaseModel):
    workspace_name: Optional[str] = None
    admin_name: Optional[str] = None
    email: Optional[str] = None
    notifications_enabled: Optional[bool] = None


class WorkspaceSettingResponse(BaseModel):
    id: int
    workspace_name: str
    admin_name: str
    email: Optional[str] = None
    notifications_enabled: bool

    class Config:
        from_attributes = True
