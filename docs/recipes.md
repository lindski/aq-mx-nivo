# Recipes — one working configuration per chart type

**Every pair below was harvested from the running gallery on 2026-09-08, and every one of the 26 drew.**
They are not written from the Nivo documentation and they are not illustrative: they are the exact
`Chart data` and `Configuration` values the gallery uses, read out of the app with the charts on screen.

Copy a pair into a `Chart data` attribute and a `Configuration (static)` property and you have a working
chart. Then change it.

## How to read these

- **Chart data** goes in the String attribute bound to `Chart data` (JSON mode), or is what the data
  source + `Columns` mapping must produce (data source mode). **The attribute must be Unlimited
  length** — Mendix truncates the 200-character default silently, which turns valid JSON into
  malformed JSON.
- **Configuration** goes in `Configuration (static)`, or in the String attribute bound to
  `Configuration (dynamic)`. Same Unlimited-length requirement.
- Nothing here sets `theme` or `colors`: the charts take their palette from the app through
  `Match app theme`, which is the bottom configuration layer. Add `colors` only to override it
  deliberately.

## The data shape is the thing Nivo is inconsistent about

Getting the shape wrong does not produce a helpful error — it throws inside Nivo, several frames below
anything named after this widget, or renders NaN coordinates and reports nothing. The shape per chart
type is in the table below and in each recipe.

| Shape | Chart types |
|---|---|
| **Flat array** — one object per datum | Bar, Funnel, Marimekko, Pie, Radar, Swarm Plot, Waffle, Voronoi, Choropleth |
| **Series array** — `[{ id, data: [...] }]` | Area Bump, Bump, Heat Map, Line, Radial Bar, Scatter Plot |
| **Hierarchy object** — one root with `children` | Circle Packing, Sunburst, Tree Map |
| **Graph object** — `{ nodes, links }` | Network, Sankey |
| **Numeric matrix** — array of arrays | Chord |
| **Day/value array** | Calendar, Time Range |
| **Range/measure objects** | Bullet |
| **No bound data at all** | Geo Map — geography arrives as `features` in the configuration |

**Chord reads as hierarchical and is not.** It is `number[][]`, a square matrix, and `keys` in the
configuration must have exactly as many entries as the matrix has rows.

**Two geographic recipes are truncated.** Their `features` arrays are ~250 KB of GeoJSON, far too large
for a microflow literal — read the collection from `resources/` with a file-reading Java action at load
or seed time and store it in the configuration attribute. Everything else in those two configurations is
shown in full.

---

## Area Bump  `"chartType": "AreaBump"`

**Data shape:** series array.

```json
// Chart data
[{"id":"Financials","data":[{"x":"2022","y":28},{"x":"2023","y":26},{"x":"2024","y":24},{"x":"2025","y":22},{"x":"2026","y":21}]},{"id":"Technology","data":[{"x":"2022","y":14},{"x":"2023","y":18},{"x":"2024","y":24},{"x":"2025","y":29},{"x":"2026","y":33}]},{"id":"Energy","data":[{"x":"2022","y":22},{"x":"2023","y":20},{"x":"2024","y":17},{"x":"2025","y":15},{"x":"2026","y":13}]},{"id":"Healthcare","data":[{"x":"2022","y":18},{"x":"2023","y":19},{"x":"2024","y":19},{"x":"2025","y":18},{"x":"2026","y":18}]}]
```

```json
// Configuration
{"margin":{"top":40,"right":110,"bottom":40,"left":110},"spacing":8,"blendMode":"multiply","startLabel":"id","endLabel":"id","axisTop":{"tickSize":5,"tickPadding":5},"axisBottom":{"tickSize":5,"tickPadding":5}}
```

## Bar  `"chartType": "Bar"`

**Data shape:** flat array.

