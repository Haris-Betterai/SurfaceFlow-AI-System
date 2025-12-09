# SurfaceFlow AI System – Automation Modules Documentation

**Version:** 1.0  
**Date:** December 9, 2025  
**Status:** Draft

---

## Table of Contents

1. [Overview](#1-overview)
2. [Automation Module Framework](#2-automation-module-framework)
3. [Module Registry](#3-module-registry)
4. [Base Module Interface](#4-base-module-interface)
5. [BuilderTrend Hotel Booking (AM-002)](#5-buildertrend-hotel-booking-am-002)
6. [Workflow Execution Engine](#6-workflow-execution-engine)
7. [External Integrations](#7-external-integrations)
8. [Error Handling & Recovery](#8-error-handling--recovery)
9. [Testing Automation Modules](#9-testing-automation-modules)
10. [Creating New Modules](#10-creating-new-modules)

---

## 1. Overview

Automation modules are the core building blocks of the SurfaceFlow AI System. Each module is a **self-contained, pluggable unit** that implements a specific automation workflow.

### Key Principles

| Principle | Description |
|-----------|-------------|
| **Independence** | Each module is isolated; failure in one doesn't affect others |
| **Standardization** | All modules follow the same interface and lifecycle |
| **Configuration-Driven** | Module behavior is configurable without code changes |
| **Audit Trail** | Every action within a module is logged |
| **Writeback Capable** | Modules can update source systems (e.g., Buildertrend) |

### Module Categories

| Category | Examples |
|----------|----------|
| **BuilderTrend Automations** | Hotel Booking, Permit Submission, Document Generation |
| **Salesforce Automations** | Lead Processing, Quote Generation (future) |
| **Internal Automations** | Data Sync, Report Generation (future) |

---

## 2. Automation Module Framework

### 2.1 Module Lifecycle

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   TRIGGER   │───▶│   VALIDATE  │───▶│   EXECUTE   │───▶│  WRITEBACK  │
│             │    │             │    │             │    │             │
│ Extension   │    │ Input check │    │ Workflow    │    │ Update      │
│ sends data  │    │ Permissions │    │ steps       │    │ source      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                            │
                                            ▼
                                   ┌─────────────────┐
                                   │  AUDIT & NOTIFY │
                                   │                 │
                                   │ Log results     │
                                   │ Send alerts     │
                                   └─────────────────┘
```

### 2.2 Module Package Structure

```
portal/app/automations/
├── base.py                     # Base module class
├── registry.py                 # Module registry
├── exceptions.py               # Custom exceptions
└── buildertrend/               # BuilderTrend modules namespace
    ├── __init__.py
    └── hotel_booking/          # AM-002: Hotel Booking
        ├── __init__.py
        ├── module.py           # Main module class
        ├── schemas.py          # Input/output schemas
        ├── workflow.py         # Workflow steps
        ├── services/           # External service integrations
        │   ├── housing.py      # Internal housing check
        │   ├── ota.py          # OTA search
        │   └── sms.py          # SMS notifications
        ├── writeback.py        # Buildertrend writeback logic
        └── tests/
            ├── test_module.py
            └── test_workflow.py
```

---

## 3. Module Registry

### 3.1 Purpose

The Module Registry is a central catalog of all available automation modules. It:
- Tracks which modules are enabled/disabled
- Stores module configuration and version
- Controls access permissions per role
- Provides module discovery for the extension

### 3.2 Registry Schema

```python
# SQLAlchemy model
class ModuleRegistry(Base):
    __tablename__ = "module_registry"
    
    id = Column(Integer, primary_key=True)
    module_id = Column(String(50), unique=True, nullable=False)  # e.g., "AM-002"
    name = Column(String(255), nullable=False)                    # "Hotel Booking"
    description = Column(Text)
    category = Column(String(100))                                # "buildertrend"
    version = Column(String(20), default="1.0.0")
    
    # Status
    is_enabled = Column(Boolean, default=True)
    is_beta = Column(Boolean, default=False)
    
    # Configuration (JSON)
    config = Column(JSON, default={})
    
    # Extension UI config
    ui_config = Column(JSON, default={})
    
    # Required permissions
    required_permissions = Column(JSON, default=[])
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
```

### 3.3 Registry Entry Example

```json
{
  "module_id": "AM-002",
  "name": "Hotel Booking",
  "description": "Automatically book hotels for crews assigned to jobs",
  "category": "buildertrend",
  "version": "1.0.0",
  "is_enabled": true,
  "is_beta": false,
  "config": {
    "max_hotel_distance_miles": 30,
    "nightly_price_cap": 200,
    "internal_housing_radius_miles": 50,
    "approval_timeout_hours": 24,
    "preferred_ota_order": ["internal", "airbnb", "expedia", "kayak"],
    "required_amenities": ["wifi", "parking"]
  },
  "ui_config": {
    "trigger_pages": ["job_detail", "todo_detail"],
    "button_label": "🏨 Book Hotel with AI",
    "button_placement": "job_actions",
    "icon": "hotel"
  },
  "required_permissions": ["automation.hotel_booking.trigger"]
}
```

### 3.4 Registry API

```python
# portal/app/automations/registry.py

class AutomationRegistry:
    _modules: Dict[str, Type[BaseModule]] = {}
    
    @classmethod
    def register(cls, module_id: str):
        """Decorator to register a module class"""
        def decorator(module_class: Type[BaseModule]):
            cls._modules[module_id] = module_class
            return module_class
        return decorator
    
    @classmethod
    def get_module(cls, module_id: str) -> Optional[Type[BaseModule]]:
        """Get module class by ID"""
        return cls._modules.get(module_id)
    
    @classmethod
    def get_enabled_modules(cls, db: Session, user_permissions: List[str]) -> List[dict]:
        """Get all enabled modules user has access to"""
        modules = db.query(ModuleRegistry).filter(
            ModuleRegistry.is_enabled == True
        ).all()
        
        # Filter by permissions
        return [
            m for m in modules
            if cls._user_has_permission(m.required_permissions, user_permissions)
        ]
```

---

## 4. Base Module Interface

### 4.1 Abstract Base Class

```python
# portal/app/automations/base.py

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from pydantic import BaseModel

class BaseModule(ABC):
    """Base class for all automation modules"""
    
    # Module metadata (override in subclass)
    MODULE_ID: str = None
    MODULE_NAME: str = None
    MODULE_VERSION: str = "1.0.0"
    
    def __init__(self, job_id: str, user_id: str, db_session):
        self.job_id = job_id
        self.user_id = user_id
        self.db = db_session
        self.logger = self._setup_logger()
        self.audit = AuditLogger(job_id, self.MODULE_ID)
    
    # ─────────────────────────────────────────────────────────────
    # Abstract Methods (must be implemented by each module)
    # ─────────────────────────────────────────────────────────────
    
    @abstractmethod
    def get_input_schema(self) -> type[BaseModel]:
        """Return the Pydantic schema for input validation"""
        pass
    
    @abstractmethod
    def get_output_schema(self) -> type[BaseModel]:
        """Return the Pydantic schema for output"""
        pass
    
    @abstractmethod
    async def validate(self, input_data: Dict[str, Any]) -> ValidationResult:
        """Validate input data before execution"""
        pass
    
    @abstractmethod
    async def execute(self, input_data: Dict[str, Any]) -> ExecutionResult:
        """Execute the automation workflow"""
        pass
    
    @abstractmethod
    async def writeback(self, result: ExecutionResult) -> WritebackResult:
        """Write results back to source system"""
        pass
    
    # ─────────────────────────────────────────────────────────────
    # Common Methods (inherited by all modules)
    # ─────────────────────────────────────────────────────────────
    
    async def run(self, input_data: Dict[str, Any]) -> ModuleResult:
        """Main entry point - orchestrates the full lifecycle"""
        try:
            # 1. Validate
            self.audit.log("validation_started", input_data)
            validation = await self.validate(input_data)
            if not validation.is_valid:
                self.audit.log("validation_failed", validation.errors)
                return ModuleResult(
                    success=False,
                    status="validation_failed",
                    errors=validation.errors
                )
            
            # 2. Execute
            self.audit.log("execution_started")
            result = await self.execute(input_data)
            
            if not result.success:
                self.audit.log("execution_failed", result.error)
                return ModuleResult(
                    success=False,
                    status="execution_failed",
                    error=result.error
                )
            
            # 3. Writeback
            self.audit.log("writeback_started")
            writeback = await self.writeback(result)
            self.audit.log("writeback_completed", writeback.summary)
            
            # 4. Complete
            self.audit.log("completed", result.output)
            return ModuleResult(
                success=True,
                status="completed",
                output=result.output,
                writeback_summary=writeback.summary
            )
            
        except Exception as e:
            self.audit.log("error", str(e))
            return ModuleResult(
                success=False,
                status="error",
                error=str(e)
            )
    
    def get_config(self, key: str, default: Any = None) -> Any:
        """Get module configuration from registry"""
        registry = self.db.query(ModuleRegistry).filter(
            ModuleRegistry.module_id == self.MODULE_ID
        ).first()
        return registry.config.get(key, default) if registry else default
```

### 4.2 Result Types

```python
# portal/app/automations/base.py

from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class ValidationResult(BaseModel):
    is_valid: bool
    errors: List[Dict[str, str]] = []

class ExecutionResult(BaseModel):
    success: bool
    output: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    requires_approval: bool = False
    approval_data: Optional[Dict[str, Any]] = None

class WritebackResult(BaseModel):
    success: bool
    summary: Dict[str, Any] = {}
    failed_operations: List[str] = []

class ModuleResult(BaseModel):
    success: bool
    status: str  # validation_failed, execution_failed, completed, error
    output: Optional[Dict[str, Any]] = None
    errors: Optional[List[Dict[str, str]]] = None
    error: Optional[str] = None
    writeback_summary: Optional[Dict[str, Any]] = None
```

---

## 5. BuilderTrend Hotel Booking (AM-002)

### 5.1 Module Overview

| Attribute | Value |
|-----------|-------|
| **Module ID** | AM-002 |
| **Name** | Hotel Booking |
| **Category** | BuilderTrend |
| **Trigger Source** | Chrome Extension (Buildertrend Job Detail page) |
| **Approval Required** | Yes (SMS to PM/Super) |
| **Writeback Target** | Buildertrend (Daily Log, Files, Cost Codes) |

### 5.2 User Story

> As a **Foreman** working in Buildertrend,  
> I want to **book hotels for my crew with one click**,  
> So that **I don't have to manually search hotels and copy data between systems**.

### 5.3 Input Schema

```python
# portal/app/automations/buildertrend/hotel_booking/schemas.py

from pydantic import BaseModel, Field, validator
from typing import Optional, List
from datetime import date

class AddressSchema(BaseModel):
    street: str
    city: str
    state: str
    zip: str
    
    @validator('state')
    def validate_state(cls, v):
        if len(v) != 2:
            raise ValueError('State must be 2-letter code')
        return v.upper()

class CrewMemberSchema(BaseModel):
    name: str
    role: Optional[str] = None

class HotelBookingInput(BaseModel):
    """Input data for Hotel Booking automation"""
    
    # Job identification
    job_id: str = Field(..., description="Buildertrend Job ID")
    job_name: str = Field(..., description="Buildertrend Job Name")
    job_number: Optional[str] = Field(None, description="Buildertrend Job Number")
    
    # Location
    jobsite_address: AddressSchema = Field(..., description="Jobsite address")
    
    # Crew
    crew_size: int = Field(..., ge=1, le=50, description="Number of crew members")
    crew_members: Optional[List[CrewMemberSchema]] = Field(None, description="Crew member details")
    
    # Dates
    check_in_date: date = Field(..., description="Hotel check-in date")
    check_out_date: date = Field(..., description="Hotel check-out date")
    
    # Preferences (optional)
    max_price_per_night: Optional[float] = Field(None, ge=0, description="Max nightly rate")
    max_distance_miles: Optional[float] = Field(None, ge=0, description="Max distance from jobsite")
    required_amenities: Optional[List[str]] = Field(None, description="Required amenities")
    
    # Approval
    approver_phone: Optional[str] = Field(None, description="Phone for SMS approval")
    approver_user_id: Optional[str] = Field(None, description="Approver's user ID")
    
    @validator('check_out_date')
    def check_out_after_check_in(cls, v, values):
        if 'check_in_date' in values and v <= values['check_in_date']:
            raise ValueError('Check-out date must be after check-in date')
        return v
    
    class Config:
        schema_extra = {
            "example": {
                "job_id": "12345",
                "job_name": "Smith Residence Remodel",
                "job_number": "2025-001",
                "jobsite_address": {
                    "street": "123 Main St",
                    "city": "Phoenix",
                    "state": "AZ",
                    "zip": "85001"
                },
                "crew_size": 4,
                "check_in_date": "2025-01-10",
                "check_out_date": "2025-01-15",
                "approver_phone": "+15551234567"
            }
        }
```

### 5.4 Output Schema

```python
# portal/app/automations/buildertrend/hotel_booking/schemas.py

class HotelDetails(BaseModel):
    name: str
    address: AddressSchema
    phone: Optional[str]
    distance_miles: float
    rating: Optional[float]
    amenities: List[str]

class BookingDetails(BaseModel):
    confirmation_number: str
    hotel: HotelDetails
    check_in_date: date
    check_out_date: date
    nights: int
    rooms: int
    nightly_rate: float
    total_cost: float
    booking_source: str  # "internal", "airbnb", "expedia", etc.
    cancellation_policy: Optional[str]
    pdf_confirmation_url: Optional[str]

class HotelBookingOutput(BaseModel):
    """Output data from Hotel Booking automation"""
    
    booking: BookingDetails
    
    # Writeback references
    buildertrend_daily_log_id: Optional[str]
    buildertrend_file_id: Optional[str]
    cost_code_updated: bool
    
    # Approval info
    approved_by: str
    approved_at: str
    approval_method: str  # "sms", "app", "auto"
```

### 5.5 Workflow Steps

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    HOTEL BOOKING WORKFLOW (AM-002)                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────┐                                                        │
│  │ 1. VALIDATE │                                                        │
│  │    INPUT    │                                                        │
│  └──────┬──────┘                                                        │
│         │                                                               │
│         ▼                                                               │
│  ┌─────────────┐    ┌─────────────────────────────────────────────┐     │
│  │ 2. CHECK    │    │ If internal property available within       │     │
│  │    INTERNAL │───▶│ configured radius (e.g., 50 miles):         │     │
│  │    HOUSING  │    │ • Flag as preferred option                  │     │
│  └──────┬──────┘    │ • May skip OTA search                       │     │
│         │           └─────────────────────────────────────────────┘     │
│         ▼                                                               │
│  ┌─────────────┐    ┌─────────────────────────────────────────────┐     │
│  │ 3. SEARCH   │    │ Query multiple OTAs in parallel:            │     │
│  │    OTAs     │───▶│ • Airbnb, Expedia, Kayak                    │     │
│  │             │    │ • Apply filters (price, distance, amenities)│     │
│  └──────┬──────┘    └─────────────────────────────────────────────┘     │
│         │                                                               │
│         ▼                                                               │
│  ┌─────────────┐    ┌─────────────────────────────────────────────┐     │
│  │ 4. RANK &   │    │ Score options by:                           │     │
│  │    SELECT   │───▶│ • Price, distance, rating                   │     │
│  │    TOP 3    │    │ • Policy, amenities                         │     │
│  └──────┬──────┘    └─────────────────────────────────────────────┘     │
│         │                                                               │
│         ▼                                                               │
│  ┌─────────────┐    ┌─────────────────────────────────────────────┐     │
│  │ 5. REQUEST  │    │ Send SMS to approver with:                  │     │
│  │    APPROVAL │───▶│ • Job name, crew size, dates                │     │
│  │    (SMS)    │    │ • Top option summary, Y/N links             │     │
│  └──────┬──────┘    └─────────────────────────────────────────────┘     │
│         │                                                               │
│         ├───────────────────────────────────────────┐                   │
│         ▼                                           ▼                   │
│  ┌─────────────┐                           ┌─────────────┐              │
│  │ APPROVED    │                           │ REJECTED    │              │
│  └──────┬──────┘                           └──────┬──────┘              │
│         │                                         │                     │
│         ▼                                         ▼                     │
│  ┌─────────────┐                           ┌─────────────┐              │
│  │ 6. BOOK     │                           │ NOTIFY USER │              │
│  │    HOTEL    │                           │ & LOG       │              │
│  └──────┬──────┘                           └─────────────┘              │
│         │                                                               │
│         ▼                                                               │
│  ┌─────────────┐    ┌─────────────────────────────────────────────┐     │
│  │ 7. WRITEBACK│    │ Update Buildertrend:                        │     │
│  │    TO BT    │───▶│ • Add Daily Log entry                       │     │
│  │             │    │ • Attach PDF confirmation                   │     │
│  │             │    │ • Update cost codes                         │     │
│  └──────┬──────┘    └─────────────────────────────────────────────┘     │
│         │                                                               │
│         ▼                                                               │
│  ┌─────────────┐                                                        │
│  │ 8. SYNC TO  │                                                        │
│  │  ACCOUNTING │                                                        │
│  └─────────────┘                                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 5.6 Module Implementation

```python
# portal/app/automations/buildertrend/hotel_booking/module.py

from app.automations.base import BaseModule, ValidationResult, ExecutionResult, WritebackResult
from app.automations.registry import AutomationRegistry
from .schemas import HotelBookingInput, HotelBookingOutput
from .services.housing import InternalHousingService
from .services.ota import OTASearchService
from .services.sms import SMSApprovalService
from .writeback import BuildertrendWriteback

@AutomationRegistry.register("AM-002")
class HotelBookingModule(BaseModule):
    """Hotel Booking Automation for Buildertrend"""
    
    MODULE_ID = "AM-002"
    MODULE_NAME = "Hotel Booking"
    MODULE_VERSION = "1.0.0"
    
    def __init__(self, job_id: str, user_id: str, db_session):
        super().__init__(job_id, user_id, db_session)
        self.housing_service = InternalHousingService(db_session)
        self.ota_service = OTASearchService(db_session)
        self.sms_service = SMSApprovalService()
        self.writeback_service = BuildertrendWriteback(db_session)
    
    def get_input_schema(self):
        return HotelBookingInput
    
    def get_output_schema(self):
        return HotelBookingOutput
    
    async def validate(self, input_data: dict) -> ValidationResult:
        """Validate hotel booking input"""
        errors = []
        
        try:
            # Parse and validate with Pydantic
            validated = HotelBookingInput(**input_data)
        except Exception as e:
            return ValidationResult(is_valid=False, errors=[{"field": "input", "message": str(e)}])
        
        # Additional business validation
        if validated.crew_size > 20 and not validated.approver_phone:
            errors.append({
                "field": "approver_phone",
                "message": "Approver phone required for crew size > 20"
            })
        
        # Check if dates are in the future
        from datetime import date
        if validated.check_in_date < date.today():
            errors.append({
                "field": "check_in_date",
                "message": "Check-in date must be in the future"
            })
        
        return ValidationResult(is_valid=len(errors) == 0, errors=errors)
    
    async def execute(self, input_data: dict) -> ExecutionResult:
        """Execute hotel booking workflow"""
        data = HotelBookingInput(**input_data)
        
        # Step 1: Check internal housing
        self.audit.log("checking_internal_housing", {
            "address": data.jobsite_address.dict(),
            "radius": self.get_config("internal_housing_radius_miles", 50)
        })
        
        internal_options = await self.housing_service.find_available(
            address=data.jobsite_address,
            check_in=data.check_in_date,
            check_out=data.check_out_date,
            crew_size=data.crew_size,
            radius_miles=self.get_config("internal_housing_radius_miles", 50)
        )
        
        # Step 2: Search OTAs (if no internal or config says search anyway)
        ota_options = []
        if not internal_options or self.get_config("always_search_ota", False):
            self.audit.log("searching_ota")
            ota_options = await self.ota_service.search(
                address=data.jobsite_address,
                check_in=data.check_in_date,
                check_out=data.check_out_date,
                crew_size=data.crew_size,
                max_price=data.max_price_per_night or self.get_config("nightly_price_cap", 200),
                max_distance=data.max_distance_miles or self.get_config("max_hotel_distance_miles", 30),
                amenities=data.required_amenities or self.get_config("required_amenities", [])
            )
        
        # Step 3: Rank and select top options
        all_options = internal_options + ota_options
        if not all_options:
            return ExecutionResult(
                success=False,
                error="No hotels found matching criteria"
            )
        
        ranked_options = self._rank_options(all_options, data)
        top_options = ranked_options[:3]
        
        self.audit.log("options_found", {
            "total": len(all_options),
            "top_3": [o.name for o in top_options]
        })
        
        # Step 4: Request approval
        self.audit.log("requesting_approval", {
            "approver_phone": data.approver_phone,
            "top_option": top_options[0].name
        })
        
        approval_request = await self.sms_service.request_approval(
            job_id=self.job_id,
            job_name=data.job_name,
            crew_size=data.crew_size,
            dates=f"{data.check_in_date} to {data.check_out_date}",
            top_option=top_options[0],
            phone=data.approver_phone
        )
        
        # Return pending approval state
        return ExecutionResult(
            success=True,
            requires_approval=True,
            approval_data={
                "approval_request_id": approval_request.id,
                "options": [o.dict() for o in top_options],
                "selected_option": top_options[0].dict()
            }
        )
    
    async def on_approval_received(self, approval_response: dict) -> ExecutionResult:
        """Handle approval response (called via webhook)"""
        if not approval_response.get("approved"):
            return ExecutionResult(
                success=False,
                error=f"Booking rejected: {approval_response.get('reason', 'No reason provided')}"
            )
        
        selected_option = approval_response["selected_option"]
        
        # Step 5: Book the hotel
        self.audit.log("booking_hotel", {"hotel": selected_option["name"]})
        
        booking = await self.ota_service.book(
            option=selected_option,
            job_id=self.job_id
        )
        
        self.audit.log("booking_completed", {
            "confirmation": booking.confirmation_number,
            "total_cost": booking.total_cost
        })
        
        return ExecutionResult(
            success=True,
            output={
                "booking": booking.dict(),
                "approved_by": approval_response["approved_by"],
                "approved_at": approval_response["approved_at"],
                "approval_method": "sms"
            }
        )
    
    async def writeback(self, result: ExecutionResult) -> WritebackResult:
        """Write results back to Buildertrend"""
        booking = result.output["booking"]
        
        wb_results = await self.writeback_service.execute(
            job_id=result.output.get("bt_job_id"),
            operations=[
                {
                    "type": "daily_log",
                    "data": {
                        "title": f"Hotel Booked: {booking['hotel']['name']}",
                        "content": self._format_booking_log(booking)
                    }
                },
                {
                    "type": "file_attachment",
                    "data": {
                        "url": booking.get("pdf_confirmation_url"),
                        "name": f"Hotel_Confirmation_{booking['confirmation_number']}.pdf"
                    }
                },
                {
                    "type": "cost_code",
                    "data": {
                        "code": "TRAVEL-HOTEL",
                        "amount": booking["total_cost"],
                        "description": f"Hotel: {booking['hotel']['name']}"
                    }
                }
            ]
        )
        
        return WritebackResult(
            success=all(r["success"] for r in wb_results),
            summary={
                "daily_log_id": wb_results[0].get("id"),
                "file_id": wb_results[1].get("id"),
                "cost_code_updated": wb_results[2].get("success")
            },
            failed_operations=[r["operation"] for r in wb_results if not r["success"]]
        )
    
    def _rank_options(self, options: list, input_data: HotelBookingInput) -> list:
        """Rank hotel options by score"""
        def score(option):
            s = 0
            # Prefer internal housing
            if option.source == "internal":
                s += 100
            # Lower price is better
            s -= option.nightly_rate * 0.5
            # Closer is better
            s -= option.distance_miles * 2
            # Higher rating is better
            s += (option.rating or 3) * 10
            return s
        
        return sorted(options, key=score, reverse=True)
    
    def _format_booking_log(self, booking: dict) -> str:
        """Format booking details for daily log"""
        return f"""
Hotel Booking Confirmation
==========================
Hotel: {booking['hotel']['name']}
Address: {booking['hotel']['address']['street']}, {booking['hotel']['address']['city']}
Confirmation #: {booking['confirmation_number']}
Check-in: {booking['check_in_date']}
Check-out: {booking['check_out_date']}
Nights: {booking['nights']}
Rooms: {booking['rooms']}
Total Cost: ${booking['total_cost']:.2f}
Booked via: SurfaceFlow AI (AM-002)
        """.strip()
```

### 5.7 Mock Data for Testing

```python
# portal/app/automations/buildertrend/hotel_booking/mock_data.py

MOCK_INTERNAL_HOUSING = [
    {
        "id": "IH-001",
        "name": "Company Apartment A",
        "address": {
            "street": "456 Corporate Dr",
            "city": "Phoenix",
            "state": "AZ",
            "zip": "85004"
        },
        "capacity": 6,
        "distance_miles": 12.5,
        "nightly_rate": 0,  # Free internal housing
        "amenities": ["wifi", "parking", "kitchen", "laundry"],
        "source": "internal"
    },
    {
        "id": "IH-002",
        "name": "Company House B",
        "address": {
            "street": "789 Rental Ln",
            "city": "Tempe",
            "state": "AZ",
            "zip": "85281"
        },
        "capacity": 8,
        "distance_miles": 18.3,
        "nightly_rate": 0,
        "amenities": ["wifi", "parking", "kitchen", "pool"],
        "source": "internal"
    }
]

MOCK_OTA_RESULTS = [
    {
        "id": "EXP-12345",
        "name": "Hyatt Place Phoenix",
        "address": {
            "street": "123 Hotel Blvd",
            "city": "Phoenix",
            "state": "AZ",
            "zip": "85001"
        },
        "phone": "+16025551234",
        "distance_miles": 5.2,
        "rating": 4.2,
        "nightly_rate": 145.00,
        "amenities": ["wifi", "parking", "breakfast", "pool"],
        "source": "expedia",
        "cancellation_policy": "Free cancellation until 24 hours before check-in"
    },
    {
        "id": "AIR-67890",
        "name": "Downtown Phoenix Loft",
        "address": {
            "street": "200 N Central Ave",
            "city": "Phoenix",
            "state": "AZ",
            "zip": "85004"
        },
        "phone": None,
        "distance_miles": 3.8,
        "rating": 4.5,
        "nightly_rate": 175.00,
        "amenities": ["wifi", "parking", "kitchen"],
        "source": "airbnb",
        "cancellation_policy": "Moderate - 50% refund up to 5 days before"
    },
    {
        "id": "KAY-11111",
        "name": "Holiday Inn Express Phoenix",
        "address": {
            "street": "500 E Van Buren St",
            "city": "Phoenix",
            "state": "AZ",
            "zip": "85008"
        },
        "phone": "+16025559999",
        "distance_miles": 7.1,
        "rating": 3.8,
        "nightly_rate": 119.00,
        "amenities": ["wifi", "parking", "breakfast"],
        "source": "kayak",
        "cancellation_policy": "Non-refundable"
    }
]

MOCK_BOOKING_RESPONSE = {
    "confirmation_number": "HB-2025-001234",
    "hotel": MOCK_OTA_RESULTS[0],
    "check_in_date": "2025-01-10",
    "check_out_date": "2025-01-15",
    "nights": 5,
    "rooms": 2,
    "nightly_rate": 145.00,
    "total_cost": 1450.00,
    "booking_source": "expedia",
    "cancellation_policy": "Free cancellation until 24 hours before check-in",
    "pdf_confirmation_url": "https://storage.surfaceflow.ai/confirmations/HB-2025-001234.pdf"
}

MOCK_BUILDERTREND_JOBS = [
    {
        "job_id": "12345",
        "job_name": "Smith Residence Remodel",
        "job_number": "2025-001",
        "address": {
            "street": "123 Main St",
            "city": "Phoenix",
            "state": "AZ",
            "zip": "85001"
        },
        "crew_size": 4,
        "crew_members": [
            {"name": "John Doe", "role": "Foreman"},
            {"name": "Jane Smith", "role": "Electrician"},
            {"name": "Bob Johnson", "role": "Plumber"},
            {"name": "Alice Brown", "role": "Carpenter"}
        ],
        "pm_phone": "+15551234567",
        "start_date": "2025-01-10",
        "end_date": "2025-02-28"
    },
    {
        "job_id": "12346",
        "job_name": "Johnson New Build",
        "job_number": "2025-002",
        "address": {
            "street": "456 Oak Ave",
            "city": "Scottsdale",
            "state": "AZ",
            "zip": "85251"
        },
        "crew_size": 8,
        "crew_members": [],
        "pm_phone": "+15559876543",
        "start_date": "2025-02-01",
        "end_date": "2025-06-30"
    }
]
```

---

## 6. Workflow Execution Engine

### 6.1 Celery Task Integration

```python
# portal/app/tasks/automation_tasks.py

from celery import shared_task
from app.automations.registry import AutomationRegistry
from app.db.session import get_db

@shared_task(bind=True, max_retries=3)
def run_automation(self, job_id: str, module_id: str, user_id: str, input_data: dict):
    """Execute automation as a background task"""
    try:
        db = next(get_db())
        
        # Get module class from registry
        module_class = AutomationRegistry.get_module(module_id)
        if not module_class:
            raise ValueError(f"Module {module_id} not found")
        
        # Instantiate and run
        module = module_class(job_id, user_id, db)
        result = asyncio.run(module.run(input_data))
        
        # Update job record
        update_job_status(db, job_id, result)
        
        return result.dict()
        
    except Exception as e:
        # Retry on transient errors
        if self.request.retries < self.max_retries:
            raise self.retry(exc=e, countdown=60 * (self.request.retries + 1))
        
        # Mark as failed after all retries
        update_job_status(db, job_id, ModuleResult(
            success=False,
            status="error",
            error=str(e)
        ))
        raise

@shared_task
def process_approval_webhook(job_id: str, approval_data: dict):
    """Process approval webhook from SMS provider"""
    db = next(get_db())
    job = get_job(db, job_id)
    
    module_class = AutomationRegistry.get_module(job.module_id)
    module = module_class(job_id, job.user_id, db)
    
    # Continue workflow after approval
    result = asyncio.run(module.on_approval_received(approval_data))
    
    if result.success:
        # Execute writeback
        writeback_result = asyncio.run(module.writeback(result))
        update_job_status(db, job_id, result, writeback_result)
    else:
        update_job_status(db, job_id, result)
```

### 6.2 Job Status Tracking

```python
# portal/app/models/automation_job.py

class AutomationJob(Base):
    __tablename__ = "automation_jobs"
    
    id = Column(Integer, primary_key=True)
    job_id = Column(String(36), unique=True, default=lambda: str(uuid4()))
    module_id = Column(String(50), ForeignKey("module_registry.module_id"))
    user_id = Column(String(36), ForeignKey("users.id"))
    
    # Status
    status = Column(String(50), default="pending")
    # pending, running, approval_required, executing, completed, failed, cancelled
    
    # Data (JSON)
    input_data = Column(JSON)
    output_data = Column(JSON)
    error_message = Column(Text)
    
    # Approval
    approval_requested_at = Column(DateTime)
    approval_received_at = Column(DateTime)
    approved_by = Column(String(255))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    
    # Relationships
    audit_logs = relationship("AuditLog", back_populates="job")
    artifacts = relationship("JobArtifact", back_populates="job")
```

---

## 7. External Integrations

### 7.1 Integration Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                       EXTERNAL INTEGRATIONS                             │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────┐                                                    │
│  │  Integration    │                                                    │
│  │  Base Class     │                                                    │
│  └────────┬────────┘                                                    │
│           │                                                             │
│           ├───────────────┬───────────────┬───────────────┐             │
│           ▼               ▼               ▼               ▼             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │ Buildertrend│  │    OTA      │  │   Twilio    │  │ Accounting  │     │
│  │ Integration │  │ Integration │  │ Integration │  │ Integration │     │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘     │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### 7.2 Integration Base Class

```python
# portal/app/integrations/base.py

from abc import ABC, abstractmethod
import httpx
from tenacity import retry, stop_after_attempt, wait_exponential

class BaseIntegration(ABC):
    """Base class for external service integrations"""
    
    def __init__(self, config: dict):
        self.config = config
        self.base_url = config.get("base_url")
        self.api_key = config.get("api_key")
        self.timeout = config.get("timeout", 30)
    
    @retry(stop=stop_after_attempt(3), wait=wait_exponential(min=1, max=10))
    async def _request(self, method: str, endpoint: str, **kwargs):
        """Make HTTP request with retry logic"""
        async with httpx.AsyncClient(timeout=self.timeout) as client:
            response = await client.request(
                method,
                f"{self.base_url}{endpoint}",
                headers=self._get_headers(),
                **kwargs
            )
            response.raise_for_status()
            return response.json()
    
    @abstractmethod
    def _get_headers(self) -> dict:
        """Return headers for API requests"""
        pass
    
    @abstractmethod
    async def health_check(self) -> bool:
        """Check if integration is healthy"""
        pass
```

### 7.3 OTA Integration (Mock)

```python
# portal/app/integrations/ota.py

class OTAIntegration(BaseIntegration):
    """OTA (Online Travel Agency) integration"""
    
    async def search_hotels(
        self,
        location: dict,
        check_in: date,
        check_out: date,
        guests: int,
        filters: dict = None
    ) -> list:
        """Search for available hotels"""
        # In production, this would call actual OTA APIs
        # For now, return mock data
        from app.automations.buildertrend.hotel_booking.mock_data import MOCK_OTA_RESULTS
        
        results = MOCK_OTA_RESULTS.copy()
        
        # Apply filters
        if filters:
            if filters.get("max_price"):
                results = [r for r in results if r["nightly_rate"] <= filters["max_price"]]
            if filters.get("max_distance"):
                results = [r for r in results if r["distance_miles"] <= filters["max_distance"]]
        
        return results
    
    async def book_hotel(self, hotel_id: str, booking_details: dict) -> dict:
        """Book a hotel"""
        from app.automations.buildertrend.hotel_booking.mock_data import MOCK_BOOKING_RESPONSE
        return MOCK_BOOKING_RESPONSE
    
    def _get_headers(self):
        return {"Authorization": f"Bearer {self.api_key}"}
    
    async def health_check(self):
        return True  # Mock always healthy
```

### 7.4 SMS Integration (Twilio)

```python
# portal/app/integrations/sms.py

class TwilioIntegration(BaseIntegration):
    """Twilio SMS integration"""
    
    async def send_sms(self, to: str, message: str) -> dict:
        """Send SMS message"""
        # Mock implementation
        return {
            "sid": f"SM{uuid4().hex[:32]}",
            "status": "sent",
            "to": to,
            "body": message
        }
    
    async def send_approval_request(
        self,
        to: str,
        job_name: str,
        details: str,
        approve_url: str,
        reject_url: str
    ) -> dict:
        """Send approval request via SMS"""
        message = f"""
SurfaceFlow AI - Approval Required

Job: {job_name}
{details}

Reply Y to approve or N to reject.
Or click:
✓ Approve: {approve_url}
✕ Reject: {reject_url}
        """.strip()
        
        return await self.send_sms(to, message)
    
    def _get_headers(self):
        import base64
        auth = base64.b64encode(
            f"{self.config['account_sid']}:{self.config['auth_token']}".encode()
        ).decode()
        return {"Authorization": f"Basic {auth}"}
    
    async def health_check(self):
        return True
```

---

## 8. Error Handling & Recovery

### 8.1 Error Categories

| Category | Handling | Retry |
|----------|----------|-------|
| **Validation Error** | Return immediately, user must fix input | No |
| **Transient Error** | Retry with exponential backoff | Yes (3x) |
| **Integration Error** | Log, notify admin, mark job as failed | Configurable |
| **Approval Timeout** | Notify user, allow manual intervention | No |
| **Writeback Error** | Log, continue, notify user to manual attach | No |

### 8.2 Error Response Format

```python
class AutomationError(Exception):
    def __init__(self, code: str, message: str, details: dict = None):
        self.code = code
        self.message = message
        self.details = details or {}
        super().__init__(message)
    
    def to_dict(self):
        return {
            "error": {
                "code": self.code,
                "message": self.message,
                "details": self.details
            }
        }

# Error codes
class ErrorCodes:
    VALIDATION_FAILED = "VALIDATION_FAILED"
    MODULE_NOT_FOUND = "MODULE_NOT_FOUND"
    INTEGRATION_ERROR = "INTEGRATION_ERROR"
    APPROVAL_TIMEOUT = "APPROVAL_TIMEOUT"
    BOOKING_FAILED = "BOOKING_FAILED"
    WRITEBACK_FAILED = "WRITEBACK_FAILED"
```

---

## 9. Testing Automation Modules

### 9.1 Test Structure

```python
# portal/app/automations/buildertrend/hotel_booking/tests/test_module.py

import pytest
from unittest.mock import AsyncMock, patch
from app.automations.buildertrend.hotel_booking.module import HotelBookingModule
from app.automations.buildertrend.hotel_booking.mock_data import (
    MOCK_BUILDERTREND_JOBS,
    MOCK_OTA_RESULTS
)

@pytest.fixture
def hotel_booking_module(db_session):
    return HotelBookingModule(
        job_id="test-job-123",
        user_id="test-user-456",
        db_session=db_session
    )

@pytest.fixture
def valid_input():
    return {
        "job_id": "12345",
        "job_name": "Smith Residence Remodel",
        "jobsite_address": {
            "street": "123 Main St",
            "city": "Phoenix",
            "state": "AZ",
            "zip": "85001"
        },
        "crew_size": 4,
        "check_in_date": "2025-01-10",
        "check_out_date": "2025-01-15",
        "approver_phone": "+15551234567"
    }

class TestHotelBookingValidation:
    async def test_valid_input_passes(self, hotel_booking_module, valid_input):
        result = await hotel_booking_module.validate(valid_input)
        assert result.is_valid is True
        assert len(result.errors) == 0
    
    async def test_missing_address_fails(self, hotel_booking_module, valid_input):
        del valid_input["jobsite_address"]
        result = await hotel_booking_module.validate(valid_input)
        assert result.is_valid is False
    
    async def test_invalid_dates_fails(self, hotel_booking_module, valid_input):
        valid_input["check_out_date"] = "2025-01-09"  # Before check-in
        result = await hotel_booking_module.validate(valid_input)
        assert result.is_valid is False

class TestHotelBookingExecution:
    @patch.object(HotelBookingModule, 'housing_service')
    @patch.object(HotelBookingModule, 'ota_service')
    async def test_finds_hotels(self, mock_ota, mock_housing, hotel_booking_module, valid_input):
        mock_housing.find_available = AsyncMock(return_value=[])
        mock_ota.search = AsyncMock(return_value=MOCK_OTA_RESULTS)
        
        result = await hotel_booking_module.execute(valid_input)
        
        assert result.success is True
        assert result.requires_approval is True
        assert len(result.approval_data["options"]) == 3
```

---

## 10. Creating New Modules

### 10.1 Module Creation Checklist

- [ ] Create module folder under `app/automations/<category>/<module_name>/`
- [ ] Define input/output schemas in `schemas.py`
- [ ] Implement module class in `module.py` extending `BaseModule`
- [ ] Register module with `@AutomationRegistry.register("AM-XXX")`
- [ ] Add mock data in `mock_data.py`
- [ ] Implement external service integrations in `services/`
- [ ] Add writeback logic in `writeback.py`
- [ ] Write tests in `tests/`
- [ ] Add entry to `module_registry` table
- [ ] Update extension UI config for trigger pages

### 10.2 Module Template

```python
# portal/app/automations/<category>/<module_name>/module.py

from app.automations.base import BaseModule, ValidationResult, ExecutionResult, WritebackResult
from app.automations.registry import AutomationRegistry
from .schemas import MyModuleInput, MyModuleOutput

@AutomationRegistry.register("AM-XXX")
class MyNewModule(BaseModule):
    MODULE_ID = "AM-XXX"
    MODULE_NAME = "My New Automation"
    MODULE_VERSION = "1.0.0"
    
    def get_input_schema(self):
        return MyModuleInput
    
    def get_output_schema(self):
        return MyModuleOutput
    
    async def validate(self, input_data: dict) -> ValidationResult:
        # Implement validation
        pass
    
    async def execute(self, input_data: dict) -> ExecutionResult:
        # Implement workflow
        pass
    
    async def writeback(self, result: ExecutionResult) -> WritebackResult:
        # Implement writeback
        pass
```

---

**End of Automation Modules Documentation**
