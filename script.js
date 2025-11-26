// Hexagon grid configuration
let config = {
    starLayers: 9,
    patternType: 'flower',
    flowerSpacing: 3,
    flowerCenter: '#003366',
    flowerPetal: '#ffffff',
    flowerBackground: '#808080',
    perimeterColor: '#003366',
    interiorColor: '#a9a9a9',
    mosaicColor1: '#006400',
    mosaicColor2: '#ffffff',
    mosaicDirection: 'diagonal1',
    centerHighlightCenter: '#FFD700',
    centerHighlightOuter: '#4169E1',
    sixSidesArm: '#1f77b4',
    sixSidesCenter: '#008000',
    sixSidesCenterHex: '#FFD700',
    edgeColor: '#333333',
    hexSize: 25,
    showLabels: true,
    hexBorderStyle: 'filled'
};

// Zoom and pan state
let viewBox = {
    x: 0,
    y: 0,
    width: 1000,
    height: 1000,
    scale: 1
};
let isPanning = false;
let startPoint = { x: 0, y: 0 };
let lastTouchDistance = 0;

// Generate center hexagons for hexagram (matching Python logic)
function generateCenterHexagons(layers) {
    const hexes = [];
    for (let q = -layers; q <= layers; q++) {
        for (let r = -layers; r <= layers; r++) {
            if (Math.abs(q) <= layers && Math.abs(r) <= layers && Math.abs(q + r) <= layers) {
                hexes.push({ q, r, s: -q - r });
            }
        }
    }
    return hexes;
}

// Hex direction helpers (matching Python)
function hexDirection(direction) {
    const directions = [
        { q: 1, r: 0, s: -1 },   // 0
        { q: 1, r: -1, s: 0 },   // 1
        { q: 0, r: -1, s: 1 },   // 2
        { q: -1, r: 0, s: 1 },   // 3
        { q: -1, r: 1, s: 0 },   // 4
        { q: 0, r: 1, s: -1 }    // 5
    ];
    return directions[direction];
}

// Generate triangle extension for hexagram point (matching Python)
function generateTriangle(baseHex, direction, layers) {
    const dir1 = hexDirection(direction);
    const dir2 = hexDirection((direction + 2) % 6);
    const hexes = [];

    for (let layer = 1; layer <= layers; layer++) {
        for (let i = 0; i <= layer; i++) {
            const q = baseHex.q + layer * dir1.q + i * dir2.q;
            const r = baseHex.r + layer * dir1.r + i * dir2.r;
            hexes.push({ q, r, s: -q - r });
        }
    }

    return hexes;
}

// Generate complete hexagram shape (matching Python logic)
function generateHexagram(layers) {
    const hexes = new Map();

    // Add center hexagons
    const centerHexes = generateCenterHexagons(layers);
    centerHexes.forEach(h => {
        const key = `${h.q},${h.r},${h.s}`;
        hexes.set(key, h);
    });

    // Base positions for the 6 triangular points
    const baseHexes = [
        { q: 0, r: layers, s: -layers },
        { q: layers, r: 0, s: -layers },
        { q: layers, r: -layers, s: 0 },
        { q: 0, r: -layers, s: layers },
        { q: -layers, r: 0, s: layers },
        { q: -layers, r: layers, s: 0 }
    ];

    // Add 6 triangular extensions
    baseHexes.forEach((baseHex, direction) => {
        const triangle = generateTriangle(baseHex, direction, layers);
        triangle.forEach(h => {
            const key = `${h.q},${h.r},${h.s}`;
            hexes.set(key, h);
        });
    });

    // Convert map to array
    const hexArray = Array.from(hexes.values());

    // Sort by (-r, q) for top to bottom ordering (matching Python)
    hexArray.sort((a, b) => {
        if (a.r !== b.r) return a.r - b.r;
        return a.q - b.q;
    });

    // Add sequential IDs
    hexArray.forEach((h, i) => h.id = i + 1);

    return hexArray;
}

// Get neighbors of a hexagon
function getNeighbors(hex) {
    const neighbors = [];
    for (let i = 0; i < 6; i++) {
        const dir = hexDirection(i);
        neighbors.push({
            q: hex.q + dir.q,
            r: hex.r + dir.r,
            s: hex.s + dir.s
        });
    }
    return neighbors;
}

