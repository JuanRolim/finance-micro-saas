/* ============================================
   ETAPAS DO ASSISTENTE
============================================ */

const ETAPAS = {

   VALOR: 1,
   TIPO: 2,
   CATEGORIA: 3,
   RESUMO: 4

};

/* ============================================
   ESTADO
============================================ */

let etapaAtual = ETAPAS.VALOR;

let registroAtual = {

   data: new Date(),

   tipo: "",
   fluxo: "",
   natureza: "",

   pagamento: "À vista",
   categoria: "",
   subcategoria: "",
   essencialidade: "",
   comportamento: "",
   valor: 0,
   observacao: "",
   idMovimentacao: "",
   idMeta: "",
   parcelado: false,
   quantidadeParcelas: 1

};

/* ============================================
   SUBCATEGORIAS
============================================ */

let classificacaoConfig = null;
let erroConfiguracaoClassificacao = "";
let carregamentoConfiguracaoClassificacao = null;
let metasAportePromise = null;
let erroMetasAporte = "";
let registroSalvando = false;
let resultadoSalvamentoDesconhecido = false;

function invalidarConfiguracaoTransacao() {
    classificacaoConfig = null;
    erroConfiguracaoClassificacao = "";
    carregamentoConfiguracaoClassificacao = null;
}

/* ============================================
   TELA PRINCIPAL
============================================ */

function renderTransaction() {

   return `

       <div class="app-container">

           ${renderProgress()}

           <main class="app-content">

               ${renderCurrentStep()}

           </main>

       </div>

   `;

}

/* ============================================
   INICIALIZAÇÃO
============================================ */

function inicializarTransaction() {
    if (!classificacaoConfig && !erroConfiguracaoClassificacao) {
        carregarConfiguracoesTransacao();
    }

    if (
        registroAtual.natureza === "Aporte para sonho" &&
        !registroAtual.idMeta &&
        !metasAportePromise
    ) {
        metasAportePromise = buscarMetas()
            .then((resultado) => {
                metas = resultado;
                if (etapaAtual === ETAPAS.CATEGORIA) {
                    app.innerHTML = renderTransaction();
                    inicializarTransaction();
                }
            })
            .catch((erro) => {
                console.error("Erro ao carregar metas para o aporte:", erro);
                erroMetasAporte = erro.message;
                if (etapaAtual === ETAPAS.CATEGORIA) {
                    app.innerHTML = renderTransaction();
                    inicializarTransaction();
                }
            })
            .finally(() => {
                metasAportePromise = null;
            });
    }

    if (etapaAtual === ETAPAS.VALOR) {
        document.getElementById("btnContinuar")
            ?.addEventListener("click", salvarValor);
        document.getElementById("valor")
            ?.addEventListener("input", aplicarMascaraMoeda);
        document.getElementById("parcelado")
            ?.addEventListener("change", atualizarVisibilidadeParcelas);
        document.getElementById("quantidadeParcelas")
            ?.addEventListener("change", (event) => {
                registroAtual.quantidadeParcelas = Number(event.target.value);
            });
        document.getElementById("btnVoltarDashboard")
            ?.addEventListener("click", () => navegar("dashboard"));
        document.getElementById("btnCancelar")
            ?.addEventListener("click", () => navegar("dashboard"));

        document.querySelectorAll(".transaction-keypad__button")
            .forEach((botao) => {
                botao.addEventListener("click", () => atualizarValorPeloTeclado(botao));
            });

        atualizarVisibilidadeParcelas();
    }

    if (etapaAtual === ETAPAS.TIPO) {
        document.querySelectorAll("[data-fluxo][data-natureza]")
            .forEach((opcao) => opcao.addEventListener("click", salvarTipo));
        document.getElementById("btnVoltar")
            ?.addEventListener("click", voltarEtapa);
    }

    if (etapaAtual === ETAPAS.CATEGORIA) {
        document.getElementById("btnVoltar")
            ?.addEventListener("click", voltarEtapa);
        document.getElementById("categoria")
            ?.addEventListener("change", atualizarSubcategorias);
        document.getElementById("subcategoria")
            ?.addEventListener("change", (event) => {
                registroAtual.subcategoria = event.target.value;
            });
        document.getElementById("essencialidade")
            ?.addEventListener("change", (event) => {
                registroAtual.essencialidade = event.target.value;
            });
        document.getElementById("comportamento")
            ?.addEventListener("change", (event) => {
                registroAtual.comportamento = event.target.value;
            });
        document.getElementById("metaMovimentacao")
            ?.addEventListener("change", (event) => {
                registroAtual.idMeta = event.target.value;
            });
        document.getElementById("btnRecarregarMetas")
            ?.addEventListener("click", () => {
                erroMetasAporte = "";
                inicializarTransaction();
            });
        document.getElementById("btnRecarregarConfiguracoes")
            ?.addEventListener("click", () => {
                erroConfiguracaoClassificacao = "";
                carregamentoConfiguracaoClassificacao = null;
                classificacaoConfig = null;
                inicializarTransaction();
            });
        document.getElementById("btnContinuarClassificacao")
            ?.addEventListener("click", salvarCategoria);
    }

    if (etapaAtual === ETAPAS.RESUMO) {
        document.getElementById("btnSalvar")
            ?.addEventListener("click", finalizarRegistro);
        document.getElementById("btnVoltar")
            ?.addEventListener("click", voltarEtapa);
        document.getElementById("pagamento")
            ?.addEventListener("change", (event) => {
                registroAtual.pagamento = event.target.value;
            });
        document.getElementById("observacao")
            ?.addEventListener("input", (event) => {
                registroAtual.observacao = event.target.value;
            });
    }
}

