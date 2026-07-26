/* ============================================
   ETAPAS DO ASSISTENTE
============================================ */

const ETAPAS = {

    VALOR: 1,
    TIPO: 2,
    CATEGORIA: 3,
    DETALHES: 4,
    RESUMO: 5

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

    observacao: ""

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

function inicializarTransaction() {

    if (etapaAtual === ETAPAS.VALOR) {

        const btnContinuar =
    document.getElementById("btnContinuar");

if(btnContinuar){

    btnContinuar.addEventListener(
    "click",
    salvarValor
);

}

        const campoValor =
        document.getElementById("valor");

        campoValor.addEventListener(
        "input",
        aplicarMascaraMoeda
        );

        const btnVoltarDashboard =
    document.getElementById("btnVoltarDashboard");

if(btnVoltarDashboard){

    btnVoltarDashboard.addEventListener("click", () => {

        navegar("dashboard");

    });

}

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

        case ETAPAS.DETALHES:
            return renderStepDetalhes();

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

function renderStepDetalhes() {

    return ``;

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

    etapaAtual = ETAPAS.CATEGORIA;

    app.innerHTML = renderTransaction();

    inicializarTransaction();

}

async function salvarCategoria(event) {

    registroAtual.categoria =
    event.currentTarget.dataset.categoria;

subcategorias =
    await obterSubcategorias();

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

    await salvarNaPlanilha(registroAtual);

    alert("Movimentação cadastrada!");

    resetRegistro();

    etapaAtual = ETAPAS.VALOR;

    navegar("dashboard");

}

function resetRegistro(){

    registroAtual = {

        valor: null,
        tipo: null,
        categoria: null,
        subcategoria: null,
        observacao: "",
        data: new Date()

    };

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