# Opal draft "OHNY Explorer" (opal.google/edit/142E8lMaKEPqEynfE0zwIQgQS9v2fE5lL): original "Retrieve events" step

Saved 2026-10-07 before the step was changed for a Get Webpage reachability test. Step type: Agent. Tools: Use Memory, Code Execution.

Prompt (as shown in the editor):

1. Objective: Use the text_generation_agent with grounding to access the MCP server at https://naidionov.com/ohny/skills. Retrieve real-time event information based on the user's event_query. Parse the server response to extract specific details like event names, times, and locations into an organized list. You are done when you have provided the structured schedule list [Use Memory] [Code Execution] to the user.

2. Output Format: A structured schedule list. After presenting the list, call system_objective_fulfilled.

3. User Input / Context: [Event Query]