function carregarConfiguracoesTransacao() {
    if (carregamentoConfiguracaoClassificacao) {
        return carregamentoConfiguracaoClassificacao;
    }

    carregamentoConfiguracaoClassificacao = obterConfiguracoesClassificacao()
        .then((configuracoes) => {
            classificacaoConfig = configuracoes;
            erroConfiguracaoClassificacao = "";
            if (etapaAtual === ETAPAS.CATEGORIA) {
                app.innerHTML = renderTransaction();
                inicializarTransaction();
            }
            return configuracoes;
        })
        .catch((erro) => {
            erroConfiguracaoClassificacao = erro.message;
            carregamentoConfiguracaoClassificacao = null;
            if (etapaAtual === ETAPAS.CATEGORIA) {
                app.innerHTML = renderTransaction();
                inicializarTransaction();
            }
            throw erro;
        });

    carregamentoConfiguracaoClassificacao.catch(() => {});
    return carregamentoConfiguracaoClassificacao;
}

/* ============================================
   ETAPA ATUAL
============================================ */

function renderCurrentStep() {

   switch (etapaAtual) {

       case ETAPAS.VALOR:
           return renderStepValor();

       case ETAPAS.TIPO:
           return renderStepTipo();

       case ETAPAS.CATEGORIA:
           return renderStepCategoria();

       case ETAPAS.RESUMO:
           return renderStepResumo();

       default:
           return "";

   }

}

/* ============================================
   ETAPA 1 - VALOR
============================================ */

function renderStepValor() {

   return `

       <section class="assistant-step transaction-step transaction-step--value">

           <header class="transaction-header">

               <button
                   id="btnVoltarDashboard"
                   class="back-button">

                   ←

               </button>

               <h2>Nova movimentação</h2>

           </header>

           <div class="transaction-hero">
               <p class="transaction-eyebrow">Etapa 1</p>
               <h2 class="step-title">Quanto foi?</h2>
           </div>

           <div class="transaction-value-card card">
               <div class="transaction-value-card__amount">
                   <span class="currency">R$</span>
                   <input
                       id="valor"
                       class="value-input"
                       type="text"
                       placeholder="0,00"
                       value="${registroAtual.valor ? escaparHtml(Number(registroAtual.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })) : ""}"
                       autofocus
                   >
               </div>

               <div class="transaction-keypad">
                   <button class="transaction-keypad__button" type="button">1</button>
                   <button class="transaction-keypad__button" type="button">2</button>
                   <button class="transaction-keypad__button" type="button">3</button>
                   <button class="transaction-keypad__button" type="button">4</button>
                   <button class="transaction-keypad__button" type="button">5</button>
                   <button class="transaction-keypad__button" type="button">6</button>
                   <button class="transaction-keypad__button" type="button">7</button>
                   <button class="transaction-keypad__button" type="button">8</button>
                   <button class="transaction-keypad__button" type="button">9</button>
                   <button class="transaction-keypad__button transaction-keypad__button--muted" type="button">.</button>
                   <button class="transaction-keypad__button" type="button">0</button>
                   <button class="transaction-keypad__button transaction-keypad__button--muted" type="button">⌫</button>
               </div>
           </div>

           ${renderParcelamentoNoValor()}

           <div class="transaction-actions">
               <button class="secondary-button" type="button" id="btnCancelar">Cancelar</button>
               <button id="btnContinuar" class="primary-button" type="button">Continuar</button>
           </div>

       </section>

   `;

}

