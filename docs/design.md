# Passforge design

## Intent

Build a professional, responsive password generator inspired by the supplied image: a dark plum canvas, separate password output, length slider, mint checkboxes, strength feedback, and purple action with a yellow lower edge.

The primary job is to choose a character mix, generate a password, and copy it. The first screen presents the tool directly. English UI follows the visual reference. No backend is needed because passwords must be generated on the user's device.

## Implementation decisions

Plain HTML, CSS, and ES modules minimize dependencies and make the algorithm easy to inspect. A framework would add tooling without simplifying this single screen. A server-side implementation would unnecessarily transmit passwords. These choices are implementation decisions for this project.

The centered 620px layout follows the reference hierarchy. Typography, spacing, visible focus states, copy feedback, and error handling refine it for practical use. CSS tokens keep the palette consistent. The layout supports 320px through desktop widths; rendered evidence is captured at 390×844 and 1440×1000.

## States

| State | Trigger | Feedback and recovery |
| --- | --- | --- |
| Empty | First visit or settings change | Placeholder, neutral strength, disabled copy; generate to continue |
| Invalid | All character types off | Explanation and disabled generation; select any group |
| Success | Generation completes | Password, entropy, strength, and live status; copy or regenerate |
| Copy success | Clipboard write resolves | Check icon and status announcement |
| Permission failure | Clipboard unavailable or denied | Select password and show manual copy shortcut |
| Error | Web Crypto unavailable | Clear output, disable copy, show error; retry in a supported browser |
| Loading | Not applicable | Generation is synchronous and bounded; no remote loading |
| Partial | Not applicable | A password is returned only after all requirements are met |

Changing settings clears the old result so the visible controls and password never disagree. Passwords are not automatically read aloud through the live status region. The readonly text field supports manual selection, long values, and screen readers. Reduced-motion preference disables transitions.

## Validation

Unit tests cover 15 group combinations, boundary lengths, invalid inputs, ambiguous-character removal, rejection of biased byte values, absence of Web Crypto, and independently calculated entropy fixtures. Browser tests cover regeneration, empty selection, keyboard range control, real clipboard copy, denied clipboard access, secure-randomness failure, narrow layouts, and lack of generation requests or persistent storage.
