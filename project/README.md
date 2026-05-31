# Farm Wagon Delivery Game

**Course:** Computação Gráfica (CGRA) - L.EIC 2025/2026  
**Group:** T12G05  

### Group Members
- **Maria Inês Pinho** (202306659, up202306659@up.pt)
- **Maria Luiza Vieira** (202304306, up202304306@up.pt)
- **Mariana Almeida** (202405731, up202405731@up.pt)

---

## 1. Project Description
The **Farm Wagon Delivery Game** is a 3D interactive survival simulation built on WebCGF. Players control a horse-drawn covered wagon (prairie schooner) through a vast prairie. 
The objective is to manage the wagon's health (starting at 100 HP, decaying by 1.5 HP/sec), collect hay bales scattered around the map, and deliver them to the barn to restore health. Hitting obstacles like rocks and trees damages the wagon. Your score is the total number of seconds you manage to survive!

### Key Features
- **Procedural Terrain**: A dynamic 200x200 world generated from heightmaps with multi-layered texturing for roads and grass.
- **Physics-based Movement**: Realistic wagon handling including acceleration, braking, and steering.
- **Animated Horse**: Procedural 4-beat walk cycle synchronized with movement speed, featuring realistic leg bending.
- **Interactive Gameplay**: Pick-up and delivery mechanics, game-over states, and a real-time HUD.
- **Dynamic Lighting**: A directional sun system with a sky sphere and moving clouds.

---

## 2. Instructions to Run
1. Ensure you have a WebGL-compatible browser (Chrome, Firefox, Edge, etc.).
2. Open `project/index.html` directly or through a local development server (like VS Code Live Server).
3. The project dependencies are included in the `lib` folder.

---

## 3. Keyboard Controls
| Key | Action |
| :--- | :--- |
| **W** | Accelerate / Drive Forward |
| **S** | Brake / Decelerate |
| **A** | Steer Left (pivots the front wheel axis) |
| **D** | Steer Right (pivots the front wheel axis) |
| **P** | Pick up Hay Bale (when adjacent to a bale) |
| **L** | Drop Hay Bale |
| **R** | Restart Game (active after Game Over) |
| **Mouse** | Camera Rotation (when in Orbit Mode) |

---

## 4. Implemented Features 

Below is a clear checklist of all implemented features, organized by the **10 subthemes of the project guidelines PDF**, categorized by difficulty levels (**Mandatory**, **Advanced**, and **Extra/Bonus**), and detailed with their underlying algorithms and mathematical formulations:

---

### 1. Sky, Clouds, and Sun
*   **Mandatory**:
    *   [x] **Sky & Environment**: A sky dome with moving clouds (procedural shader) and a directional sun system that provides consistent lighting across the map.
*   **Advanced**:
    *   [x] **Procedural Moving Clouds**: Animated cloud layer (as a second texture) near the sky-sphere.
        - *Details:* A custom sky fragment shader translates a noise texture coordinate dynamically: $\text{UV}_{\text{cloud}} = \text{UV}_{\text{base}} + \vec{d}_{\text{wind}} \cdot \text{time}$.

---

### 2. Terrain Elevation & Ground Surface
*   **Mandatory**:
    *   [x] **Dynamic Terrain**: A large 200x200 world generated from a heightmap, providing realistic verticality.
        - *Details:* Vertices are dynamically displaced in the terrain vertex shader using height values sampled from a grayscale heightmap image.
*   **Advanced**:
    *   [x] **Path Shading**: A custom terrain shader that blends base grass textures with a farm road path based on a secondary mask map.
        - *Details:* The fragment shader (`terrain.frag`) samples a black-and-white path mask and uses its intensity to linearly interpolate (mix) the base grass texture with a sandy dirt road texture at road coordinates:
          $$\text{Color}_{\text{final}} = \text{Color}_{\text{grass}} \cdot (1.0 - k_{\text{path}}) + \text{Color}_{\text{dirt}} \cdot k_{\text{path}}$$

---

