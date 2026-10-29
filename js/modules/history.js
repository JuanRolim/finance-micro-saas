let historico = [];
let historicoFiltrado = [];
let historicoErro = "";
let historicoFiltros = criarFiltrosFinanceiros("this-month");
let historicoDebounce = null;
let movimentoModalHistorico = null;

function invalidarHistorico() {
    historico = [];
    historicoErro = "";
}

async function carregarHistorico() {
    try {
        historico = await obterHistorico();
        historicoErro = "";
    } catch (erro) {
        console.error("Erro ao carregar histórico:", erro);
        historicoErro = "Não foi possível carregar o histórico. Verifique a conexão e tente novamente.";
        historico = [];
    }
}

function renderHistory() {
    if (historicoErro) {
        return `
            <div class="app-container history-page">
                ${renderHistoryHeader()}
                <main class="app-content">
                    <div class="card history-empty" role="alert">
                        <p>${escaparHtml(historicoErro)}</p>
                        <button class="secondary-button" id="btnRecarregarHistorico" type="button">Tentar novamente</button>
                    </div>
                </main>
            </div>
        `;
    }
    historicoFiltrado = filtrarMovimentacoesFinanceiras(historico, historicoFiltros);
    return `
        <div class="app-container history-page">
            ${renderHistoryHeader()}
            <main class="app-content history-content">
                ${renderToolbarHistorico()}
                <section id="resumoHistorico" class="history-summary" aria-label="Resumo dos resultados"></section>
                <section id="listaHistorico" class="history-results" aria-live="polite"></section>
            </main>
            ${renderModalHistorico()}
        </div>
    `;
}

function renderHistoryHeader() {
    return `
        <header class="app-header history-header">
            <button id="btnVoltarDashboard" class="back-button" type="button" aria-label="Voltar ao dashboard">←</button>
            <div><h2>Histórico</h2><p>Pesquise e filtre suas movimentações</p></div>
        </header>
    `;
}

function obterOpcoesHistorico(campo) {
    const valores = new Set();
    historico.forEach((item) => {
        let valor = "";
        if (campo === "categoria") valor = obterCategoriaMovimentacao(item);
        else if (campo === "subcategoria") valor = item.subcategoriaNova || item.subcategoria || "";
        else valor = item[campo] || "";
        if (valor) valores.add(valor);
    });
    return Array.from(valores).sort((a, b) => a.localeCompare(b, "pt-BR"));
}