```json
// Chart data
[{"month":"Jan","Motor":120,"Property":80,"Liability":45},{"month":"Feb","Motor":132,"Property":76,"Liability":51},{"month":"Mar","Motor":101,"Property":94,"Liability":38},{"month":"Apr","Motor":134,"Property":142,"Liability":42},{"month":"May","Motor":90,"Property":88,"Liability":47},{"month":"Jun","Motor":110,"Property":71,"Liability":55}]
```

```json
// Configuration
{"keys":["Motor","Property","Liability"],"indexBy":"month","groupMode":"stacked","margin":{"top":20,"right":130,"bottom":50,"left":60},"padding":0.3,"axisBottom":{"legend":"Month","legendPosition":"middle","legendOffset":36},"axisLeft":{"legend":"Claims notified","legendPosition":"middle","legendOffset":-45},"legends":[{"dataFrom":"keys","anchor":"bottom-right","direction":"column","translateX":120,"itemWidth":100,"itemHeight":20}]}
```

## Bullet  `"chartType": "Bullet"`

**Data shape:** array of range/measure objects.

```json
// Chart data
[{"id":"Loss ratio","ranges":[40,60,100],"measures":[63],"markers":[58]},{"id":"Expense ratio","ranges":[20,30,50],"measures":[27],"markers":[30]},{"id":"NPS","ranges":[0,30,70,100],"measures":[44],"markers":[50]}]
```

```json
// Configuration
{"margin":{"top":30,"right":60,"bottom":40,"left":110},"spacing":46,"titleAlign":"start","titleOffsetX":-90,"measureSize":0.3}
```

## Bump  `"chartType": "Bump"`

**Data shape:** series array.

```json
// Chart data
[{"id":"UK Equity Income","data":[{"x":"Q1","y":3},{"x":"Q2","y":2},{"x":"Q3","y":1},{"x":"Q4","y":1}]},{"id":"Sterling Credit","data":[{"x":"Q1","y":1},{"x":"Q2","y":3},{"x":"Q3","y":4},{"x":"Q4","y":3}]},{"id":"Global Balanced","data":[{"x":"Q1","y":2},{"x":"Q2","y":1},{"x":"Q3","y":2},{"x":"Q4","y":4}]},{"id":"Emerging Debt","data":[{"x":"Q1","y":4},{"x":"Q2","y":4},{"x":"Q3","y":3},{"x":"Q4","y":2}]}]
```

```json
// Configuration
{"margin":{"top":40,"right":140,"bottom":40,"left":60},"lineWidth":3,"activeLineWidth":6,"inactiveLineWidth":3,"inactiveOpacity":0.15,"pointSize":10,"activePointSize":16,"pointBorderWidth":3,"axisBottom":{"legend":"Quarter","legendPosition":"middle","legendOffset":32},"axisLeft":{"legend":"Rank","legendPosition":"middle","legendOffset":-40}}
```

## Calendar  `"chartType": "Calendar"`

**Data shape:** array of {day,value}.

```json
// Chart data
[{"day":"2026-01-08","value":18},{"day":"2026-01-09","value":24},{"day":"2026-01-21","value":61},{"day":"2026-01-22","value":88},{"day":"2026-01-23","value":72},{"day":"2026-02-14","value":31},{"day":"2026-03-02","value":27},{"day":"2026-04-11","value":19},{"day":"2026-06-05","value":12},{"day":"2026-08-19","value":9},{"day":"2026-10-27","value":44},{"day":"2026-11-03","value":57},{"day":"2026-11-04","value":94},{"day":"2026-11-05","value":76},{"day":"2026-12-18","value":33}]
```

```json
// Configuration
{"from":"2026-01-01","to":"2026-12-31","margin":{"top":30,"right":30,"bottom":30,"left":30},"emptyColor":"#eef1f6","colors":["#c7d2e4","#9db4d4","#7f9cc4","#5c7fae"],"yearSpacing":40,"monthBorderColor":"#ffffff","dayBorderWidth":2,"dayBorderColor":"#ffffff"}
```

## Chord  `"chartType": "Chord"`

**Data shape:** numeric matrix.

