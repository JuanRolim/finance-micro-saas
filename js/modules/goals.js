let metas = [];


/* ============================================
   INICIALIZAR METAS
============================================ */

async function inicializarGoals() {

    try {

        metas = await buscarMetas();

        console.log("Metas carregadas:", metas);

        renderizarMetas();

        inicializarBotaoNovaMeta();

        inicializarFormularioNovaMeta();

        inicializarBotoesAtualizarMeta();

        inicializarBotoesFecharMeta();

        inicializarBotoesDesejos();

        inicializarBotaoMetasFinalizadas();

        inicializarNavegacaoMetas();

        return metas;

    } catch (erro) {

        console.error("Erro ao inicializar metas:", erro);

        return [];

    }

}

function inicializarBotaoMetasFinalizadas() {

    const botao = document.getElementById("btnVerMetasFinalizadas");
    const modal = document.getElementById("modalMetasFinalizadas");
    const botaoFechar = document.getElementById("btnFecharMetasFinalizadas");

    if (!botao || !modal || !botaoFechar) {
        return;
    }

    botao.addEventListener("click", () => {
        renderizarMetasFinalizadas();
        modal.hidden = false;
    });

    botaoFechar.addEventListener("click", () => {
        modal.hidden = true;
    });

    modal.addEventListener("click", (evento) => {

    if (evento.target === modal) {
        modal.hidden = true;
    }

});

}

function renderizarMetasFinalizadas() {

    const container = document.getElementById("listaMetasFinalizadas");

    if (!container) {
        return;
    }

    const metasFinalizadas = metas
        .filter(meta =>
            meta.status === "CONCLUIDA" ||
            meta.status === "ENCERRADA"
        )
        .sort((a, b) => {
            const dataA = new Date(a.dataFinalizacao || 0);
            const dataB = new Date(b.dataFinalizacao || 0);
            return dataB - dataA;
        });

    if (!metasFinalizadas.length) {
        container.innerHTML = `
            <p class="metas-vazio">
                Nenhuma meta concluída ou encerrada.
            </p>
        `;
        return;
    }

    container.innerHTML = metasFinalizadas
        .map(meta => `
            <article class="meta-finalizada-card">

                <div class="meta-finalizada-header">
                    <h3>${meta.nome}</h3>

                    <span class="meta-finalizada-status ${
                        meta.status === "CONCLUIDA"
                            ? "concluida"
                            : "encerrada"
                    }">
                        ${
                            meta.status === "CONCLUIDA"
                                ? "CONCLUÍDA"
                                : "ENCERRADA"
                        }
                    </span>
                </div>

                <div class="meta-finalizada-values">

    <div>
        <small>Atual</small>
        <strong>
            R$ ${formatarValor(meta.valorAtual)}
        </strong>
    </div>

    <div>
        <small>Meta</small>
        <strong>
            R$ ${formatarValor(meta.valorMeta)}
        </strong>
    </div>

    <div>
        <small>Finalizada em</small>
        <strong>
            ${formatarData(meta.dataFinalizacao)}
        </strong>
    </div>

</div>

            </article>
        `)
        .join("");
}

/* ============================================
   RENDERIZAR METAS
============================================ */

function renderizarMetas() {

    const containerMetasAtivas =
        document.getElementById("metasAtivas");

    const containerListaDesejos =
        document.getElementById("listaDesejos");


    if (!containerMetasAtivas || !containerListaDesejos) {

        return;

    }


    const metasAtivas = obterMetasAtivas();

    const listaDesejos = obterListaDesejos();


    containerMetasAtivas.innerHTML =
        metasAtivas.length
            ? metasAtivas.map(renderMeta).join("")
            : `<p class="metas-vazio">Nenhuma meta ativa.</p>`;


    containerListaDesejos.innerHTML =
        listaDesejos.length
            ? listaDesejos.map(renderDesejo).join("")
            : `<p class="metas-vazio">Nenhum desejo cadastrado.</p>`;

}


/* ============================================
   RENDERIZAR META ATIVA
============================================ */

function renderMeta(meta) {

    const percentual = Math.min(
        Math.max(Number(meta.percentual) || 0, 0),
        100
    );

    return `
        <article class="meta-card">

            <div class="meta-card-header">
                <h3>${meta.nome}</h3>
                <span>${percentual.toFixed(0)}%</span>
            </div>

            <div class="meta-progress">
                <div
                    class="meta-progress-bar"
                    style="width: ${percentual}%;"
                ></div>
            </div>

            <div class="meta-card-values">

                <div>
                    <small>Atual</small>
                    <strong>
                        R$ ${formatarValor(meta.valorAtual)}
                    </strong>
                </div>

                <div>
                    <small>Meta</small>
                    <strong>
                        R$ ${formatarValor(meta.valorMeta)}
                    </strong>
                </div>

                <div>
                    <small>Falta</small>
                    <strong>
                        R$ ${formatarValor(meta.valorFaltante)}
                    </strong>
                </div>

            </div>

            <div class="meta-card-actions">

                <button
                    type="button"
                    class="btn-atualizar-meta"
                    data-id-meta="${meta.idMeta}">
                    ATUALIZAR
                </button>

                <button
                    type="button"
                    class="btn-fechar-meta"
                    data-id-meta="${meta.idMeta}"
                    aria-label="Fechar meta">
                    ×
                </button>

            </div>

        </article>
    `;
}


