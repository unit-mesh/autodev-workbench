import { MCPServer } from '..';

// Create and configure the MCP server
const server = new MCPServer({
  name: 'example-mcp-server',
  version: '1.0.0',
});

server.serveHttp({
  port: 3000,
}).then(server => {
    console.log(`Server is running on http://localhost:3000`);
    console.log(`You can connect to the server using the following command:`);
    console.log(`mcp connect http://localhost:3000`);
}).catch(err => {
    console.error(err);
});