/* ============================================
   ETAPA 2 - TIPO
============================================ */

function renderStepTipo() {

   return `

       <section class="assistant-step transaction-step transaction-step--choice">

           <header class="transaction-header transaction-header--compact">
               <button id="btnVoltar" class="back-button" type="button">←</button>
               <h2>Nova movimentação</h2>
           </header>

           <div class="transaction-hero transaction-hero--compact">
               <p class="transaction-eyebrow">Etapa 2</p>
               <h2 class="step-title">Como o dinheiro se movimentou?</h2>
           </div>

           <div class="transaction-choice-grid">
               <button class="option-card transaction-choice-card" type="button"
                   data-fluxo="Entrada" data-natureza="Receita">
                   <span class="transaction-choice-card__icon">↗</span>
                   <span class="transaction-choice-card__label">Entrada · Receita</span>
               </button>

               <button class="option-card transaction-choice-card" type="button"
                   data-fluxo="Saída" data-natureza="Despesa">
                   <span class="transaction-choice-card__icon">↘</span>
                   <span class="transaction-choice-card__label">Despesa</span>
               </button>

               <button class="option-card transaction-choice-card" type="button"
                   data-fluxo="Saída" data-natureza="Investimento">
                   <span class="transaction-choice-card__icon">↗</span>
                   <span class="transaction-choice-card__label">Saída · Investimento</span>
               </button>

               <button class="option-card transaction-choice-card" type="button"
                   data-fluxo="Saída" data-natureza="Aporte para sonho">
                   <span class="transaction-choice-card__icon">◎</span>
                   <span class="transaction-choice-card__label">Saída · Aporte para sonho</span>
               </button>
           </div>

       </section>

   `;

}

/* ============================================
   ETAPA 3 - CATEGORIA
============================================ */

function renderStepCategoria() {
    if (!classificacaoConfig) {
        return `
            <section class="assistant-step transaction-step transaction-step--classification">
                <header class="transaction-header transaction-header--compact">
                    <button id="btnVoltar" class="back-button" type="button">←</button>
                    <h2>Nova movimentação</h2>
                </header>
                <div class="transaction-hero transaction-hero--compact">
                    <p class="transaction-eyebrow">Etapa 3</p>
                    <h2 class="step-title">Preparando categorias</h2>
                </div>
                <div class="card transaction-classification-loading" role="status">
                    ${erroConfiguracaoClassificacao
                        ? `<p>${escaparHtml(erroConfiguracaoClassificacao)}</p>
                           <button id="btnRecarregarConfiguracoes" class="secondary-button" type="button">Tentar novamente</button>`
                        : "<p>Carregando as opções uma vez para agilizar as próximas escolhas…</p>"}
                </div>
            </section>
        `;
    }

    const opcoes = classificacaoConfig.classificacoes.filter((opcao) =>
        opcao.fluxo === registroAtual.fluxo &&
        opcao.natureza === registroAtual.natureza
    );
    const categorias = Array.from(new Set(opcoes.map((opcao) => opcao.categoria)));
    const possuiEssencialidade = registroAtual.natureza === "Despesa";
    const categoriasHtml = categorias.map((categoria) => `
        <option value="${escaparHtml(categoria)}"
            ${categoria === registroAtual.categoria ? "selected" : ""}>
            ${escaparHtml(categoria)}
        </option>
    `).join("");
    const subcategoriasDisponiveis = obterSubcategoriasCategoria(
        registroAtual.categoria,
        opcoes
    );
    const subcategoriasHtml = obterSubcategoriasCategoria(
        registroAtual.categoria,
        opcoes
    ).map((subcategoria) => `
        <option value="${escaparHtml(subcategoria)}"
            ${subcategoria === registroAtual.subcategoria ? "selected" : ""}>
            ${escaparHtml(subcategoria)}
        </option>
    `).join("");
    return `

        <section class="assistant-step transaction-step transaction-step--classification">
            <header class="transaction-header transaction-header--compact">
                <button id="btnVoltar" class="back-button" type="button">←</button>
                <h2>Nova movimentação</h2>
            </header>

            <div class="transaction-hero transaction-hero--compact">
                <p class="transaction-eyebrow">Etapa 3</p>
                <h2 class="step-title">Classifique em poucos toques</h2>
                <p class="transaction-classification-context">
                    ${escaparHtml(registroAtual.fluxo)} · ${escaparHtml(registroAtual.natureza)}
                </p>
            </div>

            <div class="card transaction-classification-form">
                <div class="form-group">
                    <label for="categoria">Categoria</label>
                    <select id="categoria" required>
                        <option value="">Selecione</option>
                        ${categoriasHtml}
                    </select>
                </div>

                <div class="form-group">
                    <label for="subcategoria">Subcategoria</label>
                    <select id="subcategoria"
                        ${subcategoriasDisponiveis.length ? "required" : "disabled"}>
                        <option value="">
                            ${subcategoriasDisponiveis.length ? "Selecione" : "Não se aplica"}
                        </option>
                        ${subcategoriasHtml}
                    </select>
                </div>

                ${possuiEssencialidade ? `
                    <div class="transaction-classification-dimensions">
                        <div class="form-group">
                            <label for="essencialidade">Essencialidade</label>
                            <select id="essencialidade" required>
                                <option value="">Selecione</option>
                                ${["Essencial", "Não essencial"].map((valor) => `
                                    <option value="${valor}"
                                        ${registroAtual.essencialidade === valor ? "selected" : ""}>
                                        ${valor}
                                    </option>
                                `).join("")}
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="comportamento">Comportamento</label>
                            <select id="comportamento" required>
                                <option value="">Selecione</option>
                                ${["Fixo", "Variável", "Periódico"].map((valor) => `
                                    <option value="${valor}"
                                        ${registroAtual.comportamento === valor ? "selected" : ""}>
                                        ${valor}
                                    </option>
                                `).join("")}
                            </select>
                        </div>
                    </div>
                ` : ""}

                ${registroAtual.natureza === "Aporte para sonho" ? `
                    <div class="form-group">
                        <label for="metaMovimentacao">Meta do aporte</label>
                        <select id="metaMovimentacao" required
                            ${registroAtual.idMeta ? "disabled" : ""}>
                            ${obterOpcoesMetas(registroAtual.idMeta)}
                        </select>
                        ${erroMetasAporte
                            ? `<small class="transaction-field-error">${escaparHtml(erroMetasAporte)}
                               <button id="btnRecarregarMetas" class="secondary-button" type="button">Tentar novamente</button></small>`
                            : ""}
                    </div>
                ` : ""}
            </div>

            <div class="transaction-actions">
                <button id="btnContinuarClassificacao" class="primary-button" type="button">
                    Continuar
                </button>
            </div>
        </section>

    `;

}

