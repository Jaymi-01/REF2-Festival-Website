/**
 * Relative-path image loader, used only by the static export.
 * Artifact hosting does not serve root-relative URLs ("/brand/x.webp"), so
 * every src is rewritten to "./brand/x.webp".
 */
export default function relativeLoader({ src }) {
  return src.startsWith("/") ? `.${src}` : src;
}
