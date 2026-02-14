.PHONY: help install generate build watch test test-e2e lint package package-server test-package clean update-grammar ci

help: ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
		awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

install: ## Install all dependencies
	npm install

generate: ## Generate TypeScript parser from ANTLR4 grammar
	npm run generate

build: ## Compile TypeScript and bundle with esbuild
	npm run build

watch: ## Watch mode for development
	npm run watch

test: ## Run unit tests (vitest)
	npm run test

test-e2e: ## Run VS Code E2E tests
	npm run test:e2e

lint: ## Run ESLint
	npm run lint

package: ## Build VSIX for distribution
	npm run package

package-server: ## Build server tarball for use in other extensions
	npm run package:server
	@echo ""
	@echo "✅ Server package created:"
	@ls -lh sysml-v2-lsp-*.tgz
	@echo ""
	@echo "Install in your extension with:"
	@echo "  npm install ./path/to/sysml-v2-lsp-*.tgz"
	@echo "  — or —"
	@echo "  npm install github:daltskin/sysml-v2-lsp"

test-package: package-server ## Test npm package in a simulated consumer project
	@echo "📦 Testing npm package as a consumer..."
	@rm -rf /tmp/sysml-test-pkg
	@mkdir -p /tmp/sysml-test-pkg
	@cd /tmp/sysml-test-pkg && npm init -y > /dev/null 2>&1
	@cd /tmp/sysml-test-pkg && npm install "$$(ls -t $(CURDIR)/sysml-v2-lsp-*.tgz | head -1)" --silent 2>&1
	@cd /tmp/sysml-test-pkg && node -e " \
		const pkg = require('sysml-v2-lsp'); \
		const fs = require('fs'); \
		const { fork } = require('child_process'); \
		let ok = true; \
		for (const [name, p] of Object.entries(pkg)) { \
			const exists = fs.existsSync(p); \
			console.log(exists ? '  ✅' : '  ❌', name, '→', p); \
			if (!exists) ok = false; \
		} \
		if (!ok) { console.log('❌ Missing files'); process.exit(1); } \
		const child = fork(pkg.serverPath, ['--stdio'], { silent: true }); \
		child.on('error', e => { console.log('❌ Fork failed:', e.message); process.exit(1); }); \
		setTimeout(() => { \
			console.log('  ✅ server.mjs forks and runs (pid', child.pid + ')'); \
			child.kill(); \
			console.log(''); \
			console.log('✅ npm package test passed'); \
			process.exit(0); \
		}, 2000); \
	"
	@rm -rf /tmp/sysml-test-pkg

clean: ## Clean build artifacts
	npm run clean

GRAMMAR_REPO := daltskin/grammars-v4
GRAMMAR_BRANCH := master
GRAMMAR_DIR := sysml-v2
GRAMMAR_BASE_URL := https://raw.githubusercontent.com/$(GRAMMAR_REPO)/$(GRAMMAR_BRANCH)/$(GRAMMAR_DIR)

update-grammar: ## Pull latest grammar from daltskin/grammars-v4
	@echo "📥 Fetching grammar from $(GRAMMAR_REPO)/$(GRAMMAR_DIR)..."
	curl -fsSL $(GRAMMAR_BASE_URL)/SysMLv2Lexer.g4 -o grammar/SysMLv2Lexer.g4
	curl -fsSL $(GRAMMAR_BASE_URL)/SysMLv2Parser.g4 -o grammar/SysMLv2Parser.g4
	@echo "✅ Grammar files updated from $(GRAMMAR_REPO)"

ci: lint build test ## Full CI pipeline
