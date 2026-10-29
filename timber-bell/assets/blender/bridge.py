import sys
sys.path.insert(0, 'C:/mcp/blender_mcp/addon')
from blender_mcp_addon import mcp_to_blender_server, execute_blocking
mcp_to_blender_server.start('127.0.0.1', 9878)
print('Timber Bell isolated MCP bridge listening on 9878', flush=True)
execute_blocking.run()