// Determine perimeter hexagons
function findPerimeter(hexagons) {
    const hexSet = new Set(hexagons.map(h => `${h.q},${h.r},${h.s}`));
    const perimeter = new Set();

    hexagons.forEach(h => {
        const neighbors = getNeighbors(h);
        const hasExternalNeighbor = neighbors.some(n => !hexSet.has(`${n.q},${n.r},${n.s}`));
        if (hasExternalNeighbor) {
            perimeter.add(`${h.q},${h.r},${h.s}`);
        }
    });

    return perimeter;
}

// Create flower pattern (matching Python's create_flower_pattern)
function createFlowerPattern(hexagons, spacing) {
    const hexSet = new Set(hexagons.map(h => `${h.q},${h.r},${h.s}`));
    const colorMap = new Map();

    // Initialize all to background
    hexagons.forEach(h => {
        colorMap.set(`${h.q},${h.r},${h.s}`, config.flowerBackground);
    });

    // Find flower centers
    const flowerCenters = [];
    const maxCoord = Math.max(...hexagons.map(h => Math.max(Math.abs(h.q), Math.abs(h.r), Math.abs(h.s))));

    for (let q = -maxCoord; q <= maxCoord; q += spacing) {
        for (let r = -maxCoord; r <= maxCoord; r += spacing) {
            const s = -q - r;
            const key = `${q},${r},${s}`;
            if (hexSet.has(key)) {
                flowerCenters.push({ q, r, s });
            }
        }
    }

    // Color centers and petals
    flowerCenters.forEach(center => {
        const centerKey = `${center.q},${center.r},${center.s}`;
        colorMap.set(centerKey, config.flowerCenter);

        // Color all 6 neighbors as petals
        for (let direction = 0; direction < 6; direction++) {
            const dir = hexDirection(direction);
            const neighbor = {
                q: center.q + dir.q,
                r: center.r + dir.r,
                s: center.s + dir.s
            };
            const neighborKey = `${neighbor.q},${neighbor.r},${neighbor.s}`;
            if (hexSet.has(neighborKey)) {
                colorMap.set(neighborKey, config.flowerPetal);
            }
        }
    });

    return { colorMap, flowerCenters };
}

// Create perimeter pattern (matching Python's create_perimeter_pattern)
function createPerimeterPattern(hexagons, perimeterSet) {
    const colorMap = new Map();

    hexagons.forEach(h => {
        const key = `${h.q},${h.r},${h.s}`;
        if (perimeterSet.has(key)) {
            colorMap.set(key, config.perimeterColor);
        } else {
            colorMap.set(key, config.interiorColor);
        }
    });

    return colorMap;
}

// Create mosaic pattern (matching Python's mosaic directions)
function createMosaicPattern(hexagons) {
    const colorMap = new Map();
    const colors = [config.mosaicColor1, config.mosaicColor2];

    const directionFormulas = {
        'diagonal1': (h) => h.q + h.r,
        'vertical': (h) => h.q + Math.floor(h.r / 2),
        'horizontal': (h) => h.r
    };

    const formula = directionFormulas[config.mosaicDirection];

    hexagons.forEach(h => {
        const key = `${h.q},${h.r},${h.s}`;
        const colorIndex = Math.abs(formula(h) % colors.length);
        colorMap.set(key, colors[colorIndex]);
    });

    return colorMap;
}

// Create triangle pattern (Outline structural mode)
function createTrianglePattern(hexagons, perimeterSet) {
    const colorMap = new Map();
    const outlineColor = config.mosaicColor1; // Use Color 1 for outlines
    const fillColor = config.mosaicColor2;    // Use Color 2 for empty space
    const layers = config.starLayers;

    let outlineCount = 0;
    let interiorCount = 0;

    hexagons.forEach(h => {
        const key = `${h.q},${h.r},${h.s}`;

        // 1. Check Axes (q=0, r=0, s=0) -> Divides the 6 angular sectors
        const isAxis = (h.q === 0 || h.r === 0 || h.s === 0);

        // 2. Check Inner Boundary (radius == layers) -> Divides Inner/Outer triangles
        const radius = Math.max(Math.abs(h.q), Math.abs(h.r), Math.abs(h.s));
        const isInnerBoundary = (radius === layers);

        // 3. Check Outer Perimeter
        const isPerimeter = perimeterSet.has(key);

        if (isAxis || isInnerBoundary || isPerimeter) {
            colorMap.set(key, outlineColor);
            outlineCount++;
        } else {
            colorMap.set(key, fillColor);
            interiorCount++;
        }
    });

    return { colorMap, outlineCount, interiorCount };
}

