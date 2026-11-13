import { expect, test } from "bun:test";
import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { readFile } from "node:fs/promises";
import { sealPinterestTokens, openPinterestTokens, pinterestTokenRequest, consumePinterestState, resolvePinterestBoardEnv, storePinterestConnection, readPinterestConnection } from "../src/lib/pinterest-connection";

test("tokens are authenticated encrypted values bound to the existing auth secret", async () => {
 const encrypted = await sealPinterestTokens('secret-token', 'auth-secret');
 expect(encrypted).not.toContain('secret-token');
 expect(await openPinterestTokens(encrypted, 'auth-secret')).toBe('secret-token');
 await expect(openPinterestTokens(encrypted, 'wrong-secret')).rejects.toThrow();
});
test("OAuth exchange uses app credentials and never follows redirects or echoes provider errors", async () => {
 const env = { PINTEREST_APP_ID: '123', PINTEREST_APP_SECRET: 'private' };
 const request = (async (_url: unknown, init?: RequestInit) => {
  expect(init?.redirect).toBe('manual'); expect(new Headers(init?.headers).get('Authorization')).toBe('Basic '+btoa('123:private'));
  expect(String(init?.body)).toContain('grant_type=authorization_code');
  return Response.json({message: 'sensitive provider message'}, {status: 401});
 }) as typeof fetch;
 await expect(pinterestTokenRequest(env, new URLSearchParams({grant_type:'authorization_code'}), request)).rejects.toThrow('Reconnect Pinterest');
});
test("reconnecting clears the old board and persists only encrypted tokens; missing scopes fail closed", async () => {
 const client = createClient({url: ':memory:'}); const db = drizzle(client);
 try {
  const migration = await readFile(new URL('../drizzle/0023_pinterest_connection.sql', import.meta.url), 'utf8');
  for (const statement of migration.split('--> statement-breakpoint')) await client.execute(statement);
  const env = {AUTH_SECRET:'auth-secret'};
  const tokens = {access_token:'access-private', refresh_token:'refresh-private', expires_in:3600, scope:'boards:read pins:read pins:write'};
  await storePinterestConnection(env, tokens, 'admin@example.com', db);
  await client.execute("UPDATE pinterest_connection SET board_id = '123', board_name = 'Art'");
  await storePinterestConnection(env, tokens, 'admin@example.com', db);
  const row = await readPinterestConnection(env, db);
  expect(row?.board_id).toBeNull(); expect(row?.tokens).not.toContain('private');
  expect(JSON.parse(await openPinterestTokens(row!.tokens, env.AUTH_SECRET))).toEqual(tokens);
  await expect(storePinterestConnection(env, {...tokens, scope:'boards:read'}, 'admin@example.com', db)).rejects.toThrow('permissions');
 } finally {client.close();}
});

 test("OAuth state is single-use, expires, and is bound to the authorizing admin; refresh is serialized", async () => {
 const client = createClient({url: ':memory:'}); const db = drizzle(client);
 try {
  for (const statement of (await readFile(new URL('../drizzle/0023_pinterest_connection.sql', import.meta.url),'utf8')).split('--> statement-breakpoint')) await client.execute(statement);
  await client.execute({sql:"INSERT INTO pinterest_oauth_states VALUES ('state', 'owner', ?)", args:[Date.now()+60000]});
  expect(await consumePinterestState({}, 'state', 'other', db)).toBe(false);
  expect(await consumePinterestState({}, 'state', 'owner', db)).toBe(true);
  expect(await consumePinterestState({}, 'state', 'owner', db)).toBe(false);
  await client.execute("INSERT INTO pinterest_oauth_states VALUES ('old', 'owner', 0)");
  expect(await consumePinterestState({}, 'old', 'owner', db)).toBe(false);
  const env = {AUTH_SECRET:'auth-secret', PINTEREST_APP_ID:'123', PINTEREST_APP_SECRET:'app-secret'};
  await storePinterestConnection(env,{access_token:'old',refresh_token:'refresh',expires_in:1,scope:'boards:read,pins:read,pins:write'},'owner',db);
  let calls = 0;
  const apiFetch = (async (_url: unknown, init?: RequestInit) => {
   calls++; expect(String(init?.body)).toContain('grant_type=refresh_token');
   await new Promise(resolve => setTimeout(resolve, 20));
   return Response.json({access_token:'new',refresh_token:'rotated',expires_in:2592000});
  }) as typeof fetch;
  const results = await Promise.allSettled([resolvePinterestBoardEnv(env,apiFetch,db),resolvePinterestBoardEnv(env,apiFetch,db)]);
  expect(calls).toBe(1); expect(results.filter(result=>result.status==='fulfilled')).toHaveLength(1);
  const saved = await readPinterestConnection(env,db);
  expect(JSON.parse(await openPinterestTokens(saved!.tokens,env.AUTH_SECRET)).refresh_token).toBe('rotated');
 } finally {client.close();}
});