/* ============================================
   ETAPA 4 - DETALHES
============================================ */

function renderParcelamentoNoValor() {
   const permiteParcelamento =
       !registroAtual.natureza || registroAtual.natureza === "Despesa";

   return `

       <div class="detail-card card transaction-parcelamento-card no-margin-top">

           <div class="transaction-parcelamento-card__row">
               <label class="checkbox-card">
                   <input
                       type="checkbox"
                       id="parcelado"
                       ${registroAtual.parcelado ? "checked" : ""}
                       ${permiteParcelamento ? "" : "disabled"}
                   >
                   <span>Parcelado</span>
               </label>
               <span class="transaction-parcelamento-card__hint">À vista</span>
           </div>

           <div id="containerParcelas" class="${permiteParcelamento && registroAtual.parcelado ? "" : "hidden"}">

               <label for="quantidadeParcelas">

                   Quantidade de parcelas

               </label>

               <select id="quantidadeParcelas">

                   ${Array.from({ length: 12 }, (_, index) => index + 1).map((valor) => `

                       <option value="${valor}" ${Number(registroAtual.quantidadeParcelas) === valor ? "selected" : ""}>

                           ${valor}x

                       </option>

                   `).join("")}

               </select>

           </div>

       </div>

   `;

}

function capturarParcelamentoNoValor() {

   if (
       registroAtual.tipo !== "Despesa" ||
       (registroAtual.natureza && registroAtual.natureza !== "Despesa")
   ) {

       registroAtual.parcelado = false;
       registroAtual.quantidadeParcelas = 1;
       return;

   }

   const checkboxParcelado = document.getElementById("parcelado");
   const selectParcelas = document.getElementById("quantidadeParcelas");

   if (checkboxParcelado) {

       registroAtual.parcelado = checkboxParcelado.checked;

   }

   if (selectParcelas) {

       registroAtual.quantidadeParcelas = Number(selectParcelas.value);

   }

   if (!registroAtual.parcelado) {

       registroAtual.quantidadeParcelas = 1;

   }

}

