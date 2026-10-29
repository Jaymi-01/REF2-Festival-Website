/**
 * The festival doodle wallpaper behind every colour block in the mockup —
 * balloons, drums, fireworks, noodle bowls, cones, stars, bunting.
 * Returned as a data-URI so a parent can tint it via `--doodle`.
 */
export function doodleUrl(stroke: string, opacity = 0.18) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">
<g fill="none" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
<path d="M40 14a17 17 0 0 1 34 0c0 13-17 28-17 28S40 27 40 14z"/><path d="M53 44q4 7 0 12M49 58q8 5 12 0"/>
<g><path d="M150 26v-20M150 26l14-14M150 26l-14-14M150 26l19 5M150 26l-19 5M150 26l12 16M150 26l-12 16M150 26v20"/><circle cx="150" cy="26" r="4"/></g>
<path d="M238 8l6 13 14 2-10 10 2 14-12-7-12 7 2-14-10-10 14-2z"/>
<g><ellipse cx="60" cy="104" rx="26" ry="10"/><path d="M34 104v18q26 12 52 0v-18"/><path d="M44 97l-6-10M76 97l6-10M50 126l-5 11M70 126l5 11"/></g>
<path d="M126 92q22-10 46 0" /><path d="M126 92q0 26 23 32t23-32"/><path d="M149 124v14M138 142h22"/>
<path d="M240 86q-12 22 0 34t24-6-6-28-18 0z"/><path d="M250 120v16"/><path d="M240 140h22"/>
<path d="M28 190l14-30 16 30"/><path d="M26 192h36"/><path d="M34 198l6 22h14l6-22"/>
<path d="M104 176q16-16 36-4 10-18 30-4"/><path d="M140 172q-6 22-24 30"/>
<path d="M214 170q18 8 40 0"/><path d="M214 170v10q20 12 40 0v-10"/><path d="M218 184l-4 22M250 184l4 22"/>
<g><path d="M44 250q20-14 40 0 20-14 40 0" /><path d="M44 250l-4 16M84 250l-4 16M124 250l-4 16"/></g>
<path d="M180 244l8-16 8 16 9-12 7 18"/><circle cx="216" cy="238" r="2.4"/><circle cx="170" cy="240" r="2.4"/>
<path d="M258 236q-12 14-2 30"/><circle cx="262" cy="276" r="3.4"/>
<circle cx="98" cy="48" r="2.4"/><circle cx="196" cy="60" r="2.4"/><circle cx="12" cy="150" r="2.4"/><circle cx="288" cy="140" r="2.4"/><circle cx="166" cy="206" r="2.4"/><circle cx="90" cy="288" r="2.4"/><circle cx="286" cy="52" r="2.4"/><circle cx="6" cy="222" r="2.4"/>
<path d="M186 282l7 7M193 282l-7 7"/><path d="M8 68l7 7M15 68l-7 7"/><path d="M276 184l7 7M283 184l-7 7"/><path d="M118 134l6 6M124 134l-6 6"/>
</g></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
