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

   pagamento: "À vista",
   categoria: "",
   subcategoria: "",
   valor: 0,
   observacao: "",
   parcelado: false,
   quantidadeParcelas: 1

};

/* ============================================
   SUBCATEGORIAS
============================================ */

let subcategorias = [];

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

async function inicializarTransaction() {

    await carregarSubcategorias();

   if (etapaAtual === ETAPAS.VALOR) {

       const btnContinuar =
           document.getElementById("btnContinuar");

       if (btnContinuar) {

           btnContinuar.addEventListener(
               "click",
               salvarValor
           );

       }

       const campoValor =
           document.getElementById("valor");

       if (campoValor) {

           campoValor.addEventListener(
               "input",
               aplicarMascaraMoeda
           );

       }

       const checkboxParcelado =
    document.getElementById("parcelado");

if (checkboxParcelado) {

    checkboxParcelado.addEventListener(
        "change",
        () => {

            atualizarVisibilidadeParcelas();

            registroAtual.pagamento =
                checkboxParcelado.checked
                    ? "Parcelado"
                    : "À vista";

        }
    );

}

       const selectParcelas =
           document.getElementById("quantidadeParcelas");

       if (selectParcelas) {

           selectParcelas.addEventListener(
               "change",
               () => {

                   registroAtual.quantidadeParcelas =
                       Number(selectParcelas.value);

               }
           );

       }

       const btnVoltarDashboard =
           document.getElementById("btnVoltarDashboard");

       if (btnVoltarDashboard) {

           btnVoltarDashboard.addEventListener("click", () => {

               navegar("dashboard");

           });

       }

       atualizarVisibilidadeParcelas();

   }

   if (etapaAtual === ETAPAS.TIPO) {

       const opcoes =
           document.querySelectorAll(".option-card");

       opcoes.forEach(opcao => {

           opcao.addEventListener("click", salvarTipo);

       });

       const btnVoltar =
           document.getElementById("btnVoltar");

       btnVoltar.addEventListener(
           "click",
           voltarEtapa
       );

   }

   if (etapaAtual === ETAPAS.CATEGORIA) {

       const opcoes =
           document.querySelectorAll(".option-card");

       opcoes.forEach(opcao => {

           opcao.addEventListener("click", salvarCategoria);

       });

       const btnVoltar =
           document.getElementById("btnVoltar");

       btnVoltar.addEventListener(
           "click",
           voltarEtapa
       );

   }

   if (etapaAtual === ETAPAS.RESUMO) {

       const btnSalvar =
           document.getElementById("btnSalvar");

       btnSalvar.addEventListener(
           "click",
           finalizarRegistro
       );

       const btnVoltar =
           document.getElementById("btnVoltar");

       btnVoltar.addEventListener(
           "click",
           voltarEtapa
       );

   }

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
               <h2 class="step-title">Escolha</h2>
           </div>

           <div class="transaction-choice-grid">
               <button class="option-card transaction-choice-card" type="button" data-tipo="Receita">
                   <span class="transaction-choice-card__icon">↗</span>
                   <span class="transaction-choice-card__label">Receita</span>
               </button>

               <button class="option-card transaction-choice-card" type="button" data-tipo="Despesa">
                   <span class="transaction-choice-card__icon">↘</span>
                   <span class="transaction-choice-card__label">Despesa</span>
               </button>
           </div>

       </section>

   `;

}

/* ============================================
   ETAPA 3 - CATEGORIA
============================================ */

function renderStepCategoria() {

    const categorias =
        registroAtual.tipo === "Receita"
            ? [
                {
                    nome: "Salário",
                    icone: "💰"
                },
                {
                    nome: "Extra",
                    icone: "✨"
                },
                {
                    nome: "Reembolso",
                    icone: "↩️"
                }
            ]
            : [
                {
                    nome: "Essencial",
                    icone: "🥬"
                },
                {
                    nome: "Não Essencial",
                    icone: "🛍️"
                },
                {
                    nome: "Investimentos",
                    icone: "📈"
                },
                {
                    nome: "Sonhos",
                    icone: "🎯"
                }
            ];

    return `

        <section class="assistant-step transaction-step transaction-step--categories">

            <header class="transaction-header transaction-header--compact">

                <button
                    id="btnVoltar"
                    class="back-button"
                    type="button">

                    ←

                </button>

                <h2>Nova movimentação</h2>

            </header>


            <div class="transaction-hero transaction-hero--compact">

                <p class="transaction-eyebrow">
                    Etapa 3
                </p>

                <h2 class="step-title">
                    Categorias
                </h2>

            </div>


            <div class="transaction-category-list">

                ${categorias.map(categoria => `

                    <button
                        class="option-card transaction-category-item"
                        type="button"
                        data-categoria="${categoria.nome}"
                    >

                        <span class="transaction-category-item__icon">

                            ${categoria.icone}

                        </span>

                        <span class="transaction-category-item__label">

                            ${categoria.nome}

                        </span>

                        <span class="transaction-category-item__arrow">

                            ›

                        </span>

                    </button>

                `).join("")}

            </div>

        </section>

    `;

}

/* ============================================
   ETAPA 4 - DETALHES
============================================ */

function renderParcelamentoNoValor() {

   return `

       <div class="detail-card card transaction-parcelamento-card no-margin-top">

           <div class="transaction-parcelamento-card__row">
               <label class="checkbox-card">
                   <input
                       type="checkbox"
                       id="parcelado"
                       ${registroAtual.parcelado ? "checked" : ""}
                   >
                   <span>Parcelado</span>
               </label>
               <span class="transaction-parcelamento-card__hint">À vista</span>
           </div>

           <div id="containerParcelas" class="${registroAtual.parcelado ? "" : "hidden"}">

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

   if (registroAtual.tipo !== "Despesa") {

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
                           : registroAtual.tipo === "Despesa"
                           ? "🛒"
                           : "⚖️"}
                   </span>
                   <div>
                       <h3>${registroAtual.tipo || "Tipo"}</h3>
                       <p>${registroAtual.categoria || "Categoria"}</p>
                   </div>
               </div>

               <div class="summary-value">
                   R$ ${registroAtual.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
               </div>

               <div class="transaction-summary-details">
                   <div class="transaction-summary-details__row">
                       <span>Subcategoria</span>
                       <strong>${registroAtual.subcategoria || "—"}</strong>
                   </div>
                   <div class="transaction-summary-details__row">
                       <span>Data</span>
                       <strong>${new Date(registroAtual.data).toLocaleDateString("pt-BR")}</strong>
                   </div>
                   <div class="transaction-summary-details__row">
                       <span>Parcelamento</span>
                       <strong>${registroAtual.tipo === "Despesa" && registroAtual.parcelado ? `${registroAtual.quantidadeParcelas}x` : "À vista"}</strong>
                   </div>
                   <div class="transaction-summary-details__row">
                       <span>Observação</span>
                       <strong>${registroAtual.observacao || "Sem observação"}</strong>
                   </div>
               </div>
           </div>

           <div class="summary-form">
               <label>Subcategoria (opcional)</label>
               <select id="subcategoria">
                   <option value="">Selecione...</option>
                   ${subcategorias.map(subcategoria => `
                       <option value="${subcategoria}" ${registroAtual.subcategoria === subcategoria ? "selected" : ""}>
                           ${subcategoria}
                       </option>
                   `).join("")}
               </select>

               <label>Observação (opcional)</label>
               <textarea id="observacao" rows="3" placeholder="Adicionar observação...">${registroAtual.observacao || ""}</textarea>
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

       .replace(".", "")

       .replace(",", ".")

   );

   if (isNaN(valor) || valor <= 0) {

       alert("Informe um valor válido.");

       return;

   }

   registroAtual.valor = valor;

   etapaAtual = ETAPAS.TIPO;

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

   registroAtual.tipo =
       event.currentTarget.dataset.tipo;

   capturarParcelamentoNoValor();

   etapaAtual = ETAPAS.CATEGORIA;

   app.innerHTML = renderTransaction();

   inicializarTransaction();

}

