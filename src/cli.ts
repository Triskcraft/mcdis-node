#!/usr/bin/env node
import { constants } from 'node:fs'
import { access, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parseArgs } from 'node:util'
import { createConfigTemplate, DEFAULT_CONFIG_PATH, loadConfig } from './config.js'
import { McDisApp } from './mcdis-app.js'

try {
	process.loadEnvFile('.env')
} catch (error) {
	if (error instanceof Error && 'code' in error && error.code !== 'ENOENT') {
		throw error
	}
}

const { values } = parseArgs({
	options: {
		config: {
			type: 'string',
			short: 'c',
			default: DEFAULT_CONFIG_PATH,
		},
	},
})

const configPath = values.config
const absoluteConfigPath = path.resolve(configPath)

try {
	await access(absoluteConfigPath, constants.F_OK)
} catch (error) {
	if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
		await writeFile(absoluteConfigPath, createConfigTemplate(), { flag: 'wx' })
		console.log(`Created ${configPath}. Edit it and run mcdis again.`)
		process.exit(0)
	}
	throw error
}

const config = await loadConfig(configPath)
const token = process.env[config.discord.tokenEnv]

if (!token) {
	throw new Error(
		`Missing Discord token. Set ${config.discord.tokenEnv} in the environment or .env file.`,
	)
}

const app = new McDisApp(config)
await app.run(token)
