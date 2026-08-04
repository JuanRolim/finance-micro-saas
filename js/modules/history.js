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

        <div class="app-container history-page">

            ${renderHistoryHeader()}

            <main class="app-content history-content">

                ${renderToolbarHistorico()}
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

        <header class="app-header history-header">

            <button
                id="btnVoltarDashboard"
                class="back-button">

                ←

            </button>

            <div>

                <h2>Histórico</h2>

                <p>Movimentações do mês</p>

            </div>

        </header>

    `;

}

function renderToolbarHistorico(){

    return `
        <section class="history-toolbar">
            <label class="history-search">
                <span>🔎</span>
                <input type="text" placeholder="Buscar movimentação" />
            </label>
            <button class="history-filter" type="button">Filtro</button>
        </section>
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
    let valorClasse = "history-value history-value--expense";
    let categoria = item.categoria || "Categoria";

    if(item.tipo === "ENTRADA"){

        icone = "💰";
        valorClasse = "history-value history-value--income";

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

                    ${item.descricao || categoria}

                </strong>

                <p class="history-meta">

                    <span>${categoria}</span>
                    <span>${item.data}</span>

                </p>

            </div>

            <strong class="${valorClasse}">

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