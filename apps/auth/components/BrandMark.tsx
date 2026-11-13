/** Circular Hosanna mark — scales the square PNG and crops white edges. */
export function BrandMark({
  className = "h-5 w-5",
  alt = "",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <span
      className={`relative inline-flex shrink-0 overflow-hidden rounded-full ${className}`}
    >
      <img
        src="/favicon.png"
        alt={alt}
        draggable={false}
        className="h-full w-full scale-[1.28] object-cover object-center"
      />
    </span>
  );
}
