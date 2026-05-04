'use strict'

/**
 * zyra init
 *
 * Detects OpenAI/Anthropic usage in the current project and auto-patches:
 *
 * Node.js:
 *   - Detects `require('openai')` / `import OpenAI from 'openai'`
 *   - Rewrites to use Zyra SDK (or adds --require zyra/auto to npm start)
 *
 * Python:
 *   - Detects `from openai import` / `import anthropic`
 *   - Rewrites to use zyra package
 *
 * Also writes ZYRA_KEY to .env if missing.
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

// Patterns to detect in source files
const PATTERNS = {
  node: [
    { regex: /require\(['"]openai['"]\)/g, label: 'OpenAI (Node.js require)' },
    { regex: /from ['"]openai['"]/g, label: 'OpenAI (Node.js ESM import)' },
    { regex: /require\(['"]@anthropic-ai\/sdk['"]\)/g, label: 'Anthropic (Node.js require)' },
    { regex: /from ['"]@anthropic-ai\/sdk['"]/g, label: 'Anthropic (Node.js ESM import)' }
  ],
  python: [
    { regex: /from openai import/g, label: 'OpenAI (Python)' },
    { regex: /import openai/g, label: 'OpenAI (Python module)' },
    { regex: /from anthropic import/g, label: 'Anthropic (Python)' },
    { regex: /import anthropic/g, label: 'Anthropic (Python module)' }
  ]
}

const IGNORE_DIRS = new Set(['node_modules', '.git', '__pycache__', '.venv', 'venv', 'dist', 'build', '.next'])

function walk(dir, exts, results = []) {
  let entries
  try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return results }

  for (const entry of entries) {
    if (IGNORE_DIRS.has(entry.name)) continue
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(full, exts, results)
    } else if (exts.some(e => entry.name.endsWith(e))) {
      results.push(full)
    }
  }
  return results
}

function detectProject(cwd) {
  const hasPackageJson = fs.existsSync(path.join(cwd, 'package.json'))
  const hasPyproject = fs.existsSync(path.join(cwd, 'pyproject.toml'))
  const hasSetupPy = fs.existsSync(path.join(cwd, 'setup.py'))
  const hasRequirements = fs.existsSync(path.join(cwd, 'requirements.txt'))

  const types = []
  if (hasPackageJson) types.push('node')
  if (hasPyproject || hasSetupPy || hasRequirements) types.push('python')
  return types
}

function scanFiles(cwd, lang) {
  const exts = lang === 'node' ? ['.js', '.ts', '.mjs', '.cjs'] : ['.py']
  const files = walk(cwd, exts)
  const hits = []

  for (const file of files) {
    let content
    try { content = fs.readFileSync(file, 'utf8') } catch { continue }

    const fileHits = []
    for (const pattern of PATTERNS[lang]) {
      const matches = content.match(pattern)
      if (matches) fileHits.push({ label: pattern.label, count: matches.length })
    }
    if (fileHits.length > 0) hits.push({ file: path.relative(cwd, file), patterns: fileHits })
  }
  return hits
}

function applyNodePatch(cwd, packageJsonPath) {
  // Strategy: add --require zyra/auto to the start script
  try {
    const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'))
    const scripts = pkg.scripts || {}
    let changed = false

    for (const [key, val] of Object.entries(scripts)) {
      if (['start', 'dev', 'serve'].includes(key) && typeof val === 'string') {
        if (!val.includes('zyra/auto')) {
          // Inject --require zyra/auto after `node` invocation
          pkg.scripts[key] = val
            .replace(/\bnode\b(?!\s+--require zyra)/, 'node --require zyra/auto')
            .replace(/\bnodemon\b(?!\s+--require zyra)/, 'nodemon --require zyra/auto')
          changed = true
        }
      }
    }

    if (changed) {
      fs.writeFileSync(packageJsonPath, JSON.stringify(pkg, null, 2) + '\n')
      return true
    }
    return false
  } catch {
    return false
  }
}

function applyPythonPatch(hits) {
  // For Python: print instructions (actual rewrite is complex — we print a snippet instead)
  console.log('\n  For Python, add this at the top of your entry point:\n')
  console.log('    import zyra')
  console.log('    zyra.auto_patch()  # patches openai and anthropic globally\n')
  console.log('  Or wrap your client:')
  console.log('    from zyra import Zyra')
  console.log('    client = Zyra(api_key="YOUR_OPENAI_KEY")  # drop-in for openai.OpenAI\n')
}

function ensureEnvFile(cwd) {
  const envPath = path.join(cwd, '.env')
  let content = ''
  try { content = fs.readFileSync(envPath, 'utf8') } catch {}

  if (!content.includes('ZYRA_KEY')) {
    const addition = '\n# Zyra auto-logging\nZYRA_KEY=your_zyra_key_here\n'
    fs.appendFileSync(envPath, addition)
    return true
  }
  return false
}

module.exports = async function init() {
  const cwd = process.cwd()
  console.log('\n  🔍 Zyra Init — scanning project...\n')

  const projectTypes = detectProject(cwd)
  if (projectTypes.length === 0) {
    console.log('  ⚠️  No recognized project type found (package.json / pyproject.toml / requirements.txt).')
    console.log('  Run zyra init from your project root directory.\n')
    process.exit(1)
  }

  console.log(`  Project type(s) detected: ${projectTypes.join(', ')}\n`)

  let totalHits = 0
  const summary = []

  for (const lang of projectTypes) {
    const hits = scanFiles(cwd, lang)
    totalHits += hits.length

    if (hits.length === 0) {
      console.log(`  [${lang}] No OpenAI/Anthropic usage found.\n`)
      continue
    }

    console.log(`  [${lang}] Found LLM usage in ${hits.length} file(s):`)
    for (const h of hits) {
      console.log(`    • ${h.file}`)
      for (const p of h.patterns) console.log(`        ${p.label} (${p.count} occurrence${p.count !== 1 ? 's' : ''})`)
    }
    console.log()

    if (lang === 'node') {
      const pkgPath = path.join(cwd, 'package.json')
      const patched = applyNodePatch(cwd, pkgPath)
      if (patched) {
        console.log('  ✅ [node] Added --require zyra/auto to npm start/dev scripts in package.json')
        summary.push('Updated package.json scripts to auto-load Zyra logger')
      } else {
        console.log('  ℹ️  [node] Could not auto-patch package.json scripts.')
        console.log('  Add this to your start command manually:')
        console.log('    node --require zyra/auto your_app.js\n')
      }
    }

    if (lang === 'python') {
      applyPythonPatch(hits)
    }
  }

  // .env
  const envAdded = ensureEnvFile(cwd)
  if (envAdded) {
    console.log('  ✅ Added ZYRA_KEY placeholder to .env — fill in your key from https://zyra.dev/dashboard\n')
    summary.push('Added ZYRA_KEY to .env')
  }

  if (totalHits === 0) {
    console.log('  No LLM usage detected. Nothing to patch.\n')
  } else {
    console.log('\n  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('  ✅ Zyra Init Complete\n')
    console.log('  Next steps:')
    console.log('    1. Set ZYRA_KEY in .env (get your key at https://zyra.dev/dashboard)')
    console.log('    2. Restart your app with: npm run start (or npm run dev)')
    console.log('    3. Make LLM calls — they will appear in your Zyra dashboard')
    console.log('  ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')
  }
}
