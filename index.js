/**
 * Host half of the transparent glass theme bundle.
 *
 * The whole effect lives in the browser (see client.js): it remaps the public
 * --dsw-alias-* surface tokens to translucent colors, paints a wallpaper behind
 * the shell, and registers a floating opacity control panel. No Host service
 * is needed, so this entry intentionally does nothing.
 */
export function apply() {}
