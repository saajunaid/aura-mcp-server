#!/usr/bin/env node
import { AuraServer } from './server.js';

async function main() {
  const server = new AuraServer();
  await server.start();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});