### 3. Scatter Elements (Rocks)
*   **Mandatory**:
    *   [x] **Textured Rocks & Vertex Perturbation**: Rocks generated with multiple textures and vertex perturbation.
        - *Details:* A vertex shader perturbs primitive sphere coordinates along their normal vectors using a sine-cosine noise model to generate natural, bumpy rocks:
          $$P'_{\text{vertex}} = P_{\text{vertex}} + \vec{N}_{\text{vertex}} \cdot A \cdot \sin(\omega \cdot P_{\text{vertex}}.x + \phi)$$
*   **Advanced**:
    *   [x] **Procedural Generation of Items**: Automated, safe spawning of obstacles (rocks and trees) dynamically scattered across the rolling terrain.
        - *Details:* The game controller dynamically calculates non-overlapping random coordinates and samples terrain height Y values, applying safe wagon/barn proximity radius buffers to prevent overlapping.

---

### 4. Flora & Grass
*   **Mandatory**:
    *   [x] **Lush Dense Grass Patches**: Dense green grass fields populated across the rolling terrain.
    *   [x] **Parameter-Based Flower Fields**: Flowers with randomized scales, colors, petal counts ($5$ to $12$), and coordinates.
*   **Advanced**:
    *   [x] **Grass Wind Shader**: A custom vertex shader oscillating grass tips over time to simulate a spring breeze. The oscillation amplitude is proportional to the vertex height ($Y$), ensuring the blade base remains rooted:
        $$\Delta x = A_{\text{wind}} \cdot (Y - Y_{\text{base}})^2 \cdot \sin(\omega_{\text{wind}} \cdot \text{time} + \text{offset}_{\text{world}})$$
    *   [x] **Dry Grass Blending**: Blending of dead/dry grass patches with green grass patches to fit the spring prairie environment.
*   **Extra / Bonus**:
    *   [x] **Static Batching/Baking System**: A highly optimized CPU pre-compilation system that merges thousands of individual grass blades and flowers into single massive VRAM buffers. This reduces the WebGL draw call count to a single digit, maintaining a locked 60 FPS.

---

### 5. Covered Light Wagon / Prairie Schooner
*   **Mandatory**:
    *   [x] **Hierarchical Model**: Covered light wagon (prairie schooner) consisting of a cloth cover occupying half the wagon length, a wooden wagon bed, a front tongue to attach horses, and 4 wheels.
*   **Advanced**:
    *   [x] **Highly Detailed Model**: Detailed grain textures and axles.

---

### 6. Wagon Interaction Mechanics & Physics
*   **Mandatory**:
    *   [x] **Steering System**: Interactive front-wheel steering where the wheel rotation matches the steering angle.
    *   [x] **Pickup System**: Ability to detect, pick up, and carry up to two hay bales. Bales are placed side-by-side in the front of the wagon bed with synchronized orientations.
*   **Advanced**:
    *   [x] **Movement Physics**: Realistic wagon handling featuring acceleration, deceleration, and braking with simulated inertia (advanced kinematics physics model):
        $$v_{t+1} = v_t + (a_{\text{engine}} - C_f \cdot v_t - C_b \cdot \text{brake}) \cdot dt$$
*   **Extra / Bonus**:
    *   [x] **Asymmetric Dual-Zone Collision Detection**: Rather than simple circular proximity checks, the wagon is split into two distinct Oriented Bounding Box (OBB) local zones:
        1.  **Zone 1 (Wagon Bed & Wheels)**: Spans local $X: [-2.5, 2.5]$, $Z: [-1.6, 1.6]$ (width $3.2$).
        2.  **Zone 2 (Front Horses)**: Spans local $X: [2.5, 8.0]$, $Z: [-3.2, 3.2]$ (width $6.4$ - extra wide to protect the side-by-side horses).
    *   [x] **Coordinate Rotation Math**:
        Obstacle coordinates $(cx, cz)$ are rotated into the wagon's local space to find the closest points:
        $$lx = (cx - x_{\text{wagon}}) \cdot \cos(\theta) - (cz - z_{\text{wagon}}) \cdot \sin(\theta)$$
        $$lz = (cx - x_{\text{wagon}}) \cdot \sin(\theta) + (cz - z_{\text{wagon}}) \cdot \cos(\theta)$$
        $$closestX_i = \max(\min X_i, \min(\max X_i, lx))$$
        $$closestZ_i = \max(\min Z_i, \min(\max Z_i, lz))$$
        If $\text{distSq}_i < r_{\text{circle}}^2$, a collision is registered, and the wagon is pushed out along the normal vector rotated back to world space, preventing the horses from clipping through obstacles.

