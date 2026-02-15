import { useState, useRef, useEffect } from 'react';

interface ProductImageCarouselProps {
  images: string[];
  productName: string;
}

export const ProductImageCarousel = ({ images, productName }: ProductImageCarouselProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startY = useRef(0);
  const startIndex = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const dragOffsetRef = useRef(0);
  dragOffsetRef.current = dragOffset;

  const handleTouchStart = (e: React.TouchEvent) => {
    startX.current = e.targetTouches[0].clientX;
    startY.current = e.targetTouches[0].clientY;
    startIndex.current = currentIndex;
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    const x = e.targetTouches[0].clientX;
    const y = e.targetTouches[0].clientY;
    const dx = Math.abs(x - startX.current);
    const dy = Math.abs(y - startY.current);
    if (dx > dy && dx > 5) e.preventDefault();
    const width = containerRef.current.offsetWidth;
    const delta = x - startX.current;
    const maxDrag = width * 0.4;
    const clamped = Math.max(-maxDrag, Math.min(maxDrag, delta));
    setDragOffset(clamped);
  };

  const handleTouchEnd = () => {
    if (!containerRef.current) {
      setIsDragging(false);
      return;
    }
    const width = containerRef.current.offsetWidth;
    const threshold = width * 0.15;
    const offset = dragOffsetRef.current;
    let next = startIndex.current;
    if (offset < -threshold && startIndex.current < images.length - 1) next++;
    if (offset > threshold && startIndex.current > 0) next--;
    setCurrentIndex(Math.max(0, Math.min(next, images.length - 1)));
    setDragOffset(0);
    setIsDragging(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    startX.current = e.clientX;
    startIndex.current = currentIndex;
    setIsDragging(true);
    setDragOffset(0);
  };

  useEffect(() => {
    if (!isDragging) return;
    const onMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const width = containerRef.current.offsetWidth;
      const delta = e.clientX - startX.current;
      const maxDrag = width * 0.4;
      const clamped = Math.max(-maxDrag, Math.min(maxDrag, delta));
      setDragOffset(clamped);
    };
    const onUp = () => {
      if (!containerRef.current) return;
      const width = containerRef.current.offsetWidth;
      const threshold = width * 0.15;
      const offset = dragOffsetRef.current;
      let next = startIndex.current;
      if (offset < -threshold && startIndex.current < images.length - 1) next++;
      if (offset > threshold && startIndex.current > 0) next--;
      setCurrentIndex(Math.max(0, Math.min(next, images.length - 1)));
      setDragOffset(0);
      setIsDragging(false);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isDragging, images.length]);

  if (!images || images.length === 0) {
    return (
      <div className="aspect-[3/4] bg-secondary flex items-center justify-center">
        <span className="text-muted-foreground">Sin imagen</span>
      </div>
    );
  }

  if (images.length === 1) {
    return (
      <div className="aspect-[3/4] bg-secondary overflow-hidden">
        <img
          src={images[0]}
          alt={productName}
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  return (
    <div className="relative select-none">
      <div
        ref={containerRef}
        className="aspect-[3/4] overflow-hidden touch-none cursor-grab active:cursor-grabbing"
        style={{ touchAction: 'pan-y' }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onMouseDown={handleMouseDown}
      >
        <div
          className="flex h-full transition-transform duration-0 ease-out"
          style={{
            width: `${images.length * 100}%`,
            transform: `translateX(calc(-${currentIndex * (100 / images.length)}% + ${dragOffset}px))`,
            transitionDuration: isDragging ? '0ms' : '300ms',
          }}
        >
          {images.map((img, index) => (
            <div
              key={index}
              className="h-full flex-shrink-0"
              style={{ width: `${100 / images.length}%` }}
            >
              <img
                src={img}
                alt={`${productName} - Imagen ${index + 1}`}
                className="w-full h-full object-cover pointer-events-none"
                loading={index <= 1 ? 'eager' : 'lazy'}
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Dots - estilo IG */}
      <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
        {images.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={() => setCurrentIndex(index)}
            className={`h-1 rounded-full transition-all ${
              index === currentIndex ? 'bg-foreground w-3' : 'bg-foreground/40 w-1'
            }`}
            aria-label={`Imagen ${index + 1}`}
          />
        ))}
      </div>

      {/* Contador */}
      <div className="absolute top-3 right-3 bg-black/50 text-white text-xs px-2 py-1 rounded">
        {currentIndex + 1}/{images.length}
      </div>
    </div>
  );
};