function renderToolbarHistorico() {
    const opcoesCategoria = obterOpcoesHistorico("categoria");
    const categoriaAtual = historicoFiltros.categoria;
    const subcategorias = Array.from(new Set(historico
        .filter((item) => !categoriaAtual ||
            normalizarPesquisaFinanceira(obterCategoriaMovimentacao(item)) ===
                normalizarPesquisaFinanceira(categoriaAtual))
        .map((item) => item.subcategoriaNova || item.subcategoria || "")
        .filter(Boolean)))
        .sort((a, b) => a.localeCompare(b, "pt-BR"));
    const intervalo = obterIntervaloFinanceiro(historicoFiltros);

    return `
        <section class="history-toolbar">
            <label class="history-search" for="buscaHistorico">
                <span aria-hidden="true">⌕</span>
                <input id="buscaHistorico" type="search" placeholder="Categoria, observação, valor..."
                    value="${escaparHtml(historicoFiltros.consulta)}" autocomplete="off">
            </label>
            <button class="history-filter" id="btnLimparHistorico" type="button">Limpar filtros</button>
        </section>
        <details class="card finance-filter-panel" id="painelFiltrosHistorico" open>
            <summary>Filtros</summary>
            <div class="finance-filter-grid">
                ${renderSelectFinanceiro("periodoHistorico", "Período", PERIODOS_FINANCEIROS, historicoFiltros.periodo)}
                ${renderSelectFinanceiro("fluxoHistorico", "Fluxo", [
                    { value: "", label: "Todos os fluxos" },
                    { value: "Entrada", label: "Entrada" },
                    { value: "Saída", label: "Saída" }
                ], historicoFiltros.fluxo)}
                ${renderSelectFinanceiro("naturezaHistorico", "Tipo", [
                    { value: "", label: "Todos os tipos" },
                    { value: "Receita", label: "Receita" },
                    { value: "Despesa", label: "Despesa de consumo" },
                    { value: "Investimento", label: "Investimento" },
                    { value: "Aporte para sonho", label: "Aporte para sonho" }
                ], historicoFiltros.natureza)}
                ${renderSelectFinanceiro("categoriaHistorico", "Categoria", [
                    { value: "", label: "Todas as categorias" },
                    ...opcoesCategoria.map((nome) => ({ value: nome, label: nome }))
                ], historicoFiltros.categoria)}
                ${renderSelectFinanceiro("subcategoriaHistorico", "Subcategoria", [
                    { value: "", label: "Todas as subcategorias" },
                    ...subcategorias.map((nome) => ({ value: nome, label: nome }))
                ], historicoFiltros.subcategoria)}
                ${renderSelectFinanceiro("essencialidadeHistorico", "Essencialidade", [
                    { value: "", label: "Todas" },
                    { value: "Essencial", label: "Essencial" },
                    { value: "Não essencial", label: "Não essencial" },
                    { value: "__nao_informado__", label: "Não informado" }
                ], historicoFiltros.essencialidade)}
                ${renderSelectFinanceiro("comportamentoHistorico", "Comportamento", [
                    { value: "", label: "Todos" },
                    { value: "Fixo", label: "Fixo" },
                    { value: "Variável", label: "Variável" },
                    { value: "Periódico", label: "Periódico" },
                    { value: "__nao_informado__", label: "Não informado" }
                ], historicoFiltros.comportamento)}
                <label for="valorMinHistorico">Valor mínimo
                    <input id="valorMinHistorico" type="number" min="0" step="0.01"
                        inputmode="decimal" value="${escaparHtml(historicoFiltros.valorMinimo)}">
                </label>
                <label for="valorMaxHistorico">Valor máximo
                    <input id="valorMaxHistorico" type="number" min="0" step="0.01"
                        inputmode="decimal" value="${escaparHtml(historicoFiltros.valorMaximo)}">
                </label>
                ${historicoFiltros.periodo === "custom" ? `
                    <label>De <input id="inicioHistorico" type="date" value="${formatarDataInputFinanceira(intervalo.inicio)}"></label>
                    <label>Até <input id="fimHistorico" type="date" value="${formatarDataInputFinanceira(intervalo.fim)}"></label>
                ` : ""}
                ${renderSelectFinanceiro("ordenacaoHistorico", "Ordenação", [
                    { value: "recentes", label: "Mais recentes" },
                    { value: "antigos", label: "Mais antigos" },
                    { value: "maior-valor", label: "Maior valor" },
                    { value: "menor-valor", label: "Menor valor" }
                ], historicoFiltros.ordenacao)}
            </div>
        </details>
    `;
}

function inicializarHistory() {
    document.getElementById("btnVoltarDashboard")
        ?.addEventListener("click", () => navegar("dashboard"));
    document.getElementById("btnRecarregarHistorico")
        ?.addEventListener("click", async () => {
            historicoErro = "";
            await carregarHistorico();
            app.innerHTML = renderHistory();
            inicializarHistory();
        });
    document.getElementById("btnLimparHistorico")
        ?.addEventListener("click", () => {
            historicoFiltros = criarFiltrosFinanceiros("this-month");
            app.innerHTML = renderHistory();
            inicializarHistory();
        });

    const busca = document.getElementById("buscaHistorico");
    busca?.addEventListener("input", (event) => {
        historicoFiltros.consulta = event.target.value;
        clearTimeout(historicoDebounce);
        historicoDebounce = setTimeout(atualizarResultadosHistorico, 100);
    });

    const mapaFiltros = {
        periodoHistorico: "periodo",
        fluxoHistorico: "fluxo",
        naturezaHistorico: "natureza",
        categoriaHistorico: "categoria",
        subcategoriaHistorico: "subcategoria",
        essencialidadeHistorico: "essencialidade",
        comportamentoHistorico: "comportamento",
        valorMinHistorico: "valorMinimo",
        valorMaxHistorico: "valorMaximo",
        ordenacaoHistorico: "ordenacao"
    };
    Object.keys(mapaFiltros).forEach((id) => {
        document.getElementById(id)?.addEventListener("change", (event) => {
            const chave = mapaFiltros[id];
            historicoFiltros[chave] = event.target.value;
            if (chave === "periodo" && historicoFiltros.periodo === "custom") {
                const mesAtual = obterIntervaloFinanceiro({ periodo: "this-month" });
                historicoFiltros.dataInicio = formatarDataInputFinanceira(mesAtual.inicio);
                historicoFiltros.dataFim = formatarDataInputFinanceira(new Date());
                app.innerHTML = renderHistory();
                inicializarHistory();
                document.getElementById("painelFiltrosHistorico").open = true;
                return;
            }
            if (chave === "categoria") historicoFiltros.subcategoria = "";
            atualizarResultadosHistorico();
            if (chave === "categoria") {
                const detalhes = document.getElementById("painelFiltrosHistorico");
                const aberto = detalhes.open;
                app.innerHTML = renderHistory();
                inicializarHistory();
                document.getElementById("painelFiltrosHistorico").open = aberto;
            }
        });
    });

    document.getElementById("inicioHistorico")?.addEventListener("change", (event) => {
        historicoFiltros.dataInicio = event.target.value;
        atualizarResultadosHistorico();
    });
    document.getElementById("fimHistorico")?.addEventListener("change", (event) => {
        historicoFiltros.dataFim = event.target.value;
        atualizarResultadosHistorico();
    });

    document.getElementById("listaHistorico")
        ?.addEventListener("click", (event) => {
            const card = event.target.closest("[data-historico-index]");
            if (card) abrirModalHistorico(historicoFiltrado[Number(card.dataset.historicoIndex)]);
            if (event.target.id === "btnLimparDoVazio") {
                historicoFiltros = criarFiltrosFinanceiros("this-month");
                app.innerHTML = renderHistory();
                inicializarHistory();
            }
        });
    document.getElementById("listaHistorico")
        ?.addEventListener("keydown", (event) => {
            if ((event.key === "Enter" || event.key === " ") &&
                event.target.matches("[data-historico-index]")) {
                event.preventDefault();
                abrirModalHistorico(historicoFiltrado[Number(event.target.dataset.historicoIndex)]);
            }
        });
    document.getElementById("btnFecharModalHistorico")
        ?.addEventListener("click", fecharModalHistorico);
    document.getElementById("modalHistorico")
        ?.addEventListener("click", (event) => {
            if (event.target.id === "modalHistorico") fecharModalHistorico();
        });
    document.getElementById("modalHistorico")
        ?.addEventListener("keydown", tratarTeclaModalHistorico);
    atualizarResultadosHistorico();
}