```
Asymmetric Dual-Zone Collision Flowchart:
[Obstacle Circle: cx, cz, circleR] 
   └──► 1. Rotate to Wagon's Local Space via Heading Angle (lx, lz)
         ├──► 2. Evaluate against Zone 1 (Wagon Bed): minX1/maxX1, minZ1/maxZ1
         │     └──► Clamps coordinates to find Closest Point 1 ──► distSq1
         └──► 3. Evaluate against Zone 2 (Horses): minX2/maxX2, minZ2/maxZ2
               └──► Clamps coordinates to find Closest Point 2 ──► distSq2
                     └──► Find Min Distance squared < circleR^2?
                           ├──► [YES] Collision detected ──► Apply world pushout normal
                           └──► [NO] Safe ──► Continue physics loop
```

---

### 7. Barn
*   **Mandatory**:
    *   [x] **Wagon Barn**: Barn constructed using a wooden cube base, a dark plinth roof, window/door textures, and a delimited circular zone in front.
*   **Advanced**:
    *   [x] **Boundary Visual Feedback**: Delivery zone changes boundary colors when the wagon intersects it.
*   **Extra / Bonus**:
    *   [x] **Oriented Bounding Box (OBB) SAT Barn Collision**: Built on the **2D Separating Axis Theorem (SAT)**. Since the horses are positioned at the front ($X = 5.5$), we dynamically shifted the virtual center of the wagon box forward by **$2.75$ units** along its heading vector during SAT calculations:
        $$c_{Ax} = x_{\text{wagon}} + \cos(\theta) \cdot 2.75,\quad c_{Az} = z_{\text{wagon}} - \sin(\theta) \cdot 2.75$$
        The combined OBB half-extents are set to $e_{0A} = 5.25$ (half-length) and $e_{1A} = 3.2$ (half-width to fit the horses).
    *   [x] **3D-to-2D Roof Counter Badge**: Projects the 3D world coordinates of the barn roof into 2D HTML absolute positioning in real-time using manual MVP matrix transformations, making the bale delivery counter float dynamically over the building.

```
OBB SAT Barn Collision Workflow:
[Wagon OBB: Center, Heading] 
   └──► 1. Asymmetric Center Shift +2.75 along heading 
         └──► [Wagon + Horses OBB] (e0A = 5.25, e1A = 3.2)
[Barn OBB] (scale = 3.0, rotation = 7pi/6, e0B = 6.0, e1B = 7.5)
   └──► 2. Separating Axis Theorem (SAT) Overlap Projection Check
         ├──► 3. Generate 4 Candidate Axes (2 Wagon axes, 2 Barn axes)
         │     └──► Project shapes onto each Axis and verify interval overlap:
         │           ├──► Overlap <= 0 on ANY axis? ──► [Separated] No Collision
         │           └──► Overlap > 0 on ALL axes?  ──► [Collided] Push wagon along minimum overlap axis
```

---

### 8. Interface Elements (HUD & dat.GUI)
*   **Mandatory**:
    *   [x] **dat.GUI Folder integration**: A dedicated folder named **"Gameplay Stats"** inside `dat.GUI` (`MyInterface.js`) which uses real-time polling (`.listen()`) to update the variables: HP, last damage, last restore, bales delivered, and score.