function salvarCategoria(event) {

    registroAtual.categoria =
        event.currentTarget.dataset.categoria;

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


async function finalizarRegistro(){

    registroAtual.subcategoria =
        document.getElementById("subcategoria").value.trim();

    registroAtual.observacao =
        document.getElementById("observacao").value.trim();

    console.log("REGISTRO ANTES DO ENVIO:");
    console.log(registroAtual);

    const registrosParaSalvar =
        montarRegistrosParaSalvar(registroAtual);

    console.log("REGISTROS PARA SALVAR:");
    console.log(registrosParaSalvar);

    try {

        for (const registroParaSalvar of registrosParaSalvar) {

            console.log("ENVIANDO:");
            console.log(registroParaSalvar);

            await salvarNaPlanilha(registroParaSalvar);

        }

        alert("Movimentação cadastrada!");

        resetRegistro();

        etapaAtual = ETAPAS.VALOR;

        abrirTelaSucesso();

    } catch (erro) {

        console.error(
            "Erro ao salvar a movimentação:",
            erro
        );

        alert(
            "Não foi possível cadastrar a movimentação."
        );

    }

}

function resetRegistro(){

    registroAtual = {

        data: new Date(),

        tipo: "",

        pagamento: "À vista",

        categoria: "",

        subcategoria: "",

        valor: 0,

        observacao: "",

        parcelado: false,

        quantidadeParcelas: 1

    };

}

function montarRegistrosParaSalvar(registro) {

   if (registro.tipo !== "Despesa" || !registro.parcelado || Number(registro.quantidadeParcelas || 1) <= 1) {

       return [{
           ...registro,
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
       dataParcela.setMonth(dataParcela.getMonth() + index);

       registros.push({
           ...registro,
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

   for (let i = 1; i <= 5; i++) {

       html += `
           <div class="progress-step ${i <= etapaAtual ? "active" : ""}"></div>
       `;

   }

   html += '</div>';

   return html;

}

async function carregarSubcategorias() {

    if (subcategorias.length > 0) {

        return;

    }

    subcategorias = await obterSubcategorias();

}