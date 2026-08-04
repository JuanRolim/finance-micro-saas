/* ============================================
   ESTADO DO DASHBOARD
============================================ */

let dashboard = {

    saldo: 0,

    entrada: 0,

    saida: 0,

    essencial: 0,

    naoEssencial: 0,

    investimentos: 0,

    sonhos: 0

};

/* ============================================
   CARREGAR DADOS
============================================ */

function renderHeader() {

    const agora = new Date();
    const hora = agora.getHours();

    let saudacao = "Boa noite";

    if (hora < 12) {

        saudacao = "Bom dia";

    } else if (hora < 18) {

        saudacao = "Boa tarde";

    }

    const mes = agora.toLocaleDateString("pt-BR", {
        month: "long",
        year: "numeric"
    });

    return `
        <header class="app-header dashboard-header">
            <div>
                <p class="dashboard-eyebrow">Resumo financeiro</p>
                <h1>${saudacao}, Juan</h1>
            </div>
            <p class="dashboard-date">${mes}</p>
        </header>
    `;
}

function renderSaldo() {
    return `
        <section class="card dashboard-saldo-card">
            <div class="dashboard-saldo-card__content">
                <p class="dashboard-saldo-card__label">Saldo disponível</p>
                <h2 id="saldoMes">R$ 0,00</h2>
                <p class="dashboard-saldo-card__meta">
                    Última atualização <span id="ultimaAtualizacao">agora</span>
                </p>
            </div>
        </section>
    `;
}

function renderResumo() {

    return `
        <section class="dashboard-summary-cards">
            <article class="card dashboard-metric-card dashboard-metric-card--income">
                <div class="dashboard-metric-card__icon">↗</div>
                <div>
                    <p class="dashboard-metric-card__label">Receitas</p>
                    <h3 id="receitasMes">R$ 0,00</h3>
                </div>
            </article>

            <article class="card dashboard-metric-card dashboard-metric-card--expense">
                <div class="dashboard-metric-card__icon">↘</div>
                <div>
                    <p class="dashboard-metric-card__label">Despesas</p>
                    <h3 id="despesasMes">R$ 0,00</h3>
                </div>
            </article>
        </section>
    `;

}

function renderResumoMensal(dados = dashboard) {

    const categorias = montarCategoriasResumo(dados);
    const total = categorias.reduce((acc, item) => acc + item.valor, 0);

    let acumulado = 0;
    const grafo = categorias.map(item => {
        const inicio = acumulado;
        const fim = acumulado + item.porcentagem;
        acumulado = fim;
        return `${item.cor} ${inicio}% ${fim}%`;
    }).join(", ");
    const gradiente = total > 0
        ? `conic-gradient(${grafo})`
        : "linear-gradient(135deg, #E5E7EB 0%, #F3F4F6 100%)";

    return `
        <section class="dashboard-section dashboard-section--summary">
            <div class="dashboard-section__header">
                <div>
                    <p class="dashboard-section__eyebrow">Resumo do mês</p>
                    <h3>Distribuição das despesas</h3>
                </div>
                <a href="#" class="dashboard-link">Ver todas</a>
            </div>

            <div class="dashboard-summary-layout">
                <div class="card dashboard-chart-card">
                    <div class="dashboard-chart" style="background: ${gradiente};">
                        <div class="dashboard-chart__inner"></div>
                    </div>
                    <div class="dashboard-legend">
                        ${categorias.map(item => `
                            <div class="dashboard-legend__item">
                                <span class="dashboard-legend__dot" style="background:${item.cor}"></span>
                                <span>${item.nome}</span>
                            </div>
                        `).join("")}
                    </div>
                </div>
            </div>
        </section>

        <section class="dashboard-section dashboard-section--categories">
            <div class="dashboard-section__header">
                <div>
                    <p class="dashboard-section__eyebrow">Despesas por categoria</p>
                    <h3>Lista detalhada</h3>
                </div>
                <a href="#" class="dashboard-link">Ver todas</a>
            </div>

            <div class="card dashboard-category-list">
                ${categorias.map(item => `
                    <div class="dashboard-category-item">
                        <div class="dashboard-category-item__info">
                            <span class="dashboard-category-item__dot" style="background:${item.cor}"></span>
                            <div>
                                <strong>${item.nome}</strong>
                                <p>${item.porcentagem}% do total</p>
                            </div>
                        </div>
                        <div class="dashboard-category-item__values">
                            <span class="chip chip--active">${item.porcentagem}%</span>
                            <strong>${formatarMoeda(item.valor)}</strong>
                        </div>
                    </div>
                `).join("")}
            </div>
        </section>
    `;
}