// Center Highlight pattern - colors the single center hexagon differently from all others
function createCenterHighlightPattern(hexagons) {
    const colorMap = new Map();
    const centerColor = config.centerHighlightCenter;
    const outerColor = config.centerHighlightOuter;

    let centerCount = 0;
    let outerCount = 0;

    hexagons.forEach(h => {
        const key = `${h.q},${h.r},${h.s}`;

        // The center is the single hexagon at origin (0,0,0)
        const isCenter = h.q === 0 && h.r === 0 && h.s === 0;

        if (isCenter) {
            colorMap.set(key, centerColor);
            centerCount++;
        } else {
            colorMap.set(key, outerColor);
            outerCount++;
        }
    });

    return { colorMap, centerCount, outerCount };
}

// Six Sides pattern - colors arm triangles differently from the center hexagonal region
// Based on hexagram-337-six-sides.py: arms get one color, center region another, origin hexagon highlighted
function createSixSidesPattern(hexagons) {
    const colorMap = new Map();
    const layers = config.starLayers;

    // Build a set of center hexagons (the inner hexagonal region)
    const centerSet = new Set();
    generateCenterHexagons(layers).forEach(h => {
        centerSet.add(`${h.q},${h.r},${h.s}`);
    });

    let armCount = 0;
    let centerCount = 0;
    let centerHexCount = 0;

    hexagons.forEach(h => {
        const key = `${h.q},${h.r},${h.s}`;
        const isOrigin = h.q === 0 && h.r === 0 && h.s === 0;

        if (isOrigin) {
            colorMap.set(key, config.sixSidesCenterHex);
            centerHexCount++;
        } else if (centerSet.has(key)) {
            colorMap.set(key, config.sixSidesCenter);
            centerCount++;
        } else {
            colorMap.set(key, config.sixSidesArm);
            armCount++;
        }
    });

    return { colorMap, armCount, centerCount, centerHexCount };
}

// Convert axial to pixel coordinates (matching Python's hex_to_pixel)
function axialToPixel(q, r, size) {
    const x = size * Math.sqrt(3) * (q + r / 2);
    const y = size * (3 / 2) * r;
    return { x, y };
}

// Create hexagon path
function hexPath(x, y, size) {
    const points = [];
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 180) * (60 * i + 30);
        points.push([
            x + size * Math.cos(angle),
            y + size * Math.sin(angle)
        ]);
    }
    return `M ${points.map(p => p.join(',')).join(' L ')} Z`;
}

// Determine text color based on background
function getTextColor(bgColor) {
    // Simple contrast calculation
    const hex = bgColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 128 ? '#000000' : '#ffffff';
}

