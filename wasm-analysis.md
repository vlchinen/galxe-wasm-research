# generate_data() Research Notes

## Objective

Investigate how Galxe generates CAPTCHA-related payloads through
browser-side WebAssembly execution.

The research focuses on understanding the relationship between:

- Browser runtime
- Web Worker execution
- WebAssembly computation
- Generated verification payloads


## Observed Components

The analyzed system consists of:

- WebAssembly module responsible for client-side computation
- Browser Worker responsible for runtime isolation
- Environment information collection layer
- API communication layer


## Research Findings

Initial analysis indicates:

- CAPTCHA-related payload generation involves WebAssembly-based computation
- Worker execution collects browser environment information before computation
- Multiple derived parameters are generated during the verification process
- Client-side execution introduces additional runtime dependencies


## Technical Challenges

Main challenges encountered:

- WASM function tracing
- Import dependency reconstruction
- JavaScript ↔ WASM memory interaction analysis
- Browser execution context replication

## Function Interface Analysis

The exported WASM function was analyzed through its JavaScript binding layer.

Observed input pattern:

- Float64Array memory input
- String-based parameters
- WASM memory allocation through wasm-bindgen helpers

The analysis focused on reconstructing the JavaScript-to-WASM data exchange model.

## Methodology

The investigation followed:

1. Inspecting WASM exports and imports
2. Reviewing browser execution flow
3. Observing Worker behavior
4. Mapping generated data flow
5. Comparing runtime behavior between browser and standalone environments

## Runtime Environment

The prototype requires a browser-compatible environment.

Direct Node.js execution is limited because the WASM module depends on
browser APIs including navigator, WebGL, WebRTC, and Web Worker runtime behavior.

## Conclusion

The analysis shows that modern client-side verification systems combine
WebAssembly computation with browser runtime information.

Understanding the system requires analyzing the complete execution pipeline
rather than isolated API requests.