function montarCategoriasResumo(dados = dashboard) {

    const categorias = [
        {
            nome: "Essencial",
            valor: Number(dados.essencial || 0),
            cor: "var(--color-accent)"
        },
        {
            nome: "Não essencial",
            valor: Number(dados.naoEssencial || 0),
            cor: "var(--color-warning)"
        },
        {
            nome: "Investimentos",
            valor: Number(dados.investimentos || 0),
            cor: "var(--color-primary)"
        },
        {
            nome: "Sonhos",
            valor: Number(dados.sonhos || 0),
            cor: "var(--color-secondary)"
        }
    ];

    const total = categorias.reduce((acc, item) => acc + item.valor, 0);

    return categorias.map(item => ({
        ...item,
        porcentagem: total > 0 ? Math.round((item.valor / total) * 100) : 0
    }));

}

function renderDashboard() {

    return `

        <div class="app-container dashboard-page">

            ${renderHeader()}

            <main class="app-content dashboard-content">

                ${renderSaldo()}
                ${renderResumo()}
                <div id="resumoMensalContainer">
                    ${renderResumoMensal(dashboard)}
                </div>

            </main>

            <nav class="bottom-nav" aria-label="Navegação principal">
                <button class="bottom-nav__item bottom-nav__item--active" type="button">
                    <span class="bottom-nav__icon">⌂</span>
                    <span class="bottom-nav__label">Dashboard</span>
                </button>

                <button class="bottom-nav__item" type="button" id="btnHistorico">
                    <span class="bottom-nav__icon">☰</span>
                    <span class="bottom-nav__label">Histórico</span>
                </button>

                <button class="bottom-nav__item bottom-nav__item--center" type="button" id="btnNovaMovimentacao">
                    <span class="bottom-nav__icon bottom-nav__icon--center">+</span>
                </button>

                <button class="bottom-nav__item" type="button">
                    <span class="bottom-nav__icon">◎</span>
                    <span class="bottom-nav__label">Metas</span>
                </button>

                <button class="bottom-nav__item" type="button">
                    <span class="bottom-nav__icon">⋯</span>
                    <span class="bottom-nav__label">Mais</span>
                </button>
            </nav>

        </div>

    `;

}

async function inicializarDashboard(){

    /* ==========================
       BOTÃO NOVA MOVIMENTAÇÃO
    ========================== */

    document
        .getElementById("btnNovaMovimentacao")
        .addEventListener("click", () => {

            navegar("transaction");

        });

    /* ==========================
       BOTÃO HISTÓRICO
    ========================== */

    document
        .getElementById("btnHistorico")
        .addEventListener("click", () => {

            navegar("history");

        });

    /* ==========================
       CARREGA DADOS
    ========================== */

    try{

        const dadosDashboard = await obterDashboard();

        dashboard.saldo = Number(dadosDashboard?.saldo || 0);
        dashboard.entrada = Number(dadosDashboard?.entrada || 0);
        dashboard.saida = Number(dadosDashboard?.saida || 0);
        dashboard.essencial = Number(dadosDashboard?.essencial || 0);
        dashboard.naoEssencial = Number(dadosDashboard?.naoEssencial || 0);
        dashboard.investimentos = Number(dadosDashboard?.investimentos || 0);
        dashboard.sonhos = Number(dadosDashboard?.sonhos || 0);

        document.getElementById("saldoMes").textContent =
            formatarMoeda(dashboard.saldo);

        document.getElementById("receitasMes").textContent =
            formatarMoeda(dashboard.entrada);

        document.getElementById("despesasMes").textContent =
            formatarMoeda(dashboard.saida);

        const ultimaAtualizacao = document.getElementById("ultimaAtualizacao");

        if (ultimaAtualizacao) {
            ultimaAtualizacao.textContent = new Date().toLocaleString("pt-BR", {
                dateStyle: "short",
                timeStyle: "short"
            });
        }

        const resumoMensalContainer = document.getElementById("resumoMensalContainer");

        if (resumoMensalContainer) {
            resumoMensalContainer.innerHTML = renderResumoMensal(dashboard);
        }

    }catch(erro){

        console.error("Erro ao carregar dashboard:", erro);

    }

}

function formatarMoeda(valor){

    return Number(valor).toLocaleString("pt-BR", {

        style: "currency",

        currency: "BRL"

    });

}

function aplicarMascaraMoeda(event){

    let valor = event.target.value;

    valor = valor.replace(/\D/g, "");

    valor = (Number(valor) / 100).toFixed(2);

    valor = valor.replace(".", ",");

    event.target.value = valor;

}