```json
// Chart data
[[0,4200,1300,860],[3900,0,2100,540],[1500,1800,0,1220],[770,610,1400,0]]
```

```json
// Configuration
{"keys":["UK","Eurozone","US","Asia"],"margin":{"top":60,"right":60,"bottom":90,"left":60},"padAngle":0.02,"innerRadiusRatio":0.96,"innerRadiusOffset":0.02,"arcOpacity":1,"arcBorderWidth":1,"ribbonOpacity":0.5,"labelOffset":12}
```

## Choropleth  `"chartType": "Choropleth"`

**Data shape:** flat array + features in config.

```json
// Chart data
[{"id":"GBR","value":1480000},{"id":"IRL","value":264000},{"id":"FRA","value":892000},{"id":"DEU","value":1035000},{"id":"NLD","value":471000},{"id":"BEL","value":238000},{"id":"LUX","value":96000},{"id":"ESP","value":517000},{"id":"PRT","value":143000},{"id":"ITA","value":604000},{"id":"CHE","value":388000},{"id":"AUT","value":196000},{"id":"DNK","value":171000},{"id":"SWE","value":243000},{"id":"NOR","value":209000},{"id":"FIN","value":132000},{"id":"POL","value":287000},{"id":"CZE","value":118000},{"id":"HUN","value":84000},{"id":"ROU","value":71000},{"id":"GRC","value":63000},{"id":"TUR","value":154000},{"id":"USA","value":1420000},{"id":"CAN","value":612000},{"id":"MEX","value":229000},{"id":"BRA","value":341000},{"id":"ARG","value":97000},{"id":"CHL","value":88000},{"id":"ZAF","value":126000},{"id":"ARE","value":398000},{"id":"SAU","value":274000},{"id":"IND","value":466000},{"id":"CHN","value":731000},{"id":"JPN","value":658000},{"id":"KOR","value":352000},{"id":"MYS","value":147000},{"id":"IDN","value":163000},{"id":"AUS","value":544000},{"id":"NZL","value":118000}]
```

```json
// Configuration
{
  "features": [ /* 176 GeoJSON features, ~250 KB, read from resources at load time */ ],
  "margin": {
    "top": 0,
    "right": 0,
    "bottom": 0,
    "left": 0
  },
  "colors": "blues",
  "domain": [
    0,
    1500000
  ],
  "unknownColor": "#eef1f6",
  "label": "properties.name",
  "valueFormat": ".2s",
  "projectionTranslation": [
    0.5,
    0.55
  ],
  "projectionRotation": [
    0,
    0,
    0
  ],
  "enableGraticule": false,
  "borderWidth": 0.5,
  "borderColor": "#8a94a6",
  "legends": [
    {
      "anchor": "bottom-left",
      "direction": "column",
      "justify": true,
      "translateX": 20,
      "translateY": -100,
      "itemsSpacing": 0,
      "itemWidth": 94,
      "itemHeight": 18,
      "itemDirection": "left-to-right",
      "itemOpacity": 0.85,
      "symbolSize": 18,
      "effects": [
        {
          "on": "hover",
          "style": {
            "itemOpacity": 1
          }
        }
      ]
    }
  ]
}
```

## Circle Packing  `"chartType": "CirclePacking"`

**Data shape:** hierarchy object.

```json
// Chart data
{"id":"Global","children":[{"id":"UK","children":[{"id":"House A","children":[{"id":"UK Equity Income","value":840},{"id":"UK Smaller Cos","value":320}]},{"id":"House B","children":[{"id":"Sterling Credit","value":560}]}]},{"id":"Europe","children":[{"id":"House C","children":[{"id":"Euro Core","value":720},{"id":"Euro High Yield","value":280}]}]},{"id":"North America","children":[{"id":"House D","children":[{"id":"US Large Cap","value":1240},{"id":"US Treasury","value":610}]}]}]}
```

```json
// Configuration
{"id":"id","value":"value","margin":{"top":10,"right":10,"bottom":10,"left":10},"padding":4,"enableLabels":true,"labelsSkipRadius":16,"borderWidth":1,"leavesOnly":false}
```

