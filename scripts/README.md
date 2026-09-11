## Garage preview generation

Run `npm install --prefix scripts` then `npm run render --prefix scripts` after changing the room photograph, floor outline, textures, or compositor in `floor-visualizer.html`. Commit the regenerated `visualizer-previews/*.jpg` files with the source change.

The script extracts and runs the page compositor with a Canvas implementation. The standard empty garage bypasses heuristic object detection; customer photos retain the existing local compositor. Render failures fail generation rather than saving bare concrete as a preview.