function atualizarResultadosHistorico() {
    historicoFiltrado = filtrarMovimentacoesFinanceiras(historico, historicoFiltros);
    const resumo = document.getElementById("resumoHistorico");
    const lista = document.getElementById("listaHistorico");
    if (resumo) resumo.innerHTML = renderResumoHistorico(historicoFiltrado);
    if (lista) lista.innerHTML = renderListaHistorico(historicoFiltrado);
}

function renderResumoHistorico(registros) {
    const resumo = resumirMovimentacoesFinanceiras(registros);
    const itens = [
        ["Movimentações", resumo.quantidade, ""],
        ["Entradas", resumo.entradas, "income"],
        ["Saídas de caixa", resumo.saidas, "expense"],
        ["Consumo", resumo.consumo, ""],
        ["Investimentos", resumo.investimentos, ""],
        ["Sonhos", resumo.sonhos, ""]
    ];
    return `
        <div class="history-summary__grid">
            ${itens.map(([titulo, valor, classe]) => `
                <article class="card history-summary-card">
                    <span>${titulo}</span>
                    <strong class="${classe ? `history-summary-card--${classe}` : ""}">
                        ${typeof valor === "number" && titulo !== "Movimentações"
                            ? formatarMoeda(valor)
                            : valor}
                    </strong>
                </article>
            `).join("")}
        </div>
    `;
}

function renderListaHistorico(registros) {
    if (!registros.length) {
        return `
            <div class="card history-empty">
                <strong>Nenhuma movimentação encontrada</strong>
                <p>Experimente ajustar a pesquisa ou os filtros.</p>
                <button class="secondary-button" id="btnLimparDoVazio" type="button">Limpar filtros</button>
            </div>
        `;
    }

    const grupos = new Map();
    registros.forEach((item, index) => {
        const data = interpretarDataFinanceira(item.data);
        const chave = data ? formatarDataInputFinanceira(data) : "sem-data";
        if (!grupos.has(chave)) {
            grupos.set(chave, { data, itens: [] });
        }
        grupos.get(chave).itens.push({ item, index });
    });

    return Array.from(grupos.values()).map((grupo) => `
        <section class="history-day-group">
            <h2>${grupo.data
                ? grupo.data.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })
                : "Data não informada"}</h2>
            ${grupo.itens.map(({ item, index }) => renderCardHistorico(item, index)).join("")}
        </section>
    `).join("");
}