// Render the hexagon grid
function render() {
    const svg = document.getElementById('hexCanvas');
    svg.innerHTML = '';

    // Generate hexagram
    const hexagons = generateHexagram(config.starLayers);
    const size = config.hexSize;

    // Find perimeter
    const perimeterSet = findPerimeter(hexagons);

    // Create color pattern based on selected pattern type
    let colorMap;
    let flowerCenters = [];

    // Hide all special info panels by default
    document.getElementById('flowerInfo').style.display = 'none';
    document.getElementById('outlineInfo').style.display = 'none';
    document.getElementById('interiorInfo').style.display = 'none';
    document.getElementById('centerHighlightInfo').style.display = 'none';
    document.getElementById('outerHighlightInfo').style.display = 'none';
    document.getElementById('sixSidesArmInfo').style.display = 'none';
    document.getElementById('sixSidesCenterInfo').style.display = 'none';
    document.getElementById('sixSidesCenterHexInfo').style.display = 'none';

    if (config.patternType === 'flower') {
        const result = createFlowerPattern(hexagons, config.flowerSpacing);
        colorMap = result.colorMap;
        flowerCenters = result.flowerCenters;
        document.getElementById('flowerInfo').style.display = 'block';
        document.getElementById('flowerCenterCount').textContent = flowerCenters.length;
    } else if (config.patternType === 'perimeter') {
        colorMap = createPerimeterPattern(hexagons, perimeterSet);
    } else if (config.patternType === 'mosaic') {
        colorMap = createMosaicPattern(hexagons);
    } else if (config.patternType === 'triangles') {
        const result = createTrianglePattern(hexagons, perimeterSet);
        colorMap = result.colorMap;

        document.getElementById('outlineInfo').style.display = 'block';
        document.getElementById('interiorInfo').style.display = 'block';

        // Update Legend Colors
        document.getElementById('outlineSwatch').style.backgroundColor = config.mosaicColor1;
        document.getElementById('interiorSwatch').style.backgroundColor = config.mosaicColor2;

        document.getElementById('outlineCount').textContent = result.outlineCount;
        document.getElementById('interiorCount').textContent = result.interiorCount;
    } else if (config.patternType === 'centerHighlight') {
        const result = createCenterHighlightPattern(hexagons);
        colorMap = result.colorMap;

        document.getElementById('centerHighlightInfo').style.display = 'block';
        document.getElementById('outerHighlightInfo').style.display = 'block';

        // Update Legend Colors
        document.getElementById('centerHighlightSwatch').style.backgroundColor = config.centerHighlightCenter;
        document.getElementById('outerHighlightSwatch').style.backgroundColor = config.centerHighlightOuter;

        document.getElementById('centerHighlightCount').textContent = result.centerCount;
        document.getElementById('outerHighlightCount').textContent = result.outerCount;
    } else if (config.patternType === 'sixSides') {
        const result = createSixSidesPattern(hexagons);
        colorMap = result.colorMap;

        document.getElementById('sixSidesArmInfo').style.display = 'block';
        document.getElementById('sixSidesCenterInfo').style.display = 'block';
        document.getElementById('sixSidesCenterHexInfo').style.display = 'block';

        document.getElementById('sixSidesArmSwatch').style.backgroundColor = config.sixSidesArm;
        document.getElementById('sixSidesCenterSwatch').style.backgroundColor = config.sixSidesCenter;
        document.getElementById('sixSidesCenterHexSwatch').style.backgroundColor = config.sixSidesCenterHex;

        document.getElementById('sixSidesArmCount').textContent = result.armCount;
        document.getElementById('sixSidesCenterCount').textContent = result.centerCount;
        document.getElementById('sixSidesCenterHexCount').textContent = result.centerHexCount;
    }

    // Calculate SVG dimensions
    const maxRadius = config.starLayers * size * 4.5;
    const svgSize = maxRadius * 2;

    svg.setAttribute('width', svgSize);
    svg.setAttribute('height', svgSize);

    // Update viewBox initial values if needed
    if (viewBox.width === 1000 && viewBox.height === 1000) {
        viewBox.width = svgSize;
        viewBox.height = svgSize;
        viewBox.x = -maxRadius;
        viewBox.y = -maxRadius;
    }

    svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);

    // Draw hexagons
    hexagons.forEach(hex => {
        const { x, y } = axialToPixel(hex.q, hex.r, size);
        const hexKey = `${hex.q},${hex.r},${hex.s}`;
        const hexColor = colorMap.get(hexKey);

        // Create group for hexagon and text
        const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        // Create hexagon based on border style
        if (config.hexBorderStyle === 'filled') {
            // Standard filled hexagon
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', hexPath(x, y, size * 0.95));
            path.setAttribute('fill', hexColor);
            path.setAttribute('stroke', config.edgeColor);
            path.setAttribute('stroke-width', '1.5');
            g.appendChild(path);
        } else if (config.hexBorderStyle === 'single') {
            // Single line outline only
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', hexPath(x, y, size * 0.95));
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', hexColor);
            path.setAttribute('stroke-width', '2.5');
            g.appendChild(path);
        } else if (config.hexBorderStyle === 'double') {
            // Double line outline
            const outerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            outerPath.setAttribute('d', hexPath(x, y, size * 0.95));
            outerPath.setAttribute('fill', 'none');
            outerPath.setAttribute('stroke', hexColor);
            outerPath.setAttribute('stroke-width', '2');
            g.appendChild(outerPath);

            const innerPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            innerPath.setAttribute('d', hexPath(x, y, size * 0.75));
            innerPath.setAttribute('fill', 'none');
            innerPath.setAttribute('stroke', hexColor);
            innerPath.setAttribute('stroke-width', '2');
            g.appendChild(innerPath);
        } else if (config.hexBorderStyle === 'dashed') {
            // Dashed line outline
            const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            path.setAttribute('d', hexPath(x, y, size * 0.95));
            path.setAttribute('fill', 'none');
            path.setAttribute('stroke', hexColor);
            path.setAttribute('stroke-width', '2.5');
            path.setAttribute('stroke-dasharray', `${size * 0.3} ${size * 0.15}`);
            g.appendChild(path);
        }

        // Create text label
        if (config.showLabels) {
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', x);
            text.setAttribute('y', y);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.setAttribute('font-size', size * 0.35);

            // Use appropriate text color based on border style
            if (config.hexBorderStyle === 'filled') {
                text.setAttribute('fill', getTextColor(hexColor));
            } else {
                text.setAttribute('fill', hexColor);
            }

            text.setAttribute('font-weight', 'normal');
            text.textContent = hex.id;
            g.appendChild(text);
        }

        svg.appendChild(g);
    });

    // Update info
    document.getElementById('totalHex').textContent = hexagons.length;
    document.getElementById('perimeterCount').textContent = perimeterSet.size;
}