## Funnel  `"chartType": "Funnel"`

**Data shape:** flat array.

```json
// Chart data
[{"id":"fnol","value":1000,"label":"Notified"},{"id":"triage","value":880,"label":"Triaged"},{"id":"assessment","value":710,"label":"Assessed"},{"id":"settlement","value":540,"label":"Settled"},{"id":"closure","value":505,"label":"Closed"}]
```

```json
// Configuration
{"margin":{"top":20,"right":20,"bottom":20,"left":20},"shapeBlending":0.66,"valueFormat":">-.0f","labelColor":{"from":"color","modifiers":[["darker",3]]},"beforeSeparatorLength":40,"afterSeparatorLength":40}
```

## Geo Map  `"chartType": "GeoMap"`

**Data shape:** NO bound data — features in config.

```json
// Chart data
[]
```

```json
// Configuration
{
  "features": [ /* 176 GeoJSON features, ~250 KB, read from resources at load time */ ],
  "margin": {
    "top": 0,
    "right": 0,
    "bottom": 0,
    "left": 0
  },
  "projectionTranslation": [
    0.5,
    0.5
  ],
  "projectionRotation": [
    0,
    0,
    0
  ],
  "fillColor": "@fn:prop:properties.fill",
  "borderWidth": 0.5,
  "borderColor": "#333333",
  "enableGraticule": true,
  "graticuleLineColor": "#666666"
}
```

## Heat Map  `"chartType": "HeatMap"`

**Data shape:** series array.

```json
// Chart data
[{"id":"North","data":[{"x":"Flood","y":72},{"x":"Fire","y":38},{"x":"Theft","y":21},{"x":"Storm","y":64},{"x":"Escape of water","y":45}]},{"id":"Midlands","data":[{"x":"Flood","y":41},{"x":"Fire","y":52},{"x":"Theft","y":37},{"x":"Storm","y":33},{"x":"Escape of water","y":58}]},{"id":"South East","data":[{"x":"Flood","y":29},{"x":"Fire","y":44},{"x":"Theft","y":61},{"x":"Storm","y":26},{"x":"Escape of water","y":49}]},{"id":"South West","data":[{"x":"Flood","y":83},{"x":"Fire","y":31},{"x":"Theft","y":24},{"x":"Storm","y":77},{"x":"Escape of water","y":40}]}]
```

```json
// Configuration
{"margin":{"top":60,"right":90,"bottom":60,"left":90},"axisTop":{"tickSize":5,"tickPadding":5,"tickRotation":-25},"axisLeft":{"tickSize":5,"tickPadding":5},"colors":{"type":"sequential","scheme":"blues"},"emptyColor":"#eef1f6","borderWidth":1,"borderColor":"#ffffff","labelTextColor":{"from":"color","modifiers":[["darker",2.5]]},"legends":[{"anchor":"bottom","translateY":40,"length":320,"thickness":8,"direction":"row"}]}
```

## Line  `"chartType": "Line"`

**Data shape:** series array.

```json
// Chart data
[{"id":"Actual","data":[{"x":"Jan","y":31},{"x":"Feb","y":29},{"x":"Mar","y":33},{"x":"Apr","y":27},{"x":"May","y":25},{"x":"Jun","y":24}]},{"id":"Target","data":[{"x":"Jan","y":28},{"x":"Feb","y":28},{"x":"Mar","y":28},{"x":"Apr","y":28},{"x":"May","y":28},{"x":"Jun","y":28}]}]
```

```json
// Configuration
{"margin":{"top":20,"right":110,"bottom":50,"left":60},"xScale":{"type":"point"},"yScale":{"type":"linear","min":0},"axisBottom":{"legend":"Month","legendPosition":"middle","legendOffset":36},"axisLeft":{"legend":"Days to settle","legendPosition":"middle","legendOffset":-45},"pointSize":8,"useMesh":true,"legends":[{"anchor":"bottom-right","direction":"column","translateX":100,"itemWidth":80,"itemHeight":20}]}
```

