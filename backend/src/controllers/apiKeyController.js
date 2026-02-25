const ApiKey = require('../models/ApiKey')

// POST /api/keys — generate new key
exports.createKey = async (req, res) => {
  try {
    const { name } = req.body

    if (!name) {
      return res.status(400).json({ message: 'Key name is required' })
    }

    const { raw, hash, prefix } = ApiKey.generateKey()

    const apiKey = await ApiKey.create({
      orgId: req.user.orgId,
      name,
      prefix,
      keyHash: hash,
      createdBy: req.user.userId
    })

    // Return the raw key ONCE — never stored, never shown again
    res.status(201).json({
      message: 'API key created. Copy it now — it will not be shown again.',
      key: raw,
      id: apiKey._id,
      name: apiKey.name,
      prefix: apiKey.prefix
    })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// GET /api/keys — list all keys for org (prefix only)
exports.listKeys = async (req, res) => {
  try {
    const keys = await ApiKey.find({ orgId: req.user.orgId })
      .select('-keyHash')
      .populate('createdBy', 'name email')
      .sort('-createdAt')

    res.json({ keys })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}

// DELETE /api/keys/:id — revoke a key
exports.revokeKey = async (req, res) => {
  try {
    const key = await ApiKey.findOne({
      _id: req.params.id,
      orgId: req.user.orgId
    })

    if (!key) {
      return res.status(404).json({ message: 'Key not found' })
    }

    key.isActive = false
    await key.save()

    res.json({ message: 'Key revoked successfully' })
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message })
  }
}