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
 
            ${renderModalDetalhes()}
 
        </div> 
 
    `; 
 
}

/* ============================================
   INICIALIZAÇÃO
============================================ */

function inicializarHistory(){

    /* ============================================
       VOLTAR PARA O DASHBOARD
    ============================================ */

    const btnVoltar =
        document.getElementById("btnVoltarDashboard");

    if(btnVoltar){

        btnVoltar.addEventListener("click", () => {

            navegar("dashboard");

        });

    }


    /* ============================================
       CLIQUE NAS MOVIMENTAÇÕES
    ============================================ */

    const cards =
        document.querySelectorAll(".history-card");

    cards.forEach(card => {

        card.addEventListener("click", () => {

            const index =
                Number(card.dataset.index);

            const movimentacao =
                historico[index];

            abrirModalDetalhes(movimentacao);

        });

    });


    /* ============================================
       FECHAR MODAL — BOTÃO X
    ============================================ */

    const btnFecharModal =
        document.getElementById("btnFecharModal");

    if(btnFecharModal){

        btnFecharModal.addEventListener(
            "click",
            fecharModal
        );

    }


    /* ============================================
       FECHAR MODAL — BOTÃO INFERIOR
    ============================================ */

    const btnFecharModalInferior =
        document.getElementById("btnFecharModalInferior");

    if(btnFecharModalInferior){

        btnFecharModalInferior.addEventListener(
            "click",
            fecharModal
        );

    }


    /* ============================================
       FECHAR CLICANDO FORA DO MODAL
    ============================================ */

    const modal =
        document.getElementById("modalDetalhes");

    if(modal){

        modal.addEventListener("click", (event) => {

            if(event.target === modal){

                fecharModal();

            }

        });

    }

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

    return historico
        .map((item, index) => renderCardHistorico(item, index))
        .join("");

}

/* ============================================
   CARD
============================================ */

function renderCardHistorico(item, index){ 
 
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
 
        <div
            class="history-card"
            data-index="${index}"
        > 
 
            <div class="history-icon"> 
 
                ${icone} 
 
            </div> 
 
            <div class="history-info"> 
 
                <strong> 
 
                    ${item.subcategoria || item.categoria || "Movimentação"} 
 
                </strong> 
 
                <p class="history-meta">

    <span>${categoria}</span>

    <span>${item.pagamento || "À vista"}</span>

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

function renderModalDetalhes(){

    return `

        <div
            id="modalDetalhes"
            class="modal-overlay hidden"
        >

            <div
                class="modal-detalhes"
                role="dialog"
                aria-modal="true"
                aria-labelledby="modalTitulo"
            >

                <button
                    id="btnFecharModal"
                    class="modal-close"
                    type="button"
                    aria-label="Fechar"
                >
                    ×
                </button>


                <div class="modal-header">

                    <span class="modal-label">
                        Detalhes da movimentação
                    </span>

                    <h2 id="modalValor">
                        R$ 0,00
                    </h2>

                    <span
                        id="modalTipo"
                        class="modal-tipo"
                    >
                        —
                    </span>

                </div>


                <div class="modal-detalhes-lista">


                    <div class="modal-item">

                        <span>Data</span>

                        <strong id="modalData">
                            —
                        </strong>

                    </div>

                    <div class="modal-item">

                        <span>Categoria</span>

                        <strong id="modalCategoria">
                            —
                        </strong>

                    </div>


                    <div class="modal-item">

                        <span>Subcategoria</span>

                        <strong id="modalSubcategoria">
                            —
                        </strong>

                    </div>


                    <div class="modal-item">

                        <span>Observação</span>

                        <strong id="modalObservacao">
                            —
                        </strong>

                    </div>


                    <div class="modal-item">

    <span>Pagamento</span>

    <strong id="modalPagamento">
        À vista
    </strong>

</div>


                </div>


                <button
                    id="btnFecharModalInferior"
                    class="modal-button"
                    type="button"
                >
                    Fechar
                </button>


            </div>

        </div>

    `;

}

function abrirModalDetalhes(item){

    if(!item){

        return;

    }

    document
        .getElementById("modalValor")
        .textContent =
        Number(item.valor).toLocaleString(
            "pt-BR",
            {
                style: "currency",
                currency: "BRL"
            }
        );

    document
        .getElementById("modalTipo")
        .textContent =
        item.tipo || "—";

    document
        .getElementById("modalData")
        .textContent =
        item.data || "—";

    document
        .getElementById("modalCategoria")
        .textContent =
        item.categoria || "—";

    document
        .getElementById("modalSubcategoria")
        .textContent =
        item.subcategoria || "—";

    document
        .getElementById("modalObservacao")
        .textContent =
        item.observacao || "—";

    document
        .getElementById("modalPagamento")
        .textContent =
        item.pagamento || "À vista";

    document
        .getElementById("modalDetalhes")
        .classList
        .remove("hidden");

}

function fecharModal(){

    const modal =
        document.getElementById("modalDetalhes");

    if(!modal){

        return;

    }

    modal
        .classList
        .add("hidden");

}