/* ============================================
   ETAPA 5 - RESUMO
============================================ */

function renderStepResumo() {

   return `

       <section class="assistant-step transaction-step transaction-step--summary">

           <header class="transaction-header transaction-header--compact">
               <button id="btnVoltar" class="back-button" type="button">←</button>
               <h2>Nova movimentação</h2>
           </header>

           <div class="transaction-hero transaction-hero--compact">
               <p class="transaction-eyebrow">Etapa 4</p>
               <h2 class="step-title">Confirmação</h2>
           </div>

           <div class="card summary-card transaction-summary-card">
               <div class="summary-row">
                   <span class="summary-icon">
                       ${registroAtual.tipo === "Receita"
                           ? "💰"
                           : registroAtual.natureza === "Investimento"
                           ? "📈"
                           : registroAtual.natureza === "Aporte para sonho"
                           ? "🎯"
                           : registroAtual.tipo === "Despesa"
                           ? "🛒"
                           : "⚖️"}
                   </span>
                   <div>
                       <h3>${escaparHtml(registroAtual.fluxo)} · ${escaparHtml(registroAtual.natureza)}</h3>
                       <p>${escaparHtml(registroAtual.categoria || "Categoria")}</p>
                   </div>
               </div>

               <div class="summary-value">
                   R$ ${registroAtual.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
               </div>

               <div class="transaction-summary-details">
                   <div class="transaction-summary-details__row">
                       <span>Subcategoria</span>
                       <strong>${escaparHtml(registroAtual.subcategoria || "—")}</strong>
                   </div>
                   ${registroAtual.natureza === "Despesa" ? `
                       <div class="transaction-summary-details__row">
                           <span>Essencialidade</span>
                           <strong>${escaparHtml(registroAtual.essencialidade || "—")}</strong>
                       </div>
                       <div class="transaction-summary-details__row">
                           <span>Comportamento</span>
                           <strong>${escaparHtml(registroAtual.comportamento || "—")}</strong>
                       </div>
                   ` : ""}
                   <div class="transaction-summary-details__row">
                       <span>Data</span>
                       <strong>${new Date(registroAtual.data).toLocaleDateString("pt-BR")}</strong>
                   </div>
                   <div class="transaction-summary-details__row">
                       <span>Parcelamento</span>
                       <strong>${registroAtual.natureza === "Despesa" && registroAtual.parcelado ? `${registroAtual.quantidadeParcelas}x` : "À vista"}</strong>
                   </div>
               </div>
           </div>

           <div class="card transaction-confirmation-fields">
               <div class="form-group">
                   <label for="pagamento">Pagamento</label>
                   <select id="pagamento">
                       ${["À vista", "Cartão de crédito", "Cartão de débito", "Pix", "Dinheiro", "Transferência", "Parcelado", "Outro"].map((valor) => `
                           <option value="${valor}"
                               ${registroAtual.pagamento === valor ? "selected" : ""}>
                               ${valor}
                           </option>
                       `).join("")}
                   </select>
               </div>
               <div class="form-group">
                   <label for="observacao">Observação (opcional)</label>
                   <textarea id="observacao" rows="3" placeholder="Adicionar observação...">${escaparHtml(registroAtual.observacao || "")}</textarea>
               </div>
           </div>

           <button id="btnSalvar" class="primary-button" type="button">Salvar movimentação</button>

       </section>

   `;

}

/* ============================================
   AÇÕES DO USUÁRIO
============================================ */

function salvarValor() {

    const campoValor = document.getElementById("valor");

    const valor = Number(
        campoValor.value
            .replace(/\./g, "")
            .replace(",", ".")
    );

    if (isNaN(valor) || valor <= 0) {
        alert("Informe um valor válido.");
        return;
    }

    registroAtual.valor = valor;

    // Se veio do botão "ATUALIZAR" de uma meta,
    // tipo, categoria e meta já estão definidos.
    if (registroAtual.idMeta) {
        etapaAtual = ETAPAS.CATEGORIA;
    } else {
        // Fluxo normal
        etapaAtual = ETAPAS.TIPO;
    }

    app.innerHTML = renderTransaction();

    inicializarTransaction();
}

function abrirTelaSucesso() {
   app.innerHTML = `
       <div class="app-container transaction-success-page">
           <main class="app-content transaction-success-content">
               <div class="transaction-success-icon">✓</div>
               <h2>Movimentação salva com sucesso!</h2>
               <p>Seu registro foi cadastrado e já está disponível no dashboard.</p>
               <button class="primary-button" id="btnIrDashboard" type="button">Ir para Dashboard</button>
           </main>
       </div>
   `;

   document.getElementById("btnIrDashboard").addEventListener("click", () => {
       navegar("dashboard");
   });
}

