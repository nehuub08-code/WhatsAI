from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.database import get_db
from app.models import AuditLog
from app.schemas import AuditLogOut
from app.security import get_current_admin

router = APIRouter(tags=["Audit Logs"])

@router.get("/api/audit-logs", response_model=List[AuditLogOut])
def get_audit_logs(
    search: Optional[str] = Query(None, description="Search action or admin"),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    admin = Depends(get_current_admin)
):
    """Retrieve system security audit trail"""
    query = db.query(AuditLog)
    if search:
        term = f"%{search.strip()}%"
        query = query.filter(or_(AuditLog.action.ilike(term), AuditLog.admin.ilike(term), AuditLog.details.ilike(term)))

    records = query.order_by(AuditLog.timestamp.desc()).offset(offset).limit(limit).all()
    return [AuditLogOut.model_validate(r) for r in records]