/* ============================================
   RENDERIZAR DESEJO
============================================ */

function renderDesejo(meta) {

    return `
        <article class="meta-card meta-card-desejo">

            <div class="meta-card-header">

                <h3>${meta.nome}</h3>

                <span>
                    ${meta.prioridade || "MÉDIA"}
                </span>

            </div>


            <div class="meta-card-values">

                <div>

                    <small>Meta</small>

                    <strong>
                        R$ ${formatarValor(meta.valorMeta)}
                    </strong>

                </div>

            </div>


            <div class="meta-desejo-actions">

                <button
                    type="button"
                    class="btn-transformar-desejo"
                    data-id-meta="${meta.idMeta}"
                >
                    TRANSFORMAR EM META
                </button>

                <button
                    type="button"
                    class="btn-concluir-desejo"
                    data-id-meta="${meta.idMeta}"
                    aria-label="Concluir desejo"
                    title="Concluir desejo"
                >
                    ✓
                </button>

            </div>

        </article>
    `;
}

function inicializarBotoesDesejos() {

    const botoesTransformar = document.querySelectorAll(
        ".btn-transformar-desejo"
    );

    botoesTransformar.forEach(botao => {

        botao.addEventListener("click", async () => {

            const idMeta = botao.dataset.idMeta;

            const meta = metas.find(
                item => String(item.idMeta) === String(idMeta)
            );

            if (!meta) {
                alert("Desejo não encontrado.");
                return;
            }

            const confirmar = confirm(
                `Deseja transformar "${meta.nome}" em uma meta ativa?`
            );

            if (!confirmar) {
                return;
            }

            try {

                const resultado =
                    await transformarDesejoEmMeta(idMeta);

                if (!resultado || !resultado.success) {
                    throw new Error(
                        resultado?.message ||
                        "Não foi possível transformar o desejo."
                    );
                }

                metas = await buscarMetas();

                renderizarMetas();

                inicializarBotoesAtualizarMeta();
                inicializarBotoesFecharMeta();
                inicializarBotoesDesejos();

                alert("Desejo transformado em meta ativa!");

            } catch (erro) {

                console.error(
                    "Erro ao transformar desejo:",
                    erro
                );

                alert(
                    "Não foi possível transformar o desejo em meta."
                );
            }

        });

    });


    const botoesConcluir = document.querySelectorAll(
        ".btn-concluir-desejo"
    );

    botoesConcluir.forEach(botao => {

        botao.addEventListener("click", async () => {

            const idMeta = botao.dataset.idMeta;

            const meta = metas.find(
                item => String(item.idMeta) === String(idMeta)
            );

            if (!meta) {
                alert("Desejo não encontrado.");
                return;
            }

            const confirmar = confirm(
                `Deseja marcar "${meta.nome}" como concluído?`
            );

            if (!confirmar) {
                return;
            }

            try {

                const resultado =
                    await concluirDesejo(idMeta);

                if (!resultado || !resultado.success) {
                    throw new Error(
                        resultado?.message ||
                        "Não foi possível concluir o desejo."
                    );
                }

                metas = await buscarMetas();

                renderizarMetas();

                inicializarBotoesAtualizarMeta();
                inicializarBotoesFecharMeta();
                inicializarBotoesDesejos();

                alert("Desejo concluído com sucesso!");

            } catch (erro) {

                console.error(
                    "Erro ao concluir desejo:",
                    erro
                );

                alert(
                    "Não foi possível concluir o desejo."
                );
            }

        });

    });

}

/* ============================================
   FORMATAR VALOR
============================================ */

function formatarValor(valor) {

    return Number(valor || 0).toLocaleString("pt-BR", {

        minimumFractionDigits: 2,

        maximumFractionDigits: 2

    });

}

function formatarData(data) {

    if (!data) {
        return "-";
    }

    const dataObj = new Date(data);

    if (isNaN(dataObj.getTime())) {
        return "-";
    }

    return dataObj.toLocaleDateString("pt-BR");
}


/* ============================================
   ACESSO ÀS METAS
============================================ */

function obterMetas() {

    return metas;

}


function obterMetasAtivas() {

    return metas.filter(meta =>
        meta.tipo === "ATIVA" &&
        meta.status === "ABERTA"
    );

}

function obterListaDesejos() {

    return metas.filter(meta =>
        meta.tipo === "DESEJO" &&
        meta.status === "ABERTA"
    );
    

}

function ordenarPorPrioridade(a, b) {
    const ordem = {
        "ALTA": 1,
        "MÉDIA": 2,
        "BAIXA": 3
    };

    return (ordem[a.prioridade] || 99) - (ordem[b.prioridade] || 99);
}