## Marimekko  `"chartType": "Marimekko"`

**Data shape:** flat array.

```json
// Chart data
[{"lob":"Motor","gwp":4200,"Broker":2100,"Direct":1400,"Aggregator":700},{"lob":"Property","gwp":3100,"Broker":1900,"Direct":900,"Aggregator":300},{"lob":"Liability","gwp":1800,"Broker":1500,"Direct":250,"Aggregator":50},{"lob":"Marine","gwp":900,"Broker":820,"Direct":60,"Aggregator":20},{"lob":"Cyber","gwp":1200,"Broker":700,"Direct":420,"Aggregator":80}]
```

```json
// Configuration
{"id":"lob","value":"gwp","dimensions":[{"id":"Broker","value":"Broker"},{"id":"Direct","value":"Direct"},{"id":"Aggregator","value":"Aggregator"}],"margin":{"top":40,"right":130,"bottom":60,"left":60},"innerPadding":6,"axisBottom":{"legend":"Line of business","legendOffset":40,"legendPosition":"middle"},"axisLeft":{"legend":"Share of GWP","legendOffset":-45,"legendPosition":"middle"},"legends":[{"anchor":"bottom-right","direction":"column","translateX":120,"itemWidth":100,"itemHeight":20}]}
```

## Network  `"chartType": "Network"`

**Data shape:** {nodes,links} object.

```json
// Chart data
{"nodes":[{"id":"Acme Ltd","height":2,"size":24,"cluster":1,"color":"#4c7ef3"},{"id":"Beta Trading","height":1,"size":18,"cluster":1,"color":"#4c7ef3"},{"id":"Cygnus SA","height":1,"size":16,"cluster":1,"color":"#4c7ef3"},{"id":"Delta Holdings","height":0,"size":12,"cluster":2,"color":"#2fa36b"},{"id":"Echo Partners","height":0,"size":12,"cluster":2,"color":"#2fa36b"},{"id":"Foxtrot BV","height":0,"size":10,"cluster":2,"color":"#2fa36b"},{"id":"Golf Nominees","height":0,"size":10,"cluster":3,"color":"#e0a020"}],"links":[{"source":"Acme Ltd","target":"Beta Trading","distance":60},{"source":"Acme Ltd","target":"Cygnus SA","distance":60},{"source":"Beta Trading","target":"Delta Holdings","distance":50},{"source":"Cygnus SA","target":"Echo Partners","distance":50},{"source":"Delta Holdings","target":"Echo Partners","distance":40},{"source":"Echo Partners","target":"Foxtrot BV","distance":40},{"source":"Foxtrot BV","target":"Delta Holdings","distance":40},{"source":"Cygnus SA","target":"Golf Nominees","distance":70}]}
```

```json
// Configuration
{"margin":{"top":10,"right":10,"bottom":10,"left":10},"centeringStrength":0.4,"repulsivity":8,"activeNodeSize":28,"nodeBorderWidth":1,"linkThickness":2,"nodeSize":"@fn:prop:size","linkDistance":"@fn:prop:distance","nodeColor":"@fn:prop:color","nodeBorderColor":{"from":"color","modifiers":[["darker",0.8]]},"linkColor":"#8c93a3"}
```

## Pie  `"chartType": "Pie"`

**Data shape:** flat array.

```json
// Chart data
[{"id":"Settled","label":"Settled","value":412},{"id":"InAssessment","label":"In assessment","value":186},{"id":"Notified","label":"Notified","value":94},{"id":"Repudiated","label":"Repudiated","value":37},{"id":"Reopened","label":"Reopened","value":21}]
```

```json
// Configuration
{"margin":{"top":30,"right":110,"bottom":30,"left":60},"innerRadius":0.5,"padAngle":0.7,"cornerRadius":3,"activeOuterRadiusOffset":8,"arcLinkLabelsSkipAngle":10,"arcLabelsSkipAngle":10,"legends":[{"anchor":"right","direction":"column","translateX":90,"itemWidth":90,"itemHeight":20,"symbolSize":12,"symbolShape":"circle"}]}
```