// Zoom and pan functions
function setupZoomPan() {
    const svg = document.getElementById('hexCanvas');

    svg.addEventListener('wheel', (e) => {
        e.preventDefault();
        const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
        const rect = svg.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const svgX = viewBox.x + (mouseX / rect.width) * viewBox.width;
        const svgY = viewBox.y + (mouseY / rect.height) * viewBox.height;

        const newWidth = viewBox.width * zoomFactor;
        const newHeight = viewBox.height * zoomFactor;

        viewBox.x = svgX - (mouseX / rect.width) * newWidth;
        viewBox.y = svgY - (mouseY / rect.height) * newHeight;
        viewBox.width = newWidth;
        viewBox.height = newHeight;

        svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
    });

    svg.addEventListener('mousedown', (e) => {
        if (e.button === 0) {
            isPanning = true;
            const rect = svg.getBoundingClientRect();
            startPoint = {
                x: e.clientX - rect.left,
                y: e.clientY - rect.top
            };
            svg.style.cursor = 'grabbing';
        }
    });

    svg.addEventListener('mousemove', (e) => {
        if (isPanning) {
            const rect = svg.getBoundingClientRect();
            const currentX = e.clientX - rect.left;
            const currentY = e.clientY - rect.top;

            const dx = (startPoint.x - currentX) * (viewBox.width / rect.width);
            const dy = (startPoint.y - currentY) * (viewBox.height / rect.height);

            viewBox.x += dx;
            viewBox.y += dy;

            startPoint.x = currentX;
            startPoint.y = currentY;

            svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
        }
    });

    svg.addEventListener('mouseup', () => {
        isPanning = false;
        svg.style.cursor = 'grab';
    });

    svg.addEventListener('mouseleave', () => {
        isPanning = false;
        svg.style.cursor = 'grab';
    });

    svg.addEventListener('dblclick', () => {
        const maxRadius = config.starLayers * config.hexSize * 4.5;
        const svgSize = maxRadius * 2;
        viewBox = {
            x: -maxRadius,
            y: -maxRadius,
            width: svgSize,
            height: svgSize,
            scale: 1
        };
        svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
    });

    // Touch events for mobile
    svg.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            // Single touch - pan
            isPanning = true;
            const rect = svg.getBoundingClientRect();
            startPoint = {
                x: e.touches[0].clientX - rect.left,
                y: e.touches[0].clientY - rect.top
            };
        } else if (e.touches.length === 2) {
            // Two fingers - prepare for pinch zoom
            isPanning = false;
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            lastTouchDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );
        }
        e.preventDefault();
    }, { passive: false });

    svg.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1 && isPanning) {
            // Single touch - pan
            const rect = svg.getBoundingClientRect();
            const currentX = e.touches[0].clientX - rect.left;
            const currentY = e.touches[0].clientY - rect.top;

            const dx = (startPoint.x - currentX) * (viewBox.width / rect.width);
            const dy = (startPoint.y - currentY) * (viewBox.height / rect.height);

            viewBox.x += dx;
            viewBox.y += dy;

            startPoint.x = currentX;
            startPoint.y = currentY;

            svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
        } else if (e.touches.length === 2) {
            // Two fingers - pinch zoom
            const touch1 = e.touches[0];
            const touch2 = e.touches[1];
            const currentDistance = Math.hypot(
                touch2.clientX - touch1.clientX,
                touch2.clientY - touch1.clientY
            );

            if (lastTouchDistance > 0) {
                const zoomFactor = lastTouchDistance / currentDistance;
                const rect = svg.getBoundingClientRect();

                // Get center point between two fingers
                const centerX = ((touch1.clientX + touch2.clientX) / 2) - rect.left;
                const centerY = ((touch1.clientY + touch2.clientY) / 2) - rect.top;

                const svgX = viewBox.x + (centerX / rect.width) * viewBox.width;
                const svgY = viewBox.y + (centerY / rect.height) * viewBox.height;

                const newWidth = viewBox.width * zoomFactor;
                const newHeight = viewBox.height * zoomFactor;

                viewBox.x = svgX - (centerX / rect.width) * newWidth;
                viewBox.y = svgY - (centerY / rect.height) * newHeight;
                viewBox.width = newWidth;
                viewBox.height = newHeight;

                svg.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
            }

            lastTouchDistance = currentDistance;
        }
        e.preventDefault();
    }, { passive: false });

    svg.addEventListener('touchend', (e) => {
        if (e.touches.length < 2) {
            lastTouchDistance = 0;
        }
        if (e.touches.length === 0) {
            isPanning = false;
        }
    });

    svg.style.cursor = 'grab';
}

