"""
CrewAI Service for handling crew instantiation and execution.
"""
from typing import List, Dict, Any, Optional, AsyncGenerator
import asyncio
from crewai import Crew, Agent, Task, Process
from app.models.agent import Agent as AgentModel
from app.models.task import Task as TaskModel
from app.models.process import Process as ProcessModel
from app.models.tool import Tool as ToolModel
from app.core.config import settings
from app.core.crewai_tools import get_crewai_tool_by_name

class CrewAIService:
    def __init__(self):
        self.execution_queues: Dict[int, asyncio.Queue] = {}

    async def create_agent(self, agent_model: AgentModel) -> Agent:
        """Create a CrewAI Agent from our AgentModel."""
        tools = []
        if agent_model.tools:
            for tool_id in agent_model.tools:
                tool = await ToolModel.get(tool_id)
                if tool:
                    crewai_tool = get_crewai_tool_by_name(tool.name)
                    if crewai_tool:
                        tools.append(crewai_tool)

        return Agent(
            role=agent_model.role,
            goal=agent_model.goal,
            backstory=agent_model.backstory,
            tools=tools,
            llm_config=agent_model.llm_config or {},
            **agent_model.additional_params or {}
        )

    async def create_task(self, task_model: TaskModel, agent: Agent) -> Task:
        """Create a CrewAI Task from our TaskModel."""
        tools = []
        if task_model.tools:
            for tool_id in task_model.tools:
                tool = await ToolModel.get(tool_id)
                if tool:
                    crewai_tool = get_crewai_tool_by_name(tool.name)
                    if crewai_tool:
                        tools.append(crewai_tool)

        return Task(
            description=task_model.description,
            expected_output=task_model.expected_output,
            agent=agent,
            tools=tools,
            context=task_model.context or {},
            **task_model.additional_params or {}
        )

    def create_output_callback(self, execution_id: int):
        """Create a callback for capturing CrewAI output."""
        queue = asyncio.Queue()
        self.execution_queues[execution_id] = queue

        async def callback(output: str):
            await queue.put(output)

        return callback

    async def execute_process(self, process: ProcessModel, execution_id: int, variables: Optional[Dict[str, str]] = None) -> AsyncGenerator[str, None]:
        """Execute a process using CrewAI and stream the output."""
        try:
            # Create output callback
            callback = self.create_output_callback(execution_id)
            
            # Create agents and tasks based on process configuration
            agents = {}
            tasks = []
            
            for step in process.configuration.get("steps", []):
                # Get agent
                agent_model = await AgentModel.get(step["agent_id"])
                if agent_model:
                    if agent_model.id not in agents:
                        agents[agent_model.id] = await self.create_agent(agent_model)
                    
                    # Get task
                    task_model = await TaskModel.get(step["task_id"])
                    if task_model:
                        # Apply variable substitution
                        if variables:
                            task_model.description = self._substitute_variables(task_model.description, variables)
                            task_model.expected_output = self._substitute_variables(task_model.expected_output, variables)
                            agent_model.role = self._substitute_variables(agent_model.role, variables)
                            agent_model.goal = self._substitute_variables(agent_model.goal, variables)
                            agent_model.backstory = self._substitute_variables(agent_model.backstory, variables)
                        
                        task = await self.create_task(task_model, agents[agent_model.id])
                        tasks.append(task)

            if not tasks:
                raise ValueError("No tasks configured for this process")

            # Create and run the crew
            crew = Crew(
                agents=list(agents.values()),
                tasks=tasks,
                process=Process.sequential if process.process_type == "sequential" else Process.hierarchical,
                verbose=True,
                output_callback=callback
            )

            # Start crew execution in a background task
            asyncio.create_task(self._run_crew(crew, execution_id))

            # Stream output from the queue
            queue = self.execution_queues[execution_id]
            while True:
                try:
                    output = await queue.get()
                    if output == "EXECUTION_COMPLETE":
                        break
                    yield output
                except asyncio.CancelledError:
                    break

        except Exception as e:
            yield f"Error: {str(e)}"
        finally:
            if execution_id in self.execution_queues:
                del self.execution_queues[execution_id]

    async def _run_crew(self, crew: Crew, execution_id: int):
        """Run the crew in a separate task and handle completion."""
        try:
            result = crew.kickoff()
            # Store result or handle it as needed
            await self.execution_queues[execution_id].put("EXECUTION_COMPLETE")
        except Exception as e:
            await self.execution_queues[execution_id].put(f"Error: {str(e)}")

    def _substitute_variables(self, text: str, variables: Dict[str, str]) -> str:
        """Replace {{variable}} placeholders with their values."""
        if not text or not variables:
            return text
        
        for key, value in variables.items():
            text = text.replace(f"{{{{{key}}}}}", value)
        
        return text

# Create a singleton instance
crewai_service = CrewAIService()