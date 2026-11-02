# Regression checks

```powershell
npm run test:regression
npx tsc --noEmit
npm run build
npm run test:browser
```

`test:points` runs the quote adapter, scoped proxy and asynchronous replacement/
clear/error tests alone. The browser suite requires Microsoft Edge on this
Windows workspace. It starts the generated standalone server on loopback port 3300
and copies public/static assets only into ignored `.next/standalone` output.

Browser cases use a synthetic user and intercepted responses for all backend
requests. They verify the actual booking UI, server-provided rate/capped points,
submitted points and pending/error/stale-response behavior. They never persist
a booking, contact a payment provider or establish a real settlement test.
Use `checkinn/docker/loyalty-preview-smoke.py` separately for direct/gateway
authorization and quote behavior on the verified database clone.

Point previews do not reserve a balance or bind a durable rate version. The
booking service rechecks points when creating a booking; reservation/recovery
remains tracked in the workspace standardization plan.
