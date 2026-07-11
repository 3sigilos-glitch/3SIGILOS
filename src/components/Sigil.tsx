/* Símbolo oficial 3SIGILOS, em dourado (gerado de source/3sigilos-logo.png). */
export function Sigil({ size = 28 }: { size?: number }) {
  return (
    <img
      src={import.meta.env.BASE_URL + "marca.png"}
      width={size}
      height={size}
      alt=""
      aria-hidden="true"
      className="sigil"
      draggable={false}
    />
  );
}
