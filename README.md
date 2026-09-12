# Minecraft Clone

A browser-based Minecraft-inspired voxel game built with JavaScript and Three.js

This project was built as a graphics programming and game engineering study, with the goal of understanding how a block-based 3D world can be generated, rendered, interacted with and persisted in the browser.

## Features

- Real-time 3D voxel world rendered with Three.js
- Procedural terrain generation using simplex noise
- Multiple biomes
- Procedurally generated trees, cactus, clouds and underground resources
- Chunk-based world generation and visibility management
- First-person player controls
- Block selection, placement and removal
- Basic player physics, gravity, jumping and collision handling
- Block textures with nearest-neighbour filtering for a pixel-art appearance
- Local browser persistence for saving and loading world changes
- Configurable world-generation parameters
- Debug UI and performance statistics

## Controls

The game uses pointer-lock controls. Keyboard and mouse input becomes active after entering the game.

| Input           | Action                               |
| --------------- | ------------------------------------ |
| `W` `A` `S` `D` | Move                                 |
| `Space`         | Jump                                 |
| `0`–`8`         | Select toolbar slot                  |
| Mouse drag      | Look around and interact with blocks |
| `Left click`    | Remove or place a block              |
| `R`             | Reset player position                |
| `F1`            | Save world to `localStorage`         |
| `F2`            | Load world from `localStorage`       |

## Installation

To run the code in a local environment, make sure that Node.js and npm are installed on the machine, as well as a modern browser with WebGL support.

Then run the following code in your terminal:

```
# 1. Clone repo + install dependencies:
git clone https://github.com/bothomaje/minecraft-clone.git && cd minecraft-clone
npm install

# 2. Start dev server and open localhost in browser
npm run dev
```

## Architecture

The project separates game responsibilities into several areas:

- **App:** initialises and coordinates the game, global configurations and app states.
- **World:** manages procedural terrain, chunks, block data and world updates.
- **Player:** manages the player camera, movement state, block targeting and interaction state.
- **Systems:** provide focused behaviour such as input, physics, interaction, persistence and resizing.
- **Scene:** manages the Three.js scene, cameras and lighting.
- **Loaders:** manage models and block textures.
- **UI:** provides the HUD and debug interfaces.
- **Utils:** contains reusable utilities such as deterministic random-number generation and data storage.

## Roadmap

This project is primarily an educational and portfolio project. The architecture is intentionally modular so that individual systems and rendering techniques can be studied and refactored independently.

Potential areas for future development include:

- [ ] Improved chunk meshing and visibility optimisation
- [ ] More sophisticated collision handling
- [ ] Additional blocks and biomes
- [ ] Better world streaming
- [ ] Inventory and item systems
- [ ] Lighting and ambient effects
- [ ] Multiplayer/networked world state
- [ ] TypeScript migration
- [ ] Automated testing
- [ ] Improved mobile/input support

## Licence

This project is licensed under the MIT License.

## Credits

This project uses Minecraft assets from the [minecraft-assets](https://github.com/InventivetalentDev/minecraft-assets) repository by InventivetalentDev.

## Disclaimer

This is an independent educational project inspired by voxel-based sandbox games. It is not affiliated with, sponsored by, or endorsed by Mojang Studios or Microsoft.