*   **Advanced**:
    *   [x] **HUD Interface**: Real-time display of Score, Wagon HP (with health bar) and a Hay Bale count.
    *   [x] **Camera Modes**: Three distinct modes: Wagon (follows the wagon), Orbit (mouse-controlled rotation around the wagon), and Bird's Eye.
        - *Details:* Wagon follow camera rotates with the heading vector and targets slightly in front of the horses; Orbit orbits the chassis; Bird's eye provides a fixed top-down tactical overview.
*   **Extra / Bonus**:
    *   [x] **Read-Only Locking**: dat.GUI stats are configured as read-only (`pointer-events = 'none'`) to act as an un-cheatable output dashboard.
    *   [x] **Glassmorphic Interactive HUD prompts**: UI prompt cards ("Press P to Pick" / "Press L to Drop") featuring bounce and glow keyframe animations.

---

### 9. Animation
*   **Mandatory**:
    *   [x] **Axis & Wheel Animation**: All the wheels of the Wagon rotate as the wagon advances. The front wheel axis is connected to the front tongue and rotates together on a pivot point (in the center of the axis) as the wagon turns.
    *   [x] **Pinpoint Arrow**: Hay bale pinpointing arrow animated with vertical bobbing.
*   **Advanced**:
    *   [x] **Animated Horse Walk Cycle**: Spliced `.obj` mesh walk cycle representing a 4-beat gait (LH $\rightarrow$ RF $\rightarrow$ RH $\rightarrow$ LF) locked to physical speed.
    *   [x] **Joint Bending**: The animation includes realistic hock (knee) bending and hoof lifting, ensuring the horse moves naturally and stays synchronized with the wagon's speed.

---

### 10. Shaders
*   **Mandatory**:
    *   [x] **Wind grass tip displacement shader**.
    *   [x] **Floating pinpoint arrows shader**.
*   **Advanced**:
    *   [x] **Terrain Road Pathway Blending**: Multi-texture terrain shader.
    *   [x] **Rock Vertex Perturbation**: Noise-based rock vertex displacement.
    *   [x] **Procedural Cloud Shader**: Time-dependent sky texture displacement.

---

## 5. Required Screenshots
According to the final delivery guidelines, exactly 5 screenshots in Full HD resolution (1920x1080 pixels) in PNG/GIF format are submitted. The folder links are referenced below using your repository structure:

| Screenshot File (Moodle Name) | Category | Description | Preview |
| :--- | :--- | :--- | :--- |
| **project-t12g05-1.png** | Screenshot 1 | **Overall scene overview (wide angle):** Heightmap terrain, dynamic lighting, and sky. | ![ project-t12g05-1 ](project/screenshots/project-t12g05-1.png) |
| **project-t12g05-2.png** | Screenshot 2 | **Flower rocks and floor detail:** Road path blending, grass, and procedural flowers. | ![ project-t12g05-2 ](project/screenshots/project-t12g05-1.png) |
| **project-t12g05-3.png** | Screenshot 3 | **Wagon close-up (showing model detail, textures):** Hierarchical Prairie Schooner model. | ![ project-t12g05-3 ](project/screenshots/project-t12g05-1.png) |
| **project-t12g05-4.gif** | Animated Screenshot 4 | **Shader animation (animated GIF) - Grass:** Dynamic wind-blowing grass movement. | ![ project-t12g05-4 ](project/screenshots/project-t12g05-1.gif) |

---

## 6. Known Issues / Limitations
?

---

## 7. AI Use Declaration
This project was developed with assistance from **Google Gemini (Antigravity AI Assistant)**. The AI tool was utilized to:
1. **Calibrate Math Models**: Assisted in testing and correcting the asymmetric offset values for OBB SAT barn collision ($shift = 2.75$, half-length $= 5.25$) to accurately bound the horse models.

ADICIONEM AS VOSSAS

---

## 8. Project Structure
- `field/`: Grass and Flower field generation.
- `game/`: Wagon, Bale, and Game Controller logic.
- `shapes/`: Primitive geometric shapes.
- `static_elements/`: Barn, Rocks, and Trees.
- `shaders/`: GLSL shaders for all world objects.
- `textures/`: Image assets for the scene.

---
