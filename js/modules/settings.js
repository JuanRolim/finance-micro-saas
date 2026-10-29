let configuracaoGerenciamento = null;
let buscaGerenciamento = "";
let modalClassificacao = null;
let mensagemGerenciamento = "";

const TIPOS_CLASSIFICACAO = [
    { fluxo: "Entrada", natureza: "Receita", label: "Entrada · Receita" },
    { fluxo: "Saída", natureza: "Despesa", label: "Saída · Despesa" },
    { fluxo: "Saída", natureza: "Investimento", label: "Saída · Investimento" },
    { fluxo: "Saída", natureza: "Aporte para sonho", label: "Saída · Aporte para sonho" }
];

function renderSettings() {
    if (!configuracaoGerenciamento) {
        return `
            <div class="app-container settings-page">
                <header class="settings-header">
                    <button class="back-button" id="btnVoltarMais" type="button" aria-label="Voltar">←</button>
                    <div><p class="dashboard-eyebrow">Mais</p><h1>Ferramentas</h1></div>
                </header>
                <main class="app-content"><p role="status">Carregando configurações...</p></main>
            </div>
        `;
    }

    return `
        <div class="app-container settings-page">
            <header class="settings-header">
                <button class="back-button" id="btnVoltarMais" type="button" aria-label="Voltar">←</button>
                <div><p class="dashboard-eyebrow">Mais</p><h1>Ferramentas</h1></div>
            </header>
            <main class="app-content settings-content">
                <button class="card settings-link-card" type="button" id="btnAbrirCategorias">
                    <span aria-hidden="true">▦</span>
                    <span><strong>Categorias e subcategorias</strong><small>Gerencie opções de classificação</small></span>
                    <span aria-hidden="true">›</span>
                </button>
                <button class="card settings-link-card" type="button" id="btnAbrirAnalise">
                    <span aria-hidden="true">▥</span>
                    <span><strong>Análise financeira</strong><small>Explore tendências e composição dos gastos</small></span>
                    <span aria-hidden="true">›</span>
                </button>
            </main>
        </div>
    `;
}

async function inicializarSettings() {
    document.getElementById("btnVoltarMais")
        ?.addEventListener("click", () => navegar("dashboard"));
    document.getElementById("btnAbrirCategorias")
        ?.addEventListener("click", () => navegar("categories"));
    document.getElementById("btnAbrirAnalise")
        ?.addEventListener("click", () => navegar("analysis"));

    if (!configuracaoGerenciamento) {
        try {
            configuracaoGerenciamento = await obterConfiguracoesClassificacao();
            app.innerHTML = renderSettings();
            inicializarSettings();
        } catch (erro) {
            console.error("Erro ao carregar o menu Mais:", erro);
            const conteudo = document.querySelector(".settings-content") ||
                document.querySelector(".app-content");
            if (conteudo) {
                conteudo.innerHTML = `
                    <div class="card settings-error" role="alert">
                        <p>Não foi possível carregar as ferramentas.</p>
                        <button class="secondary-button" id="btnTentarMais" type="button">Tentar novamente</button>
                    </div>
                `;
                document.getElementById("btnTentarMais")
                    ?.addEventListener("click", () => {
                        configuracaoGerenciamento = null;
                        app.innerHTML = renderSettings();
                        inicializarSettings();
                    });
            }
        }
    }
}

function agruparClassificacoes(configuracao) {
    const grupos = new Map();
    (configuracao?.classificacoes || []).forEach((item) => {
        const chave = [item.fluxo, item.natureza, item.categoria].join("|");
        if (!grupos.has(chave)) {
            grupos.set(chave, {
                fluxo: item.fluxo,
                natureza: item.natureza,
                categoria: item.categoria,
                subcategorias: new Set()
            });
        }
        if (item.subcategoria) {
            grupos.get(chave).subcategorias.add(item.subcategoria);
        }
    });
    return Array.from(grupos.values()).map((grupo) => ({
        ...grupo,
        subcategorias: Array.from(grupo.subcategorias).sort((a, b) => a.localeCompare(b, "pt-BR"))
    }));
}

