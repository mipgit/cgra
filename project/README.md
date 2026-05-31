# Farm Wagon Delivery Game

**Group T12G05**
- Maria Inês Pinho (202306659)
- Maria Luiza Vieira (202304306)
- Mariana Almeida (202405731)

---

## Project Description
The **Farm Wagon Delivery Game** is a 3D interactive simulation where players control a horse-drawn wagon through a procedurally generated farm environment. The objective is to navigate the terrain, locate hay bales, and deliver them to the farm's barn while managing the wagon's health and avoiding obstacles like rocks and trees.

### Key Features
- **Procedural Terrain**: A dynamic 200x200 world generated from heightmaps with multi-layered texturing for roads and grass.
- **Physics-based Movement**: Realistic wagon handling including acceleration, braking, and steering.
- **Animated Horse**: Procedural 4-beat walk cycle synchronized with movement speed, featuring realistic leg bending.
- **Interactive Gameplay**: Pick-up and delivery mechanics, game-over states, and a real-time HUD.
- **Dynamic Lighting**: A directional sun system with a sky sphere and moving clouds.

---

## Instructions to Run
1. Ensure you have a WebGL-compatible browser (Chrome, Firefox, Edge, etc.).
2. Open `project/index.html` directly or through a local development server (like VS Code Live Server).
3. The project dependencies are included in the `lib` folder.

---

## Keyboard Controls
| Key | Action |
| :--- | :--- |
| **W** | Accelerate / Drive Forward |
| **S** | Brake |
| **A** | Steer Left |
| **D** | Steer Right |
| **P** | Pick up Hay Bale (when near) |
| **L** | Drop Hay Bale |
| **R** | Restart Game (after Game Over) |
| **Mouse** | Camera (when in Orbit Mode) |

---

## Implemented Features

### 1. Scene & World Generation
- **Dynamic Terrain**: A large 200x200 world generated from a heightmap, providing realistic verticality.
- **Path Shading**: A custom terrain shader that blends base grass textures with a farm road path based on a secondary mask map.
- **Sky & Environment**: A sky dome with moving clouds (procedural shader) and a directional sun system that provides consistent lighting across the map.

### 2. Wagon Mechanics & Physics
- **Movement Physics**: Realistic wagon handling featuring acceleration, deceleration, and braking with simulated inertia.
- **Steering System**: Interactive front-wheel steering where the wheel rotation matches the steering angle.
- **Pickup System**: Ability to detect, pick up, and carry up to two hay bales. Bales are placed side-by-side in the front of the wagon bed with synchronized orientations.

### 3. Procedural Animation (Bonus)
- **Advanced Horse Gait**: A 4-beat procedural walk cycle (LH → RF → RH → LF) implemented via vertex shaders. 
- **Joint Bending**: The animation includes realistic hock (knee) bending and hoof lifting, ensuring the horse moves naturally and stays synchronized with the wagon's speed.

### 4. Technical Optimization
- **Static Batching/Baking**: Implementation of a "baking" system for vegetation. 
- **Performance**: Thousands of grass blades and multiple flower fields are consolidated into single `CGFobject` chunks on the CPU. This allows the scene to render massive amounts of vegetation in just a few draw calls.

### 5. Interactive Gameplay & HUD
- **Collision Detection**: Proximity-based collision for rocks and trees, and OBB (Oriented Bounding Box) collision for the barn.
- **HUD Interface**: Real-time display of Score, Wagon HP (with health bar) and a Hay Bale count.
- **Camera Modes**: Three distinct modes: Wagon (follows the wagon), Orbit (mouse-controlled rotation around the wagon), and Bird's Eye.


## AI Declaration
?


## Project Structure
- `field/`: Grass and Flower field generation.
- `game/`: Wagon, Bale, and Game Controller logic.
- `shapes/`: Primitive geometric shapes.
- `static_elements/`: Barn, Rocks, and Trees.
- `shaders/`: GLSL shaders for all world objects.
- `textures/`: Image assets for the scene.
