// Marca em forma de carimbo de protocolo, usada nas telas de entrada. Na tela
// do processo o carimbo é a última decisão; aqui é o próprio sistema.
export function MarcaSimproc() {
  return (
    <div className="w-fit -rotate-2 rounded-md border-4 border-double border-carimbo px-5 py-3 text-carimbo">
      <p className="font-serif text-3xl leading-none font-semibold tracking-wide">SIMPROC</p>
      <p className="mt-1.5 text-sm">Sistema de Simulação Processual</p>
    </div>
  );
}