function renderCategoriasGerenciadas() {
    const grupos = agruparClassificacoes(configuracaoGerenciamento);
    const consulta = normalizarPesquisaFinanceira(buscaGerenciamento);
    const filtrados = grupos.map((grupo) => ({
        ...grupo,
        subcategorias: grupo.subcategorias.filter((nome) =>
            !consulta || normalizarPesquisaFinanceira(nome).includes(consulta)
        )
    })).filter((grupo) =>
        (!consulta ||
            normalizarPesquisaFinanceira(`${grupo.categoria} ${grupo.fluxo} ${grupo.natureza}`).includes(consulta) ||
            grupo.subcategorias.length > 0)
    );

    if (!filtrados.length) {
        return `<div class="card settings-empty"><p>Nenhuma classificação corresponde à busca.</p></div>`;
    }

    return filtrados.map((grupo) => `
        <article class="card managed-category">
            <header class="managed-category__header">
                <div>
                    <p class="settings-type">${escaparHtml(grupo.fluxo)} · ${escaparHtml(grupo.natureza)}</p>
                    <h2>${escaparHtml(grupo.categoria)}</h2>
                </div>
                <button class="secondary-button managed-category__edit"
                    type="button" data-edit-category
                    data-fluxo="${escaparHtml(grupo.fluxo)}"
                    data-natureza="${escaparHtml(grupo.natureza)}"
                    data-categoria="${escaparHtml(grupo.categoria)}">
                    Renomear
                </button>
            </header>
            <div class="managed-subcategories">
                ${grupo.subcategorias.length
                    ? grupo.subcategorias.map((nome) => `
                        <div class="managed-subcategory">
                            <span>${escaparHtml(nome)}</span>
                            <button class="text-button" type="button"
                                data-edit-subcategory
                                data-fluxo="${escaparHtml(grupo.fluxo)}"
                                data-natureza="${escaparHtml(grupo.natureza)}"
                                data-categoria="${escaparHtml(grupo.categoria)}"
                                data-subcategoria="${escaparHtml(nome)}">
                                Editar
                            </button>
                        </div>
                    `).join("")
                    : `<p class="settings-muted">Sem subcategorias cadastradas.</p>`}
            </div>
            <button class="secondary-button managed-category__add" type="button"
                data-add-subcategory
                data-fluxo="${escaparHtml(grupo.fluxo)}"
                data-natureza="${escaparHtml(grupo.natureza)}"
                data-categoria="${escaparHtml(grupo.categoria)}">
                Adicionar subcategoria
            </button>
        </article>
    `).join("");
}

function renderTelaCategorias() {
    return `
        <div class="app-container settings-page">
            <header class="settings-header">
                <button class="back-button" id="btnVoltarCategorias" type="button" aria-label="Voltar">←</button>
                <div><p class="dashboard-eyebrow">Gerenciamento</p><h1>Categorias</h1></div>
            </header>
            <main class="app-content settings-content">
                <p class="settings-intro">Os nomes alterados também são atualizados nos registros históricos correspondentes. Categorias não são excluídas para preservar o histórico.</p>
                ${mensagemGerenciamento ? `<p class="settings-feedback" role="status">${escaparHtml(mensagemGerenciamento)}</p>` : ""}
                <div class="category-management-toolbar">
                    <label class="sr-only" for="buscaClassificacoes">Pesquisar categorias e subcategorias</label>
                    <input id="buscaClassificacoes" type="search" placeholder="Pesquisar categoria ou subcategoria"
                        value="${escaparHtml(buscaGerenciamento)}">
                    <button class="primary-button" id="btnNovaCategoria" type="button">Nova categoria</button>
                </div>
                <section id="listaCategorias" class="managed-category-list" aria-label="Categorias existentes">
                    ${renderCategoriasGerenciadas()}
                </section>
            </main>
            ${renderModalClassificacao()}
        </div>
    `;
}

