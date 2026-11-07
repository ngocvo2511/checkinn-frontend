import test from 'node:test';
import assert from 'node:assert/strict';
import {authUser,authSession,readAuth,storeAuth,clearAuth} from '../lib/auth/session.ts';
import {credentialsUser} from '../lib/auth/credentials.ts';
const fixture={token:'synthetic-internal-token',userId:'11111111-1111-4111-8111-111111111111',role:'OWNER',email:'owner@example.invalid',fullName:'Synthetic Owner'};
test('custom and NextAuth credentials map the same internal identity without replacing role',async () => {
  for(const role of ['CUSTOMER','OWNER','ADMIN']) {
    const response={...fixture,role};let body;
    const user=await credentialsUser({email:fixture.email,password:'synthetic-test-password'},'http://synthetic.invalid',async (_url,options)=>{body=JSON.parse(options.body);assert.ok(options.signal);return Response.json(response);});
    assert.deepEqual(body,{usernameOrEmail:fixture.email,password:'synthetic-test-password'});
    assert.equal(user.id,response.userId);assert.equal(user.accessToken,response.token);assert.equal(user.role,role);
    const session=authSession({provider:'credentials',accessToken:user.accessToken,user:{id:user.id,role:user.role,email:user.email,name:user.name}});
    assert.equal(session.userId,authUser(response).userId);assert.equal(session.role,role);
  }
});
test('external OAuth and malformed identities never become an internal bearer session',async () => {
  for(const value of [null,{}, {...fixture,provider:'google'}, {...fixture,userId:undefined}, {...fixture,token:'undefined'}, {...fixture,role:'UNKNOWN'}]) assert.equal(authUser(value),null);
  assert.equal(authSession({provider:'google',accessToken:'synthetic-external-token',user:{id:fixture.userId,role:'ADMIN'}}),null);
  assert.equal(authSession({accessToken:fixture.token,user:{id:fixture.userId,role:'OWNER'}}),null);
  for(const fetcher of [async()=>Response.json({}, {status:401}),async()=>Response.json({...fixture,role:undefined}),async()=>{throw new Error('transport');}]) assert.equal(await credentialsUser({email:'x',password:'synthetic-password'},'http://synthetic.invalid',fetcher),null);
});
test('storage migration retains legacy internal users, removes invalid sessions and never stores undefined tokens',()=>{
  const values=new Map(); const storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,value),removeItem:key=>values.delete(key)};
  storage.setItem('user',JSON.stringify({...fixture,token:undefined}));storage.setItem('token',fixture.token);
  assert.equal(readAuth(storage).role,'OWNER');
  storeAuth(storage,authUser(fixture));assert.equal(readAuth(storage).userId,fixture.userId);
  storage.setItem('user',JSON.stringify({...fixture,provider:'google'}));assert.equal(readAuth(storage),null);
  clearAuth(storage);assert.equal(storage.getItem('token'),null);assert.equal(storage.getItem('user'),null);
});