function inicializarBotaoNovaMeta() {

    const botao = document.getElementById("btnNovaMeta");

    const modal = document.getElementById("modalNovaMeta");

    const fechar = document.getElementById("btnFecharNovaMeta");

    const cancelar = document.getElementById("btnCancelarNovaMeta");


    if (!botao || !modal) {
        return;
    }


    botao.addEventListener("click", () => {

        modal.hidden = false;

        document.getElementById("nomeMeta")?.focus();

    });


    fechar?.addEventListener("click", () => {

        modal.hidden = true;

    });


    cancelar?.addEventListener("click", () => {

        modal.hidden = true;

    });

}

function inicializarFormularioNovaMeta() {

    const formulario = document.getElementById("formNovaMeta");

    if (!formulario) {
        return;
    }

    formulario.addEventListener("submit", async (event) => {

        event.preventDefault();

        const nome = document.getElementById("nomeMeta").value.trim();

        const valorTexto = document.getElementById("valorMeta").value.trim();

        const tipo = document.getElementById("tipoMeta").value;

        const prioridade = document.getElementById("prioridadeMeta").value;


        const valor = Number(
            valorTexto
                .replace(/\./g, "")
                .replace(",", ".")
                .replace(/[^\d.-]/g, "")
        );

        if (isNaN(valor) || valor <= 0) {
    alert("Informe um valor de meta válido.");
    return;
}


        if (!nome) {
            alert("Informe o nome da meta.");
            return;
        }


        if (!valor || valor <= 0) {
            alert("Informe um valor válido para a meta.");
            return;
        }


        const meta = {

            nome: nome,

            valorMeta: valor,

            tipo: tipo,

            status: tipo,

            prioridade: prioridade

        };


        console.log("Meta que será enviada:", meta);


        try {

            const resposta = await criarMeta(meta);

            metas = await buscarMetas();
renderizarMetas();

            console.log("Resposta da criação da meta:", resposta);

            if (!resposta || !resposta.success) {

                throw new Error(
                    resposta?.message || "Não foi possível criar a meta."
                );

            }


            alert("Meta criada com sucesso.");

            document.getElementById("modalNovaMeta").hidden = true;

            formulario.reset();

            metas = await buscarMetas();

            renderizarMetas();


        } catch (erro) {

            console.error("Erro ao criar meta:", erro);

            alert("Não foi possível criar a meta.");

        }

    });

}

function inicializarBotoesAtualizarMeta() {
    const botoes = document.querySelectorAll(".btn-atualizar-meta");

    botoes.forEach(botao => {
        botao.addEventListener("click", () => {
            const idMeta = botao.dataset.idMeta;

            console.log("Atualizar meta:", idMeta);

            registroAtual.idMeta = idMeta;
            registroAtual.tipo = "Despesa";
            registroAtual.categoria = "Sonhos";

            etapaAtual = ETAPAS.VALOR;

            navegar("transaction");
        });
    });
}

function inicializarBotoesFecharMeta() {

    const botoes = document.querySelectorAll(".btn-fechar-meta");

    botoes.forEach(botao => {

        botao.addEventListener("click", async () => {

            const idMeta = botao.dataset.idMeta;

            const meta = metas.find(
                item => String(item.idMeta) === String(idMeta)
            );

            if (!meta) {
                alert("Meta não encontrada.");
                return;
            }

            const confirmar = confirm(
                `Deseja encerrar a meta "${meta.nome}"?`
            );

            if (!confirmar) {
                return;
            }

            try {

                const resultado = await encerrarMeta(idMeta);

if (!resultado || !resultado.success) {
    throw new Error(
        resultado?.message ||
        "Não foi possível encerrar a meta."
    );
}

if (resultado.status === "CONCLUIDA") {
    alert("Meta concluída com sucesso!");
} else {
    alert("Meta encerrada com sucesso.");
}

// Atualiza os dados da tela
metas = await buscarMetas();
renderizarMetas();

// Reativa os botões das metas renderizadas
inicializarBotoesAtualizarMeta();
inicializarBotoesFecharMeta();
inicializarBotoesDesejos();

            } catch (erro) {

                console.error(
                    "Erro ao encerrar meta:",
                    erro
                );

                alert(
                    "Não foi possível encerrar a meta."
                );
            }
        });

    });
}

function inicializarNavegacaoMetas() {

    const btnDashboard = document.getElementById("btnDashboard");
    const btnHistorico = document.getElementById("btnHistorico");
    const btnNovaMovimentacao = document.getElementById("btnNovaMovimentacao");
    const btnMetas = document.getElementById("btnMetas");

    if (btnDashboard) {
        btnDashboard.addEventListener("click", () => {
            navegar("dashboard");
        });
    }

    if (btnHistorico) {
        btnHistorico.addEventListener("click", () => {
            navegar("history");
        });
    }

    if (btnNovaMovimentacao) {
        btnNovaMovimentacao.addEventListener("click", () => {
            navegar("transaction");
        });
    }

    if (btnMetas) {
        btnMetas.addEventListener("click", () => {
            navegar("metas");
        });
    }
}