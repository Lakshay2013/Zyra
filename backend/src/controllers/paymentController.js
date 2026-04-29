const Razorpay = require('razorpay')
const crypto = require('crypto')
const Payment = require('../models/Payment')
const Organization = require('../models/Organization')

// ── Razorpay instance ──
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
})

// ── Plan pricing config (amounts in paise) ──
const PLANS = {
  pro: {
    monthly: { amount: 99900, label: 'Pro Monthly' },     // ₹999
    yearly:  { amount: 958800, label: 'Pro Yearly' }       // ₹799 × 12 = ₹9,588
  },
  growth: {
    monthly: { amount: 399900, label: 'Growth Monthly' },  // ₹3,999
    yearly:  { amount: 3838800, label: 'Growth Yearly' }   // ₹3,199 × 12 = ₹38,388
  }
}

const PLAN_LIMITS = {
  free: 1000,
  pro: 50000,
  growth: 1000000  // effectively unlimited
}

// ──────────────────────────────────────────────────────────────
// POST /api/payments/create-order
// Creates a Razorpay order and saves a Payment record
// ──────────────────────────────────────────────────────────────
exports.createOrder = async (req, res) => {
  try {
    const { plan, cycle } = req.body

    // Validate input
    if (!plan || !['pro', 'growth'].includes(plan)) {
      return res.status(400).json({ message: 'Invalid plan. Choose "pro" or "growth".' })
    }
    if (!cycle || !['monthly', 'yearly'].includes(cycle)) {
      return res.status(400).json({ message: 'Invalid cycle. Choose "monthly" or "yearly".' })
    }

    const planConfig = PLANS[plan][cycle]
    if (!planConfig) {
      return res.status(400).json({ message: 'Invalid plan/cycle combination.' })
    }

    // Check if org is already on this plan
    const org = await Organization.findById(req.user.orgId)
    if (org.plan === plan) {
      return res.status(400).json({ message: `You are already on the ${plan} plan.` })
    }

    // Create Razorpay order
    const order = await razorpay.orders.create({
      amount: planConfig.amount,
      currency: 'INR',
      receipt: `zyra_${req.user.orgId}_${Date.now()}`,
      notes: {
        orgId: req.user.orgId,
        userId: req.user.userId,
        plan,
        cycle
      }
    })

    // Save payment record
    await Payment.create({
      orderId: order.id,
      orgId: req.user.orgId,
      userId: req.user.userId,
      plan,
      amount: planConfig.amount,
      billingCycle: cycle,
      status: 'created'
    })

    res.json({
      orderId: order.id,
      amount: planConfig.amount,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID,
      plan,
      cycle,
      label: planConfig.label
    })
  } catch (err) {
    console.error('[Payment] Create order error:', err.message, err.statusCode, JSON.stringify(err.error || {}))
    res.status(500).json({ message: 'Failed to create payment order', detail: err.message })
  }
}

// ──────────────────────────────────────────────────────────────
// POST /api/payments/verify
// Verifies Razorpay payment signature and upgrades the org
// ──────────────────────────────────────────────────────────────
exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ message: 'Missing payment verification data' })
    }

    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (expectedSignature !== razorpay_signature) {
      // Mark payment as failed
      await Payment.findOneAndUpdate(
        { orderId: razorpay_order_id },
        { status: 'failed' }
      )
      return res.status(400).json({ message: 'Payment verification failed — invalid signature' })
    }

    // Update payment record
    const payment = await Payment.findOneAndUpdate(
      { orderId: razorpay_order_id },
      {
        paymentId: razorpay_payment_id,
        razorpaySignature: razorpay_signature,
        status: 'paid'
      },
      { new: true }
    )

    if (!payment) {
      return res.status(404).json({ message: 'Payment order not found' })
    }

    // Calculate period end
    const now = new Date()
    const periodEnd = new Date(now)
    if (payment.billingCycle === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1)
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1)
    }

    // Upgrade the organization
    await Organization.findByIdAndUpdate(payment.orgId, {
      plan: payment.plan,
      monthlyLogLimit: PLAN_LIMITS[payment.plan],
      'subscription.razorpayPaymentId': razorpay_payment_id,
      'subscription.billingCycle': payment.billingCycle,
      'subscription.currentPeriodEnd': periodEnd,
      'subscription.status': 'active'
    })

    res.json({
      success: true,
      message: `Successfully upgraded to ${payment.plan} plan!`,
      plan: payment.plan,
      periodEnd
    })
  } catch (err) {
    console.error('[Payment] Verify error:', err)
    res.status(500).json({ message: 'Payment verification failed' })
  }
}

