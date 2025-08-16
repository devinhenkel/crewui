"""
CrewAI Service for handling crew instantiation and execution.
"""
from typing import List, Dict, Any, Optional, AsyncGenerator
import asyncio
from crewai import Crew, Agent, Task, Process
from sqlalchemy.orm import Session
from app.models.agent import Agent as AgentModel
from app.models.task import Task as TaskModel
from app.models.process import Process as ProcessModel
from app.models.tool import Tool as ToolModel
from app.core.config import settings
from app.core.crewai_tools import get_crewai_tool_by_name
from app.core.database import SessionLocal

class CrewAIService:
    def __init__(self):
        self.execution_queues: Dict[int, asyncio.Queue] = {}

    async def create_agent(self, agent_model: AgentModel, db: Session) -> Agent:
        """Create a CrewAI Agent from our AgentModel."""
        # For now, create agents without tools to avoid the KeyError
        # TODO: Implement proper tool instantiation for CrewAI tools
        tools = []
        
        # Log tool information for debugging
        if agent_model.tools:
            print(f"🔧 DEBUG: Agent {agent_model.name} has {len(agent_model.tools)} tools configured")
            for tool_id in agent_model.tools:
                tool = db.query(ToolModel).filter(ToolModel.id == tool_id).first()
                if tool:
                    print(f"   🔧 Tool: {tool.name} (Type: {tool.tool_type})")
                    # TODO: Instantiate actual CrewAI/LangChain tool objects here
                    # For now, we'll skip adding tools to avoid the KeyError
        
        return Agent(
            role=agent_model.role,
            goal=agent_model.goal,
            backstory=agent_model.backstory,
            tools=tools,  # Empty list for now to avoid KeyError
            llm_config=agent_model.llm_config or {},
            **agent_model.additional_params or {}
        )

    async def create_task(self, task_model: TaskModel, agent: Agent, db: Session) -> Task:
        """Create a CrewAI Task from our TaskModel."""
        # For now, create tasks without tools to avoid the KeyError
        # TODO: Implement proper tool instantiation for CrewAI tools
        tools = []
        
        # Log tool information for debugging
        if task_model.tools:
            print(f"🔧 DEBUG: Task {task_model.name} has {len(task_model.tools)} tools configured")
            for tool_id in task_model.tools:
                tool = db.query(ToolModel).filter(ToolModel.id == tool_id).first()
                if tool:
                    print(f"   🔧 Tool: {tool.name} (Type: {tool.tool_type})")
                    # TODO: Instantiate actual CrewAI/LangChain tool objects here
                    # For now, we'll skip adding tools to avoid the KeyError

        # Fix context field - CrewAI expects a list of tasks, not a dict
        context_tasks = []
        if task_model.context and isinstance(task_model.context, dict):
            # If context is a dict, we'll skip it for now as it's not the expected format
            print(f"🔍 DEBUG: Skipping context dict: {task_model.context}")
        elif task_model.context and isinstance(task_model.context, list):
            context_tasks = task_model.context
        
        return Task(
            description=task_model.description,
            expected_output=task_model.expected_output,
            agent=agent,
            tools=tools,  # Empty list for now to avoid KeyError
            context=context_tasks,
            **task_model.additional_params or {}
        )

    def create_output_callback(self, execution_id: int):
        """Create a callback for capturing CrewAI output."""
        queue = asyncio.Queue()
        self.execution_queues[execution_id] = queue

        def callback(output: str):
            """Synchronous callback for CrewAI output."""
            print(f"🔥 DEBUG CrewAI Callback: Received output: {output}")
            # Use asyncio.create_task to schedule the coroutine
            try:
                # Get the running event loop
                loop = asyncio.get_running_loop()
                # Schedule the queue put operation
                loop.create_task(queue.put(f"🤖 CrewAI: {output}\n"))
            except RuntimeError:
                # If no event loop is running, we can't schedule the task
                print(f"❌ DEBUG CrewAI Callback: No event loop running, output lost: {output}")

        return callback

    async def execute_process(self, process: ProcessModel, execution_id: int, variables: Optional[Dict[str, str]] = None, db: Session = None) -> AsyncGenerator[str, None]:
        """Execute a process using CrewAI and stream the output."""
        import time
        start_time = time.time()
        
        try:
            print(f"🤖 DEBUG CrewAI: Starting execution for process {process.name} (ID: {process.id})")
            print(f"🤖 DEBUG CrewAI: Execution ID: {execution_id}")
            print(f"🤖 DEBUG CrewAI: Variables: {variables}")
            
            # Create database session if not provided
            if db is None:
                print(f"🤖 DEBUG CrewAI: Creating new database session")
                try:
                    db = SessionLocal()
                    should_close_db = True
                    print(f"✅ DEBUG CrewAI: Database session created successfully")
                except Exception as db_error:
                    print(f"❌ DEBUG CrewAI: Database session creation failed: {db_error}")
                    yield f"❌ Database session creation failed: {str(db_error)}\n"
                    return
            else:
                should_close_db = False
                print(f"✅ DEBUG CrewAI: Using provided database session")
            
            yield f"🚀 Initializing CrewAI execution for process: {process.name}\n"
            yield f"📋 Variables provided: {len(variables) if variables else 0}\n"
            if variables:
                for key, value in variables.items():
                    yield f"   📋 {key}: {value[:50]}{'...' if len(value) > 50 else ''}\n"
            
            yield f"⏰ Execution started at {time.strftime('%Y-%m-%d %H:%M:%S')}\n"
            
            # Create output callback
            callback = self.create_output_callback(execution_id)
            
            # Create agents and tasks based on process configuration
            agents = {}
            tasks = []
            
            steps = process.configuration.get("steps", [])
            print(f"🤖 DEBUG CrewAI: Found {len(steps)} steps in process configuration")
            yield f"📝 Processing {len(steps)} steps...\n"
            
            for i, step in enumerate(steps):
                step_start_time = time.time()
                print(f"🤖 DEBUG CrewAI: Processing step {i+1}: {step}")
                yield f"🔄 Step {i+1}/{len(steps)}: Processing agent and task...\n"
                
                # Get agent
                agent_id = step.get("agent_id")
                if not agent_id:
                    print(f"❌ DEBUG CrewAI: No agent_id in step {i+1}")
                    yield f"❌ Error: No agent specified in step {i+1}\n"
                    continue
                    
                yield f"   🔍 Looking up agent ID: {agent_id}\n"
                agent_model = db.query(AgentModel).filter(AgentModel.id == agent_id).first()
                if agent_model:
                    print(f"✅ DEBUG CrewAI: Found agent: {agent_model.name}")
                    yield f"   🤖 Found agent: {agent_model.name} (Role: {agent_model.role})\n"
                    
                    if agent_model.id not in agents:
                        yield f"   🔨 Creating new CrewAI agent instance...\n"
                        
                        # Show tool information
                        if agent_model.tools:
                            yield f"   🔧 Agent has {len(agent_model.tools)} tools configured\n"
                            tool_names = []
                            for tool_id in agent_model.tools:
                                tool = db.query(ToolModel).filter(ToolModel.id == tool_id).first()
                                if tool:
                                    tool_names.append(f"{tool.name} ({tool.tool_type})")
                            if tool_names:
                                yield f"      Tools: {', '.join(tool_names)}\n"
                        else:
                            yield f"   🔧 No tools configured for this agent\n"
                        
                        agents[agent_model.id] = await self.create_agent(agent_model, db)
                        print(f"✅ DEBUG CrewAI: Created CrewAI agent for {agent_model.name}")
                        yield f"   ✅ Created CrewAI agent: {agent_model.name}\n"
                        yield f"   ⚠️  Note: Tools are not yet instantiated (UI shows associations only)\n"
                    else:
                        yield f"   ♻️  Reusing existing agent: {agent_model.name}\n"
                    
                    # Get task
                    task_id = step.get("task_id")
                    if not task_id:
                        print(f"❌ DEBUG CrewAI: No task_id in step {i+1}")
                        yield f"❌ Error: No task specified in step {i+1}\n"
                        continue
                    
                    yield f"   🔍 Looking up task ID: {task_id}\n"
                    task_model = db.query(TaskModel).filter(TaskModel.id == task_id).first()
                    if task_model:
                        print(f"✅ DEBUG CrewAI: Found task: {task_model.name}")
                        yield f"   📋 Found task: {task_model.name}\n"
                        yield f"      Description: {task_model.description[:100]}{'...' if len(task_model.description) > 100 else ''}\n"
                        
                        # Apply variable substitution
                        if variables:
                            print(f"🔄 DEBUG CrewAI: Applying variable substitution")
                            yield f"   🔄 Applying variable substitution to task and agent...\n"
                            substituted_count = 0
                            original_task_desc = task_model.description
                            original_task_output = task_model.expected_output
                            original_agent_role = agent_model.role
                            original_agent_goal = agent_model.goal
                            original_agent_backstory = agent_model.backstory
                            
                            task_model.description = self._substitute_variables(task_model.description, variables)
                            task_model.expected_output = self._substitute_variables(task_model.expected_output, variables)
                            agent_model.role = self._substitute_variables(agent_model.role, variables)
                            agent_model.goal = self._substitute_variables(agent_model.goal, variables)
                            agent_model.backstory = self._substitute_variables(agent_model.backstory, variables)
                            
                            if original_task_desc != task_model.description:
                                substituted_count += 1
                            if original_task_output != task_model.expected_output:
                                substituted_count += 1
                            if original_agent_role != agent_model.role:
                                substituted_count += 1
                            if original_agent_goal != agent_model.goal:
                                substituted_count += 1
                            if original_agent_backstory != agent_model.backstory:
                                substituted_count += 1
                            
                            yield f"   ✅ Applied {substituted_count} variable substitutions\n"
                        
                        # Show task tool information
                        if task_model.tools:
                            yield f"   🔧 Task has {len(task_model.tools)} tools configured\n"
                            task_tool_names = []
                            for tool_id in task_model.tools:
                                tool = db.query(ToolModel).filter(ToolModel.id == tool_id).first()
                                if tool:
                                    task_tool_names.append(f"{tool.name} ({tool.tool_type})")
                            if task_tool_names:
                                yield f"      Tools: {', '.join(task_tool_names)}\n"
                        else:
                            yield f"   🔧 No tools configured for this task\n"
                        
                        yield f"   🔨 Creating CrewAI task instance...\n"
                        task = await self.create_task(task_model, agents[agent_model.id], db)
                        tasks.append(task)
                        print(f"✅ DEBUG CrewAI: Created CrewAI task for {task_model.name}")
                        
                        step_duration = time.time() - step_start_time
                        yield f"   ✅ Task created: {task_model.name} (took {step_duration:.2f}s)\n"
                        yield f"   ⚠️  Note: Tools are not yet instantiated (UI shows associations only)\n"
                    else:
                        print(f"❌ DEBUG CrewAI: Task {task_id} not found")
                        yield f"❌ Error: Task {task_id} not found\n"
                else:
                    print(f"❌ DEBUG CrewAI: Agent {agent_id} not found")
                    yield f"❌ Error: Agent {agent_id} not found\n"

            if not tasks:
                error_msg = "No tasks configured for this process"
                print(f"❌ DEBUG CrewAI: {error_msg}")
                yield f"❌ Error: {error_msg}\n"
                raise ValueError(error_msg)
                
            setup_duration = time.time() - start_time
            print(f"✅ DEBUG CrewAI: Successfully created {len(agents)} agents and {len(tasks)} tasks")
            yield f"✅ Successfully created {len(agents)} agents and {len(tasks)} tasks\n"
            yield f"⏱️  Setup completed in {setup_duration:.2f} seconds\n"

            # Create and run the crew
            print(f"🤖 DEBUG CrewAI: Creating crew with {len(agents)} agents and {len(tasks)} tasks")
            yield f"🚢 Creating CrewAI crew...\n"
            yield f"   📊 Process Type: {process.process_type}\n"
            yield f"   🤖 Agent Count: {len(agents)}\n"
            yield f"   📋 Task Count: {len(tasks)}\n"
            
            crew_creation_start = time.time()
            crew = Crew(
                agents=list(agents.values()),
                tasks=tasks,
                process=Process.sequential if process.process_type == "sequential" else Process.hierarchical,
                verbose=True,
                output_callback=callback
            )
            crew_creation_duration = time.time() - crew_creation_start
            
            print(f"✅ DEBUG CrewAI: Crew created successfully")
            yield f"✅ Crew created successfully (took {crew_creation_duration:.2f}s)\n"
            yield f"🚀 Starting crew execution...\n"
            yield f"🔍 This process will run {len(tasks)} tasks using {len(agents)} agents\n"

            # Start crew execution in a background task
            print(f"🤖 DEBUG CrewAI: Starting crew execution in background task")
            execution_start_time = time.time()
            asyncio.create_task(self._run_crew(crew, execution_id))

            # Stream output from the queue
            print(f"🤖 DEBUG CrewAI: Starting to stream output from queue")
            queue = self.execution_queues[execution_id]
            chunk_count = 0
            while True:
                try:
                    output = await queue.get()
                    chunk_count += 1
                    print(f"🤖 DEBUG CrewAI: Received output chunk {chunk_count} from queue: {output[:100]}...")
                    
                    if output == "EXECUTION_COMPLETE":
                        execution_duration = time.time() - execution_start_time
                        total_duration = time.time() - start_time
                        print(f"✅ DEBUG CrewAI: Execution completed")
                        yield f"✅ Crew execution completed!\n"
                        yield f"⏱️  Execution time: {execution_duration:.2f} seconds\n"
                        yield f"⏱️  Total time: {total_duration:.2f} seconds\n"
                        yield f"📊 Processed {chunk_count} output chunks\n"
                        break
                    yield output
                except asyncio.CancelledError:
                    print(f"❌ DEBUG CrewAI: Execution cancelled")
                    yield f"❌ Execution was cancelled\n"
                    break

        except Exception as e:
            import traceback
            error_msg = f"❌ Error during execution: {str(e)}"
            traceback_details = traceback.format_exc()
            print(f"❌ DEBUG CrewAI: {error_msg}")
            print(f"❌ DEBUG CrewAI Traceback: {traceback_details}")
            yield error_msg
            yield f"❌ Traceback: {traceback_details}\n"
        finally:
            if execution_id in self.execution_queues:
                print(f"🧹 DEBUG CrewAI: Cleaning up execution queue for {execution_id}")
                del self.execution_queues[execution_id]
            if should_close_db:
                print(f"🧹 DEBUG CrewAI: Closing database session")
                db.close()

    async def _run_crew(self, crew: Crew, execution_id: int):
        """Run the crew in a separate task and handle completion."""
        try:
            print(f"🤖 DEBUG _run_crew: Starting crew kickoff for execution {execution_id}")
            await self.execution_queues[execution_id].put("🚀 Crew kickoff started...\n")
            await self.execution_queues[execution_id].put("📡 Beginning agent task execution...\n")
            
            # Run crew.kickoff() in a thread to avoid blocking, with output capture
            import asyncio
            import concurrent.futures
            import sys
            import io
            from contextlib import redirect_stdout, redirect_stderr
            
            def run_crew_with_capture():
                """Run crew and capture stdout/stderr"""
                # Create string buffers to capture output
                stdout_buffer = io.StringIO()
                stderr_buffer = io.StringIO()
                
                try:
                    # Redirect stdout and stderr to capture CrewAI's output
                    with redirect_stdout(stdout_buffer), redirect_stderr(stderr_buffer):
                        result = crew.kickoff()
                    
                    # Get captured output
                    stdout_output = stdout_buffer.getvalue()
                    stderr_output = stderr_buffer.getvalue()
                    
                    return result, stdout_output, stderr_output
                except Exception as e:
                    # Return the exception along with any captured output
                    stdout_output = stdout_buffer.getvalue()
                    stderr_output = stderr_buffer.getvalue()
                    return None, stdout_output, stderr_output, str(e)
            
            loop = asyncio.get_event_loop()
            with concurrent.futures.ThreadPoolExecutor() as executor:
                # Run the crew with output capture in a thread
                await self.execution_queues[execution_id].put("⚡ Starting CrewAI task execution...\n")
                crew_result = await loop.run_in_executor(executor, run_crew_with_capture)
                
                if len(crew_result) == 4:  # Error case
                    result, stdout_output, stderr_output, error = crew_result
                    raise Exception(error)
                else:
                    result, stdout_output, stderr_output = crew_result
            
            print(f"✅ DEBUG _run_crew: Crew execution completed with result type: {type(result)}")
            print(f"✅ DEBUG _run_crew: Result content: {str(result)[:500]}...")
            print(f"✅ DEBUG _run_crew: Captured stdout: {stdout_output[:200]}...")
            print(f"✅ DEBUG _run_crew: Captured stderr: {stderr_output[:200]}...")
            
            # Send captured stdout (CrewAI verbose output)
            if stdout_output.strip():
                await self.execution_queues[execution_id].put(f"\n📺 === CREW EXECUTION LOG ===\n")
                # Split output into lines and send each line
                for line in stdout_output.strip().split('\n'):
                    if line.strip():
                        await self.execution_queues[execution_id].put(f"🤖 {line}\n")
                await self.execution_queues[execution_id].put(f"📺 === END LOG ===\n\n")
            
            # Send any error output
            if stderr_output.strip():
                await self.execution_queues[execution_id].put(f"\n⚠️  === STDERR OUTPUT ===\n")
                for line in stderr_output.strip().split('\n'):
                    if line.strip():
                        await self.execution_queues[execution_id].put(f"⚠️  {line}\n")
                await self.execution_queues[execution_id].put(f"⚠️  === END STDERR ===\n\n")
            
            # Format and send the final result
            result_str = str(result) if result else "No result returned"
            await self.execution_queues[execution_id].put(f"\n🎯 === CREW EXECUTION RESULT ===\n")
            await self.execution_queues[execution_id].put(f"{result_str}\n")
            await self.execution_queues[execution_id].put(f"🎯 === END RESULT ===\n\n")
            await self.execution_queues[execution_id].put("EXECUTION_COMPLETE")
        except Exception as e:
            import traceback
            error_msg = f"❌ Error in crew execution: {str(e)}"
            traceback_details = traceback.format_exc()
            print(f"❌ DEBUG _run_crew: {error_msg}")
            print(f"❌ DEBUG _run_crew Traceback: {traceback_details}")
            await self.execution_queues[execution_id].put(f"{error_msg}\n")
            await self.execution_queues[execution_id].put(f"❌ Traceback: {traceback_details}\n")
            await self.execution_queues[execution_id].put("EXECUTION_COMPLETE")

    def _substitute_variables(self, text: str, variables: Dict[str, str]) -> str:
        """Replace {{variable}} placeholders with their values."""
        if not text or not variables:
            return text
        
        for key, value in variables.items():
            text = text.replace(f"{{{{{key}}}}}", value)
        
        return text

# Create a singleton instance
crewai_service = CrewAIService()