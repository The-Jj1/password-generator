# Contributing

Keep the runtime dependency-free and password generation entirely local. Do not add analytics, password persistence, or insecure randomness.

1. Install development dependencies with `npm ci`.
2. Reproduce the issue and add a focused behavior test when applicable.
3. Run `npm run check`, `npm test`, `npm run test:e2e`, and `npm run build`.
4. Check keyboard use and layouts from 320px through desktop widths.
5. Explain the user-visible change and validation in your pull request.

Changes to generation must preserve uniform sampling and every selected character group. Changes to strength must account for the constrained alphabet and minimum-group requirements.