/* ============================================
   MÁSCARA MONETÁRIA
============================================ */

function aplicarMascaraMoeda(event){

   let valor = event.target.value;

   valor = valor.replace(/\D/g, "");

   valor = (Number(valor) / 100).toFixed(2);

   valor = valor.replace(".", ",");

   event.target.value = valor;

}

function salvarTipo(event) {
   registroAtual.fluxo = event.currentTarget.dataset.fluxo;
   registroAtual.natureza = event.currentTarget.dataset.natureza;
   registroAtual.tipo = registroAtual.natureza === "Receita"
       ? "Receita"
       : "Despesa";
   registroAtual.categoria = "";
   registroAtual.subcategoria = "";
   registroAtual.essencialidade = "";
   registroAtual.comportamento = "";
   registroAtual.idMeta = "";
   erroMetasAporte = "";
   registroAtual.parcelado = registroAtual.natureza === "Despesa" &&
       registroAtual.parcelado;
   if (!registroAtual.parcelado) {
       registroAtual.quantidadeParcelas = 1;
   }

   capturarParcelamentoNoValor();

   etapaAtual = ETAPAS.CATEGORIA;

   app.innerHTML = renderTransaction();

   inicializarTransaction();

}

function salvarCategoria(event) {
    const selectCategoria = document.getElementById("categoria");
    const selectSubcategoria = document.getElementById("subcategoria");
    const selectEssencialidade = document.getElementById("essencialidade");
    const selectComportamento = document.getElementById("comportamento");
    const selectMeta = document.getElementById("metaMovimentacao");

    registroAtual.categoria = selectCategoria?.value || "";
    registroAtual.subcategoria = selectSubcategoria?.value || "";
    registroAtual.essencialidade = selectEssencialidade?.value || "";
    registroAtual.comportamento = selectComportamento?.value || "";
    if (selectMeta) {
        registroAtual.idMeta = selectMeta.value || registroAtual.idMeta;
    }

    if (!registroAtual.categoria) {
        alert("Selecione uma categoria.");
        return;
    }

    if (!registroAtual.subcategoria) {
        const opcoesCategoria = classificacaoConfig.classificacoes.filter((opcao) =>
            opcao.fluxo === registroAtual.fluxo &&
            opcao.natureza === registroAtual.natureza &&
            opcao.categoria === registroAtual.categoria
        );
        if (obterSubcategoriasCategoria(registroAtual.categoria, opcoesCategoria).length) {
            alert("Selecione uma subcategoria.");
            return;
        }
    }

    if (
        registroAtual.natureza === "Despesa" &&
        (!registroAtual.essencialidade || !registroAtual.comportamento)
    ) {
        alert("Selecione a essencialidade e o comportamento da despesa.");
        return;
    }

    if (
        registroAtual.natureza === "Aporte para sonho" &&
        !registroAtual.idMeta
    ) {
        alert("Selecione a meta que receberá o aporte.");
        return;
    }

    etapaAtual = ETAPAS.RESUMO;

    app.innerHTML = renderTransaction();

    inicializarTransaction();

}

function voltarEtapa(){

   switch (etapaAtual) {

       case ETAPAS.TIPO:

           etapaAtual = ETAPAS.VALOR;
           break;

       case ETAPAS.CATEGORIA:

           etapaAtual = ETAPAS.TIPO;
           break;

       case ETAPAS.RESUMO:

           etapaAtual = ETAPAS.CATEGORIA;
           break;

   }

   app.innerHTML = renderTransaction();

   inicializarTransaction();

}

