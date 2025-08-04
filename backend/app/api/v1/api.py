from fastapi import APIRouter
from app.api.v1.endpoints import agents, tasks, processes, executions, tools

api_router = APIRouter()

api_router.include_router(agents.router, prefix="/agents", tags=["agents"])
api_router.include_router(tasks.router, prefix="/tasks", tags=["tasks"])
api_router.include_router(processes.router, prefix="/processes", tags=["processes"])
api_router.include_router(executions.router, prefix="/executions", tags=["executions"])
api_router.include_router(tools.router, prefix="/tools", tags=["tools"]) 