## Radar  `"chartType": "Radar"`

**Data shape:** flat array.

```json
// Chart data
[{"dimension":"Catastrophe","Portfolio":78,"Appetite":60},{"dimension":"Liability","Portfolio":45,"Appetite":55},{"dimension":"Cyber","Portfolio":62,"Appetite":40},{"dimension":"Motor","Portfolio":50,"Appetite":65},{"dimension":"Marine","Portfolio":33,"Appetite":45},{"dimension":"Credit","Portfolio":41,"Appetite":50}]
```

```json
// Configuration
{"keys":["Portfolio","Appetite"],"indexBy":"dimension","margin":{"top":50,"right":80,"bottom":40,"left":80},"gridLabelOffset":16,"dotSize":8,"dotBorderWidth":2,"legends":[{"anchor":"top-left","direction":"column","translateX":-50,"translateY":-40,"itemWidth":80,"itemHeight":20,"symbolSize":12,"symbolShape":"circle"}]}
```

## Radial Bar  `"chartType": "RadialBar"`

**Data shape:** series array.

```json
// Chart data
[{"id":"Team Alpha","data":[{"x":"Within SLA","y":86},{"x":"Breached","y":14}]},{"id":"Team Bravo","data":[{"x":"Within SLA","y":72},{"x":"Breached","y":28}]},{"id":"Team Charlie","data":[{"x":"Within SLA","y":93},{"x":"Breached","y":7}]}]
```

```json
// Configuration
{"margin":{"top":40,"right":120,"bottom":40,"left":40},"padding":0.4,"cornerRadius":2,"maxValue":100,"radialAxisStart":{"tickSize":5,"tickPadding":5},"circularAxisOuter":{"tickSize":5,"tickPadding":12},"legends":[{"anchor":"right","direction":"column","translateX":80,"itemWidth":90,"itemHeight":20,"symbolSize":12,"symbolShape":"circle"}]}
```

## Sankey  `"chartType": "Sankey"`

**Data shape:** {nodes,links} object.

```json
// Chart data
{"nodes":[{"id":"Equities"},{"id":"Fixed income"},{"id":"Cash"},{"id":"Property"},{"id":"Infrastructure"}],"links":[{"source":"Equities","target":"Fixed income","value":180},{"source":"Equities","target":"Cash","value":60},{"source":"Cash","target":"Property","value":90},{"source":"Cash","target":"Infrastructure","value":45},{"source":"Fixed income","target":"Infrastructure","value":30}]}
```

```json
// Configuration
{"margin":{"top":20,"right":140,"bottom":20,"left":40},"align":"justify","nodeOpacity":1,"nodeThickness":16,"nodeSpacing":22,"linkOpacity":0.45,"linkBlendMode":"normal","enableLinkGradient":true,"labelPosition":"outside","labelPadding":12}
```

## Scatter Plot  `"chartType": "ScatterPlot"`

**Data shape:** series array.

```json
// Chart data
[{"id":"Motor","data":[{"x":12,"y":320},{"x":24,"y":410},{"x":31,"y":505},{"x":38,"y":610},{"x":45,"y":720},{"x":52,"y":880},{"x":61,"y":1040},{"x":68,"y":1260}]},{"id":"Property","data":[{"x":15,"y":260},{"x":22,"y":300},{"x":29,"y":390},{"x":36,"y":455},{"x":47,"y":560},{"x":55,"y":690},{"x":63,"y":820},{"x":72,"y":990}]},{"id":"Cyber","data":[{"x":18,"y":540},{"x":27,"y":700},{"x":34,"y":910},{"x":42,"y":1180},{"x":50,"y":1490},{"x":58,"y":1860},{"x":66,"y":2280}]}]
```

