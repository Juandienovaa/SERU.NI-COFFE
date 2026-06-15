export default function SeruniLogo({ className = "" }: { className?: string }) {
  return (
    <img 
      src="/logo-brand.png" 
      alt="Seruni Logo" 
      className={`object-contain ${className}`}
    />
  );
}