function renderCardHistorico(item, index) {
    const fluxo = obterFluxoMovimentacao(item);
    const natureza = obterNaturezaMovimentacao(item) || "Tipo não informado";
    const entrada = normalizarPesquisaFinanceira(fluxo) === "entrada";
    const categoria = obterCategoriaMovimentacao(item) || "Categoria não informada";
    const subcategoria = item.subcategoriaNova || item.subcategoria || "";
    const dimensoes = [
        item.essencialidade || "Essencialidade não informada",
        item.comportamento || "Comportamento não informado"
    ];

    return `
        <article class="history-card history-card--${entrada ? "income" : "expense"}"
            data-historico-index="${index}" tabindex="0" role="button"
            aria-label="${escaparHtml(`${fluxo} ${natureza}, ${categoria}, ${formatarMoeda(item.valor)}`)}">
            <span class="history-icon" aria-hidden="true">${entrada ? "↗" : "↘"}</span>
            <div class="history-info">
                <strong>${escaparHtml(subcategoria || categoria)}</strong>
                <p class="history-meta">
                    <span>${escaparHtml(fluxo)} · ${escaparHtml(natureza)}</span>
                    <span>${escaparHtml(categoria)}</span>
                    ${subcategoria ? `<span>${escaparHtml(subcategoria)}</span>` : ""}
                    <span>${escaparHtml(item.data || "Data não informada")}</span>
                </p>
                <p class="history-meta">
                    <span>${escaparHtml(item.pagamento || "Pagamento não informado")}</span>
                    ${natureza === "Despesa" ? dimensoes.map((dimensao) => `<span>${escaparHtml(dimensao)}</span>`).join("") : ""}
                    ${item.parcelado ? `<span>Parcela ${Number(item.parcela) || 1}/${Number(item.quantidadeParcelas) || 1}</span>` : ""}
                    ${item.idMeta ? "<span>Vinculada a meta</span>" : ""}
                </p>
            </div>
            <strong class="history-value history-value--${entrada ? "income" : "expense"}">
                ${entrada ? "+" : "−"}${formatarMoeda(item.valor)}
            </strong>
        </article>
    `;
}

function renderModalHistorico() {
    return `
        <div id="modalHistorico" class="modal-overlay hidden">
            <section class="modal-detalhes" role="dialog" aria-modal="true"
                aria-labelledby="modalHistoricoTitulo">
                <button id="btnFecharModalHistorico" class="modal-close" type="button"
                    aria-label="Fechar detalhes">×</button>
                <div class="modal-header">
                    <span class="modal-label">Detalhes da movimentação</span>
                    <h2 id="modalHistoricoValor">—</h2>
                    <span id="modalHistoricoTitulo" class="modal-tipo">—</span>
                </div>
                <dl class="modal-detalhes-lista">
                    ${[
                        ["Data", "data"], ["Fluxo e natureza", "tipo"],
                        ["Categoria", "categoria"], ["Subcategoria", "subcategoria"],
                        ["Essencialidade", "essencialidade"], ["Comportamento", "comportamento"],
                        ["Pagamento", "pagamento"], ["Parcelamento", "parcelamento"],
                        ["Meta", "meta"], ["Observação", "observacao"]
                    ].map(([label, chave]) => `
                        <div class="modal-item"><dt>${label}</dt><dd id="modalHistorico-${chave}">—</dd></div>
                    `).join("")}
                </dl>
            </section>
        </div>
    `;
}

function abrirModalHistorico(item) {
    if (!item) return;
    movimentoModalHistorico = item;
    const set = (id, value) => {
        const elemento = document.getElementById(`modalHistorico-${id}`);
        if (elemento) elemento.textContent = value || "Não informado";
    };
    document.getElementById("modalHistoricoValor").textContent = formatarMoeda(item.valor);
    document.getElementById("modalHistoricoTitulo").textContent =
        `${obterFluxoMovimentacao(item)} · ${obterNaturezaMovimentacao(item) || "Tipo não informado"}`;
    set("data", item.data);
    set("tipo", `${obterFluxoMovimentacao(item)} · ${obterNaturezaMovimentacao(item) || "Tipo não informado"}`);
    set("categoria", obterCategoriaMovimentacao(item));
    set("subcategoria", item.subcategoriaNova || item.subcategoria);
    set("essencialidade", item.essencialidade);
    set("comportamento", item.comportamento);
    set("pagamento", item.pagamento);
    set("parcelamento", item.parcelado
        ? `${Number(item.parcela) || 1} de ${Number(item.quantidadeParcelas) || 1}`
        : "À vista");
    set("meta", item.idMeta ? `ID ${item.idMeta}` : "");
    set("observacao", item.observacao);
    document.getElementById("modalHistorico").classList.remove("hidden");
    document.getElementById("btnFecharModalHistorico").focus();
}

function fecharModalHistorico() {
    document.getElementById("modalHistorico")?.classList.add("hidden");
    movimentoModalHistorico = null;
}

function tratarTeclaModalHistorico(event) {
    if (event.key === "Escape" && movimentoModalHistorico) {
        event.stopPropagation();
        fecharModalHistorico();
    }
}

async function abrirHistoricoFiltrado(filtros) {
    historicoFiltros = criarFiltrosFinanceiros(
        filtros.periodo || "this-month",
        filtros
    );
    await navegar("history");
}
