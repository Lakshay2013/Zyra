const test = require('node:test')
const assert = require('node:assert/strict')
const request = require('supertest')

const { connectDb, clearDb, disconnectDb } = require('../helpers')
const app = require('../../src/app')
const User = require('../../src/models/User')

test.before(connectDb)
test.beforeEach(clearDb)
test.after(disconnectDb)

const REG = { name: 'Alice', email: 'alice@test.local', password: 'password12345', orgName: 'Acme' }

test('register → verify-otp → login → protected route', async () => {
  const reg = await request(app).post('/api/auth/register').send(REG)
  assert.equal(reg.status, 201)
  assert.equal(reg.body.requiresOtp, true)

  const u = await User.findOne({ email: REG.email }).select('+otpCode')
  assert.ok(u.otpCode)

  const verify = await request(app).post('/api/auth/verify-otp').send({ email: REG.email, otp: u.otpCode })
  assert.equal(verify.status, 200)
  assert.ok(verify.body.token)

  const login = await request(app).post('/api/auth/login').send({ email: REG.email, password: REG.password })
  assert.equal(login.status, 200)
  const token = login.body.token

  const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`)
  assert.equal(me.status, 200)
  assert.equal(me.body.user.email, REG.email)
})

test('register rejects short password', async () => {
  const r = await request(app).post('/api/auth/register').send({ ...REG, password: 'short' })
  assert.equal(r.status, 400)
})

test('login before verification is blocked (403)', async () => {
  await request(app).post('/api/auth/register').send(REG)
  const r = await request(app).post('/api/auth/login').send({ email: REG.email, password: REG.password })
  assert.equal(r.status, 403)
})

test('protected route rejects missing/invalid token', async () => {
  assert.equal((await request(app).get('/api/auth/me')).status, 401)
  assert.equal((await request(app).get('/api/auth/me').set('Authorization', 'Bearer nope')).status, 401)
})

test('verify-otp rejects a wrong code', async () => {
  await request(app).post('/api/auth/register').send(REG)
  const r = await request(app).post('/api/auth/verify-otp').send({ email: REG.email, otp: '000000' })
  assert.equal(r.status, 400)
})

test('role restriction: non-admin cannot update org settings', async () => {
  const { createOrgWithKey } = require('../helpers')
  const jwt = require('jsonwebtoken')
  const { org } = await createOrgWithKey()
  const viewer = await User.create({ orgId: org._id, name: 'V', email: 'v@test.local', passwordHash: 'password12345', role: 'viewer', isEmailVerified: true })
  const vToken = jwt.sign({ userId: viewer._id, orgId: org._id, role: 'viewer' }, process.env.JWT_SECRET)
  const r = await request(app).put('/api/org/settings').set('Authorization', `Bearer ${vToken}`).send({ displayName: 'Hacked' })
  assert.equal(r.status, 403)
})
