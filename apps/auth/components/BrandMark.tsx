export function BrandMark({
  className = "h-6 w-6",
  alt = "",
}: {
  className?: string;
  alt?: string;
}) {
  return (
    <span className={`relative inline-flex shrink-0 overflow-hidden rounded-full ${className}`}>
      <img
        src="/favicon.png"
        alt={alt}
        draggable={false}
        className="box-border h-full w-full object-contain object-center p-[5%]"
      />
    </span>
  );
}
