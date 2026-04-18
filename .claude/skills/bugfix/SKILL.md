# Bug Fix Workflow
1. Read the error message/description carefully
2. Search codebase for related code with Grep
3. Check platform compatibility of any APIs used
4. If DB-related: verify actual schema via Supabase MCP before changing code
5. Make minimal, targeted fix
6. Verify no adjacent functionality is broken
7. Run build to confirm no compile errors