```json
// Configuration
{"margin":{"top":20,"right":130,"bottom":60,"left":80},"xScale":{"type":"linear","min":0,"max":80},"yScale":{"type":"linear","min":0,"max":2500},"nodeSize":9,"axisBottom":{"legend":"Modelled risk score","legendPosition":"middle","legendOffset":44},"axisLeft":{"legend":"Premium","legendPosition":"middle","legendOffset":-65},"legends":[{"anchor":"bottom-right","direction":"column","translateX":110,"itemWidth":90,"itemHeight":18,"symbolSize":10,"symbolShape":"circle"}]}
```

## Stream  `"chartType": "Stream"`

**Data shape:** array of key/value objects.

```json
// Chart data
[{"Equities":42,"Bonds":31,"Property":12,"Cash":18},{"Equities":48,"Bonds":28,"Property":14,"Cash":15},{"Equities":39,"Bonds":35,"Property":11,"Cash":22},{"Equities":55,"Bonds":24,"Property":16,"Cash":12},{"Equities":61,"Bonds":22,"Property":18,"Cash":9},{"Equities":52,"Bonds":29,"Property":15,"Cash":14},{"Equities":58,"Bonds":26,"Property":19,"Cash":11}]
```

```json
// Configuration
{"keys":["Equities","Bonds","Property","Cash"],"margin":{"top":20,"right":130,"bottom":50,"left":50},"offsetType":"silhouette","axisBottom":{"legend":"Quarter","legendOffset":36,"legendPosition":"middle"},"borderColor":{"theme":"background"},"legends":[{"anchor":"bottom-right","direction":"column","translateX":110,"itemWidth":90,"itemHeight":20,"symbolSize":12}]}
```

## Sunburst  `"chartType": "Sunburst"`

**Data shape:** hierarchy object.

```json
// Chart data
{"id":"Portfolio","children":[{"id":"Equities","children":[{"id":"Financials","children":[{"id":"Bank A","value":420},{"id":"Insurer B","value":260}]},{"id":"Technology","children":[{"id":"Software C","value":510},{"id":"Hardware D","value":180}]}]},{"id":"Fixed income","children":[{"id":"Government","children":[{"id":"Gilts","value":640}]},{"id":"Corporate","children":[{"id":"IG credit","value":310},{"id":"High yield","value":150}]}]},{"id":"Alternatives","children":[{"id":"Property","value":220},{"id":"Infrastructure","value":160}]}]}
```

```json
// Configuration
{"margin":{"top":10,"right":10,"bottom":10,"left":10},"id":"id","value":"value","cornerRadius":2,"borderWidth":1,"borderColor":{"theme":"background"},"enableArcLabels":true,"arcLabelsSkipAngle":10}
```

## Swarm Plot  `"chartType": "SwarmPlot"`

**Data shape:** flat array.

```json
// Chart data
[{"id":"p1","group":"Motor","price":-4.2,"volume":12},{"id":"p2","group":"Motor","price":1.8,"volume":18},{"id":"p3","group":"Motor","price":6.4,"volume":9},{"id":"p4","group":"Motor","price":11.2,"volume":22},{"id":"p5","group":"Motor","price":3.1,"volume":15},{"id":"p6","group":"Property","price":-1.5,"volume":11},{"id":"p7","group":"Property","price":4.9,"volume":25},{"id":"p8","group":"Property","price":8.7,"volume":14},{"id":"p9","group":"Property","price":13.4,"volume":19},{"id":"p10","group":"Property","price":2.2,"volume":8},{"id":"p11","group":"Liability","price":7.6,"volume":16},{"id":"p12","group":"Liability","price":15.1,"volume":10},{"id":"p13","group":"Liability","price":9.3,"volume":21},{"id":"p14","group":"Liability","price":0.4,"volume":13},{"id":"p15","group":"Liability","price":5.8,"volume":17}]
```

