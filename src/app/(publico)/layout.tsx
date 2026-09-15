import { MarcaSimproc } from "@/components/MarcaSimproc";

export default function LayoutPublico({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto grid w-full max-w-md content-start gap-8 px-4 py-12 sm:py-20">
      <div className="grid justify-items-start gap-4">
        <MarcaSimproc />
        <p className="text-tinta-suave">Liga de Direito Processual Penal. Acompanhe os autos da sua equipe como advogado.</p>
      </div>
      {children}
    </main>
  );
}