function renderModalClassificacao() {
    if (!modalClassificacao) return "";
    const editarCategoria = modalClassificacao.operacao === "renomear-categoria";
    const adicionarCategoria = modalClassificacao.operacao === "criar-categoria";
    const opcoesTipo = TIPOS_CLASSIFICACAO.map((tipo) => `
        <option value="${escaparHtml(tipo.fluxo)}|${escaparHtml(tipo.natureza)}"
            ${tipo.fluxo === modalClassificacao.fluxo &&
                tipo.natureza === modalClassificacao.natureza ? "selected" : ""}>
            ${escaparHtml(tipo.label)}
        </option>
    `).join("");

    return `
        <div class="modal-overlay" id="modalClassificacao" role="presentation">
            <section class="card settings-modal" role="dialog" aria-modal="true"
                aria-labelledby="tituloModalClassificacao">
                <h2 id="tituloModalClassificacao">${escaparHtml(modalClassificacao.titulo)}</h2>
                <form id="formClassificacao">
                    ${adicionarCategoria || editarCategoria ? `
                        ${adicionarCategoria ? `
                            <div class="form-group">
                                <label for="tipoClassificacao">Disponível para</label>
                                <select id="tipoClassificacao" required>${opcoesTipo}</select>
                            </div>
                        ` : `<p class="settings-type">${escaparHtml(modalClassificacao.fluxo)} · ${escaparHtml(modalClassificacao.natureza)}</p>`}
                        <div class="form-group">
                            <label for="nomeClassificacao">${adicionarCategoria ? "Nome da categoria" : "Novo nome da categoria"}</label>
                            <input id="nomeClassificacao" required maxlength="80"
                                value="${escaparHtml(editarCategoria ? modalClassificacao.categoria : "")}">
                        </div>
                    ` : `
                        <p class="settings-type">${escaparHtml(modalClassificacao.fluxo)} · ${escaparHtml(modalClassificacao.natureza)} · ${escaparHtml(modalClassificacao.categoria)}</p>
                        <div class="form-group">
                            <label for="nomeClassificacao">${modalClassificacao.operacao === "adicionar-subcategoria" ? "Nome da subcategoria" : "Novo nome da subcategoria"}</label>
                            <input id="nomeClassificacao" required maxlength="80"
                                value="${escaparHtml(modalClassificacao.subcategoria || "")}">
                        </div>
                    `}
                    <p class="settings-form-error" id="erroFormularioClassificacao" role="alert"></p>
                    <div class="settings-modal__actions">
                        <button class="secondary-button" id="btnCancelarClassificacao" type="button">Cancelar</button>
                        <button class="primary-button" id="btnSalvarClassificacao" type="submit">Salvar</button>
                    </div>
                </form>
            </section>
        </div>
    `;
}

async function inicializarTelaCategorias() {
    let atualizarTela = false;
    if (!configuracaoGerenciamento) {
        try {
            configuracaoGerenciamento = await obterConfiguracoesClassificacao();
            atualizarTela = true;
        } catch (erro) {
            console.error("Erro ao carregar classificações:", erro);
            app.innerHTML = `
                <div class="app-container settings-page">
                    <main class="app-content"><div class="card settings-error" role="alert">
                        <p>Não foi possível carregar as categorias.</p>
                        <button class="secondary-button" id="btnTentarCategorias" type="button">Tentar novamente</button>
                    </div></main>
                </div>`;
            document.getElementById("btnTentarCategorias")
                ?.addEventListener("click", () => {
                    configuracaoGerenciamento = null;
                    app.innerHTML = renderTelaCategorias();
                    inicializarTelaCategorias();
                });
            return;
        }
    }

    if (atualizarTela || !document.getElementById("listaCategorias")) {
        app.innerHTML = renderTelaCategorias();
    }
    document.getElementById("btnVoltarCategorias")
        ?.addEventListener("click", () => navegar("settings"));
    document.getElementById("btnNovaCategoria")
        ?.addEventListener("click", () => abrirModalClassificacao({
            operacao: "criar-categoria",
            titulo: "Nova categoria",
            ...TIPOS_CLASSIFICACAO[0]
        }));
    document.getElementById("buscaClassificacoes")
        ?.addEventListener("input", (event) => {
            buscaGerenciamento = event.target.value;
            document.getElementById("listaCategorias").innerHTML =
                renderCategoriasGerenciadas();
            ligarAcoesCategoria();
        });
    ligarAcoesCategoria();
}