```json
// Configuration
{"groups":["Motor","Property","Liability"],"groupBy":"group","identity":"id","value":"price","valueScale":{"type":"linear","min":-10,"max":20},"size":{"key":"volume","values":[8,25],"sizes":[6,20]},"margin":{"top":40,"right":60,"bottom":60,"left":60},"layout":"vertical","spacing":10,"axisBottom":{"legend":"Line of business","legendPosition":"middle","legendOffset":44},"axisLeft":{"legend":"Rate change percent","legendPosition":"middle","legendOffset":-50}}
```

## Time Range  `"chartType": "TimeRange"`

**Data shape:** array of {day,value}.

```json
// Chart data
[{"day":"2026-03-01","value":12},{"day":"2026-03-02","value":31},{"day":"2026-03-03","value":28},{"day":"2026-03-04","value":45},{"day":"2026-03-05","value":22},{"day":"2026-03-08","value":9},{"day":"2026-03-09","value":37},{"day":"2026-03-10","value":41},{"day":"2026-03-11","value":19},{"day":"2026-03-12","value":52},{"day":"2026-03-15","value":14},{"day":"2026-03-16","value":33},{"day":"2026-03-17","value":26},{"day":"2026-03-18","value":48},{"day":"2026-03-19","value":21}]
```

```json
// Configuration
{"from":"2026-03-01","to":"2026-03-31","margin":{"top":40,"right":40,"bottom":40,"left":40},"emptyColor":"#eef1f6","colors":["#c7d2e4","#9db4d4","#7f9cc4","#5c7fae"],"dayBorderWidth":2,"dayBorderColor":"#ffffff","weekdayTicks":[0,2,4]}
```

## Tree Map  `"chartType": "TreeMap"`

**Data shape:** hierarchy object.

```json
// Chart data
{"name":"Fund","children":[{"name":"Financials","children":[{"name":"Bank A","weight":420},{"name":"Insurer B","weight":260},{"name":"Asset mgr C","weight":140}]},{"name":"Technology","children":[{"name":"Software C","weight":510},{"name":"Hardware D","weight":180}]},{"name":"Energy","children":[{"name":"Utility E","weight":300},{"name":"Renewables F","weight":210}]},{"name":"Healthcare","children":[{"name":"Pharma G","weight":365}]}]}
```

```json
// Configuration
{"identity":"name","value":"weight","margin":{"top":10,"right":10,"bottom":10,"left":10},"labelSkipSize":12,"enableParentLabel":true,"parentLabelPosition":"top","parentLabelSize":18,"borderWidth":2,"borderColor":{"theme":"background"}}
```

## Voronoi  `"chartType": "Voronoi"`

**Data shape:** flat array of {id,x,y}.

```json
// Chart data
[{"id":0,"x":18,"y":22},{"id":1,"x":63,"y":14},{"id":2,"x":41,"y":48},{"id":3,"x":86,"y":37},{"id":4,"x":25,"y":71},{"id":5,"x":72,"y":66},{"id":6,"x":54,"y":88},{"id":7,"x":9,"y":52},{"id":8,"x":95,"y":79},{"id":9,"x":33,"y":6}]
```

```json
// Configuration
{"xDomain":[0,100],"yDomain":[0,100],"margin":{"top":10,"right":10,"bottom":10,"left":10},"enableLinks":true,"linkLineWidth":1,"cellLineWidth":2,"cellLineColor":"#5c7fae","enablePoints":true,"pointSize":6}
```

## Waffle  `"chartType": "Waffle"`

**Data shape:** flat array.

```json
// Chart data
[{"id":"AAA","label":"AAA","value":18},{"id":"AA","label":"AA","value":24},{"id":"A","label":"A","value":31},{"id":"BBB","label":"BBB","value":15},{"id":"BB","label":"BB or below","value":12}]
```

```json
// Configuration
{"total":100,"rows":10,"columns":10,"margin":{"top":10,"right":130,"bottom":10,"left":10},"padding":1,"borderRadius":2,"legends":[{"anchor":"right","direction":"column","translateX":110,"itemWidth":100,"itemHeight":20,"symbolSize":14,"symbolShape":"square"}]}
```
