/* ============================================
   ESTADO
============================================ */

let historico = [];

/* ============================================
   CARREGAR DADOS
============================================ */

async function carregarHistorico(){

    historico = await obterHistorico();

}

/* ============================================
   TELA PRINCIPAL
============================================ */

function renderHistory(){

    return `

        <div class="app-container">

            ${renderHistoryHeader()}

            <main class="app-content">

                ${renderListaHistorico()}

            </main>

        </div>

    `;

}

/* ============================================
   INICIALIZAÇÃO
============================================ */

function inicializarHistory(){

    const btnVoltar =
        document.getElementById("btnVoltarDashboard");

    btnVoltar.addEventListener("click", () => {

        navegar("dashboard");

    });

}

/* ============================================
   HEADER
============================================ */

function renderHistoryHeader(){

    return `

        <header class="app-header">

            <button
                id="btnVoltarDashboard"
                class="secondary-button">

                ←

            </button>

            <div>

                <h2>Histórico</h2>

                <p>Movimentações do mês</p>

            </div>

        </header>

    `;

}

/* ============================================
   LISTA
============================================ */

function renderListaHistorico(){

    if(historico.length === 0){

        return `

            <p>

                Nenhuma movimentação encontrada.

            </p>

        `;

    }

    return historico.map(renderCardHistorico).join("");

}

/* ============================================
   CARD
============================================ */

function renderCardHistorico(item){

    let icone = "⚖️";

    if(item.tipo === "ENTRADA"){

        icone = "💰";

    }

    if(item.tipo === "SAÍDA"){

        icone = "🛒";

    }

    return `

        <div class="history-card">

            <div class="history-icon">

                ${icone}

            </div>

            <div class="history-info">

                <strong>

                    ${item.descricao || item.categoria}

                </strong>

                <p>

                    ${item.data}

                </p>

            </div>

            <strong>

                ${Number(item.valor).toLocaleString(

                    "pt-BR",

                    {

                        style:"currency",

                        currency:"BRL"

                    }

                )}

            </strong>

        </div>

    `;

}