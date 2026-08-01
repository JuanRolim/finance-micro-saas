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

   descricao: "",
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
               atualizarVisibilidadeParcelas
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

       <section class="assistant-step value-step">

           <header class="transaction-header">

               <button
                   id="btnVoltarDashboard"
                   class="back-button">

                   ←

               </button>

               <h2>Nova movimentação</h2>

           </header>

           <h2 class="step-title">

               Quanto foi?

           </h2>

           <div class="value-container">

               <span class="currency">

                   R$

               </span>

               <input
                   id="valor"
                   class="value-input"
                   type="text"
                   placeholder="0,00"
                   autofocus
               >

           </div>

           ${renderParcelamentoNoValor()}

           <button
               id="btnContinuar"
               class="primary-button">

               Continuar

           </button>

       </section>

   `;

}

/* ============================================
   ETAPA 2 - TIPO
============================================ */

function renderStepTipo() {

   return `

       <section class="assistant-step">

       <button
           id="btnVoltar"
           class="secondary-button">

           ← Voltar

       </button>

           <h2>O que deseja registrar?</h2>

           <div class="option-card" data-tipo="Receita">

               💰
               <span>Receita</span>

           </div>

           <div class="option-card" data-tipo="Despesa">

               🛒
               <span>Despesa</span>

           </div>

           <div class="option-card" data-tipo="Ajuste">

               ⚖️
               <span>Ajuste de saldo</span>

           </div>

       </section>

   `;

}

/* ============================================
   ETAPA 3 - CATEGORIA
============================================ */

function renderStepCategoria() {

   return `

       <section class="assistant-step">

       <button
           id="btnVoltar"
           class="secondary-button">

           ← Voltar

       </button>

           <h2>Como deseja classificar?</h2>

           <p>Escolha uma categoria.</p>

           <div class="option-card" data-categoria="Essencial">

               🥬
               <span>Essencial</span>

           </div>

           <div class="option-card" data-categoria="Não Essencial">

               🛍️
               <span>Não Essencial</span>

           </div>

           <div class="option-card" data-categoria="Investimentos">

               📈
               <span>Investimentos</span>

           </div>

           <div class="option-card" data-categoria="Sonhos">

               🎯
               <span>Sonhos</span>

           </div>

       </section>

   `;

}

/* ============================================
   ETAPA 4 - DETALHES
============================================ */

function renderParcelamentoNoValor() {

   return `

       <div class="detail-card card no-margin-top">

           <label class="checkbox-card">

               <input
                   type="checkbox"
                   id="parcelado"
                   ${registroAtual.parcelado ? "checked" : ""}
               >

               <span>Essa compra é parcelada?</span>

           </label>

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

       <section class="assistant-step">

       <button
               id="btnVoltar"
               class="secondary-button">

               ← Voltar

           </button>

           <h2>Confira sua movimentação</h2>

           <div class="summary-card card">

   <div class="summary-row">

       <span class="summary-icon">

           ${registroAtual.tipo === "Receita"
               ? "💰"
               : registroAtual.tipo === "Despesa"
               ? "🛒"
               : "⚖️"}

       </span>

       <div>

           <h3>

               ${registroAtual.tipo}

           </h3>

           <p>

               ${registroAtual.categoria}

           </p>

       </div>

   </div>

   <div class="summary-value">

       R$ ${registroAtual.valor.toLocaleString(
           "pt-BR",
           {

               minimumFractionDigits:2

           }
       )}

   </div>

   ${registroAtual.tipo === "Despesa" && registroAtual.parcelado ? `

       <p class="summary-detail-text">

           Parcelado em ${registroAtual.quantidadeParcelas}x de R$ ${calcularValorParcela(registroAtual.valor, registroAtual.quantidadeParcelas).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}

       </p>

   ` : ""}

</div>

           <p class="summary-message">

   ✓ Tudo certo?

</p>

<div class="summary-form">


   <label>

   Subcategoria (opcional)

   </label>

   <select id="subcategoria">

   <option value="">

       Selecione...

   </option>

   ${subcategorias.map(subcategoria => `

   <option
       value="${subcategoria}"
       ${registroAtual.subcategoria === subcategoria ? "selected" : ""}
   >
       ${subcategoria}
   </option>

`).join("")}

   </select>

   <label>

       Observação (opcional)

   </label>

   <textarea
       id="observacao"
       rows="3"
       placeholder="Adicionar observação..."
   >${registroAtual.observacao || ""}</textarea>

</div>

           <button
               id="btnSalvar"
               class="primary-button">

               ✓ Salvar movimentação

           </button>

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

   const registrosParaSalvar = montarRegistrosParaSalvar(registroAtual);

   try {

       for (const registroParaSalvar of registrosParaSalvar) {

           await salvarNaPlanilha(registroParaSalvar);

       }

       alert("Movimentação cadastrada!");

       resetRegistro();

       etapaAtual = ETAPAS.VALOR;

       navegar("dashboard");

   } catch (erro) {

       console.error("Erro ao salvar a movimentação:", erro);
       alert("Não foi possível cadastrar a movimentação.");

   }

}

function resetRegistro(){

   registroAtual = {

       data: new Date(),
       tipo: null,
       descricao: "",
       categoria: null,
       subcategoria: null,
       valor: null,
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