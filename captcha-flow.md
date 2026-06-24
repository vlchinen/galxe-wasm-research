# CAPTCHA Flow Analysis

## Overview

This document describes the observed execution flow of the browser-side CAPTCHA verification system.

The analysis focuses on the interaction between frontend JavaScript, Web Worker execution, WebAssembly processing, and backend API communication.


## Execution Flow

User Action

↓

Frontend Verification Trigger

↓

Browser Environment Data Collection

↓

Web Worker Execution

↓

WebAssembly Processing

↓

Generated Verification Payload

↓

Backend API Verification


## Observed Components

### Browser Layer

The frontend collects runtime information before generating the verification payload.

Observed data categories include:

- User-Agent information
- Platform information
- Language settings
- Browser environment values


### Worker Layer

A Web Worker is used to execute part of the verification logic separately from the main browser thread.

The worker handles runtime preparation and communication with the WebAssembly module.


### WASM Layer

The WebAssembly module performs client-side computation and transforms collected data into generated verification parameters.


### API Layer

After client-side processing, the frontend sends the generated payload to backend services for validation.


## Research Notes

The verification process involves multiple stages instead of a single API request.

Understanding the complete flow requires analyzing:

- Frontend JavaScript logic
- Worker execution behavior
- WASM runtime interaction
- Network communication patterns