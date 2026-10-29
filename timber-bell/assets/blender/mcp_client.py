import asyncio, json, os, pathlib, sys, datetime, site
RUNTIME=os.environ.get('TIMBER_MCP_RUNTIME','C:/Users/forem/.codex/visualizations/2026/10/20/01a157e0-e1c1-7123-b2cc-9516ad06a225/blender-mcp-runtime')
SERVER='C:/mcp/blender_mcp/mcp'
site.addsitedir(RUNTIME)
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
async def main():
    env=dict(os.environ);env['PYTHONPATH']=RUNTIME+os.pathsep+SERVER;env['BLENDER_MCP_PORT']='9878';env['BLENDER_MCP_HOST']='127.0.0.1'
    server=StdioServerParameters(command=sys.executable,args=['-c',"import site;site.addsitedir("+repr(RUNTIME)+");from blmcp import main;main()"],cwd=SERVER,env=env)
    async with stdio_client(server) as (read,write):
        async with ClientSession(read,write) as session:
            init=await session.initialize(); listing=await session.list_tools()
            print(json.dumps({'server':init.serverInfo.model_dump(),'tools':[t.name for t in listing.tools]}),flush=True)
            code=pathlib.Path(sys.argv[1]).read_text(encoding='utf-8-sig') if len(sys.argv)>1 else "import bpy\nresult={'version':bpy.app.version_string,'file':bpy.data.filepath,'objects':len(bpy.data.objects)}"
            answer=await session.call_tool('execute_blender_code',{'code':code},read_timeout_seconds=datetime.timedelta(seconds=300))
            print(json.dumps(answer.model_dump(mode='json'),ensure_ascii=False),flush=True)
            if answer.isError or (answer.structuredContent or {}).get('status')!='ok':raise RuntimeError('Blender MCP call failed')
asyncio.run(main())
