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
        <header class="app-header">
            <h1>${saudacao}, Juan</h1>
            <p>${mes}</p>
        </header>
    `;
}

function renderSaldo() {
    return `

        <section class="card saldo-card">

            <span class="saldo-label">

                Saldo do mês

            </span>

            <h2 id="saldoMes">

                R$ 0,00

            </h2>

        </section>

    `;
}

function renderResumo() {

    return `

        <section class="dashboard-grid">

            <div class="card resumo-card">

                <span>Receitas</span>

                <h3 id="receitasMes">R$ 0,00</h3>

            </div>

            <div class="card resumo-card">

                <span>Despesas</span>

                <h3 id="despesasMes">R$ 0,00</h3>

            </div>

            <div class="card resumo-card">

                <span>Essencial</span>

                <h3 id="essencialMes">R$ 0,00</h3>

            </div>

            <div class="card resumo-card">

                <span>Não essencial</span>

                <h3 id="naoEssencialMes">R$ 0,00</h3>

            </div>

            <div class="card resumo-card">

                <span>Investimentos</span>

                <h3 id="investimentosMes">R$ 0,00</h3>

            </div>

            <div class="card resumo-card">

                <span>Sonhos</span>

                <h3 id="sonhosMes">R$ 0,00</h3>

            </div>

        </section>

    `;

}

function renderMetas() {
    return `

        <section class="category-grid">

            <div class="category-card">

                <div class="category-icon">🥬</div>

                <h3>Essencial</h3>

                <strong>

                    ${Number(dashboard.essencial).toLocaleString(
                        "pt-BR",
                        {
                            style:"currency",
                            currency:"BRL"
                        }
                    )}

                </strong>

            </div>

            <div class="category-card">

                <div class="category-icon">🛍️</div>

                <h3>Não Essencial</h3>

                <strong>

                    ${Number(dashboard.naoEssencial).toLocaleString(
                        "pt-BR",
                        {
                            style:"currency",
                            currency:"BRL"
                        }
                    )}

                </strong>

            </div>

            <div class="category-card">

                <div class="category-icon">📈</div>

                <h3>Investimentos</h3>

                <strong>

                    ${Number(dashboard.investimentos).toLocaleString(
                        "pt-BR",
                        {
                            style:"currency",
                            currency:"BRL"
                        }
                    )}

                </strong>

            </div>

            <div class="category-card">

                <div class="category-icon">🎯</div>

                <h3>Sonhos</h3>

                <strong>

                    ${Number(dashboard.sonhos).toLocaleString(
                        "pt-BR",
                        {
                            style:"currency",
                            currency:"BRL"
                        }
                    )}

                </strong>

            </div>

        </section>

    `;
}

function renderMensagem(){

    let mensagem = "";

    if (dashboard.saldo > 0) {

        mensagem =
            "🎉 Parabéns! Seu saldo do mês está positivo.";

    } else {

        mensagem =
            "⚠️ Atenção! Seu saldo do mês está negativo.";

    }

    return `

        <section class="insight-card">

            <h3>Resumo Inteligente</h3>

            <p>${mensagem}</p>

        </section>

    `;

}

function renderDashboard() {

    return `

        <div class="app-container">

            ${renderHeader()}

            <main class="app-content">

    ${renderSaldo()}

    ${renderResumo()}

</main>

            <nav class="bottom-nav">

                <button>🏠</button>

                <button
                    id="btnNovaMovimentacao"
                    class="primary-button">

                    ➕

                </button>

                <button id="btnHistorico">

    📋

</button>

                <button>⚙️</button>

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

        const dashboard = await obterDashboard();

        document.getElementById("saldoMes").textContent =
            formatarMoeda(dashboard.saldo);

        document.getElementById("receitasMes").textContent =
            formatarMoeda(dashboard.entrada);

        document.getElementById("despesasMes").textContent =
            formatarMoeda(dashboard.saida);

        document.getElementById("investimentosMes").textContent =
            formatarMoeda(dashboard.investimentos);

        document.getElementById("sonhosMes").textContent =
            formatarMoeda(dashboard.sonhos);

        document.getElementById("essencialMes").textContent =
            formatarMoeda(dashboard.essencial);

        document.getElementById("naoEssencialMes").textContent =
            formatarMoeda(dashboard.naoEssencial);

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

