## AqNivo
Wrapper around multiple Nivo data visualisation components (https://github.com/plouc/nivo)

## Features
Generic wrapper to support multiple components in one widget package
Supports SVG variations of 26 components
Define dynamic data (mapped to attribute) based on requirements for selected component
Define static (defined in widget), dynamic (mapped to attribute), or function parameter (define function definition for applicable parameters) configuration.

Configuration is loaded in the order static > dynamic > function parameters so, if the same property exists in more than one section, the most recent version will overwrite the previous

## Usage
- Add widget to page
- Select chart type
- Map to attribute holding data
- Map to attribute holding configuration and/or define static configuration and/or define parameters with functions.
- Build data JSON based on requirements for selected chart type
- If using dynamic configuration, build configuration JSON based on requirements for selected chart type

## Supported charts
Area Bump, https://nivo.rocks/area-bump/  
Bar, https://nivo.rocks/bar/  
Bullet, https://nivo.rocks/bullet/  
Bump, https://nivo.rocks/bump/  
Calendar, https://nivo.rocks/calendar/  
Chord, https://nivo.rocks/chord/  
Choropleth, https://nivo.rocks/choropleth/  
Circle Packing, https://nivo.rocks/circle-packing/  
Funnel, https://nivo.rocks/funnel/  
Geo Map, https://nivo.rocks/geomap/  
Heat Map, https://nivo.rocks/heatmap/  
Line, https://nivo.rocks/line/  
Marimekko, https://nivo.rocks/marimekko/  
Network, https://nivo.rocks/network/  
Pie, https://nivo.rocks/pie/  
Radar, https://nivo.rocks/radar/  
Radial Bar, https://nivo.rocks/radial-bar/  
Sankey, https://nivo.rocks/sankey/  
Scatter Plot, https://nivo.rocks/scatterplot/  
Stream, https://nivo.rocks/stream/  
Sunburst, https://nivo.rocks/sunburst/  
Swarm Plot, https://nivo.rocks/swarmplot/  
Time Range, https://nivo.rocks/time-range/  
Tree Map, https://nivo.rocks/treemap/  
Voronoi, https://nivo.rocks/voronoi/  
Waffle, https://nivo.rocks/waffle/  

## Issues, suggestions and feature requests
https://github.com/lindski/aq-mx-nivo/issues
