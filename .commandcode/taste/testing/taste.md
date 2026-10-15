# testing
- Prefers automated unit tests (Vitest) for pure logic modules (insights engine, formatters, analytics) so business rules are verified without a browser. Confidence: 0.65
- When fixing a reported bug, first reproduce it with a minimal test harness (simulating the user's context, e.g., TZ=Asia/Jakarta for this UTC+7 app) to confirm the diagnosis before changing code, then lock the fix in with a permanent regression test. Confidence: 0.6
- Quality bar is zero lint errors across the whole app — pre-existing lint errors should be fixed (not merely tolerated as baseline) before the work is considered done. Confidence: 0.55
- Print-related features must include print-readability verification as an explicit deliverable — e.g., raster byte-layout tests per paper width (58mm/80mm) and a sample QR on the test print page so scanning can be verified without a sale. Confidence: 0.5
- Unit tests must not hardcode calendar dates — they go stale and fail once the real date drifts past them; date-dependent tests should use relative date helpers (e.g., getDateOffsetISO(0)) so they stay green indefinitely. Confidence: 0.5