async function finalizarRegistro() {
    if (registroSalvando) return;

    const selectPagamento = document.getElementById("pagamento");
    if (selectPagamento) {
        registroAtual.pagamento = selectPagamento.value;
    }
    const campoObservacao =
        document.getElementById("observacao");

    if (campoObservacao) {
        registroAtual.observacao =
            campoObservacao.value.trim();
    } else {
        registroAtual.observacao = "";
    }


    if (!registroAtual.idMovimentacao) {
        registroAtual.idMovimentacao = gerarIdUnico();
    }

    let registrosParaSalvar =
        montarRegistrosParaSalvar(registroAtual);
    const botaoSalvar = document.getElementById("btnSalvar");
    registroSalvando = true;
    if (botaoSalvar) {
        botaoSalvar.disabled = true;
        botaoSalvar.textContent = resultadoSalvamentoDesconhecido
            ? "Verificando…"
            : "Salvando…";
    }

    let verificandoResultado = false;
    try {
        if (resultadoSalvamentoDesconhecido) {
            verificandoResultado = true;
            const historicoAtual = await obterHistorico();
            verificandoResultado = false;
            const idsExistentes = new Set(
                historicoAtual.map((item) => item.idMovimentacao).filter(Boolean)
            );
            registrosParaSalvar = registrosParaSalvar.filter(
                (item) => !idsExistentes.has(item.idMovimentacao)
            );

            if (!registrosParaSalvar.length) {
                resultadoSalvamentoDesconhecido = false;
                invalidarHistorico();
                invalidarAnalise();
                resetRegistro();
                etapaAtual = ETAPAS.VALOR;
                abrirTelaSucesso();
                return;
            }
            resultadoSalvamentoDesconhecido = false;
            if (botaoSalvar) botaoSalvar.textContent = "Salvando…";
        }

        for (const registroParaSalvar of registrosParaSalvar) {
            await salvarNaPlanilha(registroParaSalvar);
        }

        resultadoSalvamentoDesconhecido = false;
        invalidarHistorico();
        invalidarAnalise();
        resetRegistro();

        etapaAtual = ETAPAS.VALOR;

        abrirTelaSucesso();
    } catch (erro) {
        console.error(
            "Erro ao salvar a movimentação:",
            erro
        );
        const resultadoIncerto = erro.name === "ApiNetworkError" ||
            erro.name === "ApiOutcomeUnknownError";
        if (resultadoIncerto) resultadoSalvamentoDesconhecido = true;
        const erroDeAmbiente = erro.name === "ApiConfigurationError" ||
            erro.name === "ApiRouteNotFoundError";
        alert(erroDeAmbiente
            ? erro.message
            : verificandoResultado
                ? "Não foi possível consultar o histórico. Nenhuma nova gravação foi enviada; tente verificar novamente."
                : resultadoIncerto
                    ? "Não foi possível confirmar a gravação. Os dados foram mantidos; antes de reenviar, verifique o histórico. Uma nova tentativa enviará somente os registros ausentes."
                    : `Não foi possível cadastrar a movimentação: ${erro.message}`);
        if (botaoSalvar) {
            botaoSalvar.disabled = false;
            botaoSalvar.textContent = resultadoSalvamentoDesconhecido
                ? "Verificar e tentar novamente"
                : "Tentar novamente";
        }
    } finally {
        registroSalvando = false;
    }

}


function resetRegistro(){

    registroAtual = {

        data: new Date(),

        tipo: "",
        fluxo: "",
        natureza: "",

        pagamento: "À vista",

        categoria: "",

        subcategoria: "",
        essencialidade: "",
        comportamento: "",

        valor: 0,

        observacao: "",

        idMovimentacao: "",

        idMeta: "",

        parcelado: false,

        quantidadeParcelas: 1

    };
    erroMetasAporte = "";
    resultadoSalvamentoDesconhecido = false;

}

function montarRegistrosParaSalvar(registro) {
   const idBase = registro.idMovimentacao || gerarIdUnico();

   if (
       registro.fluxo !== "Saída" ||
       registro.natureza !== "Despesa" ||
       !registro.parcelado ||
       Number(registro.quantidadeParcelas || 1) <= 1
   ) {

       return [{
           ...registro,
           idMovimentacao: idBase,
           parcelado: false,
           quantidadeParcelas: 1,
           parcela: 1
       }];

   }

   const quantidadeParcelas = Number(registro.quantidadeParcelas || 1);
   const valorTotal = Number(registro.valor || 0);
   const valorBase = Number((valorTotal / quantidadeParcelas).toFixed(2));
   const valorRestante = Number((valorTotal - (valorBase * (quantidadeParcelas - 1))).toFixed(2));

   const registros = [];

   for (let index = 0; index < quantidadeParcelas; index++) {

       const valorParcela = index === quantidadeParcelas - 1
           ? valorRestante
           : valorBase;

       const dataParcela = new Date(registro.data);
       const diaOriginal = dataParcela.getDate();
       dataParcela.setDate(1);
       dataParcela.setMonth(dataParcela.getMonth() + index);
       const ultimoDia = new Date(
           dataParcela.getFullYear(),
           dataParcela.getMonth() + 1,
           0
       ).getDate();
       dataParcela.setDate(Math.min(diaOriginal, ultimoDia));

       registros.push({
           ...registro,
           idMovimentacao: `${idBase}-P${String(index + 1).padStart(2, "0")}`,
           valor: Number(valorParcela.toFixed(2)),
           parcelado: true,
           quantidadeParcelas,
           parcela: index + 1,
           data: dataParcela
       });

   }

   return registros;

}

