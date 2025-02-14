#!/usr/bin/env node
import { parseArgs } from 'node:util'
import esbuild from 'esbuild'
import process from 'node:process'
import { realpath } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { createServer } from 'node:http'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const nodePath = await realpath(process.argv[1])
const modulePath = await realpath(fileURLToPath(import.meta.url))
const isCLI = nodePath === modulePath

if (isCLI) cliBuild()

export async function cliBuild () {
  const { values: args, positionals } = parseArgs({
    options: {},
    strict: false,
    allowPositionals: true
  })

  await build(positionals, args)
}

export async function build (positionals, args) {
  // https://esbuild.github.io/api/#live-reload
  const livereloadJs = 'new EventSource(\'/esbuild\').addEventListener(\'change\', () => location.reload());'

  // Assigns external modules to global variables.
  // https://github.com/evanw/esbuild/issues/337
  const plugins = {
    'global-externals': (arg) => {
      const options = JSON.parse(arg)
      const filter = new RegExp(`^${Object.keys(options)}$`)

      return {
        name: 'global-externals-plugin',
        setup (build) {
          build.onResolve({ filter }, (args) => ({
            path: args.path,
            namespace: 'global-externals-plugin'
          }))
          build.onLoad({ filter: /.*/, namespace: 'global-externals-plugin' }, (args) => {
            const contents = `module.exports = ${options[args.path]}`
            return { contents }
          })
        }
      }
    }
  }

  const options = {
    logLevel: 'info',
    entryPoints: positionals,
    outfile: args.outfile,
    outdir: args.outfile ? undefined : args.outdir ?? 'dist',
    target: args.target ?? 'es2019',
    bundle: args.bundle,
    minify: args.minify,
    format: args.format,
    platform: args.platform,
    sourcemap: args.sourcemap,
    globalName: args['global-name'],
    external: argsArray(args, 'external'),
    outExtension: argsObject(args, 'out-extension'),
    banner: argsObject(args, 'banner'),
    plugins: Object.entries(argsObject(args, 'plugin'))
      .map(([name, options]) => plugins[name](options)),
    define: {
      'globalThis.__TEST__': 'false',
      ...argsObject(args, 'define')
    },
    loader: {
      '.js': 'jsx',
      ...argsObject(args, 'loader')
    },
    footer: {
      ...argsObject(args, 'footer'),
      js: (args['footer:js'] ?? '') +
          (args.livereload ? `\n${livereloadJs}` : '')
    }
  }

  if (process.env.NODE_ENV) {
    options.define['process.env.NODE_ENV'] ||= `"${process.env.NODE_ENV}"`
  }

  if (args.watch) {
    const ctx = await esbuild.context(options)
    await ctx.watch()

    if (args.servedir) {
      // Create a basic HTTP server instead of using esbuild's serve API
      const server = createServer(async (req, res) => {
        try {
          const filePath = req.url === '/' ? '/index.html' : req.url
          const fullPath = join(process.cwd(), args.servedir, filePath)
          const content = await readFile(fullPath)
          
          // Set content type based on file extension
          const ext = filePath.split('.').pop()
          const contentTypes = {
            'html': 'text/html',
            'css': 'text/css',
            'js': 'application/javascript',
            'json': 'application/json',
            'png': 'image/png',
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'gif': 'image/gif'
          }
          res.setHeader('Content-Type', contentTypes[ext] || 'text/plain')
          res.end(content)
        } catch (err) {
          res.statusCode = 404
          res.end('Not found')
        }
      })

      server.listen(3000, () => {
        console.log('Development server running on http://localhost:3000')
      })
    }
    return
  }

  await esbuild.build(options)
}

function argsArray (args, name) {
  return Object.keys(args)
    .filter(k => k.startsWith(`${name}:`))
    .map(k => k.slice(`${name}:`.length))
}

function argsObject (args, name) {
  return Object.keys(args)
    .filter(k => k.startsWith(`${name}:`))
    .reduce((acc, k) => {
      const key = k.slice(`${name}:`.length)
      acc[key] = args[k]
      return acc
    }, {})
}