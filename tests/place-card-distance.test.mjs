import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import { createRequire } from "node:module";
import ts from "typescript";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
const require = createRequire(import.meta.url);
const source = fs.readFileSync(new URL("../components/PlaceCard.tsx", import.meta.url), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.CommonJS, esModuleInterop: true } }).outputText;
const componentModule = { exports: {} };
const componentRequire = (id) => (id === "@/lib/community/flag" ? { COMMUNITY_ENABLED: false } : require(id));
vm.runInNewContext(compiled, { require: componentRequire, module: componentModule, exports: componentModule.exports });
const PlaceCard = componentModule.exports.default;
const place = { id: "place", name: "Fixture", category: "CAFE", latitude: 10, longitude: 106, distanceKm: 2.5, estimatedTravelTimeMinutes: 7 };
for (const [label, props, expected] of [["default preserves distance", {}, true], ["explicit true shows distance", { showDistance: true }, true], ["false hides distance", { showDistance: false }, false]]) {
  test(label, () => {
    const html = renderToStaticMarkup(React.createElement(PlaceCard, { place, onSelect() {}, ...props }));
    assert.equal(html.includes("2.5 km"), expected);
    assert.equal(html.includes("7 phút"), expected);
    assert.ok(html.includes("Fixture"));
    assert.ok(html.includes("https://www.google.com/maps/dir/"));
  });
}
test("estimated distance is labelled as an estimate, not a road distance", () => {
  const html = renderToStaticMarkup(React.createElement(PlaceCard, { place: { ...place, distanceEstimated: true }, onSelect() {} }));
  assert.ok(html.includes("ước tính"));
  assert.ok(!html.includes("km đường bộ"));
});
test("routed distance keeps the road distance label", () => {
  const html = renderToStaticMarkup(React.createElement(PlaceCard, { place: { ...place, distanceEstimated: false }, onSelect() {} }));
  assert.ok(html.includes("2.5 km đường bộ"));
  assert.ok(!html.includes("ước tính"));
});