function calcularValorParcela(valorTotal, quantidadeParcelas) {

   if (!valorTotal || !quantidadeParcelas || quantidadeParcelas <= 1) {

       return valorTotal;

   }

   return Number((valorTotal / quantidadeParcelas).toFixed(2));

}

function atualizarVisibilidadeParcelas() {

   const checkboxParcelado = document.getElementById("parcelado");
   const containerParcelas = document.getElementById("containerParcelas");

   if (!checkboxParcelado || !containerParcelas) {

       return;

   }

   const estaParcelado = checkboxParcelado.checked;

   containerParcelas.classList.toggle("hidden", !estaParcelado);

   registroAtual.parcelado = estaParcelado;

   if (!estaParcelado) {

       registroAtual.quantidadeParcelas = 1;

   }

}

/* ============================================
   BARRA DE PROGRESSO
============================================ */

function renderProgress(){

   let html = '<div class="progress-container">';

   for (let i = 1; i <= 4; i++) {

       html += `
           <div class="progress-step ${i <= etapaAtual ? "active" : ""}"></div>
       `;

   }

   html += '</div>';

   return html;

}

function obterOpcoesMetas(idMetaSelecionada = "") {

    const metasAtivas = obterMetasAtivas();

    if (idMetaSelecionada) {
        const metaSelecionada = metasAtivas.find((meta) =>
            String(meta.idMeta) === String(idMetaSelecionada)
        );
        const nomeMeta = metaSelecionada ? metaSelecionada.nome : "Meta selecionada";
        return `<option value="${escaparHtml(idMetaSelecionada)}" selected>${escaparHtml(nomeMeta)}</option>`;
    }

    if (!metasAtivas.length) {
        return `<option value="">Nenhuma meta ativa cadastrada</option>`;
    }

    return `
        <option value="">Selecione o sonho</option>

        ${metasAtivas.map(meta => `
            <option
                value="${escaparHtml(meta.idMeta)}"
            >
                ${escaparHtml(meta.nome)}
            </option>
        `).join("")}
    `;
}

function obterSubcategoriasCategoria(categoria, opcoes = classificacaoConfig?.classificacoes || []) {
    return Array.from(new Set(
        opcoes
            .filter((opcao) => opcao.categoria === categoria && opcao.subcategoria)
            .map((opcao) => opcao.subcategoria)
    ));
}

function atualizarSubcategorias(event) {
    const selectCategoria = event.currentTarget;
    const selectSubcategoria = document.getElementById("subcategoria");
    const categoria = selectCategoria.value;
    const opcoes = classificacaoConfig.classificacoes.filter((opcao) =>
        opcao.fluxo === registroAtual.fluxo &&
        opcao.natureza === registroAtual.natureza
    );
    const subcategoriasDisponiveis = obterSubcategoriasCategoria(categoria, opcoes);

    registroAtual.categoria = categoria;
    if (!subcategoriasDisponiveis.includes(registroAtual.subcategoria)) {
        registroAtual.subcategoria = "";
    }

    selectSubcategoria.required = subcategoriasDisponiveis.length > 0;
    selectSubcategoria.disabled = subcategoriasDisponiveis.length === 0;
    selectSubcategoria.innerHTML = `
        <option value="">
            ${subcategoriasDisponiveis.length ? "Selecione" : "Não se aplica"}
        </option>
        ${subcategoriasDisponiveis.map((subcategoria) => `
            <option value="${escaparHtml(subcategoria)}">${escaparHtml(subcategoria)}</option>
        `).join("")}
    `;
}

function atualizarValorPeloTeclado(botao) {
    const campoValor = document.getElementById("valor");
    const tecla = botao.textContent.trim();
    const digitos = campoValor.value.replace(/\D/g, "");

    if (tecla === ".") {
        campoValor.focus();
        return;
    }

    const novosDigitos = tecla === "⌫"
        ? digitos.slice(0, -1)
        : `${digitos}${tecla}`;
    const centavos = Number(novosDigitos || "0");

    campoValor.value = centavos
        ? (centavos / 100).toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })
        : "";
    campoValor.dispatchEvent(new Event("input", { bubbles: true }));
    campoValor.focus();
}