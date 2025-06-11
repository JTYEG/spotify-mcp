import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { playTools } from './player.js';
import { readTools } from './read.js';
import { writeTools } from './write.js';

const server = new McpServer({
  name: 'spotify-controller',
  version: '1.0.0',
});

[...playTools, ...readTools, ...writeTools].forEach((tool) => {
  server.tool(tool.name, tool.description, tool.schema, tool.handler);
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