// ──────────────────────────────────────────────────────────────
// POST /api/payments/webhook
// Razorpay webhook handler (backup for client-side verify)
// ──────────────────────────────────────────────────────────────
exports.webhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    const signature = req.headers['x-razorpay-signature']

    // If webhook secret is configured, verify signature
    if (webhookSecret && signature) {
      const expectedSig = crypto
        .createHmac('sha256', webhookSecret)
        .update(JSON.stringify(req.body))
        .digest('hex')

      if (expectedSig !== signature) {
        return res.status(400).json({ message: 'Invalid webhook signature' })
      }
    }

    const event = req.body.event
    const paymentEntity = req.body.payload?.payment?.entity

    if (!paymentEntity) {
      return res.status(200).json({ status: 'ignored' })
    }

    const orderId = paymentEntity.order_id
    const paymentId = paymentEntity.id

    if (event === 'payment.captured') {
      const payment = await Payment.findOne({ orderId })
      if (payment && payment.status !== 'paid') {
        payment.paymentId = paymentId
        payment.status = 'paid'
        await payment.save()

        // Upgrade org
        const now = new Date()
        const periodEnd = new Date(now)
        if (payment.billingCycle === 'yearly') {
          periodEnd.setFullYear(periodEnd.getFullYear() + 1)
        } else {
          periodEnd.setMonth(periodEnd.getMonth() + 1)
        }

        await Organization.findByIdAndUpdate(payment.orgId, {
          plan: payment.plan,
          monthlyLogLimit: PLAN_LIMITS[payment.plan],
          'subscription.razorpayPaymentId': paymentId,
          'subscription.billingCycle': payment.billingCycle,
          'subscription.currentPeriodEnd': periodEnd,
          'subscription.status': 'active'
        })
      }
    } else if (event === 'payment.failed') {
      await Payment.findOneAndUpdate({ orderId }, { status: 'failed' })
    }

    res.status(200).json({ status: 'ok' })
  } catch (err) {
    console.error('[Payment] Webhook error:', err)
    res.status(500).json({ message: 'Webhook processing failed' })
  }
}

// ──────────────────────────────────────────────────────────────
// GET /api/payments/history
// Returns payment history for the authenticated org
// ──────────────────────────────────────────────────────────────
exports.getHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ orgId: req.user.orgId })
      .sort({ createdAt: -1 })
      .limit(20)
      .select('orderId paymentId plan amount currency billingCycle status createdAt')

    res.json({ payments })
  } catch (err) {
    console.error('[Payment] History error:', err)
    res.status(500).json({ message: 'Failed to fetch payment history' })
  }
}

// ──────────────────────────────────────────────────────────────
// GET /api/payments/plans
// Returns available plans and pricing (public-facing)
// ──────────────────────────────────────────────────────────────
exports.getPlans = async (req, res) => {
  res.json({
    plans: {
      free: {
        name: 'Builder',
        monthly: 0,
        yearly: 0,
        limits: { requests: PLAN_LIMITS.free },
        features: ['1,000 requests/mo', 'Basic cost optimizer', 'Standard logging', 'Community support']
      },
      pro: {
        name: 'Pro',
        monthly: PLANS.pro.monthly.amount / 100,
        yearly: PLANS.pro.yearly.amount / 100,
        monthlyEquivalent: Math.round(PLANS.pro.yearly.amount / 12 / 100),
        limits: { requests: PLAN_LIMITS.pro },
        features: ['50,000 requests/mo', 'Full contextual optimizer', 'Real-time dashboard', 'Priority support']
      },
      growth: {
        name: 'Growth',
        monthly: PLANS.growth.monthly.amount / 100,
        yearly: PLANS.growth.yearly.amount / 100,
        monthlyEquivalent: Math.round(PLANS.growth.yearly.amount / 12 / 100),
        limits: { requests: PLAN_LIMITS.growth },
        features: ['Unlimited requests', 'Custom routing logic', 'Team sharing & SSO', 'Dedicated SLA']
      }
    }
  })
}
