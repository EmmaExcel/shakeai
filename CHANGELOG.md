# Changelog

All notable changes to ShakeCursor SDK will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-05-17

### Added

#### Core Functionality
- Initial release of ShakeCursor AI SDK
- Cursor shake gesture detection with configurable sensitivity
- Keyboard shortcut activation (Cmd/Ctrl + K)
- Selection capture for text, images, and elements
- Multi-model provider support (Ollama, OpenRouter, Gemini, Custom)
- RAG (Retrieval Augmented Generation) with vector embeddings
- Admin API for site management and query logs
- Event callbacks for activation, selection, ask, response, and error

#### Security Features
- Rate limiting: 5 requests/second per site (10 burst capacity)
- Input sanitization with character limits (max 1000 chars)
- Dangerous character removal from inputs
- Origin-based CORS protection
- Admin API authentication via bearer token
- Request timeout protection (30s default)

#### Development Tools
- Comprehensive TypeScript type definitions
- Utility functions: debounce, throttle, safeJsonParse, formatBytes, etc.
- Enhanced gesture detection with hysteresis
- Performance optimizations with pointer tracking throttling
- Separate error logging to `.errors.jsonl`
- Response time tracking for all API calls

#### Documentation
- Complete README with setup instructions
- UPGRADE_GUIDE.md with all improvements documented
- Docker configuration (docker-compose.yml, Dockerfile)
- Environment variable documentation (.env.example)
- API documentation in code comments
- CHANGELOG.md for version history

### Improved

#### User Experience
- Debounced shake detection prevents rapid-fire triggers
- Increased gesture thresholds reduce false positives:
  - Minimum samples: 7 → 8
  - Direction reversals: 5 → 4
  - Distance traveled: 340px → 360px
- Hysteresis prevents activation during cooldown period
- Throttled pointer move processing reduces CPU usage

#### API Performance
- Response time tracking in all responses
- Graceful error handling with detailed logging
- Timeout wrappers for all model API calls
- Better CORS header configuration
- Origin validation per site key

#### Code Quality
- Type-safe selections and events
- Modular architecture with separate concerns
- Comprehensive error messages
- Structured logging format
- Input validation before processing

### Changed

- Gesture detection algorithm updated with hysteresis
- Error logging now uses separate file (`*.errors.jsonl`)
- Query logging includes response time metrics
- Model provider routing improved for better error handling

### Fixed

- Prevent accidental shake triggers during scrolling
- Rate limiter reset on site disconnection
- Improved CORS preflight handling
- Better timeout management to prevent hanging requests
- Enhanced input sanitization to prevent injection attacks

## [1.0.1] - Planned (Next Release)

### Planned Features

#### Multi-turn Conversations
- Persistent conversation history per session
- Context retention across multiple questions
- Export conversations as Markdown or JSON
- Conversation threading and summarization

#### Advanced Media Handling
- Image upload support for Gemini multimodal model
- OCR processing for image content
- Base64 encoding for secure transmission
- Image metadata preservation (alt text, dimensions)

#### Enhanced Analytics
- Usage metrics dashboard
- Most common questions per site
- Response time tracking and optimization
- Error rate monitoring
- User engagement analytics

### Security Enhancements

#### Authentication
- [ ] JWT token support for production deployments
- [ ] OAuth2 integration options
- [ ] Role-based access control (RBAC)

#### Data Protection
- [ ] Encrypted API key storage
- [ ] Rate limiting with Redis backend
- [ ] Request payload size limits
- [ ] Audit logging for admin actions

### Performance

#### Caching
- [ ] Response caching with Redis
- [ ] Query result deduplication
- [ ] Session state caching
- [ ] CDN integration support

#### Optimization
- [ ] Gzip compression for responses
- [ ] Connection pooling for database queries
- [ ] Model endpoint failover strategy
- [ ] CDN distribution of SDK assets

## [1.1.0] - Planned (Future Release)

### New Features

#### Vector Database Integration
- [ ] PostgreSQL with pgvector extension
- [ ] Milvus support
- [ ] Pinecone integration
- [ ] Hybrid search combining keyword and vector similarity

#### Model Management
- [ ] Model fine-tuning workflows
- [ ] Prompt versioning and A/B testing
- [ ] Temperature and other parameter tuning
- [ ] Multi-model ensemble for better answers

#### Platform Expansion
- [ ] Browser extension (Chrome, Firefox, Safari)
- [ ] Desktop application via Electron/Tauri
- [ ] Mobile browser compatibility improvements
- [ ] Plugin architecture for AI agents

#### Enterprise Features
- [ ] SSO integration (SAML, OIDC)
- [ ] Usage quotas and billing integration
- [ ] White-label deployments
- [ ] Webhook integrations (Slack, GitHub, etc.)

### Technical Improvements

- [ ] Migration path from JSON to database storage
- [ ] SDK bundle size optimization
- [ ] Tree shaking for production builds
- [ ] Progressive Web App support
- [ ] Service worker caching

## [2.0.0] - Vision (Long-term)

### Advanced AI Capabilities

#### Context Awareness
- [ ] Multi-turn conversation with full context retention
- [ ] User preference learning and adaptation
- [ ] Cross-session knowledge graph
- [ ] Collaborative filtering for better answers

#### Content Generation
- [ ] Code generation with syntax highlighting
- [ ] Image generation integration (DALL-E, Stable Diffusion)
- [ ] Audio transcription and synthesis
- [ ] Video analysis and understanding

#### Integration Platform
- [ ] GitHub issues automation
- [ ] Slack workspace integration
- [ ] Notion block support
- [ ] Jira ticket enrichment

---

## Version Philosophy

ShakeCursor follows semantic versioning:

- **Major versions** (X.0.0): Breaking changes, new paradigms
- **Minor versions** (X.Y.0): New features, backward compatible
- **Patch versions** (X.Y.Z): Bug fixes, security patches

## Reporting Issues

Please use GitHub issues for:
- Bug reports with reproduction steps
- Feature requests with use case details
- Security vulnerabilities (email preferred)

## Credits

This project was inspired by the growing need for contextual AI tools that respect user privacy and work seamlessly across frameworks. Special thanks to the open-source community whose libraries make this possible.
