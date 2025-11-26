# Hexagram Star Mosaic Visualization

An interactive web-based visualization tool that generates hexagram (Star of David) patterns using hexagonal tile mosaics. Create beautiful geometric patterns with customizable colors, sizes, and pattern types.

## Features

### Pattern Types

1. **Flower/Rosette Pattern**
   - Creates flower-like patterns with center hexagons surrounded by 6 petals
   - Adjustable spacing between flower centers
   - Customizable colors for centers, petals, and background

2. **Perimeter Pattern**
   - Distinguishes between outer edge hexagons and interior hexagons
   - Two-color scheme for perimeter vs interior

3. **Diagonal Mosaic**
   - Alternating stripe patterns in various directions
   - Five direction options: Diagonal 1 (q+r), Diagonal 2 (s), Diagonal 3 (q-r), Vertical (q), Horizontal (r)
   - Two-color alternating pattern

### Interactive Controls

- **Hexagram Layers**: Adjust the size of the hexagram (1-12 layers)
- **Hexagon Pixel Size**: Control the size of individual hexagons (15-50 pixels)
- **Color Customization**: Full color picker support for all pattern elements
- **Edge Color**: Customize the outline color of hexagons
- **Number Labels**: Toggle sequential numbering on hexagons
- **Real-time Updates**: All changes apply instantly

### Visualization Controls

- **Zoom**: Mouse wheel to zoom in/out
- **Pan**: Click and drag to move around the canvas
- **Reset View**: Double-click to reset zoom and pan
- **Reset All**: Button to restore default settings
- **Save PNG**: Export your creation as a high-quality PNG image

## Usage

1. **Open the File**: Simply open `star-visualization-mosaic.html` in any modern web browser
2. **Adjust Settings**: Use the left control panel to customize your design
3. **Select Pattern**: Choose between Flower, Perimeter, or Mosaic pattern types
4. **Customize Colors**: Click color pickers to change pattern colors
5. **Adjust Size**: Use sliders to control hexagram layers and hexagon size
6. **Export**: Click "Save PNG" to download your creation

## Technical Details

### Hexagon Coordinate System

The visualization uses cube/axial coordinates (q, r, s) for hexagon positioning:
- q: horizontal axis
- r: vertical axis
- s: diagonal axis (where q + r + s = 0)

### Hexagram Generation

The hexagram is generated in three steps:
1. Create center hexagonal region
2. Identify base positions for 6 triangular points
3. Generate triangular extensions from each base position

### Pattern Algorithms

- **Flower Pattern**: Identifies center positions at regular intervals and colors surrounding neighbors
- **Perimeter Pattern**: Detects hexagons on the outer edge by checking for external neighbors
- **Mosaic Pattern**: Uses coordinate formulas to create alternating stripe patterns

## Browser Compatibility

Works in all modern browsers that support:
- SVG rendering
- ES6 JavaScript
- HTML5 color inputs

Tested on:
- Chrome/Edge (recommended)
- Firefox
- Safari

## File Structure

- Single self-contained HTML file
- No external dependencies
- No server required
- All JavaScript and CSS embedded

## Statistics Display

The info panel shows:
- **Total Hexagons**: Total number of hexagons in the current hexagram
- **Perimeter Count**: Number of hexagons on the outer edge
- **Flower Centers**: Number of flower centers (when flower pattern is selected)

## Default Settings

- Layers: 5
- Pattern: Flower/Rosette
- Flower Spacing: 3
- Hexagon Size: 25 pixels
- Center Color: Dark Blue (#003366)
- Petal Color: White (#ffffff)
- Background: Gray (#808080)
- Edge Color: Dark Gray (#333333)
- Labels: Enabled

## Mathematical Background

The visualization is based on hexagonal grid mathematics and cube coordinate systems. The hexagram shape combines:
- A central hexagonal region
- Six triangular extensions creating the star points
- Regular hexagonal tiling principles

Each hexagon is assigned a sequential ID based on its position, ordered from top to bottom and left to right.

## Export Options

The "Save PNG" feature:
- Converts the SVG to a raster image
- Maintains the current visual settings
- Includes pattern type and layer count in filename
- Uses white background for exported images

## Tips

- Start with fewer layers (3-5) for initial experimentation
- Use the flower pattern with spacing of 3 for balanced designs
- Try different color combinations for striking visual effects
- Double-click the canvas to reset zoom if you get lost
- The diagonal mosaic patterns create interesting optical effects

## License

Open source - free to use and modify

## Credits

Implements hexagonal grid algorithms and geometric pattern generation based on cube coordinate mathematics.

---

*This README was created using an AI agent.*
