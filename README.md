# Galxe Campaign Automation

## Overview

This repository documents the process of building automation for Galxe campaign participation: authenticating with a wallet, pulling campaign data through the platform's API, and cross-referencing it against a tracked wallet list.

The focus is the full pipeline — authentication, data retrieval, and processing — rather than any single step in isolation.

⚠️ This repository is for educational and personal-automation purposes only. No bypass tooling, credentials, or production secrets are included.

## What This Covers

- Wallet-based authentication using Sign-In with Ethereum (SIWE)
- Querying campaign participant data through the platform's public API
- Cross-referencing participant data against a local wallet list
- Exporting results to Google Sheets for tracking
- Notes on the broader verification flow encountered while building this (API request patterns, client-side verification steps, multi-stage execution)

## Approach

1. Authenticate using a standard SIWE flow — generate a nonce, sign a structured message with the wallet, exchange it for a session token via the platform's GraphQL API
2. Use that session to query participant data via GraphQL, paginating through results
3. Load a local wallet list (Excel) and match it against fetched participants
4. Push matches to Google Sheets for tracking and reporting

Alongside building this pipeline, I also investigated the platform's client-side verification step (a multi-stage process combining browser environment data and client-side computation before a request is accepted). That part involved a lot of trial and error — observing behavior, forming a hypothesis, testing, and adjusting when wrong. The detailed code from that piece isn't included here since it interacts directly with anti-abuse mechanisms, but the analysis notes are.

## Repository Structure

- `authentication-flow.js` — SIWE-based wallet authentication
- `participant-analysis.js` — fetches campaign participants, cross-checks against a wallet list, exports results to Google Sheets
- `wasm-analysis.md` — notes on the client-side verification flow and its components
- `api-observations.md` — notes on frontend request patterns observed during the verification flow
- `captcha-flow.md` — notes on the end-to-end execution flow (browser → worker → verification → API)

## Disclaimer

This repository documents a personal automation project and the learning process behind it. It is shared to demonstrate automation and debugging ability, not as a tool for bypassing platform security. No private keys, credentials, or production secrets are included.