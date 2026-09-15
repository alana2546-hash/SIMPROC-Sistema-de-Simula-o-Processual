import { BookOpen, FileText, GraduationCap, Scale } from "lucide-react";
import type { ReactNode } from "react";
import s from "./entrada.module.css";

export { s as estilosEntrada };

// Moldura das telas de entrada: imagem e apresentação à esquerda, cartão à
// direita. Cada tela (login, cadastro, aguardando) preenche só o miolo do cartão.
export function TelaEntrada({ children }: { children: ReactNode }) {
  return (
    <main className={s["simproc-login"]}>
      <section className={s["simproc-hero"]}>
        <div className={s["hero-overlay"]} />
        <div className={s["hero-glow"]} />

        <div className={s["hero-content"]}>
          <div className={s.eyebrow}>
            <span className={s["eyebrow-line"]} />
            CONHECIMENTO QUE TRANSFORMA
          </div>

          <div className={s.brand}>
            <div className={s["brand-symbol"]} aria-hidden>
              <div className={s["pillar-top"]} />
              <div className={s["pillar-columns"]}>
                <span />
                <span />
                <span />
              </div>
              <div className={s["pillar-bottom"]} />
            </div>

            <div>
              <div className={s["brand-name"]}>SIMPROC</div>
              <div className={s["brand-subtitle"]}>Sistema de Simulação Processual</div>
            </div>
          </div>

          <div className={s["hero-copy"]}>
            <h1>
              Aprenda Direito
              <br />
              <span>na prática.</span>
            </h1>

            <h2>
              Simule. Estude. <span>Evolua.</span>
            </h2>

            <p>
              Vivencie casos simulados e desenvolva
              <br />
              raciocínio jurídico com uma experiência
              <br />
              prática e moderna.
            </p>
          </div>

          <div className={s.features}>
            <Recurso icone={<FileText size={25} />} titulo="Casos" descricao="práticos" />
            <Recurso icone={<Scale size={25} />} titulo="Simulações" descricao="processuais" />
            <Recurso icone={<BookOpen size={25} />} titulo="Estudo mais" descricao="imersivo" />
          </div>
        </div>

        <div className={s["hero-bottom-message"]}>
          <span />
          O DIREITO TAMBÉM
          <br />
          SE APRENDE FAZENDO
        </div>
      </section>

      <section className={s["login-side"]}>
        <div className={`${s["background-orbit"]} ${s["orbit-one"]}`} />
        <div className={`${s["background-orbit"]} ${s["orbit-two"]}`} />
        <div className={`${s["background-orbit"]} ${s["orbit-three"]}`} />

        <div className={s["side-top-message"]} aria-hidden>
          <span />
          <div>
            ESTUDAR HOJE
            <br />
            CONSTRÓI OS JURISTAS
            <br />
            DE AMANHÃ
          </div>
        </div>

        <div className={s["login-card"]}>
          <div className={s["card-brand"]}>
            <div className={s["mini-symbol"]} aria-hidden>
              <div className={s["mini-top"]} />
              <div className={s["mini-columns"]}>
                <span />
                <span />
                <span />
              </div>
              <div className={s["mini-bottom"]} />
            </div>

            <div>
              <strong>SIMPROC</strong>
              <span>Sistema de Simulação Processual</span>
            </div>
          </div>

          {children}

          <div className={s["card-footer"]}>
            <GraduationCap size={21} aria-hidden />
            <span>Sua jornada no Direito começa aqui.</span>
          </div>
        </div>

        <div className={s["side-bottom-message"]} aria-hidden>
          <span />
          <div>
            O DIREITO TAMBÉM
            <br />
            SE APRENDE FAZENDO
          </div>
        </div>
      </section>
    </main>
  );
}

function Recurso({ icone, titulo, descricao }: { icone: ReactNode; titulo: string; descricao: string }) {
  return (
    <div className={s.feature}>
      <div className={s["feature-icon"]} aria-hidden>
        {icone}
      </div>
      <div>
        <strong>{titulo}</strong>
        <span>{descricao}</span>
      </div>
    </div>
  );
}