// Show/hide pattern controls
function updatePatternControls() {
    document.getElementById('flowerControls').style.display =
        config.patternType === 'flower' ? 'block' : 'none';
    document.getElementById('perimeterControls').style.display =
        config.patternType === 'perimeter' ? 'block' : 'none';
    document.getElementById('mosaicControls').style.display =
        (config.patternType === 'mosaic' || config.patternType === 'triangles') ? 'block' : 'none';
    document.getElementById('centerHighlightControls').style.display =
        config.patternType === 'centerHighlight' ? 'block' : 'none';
    document.getElementById('sixSidesControls').style.display =
        config.patternType === 'sixSides' ? 'block' : 'none';

    // Hide direction selector if triangles
    const directionContainer = document.querySelector('#mosaicDirection').parentElement;
    if (config.patternType === 'triangles') {
        directionContainer.style.display = 'none';
    } else {
        directionContainer.style.display = 'block';
    }
}

// Event listeners
document.getElementById('starLayers').addEventListener('input', (e) => {
    config.starLayers = parseInt(e.target.value);
    render();
    // Calculate actual hexagon count after rendering
    const hexagons = generateHexagram(config.starLayers);
    document.getElementById('starLayersValue').textContent = `${config.starLayers + 1} (${hexagons.length})`;
});

document.querySelectorAll('input[name="pattern"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
        config.patternType = e.target.value;
        updatePatternControls();
        render();
    });
});

document.getElementById('flowerSpacing').addEventListener('input', (e) => {
    config.flowerSpacing = parseInt(e.target.value);
    document.getElementById('flowerSpacingValue').textContent = config.flowerSpacing;
    render();
});

document.getElementById('flowerCenter').addEventListener('input', (e) => {
    config.flowerCenter = e.target.value;
    render();
});

document.getElementById('flowerPetal').addEventListener('input', (e) => {
    config.flowerPetal = e.target.value;
    render();
});

document.getElementById('flowerBackground').addEventListener('input', (e) => {
    config.flowerBackground = e.target.value;
    render();
});

document.getElementById('perimeterColor').addEventListener('input', (e) => {
    config.perimeterColor = e.target.value;
    render();
});

document.getElementById('interiorColor').addEventListener('input', (e) => {
    config.interiorColor = e.target.value;
    render();
});

document.getElementById('mosaicColor1').addEventListener('input', (e) => {
    config.mosaicColor1 = e.target.value;
    render();
});

document.getElementById('mosaicColor2').addEventListener('input', (e) => {
    config.mosaicColor2 = e.target.value;
    render();
});

document.getElementById('mosaicDirection').addEventListener('change', (e) => {
    config.mosaicDirection = e.target.value;
    render();
});

document.getElementById('centerHighlightCenter').addEventListener('input', (e) => {
    config.centerHighlightCenter = e.target.value;
    render();
});

document.getElementById('centerHighlightOuter').addEventListener('input', (e) => {
    config.centerHighlightOuter = e.target.value;
    render();
});

document.getElementById('sixSidesArm').addEventListener('input', (e) => {
    config.sixSidesArm = e.target.value;
    render();
});

document.getElementById('sixSidesCenter').addEventListener('input', (e) => {
    config.sixSidesCenter = e.target.value;
    render();
});