function ligarAcoesCategoria() {
    document.querySelectorAll("[data-edit-category]").forEach((botao) =>
        botao.addEventListener("click", () => abrirModalClassificacao({
            operacao: "renomear-categoria",
            titulo: "Renomear categoria",
            fluxo: botao.dataset.fluxo,
            natureza: botao.dataset.natureza,
            categoria: botao.dataset.categoria
        }))
    );
    document.querySelectorAll("[data-add-subcategory]").forEach((botao) =>
        botao.addEventListener("click", () => abrirModalClassificacao({
            operacao: "adicionar-subcategoria",
            titulo: "Adicionar subcategoria",
            fluxo: botao.dataset.fluxo,
            natureza: botao.dataset.natureza,
            categoria: botao.dataset.categoria
        }))
    );
    document.querySelectorAll("[data-edit-subcategory]").forEach((botao) =>
        botao.addEventListener("click", () => abrirModalClassificacao({
            operacao: "renomear-subcategoria",
            titulo: "Renomear subcategoria",
            fluxo: botao.dataset.fluxo,
            natureza: botao.dataset.natureza,
            categoria: botao.dataset.categoria,
            subcategoria: botao.dataset.subcategoria
        }))
    );
}

function abrirModalClassificacao(dados) {
    modalClassificacao = dados;
    app.innerHTML = renderTelaCategorias();
    inicializarTelaCategorias();
    document.getElementById("btnCancelarClassificacao")
        ?.addEventListener("click", fecharModalClassificacao);
    document.getElementById("modalClassificacao")
        ?.addEventListener("click", (event) => {
            if (event.target.id === "modalClassificacao") fecharModalClassificacao();
        });
    document.getElementById("formClassificacao")
        ?.addEventListener("submit", enviarFormularioClassificacao);
}

function fecharModalClassificacao() {
    modalClassificacao = null;
    app.innerHTML = renderTelaCategorias();
    inicializarTelaCategorias();
}

async function enviarFormularioClassificacao(event) {
    event.preventDefault();
    const nome = document.getElementById("nomeClassificacao").value.trim();
    const erro = document.getElementById("erroFormularioClassificacao");
    const botaoSalvar = document.getElementById("btnSalvarClassificacao");
    if (!nome) {
        erro.textContent = "Informe um nome.";
        return;
    }

    const pedido = { ...modalClassificacao };
    if (pedido.operacao === "criar-categoria") {
        const [fluxo, natureza] = document.getElementById("tipoClassificacao").value.split("|");
        pedido.fluxo = fluxo;
        pedido.natureza = natureza;
        pedido.categoria = nome;
    } else if (pedido.operacao === "renomear-categoria") {
        pedido.novaCategoria = nome;
    } else if (pedido.operacao === "adicionar-subcategoria") {
        pedido.subcategoria = nome;
    } else {
        pedido.novaSubcategoria = nome;
    }
    delete pedido.titulo;

    botaoSalvar.disabled = true;
    botaoSalvar.textContent = "Salvando...";
    try {
        const resultado = await salvarClassificacao(pedido);
        invalidarConfiguracaoTransacao();
        invalidarHistorico();
        invalidarAnalise();
        configuracaoGerenciamento = {
            ...configuracaoGerenciamento,
            classificacoes: resultado.classificacoes
        };
        modalClassificacao = null;
        mensagemGerenciamento = "Alteração salva. O histórico relacionado também foi atualizado.";
        app.innerHTML = renderTelaCategorias();
        inicializarTelaCategorias();
    } catch (erroSalvar) {
        console.error("Erro ao persistir classificação:", erroSalvar);
        erro.textContent = erroSalvar.message || "Não foi possível salvar a alteração.";
        botaoSalvar.disabled = false;
        botaoSalvar.textContent = "Tentar novamente";
    }
}