document.getElementById('sixSidesCenterHex').addEventListener('input', (e) => {
    config.sixSidesCenterHex = e.target.value;
    render();
});

document.getElementById('edgeColor').addEventListener('input', (e) => {
    config.edgeColor = e.target.value;
    render();
});

document.getElementById('hexSize').addEventListener('input', (e) => {
    config.hexSize = parseInt(e.target.value);
    document.getElementById('hexSizeValue').textContent = config.hexSize;
    render();
});

document.getElementById('showLabels').addEventListener('change', (e) => {
    config.showLabels = e.target.checked;
    render();
});

document.getElementById('hexBorderStyle').addEventListener('change', (e) => {
    config.hexBorderStyle = e.target.value;
    render();
});

function resetView() {
    config = {
        starLayers: 9,
        patternType: 'flower',
        flowerSpacing: 3,
        flowerCenter: '#003366',
        flowerPetal: '#ffffff',
        flowerBackground: '#808080',
        perimeterColor: '#003366',
        interiorColor: '#a9a9a9',
        mosaicColor1: '#006400',
        mosaicColor2: '#ffffff',
        mosaicDirection: 'diagonal1',
        centerHighlightCenter: '#FFD700',
        centerHighlightOuter: '#4169E1',
        sixSidesArm: '#1f77b4',
        sixSidesCenter: '#008000',
        sixSidesCenterHex: '#FFD700',
        edgeColor: '#333333',
        hexSize: 25,
        showLabels: true,
        hexBorderStyle: 'filled'
    };

    document.getElementById('starLayers').value = 9;
    document.getElementById('starLayersValue').textContent = '10 (541)';
    document.getElementById('patternFlower').checked = true;
    document.getElementById('flowerSpacing').value = 3;
    document.getElementById('flowerSpacingValue').textContent = 3;
    document.getElementById('flowerCenter').value = '#003366';
    document.getElementById('flowerPetal').value = '#ffffff';
    document.getElementById('flowerBackground').value = '#808080';
    document.getElementById('perimeterColor').value = '#003366';
    document.getElementById('interiorColor').value = '#a9a9a9';
    document.getElementById('mosaicColor1').value = '#006400';
    document.getElementById('mosaicColor2').value = '#ffffff';
    document.getElementById('mosaicDirection').value = 'diagonal1';
    document.getElementById('centerHighlightCenter').value = '#FFD700';
    document.getElementById('centerHighlightOuter').value = '#4169E1';
    document.getElementById('sixSidesArm').value = '#1f77b4';
    document.getElementById('sixSidesCenter').value = '#008000';
    document.getElementById('sixSidesCenterHex').value = '#FFD700';
    document.getElementById('edgeColor').value = '#333333';
    document.getElementById('hexSize').value = 25;
    document.getElementById('hexSizeValue').textContent = 25;
    document.getElementById('showLabels').checked = true;
    document.getElementById('hexBorderStyle').value = 'filled';

    const maxRadius = config.starLayers * config.hexSize * 4.5;
    const svgSize = maxRadius * 2;
    viewBox = {
        x: -maxRadius,
        y: -maxRadius,
        width: svgSize,
        height: svgSize,
        scale: 1
    };

    updatePatternControls();
    render();
}

function savePNG() {
    const svg = document.getElementById('hexCanvas');
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = svg.width.baseVal.value;
    canvas.height = svg.height.baseVal.value;

    img.onload = function () {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);

        const link = document.createElement('a');
        link.download = `hexagram-mosaic-${config.patternType}-layers${config.starLayers}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    };

    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
}

// Toggle controls panel on mobile
function toggleControls() {
    const controls = document.getElementById('controls');
    const backdrop = document.getElementById('controlsBackdrop');
    controls.classList.toggle('open');
    backdrop.classList.toggle('show');
}

// Adjust default settings for mobile devices
if (window.innerWidth <= 768) {
    config.hexSize = 20;
    config.starLayers = 4;
    document.getElementById('hexSize').value = 20;
    document.getElementById('hexSizeValue').textContent = 20;
    document.getElementById('starLayers').value = 4;
    document.getElementById('starLayersValue').textContent = 4;
}

// Handle orientation changes on mobile
window.addEventListener('orientationchange', () => {
    setTimeout(() => {
        render();
    }, 100);
});

// Initial render
updatePatternControls();
render();
setupZoomPan();
